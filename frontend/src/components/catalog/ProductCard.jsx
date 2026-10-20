
import {
    CheckCircle2,
    AlertCircle,
    Building2,
    Award,
    Calendar,
    Tag,
    FileText,
    Flag,
    Pencil,
    Trash2,
    ExternalLink,
    Leaf,
    MapPin,
    ShieldCheck,
} from 'lucide-react';
import { getSafeUrl } from '../../utils/security';
import { simplifyStatus } from '../../utils/textFormatters';
import { resolveZamboangaDistrict } from '../../data/constants';

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

export default function ProductCard({
    product,
    isAdmin,
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
    const evidenceUrl = getSafeUrl(product.image_url);

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 mb-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3 sm:space-y-4 min-w-0">
            <div className="space-y-2 sm:space-y-3">
                {/* Header: Brand & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {product.brand && (
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-100">
                                    {product.brand}
                                </span>
                            )}
                            {certBadge && (
                                <span className="text-[10px] sm:text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                                    <Award size={10} className="text-blue-600 shrink-0" />
                                    {certBadge}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xs sm:text-base font-bold text-slate-900 leading-tight pt-0.5 break-words">
                            {product.name}
                        </h3>
                    </div>

                    <span
                        className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 border ${
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

                {/* Category & District Badge */}
                <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md">
                        <Tag size={10} className="sm:w-3 sm:h-3" /> {product.category || 'Food'}
                    </span>
                    {districtInfo && districtInfo.id !== 'commercial' && (
                        <span className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md font-bold border ${districtInfo.badgeClass}`}>
                            <MapPin size={10} className="shrink-0" />
                            <span>{districtInfo.shortLabel}</span>
                        </span>
                    )}
                    {evidenceUrl && (
                        <a
                            href={evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-md font-bold transition"
                        >
                            <ShieldCheck size={10} className="text-emerald-600 shrink-0" />
                            <span>View Certificate / Evidence</span>
                            <ExternalLink size={9} />
                        </a>
                    )}
                </div>

                {/* Consumer Discretion Advisory for Doubtful / Expired / Non-Certified */}
                {(isDoubtful || isExpired) && (
                    <div className="rounded-lg bg-amber-50/90 border border-amber-200 px-2.5 py-1.5 text-[10px] text-amber-900 leading-snug flex items-start gap-1.5">
                        <AlertCircle size={12} className="text-amber-700 shrink-0 mt-0.5" />
                        <span>
                            <strong>Consumer Discretion Advisory:</strong> Verify active certification or ingredient sources directly with the manufacturer before consumption.
                        </span>
                    </div>
                )}

                {/* Manufacturer & Certification Info */}
                <div className="space-y-1 text-[11px] sm:text-xs text-slate-600 bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <Building2 size={11} className="text-slate-400 shrink-0 sm:w-[13px] sm:h-[13px]" />
                        <span className="font-semibold text-slate-800">
                            {product.manufacturers?.name || 'Local / Regional Producer'}
                        </span>
                    </div>

                    {isPorkFree ? (
                        <div className="flex items-center gap-1.5 text-sky-800 font-medium text-[10px] sm:text-[11px]">
                            <CheckCircle2 size={11} className="text-sky-600 shrink-0 sm:w-[13px] sm:h-[13px]" />
                            <span className="truncate">Manufacturer Declared Pork-Free</span>
                        </div>
                    ) : isVegetarian ? (
                        <div className="flex items-center gap-1.5 text-teal-800 font-medium text-[10px] sm:text-[11px]">
                            <Leaf size={11} className="text-teal-600 shrink-0 sm:w-[13px] sm:h-[13px]" />
                            <span className="truncate">Dietary Standard: Vegetarian / Vegan</span>
                        </div>
                    ) : product.certifying_bodies?.name ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[10px] sm:text-[11px]">
                            <Award size={11} className="text-emerald-600 shrink-0 sm:w-[13px] sm:h-[13px]" />
                            <span className="truncate">{product.certifying_bodies.name}</span>
                        </div>
                    ) : isHalal ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[10px] sm:text-[11px]">
                            <Award size={11} className="text-emerald-600 shrink-0 sm:w-[13px] sm:h-[13px]" />
                            <span className="truncate">Accredited Halal Certifier</span>
                        </div>
                    ) : null}

                    {product.certificate_no && (
                        <div className="text-[10px] text-slate-500 font-mono">
                            Cert #: {product.certificate_no}
                        </div>
                    )}

                    {product.expiry_date && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Calendar size={10} className="shrink-0 sm:w-[11px] sm:h-[11px]" />
                            <span>Valid until: {product.expiry_date}</span>
                        </div>
                    )}
                </div>

                {/* Ingredients Summary (only shown when actual ingredients exist, not generic registry imports) */}
                {product.ingredients_summary && !product.ingredients_summary.toLowerCase().startsWith('verified product certified under') && (
                    <div className="text-xs text-slate-600">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Ingredients:
                        </p>
                        <p className="line-clamp-2 text-slate-600 text-[10px] sm:text-[11px] leading-relaxed">
                            {product.ingredients_summary}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer: Provenance & Actions */}
            <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs gap-1">
                <span className="text-slate-400 flex items-center gap-1 min-w-0" title={product.source_url || product.source}>
                    <FileText size={11} className="shrink-0 text-slate-400" />
                    <span className="truncate">{product.source || 'HalalVerify Registry'}</span>
                </span>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => onReport(product)}
                        className="min-h-[32px] text-[11px] font-semibold text-slate-500 hover:text-amber-700 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-amber-50 active:scale-95"
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
                                className="min-h-[32px] min-w-[32px] p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition flex items-center justify-center"
                                title="Edit Product"
                                aria-label={`Edit ${product.name}`}
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(product)}
                                className="min-h-[32px] min-w-[32px] p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center"
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
                                className="min-h-[32px] text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-emerald-50 active:scale-95"
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
