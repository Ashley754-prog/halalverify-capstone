-- ==============================================================================
-- HalalVerify: Migration 011 - DTI Region IX ZAMPEN 2026 Audit Cleanup & Completion
-- Aligns product cards strictly with verified records in HALAL CATALOGUE DTI.pdf:
-- 1. Clears synthetic sequential barcodes (4809012345xxx) not issued in PDF/NCMF.
-- 2. Clears fabricated placeholder cert numbers, guessed dates, and guessed ingredients.
-- 3. Tags overlapping NCMF/BUSC/BPCC ZAMPEN MSMEs featured in the DTI 2026 Catalogue.
-- 4. Inserts the 5 previously unrepresented MSMEs and visible catalogue variants.
-- ==============================================================================

-- 1. Clear fabricated sequential placeholder barcodes
UPDATE public.products
SET barcode = NULL,
    updated_at = now()
WHERE barcode LIKE '4809012345%';

-- 2. Clear fabricated placeholder certificate codes and guessed expiry dates
UPDATE public.products
SET certificate_no = NULL,
    expiry_date = NULL,
    updated_at = now()
WHERE certificate_no LIKE 'BUSC-RURU-%'
   OR certificate_no LIKE 'BUSC-OLA-%'
   OR certificate_no LIKE 'BUSC-LAG-%'
   OR certificate_no LIKE 'HC-DSF-%'
   OR certificate_no LIKE 'HC-DESA-%'
   OR certificate_no LIKE 'HC-AKAO-%'
   OR certificate_no LIKE 'HC-POM-%'
   OR certificate_no LIKE 'HC-JH-%'
   OR certificate_no LIKE 'HC-DIP-%'
   OR certificate_no LIKE 'HC-RV-%'
   OR certificate_no LIKE 'HC-ZAS-%'
   OR certificate_no = 'BPCC-2025-HG-50';

-- 3. Clear unverified guessed ingredients strings added by migration 004
UPDATE public.products
SET ingredients_summary = NULL,
    updated_at = now()
WHERE source = 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026';

-- 4. Fix manufacturer contact typos against PDF verbatim entries
UPDATE public.manufacturers
SET contact_email = 'ttacay@ymail.com',
    contact_person = 'Maria Teresa T. Jumalon',
    contact_phone = '0935-329-0607',
    updated_at = now()
WHERE name ILIKE '%Jerusalem Herbal%';

UPDATE public.manufacturers
SET contact_person = 'Teresita Kabayaw',
    contact_email = 'teresitakabayao@yahoo.com',
    contact_phone = '(+63) 935 315 1069',
    updated_at = now()
WHERE name ILIKE '%2K Peanut%';

-- 5. Tag overlapping ZAMPEN MSMEs featured in the 2026 DTI Catalogue so filter shows all 26 MSMEs
UPDATE public.products p
SET source = CASE
        WHEN p.source ILIKE '%BPCC%' THEN 'NCMF / BPCC Register & DTI Region IX ZAMPEN Catalogue 2026'
        WHEN p.source ILIKE '%BUSC%' THEN 'NCMF / BUSC Register & DTI Region IX ZAMPEN Catalogue 2026'
        ELSE 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026'
    END,
    updated_at = now()
FROM public.manufacturers m
WHERE p.manufacturer_id = m.id
  AND (p.source IS NULL OR p.source NOT ILIKE '%ZAMPEN%')
  AND (
      m.name ILIKE '%MAPZACARA%'
      OR m.name ILIKE '%AntiEns%'
      OR m.name ILIKE '%2K Peanut%'
      OR m.name ILIKE '%Auntie Nit%'
      OR m.name ILIKE '%MCH Carmela%'
      OR m.name ILIKE '%RURU Mushrooms%'
      OR m.name ILIKE '%Silsilah%'
      OR m.name ILIKE '%Oasis%'
      OR m.name ILIKE '%Ola Food%'
      OR m.name ILIKE '%Jing Homemade%'
      OR m.name ILIKE '%Laguerta%'
      OR m.name ILIKE '%Dipolog School%'
      OR m.name ILIKE '%Sar-Den%'
      OR m.name ILIKE '%CAGAPA%'
      OR m.name ILIKE '%DipMayo%'
      OR m.name ILIKE '%FML%'
      OR m.name ILIKE '%AKAO%'
      OR m.name ILIKE '%Agriko%'
      OR m.name ILIKE '%Altoberos%'
      OR m.name ILIKE '%Heaven''s Gift%'
      OR m.name ILIKE '%Lianas%'
      OR m.name ILIKE '%MIFAMCO%'
      OR m.name ILIKE '%A5 Calamansi%'
      OR m.name ILIKE '%Rossvell%'
      OR m.name ILIKE '%KThree%'
      OR m.name ILIKE '%Picker''s%'
      OR m.name ILIKE '%ZASIHIVAC%'
      OR m.name ILIKE '%Zamboanga Sibugay High Value Crops%'
      OR m.name ILIKE '%IMAVEMCO%'
      OR m.name ILIKE '%Jerusalem Herbal%'
  );

