import os
import shutil
import time
import csv
import sys
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INCOMING_DIR = os.path.join(BASE_DIR, "incoming_ingredients")
REPO_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
sys.path.insert(0, BACKEND_DIR)

from app.ocr_service import get_reader, build_ocr_images, dedupe_text_parts
from app.scan_service import match_additives_from_text

os.makedirs(INCOMING_DIR, exist_ok=True)

# Step 1: Move any images directly in s3-ocr into incoming_ingredients
for f in os.listdir(BASE_DIR):
    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.heic')):
        src = os.path.join(BASE_DIR, f)
        dst = os.path.join(INCOMING_DIR, f)
        shutil.move(src, dst)

# Step 2: Convert HEIC files to JPG
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

print(f"Converted {heic_converted} HEIC files to JPG.")

image_files = [
    f for f in os.listdir(INCOMING_DIR) 
    if f.lower().endswith(('.jpg', '.jpeg', '.png'))
]
print(f"Total standard ingredient images to benchmark: {len(image_files)}")

# Step 3: Initialize EasyOCR Reader
print("\nInitializing EasyOCR Reader...")
reader = get_reader()
print("EasyOCR loaded.")

results = []
successful_extractions = 0
total_chars = 0
total_latency = 0.0

print("\nRunning OCR & Additive Screening across real supermarket ingredient photos...")
for idx, fname in enumerate(image_files, 1):
    fpath = os.path.join(INCOMING_DIR, fname)
    t0 = time.time()
    
    try:
        # Preprocess and extract text
        with open(fpath, "rb") as f:
            import base64
            img_b64 = base64.b64encode(f.read()).decode("utf-8")

        ocr_imgs = build_ocr_images(img_b64)
        text_parts = []
        for img_arr in ocr_imgs:
            parts = reader.readtext(img_arr, detail=0, paragraph=True)
            text_parts.extend(parts)

        extracted_text = dedupe_text_parts(text_parts)
        latency = round((time.time() - t0) * 1000, 1)
        total_latency += latency

        flagged = match_additives_from_text(extracted_text)
        flagged_names = [item.get("ingredient", "") for item in flagged]

        char_cnt = len(extracted_text)
        if char_cnt > 15:
            successful_extractions += 1
            total_chars += char_cnt

        results.append({
            "filename": fname,
            "char_count": char_cnt,
            "success": char_cnt > 15,
            "latency_ms": latency,
            "flagged_additives": "; ".join(flagged_names) if flagged_names else "Clean / None",
            "extracted_text_snippet": extracted_text[:120].replace("\n", " ")
        })

        if idx % 10 == 0 or idx == len(image_files):
            print(f"  Processed [{idx}/{len(image_files)}] - {fname[:25]}... ({char_cnt} chars, {latency}ms)")

    except Exception as e:
        print(f"  Error on {fname}: {e}")

# Save CSV Report
csv_path = os.path.join(BASE_DIR, "INGREDIENT_OCR_EVIDENCE.csv")
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["filename", "char_count", "success", "latency_ms", "flagged_additives", "extracted_text_snippet"])
    writer.writeheader()
    writer.writerows(results)

# Save Markdown Report
success_rate = round((successful_extractions / len(image_files)) * 100, 2) if image_files else 0.0
avg_latency = round(total_latency / len(image_files), 1) if image_files else 0.0
avg_chars = round(total_chars / successful_extractions, 1) if successful_extractions else 0.0

md_path = os.path.join(BASE_DIR, "INGREDIENT_OCR_EVIDENCE.md")
with open(md_path, "w", encoding="utf-8") as f:
    f.write("# Real Supermarket Ingredient OCR Benchmark & Thesis Evidence\n\n")
    f.write("### Benchmark Summary\n")
    f.write(f"- **Total Real Ingredient Photos Evaluated:** {len(image_files)}\n")
    f.write(f"- **Successful Text Extraction Rate:** **{success_rate}%** ({successful_extractions}/{len(image_files)} photos)\n")
    f.write(f"- **Average Processing Latency:** **{avg_latency} ms** per image\n")
    f.write(f"- **Average Characters Extracted:** **{avg_chars} characters** per label\n\n")
    f.write("### Sample Real Supermarket Extractions\n\n")
    f.write("| Image | Chars Extracted | Matched Additives | Sample Extracted Text |\n")
    f.write("| :--- | :--- | :--- | :--- |\n")
    for r in results[:15]:
        snippet = r['extracted_text_snippet'].replace('|', '/')
        f.write(f"| `{r['filename'][:20]}...` | {r['char_count']} | {r['flagged_additives']} | {snippet} |\n")

print(f"\nSaved CSV Evidence to: {csv_path}")
print(f"Saved Markdown Summary to: {md_path}")
print(f"\nFinal Success Rate: {success_rate}%")
print(f"Average Latency: {avg_latency} ms")
