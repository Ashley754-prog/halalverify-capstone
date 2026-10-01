import { ScanSearch, FileText, Clock, Eye, ShieldCheck } from 'lucide-react';
import VerdictBadge from './VerdictBadge';
import { getFlaggedItems, getConfidencePct, formatDate } from './scanHistoryUtils';

export const ScanDesktopTable = ({ items, onSelectItem, onClearFilters }) => {
    return (
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[100px]">Scan ID</th>
                            <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[240px]">Product / Certificate</th>
                            <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[100px]">Mode</th>
                            <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[130px]">Verdict</th>
                            <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[120px]">Confidence</th>
                            <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[140px]">Date & Time</th>
                            <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[80px] text-right">Action</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {items.map((item) => {
                            const flagged = getFlaggedItems(item);
                            const displayFlagged = flagged.slice(0, 2);
                            const remainingFlagged = flagged.length - 2;
                            const confPct = getConfidencePct(item.confidence);

                            return (
                                <tr
                                    key={item.id}
                                    onClick={() => onSelectItem(item)}
                                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                >
                                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                                        #{String(item.id).slice(0, 8)}
                                    </td>

                                    <td className="px-5 py-3.5">
                                        <p className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-emerald-700 transition">
                                            {item.image_name || (item.mode === 'label' ? 'Product Label Scan' : 'Certificate Scan')}
                                        </p>

                                        {flagged.length > 0 ? (
                                            <div className="mt-1 flex flex-wrap items-center gap-1">
                                                {displayFlagged.map((f, i) => {
                                                    const isHaram = f.status?.toLowerCase() === 'haram' || f.status?.toLowerCase() === 'prohibited';
                                                    return (
                                                        <span
                                                            key={i}
                                                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                                isHaram
                                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}
                                                        >
                                                            {f.matched_text}
                                                        </span>
                                                    );
                                                })}
                                                {remainingFlagged > 0 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                        +{remainingFlagged} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : item.detected_logo ? (
                                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                                                Certifier: {item.detected_logo}
                                            </span>
                                        ) : null}
                                    </td>

                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                            item.mode === 'label'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-purple-50 text-purple-700'
                                        }`}>
                                            {item.mode === 'label' ? <ScanSearch size={12} /> : <FileText size={12} />}
                                            {item.mode === 'label' ? 'Label' : 'Logo'}
                                        </span>
                                    </td>

                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <VerdictBadge verdict={item.verdict} />
                                    </td>

                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500"
                                                    style={{ width: `${confPct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-slate-600 font-semibold">
                                                {confPct.toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {formatDate(item.created_at)}
                                        </span>
                                    </td>

                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectItem(item);
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
                                        >
                                            <Eye size={12} />
                                            <span>View</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs sm:text-sm">
                                    <p className="font-semibold text-slate-600">No scan records match your criteria.</p>
                                    {onClearFilters && (
                                        <button
                                            type="button"
                                            onClick={onClearFilters}
                                            className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                        >
                                            Clear search & filters
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScanDesktopTable;
