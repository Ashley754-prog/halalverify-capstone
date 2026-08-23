"""Spike S3: CER baseline for the HalalVerify OCR pipeline.

Measures character error rate of the real backend pipeline (app.ocr_service)
against manually typed ground-truth transcripts of product label photos.

Metrics per label:
  - CER              : character error rate over all readable text
  - E-code recall    : of the E-codes printed on the label, how many OCR found
  - Additive-name recall: of the known additive NAMES (per the Supabase
    additives table, matched with the same alias/word-boundary logic the
    production scanner uses) printed on the label, how many OCR preserved

Pairs whose ground-truth file is empty are skipped with a warning so an
incomplete transcription pass cannot poison the aggregate numbers.

Run from the backend/ directory so the app package imports resolve:

    .venv/Scripts/python ../spikes/s3-cer-baseline/cer_baseline.py \
        --images ../spikes/s3-cer-baseline/images \
        --ground-truth ../spikes/s3-cer-baseline/ground-truth
"""

import argparse
import base64
import csv
import re
import sys
from io import BytesIO
from pathlib import Path

# Allow importing the backend app package when run from anywhere under backend/.
BACKEND_ROOT = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.ocr_service import find_e_numbers, extract_text_from_image, normalize_text  # noqa: E402

from PIL import Image  # noqa: E402


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


def load_additive_term_patterns():
    """Compile word-boundary patterns for every additive name/alias the
    production scanner can match, sourced from the Supabase additives table.

    Returns [] (and prints a warning) when the database is unreachable so the
    CER and E-code metrics keep working offline.
    """
    try:
        from app.scan_service import build_additive_match_terms  # noqa: E402
        from app.supabase_client import supabase  # noqa: E402

        rows = supabase.table("additives").select("code,name").execute().data or []
    except Exception as exc:  # noqa: BLE001
        print(f"WARN could not load additives from Supabase ({exc}); "
              "additive-name recall will be 'not measured' for all files")
        return []

    patterns = {}
    for row in rows:
        for term in build_additive_match_terms(row.get("code") or "", row.get("name") or ""):
            normalized = normalize_text(term)
            if len(normalized) < 3 or normalized in patterns:
                continue
            patterns[normalized] = re.compile(rf"\b{re.escape(normalized)}\b")

    print(f"Loaded {len(patterns)} additive name/alias terms from database")
    return list(patterns.items())


def additive_name_recall(truth_norm: str, predicted_norm: str, term_patterns):
    """Recall of additive names present in truth that survive into prediction."""
    present = [term for term, pattern in term_patterns if pattern.search(truth_norm)]
    if not present:
        return None, 0, 0

    hits = sum(1 for term, pattern in term_patterns
               if term in present and pattern.search(predicted_norm))
    return round(hits / len(present), 3), hits, len(present)


def word_recall(truth_norm: str, predicted_norm: str):
    """Ingredient Capture Rate: fraction of truth words (len>=2) that appear
    anywhere in the prediction. Order-free and does NOT punish the OCR for
    reading extra label text outside the transcribed region."""
    truth_words = [w for w in re.findall(r"[a-z0-9]+", truth_norm) if len(w) >= 2]
    if not truth_words:
        return None, 0, 0

    predicted_words = set(re.findall(r"[a-z0-9]+", predicted_norm))
    hits = sum(1 for w in truth_words if w in predicted_words)
    return round(hits / len(truth_words), 3), hits, len(truth_words)


