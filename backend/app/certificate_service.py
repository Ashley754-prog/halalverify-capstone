import re
from datetime import date, datetime, timedelta, timezone
from difflib import SequenceMatcher

from app.ocr_service import extract_text_from_image, normalize_text
from app.supabase_client import supabase

CERTIFYING_BODIES = {
    "BUSC": "Basilan Ulama Supreme Council Foundation Inc. (BUSC)",
    "UCZP": "Ulama Council of Zamboanga Peninsula (UCZP)",
    "BPCC": "Bangsamoro Provincial Consultative Council, Inc. (BPCC)",
    "MMHCB": "Muslim Mindanao Halal Certification Board, Inc. (MMHCB)",
    "HDIP": "Halal Development Institute of the Philippines (HDIP)",
    "IDCP": "Islamic Da'wah Council of the Philippines (IDCP)",
    "AHIP": "Alliances for Halal Integrity of the Philippines, Inc. (AHIP)",
    "FIQHI": "Fiqhi and Halal Council of the Philippines, Inc. (FIQHI)",
    "HICCIP": "Halal International Chamber of Commerce and Industries of the Philippines Inc. (HICCIP)",
    "MASLAHA": "Maslaha Halal Certification Board, Inc. (MASLAHA)",
    "PRIME": "Prime Certification and Inspection Asia Pacific, Inc. (PRIME)",
    "PUCOI": "Philippine Ulama Congress Organization, Inc. (PUCOI)",
    "MINHA": "Mindanao Halal Authority, Inc. (MinHA)",
    "PHILCOSED": "Philippine Ligawasan Marsh Conservation and Socio-Economic Development, Inc. (Philcosed)",
    "NCMF": "National Commission on Muslim Filipinos (NCMF)",
    "MUIS": "Majlis Ugama Islam Singapura (MUIS)",
    "JAKIM": "Department of Islamic Development Malaysia (JAKIM)",
    "HALAL": "Halal Certification Body",
}

CERTIFICATE_PREFIXES = (
    "HC",
    "BUSC",
    "UCZP",
    "BPCC",
    "MMHCB",
    "HDIP",
    "IDCP",
    "NCMF",
    "HAL",
    "HALAL",
    "MUIS",
    "JAKIM",
)

OCR_CERT_CHAR_FIXES = {
    "O": "0",
    "o": "0",
    "I": "1",
    "l": "1",
    "S": "5",
    "B": "8",
    "Z": "2",
}


def analyze_certificate_image(image_base64: str) -> dict:
    extracted_text = extract_text_from_image(image_base64)
    establishments = fetch_establishments()
    extracted_certificate = extract_certificate_fields(extracted_text, establishments)
    validated_result = validate_certificate_result(extracted_certificate, establishments)

    return {
        **validated_result,
        "ocrText": extracted_text,
    }


def fetch_establishments():
    response = (
        supabase
        .table("establishments")
        .select("*, certifying_bodies(*)")
        .execute()
    )
    return response.data or []


def extract_certificate_fields(extracted_text: str, establishments=None) -> dict:
    certificate_number, cert_candidates = extract_certificate_number(extracted_text)
    expiration_date = extract_expiration_date(extracted_text)
    certifying_body = extract_certifying_body(extracted_text)
    establishment_name = extract_establishment_name(extracted_text)

    registry_match, match_confidence = find_registry_match(
        certificate_number,
        establishment_name,
        cert_candidates,
        establishments or [],
    )

    if registry_match and not establishment_name:
        establishment_name = registry_match.get("name") or establishment_name
    elif registry_match and establishment_name:
        registry_name = registry_match.get("name") or ""
        if names_are_similar(establishment_name, registry_name):
            establishment_name = registry_name
        elif fuzzy_match_score(establishment_name, registry_name) < 0.6:
            establishment_name = registry_name

    if registry_match and registry_match.get("certificate_number"):
        reg_cert = registry_match.get("certificate_number")
        if not certificate_number or any(certificate_numbers_match(c, reg_cert) for c in (cert_candidates or [])):
            certificate_number = reg_cert

    layout_confidence = calculate_layout_confidence(
        extracted_text,
        certificate_number,
        expiration_date,
        certifying_body,
        establishment_name,
        match_confidence,
    )

    return {
        "certifyingBody": certifying_body,
        "establishmentName": establishment_name or "Not detected",
        "certificateNumber": certificate_number or "Not detected",
        "expirationDate": expiration_date,
        "layoutConfidence": layout_confidence,
        "ocrQuality": describe_ocr_quality(layout_confidence, extracted_text),
        "matchConfidence": round(match_confidence, 2) if match_confidence else 0,
        "structuralZones": build_structural_zones(
            certificate_number,
            expiration_date,
            certifying_body,
            establishment_name,
        ),
        "_registry_match_candidate": registry_match,
    }


