import os
import shutil
from collections import Counter
import yaml

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROBO_DIR = os.path.join(BASE_DIR, "roboflow_dataset")
PH_SYNTH_DIR = os.path.join(BASE_DIR, "datasets", "ph_halal_logos")
OUTPUT_DIR = os.path.join(BASE_DIR, "datasets", "unified_halal_dataset")

UNIFIED_CLASSES = [
    'IDCP',                # 0
    'HDIP',                # 1
    'National_Halal_Logo', # 2
    'BUSC',                # 3
    'BPCC',                # 4
    'MMHCB',               # 5
    'PUCOI',               # 6
    'AHIP',                # 7
    'HICCIP',              # 8
    'MinHA',               # 9
    'PRIME',               # 10
    'FIQHI',               # 11
    'MASLAHA',             # 12
    'Philcosed',           # 13
    'NCMF_General',        # 14
    'Thailand_CICOT',      # 15
    'Malaysia_JAKIM',      # 16
    'Indonesia_BPJPH',     # 17
    'Invalid_Logo'         # 18
]

CLASS_TO_ID = {name: idx for idx, name in enumerate(UNIFIED_CLASSES)}

# Roboflow classes:
# ['Brunei', 'Cambodia', 'Indonesia_new', 'Indonesia_old', 'Invalid_logo', 'Malaysia', 'Philippines1', 'Philippines2', 'Philippines3', 'Singapore', 'Thailand', 'Vietnam']
ROBO_SOURCE_CLASSES = [
    'Brunei', 'Cambodia', 'Indonesia_new', 'Indonesia_old', 'Invalid_logo', 
    'Malaysia', 'Philippines1', 'Philippines2', 'Philippines3', 
    'Singapore', 'Thailand', 'Vietnam'
]

ROBO_MAPPING = {
    'Philippines1': 'National_Halal_Logo',
    'Philippines2': 'IDCP',
    'Philippines3': 'HDIP',
    'Thailand': 'Thailand_CICOT',
    'Malaysia': 'Malaysia_JAKIM',
    'Indonesia_new': 'Indonesia_BPJPH',
    'Indonesia_old': 'Indonesia_BPJPH',
    'Invalid_logo': 'Invalid_Logo'
}

# Synthetic dataset classes:
# ['IDCP', 'BUSC', 'BPCC', 'MMHCB', 'PUCOI', 'AHIP', 'HICCIP', 'MinHA', 'PRIME', 'FIQHI', 'HDIP', 'MASLAHA', 'Philcosed', 'NCMF_General', 'Invalid_Logo']
SYNTH_SOURCE_CLASSES = [
    'IDCP', 'BUSC', 'BPCC', 'MMHCB', 'PUCOI', 'AHIP', 'HICCIP', 'MinHA', 
    'PRIME', 'FIQHI', 'HDIP', 'MASLAHA', 'Philcosed', 'NCMF_General', 'Invalid_Logo'
]

# Reset output directory
if os.path.exists(OUTPUT_DIR):
    shutil.rmtree(OUTPUT_DIR)

for split in ['train', 'valid', 'test']:
    os.makedirs(os.path.join(OUTPUT_DIR, split, 'images'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, split, 'labels'), exist_ok=True)

class_counter = Counter()
split_counter = Counter()

print("=== Merging Roboflow Dataset ===")
for split in ['train', 'valid', 'test']:
    lbl_dir = os.path.join(ROBO_DIR, split, 'labels')
    img_dir = os.path.join(ROBO_DIR, split, 'images')
    if not os.path.exists(lbl_dir):
        continue

    for lbl_file in os.listdir(lbl_dir):
        if not lbl_file.endswith('.txt'):
            continue
        with open(os.path.join(lbl_dir, lbl_file), 'r', encoding='utf-8') as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]

        remapped_lines = []
        for line in lines:
            parts = line.split()
            if not parts:
                continue
            src_cls_id = int(parts[0])
            if src_cls_id < len(ROBO_SOURCE_CLASSES):
                src_cls_name = ROBO_SOURCE_CLASSES[src_cls_id]
                if src_cls_name in ROBO_MAPPING:
                    target_name = ROBO_MAPPING[src_cls_name]
                    target_id = CLASS_TO_ID[target_name]
                    remapped_lines.append(f"{target_id} " + " ".join(parts[1:]))
                    class_counter[target_name] += 1

        if remapped_lines:
            # Find matching image
            base_name = os.path.splitext(lbl_file)[0]
            # Roboflow images are usually .jpg
            src_img = None
            for ext in ['.jpg', '.jpeg', '.png']:
                candidate = os.path.join(img_dir, base_name + ext)
                if os.path.exists(candidate):
                    src_img = candidate
                    break
            
            if src_img:
                dest_name = f"rf_{split}_{lbl_file}"
                dest_img_name = f"rf_{split}_{os.path.basename(src_img)}"
                
                # Copy image & write label
                shutil.copy2(src_img, os.path.join(OUTPUT_DIR, split, 'images', dest_img_name))
                with open(os.path.join(OUTPUT_DIR, split, 'labels', dest_name), 'w', encoding='utf-8') as f:
                    f.write("\n".join(remapped_lines) + "\n")
                split_counter[f"rf_{split}"] += 1

