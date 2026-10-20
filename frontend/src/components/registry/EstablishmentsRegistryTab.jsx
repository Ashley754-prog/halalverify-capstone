import { useState } from 'react';
import { Database, Search, Pencil, Trash2, Flag, MapPin, Compass, ShieldCheck, ExternalLink } from 'lucide-react';
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

    return (
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0">
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

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
                    <select
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shrink-0 max-w-[145px] sm:max-w-none"
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
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shrink-0 max-w-[130px] sm:max-w-none"
                        aria-label="Filter by verification standard"
                    >
                        <option value="all">All Standards ({filteredEstablishments.length})</option>
                        <option value="verified">Certified</option>
                        <option value="muslim_owned">Muslim-Owned</option>
                        <option value="muslim_friendly">Muslim-Friendly</option>
                        <option value="vegetarian_vegan">Plant-Based</option>
                        {isAdmin && <option value="needs_review">Pending Review</option>}
                    </select>

                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search name, street, cuisine..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 text-base sm:text-xs focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>
                </div>
            </div>


            {/* Establishments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1 sm:pr-2 pb-4">
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
                            className="text-xs text-emerald-700 font-bold hover:underline mt-2 inline-block"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    filteredEstablishments.map((shop) => {
                        const statusConfig = getStatusConfig(shop);
                        const districtInfo = resolveZamboangaDistrict(shop);
                        const evidenceUrl = getSafeUrl(shop.certificate_url || shop.logo_url);
                        const isFormallyCertified = Boolean(shop.certificate_number || statusConfig.key === 'verified');
                        const hasPrayer = Boolean(
                            shop.has_prayer_space ||
                            (shop.description && (shop.description.toLowerCase().includes('prayer') || shop.description.toLowerCase().includes('musalah'))) ||
                            (Array.isArray(shop.amenities) && shop.amenities.some(a => String(a).toLowerCase().includes('prayer')))
                        );
                        const hasAlcoholFree = Boolean(
                            shop.is_alcohol_free ||
                            (shop.description && shop.description.toLowerCase().includes('alcohol')) ||
                            (Array.isArray(shop.amenities) && shop.amenities.some(a => String(a).toLowerCase().includes('alcohol')))
                        );

                        return (
                            <div
                                key={shop.id}
                                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 h-full hover:border-slate-300 hover:bg-white transition shadow-xs"
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
                                    <p className="text-xs text-slate-500 flex items-start gap-1">
                                        <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{shop.address || 'Zamboanga City'}</span>
                                    </p>
                                </div>

                                {/* Dynamic, Meaningful Metadata Box */}
                                {isFormallyCertified ? (
                                    <div className="grid grid-cols-2 text-xs bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/80 font-mono text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5 font-sans font-bold">Cert ID</span>
                                            <span className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">{shop.certificate_number}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5 font-sans font-bold">Expiry Date</span>
                                            <span className="font-bold text-emerald-800 text-[11px] sm:text-xs">{shop.expiry_date || 'Active'}</span>
                                        </div>
                                    </div>
                                ) : statusConfig.key === 'muslim_owned' ? (
                                    <div className="grid grid-cols-2 text-xs bg-sky-50/70 p-2.5 rounded-xl border border-sky-100 font-sans text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-wider text-sky-600 font-bold mb-0.5">Kitchen Standard</span>
                                            <span className="font-bold text-slate-800 text-[11px] sm:text-xs">Pork-Free Kitchen</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] uppercase tracking-wider text-sky-600 font-bold mb-0.5">Classification</span>
                                            <span className="font-bold text-sky-800 text-[11px] sm:text-xs">Muslim-Owned</span>
                                        </div>
                                    </div>
                                ) : statusConfig.key === 'muslim_friendly' ? (
                                    <div className="grid grid-cols-2 text-xs bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 font-sans text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-wider text-indigo-600 font-bold mb-0.5">Accommodations</span>
                                            <span className="font-bold text-slate-800 text-[11px] sm:text-xs">Halal Options</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] uppercase tracking-wider text-indigo-600 font-bold mb-0.5">Kitchen</span>
                                            <span className="font-bold text-indigo-800 text-[11px] sm:text-xs">Pork-Free</span>
                                        </div>
                                    </div>
                                ) : statusConfig.key === 'vegetarian_vegan' ? (
                                    <div className="grid grid-cols-2 text-xs bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 font-sans text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-wider text-teal-600 font-bold mb-0.5">Dietary Standard</span>
                                            <span className="font-bold text-slate-800 text-[11px] sm:text-xs">Plant-Based</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] uppercase tracking-wider text-teal-600 font-bold mb-0.5">Meat Standard</span>
                                            <span className="font-bold text-teal-800 text-[11px] sm:text-xs">Zero Meat</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 text-xs bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70 font-sans text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-wider text-amber-700 font-bold mb-0.5">Review Standing</span>
                                            <span className="font-bold text-amber-900 text-[11px] sm:text-xs">Pending Review</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] uppercase tracking-wider text-amber-700 font-bold mb-0.5">Source</span>
                                            <span className="font-bold text-slate-700 text-[11px] sm:text-xs truncate">{shop.source || 'Community'}</span>
                                        </div>
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
                                                <span>View Certificate Evidence</span>
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
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 py-1.5 rounded-lg transition-colors shadow-2xs"
                                        >
                                            <Pencil size={12} /> Edit
                                        </button>
                                        <button 
                                            onClick={() => onDeleteEstablishment(shop)} 
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors shadow-2xs"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-1 border-t border-slate-200/60">
                                        <button
                                            type="button"
                                            onClick={() => onReportEstablishment(shop)}
                                            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 bg-white hover:bg-amber-50 border border-slate-200 py-1.5 rounded-lg transition"
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
        </div>
    );
}
