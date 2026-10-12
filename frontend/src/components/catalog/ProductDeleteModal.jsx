import { useEffect } from 'react';
import { Trash2, X, Package, AlertTriangle, Loader2 } from 'lucide-react';

export default function ProductDeleteModal({
    isOpen,
    product,
    isSaving,
    onClose,
    onDelete,
}) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isSaving) {
                onClose?.();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSaving, onClose]);

    if (!isOpen || !product) return null;

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSaving) {
                    onClose?.();
                }
            }}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-6 text-slate-900 transition-all transform animate-in zoom-in-95 duration-150 flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-product-title"
            >
                {/* Header Row: Danger Icon Badge and Close Button */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-4 ring-red-50">
                        <Trash2 className="size-5 sm:size-6" />
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Dialog Title and Description */}
                <div className="mt-4">
                    <h3 id="delete-product-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        Delete Product?
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Are you sure you want to remove this product from the verified catalog? This action cannot be undone.
                    </p>
                </div>

                {/* Target Record Summary Card */}
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center gap-3 text-left">
                    <div className="size-10 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs text-emerald-700">
                        <Package size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {product.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {product.brand ? `${product.brand} • ` : ''}{product.category || 'Food & Beverage'}
                        </p>
                    </div>
                </div>

                {/* Warning note */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] sm:text-xs text-amber-700 bg-amber-50/70 border border-amber-200/60 rounded-lg px-2.5 py-1.5 font-medium">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                    <span>Permanent action. Data cannot be recovered.</span>
                </div>

                {/* Responsive Action Buttons */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={isSaving}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-red-600/25 hover:bg-red-500 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={14} />
                                <span>Delete Product</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
