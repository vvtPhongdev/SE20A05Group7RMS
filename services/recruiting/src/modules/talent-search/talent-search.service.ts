import { Injectable, Logger } from '@nestjs/common';
import { skillGraph, MatchScorer, SearchExpander } from '@wr/ai';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class TalentSearchService {
  private readonly logger = new Logger(TalentSearchService.name);
  private readonly scorer = new MatchScorer(skillGraph);
  private readonly expander = new SearchExpander(skillGraph);

  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    query: string;
    filters?: Record<string, unknown>;
    pagination?: { page: number; pageSize: number };
  }) {
    const { query, filters, pagination } = params;
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;

    this.logger.log(`Talent search: "${query}" (page ${page})`);

    // Step 1: Expand the search query via skill graph
    const expanded = this.expander.expand(query);
    this.logger.debug(`Expanded "${query}" → ${expanded.expandedSkills.length} skills`);

    // Step 2: Find candidate profiles with capability models
    const candidates = await this.prisma.candidateProfile.findMany({
      include: {
        user: { select: { displayName: true } },
        cvDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: pageSize * 3, // Over-fetch for scoring then trim
      skip: 0,
    });

    // Step 3: Score each candidate
    const requiredSkills = expanded.resolvedSkill
      ? [expanded.resolvedSkill, ...expanded.expandedSkills.slice(0, 20)]
      : expanded.expandedSkills.slice(0, 20);

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
          vectorSimilarity: 0, // TODO: plug in pgvector similarity when embeddings are populated
        });

        return {
          ...result,
          displayName: candidate.user.displayName,
          headline: capabilities?.currentRole ?? null,
          skills: candidateSkills,
          latestCv: candidate.cvDocuments[0] ?? null,
        };
      })
      .filter(Boolean)
      .filter((r: any) => r.overallScore > 0.1)
      .sort((a: any, b: any) => b.overallScore - a.overallScore);

    // Step 4: Paginate
    const total = scoredResults.length;
    const paged = scoredResults.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paged,
      meta: {
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
}
