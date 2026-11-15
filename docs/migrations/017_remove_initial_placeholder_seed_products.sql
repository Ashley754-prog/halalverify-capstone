-- =============================================================================
-- Migration 017: Remove Initial Placeholder Seed Products & Remap Curated Photos
-- Removes the 6 early development sample rows seeded in Migration 002 with
-- placeholder barcodes (4800016*) and placeholder certificate numbers
-- (IDCP-2024-*, IDCP-2023-1102, HDIP-2024-1055), and links curated retail
-- packshots onto the real IDCP-synced equivalents (C2 Apple & Lucky Me! Original).
-- =============================================================================

BEGIN;

DELETE FROM public.products
WHERE certificate_no IN (
    'IDCP-2024-0891',
    'IDCP-2024-0412',
    'IDCP-2023-1102',
    'IDCP-2024-0321',
    'IDCP-2024-0774',
    'HDIP-2024-1055'
);

UPDATE public.products
SET image_url = '/product_images/idcp-c2-apple.webp',
    updated_at = now()
WHERE name = 'C2 COOL & CLEAN GREEN TEA APPLE FLAVOR'
  AND image_url IS NULL;

UPDATE public.products
SET image_url = '/product_images/lucky-me-pancit-canton-original.webp',
    updated_at = now()
WHERE name = 'LUCKY ME! PANCIT CANTON ORIGINAL'
  AND image_url IS NULL;

COMMIT;
