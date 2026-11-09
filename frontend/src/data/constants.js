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
  'tetuan', 'tugbungan', 'guiwan', 'putik',
  'divisoria', 'boalan', 'zambowood', 'lumbangan', 'lunzuran',
  'pasobolong', 'salaan', 'cabaluay', 'cacao', 'mercedes',
  'taluksangay', 'culianan', 'guisao', 'lanzones', 'victoria',
  'bolong', 'manicahan', 'bunguiao', 'sangali', 'curuan',
  'quiniput', 'vitali', 'licomo', 'mampang', 'talon-talon', 'talon talon',
  'kasanyangan', 'arena blanco', 'tupilac', 'tigtabon', 'buenavista',
  'sta. catalina', 'sta catalina', 'santa catalina', 'lustre st',
];

const DISTRICT_1_KEYWORDS = [
  'district 1', 'district i', 'west coast',
  'zone i', 'zone ii', 'zone iii', 'zone iv', 'zone 1', 'zone 2', 'zone 3', 'zone 4',
  'poblacion', 'downtown', 'la purisima', 'mindpro', 'gov. lim', 'gov lim',
  'jaldon', 'canelar', 'sta. maria', 'sta maria', 'santa maria', 'pasonanca',
  'tumaga', 'san jose cawa', 'san jose gusu', 'cawa-cawa', 'baliwasan',
  'san roque', 'suterville', 'campo islam', 'mariki', 'rio hondo',
  'sta. barbara', 'sta barbara', 'santa barbara',
  'calarian', 'sinunuc', 'maasin', 'cawit', 'recodo', 'ayala',
  'talisayan', 'pamucutan', 'baluno', 'patalon', 'labuan', 'limpapa',
  'malagutay', 'tulungatung', 'upper calarian', 'southcom', 'pilar st',
  'valderrosa', 'valderosa', 'paseo del mar', 'lantaka', 'fort pilar', 'plaza pershing',
  'camino nuevo', 'kcc',
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
    let status = '';
    let notes = '';
    let estObj = null;

    if (statusOrEst && typeof statusOrEst === 'object') {
        estObj = statusOrEst;
        status = (statusOrEst.halal_status || statusOrEst.status || '').toLowerCase().trim();
        notes = (statusOrEst.admin_notes || statusOrEst.notes || statusOrEst.description || '').toLowerCase();
    } else {
        status = (statusOrEst || '').toLowerCase().trim();
        notes = (rawNotes || '').toLowerCase();
    }

    // 1. Terminal unverified states ALWAYS take precedence
    if (status === 'rejected' || status.includes('reject')) {
        return {
            key: 'rejected',
            label: 'Rejected',
            color: '#ef4444',
            badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
            weight: 0.0,
        };
    }

    if (status.includes('flag') || status.includes('suspend') || status.includes('expir')) {
        return {
            key: 'flagged',
            label: 'Flagged / Suspended',
            color: '#ef4444',
            badgeBg: 'bg-red-50 text-red-700 border-red-200',
            weight: 0.1,
        };
    }

    // 2. Pending review submissions MUST NEVER be treated as verified
    if (
        status === 'needs_review' ||
        status === 'pending' ||
        status === 'pending_review' ||
        status.includes('pending') ||
        status.includes('needs_review') ||
        status.includes('unverif')
    ) {
        return {
            key: 'needs_review',
            label: 'Under Review',
            color: '#f59e0b',
            badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
            weight: 0.5,
        };
    }

    // 3. For verified records (halal_status='verified', 'halal', or explicit verified tier), resolve tier:
    const tier = (estObj && (estObj.halal_tier || estObj.verification_tier || '')).toLowerCase();

    if (tier === 'muslim_owned' || status === 'muslim_owned' || notes.includes('[tier: muslim_owned]')) {
        return {
            key: 'muslim_owned',
            label: 'Muslim-Owned',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
            weight: 0.9,
        };
    }

    if (tier === 'muslim_friendly' || status === 'muslim_friendly' || notes.includes('[tier: muslim_friendly]')) {
        return {
            key: 'muslim_friendly',
            label: 'Muslim-Friendly',
            color: '#6366f1',
            badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
            weight: 0.8,
        };
    }

    if (tier === 'vegetarian_vegan' || status === 'vegetarian_vegan' || notes.includes('[tier: vegetarian_vegan]') || notes.includes('plant-based')) {
        return {
            key: 'vegetarian_vegan',
            label: 'Vegetarian / Vegan',
            color: '#0d9488',
            badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
            weight: 0.8,
        };
    }

    if (notes.includes('community listed - muslim-owned') || notes.includes('muslim-owned')) {
        return {
            key: 'muslim_owned',
            label: 'Muslim-Owned',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
            weight: 0.9,
        };
    }

    if (notes.includes('community listed - muslim-friendly') || notes.includes('muslim-friendly')) {
        return {
            key: 'muslim_friendly',
            label: 'Muslim-Friendly',
            color: '#6366f1',
            badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
            weight: 0.8,
        };
    }

    if (notes.includes('community listed - vegetarian') || notes.includes('vegetarian')) {
        return {
            key: 'vegetarian_vegan',
            label: 'Vegetarian / Vegan',
            color: '#0d9488',
            badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
            weight: 0.8,
        };
    }

    if (status.includes('community') || notes.includes('community listed')) {
        return {
            key: 'community',
            label: 'Muslim-Owned / Community',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
            weight: 0.8,
        };
    }

    if (status.includes('verif') || status === 'halal' || tier === 'halal_certified') {
        return {
            key: 'verified',
            label: 'Formally Certified',
            color: '#10b981',
            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            weight: 1.0,
        };
    }

    return {
        key: 'needs_review',
        label: 'Under Review',
        color: '#f59e0b',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        weight: 0.5,
    };
};

