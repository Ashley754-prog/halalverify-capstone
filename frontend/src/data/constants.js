export const SYSTEM_TITLE = "HalalVerify";
export const PROPONENTS = ["Cuento, Collen B.", "Mira, Kenneth Q.", "Villanueva, Ashley Nicole N."];
export const JURISDICTION = "Zamboanga City (Ordinance No. 489)";

export const ESTABLISHMENT_TYPES = [
  'Restaurant',
  'Cafeteria / Eatery',
  'Bakery & Pastry',
  'Fast Food',
  'Halal Meat & Poultry Shop',
  'Grocery / Supermarket',
  'Food Processing Facility',
];

export const PRODUCT_CATEGORIES = [
  'Food & Beverage',
  'Processed Meat',
  'Poultry',
  'Canned Seafood',
  'Snacks',
  'Beverages',
  'Instant Noodles',
  'Dairy & Bakery',
  'Condiments & Sauces',
];

export const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('verif') && !s.includes('pending') && !s.includes('unverif') && !s.includes('need')) {
        return {
            key: 'verified',
            label: 'Verified Halal',
            color: '#10b981',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            weight: 1.0,
        };
    }
    if (s.includes('flag') || s.includes('suspend') || s.includes('expir')) {
        return {
            key: 'flagged',
            label: 'Flagged / Suspended',
            color: '#ef4444',
            badgeBg: 'bg-red-50 text-red-700 border-red-200',
            weight: 0.1,
        };
    }
    return {
        key: 'needs_review',
        label: 'Self-Declared / Review',
        color: '#f59e0b',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        weight: 0.5,
    };
};
