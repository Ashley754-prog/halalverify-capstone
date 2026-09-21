import os
import torch
from ultralytics import YOLO

def main():
    print("=== HalalVerify Capstone: Unified Halal Logo Training ===")
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Device: {torch.cuda.get_device_name(0)}")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_yaml = os.path.join(base_dir, "datasets", "unified_halal_dataset", "data.yaml")
    
    # Load pretrained YOLOv8-Nano
    model = YOLO("yolov8n.pt")

    # Train on RTX 4050 GPU (optimized for 6GB laptop VRAM)
    results = model.train(
        data=data_yaml,
        epochs=40,
        imgsz=640,
        batch=8,
        workers=2,
        device=0 if torch.cuda.is_available() else "cpu",
        project=os.path.join(base_dir, "runs"),
        name="unified_halal_yolov8n",
        exist_ok=True,
        pretrained=True,
        amp=True,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        warmup_epochs=3,
        mosaic=1.0,
        mixup=0.1,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        shear=2.0,
        perspective=0.0005,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        flipud=0.0,
        fliplr=0.5,
        save=True,
        save_period=-1,
        plots=True,
        verbose=True
    )

    print("\n=== Training Completed ===")
    best_weights = os.path.join(base_dir, "runs", "unified_halal_yolov8n", "weights", "best.pt")
    print(f"Best weights saved at: {best_weights}")

    # Evaluate on held-out test set
    print("\n=== Evaluating on Held-Out Test Set ===")
    test_metrics = model.val(data=data_yaml, split="test")
    print(f"Test mAP@50:    {test_metrics.box.map50:.4f}")
    print(f"Test mAP@50-95: {test_metrics.box.map:.4f}")
    print(f"Test Precision: {test_metrics.box.mp:.4f}")
    print(f"Test Recall:    {test_metrics.box.mr:.4f}")

if __name__ == "__main__":
    main()
