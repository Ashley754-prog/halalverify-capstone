-- =============================================================================
-- Migration 012: Consolidate Repetitive Flavor Variants Across DTI ZAMPEN Cards
-- Applies Hybrid Product-Family Grouping: groups identical base products differing
-- only by flavor or pack variant into parent product-family cards (113 -> 62 rows),
-- storing searchable variant lists in products.admin_notes as `[Variants: ...]`.
-- Preserves distinct dishes, distinct categories, NCMF/BPCC/BUSC certificate numbers,
-- expiry dates, and individual studio photography (2K Peanuts keeps 3 cards).
-- =============================================================================

BEGIN;

-- 1. Agriko Organic / Eco Farm (15 -> 4 cards)
UPDATE products
SET
  name = 'Agriko Herbal & Turmeric Tea Blends',
  category = 'Beverages',
  admin_notes = '[Variants: 5N1 Turmeric Tea Blend | Turmeric Tea Blend | Ginger Tea Blend | Roasted Black Rice 5N1 Tea | Cacao 5N1 Turmeric Tea]'
WHERE name = '5N1 Turmeric Tea Powder Blend' AND brand = 'Agriko Organic';

DELETE FROM products
WHERE brand = 'Agriko Organic'
  AND name IN (
    'Turmeric Tea Powder Blend',
    'Ginger Tea Powder Blend',
    'Roasted Black Rice with 5N1 Turmeric Tea Blend',
    'Cacao with 5N1 Turmeric Tea Powder Blend'
  );

UPDATE products
SET
  name = 'Agriko Certified Organic Rice 1kg',
  category = 'Food & Beverage',
  admin_notes = '[Variants: Organic Black Rice | Organic Brown Rice | Organic Red Rice | Organic White Rice]'
WHERE name = 'Organic Black Rice 1kg' AND brand = 'Agriko Eco Farm';

DELETE FROM products
WHERE brand = 'Agriko Eco Farm'
  AND name IN (
    'Organic Brown Rice 1kg',
    'Organic Red Rice 1kg',
    'Organic White Rice 1kg'
  );

UPDATE products
SET
  name = 'Agriko Pure Herbal Powders',
  category = 'Food & Beverage',
  admin_notes = '[Variants: Pure 5N1 Herbal Powder | Pure Ginger Powder 100g | Pure Guyabano Powder 100g | Pure Moringa (Malunggay) Powder | Pure Turmeric Powder 100g]'
WHERE name = 'Pure 5N1 Herbal Powder' AND brand = 'Agriko Eco Farm';

DELETE FROM products
WHERE brand = 'Agriko Eco Farm'
  AND name IN (
    'Pure Ginger Powder 100g',
    'Pure Guyabano Powder 100g',
    'Pure Moringa (Malunggay) Powder',
    'Pure Turmeric Powder 100g'
  );

-- 2. Altoberos Food Products (6 -> 2 cards)
UPDATE products
SET
  name = 'Altoberos Native Crispy Snacks',
  category = 'Snacks & Chips',
  admin_notes = '[Variants: Native Ampao Crispy Puffed Rice | Chicharon Latik | Pop-Corn Sweet & Salty | Crunchy Fish Cracker]'
WHERE name = 'Altoberos Native Ampao Crispy Puffed Rice' AND brand = 'Altoberos';

DELETE FROM products
WHERE brand = 'Altoberos'
  AND name IN (
    'Altoberos Chicharon Latik',
    'Altoberos Pop-Corn Sweet & Salty',
    'Altoberos Crunchy Fish Cracker'
  );

UPDATE products
SET
  name = 'Altoberos Native Confectionery (Sampaloc & Bucayo)',
  category = 'Snacks & Chips',
  admin_notes = '[Variants: Sampaloc Candy Bites | Sweet Bucayo Coconut Strips]'
WHERE name = 'Altoberos Sampaloc Candy Bites' AND brand = 'Altoberos';

DELETE FROM products
WHERE brand = 'Altoberos'
  AND name = 'Altoberos Sweet Bucayo Coconut Strips';

-- 3. Auntie Nitz Bakery (3 -> 1 card)
UPDATE products
SET
  name = 'Auntie Nitz Breads, Pastries & Cakes',
  category = 'Bakery & Biscuits',
  admin_notes = '[Variants: Cheesy Ensaymada | Butter Croissants & Breads | Assorted Cakes & Pastries]'
WHERE name = 'Auntie Nitz Cheesy Ensaymada' AND brand = 'Auntie Nitz';

