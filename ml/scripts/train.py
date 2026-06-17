#!/usr/bin/env python
"""Train the RMS sentence embedding model with contrastive pairs.

Default base model: intfloat/multilingual-e5-small (384 dimensions), suitable
for mixed English/Vietnamese CV and recruitment text without changing pgvector.
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import torch
from sentence_transformers import InputExample, SentenceTransformer, evaluation, losses
from torch.utils.data import DataLoader


def read_triplets(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            item = json.loads(line)
            missing = {"anchor", "positive", "negative"} - set(item)
            if missing:
                raise ValueError(f"{path}:{line_no} missing fields: {', '.join(sorted(missing))}")
            rows.append(item)
    if not rows:
        raise ValueError(f"No training rows found in {path}")
    return rows


class LossLoggingCallback:
    def __init__(self) -> None:
        self.logger = logging.getLogger("rms-train")

    def __call__(self, score: float, epoch: int, steps: int) -> None:
        self.logger.info("eval_score=%.6f epoch=%s steps=%s", score, epoch, steps)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", type=Path, default=Path("ml/data/triplets.train.jsonl"))
    parser.add_argument("--dev", type=Path, default=Path("ml/data/triplets.dev.jsonl"))
    parser.add_argument("--output", type=Path, default=Path("ml/exported/rms-embedding-model"))
    parser.add_argument("--checkpoints", type=Path, default=Path("ml/checkpoints/rms-embedding-model"))
    parser.add_argument("--base-model", default="intfloat/multilingual-e5-small")
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--warmup-ratio", type=float, default=0.1)
    parser.add_argument("--checkpoint-steps", type=int, default=250)
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logger = logging.getLogger("rms-train")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cpu":
        logger.warning("CUDA is not available; training will run on CPU.")
    else:
        logger.info("Using CUDA device: %s", torch.cuda.get_device_name(0))

    train_rows = read_triplets(args.train)
    dev_rows = read_triplets(args.dev) if args.dev.exists() else []

    model = SentenceTransformer(args.base_model, device=device)
    train_examples = [InputExample(texts=[row["anchor"], row["positive"]]) for row in train_rows]
    train_loader = DataLoader(train_examples, shuffle=True, batch_size=args.batch_size, drop_last=True)
    train_loss = losses.MultipleNegativesRankingLoss(model)
    warmup_steps = int(len(train_loader) * args.epochs * args.warmup_ratio)

    evaluator = None
    if dev_rows:
        evaluator = evaluation.TripletEvaluator(
            anchors=[row["anchor"] for row in dev_rows],
            positives=[row["positive"] for row in dev_rows],
            negatives=[row["negative"] for row in dev_rows],
            name="rms-triplets-dev",
        )

    args.output.mkdir(parents=True, exist_ok=True)
    args.checkpoints.mkdir(parents=True, exist_ok=True)

    model.fit(
        train_objectives=[(train_loader, train_loss)],
        epochs=args.epochs,
        warmup_steps=warmup_steps,
        evaluator=evaluator,
        evaluation_steps=max(50, args.checkpoint_steps),
        output_path=str(args.output),
        checkpoint_path=str(args.checkpoints),
        checkpoint_save_steps=args.checkpoint_steps,
        checkpoint_save_total_limit=3,
        callback=LossLoggingCallback(),
        show_progress_bar=True,
    )

    # Validate embedding dimensionality before export. RMS pgvector is vector(384).
    embedding = model.encode(["query: validate rms embedding dimension"], normalize_embeddings=True)
    dim = int(embedding.shape[-1])
    if dim != 384:
        raise RuntimeError(
            f"Expected 384 dimensions for current pgvector schema, got {dim}. "
            "Choose a 384-dim base model or migrate cv_embeddings.embedding."
        )

    logger.info("Saved trained model to %s", args.output)


if __name__ == "__main__":
    main()
