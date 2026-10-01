import { ScanSearch, FileText, Clock, ChevronRight, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import VerdictBadge from './VerdictBadge';
import { getFlaggedItems, getConfidencePct, formatDate } from './scanHistoryUtils';

export const ScanMobileCard = ({ item, onClick }) => {
    const flagged = getFlaggedItems(item);
    const displayFlagged = flagged.slice(0, 2);
    const remainingFlagged = flagged.length - 2;
    const confPct = getConfidencePct(item.confidence);

    return (
        <div
            onClick={() => onClick(item)}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs active:scale-[0.99] hover:border-emerald-300 transition-all cursor-pointer group"
        >
            {/* Card Header: Mode, Scan ID, Verdict */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        item.mode === 'label'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                    }`}>
                        {item.mode === 'label' ? <ScanSearch size={11} /> : <FileText size={11} />}
                        {item.mode === 'label' ? 'Label' : 'Logo'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                        #{String(item.id).slice(0, 8)}
                    </span>
                </div>
                <VerdictBadge verdict={item.verdict} />
            </div>

            {/* Product / Scan Title */}
            <div className="mb-2">
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">
                    {item.image_name || (item.mode === 'label' ? 'Product Label Scan' : 'Certificate Scan')}
                </h4>
                {item.detected_logo && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                        <span className="truncate">Certifier: <strong>{item.detected_logo}</strong></span>
                    </p>
                )}
            </div>

            {/* Additives / Status Chips */}
            <div className="mb-3">
                {flagged.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {displayFlagged.map((f, i) => {
                            const isHaram = f.status?.toLowerCase() === 'haram' || f.status?.toLowerCase() === 'prohibited';
                            return (
                                <span
                                    key={i}
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                        isHaram
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                >
                                    {isHaram ? <XCircle size={10} /> : <AlertTriangle size={10} />}
                                    <span className="truncate max-w-[120px]">{f.matched_text}</span>
                                </span>
                            );
                        })}
                        {remainingFlagged > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                +{remainingFlagged} more
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
                        <span>All detected ingredients verified compliant</span>
                    </div>
                )}
            </div>

            {/* Card Footer: Confidence + Date + Action Hint */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${confPct}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-600">
                        {confPct.toFixed(0)}%
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock size={11} className="shrink-0" />
                        {formatDate(item.created_at)}
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
};

export default ScanMobileCard;
