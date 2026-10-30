import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';

export default function ProductDeleteModal({
    isOpen,
    product,
    isSaving,
    onClose,
    onDelete,
}) {
    return (
        <ConfirmDeleteModal
            isOpen={isOpen}
            item={product}
            type="product"
            isDeleting={isSaving}
            onClose={onClose}
            onConfirm={onDelete}
        />
    );
}
