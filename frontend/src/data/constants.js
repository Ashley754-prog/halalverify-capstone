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

export const ESTABLISHMENT_HALAL_TIERS = [
  {
    id: 'halal_certified',
    label: 'Formally Halal Certified',
    description: 'Holds an unexpired certificate from an accredited body (e.g. IDCP, HDIP, NCMF, JAKIM).',
    badge: 'Certified',
    color: 'emerald',
  },
  {
    id: 'muslim_owned',
    label: 'Muslim-Owned (Pork-Free Kitchen)',
    description: '100% Halal Muslim-owned kitchen, carinderia, or bakery without formal 3rd-party certificate.',
    badge: 'Muslim-Owned',
    color: 'sky',
  },
  {
    id: 'muslim_friendly',
    label: 'Muslim-Friendly Venue',
    description: 'Offers dedicated pork-free / alcohol-free options, or provides prayer space (musalah).',
    badge: 'Friendly',
    color: 'indigo',
  },
  {
    id: 'vegetarian_vegan',
    label: 'Vegetarian / Vegan',
    description: 'Serves zero meat, poultry, or fish, providing suitable dining options for Muslims.',
    badge: 'Plant-Based',
    color: 'teal',
  },
];

export const PRODUCT_HALAL_TIERS = [
  {
    id: 'halal_certified',
    label: 'Halal Certified (Packaging Logo)',
    description: 'Displays an accredited Halal certification seal or registered cert number.',
  },
  {
    id: 'pork_free_declared',
    label: 'Manufacturer Declared Pork-Free',
    description: 'Explicitly labeled pork-free and alcohol-free by the manufacturer.',
  },
  {
    id: 'vegetarian_vegan',
    label: 'Vegetarian / Vegan Product',
    description: 'Plant-based recipe screened free of animal-derived emulsifiers.',
  },
];

export const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('verif') && !s.includes('pending') && !s.includes('unverif') && !s.includes('need') && !s.includes('community')) {
        return {
            key: 'verified',
            label: 'Verified Halal',
            color: '#10b981',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            weight: 1.0,
        };
    }
    if (s.includes('community') || s.includes('muslim_owned') || s.includes('friendly')) {
        return {
            key: 'community',
            label: 'Muslim-Owned / Friendly',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
            weight: 0.8,
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
