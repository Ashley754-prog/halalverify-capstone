import { RotateCcw } from 'lucide-react';

/**
 * Standardized Empty & No-Results State (2026 UI Standard)
 * Provides consistent empty-queue, no-search-results, and filtered-out feedback.
 */
export default function EmptyState({
    icon: Icon,
    title = 'No records found',
    description = 'There are no items matching your criteria at this time.',
    actionText,
    onAction,
    resetText,
    onReset,
    className = '',
}) {
    return (
        <div
            className={`col-span-full w-full py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 ${className}`}
        >
            {Icon && (
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400">
                    <Icon size={24} className="stroke-[1.75]" />
                </div>
            )}

            <div className="max-w-md space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-slate-800">{title}</h4>
                {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
            </div>

            {(onReset || onAction) && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {onReset && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition active:scale-95 shadow-2xs cursor-pointer"
                        >
                            <RotateCcw size={12} className="text-slate-500" />
                            <span>{resetText || 'Reset Filters'}</span>
                        </button>
                    )}

                    {onAction && actionText && (
                        <button
                            type="button"
                            onClick={onAction}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 shadow-xs shadow-emerald-700/20 cursor-pointer"
                        >
                            <span>{actionText}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
