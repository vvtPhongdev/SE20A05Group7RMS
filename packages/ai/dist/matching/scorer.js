// ─── Match Scorer ──────────────────────────────────────────────────
// Composite scoring engine: vector similarity + graph proximity + coverage.
// Produces readiness labels from deterministic rules.
/** Scoring weights — deterministic, no ML involved */
const VECTOR_WEIGHT = 0.40;
const GRAPH_WEIGHT = 0.35;
const COVERAGE_WEIGHT = 0.25;
export class MatchScorer {
    graph;
    constructor(graph) {
        this.graph = graph;
    }
    /**
     * Score a candidate against a job's required skills.
     * All inputs are structured data — no LLM involvement.
     */
    scoreCandidate(params) {
        const { candidateProfileId, candidateSkills, requiredSkills, vectorSimilarity = 0 } = params;
        // Graph proximity scoring
        const graphResult = this.graph.getGraphProximityScore(candidateSkills, requiredSkills);
        // Coverage: what fraction of required skills are covered (exact or close)
        const coveredCount = graphResult.matches.filter((m) => m.confidence >= 0.45).length;
        const coverageScore = requiredSkills.length > 0 ? coveredCount / requiredSkills.length : 0;
        // Composite score
        const overallScore = VECTOR_WEIGHT * vectorSimilarity +
            GRAPH_WEIGHT * graphResult.score +
            COVERAGE_WEIGHT * coverageScore;
        // Identify gaps
        const gaps = this.classifyGaps(requiredSkills, graphResult.matches);
        // Assign readiness label
        const readinessLabel = this.assignReadinessLabel(overallScore, gaps, coverageScore);
        return {
            candidateProfileId,
            overallScore: Math.round(overallScore * 1000) / 1000,
            vectorScore: Math.round(vectorSimilarity * 1000) / 1000,
            graphScore: Math.round(graphResult.score * 1000) / 1000,
            coverageScore: Math.round(coverageScore * 1000) / 1000,
            readinessLabel,
            matchedSkills: graphResult.matches,
            gaps,
            capabilityScores: [],
        };
    }
    /** Classify unmatched required skills into gap types */
    classifyGaps(requiredSkills, matches) {
        const matchedSet = new Set(matches.filter((m) => m.confidence >= 0.45).map((m) => m.skill));
        const gaps = [];
        for (const skill of requiredSkills) {
            if (matchedSet.has(skill))
                continue;
            const node = this.graph.findNode(skill);
            const category = node?.category ?? 'TOOL';
            let gapType;
            let severity;
            switch (category) {
                case 'PARADIGM':
                    gapType = 'PARADIGM';
                    severity = 'MODERATE';
                    break;
                case 'CLOUD':
                case 'DEVOPS':
                    gapType = 'OPS_CLOUD';
                    severity = 'MODERATE';
                    break;
                case 'ROLE':
                case 'DOMAIN':
                    gapType = 'ARCHITECTURE';
                    severity = 'CRITICAL';
                    break;
                default:
                    gapType = 'TOOL';
                    severity = 'MINOR';
            }
            // Check if there's a weak match (distance > 3 but not infinite)
            const weakMatch = matches.find((m) => m.skill === skill && m.confidence > 0 && m.confidence < 0.45);
            if (weakMatch) {
                severity = 'MINOR'; // downgrade if there's a related skill
            }
            gaps.push({ skill, gapType, severity });
        }
        return gaps;
    }
    /** Deterministic readiness label assignment */
    assignReadinessLabel(overallScore, gaps, coverageScore) {
        const criticalGaps = gaps.filter((g) => g.severity === 'CRITICAL').length;
        const moderateGaps = gaps.filter((g) => g.severity === 'MODERATE').length;
        if (overallScore >= 0.80 && criticalGaps === 0 && coverageScore >= 0.85) {
            return 'READY_NOW';
        }
        if (overallScore >= 0.65 && criticalGaps === 0 && coverageScore >= 0.65) {
            return 'READY_WITH_SHORT_RAMP_UP';
        }
        if (overallScore >= 0.50 && moderateGaps <= 2) {
            return 'DOMAIN_SPECIALIST_WITH_TECH_GAP';
        }
        if (overallScore >= 0.35) {
            return 'STRONG_FUNDAMENTALS_NEEDS_DOMAIN';
        }
        if (overallScore >= 0.15) {
            return 'SIGNIFICANT_GAPS';
        }
        if (overallScore > 0) {
            return 'INSUFFICIENT_EVIDENCE';
        }
        return 'OUT_OF_SCOPE';
    }
}
//# sourceMappingURL=scorer.js.map