-- ============================================================================
-- Migration 021: Drop stale IDCP default on products.source_url, clear wrong
-- IDCP URLs on non-IDCP products, and link UCZP records to UCZP's official
-- Facebook page (https://www.facebook.com/UZCPHCB/).
-- ============================================================================

-- 1. Remove the legacy table default that automatically stamped IDCP's URL
-- onto products inserted without a custom source_url.
ALTER TABLE public.products
ALTER COLUMN source_url DROP DEFAULT;

-- 2. Save UCZP's official Facebook page on the certifying_bodies record.
UPDATE public.certifying_bodies
SET website = 'https://www.facebook.com/UZCPHCB/'
WHERE code = 'UCZP';

-- 3. Update all UCZP-certified products to point to UCZP's official Facebook page
-- instead of the erroneous legacy IDCP default URL.
UPDATE public.products
SET source_url = 'https://www.facebook.com/UZCPHCB/'
WHERE certifying_body_id = (SELECT id FROM public.certifying_bodies WHERE code = 'UCZP')
   OR source ILIKE '%UCZP%';

-- 4. Update UCZP establishments missing a directory link to UCZP's official
-- Facebook page while preserving existing musliminmanila.com directory links.
UPDATE public.establishments
SET source_url = 'https://www.facebook.com/UZCPHCB/'
WHERE (
    certifying_body_id = (SELECT id FROM public.certifying_bodies WHERE code = 'UCZP')
    OR source ILIKE '%UCZP%'
)
AND source_url IS NULL;

-- 5. Clear the erroneous IDCP URL from any remaining non-IDCP products (e.g. BUSC).
UPDATE public.products p
SET source_url = NULL
WHERE p.source_url ILIKE '%idcphalal.org%'
  AND COALESCE((SELECT cb.code FROM public.certifying_bodies cb WHERE cb.id = p.certifying_body_id), '') <> 'IDCP'
  AND COALESCE(p.source, '') NOT ILIKE '%IDCP%';