DELETE FROM products
WHERE brand = 'Auntie Nitz'
  AND name IN (
    'Auntie Nitz Butter Croissants & Breads',
    'Auntie Nitz Assorted Cakes & Pastries'
  );

-- 4. CAGAPA (5 -> 1 card, retaining HC-023 NCMF/BUSC record)
UPDATE products
SET
  name = 'CAGAPA Crispy Cassava Chips',
  category = 'Snacks & Chips',
  admin_notes = '[Variants: Original 150g | Barbeque | Spicy Barbecue | Cheese | Sour Cream]',
  source = 'NCMF / BUSC Register & DTI Region IX ZAMPEN Catalogue 2026'
WHERE name = 'CAGAPA Crispy Cassava Chips Original 150g' AND brand = 'CAGAPA';

DELETE FROM products
WHERE brand = 'CAGAPA'
  AND name IN (
    'CAGAPA Cassava Chips Barbeque',
    'CAGAPA Cassava Chips Spicy Barbecue',
    'CAGAPA Cassava Chips Cheese',
    'CAGAPA Cassava Chips Sour Cream'
  );

-- 5. Cymon / Jerusalem Herbal (4 -> 1 card)
UPDATE products
SET
  name = 'Cymon Gourmet Herbal Salt & Spice Rubs',
  category = 'Spices & Seasonings',
  admin_notes = '[Variants: Celery Salt 250g | BBQ Rub Herbs & Spices 250g | Hot & Spicy Herbal Salt 150g & 250g]'
WHERE name = 'Cymon Celery Salt Gourmet Shaker 250g' AND brand = 'Cymon';

DELETE FROM products
WHERE (brand = 'Cymon' AND name IN ('Cymon BBQ Rub Herbs & Spices 250g', 'Cymon Hot & Spicy Herbal Salt 250g'))
   OR (brand = 'Jerusalem Herbal' AND name = 'Jerusalem Hot & Spicy Herbal Rub Salt 150g');

-- 6. Heaven's Gift Bakehaus (22 -> 5 product-line cards)
UPDATE products
SET
  name = 'Heaven''s Gift Artisan Hopia Line',
  category = 'Bakery & Biscuits',
  admin_notes = '[Variants: Grilled Black Rice Hopia 8s | Ube Hopia | Buko Pandan Hopia | Durian Hopia | Cacao Hopia]'
WHERE name = 'Heaven''s Gift Black Rice Hopia' AND brand = 'Heaven''s Gift';

DELETE FROM products
WHERE brand = 'Heaven''s Gift'
  AND name IN (
    'Heaven''s Gift Grilled Black Hopia with Organic Black Rice 8s',
    'Heaven''s Gift Ube Hopia',
    'Heaven''s Gift Buko Pandan Hopia',
    'Heaven''s Gift Durian Hopia',
    'Heaven''s Gift Cacao Hopia'
  );

UPDATE products
SET
  name = 'Heaven''s Gift Fruit Pies & Cacao Pastel',
  category = 'Bakery & Biscuits',
  admin_notes = '[Variants: Mango Pie | Buko Pandan Pie | Strawberry Pie | Ube Pie | Cacao Pastel]'
WHERE name = 'Heaven''s Gift Mango Pie' AND brand = 'Heaven''s Gift';

DELETE FROM products
WHERE brand = 'Heaven''s Gift'
  AND name IN (
    'Heaven''s Gift Buko Pandan Pie',
    'Heaven''s Gift Strawberry Pie',
    'Heaven''s Gift Ube Pie',
    'Heaven''s Gift Cacao Pastel'
  );

UPDATE products
SET
  name = 'Heaven''s Gift Fresh Baked Bread Loaves',
  category = 'Bakery & Biscuits',
  admin_notes = '[Variants: Tasty Bread Loaf | Creamy Loaf | Whole Wheat Loaf | Cheese Loaf]'
WHERE name = 'Heaven''s Gift Tasty Bread Loaf' AND brand = 'Heaven''s Gift';

DELETE FROM products
WHERE brand = 'Heaven''s Gift'
  AND name IN (
    'Heaven''s Gift Creamy Loaf',
    'Heaven''s Gift Whole Wheat Loaf',
    'Heaven''s Gift Cheese Loaf'
  );

UPDATE products
SET
  name = 'Heaven''s Gift Biscuits, Patatas & Cookies',
  category = 'Bakery & Biscuits',
  admin_notes = '[Variants: Homemade Patatas Biscuits | Pacencia Cookies | Butter Cookies | Butter Cookies with Sesame | Special Otap | Toasted Biscocho]'
