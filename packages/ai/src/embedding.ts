import { pipeline } from '@xenova/transformers';

let extractor: any = null;

/**
 * Generate a 384-dimensional vector embedding for a given text.
 * Uses the all-MiniLM-L6-v2 model executing locally.
 *
 * @param text The input text to embed
 * @returns A promise resolving to a Float32Array containing 384 dimensions
 */
export async function getEmbedding(text: string): Promise<Float32Array> {
  if (!extractor) {
    // Disable remote downloading of model files if needed, or rely on lazy download caching.
    // Xenova downloads and caches the model locally on first use.
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Extract raw float data from output
  const data = Array.from(output.data) as number[];
  if (data.length !== 384) {
    throw new Error(`Expected 384-dimensional embedding, but got ${data.length} dimensions.`);
  }

  return new Float32Array(data);
}
