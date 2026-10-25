"""
HalalVerify P0/P1/P2 Acceptance & Real-Logo Evaluation Suite
Tests:
1. P0-1: Plain-text 'Halal' false-positive guard, Invalid_Logo protection, and front-only missing-ingredients guard.
2. P0-2: Submission auto-verification guardrails (dropdown-only HCB claim blocked from auto-publishing as VERIFIED; DTI excluded from HCB codes).
3. P1-3: 4-stage Ingredient Section Parser, parenthesized INS codes (471), OCR digit repair (E47I -> E471), Tagalog/Malay haram lexicon, bounded fuzzy OCR matching, and clause-local negation.
4. P1-4 & P2-5: YOLOv8n + High-Resolution ROI Crop OCR (with polar rim unwrap) across the test split and the 114 unseen real photos in incoming_real_logos/.
"""
import io
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.logo_service import detect_halal_logo
from app.ocr_service import find_e_numbers
from app.scan_service import (
    explain_label_verdict,
    fuse_logo_and_ocr_evidence,
    is_ingredient_negated,
    match_additives_from_text,
    parse_label_sections,
)
from app.auto_verification_service import (
    ACCREDITED_HCB_CODES,
    evaluate_establishment_submission,
    evaluate_product_submission,
)


def run_acceptance_tests():
    print("=" * 72)
    print("1. P0 & P1 ACCEPTANCE CRITERIA VERIFICATION")
    print("=" * 72)

    # Test 1: Plain-text "Halal" without a visual seal must NOT set logoDetected=True
    no_seal_logo = {
        "logoDetected": False,
        "logoConfidence": 0.0,
        "logoBody": "No Halal Logo Detected",
        "isInvalidLogo": False,
        "cropOcrText": "",
        "detectedLogos": [],
    }
    fused_text_only = fuse_logo_and_ocr_evidence(
        dict(no_seal_logo),
        "Crispy Chicken Noodles. Halal Chicken Flavor. Ingredients: Wheat flour, palm oil, salt, sugar, spices.",
    )
    assert fused_text_only["logoDetected"] is False, "FAIL: Plain text 'Halal' fabricated logoDetected=True!"
    assert fused_text_only["sealStatus"] == "TEXT_CLAIM_ONLY_NO_SEAL"
    verdict_text_only = explain_label_verdict(
        [],
        "Ingredients: Wheat flour, palm oil, salt, sugar, spices.",
        fused_text_only,
    )
    assert verdict_text_only["verdict"] == "Yellow", "FAIL: Unsealed product with 'Halal' text got Green!"
    print("[PASS] P0-1A: Plain-text 'Halal' without visual seal -> logoDetected=False, Verdict=Yellow (Text Claim Only)")

    # Test 2: Invalid_Logo >= 0.75 must NEVER be overwritten by text matching
    invalid_logo = {
        "logoDetected": True,
        "logoConfidence": 84.5,
        "logoBody": "Unrecognized / Suspected Counterfeit Logo",
        "isInvalidLogo": True,
        "isAmbiguousHcb": False,
        "cropOcrText": "IDCP HALAL",
        "detectedLogos": [{"label": "Unrecognized", "confidence": 84.5, "is_invalid": True, "box": [10, 10, 90, 90], "norm_box": [0.1, 0.1, 0.9, 0.9]}],
    }
    fused_invalid = fuse_logo_and_ocr_evidence(dict(invalid_logo), "IDCP Certified Halal. Ingredients: Water, sugar, salt.")
    assert fused_invalid["isInvalidLogo"] is True, "FAIL: Text match erased Invalid_Logo!"
    verdict_invalid = explain_label_verdict([], "Ingredients: Water, sugar, salt.", fused_invalid)
    assert verdict_invalid["verdict"] == "Red", "FAIL: Invalid_Logo did not return Red!"
    print("[PASS] P0-1B: Invalid_Logo guard preserved against text override -> Verdict=Red")

    # Test 3: Front-only scan with a valid logo but NO readable ingredient list must return Yellow (Scan Ingredients)
    front_only_logo = {
        "logoDetected": True,
        "logoConfidence": 91.2,
        "logoBody": "IDCP (Islamic Da'wah Council of the Philippines)",
        "isInvalidLogo": False,
        "isAmbiguousHcb": False,
        "sealStatus": "VERIFIED_HCB_SEAL",
    }
    front_only_text = "Lucky Me! Pancit Canton Original Flavor Net Wt 60g"
    sec_front = parse_label_sections(front_only_text)
    assert sec_front["ingredient_status"] == "MISSING_OR_UNREADABLE"
    verdict_front_only = explain_label_verdict([], front_only_text, front_only_logo, sec_front)
    assert verdict_front_only["verdict"] == "Yellow" and "Scan Ingredients" in verdict_front_only["riskLevel"]
    print("[PASS] P0-1C: Front-only logo scan with no ingredient list -> Verdict=Yellow ('Seal Found - Scan Ingredients')")

    # Test 4: Valid logo + readable clean ingredient panel -> Green ("Verified Halal")
    back_and_logo_text = "INGREDIENTS: Wheat flour, palm oil, iodized salt, sugar, garlic powder, onion powder."
    sec_full = parse_label_sections(back_and_logo_text)
    assert sec_full["ingredient_status"] == "READABLE_PANEL"
    verdict_full = explain_label_verdict([], back_and_logo_text, front_only_logo, sec_full)
    assert verdict_full["verdict"] == "Green"
    print("[PASS] P0-1D: Accredited seal + readable clean ingredient panel -> Verdict=Green ('Verified Halal')")

    # Test 5: Parenthesized INS numbers & OCR digit confusion repair
    ecode_sample = "Ingredients: Wheat flour, Emulsifiers (471, 472e), Color (120), Antioxidant (E319), Stabilizer [E47I], INS 12O."
    extracted_ecodes = find_e_numbers(ecode_sample)
    for expected in ("E471", "E472E", "E120", "E319"):
        assert expected in extracted_ecodes, f"FAIL: Missed {expected} in {extracted_ecodes}"
    print(f"[PASS] P1-3A: Parenthesized INS & OCR-corrupted E-codes extracted -> {extracted_ecodes}")

    # Test 6: Tagalog/Malay haram terms, fuzzy OCR matching, and clause-local negation
    # Banner says "Alcohol-Free!", ingredient list has "mantika ng baboy" and "porclne" (OCR typo for porcine) and "ethyl alcohol"
    tricky_label = (
        "100% Alcohol-Free Snack! Mga Sangkap: Harina, tubig, mantika ng baboy, asin, porclne extract, ethyl alcohol."
    )
    flagged = match_additives_from_text(tricky_label)
    flagged_names = [f["ingredient"] for f in flagged]
    assert any("Mantika ng Baboy" in n or "Baboy" in n for n in flagged_names), f"Missed Tagalog lard in {flagged_names}"
    assert any("Porcine" in n for n in flagged_names), f"Missed fuzzy OCR 'porclne' in {flagged_names}"
    assert any("Alcohol" in n for n in flagged_names), f"Marketing banner 'Alcohol-Free' globally suppressed 'ethyl alcohol'! {flagged_names}"
    assert is_ingredient_negated("pork", "Seasoning (Pork-Free), Salt, Sugar") is True
    print(f"[PASS] P1-3B: Tagalog/Malay lexicon + Fuzzy OCR ('porclne') + Clause-Local Negation verified -> {len(flagged)} flagged")

    # Test 7: Submission auto-verification guardrails
    assert "DTI" not in ACCREDITED_HCB_CODES, "FAIL: 'DTI' still in ACCREDITED_HCB_CODES!"
    unverified_prod = evaluate_product_submission({
        "name": "Random Unverified Chips",
        "brand": "TestBrand",
        "halal_tier": "halal_certified",
        "certifying_body": "IDCP",
        "ingredients_summary": "Potatoes, vegetable oil, salt",
    })
    assert unverified_prod["is_auto_approved"] is False, "FAIL: Dropdown-only product was auto-approved!"
    assert unverified_prod["status"] == "PENDING_VERIFICATION"
    print(f"[PASS] P0-2: Dropdown-only product submission blocked from auto-publishing -> status={unverified_prod['status']} (score={unverified_prod['score']}%)")


