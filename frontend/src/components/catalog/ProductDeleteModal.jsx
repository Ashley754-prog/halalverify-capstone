
import Modal from '../ui/Modal';

export default function ProductDeleteModal({
    isOpen,
    product,
    isSaving,
    onClose,
    onDelete,
}) {
    if (!isOpen || !product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Product Deletion">
            <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600">
                    Are you sure you want to remove{' '}
                    <strong className="text-slate-900">{product.name}</strong> from the verified
                    product directory? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={isSaving}
                        className="px-5 py-2 text-xs sm:text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50"
                    >
                        {isSaving ? 'Deleting...' : 'Delete Product'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
