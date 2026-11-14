-- =============================================================================
-- Migration 013: Consolidate 2K Peanuts 300g Variant Cards
-- Consolidates the 3 2K Peanuts flavor/style pouches into 1 parent card
-- ("2K Peanuts 300g") with searchable variants in products.admin_notes
-- while retaining HC-029 (expiring 2026-11-20) and Supabase Storage image.
-- =============================================================================

BEGIN;

UPDATE products
SET
  name = '2K Peanuts 300g',
  category = 'Snacks & Chips',
  admin_notes = '[Variants: Salted Brown | Spicy Garlic Brown | Spicy Garlic Skinless]'
WHERE name = '2K Salted Brown Peanuts 300g' AND brand = '2K Peanuts';

DELETE FROM products
WHERE brand = '2K Peanuts'
  AND name IN (
    '2K Spicy Garlic Brown Peanuts 300g',
    '2K Spicy Garlic Skinless Peanuts 300g'
  );

COMMIT;
