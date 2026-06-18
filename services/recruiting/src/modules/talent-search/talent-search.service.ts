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

@Injectable()
export class TalentSearchService {
  private readonly logger = new Logger(TalentSearchService.name);
  private readonly scorer = new MatchScorer(skillGraph);
  private readonly expander = new SearchExpander(skillGraph);

  constructor(private readonly prisma: PrismaService) { }

  async search(params: {
    query: string;
    filters?: Record<string, unknown>;
    pagination?: { page: number; pageSize: number };
    actorUserId?: string;
    actorRole?: string;
  }) {
    const { query, filters, pagination, actorUserId, actorRole } = params;
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const requestId = typeof filters?.requestId === 'string' ? filters.requestId : undefined;

    this.logger.log(`Talent search: "${query}" (page ${page})`);

    // Step 1: Expand the search query via skill graph
    const expanded = this.expander.expand(query);
    this.logger.debug(`Expanded "${query}" → ${expanded.expandedSkills.length} skills`);

    // Step 2: Find candidate profiles with capability models
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
      take: pageSize * 3, // Over-fetch for scoring then trim
      skip: 0,
    });

    // Step 3: Score each candidate
    const requiredSkills = expanded.resolvedSkill
      ? [expanded.resolvedSkill, ...expanded.expandedSkills.slice(0, 20)]
      : expanded.expandedSkills.slice(0, 20);
    const vectorScores = await this.getVectorScores(query, requestId);

    const scoredResults = candidates
      .map((candidate: any) => {
        // Extract skills from the structured data JSONB
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
        if (capabilities?.visibility === 'PRIVATE' && filters?.visibility !== 'PRIVATE') {
          return null;
        }

        const result = this.scorer.scoreCandidate({
          candidateProfileId: candidate.id,
          candidateSkills,
          requiredSkills,
          vectorSimilarity: vectorScores.get(candidate.id) ?? 0,
        });

        return {
          ...result,
          displayName: candidate.user.displayName,
          headline: capabilities?.currentRole ?? null,
          skills: candidateSkills,
          latestCv: candidate.cvDocuments[0] ?? null,
          latestInterview: candidate.interviews?.[0] ?? null,
          hasInterviewInvite: Boolean(candidate.interviews?.length),
        };
      })
      .filter(Boolean)
      .filter((r: any) => r.overallScore > 0.1)
      .sort((a: any, b: any) => b.overallScore - a.overallScore);

    // Step 4: Paginate
    const total = scoredResults.length;
    const paged = scoredResults.slice((page - 1) * pageSize, page * pageSize);
    const searchRun = await this.prisma.talentSearchRun.create({
      data: {
        actorUserId,
        actorRole,
        requestId,
        query,
        filters: (filters ?? {}) as any,
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
          query,
          candidateSnapshot: this.toCandidateSnapshot(result) as any,
          metadata: { page, pageSize, actorRole } as any,
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

  private toCandidateSnapshot(result: any) {
    return {
      displayName: result.displayName,
      headline: result.headline,
      skills: result.skills,
      readinessLabel: result.readinessLabel,
      latestCvId: result.latestCv?.id,
    };
  }

  private withPrefix(kind: 'query' | 'passage', text: string) {
    const trimmed = text.trim();
    if (/^(query|passage):/i.test(trimmed)) return trimmed;
    return `${kind}: ${trimmed}`;
  }
}
