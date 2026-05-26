import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as any).message
          : exception.message;
    } else if (exception && typeof exception === 'object') {
      // Catch errors returned from microservices (which are plain objects)
      status = exception.status || exception.statusCode || exception.status_code || status;
      message = exception.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Keep error details short and safe
    const errorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message, // take first validation error if array
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
