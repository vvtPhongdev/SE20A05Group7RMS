import { z } from 'zod';

// ─── Sub-module re-exports ─────────────────────────────────────────
export * from './skill-graph/index';
export * from './matching/index';
export * from './embedding';
export * from './cv-parser';
export * from './similarity';

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

// ─── LLM Output Schemas ────────────────────────────────────────────


export const InterviewFocusOutputSchema = z.object({
  items: z.array(
    z.object({
      area: z.string(),
      rationale: z.string(),
      suggestedQuestions: z.array(z.string()),
      priority: z.number().int().min(0).max(10),
    }),
  ),
});

export type InterviewFocusOutput = z.infer<typeof InterviewFocusOutputSchema>;

/**
 * Validate LLM output against a Zod schema.
 * Rejects outputs missing required provenance references.
 */
export function validateLlmOutput<T>(raw: string, schema: z.ZodType<T>): T {
  const parsed = JSON.parse(raw);
  return schema.parse(parsed);
}
