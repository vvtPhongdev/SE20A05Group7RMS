import { createServer } from 'node:http';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_VERSION,
  getEmbedding,
  getQueryEmbedding,
} from '@wr/ai';

const port = Number(process.env.PORT || 8000);
const token = process.env.WR_EMBEDDING_API_TOKEN;
const maxBodyBytes = 1_000_000;

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) throw new Error('Request body is too large');
  }
  return JSON.parse(body);
}

function isAuthorized(request) {
  return !token || request.headers.authorization === `Bearer ${token}`;
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    return json(response, 200, { ok: true, modelVersion: EMBEDDING_MODEL_VERSION, dimensions: EMBEDDING_DIMENSIONS });
  }
  if (request.method !== 'POST' || request.url !== '/embed') {
    return json(response, 404, { message: 'Not found' });
  }
  if (!isAuthorized(request)) return json(response, 401, { message: 'Invalid embedding API token' });

  try {
    const payload = await readJson(request);
    if (!payload || typeof payload.text !== 'string' || !payload.text.trim()) {
      return json(response, 400, { message: 'text must be a non-empty string' });
    }
    if (payload.kind !== undefined && payload.kind !== 'query' && payload.kind !== 'passage') {
      return json(response, 400, { message: 'kind must be query or passage' });
    }
    const embedding = payload.kind === 'query'
      ? await getQueryEmbedding(payload.text)
      : await getEmbedding(payload.text);
    return json(response, 200, { embedding: Array.from(embedding), dimensions: embedding.length, model: EMBEDDING_MODEL_VERSION });
  } catch (error) {
    console.error('Embedding request failed', error);
    return json(response, 500, { message: 'Embedding generation failed' });
  }
});

async function start() {
  // Load the model in this long-lived process before accepting traffic.
  const embedding = await getQueryEmbedding('embedding service startup check');
  if (embedding.length !== EMBEDDING_DIMENSIONS) throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions`);
  server.listen(port, '0.0.0.0', () => console.log(`Embedding service listening on ${port}`));
}

start().catch((error) => {
  console.error('Embedding service failed to start', error);
  process.exit(1);
});
