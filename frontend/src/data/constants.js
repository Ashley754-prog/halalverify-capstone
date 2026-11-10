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
  'Fast Food & Quick Service',
  'Cafe & Coffee Shop',
  'Bakery & Pastries',
  'Carinderia & Local Eatery',
  'Food Stall & Kiosk',
  'Halal Meat & Poultry Shop',
  'Grocery & Supermarket',
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
    label: 'Halal Certified',
    description: 'Holds an unexpired certificate from an accredited body (e.g. IDCP, HDIP, NCMF, JAKIM).',
    badge: 'Certified',
    color: 'emerald',
  },
  {
    id: 'muslim_owned',
    category: 'community',
    label: 'Muslim-Owned',
    description: '100% Halal Muslim-owned kitchen, carinderia, or bakery without formal 3rd-party certificate.',
    badge: 'Muslim-Owned',
    color: 'sky',
  },
  {
    id: 'muslim_friendly',
    category: 'community',
    label: 'Muslim-Friendly',
    description: 'Offers dedicated pork-free / alcohol-free options, or provides prayer space (musalah).',
    badge: 'Friendly',
    color: 'indigo',
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

    // 1. Terminal unverified or operational lifecycle states ALWAYS take precedence
    if (status.includes('demolish')) {
        return {
            key: 'demolished',
            label: 'Demolished',
            color: '#64748b',
            badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
            weight: 0.0,
        };
    }

    if (status.includes('closed') || status.includes('permanently_closed')) {
        return {
            key: 'permanently_closed',
            label: 'Permanently Closed',
            color: '#64748b',
            badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
            weight: 0.0,
        };
    }

    if (status.includes('relocat') || status.includes('moved')) {
        return {
            key: 'relocated',
            label: 'Relocated / Moved',
            color: '#f97316',
            badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
            weight: 0.2,
        };
    }

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
            key: 'suspended',
            label: 'Suspended',
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
    const tier = (estObj && (estObj.halal_tier || estObj.verification_tier || '')).toLowerCase().trim();

    if (tier === 'muslim_owned' || (!tier && (status === 'muslim_owned' || notes.includes('[tier: muslim_owned]')))) {
        return {
            key: 'muslim_owned',
            label: 'Muslim-Owned',
            color: '#0284c7',
            badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
            weight: 0.9,
        };
    }

    if (tier === 'muslim_friendly' || (!tier && (status === 'muslim_friendly' || notes.includes('[tier: muslim_friendly]')))) {
        return {
            key: 'muslim_friendly',
            label: 'Muslim-Friendly',
            color: '#6366f1',
            badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
            weight: 0.8,
        };
    }

    if (tier === 'vegetarian_vegan' || (!tier && (status === 'vegetarian_vegan' || notes.includes('[tier: vegetarian_vegan]') || notes.includes('plant-based')))) {
        return {
            key: 'vegetarian_vegan',
            label: 'Vegetarian / Vegan',
            color: '#0d9488',
            badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
            weight: 0.8,
        };
    }

    if (tier === 'halal_certified') {
        return {
            key: 'verified',
            label: 'Formally Certified',
            color: '#10b981',
            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            weight: 1.0,
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

const DEFAULT_ZAMBOANGA_LAT = 6.9075;
const DEFAULT_ZAMBOANGA_LNG = 122.0770;

const ZAMBOANGA_COORDINATE_LOOKUP = {
    'don toribio': [6.907671, 122.076997],
    'pasonanca': [6.9520, 122.0720],
    'zone i': [6.9075, 122.0760],
    'zone ii': [6.9100, 122.0730],
    'zone iii': [6.9142, 122.0745],
    'governor alvarez': [6.9142, 122.0745],
    'gov. alvarez': [6.9142, 122.0745],
    'gov alvarez': [6.9142, 122.0745],
    'zone iv': [6.9040, 122.0780],
    'pilar': [6.9040, 122.0780],
    'pettit': [6.9040, 122.0780],
    'canelar': [6.9165, 122.0685],
    'santa maria': [6.9320, 122.0710],
    'sta. maria': [6.9320, 122.0710],
    'sta maria': [6.9320, 122.0710],
    'gov. ramos': [6.9320, 122.0710],
    'gov ramos': [6.9320, 122.0710],
    'galvez': [6.9320, 122.0710],
    'tetuan': [6.9230, 122.0880],
    'baliwasan': [6.9180, 122.0580],
    'san roque': [6.9380, 122.0850],
    'guiwan': [6.9280, 122.0980],
    'tumaga': [6.9390, 122.0670],
    'santa catalina': [6.9120, 122.0870],
    'sta. catalina': [6.9120, 122.0870],
    'sta catalina': [6.9120, 122.0870],
    'lustre': [6.9120, 122.0870],
    'ayala': [6.9600, 121.9600],
    'putik': [6.9400, 122.1100],
    'talon-talon': [6.9020, 122.1050],
    'talon talon': [6.9020, 122.1050],
    'suterville': [6.9150, 122.0490],
    'calarian': [6.9250, 122.0280],
    'divisoria': [6.9530, 122.1380],
    'cabatangan': [6.9380, 122.0550],
    'san jose': [6.9210, 122.0490],
    'sinunuc': [6.9290, 122.0080],
    'recodo': [6.9450, 121.9850],
    'culianan': [6.9610, 122.1580],
    'boalan': [6.9550, 122.1180],
    'mercedes': [6.9680, 122.1390],
    'mampang': [6.9150, 122.1250],
    'veterans': [6.9120, 122.0760],
    'mayor jaldon': [6.9110, 122.0735],
    'jaldon': [6.9110, 122.0735],
    'nuñez': [6.9130, 122.0700],
    'nunez': [6.9130, 122.0700],
    'la purisima': [6.9080, 122.0770],
    'pueblo': [6.9075, 122.0770],
    'kcc': [6.9180, 122.0820],
    'sm mindpro': [6.9090, 122.0740],
    'tugbungan': [6.9235, 122.0940],
    'camino nuevo': [6.9125, 122.0810],
    'santa barbara': [6.9095, 122.0835],
    'sta. barbara': [6.9095, 122.0835],
    'sta barbara': [6.9095, 122.0835],
    'rio hondo': [6.9035, 122.0850],
    'campo islam': [6.9155, 122.0540],
    'cawa-cawa': [6.9115, 122.0630],
    'paseo del mar': [6.9025, 122.0805],
};

/**
 * Resolves GPS latitude and longitude coordinates for an address in Zamboanga City.
 * Queries OpenStreetMap Nominatim first and falls back to the local Zamboanga barangay dictionary.
 */
export const geocodeZamboangaAddress = async (address, city = 'Zamboanga City') => {
    const addrClean = (address || '').trim();
    const cityClean = (city || 'Zamboanga City').trim();
    const addrLower = addrClean.toLowerCase();

    if (addrLower.includes('don toribio')) {
        return { latitude: 6.907671, longitude: 122.076997 };
    }

    if (addrClean) {
        try {
            const query = addrLower.includes('zamboanga')
                ? `${addrClean}, Philippines`
                : `${addrClean}, ${cityClean}, Philippines`;
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(url, {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    if (lat >= 6.80 && lat <= 7.45 && lon >= 121.80 && lon <= 122.45) {
                        return {
                            latitude: Number(lat.toFixed(6)),
                            longitude: Number(lon.toFixed(6)),
                        };
                    }
                }
            }
        } catch {
            // Fall back to curated Zamboanga City barangay dictionary
        }
    }

    let baseLat = DEFAULT_ZAMBOANGA_LAT;
    let baseLng = DEFAULT_ZAMBOANGA_LNG;

    for (const [key, [kLat, kLng]] of Object.entries(ZAMBOANGA_COORDINATE_LOOKUP)) {
        if (addrLower.includes(key)) {
            baseLat = kLat;
            baseLng = kLng;
            break;
        }
    }

    return {
        latitude: Number(baseLat.toFixed(6)),
        longitude: Number(baseLng.toFixed(6)),
    };
};
