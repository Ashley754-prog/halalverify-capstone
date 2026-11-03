import { AlertTriangle, FileText, ExternalLink, Loader2, ShieldAlert } from 'lucide-react';
import QueueStatusBadge from './QueueStatusBadge';
import { getSafeUrl } from '../../utils/security';
import { formatShortDate } from '../../utils/verificationNotes';

export default function ReportQueueCard({
    rep,
    processingId,
    handleResolveReport,
    onInspectReport,
}) {
    const isProcessing = processingId === rep.id;

    const subjectName =
        rep.subject_name ||
        rep.products?.name ||
        rep.establishments?.name ||
        'Report Target';

    return (
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs hover:border-slate-300 transition">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        #{String(rep.id || '').slice(0, 8)}
                    </span>
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        {rep.issue_type}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                        Subject: {subjectName}
                    </span>
                    <QueueStatusBadge status={rep.status || 'open'} />
                </div>
                <span className="text-[10px] text-slate-500 font-medium shrink-0">
                    {formatShortDate(rep.created_at)}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
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
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                {onInspectReport ? (
                    <button
                        type="button"
                        onClick={() => onInspectReport(rep)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                        <ShieldAlert size={13} className="text-emerald-600" />
                        <span>Review</span>
                    </button>
                ) : <div />}

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleResolveReport(rep, 'dismissed')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                    >
                        Dismiss
                    </button>

                    <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleResolveReport(rep, 'resolved')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none shadow-xs"
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin text-white" />
                                Resolving...
                            </span>
                        ) : (
                            'Resolve'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
