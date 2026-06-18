#!/usr/bin/env python
"""Serve RMS embeddings from a Google Colab GPU runtime.

Run this in Colab after installing ml/requirements.txt, then expose port 8000
with a tunnel such as cloudflared. Local Node services can call /embed by
setting WR_EMBEDDING_API_URL.
"""

from __future__ import annotations

import argparse
import os
from typing import Literal

import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


EMBEDDING_DIMENSIONS = 384


class EmbedRequest(BaseModel):
    text: str = Field(min_length=1)
    kind: Literal["query", "passage"] = "passage"


class EmbedResponse(BaseModel):
    embedding: list[float]
    dimensions: int
    model: str
    device: str


def normalize_text(text: str, kind: str) -> str:
    trimmed = text.strip()
    if trimmed.lower().startswith(("query:", "passage:")):
        return trimmed
    return f"{kind}: {trimmed}"


def create_app(model_name_or_path: str, token: str | None) -> FastAPI:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = SentenceTransformer(model_name_or_path, device=device)
    app = FastAPI(title="RMS Embedding Cloud Runtime")

    def require_token(authorization: str | None = Header(default=None)) -> None:
        if not token:
            return
        expected = f"Bearer {token}"
        if authorization != expected:
            raise HTTPException(status_code=401, detail="Invalid embedding API token")

    @app.get("/health")
    def health() -> dict[str, str | int | bool]:
        return {
            "ok": True,
            "model": model_name_or_path,
            "device": device,
            "cuda": torch.cuda.is_available(),
            "dimensions": EMBEDDING_DIMENSIONS,
        }

    @app.post("/embed", response_model=EmbedResponse, dependencies=[Depends(require_token)])
    def embed(request: EmbedRequest) -> EmbedResponse:
        vector = model.encode(
            [normalize_text(request.text, request.kind)],
            normalize_embeddings=True,
        )[0]
        values = [float(item) for item in vector.tolist()]
        if len(values) != EMBEDDING_DIMENSIONS:
            raise HTTPException(
                status_code=500,
                detail=f"Expected {EMBEDDING_DIMENSIONS} dimensions, got {len(values)}",
            )
        return EmbedResponse(
            embedding=values,
            dimensions=len(values),
            model=model_name_or_path,
            device=device,
        )

    return app


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model",
        default=os.environ.get("WR_COLAB_EMBEDDING_MODEL", "intfloat/multilingual-e5-small"),
        help="Hugging Face model id or local trained model path",
    )
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument(
        "--token",
        default=os.environ.get("WR_EMBEDDING_API_TOKEN"),
        help="Optional bearer token required by /embed",
    )
    args = parser.parse_args()

    import uvicorn

    uvicorn.run(create_app(args.model, args.token), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
