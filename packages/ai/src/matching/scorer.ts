// ─── Match Scorer ──────────────────────────────────────────────────
// Composite scoring engine: vector similarity + graph proximity + coverage.
// Produces readiness labels from deterministic rules.

import { SkillGraph } from '../skill-graph/graph';
import { SkillMatch } from '../skill-graph/types';
import { MatchResult, GapInfo, ReadinessLabelType } from './types';

/** Scoring weights — deterministic, no ML involved */
const VECTOR_WEIGHT = 0.40;
const GRAPH_WEIGHT = 0.35;
const COVERAGE_WEIGHT = 0.25;

export class MatchScorer {
  constructor(private readonly graph: SkillGraph) {}

  /**
   * Score a candidate against a job's required skills.
   * All inputs are structured data — no LLM involvement.
   */
  scoreCandidate(params: {
    candidateProfileId: string;
    candidateSkills: string[];
    requiredSkills: string[];
    vectorSimilarity?: number; // 0-1, from pgvector cosine similarity
  }): MatchResult {
    const { candidateProfileId, candidateSkills, requiredSkills, vectorSimilarity = 0 } = params;

    // Graph proximity scoring
    const graphResult = this.graph.getGraphProximityScore(candidateSkills, requiredSkills);

    // Coverage: what fraction of required skills are covered (exact or close)
    const coveredCount = graphResult.matches.filter((m) => m.confidence >= 0.45).length;
    const coverageScore = requiredSkills.length > 0 ? coveredCount / requiredSkills.length : 0;

    // Composite score
    const overallScore =
      VECTOR_WEIGHT * vectorSimilarity +
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
  private classifyGaps(requiredSkills: string[], matches: SkillMatch[]): GapInfo[] {
    const matchedSet = new Set(matches.filter((m) => m.confidence >= 0.45).map((m) => m.skill));
    const gaps: GapInfo[] = [];

    for (const skill of requiredSkills) {
      if (matchedSet.has(skill)) continue;

      const node = this.graph.findNode(skill);
      const category = node?.category ?? 'TOOL';

      let gapType: GapInfo['gapType'];
      let severity: GapInfo['severity'];

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
  private assignReadinessLabel(
    overallScore: number,
    gaps: GapInfo[],
    coverageScore: number,
  ): ReadinessLabelType {
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
