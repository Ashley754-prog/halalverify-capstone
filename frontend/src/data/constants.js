export const SYSTEM_TITLE = "HalalVerify";
export const PROPONENTS = ["Cuento, Collen B.", "Mira, Kenneth Q.", "Villanueva, Ashley Nicole N."];
export const JURISDICTION = "Zamboanga City (Ordinance No. 489)";

export const ZAMBOANGA_DISTRICTS = [
  { id: 'all', label: 'All Zamboanga Districts' },
  { id: 'district_1', label: 'District 1 (West Coast & Downtown)', shortLabel: 'District 1 (West/Downtown)' },
  { id: 'district_2', label: 'District 2 (East Coast)', shortLabel: 'District 2 (East Coast)' },
];

const DISTRICT_2_KEYWORDS = [
  'district 2', 'district ii', 'east coast',
  'tetuan', 'kcc', 'camino nuevo', 'tugbungan', 'guiwan', 'putik',
  'divisoria', 'boalan', 'zambowood', 'lumbangan', 'lunzuran',
  'pasobolong', 'salaan', 'cabaluay', 'cacao', 'mercedes',
  'taluksangay', 'culianan', 'guisao', 'lanzones', 'victoria',
  'bolong', 'manicahan', 'bunguiao', 'sangali', 'curuan',
  'quiniput', 'vitali', 'licomo', 'mampang', 'talon-talon', 'talon talon',
  'kasanyangan', 'arena blanco', 'tupilac', 'tigtabon', 'buenavista',
];

const DISTRICT_1_KEYWORDS = [
  'district 1', 'district i', 'west coast',
  'zone i', 'zone ii', 'zone iii', 'zone iv', 'zone 1', 'zone 2', 'zone 3', 'zone 4',
  'poblacion', 'downtown', 'la purisima', 'mindpro', 'gov. lim', 'gov lim',
  'jaldon', 'canelar', 'sta. maria', 'sta maria', 'santa maria', 'pasonanca',
  'tumaga', 'san jose cawa', 'san jose gusu', 'cawa-cawa', 'baliwasan',
  'san roque', 'suterville', 'campo islam', 'mariki', 'rio hondo',
  'sta. barbara', 'sta barbara', 'santa barbara', 'sta. catalina', 'santa catalina',
  'calarian', 'sinunuc', 'maasin', 'cawit', 'recodo', 'ayala',
  'talisayan', 'pamucutan', 'baluno', 'patalon', 'labuan', 'limpapa',
  'malagutay', 'tulungatung', 'upper calarian', 'southcom', 'pilar st', 'valderrosa',
];

/**
 * Classifies an establishment or product into Zamboanga City Legislative District 1 or District 2.
 */
export const resolveZamboangaDistrict = (itemOrAddress, fallbackLng = null) => {
  let text;
  let lng = fallbackLng;

  if (itemOrAddress && typeof itemOrAddress === 'object') {
    text = [
      itemOrAddress.address,
      itemOrAddress.name,
      itemOrAddress.description,
      itemOrAddress.city,
      itemOrAddress.brand,
      itemOrAddress.source,
      itemOrAddress.admin_notes,
      itemOrAddress.establishments?.address,
      itemOrAddress.establishments?.name,
      itemOrAddress.manufacturers?.address,
      itemOrAddress.manufacturers?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (lng === null || lng === undefined) {
      lng = itemOrAddress.longitude ?? itemOrAddress.establishments?.longitude ?? null;
    }
  } else {
    text = String(itemOrAddress || '').toLowerCase();
  }

  for (const kw of DISTRICT_2_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        id: 'district_2',
        label: 'District 2 (East Coast)',
        shortLabel: 'District 2',
        badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
      };
    }
  }

  for (const kw of DISTRICT_1_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        id: 'district_1',
        label: 'District 1 (West / Downtown)',
        shortLabel: 'District 1',
        badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      };
    }
  }

  if (lng !== null && lng !== undefined && !Number.isNaN(Number(lng))) {
    if (Number(lng) >= 122.0785) {
      return {
        id: 'district_2',
        label: 'District 2 (East Coast)',
        shortLabel: 'District 2',
        badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
      };
    }
    return {
      id: 'district_1',
      label: 'District 1 (West / Downtown)',
      shortLabel: 'District 1',
      badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    };
  }

  if (text.includes('zamboanga') || text.includes('zampen') || text.includes('satti') || text.includes('tausug')) {
    return {
      id: 'district_1',
      label: 'District 1 (West / Downtown)',
      shortLabel: 'District 1',
      badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    };
  }

  return {
    id: 'commercial',
    label: 'National / Commercial',
    shortLabel: 'National Catalog',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  };
};

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
    let status;
    let notes;

    if (statusOrEst && typeof statusOrEst === 'object') {
        status = statusOrEst.halal_status || statusOrEst.status || '';
        notes = statusOrEst.admin_notes || statusOrEst.notes || '';
        if (statusOrEst.halal_tier === 'halal_certified' && (statusOrEst.certificate_number || (status && status.toLowerCase() === 'verified'))) {
            return {
                key: 'verified',
                label: 'Formally Certified',
                color: '#10b981',
                badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                weight: 1.0,
            };
        }
        if (statusOrEst.halal_tier === 'muslim_owned') {
            return {
                key: 'muslim_owned',
                label: 'Muslim-Owned',
                color: '#0284c7',
                badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
                weight: 0.9,
            };
        }
        if (statusOrEst.halal_tier === 'muslim_friendly') {
            return {
                key: 'muslim_friendly',
                label: 'Muslim-Friendly',
                color: '#6366f1',
                badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                weight: 0.8,
            };
        }
        if (statusOrEst.halal_tier === 'vegetarian_vegan') {
            return {
                key: 'vegetarian_vegan',
                label: 'Vegetarian / Vegan',
                color: '#0d9488',
                badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
                weight: 0.8,
            };
        }
    } else {
        status = statusOrEst || '';
        notes = rawNotes || '';
    }

    const s = status.toLowerCase();
    const n = notes.toLowerCase();

    // Check for community tiers first (stored with halal_status='verified' but specified in admin_notes)
    if (s === 'muslim_owned' || s.includes('muslim_owned') || n.includes('muslim-owned') || n.includes('muslim_owned')) {
        return {
            key: 'muslim_owned',
            label: 'Muslim-Owned',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
            weight: 0.9,
        };
    }
    if (s === 'muslim_friendly' || s.includes('muslim_friendly') || n.includes('muslim-friendly')) {
        return {
            key: 'muslim_friendly',
            label: 'Muslim-Friendly',
            color: '#6366f1',
            badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
            weight: 0.8,
        };
    }
    if (s === 'vegetarian_vegan' || s.includes('vegetarian') || s.includes('vegan') || n.includes('vegetarian') || n.includes('plant-based')) {
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
