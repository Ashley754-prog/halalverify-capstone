import re
import time

from app.logo_service import detect_halal_logo
from app.ocr_service import extract_text_from_image, find_e_numbers, normalize_text
from app.supabase_client import supabase

# Re-export certificate service functions for backwards compatibility
from app.certificate_service import (
    CERTIFYING_BODIES,
    CERTIFICATE_PREFIXES,
    OCR_CERT_CHAR_FIXES,
    analyze_certificate_image,
    fetch_establishments,
    extract_certificate_fields,
    extract_certificate_number,
    normalize_certificate_number,
    fix_ocr_certificate_number,
    extract_establishment_name,
    clean_establishment_name,
    extract_expiration_date,
    parse_date,
    extract_certifying_body,
    fuzzy_match_score,
    names_are_similar,
    certificate_numbers_match,
    find_registry_match,
    calculate_layout_confidence,
    describe_ocr_quality,
    build_structural_zones,
    validate_certificate_result,
    _is_past_date,
)

VERDICT_TO_STATUS = {
    "Green": "Halal",
    "Yellow": "Doubtful",
    "Red": "Haram",
}

ADDITIVE_ALIASES = {
    "E120": ["carmine", "cochineal", "cochineal extract", "natural red 4"],
    "E441": ["gelatin", "gelatine"],
    "E542": ["bone phosphate", "edible bone phosphate"],
    "E904": ["shellac"],
}


_cached_additives = []
_cached_additives_ts = 0


def get_all_additives():
    global _cached_additives, _cached_additives_ts
    import time
    now = time.time()
    # Cache for 60 seconds
    if _cached_additives and (now - _cached_additives_ts < 60):
        return _cached_additives

    try:
        response = supabase.table("additives").select("*").execute()
        if response.data:
            _cached_additives = response.data
            _cached_additives_ts = now
            return _cached_additives
    except Exception as e:
        if _cached_additives:
            return _cached_additives

    return _cached_additives or []


def match_additives_from_text(extracted_text: str):
    detected_codes = find_e_numbers(extracted_text)
    normalized_text = normalize_text(extracted_text)

    additives = get_all_additives()

    flagged_items = []
    seen_ids = set()

    seen_codes = set()
    for additive in additives:
        additive_id = additive.get("id")
        code = additive.get("code")
        name = additive.get("name") or ""

        code_match = bool(code and code in detected_codes)
        if code_match:
            seen_codes.add(code)

        matched_alias = find_additive_alias_match(code, name, normalized_text)
        name_match = bool(matched_alias)

        if not code_match and not name_match:
            continue

        if additive_id in seen_ids:
            continue

        seen_ids.add(additive_id)
        flagged_items.append({
            "additive_id": additive_id,
            "ingredient": f"{name} ({code})" if code else name,
            "matched_text": code if code_match else matched_alias,
            "status": additive.get("status"),
            "reason": (
                additive.get("reason")
                or additive.get("source_description")
                or "Matched from additive database."
            ),
        })

    # Surface any detected E-codes not in our local database as Doubtful/Unverified
    for code in detected_codes:
        if code not in seen_codes:
            flagged_items.append({
                "additive_id": None,
                "ingredient": f"Unknown Compound ({code})",
                "matched_text": code,
                "status": "Doubtful",
                "reason": (
                    f"E-number {code} was detected on the label but is not yet cataloged in the local halal database. "
                    "Classified as Doubtful (Syubhah) pending verification."
                ),
            })

    return flagged_items


def find_additive_alias_match(code, name: str, normalized_text: str):
    candidates = build_additive_match_terms(code, name)

    for candidate in candidates:
        normalized_candidate = normalize_text(candidate)

        if not normalized_candidate:
            continue

        pattern = rf"\b{re.escape(normalized_candidate)}\b"

        if re.search(pattern, normalized_text):
            return candidate

    return ""


def build_additive_match_terms(code, name: str):
    terms = []

    if name:
        terms.append(name)
        terms.extend(re.split(r"[/(),;]", name))

    if code:
        terms.extend(ADDITIVE_ALIASES.get(code.upper(), []))

    cleaned_terms = []

    for term in terms:
        term = term.strip()

        if len(term) < 3:
            continue

        if term not in cleaned_terms:
            cleaned_terms.append(term)

    return cleaned_terms


