
import {
    CheckCircle2,
    AlertCircle,
    Building2,
    Award,
    Calendar,
    Tag,
    Barcode,
    FileText,
    Flag,
    Pencil,
    Trash2,
    ExternalLink,
} from 'lucide-react';
import { getSafeUrl } from '../../utils/security';

function getProductCertifierBadge(product) {
    const raw = `${product.certifying_bodies?.code || ''} ${product.certifying_bodies?.name || ''} ${product.source || ''}`.toLowerCase();

    if (raw.includes('idcp') || raw.includes("islamic da'wah") || raw.includes("islamic dawah")) {
        return 'IDCP';
    }
    if (raw.includes('busc') || raw.includes('basilan ulama')) {
        return 'BUSC';
    }
    if (raw.includes('bpcc') || raw.includes('bangsamoro')) {
        return 'BPCC';
    }
    if (raw.includes('hdip') || raw.includes('halal development institute')) {
        return 'HDIP';
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
    const isHalal = product.status === 'Halal';
    const isDoubtful = product.status === 'Doubtful';
    const certBadge = getProductCertifierBadge(product);

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
                                : isDoubtful
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                    >
                        {isHalal && <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />}
                        {isDoubtful && <AlertCircle size={10} className="sm:w-3 sm:h-3" />}
                        {product.status}
                    </span>
                </div>

                {/* Category & Barcode */}
                <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md">
                        <Tag size={10} className="sm:w-3 sm:h-3" /> {product.category || 'Food'}
                    </span>
                    {product.barcode && (
                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[11px]">
                            <Barcode size={10} className="sm:w-3 sm:h-3" /> {product.barcode}
                        </span>
                    )}
                </div>

                {/* Manufacturer & Certification Info */}
                <div className="space-y-1 text-[11px] sm:text-xs text-slate-600 bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <Building2 size={11} className="text-slate-400 shrink-0 sm:w-[13px] sm:h-[13px]" />
                        <span className="font-semibold text-slate-800">
                            {product.manufacturers?.name || 'Local / Regional Producer'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[10px] sm:text-[11px]">
                        <Award size={11} className="text-emerald-600 shrink-0 sm:w-[13px] sm:h-[13px]" />
                        <span className="truncate">
                            {product.certifying_bodies?.name || 'Accredited Halal Certifier (IDCP/HDIP)'}
                        </span>
                    </div>

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

                {/* Ingredients Summary */}
                {product.ingredients_summary && (
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

            {/* Footer: Provenance & Admin Actions */}
            <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] sm:text-xs gap-1">
                <span className="text-[10px] sm:text-[10px] text-slate-400 flex items-center gap-1 min-w-0" title={product.source_url || product.source}>
                    <FileText size={10} className="shrink-0 sm:w-[11px] sm:h-[11px]" />
                    {product.source || 'IDCP Registry'}
                </span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => onReport(product)}
                        className="text-[10px] sm:text-[11px] font-semibold text-slate-400 hover:text-amber-600 flex items-center gap-1 transition px-1 sm:px-1.5 py-0.5 rounded hover:bg-amber-50"
                        title="Flag issue or report non-compliance"
                    >
                        <Flag size={10} className="sm:w-[11px] sm:h-[11px]" />
                        <span>Flag</span>
                    </button>

                    {isAdmin ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => onEdit(product)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Product"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(product)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete Product"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ) : (
                        getSafeUrl(product.source_url) && (
                            <a
                                href={getSafeUrl(product.source_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                            >
                                Source <ExternalLink size={10} />
                            </a>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
