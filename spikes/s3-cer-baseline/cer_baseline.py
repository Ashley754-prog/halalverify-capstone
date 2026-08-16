"""Spike S3: CER baseline for the HalalVerify OCR pipeline.

Measures character error rate of the real backend pipeline (app.ocr_service)
against manually typed ground-truth transcripts of 30 product label photos.

Run from the backend/ directory so the app package imports resolve:

    .venv/Scripts/python ../spikes/s3-cer-baseline/cer_baseline.py \
        --images ../spikes/s3-cer-baseline/images \
        --ground-truth ../spikes/s3-cer-baseline/ground-truth
"""

import argparse
import csv
import sys
from pathlib import Path

# Allow importing the backend app package when run from anywhere under backend/.
BACKEND_ROOT = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.ocr_service import find_e_numbers, extract_text_from_image  # noqa: E402

from PIL import Image  # noqa: E402
import base64  # noqa: E402
from io import BytesIO  # noqa: E402


def levenshtein(a: str, b: str) -> int:
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        current = [i]
        for j, char_b in enumerate(b, start=1):
            current.append(min(
                previous[j] + 1,          # deletion
                current[j - 1] + 1,       # insertion
                previous[j - 1] + (char_a != char_b),  # substitution
            ))
        previous = current
    return previous[-1]


def character_error_rate(predicted: str, truth: str) -> float:
    if not truth:
        return 0.0 if not predicted else 1.0
    return levenshtein(predicted, truth) / len(truth)


def image_to_base64(path: Path) -> str:
    image = Image.open(path).convert("RGB")
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", required=True, type=Path)
    parser.add_argument("--ground-truth", required=True, type=Path)
    args = parser.parse_args()

    image_files = sorted(
        p for p in args.images.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )

    if not image_files:
        sys.exit(f"No images found in {args.images}")

    rows = []

    for image_file in image_files:
        truth_file = args.ground_truth / (image_file.stem + ".txt")
        if not truth_file.exists():
            print(f"SKIP {image_file.name}: no ground truth file")
            continue

        truth = truth_file.read_text(encoding="utf-8").strip()
        predicted = extract_text_from_image(image_to_base64(image_file))
        cer = character_error_rate(predicted, truth)

        truth_codes = set(find_e_numbers(truth))
        predicted_codes = set(find_e_numbers(predicted))
        hits = len(truth_codes & predicted_codes)
        code_recall = round(hits / len(truth_codes), 3) if truth_codes else None

        rows.append({
            "image": image_file.name,
            "cer": round(cer, 4),
            "truth_e_codes": len(truth_codes),
            "predicted_e_codes": len(predicted_codes),
            "e_code_recall": code_recall,
        })
        print(f"{image_file.name}: CER={cer:.4f}  E-code recall={code_recall}")

    if not rows:
        sys.exit("No paired image/ground-truth files found.")

    cers = [row["cer"] for row in rows]
    mean_cer = sum(cers) / len(cers)
    variance = sum((c - mean_cer) ** 2 for c in cers) / len(cers)

    csv_path = Path(__file__).parent / "cer_results.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    summary = [
        "### Spike S3 — OCR/CER baseline (REAL measurements)",
        "",
        f"- Labels evaluated: {len(rows)}",
        f"- Mean CER: {mean_cer:.4f} ({mean_cer * 100:.1f}%)",
        f"- Std CER: {variance ** 0.5:.4f}",
        f"- E-code recall (aggregate): "
        f"{sum(r['e_code_recall'] or 0 for r in rows)}/{len(rows)} files measured (see CSV)",
        "",
        "Per-file results: `spikes/s3-cer-baseline/cer_results.csv`",
    ]

    summary_path = Path(__file__).parent / "cer_summary.md"
    summary_path.write_text("\n".join(summary), encoding="utf-8")

    print("\n=== SPIKE S3 RESULT (record in Chapter 4) ===")
    print("\n".join(summary))
    print(f"\nWrote {csv_path} and {summary_path}")


if __name__ == "__main__":
    main()