export const LOCAL_ESTABLISHMENT_PHOTOS = {
    'Al Halal Grill': '/establishments/al-halal-grill.jpg',
    'Resto & Grill Al Halal': '/establishments/al-halal-grill.jpg',
    'Aldznisa Halal Food': '/establishments/aldznisa-halal-food.jpg',
    "Andy's Satti": '/establishments/andys-satti.jpg',
    'Andys Satti': '/establishments/andys-satti.jpg',
    'AntiEns Home of Authentic Muslim Cuisine': '/establishments/antiens.jpg',
    'AntiEns': '/establishments/antiens.jpg',
    'Antiens': '/establishments/antiens.jpg',
    'Bambas by Chef Mick': '/establishments/bambas-by-chef-mick.jpg',
    'Bambas': '/establishments/bambas-by-chef-mick.jpg',
    'Bandit Burger': '/establishments/bandit-burger.jpg',
    'Bandit': '/establishments/bandit-burger.jpg',
    'Bay Tal Mal Restaurant Zamboanga City': '/establishments/bay-tal-mal.jpg',
    'Bay Tal Mal': '/establishments/bay-tal-mal.jpg',
    'Black Plate Zamboanga': '/establishments/black-plate.jpg',
    'Black Plate': '/establishments/black-plate.jpg',
    "Chick N' Cow Hotpot": '/establishments/chick-n-cow.jpg',
    "Chick N' Cow": '/establishments/chick-n-cow.jpg',
    "Chick n Cow": '/establishments/chick-n-cow.jpg',
    'Dennis Coffee Garden - Pilar Street': '/establishments/dennis-coffee-pilar.jpg',
    'Dennis Coffee Garden Pilar Street': '/establishments/dennis-coffee-pilar.jpg',
    'Dennis Coffee Garden - KCC Mall': '/establishments/dennis-coffee-kcc.jpg',
    'Dennis Coffee Garden KCC': '/establishments/dennis-coffee-kcc.jpg',
    'Dennis Coffee Garden - Yubenco Tetuan': '/establishments/dennis-coffee-yubenco.jpg',
    'Dennis Coffee Garden Yubenco Tetuan': '/establishments/dennis-coffee-yubenco.jpg',
    'Dennis Coffee Garden': '/establishments/dennis-coffee-garden.jpg',
    'Dennis Coffee': '/establishments/dennis-coffee-garden.jpg',
    'Fourbzz': '/establishments/fourbzz.jpg',
    'Fourbzz Park': '/establishments/fourbzz.jpg',
    'Global Pot Restaurant & Catering - Tetuan': '/establishments/global-pot-tetuan.jpg',
    'Global Pot Tetuan': '/establishments/global-pot-tetuan.jpg',
    'Global Pot Restaurant & Catering - KCC Mall': '/establishments/global-pot.jpg',
    'Global Pot Restaurant & Catering': '/establishments/global-pot.jpg',
    'Global Pot': '/establishments/global-pot.jpg',
    'GORS Halal Cuisine': '/establishments/gors-halal-cuisine.jpg',
    'Gors Halal Cuisine': '/establishments/gors-halal-cuisine.jpg',
    'Gors Halal Cuisine (Asinan)': '/establishments/gors-asinan.jpg',
    'GORS': '/establishments/gors-halal-cuisine.jpg',
    'Gors': '/establishments/gors-halal-cuisine.jpg',
    'Halal Habit': '/establishments/halal-habit.jpg',
    'Halal Habits': '/establishments/halal-habit.jpg',
    'Halal Siotea': '/establishments/halal-siotea.jpg',
    'Siotea': '/establishments/halal-siotea.jpg',
    'IYA Coffee CafeResto - Lantaka (24/7)': '/establishments/iya-coffee-lantaka.jpg',
    'IYA Coffee CafeResto - Lantaka': '/establishments/iya-coffee-lantaka.jpg',
    'IYA Coffee Lantaka': '/establishments/iya-coffee-lantaka.jpg',
    'IYA Coffee CafeResto - Tetuan': '/establishments/iya-coffee-tetuan.jpg',
    'IYA Coffee Tetuan': '/establishments/iya-coffee-tetuan.jpg',
    'IYA Coffee': '/establishments/iya-coffee-lantaka.jpg',
    'IYA Coffee CafeResto': '/establishments/iya-coffee-lantaka.jpg',
    "Jimmy's Satti Food Haus": '/establishments/jimmys-satti.jpg',
    "Jimmy's Satti Haus": '/establishments/jimmys-satti.jpg',
    "Jimmy's Satti Food House": '/establishments/jimmys-satti.jpg',
    "Jimmy's Satti": '/establishments/jimmys-satti.jpg',
    'JL Halal BBQ': '/establishments/jl-halal-bbq.jpg',
    'JL Halal': '/establishments/jl-halal-bbq.jpg',
    "Johnny's Morning Sun Satti": '/establishments/johnnys-morning-sun-satti.jpg',
    "Johnnys Morning Sun Satti": '/establishments/johnnys-morning-sun-satti.jpg',
    'Morning Sun Satti': '/establishments/johnnys-morning-sun-satti.jpg',
    'Malaysian Steamboat Seafood (Tausug Restaurant)': '/establishments/malaysian-steamboat.jpg',
    'Malaysian Steamboat Seafood': '/establishments/malaysian-steamboat.jpg',
    'Malaysian Steamboat': '/establishments/malaysian-steamboat.jpg',
    "Mamang's Greasy Spoon": '/establishments/mamangs-greasy-spoon.jpg',
    'Mamangs Greasy Spoon': '/establishments/mamangs-greasy-spoon.jpg',
    'Mamang’s Greasy Spoon': '/establishments/mamangs-greasy-spoon.jpg',
    "Mamang's": '/establishments/mamangs-greasy-spoon.jpg',
    'Mamangs': '/establishments/mamangs-greasy-spoon.jpg',
    'Nashville Hot Chicken by Damban (Halal)': '/establishments/nashville-hot-chicken-damban.jpg',
    'Nashville Hot Chicken by Damban': '/establishments/nashville-hot-chicken-damban.jpg',
    'Nashville Hot Chicken': '/establishments/nashville-hot-chicken-damban.jpg',
    'Damban': '/establishments/nashville-hot-chicken-damban.jpg',
    'My Halal Kitchen': '/establishments/my-halal-kitchen.jpg',
    'RanaoRagat Restaurant': '/establishments/ranaoragat.jpg',
    'Ranao Ragat Restaurant': '/establishments/ranaoragat.jpg',
    'RanaoRagat': '/establishments/ranaoragat.jpg',
    'Ranao Ragat': '/establishments/ranaoragat.jpg',
    'Royalle Chillie Restaurant': '/establishments/royalle-chillie.jpg',
    'Royalle Chillie': '/establishments/royalle-chillie.jpg',
    'Chillies': '/establishments/royalle-chillie.jpg',
    'Chillie': '/establishments/royalle-chillie.jpg',
    "Sam's Lebanese Delights": '/establishments/sams-lebanese-delights.jpg',
    'Sams Lebanese Delights': '/establishments/sams-lebanese-delights.jpg',
    'Sam’s Lebanese Delights': '/establishments/sams-lebanese-delights.jpg',
    "Sam's Lebanese Delight Restaurant": '/establishments/sams-lebanese-delights.jpg',
    'Sam’s Lebanese Delight Restaurant': '/establishments/sams-lebanese-delights.jpg',
    'Sams Lebanese Delight Restaurant': '/establishments/sams-lebanese-delights.jpg',
    'Lebanese Delights': '/establishments/sams-lebanese-delights.jpg',
    "Sugnaw's Kitchen": '/establishments/sugnaws-kitchen.jpg',
    "Sugnaws Kitchen": '/establishments/sugnaws-kitchen.jpg',
    'Sugnaw’s Kitchen': '/establishments/sugnaws-kitchen.jpg',
    'Sugnaw': '/establishments/sugnaws-kitchen.jpg',
    'TAAM Halal Pizza': '/establishments/taam-halal-pizza.jpg',
    'Taam Halal Pizza': '/establishments/taam-halal-pizza.jpg',
    "Ta'am Halal Pizza": '/establishments/taam-halal-pizza.jpg',
    'Taam': '/establishments/taam-halal-pizza.jpg',
    "Ta'am": '/establishments/taam-halal-pizza.jpg',
    'Turkish Grille Plus': '/establishments/turkish-grille-plus.jpg',
    'Turkish Grille': '/establishments/turkish-grille-plus.jpg',
    'Turkish Grill': '/establishments/turkish-grille-plus.jpg',
};

export const getEstablishmentPhoto = (establishment) => {
    if (!establishment) return null;
    const name = establishment.name || '';
    if (LOCAL_ESTABLISHMENT_PHOTOS[name]) {
        return LOCAL_ESTABLISHMENT_PHOTOS[name];
    }
    const lower = name.toLowerCase();
    for (const [key, path] of Object.entries(LOCAL_ESTABLISHMENT_PHOTOS)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
            return path;
        }
    }
    return null;
};
