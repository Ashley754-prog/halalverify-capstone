
import {
    CheckCircle2,
    AlertCircle,
    Building2,
    Award,
    Calendar,
    Tag,
    Flag,
    Pencil,
    Trash2,
    ExternalLink,
    Leaf,
    MapPin,
    Package,
    ShieldAlert,
} from 'lucide-react';
import { getSafeUrl } from '../../utils/security';
import { parseProductLines, parseProductVariants, simplifyStatus } from '../../utils/textFormatters';
import { resolveZamboangaDistrict } from '../../data/constants';
import ProductImage from './ProductImage';

function getProductCertifierBadge(product) {
    const raw = `${product.certifying_bodies?.code || ''} ${product.certifying_bodies?.name || ''} ${product.source || ''}`.toLowerCase();

    if (raw.includes('idcp') || raw.includes("islamic da'wah") || raw.includes("islamic dawah")) {
        return 'IDCP';
    }
    if (raw.includes('hdip') || raw.includes('halal development institute')) {
        return 'HDIP';
    }
    if (raw.includes('jakim') || raw.includes('malaysia')) {
        return 'JAKIM';
    }
    if (raw.includes('muis') || raw.includes('singapura') || raw.includes('singapore')) {
        return 'MUIS';
    }
    if (raw.includes('bpjph') || raw.includes('indonesia') || raw.includes('mui')) {
        return 'BPJPH / MUI';
    }
    if (raw.includes('mmhcb') || raw.includes('mindanao halal certification')) {
        return 'MMHCB';
    }
    if (raw.includes('hiccip') || raw.includes('chamber of commerce')) {
        return 'HICCIP';
    }
    if (raw.includes('busc') || raw.includes('basilan ulama')) {
        return 'BUSC';
    }
    if (raw.includes('bpcc') || raw.includes('bangsamoro')) {
        return 'BPCC';
    }
    if (raw.includes('zampen') || raw.includes('dti region ix')) {
        return 'DTI ZAMPEN';
    }
    return product.certifying_bodies?.code || null;
}

