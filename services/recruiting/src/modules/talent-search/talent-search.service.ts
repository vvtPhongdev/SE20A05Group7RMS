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

export type TalentFeedbackAction =
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
  required?: unknown;
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

export type FeedbackAdjustment = {
  direct: number;
  semantic: number;
  total: number;
};

// Feedback is evidence, never a replacement for the CV/JD match. These caps keep a
// single recruiter's decision from moving a neighbouring CV across a decision boundary.
export const FEEDBACK_SEMANTIC_THRESHOLD = 0.82;
export const FEEDBACK_SEMANTIC_CAP = 0.05;

export const calculateFeedbackAdjustments = (
  candidateIds: string[],
  directScores: Map<string, number>,
  similarities: Array<{ candidateId: string; sourceCandidateId: string; similarity: number }>,
): Map<string, FeedbackAdjustment> => {
  const adjustments = new Map<string, FeedbackAdjustment>(
    candidateIds.map((candidateId) => [
      candidateId,
      { direct: directScores.get(candidateId) ?? 0, semantic: 0, total: directScores.get(candidateId) ?? 0 },
    ]),
  );
  for (const relation of similarities) {
    if (relation.candidateId === relation.sourceCandidateId || relation.similarity < FEEDBACK_SEMANTIC_THRESHOLD) continue;
    const source = directScores.get(relation.sourceCandidateId) ?? 0;
    if (!source) continue;
    // Negative signals are more subjective, so they travel at one quarter of the positive rate.
    const strength = Math.min(1, (relation.similarity - FEEDBACK_SEMANTIC_THRESHOLD) / (1 - FEEDBACK_SEMANTIC_THRESHOLD));
    const contribution = source * strength * (source < 0 ? 0.05 : 0.2);
    const current = adjustments.get(relation.candidateId);
    if (!current) continue;
    current.semantic = Math.max(-FEEDBACK_SEMANTIC_CAP, Math.min(FEEDBACK_SEMANTIC_CAP, current.semantic + contribution));
    current.total = Math.max(-0.2, Math.min(0.2, current.direct + current.semantic));
  }
  return adjustments;
};

type RoleTrack = 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | null;

const getRoleTrack = (value?: string | null): RoleTrack => {
  const normalized = value?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
  if (!normalized) return null;
  if (normalized.includes('fullstack') || normalized.includes('fullstack')) return 'FULLSTACK';
  if (normalized.includes('frontend') || normalized.includes('front end')) return 'FRONTEND';
  if (normalized.includes('backend') || normalized.includes('back end')) return 'BACKEND';
  return null;
};

