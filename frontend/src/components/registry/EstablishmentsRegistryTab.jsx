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
    ExternalLink,
    ChevronDown,
} from 'lucide-react';
import { getStatusConfig, ZAMBOANGA_DISTRICTS, resolveZamboangaDistrict } from '../../data/constants';
import { getSafeUrl } from '../../utils/security';

export default function EstablishmentsRegistryTab({
    establishments,
    localSearch,
    setLocalSearch,
    isAdmin,
    onOpenModal,
    onDeleteEstablishment,
    onReportEstablishment,
}) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [districtFilter, setDistrictFilter] = useState('all');
    const INITIAL_COUNT = 8;
    const LOAD_INCREMENT = 8;
    const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

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

        if (statusFilter !== 'all') {
            const cfg = getStatusConfig(shop);
            if (statusFilter === 'verified') return cfg.key === 'verified';
            if (statusFilter === 'muslim_owned') return cfg.key === 'muslim_owned' || cfg.key === 'community';
            if (statusFilter === 'muslim_friendly') return cfg.key === 'muslim_friendly';
            if (statusFilter === 'vegetarian_vegan') return cfg.key === 'vegetarian_vegan';
            if (statusFilter === 'needs_review') return cfg.key === 'needs_review' || cfg.key === 'pending_review';
        } else {
            const cfg = getStatusConfig(shop);
            if (cfg.key === 'needs_review' || cfg.key === 'pending_review') return false;
            const sLower = (shop.halal_status || '').toLowerCase();
            if (sLower.includes('reject') || sLower.includes('flag') || sLower.includes('suspend')) return false;
        }
        return true;
    });

    // Reset visible count to initial batch whenever filters or search query change
    useEffect(() => {
        setVisibleCount(INITIAL_COUNT);
    }, [districtFilter, statusFilter, localSearch]);

    const totalItems = filteredEstablishments.length;
    const visibleEstablishments = filteredEstablishments.slice(0, visibleCount);
    const remainingCount = Math.max(0, totalItems - visibleCount);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + LOAD_INCREMENT);
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

                    <div className="relative col-span-2 md:col-span-1 md:w-72">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search name, street, cuisine..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 text-xs focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Establishments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-2">
                {filteredEstablishments.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        <Database size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold">No establishments found matching your filter criteria.</p>
                        <button
                            type="button"
                            onClick={() => {
                                setLocalSearch('');
                                setStatusFilter('all');
                                setDistrictFilter('all');
                            }}
                            className="text-xs text-emerald-700 font-bold hover:underline mt-2 inline-block cursor-pointer"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    visibleEstablishments.map((shop) => {
                        const statusConfig = getStatusConfig(shop);
                        const districtInfo = resolveZamboangaDistrict(shop);
                        const evidenceUrl = getSafeUrl(shop.certificate_url || shop.logo_url);
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
                                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 sm:gap-3 h-full hover:border-slate-300 hover:bg-white transition shadow-xs"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {shop.type || 'Restaurant'}
                                            </span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                                                {shop.source?.includes('Owner') || shop.submitter_role === 'owner' ? 'Owner / Staff' : 'Community Scout'}
                                            </span>
                                            {districtInfo && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${districtInfo.badgeClass}`}>
                                                    {districtInfo.shortLabel}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${statusConfig.badgeBg}`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                                        {shop.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 min-w-0" title={shop.address || 'Zamboanga City'}>
                                        <MapPin size={12} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{shop.address || 'Zamboanga City'}</span>
                                    </p>
                                </div>

                                {/* Dynamic, Compact Single-Row Metadata Box */}
                                {isFormallyCertified ? (
                                    <div className="flex items-center justify-between text-xs bg-emerald-50/60 px-2.5 py-1.5 rounded-xl border border-emerald-100 font-mono text-slate-600">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold shrink-0">Cert ID:</span>
                                            <span className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">{shop.certificate_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Expires:</span>
                                            <span className="font-bold text-emerald-800 text-[11px] sm:text-xs">{shop.expiry_date || 'Active'}</span>
                                        </div>
                                    </div>
                                ) : statusConfig.key === 'muslim_owned' ? (
                                    <div className="flex items-center justify-between text-xs bg-sky-50/70 px-2.5 py-1.5 rounded-xl border border-sky-100 font-sans text-slate-600">
                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-700">Pork-Free Kitchen</span>
                                        <span className="font-bold text-sky-800 text-[11px] sm:text-xs">Muslim-Owned</span>
                                    </div>
                                ) : statusConfig.key === 'muslim_friendly' ? (
                                    <div className="flex items-center justify-between text-xs bg-indigo-50/70 px-2.5 py-1.5 rounded-xl border border-indigo-100 font-sans text-slate-600">
                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-700">Halal Options</span>
                                        <span className="font-bold text-indigo-800 text-[11px] sm:text-xs">Pork-Free</span>
                                    </div>
                                ) : statusConfig.key === 'vegetarian_vegan' ? (
                                    <div className="flex items-center justify-between text-xs bg-teal-50/70 px-2.5 py-1.5 rounded-xl border border-teal-100 font-sans text-slate-600">
                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-700">Plant-Based Diet</span>
                                        <span className="font-bold text-teal-800 text-[11px] sm:text-xs">Zero Meat</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between text-xs bg-amber-50/70 px-2.5 py-1.5 rounded-xl border border-amber-200/70 font-sans text-slate-600">
                                        <span className="text-[11px] sm:text-xs font-semibold text-amber-900">Pending Review</span>
                                        <span className="font-bold text-slate-700 text-[11px] sm:text-xs truncate max-w-[120px]">{shop.source || 'Community'}</span>
                                    </div>
                                )}

                                {(hasPrayer || hasAlcoholFree || evidenceUrl) && (
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
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
                                                Prayer Space
                                            </span>
                                        )}
                                        {hasAlcoholFree && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                                <ShieldCheck size={11} className="text-emerald-600" />
                                                Alcohol-Free
                                            </span>
                                        )}
                                    </div>
                                )}

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

            {/* Progressive Load More Footer */}
            {totalItems > 0 && (
                <div className="pt-4 pb-2 border-t border-slate-200/80 flex flex-col items-center justify-center gap-2.5">
                    <p className="text-xs text-slate-500 font-medium text-center">
                        Showing <strong className="font-semibold text-slate-700">{visibleEstablishments.length}</strong> of{' '}
                        <strong className="font-semibold text-slate-700">{totalItems}</strong> audit records
                    </p>

                    {remainingCount > 0 ? (
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                        >
                            <span>Load More Establishments ({remainingCount} remaining)</span>
                            <ChevronDown size={15} />
                        </button>
                    ) : totalItems > INITIAL_COUNT ? (
                        <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                            All {totalItems} establishments loaded
                        </p>
                    ) : null}
                </div>
            )}
        </div>
    );
}
