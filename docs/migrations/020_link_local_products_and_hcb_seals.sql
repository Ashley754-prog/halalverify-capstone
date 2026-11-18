-- ============================================================================
-- Migration 020: Local Zamboanga Establishment <-> Product Linking & HCB Seals
-- Grounds local MSME product links (keeping brand populated so ProductsCatalog
-- does not treat packaged items as dish-only rows) and populates seal_url for
-- all 18 certifying_bodies using bundled /logos/ assets (including UCZP).
-- ============================================================================

-- 1. Populate seal_url across all 18 certifying bodies with local /logos/ assets
UPDATE public.certifying_bodies
SET seal_url = CASE code
    WHEN 'AHIP' THEN '/logos/AHIP.png'
    WHEN 'BPCC' THEN '/logos/BPCC.png'
    WHEN 'BUSC' THEN '/logos/BUSC.png'
    WHEN 'DTI' THEN '/logos/DTI.png'
    WHEN 'FIQHI' THEN '/logos/FIQHI.png'
    WHEN 'HDIP' THEN '/logos/HDIP.png'
    WHEN 'HICCIP' THEN '/logos/HICCIP.png'
    WHEN 'IDCP' THEN '/logos/IDCP.png'
    WHEN 'JAKIM' THEN '/logos/JAKIM.png'
    WHEN 'MASLAHA' THEN '/logos/MASLAHA.png'
    WHEN 'MinHA' THEN '/logos/MinHA.png'
    WHEN 'MMHCB' THEN '/logos/MMHCB.png'
    WHEN 'MUIS' THEN '/logos/MUIS.png'
    WHEN 'NCMF' THEN '/logos/NCMF.png'
    WHEN 'Philcosed' THEN '/logos/Philcosed.png'
    WHEN 'PRIME' THEN '/logos/PRIME.png'
    WHEN 'PUCOI' THEN '/logos/PUCOI.png'
    WHEN 'UCZP' THEN '/logos/UCZP.png'
    ELSE seal_url
END
WHERE code IN (
    'AHIP', 'BPCC', 'BUSC', 'DTI', 'FIQHI', 'HDIP', 'HICCIP', 'IDCP', 'JAKIM',
    'MASLAHA', 'MinHA', 'MMHCB', 'MUIS', 'NCMF', 'Philcosed', 'PRIME', 'PUCOI', 'UCZP'
);

-- 2. Link local Zamboanga MSME / food-processor products to their parent establishments
--    and populate brand where null so ProductsCatalog recognizes them as packaged SKUs.

-- 2K Peanuts -> 2K Peanut (BUSC HC-029, verified)
UPDATE public.products
SET establishment_id = '40eccc3e-e7ac-4f3c-a8d4-6570a723a3ce',
    brand = COALESCE(NULLIF(trim(brand), ''), '2K Peanuts'),
    updated_at = NOW()
WHERE id = '8d9e7864-a64a-405e-a75b-51d93800d784';

-- Auntie Nitz Bakeshop -> Auntie Nit'z Bakeshop & Grocery (BUSC HC-05, verified)
UPDATE public.products
SET establishment_id = '6836d8fa-26bf-45dd-a2b8-16dffd261e9d',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Auntie Nit''z Bakeshop'),
    updated_at = NOW()
WHERE id = 'c5d79927-28c2-4cd3-b5d9-e3b45ae5aa3b';

-- Don Fernando Gourmet Foods (8 BUSC HC-027 SKUs, verified)
UPDATE public.products
SET establishment_id = '8e5a3260-d740-4ae0-a7eb-80e72a29ae65',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Don Fernando'),
    updated_at = NOW()
WHERE id IN (
    '5c28d542-c255-4225-84c4-4c24c88ed1e7',
    '05d0d35d-9002-4822-8b01-5550be0da89a',
    '2732071d-e408-4cd9-8fb1-9934d0c09d4e',
    'd86056cf-5580-4ddc-9820-5537f3566a34',
    'b5c87abc-64d6-4cbb-9b2c-7ba5b9db0e70',
    '020081f7-a58e-4df3-abf5-bc62782af782',
    'ad2c5c0b-10c7-4c34-a234-f0b8b811e217',
    'ced82a68-8261-4667-8f8f-65e8977e7d63'
);

