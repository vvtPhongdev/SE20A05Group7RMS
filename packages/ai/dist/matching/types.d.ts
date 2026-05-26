import { SkillMatch } from '../skill-graph/types';
export interface CapabilityScore {
    group: string;
    score: number;
    matchedSkills: SkillMatch[];
    gaps: GapInfo[];
}
export interface GapInfo {
    skill: string;
    gapType: 'TOOL' | 'PARADIGM' | 'ARCHITECTURE' | 'OPS_CLOUD' | 'DELIVERY';
    severity: 'CRITICAL' | 'MODERATE' | 'MINOR';
}
export type ReadinessLabelType = 'READY_NOW' | 'READY_WITH_SHORT_RAMP_UP' | 'DOMAIN_SPECIALIST_WITH_TECH_GAP' | 'STRONG_FUNDAMENTALS_NEEDS_DOMAIN' | 'SIGNIFICANT_GAPS' | 'INSUFFICIENT_EVIDENCE' | 'OUT_OF_SCOPE';
export interface MatchResult {
    candidateProfileId: string;
    overallScore: number;
    vectorScore: number;
    graphScore: number;
    coverageScore: number;
    readinessLabel: ReadinessLabelType;
    matchedSkills: SkillMatch[];
    gaps: GapInfo[];
    capabilityScores: CapabilityScore[];
}
export interface EmbeddingService {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    readonly dimensions: number;
}
//# sourceMappingURL=types.d.ts.map