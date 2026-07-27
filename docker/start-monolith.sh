#!/bin/sh

# Trap any exit/error signals to clean up background processes
trap 'kill $(jobs -p) 2>/dev/null' EXIT

MODEL_PATH="${WR_EMBEDDING_MODEL_PATH:-/app/packages/ai-models/rms-embedding-model}"
for model_file in config.json tokenizer.json tokenizer_config.json onnx/model.onnx; do
  if [ ! -s "$MODEL_PATH/$model_file" ]; then
    echo "❌ Local embedding model is incomplete: $MODEL_PATH/$model_file"
    exit 1
  fi
done

echo "Verifying local embedding model at $MODEL_PATH..."
node -e "require('@wr/ai').getQueryEmbedding('embedding model startup check').then((embedding) => { if (embedding.length !== 384) throw new Error('Expected 384 dimensions'); console.log('✅ Local embedding model loaded'); }).catch((error) => { console.error('❌ Failed to load local embedding model:', error); process.exit(1); });"

# Start internal services
echo "Starting Identity service on port 3010..."
node services/identity/dist/main.js &
PID_IDENTITY=$!

echo "Starting Recruiting service on port 3011..."
node services/recruiting/dist/main.js &
PID_RECRUITING=$!

echo "Starting Profiles service on port 3012..."
node services/profiles/dist/main.js &
PID_PROFILES=$!

echo "Starting Notification service on port 3013..."
node services/notification/dist/main.js &
PID_NOTIFICATION=$!

echo "Starting CV service on port 3014..."
node services/cv/dist/main.js &
PID_CV=$!

echo "Starting Interview service on port 3015..."
node services/interview/dist/main.js &
PID_INTERVIEW=$!

echo "Starting Worker service..."
node services/worker/dist/main.js &
PID_WORKER=$!

# Expose GATEWAY_PORT using Cloud Run's dynamic PORT variable (default to 8080)
export GATEWAY_PORT=${PORT:-8080}
echo "Starting API Gateway on port $GATEWAY_PORT..."
node services/gateway/dist/main.js &
PID_GATEWAY=$!

# Wait loop: if any process dies, exit the script to let Cloud Run restart the container
while true; do
  if ! kill -0 $PID_IDENTITY 2>/dev/null; then
    echo "❌ Identity service died."
    exit 1
  fi
  if ! kill -0 $PID_RECRUITING 2>/dev/null; then
    echo "❌ Recruiting service died."
    exit 1
  fi
  if ! kill -0 $PID_PROFILES 2>/dev/null; then
    echo "❌ Profiles service died."
    exit 1
  fi
  if ! kill -0 $PID_NOTIFICATION 2>/dev/null; then
    echo "❌ Notification service died."
    exit 1
  fi
  if ! kill -0 $PID_CV 2>/dev/null; then
    echo "❌ CV service died."
    exit 1
  fi
  if ! kill -0 $PID_INTERVIEW 2>/dev/null; then
    echo "❌ Interview service died."
    exit 1
  fi
  if ! kill -0 $PID_WORKER 2>/dev/null; then
    echo "❌ Worker service died."
    exit 1
  fi
  if ! kill -0 $PID_GATEWAY 2>/dev/null; then
    echo "❌ Gateway service died."
    exit 1
  fi
  sleep 5
done
