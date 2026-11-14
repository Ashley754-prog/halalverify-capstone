-- =============================================================================
-- Migration 015: Clear Unreachable Placeholder Source URLs on Products
-- Prevents broken external links ("site can't be reached") in ProductCard and
-- ProductCardDetail when source_url points to offline PDF catalogues or domains
-- that fail DNS resolution (r09.dti.gov.ph, buschalal.org, hdiphalal.com).
-- Live verified registry URLs (e.g. idcphalal.org) remain clickable.
-- =============================================================================

BEGIN;

UPDATE public.products
SET source_url = NULL,
    updated_at = now()
WHERE source_url IN (
    'https://r09.dti.gov.ph/',
    'https://buschalal.org/',
    'https://hdiphalal.com/'
);

UPDATE public.manufacturers
SET source_url = NULL,
    updated_at = now()
WHERE source_url IN (
    'https://r09.dti.gov.ph/',
    'https://buschalal.org/',
    'https://hdiphalal.com/'
);

COMMIT;
