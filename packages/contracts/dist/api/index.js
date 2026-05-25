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
};
//# sourceMappingURL=index.js.map