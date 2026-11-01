import { useState, useEffect } from 'react';
import {
    Flag,
    AlertTriangle,
    CheckCircle2,
    X,
    FileText,
    ExternalLink,
    Loader2,
    Store,
    Package,
    ScanSearch,
    ShieldAlert,
    Clock,
} from 'lucide-react';
import Modal from '../ui/Modal';
import QueueStatusBadge from './QueueStatusBadge';
import { getSafeUrl } from '../../utils/security';
import { formatShortDate } from '../../utils/verificationNotes';

export default function ReportAdjudicationModal({
    isOpen,
    onClose,
    report,
    onResolve,
    processingId,
}) {
    const [notes, setNotes] = useState('');
    const [suspendEstablishment, setSuspendEstablishment] = useState(false);
    const [confirmSuspend, setConfirmSuspend] = useState(false);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        if (isOpen && report) {
            setNotes(report.resolution_notes || '');
            setSuspendEstablishment(false);
            setConfirmSuspend(false);
            setActionError('');
        }
    }, [isOpen, report]);

    if (!report) return null;

    const isProcessing = processingId === report.id;
    const subjectName =
        report.subject_name ||
        report.products?.name ||
        report.establishments?.name ||
        'Unspecified Target';

    const safeEvidence = getSafeUrl(report.evidence_url);

    const handleAction = async (status) => {
        const cleanNotes = notes.trim();
        if ((status === 'dismissed' || status === 'resolved') && !cleanNotes) {
            setActionError('Please enter brief administrative findings / notes before resolving or dismissing.');
            return;
        }

        try {
            setActionError('');
            await onResolve(report, status, suspendEstablishment, cleanNotes);
            onClose();
        } catch (err) {
            setActionError(err.message || 'Action failed. Please try again.');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adjudicate Compliance Report"
            description="Review user-submitted discrepancy, inspect evidence, and record administrative findings under Zamboanga Ordinance No. 489."
            size="lg"
        >
            <div className="space-y-4 text-xs sm:text-sm">
                {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                        <span>{actionError}</span>
                    </div>
                )}

                {/* Target & Issue Summary Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                                {report.related_to === 'product' ? (
                                    <Package size={15} />
                                ) : report.related_to === 'scanner' ? (
                                    <ScanSearch size={15} />
                                ) : (
                                    <Store size={15} />
                                )}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{subjectName}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
                                #{String(report.id || '').slice(0, 8)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <QueueStatusBadge status={report.status || 'open'} />
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <Clock size={12} />
                                {formatShortDate(report.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
                        <span className="text-slate-500">Flagged Issue:</span>
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                            {report.issue_type}
                        </span>
                        {report.establishments?.city && (
                            <span className="text-slate-500 ml-auto text-[11px]">
                                Location: {report.establishments.city}
                            </span>
                        )}
                    </div>
                </div>

                {/* Reported Description */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Reported Claim / Discrepancy
                    </label>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed text-xs sm:text-sm">
                        &quot;{report.description}&quot;
                    </div>
                </div>

                {/* Photo Evidence */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Attached Photo Proof
                    </label>
                    {safeEvidence ? (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
                                <span className="flex items-center gap-1.5">
                                    <FileText size={14} className="text-emerald-600" />
                                    Evidence Document Attached
                                </span>
                                <a
                                    href={safeEvidence}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline flex items-center gap-1 hover:text-emerald-900"
                                >
                                    Open Full Size <ExternalLink size={12} />
                                </a>
                            </div>
                            <div className="max-h-48 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                                <img
                                    src={safeEvidence}
                                    alt="Report Evidence"
                                    className="max-h-48 w-full object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg border border-slate-100">
                            No photo evidence was attached to this report.
                        </p>
                    )}
                </div>

                {/* Administrative Investigation Notes */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Administrative Findings & Notes <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                            Saved in resolution audit history
                        </span>
                    </div>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Detail the investigation steps taken (e.g. contacted owner, reviewed HCB certificate registry, confirmed relocation, dismissed as unproven hearsay)..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm outline-none focus:border-emerald-500 resize-none"
                    />
                </div>

                {/* Optional Severe Sanction: Suspend Establishment */}
                {report.establishment_id && (
                    <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={suspendEstablishment}
                                onChange={(e) => {
                                    setSuspendEstablishment(e.target.checked);
                                    if (e.target.checked) setConfirmSuspend(true);
                                }}
                                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                            <div className="text-xs">
                                <span className="font-bold text-rose-900">
                                    Flag & Suspend Establishment on Map/Registry
                                </span>
                                <p className="text-[11px] text-rose-700 leading-tight mt-0.5">
                                    Only check if a severe violation of Zamboanga Ordinance No. 489 was verified (e.g. serving pork or alcohol in an accredited kitchen). This changes the establishment status to flagged.
                                </p>
                            </div>
                        </label>
                    </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                        Close
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAction('reviewing')}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer disabled:opacity-50"
                        >
                            Mark as Investigating
                        </button>

                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAction('dismissed')}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition cursor-pointer disabled:opacity-50"
                        >
                            Dismiss Report
                        </button>

                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAction('resolved')}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-700/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={13} />
                                    <span>Resolve Issue</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
