#!/usr/bin/env bash
set -euo pipefail

python ml/scripts/convert.py \
  --model ml/exported/rms-embedding-model \
  --out packages/ai-models/rms-embedding-model \
  --opset 17
