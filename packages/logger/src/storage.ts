import { AsyncLocalStorage } from 'async_hooks';

export interface LoggerStore {
  correlationId?: string;
  jobId?: string;
}

export const correlationIdStorage = new AsyncLocalStorage<LoggerStore>();

export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore()?.correlationId;
}

export function getJobId(): string | undefined {
  return correlationIdStorage.getStore()?.jobId;
}
