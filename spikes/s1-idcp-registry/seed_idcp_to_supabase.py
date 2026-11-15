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

CURATED_IMAGE_BY_NAME = {
    "PUREFOODS CORNED BEEF 150G": "/product_images/purefoods-corned-beef-150g.png",
    "PUREFOODS CORNED BEEF 210G": "/product_images/purefoods-corned-beef-150g.png",
    "PUREFOODS CORNED BEEF 210G/150G": "/product_images/purefoods-corned-beef-150g.png",
    "PUREFOODS CORNED BEEF 150G/210G": "/product_images/purefoods-corned-beef-150g.png",
    "ARGENTINA CORNED BEEF - PREMIUM": "/product_images/idcp-argentina-corned-beef.webp",
    "ARGENTINA CORNED BEEF 175G": "/product_images/idcp-argentina-corned-beef.webp",
    "ARGENTINA CORNED BEEF 260G": "/product_images/idcp-argentina-corned-beef.webp",
    "ARGENTINA CORNED BEEF 150g": "/product_images/idcp-argentina-corned-beef.webp",
    "CENTURY TUNA FLAKES IN BRINE": "/product_images/idcp-century-tuna-brine.webp",
    "CENTURY TUNA HOT & SPICY": "/product_images/idcp-century-tuna-hot-spicy.webp",
    "CENTURY TUNA CHUNKS HOT & SPICY": "/product_images/idcp-century-tuna-hot-spicy.webp",
    "C2 COOL & CLEAN GREEN TEA APPLE FLAVOR": "/product_images/idcp-c2-apple.webp",
    "NESTLE MILO": "/product_images/idcp-milo-cereal.webp",
    "MILO POWDERED CHOCO MALT": "/product_images/idcp-milo-powdered.webp",
    "MILO POWDERED CHOCOMALT": "/product_images/idcp-milo-powdered.webp",
    "NESTLE MILO RTD WITH ACTIV-GO CHOCO MALT DRINK - MTUF13-1": "/product_images/idcp-milo-rtd.webp",
    "NESCAFE CLASSIC": "/product_images/idcp-nescafe-classic.webp",
    "NESCAFE CLASSIC PURE SOLUBLE COFFEE, KRRF 581/KRRF 586": "/product_images/idcp-nescafe-classic.webp",
    "NESCAFE CREAMY WHITE": "/product_images/idcp-nescafe-creamy-white.webp",
    "NESCAFE CREAMY WHITE TWINPACK 40g": "/product_images/idcp-nescafe-creamy-white.webp",
    "BEAR BRAND POWDERED MILK (MQAV008E-2)": "/product_images/idcp-bear-brand-milk.webp",
    "BEAR BRAND POWDERED MILK DRINK - MQAV008E-2": "/product_images/idcp-bear-brand-milk.webp",
    "BEAR BRAND POWDERED MILK - MQAV008E-2": "/product_images/idcp-bear-brand-milk.webp",
    "GARDENIA CLASSIC ENRICHED WHITE BREAD 400G,600G-REGULAR SLICE,600G-THICK SLICE": "/product_images/idcp-gardenia-classic.webp",
    "GARDENIA CLASSIC ENRICHED WHITE BREAD - 400g, 600g REGULAR SLICE, 600g THICK SLICE": "/product_images/idcp-gardenia-classic.webp",
    "FITA CRACKERS (ALL SKU'S)": "/product_images/idcp-fita.webp",
    "SKYFLAKES CONDENSADA (ALL SKU'S)": "/product_images/idcp-skyflakes-condensada.webp",
    "SKYFLAKES SANDWICH CONDENSADA FLAVOR (ALL SKU'S)": "/product_images/idcp-skyflakes-condensada.webp",
    "SKYFLAKES TSOKOLATE (ALL SKU'S)": "/product_images/idcp-skyflakes-tsokolate.webp",
    "SKYFLAKES SANDWICH TSOKOLATE FLAVOR (ALL SKU'S)": "/product_images/idcp-skyflakes-tsokolate.webp",
    "JACK 'N JILL CREAM-O CHOCOLATE CHIPS COOKIES": "/product_images/idcp-cream-o-cookies.webp",
    "JACK N' JILL CREAM-O CHOCOLATE CHIPS": "/product_images/idcp-cream-o-cookies.webp",
    "KOPIKO BLACK 3 IN 1 TWIN PACK": "/product_images/idcp-kopiko-black.webp",
    "KOPIKO BLANCA TWIN PACK": "/product_images/idcp-kopiko-blanca.webp",
    "GREAT TASTE WHITE CARAMEL COFFEE MIX": "/product_images/idcp-great-taste-white.webp",
    "GREAT TASTE WHITE CARAMEL COFFEE MIX TWINPACK": "/product_images/idcp-great-taste-white.webp",
    "GREAT TASTE WHITE COFFEE MIX": "/product_images/idcp-great-taste-white.webp",
    "GREAT TASTE WHITE TWINPACK": "/product_images/idcp-great-taste-white.webp",
    "LIGO PREMIUM SARDINES IN TOMATO SAUCE": "/product_images/idcp-ligo-sardines.webp",
    "LIGO SARDINES IN TOMATO SAUCE": "/product_images/idcp-ligo-sardines.webp",
    "555 SARDINES IN TOMATO SAUCE": "/product_images/idcp-555-sardines.webp",
    "MEGA FRIED SARDINES IN TAUSI - 155g CANNED": "/product_images/idcp-mega-sardines-tausi.webp",
    "MEGA FRIED SARDINES WITH TAUSI 155G": "/product_images/idcp-mega-sardines-tausi.webp",
    "DEL MONTE DESSERTS FRUIT SALAD": "/product_images/idcp-delmonte-fruitsalad.webp",
    "DEL MONTE SPAGHETTI VALUE PACK - 400g,700g": "/product_images/idcp-delmonte-spaghetti.webp",
    "MAGNOLIA CHEEZEE": "/product_images/idcp-magnolia-cheezee.webp",
    "EDEN ORIGINAL PROCESSED FILLED CHEESE SPREAD": "/product_images/idcp-eden-original.webp",
    "LUCKY ME! PANCIT CANTON ORIGINAL": "/product_images/lucky-me-pancit-canton-original.webp",
    "LUCKY ME! PANCIT CANTON CHILIMANSI": "/product_images/idcp-luckyme-chilimansi.webp",
    "LUCKY ME! PANCIT CANTON KALAMANSI": "/product_images/idcp-luckyme-kalamansi.webp",
    "LUCKY ME! BEEF": "/product_images/idcp-luckyme-beef.webp",
    "LUCKY ME! CHICKEN": "/product_images/idcp-luckyme-chicken.webp",
    "PAYLESS XTRA BIG PANCIT CANTON CHILIMANSI FLAVOR": "/product_images/idcp-payless-xtrabig.webp",
}

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

