import {
    Store,
    Loader2,
    MapPin,
    ChevronRight,
    Navigation,
    Compass,
    ShieldCheck,
} from 'lucide-react';
import { getStatusConfig, resolveZamboangaDistrict } from '../../data/constants';
import EmptyState from '../ui/EmptyState';

export default function EstablishmentsSidebarList({
    filteredList,
    selectedEstablishment,
    loading,
    mobileTab,
    onSelectEstablishment,
    onResetFilters,
    userLocation,
}) {
    return (
        <div
            className={`
                ${mobileTab === 'list' ? 'flex' : 'hidden'} lg:flex
                bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex-col justify-between space-y-3
                w-full h-full min-h-0 flex-1 overflow-hidden
            `}
        >
            <div className="space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Store size={17} className="text-emerald-600" />
                            Zamboanga Halal Directory
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            {filteredList.length} locations matching active filters
                        </p>
                    </div>
                    {loading && <Loader2 size={16} className="animate-spin text-emerald-600" />}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                    {filteredList.length === 0 ? (
                        <EmptyState
                            icon={Store}
                            title="No establishments match your filters"
                            description="Try adjusting your status, district, radius, or search keywords."
                            resetText="Reset All Filters"
                            onReset={onResetFilters}
                            className="p-6"
                        />
                    ) : (
                        filteredList.map((est, index) => {
                            const statusConfig = getStatusConfig(est);
                            const districtInfo = resolveZamboangaDistrict(est);
                            const isSelected = selectedEstablishment?.id === est.id;
                            const isNearest = Boolean(userLocation && index === 0 && est.distance_km != null);
                            const productsCount = est.products?.length || 0;

                            return (
                                <div
                                    key={est.id}
                                    onClick={() => onSelectEstablishment(est)}
                                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                                        isSelected
                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                                            : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1.5">
                                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                            {est.name}
                                        </h4>
                                        <span
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${statusConfig.badgeBg}`}
                                        >
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                        <MapPin size={11} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{est.address || est.city || 'Zamboanga City'}</span>
                                    </p>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/50">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {isNearest && (
                                                <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                                                    Nearest to You
                                                </span>
                                            )}
                                            {districtInfo && (
                                                <span className={`font-bold px-1.5 py-0.5 rounded border ${districtInfo.badgeClass}`}>
                                                    {districtInfo.shortLabel}
                                                </span>
                                            )}
                                            {est.certifying_bodies?.code && (
                                                <span className="font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                                                    {est.certifying_bodies.code}
                                                </span>
                                            )}
                                            {(est.has_prayer_space || est.description?.toLowerCase().includes('prayer') || est.description?.toLowerCase().includes('musalah')) && (
                                                <span title="Dedicated Prayer Space (Musalah)" className="text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-0.5">
                                                    <Compass size={10} className="text-emerald-600" />
                                                    Prayer
                                                </span>
                                            )}
                                            {(est.is_alcohol_free || est.description?.toLowerCase().includes('alcohol-free') || est.description?.toLowerCase().includes('alcohol free')) && (
                                                <span title="100% Alcohol-Free Premises" className="text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-0.5">
                                                    <ShieldCheck size={10} className="text-emerald-600" />
                                                    Alcohol-Free
                                                </span>
                                            )}
                                            {est.distance_km && (
                                                <span className="text-blue-700 font-bold">
                                                    {est.distance_km} km
                                                </span>
                                            )}
                                            {productsCount > 0 && (
                                                <span className="text-slate-500 font-medium hidden sm:inline">
                                                    {productsCount} menu items
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5 hover:underline">
                                            Inspect <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <Navigation size={14} className="text-emerald-600 shrink-0" />
                <span>Click any establishment to center map and view full halal certificate & menu.</span>
            </div>
        </div>
    );
}