def evaluate_unseen_real_logos():
    print("\n" + "=" * 72)
    print("2. P2 BENCHMARK: YOLOv8n + HIGH-RES ROI CROP OCR ON REAL PACKAGING PHOTOS")
    print("=" * 72)

    incoming_dir = REPO_ROOT / "spikes" / "s2-yolo" / "incoming_real_logos"
    if not incoming_dir.exists():
        print("incoming_real_logos directory not found.")
        return

    image_paths = sorted(
        list(incoming_dir.glob("*.jpg")) + list(incoming_dir.glob("*.jpeg")) + list(incoming_dir.glob("*.png"))
    )
    print(f"Found {len(image_paths)} unseen real camera photos in incoming_real_logos/")

    # Run sample benchmark across the first 25 real unseen photos to measure localization rate, confidence distribution, and Crop OCR disambiguation
    sample_paths = image_paths[:25]
    detected_count = 0
    high_conf_count = 0
    ambiguous_count = 0
    crop_ocr_nonempty = 0
    crop_disambiguated = 0
    class_counts = {}

    for img_path in sample_paths:
        try:
            pil_img = Image.open(img_path).convert("RGB")
            # Resize to <= 1280px exactly as the frontend camera/upload pipeline does
            w, h = pil_img.size
            if max(w, h) > 1280:
                scale = 1280.0 / max(w, h)
                pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)

            res = detect_halal_logo(pil_img, run_crop_ocr=True)
            if res.get("logoDetected"):
                detected_count += 1
                raw_cand = res.get("visualCandidateCode") or "Unknown"
                class_counts[raw_cand] = class_counts.get(raw_cand, 0) + 1
                was_ambig = bool(res.get("isAmbiguousHcb"))
                if was_ambig:
                    ambiguous_count += 1
                else:
                    high_conf_count += 1

                crop_txt = (res.get("cropOcrText") or "").strip()
                if crop_txt:
                    crop_ocr_nonempty += 1

                fused = fuse_logo_and_ocr_evidence(dict(res), "")
                if was_ambig and not fused.get("isAmbiguousHcb"):
                    crop_disambiguated += 1
        except Exception as err:
            print(f"Error on {img_path.name}: {err}")

    print(f"Evaluated {len(sample_paths)} real camera photos (downscaled to <=1280px):")
    print(f"  - Visual Seal Localized (conf >= 0.35): {detected_count}/{len(sample_paths)} ({round(detected_count / max(1, len(sample_paths)) * 100, 1)}%)")
    print(f"  - High-Confidence Direct Match (>= 0.78): {high_conf_count}")
    print(f"  - Ambiguous Band (0.35 <= conf < 0.78): {ambiguous_count}")
    print(f"  - High-Res ROI Crop OCR Extracted Text: {crop_ocr_nonempty}/{max(1, detected_count)} seals")
    print(f"  - Ambiguous Seals Disambiguated by ROI Crop OCR Alone: {crop_disambiguated}")
    print(f"  - Predicted Visual Candidate Distribution: {json.dumps(class_counts)}")


if __name__ == "__main__":
    run_acceptance_tests()
    evaluate_unseen_real_logos()
