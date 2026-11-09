import { Cookie, CupSoda, Fish, Leaf, Package, Wheat } from 'lucide-react';
import { getSafeUrl } from '../../utils/security';

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
    const imageUrl = getSafeUrl(product?.image_url);
    const categoryIcon = getCategoryIcon(product?.category);

    return (
        <div
            className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-[#F4F8F5] to-amber-50 text-emerald-800/60 ${className}`}
        >
            <div className="flex flex-col items-center gap-2 px-4 text-center">
                {categoryIcon}
                <span className="text-[10px] font-semibold text-slate-500">
                    {product?.category || 'Product'} photo unavailable
                </span>
            </div>
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={`${product?.name || 'Product'} photo`}
                    loading="lazy"
                    onError={(event) => event.currentTarget.classList.add('hidden')}
                    className="absolute inset-0 h-full w-full bg-white object-contain p-4"
                />
            )}
        </div>
    );
}
