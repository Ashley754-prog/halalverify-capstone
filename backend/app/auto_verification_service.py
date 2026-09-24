import base64
import datetime
import re
from difflib import SequenceMatcher
from typing import Any, Dict, Optional, Tuple

import httpx
from app.certificate_service import (
    extract_certificate_number,
    extract_certifying_body,
    extract_establishment_name,
    extract_expiration_date,
    fuzzy_match_score,
)
from app.ocr_service import extract_text_from_image, normalize_text
from app.supabase_client import supabase

# Accredited Certifying Body Acronyms recognized by Philippine and International Halal authorities
ACCREDITED_HCB_CODES = {
    "IDCP", "HDIP", "MMHCB", "UCZP", "PUCOI", "BPCC", "AHIP",
    "HICCIP", "JAKIM", "MUIS", "PRIME", "FIQHI", "MASLAHA",
    "PHILCOSED", "BUSC", "NCMF", "DTI", "MINHA"
}


def fetch_image_base64_from_url(url: str, timeout: float = 6.0) -> Optional[str]:
    """
    Safely retrieves an image from a URL or parses Data URI, returning clean base64 string.
    """
    if not url or not isinstance(url, str):
        return None

    trimmed = url.strip()

    # Handle Data URI
    if trimmed.startswith("data:image"):
        parts = trimmed.split(",", 1)
        if len(parts) == 2:
            return parts[1]
        return None

    # Handle HTTP/HTTPS URL
    if trimmed.startswith("http://") or trimmed.startswith("https://"):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                resp = client.get(trimmed)
                if resp.status_code == 200 and resp.content:
                    return base64.b64encode(resp.content).decode("utf-8")
        except Exception as err:
            print(f"[AutoVerify] Warning: Could not fetch image from {trimmed[:60]}...: {err}")
            return None

    return None


def parse_date_safe(date_str: Optional[str]) -> Optional[datetime.date]:
    """
    Safely parses various date formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY).
    """
    if not date_str or not isinstance(date_str, str):
        return None

    clean = date_str.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            return datetime.datetime.strptime(clean, fmt).date()
        except ValueError:
            continue

    # Try ISO timestamp
    try:
        return datetime.date.fromisoformat(clean[:10])
    except Exception:
        return None