def extract_certificate_number(text: str):
    compact_text = re.sub(r"\s+", " ", text).upper()
    candidates = []

    patterns = [
        r"\b(?:CERT(?:IFICATE)?(?:\s+NO\.?|\s+NUMBER|\s*#)|SERIAL(?:\s+NO\.?|\s+KEY)?|NO\.?)\s*[:\.\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{3,})\b",
        r"\b(HC|BUSC|UCZP|BPCC|MMHCB)[-\/\.]?(\d{2,6})\b",
        r"\b(HDIP|IDCP|NCMF|HAL|HALAL|MUIS|JAKIM)\s*[-\/\.]?\s*(\d{3,8})(?:\s*[-\/\.]?\s*([A-Z0-9]{1,8}))?\b",
        r"\b[A-Z]{2,8}[-\s\/\.]?\d{4}[-\s\/\.]?\d{3,8}\b",
        r"\bHAL[-\s\/\.]?\d{4}[-\s\/\.]?\d{3,8}\b",
        r"\b\d{4}[-\s\/\.]\d{5,8}\b",
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, compact_text, flags=re.IGNORECASE):
            if match.lastindex and match.lastindex >= 3 and match.group(3):
                value = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
            elif match.lastindex and match.lastindex >= 2 and match.group(2):
                value = f"{match.group(1)}-{match.group(2)}"
            elif match.lastindex == 1:
                value = match.group(1)
            else:
                value = match.group(0)

            normalized = normalize_certificate_number(value)
            if not normalized or not any(ch.isdigit() for ch in normalized):
                continue
            if normalized not in candidates:
                candidates.append(normalized)

            ocr_fixed = normalize_certificate_number(fix_ocr_certificate_number(value))
            if ocr_fixed and any(ch.isdigit() for ch in ocr_fixed) and ocr_fixed not in candidates:
                candidates.append(ocr_fixed)

    if not candidates:
        return None, []

    return candidates[0], candidates


def normalize_certificate_number(value: str) -> str:
    cleaned = re.sub(r"\s+", "-", value.strip().upper())
    cleaned = re.sub(r"[-/\.]+", "-", cleaned)
    cleaned = re.sub(r"[^A-Z0-9\-]", "", cleaned)
    cleaned = re.sub(r"-+", "-", cleaned)
    return cleaned.strip("-")


def fix_ocr_certificate_number(value: str) -> str:
    parts = re.split(r"([-/\.])", value)
    fixed_parts = []

    for part in parts:
        if part in "-/.":
            fixed_parts.append("-")
            continue

        if re.fullmatch(r"[A-Za-z]+", part):
            fixed_parts.append(part.upper())
            continue

        fixed_chars = []

        for index, char in enumerate(part):
            if char.isdigit():
                fixed_chars.append(char)
            elif char.isalpha():
                if index > 0 and part[index - 1].isdigit():
                    fixed_chars.append(OCR_CERT_CHAR_FIXES.get(char, char))
                else:
                    fixed_chars.append(char.upper())
            else:
                fixed_chars.append(char)

        fixed_parts.append("".join(fixed_chars))

    return "".join(fixed_parts)


def extract_establishment_name(text: str):
    labeled_patterns = [
        r"(?:issued?\s+to|establishment(?:\s+name)?|company\s+name|name\s+of\s+(?:establishment|company|business|holder))\s*[:\.\-]?\s*([A-Za-z0-9][A-Za-z0-9 \t&\.,'\-\(\)]{2,100})",
        r"(?:this\s+certificate\s+is\s+(?:issued|awarded)\s+to)\s*[:\.\-]?\s*([A-Za-z0-9][A-Za-z0-9 \t&\.,'\-\(\)]{2,100})",
    ]

    for pattern in labeled_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)

        if not match:
            continue

        cleaned = clean_establishment_name(match.group(1))

        if cleaned:
            return cleaned

    return ""


def clean_establishment_name(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value).strip(" .,-")
    cleaned = re.split(
        r"\b(certificate number|cert(?:ificate)? no|valid until|expiry date|expires on)\b",
        cleaned,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip(" .,-")

    if len(cleaned) < 3:
        return ""

    if re.fullmatch(r"\d{4}[-/\.]\d{2}[-/\.]\d{2}", cleaned):
        return ""

    return cleaned


def extract_expiration_date(text: str):
    labeled_patterns = [
        r"(?:valid until|validity date|expiry date|expires on|expiration date|date of expiry)\s*[:\.\-]?\s*([A-Za-z0-9,\-/\. ]{6,20})",
    ]

    for pattern in labeled_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)

        if not match:
            continue

        parsed_date = parse_date(match.group(1))

        if parsed_date:
            return parsed_date

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

    for acronym, full_name in CERTIFYING_BODIES.items():
        base_name = re.sub(r"\s*\([^)]*\)\s*$", "", full_name).upper().strip()
        if (base_name and base_name in upper_text) or re.search(rf"\b{re.escape(acronym)}\b", upper_text):
            return full_name

    return "Not detected"


