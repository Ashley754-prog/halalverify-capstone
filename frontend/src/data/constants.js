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
  let primaryAddressText = '';

  if (itemOrAddress && typeof itemOrAddress === 'object') {
    primaryAddressText = [
      itemOrAddress.barangay,
      itemOrAddress.address,
      itemOrAddress.establishments?.address,
      itemOrAddress.manufacturers?.address,
    ]
      .filter(Boolean)
      .join(', ');
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
    primaryAddressText = String(itemOrAddress || '');
    text = primaryAddressText.toLowerCase();
  }

  const explicitBrgy = findZamboangaBarangay(primaryAddressText, false);
  if (explicitBrgy) {
    if (explicitBrgy.district === 'district_2') {
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

export const ZAMBOANGA_BARANGAYS = [
    // District 1 (West Coast & Downtown)
    { name: 'Ayala', district: 'district_1', lat: 6.9686, lng: 121.9467, aliases: ['ayala'] },
    { name: 'Baliwasan', district: 'district_1', lat: 6.9159, lng: 122.0598, aliases: ['baliwasan'] },
    { name: 'Baluno', district: 'district_1', lat: 6.9680, lng: 122.0250, aliases: ['baluno'] },
    { name: 'Cabatangan', district: 'district_1', lat: 6.9398, lng: 122.0582, aliases: ['cabatangan', 'lower cabatangan', 'upper cabatangan'] },
    { name: 'Calarian', district: 'district_1', lat: 6.9250, lng: 122.0280, aliases: ['calarian', 'upper calarian', 'southcom'] },
    { name: 'Camino Nuevo', district: 'district_1', lat: 6.9180, lng: 122.0735, aliases: ['camino nuevo'] },
    { name: 'Campo Islam', district: 'district_1', lat: 6.9155, lng: 122.0540, aliases: ['campo islam'] },
    { name: 'Canelar', district: 'district_1', lat: 6.9165, lng: 122.0685, aliases: ['canelar'] },
    { name: 'Cawit', district: 'district_1', lat: 6.9530, lng: 121.9690, aliases: ['cawit'] },
    { name: 'La Paz', district: 'district_1', lat: 7.0150, lng: 121.9750, aliases: ['la paz'] },
    { name: 'Labuan', district: 'district_1', lat: 7.0980, lng: 121.9040, aliases: ['labuan'] },
    { name: 'Limpapa', district: 'district_1', lat: 7.1450, lng: 121.9050, aliases: ['limpapa'] },
    { name: 'Maasin', district: 'district_1', lat: 6.9590, lng: 121.9810, aliases: ['maasin'] },
    { name: 'Malagutay', district: 'district_1', lat: 6.9350, lng: 122.0430, aliases: ['malagutay'] },
    { name: 'Mariki', district: 'district_1', lat: 6.9030, lng: 122.0885, aliases: ['mariki'] },
    { name: 'Pamucutan', district: 'district_1', lat: 6.9920, lng: 121.9620, aliases: ['pamucutan'] },
    { name: 'Pasonanca', district: 'district_1', lat: 6.9482, lng: 122.0725, aliases: ['pasonanca'] },
    { name: 'Patalon', district: 'district_1', lat: 7.0480, lng: 121.9210, aliases: ['patalon'] },
    { name: 'Recodo', district: 'district_1', lat: 6.9450, lng: 121.9850, aliases: ['recodo'] },
    { name: 'Rio Hondo', district: 'district_1', lat: 6.9035, lng: 122.0850, aliases: ['rio hondo'] },
    { name: 'San Jose Cawa-Cawa', district: 'district_1', lat: 6.9140, lng: 122.0645, aliases: ['san jose cawa-cawa', 'san jose cawa cawa', 'san jose cawa', 'cawa-cawa', 'cawa cawa'] },
    { name: 'San Jose Gusu', district: 'district_1', lat: 6.9175, lng: 122.0495, aliases: ['san jose gusu'] },
    { name: 'San Roque', district: 'district_1', lat: 6.9380, lng: 122.0520, aliases: ['san roque'] },
    { name: 'Sinunuc', district: 'district_1', lat: 6.9290, lng: 122.0080, aliases: ['sinunuc'] },
    { name: 'Sta. Barbara', district: 'district_1', lat: 6.9095, lng: 122.0835, aliases: ['sta. barbara', 'sta barbara', 'santa barbara'] },
    { name: 'Sta. Maria', district: 'district_1', lat: 6.9320, lng: 122.0710, aliases: ['sta. maria', 'sta maria', 'santa maria'] },
    { name: 'Sto. Niño', district: 'district_1', lat: 6.9115, lng: 122.0665, aliases: ['sto. niño', 'sto nino', 'santo niño', 'santo nino'] },
    { name: 'Suterville', district: 'district_1', lat: 6.9150, lng: 122.0520, aliases: ['suterville'] },
    { name: 'Talisayan', district: 'district_1', lat: 6.9820, lng: 121.9320, aliases: ['talisayan'] },
    { name: 'Tulungatung', district: 'district_1', lat: 6.9680, lng: 121.9690, aliases: ['tulungatung'] },
    { name: 'Tumaga', district: 'district_1', lat: 6.9390, lng: 122.0785, aliases: ['tumaga'] },
    { name: 'Zone I', district: 'district_1', lat: 6.9075, lng: 122.0745, aliases: ['zone i', 'zone 1', 'barangay zone i', 'brgy. zone i'] },
    { name: 'Zone II', district: 'district_1', lat: 6.9100, lng: 122.0730, aliases: ['zone ii', 'zone 2', 'barangay zone ii', 'brgy. zone ii'] },
    { name: 'Zone III', district: 'district_1', lat: 6.9090, lng: 122.0755, aliases: ['zone iii', 'zone 3', 'barangay zone iii', 'brgy. zone iii'] },
    { name: 'Zone IV', district: 'district_1', lat: 6.9049, lng: 122.0788, aliases: ['zone iv', 'zone 4', 'barangay zone iv', 'brgy. zone iv'] },

    // District 2 (East Coast)
    { name: 'Arena Blanco', district: 'district_2', lat: 6.9135, lng: 122.1320, aliases: ['arena blanco'] },
    { name: 'Boalan', district: 'district_2', lat: 6.9550, lng: 122.1180, aliases: ['boalan'] },
    { name: 'Bolong', district: 'district_2', lat: 7.0880, lng: 122.2350, aliases: ['bolong'] },
    { name: 'Buenavista', district: 'district_2', lat: 7.1680, lng: 122.2650, aliases: ['buenavista'] },
    { name: 'Bunguiao', district: 'district_2', lat: 7.0550, lng: 122.1950, aliases: ['bunguiao'] },
    { name: 'Cabaluay', district: 'district_2', lat: 6.9920, lng: 122.1650, aliases: ['cabaluay'] },
    { name: 'Cacao', district: 'district_2', lat: 6.9750, lng: 122.1250, aliases: ['cacao'] },
    { name: 'Culianan', district: 'district_2', lat: 6.9680, lng: 122.1480, aliases: ['culianan'] },
    { name: 'Curuan', district: 'district_2', lat: 7.2050, lng: 122.2450, aliases: ['curuan'] },
    { name: 'Divisoria', district: 'district_2', lat: 6.9530, lng: 122.1320, aliases: ['divisoria'] },
    { name: 'Guisao', district: 'district_2', lat: 6.9850, lng: 122.1550, aliases: ['guisao'] },
    { name: 'Guiwan', district: 'district_2', lat: 6.9280, lng: 122.0980, aliases: ['guiwan'] },
    { name: 'Kasanyangan', district: 'district_2', lat: 6.9094, lng: 122.0978, aliases: ['kasanyangan'] },
    { name: 'Lanzones', district: 'district_2', lat: 7.0050, lng: 122.1680, aliases: ['lanzones'] },
    { name: 'Licomo', district: 'district_2', lat: 7.3250, lng: 122.2950, aliases: ['licomo'] },
    { name: 'Lumbangan', district: 'district_2', lat: 6.9480, lng: 122.1050, aliases: ['lumbangan'] },
    { name: 'Lunzuran', district: 'district_2', lat: 6.9580, lng: 122.0920, aliases: ['lunzuran'] },
    { name: 'Mampang', district: 'district_2', lat: 6.9150, lng: 122.1250, aliases: ['mampang'] },
    { name: 'Manicahan', district: 'district_2', lat: 7.0250, lng: 122.1920, aliases: ['manicahan'] },
    { name: 'Mercedes', district: 'district_2', lat: 6.9680, lng: 122.1390, aliases: ['mercedes'] },
    { name: 'Pasobolong', district: 'district_2', lat: 6.9620, lng: 122.1280, aliases: ['pasobolong'] },
    { name: 'Putik', district: 'district_2', lat: 6.9409, lng: 122.1025, aliases: ['putik'] },
    { name: 'Quiniput', district: 'district_2', lat: 7.1850, lng: 122.2680, aliases: ['quiniput'] },
    { name: 'Salaan', district: 'district_2', lat: 6.9720, lng: 122.1120, aliases: ['salaan'] },
    { name: 'Sangali', district: 'district_2', lat: 7.0720, lng: 122.2120, aliases: ['sangali'] },
    { name: 'Sta. Catalina', district: 'district_2', lat: 6.9120, lng: 122.0870, aliases: ['sta. catalina', 'sta catalina', 'santa catalina'] },
    { name: 'Talon-Talon', district: 'district_2', lat: 6.9095, lng: 122.1050, aliases: ['talon-talon', 'talon talon'] },
    { name: 'Taluksangay', district: 'district_2', lat: 6.9520, lng: 122.1720, aliases: ['taluksangay'] },
    { name: 'Tetuan', district: 'district_2', lat: 6.9186, lng: 122.0880, aliases: ['tetuan'] },
    { name: 'Tigtabon', district: 'district_2', lat: 6.9420, lng: 122.1850, aliases: ['tigtabon'] },
    { name: 'Tugbungan', district: 'district_2', lat: 6.9235, lng: 122.0940, aliases: ['tugbungan'] },
    { name: 'Tupilac', district: 'district_2', lat: 7.2650, lng: 122.2750, aliases: ['tupilac'] },
    { name: 'Victoria', district: 'district_2', lat: 7.0150, lng: 122.1750, aliases: ['victoria'] },
    { name: 'Vitali', district: 'district_2', lat: 7.3650, lng: 122.3150, aliases: ['vitali'] },
    { name: 'Zambowood', district: 'district_2', lat: 6.9490, lng: 122.1190, aliases: ['zambowood'] },
];

const ZAMBOANGA_STREET_LANDMARK_COORDS = {
    'don toribio': { lat: 6.907671, lng: 122.076997, barangay: 'Tetuan' },
    'lustre': { lat: 6.9120, lng: 122.0870, barangay: 'Sta. Catalina' },
    'pilar': { lat: 6.9052, lng: 122.0792, barangay: 'Zone IV' },
    'paseo del mar': { lat: 6.9008, lng: 122.0806, barangay: 'Zone IV' },
    'valderosa': { lat: 6.9025, lng: 122.0791, barangay: 'Zone IV' },
    'valderrosa': { lat: 6.9025, lng: 122.0791, barangay: 'Zone IV' },
    'zaragoza': { lat: 6.9042, lng: 122.0778, barangay: 'Zone IV' },
    'sm mindpro': { lat: 6.9077, lng: 122.0761, barangay: 'Zone III' },
    'la purisima': { lat: 6.9077, lng: 122.0761, barangay: 'Zone III' },
    'kcc': { lat: 6.9198, lng: 122.0735, barangay: 'Camino Nuevo' },
    'camins': { lat: 6.9198, lng: 122.0735, barangay: 'Camino Nuevo' },
    'zppsu': { lat: 6.9145, lng: 122.0625, barangay: 'Baliwasan' },
    'r.t. lim': { lat: 6.9145, lng: 122.0625, barangay: 'Baliwasan' },
    'veterans': { lat: 6.9117, lng: 122.0762, barangay: 'Zone II' },
    'mayor jaldon': { lat: 6.9110, lng: 122.0735, barangay: 'Canelar' },
    'gov. alvarez': { lat: 6.9142, lng: 122.0745, barangay: 'Zone III' },
    'governor alvarez': { lat: 6.9142, lng: 122.0745, barangay: 'Zone III' },
    'gov. ramos': { lat: 6.9320, lng: 122.0710, barangay: 'Sta. Maria' },
    'atilano': { lat: 6.9181, lng: 122.0884, barangay: 'Tetuan' },
    'yubenco starmall': { lat: 6.9357, lng: 122.0921, barangay: 'Putik' },
};

/**
 * Finds the matching Zamboanga Barangay object from an explicit barangay name or full address string.
 */
export const findZamboangaBarangay = (text, allowLandmarkInference = false) => {
    const raw = String(text || '').trim().toLowerCase();
    if (!raw) return null;

    // 1. Check exact match against barangay names or aliases
    for (const brgy of ZAMBOANGA_BARANGAYS) {
        if (brgy.name.toLowerCase() === raw || brgy.aliases.includes(raw)) {
            return brgy;
        }
    }

    // 2. Check substring match against barangay aliases (longest alias first so 'Zone IV' beats 'Zone I' and 'San Jose Gusu' beats 'San Jose')
    const allAliasPairs = [];
    for (const brgy of ZAMBOANGA_BARANGAYS) {
        for (const alias of brgy.aliases) {
            allAliasPairs.push({ alias, brgy });
        }
    }
    allAliasPairs.sort((a, b) => b.alias.length - a.alias.length);

    for (const { alias, brgy } of allAliasPairs) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
        if (regex.test(raw)) {
            return brgy;
        }
    }

    // 3. Optional landmark/street inference when no explicit barangay name was written
    if (allowLandmarkInference) {
        for (const [kw, info] of Object.entries(ZAMBOANGA_STREET_LANDMARK_COORDS)) {
            if (raw.includes(kw)) {
                return ZAMBOANGA_BARANGAYS.find((b) => b.name === info.barangay) || null;
            }
        }
    }

    return null;
};

/**
 * Splits a full Zamboanga City address string into structured { street, barangay, city } fields.
 */
export const parseZamboangaAddress = (rawAddress = '') => {
    const text = String(rawAddress || '').trim();
    if (!text) {
        return { street: '', barangay: '', city: 'Zamboanga City' };
    }

    const explicitBrgy = findZamboangaBarangay(text, false);
    const inferredBrgy = explicitBrgy || findZamboangaBarangay(text, true);
    const barangayName = inferredBrgy ? inferredBrgy.name : '';

    const segments = text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const IGNORE_SEGMENTS = [
        'zamboanga city',
        '7000 zamboanga city',
        'zamboanga del sur',
        '7000 zamboanga del sur',
        '7000',
        'philippines',
    ];

    const streetParts = [];
    for (const seg of segments) {
        const segLower = seg.toLowerCase().trim();
        if (IGNORE_SEGMENTS.includes(segLower)) continue;

        if (explicitBrgy) {
            const strippedBrgyPrefix = segLower
                .replace(/^(?:brgy\.?|barangay)\s+/i, '')
                .trim();
            if (
                strippedBrgyPrefix === explicitBrgy.name.toLowerCase() ||
                explicitBrgy.aliases.includes(strippedBrgyPrefix)
            ) {
                continue;
            }
        }
        streetParts.push(seg);
    }

    return {
        street: streetParts.join(', '),
        barangay: barangayName,
        city: 'Zamboanga City',
    };
};

/**
 * Combines structured Street / Landmark and Barangay inputs into a standardized Zamboanga City address string.
 */
export const formatZamboangaAddress = (street = '', barangay = '', city = 'Zamboanga City') => {
    const cleanCity = String(city || 'Zamboanga City').trim() || 'Zamboanga City';
    const cleanBrgy = String(barangay || '').trim();
    let cleanStreet = String(street || '').trim();

    if (cleanStreet) {
        const parts = cleanStreet
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((s) => {
                const lower = s.toLowerCase().replace(/^(?:brgy\.?|barangay)\s+/i, '').trim();
                if (lower === 'zamboanga city' || lower === 'zamboanga del sur' || lower === 'philippines' || lower === '7000' || lower === '7000 zamboanga del sur') {
                    return false;
                }
                if (cleanBrgy && lower === cleanBrgy.toLowerCase()) {
                    return false;
                }
                return true;
            });
        cleanStreet = parts.join(', ');
    }

    if (cleanStreet && cleanBrgy) {
        return `${cleanStreet}, ${cleanBrgy}, ${cleanCity}`;
    }
    if (cleanBrgy) {
        return `${cleanBrgy}, ${cleanCity}`;
    }
    if (cleanStreet) {
        return `${cleanStreet}, ${cleanCity}`;
    }
    return cleanCity;
};

/**
 * Synchronously validates or resolves an establishment's map coordinates so that if its address
 * explicitly specifies a Zamboanga Barangay, the pin is guaranteed to sit inside that Barangay.
 */
export const resolveEstablishmentCoordinates = (est) => {
    if (!est) {
        return { latitude: DEFAULT_ZAMBOANGA_LAT, longitude: DEFAULT_ZAMBOANGA_LNG };
    }

    const rawLat = Number(est.latitude);
    const rawLng = Number(est.longitude);
    const hasValidStoredCoords =
        !Number.isNaN(rawLat) &&
        !Number.isNaN(rawLng) &&
        rawLat >= 6.80 &&
        rawLat <= 7.45 &&
        rawLng >= 121.80 &&
        rawLng <= 122.45;

    const explicitBrgy = findZamboangaBarangay(est.barangay || est.address || '', false);

    if (explicitBrgy) {
        if (hasValidStoredCoords) {
            const latDiff = Math.abs(rawLat - explicitBrgy.lat);
            const lngDiff = Math.abs(rawLng - explicitBrgy.lng);
            // If stored coordinates are within ~1.8 km of the selected barangay center, keep exact street pin
            if (latDiff <= 0.016 && lngDiff <= 0.016) {
                return { latitude: rawLat, longitude: rawLng };
            }
        }
        // Otherwise snap to the selected barangay center
        return {
            latitude: Number(explicitBrgy.lat.toFixed(6)),
            longitude: Number(explicitBrgy.lng.toFixed(6)),
        };
    }

    if (hasValidStoredCoords) {
        return { latitude: rawLat, longitude: rawLng };
    }

    const inferredBrgy = findZamboangaBarangay(est.address || '', true);
    if (inferredBrgy) {
        return {
            latitude: Number(inferredBrgy.lat.toFixed(6)),
            longitude: Number(inferredBrgy.lng.toFixed(6)),
        };
    }

    return { latitude: DEFAULT_ZAMBOANGA_LAT, longitude: DEFAULT_ZAMBOANGA_LNG };
};

/**
 * Resolves GPS latitude and longitude coordinates for an address in Zamboanga City.
 * Always prioritizes the selected Barangay so changing Barangay (e.g. Baliwasan -> Pasonanca)
 * is guaranteed to move the map pin to the new Barangay.
 */
export const geocodeZamboangaAddress = async (address, city = 'Zamboanga City', explicitBarangay = '') => {
    const addrClean = (address || '').trim();
    const cityClean = (city || 'Zamboanga City').trim();
    const addrLower = addrClean.toLowerCase();

    const targetBrgy =
        findZamboangaBarangay(explicitBarangay, false) ||
        findZamboangaBarangay(addrClean, false);

    const parsed = parseZamboangaAddress(addrClean);
    const streetClean = parsed.street;

    // 1. If there is no explicit barangay, check known Zamboanga street/landmark coordinates first
    if (!targetBrgy) {
        for (const [kw, info] of Object.entries(ZAMBOANGA_STREET_LANDMARK_COORDS)) {
            if (addrLower.includes(kw)) {
                return {
                    latitude: Number(info.lat.toFixed(6)),
                    longitude: Number(info.lng.toFixed(6)),
                };
            }
        }
    } else if (streetClean) {
        // Check if the street matches a known landmark located INSIDE the selected barangay
        const streetLower = streetClean.toLowerCase();
        for (const [kw, info] of Object.entries(ZAMBOANGA_STREET_LANDMARK_COORDS)) {
            if (streetLower.includes(kw) && info.barangay === targetBrgy.name) {
                return {
                    latitude: Number(info.lat.toFixed(6)),
                    longitude: Number(info.lng.toFixed(6)),
                };
            }
        }
    }

    // 2. Query OpenStreetMap Nominatim for street-level accuracy, strictly bounded to the selected Barangay
    if (addrClean) {
        try {
            const query = targetBrgy
                ? streetClean
                    ? `${streetClean}, ${targetBrgy.name}, ${cityClean}, Philippines`
                    : `${targetBrgy.name}, ${cityClean}, Philippines`
                : addrLower.includes('zamboanga')
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
                        if (targetBrgy) {
                            const withinBrgy =
                                Math.abs(lat - targetBrgy.lat) <= 0.015 &&
                                Math.abs(lon - targetBrgy.lng) <= 0.015;
                            if (withinBrgy) {
                                return {
                                    latitude: Number(lat.toFixed(6)),
                                    longitude: Number(lon.toFixed(6)),
                                };
                            }
                        } else {
                            return {
                                latitude: Number(lat.toFixed(6)),
                                longitude: Number(lon.toFixed(6)),
                            };
                        }
                    }
                }
            }
        } catch {
            // Fall back to curated Zamboanga City barangay dictionary
        }
    }

    // 3. Always fall back to the selected Barangay's exact coordinates when a Barangay is chosen
    if (targetBrgy) {
        return {
            latitude: Number(targetBrgy.lat.toFixed(6)),
            longitude: Number(targetBrgy.lng.toFixed(6)),
        };
    }

    // 4. Final fallback to inferred landmark or city center
    const inferredBrgy = findZamboangaBarangay(addrClean, true);
    if (inferredBrgy) {
        return {
            latitude: Number(inferredBrgy.lat.toFixed(6)),
            longitude: Number(inferredBrgy.lng.toFixed(6)),
        };
    }

    return {
        latitude: Number(DEFAULT_ZAMBOANGA_LAT.toFixed(6)),
        longitude: Number(DEFAULT_ZAMBOANGA_LNG.toFixed(6)),
    };
};
