import { SkillGraph } from '../skill-graph/graph';
import { MatchResult } from './types';
export declare class MatchScorer {
    private readonly graph;
    constructor(graph: SkillGraph);
    /**
     * Score a candidate against a job's required skills.
     * All inputs are structured data — no LLM involvement.
     */
    scoreCandidate(params: {
        candidateProfileId: string;
        candidateSkills: string[];
        requiredSkills: string[];
        vectorSimilarity?: number;
    }): MatchResult;
    /** Classify unmatched required skills into gap types */
    private classifyGaps;
    /** Deterministic readiness label assignment */
    private assignReadinessLabel;
}
//# sourceMappingURL=scorer.d.ts.map