-- 6. Insert the 5 previously unrepresented MSMEs + missing PDF variants idempotently
DO $$
DECLARE
    busc_id UUID;
    bpcc_id UUID;
    dti_src TEXT := 'DTI Region IX / Halal in ZAMPEN Product Catalogue 2026';
    dti_url TEXT := 'https://r09.dti.gov.ph/';
    m_id UUID;
    rec RECORD;
BEGIN
    SELECT id INTO busc_id FROM public.certifying_bodies WHERE code = 'BUSC' LIMIT 1;
    SELECT id INTO bpcc_id FROM public.certifying_bodies WHERE code = 'BPCC' LIMIT 1;

    FOR rec IN
        SELECT * FROM (VALUES
            ('Auntie Nit', 'Auntie Nitz Cheesy Ensaymada', 'Auntie Nitz', 'Bakery & Biscuits', busc_id),
            ('Auntie Nit', 'Auntie Nitz Butter Croissants & Breads', 'Auntie Nitz', 'Bakery & Biscuits', busc_id),
            ('Auntie Nit', 'Auntie Nitz Assorted Cakes & Pastries', 'Auntie Nitz', 'Bakery & Biscuits', busc_id),
            ('MCH Carmela', 'MCH Carmela Native Pastries & Empanada', 'MCH Carmela', 'Bakery & Biscuits', busc_id),
            ('MCH Carmela', 'MCH Carmela Bibingka & Native Kakanin', 'MCH Carmela', 'Bakery & Biscuits', busc_id),
            ('Oasis Livelihood', 'Holisticare Lagundi Herbal Tea', 'Holisticare', 'Beverages', busc_id),
            ('Oasis Livelihood', 'Holisticare Ginger Herbal Tea', 'Holisticare', 'Beverages', busc_id),
            ('Oasis Livelihood', 'Holisticare Turmeric Herbal Tea', 'Holisticare', 'Beverages', busc_id),
            ('Sar-Den', 'DESA Spanish Style Sardines in Corn Oil 208g', 'DESA', 'Canned Fish & Meat', busc_id),
            ('CAGAPA', 'CAGAPA Cassava Chips Barbeque', 'CAGAPA', 'Snacks & Chips', busc_id),
            ('CAGAPA', 'CAGAPA Cassava Chips Spicy Barbecue', 'CAGAPA', 'Snacks & Chips', busc_id),
            ('CAGAPA', 'CAGAPA Cassava Chips Cheese', 'CAGAPA', 'Snacks & Chips', busc_id),
            ('CAGAPA', 'CAGAPA Cassava Chips Sour Cream', 'CAGAPA', 'Snacks & Chips', busc_id),
            ('Agriko Multi-Trade', 'Agriko Cereal Powder Gluten-Free', 'Agriko Organic', 'Food & Beverage', bpcc_id),
            ('A5 Calamansi', 'A5 Delight Healthymansi Calamansi Concentrate', 'A5 Delight', 'Beverages', busc_id),
            ('A5 Calamansi', 'A5 Delight Healthymansi Ready-to-Drink Calamansi Juice', 'A5 Delight', 'Beverages', busc_id),
            ('Rossvell Enterprises', 'Rossvell Garden Zest Calamansi Juice Ready-to-Drink 350ml', 'Garden Zest', 'Beverages', busc_id),
            ('KThree', 'K Three Coolers Calamansi Puree 1000ml', 'K Three Coolers', 'Beverages', busc_id),
            ('KThree', 'K Three Coolers Calamansi Juice Drink', 'K Three Coolers', 'Beverages', busc_id),
            ('Picker''s Calamansi', 'Picker''s Calamansi Concentrate 1L', 'Picker''s', 'Beverages', busc_id),
            ('Picker''s Calamansi', 'Picker''s Calamansi Juice Drink Bottle', 'Picker''s', 'Beverages', busc_id),
            ('Picker''s Calamansi', 'Picker''s Calamansi Juice Drink 200ml Pouch', 'Picker''s', 'Beverages', busc_id)
        ) AS t(mfr_match, p_name, p_brand, p_cat, p_cb)
    LOOP
        SELECT id INTO m_id FROM public.manufacturers WHERE name ILIKE '%' || rec.mfr_match || '%' LIMIT 1;
        IF m_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.products WHERE manufacturer_id = m_id AND name = rec.p_name
        ) THEN
            INSERT INTO public.products (name, brand, category, manufacturer_id, certifying_body_id, status, halal_logo_present, source, source_url)
            VALUES (rec.p_name, rec.p_brand, rec.p_cat, m_id, rec.p_cb, 'Halal', true, dti_src, dti_url);
        END IF;
    END LOOP;
END $$;
