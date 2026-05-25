import { z } from 'zod';
/**
 * Standard API response wrapper.
 * All successful API responses MUST use this shape.
 */
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    total: number;
}, {
    page: number;
    pageSize: number;
    total: number;
}>;
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
export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly FAILED_VALIDATION: "FAILED_VALIDATION";
    readonly FAILED_PARSE: "FAILED_PARSE";
    readonly FAILED_PROCESSING: "FAILED_PROCESSING";
    readonly OUT_OF_SCOPE: "OUT_OF_SCOPE";
    readonly INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly CONFLICT: "CONFLICT";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
//# sourceMappingURL=index.d.ts.map