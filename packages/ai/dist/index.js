import { z } from 'zod';
// ─── Sub-module re-exports ─────────────────────────────────────────
export * from './skill-graph';
export * from './matching';
export * from './embedding';
export * from './cv-parser';
export * from './similarity';
// ─── LLM Output Schemas ────────────────────────────────────────────
export const InterviewFocusOutputSchema = z.object({
    items: z.array(z.object({
        area: z.string(),
        rationale: z.string(),
        suggestedQuestions: z.array(z.string()),
        priority: z.number().int().min(0).max(10),
    })),
});
/**
 * Validate LLM output against a Zod schema.
 * Rejects outputs missing required provenance references.
 */
export function validateLlmOutput(raw, schema) {
    const parsed = JSON.parse(raw);
    return schema.parse(parsed);
}
//# sourceMappingURL=index.js.map