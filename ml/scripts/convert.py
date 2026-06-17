#!/usr/bin/env python
"""Export a trained RMS embedding model to a local Transformers.js ONNX layout."""

from __future__ import annotations

import argparse
import shutil
import tempfile
from pathlib import Path


REQUIRED_FILES = ["config.json", "tokenizer.json", "tokenizer_config.json"]


def copy_required_files(source: Path, target: Path) -> None:
    for name in REQUIRED_FILES:
        src = source / name
        if not src.exists():
            raise FileNotFoundError(f"Required model artifact not found: {src}")
        shutil.copy2(src, target / name)

    for optional in ["special_tokens_map.json", "vocab.txt", "sentencepiece.bpe.model"]:
        src = source / optional
        if src.exists():
            shutil.copy2(src, target / optional)


def export_with_optimum(model: Path, output: Path, opset: int) -> None:
    try:
        from optimum.exporters.onnx import main_export

        main_export(
            model_name_or_path=str(model),
            output=output,
            task="feature-extraction",
            opset=opset,
        )
        return
    except Exception as api_error:
        print(f"Optimum Python API export failed, falling back to optimum-cli: {api_error}")

    import subprocess

    cmd = [
        "optimum-cli",
        "export",
        "onnx",
        "--model",
        str(model),
        "--task",
        "feature-extraction",
        "--opset",
        str(opset),
        str(output),
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, default=Path("ml/exported/rms-embedding-model"))
    parser.add_argument("--out", type=Path, default=Path("packages/ai-models/rms-embedding-model"))
    parser.add_argument("--opset", type=int, default=17)
    args = parser.parse_args()

    if not args.model.exists():
        raise FileNotFoundError(f"Trained model directory not found: {args.model}")

    args.out.mkdir(parents=True, exist_ok=True)
    onnx_dir = args.out / "onnx"
    onnx_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        export_with_optimum(args.model, tmp_dir, args.opset)

        model_onnx = tmp_dir / "model.onnx"
        if not model_onnx.exists():
            candidates = list(tmp_dir.rglob("*.onnx"))
            if not candidates:
                raise FileNotFoundError(f"Optimum did not produce a model.onnx file in {tmp_dir}")
            model_onnx = candidates[0]

        shutil.copy2(model_onnx, onnx_dir / "model.onnx")

    copy_required_files(args.model, args.out)
    print(f"Exported local ONNX model to {args.out}")
    print("Expected runtime layout:")
    print(f"  {args.out / 'config.json'}")
    print(f"  {args.out / 'tokenizer.json'}")
    print(f"  {args.out / 'onnx' / 'model.onnx'}")


if __name__ == "__main__":
    main()
