import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';

export default function RegistryDeleteModal({
    isOpen,
    item,
    type,
    isDeleting,
    onClose,
    onConfirm,
}) {
    if (!isOpen || !item) return null;

    const getTitle = () => {
        if (type === 'establishment') return 'Confirm Establishment Deletion';
        if (type === 'additive') return 'Confirm Additive Deletion';
        if (type === 'hcb') return 'Confirm Certifier Removal';
        return 'Confirm Record Deletion';
    };

    const getItemName = () => {
        if (type === 'additive') {
            return item.code ? `${item.code} (${item.name})` : item.name;
        }
        return item.name || 'this item';
    };

    const getTargetText = () => {
        if (type === 'establishment') return 'from the Zamboanga City establishment directory';
        if (type === 'additive') return 'from the chemical additive database';
        if (type === 'hcb') return 'from the accredited certifying authorities registry';
        return 'from the registry';
    };

    const getButtonLabel = () => {
        if (isDeleting) return 'Deleting...';
        if (type === 'establishment') return 'Delete Establishment';
        if (type === 'additive') return 'Delete Additive';
        if (type === 'hcb') return 'Remove Certifier';
        return 'Delete Record';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-800">
                    <AlertTriangle className="size-5 shrink-0 text-red-600 mt-0.5" />
                    <p className="text-xs sm:text-sm text-red-700 leading-relaxed">
                        Are you sure you want to remove{' '}
                        <strong className="text-red-950 font-bold">{getItemName()}</strong>{' '}
                        {getTargetText()}? This action is permanent and cannot be undone.
                    </p>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-5 py-2 text-xs sm:text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50"
                    >
                        {getButtonLabel()}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
