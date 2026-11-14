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
    'authentic sulu kahawa sug coffee': {
        brand: 'local regional producer',
        imageUrl: '/product_images/kahawa.png',
    },
    'authentic tausug tiyula itum black soup': {
        brand: 'local regional producer',
        imageUrl: '/product_images/blackSoup.jpg',
    },
    'beef satti': {
        brand: 'local regional producer',
        imageUrl: '/product_images/satti.jpg',
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
    'Lucky Me! Instant Pancit Canton Original',
    'The Ultimate Chocolate Chip Cookies',
    'AMIGO SEGURADO BIG ELBOW MACARONI - 5kg',
];

function normalizeText(value = '') {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// One showcase photo per MSME extracted directly from the DTI Region IX Halal in ZAMPEN Product Catalogue 2026
const CURATED_BRAND_IMAGES = {
    'malandi patalon zamboanga city agrarian reform association mpc mapzacara': '/product_images/dti-mapzacara.webp',
    'antiens food products': '/product_images/dti-antiens.webp',
    '2k peanuts': '/product_images/dti-2k-peanuts.webp',
    'auntie nitz bakeshop': '/product_images/dti-auntie-nitz.webp',
    'mch carmela the food shop': '/product_images/dti-mch-carmela.webp',
    'ruru mushrooms': '/product_images/dti-ruru-mushrooms.webp',
    'oasis livelihood and training center': '/product_images/dti-oasis-holisticare.webp',
    'ola food products': '/product_images/dti-ola-food.webp',
    'jing homemade products': '/product_images/dti-jing-bagoong.webp',
    'laguerta food products': '/product_images/dti-laguerta.webp',
    'dipolog school of fisheries': '/product_images/dti-dsf-tesda.webp',
    'sar den s food products': '/product_images/dti-desa.webp',
    'cassava growers and processors association inc cagapa': '/product_images/dti-cagapa.webp',
    'fml agriventures corporation': '/product_images/dti-fml-agriventures.webp',
    'fml safeeats corporation': '/product_images/dti-dipmayo.webp',
    'agriko multi trade enterprise corp': '/product_images/dti-agriko.webp',
    'altoberos food products': '/product_images/dti-altoberos.webp',
    'heaven s gift bakehaus': '/product_images/dti-heavens-gift.webp',
    'liana s food products manufacturing': '/product_images/dti-lianas.webp',
    'midsalip farmers multi purpose cooperative mifamco': '/product_images/dti-mifamco.webp',
    'a5 food products': '/product_images/dti-a5-healthymansi.webp',
    'rossvell enterprises': '/product_images/dti-rossvell-gardenzest.webp',
    'k three food products': '/product_images/dti-kthree-coolers.webp',
    'picker s calamansi food products': '/product_images/dti-pickers.webp',
    'zamboanga sibugay high value crops marketing cooperative': '/product_images/dti-pomona.webp',
    'ipil market vendors marketing cooperative imavemco': '/product_images/dti-imavemco.webp',
    'jerusalem herbal products manufacturing': '/product_images/dti-cymon.webp',
};

export function getCuratedProductImage(product) {
    if (!product?.name) return null;
    const normalizedName = normalizeText(product.name);
    const brand = normalizeText(product.brand || product.manufacturers?.name || '');
    const curated = CURATED_PRODUCT_IMAGES[normalizedName];

    if (curated) {
        // Bypass brand check for newly added products
        if (normalizedName === 'amigo segurado big elbow macaroni 5kg' ||
            normalizedName === 'authentic sulu kahawa sug coffee' ||
            normalizedName === 'authentic tausug tiyula itum black soup' ||
            normalizedName === 'beef satti') {
            return curated;
        }
        if (brand === curated.brand) {
            return curated;
        }
    }

    if (CURATED_BRAND_IMAGES[normalizedName]) {
        return { brand: normalizedName, imageUrl: CURATED_BRAND_IMAGES[normalizedName] };
    }

    if (brand && CURATED_BRAND_IMAGES[brand]) {
        return { brand, imageUrl: CURATED_BRAND_IMAGES[brand] };
    }

    return null;
}
