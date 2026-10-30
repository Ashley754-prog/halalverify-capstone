import { useState, useEffect } from 'react';
import { Database, Search, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';

const getAuthorityInfo = (item) => {
    const text = `${item.reason || ''} ${item.source_description || ''}`.toLowerCase();
    if (text.includes('mui')) {
        return { label: 'MUI Halal Portal', url: 'https://halalmui.org' };
    }
    if (text.includes('sanha')) {
        return { label: 'SANHA Halal Guide', url: 'https://sanha.org.za' };
    }
    return { label: 'JAKIM Halal Portal', url: 'https://www.halal.gov.my' };
};

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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(16);

    const filteredAdditives = additives.filter((item) => {
        const matchesSearch =
            (item.code || '').toLowerCase().includes(dictSearch.toLowerCase()) ||
            (item.name || '').toLowerCase().includes(dictSearch.toLowerCase()) ||
            (item.source_description || '').toLowerCase().includes(dictSearch.toLowerCase());

        const matchesStatus =
            additiveStatusFilter === 'all' ||
            (item.status || '').toLowerCase() === additiveStatusFilter.toLowerCase();
        const matchesOrigin =
            additiveOriginFilter === 'all' ||
            (item.origin && item.origin.toLowerCase().includes(additiveOriginFilter.toLowerCase()));

        return matchesSearch && matchesStatus && matchesOrigin;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [dictSearch, additiveStatusFilter, additiveOriginFilter]);

    const totalItems = filteredAdditives.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedAdditives = filteredAdditives.slice(startIndex, startIndex + itemsPerPage);

    const handleResetFilters = () => {
        setDictSearch('');
        setAdditiveStatusFilter('all');
        setAdditiveOriginFilter('all');
    };

    return (
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2.5 sm:gap-3 mb-3 sm:mb-6 shrink-0">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                        <Database className="text-emerald-600 shrink-0" size={18} /> Chemical Reference Database
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                        E-numbers, scientific classifications, and scholar compliance statuses benchmarked against JAKIM, MUI, and ASEAN Halal standards.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
                    {/* Status Filter */}
                    <select
                        value={additiveStatusFilter}
                        onChange={(e) => setAdditiveStatusFilter(e.target.value)}
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto"
                        aria-label="Filter by chemical compliance status"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Halal">Halal</option>
                        <option value="Doubtful">Doubtful</option>
                        <option value="Haram">Haram</option>
                    </select>

                    {/* Origin Filter */}
                    <select
                        value={additiveOriginFilter}
                        onChange={(e) => setAdditiveOriginFilter(e.target.value)}
                        className="h-8.5 sm:h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto"
                        aria-label="Filter by chemical origin"
                    >
                        <option value="all">All Origins</option>
                        <option value="Plant">Plant</option>
                        <option value="Animal">Animal</option>
                        <option value="Insect">Insect</option>
                        <option value="Synthetic">Synthetic</option>
                    </select>

                    <SearchBar
                        value={dictSearch}
                        onChange={setDictSearch}
                        placeholder="Search code or additive..."
                        className="col-span-2 md:col-span-1 md:w-64"
                        size="sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-2">
                {filteredAdditives.length === 0 ? (
                    <EmptyState
                        icon={Database}
                        title="No chemical additives found"
                        description="No additives match your active search or filter criteria."
                        resetText="Reset Filters"
                        onReset={handleResetFilters}
                    />
                ) : (
                    paginatedAdditives.map((item) => (
                        <div
                            key={item.id || item.code}
                            className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between h-full gap-2.5 sm:gap-3 hover:border-slate-300 transition shadow-xs"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-300">
                                    {item.code}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {item.origin && (
                                        <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">
                                            {item.origin}
                                        </span>
                                    )}
                                    <span
                                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            item.status === 'Haram'
                                                ? 'bg-red-50 text-red-600 border border-red-200'
                                                : item.status === 'Halal'
                                                ? 'bg-green-50 text-green-600 border border-green-200'
                                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}
                                    >
                                        {item.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name}</h4>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    Source: <span className="italic">{item.source_description || 'Unspecified origin.'}</span>
                                </p>
                                {item.reason && (
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                        Ruling: <span className="italic">{item.reason}</span>
                                    </p>
                                )}
                            </div>

                            {(() => {
                                const auth = getAuthorityInfo(item);
                                return (
                                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60">
                                        <span className="text-slate-400 font-medium">Authority:</span>
                                        <a
                                            href={auth.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                        >
                                            <span>{auth.label}</span>
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                );
                            })()}

                            {isAdmin && (
                                <div className="flex gap-2 pt-2 border-t border-slate-200">
                                    <button
                                        onClick={() => onOpenModal('edit-additive', item)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => onDeleteAdditive(item)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
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
                    itemsPerPageOptions={[16, 32, 64]}
                    itemLabel="additives"
                />
            )}
        </div>
    );
}
