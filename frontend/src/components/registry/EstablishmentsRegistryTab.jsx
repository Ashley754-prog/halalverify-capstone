
import { Database, Search, AlertOctagon, Pencil, Trash2, Flag } from 'lucide-react';

export default function EstablishmentsRegistryTab({
    establishments,
    localSearch,
    setLocalSearch,
    isAdmin,
    onOpenModal,
    onDeleteEstablishment,
    onReportEstablishment,
}) {
    const filteredEstablishments = establishments.filter(shop =>
        (shop.name || '').toLowerCase().includes(localSearch.toLowerCase()) ||
        (shop.address || '').toLowerCase().includes(localSearch.toLowerCase())
    );

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                        <Database className="text-emerald-600 shrink-0" size={20} /> Zamboanga Ordinance No. 489 Registers
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Active certificates, business clearances, and inspection audits in Zamboanga City.
                    </p>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search establishments or addresses..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1 sm:pr-2 pb-4">
                {filteredEstablishments.map((shop) => (
                    <div key={shop.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 sm:gap-5 h-full hover:border-slate-300 transition shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="pr-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                                    {shop.type || 'Establishment'}
                                </span>
                                <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{shop.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">{shop.address}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                                shop.halal_status === 'verified' || shop.halal_status === 'Verified'
                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                    : 'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                                {shop.halal_status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 text-xs bg-slate-100/70 p-2.5 sm:p-3 rounded-lg border border-slate-200/60 font-mono text-slate-600">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Cert ID</span>
                                <span className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">{shop.certificate_number || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Expiry Date</span>
                                <span className="font-bold text-slate-800 text-[11px] sm:text-xs">{shop.expiry_date || 'N/A'}</span>
                            </div>
                        </div>

                        {isAdmin ? (
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => onOpenModal('flag-establishment', shop)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-lg transition-colors">
                                    <AlertOctagon size={13} /> Flag Issue
                                </button>
                                <button onClick={() => onOpenModal('edit-establishment', shop)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-1.5 rounded-lg transition-colors">
                                    <Pencil size={13} /> Edit Record
                                </button>
                                <button onClick={() => onDeleteEstablishment(shop)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors">
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        ) : (
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => onReportEstablishment(shop)}
                                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 py-1.5 rounded-lg transition"
                                    title="Report issue or flag establishment"
                                >
                                    <Flag size={13} className="text-amber-500" />
                                    <span>Flag / Report Establishment</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
