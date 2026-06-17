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
