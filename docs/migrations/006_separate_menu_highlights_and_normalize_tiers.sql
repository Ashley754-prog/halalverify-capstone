-- ==============================================================================
-- HalalVerify: Migration 006 - Separate Menu Highlights and Normalize Verification Tiers
-- ==============================================================================

-- 1. Add native columns to public.establishments for explicit verification tiers,
-- amenities, menu specialties, and submitter role (eliminating string-packing hacks).
ALTER TABLE public.establishments
    ADD COLUMN IF NOT EXISTS halal_tier TEXT DEFAULT 'halal_certified',
    ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS menu_highlights TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS submitter_role TEXT DEFAULT 'community';

CREATE INDEX IF NOT EXISTS idx_establishments_halal_tier ON public.establishments (halal_tier);

-- 2. Add native halal_tier column to public.products
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS halal_tier TEXT DEFAULT 'halal_certified';

CREATE INDEX IF NOT EXISTS idx_products_halal_tier ON public.products (halal_tier);

-- 3. Create public.establishment_products junction table for M:N relationships
-- between canonical catalog products and retail establishments stocking them.
CREATE TABLE IF NOT EXISTS public.establishment_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending', 'removed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (establishment_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_est_prods_establishment_id ON public.establishment_products (establishment_id);
CREATE INDEX IF NOT EXISTS idx_est_prods_product_id ON public.establishment_products (product_id);

-- Enable Row Level Security (RLS) on establishment_products
ALTER TABLE public.establishment_products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'establishment_products' AND policyname = 'Allow public select on establishment_products'
    ) THEN
        CREATE POLICY "Allow public select on establishment_products" 
        ON public.establishment_products FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'establishment_products' AND policyname = 'Allow authenticated insert on establishment_products'
    ) THEN
        CREATE POLICY "Allow authenticated insert on establishment_products" 
        ON public.establishment_products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'establishment_products' AND policyname = 'Allow authenticated update on establishment_products'
    ) THEN
        CREATE POLICY "Allow authenticated update on establishment_products" 
        ON public.establishment_products FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'establishment_products' AND policyname = 'Allow authenticated delete on establishment_products'
    ) THEN
        CREATE POLICY "Allow authenticated delete on establishment_products" 
        ON public.establishment_products FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 4. Data Migration: Backfill establishments.halal_tier from existing notes/descriptions
UPDATE public.establishments
SET halal_tier = 'muslim_owned'
WHERE (halal_tier IS NULL OR halal_tier = 'halal_certified')
  AND (
      description ILIKE '%[Tier: muslim_owned]%'
      OR admin_notes ILIKE '%muslim_owned%'
      OR admin_notes ILIKE '%Muslim-Owned%'
      OR (source ILIKE '%community%' AND certifying_body_id IS NULL AND certificate_number IS NULL)
  );

UPDATE public.establishments
SET halal_tier = 'muslim_friendly'
WHERE (halal_tier IS NULL OR halal_tier = 'halal_certified')
  AND (
      description ILIKE '%[Tier: muslim_friendly]%'
      OR admin_notes ILIKE '%muslim_friendly%'
      OR admin_notes ILIKE '%Muslim-Friendly%'
  );

UPDATE public.establishments
SET halal_tier = 'vegetarian_vegan'
WHERE (halal_tier IS NULL OR halal_tier = 'halal_certified')
  AND (
      description ILIKE '%[Tier: vegetarian_vegan]%'
      OR admin_notes ILIKE '%vegetarian_vegan%'
      OR admin_notes ILIKE '%Vegetarian%'
      OR admin_notes ILIKE '%Plant-Based%'
  );

-- 5. Data Migration: Migrate existing restaurant menu items out of public.products
-- into establishments.menu_highlights, then remove them from public.products
UPDATE public.establishments e
SET menu_highlights = (
    SELECT COALESCE(array_agg(DISTINCT p.name), '{}'::TEXT[])
    FROM public.products p
    WHERE p.establishment_id = e.id
      AND p.brand IS NULL
      AND p.barcode IS NULL
      AND p.ingredients_summary IS NULL
)
WHERE EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.establishment_id = e.id
      AND p.brand IS NULL
      AND p.barcode IS NULL
      AND p.ingredients_summary IS NULL
) AND (e.menu_highlights IS NULL OR cardinality(e.menu_highlights) = 0);

-- Delete the bare menu dish rows from public.products to clean the catalog & verification queue
DELETE FROM public.products
WHERE establishment_id IS NOT NULL
  AND brand IS NULL
  AND barcode IS NULL
  AND ingredients_summary IS NULL;

-- 6. Backfill products.halal_tier on remaining canonical packaged goods
UPDATE public.products
SET halal_tier = 'pork_free'
WHERE status ILIKE '%pork-free%' OR admin_notes ILIKE '%pork-free%';

UPDATE public.products
SET halal_tier = 'vegetarian_vegan'
WHERE status ILIKE '%vegetarian%' OR status ILIKE '%vegan%' OR admin_notes ILIKE '%vegetarian%';

UPDATE public.products
SET halal_tier = 'community_listed'
WHERE status ILIKE '%community_listed%';

UPDATE public.products
SET halal_tier = 'halal_certified'
WHERE halal_tier IS NULL;