-- Jing Homemade Products -> Jing Homemade Products (BUSC HC-031, verified)
UPDATE public.products
SET establishment_id = '4d50f3de-6048-44e7-99d0-00301ac99daa',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Jing Homemade Products'),
    updated_at = NOW()
WHERE id = '680e94f3-eed7-4ce1-8c4e-750d84153626';

-- Mamu's Bread and Pastries Assortment -> Mamu's Bread and Pastries Shop (BUSC HC-030, verified)
UPDATE public.products
SET establishment_id = '015dad32-13f3-41a3-a609-defd2c05c768',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Mamu''s Bread and Pastries Shop'),
    updated_at = NOW()
WHERE id = '3507258a-1bac-49ae-846d-d9726eee9ff5';

-- MCH Carmela The Food Shop -> MCH Carmela The Food Shop (BUSC HC-028, verified)
UPDATE public.products
SET establishment_id = 'a3acb32d-6474-46e5-8e69-ce40310c5aa7',
    brand = COALESCE(NULLIF(trim(brand), ''), 'MCH Carmela The Food Shop'),
    updated_at = NOW()
WHERE id = '834c961e-5374-474a-b7e7-a9197eb2432b';

-- Salam Food Processing Products -> Salam Food Processing (UCZP, verified)
UPDATE public.products
SET establishment_id = 'f50757e5-2c14-40e4-8d4d-6f906177d41e',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Salam Food Processing'),
    updated_at = NOW()
WHERE id = '83ba4e35-db14-4ef1-85b4-780abb79bca5';

-- AntiEns Food Products -> AntiEns Home of Authentic Muslim Cuisine (BUSC HC-001, expired)
UPDATE public.products
SET establishment_id = '2963602c-699b-4f27-8bc5-cff67277df18',
    brand = COALESCE(NULLIF(trim(brand), ''), 'AntiEns Food Products'),
    updated_at = NOW()
WHERE id = '1df93ea5-2408-42c8-a155-61c867f25c5b';

-- MAPZACARA -> MAPZACARA (Malandi-Patalon Agrarian Reform Coop) (BUSC HC-015, expired)
UPDATE public.products
SET establishment_id = '32b7fb59-296e-4674-bd42-e42ba3f446a4',
    brand = COALESCE(NULLIF(trim(brand), ''), 'MAPZACARA'),
    updated_at = NOW()
WHERE id = 'e30ae423-d6d6-410c-b2c5-3913b7b63683';

-- Oasis Livelihood and Training Center -> Silsilah Foundation, Inc. (Oasis Livelihood Center) (BUSC HC-039, expired)
UPDATE public.products
SET establishment_id = '9b072386-f267-4a85-aa1f-3be753c7bc17',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Silsilah Foundation / Oasis'),
    updated_at = NOW()
WHERE id = '6d416b53-09de-430b-92ad-61439541900e';

-- OLA Food Products -> Ola Food Products (BUSC HC-002, expired)
UPDATE public.products
SET establishment_id = '41b45a18-7f0f-4261-b6bf-33035a9990cc',
    brand = COALESCE(NULLIF(trim(brand), ''), 'OLA Food Products'),
    updated_at = NOW()
WHERE id = 'c7935a40-973e-4152-8f44-c286561ff8b2';

-- Sweet Moh Bakery Products -> Sweet Moh Bakeshop (BUSC HC-10, expired)
UPDATE public.products
SET establishment_id = 'aa9eca7c-d725-4d77-a47f-0d7045860794',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Sweet Moh'),
    updated_at = NOW()
WHERE id = '081f9a79-7479-405e-a177-e6bfbec09504';

-- Zambas Long Life Noodles -> Zambas Long Life Food Production (BUSC HC-14, expired)
UPDATE public.products
SET establishment_id = '642b7e65-2605-46b9-a825-d5706e3d3d88',
    brand = COALESCE(NULLIF(trim(brand), ''), 'Zambas Long Life'),
    updated_at = NOW()
WHERE id = 'ab5707c8-c825-45c5-a263-4d9ea93a8856';
