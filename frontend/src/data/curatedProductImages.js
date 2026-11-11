const CURATED_PRODUCT_IMAGES = {
    'gardenia neubake wheaten loaf 560g': {
        brand: 'vitabread food products inc',
        imageUrl: '/product_images/Gardenia-Neubake-Wheaten-Bread-560g.png',
    },
    'juju brand prebiotics prebotics 5 billion cfu food supplement effervescent tablet watermelon flavor': {
        brand: 'wellpro biomedical inc',
        imageUrl: '/product_images/juju-brand.jpeg',
    },
    'blanched potato diced': {
        brand: 'xyzco food corp',
        imageUrl: '/product_images/blanched-potato-dice.jpeg',
    },
    'gold heritage corned beef': {
        brand: 'vvs cold storage and processing plant corp export',
        imageUrl: '/product_images/gold-heritage-corned-beef.jpeg',
    },
    'rusk powder': {
        brand: 'vivanica foods incorporated',
        imageUrl: '/product_images/rusk-powder.jpeg',
    },
    "jack n jill dewberry yogurt cake strawberry": {
        brand: 'urc san pedro cake 2',
        imageUrl: '/product_images/dewberry-yogurt-cake.jpeg',
    },
    'purefoods corned beef 150g': {
        brand: 'purefoods',
        imageUrl: '/product_images/purefoods-corned-beef-150g.png',
    },
    'piattos cheese flavored potato crisps': {
        brand: 'jack n jill',
        imageUrl: '/product_images/piattos-cheese-flavored-potato-chips.jpeg',
    },
    '2k salted brown peanuts 300g': {
        brand: '2k peanuts',
        imageUrl: '/product_images/2k-salted-brown-peanuts-300g.webp',
    },
    '2k spicy garlic brown peanuts 300g': {
        brand: '2k peanuts',
        imageUrl: '/product_images/2k-spicy-garlic-brown-peanuts-300g.webp',
    },
    '2k spicy garlic skinless peanuts 300g': {
        brand: '2k peanuts',
        imageUrl: '/product_images/2k-spicy-garlic-skinless-peanuts-300g.webp',
    },
    'akao farms certified halal fresh table eggs 12s': {
        brand: 'akao farms',
        imageUrl: '/product_images/akao-farms-eggs.jpeg',
    },
    'lucky me instant pancit canton original': {
        brand: 'lucky me',
        imageUrl: '/product_images/lucky-me-pancit-canton-original.webp',
    },
    'the ultimate chocolate chip cookies': {
        brand: 'fibisco',
        imageUrl: '/product_images/ultimate-chocolate-chip-cookies-fibisco-600g.jpg',
    },
    'amigo segurado big elbow macaroni 5kg': {
        brand: 'philippine foremost milling corp pasta plant f 1473',
        imageUrl: '/product_images/amigo-gurado-big-elbow-macaroni-5kg.png.png',
    },
};

export const CURATED_PRODUCT_NAMES = [
    'GARDENIA NEUBAKE WHEATEN LOAF 560G',
    'JUJU BRAND - PREBIOTICS + PREBOTICS 5 BILLION CFU FOOD SUPPLEMENT EFFERVESCENT TABLET WATERMELON FLAVOR',
    'BLANCHED POTATO DICED',
    'GOLD HERITAGE CORNED BEEF',
    'RUSK POWDER',
    "JACK N' JILL DEWBERRY YOGURT CAKE STRAWBERRY",
    'Purefoods Corned Beef 150g',
    'Piattos Cheese Flavored Potato Crisps',
    '2K Salted Brown Peanuts 300g',
    '2K Spicy Garlic Brown Peanuts 300g',
    '2K Spicy Garlic Skinless Peanuts 300g',
    'AKAO Farms Certified Halal Fresh Table Eggs 12s',
    'Lucky Me! Instant Pancit Canton Original',
    'The Ultimate Chocolate Chip Cookies',
    'AMIGO SEGURADO BIG ELBOW MACARONI - 5kg',
];

function normalizeText(value = '') {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function getCuratedProductImage(product) {
    if (!product?.name) return null;
    const curated = CURATED_PRODUCT_IMAGES[normalizeText(product.name)];
    if (!curated) return null;

    const brand = normalizeText(product.brand || product.manufacturers?.name || '');
    return brand === curated.brand ? curated : null;
}
