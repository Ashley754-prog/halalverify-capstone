import { useState, useEffect } from 'react';
import {
    Database,
    Search,
    Pencil,
    Trash2,
    Flag,
    MapPin,
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
    const [standardFilter, setStandardFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all_active');
    const [districtFilter, setDistrictFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const activeEstablishmentsCount = establishments.filter((shop) => {
        const s = (shop.halal_status || shop.status || '').toLowerCase().trim();
        return !(
            s === 'rejected' ||
            s.includes('reject') ||
            s === 'flagged' ||
            s === 'suspended' ||
            s === 'expired' ||
            s === 'needs_review' ||
            s === 'pending' ||
            s.includes('pending') ||
            s === 'permanently_closed' ||
            s === 'demolished' ||
            s === 'relocated'
        );
    }).length;

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

        const cfg = getStatusConfig(shop);
        const shopStatus = (shop.halal_status || shop.status || '').toLowerCase().trim();
        const isNonActiveStatus =
            shopStatus === 'suspended' ||
            shopStatus === 'flagged' ||
            shopStatus === 'rejected' ||
            shopStatus.includes('reject') ||
            shopStatus === 'needs_review' ||
            shopStatus === 'pending' ||
            shopStatus.includes('pending') ||
            shopStatus === 'permanently_closed' ||
            shopStatus === 'demolished' ||
            shopStatus === 'relocated' ||
            cfg.key === 'suspended' ||
            cfg.key === 'rejected' ||
            cfg.key === 'needs_review' ||
            cfg.key === 'permanently_closed' ||
            cfg.key === 'demolished';

        // Public non-admins should never see non-active establishments
        if (!isAdmin && isNonActiveStatus) {
            return false;
        }

        // 1. Verification Standard Filter (Halal Tier)
        if (standardFilter !== 'all') {
            const tier = shop.halal_tier || cfg.key;
            if (standardFilter === 'halal_certified' || standardFilter === 'verified') {
                if (tier !== 'halal_certified' && cfg.key !== 'verified') return false;
            } else if (standardFilter === 'muslim_owned') {
                if (tier !== 'muslim_owned' && cfg.key !== 'muslim_owned' && cfg.key !== 'community') return false;
            } else if (standardFilter === 'muslim_friendly') {
                if (tier !== 'muslim_friendly' && cfg.key !== 'muslim_friendly') return false;
            }
        }

        // 2. Registry Status Filter
        if (statusFilter === 'all_active') {
            return !isNonActiveStatus;
        }
        if (statusFilter === 'all') {
            return true;
        }
        if (statusFilter === 'verified') {
            return !isNonActiveStatus;
        }
        if (statusFilter === 'needs_review') {
            return cfg.key === 'needs_review' || cfg.key === 'pending_review' || shopStatus === 'needs_review' || shopStatus.includes('pending');
        }
        if (statusFilter === 'suspended') {
            return cfg.key === 'suspended' || cfg.key === 'flagged' || shopStatus === 'suspended' || shopStatus === 'flagged';
        }
        if (statusFilter === 'relocated') {
            return cfg.key === 'relocated' || shopStatus === 'relocated' || shopStatus.includes('relocat');
        }
        if (statusFilter === 'permanently_closed') {
            return cfg.key === 'permanently_closed' || shopStatus === 'permanently_closed' || shopStatus.includes('close');
        }
        if (statusFilter === 'demolished') {
            return cfg.key === 'demolished' || shopStatus === 'demolished' || shopStatus.includes('demolish');
        }

        return true;
    });

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [districtFilter, standardFilter, statusFilter, localSearch]);

    const totalItems = filteredEstablishments.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedEstablishments = filteredEstablishments.slice(startIndex, startIndex + itemsPerPage);

    const handleResetFilters = () => {
        setLocalSearch('');
        setStandardFilter('all');
        setStatusFilter('all_active');
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full md:w-auto">
                    <select
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full lg:w-auto"
                        aria-label="Filter by Zamboanga District"
                    >
                        {ZAMBOANGA_DISTRICTS.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={standardFilter}
                        onChange={(e) => setStandardFilter(e.target.value)}
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full lg:w-auto"
                        aria-label="Filter by verification standard"
                    >
                        <option value="all">All Standards ({activeEstablishmentsCount})</option>
                        <option value="halal_certified">Halal Certified</option>
                        <option value="muslim_owned">Muslim-Owned</option>
                        <option value="muslim_friendly">Muslim-Friendly</option>
                    </select>

                    {isAdmin && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full lg:w-auto"
                            aria-label="Filter by registry status"
                        >
                            <option value="all_active">Operational / Published</option>
                            <option value="all">All Statuses (Admin)</option>
                            <option value="needs_review">Needs Review</option>
                            <option value="suspended">Suspended</option>
                            <option value="relocated">Relocated / Moved</option>
                            <option value="permanently_closed">Permanently Closed</option>
                            <option value="demolished">Demolished / Ceased Operations</option>
                        </select>
                    )}

                    <SearchBar
                        value={localSearch}
                        onChange={setLocalSearch}
                        placeholder="Search name, street, cuisine..."
                        className="col-span-1 sm:col-span-2 lg:col-span-1 lg:w-64"
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
                        const hasExplicitNoPhoto = shop.logo_url === 'none' || shop.photo_url === 'none';
                        const customPhoto = getSafeUrl(shop.logo_url || shop.photo_url || shop.image_url);
                        const establishmentImageUrl = hasExplicitNoPhoto ? null : (customPhoto || getEstablishmentPhoto(shop));
                        const rawCertUrl = shop.certificate_url ? getSafeUrl(shop.certificate_url) : null;
                        const hasActualCertificateDoc = Boolean(rawCertUrl && rawCertUrl !== establishmentImageUrl && rawCertUrl !== 'none');
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
                                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 h-full min-w-0 overflow-hidden hover:border-slate-300 hover:bg-white hover:shadow-md transition"
                            >
                                {establishmentImageUrl ? (
                                    <a
                                        href={establishmentImageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative -mx-3.5 -mt-3.5 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-emerald-700/40 sm:-mx-4 sm:-mt-4 group/photo cursor-pointer"
                                        title="Click to view full photo"
                                    >
                                        <Store size={32} strokeWidth={1.5} aria-hidden="true" />
                                        <img
                                            src={establishmentImageUrl}
                                            alt={`${shop.name} establishment`}
                                            loading="lazy"
                                            onError={(event) => event.currentTarget.classList.add('hidden')}
                                            className="absolute inset-0 h-full w-full object-cover group-hover/photo:scale-105 transition duration-300"
                                        />
                                        <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md border ${statusConfig.badgeBg}`}>
                                            {statusConfig.label}
                                        </span>
                                    </a>
                                ) : (
                                    <div className="relative -mx-3.5 -mt-3.5 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-emerald-700/40 sm:-mx-4 sm:-mt-4">
                                        <Store size={32} strokeWidth={1.5} aria-hidden="true" />
                                        <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md border ${statusConfig.badgeBg}`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-1.5 min-w-0 w-full flex-1">
                                    <h4
                                        className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 min-w-0"
                                        title={shop.name}
                                    >
                                        {shop.name}
                                    </h4>

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 truncate">
                                        <span>{shop.type || 'Restaurant'}</span>
                                        {districtInfo && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-slate-500 font-semibold">{districtInfo.shortLabel}</span>
                                            </>
                                        )}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => onViewChange?.('map', { searchQuery: shop.name })}
                                        className="w-full max-w-full overflow-hidden text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 min-w-0 text-left transition group cursor-pointer pt-0.5"
                                        title="Click to view establishment on interactive GPS Map"
                                    >
                                        <MapPin size={12} className="text-slate-400 group-hover:text-emerald-600 shrink-0 transition" />
                                        <span className="truncate flex-1 min-w-0 group-hover:underline text-[11px] sm:text-xs text-slate-600">{shop.address || 'Zamboanga City'}</span>
                                        <span className="text-[9px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition shrink-0 hidden sm:inline">Map ↗</span>
                                    </button>
                                </div>

                                {isFormallyCertified && shop.certificate_number && (
                                    hasActualCertificateDoc ? (
                                        <a
                                            href={rawCertUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between gap-2 text-xs bg-emerald-50/80 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 font-mono text-slate-700 min-w-0 overflow-hidden transition group"
                                            title="Click to inspect official certificate document"
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                <ShieldCheck size={12} className="text-emerald-700 shrink-0" />
                                                <span className="font-bold text-slate-800 text-[11px] truncate group-hover:text-emerald-900">
                                                    {shop.certificate_number}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="font-bold text-emerald-700 text-[10px] font-sans">
                                                    {shop.expiry_date || 'Active'}
                                                </span>
                                                <ExternalLink size={10} className="text-emerald-600 group-hover:text-emerald-800" />
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="flex items-center justify-between gap-2 text-xs bg-emerald-50/70 px-2.5 py-1.5 rounded-xl border border-emerald-100 font-mono text-slate-700 min-w-0 overflow-hidden">
                                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                                                <span className="font-bold text-slate-800 text-[11px] truncate">
                                                    {shop.certificate_number}
                                                </span>
                                            </div>
                                            <span className="font-bold text-emerald-700 text-[10px] font-sans shrink-0">
                                                {shop.expiry_date || 'Active'}
                                            </span>
                                        </div>
                                    )
                                )}

                                {(() => {
                                    const formatAmenityLabel = (raw) => {
                                        const s = String(raw).trim();
                                        const l = s.toLowerCase();
                                        if (l.includes('prayer') || l.includes('musalah')) return 'Prayer Space';
                                        if (l.includes('alcohol')) return 'Alcohol-Free';
                                        if (l.includes('pork')) return 'Pork-Free';
                                        if (l.includes('meat')) return 'Halal Meat';
                                        if (l.includes('wudu') || l.includes('ablution')) return 'Wudu Area';
                                        if (l.includes('family')) return 'Family Section';
                                        return s.length > 18 ? `${s.slice(0, 16)}…` : s;
                                    };

                                    const REMOVED_AMENITY_KEYS = ['alcohol', 'wudu', 'ablution', 'halal meat', 'pork-free', 'pork free'];
                                    const rawAmenitiesList = (Array.isArray(shop.amenities)
                                        ? [...shop.amenities]
                                        : (shop.description && shop.description.includes('Amenities:'))
                                            ? shop.description.split('Amenities:')[1].split('|').map(s => s.trim()).filter(Boolean)
                                            : []
                                    ).filter(a => !REMOVED_AMENITY_KEYS.some(k => String(a).toLowerCase().includes(k)));

                                    if (hasPrayer && !rawAmenitiesList.some(a => String(a).toLowerCase().includes('prayer'))) {
                                        rawAmenitiesList.push('Dedicated Prayer Space (Musalah)');
                                    }

                                    const displayAmenities = Array.from(new Set(rawAmenitiesList.map(formatAmenityLabel)));
                                    const visibleAmenities = displayAmenities.slice(0, 2);
                                    const overflowCount = displayAmenities.length - 2;

                                    return (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
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
                                            {visibleAmenities.map((label) => (
                                                <span
                                                    key={label}
                                                    className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                            {overflowCount > 0 && (
                                                <span
                                                    title={displayAmenities.slice(2).join(', ')}
                                                    className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md cursor-help"
                                                >
                                                    +{overflowCount} more
                                                </span>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Card Actions */}
                                {isAdmin ? (
                                    <div className="flex gap-2 pt-1.5 border-t border-slate-200/60 mt-auto">
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
                                    <div className="pt-1.5 border-t border-slate-200/60 mt-auto">
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
