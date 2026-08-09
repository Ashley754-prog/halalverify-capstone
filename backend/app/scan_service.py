import re
from datetime import date, datetime

from app.ocr_service import extract_text_from_image, find_e_numbers, normalize_text
from app.supabase_client import supabase


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


def certificate_demo_result() -> dict:
    extracted_certificate = {
        "certifyingBody": "Halal Development Institute of the Philippines (HDIP)",
        "establishmentName": "Zamboanga Halal Food Haven",
        "certificateNumber": "HDIP-2026-90412",
        "expirationDate": "2027-04-12",
        "isExpired": False,
        "layoutConfidence": 0.89,
        "structuralZones": [
            "Header Zone",
            "Entity Identity",
            "Validity Block",
            "Authority Signature Seal",
        ],
    }

    return validate_certificate_result(extracted_certificate)


def analyze_certificate_image(image_base64: str) -> dict:
    extracted_text = extract_text_from_image(image_base64)
    extracted_certificate = extract_certificate_fields(extracted_text)
    validated_result = validate_certificate_result(extracted_certificate)

    return {
        **validated_result,
        "ocrText": extracted_text,
    }


def extract_certificate_fields(extracted_text: str) -> dict:
    certificate_number = extract_certificate_number(extracted_text)
    expiration_date = extract_expiration_date(extracted_text)
    certifying_body = extract_certifying_body(extracted_text)
    establishment_name = ""

    if certificate_number:
        establishment_name = find_establishment_name_by_certificate(certificate_number)

    return {
        "certifyingBody": certifying_body,
        "establishmentName": establishment_name or "Not detected",
        "certificateNumber": certificate_number or "Not detected",
        "expirationDate": expiration_date,
        "isExpired": _is_past_date(expiration_date),
        "layoutConfidence": 0.65 if extracted_text.strip() else 0,
        "structuralZones": [
            "OCR Text Region",
            "Certificate Number Candidate",
            "Validity Date Candidate",
        ],
    }


def extract_certificate_number(text: str):
    compact_text = re.sub(r"\s+", " ", text).upper()
    patterns = [
        r"\b[A-Z]{2,8}[-\s]?\d{4}[-\s]?\d{3,8}\b",
        r"\bHAL[-\s]?\d{4}[-\s]?\d{3,8}\b",
        r"\bCERT(?:IFICATE)?\s*(?:NO|NUMBER|#)?\s*[:\-]?\s*([A-Z0-9\-]{6,})",
    ]

    for pattern in patterns:
        match = re.search(pattern, compact_text, flags=re.IGNORECASE)

        if not match:
            continue

        value = match.group(1) if match.lastindex else match.group(0)
        value = re.sub(r"\s+", "-", value)
        return value.strip("-:").upper()

    return None


def extract_expiration_date(text: str):
    date_patterns = [
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b\d{1,2}/\d{1,2}/\d{4}\b",
        r"\b\d{1,2}-\d{1,2}-\d{4}\b",
        r"\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{1,2},?\s+\d{4}\b",
        r"\b\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}\b",
    ]

    for pattern in date_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)

        if not match:
            continue

        parsed_date = parse_date(match.group(0))

        if parsed_date:
            return parsed_date

    return None


def parse_date(value: str):
    cleaned = value.replace(".", "").replace(",", "")
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%m-%d-%Y",
        "%d-%m-%Y",
        "%B %d %Y",
        "%b %d %Y",
        "%d %B %Y",
        "%d %b %Y",
    ]

    for date_format in formats:
        try:
            return datetime.strptime(cleaned, date_format).date().isoformat()
        except ValueError:
            continue

    return None


def extract_certifying_body(text: str):
    upper_text = text.upper()
    known_bodies = {
        "HDIP": "Halal Development Institute of the Philippines (HDIP)",
        "IDCP": "Islamic Da'wah Council of the Philippines (IDCP)",
    }

    for acronym, full_name in known_bodies.items():
        if acronym in upper_text or full_name.upper() in upper_text:
            return full_name

    return "Not detected"


def find_establishment_name_by_certificate(certificate_number: str):
    response = (
        supabase
        .table("establishments")
        .select("name")
        .eq("certificate_number", certificate_number)
        .limit(1)
        .execute()
    )

    establishment = response.data[0] if response.data else None
    return establishment.get("name") if establishment else ""


