import os
import cv2
import random
import glob
import shutil
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

REPO_ROOT = r"d:\Downloads\kenfiles\halalverify-capstone"
RAW_LOGOS_DIR = os.path.join(REPO_ROOT, "spikes", "s2-yolo", "raw_logos")
BG_DIR = os.path.join(REPO_ROOT, "spikes", "s6-packaging-validation")
DATASET_DIR = os.path.join(REPO_ROOT, "spikes", "s2-yolo", "datasets", "ph_halal_logos")

# Target Philippine Classes
CLASSES = [
    "IDCP",
    "BUSC",
    "BPCC",
    "MMHCB",
    "PUCOI",
    "AHIP",
    "HICCIP",
    "MinHA",
    "PRIME",
    "FIQHI",
    "HDIP",
    "MASLAHA",
    "Philcosed",
    "NCMF_General",
    "Invalid_Logo"
]

CLASS_TO_ID = {c: i for i, c in enumerate(CLASSES)}

def get_clean_logo_rgba(logo_path):
    img = Image.open(logo_path).convert("RGBA")
    arr = np.array(img)
    # If the background is near-white (> 215 across R,G,B), make transparent
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    white_mask = (r > 215) & (g > 215) & (b > 215)
    arr[:,:,3] = np.where(white_mask, 0, 255)
    return Image.fromarray(arr)

def get_background_images():
    extensions = ["*.jpg", "*.jpeg", "*.png"]
    bg_files = []
    for ext in extensions:
        bg_files.extend(glob.glob(os.path.join(BG_DIR, "**", ext), recursive=True))
    # Filter out small or corrupt images
    valid_bgs = []
    for f in bg_files:
        if "logo" in os.path.basename(f).lower() and "packaging" not in f.lower():
            continue
        try:
            with Image.open(f) as im:
                if im.size[0] >= 200 and im.size[1] >= 200:
                    valid_bgs.append(f)
        except Exception:
            pass
    return valid_bgs

def create_synthetic_background():
    # Fallback: create random packaging texture (paper, cardboard, plastic colors)
    colors = [
        (240, 235, 220), # craft paper
        (220, 220, 225), # light metallic
        (250, 250, 250), # clean white plastic
        (180, 40, 40),   # red packaging
        (30, 60, 140),   # blue packaging
        (230, 200, 100), # yellow packaging
        (40, 120, 60),   # green packaging
    ]
    bg_color = random.choice(colors)
    img = Image.new("RGB", (640, 640), bg_color)
    # Add subtle gradient or noise
    arr = np.array(img, dtype=np.int16)
    noise = np.random.randint(-15, 15, arr.shape, dtype=np.int16)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

