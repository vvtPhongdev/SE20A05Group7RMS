import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

/**
 * Service for searching candidate CVs by semantic similarity to a job description (JD).
 * Uses cosine similarity on 384‑dimensional embeddings stored in the `cv_embeddings` pgvector column.
 * Configurable similarity threshold and pagination are supported.
 */
@Injectable()
export class CvSearchService {
  private readonly logger = new Logger(CvSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search CVs that are similar to the supplied job description text.
   * @param params.jdText   The raw JD text (or any query string) to embed.
   * @param params.threshold Optional cosine similarity threshold (0‑1). Defaults to 0.5.
   * @param params.pagination Optional pagination settings.
   */
  async search(params: {
    jdText: string;
    threshold?: number;
    pagination?: { page: number; pageSize: number };
  }) {
    const { jdText, threshold = 0.5, pagination } = params;
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    this.logger.log(`🔎 Performing CV semantic search (page ${page}, size ${pageSize})`);

    // 1️⃣ Generate embedding for the job description using the same model as CV parsing.
    const { pipeline } = await import('@xenova/transformers' as string);
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(jdText, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data as Float32Array) as number[];
    const vectorStr = `[${embedding.join(',')}]`;

    // 2️⃣ Query pgvector similarity directly in the database.
    //    The `<->` operator returns cosine distance; we convert to similarity by `1 - distance`.
    const rawResults = await this.prisma.$queryRawUnsafe(
      `SELECT ce.id, ce."cvDocumentId", (1 - (ce.embedding <=> $1::vector)) AS similarity, cv.raw_text AS "rawText"
       FROM cv_embeddings ce
       JOIN candidate_cv cv ON cv.id = ce."cvDocumentId"
       WHERE (1 - (ce.embedding <=> $1::vector)) >= $2
       ORDER BY similarity DESC
       LIMIT $3 OFFSET $4`,
      vectorStr,
      threshold,
      pageSize,
      offset,
    ) as any[];

    // 3️⃣ Map results to a clean shape.
    const data = rawResults.map((r) => ({
      cvEmbeddingId: r.id,
      cvDocumentId: r.cvDocumentId,
      similarity: Number(r.similarity),
      rawText: r.rawText,
    }));

    const total = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) FROM cv_embeddings ce WHERE (1 - (ce.embedding <=> $1::vector)) >= $2`,
      vectorStr,
      threshold,
    );
    const totalCount = Number((total as any)[0].count);

    return {
      data,
      meta: {
        pagination: { page, pageSize, total: totalCount },
        threshold,
      },
    };
  }
}
