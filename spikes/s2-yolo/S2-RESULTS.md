# Spike S2 — RESULT REPORT (training completed 2026-08-19)

## Configuration
- Dataset: Sea Halal Logo v3 (dania, Roboflow Universe, CC BY 4.0 — cite in manuscript)
- Classes (12): Brunei, Cambodia, Indonesia_new, Indonesia_old, Invalid_logo, Malaysia,
  Philippines1, Philippines2, Philippines3, Singapore, Thailand, Vietnam
- Splits used: train 1,869 / valid 77 / **test 78** (held-out results below)
- Model: YOLOv8-Nano (`yolov8n.pt`), 50 epochs, imgsz 640, batch 16
- Hardware: NVIDIA RTX 4050 Laptop (6GB) — total wall time ≈ 30 minutes
- Weights: `runs/detect/runs/spike_s2/halal_logo_yolov8n/weights/best.pt` (git-ignored;
  ultralytics nested the run folder under its default `detect/` project directory)
- Validation charts/batches: `runs/detect/val/`, `val-2/`, `val-3/` — use `val-3/`
  (latest) for confusion matrix, PR curve, and predicted batches

## Held-out test results

| Metric | Value |
|---|---|
| Precision | 0.9902 |
| Recall | 1.0000 |
| mAP@50 | 0.9950 |
| mAP@50-95 | 0.9273 |
| Inference speed | 7.5 ms/image (~130 FPS on this GPU) |

All 12 classes scored mAP@50 ≥ 0.995, including all three Philippines classes and
`Invalid_logo` (suspected/counterfeit marks).

## Decision: **GO** — keep the YOLOv8 logo-detection module (Objective 1, Variant A)

## ⚠️ Mandatory honesty caveat for the manuscript

A recall of 1.0 and mAP@50 of 0.995 across every class is *suspiciously perfect* — real-world
object detectors essentially never achieve this. Most likely cause: the public dataset's
train/test splits contain near-duplicates or augmented variants of the same source photos
(778 source images augmented to 2,024), so the model effectively "saw" near-identical versions
of test images during training (data leakage), and many web-scraped logo images are clean
close-ups rather than messy in-store packaging photos.

**Therefore: 0.995 is an upper-bound feasibility check, NOT a real-world performance estimate.**

- ✅ What this spike legitimately proves: the technique is feasible; halal logos (including
  Philippine and invalid/fake variants) are detectable and localizable; inference is fast
  enough for "real-time" claims on server hardware; retraining on local data is cheap (~30 min/run).
- ❌ What must NOT be done: citing 0.995 in the manuscript as the system's accuracy.
- 📌 Chapter 4 evaluation must use the team's own 300–500 locally collected photos with a
  clean train/valid/test split (split by capture session/product, never augmenting across splits).
  Expect realistic results in the ~0.6–0.9 mAP@50 range; that is normal and publishable.

## What to show the adviser
- `runs/detect/val-3/val_batch0_pred.jpg` … `val_batch2_pred.jpg` — real images with predicted
  bounding boxes (visual proof)
- `runs/detect/val-3/confusion_matrix.png` — class separation
- This report's caveat section (demonstrates evaluation maturity)

## Follow-ups unlocked
1. Objective 1 = Variant A (keep YOLOv8-Nano) → update `docs/paper-revisions-phase1.md` choice
2. Phase 3: collect local PH packaging photos, annotate (Roboflow), retrain, report real metrics
3. `Invalid_logo` class viability → supports the paper's counterfeit-authentication angle
