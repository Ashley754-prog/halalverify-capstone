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
        imageUrl: 'https://images.openfoodfacts.org/images/products/480/888/701/0077/front_en.3.400.jpg',
        sourceUrl: 'https://world.openfoodfacts.org/product/4808887010077',
    },
    'piattos cheese flavored potato crisps': {
        brand: 'jack n jill',
        imageUrl: 'https://images.openfoodfacts.org/images/products/480/001/664/4801/front_en.56.400.jpg',
        sourceUrl: 'https://world.openfoodfacts.org/product/4800016644801',
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
