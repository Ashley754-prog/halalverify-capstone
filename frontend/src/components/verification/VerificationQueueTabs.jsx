import { useState, useEffect } from 'react';
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    FileText,
    ExternalLink,
    MapPin,
    AlertTriangle,
    Search,
    Store,
    Package,
    Flag,
} from 'lucide-react';
import { getSafeUrl } from '../../utils/security';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';

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
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    useEffect(() => {
        setPage(1);
        setSearch('');
    }, [activeTab]);

    if (activeTab === 'establishments') {
        const filtered = establishments.filter((est) => {
            const q = search.toLowerCase().trim();
            if (!q) return true;
            return (
                (est.name || '').toLowerCase().includes(q) ||
                (est.address || '').toLowerCase().includes(q) ||
                (est.city || '').toLowerCase().includes(q) ||
                (est.certificate_number || '').toLowerCase().includes(q)
            );
        });

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const startIndex = (safePage - 1) * itemsPerPage;
        const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            Pending Establishment Registrations ({establishments.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Verify physical certificates against accredited certifying body ledgers before publishing to public search.
                        </p>
                    </div>

                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPage(1);
                        }}
                        placeholder="Filter venues by name..."
                        className="w-full sm:w-64"
                        size="sm"
                    />
                </div>

                {filtered.length === 0 ? (
                    <EmptyState
                        icon={search ? Search : CheckCircle2}
                        title={search ? 'No establishments match your filter' : 'Verification Queue is Clean!'}
                        description={
                            search
                                ? `No pending submissions match "${search}".`
                                : 'No pending establishment submissions require administrative review at this time.'
                        }
                        resetText={search ? 'Clear Filter' : undefined}
                        onReset={search ? () => setSearch('') : undefined}
                        actionText={!search && onViewChange ? 'Return to Dashboard' : undefined}
                        onAction={!search && onViewChange ? () => onViewChange('dashboard') : undefined}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {paginated.map((est) => (
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

                                    {/* Pre-Check Audit Indicator */}
                                    {est.admin_notes && est.admin_notes.includes('AI AUTO-APPROVED') && (
                                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                                Pre-Approved (High Match)
                                            </span>
                                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold">70%+</span>
                                        </div>
                                    )}
                                    {est.admin_notes && est.admin_notes.includes('AI AUDITED') && (
                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] font-bold text-amber-800 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                                                Manual Review Needed
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
                                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <ShieldCheck size={14} />
                                        <span>Inspect & Verify</span>
                                    </button>
                                    {est.certificate_url && (
                                        <button
                                            type="button"
                                            disabled={autoVerifyingId === est.id}
                                            onClick={() => handleAutoVerifyEstablishment(est.id, true)}
                                            className="py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                                            title="Run certificate check & Auto-Approve if valid"
                                        >
                                            <CheckCircle2 size={13} className={autoVerifyingId === est.id ? 'animate-spin text-emerald-600' : ''} />
                                            <span className="hidden sm:inline">Auto-Verify</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalItems > 0 && (
                    <Pagination
                        currentPage={safePage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                        onItemsPerPageChange={setItemsPerPage}
                        itemsPerPageOptions={[6, 12, 24]}
                        itemLabel="establishments"
                    />
                )}
            </div>
        );
    }

    if (activeTab === 'products') {
        const filtered = products.filter((prod) => {
            const q = search.toLowerCase().trim();
            if (!q) return true;
            return (
                (prod.name || '').toLowerCase().includes(q) ||
                (prod.category || '').toLowerCase().includes(q) ||
                (prod.brand || '').toLowerCase().includes(q)
            );
        });

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const startIndex = (safePage - 1) * itemsPerPage;
        const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            User-Submitted Food Products ({products.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Audit community product submissions before indexing them in the public database.
                        </p>
                    </div>

                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPage(1);
                        }}
                        placeholder="Filter products by name..."
                        className="w-full sm:w-64"
                        size="sm"
                    />
                </div>

                {filtered.length === 0 ? (
                    <EmptyState
                        icon={search ? Search : CheckCircle2}
                        title={search ? 'No products match your filter' : 'All Products Verified!'}
                        description={
                            search
                                ? `No pending products match "${search}".`
                                : 'No pending community products awaiting approval.'
                        }
                        resetText={search ? 'Clear Filter' : undefined}
                        onReset={search ? () => setSearch('') : undefined}
                        actionText={!search && onViewChange ? 'Return to Dashboard' : undefined}
                        onAction={!search && onViewChange ? () => onViewChange('dashboard') : undefined}
                    />
                ) : (
                    <div className="divide-y divide-slate-100">
                        {paginated.map((prod) => (
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
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                                        title="Inspect product packaging, ingredients, and certification credentials"
                                    >
                                        <FileText size={12} />
                                        <span>Inspect</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={autoVerifyingId === prod.id}
                                        onClick={() => handleAutoVerifyProduct(prod.id, true)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                                        title="Screen additives and certifying credentials"
                                    >
                                        <ShieldCheck size={12} className={autoVerifyingId === prod.id ? 'animate-spin text-emerald-600' : ''} />
                                        <span>Auto-Check</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingId === prod.id}
                                        onClick={() => handleVerifyProduct(prod, 'VERIFIED')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                    >
                                        <CheckCircle2 size={13} />
                                        <span>Approve</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingId === prod.id}
                                        onClick={() => handleVerifyProduct(prod, 'REJECTED')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1 cursor-pointer"
                                    >
                                        <XCircle size={13} />
                                        <span>Reject</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalItems > 0 && (
                    <Pagination
                        currentPage={safePage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                        onItemsPerPageChange={setItemsPerPage}
                        itemsPerPageOptions={[6, 12, 24]}
                        itemLabel="products"
                    />
                )}
            </div>
        );
    }

    if (activeTab === 'reports') {
        const filtered = reports.filter((rep) => {
            const q = search.toLowerCase().trim();
            if (!q) return true;
            return (
                (rep.issue_type || '').toLowerCase().includes(q) ||
                (rep.subject_name || '').toLowerCase().includes(q) ||
                (rep.description || '').toLowerCase().includes(q)
            );
        });

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const startIndex = (safePage - 1) * itemsPerPage;
        const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            Open User Issue Reports & Flags ({reports.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Authenticated reports flagged by community users regarding expired certificates or questionable ingredients.
                        </p>
                    </div>

                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPage(1);
                        }}
                        placeholder="Filter reports by keyword..."
                        className="w-full sm:w-64"
                        size="sm"
                    />
                </div>

                {filtered.length === 0 ? (
                    <EmptyState
                        icon={search ? Search : CheckCircle2}
                        title={search ? 'No reports match your filter' : 'No Open Reports!'}
                        description={
                            search
                                ? `No issue reports match "${search}".`
                                : 'The community flag queue is completely resolved.'
                        }
                        resetText={search ? 'Clear Filter' : undefined}
                        onReset={search ? () => setSearch('') : undefined}
                        actionText={!search && onViewChange ? 'Return to Dashboard' : undefined}
                        onAction={!search && onViewChange ? () => onViewChange('dashboard') : undefined}
                    />
                ) : (
                    <div className="space-y-3">
                        {paginated.map((rep) => (
                            <div
                                key={rep.id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 shadow-2xs"
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
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition cursor-pointer"
                                    >
                                        Dismiss Flag
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingId === rep.id}
                                        onClick={() => handleResolveReport(rep, 'resolved')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                                    >
                                        Resolve Issue
                                    </button>
                                    {rep.establishment_id && (
                                        <button
                                            type="button"
                                            disabled={processingId === rep.id}
                                            onClick={() => handleResolveReport(rep, 'resolved', true)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1 cursor-pointer"
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

                {totalItems > 0 && (
                    <Pagination
                        currentPage={safePage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                        onItemsPerPageChange={setItemsPerPage}
                        itemsPerPageOptions={[6, 12, 24]}
                        itemLabel="reports"
                    />
                )}
            </div>
        );
    }

    return null;
}
