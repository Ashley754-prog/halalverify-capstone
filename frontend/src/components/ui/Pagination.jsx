import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Global Responsive Pagination Component (2026 Standard)
 * Designed for both desktop precision and mobile thumb navigation.
 */
export default function Pagination({
    currentPage = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 20, 50],
    itemLabel = 'records',
    className = '',
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(safeCurrentPage * itemsPerPage, totalItems);

    const handlePageClick = (page) => {
        if (page >= 1 && page <= totalPages && page !== safeCurrentPage) {
            onPageChange?.(page);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (safeCurrentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (safeCurrentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div
            className={`pt-4 pb-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
            aria-label="Pagination Navigation"
        >
            {/* Left: Record Range Counter & Optional Density Dropdown */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-slate-500 font-medium text-center sm:text-left">
                <span>
                    Showing <strong className="font-semibold text-slate-800">{startIndex}</strong>–
                    <strong className="font-semibold text-slate-800">{endIndex}</strong> of{' '}
                    <strong className="font-semibold text-slate-800">{totalItems}</strong> {itemLabel}
                </span>

                {onItemsPerPageChange && itemsPerPageOptions?.length > 1 && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 shrink-0">
                        <label htmlFor="items-per-page-select" className="text-[11px] text-slate-400 font-medium">
                            Per page:
                        </label>
                        <select
                            id="items-per-page-select"
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="h-7 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer transition shadow-2xs"
                            aria-label={`Items per page for ${itemLabel}`}
                        >
                            {itemsPerPageOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right: Page Buttons & Controls */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* Previous Button */}
                    <button
                        type="button"
                        onClick={() => handlePageClick(safeCurrentPage - 1)}
                        disabled={safeCurrentPage === 1}
                        className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                            safeCurrentPage === 1
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-95 cursor-pointer shadow-2xs'
                        }`}
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft size={15} />
                        <span className="hidden sm:inline">Prev</span>
                    </button>

                    {/* Desktop Number Buttons */}
                    <div className="hidden sm:flex items-center gap-1">
                        {getPageNumbers().map((p, idx) =>
                            p === '...' ? (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="px-1.5 py-1 text-slate-400 select-none font-bold text-xs"
                                >
                                    &hellip;
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => handlePageClick(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        safeCurrentPage === p
                                            ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-700/30'
                                            : 'text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 active:scale-95'
                                    }`}
                                    aria-current={safeCurrentPage === p ? 'page' : undefined}
                                    aria-label={`Go to page ${p}`}
                                >
                                    {p}
                                </button>
                            )
                        )}
                    </div>

                    {/* Mobile Compact Page Indicator */}
                    <span className="sm:hidden px-2 text-xs font-bold text-slate-700 select-none">
                        Page {safeCurrentPage} of {totalPages}
                    </span>

                    {/* Next Button */}
                    <button
                        type="button"
                        onClick={() => handlePageClick(safeCurrentPage + 1)}
                        disabled={safeCurrentPage === totalPages}
                        className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                            safeCurrentPage === totalPages
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-95 cursor-pointer shadow-2xs'
                        }`}
                        aria-label="Go to next page"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    );
}