def main():
    print("Preparing output dataset directories...")
    if os.path.exists(DATASET_DIR):
        shutil.rmtree(DATASET_DIR)
        
    for split in ["train", "valid", "test"]:
        os.makedirs(os.path.join(DATASET_DIR, split, "images"), exist_ok=True)
        os.makedirs(os.path.join(DATASET_DIR, split, "labels"), exist_ok=True)
        
    bg_paths = get_background_images()
    print(f"Found {len(bg_paths)} real packaging background images.")
    
    # Load and prepare clean logos
    raw_logo_map = {}
    for c in CLASSES:
        # Check primary file
        p = os.path.join(RAW_LOGOS_DIR, f"{c}.png")
        if os.path.exists(p):
            raw_logo_map[c] = [get_clean_logo_rgba(p)]
        if c == "Invalid_Logo":
            p2 = os.path.join(RAW_LOGOS_DIR, "Invalid_Logo_Generic.png")
            if os.path.exists(p2):
                if c not in raw_logo_map:
                    raw_logo_map[c] = []
                raw_logo_map[c].append(get_clean_logo_rgba(p2))

    print(f"Loaded logo templates for: {list(raw_logo_map.keys())}")

    # Generate samples per class
    # 40 samples per class: 28 train, 8 val, 4 test (Total ~600 images)
    samples_per_class = 40
    train_count = int(samples_per_class * 0.70)
    val_count = int(samples_per_class * 0.20)
    test_count = samples_per_class - train_count - val_count

    total_generated = 0

    for cls_name, logo_list in raw_logo_map.items():
        cls_id = CLASS_TO_ID[cls_name]
        print(f"Generating {samples_per_class} synthetic images for class: {cls_name} (id: {cls_id})...")
        
        for i in range(samples_per_class):
            if i < train_count:
                split = "train"
            elif i < train_count + val_count:
                split = "valid"
            else:
                split = "test"

            # 1. Choose background
            if bg_paths and random.random() > 0.25:
                bg_file = random.choice(bg_paths)
                try:
                    bg_img = Image.open(bg_file).convert("RGB")
                    # Crop/resize to 640x640
                    w, h = bg_img.size
                    if w > 640 and h > 640:
                        x1 = random.randint(0, w - 640)
                        y1 = random.randint(0, h - 640)
                        bg_img = bg_img.crop((x1, y1, x1 + 640, y1 + 640))
                    else:
                        bg_img = bg_img.resize((640, 640), Image.Resampling.LANCZOS)
                except Exception:
                    bg_img = create_synthetic_background()
            else:
                bg_img = create_synthetic_background()

            # 2. Pick and augment logo
            logo_rgba = random.choice(logo_list).copy()
            
            # Random scale: between 12% and 35% of the 640 canvas
            target_size = random.randint(80, 220)
            orig_w, orig_h = logo_rgba.size
            scale = target_size / max(orig_w, orig_h)
            new_w = max(20, int(orig_w * scale))
            new_h = max(20, int(orig_h * scale))
            logo_rgba = logo_rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Random rotation: -20 to +20 degrees
            angle = random.uniform(-20, 20)
            logo_rgba = logo_rgba.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)

            # Random brightness & contrast variation
            enh = ImageEnhance.Brightness(logo_rgba)
            logo_rgba = enh.enhance(random.uniform(0.8, 1.25))
            enh = ImageEnhance.Contrast(logo_rgba)
            logo_rgba = enh.enhance(random.uniform(0.85, 1.2))

            # Random slight blur (simulating camera focus)
            if random.random() > 0.6:
                logo_rgba = logo_rgba.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.2)))

            # 3. Paste onto background at random position
            lw, lh = logo_rgba.size
            if lw >= 640 or lh >= 640:
                continue

            max_x = 640 - lw
            max_y = 640 - lh
            pos_x = random.randint(0, max_x)
            pos_y = random.randint(0, max_y)

            bg_img.paste(logo_rgba, (pos_x, pos_y), mask=logo_rgba)

            # 4. Calculate YOLO normalized coordinates (x_center, y_center, width, height)
            x_center = (pos_x + lw / 2.0) / 640.0
            y_center = (pos_y + lh / 2.0) / 640.0
            norm_w = lw / 640.0
            norm_h = lh / 640.0

            # 5. Save image and label
            img_filename = f"{cls_name}_{i:03d}.jpg"
            label_filename = f"{cls_name}_{i:03d}.txt"

            img_out = os.path.join(DATASET_DIR, split, "images", img_filename)
            lbl_out = os.path.join(DATASET_DIR, split, "labels", label_filename)

            bg_img.save(img_out, quality=92)
            with open(lbl_out, "w") as lf:
                lf.write(f"{cls_id} {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}\n")

            total_generated += 1

    # 6. Generate data.yaml
    data_yaml_path = os.path.join(DATASET_DIR, "data.yaml")
    with open(data_yaml_path, "w") as f:
        f.write(f"path: {DATASET_DIR}\n")
        f.write("train: train/images\n")
        f.write("val: valid/images\n")
        f.write("test: test/images\n\n")
        f.write(f"nc: {len(CLASSES)}\n")
        f.write(f"names: {CLASSES}\n")

    print(f"\n=======================================================")
    print(f"SUCCESS! Generated {total_generated} labeled dataset images.")
    print(f"Dataset config written to: {data_yaml_path}")
    print(f"=======================================================")

if __name__ == "__main__":
    main()
