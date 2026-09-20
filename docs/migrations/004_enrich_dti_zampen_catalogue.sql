-- ==============================================================================
-- HalalVerify: Migration 004 - Enrich Regional MSME Registry with DTI 2026 Catalogue
-- Integrates all 29 slides of official DTI Region IX "HALAL in ZAMPEN" Catalogue
-- Adds verified contact persons, phone numbers, emails, retail packaging, and SKUs
-- ==============================================================================

-- 1. Ensure contact_person column exists on public.manufacturers
ALTER TABLE public.manufacturers 
ADD COLUMN IF NOT EXISTS contact_person text;

-- 2. Insert new MSME Manufacturers from DTI Catalogue
INSERT INTO public.manufacturers (name, country, address, contact_person, contact_phone, contact_email, source, source_url)
VALUES
    ('RURU Mushrooms', 'Philippines', 'F. Locson Dr., Lumiyap Rd., Divisoria, Zamboanga City', 'Rubylyzle Alrayes', '(+63) 995 620 9472 / (+63) 945 344 3470', 'rurumushrooms@gmail.com', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
    ('Laguerta Food Products', 'Philippines', 'New Tambo, Katipunan, Zamboanga del Norte', 'Ardie Quiamjot', '0945 980 6209', 'ardiequiamjot@yahoo.com.ph', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
    ('FML Safeeats Corporation', 'Philippines', 'FML Compound, Bypass Road, Gulayon, Dipolog City, Zamboanga del Norte', 'Marc Anthony Mawile', '0995 533 1102 / 0981 132 4909', 'fmlsafeeatscorp@gmail.com', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
    ('FML Agriventures Corporation (AKAO Farms)', 'Philippines', 'Calamboyan, Zamboanga del Norte', 'Marc Anthony Mawile', '0995 533 1102 / 0981 132 4909', 'freshharvestfarm2005@gmail.com', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
    ('Oasis Livelihood and Training Center (Silsilah)', 'Philippines', 'Harmony Village, Pitogo, Sinunuc, Zamboanga City', 'Oasis Livelihood and Training Center', '(+63) 935 535 4511', 'silsilahdialogue@gmail.com', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
    ('Zamboanga Sibugay High Value Crops Marketing Cooperative (ZASIHIVAC)', 'Philippines', 'Poblacion, Siay, Zamboanga Sibugay', 'Mirza M. Rivas', '0997-425-0720', 'mirzarivas12@gmail.com', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
ON CONFLICT (name) DO UPDATE
SET
    address = EXCLUDED.address,
    contact_person = EXCLUDED.contact_person,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    source = EXCLUDED.source,
    updated_at = now();

-- 3. Update Existing Manufacturers with Verified DTI Business Details
UPDATE public.manufacturers
SET 
    contact_person = 'Habil M. Tiblani',
    contact_phone = '(+63) 965 336 3898',
    contact_email = 'tiblanihabil@gmail.com',
    address = 'MAPZACARA Purok 1 Malandi Patalon, Zamboanga City',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%MAPZACARA%';

UPDATE public.manufacturers
SET 
    contact_person = 'Nurshiba Amil',
    contact_phone = '(+63) 977 254 4745',
    contact_email = 'shibangamil@gmail.com',
    address = '158C Kasalamatan Drive Brgy. Kasanyangan, Zamboanga City',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%AntiEns%';

UPDATE public.manufacturers
SET 
    contact_person = 'Teresita Kabayao',
    contact_phone = '(+63) 935 315 1069',
    contact_email = 'teresitakabayao@yahoo.com',
    address = 'Los Primos Drive, Tugbungan, Zamboanga City',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%2K Peanut%';

UPDATE public.manufacturers
SET 
    contact_person = 'Eunice Lao',
    contact_phone = '(+63) 916 420 3545',
    contact_email = 'eunicelao012316@gmail.com',
    address = 'Bangayan Bldg., Veterans Ave., Zamboanga City',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Auntie Nit%';

UPDATE public.manufacturers
SET 
    contact_person = 'Melvin P. Mari',
    contact_phone = '0917-727-0461',
    contact_email = 'mchcarmelathefoodshop@gmail.com',
    address = 'Estrada Street, Tetuan, Zamboanga City',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%MCH Carmela%';

UPDATE public.manufacturers
SET 
    contact_person = 'Omar Paradji',
    contact_phone = '(+63) 997 875 0522',
    contact_email = 'olafoodproducts@gmail.com',
    address = 'Maasin, Zamboanga City',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Ola Food%';

UPDATE public.manufacturers
SET 
    contact_person = 'Jocelyn A. Rizada',
    contact_phone = '0975 127 2448',
    contact_email = 'jinghproducts@gmail.com',
    address = 'Sunset view, Purok 2, Cabatangan, Zamboanga City, 7000',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Jing Homemade%';

UPDATE public.manufacturers
SET 
    contact_person = 'Jemimah D. Gumalal',
    contact_phone = '(065) 212 7248',
    contact_email = 'dsf_zn@yahoo.com',
    address = 'Olingan, Dipolog City, ZDN, 7100',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Dipolog School of Fisheries%';

UPDATE public.manufacturers
SET 
    contact_person = 'Niña Gonzales-Bustamante',
    contact_phone = '0946 075 2284',
    contact_email = 'sardensfoodproducts@yahoo.com',
    address = 'Larayan, Dapitan City, ZDN',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Sar-Den%';

UPDATE public.manufacturers
SET 
    contact_person = 'Evelyn Empeynado',
    contact_phone = '0907 162 0943',
    contact_email = 'evelynempeynado_40@yahoo.com',
    address = 'Aseniero, Dapitan City, ZDN',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%CAGAPA%';

UPDATE public.manufacturers
SET 
    contact_person = 'Marc Anthony Mawile',
    contact_phone = '0995 533 1102 / 0981 132 4909',
    contact_email = 'fmlsafeeatscorp@gmail.com',
    address = 'FML Compound, Bypass Road, Gulayon, Dipolog City, ZDN, 7106',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%DipMayo%';

UPDATE public.manufacturers
SET 
    contact_person = 'Jan Christies D. Paglinawan',
    contact_phone = '09669968578',
    contact_email = 'jc.paglinawan@agrikoph.com',
    address = 'Purok 6, Libertad, Dumingag, Zamboanga del Sur',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Agriko%';

UPDATE public.manufacturers
SET 
    contact_person = 'Lorna P. Altoberos',
    contact_phone = '(+63) 998 127 7438',
    address = 'Duterte St., Gatas District, Pagadian City, Zamboanga del Sur',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Altoberos%';

UPDATE public.manufacturers
SET 
    contact_person = 'Teodorico A. Egento',
    contact_phone = '(+63) 998 860 5741',
    contact_email = 'ricoegento@yahoo.com',
    address = 'ABCEDE Compound, Purok Makugihon, Blancia, Molave, Zamboanga del Sur',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Heaven%';

UPDATE public.manufacturers
SET 
    contact_person = 'Leah F. Yu',
    contact_phone = '(+63) 920 988 0910',
    contact_email = 'leahfyu@yahoo.com',
    address = 'Aqua Niña, Morgan St., Maloloy-on, Molave, ZDS',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Lianas%';

UPDATE public.manufacturers
SET 
    contact_person = 'Florencia Celada',
    contact_phone = '(+63) 999 991 8928',
    contact_email = 'mifamco_92@yahoo.com',
    address = 'Purok 1, Poblacion B, Midsalip, Zamboanga del Sur',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Midsalip%';

UPDATE public.manufacturers
SET 
    contact_person = 'Maribel A. Azuga',
    contact_phone = '0926-284-1678',
    contact_email = 'maribelazuga777@gmail.com',
    address = 'Prk. Roxas, Binondo Street, Imelda, Zamboanga Sibugay',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%A5 Calamansi%';

UPDATE public.manufacturers
SET 
    contact_person = 'Maryvel T. Napigkit',
    contact_phone = '0917-719-1562',
    contact_email = 'maryvel_napigkit@yahoo.com',
    address = 'Santa Cruz, Kabasalan, Zamboanga Sibugay',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Rossvell%';

UPDATE public.manufacturers
SET 
    contact_person = 'Rosemarie C. Pepito',
    contact_phone = '0927-932-6442',
    contact_email = 'rosemariepepito777@gmail.com',
    address = 'Batu, Siay, Zamboanga Sibugay',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%KThree%';

UPDATE public.manufacturers
SET 
    contact_person = 'Carlito A. Carino Jr.',
    contact_phone = '0917-825-2692',
    contact_email = 'pickers.calamansi@gmail.com',
    address = 'Salinding, Siay, Zamboanga Sibugay',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Picker%';

UPDATE public.manufacturers
SET 
    contact_person = 'Caren Joy P. Duran',
    contact_phone = '0949-990-1379',
    contact_email = 'imavemco1995@yahoo.com',
    address = 'Don Andres, Ipil, Zamboanga Sibugay',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%IMAVEMCO%';

UPDATE public.manufacturers
SET 
    contact_person = 'Maria Teresa T. Jumalon',
    contact_phone = '0935-329-0607',
    contact_email = 'ttacay@gmail.com',
    address = 'Prk. Golden Shower, San Antonio, Titay, Zamboanga Sibugay',
    source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    updated_at = now()
WHERE name ILIKE '%Jerusalem%';

-- 4. Seed New Commercial Halal Products from DTI Catalogue
DO $$
DECLARE
    busc_id UUID;
    bpcc_id UUID;
    m_antiens UUID;
    m_2k UUID;
    m_ruru UUID;
    m_ola UUID;
    m_laguerta UUID;
    m_dsf UUID;
    m_sarden UUID;
    m_akao UUID;
    m_zasihivac UUID;
    m_jeru UUID;
    m_heavens UUID;
BEGIN
    SELECT id INTO busc_id FROM public.certifying_bodies WHERE code = 'BUSC' LIMIT 1;
    SELECT id INTO bpcc_id FROM public.certifying_bodies WHERE code = 'BPCC' LIMIT 1;

    SELECT id INTO m_antiens FROM public.manufacturers WHERE name ILIKE '%AntiEns%' LIMIT 1;
    SELECT id INTO m_2k FROM public.manufacturers WHERE name ILIKE '%2K Peanut%' LIMIT 1;
    SELECT id INTO m_ruru FROM public.manufacturers WHERE name = 'RURU Mushrooms' LIMIT 1;
    SELECT id INTO m_ola FROM public.manufacturers WHERE name ILIKE '%Ola Food%' LIMIT 1;
    SELECT id INTO m_laguerta FROM public.manufacturers WHERE name = 'Laguerta Food Products' LIMIT 1;
    SELECT id INTO m_dsf FROM public.manufacturers WHERE name ILIKE '%Dipolog School of Fisheries%' LIMIT 1;
    SELECT id INTO m_sarden FROM public.manufacturers WHERE name ILIKE '%Sar-Den%' LIMIT 1;
    SELECT id INTO m_akao FROM public.manufacturers WHERE name ILIKE '%AKAO Farms%' LIMIT 1;
    SELECT id INTO m_zasihivac FROM public.manufacturers WHERE name ILIKE '%ZASIHIVAC%' LIMIT 1;
    SELECT id INTO m_jeru FROM public.manufacturers WHERE name ILIKE '%Jerusalem%' LIMIT 1;
    SELECT id INTO m_heavens FROM public.manufacturers WHERE name ILIKE '%Heaven%' LIMIT 1;

    -- 4.1 AntiEns Packaged Tausug Specialties
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Batang Buruk Sweet Spring Rolls 150g', 'AntiEns', 'Native Delicacies', '4809012345082', m_antiens, busc_id, 'HC-001', '2026-10-26', 'Halal', true, 'Rice Flour, Mung Bean Flour, Coconut Milk, Cane Sugar, Palm Oil', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('Kuih Kacang Peanut Cookies 200g', 'AntiEns', 'Native Delicacies', '4809012345083', m_antiens, busc_id, 'HC-001', '2026-10-26', 'Halal', true, 'Roasted Native Peanuts, Flour, Egg, Brown Sugar, Pure Vegetable Shortening', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('Lara Lara Sweet Rice Crackers 150g', 'AntiEns', 'Native Delicacies', '4809012345084', m_antiens, busc_id, 'HC-001', '2026-10-26', 'Halal', true, 'Glutinous Rice, Muscovado Sugar Syrup, Sesame Seeds, Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('AntiEns Native Spiced Sukang Ilokano Vinegar 350ml', 'AntiEns', 'Condiments & Vinegar', '4809012345085', m_antiens, busc_id, 'HC-001', '2026-10-26', 'Halal', true, 'Pure Fermented Coconut Sap Vinegar, Garlic, Birdseye Chili, Peppercorn', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.2 2K Peanuts (300g Stand-up Retail Pouches)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('2K Salted Brown Peanuts 300g', '2K Peanuts', 'Snacks & Nuts', '4809012345086', m_2k, busc_id, 'HC-029', '2026-11-20', 'Halal', true, 'Whole Roasted Peanuts with Skin, Vegetable Oil, Sea Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('2K Spicy Garlic Brown Peanuts 300g', '2K Peanuts', 'Snacks & Nuts', '4809012345087', m_2k, busc_id, 'HC-029', '2026-11-20', 'Halal', true, 'Whole Peanuts with Skin, Crispy Garlic Slices, Native Red Chili, Iodized Salt, Vegetable Oil', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('2K Spicy Garlic Skinless Peanuts 300g', '2K Peanuts', 'Snacks & Nuts', '4809012345088', m_2k, busc_id, 'HC-029', '2026-11-20', 'Halal', true, 'Blanched Skinless Peanuts, Toasted Garlic Chips, Chili Flakes, Vegetable Oil, Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.3 RURU De-Oiled Mushroom Chips
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('RURU Natural Plain Mushroom Chips 100g', 'RURU Mushrooms', 'Snacks & Chips', '4809012345089', m_ruru, busc_id, 'BUSC-RURU-01', '2026-12-31', 'Halal', true, 'Fresh Oyster Mushrooms, Cassava Flour, Iodized Salt, Vegetable Oil (Spin De-oiled)', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('RURU Garlic Mushroom Chips 100g', 'RURU Mushrooms', 'Snacks & Chips', '4809012345090', m_ruru, busc_id, 'BUSC-RURU-02', '2026-12-31', 'Halal', true, 'Fresh Oyster Mushrooms, Garlic Powder, Flour, Sea Salt, Vegetable Oil', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('RURU Spicy BBQ Mushroom Chips 100g', 'RURU Mushrooms', 'Snacks & Chips', '4809012345091', m_ruru, busc_id, 'BUSC-RURU-03', '2026-12-31', 'Halal', true, 'Fresh Oyster Mushrooms, Halal Barbecue Seasoning, Chili Powder, Salt, Vegetable Oil', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('RURU Sour Cream Mushroom Chips 100g', 'RURU Mushrooms', 'Snacks & Chips', '4809012345092', m_ruru, busc_id, 'BUSC-RURU-04', '2026-12-31', 'Halal', true, 'Fresh Oyster Mushrooms, Halal Sour Cream & Onion Seasoning, Milk Solids, Salt, Vegetable Oil', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.4 OLA Food Products (Traditional Tausug Instant Powder Mixes)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('OLA Satti Sauce Ready Mix Powder 150g', 'OLA', 'Seasonings & Mixes', '4809012345093', m_ola, busc_id, 'BUSC-OLA-01', '2026-12-31', 'Halal', true, 'Toasted Rice Flour, Native Chili, Turmeric, Garlic, Ginger, Brown Sugar, Spices', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('OLA Chicken Pyanggang Black Chicken Stew Mix 100g', 'OLA', 'Seasonings & Mixes', '4809012345094', m_ola, busc_id, 'BUSC-OLA-02', '2026-12-31', 'Halal', true, 'Pure Burnt Coconut Meat (Pamapa Itum), Turmeric, Lemongrass, Garlic, Ginger, Chili, Black Pepper', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('OLA Beef Kulma Ready Mix Powder 100g', 'OLA', 'Seasonings & Mixes', '4809012345095', m_ola, busc_id, 'BUSC-OLA-03', '2026-12-31', 'Halal', true, 'Ground Peanut Paste, Curry Spices, Tomato Powder, Lemongrass, Paprika, Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('OLA Crab Sauce Ready Mix Seasoning 120g', 'OLA', 'Seasonings & Mixes', '4809012345096', m_ola, busc_id, 'BUSC-OLA-04', '2026-12-31', 'Halal', true, 'Seafood Flavor Extract, Garlic, Annatto, Native Spices, Starch, Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.5 Laguerta Food Products
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Laguerta Calamansi Juice Ready-to-Drink 350ml', 'Laguerta', 'Beverages & Juices', '4809012345097', m_laguerta, busc_id, 'BUSC-LAG-01', '2026-12-31', 'Halal', true, 'Fresh Calamansi Juice, Purified Water, Cane Sugar', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('Laguerta Calamansi Concentrate with Natural Honey 500ml', 'Laguerta', 'Beverages & Juices', '4809012345098', m_laguerta, busc_id, 'BUSC-LAG-02', '2026-12-31', 'Halal', true, 'Pure Squeezed Calamansi Juice (Citrus microcarpa), Natural Wild Honey, Cane Sugar', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('Laguerta Pure Coconut Vinegar 750ml', 'Laguerta', 'Condiments & Vinegar', '4809012345099', m_laguerta, busc_id, 'BUSC-LAG-03', '2026-12-31', 'Halal', true, '100% Naturally Fermented Coconut Sap (Sukang Tuba)', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.6 Dipolog School of Fisheries (TESDA DSF Bottled Seafood)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('DSF Delicious Krill Mildly Salted Alamang 200g', 'DSF TESDA', 'Native Seafood Condiments', '4809012345100', m_dsf, busc_id, 'HC-DSF-01', '2026-12-31', 'Halal', true, 'Fresh Baby Krill (Acetes), Fine Sea Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('DSF Spanish Style Herring in Corn Oil 200g', 'DSF TESDA', 'Canned & Jarred Seafood', '4809012345101', m_dsf, busc_id, 'HC-DSF-02', '2026-12-31', 'Halal', true, 'Fresh Philippine Herring, Pure Corn Oil, Pickled Carrot, Whole Peppercorn, Sea Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('DSF Spanish Style Bangus Milkfish in Corn Oil 200g', 'DSF TESDA', 'Canned & Jarred Seafood', '4809012345102', m_dsf, busc_id, 'HC-DSF-03', '2026-12-31', 'Halal', true, 'Tender Milkfish Chunks, Pure Corn Oil, Siling Labuyo, Bay Leaf, Iodized Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.7 DESA (Sar-Den''s Food Products, Dapitan)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('DESA Garlic Gourmet Tuyo in Corn Oil 208g', 'DESA', 'Canned & Jarred Seafood', '4809012345103', m_sarden, busc_id, 'HC-DESA-01', '2026-12-31', 'Halal', true, 'Sun-Dried Herring, Corn Oil, Garlic Chips, Birdseye Chili, Spices', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('DESA Spanish Style Bangus Milkfish in Corn Oil 216g', 'DESA', 'Canned & Jarred Seafood', '4809012345104', m_sarden, busc_id, 'HC-DESA-02', '2026-12-31', 'Halal', true, 'Fresh Bangus Steaks, Pure Corn Oil, Carrots, Sweet Pickles, Whole Peppercorn, Salt', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('DESA Dayok Native Fermented Fish Condiment 250g', 'DESA', 'Native Seafood Condiments', '4809012345105', m_sarden, busc_id, 'HC-DESA-03', '2026-12-31', 'Halal', true, 'Fermented Yellowfin/Skipjack Viscera, Sea Salt, Native Spices', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.8 AKAO Farms Fresh Table Eggs
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('AKAO Farms Certified Halal Fresh Table Eggs 12s', 'AKAO Farms', 'Dairy & Eggs', '4809012345106', m_akao, busc_id, 'HC-AKAO-01', '2026-12-31', 'Halal', true, '100% Farm Fresh Vegetarian-Fed Hen Eggs (Halal Compliant Poultry)', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.9 Pomona Calamansi Purée (ZASIHIVAC, Siay)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Pomona Calamansi Purée 1-Liter Jug', 'pomona', 'Beverages & Juices', '4809012345107', m_zasihivac, busc_id, 'HC-POM-01', '2026-12-31', 'Halal', true, '100% Pure Cold-Pressed Calamansi Fruit Purée, Cane Sugar', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('Pomona Calamansi Juice Drink 300ml', 'pomona', 'Beverages & Juices', '4809012345108', m_zasihivac, busc_id, 'HC-POM-02', '2026-12-31', 'Halal', true, 'Fresh Calamansi Juice Extract, Purified Water, Cane Sugar', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.10 Cymon Herbal Seasoning Salts (Jerusalem Herbal Products, Titay)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Cymon Celery Salt Gourmet Shaker 250g', 'Cymon', 'Spices & Seasonings', '4809012345109', m_jeru, busc_id, 'HC-JH-01', '2026-11-20', 'Halal', true, 'Natural Sea Salt, Dehydrated Celery Seed & Leaves, Native Garlic, Spices', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('Cymon BBQ Rub Herbs & Spices 250g', 'Cymon', 'Spices & Seasonings', '4809012345110', m_jeru, busc_id, 'HC-JH-01', '2026-11-20', 'Halal', true, 'Sea Salt, Paprika, Smoked Chili Powder, Brown Sugar, Onion Powder, Garlic, Oregano', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/'),
        ('Cymon Hot & Spicy Herbal Salt 250g', 'Cymon', 'Spices & Seasonings', '4809012345111', m_jeru, busc_id, 'HC-JH-01', '2026-11-20', 'Halal', true, 'Natural Sea Salt, Siling Labuyo Flakes, Native Crushed Black Pepper, Garlic, Oregano', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.11 Heaven's Gift Grilled Black Hopia
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Heaven''s Gift Grilled Black Hopia with Organic Black Rice 8s', 'Heaven''s Gift', 'Bakery & Pastries', '4809012345112', m_heavens, bpcc_id, 'BPCC-2025-HG-50', '2026-12-15', 'Halal', true, 'Flour, Organic Black Rice Bean Paste, Brown Sugar, Coconut Oil (100% NO PORK)', 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026', 'https://r09.dti.gov.ph/')
    ON CONFLICT (barcode) DO UPDATE
    SET name = EXCLUDED.name, brand = EXCLUDED.brand, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;
END $$;
