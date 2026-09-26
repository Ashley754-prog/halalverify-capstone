import csv
import os
import sys
import uuid
from datetime import datetime, date

# Import Supabase client from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.supabase_client import supabase

IDCP_CERTIFYING_BODY_ID = "8885f308-1697-4541-b352-bcbd76227e8b"
PRODUCTS_CSV = os.path.join(os.path.dirname(__file__), "idcp_products.csv")
MANUFACTURERS_CSV = os.path.join(os.path.dirname(__file__), "idcp_manufacturers.csv")
SOURCE_PAGE_URL = "https://www.idcphalal.org/clients/client-search"
SOURCE_NAME = "IDCP Published Registry"

def guess_category(name: str, comp: str) -> str:
    text = f"{name} {comp}".lower()
    if any(k in text for k in ["mayo", "dressing", "mayonnaise", "spread", "sandwich spread"]):
        return "Dressings & Mayonnaise"
    if any(k in text for k in ["sauce", "ketchup", "mustard", "vinegar", "soy sauce", "patis", "seasoning", "condiment", "paste", "gravy"]):
        return "Condiments & Sauces"
    if any(k in text for k in ["spice", "pepper", "garlic", "curry", "powder", "salt", "mix", "extract"]):
        return "Spices & Seasonings"
    if any(k in text for k in ["oil", "shortening", "margarine", "fat", "lard"]):
        return "Cooking Oils & Fats"
    if any(k in text for k in ["milk", "cheese", "dairy", "yogurt", "butter", "cream", "lactogen", "nestogen", "nido", "birch tree", "condensed", "evaporated"]):
        return "Dairy & Milk"
    if any(k in text for k in ["tuna", "sardine", "salmon", "beef", "chicken", "corned", "meat", "fish", "sausage", "dressed", "hotdog", "nuggets"]):
        return "Canned Fish & Meat"
    if any(k in text for k in ["ice cream", "sorbet", "gelato", "frozen dessert", "popsicle", "drumstick", "corneto"]):
        return "Ice Cream & Frozen Desserts"
    if any(k in text for k in ["juice", "tea", "coffee", "beverage", "drink", "purebev", "c2", "nescafe", "milo", "water"]):
        return "Beverages"
    if any(k in text for k in ["bread", "flour", "cake", "baker", "biscuit", "cracker", "cookie", "wheat", "dough", "pastry"]):
        return "Bakery & Biscuits"
    if any(k in text for k in ["noodle", "pancit", "mami", "pasta", "spaghetti", "macaroni"]):
        return "Instant Noodles & Pasta"
    if any(k in text for k in ["snack", "chips", "crisp", "prawn", "patata", "curls", "popcorn", "piattos", "chippy", "cornick"]):
        return "Snacks & Chips"
    if any(k in text for k in ["egg", "table eggs"]):
        return "Fresh & Farm Produce"
    if any(k in text for k in ["soap", "shampoo", "toothpaste", "lotion", "facial", "cleaner", "care", "cosmetic", "eskinol"]):
        return "Personal Care & Household"
    return "Food & Beverage"

def seed_idcp(seed_all: bool = True):
    if not os.path.exists(PRODUCTS_CSV):
        print(f"Error: {PRODUCTS_CSV} does not exist. Run sync_idcp_registry.py first.")
        return

    print("Loading clean IDCP products from CSV...")
    all_products = []
    with open(PRODUCTS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            all_products.append(r)

    print(f"Total products available in CSV: {len(all_products):,}")

    target_products = all_products if seed_all else [p for p in all_products if p.get("status") == "Halal"]
    target_mfg_names = {p["manufacturer_name"] for p in target_products if p.get("manufacturer_name")}

    print(f"\n1. Seeding {len(target_mfg_names):,} Manufacturers into Supabase...")
    now_iso = datetime.now().isoformat()
    
    mfg_payloads = []
    for name in target_mfg_names:
        mfg_payloads.append({
            "name": name,
            "country": "Philippines",
            "source": SOURCE_NAME,
            "source_url": SOURCE_PAGE_URL,
            "synced_at": now_iso
        })

    # Upsert manufacturers in batches of 50
    for i in range(0, len(mfg_payloads), 50):
        batch = mfg_payloads[i:i + 50]
        supabase.table("manufacturers").upsert(batch, on_conflict="name").execute()

    print("Fetching manufacturer ID mappings from Supabase...")
    mfg_map = {}
    offset = 0
    batch_size = 1000
    while True:
        res = supabase.table("manufacturers").select("id, name").range(offset, offset + batch_size - 1).execute()
        rows = res.data or []
        for r in rows:
            mfg_map[r["name"]] = r["id"]
        if len(rows) < batch_size:
            break
        offset += batch_size

    print(f"Mapped {len(mfg_map):,} manufacturers.")

    print(f"\n2. Seeding {len(target_products):,} Products into Supabase...")
    product_payloads = []
    for p in target_products:
        m_name = p["manufacturer_name"]
        m_id = mfg_map.get(m_name)
        if not m_id:
            continue

        cat = guess_category(p["name"], m_name)
        val_date = p.get("expiry_date") or None

        product_payloads.append({
            "id": p["id"],
            "name": p["name"],
            "brand": m_name,
            "category": cat,
            "barcode": None, # Null to avoid unique index violation
            "manufacturer_id": m_id,
            "certifying_body_id": IDCP_CERTIFYING_BODY_ID,
            "certificate_no": p.get("certificate_no") or "IDCP-CERT-REG",
            "expiry_date": val_date,
            "status": p.get("status") or "Halal",
            "halal_logo_present": True,
            "ingredients_summary": f"Verified product certified under IDCP registry ({m_name}).",
            "source": SOURCE_NAME,
            "source_url": SOURCE_PAGE_URL,
            "synced_at": now_iso
        })

    # Upsert products in batches of 100
    total_to_insert = len(product_payloads)
    inserted_count = 0
    batch_size = 100

    for i in range(0, total_to_insert, batch_size):
        batch = product_payloads[i:i + batch_size]
        try:
            res = supabase.table("products").upsert(batch, on_conflict="id").execute()
            count = len(res.data) if res.data else len(batch)
            inserted_count += count
            if (i // batch_size) % 10 == 0 or (i + batch_size) >= total_to_insert:
                print(f"  Upserted batch {i // batch_size + 1}/{(total_to_insert + batch_size - 1) // batch_size}: {count} items (Total: {inserted_count:,}/{total_to_insert:,})")
        except Exception as e:
            print(f"  Error on batch {i // batch_size + 1}: {e}")

    print(f"\nSuccessfully seeded {inserted_count:,} IDCP products into Supabase!")
    
    # Check total products count now in Supabase
    total_res = supabase.table("products").select("count", count="exact").execute()
    print(f"Total products in Supabase database now: {total_res.count:,}")

if __name__ == "__main__":
    seed_idcp(seed_all=True)
