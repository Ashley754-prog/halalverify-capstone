-- Migration 018: Clean Sync of NCMF Region IX (BUSC & BPCC), UCZP 2026, and Muslim-Owned Zamboanga Registry
-- Applies grounded primary-document updates across products, establishments, manufacturers, and certifying_bodies.

-- 1. Expand establishments_halal_status_check cleanly to include 'for_renewal'
ALTER TABLE public.establishments DROP CONSTRAINT IF EXISTS establishments_halal_status_check;
ALTER TABLE public.establishments
    ADD CONSTRAINT establishments_halal_status_check CHECK (
        lower(halal_status) = ANY (
            ARRAY[
                'verified'::text,
                'for_renewal'::text,
                'needs_review'::text,
                'expired'::text,
                'flagged'::text,
                'suspended'::text,
                'pending_verification'::text,
                'pending_review'::text,
                'rejected'::text,
                'relocated'::text,
                'permanently_closed'::text,
                'demolished'::text,
                'closed'::text
            ]
        )
    );

-- 2. Remove uncertified menu dish placeholders and junk test submissions from public.products
DELETE FROM public.products
WHERE source = 'Zamboanga Local Halal Directory'
   OR id IN (
       '440cb0f8-2658-44e2-b863-7fd7be279656', -- luckyy
       '9c625c82-f35a-4c08-8ed9-9c897cf4df21', -- KangKong Chips (unbranded placeholder)
       '29338b23-91d1-4ebc-bda4-f03b19765717', -- Beef Satti (prepared eatery dish)
       '98107d86-7e64-4e01-9be6-c6a7bbea11c6', -- Beef Satti REJECTED duplicate
       '10b30a18-92f5-4151-afe9-87633df5eb2c', -- College of Computing Studies test submission
       '85edcab3-cbb4-43c7-ac62-534727ca8a38'  -- hotdog REJECTED test submission
   );

-- 3. Polish public.certifying_bodies metadata (NCMF SEC Reg, official validity cycles, remove dead UCZP icon URL)
UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-HCB-AHIP',
    validity_period = 'NCMF Accredited (Active)',
    accreditation_details = 'Accredited by National Commission on Muslim Filipinos (NCMF).'
WHERE code = 'AHIP';

UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-HCB-BPCC-R9',
    validity_period = '1-Year Certificate Cycle (2025-2027 Active)',
    accreditation_details = 'Accredited by National Commission on Muslim Filipinos (NCMF) for Zamboanga del Sur & Region IX MSMEs.'
WHERE code = 'BPCC';

UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-SEC-GN095-0145',
    validity_period = '1-2 Year Certificate Cycle (Quadrimester Audit)',
    accreditation_details = 'Accredited by NCMF (SEC Reg. No. GN095-0145) — Isabela City, Basilan & Zamboanga Peninsula.'
WHERE code = 'BUSC';

UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-HCB-FIQHI',
    validity_period = 'NCMF Accredited (Active)'
WHERE code = 'FIQHI';

UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-HCB-MASLAHA',
    validity_period = 'NCMF Accredited (Active)'
WHERE code = 'MASLAHA';

UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-HCB-PHILCOSED',
    validity_period = 'NCMF Accredited (Active)'
WHERE code = 'Philcosed';

UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-HCB-PRIME',
    validity_period = 'NCMF Accredited (Active)'
WHERE code = 'PRIME';

UPDATE public.certifying_bodies
SET
    registry_reference = 'NCMF-HCB-PUCOI',
    validity_period = 'NCMF Accredited (Active)'
WHERE code = 'PUCOI';

UPDATE public.certifying_bodies
SET
    seal_url = NULL,
    registry_reference = 'ZC-HCB-ORD489-001',
    validity_period = '1-2 Year Local Renewal (Ord. No. 489)',
    accreditation_details = 'Local Zamboanga Peninsula Ulama Halal Council operating under Zamboanga City Ordinance No. 489 (distinct from NCMF 12-body list).'
WHERE code = 'UCZP';

-- 4. Link and enrich the existing 27 DTI Region IX / ZAMPEN products with verified BPCC / BUSC NCMF records
-- 4A. BPCC Certified (5 businesses, 57 SKUs; BPCC list prints no certificate numbers so certificate_no remains NULL)
UPDATE public.products
SET
    certifying_body_id = '1656c3e6-250c-4b70-81c0-3c084eb7ce80',
    certificate_no = NULL,
    expiry_date = '2026-12-15',
    status = 'Halal',
    admin_notes = '[Product Lines: Herbal Teas, Organic Rice & Plant Powders (14 BPCC SKUs)] [Variants: 5N1 Turmeric Tea Powder Blend | Turmeric Tea Powder Blend | Ginger Tea Powder Blend | Roasted Black Rice with 5N1 Turmeric Tea Blend | Cacao with 5N1 Turmeric Tea Powder Blend | Organic Black Rice | Organic Brown Rice | Organic Red Rice | Organic White Rice | Pure 5N1 Powder | Pure Ginger Powder | Pure Guyabano Powder | Pure Moringa Powder | Pure Turmeric Powder]',
    updated_at = NOW()
WHERE id = 'c4f41cc1-9530-4fdc-b84b-11b6311ba4b7'; -- Agriko Multi-Trade & Enterprise Corp

