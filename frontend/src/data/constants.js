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
  'Spices & Seasonings',
  'Bakery & Biscuits',
  'Dairy & Milk',
  'Cooking Oils & Fats',
  'Condiments & Sauces',
  'Canned Fish & Meat',
  'Beverages',
  'Instant Noodles & Pasta',
  'Snacks & Chips',
  'Dressings & Mayonnaise',
  'Fresh & Farm Produce',
  'Personal Care & Household',
  'Restaurant & Catering Menu',
];

export const ESTABLISHMENT_HALAL_TIERS = [
  {
    id: 'halal_certified',
    category: 'institutional',
    label: 'Formally Halal Certified',
    description: 'Holds an unexpired certificate from an accredited body (e.g. IDCP, HDIP, NCMF, JAKIM).',
    badge: 'Certified',
    color: 'emerald',
  },
  {
    id: 'muslim_owned',
    category: 'community',
    label: 'Muslim-Owned (Pork-Free Kitchen)',
    description: '100% Halal Muslim-owned kitchen, carinderia, or bakery without formal 3rd-party certificate.',
    badge: 'Muslim-Owned',
    color: 'sky',
  },
  {
    id: 'muslim_friendly',
    category: 'community',
    label: 'Muslim-Friendly Venue',
    description: 'Offers dedicated pork-free / alcohol-free options, or provides prayer space (musalah).',
    badge: 'Friendly',
    color: 'indigo',
  },
  {
    id: 'vegetarian_vegan',
    category: 'community',
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
    badge: 'Certified',
    color: 'emerald',
  },
  {
    id: 'pork_free_declared',
    label: 'Manufacturer Declared Pork-Free',
    description: 'Explicitly labeled pork-free and alcohol-free by the manufacturer.',
    badge: 'Pork-Free',
    color: 'sky',
  },
  {
    id: 'vegetarian_vegan',
    label: 'Vegetarian / Vegan Product',
    description: 'Plant-based recipe screened free of animal-derived emulsifiers.',
    badge: 'Plant-Based',
    color: 'teal',
  },
];

export const getStatusConfig = (statusOrEst, rawNotes = '') => {
    let status = '';
    let notes = '';

    if (statusOrEst && typeof statusOrEst === 'object') {
        status = statusOrEst.halal_status || statusOrEst.status || '';
        notes = statusOrEst.admin_notes || statusOrEst.notes || '';
    } else {
        status = statusOrEst || '';
        notes = rawNotes || '';
    }

    const s = status.toLowerCase();
    const n = notes.toLowerCase();

    // Check for community tiers first (stored with halal_status='verified' but specified in admin_notes)
    if (s.includes('muslim_owned') || n.includes('muslim-owned') || n.includes('muslim_owned')) {
        return {
            key: 'muslim_owned',
            label: 'Muslim-Owned',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
            weight: 0.9,
        };
    }
    if (s.includes('friendly') || n.includes('muslim-friendly') || n.includes('muslim_friendly')) {
        return {
            key: 'muslim_friendly',
            label: 'Muslim-Friendly',
            color: '#6366f1',
            badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
            weight: 0.8,
        };
    }
    if (s.includes('veg') || n.includes('vegetarian') || n.includes('plant-based')) {
        return {
            key: 'vegetarian_vegan',
            label: 'Vegetarian / Vegan',
            color: '#0d9488',
            badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
            weight: 0.8,
        };
    }
    if (s.includes('community') || n.includes('community listed')) {
        return {
            key: 'community',
            label: 'Muslim-Owned / Community',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
            weight: 0.8,
        };
    }
    if (s.includes('verif') && !s.includes('pending') && !s.includes('unverif') && !s.includes('need')) {
        return {
            key: 'verified',
            label: 'Formally Certified',
            color: '#10b981',
            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            weight: 1.0,
        };
    }
    if (s.includes('flag') || s.includes('suspend') || s.includes('expir') || s.includes('reject')) {
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
