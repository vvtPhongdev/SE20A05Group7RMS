export interface ErrorMetadata extends Error {
  status?: number;
  code?: string;
}

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export const getErrorMetadata = (error: unknown): ErrorMetadata =>
  error instanceof Error ? (error as ErrorMetadata) : new Error(String(error));