UPDATE public.products
SET
    certifying_body_id = '1656c3e6-250c-4b70-81c0-3c084eb7ce80',
    certificate_no = NULL,
    expiry_date = '2026-12-15',
    status = 'Halal',
    admin_notes = '[Product Lines: Bakery Products, Cookies, Loaves & Native Pastries (30 BPCC SKUs)] [Variants: Patatas | Pacencia | Butter Cookies | Piaya | Patatas de Otap | Special Otap | Ube Hopia | Buko Pandan Hopia | Black Rice Hopia | Durian Hopia | Cacao Hopia | Butter Cookies with Sesame | Cracker | Chocochips | Tasty Bread | Creamy Loaf | Wheat Loaf | Cheese Loaf | Cacao Loaf | Biscocho | Toasted | Stickbread | Ube Pie | Strawberry Pie | Mango Pie | Buko Pandan Pie | Sopas | Lintoy | Nutri Chips | Cacao Pastel]',
    updated_at = NOW()
WHERE id = 'fb9ee07b-13f1-4558-8f6a-2f08af980304'; -- Heaven's Gift Bakehaus

UPDATE public.products
SET
    certifying_body_id = '1656c3e6-250c-4b70-81c0-3c084eb7ce80',
    certificate_no = NULL,
    expiry_date = '2026-12-15',
    status = 'Halal',
    admin_notes = '[Product Lines: Native Snacks & Fish Crackers (6 BPCC SKUs)] [Variants: Ampao | Chicharon Latik | Pop-Corn | Sampaloc | Bucayo | Fish Cracker]',
    updated_at = NOW()
WHERE id = 'e10445f1-96de-4393-a15c-ecfc9d7ec7c3'; -- Altoberos Food Products

UPDATE public.products
SET
    certifying_body_id = '1656c3e6-250c-4b70-81c0-3c084eb7ce80',
    certificate_no = NULL,
    expiry_date = '2026-12-15',
    status = 'Halal',
    admin_notes = '[Product Lines: Tablea & Dark Chocolate Manufacturing (3 BPCC SKUs)] [Variants: Tablea 100% Pure Cacao | Dark Chocolate 70% | Dark Chocolate 62%]',
    updated_at = NOW()
WHERE id = 'f756d64e-8115-43fb-ba85-0a29d48e0917'; -- MIFAMCO

UPDATE public.products
SET
    certifying_body_id = '1656c3e6-250c-4b70-81c0-3c084eb7ce80',
    certificate_no = NULL,
    expiry_date = '2027-01-23',
    status = 'Halal',
    admin_notes = '[Product Lines: Artisanal Tablea & Chocolates (4 BPCC SKUs; listed under Llanas Food Products on BPCC sheet)] [Variants: Llanas 100% Tablea | Llanas Plain Chocolate | Llanas Chocolate with Fruits & Nuts | Llanas Chocolate with Rice Crisps]',
    updated_at = NOW()
WHERE id = '6f2e80f8-56de-423b-87fd-bcb9f65e4c02'; -- Liana's Food Products Manufacturing

-- 4B. BUSC Certified DTI businesses (21 businesses; keep genuine HC-xxx numbers and exact validity dates)
UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-029',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Snacks & Nut-Based Roasted Peanuts (BUSC HC-029)] [Variants: Salted Brown Peanuts | Spicy Garlic Brown Peanuts | Spicy Garlic Skinless Peanuts]',
    updated_at = NOW()
WHERE id = '8d9e7864-a64a-405e-a75b-51d93800d784'; -- 2K Peanuts

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-21',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Calamansi Juice (Ready to Drink) and Calamansi Concentrate (BUSC HC-21; validity ended Oct 26, 2026)]',
    updated_at = NOW()
WHERE id = 'ed6d38c8-68a1-4d37-82c9-1ebc17d44809'; -- A5 Food Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-001',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Tausug Delicacies, Spiced Sauces & Condiments (BUSC HC-001; validity ended Oct 26, 2026)] [Variants: Lara-lara | Batang Buruk | Hantak | Ariaralam | Jintan | Baulo | Jaa | Pastil2x | Kuih Kacang | Tyula Itum Mix | Sambal | Chilli Garlic Oil | Pamapa Itum | Bubuk]',
    updated_at = NOW()
WHERE id = '1df93ea5-2408-42c8-a155-61c867f25c5b'; -- AntiEns Food Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-05',
    expiry_date = '2027-10-26',
    status = 'Halal',
    admin_notes = '[Product Lines: Artisan Breads, Cakes, Cookies & Pastries (BUSC HC-05)] [Variants: Cream Bread | Wheat Bread | Yahmih Bread | Carrot Bread | Pandesal | Cheese Loaf Bread | Raisin Bread | Heirloom Ensaimada | Toasted Almond Ensaimada | Classic Cinnamon | Choco Canela Cinnamon | Classic Croissant | Pan au Chocolate | Kouign-Amman | Cheesy Rolls | Dinner Rolls | Foccacia | Ciabatta | Ube Flower | Ube Cheese Supreme | Cheesy Bun | Coffee Roti | Melon Pan | Baby Butt | Tuna Bread | Corned Beef Bread | Pineapple Bread | Spanish Bread | Blitz Torte | Yema Cake | Ube Cake | Custard Cake | Brazo de Mercedes | Fudge Brownies | Chocolate Cupcake | Banana Cupcake | Cheese Cupcake | Choco Chips Cookies | Oatmeal Raisin Cookies | Egg Pie | Banana Loaf | Angel Cake | Chocolate Crinkles | Meringue Kisses | Peanuts]',
    updated_at = NOW()
