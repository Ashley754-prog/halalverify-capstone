import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    FileText,
    ExternalLink,
    MapPin,
    AlertTriangle,
    Sparkles,
} from 'lucide-react';
import { getSafeUrl } from '../../utils/security';

export default function VerificationQueueTabs({
    activeTab,
    establishments,
    products,
    reports,
    onViewChange,
    openInspection,
    autoVerifyingId,
    processingId,
    handleAutoVerifyEstablishment,
    handleAutoVerifyProduct,
    handleVerifyProduct,
    handleResolveReport,
}) {
    if (activeTab === 'establishments') {
        return (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Pending Establishment Registrations ({establishments.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Verify physical certificates against accredited certifying body ledgers before publishing to public search.
                        </p>
                    </div>
                </div>

                {establishments.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-2">
                        <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                        <p className="text-sm font-bold text-slate-700">Verification Queue is Clean!</p>
                        <p className="text-xs">No pending establishment submissions require administrative review at this time.</p>
                        {onViewChange && (
                            <button
                                type="button"
                                onClick={() => onViewChange('dashboard')}
                                className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1"
                            >
                                Return to Dashboard
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {establishments.map((est) => (
                            <div
                                key={est.id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col justify-between space-y-3 shadow-xs"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                                {est.halal_status?.toUpperCase() || 'PENDING'}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                {est.source?.includes('Owner') || est.submitter_role === 'owner' ? 'Owner / Staff' : 'Customer / Scout'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {est.created_at ? new Date(est.created_at).toLocaleDateString() : 'Recent'}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                                        {est.name}
                                    </h4>

                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <MapPin size={12} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{est.address || est.city || 'Zamboanga City'}</span>
                                    </p>

                                    <div className="rounded-lg bg-white p-2 border border-slate-200/80 text-[11px] space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Certifier:</span>
                                            <span className="font-bold text-slate-700">
                                                {est.certifying_bodies?.code || 'Not Specified'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Cert No:</span>
                                            <span className="font-semibold text-slate-800">
                                                {est.certificate_number || 'Awaiting Input'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* AI Pre-Check Audit Indicator */}
                                    {est.admin_notes && est.admin_notes.includes('AI AUTO-APPROVED') && (
                                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles size={13} className="text-emerald-600 shrink-0" />
                                                AI Pre-Approved (High Match)
                                            </span>
                                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold">70%+</span>
                                        </div>
                                    )}
                                    {est.admin_notes && est.admin_notes.includes('AI AUDITED') && (
                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] font-bold text-amber-800 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                                                AI Audit: Manual Review Needed
                                            </span>
                                        </div>
                                    )}

                                    {est.certificate_url && (
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-xs flex items-center justify-between text-emerald-800">
                                            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                                                <FileText size={13} className="text-emerald-600" />
                                                Certificate Attached
                                            </span>
                                            <span className="text-[10px] text-emerald-700 font-bold">Image / Doc</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => openInspection(est)}
                                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <ShieldCheck size={14} />
                                        <span>Inspect & Verify</span>
                                    </button>
                                    {est.certificate_url && (
                                        <button
                                            type="button"
                                            disabled={autoVerifyingId === est.id}
                                            onClick={() => handleAutoVerifyEstablishment(est.id, true)}
                                            className="py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center justify-center gap-1 shrink-0"
                                            title="Run instant AI OCR & Auto-Approve if valid"
                                        >
                                            <Sparkles size={13} className={autoVerifyingId === est.id ? 'animate-spin text-emerald-600' : ''} />
                                            <span className="hidden sm:inline">Auto-Verify</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'products') {
        return (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            User-Submitted Food Products ({products.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Audit community product submissions before indexing them in the public database.
                        </p>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-2">
                        <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                        <p className="text-sm font-bold text-slate-700">All Products Verified!</p>
                        <p className="text-xs">No pending community products awaiting approval.</p>
                        {onViewChange && (
                            <button
                                type="button"
                                onClick={() => onViewChange('dashboard')}
                                className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1"
                            >
                                Return to Dashboard
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {products.map((prod) => (
                            <div key={prod.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-900">{prod.name}</span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                            {prod.status}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Category: <b className="text-slate-700">{prod.category || 'Food Item'}</b> •{' '}
                                        Establishment: <b className="text-slate-700">{prod.establishments?.name || 'Standalone'}</b>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => openInspection(prod, 'product')}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1"
                                        title="Inspect product packaging, ingredients, and certification credentials"
                                    >
                                        <FileText size={12} />
                                        <span>Inspect</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={autoVerifyingId === prod.id}
                                        onClick={() => handleAutoVerifyProduct(prod.id, true)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1"
                                        title="Screen additives and certifying credentials using AI"
                                    >
                                        <Sparkles size={12} className={autoVerifyingId === prod.id ? 'animate-spin text-emerald-600' : ''} />
                                        <span>AI Check</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingId === prod.id}
                                        onClick={() => handleVerifyProduct(prod, 'VERIFIED')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center gap-1"
                                    >
                                        <CheckCircle2 size={13} />
                                        <span>Approve</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingId === prod.id}
                                        onClick={() => handleVerifyProduct(prod, 'REJECTED')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1"
                                    >
                                        <XCircle size={13} />
                                        <span>Reject</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'reports') {
        return (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Open User Issue Reports & Flags ({reports.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Authenticated reports flagged by community users regarding expired certificates or questionable ingredients.
                        </p>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-2">
                        <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                        <p className="text-sm font-bold text-slate-700">No Open Reports!</p>
                        <p className="text-xs">The community flag queue is completely resolved.</p>
                        {onViewChange && (
                            <button
                                type="button"
                                onClick={() => onViewChange('dashboard')}
                                className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1"
                            >
                                Return to Dashboard
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((rep) => (
                            <div
                                key={rep.id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                            {rep.issue_type}
                                        </span>
                                        <span className="text-xs font-bold text-slate-800">
                                            Subject: {rep.subject_name || rep.products?.name || rep.establishments?.name || 'Report Target'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {rep.created_at ? new Date(rep.created_at).toLocaleString() : ''}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                    &quot;{rep.description}&quot;
                                </p>

                                {getSafeUrl(rep.evidence_url) && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                                        <FileText size={13} />
                                        <a href={getSafeUrl(rep.evidence_url)} target="_blank" rel="noopener noreferrer" className="underline font-semibold flex items-center gap-1">
                                            View Attached Photo Evidence <ExternalLink size={11} />
                                        </a>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                    <button
                                        type="button"
                                        disabled={processingId === rep.id}
                                        onClick={() => handleResolveReport(rep, 'dismissed')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition"
                                    >
                                        Dismiss Flag
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingId === rep.id}
                                        onClick={() => handleResolveReport(rep, 'resolved')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                                    >
                                        Resolve Issue
                                    </button>
                                    {rep.establishment_id && (
                                        <button
                                            type="button"
                                            disabled={processingId === rep.id}
                                            onClick={() => handleResolveReport(rep, 'resolved', true)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1"
                                            title="Flag and suspend establishment based on confirmed violation"
                                        >
                                            <AlertTriangle size={12} />
                                            <span>Suspend Establishment</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
