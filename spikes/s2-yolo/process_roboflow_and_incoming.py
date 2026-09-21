import os
import zipfile
import shutil
import csv
from PIL import Image
import pillow_heif

# Register HEIF opener with PIL
pillow_heif.register_heif_opener()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ZIP_PATH = os.path.join(BASE_DIR, "Sea Halal Logo.v3-latest-dataset.yolov8.zip")
ROBO_DIR = os.path.join(BASE_DIR, "roboflow_dataset")
PH_DIR = os.path.join(BASE_DIR, "philippines_roboflow_dataset")
INCOMING_DIR = os.path.join(BASE_DIR, "incoming_real_logos")
SAMPLES_DIR = os.path.join(BASE_DIR, "roboflow_ph_samples")

os.makedirs(ROBO_DIR, exist_ok=True)
os.makedirs(PH_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)

for split in ["train", "valid", "test"]:
    os.makedirs(os.path.join(PH_DIR, split, "images"), exist_ok=True)
    os.makedirs(os.path.join(PH_DIR, split, "labels"), exist_ok=True)

CLASS_NAMES = [
    'Brunei', 'Cambodia', 'Indonesia_new', 'Indonesia_old', 'Invalid_logo', 
    'Malaysia', 'Philippines1', 'Philippines2', 'Philippines3', 
    'Singapore', 'Thailand', 'Vietnam'
]

PH_CLASS_IDS = {6: 'Philippines1', 7: 'Philippines2', 8: 'Philippines3'}

print("=== Step 1: Extracting Roboflow Dataset ===")
with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    z.extractall(ROBO_DIR)
print("Unzipped into:", ROBO_DIR)

print("\n=== Step 2: Extracting Philippine Images & Building Evidence ===")
evidence_rows = []
ph_counts = {"Philippines1": 0, "Philippines2": 0, "Philippines3": 0}
overall_class_counts = {c: 0 for c in CLASS_NAMES}

sample_saved = {"Philippines1": 0, "Philippines2": 0, "Philippines3": 0}

for split in ["train", "valid", "test"]:
    split_labels_dir = os.path.join(ROBO_DIR, split, "labels")
    split_images_dir = os.path.join(ROBO_DIR, split, "images")
    if not os.path.exists(split_labels_dir):
        continue

    for label_file in os.listdir(split_labels_dir):
        if not label_file.endswith(".txt"):
            continue
        label_path = os.path.join(split_labels_dir, label_file)
        with open(label_path, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]

        has_ph = False
        ph_lines = []
        for line in lines:
            parts = line.split()
            if not parts:
                continue
            cls_id = int(parts[0])
            cname = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else str(cls_id)
            overall_class_counts[cname] = overall_class_counts.get(cname, 0) + 1

            if cls_id in PH_CLASS_IDS:
                has_ph = True
                ph_cname = PH_CLASS_IDS[cls_id]
                ph_counts[ph_cname] += 1
                ph_lines.append(line)
                
                # Image filename
                img_name = os.path.splitext(label_file)[0] + ".jpg"
                src_img_path = os.path.join(split_images_dir, img_name)
                
                evidence_rows.append({
                    "split": split,
                    "image_name": img_name,
                    "class_id": cls_id,
                    "class_name": ph_cname,
                    "bbox_x_center": parts[1] if len(parts) > 1 else "",
                    "bbox_y_center": parts[2] if len(parts) > 2 else "",
                    "bbox_width": parts[3] if len(parts) > 3 else "",
                    "bbox_height": parts[4] if len(parts) > 4 else ""
                })

        if has_ph:
            # Copy image to ph dataset
            img_name = os.path.splitext(label_file)[0] + ".jpg"
            src_img = os.path.join(split_images_dir, img_name)
            dst_img = os.path.join(PH_DIR, split, "images", img_name)
            if os.path.exists(src_img):
                shutil.copy2(src_img, dst_img)

                # Save sample crops for visual inspection
                for line in ph_lines:
                    parts = line.split()
                    cid = int(parts[0])
                    cname = PH_CLASS_IDS[cid]
                    if sample_saved[cname] < 3:
                        sample_saved[cname] += 1
                        shutil.copy2(src_img, os.path.join(SAMPLES_DIR, f"{cname}_sample_{sample_saved[cname]}.jpg"))

            # Write filtered PH label file
            dst_label = os.path.join(PH_DIR, split, "labels", label_file)
            with open(dst_label, "w", encoding="utf-8") as f:
                f.write("\n".join(ph_lines) + "\n")

# Save CSV Evidence
csv_path = os.path.join(PH_DIR, "DATASET_EVIDENCE.csv")
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["split", "image_name", "class_id", "class_name", "bbox_x_center", "bbox_y_center", "bbox_width", "bbox_height"])
    writer.writeheader()
    writer.writerows(evidence_rows)

# Save Markdown Evidence Summary
md_path = os.path.join(PH_DIR, "DATASET_EVIDENCE.md")
with open(md_path, "w", encoding="utf-8") as f:
    f.write("# Philippine Halal Logo Dataset Inventory & Thesis Evidence\n\n")
    f.write("### Total Verified Philippine Images & Bounding Boxes\n")
    f.write(f"- **Total Philippine Annotations:** {len(evidence_rows)}\n")
    f.write(f"- **Philippines1 (IDCP Old / Green Crest):** {ph_counts['Philippines1']} instances\n")
    f.write(f"- **Philippines2 (IDCP Standard / Circular):** {ph_counts['Philippines2']} instances\n")
    f.write(f"- **Philippines3 (IDCP / Philippine Halal Variant):** {ph_counts['Philippines3']} instances\n\n")
    f.write("### Dataset Split Breakdown\n")
    train_ph = sum(1 for r in evidence_rows if r['split'] == 'train')
    val_ph = sum(1 for r in evidence_rows if r['split'] == 'valid')
    test_ph = sum(1 for r in evidence_rows if r['split'] == 'test')
    f.write(f"- **Training Set:** {train_ph} images\n")
    f.write(f"- **Validation Set:** {val_ph} images\n")
    f.write(f"- **Testing Set:** {test_ph} images\n\n")
    f.write("### Full Class Distribution in Roboflow Dataset\n")
    for c, cnt in sorted(overall_class_counts.items(), key=lambda x: x[1], reverse=True):
        f.write(f"- **{c}:** {cnt}\n")

print("\nSaved Evidence CSV to:", csv_path)
print("Saved Evidence Markdown to:", md_path)

print("\n=== Step 3: Converting HEIC Images in incoming_real_logos ===")
heic_converted = 0
for f in os.listdir(INCOMING_DIR):
    if f.lower().endswith(".heic"):
        heic_path = os.path.join(INCOMING_DIR, f)
        jpg_name = os.path.splitext(f)[0] + ".jpg"
        jpg_path = os.path.join(INCOMING_DIR, jpg_name)
        try:
            with Image.open(heic_path) as img:
                img.convert("RGB").save(jpg_path, "JPEG", quality=95)
            os.remove(heic_path)
            heic_converted += 1
        except Exception as e:
            print(f"Failed to convert {f}: {e}")

print(f"Converted {heic_converted} HEIC images to standard JPG format.")
total_incoming = len([f for f in os.listdir(INCOMING_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
print(f"Total standard incoming photos ready: {total_incoming}")
