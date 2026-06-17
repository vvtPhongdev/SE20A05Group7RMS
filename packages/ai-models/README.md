# Local RMS Embedding Models

Place the exported ONNX model here:

```txt
packages/ai-models/
  rms-embedding-model/
    config.json
    tokenizer.json
    tokenizer_config.json
    onnx/
      model.onnx
```

Build it with:

```bash
python -m venv ml/.venv
ml/.venv/Scripts/pip install -r ml/requirements.txt
ml/.venv/Scripts/python ml/scripts/train.py
ml/.venv/Scripts/python ml/scripts/convert.py
```

Runtime uses this directory by default. Override with:

```bash
WR_EMBEDDING_MODEL_PATH=/absolute/path/to/model
WR_EMBEDDING_MODEL_NAME=rms-embedding-model
```
