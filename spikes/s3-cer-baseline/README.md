# Spike S3 — OCR / CER Baseline Protocol

**Purpose:** Produce the first *real* performance number for Chapter 4: the Character Error
Rate (CER) of the actual HalalVerify OCR pipeline on real Philippine product labels.
This replaces the fabricated "CER 4.2%" currently on the Dashboard.

## Photo protocol (30 labels)

1. Buy/borrow 30 packaged grocery products from local stores (mix of sizes, brands, packaging types).
2. For each, photograph the **full ingredient panel**:
   - flat against a surface, camera parallel to the label
   - good even lighting, no glare, no shadow
   - label fills most of the frame, in focus
3. Save as `images/01.jpg` … `images/30.jpg` (keep original resolution).
4. For each photo, type the ingredient-panel text **exactly as printed** into
   `ground-truth/01.txt` … `ground-truth/30.txt` (UTF-8, plain text).
   - Include E-numbers exactly as printed (e.g. `E120`, `E 120`, `E-120`).
   - Case-sensitive: type what is printed.
5. Aim for ≥ 3 photos per difficult condition too (angle, low light, curved/wrinkled label) —
   note them in `conditions.csv` (columns: `image,condition` where condition is
   `flat|angle|low_light|wrinkled`). The paper's RQ6 (reliability under varying image
   conditions) needs this split.

## Running the script

The script reuses the exact backend preprocessing (upscale, grayscale, contrast, sharpen,
dual-pass OCR) by importing `app.ocr_service`, so the number measures the shipped pipeline:

```bash
cd backend
.venv/Scripts/python ../spikes/s3-cer-baseline/cer_baseline.py \
    --images ../spikes/s3-cer-baseline/images \
    --ground-truth ../spikes/s3-cer-baseline/ground-truth
```

(EasyOCR downloads its model on first run — needs internet once.)

## Output

- Per-file CER + mean CER ± std, printed and saved to `cer_results.csv` and `cer_summary.md`.
- Paste `cer_summary.md` into the Chapter 4 evaluation section as the pre-tuning baseline.

## Interpreting CER

CER = edit distance / ground-truth length. Lower is better; 0 is perfect.
- ≤ 0.10 (≤10%): good for rule-based E-number matching
- 0.10–0.25: expect missed/garbled codes; E-number regex will need the OCR confusion fixes
- \> 0.25: retake photos / revisit preprocessing before citing any number
