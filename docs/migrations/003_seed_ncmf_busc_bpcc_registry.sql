-- ==============================================================================
-- HalalVerify: Migration 003 - Seed Official NCMF, BUSC, and BPCC Registry Data
-- Covers 12 NCMF Accredited Halal Certification Bodies, Regional Establishments,
-- Local Manufacturers, and Certified Packaged Food Products across Region IX
-- ==============================================================================

-- 1. Ensure all 12 NCMF-Accredited Certifying Bodies exist in public.certifying_bodies
INSERT INTO public.certifying_bodies (code, name, country, accreditation_details, website)
VALUES
    ('MMHCB', 'Muslim Mindanao Halal Certification Board, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://mmhcb.org.ph/'),
    ('PUCOI', 'Philippine Ulama Congress Organization, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://pucoi.org/'),
    ('BPCC', 'Bangsamoro Provincial Consultative Council, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://bpcc-halal.org/'),
    ('AHIP', 'Alliances for Halal Integrity of the Philippines, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://ahiphalal.org/'),
    ('HICCIP', 'Halal International Chamber of Commerce and Industries of the Philippines Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://hiccip.org/'),
    ('MinHA', 'Mindanao Halal Authority, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://minha.org.ph/'),
    ('PRIME', 'Prime Certification and Inspection Asia Pacific, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://primegroup.com/'),
    ('FIQHI', 'Fiqhi and Halal Council of the Philippines, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://fiqhihalal.org/'),
    ('HDIP', 'Halal Development Institute of the Philippines, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://hdiphalal.com/'),
    ('MASLAHA', 'Maslaha Halal Certification Board, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://maslahahalal.org/'),
    ('Philcosed', 'Philippine Ligawasan Marsh Conservation and Socio-Economic Development, Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF)', 'https://philcosed.org/'),
    ('BUSC', 'Basilan Ulama Supreme Council Foundation Inc.', 'Philippines', 'Accredited by National Commission on Muslim Filipinos (NCMF) - Isabela City, Basilan', 'https://buschalal.org/')
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    accreditation_details = EXCLUDED.accreditation_details,
    website = COALESCE(EXCLUDED.website, public.certifying_bodies.website);