def fuzzy_match_score(left: str, right: str) -> float:
    left_normalized = normalize_text(left)
    right_normalized = normalize_text(right)

    if not left_normalized or not right_normalized:
        return 0.0

    return SequenceMatcher(None, left_normalized, right_normalized).ratio()


def names_are_similar(left: str, right: str, threshold: float = 0.82) -> bool:
    if fuzzy_match_score(left, right) >= threshold:
        return True
    left_base = normalize_text(re.sub(r"\s*\([^)]*\)", "", left or ""))
    right_base = normalize_text(re.sub(r"\s*\([^)]*\)", "", right or ""))
    return bool(left_base and right_base and (left_base == right_base or fuzzy_match_score(left_base, right_base) >= threshold))


def certificate_numbers_match(left: str, right: str) -> bool:
    left_normalized = normalize_certificate_number(left)
    right_normalized = normalize_certificate_number(right)

    if not left_normalized or not right_normalized:
        return False

    if left_normalized == right_normalized:
        return True

    left_fixed = normalize_certificate_number(fix_ocr_certificate_number(left))
    right_fixed = normalize_certificate_number(fix_ocr_certificate_number(right))

    if left_fixed == right_fixed:
        return True

    return fuzzy_match_score(left_normalized, right_normalized) >= 0.9


def find_registry_match(certificate_number, establishment_name, cert_candidates, establishments):
    best_match = None
    best_score = 0.0

    candidates = []

    if certificate_number and certificate_number != "Not detected":
        candidates.append(certificate_number)

    candidates.extend(cert_candidates or [])

    for establishment in establishments:
        registry_cert = establishment.get("certificate_number") or ""
        registry_name = establishment.get("name") or ""

        for candidate in candidates:
            if certificate_numbers_match(candidate, registry_cert):
                score = 1.0
                if establishment_name and registry_name:
                    score = max(score, fuzzy_match_score(establishment_name, registry_name))

                if score > best_score:
                    best_score = score
                    best_match = establishment

        if establishment_name and registry_name and names_are_similar(establishment_name, registry_name):
            score = fuzzy_match_score(establishment_name, registry_name)

            if score > best_score:
                best_score = score
                best_match = establishment

    return best_match, best_score


def calculate_layout_confidence(
    extracted_text,
    certificate_number,
    expiration_date,
    certifying_body,
    establishment_name,
    match_confidence,
):
    score = 0.0
    text_length = len((extracted_text or "").strip())

    if text_length >= 40:
        score += 0.2
    elif text_length >= 15:
        score += 0.1

    if certificate_number and certificate_number != "Not detected":
        score += 0.25

    if expiration_date:
        score += 0.15

    if certifying_body and certifying_body != "Not detected":
        score += 0.15

    if establishment_name and establishment_name != "Not detected":
        score += 0.15

    score += min(match_confidence or 0, 1.0) * 0.1

    return round(min(score, 0.99), 2)


def describe_ocr_quality(layout_confidence: float, extracted_text: str) -> str:
    text_length = len((extracted_text or "").strip())

    if text_length < 15:
        return "Poor — very little readable text was detected."

    if layout_confidence >= 0.75:
        return "Good — key certificate fields were detected clearly."

    if layout_confidence >= 0.5:
        return "Fair — some certificate fields were detected, but the image may be partly blurry."

    return "Low — OCR struggled to read the certificate. Upload a clearer, flatter photo."


def build_structural_zones(certificate_number, expiration_date, certifying_body, establishment_name):
    zones = []

    if certifying_body and certifying_body != "Not detected":
        zones.append("Certifying Body Region")

    if establishment_name and establishment_name != "Not detected":
        zones.append("Establishment Identity Region")

    if certificate_number and certificate_number != "Not detected":
        zones.append("Certificate Number Region")

    if expiration_date:
        zones.append("Validity Date Region")

    if not zones:
        zones.append("Unreadable Document Region")

    return zones