def seed_idcp(seed_all: bool = True, clean_first: bool = False):
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

    if clean_first:
        print("\n0. Clean wipe: deleting existing IDCP Published Registry product rows (submitted_by IS NULL)...")
        deleted_total = 0
        protected_ids = set()
        while True:
            res = (
                supabase.table("products")
                .select("id")
                .eq("source", SOURCE_NAME)
                .is_("submitted_by", "null")
                .limit(1000)
                .execute()
            )
            batch_rows = [r["id"] for r in (res.data or []) if r["id"] not in protected_ids]
            if not batch_rows:
                break
            for i in range(0, len(batch_rows), 200):
                sub_ids = batch_rows[i:i + 200]
                try:
                    del_res = supabase.table("products").delete().in_("id", sub_ids).execute()
                    deleted_total += len(del_res.data) if del_res.data else len(sub_ids)
                except Exception as e:
                    print(f"  Batch delete warning ({e}), retrying row-by-row to preserve FK-linked rows...")
                    for rid in sub_ids:
                        try:
                            supabase.table("products").delete().eq("id", rid).execute()
                            deleted_total += 1
                        except Exception:
                            protected_ids.add(rid)
        print(f"  Removed {deleted_total:,} existing IDCP product rows (preserved {len(protected_ids)} FK-linked rows).")

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
    curated_restored = 0
    for p in target_products:
        m_name = p["manufacturer_name"]
        m_id = mfg_map.get(m_name)
        if not m_id:
            continue

        cat = guess_category(p["name"], m_name)
        val_date = p.get("expiry_date") or None
        curated_img = CURATED_IMAGE_BY_NAME.get(p["name"]) or next(
            (v for k, v in CURATED_IMAGE_BY_NAME.items() if k.upper() == p["name"].upper()),
            None,
        )
        if curated_img:
            curated_restored += 1

        payload = {
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
            "synced_at": now_iso,
        }
        if curated_img:
            payload["image_url"] = curated_img
        product_payloads.append(payload)

    # Upsert products in batches of 250
    total_to_insert = len(product_payloads)
    inserted_count = 0
    batch_size = 250

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

    print(f"\nSuccessfully seeded {inserted_count:,} IDCP products into Supabase (restored {curated_restored} curated images)!")

    if seed_all and not clean_first and inserted_count >= int(total_to_insert * 0.9):
        print("\n3. Checking for superseded IDCP rows to prune...")
        seeded_ids = {p["id"] for p in product_payloads}
        stale_ids = []
        offset = 0
        page_size = 1000
        while True:
            res = (
                supabase.table("products")
                .select("id, barcode")
                .eq("source", SOURCE_NAME)
                .range(offset, offset + page_size - 1)
                .execute()
            )
            rows = res.data or []
            for r in rows:
                if r["id"] not in seeded_ids and not r.get("barcode"):
                    stale_ids.append(r["id"])
            if len(rows) < page_size:
                break
            offset += page_size

        pruned_count = 0
        for i in range(0, len(stale_ids), 100):
            batch_ids = stale_ids[i:i + 100]
            try:
                res_del = supabase.table("products").delete().in_("id", batch_ids).execute()
                pruned_count += len(res_del.data) if res_del.data else len(batch_ids)
            except Exception as e:
                print(f"  Error pruning stale batch {i // 100 + 1}: {e}")
        print(f"Pruned {pruned_count:,} superseded IDCP rows (found {len(stale_ids):,}).")

    # Check total products count now in Supabase
    total_res = supabase.table("products").select("count", count="exact").execute()
    print(f"Total products in Supabase database now: {total_res.count:,}")

if __name__ == "__main__":
    seed_idcp(seed_all=True, clean_first="--clean" in sys.argv)