def letter_ratio(text: str) -> float:
    """Fraction of non-space characters that are letters; low values flag
    unusable captures (rotation/glare/noise) where OCR returns symbol soup."""
    compact = text.replace(" ", "")
    if not compact:
        return 0.0
    return round(sum(c.isalpha() for c in compact) / len(compact), 3)


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

    term_patterns = load_additive_term_patterns()

    rows = []
    skipped_empty = 0

    for image_file in image_files:
        truth_file = args.ground_truth / (image_file.stem + ".txt")
        if not truth_file.exists():
            print(f"SKIP {image_file.name}: no ground truth file")
            continue

        truth = truth_file.read_text(encoding="utf-8").strip()
        if not truth:
            print(f"SKIP {image_file.name}: ground truth is empty (not transcribed yet)")
            skipped_empty += 1
            continue

        predicted = extract_text_from_image(image_to_base64(image_file))
        cer = character_error_rate(predicted, truth)

        truth_codes = set(find_e_numbers(truth))
        predicted_codes = set(find_e_numbers(predicted))
        hits = len(truth_codes & predicted_codes)
        code_recall = round(hits / len(truth_codes), 3) if truth_codes else None

        name_recall, name_hits, name_total = additive_name_recall(
            normalize_text(truth), normalize_text(predicted), term_patterns,
        )
        name_cell = "n/a" if name_recall is None else name_recall

        capture_rate, word_hits, word_total = word_recall(
            normalize_text(truth), normalize_text(predicted),
        )
        capture_cell = "n/a" if capture_rate is None else capture_rate
        letters = letter_ratio(predicted)

        rows.append({
            "image": image_file.name,
            "cer": round(cer, 4),
            "truth_chars": len(truth),
            "predicted_chars": len(predicted),
            "frame_coverage": (
                round(len(truth) / len(predicted), 3) if predicted else 0
            ),
            "letter_ratio": letters,
            "capture_rate": capture_rate,
            "truth_e_codes": len(truth_codes),
            "predicted_e_codes": len(find_e_numbers(predicted)),
            "e_code_recall": code_recall,
            "additives_in_truth": name_total,
            "additive_name_recall": name_recall,
        })
        print(f"{image_file.name}: CER={cer:.4f}  "
              f"capture={capture_cell} ({word_hits}/{word_total})  "
              f"letters={letters}  "
              f"E-code recall={code_recall}  "
              f"Additive recall={name_cell}")

    if not rows:
        sys.exit("No paired image/ground-truth files found.")

    cers = [row["cer"] for row in rows]
    mean_cer = sum(cers) / len(cers)
    variance = sum((c - mean_cer) ** 2 for c in cers) / len(cers)

    name_recalls = [row["additive_name_recall"] for row in rows
                    if row["additive_name_recall"] is not None]
    mean_name_recall = (
        f"{sum(name_recalls) / len(name_recalls):.4f} over {len(name_recalls)} labels"
        if name_recalls else "not measurable (database unavailable or no matches)"
    )

    usable = [row for row in rows if row["letter_ratio"] >= 0.4]
    unusable_count = len(rows) - len(usable)
    captures = [row["capture_rate"] for row in usable
                if row["capture_rate"] is not None]
    mean_capture = (
        f"{sum(captures) / len(captures):.4f} over {len(captures)} usable labels"
        if captures else "not measurable"
    )
    fair_cers = [row["cer"] for row in usable if row["frame_coverage"] >= 0.6]
    mean_fair_cer = (
        f"{sum(fair_cers) / len(fair_cers):.4f} over {len(fair_cers)} labels"
        if fair_cers else "no fair-coverage labels"
    )

    csv_path = Path(__file__).parent / "cer_results.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    summary = [
        "### Spike S3 — OCR/CER baseline (REAL measurements)",
        "",
        f"- Labels evaluated: {len(rows)}"
        + (f" (skipped {skipped_empty} with empty ground truth)" if skipped_empty else ""),
        f"- Mean CER (all labels, sequence-based): {mean_cer:.4f}"
        " — inflated by wide shots; see capture rate below",
        f"- Usable captures (letter ratio >= 0.40): {len(usable)}"
        f" | flagged unusable: {unusable_count}",
        f"- Mean Ingredient Capture Rate: {mean_capture}",
        f"- Mean CER on fair-coverage usable labels: {mean_fair_cer}",
        f"- E-code recall: measured only where labels print E-codes (see CSV)",
        f"- Mean additive-name recall: {mean_name_recall}",
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
