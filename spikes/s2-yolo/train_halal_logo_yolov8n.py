"""Spike S2: minimal YOLOv8-Nano halal-logo training trial.

Run in Google Colab (T4 GPU) after downloading a Roboflow dataset in YOLOv8 format.
Usage:
    !pip install ultralytics roboflow
    # ... paste your Roboflow download snippet here ...
    !python train_halal_logo_yolov8n.py --data /path/to/data.yaml --epochs 50
"""

import argparse

from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to the Roboflow data.yaml")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    args = parser.parse_args()

    model = YOLO("yolov8n.pt")  # nano variant — matches the manuscript's claim
    model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=16,
        device=0,
        project="runs/spike_s2",
        name="halal_logo_yolov8n",
    )

    metrics = model.val(split="test")

    summary = {
        "precision": round(float(metrics.box.mp), 4),
        "recall": round(float(metrics.box.mr), 4),
        "map50": round(float(metrics.box.map50), 4),
        "map50_95": round(float(metrics.box.map), 4),
        "epochs": args.epochs,
        "imgsz": args.imgsz,
    }

    print("\n=== SPIKE S2 RESULT (record these in the decision memo) ===")
    for key, value in summary.items():
        print(f"{key}: {value}")

    verdict = (
        "GO (>= 0.70)" if summary["map50"] >= 0.70
        else "BORDERLINE (0.40-0.70)" if summary["map50"] >= 0.40
        else "NO-GO (< 0.40)"
    )
    print(f"recommendation: {verdict}")


if __name__ == "__main__":
    main()
