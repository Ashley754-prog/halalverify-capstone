import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Search,
    AlertTriangle,
    RotateCcw,
    RefreshCw,
} from 'lucide-react';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';
import EstablishmentQueueCard from './EstablishmentQueueCard';
import ProductQueueRow from './ProductQueueRow';
import ReportQueueCard from './ReportQueueCard';
import { EstablishmentSkeletons, ProductSkeletons } from './QueueSkeletons';

export default function VerificationQueueTabs({
    activeTab,
    establishments = [],
    products = [],
    reports = [],
    onViewChange,
    openInspection,
    autoVerifyingId,
    processingId,
    handleAutoVerifyEstablishment,
    handleAutoVerifyProduct,
    handleVerifyProduct,
    handleResolveReport,
    onInspectReport,
    loading = false,
    refreshing = false,
    error = null,
    onRetry,
    onRequestRejectProduct,
}) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(activeTab === 'products' ? 10 : 6);

    // Keep pagination density suited to layout
    useEffect(() => {
        setPage(1);
        setSearch('');
        setItemsPerPage(activeTab === 'products' ? 10 : 6);
    }, [activeTab]);

    // -------------------------------------------------------------
    // Global Error View (when both backend and Supabase fail)
    // -------------------------------------------------------------
    if (error && establishments.length === 0 && products.length === 0 && reports.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                    <AlertTriangle size={24} />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-bold text-slate-900">Failed to Load Verification Queue</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {error || 'Unable to establish connection with verification services. Please check credentials or try again.'}
                    </p>
                </div>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <RotateCcw size={13} />
                        <span>Retry Connection</span>
                    </button>
                )}
            </div>
        );
    }

    // -------------------------------------------------------------
    // Establishments Tab
    // -------------------------------------------------------------
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
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>Pending Establishment Registrations</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                                {refreshing && <RefreshCw size={11} className="animate-spin text-emerald-600" />}
                                <span>{search ? `${filtered.length} of ${establishments.length}` : establishments.length}</span>
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Verify physical certificates against accredited certifying body ledgers before publishing to public search.
                        </p>
                    </div>

                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPage(1);
                        }}
                        placeholder="Search name, address, or cert no..."
                        ariaLabel="Search pending establishments"
                        className="w-full sm:w-72"
                        size="sm"
                    />
                </div>

                {loading && establishments.length === 0 ? (
                    <EstablishmentSkeletons count={itemsPerPage} />
                ) : filtered.length === 0 ? (
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
                            <EstablishmentQueueCard
                                key={est.id}
                                est={est}
                                openInspection={openInspection}
                                autoVerifyingId={autoVerifyingId}
                                handleAutoVerifyEstablishment={handleAutoVerifyEstablishment}
                            />
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

    // -------------------------------------------------------------
    // Community Products Tab
    // -------------------------------------------------------------
    if (activeTab === 'products') {
        const filtered = products.filter((prod) => {
            const q = search.toLowerCase().trim();
            if (!q) return true;
            return (
                (prod.name || '').toLowerCase().includes(q) ||
                (prod.category || '').toLowerCase().includes(q) ||
                (prod.brand || '').toLowerCase().includes(q) ||
                (prod.barcode || '').toLowerCase().includes(q) ||
                (prod.establishments?.name || '').toLowerCase().includes(q)
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
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>User-Submitted Food Products</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                                {refreshing && <RefreshCw size={11} className="animate-spin text-emerald-600" />}
                                <span>{search ? `${filtered.length} of ${products.length}` : products.length}</span>
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Audit community product submissions and itemized menu dishes before indexing them in the public database.
                        </p>
                    </div>

                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPage(1);
                        }}
                        placeholder="Search name, brand, category, or venue..."
                        ariaLabel="Search pending products"
                        className="w-full sm:w-72"
                        size="sm"
                    />
                </div>

                {loading && products.length === 0 ? (
                    <ProductSkeletons count={itemsPerPage} />
                ) : filtered.length === 0 ? (
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
                            <ProductQueueRow
                                key={prod.id}
                                prod={prod}
                                openInspection={openInspection}
                                autoVerifyingId={autoVerifyingId}
                                processingId={processingId}
                                handleAutoVerifyProduct={handleAutoVerifyProduct}
                                handleVerifyProduct={handleVerifyProduct}
                                onRequestReject={onRequestRejectProduct}
                            />
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
                        itemsPerPageOptions={[10, 20, 50]}
                        itemLabel="products"
                    />
                )}
            </div>
        );
    }

    // -------------------------------------------------------------
    // Reports Tab
    // -------------------------------------------------------------
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
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>Open User Issue Reports & Flags</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {search ? `${filtered.length} of ${reports.length}` : reports.length}
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
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
                        ariaLabel="Search open issue reports"
                        className="w-full sm:w-72"
                        size="sm"
                    />
                </div>

                {loading && reports.length === 0 ? (
                    <EstablishmentSkeletons count={itemsPerPage} />
                ) : filtered.length === 0 ? (
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
                            <ReportQueueCard
                                key={rep.id}
                                rep={rep}
                                processingId={processingId}
                                handleResolveReport={handleResolveReport}
                                onInspectReport={onInspectReport}
                            />
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
