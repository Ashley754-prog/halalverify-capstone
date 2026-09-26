import csv
import io
import os
import re
import sys
import uuid
from datetime import datetime, date
from collections import defaultdict
import urllib.request

RAW_CSV = os.path.join(os.path.dirname(__file__), "idcp_raw_registry.csv")
MANUFACTURERS_CSV = os.path.join(os.path.dirname(__file__), "idcp_manufacturers.csv")
PRODUCTS_CSV = os.path.join(os.path.dirname(__file__), "idcp_products.csv")

SHEET_URL = "https://docs.google.com/spreadsheets/d/17bwhxAWpMZorckQtjzPFZP2e9P_zOkapIa5JKy-aU9Y/export?format=csv"
SOURCE_PAGE_URL = "https://www.idcphalal.org/clients/client-search"
SOURCE_NAME = "IDCP Published Registry"

DATE_FORMATS = [
    "%d-%b-%y", "%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y",
    "%B %d, %Y", "%b %d, %Y", "%B %d %Y", "%b %d %Y",
    "%d %B %Y", "%d %b %Y", "%d-%B-%y", "%d-%B-%Y", "%m/%d/%y",
    "%d-%m-%Y", "%d.%m.%Y", "%Y/%m/%d"
]

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_date(date_str: str):
    if not date_str:
        return None
    raw = clean_text(date_str).rstrip('.')
    # Remove ordinal suffixes: 1st, 2nd, 3rd, 4th
    raw = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', raw, flags=re.IGNORECASE)
    
    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(raw, fmt).date()
            if parsed.year < 2000:
                parsed = parsed.replace(year=parsed.year + 100)
            return parsed
        except ValueError:
            continue
    return None

def download_registry(force: bool = False):
    if force or not os.path.exists(RAW_CSV) or os.path.getsize(RAW_CSV) < 1000:
        print(f"Downloading latest raw IDCP registry from Google Sheets ({SHEET_URL})...")
        req = urllib.request.Request(SHEET_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = resp.read()
        with open(RAW_CSV, "wb") as f:
            f.write(data)
        print(f"Saved {len(data):,} bytes to {RAW_CSV}")

def run_sync(force_download: bool = True):
    download_registry(force=force_download)
    
    with open(RAW_CSV, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        raw_rows = list(reader)

    print(f"Loaded {len(raw_rows):,} raw records from IDCP spreadsheet.")
    
    # Group rows by (clean_company, clean_product) to handle renewals & deduplication
    grouped = defaultdict(list)
    companies = {}  # name -> uuid
    now_iso = datetime.now().isoformat()
    today = date.today()

    for idx, row in enumerate(raw_rows):
        if not row or len(row) < 2:
            continue
        
        comp_name = clean_text(row[0])
        prod_name = clean_text(row[1]) if len(row) > 1 else ""
        cert_no = clean_text(row[2]) if len(row) > 2 else ""
        cert_date_raw = clean_text(row[3]) if len(row) > 3 else ""
        val_date_raw = clean_text(row[4]) if len(row) > 4 else ""
        
        # Filter out empty or header-like repetitions
        if not comp_name or not prod_name:
            continue
        if comp_name.lower() in ["company name", "company", "client"]:
            continue
            
        cert_dt = parse_date(cert_date_raw)
        val_dt = parse_date(val_date_raw)

        if comp_name not in companies:
            mfg_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"mfg::{comp_name.lower()}"))
            companies[comp_name] = mfg_uuid
        else:
            mfg_uuid = companies[comp_name]

        grouped[(comp_name.lower(), prod_name.lower())].append({
            "comp_name": comp_name,
            "prod_name": prod_name,
            "cert_no": cert_no,
            "cert_dt": cert_dt,
            "val_dt": val_dt,
            "mfg_uuid": mfg_uuid,
        })

    products = []
    parsed_dates_count = 0
    unparsed_dates_count = 0
    expired_count = 0
    halal_count = 0

    for (comp_key, prod_key), records in grouped.items():
        # Sort so the record with valid date and furthest future validity date comes first
        sorted_records = sorted(
            records,
            key=lambda x: (
                1 if x["val_dt"] else 0,
                x["val_dt"] or date.min,
                1 if x["cert_dt"] else 0,
                x["cert_dt"] or date.min
            ),
            reverse=True
        )
        best = sorted_records[0]

        val_dt = best["val_dt"]
        cert_dt = best["cert_dt"]
        comp_name = best["comp_name"]
        prod_name = best["prod_name"]
        cert_no = best["cert_no"]
        mfg_uuid = best["mfg_uuid"]

        if val_dt:
            parsed_dates_count += 1
            if val_dt < today:
                status = "Expired"
                expired_count += 1
            else:
                status = "Halal"
                halal_count += 1
        else:
            unparsed_dates_count += 1
            status = "Halal"  # default active halal if listed on active registry
            halal_count += 1

        prod_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"idcp::{comp_name.lower()}::{prod_name.lower()}::{cert_no.lower()}"))

        products.append({
            "id": prod_uuid,
            "name": prod_name,
            "brand": comp_name,
            "category": "Food & Beverage",
            "barcode": "",
            "manufacturer_id": mfg_uuid,
            "manufacturer_name": comp_name,
            "certifying_body_code": "IDCP",
            "certificate_no": cert_no,
            "date_certified": cert_dt.isoformat() if cert_dt else "",
            "expiry_date": val_dt.isoformat() if val_dt else "",
            "status": status,
            "halal_logo_present": "true",
            "source": SOURCE_NAME,
            "source_url": SOURCE_PAGE_URL,
            "synced_at": now_iso
        })

    # Sort products alphabetically by name
    products.sort(key=lambda x: (x["manufacturer_name"], x["name"]))

    # Save manufacturers CSV
    with open(MANUFACTURERS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "country", "source", "source_url", "synced_at"])
        for name, m_id in sorted(companies.items(), key=lambda x: x[0]):
            writer.writerow([m_id, name, "Philippines", SOURCE_NAME, SOURCE_PAGE_URL, now_iso])

    # Save products CSV
    with open(PRODUCTS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "id", "name", "brand", "category", "barcode", "manufacturer_id",
            "manufacturer_name", "certifying_body_code", "certificate_no",
            "date_certified", "expiry_date", "status", "halal_logo_present",
            "source", "source_url", "synced_at"
        ])
        writer.writeheader()
        writer.writerows(products)

    print(f"\n===== IDCP REGISTRY SYNC SUMMARY =====")
    print(f"Total Unique Products Processed: {len(products):,}")
    print(f"Total Unique Manufacturers: {len(companies):,}")
    print(f"Dates successfully parsed: {parsed_dates_count:,}")
    print(f"Dates unparsed/missing: {unparsed_dates_count:,}")
    print(f"Status - Active Halal: {halal_count:,}")
    print(f"Status - Expired: {expired_count:,}")
    print(f"Saved manufacturers to: {MANUFACTURERS_CSV}")
    print(f"Saved products to: {PRODUCTS_CSV}")

    # Check Unilever and Mayo products
    mayo_prods = [p for p in products if "mayo" in p["name"].lower()]
    print(f"\nMayo products found ({len(mayo_prods)}):")
    for m in mayo_prods[:5]:
        print(f"  - {m['name']} | {m['manufacturer_name']} | {m['certificate_no']} | {m['expiry_date']} | {m['status']}")

if __name__ == "__main__":
    force = "--no-download" not in sys.argv
    run_sync(force_download=force)
