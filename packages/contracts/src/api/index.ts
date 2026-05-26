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
