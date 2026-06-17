import { existsSync } from 'fs';
import { join, resolve } from 'path';

export const EMBEDDING_DIMENSIONS = 384;
export const EMBEDDING_MODEL_NAME = process.env.WR_EMBEDDING_MODEL_NAME || 'rms-embedding-model';
export const EMBEDDING_MODEL_VERSION = process.env.WR_EMBEDDING_MODEL_VERSION || 'rms-custom-e5-small-v1';

type FeatureExtractor = (text: string, options: { pooling: 'mean'; normalize: boolean }) => Promise<{
  data: Float32Array | number[];
}>;

export type EmbeddingInputKind = 'query' | 'passage';

let extractor: FeatureExtractor | null = null;

function findRepoModelRoot(): string {
  if (process.env.WR_EMBEDDING_MODEL_PATH) {
    return resolve(process.env.WR_EMBEDDING_MODEL_PATH);
  }

  let current = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(current, 'packages', 'ai-models', EMBEDDING_MODEL_NAME);
    if (existsSync(candidate)) return candidate;

    const parent = resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }

  return resolve(process.cwd(), 'packages', 'ai-models', EMBEDDING_MODEL_NAME);
}

function assertLocalModel(modelPath: string): void {
  const required = [
    join(modelPath, 'config.json'),
    join(modelPath, 'tokenizer.json'),
    join(modelPath, 'tokenizer_config.json'),
    join(modelPath, 'onnx', 'model.onnx'),
  ];
  const missing = required.filter((file) => !existsSync(file));
  if (missing.length > 0) {
    throw new Error(
      [
        `Local embedding model is incomplete at ${modelPath}.`,
        `Missing: ${missing.join(', ')}`,
        'Build it with: python ml/scripts/train.py && python ml/scripts/convert.py',
      ].join(' '),
    );
  }
}

async function loadExtractor(): Promise<FeatureExtractor> {
  if (extractor) return extractor;

  const modelPath = findRepoModelRoot();
  assertLocalModel(modelPath);

  const modelRoot = resolve(modelPath, '..');
  const modelName = modelPath.split(/[\\/]/).pop() || EMBEDDING_MODEL_NAME;
  const transformers = await import('@xenova/transformers');
  transformers.env.allowRemoteModels = false;
  transformers.env.allowLocalModels = true;
  transformers.env.localModelPath = modelRoot;

  extractor = (await transformers.pipeline('feature-extraction', modelName, {
    local_files_only: true,
  } as any)) as FeatureExtractor;

  return extractor;
}

/**
 * Generate a normalized 384-dimensional RMS embedding from the local ONNX model.
 */
export async function getEmbedding(text: string): Promise<Float32Array> {
  if (!text.trim()) {
    throw new Error('Cannot generate embedding for empty text.');
  }

  const localExtractor = await loadExtractor();
  const output = await localExtractor(normalizeEmbeddingInput(text, 'passage'), {
    pooling: 'mean',
    normalize: true,
  });

  const data = Array.from(output.data) as number[];
  if (data.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS}-dimensional embedding, got ${data.length}. ` +
        'Keep the current pgvector schema in sync with the exported model.',
    );
  }

  return new Float32Array(data);
}

export async function getQueryEmbedding(text: string): Promise<Float32Array> {
  if (!text.trim()) {
    throw new Error('Cannot generate embedding for empty query.');
  }
  const localExtractor = await loadExtractor();
  const output = await localExtractor(normalizeEmbeddingInput(text, 'query'), {
    pooling: 'mean',
    normalize: true,
  });
  const data = Array.from(output.data) as number[];
  if (data.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS}-dimensional query embedding, got ${data.length}.`);
  }
  return new Float32Array(data);
}

function normalizeEmbeddingInput(text: string, kind: EmbeddingInputKind): string {
  const trimmed = text.trim();
  if (/^(query|passage):/i.test(trimmed)) return trimmed;
  return `${kind}: ${trimmed}`;
}

export function embeddingToPgVector(embedding: ArrayLike<number>): string {
  return `[${Array.from(embedding).join(',')}]`;
}
