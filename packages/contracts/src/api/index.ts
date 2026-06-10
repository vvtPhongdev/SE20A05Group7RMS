import { z } from 'zod';

/**
 * Standard API response wrapper.
 * All successful API responses MUST use this shape.
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    pagination?: Pagination;
  };
}

/**
 * Standard API error response.
 * All error responses MUST use this shape.
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

/**
 * Well-known error codes per architecture spec.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FAILED_VALIDATION: 'FAILED_VALIDATION',
  FAILED_PARSE: 'FAILED_PARSE',
  FAILED_PROCESSING: 'FAILED_PROCESSING',
  OUT_OF_SCOPE: 'OUT_OF_SCOPE',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * T-103: Standardized error response shape returned by the gateway's
 * GlobalExceptionFilter for every unhandled exception (HTTP, TCP
 * microservice, and unknown errors alike).
 */
export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z.array(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  path: z.string(),
});

export type ErrorResponseDto = z.infer<typeof ErrorResponseSchema>;

/**
 * Maps an HTTP status code to its corresponding well-known error code.
 * Falls back to INTERNAL_ERROR for unrecognized statuses.
 */
export function errorCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
    case 422:
      return ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return ERROR_CODES.UNAUTHORIZED;
    case 403:
      return ERROR_CODES.FORBIDDEN;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}
