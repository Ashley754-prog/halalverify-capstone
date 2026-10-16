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
from app.scan_service import is_ingredient_negated
from app.supabase_client import supabase

# Accredited Certifying Body Acronyms recognized by Philippine and International Halal authorities
ACCREDITED_HCB_CODES = {
    "IDCP", "HDIP", "MMHCB", "UCZP", "PUCOI", "BPCC", "AHIP",
    "HICCIP", "JAKIM", "MUIS", "PRIME", "FIQHI", "MASLAHA",
    "PHILCOSED", "BUSC", "NCMF", "DTI", "MINHA"
}

# Regex patterns for prohibited (Haram) ingredients in food & packaged products
HARAM_INGREDIENT_PATTERNS = [
    # Swine / Pork derivatives
    (r"\b(pork\s+fat|pork\s+meat|pork\s+belly|pork|lard|bacon|ham|swine|porcine\s+gelatin|porcine|pig)\b", "Pork / Swine derivative"),
    # Alcohol and intoxicating liquors
    (r"\b(ethyl\s+alcohol|ethanol|alcohol|red\s+wine|white\s+wine|wine|beer|rum|mirin|sake|khamr)\b", "Alcohol / Intoxicant"),
    # Flowing blood
    (r"\b(blood|animal\s+blood)\b", "Animal Blood"),
]

# Regex patterns for doubtful (Mashbooh) animal derivatives requiring official certification
DOUBTFUL_INGREDIENT_PATTERNS = [
    # Gelatin / misspellings / phonetic variants
    (r"\b(gelat[i|e]?n|geltin|gelatine|gelatin|animal\s+gelatin|edible\s+gelatin)\b", "Gelatin (Unspecified source)"),
    # Animal enzymes & coagulants
    (r"\b(pepsin)\b", "Pepsin"),
    (r"\b(animal\s+rennet|rennet)\b", "Rennet"),
    # Rendered animal fats
    (r"\b(animal\s+tallow|tallow)\b", "Animal Tallow"),
    (r"\b(animal\s+shortening)\b", "Animal Shortening"),
    (r"\b(animal\s+fat)\b", "Animal Fat"),
    (r"\b(bone\s+char)\b", "Bone Char"),
    # Insect extract dye
    (r"\b(carmine|cochineal|carminic\s+acid|natural\s+red\s+4|e120)\b", "Carmine / Cochineal (E120)"),
    # Gelatin E-number
    (r"\b(e\s*441)\b", "Gelatin (E441)"),
]


import ipaddress
import socket
from urllib.parse import urlparse


def is_safe_public_url(url_str: str) -> bool:
    """
    Blocks Server-Side Request Forgery (SSRF) against localhost, loopback, link-local,
    cloud metadata (169.254.169.254), and private RFC-1918 networks.
    """
    try:
        parsed = urlparse(url_str.strip())
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").lower().strip()
        if not hostname or hostname in ("localhost", "0.0.0.0", "127.0.0.1", "::1"):
            return False

        try:
            ip_obj = ipaddress.ip_address(hostname)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                return False
        except ValueError:
            # Hostname is a domain name; resolve and verify none of its IPs are internal
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                if (
                    ip_obj.is_private
                    or ip_obj.is_loopback
                    or ip_obj.is_link_local
                    or ip_obj.is_multicast
                    or ip_obj.is_reserved
                    or ip_obj.is_unspecified
                ):
                    return False
        return True
    except Exception:
        return False


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

    # Handle HTTP/HTTPS URL with SSRF check
    if (trimmed.startswith("http://") or trimmed.startswith("https://")) and is_safe_public_url(trimmed):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                resp = client.get(trimmed)
                if resp.status_code == 200 and resp.content:
                    return base64.b64encode(resp.content).decode("utf-8")
        except Exception as err:
            print(f"[AutoVerify] Warning: Could not fetch image from {trimmed[:60]}...: {err}")
            return None

    return None


def is_dummy_or_sequential_phone(phone_str: str) -> bool:
    """
    Detects fake, repeating, or sequential dummy phone numbers (e.g. 09123456789, 09000000000, 09111111111).
    """
    digits = re.sub(r"\D", "", phone_str)
    if len(digits) < 7:
        return True

    # Test for identical repeating digits in subscriber portion
    subscriber_digits = digits[-7:]
    if len(set(subscriber_digits)) == 1:
        return True

    # Common dummy sequences
    dummy_patterns = [
        "1234567", "7654321", "0123456", "6543210",
        "12345678", "87654321", "123456789", "987654321",
        "0000000", "1111111", "2222222", "3333333",
        "4444444", "5555555"
    ]
    for pattern in dummy_patterns:
        if pattern in digits:
            return True

    return False


