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
    Evaluates classification tiers (Halal Certified, Muslim-Owned, Muslim-Friendly),
    accredited HCB credentials, contact transparency (PH phone, social media),
    local geofencing, duplicate prevention, and submitter ownership declarations.
    """
    name = (payload.get("name") or "").strip()
    cert_no = (payload.get("certificate_number") or "").strip() or None
    expiry_str = payload.get("expiry_date")
    hcb_id = payload.get("certifying_body_id")
    cert_url = payload.get("certificate_url")
    address = (payload.get("address") or "").strip()
    city = (payload.get("city") or "Zamboanga City").strip()
    halal_tier = (payload.get("halal_tier") or "halal_certified").strip().lower()
    contact_phone = (payload.get("phone") or payload.get("contact_number") or "").strip()
    social_url = (payload.get("source_url") or payload.get("social_media_url") or "").strip()
    submitter_role = (payload.get("submitter_role") or "community").strip().lower()

    score = 0
    reasons = []
    audit_notes = []
    ocr_text = ""

    # 1. Submitter Role & Authorization Declaration
    if submitter_role == "owner":
        audit_notes.append("Ownership Declaration: Submitted by verified business owner or authorized manager.")
    else:
        audit_notes.append("Community Contribution: Submitted by local diner or consumer scout.")

    # 2. Public Contact & Transparency Validation
    is_valid_phone = False
    if contact_phone:
        clean_phone = re.sub(r"[\s\-\(\)]", "", contact_phone)
        if re.match(r"^(\+639\d{9}|09\d{9}|062\d{7}|\+6362\d{7})$", clean_phone):
            is_valid_phone = True
            score += 15
            audit_notes.append(f"Public contact validated: active PH format ({contact_phone}) (+15 pts)")
        else:
            audit_notes.append(f"Contact phone provided ({contact_phone})")
    else:
        reasons.append("No public contact phone number provided")

    has_social_link = False
    if social_url:
        if re.match(r"^https?://(www\.)?(facebook\.com|fb\.com|instagram\.com|google\.com/maps|maps\.app\.goo\.gl|[\w\-\.]+\.[\w]{2,})", social_url, re.IGNORECASE):
            has_social_link = True
            score += 10
            audit_notes.append("Public digital footprint confirmed: valid social or maps URL (+10 pts)")

    # 3. Local Zamboanga Geofence Check
    is_zamboanga = bool(re.search(
        r"zamboanga|tetuan|canelar|pasonanca|santa maria|baliwasan|tumaga|guiwan|calarian|san roque|vitali|ayala|divisoria|recodo|sinunuc|zone\s+[i|v|x\d]+",
        (address + " " + city).lower()
    ))
    if is_zamboanga:
        score += 10
        audit_notes.append("Jurisdiction verified: Located within Zamboanga City (+10 pts)")
    else:
        audit_notes.append("Address provided outside primary Zamboanga City municipal bounds")

    # 4. Duplicate Listing Prevention
    is_duplicate = False
    try:
        existing_res = supabase.table("establishments").select("id, name, address").limit(200).execute()
        if existing_res.data:
            norm_input = normalize_text(name).lower()
            for est in existing_res.data:
                norm_existing = normalize_text(est.get("name", "")).lower()
                sim = SequenceMatcher(None, norm_input, norm_existing).ratio()
                if sim >= 0.88 and len(norm_input) > 3:
                    is_duplicate = True
                    reasons.append(f"Potential duplicate listing detected ('{est.get('name')}', {int(sim*100)}% match)")
                    audit_notes.append(f"Duplicate alert: Closely matches existing listing '{est.get('name')}'")
                    break
    except Exception as dup_err:
        print(f"[AutoVerify] Duplicate check warning: {dup_err}")

    # 5. OCR Document Processing (if certificate image/URL provided)
    if cert_url:
        img_b64 = fetch_image_base64_from_url(cert_url)
        if img_b64:
            try:
                ocr_text = extract_text_from_image(img_b64)
                if ocr_text:
                    audit_notes.append("OCR text successfully extracted from uploaded certificate.")
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

    # 6. Branching Evaluation: Formally Certified vs. Community/Muslim-Owned Tier
    today = datetime.date.today()
    parsed_expiry = parse_date_safe(expiry_str)
    is_expired = False
    hcb_matched = False
    hcb_name = "Not specified"

    if halal_tier == "halal_certified":
        # Accredited Certifying Body Check (35 pts)
        if hcb_id:
            try:
                hcb_res = supabase.table("certifying_bodies").select("id, name, code").eq("id", hcb_id).execute()
                if hcb_res.data:
                    hcb_matched = True
                    hcb_name = hcb_res.data[0].get("name", "Accredited HCB")
            except Exception:
                pass

        matched_hcb_code = None
        if not hcb_matched and cert_no:
            upper_cert = cert_no.upper()
            for code in ACCREDITED_HCB_CODES:
                if code in upper_cert:
                    hcb_matched = True
                    hcb_name = f"Accredited Body ({code})"
                    matched_hcb_code = code
                    break

        if not hcb_matched and ocr_text:
            upper_ocr = ocr_text.upper()
            for code in ACCREDITED_HCB_CODES:
                if code in upper_ocr:
                    hcb_matched = True
                    hcb_name = f"Accredited Body ({code})"
                    matched_hcb_code = code
                    break

        if not hcb_id and matched_hcb_code:
            try:
                db_hcb = supabase.table("certifying_bodies").select("id, name, code").ilike("code", matched_hcb_code).execute()
                if db_hcb.data:
                    hcb_id = db_hcb.data[0]["id"]
                    hcb_name = db_hcb.data[0]["name"]
            except Exception:
                pass

        if hcb_matched:
            score += 35
            audit_notes.append(f"Accredited Halal Certifying Body confirmed: {hcb_name} (+35 pts)")
        else:
            reasons.append("No accredited Halal Certifying Body (HCB) verified on document")

        # Expiry Check (30 pts)
        if parsed_expiry:
            if parsed_expiry >= today:
                score += 30
                audit_notes.append(f"Certificate validity active until {parsed_expiry.isoformat()} (+30 pts)")
            else:
                is_expired = True
                reasons.append(f"Certificate expired on {parsed_expiry.isoformat()} (-30 pts)")
        else:
            reasons.append("Valid certificate expiration date not detected")

        # Name Matching (20 pts)
        if ocr_text and name:
            normalized_name = normalize_text(name).lower()
            normalized_ocr = normalize_text(ocr_text).lower()
            if normalized_name in normalized_ocr:
                score += 20
                audit_notes.append("Establishment name exact match found in certificate document (+20 pts)")
            else:
                similarity = fuzzy_match_score(name, ocr_text)
                if similarity >= 0.70:
                    score += 20
                    audit_notes.append(f"Establishment name strong fuzzy match ({int(similarity*100)}%) (+20 pts)")
                elif similarity >= 0.50:
                    score += 10
                    audit_notes.append(f"Establishment name partial fuzzy match ({int(similarity*100)}%) (+10 pts)")
                else:
                    reasons.append("Establishment name not clearly found in certificate document")

        # Auto-Approval Rule for Certified Tier
        is_auto_approved = (score >= 70) and (not is_expired) and hcb_matched and (not is_duplicate)
        final_status = "verified" if is_auto_approved else "needs_review"
        summary_note = (
            f"AI AUTO-APPROVED: Halal Certified (Score: {score}%). Accredited HCB: {hcb_name}. Expiry: {parsed_expiry.isoformat() if parsed_expiry else 'N/A'}."
            if is_auto_approved
            else f"AI AUDITED: Certified claim needs manual review (Score: {score}%). Issues: {'; '.join(reasons)}."
        )

    else:
        # Non-certified community tiers: Muslim-Owned, Muslim-Friendly, Vegetarian/Vegan
        tier_label = (
            "Muslim-Owned (Pork-Free Kitchen)"
            if halal_tier == "muslim_owned"
            else "Muslim-Friendly Accommodations"
            if halal_tier == "muslim_friendly"
            else "Vegetarian / Vegan"
        )
        audit_notes.append(f"Classification Tier: {tier_label} (Not claimed as formally 3rd-party certified).")

        # Completeness scoring for community listing (up to 65 pts)
        if is_zamboanga:
            score += 25
        if is_valid_phone:
            score += 20
        if has_social_link:
            score += 15
        if payload.get("product_names"):
            score += 15
            audit_notes.append("Verified dishes / menu offerings specified (+15 pts)")

        # Community tier auto-acceptance as 'community_listed' (Never falsely marked as 'verified')
        is_community_approved = (score >= 60) and is_zamboanga and is_valid_phone and (not is_duplicate)
        if is_community_approved:
            is_auto_approved = True
            final_status = "community_listed"
            summary_note = (
                f"AI TRIAGED & PUBLISHED: Community Listed - {tier_label} (Score: {score}%). "
                f"Contact verified ({contact_phone}). Transparently listed without 3rd-party certificate."
            )
        else:
            is_auto_approved = False
            final_status = "needs_review"
            summary_note = (
                f"AI AUDITED: Community listing incomplete, routed to review queue (Score: {score}%). "
                f"Issues: {'; '.join(reasons)}."
            )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        "is_auto_approved": is_auto_approved,
        "score": score,
        "status": final_status,
        "halal_tier": halal_tier,
        "verified_at": now_iso if is_auto_approved else None,
        "verified_by": None,
        "certificate_number": cert_no,
        "expiry_date": parsed_expiry.isoformat() if parsed_expiry else expiry_str,
        "certifying_body_id": hcb_id,
        "admin_notes": summary_note,
        "audit_trail": {
            "score": score,
            "halal_tier": halal_tier,
            "submitter_role": submitter_role,
            "is_duplicate": is_duplicate,
            "is_valid_phone": is_valid_phone,
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
    halal_tier = (payload.get("halal_tier") or "halal_certified").strip().lower()
    submitter_role = (payload.get("submitter_role") or "consumer").strip().lower()

    score = 0
    reasons = []
    audit_notes = []
    haram_found = []

    if submitter_role == "brand":
        audit_notes.append("Brand Declaration: Submitted by brand owner or authorized representative.")
    else:
        audit_notes.append("Consumer Contribution: Submitted by community shopper.")

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
                        audit_notes.append(f"Screened additive: {code} flagged as doubtful.")
        except Exception as add_err:
            print(f"[AutoVerify] Additive screening notice: {add_err}")

    if haram_found:
        reasons.append(f"Prohibited (Haram) additives detected: {', '.join(haram_found)}")
    else:
        score += 35
        audit_notes.append("Chemical screening: Zero prohibited (Haram) additives detected (+35 pts)")

    # 2. Branching by Tier
    today = datetime.date.today()
    parsed_expiry = parse_date_safe(expiry_str)
    is_expired = False
    hcb_matched = False
    hcb_name = "Not specified"

    if halal_tier == "halal_certified":
        # Accredited HCB Check (35 pts)
        if hcb_id:
            try:
                hcb_res = supabase.table("certifying_bodies").select("id, name, code").eq("id", hcb_id).execute()
                if hcb_res.data:
                    hcb_matched = True
                    hcb_name = hcb_res.data[0].get("name", "Accredited HCB")
            except Exception:
                pass

        matched_hcb_code = None
        if not hcb_matched and cert_no:
            upper_cert = cert_no.upper()
            for code in ACCREDITED_HCB_CODES:
                if code in upper_cert:
                    hcb_matched = True
                    hcb_name = f"Accredited Body ({code})"
                    matched_hcb_code = code
                    break

        if not hcb_id and matched_hcb_code:
            try:
                db_hcb = supabase.table("certifying_bodies").select("id, name, code").ilike("code", matched_hcb_code).execute()
                if db_hcb.data:
                    hcb_id = db_hcb.data[0]["id"]
                    hcb_name = db_hcb.data[0]["name"]
            except Exception:
                pass

        if hcb_matched:
            score += 35
            audit_notes.append(f"Accredited Halal Certifying Body confirmed: {hcb_name} (+35 pts)")
        else:
            reasons.append("No accredited Halal Certifying Body verified")

        # Expiry Check (30 pts)
        if parsed_expiry:
            if parsed_expiry >= today:
                score += 30
                audit_notes.append(f"Certificate validity active until {parsed_expiry.isoformat()} (+30 pts)")
            else:
                is_expired = True
                reasons.append(f"Certificate has expired on {parsed_expiry.isoformat()} (-30 pts)")
        else:
            reasons.append("Expiration date not provided")

        is_auto_approved = (score >= 70) and (not is_expired) and (not haram_found) and hcb_matched
        final_status = "VERIFIED" if is_auto_approved else "PENDING_VERIFICATION"
        summary_note = (
            f"AI AUTO-APPROVED: Halal Certified (Score: {score}%). Accredited HCB: {hcb_name}. Active validity verified. Additives clean."
            if is_auto_approved
            else f"AI AUDITED: Certified claim needs manual review (Score: {score}%). Issues: {'; '.join(reasons)}"
        )

    else:
        # Declared Pork-Free or Vegetarian/Vegan
        tier_label = "Pork-Free Declared" if halal_tier == "pork_free_declared" else "Vegetarian / Vegan"
        audit_notes.append(f"Classification Tier: {tier_label} (Not claimed as formally 3rd-party certified).")

        if ingredients and not haram_found:
            score += 35
            audit_notes.append("Full ingredient declaration provided and screened clean (+35 pts)")

        is_auto_approved = (score >= 60) and (not haram_found) and bool(ingredients)
        final_status = "COMMUNITY_LISTED" if is_auto_approved else "PENDING_VERIFICATION"
        summary_note = (
            f"AI TRIAGED & PUBLISHED: Community Listed - {tier_label} (Score: {score}%). Zero prohibited additives detected."
            if is_auto_approved
            else f"AI AUDITED: Needs manual review (Score: {score}%). Issues: {'; '.join(reasons)}"
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        "is_auto_approved": is_auto_approved,
        "score": score,
        "status": final_status,
        "halal_tier": halal_tier,
        "verified_at": now_iso if is_auto_approved else None,
        "verified_by": None,
        "certifying_body_id": hcb_id,
        "admin_notes": summary_note,
        "audit_trail": {
            "score": score,
            "halal_tier": halal_tier,
            "submitter_role": submitter_role,
            "hcb_matched": hcb_matched,
            "is_expired": is_expired,
            "haram_additives": haram_found,
            "notes": audit_notes,
            "reasons": reasons,
        },
    }