WHERE id = 'c5d79927-28c2-4cd3-b5d9-e3b45ae5aa3b'; -- Auntie Nitz Bakeshop

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-023',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Cassava Chips (BUSC HC-023; validity ended Oct 26, 2026)] [Variants: Original Flavor | Barbeque | Spicy Barbecue | Cheese | Sour Cream]',
    updated_at = NOW()
WHERE id = '5df3f5c3-809f-4e7c-a9e9-30922d3d913b'; -- CAGAPA

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-033',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Processed & Packaged Canned Seafood (BUSC HC-033)] [Variants: Bottled Bangus in Corn Oil | Bottled Spanish Sardines | Bottled Herring | Crispy Krill]',
    updated_at = NOW()
WHERE id = 'de904fc8-ba17-4b35-9301-f15249aeae61'; -- Dipolog School of Fisheries

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-034',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Egg Production (Listed as AKAO FARMS under BUSC HC-034)] [Variants: Fresh White & Brown Table Eggs]',
    updated_at = NOW()
WHERE id = 'ee330419-5a2d-4411-a307-aeb1ce04a910'; -- FML Agriventures Corporation

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-035',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: DIPMAYO Mayonnaise (BUSC HC-035)]',
    updated_at = NOW()
WHERE id = '798a60c2-fb08-4220-8ae8-f84890504e3b'; -- FML Safeeats Corporation

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-13',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Noodle Production (BUSC HC-13)] [Variants: Miki | Pancit Misua]',
    updated_at = NOW()
WHERE id = '7156c35b-ca74-49a1-a187-56a58f9ee804'; -- IMAVEMCO

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-037',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Sea Salt with Herbs & Culinary Blends (BUSC HC-037)] [Variants: BBQ Rub Salt | Celery Salt | Herbal Pink Salt | Hot & Spicy Herbal Salt | Letchon Rub Salt]',
    updated_at = NOW()
WHERE id = '4a38c35b-e867-4b6f-9e4d-81406aec41c1'; -- Jerusalem Herbal Products Manufacturing

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-031',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Gourmet Bagoong & Seafood Condiments (BUSC HC-031)] [Variants: Bagon Gata | Tuyo Flakes | Guinamos Guisado | Chilli Oil]',
    updated_at = NOW()
WHERE id = '680e94f3-eed7-4ce1-8c4e-750d84153626'; -- Jing Homemade Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-20',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Calamansi Juice (Ready to Drink) and Calamansi Concentrate (BUSC HC-20; validity ended Oct 26, 2026)]',
    updated_at = NOW()
WHERE id = 'a3f9ba15-0f98-4a5e-829e-eeac8e082dfa'; -- K Three Food Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-019',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Calamansi Concentrate, Ready-to-Drink Juice & Coconut Vinegar (BUSC HC-019; validity ended Oct 26, 2026)] [Variants: Calamansi Concentrate | Calamansi Ready to Drink | Coconut Vinegar]',
    updated_at = NOW()
WHERE id = 'f81cb6d8-364d-4b50-bc8e-e1360f6be6eb'; -- Laguerta Food Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-015',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Natural Coco Sugar (BUSC HC-015; validity ended Oct 26, 2026)]',
    updated_at = NOW()
WHERE id = 'e30ae423-d6d6-410c-b2c5-3913b7b63683'; -- MAPZACARA

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-028',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Native Delicacies and Pastries (BUSC HC-028)]',
    updated_at = NOW()
WHERE id = '834c961e-5374-474a-b7e7-a9197eb2432b'; -- MCH Carmela The Food Shop

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-039',
    expiry_date = '2026-10-25',
    status = 'Expired',
    admin_notes = '[Product Lines: Herbal Tea Products & Beverage Instant Mixes (Listed under Silsilah Foundation, Inc. BUSC HC-039; validity ended Oct 25, 2026)]',
    updated_at = NOW()
WHERE id = '6d416b53-09de-430b-92ad-61439541900e'; -- Oasis Livelihood and Training Center

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-002',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Food Ingredients, Spices & Condiments (BUSC HC-002; validity ended Oct 26, 2026)]',
    updated_at = NOW()
WHERE id = 'c7935a40-973e-4152-8f44-c286561ff8b2'; -- OLA Food Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-11',
    expiry_date = '2026-10-26',
    status = 'Expired',
    admin_notes = '[Product Lines: Calamansi Juice (Ready to Drink) and Calamansi Concentrate (BUSC HC-11; validity ended Oct 26, 2026)]',
    updated_at = NOW()
WHERE id = '49fb7ed7-0c8d-4175-808e-5210585976d2'; -- Picker's Calamansi Food Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-038',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Garden Zest Calamansi Beverages (BUSC HC-038)] [Variants: Garden Zest Calamansi Ready-to-Drink | Garden Zest Calamansi Concentrate]',
    updated_at = NOW()
WHERE id = 'e17686ff-7040-4d0d-924a-60a7a7470125'; -- Rossvell Enterprises

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-032',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Processed & Packaged Canned Seafood (BUSC HC-032)] [Variants: Desa Bottled Sardines | Bottled Milkfish | Gourmet Tuyo | Dayok]',
    updated_at = NOW()
WHERE id = '8ec343ab-d3e3-4db1-b740-34e10913850f'; -- Sar-Den's Food Products

