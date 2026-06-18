# RMS Custom Embedding Training

Default base model: `intfloat/multilingual-e5-small`.

Why this default:

- works for mixed English/Vietnamese CV and JD text
- outputs 384-dimensional vectors
- fits the current `pgvector vector(384)` schema

## 1. Prepare Triplets

Edit:

```txt
ml/data/raw/job_descriptions.csv
ml/data/raw/cv_chunks.csv
```

Generate triplets:

```bash
python ml/scripts/build_triplets.py \
  --jobs ml/data/raw/job_descriptions.csv \
  --cvs ml/data/raw/cv_chunks.csv \
  --out ml/data/triplets.train.jsonl \
  --augment 2
```

## 2. Train

```bash
python -m venv ml/.venv
ml/.venv/Scripts/pip install -r ml/requirements.txt
ml/.venv/Scripts/python ml/scripts/train.py
```

CPU fallback is automatic when CUDA is not available.

## 3. Export ONNX

```bash
ml/.venv/Scripts/python ml/scripts/convert.py \
  --model ml/exported/rms-embedding-model \
  --out packages/ai-models/rms-embedding-model
```

## 4. Runtime

Node.js loads the model locally through `@wr/ai`:

```txt
packages/ai-models/rms-embedding-model/
  config.json
  tokenizer.json
  tokenizer_config.json
  onnx/model.onnx
```

Override path:

```bash
WR_EMBEDDING_MODEL_PATH=/absolute/path/to/rms-embedding-model
```

Runtime prefixes are handled in `@wr/ai`:

- CV chunks use `passage: ...`
- search/JD text uses `query: ...`

## 5. Train on Google Colab

Use `ml/rms_embedding_colab.ipynb` when you want GPU training through Colab
or a Colab Extension.

Flow:

```txt
Open notebook in Colab
> Runtime > Change runtime type > T4 GPU
> set REPO_URL or PROJECT_DIR
> optionally upload stronger job_descriptions.csv and cv_chunks.csv
> build triplets
> train
> export ONNX
> download rms-embedding-model.zip
```

After download, extract the zip and place the generated folder at:

```txt
packages/ai-models/rms-embedding-model
```

Then restart the worker/recruiting services and regenerate CV embeddings so the
database vectors use the new model.

## 6. Run Embeddings on Colab Runtime

For development demos, Colab can host the embedding model behind an HTTP tunnel.
Set `WR_EMBEDDING_API_URL` locally to use this remote runtime. If the variable is
empty, the app uses the local ONNX model.

In Colab:

```bash
pip install -r ml/requirements.txt
python ml/scripts/colab_embedding_server.py \
  --model intfloat/multilingual-e5-small \
  --token rms-dev-token
```

Expose port `8000` with a tunnel, for example cloudflared:

```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://127.0.0.1:8000
```

Then set local `.env`:

```bash
WR_EMBEDDING_API_URL=https://your-tunnel.trycloudflare.com
WR_EMBEDDING_API_TOKEN=rms-dev-token
```

Restart `recruiting` and `worker`. New searches and regenerated CV embeddings
will call the Colab runtime through `/embed`.
