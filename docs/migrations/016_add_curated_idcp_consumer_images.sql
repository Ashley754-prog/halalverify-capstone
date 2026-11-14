-- =============================================================================
-- Migration 016: Apply Verified Static Retail Packshots to Curated IDCP SKUs
-- Maps high-profile consumer grocery products from the IDCP registry to static
-- compressed WebP assets under frontend/public/product_images/ (0 bytes in
-- Supabase Storage, 0 bytes Supabase Egress). Only updates rows where image_url
-- IS NULL so manual admin/user uploads are preserved.
-- =============================================================================

BEGIN;

UPDATE public.products AS p
SET image_url = m.image_url,
    updated_at = now()
FROM (
    VALUES
        ('PUREFOODS CORNED BEEF 150G', '/product_images/purefoods-corned-beef-150g.png'),
        ('PUREFOODS CORNED BEEF 210G', '/product_images/purefoods-corned-beef-150g.png'),
        ('PUREFOODS CORNED BEEF 210G/150G', '/product_images/purefoods-corned-beef-150g.png'),
        ('ARGENTINA CORNED BEEF - PREMIUM', '/product_images/idcp-argentina-corned-beef.webp'),
        ('ARGENTINA CORNED BEEF 175G', '/product_images/idcp-argentina-corned-beef.webp'),
        ('ARGENTINA CORNED BEEF 260G', '/product_images/idcp-argentina-corned-beef.webp'),
        ('ARGENTINA CORNED BEEF 150g', '/product_images/idcp-argentina-corned-beef.webp'),
        ('CENTURY TUNA FLAKES IN BRINE', '/product_images/idcp-century-tuna-brine.webp'),
        ('CENTURY TUNA HOT & SPICY', '/product_images/idcp-century-tuna-hot-spicy.webp'),
        ('CENTURY TUNA CHUNKS HOT & SPICY', '/product_images/idcp-century-tuna-hot-spicy.webp'),
        ('C2 Green Tea Apple 500ml', '/product_images/idcp-c2-apple.webp'),
        ('NESTLE MILO', '/product_images/idcp-milo-cereal.webp'),
        ('MILO POWDERED CHOCO MALT', '/product_images/idcp-milo-powdered.webp'),
        ('MILO POWDERED CHOCOMALT', '/product_images/idcp-milo-powdered.webp'),
        ('NESTLE MILO RTD WITH ACTIV-GO CHOCO MALT DRINK - MTUF13-1', '/product_images/idcp-milo-rtd.webp'),
        ('NESCAFE CLASSIC', '/product_images/idcp-nescafe-classic.webp'),
        ('NESCAFE CLASSIC PURE SOLUBLE COFFEE, KRRF 581/KRRF 586', '/product_images/idcp-nescafe-classic.webp'),
        ('NESCAFE CREAMY WHITE', '/product_images/idcp-nescafe-creamy-white.webp'),
        ('NESCAFE CREAMY WHITE TWINPACK 40g', '/product_images/idcp-nescafe-creamy-white.webp'),
        ('BEAR BRAND POWDERED MILK (MQAV008E-2)', '/product_images/idcp-bear-brand-milk.webp'),
        ('BEAR BRAND POWDERED MILK DRINK - MQAV008E-2', '/product_images/idcp-bear-brand-milk.webp'),
        ('BEAR BRAND POWDERED MILK - MQAV008E-2', '/product_images/idcp-bear-brand-milk.webp'),
        ('GARDENIA CLASSIC ENRICHED WHITE BREAD 400G,600G-REGULAR SLICE,600G-THICK SLICE', '/product_images/idcp-gardenia-classic.webp'),
        ('GARDENIA CLASSIC ENRICHED WHITE BREAD - 400g, 600g REGULAR SLICE, 600g THICK SLICE', '/product_images/idcp-gardenia-classic.webp'),
        ('FITA CRACKERS (ALL SKU''S)', '/product_images/idcp-fita.webp'),
        ('SKYFLAKES CONDENSADA (ALL SKU''S)', '/product_images/idcp-skyflakes-condensada.webp'),
        ('SKYFLAKES SANDWICH CONDENSADA FLAVOR (ALL SKU''S)', '/product_images/idcp-skyflakes-condensada.webp'),
        ('SKYFLAKES TSOKOLATE (ALL SKU''S)', '/product_images/idcp-skyflakes-tsokolate.webp'),
        ('SKYFLAKES SANDWICH TSOKOLATE FLAVOR (ALL SKU''S)', '/product_images/idcp-skyflakes-tsokolate.webp'),
        ('JACK ''N JILL CREAM-O CHOCOLATE CHIPS COOKIES', '/product_images/idcp-cream-o-cookies.webp'),
        ('JACK N'' JILL CREAM-O CHOCOLATE CHIPS', '/product_images/idcp-cream-o-cookies.webp'),
        ('KOPIKO BLACK 3 IN 1 TWIN PACK', '/product_images/idcp-kopiko-black.webp'),
        ('KOPIKO BLANCA TWIN PACK', '/product_images/idcp-kopiko-blanca.webp'),
        ('GREAT TASTE WHITE CARAMEL COFFEE MIX', '/product_images/idcp-great-taste-white.webp'),
        ('GREAT TASTE WHITE CARAMEL COFFEE MIX TWINPACK', '/product_images/idcp-great-taste-white.webp'),
        ('GREAT TASTE WHITE COFFEE MIX', '/product_images/idcp-great-taste-white.webp'),
        ('GREAT TASTE WHITE TWINPACK', '/product_images/idcp-great-taste-white.webp'),
        ('LIGO PREMIUM SARDINES IN TOMATO SAUCE', '/product_images/idcp-ligo-sardines.webp'),
        ('LIGO SARDINES IN TOMATO SAUCE', '/product_images/idcp-ligo-sardines.webp'),
        ('555 SARDINES IN TOMATO SAUCE', '/product_images/idcp-555-sardines.webp'),
        ('MEGA FRIED SARDINES IN TAUSI - 155g CANNED', '/product_images/idcp-mega-sardines-tausi.webp'),
        ('MEGA FRIED SARDINES WITH TAUSI 155G', '/product_images/idcp-mega-sardines-tausi.webp'),
        ('DEL MONTE DESSERTS FRUIT SALAD', '/product_images/idcp-delmonte-fruitsalad.webp'),
        ('DEL MONTE SPAGHETTI VALUE PACK - 400g,700g', '/product_images/idcp-delmonte-spaghetti.webp'),
        ('MAGNOLIA CHEEZEE', '/product_images/idcp-magnolia-cheezee.webp'),
        ('EDEN ORIGINAL PROCESSED FILLED CHEESE SPREAD', '/product_images/idcp-eden-original.webp'),
        ('LUCKY ME! PANCIT CANTON CHILIMANSI', '/product_images/idcp-luckyme-chilimansi.webp'),
        ('LUCKY ME! PANCIT CANTON KALAMANSI', '/product_images/idcp-luckyme-kalamansi.webp'),
        ('LUCKY ME! BEEF', '/product_images/idcp-luckyme-beef.webp'),
        ('LUCKY ME! CHICKEN', '/product_images/idcp-luckyme-chicken.webp'),
        ('PAYLESS XTRA BIG PANCIT CANTON CHILIMANSI FLAVOR', '/product_images/idcp-payless-xtrabig.webp')
) AS m(name, image_url)
WHERE p.name = m.name
  AND p.image_url IS NULL;

COMMIT;
