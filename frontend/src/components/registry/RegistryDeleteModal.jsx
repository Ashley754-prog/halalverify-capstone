import { useEffect } from 'react';
import {
    Trash2,
    X,
    Store,
    Database,
    Building2,
    MapPin,
    AlertTriangle,
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
        if (type === 'establishment') return 'Delete Establishment?';
        if (type === 'additive') return 'Delete Additive?';
        if (type === 'hcb') return 'Remove Certifier?';
        return 'Delete Record?';
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
            return 'This will permanently remove the venue from the local directory and take down its map pin. This action cannot be undone.';
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
        if (type === 'establishment') return <Store className="size-5 text-emerald-700" />;
        if (type === 'additive') return <Database className="size-5 text-purple-700" />;
        return <Building2 className="size-5 text-blue-700" />;
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
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
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
                {/* Header Row: Danger Icon Badge and Close Button */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-4 ring-red-50">
                        <Trash2 className="size-5 sm:size-6" />
                    </div>
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

                {/* Dialog Title and Description */}
                <div className="mt-4">
                    <h3 id="delete-registry-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {getTitle()}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                        {getExplanation()}
                    </p>
                </div>

                {/* Target Record Summary Card */}
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center gap-3 text-left">
                    <div className="size-10 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
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
                        disabled={isDeleting}
                        className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-red-600/25 hover:bg-red-500 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={14} />
                                <span>{getDeleteButtonText()}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