const isRoleTrackCompatible = (campaignRole: string | undefined, candidateRole?: string | null) => {
  const campaignTrack = getRoleTrack(campaignRole);
  const candidateTrack = getRoleTrack(candidateRole);
  if (!campaignTrack || !candidateTrack) return true;
  if (candidateTrack === 'FULLSTACK') return true;
  return campaignTrack === candidateTrack;
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
    const campaignMembersOnly = filters?.campaignMembersOnly === true;
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

    const campaignExpanded = requestContext
      ? this.expander.expand(requestContext.searchText)
      : { resolvedSkill: null, expandedSkills: [] };
    const manualExpanded = originalQuery
      ? this.expander.expand(originalQuery)
      : { resolvedSkill: null, expandedSkills: [] };
    const expandedSkills = this.uniqueSkills([
      ...campaignExpanded.expandedSkills,
      ...manualExpanded.expandedSkills,
    ]);
    this.logger.debug(
      `Expanded campaign query -> ${campaignExpanded.expandedSkills.length} skills; manual query -> ${manualExpanded.expandedSkills.length} skills`,
    );

    // A campaign provides the JD and required-skill context for ranking. It must not
    // restrict discovery to candidates already added to that campaign, otherwise a
    // new campaign can never find candidates to add.
    const requiredSkills = this.uniqueSkills([
      ...(requestContext?.explicitSkills ?? []),
      ...(campaignExpanded.resolvedSkill ? [campaignExpanded.resolvedSkill] : []),
      ...campaignExpanded.expandedSkills,
      ...(manualExpanded.resolvedSkill ? [manualExpanded.resolvedSkill] : []),
      ...manualExpanded.expandedSkills,
    ]).slice(0, 30);

    // Candidate Search opts into campaignMembersOnly so it only ranks CVs that were
    // collected for, or applied to, the selected campaign. Talent Pool deliberately
    // leaves this off so HR can still discover new external candidates.
    const campaignVectorQuery = requestContext?.searchText ?? effectiveQuery;
    const shouldPrioritizeManualQuery = Boolean(requestContext && originalQuery);
    const [candidates, campaignVectorScores, manualVectorScores] = await Promise.all([
      this.prisma.candidateProfile.findMany({
        where:
          campaignMembersOnly && requestId ? { applications: { some: { requestId } } } : undefined,
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
        // Rank the complete campaign pool before slicing a page. Taking only a
        // small multiple of pageSize made later pages empty and the reported
        // total misleading.
        take: 500,
        skip: 0,
      }),
      this.getVectorScores(campaignVectorQuery),
      shouldPrioritizeManualQuery ? this.getVectorScores(originalQuery) : Promise.resolve(null),
    ]);

    const feedbackAdjustments = await this.getFeedbackAdjustments(
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
        const candidateSkills = [
          ...(capabilities?.skills ?? []),
          ...(capabilities?.currentRole ? [capabilities.currentRole] : []),
        ];
        if (
          typeof filters?.screeningStatus === 'string' &&
          candidate.cvDocuments[0]?.screeningStatus !== filters.screeningStatus
        ) {
          return null;
        }
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
        if (!isRoleTrackCompatible(requestContext?.position, capabilities?.currentRole)) {
          return null;
        }

        // A manual query is a deliberate recruiter refinement, not a note appended to the JD.
        // Keep campaign fit in the score while giving the typed criteria the stronger vector signal.
        const campaignVectorScore = campaignVectorScores.get(candidate.id) ?? 0;
        const manualVectorScore = manualVectorScores?.get(candidate.id) ?? 0;
        const vectorSimilarity = shouldPrioritizeManualQuery
          ? manualVectorScore * 0.65 + campaignVectorScore * 0.35
          : campaignVectorScore;

        const baseResult = this.scorer.scoreCandidate({
          candidateProfileId: candidate.id,
          candidateSkills,
          requiredSkills,
          vectorSimilarity,
        });
        // When the campaign declares required skills, use direct CV evidence for the
        // coverage component. Graph expansion still contributes through graphScore,
        // but it cannot inflate the required-skill evidence shown to HR.
        const coverageScore = requestContext?.explicitSkills.length
          ? this.getDirectSkillCoverage(candidateSkills, requestContext.explicitSkills)
          : baseResult.coverageScore;
        const adjustedBaseScore = this.roundScore(
          vectorSimilarity * 0.4 + baseResult.graphScore * 0.35 + coverageScore * 0.25,
        );
        const vectorSimilarityPenalty = this.getVectorSimilarityPenalty(vectorSimilarity);
        const safeguardedBaseScore = this.roundScore(adjustedBaseScore * vectorSimilarityPenalty);
        const feedbackAdjustment = feedbackAdjustments.get(candidate.id) ?? {
          direct: 0,
          semantic: 0,
          total: 0,
        };
        const feedbackScore = feedbackAdjustment.total;
        const rerankerScore = this.getEvidenceRerankerAdjustment({
          coverageScore,
          vectorSimilarity,
          gaps: baseResult.gaps,
        });
        const overallScore = this.roundScore(
          this.clamp(safeguardedBaseScore + feedbackScore + rerankerScore),
        );
        const matchExplanation = this.buildMatchExplanation({
          ...baseResult,
          coverageScore,
          overallScore,
          vectorSimilarityPenalty,
          feedbackScore,
          directFeedbackScore: feedbackAdjustment.direct,
          semanticFeedbackScore: feedbackAdjustment.semantic,
          rerankerScore,
        });

        return {
          ...baseResult,
          coverageScore,
          overallScore,
          baseOverallScore: safeguardedBaseScore,
          vectorSimilarityPenalty,
          feedbackScore,
          directFeedbackScore: feedbackAdjustment.direct,
          semanticFeedbackScore: feedbackAdjustment.semantic,
          rerankerScore,
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
        expandedSkills: expandedSkills.slice(0, 20) as any,
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
            directFeedbackScore: result.directFeedbackScore,
            semanticFeedbackScore: result.semanticFeedbackScore,
            rerankerScore: result.rerankerScore,
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
          resolved: manualExpanded.resolvedSkill ?? campaignExpanded.resolvedSkill,
          expandedSkills: expandedSkills.slice(0, 10),
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

  async updateScreeningDecision(payload: {
    requestId: string;
    candidateIds: string[];
    status: 'SHORTLISTED' | 'REJECTED' | 'PENDING';
    feedbackReason?: string;
    feedbackNote?: string;
    actorUserId?: string;
    actorRole?: string;
  }) {
    const candidateIds = [...new Set(payload.candidateIds.filter(Boolean))];
    if (!payload.requestId || candidateIds.length === 0) {
      throw new Error('requestId and at least one candidateId are required');
    }
    if (!['SHORTLISTED', 'REJECTED', 'PENDING'].includes(payload.status)) {
      throw new Error('Invalid screening status');
    }

    const applications = await this.prisma.application.findMany({
      where: { requestId: payload.requestId, candidateId: { in: candidateIds } },
      select: { candidateId: true },
    });
    if (applications.length !== candidateIds.length) {
      throw new Error('Every selected candidate must belong to the campaign');
    }

    const action: TalentFeedbackAction =
      payload.status === 'SHORTLISTED'
        ? 'SHORTLIST'
        : payload.status === 'REJECTED'
          ? 'REJECT'
          : 'MARK_REVIEW';
    const updated = await this.prisma.$transaction(async (tx) => {
      const latestCvs = await tx.candidateCV.findMany({
        where: { candidateId: { in: candidateIds } },
        distinct: ['candidateId'],
        orderBy: { createdAt: 'desc' },
        select: { id: true, candidateId: true },
      });
      await Promise.all(
        latestCvs.map((cv) =>
          tx.candidateCV.update({
            where: { id: cv.id },
            data: { screeningStatus: payload.status },
          }),
        ),
      );
      await tx.application.updateMany({
        where: { requestId: payload.requestId, candidateId: { in: candidateIds } },
        data: {
          status:
            payload.status === 'SHORTLISTED'
              ? 'SCREENING'
              : payload.status === 'REJECTED'
                ? 'REJECTED'
                : 'SUBMITTED',
        },
      });
      const searchRun = await tx.talentSearchRun.findFirst({
        where: { requestId: payload.requestId, actorUserId: payload.actorUserId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, query: true },
      });
      if (searchRun) {
        await tx.talentSearchFeedback.createMany({
          data: candidateIds.map((candidateId) => ({
            searchRunId: searchRun.id,
            candidateId,
            actorUserId: payload.actorUserId,
            requestId: payload.requestId,
            action,
            query: searchRun.query,
            candidateSnapshot: {},
            metadata: {
              source: 'candidate_search_decision',
              actorRole: payload.actorRole,
              feedbackReason: payload.feedbackReason,
              feedbackNote: payload.feedbackNote?.trim().slice(0, 500),
            },
          })),
        });
      }
      return { updatedCandidateIds: candidateIds, status: payload.status };
    });

    return updated;
  }

  async exportTrainingTriplets(params: { requestId?: string; limit?: number }) {
    const positiveActions = [
      'VIEW_CV',
      'MARK_REVIEW',
      'SCHEDULE_INTERVIEW',
      'SHORTLIST',
      'INVITE',
      'HIRE',
    ];
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
        (item) =>
          item.searchRunId === positive.searchRunId && item.candidateId !== positive.candidateId,
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

  private async getVectorScores(query: string): Promise<Map<string, number>> {
    try {
      const embedding = await getQueryEmbedding(query);
      const vectorStr = embeddingToPgVector(embedding);
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT cv."candidate_id" AS "candidateId",
                MAX(1 - (ce.embedding <=> $1::vector)) AS similarity
         FROM cv_embeddings ce
         JOIN candidate_cvs cv ON cv.id = ce."cv_document_id"
         WHERE ce.embedding IS NOT NULL
         GROUP BY cv."candidate_id"`,
        vectorStr,
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
    const explicitSkills = this.extractSkillList(
      Array.isArray(skillRequirements.skills)
        ? skillRequirements.skills
        : skillRequirements.required,
    );
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

  async getQualityMetrics(params: { requestId?: string; limit?: number }) {
    const rows = await this.prisma.talentSearchFeedback.findMany({
      where: params.requestId ? { requestId: params.requestId } : undefined,
      select: { action: true, candidateId: true, searchRunId: true, overallScore: true, metadata: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.limit ?? 5000, 10000),
    });
    const impressions = rows.filter((row) => row.action === 'IMPRESSION');
    const decisions = rows.filter((row) => ['SHORTLIST', 'SCHEDULE_INTERVIEW', 'INVITE', 'HIRE', 'REJECT'].includes(row.action));
    const positiveKeys = new Set(
      decisions
        .filter((row) => ['SHORTLIST', 'SCHEDULE_INTERVIEW', 'INVITE', 'HIRE'].includes(row.action))
        .map((row) => `${row.searchRunId}:${row.candidateId}`),
    );
    const highConfidence = impressions.filter((row) => (row.overallScore ?? 0) >= 0.65);
    const reasons = new Map<string, number>();
    for (const row of decisions) {
      const reason = (row.metadata as { feedbackReason?: unknown } | null)?.feedbackReason;
      if (typeof reason === 'string' && reason) reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    }
    return {
      impressions: impressions.length,
      decisions: decisions.length,
      decisionCoverage: impressions.length ? this.roundScore(decisions.length / impressions.length) : 0,
      shortlistRate: impressions.length ? this.roundScore(decisions.filter((row) => row.action === 'SHORTLIST').length / impressions.length) : 0,
      interviewRate: impressions.length ? this.roundScore(decisions.filter((row) => ['SCHEDULE_INTERVIEW', 'INVITE'].includes(row.action)).length / impressions.length) : 0,
      hireRate: impressions.length ? this.roundScore(decisions.filter((row) => row.action === 'HIRE').length / impressions.length) : 0,
      highScorePrecision: highConfidence.length
        ? this.roundScore(highConfidence.filter((row) => positiveKeys.has(`${row.searchRunId}:${row.candidateId}`)).length / highConfidence.length)
        : 0,
      feedbackReasons: [...reasons.entries()].map(([reason, count]) => ({ reason, count })),
    };
  }

  async evaluateRanking(params: { requestId?: string; limit?: number }) {
    const rows = await this.prisma.talentSearchFeedback.findMany({
      where: params.requestId ? { requestId: params.requestId } : undefined,
      select: { action: true, candidateId: true, searchRunId: true, rank: true },
      orderBy: { createdAt: 'asc' },
      take: Math.min(params.limit ?? 10000, 20000),
    });
    const byRun = new Map<string, typeof rows>();
    for (const row of rows) byRun.set(row.searchRunId, [...(byRun.get(row.searchRunId) ?? []), row]);
    let evaluatedRuns = 0;
    let precisionAt5 = 0;
    let precisionAt10 = 0;
    let reciprocalRank = 0;
    for (const runRows of byRun.values()) {
      const positives = new Set(runRows.filter((row) => ['SHORTLIST', 'SCHEDULE_INTERVIEW', 'INVITE', 'HIRE'].includes(row.action)).map((row) => row.candidateId));
      const impressions = runRows.filter((row) => row.action === 'IMPRESSION' && row.rank).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
      if (!positives.size || !impressions.length) continue;
      evaluatedRuns += 1;
      precisionAt5 += impressions.slice(0, 5).filter((row) => positives.has(row.candidateId)).length / Math.min(5, impressions.length);
      precisionAt10 += impressions.slice(0, 10).filter((row) => positives.has(row.candidateId)).length / Math.min(10, impressions.length);
      const first = impressions.findIndex((row) => positives.has(row.candidateId));
      reciprocalRank += first >= 0 ? 1 / (first + 1) : 0;
    }
    return {
      evaluatedRuns,
      precisionAt5: evaluatedRuns ? this.roundScore(precisionAt5 / evaluatedRuns) : 0,
      precisionAt10: evaluatedRuns ? this.roundScore(precisionAt10 / evaluatedRuns) : 0,
      meanReciprocalRank: evaluatedRuns ? this.roundScore(reciprocalRank / evaluatedRuns) : 0,
    };
  }

  private async getFeedbackAdjustments(
    candidateIds: string[],
    requestId?: string,
  ): Promise<Map<string, FeedbackAdjustment>> {
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

      const baseWeight =
        FEEDBACK_ACTION_WEIGHTS[row.action as Exclude<TalentFeedbackAction, 'IMPRESSION'>] ?? 0;
      const scopeMultiplier = !requestId || row.requestId === requestId ? 1 : 0.35;
      const current = scores.get(row.candidateId) ?? 0;
      scores.set(row.candidateId, this.clamp(current + baseWeight * scopeMultiplier, -0.2, 0.2));
    }

    const sourceCandidateIds = [...scores.keys()];
    if (!sourceCandidateIds.length) return calculateFeedbackAdjustments(candidateIds, scores, []);
    try {
      const similarities = (await this.prisma.$queryRawUnsafe(
        `SELECT target_cv."candidate_id" AS "candidateId", source_cv."candidate_id" AS "sourceCandidateId",
                MAX(1 - (target_embedding.embedding <=> source_embedding.embedding)) AS similarity
         FROM cv_embeddings target_embedding
         JOIN candidate_cvs target_cv ON target_cv.id = target_embedding."cv_document_id"
         JOIN cv_embeddings source_embedding ON TRUE
         JOIN candidate_cvs source_cv ON source_cv.id = source_embedding."cv_document_id"
         WHERE target_cv."candidate_id" = ANY($1::uuid[])
           AND source_cv."candidate_id" = ANY($2::uuid[])
           AND target_cv."candidate_id" <> source_cv."candidate_id"
         GROUP BY target_cv."candidate_id", source_cv."candidate_id"`,
        candidateIds,
        sourceCandidateIds,
      )) as Array<{ candidateId: string; sourceCandidateId: string; similarity: number | string }>;
      return calculateFeedbackAdjustments(
        candidateIds,
        scores,
        similarities.map((row) => ({ ...row, similarity: Number(row.similarity) })),
      );
    } catch (error) {
      this.logger.warn(`Semantic feedback propagation unavailable: ${error instanceof Error ? error.message : String(error)}`);
      return calculateFeedbackAdjustments(candidateIds, scores, []);
    }
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

  private getDirectSkillCoverage(candidateSkills: string[], requiredSkills: string[]) {
    if (requiredSkills.length === 0) return 0;
    const normalizeSkill = (skill: string) => skill.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidateSkillSet = new Set(candidateSkills.map(normalizeSkill).filter(Boolean));
    const matchedCount = requiredSkills.filter((skill) =>
      candidateSkillSet.has(normalizeSkill(skill)),
    ).length;
    return this.roundScore(matchedCount / requiredSkills.length);
  }

  private getVectorSimilarityPenalty(vectorSimilarity: number) {
    if (vectorSimilarity >= 0.4) return 1;
    if (vectorSimilarity >= 0.25) return 0.7;
    if (vectorSimilarity > 0) return 0.4;
    return 0.25;
  }

  private getEvidenceRerankerAdjustment(params: {
    coverageScore: number;
    vectorSimilarity: number;
    gaps?: Array<{ severity: string }>;
  }) {
    const criticalGaps = params.gaps?.filter((gap) => gap.severity === 'CRITICAL').length ?? 0;
    const coverageSignal = params.coverageScore >= 0.8 ? 0.025 : params.coverageScore < 0.3 ? -0.02 : 0;
    const semanticSignal = params.vectorSimilarity >= 0.65 ? 0.015 : params.vectorSimilarity < 0.25 ? -0.015 : 0;
    return this.roundScore(this.clamp(coverageSignal + semanticSignal - Math.min(criticalGaps, 2) * 0.01, -0.05, 0.05));
  }

  private buildMatchExplanation(result: {
    overallScore: number;
    vectorScore: number;
    graphScore: number;
    coverageScore: number;
    vectorSimilarityPenalty?: number;
    feedbackScore?: number;
    directFeedbackScore?: number;
    semanticFeedbackScore?: number;
    rerankerScore?: number;
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
      result.vectorSimilarityPenalty && result.vectorSimilarityPenalty < 1
        ? `Low CV/JD similarity safeguard: score retained ${Math.round(result.vectorSimilarityPenalty * 100)}%`
        : '',
      result.feedbackScore
        ? `HR feedback adjustment: ${result.feedbackScore > 0 ? '+' : ''}${Math.round(result.feedbackScore * 100)}%`
        : '',
      result.semanticFeedbackScore
        ? `Similar-CV feedback (bounded): ${result.semanticFeedbackScore > 0 ? '+' : ''}${Math.round(result.semanticFeedbackScore * 100)}%`
        : '',
      result.rerankerScore
        ? `Evidence reranker: ${result.rerankerScore > 0 ? '+' : ''}${Math.round(result.rerankerScore * 100)}%`
        : '',
    ].filter(Boolean);

    return {
      assessment: this.humanizeReadiness(result.readinessLabel),
      scoreBand: `${Math.max(0, calibratedBand - 2)}-${Math.min(100, calibratedBand + 2)}%`,
      scoreDrivers,
      matchedSkills,
      gaps,
      note: 'Candidates in the same score band should be treated as comparable; review matched skills and gaps before making a decision.',
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
      directFeedbackScore: result.directFeedbackScore,
      semanticFeedbackScore: result.semanticFeedbackScore,
      rerankerScore: result.rerankerScore,
      latestCvId: result.latestCv?.id,
    };
  }

  private withPrefix(kind: 'query' | 'passage', text: string) {
    const trimmed = text.trim();
    if (/^(query|passage):/i.test(trimmed)) return trimmed;
    return `${kind}: ${trimmed}`;
  }
}
