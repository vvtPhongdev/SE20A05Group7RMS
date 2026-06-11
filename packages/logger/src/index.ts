import { Injectable, NestMiddleware, NestInterceptor, ExecutionContext, CallHandler, LoggerService } from '@nestjs/common';
import { ClientTCP } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import pretty from 'pino-pretty';
import { correlationIdStorage } from './storage';

export * from './storage';

// ─── Pino Logger Implementation ───
export class PinoLogger implements LoggerService {
  private readonly logger: pino.Logger;

  constructor(serviceName: string, logLevel?: string) {
    const isDev = process.env.NODE_ENV === 'development';
    
    const pinoOptions: pino.LoggerOptions = {
      level: logLevel || process.env.LOG_LEVEL || 'info',
      base: {
        service: serviceName,
      },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      mixin() {
        const store = correlationIdStorage.getStore();
        return {
          correlationId: store?.correlationId,
          jobId: store?.jobId,
        };
      },
    };

    if (isDev) {
      const stream = pretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,service,correlationId,jobId',
        messageFormat: (log: any, messageKey: string) => {
          const service = log.service ? `[${log.service}]` : '';
          const corr = log.correlationId ? ` (corr:${log.correlationId})` : '';
          const job = log.jobId ? ` (job:${log.jobId})` : '';
          return `${service}${corr}${job} ${log[messageKey]}`;
        }
      });
      this.logger = pino(pinoOptions, stream);
    } else {
      this.logger = pino(pinoOptions);
    }
  }

  log(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.logger.info(message, ...optionalParams);
    } else {
      this.logger.info(optionalParams.length ? { context: optionalParams } : {}, message);
    }
  }

  error(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.logger.error(message, ...optionalParams);
    } else {
      this.logger.error(optionalParams.length ? { context: optionalParams } : {}, message);
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.logger.warn(message, ...optionalParams);
    } else {
      this.logger.warn(optionalParams.length ? { context: optionalParams } : {}, message);
    }
  }

  debug(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.logger.debug(message, ...optionalParams);
    } else {
      this.logger.debug(optionalParams.length ? { context: optionalParams } : {}, message);
    }
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.logger.trace(message, ...optionalParams);
    } else {
      this.logger.trace(optionalParams.length ? { context: optionalParams } : {}, message);
    }
  }
}

// ─── Gateway HTTP Middleware ───
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const headerName = 'x-correlation-id';
    let correlationId = req.headers[headerName] as string;
    if (!correlationId) {
      correlationId = uuidv4();
    }
    res.setHeader(headerName, correlationId);
    correlationIdStorage.run({ correlationId }, () => {
      next();
    });
  }
}

// ─── Custom TCP Client Proxy ───
export class CorrelationClientTCP extends ClientTCP {
  override send<TResult = any, TInput = any>(pattern: any, data: TInput) {
    const store = correlationIdStorage.getStore();
    if (store?.correlationId) {
      if (typeof data === 'object' && data !== null) {
        (data as any).correlationId = (data as any).correlationId || store.correlationId;
      } else {
        data = {
          _originalData: data,
          correlationId: store.correlationId,
        } as any;
      }
    }
    return super.send<TResult, TInput>(pattern, data);
  }

  override emit<TResult = any, TInput = any>(pattern: any, data: TInput) {
    const store = correlationIdStorage.getStore();
    if (store?.correlationId) {
      if (typeof data === 'object' && data !== null) {
        (data as any).correlationId = (data as any).correlationId || store.correlationId;
      } else {
        data = {
          _originalData: data,
          correlationId: store.correlationId,
        } as any;
      }
    }
    return super.emit<TResult, TInput>(pattern, data);
  }
}

// ─── Microservice RPC Interceptor ───
@Injectable()
export class MicroserviceCorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'rpc') {
      const rpcContext = context.switchToRpc();
      const data = rpcContext.getData();

      let correlationId: string | undefined;
      let jobId: string | undefined;

      if (data && typeof data === 'object') {
        correlationId = data.correlationId;
        jobId = data.jobId;
      }

      if (!correlationId) {
        correlationId = uuidv4();
      }

      return new Observable((subscriber) => {
        correlationIdStorage.run({ correlationId, jobId }, () => {
          next.handle().subscribe({
            next: (val) => subscriber.next(val),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
      });
    }

    return next.handle();
  }
}

// ─── BullMQ Queue Patcher ───
export function patchBullMQ() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Queue } = require('bullmq');
    const originalAdd = Queue.prototype.add;
    Queue.prototype.add = function (name: any, data: any, opts?: any) {
      const store = correlationIdStorage.getStore();
      if (store?.correlationId) {
        if (typeof data === 'object' && data !== null) {
          data.correlationId = data.correlationId || store.correlationId;
        } else {
          data = {
            _originalData: data,
            correlationId: store.correlationId,
          };
        }
      }
      return originalAdd.call(this, name, data, opts);
    };
  } catch (e) {
    // bullmq not installed or skipped
  }
}

// ─── Worker Processor Context Wrapper ───
export function wrapWorkerProcessor(processor: (job: any) => Promise<any>) {
  return async (job: any) => {
    const correlationId = job.data?.correlationId || `job-${job.id}`;
    const jobId = job.id;
    return correlationIdStorage.run({ correlationId, jobId }, async () => {
      return processor(job);
    });
  };
}
