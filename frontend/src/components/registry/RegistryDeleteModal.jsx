import { useEffect } from 'react';
import {
    X,
    Store,
    Database,
    Building2,
    MapPin,
    Loader2,
} from 'lucide-react';

export default function RegistryDeleteModal({
    isOpen,
    item,
    type,
    isDeleting,
    onClose,
    onConfirm,
}) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isDeleting) {
                onClose?.();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDeleting, onClose]);

    if (!isOpen || !item) return null;

    const getTitle = () => {
        if (type === 'establishment') return 'Delete Establishment';
        if (type === 'additive') return 'Delete Chemical Additive';
        if (type === 'hcb') return 'Remove Certifying Body';
        return 'Delete Record';
    };

    const getItemName = () => {
        if (type === 'additive') {
            return item.code ? `${item.code} (${item.name})` : item.name;
        }
        return item.name || 'Untitled Record';
    };

    const getSubtitle = () => {
        if (type === 'establishment') {
            return item.address || 'Zamboanga City';
        }
        if (type === 'additive') {
            const origin = item.origin || 'Chemical';
            const status = item.status || 'Doubtful';
            return `${origin} origin • ${status} classification`;
        }
        if (type === 'hcb') {
            return item.country ? `Jurisdiction: ${item.country}` : 'Accredited Authority';
        }
        return 'Registry item';
    };

    const getExplanation = () => {
        if (type === 'establishment') {
            return 'This will permanently remove the venue from the local registry and take down its map pin. This action cannot be undone.';
        }
        if (type === 'additive') {
            return 'This will remove the entry from the food additive dictionary and AI ingredient screening ledger. This action cannot be undone.';
        }
        if (type === 'hcb') {
            return 'This will remove this certifying body from the municipal accreditation registry. This action cannot be undone.';
        }
        return 'This record will be permanently deleted from the database.';
    };

    const renderItemIcon = () => {
        if (type === 'establishment') return <Store className="size-4 text-emerald-700" />;
        if (type === 'additive') return <Database className="size-4 text-purple-700" />;
        return <Building2 className="size-4 text-blue-700" />;
    };

    const getDeleteButtonText = () => {
        if (isDeleting) return 'Deleting...';
        if (type === 'establishment') return 'Delete Venue';
        if (type === 'additive') return 'Delete Additive';
        if (type === 'hcb') return 'Remove Certifier';
        return 'Delete Record';
    };

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isDeleting) {
                    onClose?.();
                }
            }}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-6 text-slate-900 transition-all transform animate-in zoom-in-95 duration-150 flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-registry-dialog-title"
            >
                {/* Header Row: Title and Close Button */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <h3 id="delete-registry-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {getTitle()}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Dialog Content */}
                <div className="mt-4 space-y-3.5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to delete <strong className="font-bold text-slate-900">{getItemName()}</strong>?
                    </p>

                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        {getExplanation()}
                    </p>

                    {/* Subtle Preview Item Badge */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center gap-3 text-left">
                        <div className="size-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            {renderItemIcon()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {getItemName()}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                {type === 'establishment' && <MapPin size={11} className="text-slate-400 shrink-0" />}
                                <span>{getSubtitle()}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Responsive Action Buttons */}
                <div className="mt-6 pt-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-red-600/20 hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <span>{getDeleteButtonText()}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