def evaluate_establishment_submission(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Automated AI verification engine for submitted establishments.
    Evaluates accredited HCB credentials, active expiry date, OCR text, and name matching.
    Returns audit scores, auto-approval decision, and enriched database payload.
    """
    name = (payload.get("name") or "").strip()
    cert_no = (payload.get("certificate_number") or "").strip() or None
    expiry_str = payload.get("expiry_date")
    hcb_id = payload.get("certifying_body_id")
    cert_url = payload.get("certificate_url")

    score = 0
    reasons = []
    audit_notes = []
    ocr_text = ""

    # 1. OCR Document Processing (if certificate image/URL provided)
    if cert_url:
        img_b64 = fetch_image_base64_from_url(cert_url)
        if img_b64:
            try:
                ocr_text = extract_text_from_image(img_b64)
                if ocr_text:
                    audit_notes.append("OCR text successfully extracted from uploaded certificate.")
                    # Extract fields from OCR if not entered by user
                    if not cert_no:
                        extracted_no, _ = extract_certificate_number(ocr_text)
                        if extracted_no:
                            cert_no = extracted_no
                            audit_notes.append(f"Auto-detected certificate number from document: {cert_no}")

                    if not expiry_str:
                        extracted_exp = extract_expiration_date(ocr_text)
                        if extracted_exp:
                            expiry_str = extracted_exp
                            audit_notes.append(f"Auto-detected expiration date from document: {expiry_str}")
            except Exception as ocr_err:
                print(f"[AutoVerify] OCR processing notice: {ocr_err}")

    # 2. Factor 1: Accredited Halal Certifying Body (Weight: 35 points)
    hcb_matched = False
    hcb_name = "Not specified"

    # Check direct HCB ID if provided
    if hcb_id:
        try:
            hcb_res = supabase.table("certifying_bodies").select("id, name, code").eq("id", hcb_id).execute()
            if hcb_res.data:
                hcb_matched = True
                hcb_name = hcb_res.data[0].get("name", "Accredited HCB")
        except Exception:
            pass

    # Check text/certificate number for accredited HCB acronyms
    if not hcb_matched and cert_no:
        upper_cert = cert_no.upper()
        for code in ACCREDITED_HCB_CODES:
            if code in upper_cert:
                hcb_matched = True
                hcb_name = f"Accredited Body ({code})"
                break

    if not hcb_matched and ocr_text:
        upper_ocr = ocr_text.upper()
        for code in ACCREDITED_HCB_CODES:
            if code in upper_ocr:
                hcb_matched = True
                hcb_name = f"Accredited Body ({code})"
                break

    if hcb_matched:
        score += 35
        audit_notes.append(f"Accredited Halal Certifying Body confirmed: {hcb_name} (+35 pts)")
    else:
        reasons.append("No accredited Halal Certifying Body (HCB) verified on document")

    # 3. Factor 2: Active Expiration Date Validity (Weight: 35 points)
    today = datetime.date.today()
    parsed_expiry = parse_date_safe(expiry_str)
    is_expired = False

    if parsed_expiry:
        if parsed_expiry >= today:
            score += 35
            audit_notes.append(f"Certificate validity active until {parsed_expiry.isoformat()} (+35 pts)")
        else:
            is_expired = True
            reasons.append(f"Certificate has expired on {parsed_expiry.isoformat()} (-35 pts)")
    else:
        reasons.append("Valid certificate expiration date not detected")

    # 4. Factor 3: Business Identity Corroboration (Weight: 30 points)
    name_score = 0
    if ocr_text and name:
        normalized_name = normalize_text(name).lower()
        normalized_ocr = normalize_text(ocr_text).lower()

        if normalized_name in normalized_ocr:
            name_score = 30
            audit_notes.append(f"Establishment name exact match found in certificate document (+30 pts)")
        else:
            similarity = fuzzy_match_score(name, ocr_text)
            if similarity >= 0.70:
                name_score = 30
                audit_notes.append(f"Establishment name strong fuzzy match ({int(similarity*100)}%) (+30 pts)")
            elif similarity >= 0.50:
                name_score = 20
                audit_notes.append(f"Establishment name partial fuzzy match ({int(similarity*100)}%) (+20 pts)")
            else:
                name_score = 5
                reasons.append("Establishment name not clearly found in certificate document text")
    elif cert_no and parsed_expiry and not is_expired:
        # User submitted structured credentials without photo
        name_score = 15
        audit_notes.append("Structured certificate metadata submitted without document photo (+15 pts)")
    else:
        reasons.append("No document photo provided for visual authentication")

    score += name_score

    # 5. Final Decision Evaluation
    # Threshold for Auto-Approval: Score >= 70 AND Not Expired AND Accredited HCB Verified
    is_auto_approved = (score >= 70) and (not is_expired) and hcb_matched
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if is_auto_approved:
        final_status = "verified"
        summary_note = (
            f"AI AUTO-APPROVED (Confidence: {score}%). "
            f"Accredited HCB: {hcb_name}. Expiry: {parsed_expiry.isoformat() if parsed_expiry else 'N/A'}. "
            f"Audit: {'; '.join(audit_notes)}"
        )
    else:
        final_status = "needs_review"
        summary_note = (
            f"AI AUDITED (Confidence: {score}% - Needs Manual Review). "
            f"Issues: {'; '.join(reasons)}. "
            f"Audit: {'; '.join(audit_notes)}"
        )

    return {
        "is_auto_approved": is_auto_approved,
        "score": score,
        "status": final_status,
        "verified_at": now_iso if is_auto_approved else None,
        "verified_by": "AI_AUTOMATED_PIPELINE" if is_auto_approved else None,
        "certificate_number": cert_no,
        "expiry_date": parsed_expiry.isoformat() if parsed_expiry else expiry_str,
        "admin_notes": summary_note,
        "audit_trail": {
            "score": score,
            "hcb_matched": hcb_matched,
            "hcb_name": hcb_name,
            "is_expired": is_expired,
            "notes": audit_notes,
            "reasons": reasons,
        },
    }


def evaluate_product_submission(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Automated AI verification engine for submitted packaged products.
    Evaluates chemical additives, certificate credentials, and brand matching.
    """
    name = (payload.get("name") or "").strip()
    brand = (payload.get("brand") or "").strip() or None
    cert_no = (payload.get("certificate_no") or "").strip() or None
    expiry_str = payload.get("expiry_date")
    hcb_id = payload.get("certifying_body_id")
    ingredients = (payload.get("ingredients_summary") or "").strip()
    image_url = payload.get("image_url")

    score = 0
    reasons = []
    audit_notes = []
    haram_found = []

    # 1. Chemical Additive Screening (E-number and Haram Lexicon)
    if ingredients:
        try:
            additives_res = supabase.table("additives").select("code, name, status").execute()
            additives = additives_res.data or []
            upper_ing = ingredients.upper()
            for add in additives:
                code = (add.get("code") or "").upper()
                add_name = (add.get("name") or "").upper()
                status = (add.get("status") or "").lower()

                if code and code in upper_ing or (add_name and len(add_name) > 3 and add_name in upper_ing):
                    if status == "haram":
                        haram_found.append(f"{code} ({add.get('name')})")
                    elif status == "doubtful":
                        audit_notes.append(f"Screened additive: {code} flagged as doubtful/syubhah.")
        except Exception as add_err:
            print(f"[AutoVerify] Additive screening notice: {add_err}")

    if haram_found:
        reasons.append(f"Prohibited (Haram) additives detected: {', '.join(haram_found)}")

    # 2. Accredited HCB Check (35 pts)
    hcb_matched = False
    hcb_name = "Not specified"

    if hcb_id:
        try:
            hcb_res = supabase.table("certifying_bodies").select("id, name, code").eq("id", hcb_id).execute()
            if hcb_res.data:
                hcb_matched = True
                hcb_name = hcb_res.data[0].get("name", "Accredited HCB")
        except Exception:
            pass

    if not hcb_matched and cert_no:
        upper_cert = cert_no.upper()
        for code in ACCREDITED_HCB_CODES:
            if code in upper_cert:
                hcb_matched = True
                hcb_name = f"Accredited Body ({code})"
                break

    if hcb_matched:
        score += 35
        audit_notes.append(f"Accredited Halal Certifying Body confirmed: {hcb_name} (+35 pts)")
    else:
        reasons.append("No accredited Halal Certifying Body verified")

    # 3. Active Expiration Date Validity (35 pts)
    today = datetime.date.today()
    parsed_expiry = parse_date_safe(expiry_str)
    is_expired = False

    if parsed_expiry:
        if parsed_expiry >= today:
            score += 35
            audit_notes.append(f"Certificate validity active until {parsed_expiry.isoformat()} (+35 pts)")
        else:
            is_expired = True
            reasons.append(f"Certificate has expired on {parsed_expiry.isoformat()} (-35 pts)")
    else:
        reasons.append("Expiration date not provided")

    # 4. Ingredient Cleanliness & Label Verification (30 pts)
    if not haram_found:
        score += 30
        audit_notes.append("Ingredient declaration screened free of known prohibited chemical additives (+30 pts)")

    # Decision
    is_auto_approved = (score >= 70) and (not is_expired) and (not haram_found) and hcb_matched
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if is_auto_approved:
        final_status = "VERIFIED"
        summary_note = (
            f"AI AUTO-APPROVED (Confidence: {score}%). "
            f"Accredited HCB: {hcb_name}. Active validity verified. Additives clean."
        )
    else:
        final_status = "PENDING_VERIFICATION"
        summary_note = (
            f"AI AUDITED (Confidence: {score}% - Needs Manual Review). "
            f"Issues: {'; '.join(reasons)}"
        )

    return {
        "is_auto_approved": is_auto_approved,
        "score": score,
        "status": final_status,
        "verified_at": now_iso if is_auto_approved else None,
        "verified_by": "AI_AUTOMATED_PIPELINE" if is_auto_approved else None,
        "admin_notes": summary_note,
        "audit_trail": {
            "score": score,
            "hcb_matched": hcb_matched,
            "is_expired": is_expired,
            "haram_additives": haram_found,
            "notes": audit_notes,
            "reasons": reasons,
        },
    }
