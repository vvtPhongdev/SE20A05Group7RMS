import { z } from 'zod';
export * from './skill-graph';
export * from './matching';
/**
 * LLM Client Interface.
 * The LLM is a narrator, NOT a scoring authority.
 * All outputs must be validated with Zod before persistence.
 */
export interface LlmRequest {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}
export interface LlmResponse {
    content: string;
    model: string;
    tokensUsed: {
        prompt: number;
        completion: number;
    };
}
/**
 * Abstract LLM client — implementation injected at runtime.
 * Provider selection is deferred; this interface supports
 * OpenAI, Anthropic, Google, or local models.
 */
export interface LlmClient {
    complete(request: LlmRequest): Promise<LlmResponse>;
    completeJson<T>(request: LlmRequest, schema: z.ZodType<T>): Promise<T>;
}
export declare const InterviewFocusOutputSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        area: z.ZodString;
        rationale: z.ZodString;
        suggestedQuestions: z.ZodArray<z.ZodString, "many">;
        priority: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        area: string;
        rationale: string;
        suggestedQuestions: string[];
        priority: number;
    }, {
        area: string;
        rationale: string;
        suggestedQuestions: string[];
        priority: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        area: string;
        rationale: string;
        suggestedQuestions: string[];
        priority: number;
    }[];
}, {
    items: {
        area: string;
        rationale: string;
        suggestedQuestions: string[];
        priority: number;
    }[];
}>;
export type InterviewFocusOutput = z.infer<typeof InterviewFocusOutputSchema>;
/**
 * Validate LLM output against a Zod schema.
 * Rejects outputs missing required provenance references.
 */
export declare function validateLlmOutput<T>(raw: string, schema: z.ZodType<T>): T;
//# sourceMappingURL=index.d.ts.map