def validate_certificate_result(extracted_certificate: dict, establishments=None) -> dict:
    result = {key: value for key, value in extracted_certificate.items() if not key.startswith("_")}
    registry_match = extracted_certificate.get("_registry_match_candidate")
    establishments = establishments or fetch_establishments()

    certificate_number = result.get("certificateNumber")
    layout_confidence = result.get("layoutConfidence", 0)
    match_confidence = result.get("matchConfidence", 0)
    ocr_quality = result.get("ocrQuality", "")

    low_confidence_note = ""

    if layout_confidence < 0.5:
        low_confidence_note = (
            f" OCR quality is low ({ocr_quality})"
            if ocr_quality
            else " OCR quality is low."
        )

    if not certificate_number or certificate_number == "Not detected":
        if registry_match:
            certificate_number = registry_match.get("certificate_number")
            result["certificateNumber"] = certificate_number
            result["establishmentName"] = registry_match.get("name") or result.get("establishmentName")
        else:
            return {
                **result,
                "status": "Suspicious",
                "authenticationNote": (
                    "OCR could not detect a usable certificate number, so the "
                    "certificate cannot be matched against the registry."
                    + low_confidence_note
                ),
                "registryMatch": None,
                "recommendations": [
                    "Upload a clearer certificate image with good lighting.",
                    "Make sure the certificate number and validity date are readable.",
                    "Hold the camera steady and avoid glare on the document.",
                    "Verify the certificate manually with the issuing authority.",
                ],
            }

    establishment = registry_match

    if not establishment:
        for candidate in establishments:
            if certificate_numbers_match(certificate_number, candidate.get("certificate_number") or ""):
                establishment = candidate
                break

    if not establishment:
        return {
            **result,
            "status": "Suspicious",
            "authenticationNote": (
                "Certificate number was not found in the HalalVerify establishment "
                "registry. This does not automatically prove it is fake, but it "
                "requires manual verification."
                + low_confidence_note
            ),
            "registryMatch": None,
            "recommendations": [
                "Verify this certificate with the issuing halal certifying body.",
                "Check whether the local establishment registry is up to date.",
                "Try uploading a clearer image if the certificate number may have been misread.",
            ],
        }

    expiry_date = establishment.get("expiry_date") or result.get("expirationDate")

    expected_name = establishment.get("name") or ""
    extracted_name = result.get("establishmentName") or ""
    name_score = fuzzy_match_score(extracted_name, expected_name) if extracted_name and expected_name else 0
    name_matches = (
        not extracted_name
        or extracted_name == "Not detected"
        or names_are_similar(extracted_name, expected_name)
    )

    est_status = (establishment.get("halal_status") or "").strip().lower()

    if not name_matches:
        status = "Suspicious"
        note = (
            f"Certificate number matches the registry, but the establishment name "
            f"looks different (similarity {int(name_score * 100)}%)."
        )
    elif est_status in ("rejected", "haram"):
        status = "Invalid"
        note = "This establishment's certification record is rejected or invalid in the HalalVerify registry."
    elif est_status in ("suspended", "flagged", "permanently_closed", "closed", "demolished", "relocated"):
        status = "Suspended"
        note = f"This establishment is currently marked as '{est_status.replace('_', ' ')}' in the HalalVerify registry."
    elif est_status == "expired" or _is_past_date(expiry_date):
        status = "Expired"
        note = (
            f"Certificate matched the HalalVerify registry, but expired on {expiry_date}."
            if expiry_date
            else "Certificate matched the HalalVerify registry, but its certification status is expired."
        )
    elif est_status in ("needs_review", "pending_review", "pending_verification", "pending"):
        status = "Suspicious"
        note = "This establishment's certification record is currently pending administrative review."
    elif match_confidence and match_confidence < 0.85:
        status = "Valid"
        note = (
            "Certificate matched the registry using fuzzy OCR matching. "
            "Manual review is still recommended."
        )
    else:
        status = "Valid"
        note = (
            "Certificate number and establishment name match the HalalVerify registry record."
        )
        if est_status == "for_renewal":
            note += " Notice: Establishment certification is currently flagged for renewal."

    if low_confidence_note:
        note += low_confidence_note

    recommendations = [
        "This result is advisory only.",
        "For official verification, confirm with the certifying body.",
    ]

    if layout_confidence < 0.5:
        recommendations.insert(0, "Retake the photo in brighter light with less blur.")

    return {
        **result,
        "status": status,
        "expirationDate": expiry_date or result.get("expirationDate"),
        "establishmentName": expected_name or extracted_name,
        "authenticationNote": note,
        "registryMatch": {
            "id": establishment.get("id"),
            "name": establishment.get("name"),
            "halal_status": establishment.get("halal_status"),
            "certificate_number": establishment.get("certificate_number"),
            "expiry_date": establishment.get("expiry_date"),
            "certifying_body": establishment.get("certifying_bodies"),
        },
        "recommendations": recommendations,
    }


def _is_past_date(value):
    if not value:
        return False

    try:
        manila_today = datetime.now(timezone(timedelta(hours=8))).date()
        return date.fromisoformat(str(value).strip()[:10]) < manila_today
    except ValueError:
        return False
