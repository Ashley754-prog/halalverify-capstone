import { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Standardized Administrative Action Confirmation Modal.
 * Used for high-stakes decisions like rejecting community submissions or executing batch runs.
 */
export default function ConfirmActionModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    description = 'Are you sure you want to proceed with this action?',
    itemName,
    itemSubtitle,
    confirmText = 'Confirm',
    confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
    isProcessing = false,
    showReasonInput = false,
    reasonLabel = 'Administrative Reason (Optional)',
    reasonPlaceholder = 'Provide optional reason for the audit record...',
}) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setReason('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isProcessing) {
                onClose?.();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isProcessing, onClose]);

    if (!isOpen) return null;

    const handleConfirmClick = () => {
        onConfirm?.(reason.trim());
    };

    const variantStyles = {
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
        primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    };

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isProcessing) {
                    onClose?.();
                }
            }}
            role="presentation"
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-6 text-slate-900 transition-all transform animate-in zoom-in-95 duration-150 flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-action-dialog-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                            confirmVariant === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                            confirmVariant === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                            <AlertTriangle size={16} />
                        </div>
                        <h3 id="confirm-action-dialog-title" className="text-base font-bold text-slate-900 tracking-tight">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-3.5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {description}
                    </p>

                    {(itemName || itemSubtitle) && (
                        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-left">
                            {itemName && (
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {itemName}
                                </p>
                            )}
                            {itemSubtitle && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {itemSubtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {showReasonInput && (
                        <div className="space-y-1.5 pt-1">
                            <label htmlFor="confirm-action-reason" className="block text-xs font-semibold text-slate-700">
                                {reasonLabel}
                            </label>
                            <textarea
                                id="confirm-action-reason"
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={reasonPlaceholder}
                                disabled={isProcessing}
                                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmClick}
                        disabled={isProcessing}
                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm active:scale-[0.98] transition disabled:opacity-50 cursor-pointer ${variantStyles[confirmVariant] || variantStyles.primary}`}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <span>{confirmText}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
