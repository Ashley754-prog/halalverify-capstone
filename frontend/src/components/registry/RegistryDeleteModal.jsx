import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';

export default function RegistryDeleteModal({
    isOpen,
    item,
    type,
    isDeleting,
    onClose,
    onConfirm,
}) {
    return (
        <ConfirmDeleteModal
            isOpen={isOpen}
            item={item}
            type={type}
            isDeleting={isDeleting}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}