print(f"Copied {sum(split_counter[f'rf_{s}'] for s in ['train', 'valid', 'test'])} Roboflow images.")

print("\n=== Merging Synthetic Philippine Dataset ===")
for split in ['train', 'valid', 'test']:
    lbl_dir = os.path.join(PH_SYNTH_DIR, split, 'labels')
    img_dir = os.path.join(PH_SYNTH_DIR, split, 'images')
    if not os.path.exists(lbl_dir):
        continue

    for lbl_file in os.listdir(lbl_dir):
        if not lbl_file.endswith('.txt'):
            continue
        with open(os.path.join(lbl_dir, lbl_file), 'r', encoding='utf-8') as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]

        remapped_lines = []
        for line in lines:
            parts = line.split()
            if not parts:
                continue
            src_cls_id = int(parts[0])
            if src_cls_id < len(SYNTH_SOURCE_CLASSES):
                src_cls_name = SYNTH_SOURCE_CLASSES[src_cls_id]
                if src_cls_name in CLASS_TO_ID:
                    target_id = CLASS_TO_ID[src_cls_name]
                    remapped_lines.append(f"{target_id} " + " ".join(parts[1:]))
                    class_counter[src_cls_name] += 1

        if remapped_lines:
            base_name = os.path.splitext(lbl_file)[0]
            src_img = None
            for ext in ['.jpg', '.jpeg', '.png']:
                candidate = os.path.join(img_dir, base_name + ext)
                if os.path.exists(candidate):
                    src_img = candidate
                    break

            if src_img:
                dest_name = f"synth_{split}_{lbl_file}"
                dest_img_name = f"synth_{split}_{os.path.basename(src_img)}"

                shutil.copy2(src_img, os.path.join(OUTPUT_DIR, split, 'images', dest_img_name))
                with open(os.path.join(OUTPUT_DIR, split, 'labels', dest_name), 'w', encoding='utf-8') as f:
                    f.write("\n".join(remapped_lines) + "\n")
                split_counter[f"synth_{split}"] += 1

print(f"Copied {sum(split_counter[f'synth_{s}'] for s in ['train', 'valid', 'test'])} synthetic images.")

# Create data.yaml
data_yaml = {
    'path': OUTPUT_DIR.replace('\\', '/'),
    'train': 'train/images',
    'val': 'valid/images',
    'test': 'test/images',
    'nc': len(UNIFIED_CLASSES),
    'names': UNIFIED_CLASSES
}

yaml_path = os.path.join(OUTPUT_DIR, 'data.yaml')
with open(yaml_path, 'w', encoding='utf-8') as f:
    yaml.dump(data_yaml, f, sort_keys=False)

print("\n=== Merged Dataset Summary ===")
total_train = len(os.listdir(os.path.join(OUTPUT_DIR, 'train', 'images')))
total_val = len(os.listdir(os.path.join(OUTPUT_DIR, 'valid', 'images')))
total_test = len(os.listdir(os.path.join(OUTPUT_DIR, 'test', 'images')))

print(f"Train Images: {total_train}")
print(f"Valid Images: {total_val}")
print(f"Test Images:  {total_test}")
print(f"Total Unified Images: {total_train + total_val + total_test}")

print("\nClass Bounding Box Distribution:")
for c in UNIFIED_CLASSES:
    print(f"  {c:20s}: {class_counter[c]} boxes")

print(f"\nGenerated YAML at: {yaml_path}")