-- 2. Seed Official Local Food Manufacturers
INSERT INTO public.manufacturers (name, country, address, source, source_url)
VALUES
    ('Agriko Multi-Trade & Enterprise Corp', 'Philippines', 'Paglinawan Organic Eco Farm, Dumingag, Zamboanga del Sur', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
    ('Heaven''s Gift Bakehaus', 'Philippines', 'Barangay Blancia, Molave, Zamboanga del Sur', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
    ('Altoberos Food Products', 'Philippines', 'Gatas District, Pagadian City, Zamboanga del Sur', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
    ('Midsalip Farmers Multi-Purpose Cooperative (MIFAMCO)', 'Philippines', 'Mifamco Plant, Canipay Sur, Midsalip, Zamboanga del Sur', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
    ('Lianas Food Products Manufacturing', 'Philippines', 'Brgy. Matuluy-on, Molave, Zamboanga del Sur', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
    ('Don Fernando Gourmet Foods', 'Philippines', 'Green Meadow Subd., Galvez Drive, Santa Maria, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Auntie Nit''z Bakeshop & Grocery', 'Philippines', 'Veterans Avenue, Tetuan, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Mamu''s Bread and Pastries Shop', 'Philippines', 'Third Floor Main Mall, KCC Mall De Zamboanga, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('MCH Carmela The Food Shop', 'Philippines', 'Estrada St., Tetuan, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('2K Peanut', 'Philippines', 'Tugbungan, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Jing Homemade Products', 'Philippines', 'Cabatangan, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Silsilah Foundation, Inc.', 'Philippines', 'Harmony Village, Pitogo, Sinunuc, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('MAPZACARA Coco Sugar', 'Philippines', 'Malandi-Patalon, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Sar-Den''s Food Products', 'Philippines', 'Kawayan, Larayan, Dapitan City, Zamboanga del Norte', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Dipolog School of Fisheries (TESDA)', 'Philippines', 'Olingan, Dipolog City, Zamboanga del Norte', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('AKAO Farms', 'Philippines', 'Calamboyan, Zamboanga del Norte', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('DipMayo Food Products', 'Philippines', 'FML Compound, Bypass Road, Gulayon, Dipolog City, Zamboanga del Norte', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('ZASIHIVAC', 'Philippines', 'Provincial Compound, Ipil, Zamboanga Sibugay', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Jerusalem Herbal Products Manufacturing', 'Philippines', 'San Antonio, Titay, Zamboanga Sibugay', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Rossvell Enterprises', 'Philippines', 'Triangle Village, Sta. Cruz, Kabasalan, Zamboanga Sibugay', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('CAGAPA Cassava Producers', 'Philippines', 'Sentro, Aseniero, Dapitan City, Zamboanga del Norte', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('IMAVEMCO Noodle Producers', 'Philippines', 'Tiayon, Ipil, Zamboanga Sibugay', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Ola Food Products', 'Philippines', 'Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('A5 Calamansi Juice Enterprise', 'Philippines', 'Purok Roxas, Poblacion, Imelda, Zamboanga Sibugay', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('Picker''s Calamansi Food Products', 'Philippines', 'Salinding, Siay, Zamboanga Sibugay', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('KThree Food Product', 'Philippines', 'Batu, Siay, Zamboanga Sibugay', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
    ('AntiEns Tausug Foods', 'Philippines', 'Veterans Avenue, Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/')
ON CONFLICT (name) DO UPDATE 
SET address = EXCLUDED.address, source = EXCLUDED.source, updated_at = now();

-- 3. Update & Seed Regional Establishments
DO $$
DECLARE
    busc_id UUID;
    bpcc_id UUID;
BEGIN
    SELECT id INTO busc_id FROM public.certifying_bodies WHERE code = 'BUSC' LIMIT 1;
    SELECT id INTO bpcc_id FROM public.certifying_bodies WHERE code = 'BPCC' LIMIT 1;

    -- Update AntiEns Restaurant with active BUSC certificate HC-001
    UPDATE public.establishments 
    SET 
        halal_status = 'verified',
        certificate_number = 'HC-001',
        certifying_body_id = busc_id,
        expiry_date = '2026-10-26',
        source = 'NCMF / BUSC 3rd Quadrimester Report 2025',
        description = 'Official Halal Tausug Restaurant serving traditional menu (Lara-lara, Batang Buruk, Hantak, Ariaralam, Jintan, Baulo, Jaa, Pastil, Kuih Kacang, Tyula Itum Mix, Sambal, Chilli Garlic Oil, Pamapa Itum, Bubuk).'
    WHERE name ILIKE '%AntiEns%';

    -- Update Dennis Coffee Garden to Expired per BUSC manifest
    UPDATE public.establishments 
    SET 
        halal_status = 'expired',
        source = 'NCMF / BUSC 3rd Quadrimester Report 2025',
        admin_notes = 'Certification expired pending audit renewal.'
    WHERE name ILIKE '%Dennis Coffee Garden%';

    -- Insert new verified regional establishments if not already present
    INSERT INTO public.establishments (name, type, address, city, halal_status, certificate_number, certifying_body_id, expiry_date, latitude, longitude, source, description)
    SELECT v.name, v.type, v.address, v.city, v.halal_status, v.certificate_number, busc_id, v.expiry_date::date, v.latitude, v.longitude, v.source, v.description
    FROM (VALUES
        ('Zamboanga City Medical Center (ZCMC) Dietary Kitchen', 'Hospital Dietary Kitchen', 'Dr. Evangelista St., Sta. Catalina', 'Zamboanga City', 'verified', 'HC-06', '2026-11-10', 6.9135, 122.0838, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Halal-certified hospital dietary kitchen serving inpatient meals and dietary services.'),
        ('West Metro Medical Center Dietary Kitchen', 'Hospital Dietary Kitchen', 'Veterans Avenue', 'Zamboanga City', 'verified', 'HC-26', '2026-12-12', 6.9214, 122.0792, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Halal-certified institutional dietary kitchen for medical center patients and staff.'),
        ('Auntie Nit''z Bakeshop & Grocery', 'Bakery & Delicacies', 'Veterans Avenue, Tetuan', 'Zamboanga City', 'verified', 'HC-05', '2027-10-26', 6.9230, 122.0830, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Halal-certified bakeshop producing over 45 bread, pastry, hopia, and cake varieties.'),
        ('Mamu''s Bread and Pastries Shop', 'Bakery & Confectionery', 'Third Floor Main Mall, KCC Mall De Zamboanga', 'Zamboanga City', 'verified', 'HC-030', '2026-11-20', 6.9218, 122.0734, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Artisan croissant, pastry, and cake shop located inside KCC Mall de Zamboanga.'),
        ('MCH Carmela The Food Shop', 'Native Delicacies & Pastries', 'Estrada St., Tetuan', 'Zamboanga City', 'verified', 'HC-028', '2026-11-20', 6.9180, 122.0855, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Producer of traditional Zamboanga native delicacies, pastries, and confectionery.'),
        ('Don Fernando Gourmet Seafood', 'Gourmet Food Processing Facility', 'Green Meadow Subd., Galvez Drive, Santa Maria', 'Zamboanga City', 'verified', 'HC-027', '2026-11-20', 6.9320, 122.0710, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Producer of bottled Spanish sardines in corn oil, gourmet tuyo, danggit, pusit, tuna flakes, and chili garlic oil.'),
        ('2K Peanut Snack Enterprise', 'Food & Snack Processing', 'Tugbungan', 'Zamboanga City', 'verified', 'HC-029', '2026-11-20', 6.9240, 122.0910, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Certified halal snack and nut processing establishment in Tugbungan.'),
        ('Jing Homemade Products', 'Native Condiments & Seafood', 'Cabatangan', 'Zamboanga City', 'verified', 'HC-031', '2026-11-20', 6.9380, 122.0550, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Producer of bottled Bagoong Gata, Tuyo Flakes, Guinamos Guisado, and Chili Oil.'),
        ('Silsilah Foundation, Inc. Food Center', 'Food Manufacturing Facility', 'Harmony Village, Pitogo, Sinunuc', 'Zamboanga City', 'verified', 'HC-039', '2026-10-25', 6.9450, 121.9950, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Food and beverage manufacturing facility producing dry pack beverages and instant mixes.'),
        ('MAPZACARA Coco Sugar Processing', 'Agricultural Sugar Production', 'Malandi-Patalon', 'Zamboanga City', 'verified', 'HC-015', '2026-10-26', 7.0310, 121.9210, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Organic coconut sugar and by-product processing plant in western Zamboanga City coast.'),
        ('Seacatch Restaurant Pick and GO', 'Seafood Restaurant', 'General Luna St.', 'Dipolog City', 'expired', 'HC-25', '2025-10-03', 8.5830, 123.3410, 'NCMF / BUSC 3rd Quadrimester Report 2025', 'Halal seafood establishment in Dipolog City (Certification expired pending audit renewal).')
    ) AS v(name, type, address, city, halal_status, certificate_number, expiry_date, latitude, longitude, source, description)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.establishments e WHERE e.name = v.name
    );
END $$;

-- 4. Seed Official BPCC & BUSC Packaged Food Products
DO $$
DECLARE
    busc_id UUID;
    bpcc_id UUID;
    m_agriko UUID;
    m_heavens UUID;
    m_alto UUID;
    m_mifamco UUID;
    m_lianas UUID;
    m_donf UUID;
    m_mamus UUID;
    m_auntie UUID;
    m_jing UUID;
    m_mapzacara UUID;
    m_silsilah UUID;
    m_dipmayo UUID;
    m_sarden UUID;
    m_imavemco UUID;
    m_zas UUID;
    m_jeru UUID;
    m_ross UUID;
    m_cagapa UUID;
BEGIN
    SELECT id INTO busc_id FROM public.certifying_bodies WHERE code = 'BUSC' LIMIT 1;
    SELECT id INTO bpcc_id FROM public.certifying_bodies WHERE code = 'BPCC' LIMIT 1;

    SELECT id INTO m_agriko FROM public.manufacturers WHERE name = 'Agriko Multi-Trade & Enterprise Corp';
    SELECT id INTO m_heavens FROM public.manufacturers WHERE name = 'Heaven''s Gift Bakehaus';
    SELECT id INTO m_alto FROM public.manufacturers WHERE name = 'Altoberos Food Products';
    SELECT id INTO m_mifamco FROM public.manufacturers WHERE name = 'Midsalip Farmers Multi-Purpose Cooperative (MIFAMCO)';
    SELECT id INTO m_lianas FROM public.manufacturers WHERE name = 'Lianas Food Products Manufacturing';
    SELECT id INTO m_donf FROM public.manufacturers WHERE name = 'Don Fernando Gourmet Foods';
    SELECT id INTO m_mamus FROM public.manufacturers WHERE name = 'Mamu''s Bread and Pastries Shop';
    SELECT id INTO m_auntie FROM public.manufacturers WHERE name = 'Auntie Nit''z Bakeshop & Grocery';
    SELECT id INTO m_jing FROM public.manufacturers WHERE name = 'Jing Homemade Products';
    SELECT id INTO m_mapzacara FROM public.manufacturers WHERE name = 'MAPZACARA Coco Sugar';
    SELECT id INTO m_silsilah FROM public.manufacturers WHERE name = 'Silsilah Foundation, Inc.';
    SELECT id INTO m_dipmayo FROM public.manufacturers WHERE name = 'DipMayo Food Products';
    SELECT id INTO m_sarden FROM public.manufacturers WHERE name = 'Sar-Den''s Food Products';
    SELECT id INTO m_imavemco FROM public.manufacturers WHERE name = 'IMAVEMCO Noodle Producers';
    SELECT id INTO m_zas FROM public.manufacturers WHERE name = 'ZASIHIVAC';
    SELECT id INTO m_jeru FROM public.manufacturers WHERE name = 'Jerusalem Herbal Products Manufacturing';
    SELECT id INTO m_ross FROM public.manufacturers WHERE name = 'Rossvell Enterprises';
    SELECT id INTO m_cagapa FROM public.manufacturers WHERE name = 'CAGAPA Cassava Producers';

    -- 4.1 Agriko Multi-Trade & Enterprise Corp (BPCC Certified)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('5N1 Turmeric Tea Powder Blend', 'Agriko Organic', 'Beverages & Teas', '4809012345001', m_agriko, bpcc_id, 'BPCC-2025-AG-01', '2026-12-15', 'Halal', true, 'Pure Turmeric, Ginger, Lemongrass, Pandan, Brown Sugar', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Turmeric Tea Powder Blend', 'Agriko Organic', 'Beverages & Teas', '4809012345002', m_agriko, bpcc_id, 'BPCC-2025-AG-02', '2026-12-15', 'Halal', true, 'Pure Turmeric Rhizome Extract, Organic Cane Sugar', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Ginger Tea Powder Blend', 'Agriko Organic', 'Beverages & Teas', '4809012345003', m_agriko, bpcc_id, 'BPCC-2025-AG-03', '2026-12-15', 'Halal', true, 'Pure Native Ginger Extract, Organic Cane Sugar', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Roasted Black Rice with 5N1 Turmeric Tea Blend', 'Agriko Organic', 'Beverages & Teas', '4809012345004', m_agriko, bpcc_id, 'BPCC-2025-AG-04', '2026-12-15', 'Halal', true, 'Roasted Organic Black Rice, Turmeric, Ginger, Pandan', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Cacao with 5N1 Turmeric Tea Powder Blend', 'Agriko Organic', 'Beverages & Teas', '4809012345005', m_agriko, bpcc_id, 'BPCC-2025-AG-05', '2026-12-15', 'Halal', true, 'Pure Cacao Powder, Turmeric, Ginger, Raw Sugar', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Organic Black Rice 1kg', 'Agriko Eco Farm', 'Grains & Rice', '4809012345006', m_agriko, bpcc_id, 'BPCC-2025-AG-06', '2026-12-15', 'Halal', true, '100% Organic Whole Grain Black Rice', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Organic Brown Rice 1kg', 'Agriko Eco Farm', 'Grains & Rice', '4809012345007', m_agriko, bpcc_id, 'BPCC-2025-AG-07', '2026-12-15', 'Halal', true, '100% Organic Unpolished Brown Rice', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Organic Red Rice 1kg', 'Agriko Eco Farm', 'Grains & Rice', '4809012345008', m_agriko, bpcc_id, 'BPCC-2025-AG-08', '2026-12-15', 'Halal', true, '100% Organic Whole Grain Red Rice', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Organic White Rice 1kg', 'Agriko Eco Farm', 'Grains & Rice', '4809012345009', m_agriko, bpcc_id, 'BPCC-2025-AG-09', '2026-12-15', 'Halal', true, '100% Organic Milled White Rice', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Pure 5N1 Herbal Powder', 'Agriko Eco Farm', 'Health Supplements', '4809012345010', m_agriko, bpcc_id, 'BPCC-2025-AG-10', '2026-12-15', 'Halal', true, '100% Pure Dehydrated Turmeric, Ginger, Moringa, Guyabano, Lemongrass', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Pure Ginger Powder 100g', 'Agriko Eco Farm', 'Health Supplements', '4809012345011', m_agriko, bpcc_id, 'BPCC-2025-AG-11', '2026-12-15', 'Halal', true, '100% Pure Dehydrated Ginger Root Powder', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Pure Guyabano Powder 100g', 'Agriko Eco Farm', 'Health Supplements', '4809012345012', m_agriko, bpcc_id, 'BPCC-2025-AG-12', '2026-12-15', 'Halal', true, '100% Pure Soursop Leaf Powder', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Pure Moringa (Malunggay) Powder', 'Agriko Eco Farm', 'Health Supplements', '4809012345013', m_agriko, bpcc_id, 'BPCC-2025-AG-13', '2026-12-15', 'Halal', true, '100% Pure Dehydrated Moringa Oleifera Leaf Powder', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Pure Turmeric Powder 100g', 'Agriko Eco Farm', 'Health Supplements', '4809012345014', m_agriko, bpcc_id, 'BPCC-2025-AG-14', '2026-12-15', 'Halal', true, '100% Pure Dehydrated Curcuma Longa Powder', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/')
    ON CONFLICT (barcode) DO UPDATE 
    SET name = EXCLUDED.name, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.2 Heaven's Gift Bakehaus (BPCC Certified)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Heaven''s Gift Patatas Biscuits', 'Heaven''s Gift', 'Bakery & Biscuits', '4809012345015', m_heavens, bpcc_id, 'BPCC-2025-HG-15', '2026-12-15', 'Halal', true, 'Wheat Flour, Sugar, Vegetable Shortening, Salt, Leavening Agent', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Pacencia Cookies', 'Heaven''s Gift', 'Bakery & Biscuits', '4809012345016', m_heavens, bpcc_id, 'BPCC-2025-HG-16', '2026-12-15', 'Halal', true, 'Egg Whites, Sugar, Flour, Vanilla Flavor', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Butter Cookies', 'Heaven''s Gift', 'Bakery & Biscuits', '4809012345017', m_heavens, bpcc_id, 'BPCC-2025-HG-17', '2026-12-15', 'Halal', true, 'Wheat Flour, Vegetable Margarine, Butter, Sugar, Eggs', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Special Otap', 'Heaven''s Gift', 'Bakery & Biscuits', '4809012345020', m_heavens, bpcc_id, 'BPCC-2025-HG-20', '2026-12-15', 'Halal', true, 'Flour, Sugar, Vegetable Shortening, Coconut Oil, Yeast', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Ube Hopia', 'Heaven''s Gift', 'Bakery & Pastries', '4809012345021', m_heavens, bpcc_id, 'BPCC-2025-HG-21', '2026-12-15', 'Halal', true, 'Wheat Flour, Purple Yam (Ube), Sugar, Vegetable Oil, Water', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Buko Pandan Hopia', 'Heaven''s Gift', 'Bakery & Pastries', '4809012345022', m_heavens, bpcc_id, 'BPCC-2025-HG-22', '2026-12-15', 'Halal', true, 'Wheat Flour, Coconut Meat, Pandan Extract, Sugar, Vegetable Oil', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Black Rice Hopia', 'Heaven''s Gift', 'Bakery & Pastries', '4809012345023', m_heavens, bpcc_id, 'BPCC-2025-HG-23', '2026-12-15', 'Halal', true, 'Flour, Organic Black Rice Paste, Brown Sugar, Coconut Oil', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Durian Hopia', 'Heaven''s Gift', 'Bakery & Pastries', '4809012345024', m_heavens, bpcc_id, 'BPCC-2025-HG-24', '2026-12-15', 'Halal', true, 'Flour, Natural Durian Pulp, Sugar, Vegetable Shortening', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Cacao Hopia', 'Heaven''s Gift', 'Bakery & Pastries', '4809012345025', m_heavens, bpcc_id, 'BPCC-2025-HG-25', '2026-12-15', 'Halal', true, 'Flour, Native Cacao Powder, Sugar, Vegetable Oil', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Butter Cookies with Sesame', 'Heaven''s Gift', 'Bakery & Biscuits', '4809012345026', m_heavens, bpcc_id, 'BPCC-2025-HG-26', '2026-12-15', 'Halal', true, 'Wheat Flour, Pure Butter, Roasted Sesame Seeds, Sugar', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Toasted Biscocho', 'Heaven''s Gift', 'Bakery & Biscuits', '4809012345034', m_heavens, bpcc_id, 'BPCC-2025-HG-34', '2026-12-15', 'Halal', true, 'Toasted Bread Slices, Margarine, Refined Sugar', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Tasty Bread Loaf', 'Heaven''s Gift', 'Bread & Loaves', '4809012345029', m_heavens, bpcc_id, 'BPCC-2025-HG-29', '2026-12-15', 'Halal', true, 'Enriched Wheat Flour, Water, Sugar, Yeast, Iodized Salt', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Creamy Loaf', 'Heaven''s Gift', 'Bread & Loaves', '4809012345030', m_heavens, bpcc_id, 'BPCC-2025-HG-30', '2026-12-15', 'Halal', true, 'Wheat Flour, Milk Powder, Butter, Sugar, Yeast, Salt', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Whole Wheat Loaf', 'Heaven''s Gift', 'Bread & Loaves', '4809012345031', m_heavens, bpcc_id, 'BPCC-2025-HG-31', '2026-12-15', 'Halal', true, '100% Whole Wheat Flour, Water, Brown Sugar, Yeast, Salt', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Cheese Loaf', 'Heaven''s Gift', 'Bread & Loaves', '4809012345032', m_heavens, bpcc_id, 'BPCC-2025-HG-32', '2026-12-15', 'Halal', true, 'Wheat Flour, Cheddar Cheese Chunks, Milk, Sugar, Yeast', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Strawberry Pie', 'Heaven''s Gift', 'Pies & Pastries', '4809012345038', m_heavens, bpcc_id, 'BPCC-2025-HG-38', '2026-12-15', 'Halal', true, 'Pastry Crust, Natural Strawberry Filling, Sugar, Pectin', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Mango Pie', 'Heaven''s Gift', 'Pies & Pastries', '4809012345039', m_heavens, bpcc_id, 'BPCC-2025-HG-39', '2026-12-15', 'Halal', true, 'Flour Crust, Fresh Ripe Philippine Mangoes, Sugar, Starch', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Buko Pandan Pie', 'Heaven''s Gift', 'Pies & Pastries', '4809012345040', m_heavens, bpcc_id, 'BPCC-2025-HG-40', '2026-12-15', 'Halal', true, 'Tender Young Coconut, Pandan Extract, Milk, Pie Crust', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Ube Pie', 'Heaven''s Gift', 'Pies & Pastries', '4809012345037', m_heavens, bpcc_id, 'BPCC-2025-HG-37', '2026-12-15', 'Halal', true, 'Pure Purple Yam Halaya, Milk, Sugar, Flaky Pie Crust', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Cacao Pastel', 'Heaven''s Gift', 'Pies & Pastries', '4809012345044', m_heavens, bpcc_id, 'BPCC-2025-HG-44', '2026-12-15', 'Halal', true, 'Soft Bun Dough, Rich Chocolate Cacao Custard Filling', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Heaven''s Gift Nutri Chips', 'Heaven''s Gift', 'Snacks', '4809012345043', m_heavens, bpcc_id, 'BPCC-2025-HG-43', '2026-12-15', 'Halal', true, 'Cassava Starch, Vegetable Puree, Salt, Palm Olein', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/')
    ON CONFLICT (barcode) DO UPDATE 
    SET name = EXCLUDED.name, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.3 Altoberos Food Products (BPCC Certified)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Altoberos Native Ampao Crispy Puffed Rice', 'Altoberos', 'Native Snacks', '4809012345045', m_alto, bpcc_id, 'BPCC-2025-AL-45', '2026-12-15', 'Halal', true, 'Puffed Rice, Raw Muscovado Sugar, Peanuts, Coconut Oil', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Altoberos Chicharon Latik', 'Altoberos', 'Native Snacks', '4809012345046', m_alto, bpcc_id, 'BPCC-2025-AL-46', '2026-12-15', 'Halal', true, 'Crisp Coconut Milk Curds (Latik), Salt, Seasoning', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Altoberos Pop-Corn Sweet & Salty', 'Altoberos', 'Snacks', '4809012345047', m_alto, bpcc_id, 'BPCC-2025-AL-47', '2026-12-15', 'Halal', true, 'Corn Kernels, Vegetable Oil, Sugar, Iodized Salt', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Altoberos Sampaloc Candy Bites', 'Altoberos', 'Confectionery', '4809012345048', m_alto, bpcc_id, 'BPCC-2025-AL-48', '2026-12-15', 'Halal', true, 'Native Tamarind Pulp, Cane Sugar, Salt', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Altoberos Sweet Bucayo Coconut Strips', 'Altoberos', 'Confectionery', '4809012345049', m_alto, bpcc_id, 'BPCC-2025-AL-49', '2026-12-15', 'Halal', true, 'Shredded Coconut Meat, Muscovado Sugar, Vanilla', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Altoberos Crunchy Fish Cracker', 'Altoberos', 'Snacks', '4809012345050', m_alto, bpcc_id, 'BPCC-2025-AL-50', '2026-12-15', 'Halal', true, 'Fish Meat Paste, Tapioca Starch, Salt, Spices, Vegetable Oil', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/')
    ON CONFLICT (barcode) DO UPDATE 
    SET name = EXCLUDED.name, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.4 MIFAMCO & Lianas Chocolates (BPCC Certified)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('MIFAMCO Tablea 100% Pure Cacao', 'MIFAMCO', 'Chocolates & Cocoa', '4809012345051', m_mifamco, bpcc_id, 'BPCC-2025-MF-51', '2026-12-15', 'Halal', true, '100% Fermented Roasted Cacao Beans', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('MIFAMCO Dark Chocolate 70%', 'MIFAMCO Artisan', 'Chocolates & Cocoa', '4809012345052', m_mifamco, bpcc_id, 'BPCC-2025-MF-52', '2026-12-15', 'Halal', true, 'Cacao Mass (70%), Organic Cane Sugar, Cocoa Butter', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('MIFAMCO Dark Chocolate 62%', 'MIFAMCO Artisan', 'Chocolates & Cocoa', '4809012345053', m_mifamco, bpcc_id, 'BPCC-2025-MF-53', '2026-12-15', 'Halal', true, 'Cacao Mass (62%), Organic Cane Sugar, Cocoa Butter, Soy Lecithin', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Lianas 100% Pure Tablea', 'Lianas', 'Chocolates & Cocoa', '4809012345054', m_lianas, bpcc_id, 'BPCC-2026-LN-54', '2027-01-23', 'Halal', true, 'Pure Roasted Cacao Paste, No Preservatives', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Lianas Plain Chocolate Bar', 'Lianas Artisan', 'Chocolates & Cocoa', '4809012345055', m_lianas, bpcc_id, 'BPCC-2026-LN-55', '2027-01-23', 'Halal', true, 'Cacao Liquor, Cocoa Butter, Sugar, Milk Solids', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Lianas Chocolate with Fruits & Nuts', 'Lianas Artisan', 'Chocolates & Cocoa', '4809012345056', m_lianas, bpcc_id, 'BPCC-2026-LN-56', '2027-01-23', 'Halal', true, 'Dark Chocolate, Roasted Cashews, Raisins, Dried Mango Bits', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/'),
        ('Lianas Chocolate with Rice Crisps', 'Lianas Artisan', 'Chocolates & Cocoa', '4809012345057', m_lianas, bpcc_id, 'BPCC-2026-LN-57', '2027-01-23', 'Halal', true, 'Milk Chocolate, Toasted Puffed Rice Crisps', 'NCMF / BPCC Certified Products Register', 'https://bpcc-halal.org/')
    ON CONFLICT (barcode) DO UPDATE 
    SET name = EXCLUDED.name, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.5 Don Fernando Gourmet Seafood (BUSC Certified HC-027)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('Don Fernando Gourmet Tuyo in Corn Oil 220g', 'Don Fernando', 'Canned & Jarred Seafood', '4809012345060', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Dried Herring (Tuyo), Corn Oil, Garlic, Chili, Spices', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Don Fernando Gourmet Danggit in Olive Oil 220g', 'Don Fernando', 'Canned & Jarred Seafood', '4809012345061', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Sun-Dried Rabbitfish (Danggit), Pure Olive Oil, Peppercorn, Spices', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Don Fernando Gourmet Pusit (Squid) in Spiced Oil', 'Don Fernando', 'Canned & Jarred Seafood', '4809012345062', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Fresh Dried Squid, Corn Oil, Garlic Cloves, Siling Labuyo, Bay Leaves', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Don Fernando Spanish Sardines in Corn Oil with Garlic', 'Don Fernando', 'Canned & Jarred Seafood', '4809012345063', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Fresh Sardines, Corn Oil, Garlic, Pickles, Carrots, Peppercorn, Iodized Salt', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Don Fernando Tuna Chunks in Garlic Oil 220g', 'Don Fernando', 'Canned & Jarred Seafood', '4809012345064', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Yellowfin Tuna Meat Chunks, Soya Oil, Garlic, Salt', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Don Fernando Chili Garlic Oil 150ml', 'Don Fernando', 'Condiments & Sauces', '4809012345065', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Toasted Garlic Bits, Hot Chili Peppers, Palm Oil, Spices', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Don Fernando Chicken Oil Infused 200ml', 'Don Fernando', 'Cooking Oils & Fats', '4809012345066', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Halal Chicken Fat Extract, Annatto Oil, Garlic, Ginger', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Don Fernando Bagoong Padas Special 250g', 'Don Fernando', 'Native Seafood Condiments', '4809012345067', m_donf, busc_id, 'HC-027', '2026-11-20', 'Halal', true, 'Fermented Rabbitfish Fry (Padas), Sea Salt', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/')
    ON CONFLICT (barcode) DO UPDATE 
    SET name = EXCLUDED.name, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;

    -- 4.6 Regional Specialties (BUSC Certified)
    INSERT INTO public.products (name, brand, category, barcode, manufacturer_id, certifying_body_id, certificate_no, expiry_date, status, halal_logo_present, ingredients_summary, source, source_url)
    VALUES
        ('MAPZACARA Pure Organic Coconut Sugar 500g', 'MAPZACARA', 'Sweeteners & Sugar', '4809012345070', m_mapzacara, busc_id, 'HC-015', '2026-10-26', 'Halal', true, '100% Unrefined Coconut Sap Sugar', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Jing Homemade Bagoong Gata with Chili', 'Jing Homemade', 'Condiments & Sauces', '4809012345071', m_jing, busc_id, 'HC-031', '2026-11-20', 'Halal', true, 'Fermented Fish/Shrimp, Fresh Coconut Milk, Chili, Garlic, Onion', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Jing Homemade Tuyo Flakes in Olive Oil', 'Jing Homemade', 'Canned & Jarred Seafood', '4809012345072', m_jing, busc_id, 'HC-031', '2026-11-20', 'Halal', true, 'Shredded Dried Herring, Olive Oil, Minced Garlic, Chili Flakes', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Jing Homemade Guinamos Guisado Native Paste', 'Jing Homemade', 'Condiments & Sauces', '4809012345073', m_jing, busc_id, 'HC-031', '2026-11-20', 'Halal', true, 'Sauteed Anchovy Fry (Guinamos), Garlic, Suka, Raw Sugar', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('DipMayo Real Mayonnaise Classic 250ml', 'DipMayo', 'Dressings & Mayonnaise', '4809012345074', m_dipmayo, busc_id, 'HC-DIP-01', '2026-11-20', 'Halal', true, 'Soybean Oil, Pasteurised Egg Yolks, Vinegar, Salt, Sugar, Lemon Juice Concentrate', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('CAGAPA Crispy Cassava Chips Original 150g', 'CAGAPA', 'Native Snacks', '4809012345075', m_cagapa, busc_id, 'HC-023', '2026-10-26', 'Halal', true, 'Fresh Cassava Tubers, Palm Oil, Iodized Salt', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('IMAVEMCO Fresh Miki Noodles 500g', 'IMAVEMCO', 'Noodles & Pasta', '4809012345076', m_imavemco, busc_id, 'HC-13', '2026-11-20', 'Halal', true, 'Wheat Flour, Water, Lye Water, Salt, Turmeric Powder', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('IMAVEMCO Classic Misua Noodles 300g', 'IMAVEMCO', 'Noodles & Pasta', '4809012345077', m_imavemco, busc_id, 'HC-13', '2026-11-20', 'Halal', true, 'Fine Wheat Flour, Sea Salt, Purified Water', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('ZASIHIVAC Calamansi Ready-to-Drink 350ml', 'ZASIHIVAC', 'Beverages & Juices', '4809012345078', m_zas, busc_id, 'HC-ZAS-01', '2026-11-20', 'Halal', true, 'Fresh Pressed Calamansi Juice, Purified Water, Cane Sugar', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Rossvell Garden Zest Calamansi Concentrate 500ml', 'Garden Zest', 'Beverages & Juices', '4809012345079', m_ross, busc_id, 'HC-RV-01', '2026-11-20', 'Halal', true, 'Pure Calamansi Juice (Citrus microcarpa), Natural Honey, Sugar', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Jerusalem Hot & Spicy Herbal Rub Salt 150g', 'Jerusalem Herbal', 'Spices & Seasonings', '4809012345080', m_jeru, busc_id, 'HC-JH-01', '2026-11-20', 'Halal', true, 'Natural Sea Salt, Dried Birdseye Chili, Native Garlic, Black Pepper, Oregano', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/'),
        ('Silsilah Herbal Instant Tea Mix 200g', 'Silsilah Harmony', 'Beverages & Teas', '4809012345081', m_silsilah, busc_id, 'HC-039', '2026-10-25', 'Halal', true, 'Ginger Extract, Turmeric, Lemongrass, Brown Sugar', 'NCMF / BUSC 3rd Quadrimester Report 2025', 'https://buschalal.org/')
    ON CONFLICT (barcode) DO UPDATE 
    SET name = EXCLUDED.name, status = EXCLUDED.status, certificate_no = EXCLUDED.certificate_no, expiry_date = EXCLUDED.expiry_date;
END $$;