UPDATE public.products
SET
    certifying_body_id = '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    certificate_no = 'HC-036',
    expiry_date = '2026-11-20',
    status = 'Halal',
    admin_notes = '[Product Lines: Calamansi Pulp Jelly, Ready-to-Drink & Concentrate (Listed as ZASIHIVAC under BUSC HC-036)] [Variants: Calamansi Pulp Jelly | Calamansi Ready-to-Drink | Calamansi Concentrate]',
    updated_at = NOW()
WHERE id = '2c9f4b1b-080c-4b82-a7be-b8fd2ec49d25'; -- Zamboanga Sibugay High Value Crops Marketing Cooperative

-- Fix ZASIHIVAC manufacturer address note cleanly if helpful, and clarify DIPMAYO Dipolog address
UPDATE public.manufacturers
SET
    address = 'FML Compound, Bypass Road, Gulayon, Dipolog City',
    updated_at = NOW()
WHERE name = 'FML Safeeats Corporation';

-- 5. Add Missing NCMF (BUSC) & UCZP 2026 Packaged Products + Manufacturers idempotently
DO $$
DECLARE
    busc_id UUID := '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48';
    uczp_id UUID := '8d4eef9f-b276-4f0c-97f2-89c8b6a5677d';
    mmhcb_id UUID := 'e276a8c2-bbd9-438e-9ec3-30f2073a3ef3';
    m_id UUID;
