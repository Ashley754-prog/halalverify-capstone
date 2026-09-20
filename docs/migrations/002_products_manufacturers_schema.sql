-- ==============================================================================
-- HalalVerify: Migration 002 - Products, Manufacturers, and Certifying Body Traceability
-- ==============================================================================

-- 1. Ensure certifying_bodies table exists with standard fields
CREATE TABLE IF NOT EXISTS public.certifying_bodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    country TEXT DEFAULT 'Philippines',
    accreditation_details TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure code column exists if table was created previously without it
ALTER TABLE public.certifying_bodies 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Philippines',
ADD COLUMN IF NOT EXISTS accreditation_details TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Seed standard certifying bodies if they don't already exist
INSERT INTO public.certifying_bodies (code, name, country, website)
VALUES 
    ('IDCP', 'Islamic Da''wah Council of the Philippines', 'Philippines', 'https://www.idcphalal.org/'),
    ('HDIP', 'Halal Development Institute of the Philippines', 'Philippines', 'https://hdiphalal.com/'),
    ('JAKIM', 'Department of Islamic Development Malaysia', 'Malaysia', 'https://www.halal.gov.my/'),
    ('MUIS', 'Majlis Ugama Islam Singapura', 'Singapore', 'https://www.muis.gov.sg/')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, website = EXCLUDED.website;

-- 2. Manufacturers Table
CREATE TABLE IF NOT EXISTS public.manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    country TEXT DEFAULT 'Philippines',
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    source TEXT DEFAULT 'IDCP Published Registry',
    source_url TEXT,
    synced_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT DEFAULT 'Food & Beverage',
    barcode TEXT UNIQUE,
    manufacturer_id UUID REFERENCES public.manufacturers(id) ON DELETE SET NULL,
    certifying_body_id UUID REFERENCES public.certifying_bodies(id) ON DELETE SET NULL,
    certificate_no TEXT,
    expiry_date DATE,
    status TEXT DEFAULT 'Halal', -- 'Halal', 'Doubtful', 'Expired', 'Revoked'
    halal_logo_present BOOLEAN DEFAULT true,
    ingredients_summary TEXT,
    source TEXT DEFAULT 'IDCP Published Registry',
    source_url TEXT DEFAULT 'https://www.idcphalal.org/certified-product-page',
    synced_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient lookup (Adviser R1)
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_manufacturers_name ON public.manufacturers (name);

-- 4. Update Establishments Table with Traceability & Provenance Columns (Adviser R2)
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS certifying_body_id UUID REFERENCES public.certifying_bodies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Curated Local Registry',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT now();

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifying_bodies ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon & authenticated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'manufacturers' AND policyname = 'Allow public select on manufacturers'
    ) THEN
        CREATE POLICY "Allow public select on manufacturers" ON public.manufacturers FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public select on products'
    ) THEN
        CREATE POLICY "Allow public select on products" ON public.products FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'certifying_bodies' AND policyname = 'Allow public select on certifying_bodies'
    ) THEN
        CREATE POLICY "Allow public select on certifying_bodies" ON public.certifying_bodies FOR SELECT USING (true);
    END IF;
END $$;

-- 6. Seed Sample Philippine Manufacturers & Products (For immediate testing & demo)
DO $$
DECLARE
    idcp_id UUID;
    hdip_id UUID;
    mfg_smf UUID;
    mfg_urc UUID;
    mfg_cpf UUID;
    mfg_monde UUID;
BEGIN
    SELECT id INTO idcp_id FROM public.certifying_bodies WHERE code = 'IDCP' LIMIT 1;
    SELECT id INTO hdip_id FROM public.certifying_bodies WHERE code = 'HDIP' LIMIT 1;

    -- Seed Manufacturers
    INSERT INTO public.manufacturers (name, country, address, source, source_url)
    VALUES 
        ('San Miguel Foods, Inc.', 'Philippines', 'Ortigas Center, Pasig City, Metro Manila', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('Universal Robina Corporation (URC)', 'Philippines', 'Quezon City, Metro Manila', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('Century Pacific Food, Inc.', 'Philippines', 'Pasig City, Metro Manila', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('Monde Nissin Corporation', 'Philippines', 'Santa Rosa, Laguna', 'HDIP Published Registry', 'https://hdiphalal.com/')
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address;

    SELECT id INTO mfg_smf FROM public.manufacturers WHERE name = 'San Miguel Foods, Inc.';
    SELECT id INTO mfg_urc FROM public.manufacturers WHERE name = 'Universal Robina Corporation (URC)';
    SELECT id INTO mfg_cpf FROM public.manufacturers WHERE name = 'Century Pacific Food, Inc.';
    SELECT id INTO mfg_monde FROM public.manufacturers WHERE name = 'Monde Nissin Corporation';

    -- Seed Products
    INSERT INTO public.products 
        (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Purefoods Corned Beef 150g', 'Purefoods', 'Processed Meat', '4800016012345', mfg_smf, idcp_id, 'IDCP-2024-0891', '2027-12-31', 'Halal', true, 'Cooked Beef, Beef Broth, Iodized Salt, Sugar, Spices, Sodium Nitrite', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('Magnolia Chicken Whole Dressed', 'Magnolia', 'Poultry', '4800016098765', mfg_smf, idcp_id, 'IDCP-2024-0412', '2027-06-30', 'Halal', true, 'Fresh Whole Dressed Chicken', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('Piattos Cheese Flavored Potato Crisps', 'Jack ''n Jill', 'Snacks', '4800016654321', mfg_urc, idcp_id, 'IDCP-2023-1102', '2026-11-30', 'Halal', true, 'Dehydrated Potatoes, Potato Starch, Vegetable Oil, Cheese Powder, Salt', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('C2 Green Tea Apple 500ml', 'C2 Cool & Clean', 'Beverages', '4800016789012', mfg_urc, idcp_id, 'IDCP-2024-0321', '2027-05-15', 'Halal', true, 'Brewed Green Tea, Water, Sugar, Citric Acid, Apple Flavor, Ascorbic Acid', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('Century Tuna Flakes in Oil 180g', 'Century Tuna', 'Canned Seafood', '4800016334455', mfg_cpf, idcp_id, 'IDCP-2024-0774', '2027-09-30', 'Halal', true, 'Tuna Flakes, Water, Soybean Oil, Seasoning, Salt, Onion Powder, Garlic Powder', 'IDCP Published Registry', 'https://www.idcphalal.org/certified-product-page'),
        ('Lucky Me! Instant Pancit Canton Original', 'Lucky Me!', 'Instant Noodles', '4800016445566', mfg_monde, hdip_id, 'HDIP-2024-1055', '2027-04-30', 'Halal', true, 'Wheat Flour, Vegetable Oil, Iodized Salt, Tartrazine (E102), Soy Sauce, Spices', 'HDIP Published Registry', 'https://hdiphalal.com/')
    ON CONFLICT (barcode) DO NOTHING;
END $$;
