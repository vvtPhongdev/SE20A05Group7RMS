#!/usr/bin/env python
"""Build RMS embedding triplets from JD and CV chunk CSV files.

Expected CSV columns:
  job_descriptions.csv: jd_id,text,skills
  cv_chunks.csv: cv_id,text,skills

`skills` is a comma-separated list. The script pairs JDs with CV chunks that
share skills as positives, and low-overlap chunks as negatives.
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class Row:
    row_id: str
    text: str
    skills: set[str]


SKILL_ALIASES = {
    "javascript": ["js", "ecmascript"],
    "typescript": ["ts"],
    "postgresql": ["postgres", "sql database"],
    "kubernetes": ["k8s"],
    "ci/cd": ["continuous integration", "deployment pipeline"],
    "machine learning": ["ml", "ai modeling"],
}


def normalize_skill(skill: str) -> str:
    return skill.strip().lower()


def load_rows(path: Path, id_column: str) -> list[Row]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {id_column, "text", "skills"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"{path} is missing columns: {', '.join(sorted(missing))}")

        rows: list[Row] = []
        for item in reader:
            text = (item["text"] or "").strip()
            if not text:
                continue
            skills = {normalize_skill(s) for s in (item["skills"] or "").split(",") if s.strip()}
            rows.append(Row(row_id=item[id_column].strip(), text=text, skills=skills))
        return rows


def augment_text(text: str, skills: Iterable[str], rng: random.Random) -> str:
    """Light augmentation: add aliases and reorder a skills clause."""
    selected_aliases: list[str] = []
    for skill in skills:
        aliases = SKILL_ALIASES.get(skill, [])
        if aliases and rng.random() < 0.35:
            selected_aliases.append(rng.choice(aliases))

    if not selected_aliases:
        return text

    suffixes = [
        "Related keywords: {aliases}.",
        "Also seen as: {aliases}.",
        "Equivalent skill terms include {aliases}.",
    ]
    return f"{text} {rng.choice(suffixes).format(aliases=', '.join(selected_aliases))}"


def overlap(a: set[str], b: set[str]) -> int:
    return len(a & b)


def build_triplets(jds: list[Row], cvs: list[Row], augment: int, seed: int) -> list[dict[str, str]]:
    rng = random.Random(seed)
    triplets: list[dict[str, str]] = []

    for jd in jds:
        positives = [cv for cv in cvs if overlap(jd.skills, cv.skills) > 0]
        negatives = [cv for cv in cvs if overlap(jd.skills, cv.skills) == 0]
        if not positives or not negatives:
            continue

        for positive in positives:
            negative = rng.choice(negatives)
            variants = max(1, augment)
            for _ in range(variants):
                anchor = augment_text(jd.text, jd.skills, rng) if augment > 1 else jd.text
                positive_text = augment_text(positive.text, positive.skills, rng) if augment > 1 else positive.text
                triplets.append(
                    {
                        "anchor": f"query: {anchor}",
                        "positive": f"passage: {positive_text}",
                        "negative": f"passage: {negative.text}",
                    }
                )

    rng.shuffle(triplets)
    return triplets


def write_jsonl(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--jobs", type=Path, default=Path("ml/data/raw/job_descriptions.csv"))
    parser.add_argument("--cvs", type=Path, default=Path("ml/data/raw/cv_chunks.csv"))
    parser.add_argument("--out", type=Path, default=Path("ml/data/triplets.train.jsonl"))
    parser.add_argument("--augment", type=int, default=2, help="Variants per positive pair")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    jds = load_rows(args.jobs, "jd_id")
    cvs = load_rows(args.cvs, "cv_id")
    triplets = build_triplets(jds, cvs, augment=args.augment, seed=args.seed)
    if not triplets:
        raise RuntimeError("No triplets generated. Check skill overlap and input CSV columns.")
    write_jsonl(args.out, triplets)
    print(f"Wrote {len(triplets)} triplets to {args.out}")


if __name__ == "__main__":
    main()