BEGIN
    -- 5A. Mamu's Bread and Pastries Shop (BUSC HC-030)
    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('Mamu''s Bread and Pastries Shop', 'Philippines', 'Third Floor Main Mall, KCC Mall De Zamboanga, Zamboanga City', 'NCMF / BUSC 2025-2026 Registry', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'mamu''s bread and pastries assortment') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'Mamu''s Bread and Pastries Assortment',
            'Mamu''s Bread and Pastries Shop',
            'Bakery & Biscuits',
            m_id,
            busc_id,
            'HC-030',
            '2026-11-20',
            'Halal',
            TRUE,
            'halal_certified',
            'NCMF / BUSC 2025-2026 Registry',
            '[Product Lines: Bakery & Confectionary Goods (BUSC HC-030)] [Variants: Croissant | Choco Croissant | Cheese scroll | Almond Croissant | Matcha Croissant | Brownie Croissant | Chocolate Chip Cookies | Crookies | Banana Cake]'
        );
    END IF;

    -- 5B. Sweet Moh Bakery Products (BUSC HC-10, Expired)
    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('Sweet Moh', 'Philippines', 'Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'sweet moh bakery products') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'Sweet Moh Bakery Products',
            'Sweet Moh',
            'Bakery & Biscuits',
            m_id,
            busc_id,
            'HC-10',
            NULL,
            'Expired',
            FALSE,
            'halal_certified',
            'NCMF / BUSC 3rd Quadrimester Report 2025',
            '[Product Lines: Bakery Products (BUSC HC-10; listed as Expired on BUSC 3rd Qtr 2025 Report)]'
        );
    END IF;

    -- 5C. Zambas Long Life Noodles (BUSC HC-14, Expired 2025-08-05)
    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('Zambas Long Life', 'Philippines', 'Zamboanga City', 'NCMF / BUSC 3rd Quadrimester Report 2025', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'zambas long life noodles') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'Zambas Long Life Noodles',
            'Zambas Long Life',
            'Instant Noodles & Pasta',
            m_id,
            busc_id,
            'HC-14',
            '2025-08-05',
            'Expired',
            FALSE,
            'halal_certified',
            'NCMF / BUSC 3rd Quadrimester Report 2025',
            '[Product Lines: Noodle Production (BUSC HC-14; validity 2023-08-05 to 2025-08-05 — Expired)]'
        );
    END IF;

    -- 5D. Jas Agri Venture Mang Sili and Cacao (BUSC HC-22, Expired 2025-08-05)
    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('Jas Agri Venture', 'Philippines', 'Zamboanga City', 'NCMF / BUSC 2025 Registry', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'jas agri venture mang sili and cacao') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'Jas Agri Venture Mang Sili and Cacao',
            'Jas Agri Venture',
            'Food & Beverage',
            m_id,
            busc_id,
            'HC-22',
            '2025-08-05',
            'Expired',
            FALSE,
            'halal_certified',
            'NCMF / BUSC 2025 Registry',
            '[Product Lines: Mang Sili and Cacao (BUSC HC-22; validity 2023-08-05 to 2025-08-05)]'
        );
    END IF;

    -- 5E. UCZP 2026 Packaged Products
    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('Salam Food Processing', 'Philippines', 'Morning Glory, Putik, Zamboanga City', 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'salam food processing products') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'Salam Food Processing Products',
            'Salam Food Processing',
            'Food & Beverage',
            m_id,
            uczp_id,
            NULL,
            '2027-01-31',
            'Halal',
            TRUE,
            'halal_certified',
            'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
            '[Product Lines: Processed Food Goods (UCZP Certified Jan 2026, 1 year validity)]'
        );
    END IF;

    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('Johnee Soap', 'Philippines', 'KCC Mall de ZC, San Jose Rd, Zamboanga City', 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'johnee soap') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'JOHNEE SOAP',
            'Johnee Soap',
            'Personal Care & Household',
            m_id,
            uczp_id,
            NULL,
            '2025-07-31',
            'Expired',
            FALSE,
            'halal_certified',
            'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
            '[Product Lines: Soap & Personal Care Goods (UCZP Certified July 2024, 1 year validity — Expired)]'
        );
    END IF;

    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('SFZ Enterprises Rice Trading', 'Philippines', 'Mercedes, Zamboanga City', 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'sfz enterprises rice trading') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'SFZ ENTERPRISES RICE TRADING',
            'SFZ Enterprises',
            'Food & Beverage',
            m_id,
            uczp_id,
            NULL,
            '2025-05-31',
            'Expired',
            FALSE,
            'halal_certified',
            'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
            '[Product Lines: Milled Rice Supply (UCZP Certified May 2024, 1 year validity — Expired)]'
        );
    END IF;

    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('Amara Palm Oil', 'Philippines', 'Mampang, Zamboanga City', 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'amara palm oil') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'AMARA PALM OIL',
            'Amara Palm Oil',
            'Cooking Oils & Fats',
            m_id,
            uczp_id,
            NULL,
            '2025-07-31',
            'Expired',
            FALSE,
            'halal_certified',
            'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
            '[Product Lines: Culinary Palm Cooking Oil (UCZP Certified July 2024, 1 year validity — Expired)]'
        );
    END IF;

    INSERT INTO public.manufacturers (name, country, address, source, synced_at)
    VALUES ('BM Yan Yam Trading', 'Philippines', 'RT Lim Blvd, Zamboanga City', 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry', NOW())
    ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
    RETURNING id INTO m_id;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE lower(name) = 'bm yan yam trading') THEN
        INSERT INTO public.products (
            name, brand, category, manufacturer_id, certifying_body_id, certificate_no,
            expiry_date, status, halal_logo_present, halal_tier, source, admin_notes
        ) VALUES (
            'BM yan yam trading',
            'BM Yan Yam Trading',
            'Food & Beverage',
            m_id,
            uczp_id,
            NULL,
            '2026-07-31',
            'Expired',
            FALSE,
            'halal_certified',
            'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
            '[Product Lines: Commercial Food Trading Goods (UCZP 2026 Status: For Renewal; 1 year from July 2025 ended July 2026)]'
        );
    END IF;

    -- 6. Update existing Zamboanga establishments accurately against NCMF / UCZP 2026 records
    -- AntiEns: linked to BUSC HC-001 (validity Oct 26, 2025 - Oct 26, 2026)
    UPDATE public.establishments
    SET
        certifying_body_id = busc_id,
        certificate_number = 'HC-001',
        expiry_date = '2026-10-26',
        halal_status = 'expired',
        halal_tier = 'halal_certified',
        source = 'NCMF / BUSC 2025-2026 Registry',
        admin_notes = '[Tier: halal_certified] BUSC HC-001 (Pilar St., Zamboanga City) valid 2025-10-26 to 2026-10-26. Also Muslim-owned Tausug kitchen.'
    WHERE id = '2963602c-699b-4f27-8bc5-cff67277df18';

    -- Black Plate Zamboanga: UCZP 2026 -> Expired (Sept 2024, 1 year)
    UPDATE public.establishments
    SET
        certifying_body_id = uczp_id,
        certificate_number = NULL,
        expiry_date = '2025-09-30',
        halal_status = 'expired',
        halal_tier = 'halal_certified',
        source = 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
        admin_notes = '[Tier: halal_certified] UCZP 2026 Registry status: Expired (Certified September 2024, 1 year validity).'
    WHERE id = '694dd5f6-2ad9-41d4-8360-617590e51745';

    -- Global Pot KCC Mall: fix street address & set UCZP For Renewal (Jan 2026, 1 year)
    UPDATE public.establishments
    SET
        address = 'KCC Mall de Zamboanga, Governor Camins Ave., San Jose Rd., Zamboanga City',
        latitude = 6.919763,
        longitude = 122.073451,
        certifying_body_id = uczp_id,
        certificate_number = NULL,
        expiry_date = '2027-01-31',
        halal_status = 'for_renewal',
        halal_tier = 'halal_certified',
        source = 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
        admin_notes = '[Tier: halal_certified] UCZP 2026 Registry status: For Renewal (Certified January 2026, 1 year validity).'
    WHERE id = '0db5ceb9-6c83-4c20-8be8-803a7a6f83f0';

    -- Global Pot Tetuan branch: align with UCZP For Renewal
    UPDATE public.establishments
    SET
        certifying_body_id = uczp_id,
        certificate_number = NULL,
        expiry_date = '2027-01-31',
        halal_status = 'for_renewal',
        halal_tier = 'halal_certified',
        source = 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
        admin_notes = '[Tier: halal_certified] Branch linked to UCZP 2026 Global Pot listing (For Renewal — Certified January 2026, 1 year validity).'
    WHERE id = 'a40b16bb-037f-4a7c-9783-a828148cc2d3';

    -- Royalle Chillie Restaurant ("Chillies" on UCZP 2026): Renewed January 2026 (1 year)
    UPDATE public.establishments
    SET
        certifying_body_id = uczp_id,
        certificate_number = NULL,
        expiry_date = '2027-01-31',
        halal_status = 'verified',
        halal_tier = 'halal_certified',
        source = 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
        admin_notes = '[Tier: halal_certified] Listed as Chillies on UCZP 2026 Registry: Renewed January 2026 (1 year validity).'
    WHERE id = 'd70cf9e6-3c81-4d8f-8949-b6d1195bbc5d';

    -- Chick N' Cow Hotpot: Active May 2026 (2 years)
    UPDATE public.establishments
    SET
        certifying_body_id = uczp_id,
        certificate_number = NULL,
        expiry_date = '2028-05-31',
        halal_status = 'verified',
        halal_tier = 'halal_certified',
        source = 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
        admin_notes = '[Tier: halal_certified] UCZP 2026 Registry status: Active (Certified May 2026, 2 years validity).'
    WHERE id = '572eb976-b00f-400f-a4eb-378c77a888ea';

    -- Bandit Burger: Active August 2026 (2 years)
    UPDATE public.establishments
    SET
        certifying_body_id = uczp_id,
        certificate_number = NULL,
        expiry_date = '2028-08-31',
        halal_status = 'verified',
        halal_tier = 'halal_certified',
        source = 'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
        admin_notes = '[Tier: halal_certified] UCZP 2026 Registry status: Active (Certified August 2026, 2 years validity).'
    WHERE id = 'bd22d2e5-955d-4de0-86c1-e2c410991a28';

    -- Bay Tal Mal Restaurant Zamboanga City: clear synthetic MIM-HCB-468 placeholder, keep MMHCB
    UPDATE public.establishments
    SET
        certifying_body_id = mmhcb_id,
        certificate_number = NULL,
        halal_status = 'verified',
        halal_tier = 'halal_certified',
        admin_notes = '[Tier: halal_certified] Formally Halal certified by MMHCBI; also listed as Muslim-Owned on NCMF Zamboanga City directory.'
    WHERE id = '728f940f-1917-4e6d-b895-596a9bf7ff6e';

    -- Dennis Coffee Garden (main branch): clarify expired prior BUSC cert while remaining Muslim-Owned
    UPDATE public.establishments
    SET
        halal_status = 'verified',
        halal_tier = 'muslim_owned',
        admin_notes = '[Tier: muslim_owned] Heritage Muslim-owned coffee house. Prior BUSC Certificate (HC-) listed as Expired on BUSC 3rd Qtr 2025 report.'
    WHERE id = '60b22568-fd08-4844-b84b-e1f339922715';

    -- Upgrade Mamang's Greasy Spoon and IYA Coffee CafeResto branches from muslim_friendly -> muslim_owned per NCMF directory
    UPDATE public.establishments
    SET
        halal_tier = 'muslim_owned',
        source = 'NCMF Zamboanga City Local Directory & Muslim in Manila Directory',
        admin_notes = '[Tier: muslim_owned] Verified Muslim-Owned per NCMF Zamboanga City Local Registry (Pork-Free Kitchen).'
    WHERE id IN (
        'c1f61144-6866-4178-a892-793111bef170', -- Mamang's Greasy Spoon
        '8ad004e9-00c1-4a0c-a700-fa63cfb37d26', -- IYA Coffee CafeResto - Tetuan
        'fb37ad7e-aeb3-43cd-8fb3-4591db846117'  -- IYA Coffee CafeResto - Lantaka (24/7)
    );

    -- 7. Insert Zamboanga City BUSC Certified Establishments & Facilities (Active + Past-Validity)
    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'west metro medical center%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'West Metro Medical Center (Dietary Kitchen)',
            'Hospital Dietary Kitchen',
            'Veterans Ave. Ext., Zamboanga City',
            'Zamboanga City',
            6.9155,
            122.0752,
            'verified',
            'halal_certified',
            busc_id,
            'HC-26',
            '2026-12-12',
            'NCMF / BUSC 2025-2026 Registry',
            'Halal-certified hospital dietary kitchen preparing inpatient and patient-care meals at West Metro Medical Center. Audited by BUSC (HC-26).',
            '[Tier: halal_certified] BUSC HC-26 (Menus in the kitchen). Certified 2025-10-10 to 2026-12-12.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'auntie nit''z%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Auntie Nit''z Bakeshop & Grocery',
            'Bakeshop & Grocery',
            'Veterans Avenue, Tetuan, Zamboanga City',
            'Zamboanga City',
            6.9125,
            122.0774,
            'verified',
            'halal_certified',
            busc_id,
            'HC-05',
            '2027-10-26',
            'NCMF / BUSC 2025-2026 Registry',
            'Established bakeshop and local grocery on Veterans Avenue serving 44+ BUSC-certified breads, ensaimadas, croissants, cakes, and cookies.',
            '[Tier: halal_certified] BUSC HC-05 (Active 2025-10-26 to 2027-10-26).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'mamu''s bread and pastries%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Mamu''s Bread and Pastries Shop',
            'Bakery & Pastry Shop',
            '3rd Floor Main Mall, KCC Mall de Zamboanga, Gov. Camins Ave., Zamboanga City',
            'Zamboanga City',
            6.9198,
            122.0736,
            'verified',
            'halal_certified',
            busc_id,
            'HC-030',
            '2026-11-20',
            'NCMF / BUSC 2025-2026 Registry',
            'Artisan bakery kiosk at KCC Mall de Zamboanga offering BUSC-certified croissants, cheese scrolls, cookies, crookies, and banana cake.',
            '[Tier: halal_certified] BUSC HC-030 (Active 2025-11-20 to 2026-11-20).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'mch carmela%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'MCH Carmela The Food Shop',
            'Native Delicacies & Pastry Shop',
            'Estrada St., Tetuan, Zamboanga City',
            'Zamboanga City',
            6.9182,
            122.0875,
            'verified',
            'halal_certified',
            busc_id,
            'HC-028',
            '2026-11-20',
            'NCMF / BUSC 2025-2026 Registry',
            'Local Tetuan shop producing BUSC-certified native delicacies and pastries.',
            '[Tier: halal_certified] BUSC HC-028 (Active 2025-11-20 to 2026-11-20).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'don fernando%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Don Fernando Gourmet Foods',
            'Food Producer & Kitchen',
            'Green Meadow Subd., Galvez Drive, Sta. Maria, Zamboanga City',
            'Zamboanga City',
            6.9324,
            122.0714,
            'verified',
            'halal_certified',
            busc_id,
            'HC-027',
            '2026-11-20',
            'NCMF / BUSC 2025-2026 Registry',
            'Zamboanga gourmet seafood and condiment producer certified under BUSC HC-027 for Spanish sardines, tuyo, danggit, pusit, tuna flakes, and bagoong padas.',
            '[Tier: halal_certified] BUSC HC-027 (Active 2025-11-20 to 2026-11-20).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE '2k peanut%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            '2K Peanut',
            'Snack & Food Producer',
            'Tugbungan, Zamboanga City',
            'Zamboanga City',
            6.9235,
            122.0940,
            'verified',
            'halal_certified',
            busc_id,
            'HC-029',
            '2026-11-20',
            'NCMF / BUSC 2025-2026 Registry',
            'Tugbungan-based Halal snack producer certified by BUSC (HC-029) for roasted salted and spicy garlic peanuts.',
            '[Tier: halal_certified] BUSC HC-029 (Active 2025-11-20 to 2026-11-20).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'jing homemade%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Jing Homemade Products',
            'Homemade Condiments Producer',
            'Cabatangan, Zamboanga City',
            'Zamboanga City',
            6.9395,
            122.0585,
            'verified',
            'halal_certified',
            busc_id,
            'HC-031',
            '2026-11-20',
            'NCMF / BUSC 2025-2026 Registry',
            'Cabatangan food producer certified under BUSC HC-031 for Bagon Gata, Tuyo Flakes, Guinamos Guisado, and Chilli Oil.',
            '[Tier: halal_certified] BUSC HC-031 (Active 2025-11-20 to 2026-11-20).'
        );
    END IF;

    -- Past-validity / Expired BUSC Zamboanga facilities (excluded from active default pins, visible in Expired Registry ledger)
    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'zamboanga city medical center%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Zamboanga City Medical Center (Dietary Kitchen)',
            'Hospital Dietary Kitchen',
            'Dr. Evangelista St., Sta. Catalina, Zamboanga City',
            'Zamboanga City',
            6.9120,
            122.0848,
            'expired',
            'halal_certified',
            busc_id,
            'HC-06',
            '2026-11-10',
            'NCMF / BUSC 2025-2026 Registry',
            'Public regional hospital dietary kitchen recorded under BUSC HC-06.',
            '[Tier: halal_certified] BUSC HC-06 (Menus in the kitchen) valid 2025-11-10 to 2026-11-10; past recorded expiry date pending renewal confirmation.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'silsilah foundation%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Silsilah Foundation, Inc. (Oasis Livelihood Center)',
            'Beverage & Food Manufacturer',
            'Harmony Village, Pitogo, Sinunuc, Zamboanga City',
            'Zamboanga City',
            6.9278,
            122.0235,
            'expired',
            'halal_certified',
            busc_id,
            'HC-039',
            '2026-10-25',
            'NCMF / BUSC 2025-2026 Registry',
            'Social enterprise manufacturer in Sinunuc producing dry-pack herbal tea and instant beverage mixes.',
            '[Tier: halal_certified] BUSC HC-039 valid 2025-10-25 to 2026-10-25.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'mapzacara%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'MAPZACARA (Malandi-Patalon Agrarian Reform Coop)',
            'Agro-Food Producer',
            'Malandi-Patalon, Zamboanga City',
            'Zamboanga City',
            7.0650,
            121.9250,
            'expired',
            'halal_certified',
            busc_id,
            'HC-015',
            '2026-10-26',
            'NCMF / BUSC 2025-2026 Registry',
            'Agrarian reform cooperative in Patalon producing natural coco sugar.',
            '[Tier: halal_certified] BUSC HC-015 valid 2025-10-26 to 2026-10-26.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'ola food products%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Ola Food Products',
            'Food Ingredients & Spices',
            'Zamboanga City',
            'Zamboanga City',
            6.9214,
            122.0790,
            'expired',
            'halal_certified',
            busc_id,
            'HC-002',
            '2026-10-26',
            'NCMF / BUSC 2025-2026 Registry',
            'Local Zamboanga spices and culinary food ingredients supplier.',
            '[Tier: halal_certified] BUSC HC-002 valid 2025-10-26 to 2026-10-26.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'sweet moh%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Sweet Moh Bakeshop',
            'Bakeshop & Confectionery',
            'Zamboanga City',
            'Zamboanga City',
            6.9165,
            122.0765,
            'expired',
            'halal_certified',
            busc_id,
            'HC-10',
            NULL,
            'NCMF / BUSC 3rd Quadrimester Report 2025',
            'Local Zamboanga bakery previously certified under BUSC HC-10.',
            '[Tier: halal_certified] BUSC HC-10 listed as Expired on BUSC 3rd Qtr 2025 report.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'zambas long life%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Zambas Long Life Food Production',
            'Noodle Manufacturer',
            'Zamboanga City',
            'Zamboanga City',
            6.9225,
            122.0815,
            'expired',
            'halal_certified',
            busc_id,
            'HC-14',
            '2025-08-05',
            'NCMF / BUSC 3rd Quadrimester Report 2025',
            'Local noodle manufacturing facility previously certified under BUSC HC-14.',
            '[Tier: halal_certified] BUSC HC-14 (2023-08-05 to 2025-08-05 — Expired).'
        );
    END IF;

    -- 8. Insert New Active UCZP 2026 Zamboanga City Venues
    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'shakers pearl shake%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Shakers Pearl Shake',
            'Beverage & Snack Stand',
            'Zone 4, Thomas Claudio, Zamboanga City',
            'Zamboanga City',
            6.9054,
            122.0789,
            'verified',
            'halal_certified',
            uczp_id,
            NULL,
            '2028-09-30',
            'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
            'Local beverage stall at Zone 4, Thomas Claudio serving pearl shakes and refreshments. Certified Halal by UCZP in September 2026 (2 years validity).',
            '[Tier: halal_certified] UCZP 2026 Registry status: Active (Certified September 2026, 2 years validity).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'salam food processing%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            certifying_body_id, certificate_number, expiry_date, source, description, admin_notes
        ) VALUES (
            'Salam Food Processing',
            'Food Processor & Commissary',
            'Morning Glory, Putik, Zamboanga City',
            'Zamboanga City',
            6.9415,
            122.1030,
            'verified',
            'halal_certified',
            uczp_id,
            NULL,
            '2027-01-31',
            'Ulama Council of Zamboanga Peninsula (UCZP) 2026 Registry',
            'Local Halal food processor in Putik, Zamboanga City. Certified by UCZP in January 2026 (1 year validity).',
            '[Tier: halal_certified] UCZP 2026 Registry status: Active (Certified January 2026, 1 year validity).'
        );
    END IF;

    -- 9. Insert the 10 New Muslim-Owned Zamboanga Dining & Coffee Spots (NCMF Image 11 Section 1)
    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'hey, jude%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Hey, Jude! Café',
            'Coffee Shop & Cafe',
            'San Jose Road, San Jose Cawa-Cawa, Zamboanga City',
            'Zamboanga City',
            6.9142,
            122.0545,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Neighborhood specialty cafe in San Jose Cawa-Cawa serving coffee and light meals. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'hub ur space%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Hub Ur Space',
            'Study Cafe & Lounge',
            'Governor Camins Avenue, Canelar, Zamboanga City',
            'Zamboanga City',
            6.9162,
            122.0715,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Co-working coffee lounge along Governor Camins Avenue in Canelar. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'haya caf%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Haya Café',
            'Coffee Shop & Cafe',
            '2nd Floor, W Hotel Building, Veterans Avenue (fronting Doctor''s Hospital), Zamboanga City',
            'Zamboanga City',
            6.9114,
            122.0764,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Cozy coffee shop on the 2nd floor of W Hotel Building along Veterans Avenue. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) = 'kinami') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'KINAMI',
            'Food & Beverage Spot',
            'Caltex, San Jose Gusu, Zamboanga City',
            'Zamboanga City',
            6.9146,
            122.0492,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Quick-stop food and beverage outlet at Caltex, San Jose Gusu. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'turkish grille - kcc%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Turkish Grille - KCC Mall de Zamboanga',
            'Turkish & Kebab Grill',
            'KCC Mall de Zamboanga, San Jose Road, Zamboanga City',
            'Zamboanga City',
            6.9197,
            122.0737,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Turkish kebab and shawarma dining spot inside KCC Mall de Zamboanga. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) = 'coffee spot') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Coffee Spot',
            'Coffee Shop',
            'San Jose Road, Zamboanga City',
            'Zamboanga City',
            6.9158,
            122.0592,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Local coffee shop along San Jose Road. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) = 'coffee hour') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Coffee Hour',
            'Coffee Shop',
            'Crispin Atilano Street, Tetuan, Zamboanga City',
            'Zamboanga City',
            6.9188,
            122.0886,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Neighborhood cafe along Crispin Atilano Street in Tetuan. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'kalm study hub%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'KALM Study Hub & Cafe',
            'Study Cafe & Bistro',
            'Baliwasan Chico, Zamboanga City',
            'Zamboanga City',
            6.9138,
            122.0608,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Student-friendly study hub and cafe in Baliwasan Chico. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) = 'lamun restaurant') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Lamun Restaurant',
            'Tausug & Local Cuisine Restaurant',
            'Canelar, Zamboanga City',
            'Zamboanga City',
            6.9124,
            122.0728,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Local dining house in Canelar serving home-style Muslim Filipino dishes. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.establishments WHERE lower(name) LIKE 'afiyah''s fastfood%') THEN
        INSERT INTO public.establishments (
            name, type, address, city, latitude, longitude, halal_status, halal_tier,
            source, description, admin_notes
        ) VALUES (
            'Afiyah''s Fastfood Grill House',
            'Fastfood & Grill House',
            'San Jose Gusu, Zamboanga City',
            'Zamboanga City',
            6.9136,
            122.0488,
            'verified',
            'muslim_owned',
            'NCMF Zamboanga City Local Directory',
            'Fastfood grill house in San Jose Gusu serving charcoal-grilled meals and rice platters. Listed as Muslim-owned by NCMF Zamboanga City.',
            '[Tier: muslim_owned] Community Listed - Muslim-Owned (NCMF Zamboanga City Registry).'
        );
    END IF;
END $$;
