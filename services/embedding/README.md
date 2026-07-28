# RMS Embedding Service

This deploys the ONNX embedding model independently from the API monolith. It loads the quantized model once at startup and exposes:

- `GET /health`
- `POST /embed` with `{ "text": "...", "kind": "query" | "passage" }`

## Deploy

1. Choose an unused Fly app name in `fly.embedding.toml`.
2. Create and set the shared secret:

   ```bash
   fly apps create se20a05-group7-rms-embedding
   fly secrets set WR_EMBEDDING_API_TOKEN=<generate-a-long-random-token> --app se20a05-group7-rms-embedding
   fly deploy --config fly.embedding.toml
   ```

3. Set these secrets on the API monolith, then deploy it:

   ```bash
   fly secrets set WR_EMBEDDING_API_URL=https://se20a05-group7-rms-embedding.fly.dev WR_EMBEDDING_API_TOKEN=<same-token> WR_EMBEDDING_TIMEOUT_MS=8000 --app se20a05-group7-rms
   fly deploy
   ```

The recruiting service falls back to graph-only search if the embedding service times out or returns an error.
