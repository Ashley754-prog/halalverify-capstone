import { useEffect } from 'react';
import { X, Package, Loader2 } from 'lucide-react';

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
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
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
                {/* Header Row: Title and Close Button */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <h3 id="delete-product-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        Delete Product
                    </h3>
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

                {/* Dialog Content */}
                <div className="mt-4 space-y-3.5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to delete <strong className="font-bold text-slate-900">{product.name}</strong>?
                    </p>

                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        This will permanently remove the product from the verified directory. This action cannot be undone.
                    </p>

                    {/* Subtle Preview Item Badge */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center gap-3 text-left">
                        <div className="size-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs text-emerald-700">
                            <Package size={16} />
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
                </div>

                {/* Responsive Action Buttons */}
                <div className="mt-6 pt-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={isSaving}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-red-600/20 hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <span>Delete Product</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
