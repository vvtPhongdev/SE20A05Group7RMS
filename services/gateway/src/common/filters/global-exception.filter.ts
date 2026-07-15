import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ErrorResponseDto, ERROR_CODES, errorCodeForStatus } from '@wr/contracts';
import { config } from '../../config';

interface ResolvedError {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown[];
}

/**
 * T-103: Global exception filter.
 *
 * Normalizes every unhandled exception — Nest HttpExceptions (including
 * ValidationPipe failures), TCP microservice errors (RpcException payloads
 * arrive here as plain `{ status, message, ... }` objects), and unknown
 * errors — into the standardized ErrorResponseDto shape. Stack traces are
 * only ever written to the server log (with a correlation ID for T-106),
 * never returned to the client in production.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = config.NODE_ENV === 'production';

    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
    const resolved = this.resolve(exception, isProduction);

    console.error(
      `[${correlationId}] ${request.method} ${request.url} -> ${resolved.statusCode} ${resolved.error}: ${resolved.message}`,
    );
    if (!isProduction && exception instanceof Error && exception.stack) {
      console.error(exception.stack);
    }

    const body: ErrorResponseDto = {
      statusCode: resolved.statusCode,
      error: resolved.error,
      message: resolved.message,
      ...(resolved.details ? { details: resolved.details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(resolved.statusCode).json(body);
  }

  private resolve(exception: unknown, isProduction: boolean): ResolvedError {
    // 1. Nest HttpException — includes ValidationPipe failures, NotFoundException, etc.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const { message: rawMessage } = res as Record<string, unknown>;

        if (Array.isArray(rawMessage)) {
          // class-validator returns one message per invalid field.
          return {
            statusCode: status,
            error: errorCodeForStatus(status),
            message: 'Validation failed',
            details: rawMessage,
          };
        }

        return {
          statusCode: status,
          error: errorCodeForStatus(status),
          message: typeof rawMessage === 'string' ? rawMessage : exception.message,
        };
      }

      return { statusCode: status, error: errorCodeForStatus(status), message: exception.message };
    }

    // 2. TCP microservice errors — RpcException payloads from interview/recruiting/etc.
    //    services arrive as { status, message, ...extra } or { error: { status, message, ...extra } }.
    // Express/body-parser errors carry their HTTP status directly instead of extending HttpException.
    if (exception instanceof Error && 'status' in exception) {
      const status = Number((exception as { status?: unknown }).status);
      if (Number.isInteger(status) && status >= 400 && status < 600) {
        const message =
          exception instanceof Error && exception.message
            ? exception.message
            : 'Request could not be processed';
        return { statusCode: status, error: errorCodeForStatus(status), message };
      }
    }

    if (exception && typeof exception === 'object' && !(exception instanceof Error)) {
      const raw = exception as Record<string, unknown>;
      const nestedError =
        raw.error && typeof raw.error === 'object' && !Array.isArray(raw.error)
          ? (raw.error as Record<string, unknown>)
          : null;
      const payload = nestedError ?? raw;
      const status =
        Number(payload.status ?? payload.statusCode ?? payload.status_code) ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        typeof payload.message === 'string'
          ? payload.message
          : typeof raw.message === 'string'
            ? raw.message
            : 'Internal server error';

      const extraEntries = Object.entries(payload).filter(
        ([key]) => !['status', 'statusCode', 'status_code', 'message'].includes(key),
      );

      let details: unknown[] | undefined;
      const firstEntry = extraEntries[0];
      if (extraEntries.length === 1 && firstEntry && Array.isArray(firstEntry[1])) {
        // e.g. { conflicts: [...] } -> details: [...]
        details = firstEntry[1] as unknown[];
      } else if (extraEntries.length > 0) {
        details = [Object.fromEntries(extraEntries)];
      }

      return { statusCode: status, error: errorCodeForStatus(status), message, details };
    }

    // 3. Unknown errors — never leak internals in production.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal server error',
      details:
        !isProduction && exception instanceof Error && exception.stack
          ? [exception.stack]
          : undefined,
    };
  }
}
