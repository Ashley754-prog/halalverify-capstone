
import { Database, Search, AlertOctagon, Pencil, Trash2 } from 'lucide-react';

export default function AdditivesRegistryTab({
    additives,
    dictSearch,
    setDictSearch,
    additiveStatusFilter,
    setAdditiveStatusFilter,
    additiveOriginFilter,
    setAdditiveOriginFilter,
    isAdmin,
    onOpenModal,
    onDeleteAdditive,
}) {
    const filteredAdditives = additives.filter(item => {
        const matchesSearch = (item.code || '').toLowerCase().includes(dictSearch.toLowerCase()) ||
            (item.name || '').toLowerCase().includes(dictSearch.toLowerCase()) ||
            (item.source_description || '').toLowerCase().includes(dictSearch.toLowerCase());
        
        const matchesStatus = additiveStatusFilter === 'all' || item.status === additiveStatusFilter;
        const matchesOrigin = additiveOriginFilter === 'all' || 
            (item.origin && item.origin.toLowerCase().includes(additiveOriginFilter.toLowerCase()));

        return matchesSearch && matchesStatus && matchesOrigin;
    });

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4 sm:mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                        <Database className="text-emerald-600 shrink-0" size={20} /> Chemical Reference Database
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        E-numbers, scientific classifications, and scholar compliance statuses.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Status Filter */}
                    <select
                        value={additiveStatusFilter}
                        onChange={(e) => setAdditiveStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Halal">Halal Only</option>
                        <option value="Doubtful">Doubtful Only</option>
                        <option value="Haram">Haram Only</option>
                    </select>

                    {/* Origin Filter */}
                    <select
                        value={additiveOriginFilter}
                        onChange={(e) => setAdditiveOriginFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="all">All Origins</option>
                        <option value="Plant">Plant Origin</option>
                        <option value="Animal">Animal Origin</option>
                        <option value="Insect">Insect Origin</option>
                        <option value="Synthetic">Synthetic / Mineral</option>
                    </select>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search additives or code..."
                            value={dictSearch}
                            onChange={(e) => setDictSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1 sm:pr-2 pb-4">
                {filteredAdditives.map((item) => (
                    <div key={item.id || item.code} className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full gap-3 sm:gap-4 hover:border-slate-300 transition shadow-sm">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300">
                                {item.code}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {item.origin && (
                                    <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">
                                        {item.origin}
                                    </span>
                                )}
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                    item.status === 'Haram'
                                        ? 'bg-red-50 text-red-600 border border-red-200'
                                        : item.status === 'Halal'
                                            ? 'bg-green-50 text-green-600 border border-green-200'
                                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                                }`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{item.name}</h4>
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-3">
                                Source: <span className="italic">{item.source_description || 'Unspecified origin.'}</span>
                            </p>
                            {item.reason && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                                    Ruling: <span className="italic">{item.reason}</span>
                                </p>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="flex gap-2 pt-2 border-t border-slate-200">
                                <button onClick={() => onOpenModal('flag-additive', item)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-lg transition-colors">
                                    <AlertOctagon size={13} /> Flag
                                </button>
                                <button onClick={() => onOpenModal('edit-additive', item)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-1.5 rounded-lg transition-colors">
                                    <Pencil size={13} /> Edit
                                </button>
                                <button onClick={() => onDeleteAdditive(item)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors">
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