WHERE name = 'Heaven''s Gift Patatas Biscuits' AND brand = 'Heaven''s Gift';

DELETE FROM products
WHERE brand = 'Heaven''s Gift'
  AND name IN (
    'Heaven''s Gift Pacencia Cookies',
    'Heaven''s Gift Butter Cookies',
    'Heaven''s Gift Butter Cookies with Sesame',
    'Heaven''s Gift Special Otap',
    'Heaven''s Gift Toasted Biscocho'
  );

UPDATE products
SET category = 'Snacks & Chips'
WHERE name = 'Heaven''s Gift Nutri Chips' AND brand = 'Heaven''s Gift';

-- 7. Holisticare (3 -> 1 card; Silsilah Herbal Instant Tea Mix 200g stays separate)
UPDATE products
SET
  name = 'Holisticare Herbal Tea Series',
  category = 'Beverages',
  admin_notes = '[Variants: Lagundi Herbal Tea | Ginger Herbal Tea | Turmeric Herbal Tea]'
WHERE name = 'Holisticare Lagundi Herbal Tea' AND brand = 'Holisticare';

DELETE FROM products
WHERE brand = 'Holisticare'
  AND name IN (
    'Holisticare Ginger Herbal Tea',
    'Holisticare Turmeric Herbal Tea'
  );

-- 8. Lianas (4 -> 2 cards)
UPDATE products
SET category = 'Food & Beverage'
WHERE name = 'Lianas 100% Pure Tablea' AND brand = 'Lianas';

UPDATE products
SET
  name = 'Lianas Artisan Dark & Milk Chocolate Bars',
  category = 'Food & Beverage',
  admin_notes = '[Variants: Plain Chocolate Bar | Chocolate with Fruits & Nuts | Chocolate with Rice Crisps]'
WHERE name = 'Lianas Plain Chocolate Bar' AND brand = 'Lianas Artisan';

DELETE FROM products
WHERE brand = 'Lianas Artisan'
  AND name IN (
    'Lianas Chocolate with Fruits & Nuts',
    'Lianas Chocolate with Rice Crisps'
  );

-- 9. MCH Carmela (2 -> 1 card)
UPDATE products
SET
  name = 'MCH Carmela Native Pastries & Kakanin',
  category = 'Bakery & Biscuits',
  admin_notes = '[Variants: Native Pastries & Empanada | Bibingka & Native Kakanin]'
WHERE name = 'MCH Carmela Native Pastries & Empanada' AND brand = 'MCH Carmela';

DELETE FROM products
WHERE brand = 'MCH Carmela'
  AND name = 'MCH Carmela Bibingka & Native Kakanin';

-- 10. MIFAMCO (3 -> 2 cards)
UPDATE products
SET category = 'Food & Beverage'
WHERE name = 'MIFAMCO Tablea 100% Pure Cacao' AND brand = 'MIFAMCO';

UPDATE products
SET
  name = 'MIFAMCO Artisan Dark Chocolate Bars',
  category = 'Food & Beverage',
  admin_notes = '[Variants: 70% Dark Chocolate | 62% Dark Chocolate]'
WHERE name = 'MIFAMCO Dark Chocolate 70%' AND brand = 'MIFAMCO Artisan';

DELETE FROM products
WHERE brand = 'MIFAMCO Artisan'
  AND name = 'MIFAMCO Dark Chocolate 62%';

-- 11. Picker's (3 -> 2 cards)
UPDATE products
SET
  name = 'Picker''s Calamansi Juice Drink',
  category = 'Beverages',
  admin_notes = '[Variants: Ready-to-Drink Bottle | 200ml Stand-Up Pouch]'
WHERE name = 'Picker''s Calamansi Juice Drink Bottle' AND brand = 'Picker''s';

DELETE FROM products
WHERE brand = 'Picker''s'
  AND name = 'Picker''s Calamansi Juice Drink 200ml Pouch';

-- 12. RURU Mushrooms (4 -> 1 card)
UPDATE products
SET
  name = 'RURU De-Oiled Oyster Mushroom Chips 100g',
  category = 'Snacks & Chips',
  admin_notes = '[Variants: Natural Plain | Garlic | Spicy BBQ | Sour Cream]'
WHERE name = 'RURU Natural Plain Mushroom Chips 100g' AND brand = 'RURU Mushrooms';

DELETE FROM products
WHERE brand = 'RURU Mushrooms'
  AND name IN (
    'RURU Garlic Mushroom Chips 100g',
    'RURU Spicy BBQ Mushroom Chips 100g',
    'RURU Sour Cream Mushroom Chips 100g'
  );

COMMIT;
