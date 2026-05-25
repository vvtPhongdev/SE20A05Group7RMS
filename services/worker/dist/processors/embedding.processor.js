"use strict";
// ─── Embedding Processor ───────────────────────────────────────────
// BullMQ processor that generates vector embeddings for evidence records.
// Triggered when new evidence is extracted or updated.
//
// SETUP NOTE: This processor requires the `@xenova/transformers` package
// for self-hosted all-MiniLM-L6-v2 inference. Install it in the worker:
//   npm install @xenova/transformers
//
// The processor:
// 1. Receives evidence text from the queue
// 2. Generates a 384-dimensional embedding vector
// 3. Stores it in the evidence_embeddings table
// 4. The embedding is later used by the TalentSearchService for vector similarity
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEmbeddingJob = processEmbeddingJob;
const crypto_1 = require("crypto");
/**
 * Compute SHA-256 hash of text to detect changes.
 */
function textHash(text) {
    return (0, crypto_1.createHash)('sha256').update(text).digest('hex').slice(0, 16);
}
/**
 * Process an embedding job.
 * Call this from your BullMQ worker setup (e.g., in main.ts).
 *
 * @example
 * ```ts
 * import { Worker } from 'bullmq';
 * import { processEmbeddingJob } from './processors/embedding.processor';
 *
 * new Worker('embedding', async (job) => {
 *   await processEmbeddingJob(job.data, prisma);
 * }, { connection: redis });
 * ```
 */
async function processEmbeddingJob(payload, prisma) {
    const { evidenceRecordId, text } = payload;
    const hash = textHash(text);
    // Check if embedding already exists with same hash (skip if unchanged)
    const existing = await prisma.evidenceEmbedding.findUnique({
        where: { evidenceRecordId },
    });
    if (existing && existing.textHash === hash) {
        return; // Already up-to-date
    }
    // Generate embedding using transformers.js (lazy-loaded)
    // NOTE: The model is loaded on first call and cached in-process.
    const { pipeline } = await Promise.resolve(`${'@xenova/transformers'}`).then(s => __importStar(require(s)));
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);
    // Upsert the embedding record (metadata only — Prisma-managed columns)
    await prisma.evidenceEmbedding.upsert({
        where: { evidenceRecordId },
        update: { textHash: hash },
        create: {
            evidenceRecordId,
            textHash: hash,
            model: 'all-MiniLM-L6-v2',
        },
    });
    // Store the actual vector via raw SQL (pgvector column not in Prisma schema)
    const embeddingId = (await prisma.evidenceEmbedding.findUnique({
        where: { evidenceRecordId },
        select: { id: true },
    })).id;
    const vectorStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(`UPDATE evidence_embeddings SET embedding = $1::vector WHERE id = $2`, vectorStr, embeddingId);
}
//# sourceMappingURL=embedding.processor.js.map