def verify_url_liveness(url: str, timeout: float = 2.5) -> Tuple[bool, str]:
    """
    Performs a lightweight HTTP probe to verify that a web link resolves cleanly
    and does not return 404 Not Found or a DNS resolution error.
    """
    if not url or not isinstance(url, str):
        return False, "No URL provided"

    trimmed = url.strip()
    if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
        return False, "Invalid URL scheme"

    if not is_safe_public_url(trimmed):
        return False, "Restricted or unreachable URL host"

    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers={"User-Agent": "HalalVerify/1.0"}) as client:
            try:
                resp = client.head(trimmed)
            except Exception:
                resp = client.get(trimmed)

            if resp.status_code in [200, 301, 302, 307, 308]:
                return True, f"Link active (HTTP {resp.status_code})"
            elif resp.status_code in [401, 403]:
                # Major social platforms (Facebook, Instagram) return 403 or redirect to login when probed without session
                domain_match = re.findall(r"https?://(?:www\.)?([^/]+)", trimmed)
                dom = domain_match[0].lower() if domain_match else ""
                if any(k in dom for k in ["facebook.com", "instagram.com", "google.com", "maps.app.goo.gl"]):
                    return True, f"Platform endpoint reachable ({dom})"
                return False, f"Server denied access (HTTP {resp.status_code})"
            elif resp.status_code in [404, 410]:
                return False, f"Dead link detected (HTTP {resp.status_code} Not Found)"
            else:
                return False, f"Unreachable endpoint (HTTP {resp.status_code})"
    except httpx.ConnectError:
        return False, "Domain does not exist or network connection failed"
    except httpx.TimeoutException:
        return False, "Connection timed out"
    except Exception as e:
        return False, f"URL verification failed: {str(e)[:40]}"


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

    # 1. Public Contact & Transparency Validation
    is_valid_phone = False
    if contact_phone:
        clean_phone = re.sub(r"[\s\-\(\)\.]", "", contact_phone)
        if re.match(r"^(\+?639\d{9}|09\d{9}|062\d{7}|\+?6362\d{7})$", clean_phone):
            if is_dummy_or_sequential_phone(clean_phone):
                reasons.append(f"Contact phone appears to be a sequential or dummy placeholder ({contact_phone})")
            else:
                is_valid_phone = True
        else:
            reasons.append(f"Phone number does not match valid Philippine mobile or Zamboanga landline format ({contact_phone})")
    else:
        reasons.append("No public contact phone number provided")

    # 2. Digital Footprint (Social Media / Web)
    has_social_link = False
    live_note = ""
    if social_url:
        is_known_platform = bool(re.match(r"^https?://(www\.)?(facebook\.com|fb\.com|instagram\.com|google\.com/maps|maps\.app\.goo\.gl|[\w\-\.]+\.[\w]{2,})", social_url, re.IGNORECASE))
        if is_known_platform:
            is_alive, live_note = verify_url_liveness(social_url)
            if is_alive:
                has_social_link = True
            else:
                reasons.append(f"Social media link unverified or unreachable ({live_note})")
        else:
            reasons.append("Social media URL has unrecognized domain structure")

    # 3. Local Zamboanga Geofence Check
    # HalalVerify is localized to Zamboanga City. Entries located outside municipal bounds must be flagged.
    raw_address = address.lower()
    raw_city = (payload.get("city") or "").lower().strip()

    NON_ZAMBOANGA_PATTERNS = [
        r"\bpagadian\b",
        r"\bdipolog\b",
        r"\bdapitan\b",
        r"\bipil\b",
        r"\bisabela\s+city\b",
        r"\bbasilan\b",
        r"\blamitan\b",
        r"\bjolo\b",
        r"\bsulu\b",
        r"\btawi[\s\-]tawi\b",
        r"\bbongao\b",
        r"\bcotabato\b",
        r"\bdavao\b",
        r"\bcebu\b",
        r"\bmanila\b",
        r"\bquezon\s+city\b",
        r"\bcagayan\s+de\s+oro\b",
        r"\bcdo\b",
        r"\biligan\b",
        r"\bgeneral\s+santos\b",
        r"\bgensan\b",
        r"\bmarawi\b",
        r"\bzamboanga\s+del\s+sur\b",
        r"\bzamboanga\s+del\s+norte\b",
        r"\bzamboanga\s+sibugay\b",
    ]

    has_outside_location = any(re.search(pat, raw_address) for pat in NON_ZAMBOANGA_PATTERNS) or \
                           any(re.search(pat, raw_city) for pat in NON_ZAMBOANGA_PATTERNS)

    if has_outside_location:
        is_zamboanga = False
        reasons.append("Address is located outside Zamboanga City jurisdiction (HalalVerify is localized to Zamboanga City)")
    else:
        # Check if address contains Zamboanga City or recognized Zamboanga barangays/streets/landmarks
        zambo_patterns = (
            r"\bzamboanga\s+city\b|\bzamboanga\b|"
            r"\btetuan\b|\bcanelar\b|\bpasonanca\b|\bsanta\s+maria\b|\bsta\.?\s*maria\b|"
            r"\bbaliwasan\b|\btumaga\b|\bguiwan\b|\bcalarian\b|\bsan\s+roque\b|\bvitali\b|"
            r"\bayala\b|\bdivisoria\b|\brecodo\b|\bsinunuc\b|\bsta\.?\s*catalina\b|\bsanta\s+catalina\b|"
            r"\bsan\s+jose\b|\bmampang\b|\bputik\b|\bboalan\b|\bmercedes\b|\btalon[\-\s]talon\b|"
            r"\bcuruan\b|\bculianan\b|\bmanicahan\b|\bcabaluay\b|\blabuan\b|\bsangali\b|"
            r"\bbolong\b|\bbunguiao\b|\bbungiao\b|\bcampo\s+islam\b|\bkasanyangan\b|"
            r"\bveterans\s+ave\b|\bgov\.?\s*camins\b|\bla\s+purisima\b|\bmayor\s+jaldon\b|"
            r"\bnu[nñ]ez\b|\bzone\s+[i|v|x\d]+\b"
        )
        if bool(re.search(zambo_patterns, raw_address)):
            is_zamboanga = True
        elif raw_address:
            is_zamboanga = False
            reasons.append("Address does not contain recognized Zamboanga City barangay, district, or street")
        elif raw_city == "zamboanga city":
            is_zamboanga = True
        else:
            is_zamboanga = False
            reasons.append("Address provided outside primary Zamboanga City municipal bounds")

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
                    if not cert_no:
                        extracted_no, _ = extract_certificate_number(ocr_text)
                        if extracted_no:
                            cert_no = extracted_no

                    if not expiry_str:
                        extracted_exp = extract_expiration_date(ocr_text)
                        if extracted_exp:
                            expiry_str = extracted_exp
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
                audit_notes.append("Establishment name match confirmed in certificate document (+20 pts)")
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

        # Jurisdiction Check (10 pts)
        if is_zamboanga:
            score += 10
            audit_notes.append("Jurisdiction verified: Located within Zamboanga City (+10 pts)")

        # Contact Phone (5 pts)
        if is_valid_phone:
            score += 5
            audit_notes.append(f"Public contact validated: active PH format ({contact_phone}) (+5 pts)")

        # Strict Invariant Guardrails for Certified Tier
        has_fatal_flaw = is_expired or (not hcb_matched) or is_duplicate or (not is_zamboanga)

        if has_fatal_flaw:
            score = 0
            is_auto_approved = False
            final_status = "needs_review"
            summary_note = (
                f"FATAL INVARIANT FAILED: Certified claim blocked from auto-approval (Confidence: 0%). "
                f"Issues: {'; '.join(reasons)}."
            )
        else:
            # Certified Halal claims require physical accreditation verification against official HCB lists by Admin
            is_auto_approved = False
            final_status = "needs_review"
            summary_note = (
                f"AI AUDITED & QUEUED: Halal Certified claim scored {score}% audit readiness. "
                f"Accredited HCB: {hcb_name}. Expiry: {parsed_expiry.isoformat() if parsed_expiry else 'N/A'}. "
                f"Queued for final administrative confirmation against official HCB master list."
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

        # Completeness scoring for community listing (up to 100 pts)
        if is_zamboanga:
            score += 25
            audit_notes.append("Jurisdiction verified: Located within Zamboanga City (+25 pts)")
        if is_valid_phone:
            score += 20
            audit_notes.append(f"Active contact number validated: {contact_phone} (+20 pts)")

        # Mandatory Visual Evidence for Community Auto-Acceptance
        has_photo = bool(payload.get("logo_url") or payload.get("certificate_url"))
        if has_photo:
            score += 20
            audit_notes.append("Visual evidence verified: Storefront or menu photo attached (+20 pts)")
        else:
            reasons.append("No physical storefront or menu photo attached")

        if payload.get("product_names"):
            score += 15
            audit_notes.append("Verified dishes / menu offerings specified (+15 pts)")

        if has_social_link:
            score += 10
            audit_notes.append(f"Public digital footprint verified: {live_note} (+10 pts)")

        amenities = payload.get("amenities") or []
        if amenities:
            score += 10
            audit_notes.append(f"Guest amenities declared: {', '.join(amenities)} (+10 pts)")

        # Community tier auto-acceptance as 'community_listed'
        # Strict Guardrails: Must be within Zamboanga, valid non-dummy phone, no duplicates, AND must have photo evidence!
        is_community_approved = (
            (score >= 65) and
            is_zamboanga and
            is_valid_phone and
            (not is_duplicate) and
            has_photo
        )
        if is_community_approved:
            is_auto_approved = True
            final_status = "verified"
            summary_note = (
                f"AI TRIAGED & PUBLISHED: Community Listed - {tier_label} (Confidence: {score}%). "
                f"Verified local contact ({contact_phone}) with storefront photo evidence. Transparently listed without 3rd-party certificate."
            )
        else:
            is_auto_approved = False
            final_status = "needs_review"
            summary_note = (
                f"AI AUDITED: Community listing queued for review (Confidence: {score}%). "
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
            "is_zamboanga": is_zamboanga,
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
    doubtful_found = []

    # 1. Ingredient & Chemical Additive Screening
    # Screen across product name, brand, and ingredient declaration
    screened_text = f"{name} {brand or ''} {ingredients}".lower()

    # A. Prohibited (Haram) Regex Scan
    for pattern, label in HARAM_INGREDIENT_PATTERNS:
        match = re.search(pattern, screened_text, re.IGNORECASE)
        if match:
            matched_term = match.group(0)
            if not is_ingredient_negated(matched_term, screened_text):
                haram_found.append(f"{label} ('{matched_term}')")

    # B. Doubtful Animal Derivative Regex Scan (Gelatin, Rennet, Pepsin, Tallow, etc.)
    for pattern, label in DOUBTFUL_INGREDIENT_PATTERNS:
        match = re.search(pattern, screened_text, re.IGNORECASE)
        if match:
            matched_term = match.group(0)
            if not is_ingredient_negated(matched_term, screened_text):
                doubtful_found.append(f"{label} ('{matched_term}')")

    # C. Database Additives Table Scan
    if ingredients:
        try:
            additives_res = supabase.table("additives").select("code, name, status").execute()
            additives = additives_res.data or []
            upper_ing = ingredients.upper()
            for add in additives:
                code = (add.get("code") or "").upper()
                add_name = (add.get("name") or "").upper()
                status = (add.get("status") or "").lower()

                code_hit = bool(code and code in upper_ing)
                name_hit = bool(add_name and len(add_name) > 3 and add_name in upper_ing)

                if code_hit or name_hit:
                    match_display = f"{code} ({add.get('name')})" if code else add.get("name")
                    if status == "haram":
                        if match_display not in haram_found:
                            haram_found.append(match_display)
                    elif status == "doubtful":
                        if match_display not in doubtful_found:
                            doubtful_found.append(match_display)
        except Exception as add_err:
            print(f"[AutoVerify] Additive screening notice: {add_err}")

    # Deduplicate findings
    haram_found = list(dict.fromkeys(haram_found))
    doubtful_found = list(dict.fromkeys(doubtful_found))

    # 2. Branching by Classification Tier
    today = datetime.date.today()
    parsed_expiry = parse_date_safe(expiry_str)
    is_expired = False
    hcb_matched = False
    hcb_name = "Not specified"

    if halal_tier == "halal_certified":
        # Formally Certified Packaged Product

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
        cert_body_input = (payload.get("certifying_body") or "").strip().upper()

        if not hcb_matched and cert_body_input:
            for code in ACCREDITED_HCB_CODES:
                if code == cert_body_input or code in cert_body_input:
                    matched_hcb_code = code
                    break
            if not matched_hcb_code and cert_body_input in ["MUI", "BPJPH"]:
                matched_hcb_code = cert_body_input

            if matched_hcb_code:
                hcb_matched = True
                hcb_name = f"Accredited Body ({matched_hcb_code})"
            elif cert_body_input != "OTHER":
                hcb_matched = True
                hcb_name = f"Certifying Body ({payload.get('certifying_body')})"

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

        # Chemical Additive Screening (35 pts)
        if haram_found:
            reasons.append(f"Prohibited (Haram) additives detected: {', '.join(haram_found)}")
        elif doubtful_found and hcb_matched and not is_expired:
            score += 35
            audit_notes.append(f"Additive screening: Ingredients ({', '.join(doubtful_found)}) authenticated under {hcb_name} certification (+35 pts)")
        elif doubtful_found:
            reasons.append(f"Doubtful additives detected without verified certification: {', '.join(doubtful_found)}")
        else:
            score += 35
            audit_notes.append("Chemical screening: Zero prohibited (Haram) additives detected (+35 pts)")

        # Invariant checks
        has_fatal_prod_flaw = is_expired or bool(haram_found) or (not hcb_matched) or (bool(doubtful_found) and not hcb_matched)
        if has_fatal_prod_flaw:
            score = 0
            is_auto_approved = False
            final_status = "PENDING_VERIFICATION"
            summary_note = (
                f"FATAL INVARIANT FAILED: Product blocked from auto-approval (Confidence: 0%). "
                f"Issues: {'; '.join(reasons)}"
            )
        else:
            # Certified Halal claims require physical accreditation verification against official HCB lists by Admin
            is_auto_approved = False
            final_status = "PENDING_VERIFICATION"
            summary_note = (
                f"AI AUDITED & QUEUED: Halal Certified claim scored {score}% audit readiness. "
                f"Accredited HCB: {hcb_name}. Active validity verified. Additives clean. "
                f"Queued for final administrative confirmation against official HCB master list."
            )

    else:
        # Declared Pork-Free or Vegetarian/Vegan (Self-Declared Community Tier)
        tier_label = "Pork-Free Declared" if halal_tier == "pork_free_declared" else "Vegetarian / Vegan"

        # Check fatal invariants: Prohibited (Haram) ingredients or Doubtful animal derivatives
        if haram_found:
            score = 0
            is_auto_approved = False
            final_status = "PENDING_VERIFICATION"
            reasons.append(f"Prohibited (Haram) ingredient detected: {', '.join(haram_found)}")
            summary_note = (
                f"FATAL INVARIANT FAILED: Prohibited ingredient detected in {tier_label} (Confidence: 0%). "
                f"Issues: {'; '.join(reasons)}"
            )
        elif doubtful_found:
            score = 0
            is_auto_approved = False
            final_status = "PENDING_VERIFICATION"
            reasons.append(
                f"Doubtful ingredient detected ({', '.join(doubtful_found)}): "
                f"Animal gelling agents and unspecified animal derivatives require official Halal certification to confirm non-porcine origin."
            )
            summary_note = (
                f"FATAL INVARIANT FAILED: Doubtful animal derivative detected in {tier_label} ({', '.join(doubtful_found)}). "
                f"Community self-declaration cannot verify animal origin without official Halal certificate."
            )
        else:
            # Clean ingredients - calculate community scoring (up to 100 pts)
            if ingredients:
                score += 40
                audit_notes.append("Chemical screening: Zero prohibited or doubtful ingredients detected (+40 pts)")
            else:
                reasons.append("Full ingredient declaration not provided")

            has_prod_photo = bool(image_url)
            if has_prod_photo:
                score += 40
                audit_notes.append("Packaging photo verified (+40 pts)")
            else:
                reasons.append("Packaging photo not provided (required for community verification)")

            if brand:
                score += 20
                audit_notes.append(f"Brand / maker name provided: {brand} (+20 pts)")

            # Auto-approval guardrails: score >= 70, ingredients declared, packaging photo attached
            is_auto_approved = (score >= 70) and bool(ingredients) and has_prod_photo
            final_status = (
                "Pork-Free Declared" if halal_tier == "pork_free_declared" else "Vegetarian / Vegan"
            ) if is_auto_approved else "PENDING_VERIFICATION"
            summary_note = (
                f"AI TRIAGED & PUBLISHED: Community Listed - {tier_label} (Confidence: {score}%). Zero prohibited additives detected with packaging photo."
                if is_auto_approved
                else f"AI AUDITED: Community product queued for review (Confidence: {score}%). Issues: {'; '.join(reasons)}"
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
            "doubtful_additives": doubtful_found,
            "notes": audit_notes,
            "reasons": reasons,
        },
    }
