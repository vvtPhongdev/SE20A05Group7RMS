import { Injectable, Logger } from '@nestjs/common';
import {
  EMBEDDING_MODEL_VERSION,
  embeddingToPgVector,
  getQueryEmbedding,
  skillGraph,
  MatchScorer,
  SearchExpander,
} from '@wr/ai';
import { PrismaService } from '../../common/database/prisma.service';

type TalentFeedbackAction =
  | 'IMPRESSION'
  | 'VIEW_CV'
  | 'MARK_REVIEW'
  | 'SCHEDULE_INTERVIEW'
  | 'SHORTLIST'
  | 'REJECT'
  | 'INVITE'
  | 'HIRE';

type SkillRequirements = {
  skills?: unknown;
  jobLevel?: unknown;
  employmentType?: unknown;
  experience?: unknown;
  education?: unknown;
  salaryMin?: unknown;
  salaryMax?: unknown;
  startDate?: unknown;
  templateName?: unknown;
  templateFields?: unknown;
};

type RequestSearchContext = {
  position: string;
  departmentName: string | null;
  jobDescription: string;
  skillRequirements: SkillRequirements;
  explicitSkills: string[];
  searchText: string;
};

const FEEDBACK_ACTION_WEIGHTS: Record<Exclude<TalentFeedbackAction, 'IMPRESSION'>, number> = {
  VIEW_CV: 0.015,
  MARK_REVIEW: 0.04,
  SCHEDULE_INTERVIEW: 0.07,
  SHORTLIST: 0.08,
  INVITE: 0.1,
  HIRE: 0.14,
  REJECT: -0.12,
};

