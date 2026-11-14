import { useState } from 'react';
import { Cookie, CupSoda, Fish, Leaf, Package, Wheat } from 'lucide-react';
import { getCuratedProductImage } from '../../data/curatedProductImages';
import { getSafeUrl } from '../../utils/security';

const ISOLATED_PACKSHOT_TOKENS = [
    '2k-',
    'dti-2k-peanuts',
    'gardenia-',
    'amigo-',
    'blanched-potato',
    'dewberry-',
    'gold-heritage',
    'lucky-me',
    'piattos-',
    'purefoods-corned-beef',
];

function isIsolatedPackshotUrl(url = '') {
    const lower = String(url).toLowerCase();
    return ISOLATED_PACKSHOT_TOKENS.some((token) => lower.includes(token));
}

function getCategoryIcon(category = '') {
    const value = category.toLowerCase();

    if (/beverage|drink|tea|juice|coffee/.test(value)) return <CupSoda size={38} strokeWidth={1.4} aria-hidden="true" />;
    if (/seafood|fish|poultry|meat|protein/.test(value)) return <Fish size={38} strokeWidth={1.4} aria-hidden="true" />;
    if (/bakery|pastry|bread|snack|confection|cookie|chocolate/.test(value)) return <Cookie size={38} strokeWidth={1.4} aria-hidden="true" />;
    if (/grain|rice|noodle|pasta|cereal/.test(value)) return <Wheat size={38} strokeWidth={1.4} aria-hidden="true" />;
    if (/produce|vegetable|fruit|herb|organic/.test(value)) return <Leaf size={38} strokeWidth={1.4} aria-hidden="true" />;
    return <Package size={38} strokeWidth={1.4} aria-hidden="true" />;
}

export default function ProductImage({ product, className = '' }) {
    const [failedUrl, setFailedUrl] = useState(null);
    const curatedImage = getCuratedProductImage(product);
    const imageUrl = curatedImage?.imageUrl || getSafeUrl(product?.image_url);
    const hasValidImage = Boolean(imageUrl && failedUrl !== imageUrl);
    const isIsolatedPackshot = hasValidImage && isIsolatedPackshotUrl(imageUrl);
    const categoryIcon = getCategoryIcon(product?.category);

    const frameBackground = hasValidImage
        ? isIsolatedPackshot
            ? 'bg-white'
            : 'bg-slate-100'
        : 'bg-gradient-to-br from-emerald-50 via-[#F4F8F5] to-amber-50 text-emerald-800/60';

    return (
        <div
            className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-slate-100 ${frameBackground} ${className}`}
        >
            {hasValidImage ? (
                isIsolatedPackshot ? (
                    <img
                        src={imageUrl}
                        alt={`${product?.name || 'Product'} photo`}
                        loading="lazy"
                        onError={() => setFailedUrl(imageUrl)}
                        className="h-full w-full bg-white object-contain p-3"
                    />
                ) : (
                    <>
                        <img
                            src={imageUrl}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-105 saturate-110 opacity-90"
                        />
                        <img
                            src={imageUrl}
                            alt={`${product?.name || 'Product'} photo`}
                            loading="lazy"
                            onError={() => setFailedUrl(imageUrl)}
                            className="relative z-10 h-full w-full object-contain"
                        />
                    </>
                )
            ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                    {categoryIcon}
                    <span className="text-[10px] font-semibold text-slate-500">
                        No image available for this product.
                    </span>
                </div>
            )}
        </div>
    );
}
