import React from 'react';
import {
    Store,
    Loader2,
    MapPin,
    ChevronRight,
    Navigation
} from 'lucide-react';
import { getStatusConfig } from './EstablishmentDetailModal';

export default function EstablishmentsSidebarList({
    filteredList,
    selectedEstablishment,
    loading,
    mobileTab,
    onSelectEstablishment,
    onResetFilters,
}) {
    return (
        <div
            className={`
                ${mobileTab === 'list' ? 'flex' : 'hidden'} lg:flex
                bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex-col justify-between space-y-3
            `}
        >
            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
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

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[420px]">
                    {filteredList.length === 0 ? (
                        <div className="text-center py-10 px-4 text-slate-400 space-y-2">
                            <Store size={28} className="mx-auto text-slate-300" />
                            <p className="text-xs font-semibold">No establishments match your filters.</p>
                            <button
                                type="button"
                                onClick={onResetFilters}
                                className="text-xs text-emerald-700 font-bold hover:underline"
                            >
                                Reset all filters
                            </button>
                        </div>
                    ) : (
                        filteredList.map((est) => {
                            const statusConfig = getStatusConfig(est.halal_status);
                            const isSelected = selectedEstablishment?.id === est.id;
                            const isCertified = Boolean(est.certifying_bodies?.code);
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
                                        <div className="flex items-center gap-2">
                                            {isCertified ? (
                                                <span className="font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                                                    {est.certifying_bodies.code}
                                                </span>
                                            ) : (
                                                <span className="font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                                                    Self-Declared
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