@Injectable()
export class TalentSearchService {
  private readonly logger = new Logger(TalentSearchService.name);
  private readonly scorer = new MatchScorer(skillGraph);
  private readonly expander = new SearchExpander(skillGraph);

  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    query?: string;
    filters?: Record<string, unknown>;
    pagination?: { page: number; pageSize: number };
    actorUserId?: string;
    actorRole?: string;
  }) {
    const { query = '', filters, pagination, actorUserId, actorRole } = params;
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const requestId = typeof filters?.requestId === 'string' ? filters.requestId : undefined;
    const originalQuery = query.trim();
    const requestContext = requestId ? await this.getRequestSearchContext(requestId) : null;
    const effectiveQuery = this.buildEffectiveQuery(originalQuery, requestContext);
    const querySource = requestContext
      ? originalQuery
        ? 'campaign_jd_plus_manual'
        : 'campaign_jd'
      : 'manual';

    this.logger.log(`Talent search: "${effectiveQuery}" (page ${page})`);

    if (!effectiveQuery) {
      return {
        data: [],
        meta: {
          searchRunId: null,
          pagination: { page, pageSize, total: 0 },
          expandedQuery: { resolved: null, expandedSkills: [] },
          query: { original: originalQuery, effective: '', source: querySource },
        },
      };
    }

    const expanded = this.expander.expand(effectiveQuery);
    this.logger.debug(`Expanded "${effectiveQuery}" -> ${expanded.expandedSkills.length} skills`);

    const candidates = await this.prisma.candidateProfile.findMany({
      where: requestId
        ? {
            applications: {
              some: {
                requestId,
              },
            },
          }
        : undefined,
      include: {
        user: { select: { displayName: true } },
        cvDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        interviews: requestId
          ? {
              where: {
                requestId,
                status: { not: 'CANCELLED' },
              },
              select: { id: true, status: true, scheduledAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            }
          : false,
      },
      take: pageSize * 3,
      skip: 0,
    });

    const requiredSkills = this.uniqueSkills([
      ...(requestContext?.explicitSkills ?? []),
      ...(expanded.resolvedSkill ? [expanded.resolvedSkill] : []),
      ...expanded.expandedSkills,
    ]).slice(0, 30);
    const vectorScores = await this.getVectorScores(effectiveQuery, requestId);
    const feedbackScores = await this.getFeedbackScores(
      candidates.map((candidate: any) => candidate.id),
      requestId,
    );

    const scoredResults = candidates
      .map((candidate: any) => {
        const capabilities = candidate.structuredData as {
          skills?: string[];
          currentRole?: string;
          visibility?: string;
          preferredWorkMode?: string;
          yearsOfExperience?: number;
        } | null;
        const candidateSkills = capabilities?.skills ?? [];
        if (filters?.workMode && capabilities?.preferredWorkMode !== filters.workMode) {
          return null;
        }
        if (
          filters?.minYearsExperience &&
          (capabilities?.yearsOfExperience ?? 0) < Number(filters.minYearsExperience)
        ) {
          return null;
        }
        if (
          filters?.maxYearsExperience &&
          (capabilities?.yearsOfExperience ?? Number.POSITIVE_INFINITY) >
            Number(filters.maxYearsExperience)
        ) {
          return null;
        }
        if (capabilities?.visibility === 'PRIVATE' && filters?.visibility !== 'PRIVATE') {
          return null;
        }

        const baseResult = this.scorer.scoreCandidate({
          candidateProfileId: candidate.id,
          candidateSkills,
          requiredSkills,
          vectorSimilarity: vectorScores.get(candidate.id) ?? 0,
        });
        const feedbackScore = feedbackScores.get(candidate.id) ?? 0;
        const overallScore = this.roundScore(this.clamp(baseResult.overallScore + feedbackScore));
        const matchExplanation = this.buildMatchExplanation({
          ...baseResult,
          overallScore,
          feedbackScore,
        });

        return {
          ...baseResult,
          overallScore,
          baseOverallScore: baseResult.overallScore,
          feedbackScore,
          matchExplanation,
          displayName: candidate.user.displayName,
          headline: capabilities?.currentRole ?? null,
          skills: candidateSkills,
          latestCv: candidate.cvDocuments[0] ?? null,
          latestInterview: candidate.interviews?.[0] ?? null,
          hasInterviewInvite: Boolean(candidate.interviews?.length),
        };
      })
      .filter(Boolean)
      .filter((result: any) => result.overallScore > 0.1)
      .sort((a: any, b: any) => b.overallScore - a.overallScore);

    const total = scoredResults.length;
    const paged = scoredResults.slice((page - 1) * pageSize, page * pageSize);
    const searchRun = await this.prisma.talentSearchRun.create({
      data: {
        actorUserId,
        actorRole,
        requestId,
        query: effectiveQuery,
        filters: {
          ...(filters ?? {}),
          originalQuery,
          querySource,
        } as any,
        expandedSkills: expanded.expandedSkills.slice(0, 20) as any,
        resultCount: total,
        modelVersion: EMBEDDING_MODEL_VERSION,
      },
      select: { id: true },
    });

    if (paged.length > 0) {
      await this.prisma.talentSearchFeedback.createMany({
        data: paged.map((result: any, index: number) => ({
          searchRunId: searchRun.id,
          candidateId: result.candidateProfileId,
          actorUserId,
          requestId,
          action: 'IMPRESSION',
          rank: (page - 1) * pageSize + index + 1,
          overallScore: result.overallScore,
          vectorScore: result.vectorScore,
          graphScore: result.graphScore,
          coverageScore: result.coverageScore,
          query: effectiveQuery,
          candidateSnapshot: this.toCandidateSnapshot(result) as any,
          metadata: {
            page,
            pageSize,
            actorRole,
            originalQuery,
            querySource,
            baseOverallScore: result.baseOverallScore,
            feedbackScore: result.feedbackScore,
          } as any,
        })),
      });
    }

    return {
      data: paged,
      meta: {
        searchRunId: searchRun.id,
        pagination: { page, pageSize, total },
        expandedQuery: {
          resolved: expanded.resolvedSkill,
          expandedSkills: expanded.expandedSkills.slice(0, 10),
        },
        query: {
          original: originalQuery,
          effective: effectiveQuery,
          source: querySource,
        },
      },
    };
  }

  expandQuery(query: string) {
    const expanded = this.expander.expand(query);
    return {
      query,
      resolved: expanded.resolvedSkill,
      expandedSkills: expanded.expandedSkills,
      graphSize: skillGraph.size,
    };
  }

  async recordFeedback(payload: {
    searchRunId: string;
    candidateId: string;
    action: TalentFeedbackAction;
    rank?: number;
    scores?: {
      overallScore?: number;
      vectorScore?: number;
      graphScore?: number;
      coverageScore?: number;
    };
    candidateSnapshot?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    actorUserId?: string;
    actorRole?: string;
  }) {
    const searchRun = await this.prisma.talentSearchRun.findUnique({
      where: { id: payload.searchRunId },
      select: { id: true, query: true, requestId: true },
    });
    if (!searchRun) {
      throw new Error(`Talent search run ${payload.searchRunId} not found`);
    }

    const record = await this.prisma.talentSearchFeedback.create({
      data: {
        searchRunId: searchRun.id,
        candidateId: payload.candidateId,
        actorUserId: payload.actorUserId,
        requestId: searchRun.requestId,
        action: payload.action,
        rank: payload.rank,
        overallScore: payload.scores?.overallScore,
        vectorScore: payload.scores?.vectorScore,
        graphScore: payload.scores?.graphScore,
        coverageScore: payload.scores?.coverageScore,
        query: searchRun.query,
        candidateSnapshot: (payload.candidateSnapshot ?? {}) as any,
        metadata: {
          ...(payload.metadata ?? {}),
          actorRole: payload.actorRole,
        } as any,
      },
      select: { id: true, action: true, createdAt: true },
    });

    return record;
  }

  async exportTrainingTriplets(params: { requestId?: string; limit?: number }) {
    const positiveActions = ['VIEW_CV', 'MARK_REVIEW', 'SCHEDULE_INTERVIEW', 'SHORTLIST', 'INVITE', 'HIRE'];
    const negativeActions = ['REJECT'];
    const rows = await this.prisma.talentSearchFeedback.findMany({
      where: {
        requestId: params.requestId,
        action: { in: [...positiveActions, ...negativeActions] },
      },
      include: {
        candidate: {
          include: {
            cvDocuments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 500,
    });

    const positives = rows.filter((row) => positiveActions.includes(row.action));
    const negatives = rows.filter((row) => negativeActions.includes(row.action));
    const triplets = positives.flatMap((positive) => {
      const negative = negatives.find(
        (item) => item.searchRunId === positive.searchRunId && item.candidateId !== positive.candidateId,
      );
      if (!negative) return [];
      return [
        {
          anchor: this.withPrefix('query', positive.query),
          positive: this.withPrefix('passage', positive.candidate.cvDocuments[0]?.rawText ?? ''),
          negative: this.withPrefix('passage', negative.candidate.cvDocuments[0]?.rawText ?? ''),
          metadata: {
            searchRunId: positive.searchRunId,
            requestId: positive.requestId,
            positiveAction: positive.action,
            negativeAction: negative.action,
          },
        },
      ];
    });

    return {
      count: triplets.length,
      format: 'jsonl',
      data: triplets.map((item) => JSON.stringify(item)).join('\n'),
    };
  }

  private async getVectorScores(query: string, requestId?: string): Promise<Map<string, number>> {
    try {
      const embedding = await getQueryEmbedding(query);
      const vectorStr = embeddingToPgVector(embedding);
      const applicationJoin = requestId
        ? 'JOIN applications app ON app."candidate_id" = cv."candidate_id" AND app."request_id" = $2'
        : '';
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT cv."candidate_id" AS "candidateId",
                MAX(1 - (ce.embedding <=> $1::vector)) AS similarity
         FROM cv_embeddings ce
         JOIN candidate_cvs cv ON cv.id = ce."cv_document_id"
         ${applicationJoin}
         WHERE ce.embedding IS NOT NULL
         GROUP BY cv."candidate_id"`,
        vectorStr,
        ...(requestId ? [requestId] : []),
      )) as Array<{ candidateId: string; similarity: number | string | null }>;

      return new Map(
        rows
          .filter((row) => row.candidateId && row.similarity !== null)
          .map((row) => [row.candidateId, Number(row.similarity)]),
      );
    } catch (error) {
      this.logger.warn(
        `Vector similarity unavailable; falling back to graph-only talent search: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return new Map();
    }
  }

  private async getRequestSearchContext(requestId: string): Promise<RequestSearchContext | null> {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
      select: {
        position: true,
        jobDescription: true,
        skillRequirements: true,
        department: { select: { name: true } },
      },
    });
    if (!request) return null;

    const skillRequirements = this.asSkillRequirements(request.skillRequirements);
    const explicitSkills = this.extractSkillList(skillRequirements.skills);
    const fields = this.flattenTemplateFields(skillRequirements.templateFields);
    const searchText = [
      `Position: ${request.position}`,
      request.department?.name ? `Department: ${request.department.name}` : '',
      `Job description: ${request.jobDescription}`,
      explicitSkills.length ? `Required skills: ${explicitSkills.join(', ')}` : '',
      this.formatRequirement('Level', skillRequirements.jobLevel),
      this.formatRequirement('Employment', skillRequirements.employmentType),
      this.formatRequirement('Experience', skillRequirements.experience),
      this.formatRequirement('Education', skillRequirements.education),
      this.formatRequirement('Salary min', skillRequirements.salaryMin),
      this.formatRequirement('Salary max', skillRequirements.salaryMax),
      this.formatRequirement('Start date', skillRequirements.startDate),
      this.formatRequirement('Template', skillRequirements.templateName),
      fields.length ? `Additional requirements: ${fields.join('; ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      position: request.position,
      departmentName: request.department?.name ?? null,
      jobDescription: request.jobDescription,
      skillRequirements,
      explicitSkills,
      searchText,
    };
  }

  private async getFeedbackScores(candidateIds: string[], requestId?: string): Promise<Map<string, number>> {
    if (candidateIds.length === 0) return new Map();

    const rows = await this.prisma.talentSearchFeedback.findMany({
      where: {
        candidateId: { in: candidateIds },
        action: { in: Object.keys(FEEDBACK_ACTION_WEIGHTS) },
      },
      select: { candidateId: true, requestId: true, action: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const scores = new Map<string, number>();
    const seen = new Set<string>();
    for (const row of rows) {
      const key = `${row.candidateId}:${row.action}:${row.requestId ?? 'global'}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const baseWeight = FEEDBACK_ACTION_WEIGHTS[row.action as Exclude<TalentFeedbackAction, 'IMPRESSION'>] ?? 0;
      const scopeMultiplier = !requestId || row.requestId === requestId ? 1 : 0.35;
      const current = scores.get(row.candidateId) ?? 0;
      scores.set(row.candidateId, this.clamp(current + baseWeight * scopeMultiplier, -0.2, 0.2));
    }

    return scores;
  }

  private buildEffectiveQuery(originalQuery: string, requestContext: RequestSearchContext | null) {
    if (!requestContext) return originalQuery;
    return [requestContext.searchText, originalQuery ? `HR refinement: ${originalQuery}` : '']
      .filter(Boolean)
      .join('\n\n');
  }

  private asSkillRequirements(value: unknown): SkillRequirements {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as SkillRequirements)
      : {};
  }

  private extractSkillList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return this.uniqueSkills(value.filter((item): item is string => typeof item === 'string'));
  }

  private flattenTemplateFields(value: unknown): string[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    return Object.entries(value as Record<string, unknown>)
      .map(([key, fieldValue]) => {
        const normalized = this.stringifyRequirement(fieldValue);
        return normalized ? `${key}: ${normalized}` : '';
      })
      .filter(Boolean);
  }

  private formatRequirement(label: string, value: unknown) {
    const normalized = this.stringifyRequirement(value);
    return normalized ? `${label}: ${normalized}` : '';
  }

  private stringifyRequirement(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value
        .map((item) => this.stringifyRequirement(item))
        .filter(Boolean)
        .join(', ');
    }
    return '';
  }

  private uniqueSkills(skills: string[]) {
    const seen = new Set<string>();
    return skills
      .map((skill) => skill.trim())
      .filter((skill) => {
        const key = skill.toLowerCase();
        if (!skill || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  private roundScore(value: number) {
    return Math.round(value * 10000) / 10000;
  }

  private buildMatchExplanation(result: {
    overallScore: number;
    vectorScore: number;
    graphScore: number;
    coverageScore: number;
    feedbackScore?: number;
    readinessLabel: string;
    matchedSkills?: Array<{ skill: string; confidence: number; source: string; distance?: number }>;
    gaps?: Array<{ skill: string; gapType: string; severity: string }>;
  }) {
    const matchedSkills = (result.matchedSkills ?? [])
      .filter((item) => item.confidence >= 0.45)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
    const gaps = (result.gaps ?? [])
      .sort((a, b) => this.gapSeverityRank(b.severity) - this.gapSeverityRank(a.severity))
      .slice(0, 6);
    const calibratedBand = Math.round(result.overallScore * 20) * 5;
    const scoreDrivers = [
      `Semantic CV/JD similarity: ${Math.round(result.vectorScore * 100)}%`,
      `Skill graph proximity: ${Math.round(result.graphScore * 100)}%`,
      `Required skill coverage: ${Math.round(result.coverageScore * 100)}%`,
      result.feedbackScore
        ? `HR feedback adjustment: ${result.feedbackScore > 0 ? '+' : ''}${Math.round(result.feedbackScore * 100)}%`
        : '',
    ].filter(Boolean);

    return {
      assessment: this.humanizeReadiness(result.readinessLabel),
      scoreBand: `${Math.max(0, calibratedBand - 2)}-${Math.min(100, calibratedBand + 2)}%`,
      scoreDrivers,
      matchedSkills,
      gaps,
      note:
        'Candidates in the same score band should be treated as comparable; review matched skills and gaps before making a decision.',
    };
  }

  private gapSeverityRank(severity: string) {
    if (severity === 'CRITICAL') return 3;
    if (severity === 'MODERATE') return 2;
    if (severity === 'MINOR') return 1;
    return 0;
  }

  private humanizeReadiness(label: string) {
    const labels: Record<string, string> = {
      READY_NOW: 'Ready now',
      READY_WITH_SHORT_RAMP_UP: 'Ready with short ramp-up',
      DOMAIN_SPECIALIST_WITH_TECH_GAP: 'Domain fit with technical gap',
      STRONG_FUNDAMENTALS_NEEDS_DOMAIN: 'Strong fundamentals, needs domain ramp-up',
      SIGNIFICANT_GAPS: 'Significant gaps',
      INSUFFICIENT_EVIDENCE: 'Insufficient CV evidence',
      OUT_OF_SCOPE: 'Out of scope',
    };
    return labels[label] ?? label.replaceAll('_', ' ').toLowerCase();
  }

  private toCandidateSnapshot(result: any) {
    return {
      displayName: result.displayName,
      headline: result.headline,
      skills: result.skills,
      readinessLabel: result.readinessLabel,
      matchExplanation: result.matchExplanation,
      baseOverallScore: result.baseOverallScore,
      feedbackScore: result.feedbackScore,
      latestCvId: result.latestCv?.id,
    };
  }

  private withPrefix(kind: 'query' | 'passage', text: string) {
    const trimmed = text.trim();
    if (/^(query|passage):/i.test(trimmed)) return trimmed;
    return `${kind}: ${trimmed}`;
  }
}