def explain_label_verdict(flagged_items, extracted_text: str, logo_result: dict):
    has_text = bool(extracted_text and extracted_text.strip())
    logo_detected = logo_result.get("logoDetected", False)
    is_invalid_logo = logo_result.get("isInvalidLogo", False)
    logo_body = logo_result.get("logoBody", "Unknown Logo")
    logo_confidence = logo_result.get("logoConfidence", 0.0)

    # 1. Critical Counterfeit / Invalid Mark Alert
    if is_invalid_logo:
        return {
            "verdict": "Red",
            "riskLevel": "High Risk (Suspected Invalid / Counterfeit Mark)",
            "analysisSummary": (
                "Warning: A suspected unauthorized, altered, or unverified halal certification logo "
                "was detected on this packaging. Do not rely on this mark."
            ),
            "recommendations": [
                "Do not purchase or consume without independent halal authority verification.",
                "Report this suspected counterfeit mark to local Islamic authorities (e.g. IDCP / HDIP).",
                "Cross-check manufacturer in the HalalVerify Product Catalog.",
            ],
        }

    # 2. Case where OCR could not read text and no logo was found
    if not has_text and not logo_detected:
        return {
            "verdict": "Yellow",
            "riskLevel": "Unverified",
            "analysisSummary": (
                "Neither ingredient text nor an accredited halal certification logo could be "
                "clearly identified from the image. The product cannot be verified."
            ),
            "recommendations": [
                "Upload a clearer, well-lit photo focusing on the ingredient label and certification seal.",
                "Ensure the packaging is flat and glare-free.",
                "Manually verify the product in the HalalVerify Product Catalog.",
            ],
        }

    statuses = [
        str(item.get("status", "")).strip().lower()
        for item in flagged_items
    ]

    haram_count = statuses.count("haram")
    doubtful_count = (
        statuses.count("doubtful")
        + statuses.count("needs review")
        + statuses.count("needs_review")
    )

    # 3. Prohibited Additives Detected -> Always Red
    if haram_count:
        summary_msg = f"OCR detected ingredient text and found {haram_count} prohibited (haram) additive(s)."
        if logo_detected:
            summary_msg += f" Note: Despite an apparent {logo_body} logo, prohibited ingredients were flagged."

        return {
            "verdict": "Red",
            "riskLevel": "Haram / Prohibited",
            "analysisSummary": summary_msg,
            "recommendations": [
                "Avoid consuming this product.",
                "Verify with the manufacturer whether an animal derivative is halal-certified.",
                "Report conflicting certification via the Report Issue page.",
            ],
        }

    # 4. Doubtful / Unverified Additives Detected -> Yellow
    if doubtful_count:
        summary_msg = f"OCR detected ingredient text and found {doubtful_count} doubtful (Syubhah) compound(s)."
        if logo_detected:
            summary_msg += f" Recognized certification: {logo_body} ({logo_confidence}% confidence)."

        return {
            "verdict": "Yellow",
            "riskLevel": "Doubtful (Syubhah)",
            "analysisSummary": summary_msg,
            "recommendations": [
                "Verify the specific source of the flagged additive with the manufacturer.",
                "Check whether the product is covered by the certifying body's active manifest.",
                "If unsure, abstain from consumption pending clarification.",
            ],
        }

    # 5. Clean Ingredients (0 Haram, 0 Doubtful)
    if logo_detected:
        return {
            "verdict": "Green",
            "riskLevel": "Halal Verified",
            "analysisSummary": (
                f"Accredited {logo_body} logo verified ({logo_confidence}% confidence). "
                "No prohibited or doubtful food additives matched."
            ),
            "recommendations": [
                "Product exhibits accredited certification and clean ingredient declarations.",
                "Always check product packaging expiration dates before purchase.",
            ],
        }

    # Clean ingredients, but no logo detected on this photo
    return {
        "verdict": "Green",
        "riskLevel": "No Flagged Additives (No Logo Detected)",
        "analysisSummary": (
            "OCR detected ingredient text and found no matching haram additives. "
            "No accredited halal certification logo was recognized in this frame."
        ),
        "recommendations": [
            "Ingredient list appears free of known prohibited E-codes.",
            "Verify if a halal logo appears on other sides of the packaging.",
            "Cross-reference brand name in the HalalVerify Product Catalog.",
        ],
    }


def analyze_label_image(image_base64: str) -> dict:
    # 1. Run YOLOv8-Nano Logo Detection
    logo_result = detect_halal_logo(image_base64)

    # 2. Run EasyOCR Ingredient Text Extraction
    extracted_text = extract_text_from_image(image_base64)

    # 3. Match Additives & Explain Combined Verdict
    flagged_items = match_additives_from_text(extracted_text)
    verdict_details = explain_label_verdict(flagged_items, extracted_text, logo_result)

    return {
        "logoDetected": logo_result.get("logoDetected", False),
        "logoConfidence": logo_result.get("logoConfidence", 0.0),
        "logoBody": logo_result.get("logoBody", "No Logo Detected"),
        "isInvalidLogo": logo_result.get("isInvalidLogo", False),
        "detectedLogos": logo_result.get("detectedLogos", []),
        "ingredientsFound": [extracted_text] if extracted_text else [],
        "flaggedIngredients": flagged_items,
        "verdict": verdict_details["verdict"],
        "riskLevel": verdict_details["riskLevel"],
        "analysisSummary": verdict_details["analysisSummary"],
        "recommendations": verdict_details["recommendations"],
        "ocrText": extracted_text,
    }


def save_scan_history(mode: str, result: dict, user_id: str = None):
    if mode == "label":
        verdict = VERDICT_TO_STATUS.get(result.get("verdict"), "Unknown")
        confidence = result.get("logoConfidence", 0)
        image_name = "Product Label Scan"
        detected_logo = result.get("logoBody")
        extracted_text = ", ".join(result.get("ingredientsFound", []))
    else:
        verdict = result.get("status", "Unknown")
        confidence = result.get("layoutConfidence", 0)
        image_name = result.get("establishmentName", "Certificate Scan")
        detected_logo = result.get("certifyingBody")
        extracted_text = result.get("certificateNumber")

    payload = {
        "mode": mode,
        "image_name": image_name,
        "verdict": verdict,
        "confidence": confidence,
        "extracted_text": extracted_text,
        "detected_logo": detected_logo,
        "raw_result": result,
    }
    if user_id:
        payload["user_id"] = str(user_id)

    scan_response = (
        supabase
        .table("scan_history")
        .insert(payload)
        .execute()
    )

    scan_data = scan_response.data[0] if scan_response.data else None

    if mode == "label" and scan_data:
        for item in result.get("flaggedIngredients", []):
            supabase.table("scan_flagged_items").insert({
                "scan_id": scan_data["id"],
                "additive_id": item.get("additive_id"),
                "matched_text": item.get("matched_text") or item.get("ingredient"),
                "status": item.get("status"),
                "reason": item.get("reason"),
            }).execute()

    return scan_data
