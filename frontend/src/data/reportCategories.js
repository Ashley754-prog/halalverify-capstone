export const CATEGORIES_BY_TARGET = {
  establishment_certified: [
    'Expired, Fake, or Questionable Halal Certificate',
    'Permanently Closed or Relocated',
    'Incorrect Address, Map Pin, or Phone',
    'Pork or Alcohol Detected on Premises',
    'Suspected Cross-Contamination or Storage Issue',
    'Duplicate Establishment Listing',
    'Other',
  ],
  establishment_community: [
    'Permanently Closed or Relocated',
    'Incorrect Address, Map Pin, or Phone',
    'Pork or Alcohol Detected on Premises',
    'Suspected Cross-Contamination or Storage Issue',
    'Misleading Halal / Muslim-Friendly Claim',
    'Duplicate Establishment Listing',
    'Other',
  ],
  product: [
    'Prohibited or Non-Halal Ingredient / E-Number Detected',
    'Counterfeit or Unaccredited Halal Seal',
    'Incorrect Product Details or Ingredients List',
    'Product Discontinued or Recalled',
    'Duplicate Product Listing',
    'Other',
  ],
  scanner: [
    'Safe Ingredient Falsely Flagged as Haram',
    'Haram Ingredient Missed by Scanner',
    'Text Recognition / Image Crop Failure',
    'Other',
  ],
};

export function getCategoriesForTarget(relatedTo, halalTier) {
  if (relatedTo === 'product') return CATEGORIES_BY_TARGET.product;
  if (relatedTo === 'scanner') return CATEGORIES_BY_TARGET.scanner;
  const tierLower = String(halalTier || '').toLowerCase();
  const isCertified = tierLower.includes('cert') || tierLower === 'halal_certified' || tierLower === 'certified';
  return isCertified ? CATEGORIES_BY_TARGET.establishment_certified : CATEGORIES_BY_TARGET.establishment_community;
}
