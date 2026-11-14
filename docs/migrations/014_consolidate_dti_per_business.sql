-- =============================================================================
-- Migration 014: Consolidate DTI Region IX ZAMPEN Catalogue to 1 Card per Business
-- Replaces the 60 photo/flavor-split DTI ZAMPEN rows with exactly 27 rows
-- (one per listed enterprise across Pages 3-28 of the DTI Region IX Halal in
-- ZAMPEN Product Catalogue 2026 PDF, including splitting Page 16 into FML
-- Agriventures Corporation and FML Safeeats Corporation).
--
-- Removes unprinted details not stated in the PDF (gram weights, guessed
-- flavor variants, unverified certifiers/certificate numbers/expiry dates,
-- and guessed ingredient lists) and retains only PDF-verified fields:
--   - Business Name (products.name & manufacturers.name)
--   - Verbatim Product Lines (products.admin_notes as [Product Lines: ...])
--   - Verbatim Contact Name, Company Address, Contact Number, Email Address
--   - Showcase Photo from each PDF page (submissions/dti-catalogue/*)
-- =============================================================================

BEGIN;

-- 1. Remove previous expanded/consolidated DTI ZAMPEN product rows
DELETE FROM public.products
WHERE source ILIKE '%ZAMPEN%';

-- 2. Remove legacy duplicate DTI manufacturer aliases that have no remaining products
DELETE FROM public.manufacturers m
WHERE (
    m.source ILIKE '%ZAMPEN%'
    OR m.name IN (
        'AKAO Farms',
        'DipMayo Food Products',
        'Silsilah Foundation, Inc.',
        'ZASIHIVAC'
    )
)
AND NOT EXISTS (
    SELECT 1 FROM public.products p WHERE p.manufacturer_id = m.id
);

-- 3. Upsert exact 27 DTI Region IX ZAMPEN businesses & insert 1 product card each
WITH business_data (
    biz_name,
    contact_person,
    address,
    contact_phone,
    contact_email,
    category,
    product_lines,
    image_file
) AS (
    VALUES
    ('Malandi Patalon Zamboanga City Agrarian Reform Association MPC (MAPZACARA)', 'Habil M. Tiblani', 'MAPZACARA Purok 1 Malandi Patalon, Zamboanga City', '(+63) 965 336 3898', 'tiblanihabil@gmail.com', 'Food & Beverage', 'Coco Sugar', 'dti-mapzacara.webp'),
    ('AntiEns Food Products', 'Nurshiba Amil', '158C Kasalamatan Drive Brgy. Kasanyangan, Zamboanga City', '(+63) 977 254 4745', 'shibangamil@gmail.com', 'Food & Beverage', 'Muslim delicacies and Spiced vinegar', 'dti-antiens.webp'),
    ('2K Peanuts', 'Teresita Kabayaw', 'Los Primos Drive, Tugbungan, Zamboanga City', '(+63) 935 315 1069', 'teresitakabayao@yahoo.com', 'Snacks & Chips', 'Peanuts', 'dti-2k-peanuts.webp'),
    ('Auntie Nitz Bakeshop', 'Eunice Lao', 'Bangayan Bldg., Veterans Ave. Zamboanga City', '(+63) 9164203545', 'eunicelao012316@gmail.com', 'Bakery & Biscuits', 'Breads and Cakes', 'dti-auntie-nitz.webp'),
    ('MCH Carmela The Food Shop', 'Melvin P. Mari', 'Estrada Street, Tetuan, Zamboanga City', '0917-727-0461', 'mchcarmelathefoodshop@gmail.com', 'Bakery & Biscuits', 'Pastries', 'dti-mch-carmela.webp'),
    ('RURU Mushrooms', 'Rubylyzle Alrayes', 'F. Locson Dr., Lumiyap Rd., Divisoria, Zamboanga City', '(+63) 995 620 9472 / (+63) 945 344 3470', 'rurumushrooms@gmail.com', 'Snacks & Chips', 'Mushroom Chips, Fresh and Dried Oyster Mushrooms, and Premium Powdered Mushrooms', 'dti-ruru-mushrooms.webp'),
    ('Oasis Livelihood and Training Center', 'Oasis Livelihood and Training Center', 'Pitogo, Sinunuc, Zamboanga City', '(+63) 935 535 4511', 'silsilahdialogue@gmail.com', 'Beverages', 'Herbal Tea Products', 'dti-oasis-holisticare.webp'),
    ('OLA Food Products', 'Omar Paradji', 'Maasin, Zamboanga City', '(+63) 9978750522', 'olafoodproducts@gmail.com', 'Spices & Seasonings', 'Spices and condiments', 'dti-ola-food.webp'),
    ('Jing Homemade Products', 'Jocelyn A. Rizada', 'Sunset view, Purok 2, Cabatangan, Zamboanga City, Philippines, 7000', '0975 127 2448', 'jinghproducts@gmail.com', 'Condiments & Sauces', 'Bagon Gata', 'dti-jing-bagoong.webp'),
    ('Laguerta Food Products', 'Ardie Quiamjot', 'New Tambo, Katipunan, Zamboanga del Norte', '0945 980 6209', 'ardiequiamjot@yahoo.com.ph', 'Beverages', 'Laguerta calamansi concentrate, calamansi juice, coconut vinegar', 'dti-laguerta.webp'),
    ('Dipolog School of Fisheries', 'Jemimah D. Gumalal', 'Olingan, Dipolog City, Philippines, 7100', '(065) 212 7248', 'dsf_zn@yahoo.com', 'Canned Fish & Meat', 'Bottled Sardines', 'dti-dsf-tesda.webp'),
    ('Sar-Den''s Food Products', 'Niña Gonzales-Bustamante', 'Larayan, Dapitan City, ZDN', '0946 075 2284', 'sardensfoodproducts@yahoo.com', 'Canned Fish & Meat', 'Desa Bottled Sardines, Bottled Milkfish, Gourmet Tuyo, and Dayok', 'dti-desa.webp'),
    ('Cassava Growers and Processors Association, Inc. (CAGAPA)', 'Evelyn Empeynado', 'Aseniero, Dapitan City, ZDN', '0907 162 0943', 'evelynempeynado_40@yahoo.com', 'Snacks & Chips', 'CAGAPA Cassava Chips (Original Flavor, Barbeque, Spicy Barbecue, Cheese, Sour Cream)', 'dti-cagapa.webp'),
    ('FML Agriventures Corporation', 'Marc Anthony Mawile', 'Dipolog City, ZDN, Philippines, 7106', '0995 533 1102 & 0981 132 4909', 'freshharvestfarm2005@gmail.com', 'Fresh & Farm Produce', 'Fresh Eggs', 'dti-fml-agriventures.webp'),
    ('FML Safeeats Corporation', 'Marc Anthony Mawile', 'Dipolog City, ZDN, Philippines, 7106', '0995 533 1102 & 0981 132 4909', 'fmlsafeeatscorp@gmail.com', 'Dressings & Mayonnaise', 'Mayonnaise', 'dti-dipmayo.webp'),
    ('Agriko Multi-Trade & Enterprise Corp', 'Jan Christies D. Paglinawan', 'Purok 6, Libertad, Dumingag, Zamboanga del Sur', '09669968578', 'jc.paglinawan@agrikoph.com', 'Food & Beverage', 'Herbal Teas & Organic Rice', 'dti-agriko.webp'),
    ('Altoberos Food Products', 'Lorna P. Altoberos', 'Duterte St., Gatas District, Pagadian City', '(+63) 998 127 7438', NULL, 'Snacks & Chips', 'Ampao Balls, Chicharon Latik, Sampaloc, and Bucayo', 'dti-altoberos.webp'),
    ('Heaven''s Gift Bakehaus', 'Teodorico A. Egento', 'ABCEDE Compound, Purok Makugihon, Blancia, Molave, Zamboanga del Sur', '(+63) 998 860 5741', 'ricoegento@yahoo.com', 'Bakery & Biscuits', 'Heaven''s Gift Hopia, Patatas, Piaya, Butter Cookies, Pacencia Cookies, Cheese Stick, Stickbread, and Egg Cracklets', 'dti-heavens-gift.webp'),
    ('Liana''s Food Products Manufacturing', 'Leah F. Yu', 'Aqua Niña, Morgan St., Maloloy-on, Molave, ZDS', '(+63) 920 988 0910', 'leahfyu@yahoo.com', 'Food & Beverage', 'Liana''s Tablea, and Chocolate', 'dti-lianas.webp'),
    ('Midsalip Farmers Multi-Purpose Cooperative (MIFAMCO)', 'Florencia Celada', 'Purok 1, Poblacion B, Midsalip, Zamboanga del Sur', '(+63) 999 991 8928', 'mifamco_92@yahoo.com', 'Food & Beverage', 'Tablea and Dark Chocolate Food Manufacturing', 'dti-mifamco.webp'),
    ('A5 Food Products', 'Maribel A. Azuga', 'Prk. Roxas, Binondo Street, Imelda, Zamboanga Sibugay', '0926-284-1678', 'maribelazuga777@gmail.com', 'Beverages', 'Calamansi Juice (Ready to Drink) and Calamansi Concentrate', 'dti-a5-healthymansi.webp'),
    ('Rossvell Enterprises', 'Maryvel T. Napigkit', 'Santa Cruz, Kabasalan, ZSP', '0917-719-1562', 'maryvel_napigkit@yahoo.com', 'Beverages', 'Calamansi Puree and Calamansi Juice Ready to Drink', 'dti-rossvell-gardenzest.webp'),
    ('K Three Food Products', 'Rosemarie C. Pepito', 'Batu, Siay, Zamboanga Sibugay', '0927-932-6442', 'rosemariepepito777@gmail.com', 'Beverages', 'Calamansi Juice (Ready to Drink) and Calamansi concentrate', 'dti-kthree-coolers.webp'),
    ('Picker''s Calamansi Food Products', 'Carlito A. Carino Jr.', 'Salinding, Siay, Zamboanga Sibugay', '0917-825-2692', 'pickers.calamansi@gmail.com', 'Beverages', 'Calamansi juice (Ready to Drink) and Calamansi concentrate', 'dti-pickers.webp'),
    ('Zamboanga Sibugay High Value Crops Marketing Cooperative', 'Mirza M. Rivas', 'Poblacion, Siay, Zamboanga Sibugay', '0997-425-0720', 'mirzarivas12@gmail.com', 'Beverages', 'Calamansi juice (Ready to Drink) and Calamansi concentrate', 'dti-pomona.webp'),
    ('Ipil Market Vendors Marketing Cooperative (IMAVEMCO)', 'Caren Joy P. Duran', 'Don Andres, Ipil, Zamboanga Sibugay', '0949-990-1379', 'imavemco1995@yahoo.com', 'Instant Noodles & Pasta', 'Dried Noodles', 'dti-imavemco.webp'),
    ('Jerusalem Herbal Products Manufacturing', 'Maria Teresa T. Jumalon', 'Prk. Golden Shower, San Antonio, Titay, Zamboanga Sibugay', '0935-329-0607', 'ttacay@ymail.com', 'Spices & Seasonings', 'Sea Salt with Herbs and Spices', 'dti-cymon.webp')
),
upserted_mfrs AS (
    INSERT INTO public.manufacturers (
        name, country, address, contact_email, contact_phone, contact_person, source, source_url, synced_at
    )
    SELECT
        biz_name,
        'Philippines',
        address,
        contact_email,
        contact_phone,
        contact_person,
        'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
        'https://r09.dti.gov.ph/',
        now()
    FROM business_data
    ON CONFLICT (name) DO UPDATE SET
        address = EXCLUDED.address,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        contact_person = EXCLUDED.contact_person,
        source = EXCLUDED.source,
        source_url = EXCLUDED.source_url,
        synced_at = now(),
        updated_at = now()
    RETURNING id, name
)
INSERT INTO public.products (
    name,
    brand,
    category,
    barcode,
    manufacturer_id,
    certifying_body_id,
    certificate_no,
    expiry_date,
    status,
    halal_logo_present,
    ingredients_summary,
    admin_notes,
    source,
    source_url,
    image_url,
    synced_at
)
SELECT
    bd.biz_name,
    NULL,
    bd.category,
    NULL,
    um.id,
    NULL,
    NULL,
    NULL,
    'Halal',
    true,
    NULL,
    '[Product Lines: ' || bd.product_lines || ']',
    'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026',
    'https://r09.dti.gov.ph/',
    '/product_images/' || bd.image_file,
    now()
FROM business_data bd
JOIN upserted_mfrs um ON um.name = bd.biz_name;

COMMIT;
