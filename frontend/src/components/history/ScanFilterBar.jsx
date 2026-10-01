import { Search, X, RefreshCw, Filter } from 'lucide-react';
import { MODE_FILTERS, VERDICT_FILTERS } from './scanHistoryUtils';

export const ScanFilterBar = ({
    modeFilter,
    setModeFilter,
    verdictFilter,
    setVerdictFilter,
    search,
    setSearch,
    refreshing,
    onRefresh,
    isAdmin,
}) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                {/* Mode Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {MODE_FILTERS.map(f => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setModeFilter(f.id)}
                            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap border shrink-0 ${
                                modeFilter === f.id
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/10'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search and Refresh Bar */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={isAdmin ? "Search product, text, or ID..." : "Search scans, ingredients..."}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8.5 pr-8 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition disabled:opacity-60"
                        title="Refresh scan history"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Verdict Quick Filter Pills */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                    <Filter size={11} /> Status:
                </span>
                {VERDICT_FILTERS.map(vf => {
                    const isSelected = verdictFilter === vf.id;
                    return (
                        <button
                            key={vf.id}
                            type="button"
                            onClick={() => setVerdictFilter(vf.id)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap shrink-0 border ${
                                isSelected
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                        >
                            {vf.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ScanFilterBar;