def validate_certificate_result(extracted_certificate: dict) -> dict:
    certificate_number = extracted_certificate.get("certificateNumber")

    if not certificate_number or certificate_number == "Not detected":
        return {
            **extracted_certificate,
            "status": "Suspicious",
            "authenticationNote": (
                "OCR could not detect a usable certificate number. "
                "The certificate cannot be matched against the registry."
            ),
            "registryMatch": None,
            "recommendations": [
                "Upload a clearer certificate image.",
                "Make sure the certificate number and validity date are readable.",
                "Verify the certificate manually with the issuing authority.",
            ],
        }

    response = (
        supabase
        .table("establishments")
        .select("*, certifying_bodies(*)")
        .eq("certificate_number", certificate_number)
        .limit(1)
        .execute()
    )

    establishment = response.data[0] if response.data else None

    if not establishment:
        return {
            **extracted_certificate,
            "status": "Suspicious",
            "authenticationNote": (
                "Certificate number was not found in the HalalVerify "
                "establishment registry. This does not automatically prove "
                "it is fake, but it requires manual verification."
            ),
            "registryMatch": None,
            "recommendations": [
                "Verify this certificate with the issuing halal certifying body.",
                "Check whether the local establishment registry is updated.",
            ],
        }

    expiry_date = establishment.get("expiry_date")
    is_expired = _is_past_date(expiry_date)

    expected_name = establishment.get("name") or ""
    extracted_name = extracted_certificate.get("establishmentName") or ""
    name_matches = (
        not extracted_name
        or extracted_name == "Not detected"
        or expected_name.lower().strip() == extracted_name.lower().strip()
    )

    if is_expired:
        status = "Expired"
        note = (
            "Certificate was found in the registry, but its expiry date "
            "has already passed."
        )
    elif not name_matches:
        status = "Suspicious"
        note = (
            "Certificate number exists, but the establishment name does "
            "not match the registry record."
        )
    else:
        status = "Valid"
        note = (
            "Certificate number and establishment name match the "
            "HalalVerify registry record."
        )

    return {
        **extracted_certificate,
        "status": status,
        "isExpired": is_expired,
        "authenticationNote": note,
        "registryMatch": {
            "id": establishment.get("id"),
            "name": establishment.get("name"),
            "halal_status": establishment.get("halal_status"),
            "certificate_number": establishment.get("certificate_number"),
            "expiry_date": establishment.get("expiry_date"),
            "certifying_body": establishment.get("certifying_bodies"),
        },
        "recommendations": [
            "This result is advisory only.",
            "For official verification, confirm with the certifying body.",
        ],
    }


def _is_past_date(value):
    if not value:
        return False

    try:
        return date.fromisoformat(str(value)) < date.today()
    except ValueError:
        return False


def match_additives_from_text(extracted_text: str):
    detected_codes = find_e_numbers(extracted_text)
    normalized_text = normalize_text(extracted_text)

    response = supabase.table("additives").select("*").execute()
    additives = response.data or []

    flagged_items = []
    seen_ids = set()

    for additive in additives:
        additive_id = additive.get("id")
        code = additive.get("code")
        name = additive.get("name") or ""

        code_match = bool(code and code in detected_codes)
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


def explain_label_verdict(flagged_items, extracted_text: str):
    if not extracted_text or not extracted_text.strip():
        return {
            "verdict": "Yellow",
            "riskLevel": "Unverified",
            "analysisSummary": (
                "OCR could not clearly read ingredient text from the image. "
                "The product cannot be verified."
            ),
            "recommendations": [
                "Upload a clearer photo of the ingredient label.",
                "Make sure the text is well-lit, flat, and not blurry.",
                "Manually verify the product with a trusted halal authority.",
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

    if haram_count:
        return {
            "verdict": "Red",
            "riskLevel": "Haram",
            "analysisSummary": (
                f"OCR detected ingredient text and found {haram_count} "
                "haram additive(s)."
            ),
            "recommendations": [
                "Avoid consuming this product unless verified by an accredited body.",
                "Check the ingredient source and halal certification status.",
            ],
        }

    if doubtful_count:
        return {
            "verdict": "Yellow",
            "riskLevel": "Doubtful",
            "analysisSummary": (
                f"OCR detected ingredient text and found {doubtful_count} "
                "doubtful or unverified additive(s)."
            ),
            "recommendations": [
                "Verify the source of the flagged additive before consumption.",
                "Look for a recognized halal certification mark.",
                "If unsure, consult a qualified halal certifying authority.",
            ],
        }

    return {
        "verdict": "Green",
        "riskLevel": "No flagged additives found",
        "analysisSummary": (
            "OCR detected ingredient text and found no matching haram or "
            "doubtful additives in the current database."
        ),
        "recommendations": [
            "This result is advisory only.",
            "Still check for trusted halal certification when available.",
        ],
    }


def analyze_label_image(image_base64: str) -> dict:
    extracted_text = extract_text_from_image(image_base64)
    flagged_items = match_additives_from_text(extracted_text)
    verdict_details = explain_label_verdict(flagged_items, extracted_text)

    return {
        "logoDetected": False,
        "logoConfidence": 0,
        "logoBody": "Not checked yet",
        "ingredientsFound": [extracted_text] if extracted_text else [],
        "flaggedIngredients": flagged_items,
        "verdict": verdict_details["verdict"],
        "riskLevel": verdict_details["riskLevel"],
        "analysisSummary": verdict_details["analysisSummary"],
        "recommendations": verdict_details["recommendations"],
        "ocrText": extracted_text,
    }


def save_scan_history(mode: str, result: dict):
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

    scan_response = (
        supabase
        .table("scan_history")
        .insert({
            "mode": mode,
            "image_name": image_name,
            "verdict": verdict,
            "confidence": confidence,
            "extracted_text": extracted_text,
            "detected_logo": detected_logo,
            "raw_result": result,
        })
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
