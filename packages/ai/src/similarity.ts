/**
 * Computes the Cosine Similarity between two numeric vectors.
 *
 * Formula: similarity = (A . B) / (||A|| * ||B||)
 *
 * @param vecA First vector (Float32Array or number array)
 * @param vecB Second vector (Float32Array or number array)
 * @returns Similarity score between -1.0 and 1.0 (or 0.0 for zero vectors)
 */
export function cosineSimilarity(
  vecA: Float32Array | number[],
  vecB: Float32Array | number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector length mismatch: vector A is ${vecA.length} dims, vector B is ${vecB.length} dims.`
    );
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] ?? 0;
    const b = vecB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0.0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
