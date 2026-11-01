import { AlertTriangle, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { getSafeUrl } from '../../utils/security';
import { formatShortDate } from '../../utils/verificationNotes';

export default function ReportQueueCard({
    rep,
    processingId,
    handleResolveReport,
}) {
    const isProcessing = processingId === rep.id;

    const subjectName =
        rep.subject_name ||
        rep.products?.name ||
        rep.establishments?.name ||
        'Report Target';

    return (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 shadow-2xs">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        {rep.issue_type}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                        Subject: {subjectName}
                    </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                    {formatShortDate(rep.created_at)}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                &quot;{rep.description}&quot;
            </p>

            {/* Attached Photo Evidence */}
            {getSafeUrl(rep.evidence_url) && (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <FileText size={13} />
                    <a
                        href={getSafeUrl(rep.evidence_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold flex items-center gap-1 hover:text-emerald-800"
                    >
                        View Attached Photo Evidence <ExternalLink size={11} />
                    </a>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleResolveReport(rep, 'dismissed')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                >
                    Dismiss Flag
                </button>

                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleResolveReport(rep, 'resolved')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin text-emerald-600" />
                            Resolving...
                        </span>
                    ) : (
                        'Resolve Issue'
                    )}
                </button>

                {rep.establishment_id && (
                    <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleResolveReport(rep, 'resolved', true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-[0.98] transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:outline-none"
                        title="Flag and suspend establishment based on confirmed violation"
                    >
                        <AlertTriangle size={12} />
                        <span>Suspend Establishment</span>
                    </button>
                )}
            </div>
        </div>
    );
}