function formatShortExpiryDate(value) {
    if (!value) return '';
    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return String(value);
    const [, y, m, d] = match;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

function getVariantBadgeLabel(product, variants) {
    const count = variants.length;
    if (count === 1) return '1 Variant';

    const variantText = variants.join(' ').toLowerCase();
    if (/\b(bottle|pouch|pack|jug|sachet|cup|can|container)\b/.test(variantText)) {
        return `${count} Options`;
    }

    const titleAndCategory = `${product?.name || ''} ${product?.category || ''}`.toLowerCase();
    if (/\b(rice|grain|powder|bread|loaf|loaves|biscuit|cookie|pastry|pastries|cake|kakanin|salt|rub|confectionery|crispy snacks)\b/.test(titleAndCategory)) {
        return `${count} Varieties`;
    }

    return `${count} Flavors`;
}

export default function ProductCard({
    product,
    isAdmin,
    onViewDetails,
    onReport,
    onEdit,
    onDelete,
}) {
    const statusLower = (product.status || '').toLowerCase();
    const adminNotesLower = (product.admin_notes || '').toLowerCase();

    const isPorkFree = statusLower.includes('pork-free') ||
                       (statusLower === 'community_listed' && adminNotesLower.includes('pork-free'));
    const isVegetarian = statusLower.includes('vegetarian') || statusLower.includes('vegan') ||
                         (statusLower === 'community_listed' && (adminNotesLower.includes('vegetarian') || adminNotesLower.includes('vegan')));
    const isHalal = statusLower === 'halal' || statusLower === 'verified';
    const isDoubtful = statusLower === 'doubtful' || statusLower.includes('syubhah');
    const isExpired = statusLower === 'expired';
    const isCommunityListed = statusLower === 'community_listed' && !isPorkFree && !isVegetarian;

    const certBadge = !isPorkFree && !isVegetarian ? getProductCertifierBadge(product) : null;
    const districtInfo = resolveZamboangaDistrict(product);
    const variants = parseProductVariants(product.admin_notes);
    const productLines = parseProductLines(product.admin_notes);
    const isDtiDirectory =
        `${product.source || ''}`.toLowerCase().includes('zampen') ||
        `${product.source || ''}`.toLowerCase().includes('dti region ix');

    return (
        <div
            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 380px' }}
            className="relative h-full bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between min-w-0"
        >
            <button
                type="button"
                onClick={() => onViewDetails(product)}
                className="absolute inset-0 z-0 cursor-pointer rounded-xl sm:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
                aria-label={`View details for ${product.name}`}
            />

            {/* Slot 1: Framed Product Image */}
            <ProductImage
                product={product}
                className="z-10 pointer-events-none -mx-3 -mt-3 rounded-t-xl sm:-mx-5 sm:-mt-5 sm:rounded-t-2xl shrink-0"
            />

            <div className="relative z-10 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3 pointer-events-none pt-3 pb-3">
                <div className="space-y-2">
                    {/* Slot 2: Single-Row Category/District + Halal Status Bar */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-[10px] sm:text-xs text-slate-500">
                            <span className="flex items-center gap-1 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-full">
                                <Tag size={10} className="sm:w-3 sm:h-3 shrink-0" />
                                <span className="truncate">{product.category || 'Food'}</span>
                            </span>
                            {districtInfo && districtInfo.id !== 'commercial' && (
                                <span className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md font-bold border shrink-0 ${districtInfo.badgeClass}`}>
                                    <MapPin size={10} className="shrink-0" />
                                    <span>{districtInfo.shortLabel}</span>
                                </span>
                            )}
                        </div>

                        <span
                            className={`text-xs font-bold px-2 py-0.5 sm:py-1 rounded-lg shrink-0 flex items-center gap-1 border ${
                                isHalal
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isPorkFree
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : isVegetarian
                                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                                    : isCommunityListed
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : isDoubtful || isExpired
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                            {isHalal && <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />}
                            {isPorkFree && <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />}
                            {isVegetarian && <Leaf size={10} className="sm:w-3 sm:h-3" />}
                            {isCommunityListed && <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />}
                            {(isDoubtful || isExpired) && <AlertCircle size={10} className="sm:w-3 sm:h-3" />}
                            {isPorkFree
                                ? 'Pork-Free Declared'
                                : isVegetarian
                                ? 'Vegetarian / Vegan'
                                : isCommunityListed
                                ? 'Community Listed'
                                : simplifyStatus(product.status)}
                        </span>
                    </div>

                    {/* Slot 3: Fixed 2-Line Product Title + 1-Line Producer / Product Lines */}
                    <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem] break-words">
                            {product.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            {isDtiDirectory && productLines ? (
                                <>
                                    <Package size={12} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{productLines}</span>
                                </>
                            ) : (
                                <>
                                    <Building2 size={12} className="text-slate-400 shrink-0" />
                                    <span className="truncate">
                                        {product.manufacturers?.name || product.brand || 'Local / Regional Producer'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Slot 4: Uniform 2-Line Verification & Variant Summary Box */}
                <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100 space-y-1.5">
                    {isPorkFree ? (
                        <div className="flex items-center gap-1.5 text-sky-800 font-medium text-xs">
                            <CheckCircle2 size={12} className="text-sky-600 shrink-0" />
                            <span className="truncate">Manufacturer Declared Pork-Free</span>
                        </div>
                    ) : isVegetarian ? (
                        <div className="flex items-center gap-1.5 text-teal-800 font-medium text-xs">
                            <Leaf size={12} className="text-teal-600 shrink-0" />
                            <span className="truncate">Dietary Standard: Vegetarian / Vegan</span>
                        </div>
                    ) : product.certifying_bodies?.name ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-xs">
                            <Award size={12} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{product.certifying_bodies.name}</span>
                        </div>
                    ) : certBadge === 'DTI ZAMPEN' ? (
                        <div className="flex items-center gap-1.5 text-blue-800 font-medium text-xs">
                            <Award size={12} className="text-blue-600 shrink-0" />
                            <span className="truncate">DTI Region IX ZAMPEN Directory</span>
                        </div>
                    ) : isHalal && (product.certifying_body_id || product.certificate_no || product.halal_tier === 'halal_certified') ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-xs">
                            <Award size={12} className="text-emerald-600 shrink-0" />
                            <span className="truncate">Accredited Halal Certifier</span>
                        </div>
                    ) : isCommunityListed ? (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                            <ShieldAlert size={12} className="text-slate-500 shrink-0" />
                            <span className="truncate">Community Listed Product</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                            <ShieldAlert size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">HalalVerify Registry Record</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 min-w-0 truncate">
                            {isDtiDirectory && !product.expiry_date && !product.certificate_no && product.manufacturers?.address ? (
                                <>
                                    <MapPin size={11} className="shrink-0" />
                                    <span className="truncate">{product.manufacturers.address}</span>
                                </>
                            ) : (
                                <>
                                    <Calendar size={11} className="shrink-0" />
                                    <span className="truncate">
                                        {product.expiry_date
                                            ? `Valid until ${formatShortExpiryDate(product.expiry_date)}`
                                            : product.certificate_no
                                            ? `Cert # ${product.certificate_no}`
                                            : 'Verified Registry Record'}
                                    </span>
                                </>
                            )}
                        </span>
                        {variants.length > 0 && (
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-semibold">
                                {getVariantBadgeLabel(product, variants)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Slot 5: Clean Footer */}
            <div className="relative z-10 pointer-events-none pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs gap-2 shrink-0">
                <span className="font-semibold text-emerald-700 flex items-center gap-1 whitespace-nowrap">
                    View details &rarr;
                </span>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => onReport(product)}
                        className="pointer-events-auto min-h-[32px] text-[11px] font-semibold text-slate-500 hover:text-amber-700 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-amber-50 active:scale-95"
                        title="Flag issue or report non-compliance"
                        aria-label={`Flag issue with ${product.name}`}
                    >
                        <Flag size={12} className="shrink-0 text-slate-400 hover:text-amber-600" />
                        <span>Flag</span>
                    </button>

                    {isAdmin ? (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onEdit(product)}
                                className="pointer-events-auto min-h-[32px] min-w-[32px] p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition flex items-center justify-center"
                                title="Edit Product"
                                aria-label={`Edit ${product.name}`}
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(product)}
                                className="pointer-events-auto min-h-[32px] min-w-[32px] p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center"
                                title="Delete Product"
                                aria-label={`Delete ${product.name}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ) : (
                        product.source_url && getSafeUrl(product.source_url) && (
                            <a
                                href={getSafeUrl(product.source_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pointer-events-auto min-h-[32px] text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-emerald-50 active:scale-95"
                                title="Open external registry verification source"
                                aria-label={`View source registry for ${product.name}`}
                            >
                                <span>Source</span>
                                <ExternalLink size={11} />
                            </a>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
