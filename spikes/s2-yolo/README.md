# Spike S2 — YOLOv8-Nano Halal Logo Detection Trial

**Purpose:** Produce a real mAP@50 number so the team can make an evidence-based decision
(contradiction C2): keep the logo-detection module promised in the paper's title, or rescope
to a verified-product catalog.

## Option A — Local GPU (this machine, already set up)

The dev machine has an RTX 4050 Laptop (6GB VRAM, CUDA 12.3 driver) — sufficient for
YOLOv8-Nano training. A dedicated venv with CUDA PyTorch lives at `spikes/s2-yolo/.venv`
(kept separate from the backend venv so the app environment is never at risk).

1. Go to https://universe.roboflow.com/ and search **"halal logo"** (the manuscript's
   reference [22] cites a Roboflow halal logo detection dataset). Pick a dataset that:
   - has ≥ 300 images,
   - has a single or few classes (e.g. `halal-logo`, or per-body classes like `IDCP`, `JAKIM`),
   - shows bounding-box annotations (not classification).
2. Create a free Roboflow account → open the dataset → **Export** → format **YOLOv8** →
   copy the "Download dataset with API key" snippet.
3. Install the download helper and fetch the dataset:
   ```powershell
   cd spikes/s2-yolo
   .venv\Scripts\python -m pip install roboflow
   # then run your Roboflow snippet (it downloads into a folder like halal-logo/1)
   ```
4. Run the trial (add `--epochs 30` for a quicker first pass):
   ```powershell
   .venv\Scripts\python train_halal_logo_yolov8n.py --data <path-to-data.yaml> --epochs 50
   ```
   (`ultralytics` is installed in the venv; training writes to `runs/spike_s2/`.)

**Sanity check before training** (should print `CUDA available: True`):
```powershell
.venv\Scripts\python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
```

## Option B — Google Colab (fallback if away from the GPU machine)

Same dataset steps as above, then: https://colab.research.google.com → new notebook →
Runtime → Change runtime type → **T4 GPU** → `!pip install ultralytics roboflow` →
paste the Roboflow snippet → upload `train_halal_logo_yolov8n.py` and run it.

**Budget:** ~2–4 hours of your time. On CPU-only, do not run this at all — training would
take days.

## Decision criteria (agree these with your adviser)

| Held-out mAP@50 | Recommendation |
|---|---|
| ≥ 0.70 | **GO** — keep logo detection; plan the full training pipeline (300–500 local images) |
| 0.40 – 0.70 | **BORDERLINE** — only continue if you can collect/annotate a strong local dataset; otherwise rescope |
| < 0.40 | **NO-GO** — rescope the paper: logo *matching* via product catalog + certificate OCR only |

Also record: dataset name/URL, image count, class count, epochs, train time, GPU used.

## What this spike does NOT decide

It only measures feasibility on an existing public dataset. Even on GO, the final model must be
retrained with locally collected Philippine packaging images (the 300–500 image plan in §1.5).
