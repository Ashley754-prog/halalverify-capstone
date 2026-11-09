import { useState, useEffect } from 'react';
import {
    Database,
    Search,
    Pencil,
    Trash2,
    Flag,
    MapPin,
    Compass,
    ShieldCheck,
    Store,
    ExternalLink,
} from 'lucide-react';
import { getStatusConfig, ZAMBOANGA_DISTRICTS, resolveZamboangaDistrict, getEstablishmentPhoto } from '../../data/constants';
import { getSafeUrl } from '../../utils/security';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';

export default function EstablishmentsRegistryTab({
    establishments,
    localSearch,
    setLocalSearch,
    isAdmin,
    onOpenModal,
    onDeleteEstablishment,
    onReportEstablishment,
    onViewChange,
}) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [districtFilter, setDistrictFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const filteredEstablishments = establishments.filter((shop) => {
        const matchesSearch =
            (shop.name || '').toLowerCase().includes(localSearch.toLowerCase()) ||
            (shop.address || '').toLowerCase().includes(localSearch.toLowerCase()) ||
            (shop.type || '').toLowerCase().includes(localSearch.toLowerCase());

        if (!matchesSearch) return false;

        if (districtFilter !== 'all') {
            const dist = resolveZamboangaDistrict(shop);
            if (dist.id !== districtFilter) return false;
        }

        const sLower = (shop.halal_status || '').toLowerCase().trim();
        // Never show rejected, pending review, flagged, or suspended establishments in public registry
        if (
            sLower === 'rejected' ||
            sLower.includes('reject') ||
            sLower === 'flagged' ||
            sLower === 'suspended' ||
            sLower === 'expired' ||
            sLower === 'needs_review' ||
            sLower === 'pending' ||
            sLower.includes('pending') ||
            sLower.includes('needs_review')
        ) {
            return false;
        }

        const cfg = getStatusConfig(shop);
        if (cfg.key === 'needs_review' || cfg.key === 'pending_review' || cfg.key === 'rejected' || cfg.key === 'flagged') {
            return false;
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'verified') return cfg.key === 'verified';
            if (statusFilter === 'muslim_owned') return cfg.key === 'muslim_owned' || cfg.key === 'community';
            if (statusFilter === 'muslim_friendly') return cfg.key === 'muslim_friendly';
            if (statusFilter === 'vegetarian_vegan') return cfg.key === 'vegetarian_vegan';
        }
        return true;
    });

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [districtFilter, statusFilter, localSearch]);

    const totalItems = filteredEstablishments.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedEstablishments = filteredEstablishments.slice(startIndex, startIndex + itemsPerPage);

    const handleResetFilters = () => {
        setLocalSearch('');
        setStatusFilter('all');
        setDistrictFilter('all');
    };

    return (
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full">
            {/* Header Toolbar: Ordinance Standard and Controls */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2.5 sm:gap-3 mb-3 sm:mb-6 shrink-0">
                <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                        <Database className="text-emerald-600 shrink-0" size={18} /> Zamboanga Ordinance No. 489 Registers
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                        Active certificates, business clearances, and inspection audits in Zamboanga City.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
                    <select
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto"
                        aria-label="Filter by Zamboanga District"
                    >
                        {ZAMBOANGA_DISTRICTS.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto"
                        aria-label="Filter by verification standard"
                    >
                        <option value="all">All Standards ({filteredEstablishments.length})</option>
                        <option value="verified">Certified</option>
                        <option value="muslim_owned">Muslim-Owned</option>
                        <option value="muslim_friendly">Muslim-Friendly</option>
                        <option value="vegetarian_vegan">Plant-Based</option>
                        {isAdmin && <option value="needs_review">Pending Review</option>}
                    </select>

                    <SearchBar
                        value={localSearch}
                        onChange={setLocalSearch}
                        placeholder="Search name, street, cuisine..."
                        className="col-span-2 md:col-span-1 md:w-72"
                        size="sm"
                    />
                </div>
            </div>

            {/* Establishments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-2">
                {filteredEstablishments.length === 0 ? (
                    <EmptyState
                        icon={Database}
                        title="No establishments found"
                        description="No registered establishments match your active filter criteria."
                        resetText="Reset Filters"
                        onReset={handleResetFilters}
                    />
                ) : (
                    paginatedEstablishments.map((shop) => {
                        const statusConfig = getStatusConfig(shop);
                        const districtInfo = resolveZamboangaDistrict(shop);
                        const establishmentImageUrl = getEstablishmentPhoto(shop) || getSafeUrl(shop.photo_url || shop.image_url || shop.logo_url);
                        const evidenceUrl = getEstablishmentPhoto(shop) || getSafeUrl(shop.certificate_url || shop.logo_url);
                        const isFormallyCertified = Boolean(shop.certificate_number || statusConfig.key === 'verified');
                        const hasPrayer = Boolean(
                            shop.has_prayer_space ||
                            (shop.description && (shop.description.toLowerCase().includes('prayer') || shop.description.toLowerCase().includes('musalah'))) ||
                            (Array.isArray(shop.amenities) && shop.amenities.some((a) => String(a).toLowerCase().includes('prayer')))
                        );
                        const hasAlcoholFree = Boolean(
                            shop.is_alcohol_free ||
                            (shop.description && shop.description.toLowerCase().includes('alcohol')) ||
                            (Array.isArray(shop.amenities) && shop.amenities.some((a) => String(a).toLowerCase().includes('alcohol')))
                        );

                        return (
                            <div
                                key={shop.id}
                                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 h-full min-w-0 overflow-hidden hover:border-slate-300 hover:bg-white transition shadow-xs"
                            >
                                <div className="relative -mx-3.5 -mt-3.5 mb-1 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-emerald-700/40 sm:-mx-4 sm:-mt-4">
                                    <Store size={32} strokeWidth={1.5} aria-hidden="true" />
                                    {establishmentImageUrl && (
                                        <img
                                            src={establishmentImageUrl}
                                            alt={`${shop.name} establishment`}
                                            loading="lazy"
                                            onError={(event) => event.currentTarget.classList.add('hidden')}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="space-y-1.5 min-w-0 w-full overflow-hidden">
                                    <div className="flex justify-between items-start gap-2 min-w-0">
                                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 min-w-0">
                                            {shop.name}
                                        </h4>
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${statusConfig.badgeBg}`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                                        {shop.type || 'Restaurant'}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => onViewChange?.('map', { searchQuery: shop.name })}
                                        className="w-full max-w-full overflow-hidden text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 min-w-0 text-left transition group cursor-pointer"
                                        title={shop.address || 'Zamboanga City'}
                                    >
                                        <MapPin size={12} className="text-slate-400 group-hover:text-emerald-600 shrink-0 transition" />
                                        <span className="truncate flex-1 min-w-0 group-hover:underline">{shop.address || 'Zamboanga City'}</span>
                                    </button>
                                </div>

                                {isFormallyCertified && shop.certificate_number && (
                                    <div className="flex items-center justify-between gap-2 text-xs bg-emerald-50/60 px-2.5 py-1.5 rounded-xl border border-emerald-100 font-mono text-slate-600 min-w-0 overflow-hidden">
                                        <span className="font-bold text-slate-800 text-[11px] truncate min-w-0">
                                            {shop.certificate_number}
                                        </span>
                                        <span className="font-bold text-emerald-700 text-[10px] font-sans shrink-0">
                                            {shop.expiry_date || 'Active'}
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    {districtInfo && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${districtInfo.badgeClass}`}>
                                            {districtInfo.shortLabel}
                                        </span>
                                    )}
                                    {shop.facebook_url && (
                                        <a
                                            href={getSafeUrl(shop.facebook_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition"
                                        >
                                            <svg className="w-2.5 h-2.5 text-[#1877F2] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                            </svg>
                                            <span>Facebook</span>
                                            <ExternalLink size={9} />
                                        </a>
                                    )}
                                    {evidenceUrl && (
                                        <a
                                            href={evidenceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md transition"
                                        >
                                            <ShieldCheck size={11} className="text-emerald-700" />
                                            <span>Evidence</span>
                                            <ExternalLink size={10} />
                                        </a>
                                    )}
                                    {hasPrayer && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                            <Compass size={11} className="text-emerald-600" />
                                            Prayer
                                        </span>
                                    )}
                                    {hasAlcoholFree && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                            <ShieldCheck size={11} className="text-emerald-600" />
                                            Alcohol-Free
                                        </span>
                                    )}
                                </div>

                                {/* Card Actions */}
                                {isAdmin ? (
                                    <div className="flex gap-2 pt-1 border-t border-slate-200/60">
                                        <button
                                            onClick={() => onOpenModal('edit-establishment', shop)}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                        >
                                            <Pencil size={12} /> Edit
                                        </button>
                                        <button
                                            onClick={() => onDeleteEstablishment(shop)}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-1 border-t border-slate-200/60">
                                        <button
                                            type="button"
                                            onClick={() => onReportEstablishment(shop)}
                                            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 bg-white hover:bg-amber-50 border border-slate-200 py-1.5 rounded-lg transition cursor-pointer"
                                            title="Report issue or flag establishment"
                                        >
                                            <Flag size={12} className="text-amber-500" />
                                            <span>Report Issue</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Standardized Global Pagination */}
            {totalItems > 0 && (
                <Pagination
                    currentPage={safePage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemsPerPageOptions={[8, 16, 24]}
                    itemLabel="venues"
                />
            )}
        </div>
    );
}
