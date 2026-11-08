"""
Sync Script: Muslim in Manila -> HALALVERIFY
Fetches the latest Zamboanga City dining establishments from musliminmanila.com
and updates or adds them to the Supabase establishments table.
"""

import sys
import os
import uuid
import json
import urllib.request
import ssl
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.supabase_client import supabase


def sync_muslim_in_manila():
    print("=== SYNCING ZAMBOANGA CITY RESTAURANTS FROM MUSLIM IN MANILA ===")

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    url = "https://musliminmanila.com/api/restaurants?location=Zamboanga+City&limit=50"
    print(f"Fetching from: {url}")

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error connecting to Muslim in Manila API: {e}")
        return

    entities = data.get("entities", [])
    print(f"Found {len(entities)} restaurants in Zamboanga City.")

    # Known HCB mappings
    hcb_map = {
        "UCZP": "8d4eef9f-b276-4f0c-97f2-89c8b6a5677d",
        "MMHCBI": "e276a8c2-bbd9-438e-9ec3-30f2073a3ef3",
        "NCMF": "a82e1246-6963-45ff-9a7d-1ecd6d45b5ec",
        "HDIP": "4ef9426c-63f7-44b7-9738-f2b3144c77a5",
        "IDCP": "8885f308-1697-4541-b352-bcbd76227e8b",
    }

    # Fetch existing establishments to avoid duplicates
    existing_res = supabase.table("establishments").select("id, name, certificate_number").execute()
    existing_by_cert = {}
    existing_by_name = {}
    for est in existing_res.data or []:
        if est.get("certificate_number"):
            existing_by_cert[est["certificate_number"]] = est["id"]
        if est.get("name"):
            existing_by_name[est["name"].strip().lower()] = est["id"]

    now_iso = datetime.now(timezone.utc).isoformat()
    updated_count = 0
    created_count = 0

    for e in entities:
        name = e.get("name", "").strip()
        if not name:
            continue

        # Skip duplicate Canelar entry (ID 662) since Bay Tal Mal relocated to SM Mindpro (ID 468)
        if str(e.get("id")) == "662" or "bay tal mal restaurant - canelar" in name.lower():
            continue

        address = e.get("address", "").strip()
        phone = e.get("phone", "").strip() if e.get("phone") else None
        desc = e.get("description", "").strip() if e.get("description") else None

        lat = None
        lng = None
        if e.get("latitude") and e.get("longitude"):
            try:
                lat = float(e["latitude"])
                lng = float(e["longitude"])
            except (ValueError, TypeError):
                pass

        if "malaysian steamboat" in name.lower():
            lat = 6.9165
            lng = 122.0898
        elif "kcc mall" in name.lower() or "kcc mall" in address.lower():
            lat = 6.9197
            lng = 122.0717
        elif lat is None or lng is None:
            lat = 6.9380
            lng = 122.0670

        level_slug = e.get("halal_level_slug", "")
        is_muslim_owned = str(e.get("muslimOwned", "")).lower() in ["yes", "true", "1"]
        cert_acronym = e.get("halal_certifier") or (e.get("certifier") or {}).get("acronym")

        # Formally certified requires both halal_certified level and an accredited HCB
        if level_slug == "halal_certified" and cert_acronym:
            tier_tag = "[Tier: halal_certified]"
            halal_tier = "halal_certified"
            cert_body_id = hcb_map.get(cert_acronym)
            cert_no = f"MIM-HCB-{e.get('id')}"
        elif is_muslim_owned:
            tier_tag = "[Tier: muslim_owned]"
            halal_tier = "muslim_owned"
            cert_body_id = None
            cert_no = None
        else:
            tier_tag = "[Tier: muslim_friendly]"
            halal_tier = "muslim_friendly"
            cert_body_id = None
            cert_no = None

        amenities_list = []
        if e.get("prayerAreaAvailable"):
            amenities_list.append("Dedicated Prayer Space (Musalah)")
        if e.get("wifiAvailable"):
            amenities_list.append("WiFi")
        if e.get("parkingAvailable"):
            amenities_list.append("Parking")

        tags_str = e.get("tags") or ""
        if "no alcohol" in tags_str.lower() or "alcohol free" in tags_str.lower():
            amenities_list.append("100% Alcohol-Free Premises")
        if "no pork" in tags_str.lower() or "pork free" in tags_str.lower():
            amenities_list.append("Pork-Free Kitchen")

        amenities_text = ", ".join(amenities_list) if amenities_list else "Standard Dining"
        admin_notes = f"{tier_tag} Synced from Muslim in Manila (ID: {e.get('id')}). Amenities: {amenities_text}."
        slug = e.get("slug")
        source_url = f"https://musliminmanila.com/restaurant/{slug}" if slug else "https://musliminmanila.com/restaurants?location=Zamboanga+City"

        record_data = {
            "name": name,
            "type": e.get("foodTypes") or "Restaurant",
            "address": address,
            "city": "Zamboanga City",
            "halal_status": "verified",
            "halal_tier": halal_tier,
            "certificate_number": cert_no,
            "certifying_body_id": cert_body_id,
            "latitude": lat,
            "longitude": lng,
            "phone": phone,
            "facebook_url": e.get("facebookUrl"),
            "website_url": e.get("website"),
            "description": desc,
            "submitter_role": "official" if cert_body_id else "owner",
            "source": "Muslim in Manila Directory",
            "source_url": source_url,
            "synced_at": now_iso,
            "verified_at": now_iso,
            "admin_notes": admin_notes,
        }

        # Check if exists
        existing_id = (cert_no and existing_by_cert.get(cert_no)) or existing_by_name.get(name.lower())

        if existing_id:
            # Preserve existing curated description so sync does not overwrite original summaries
            update_data = {k: v for k, v in record_data.items() if k != "description"}
            supabase.table("establishments").update(update_data).eq("id", existing_id).execute()
            updated_count += 1
        else:
            record_data["id"] = str(uuid.uuid4())
            supabase.table("establishments").insert(record_data).execute()
            created_count += 1

    print(f"Sync complete: {created_count} new venues added, {updated_count} existing venues updated.")
    print("=== DONE ===")


if __name__ == "__main__":
    sync_muslim_in_manila()
