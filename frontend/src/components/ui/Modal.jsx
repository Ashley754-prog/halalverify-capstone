import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, title, description, onClose, children, footer, size = 'md' }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClass = size === 'lg' ? 'max-w-2xl' : 'max-w-md';

    return (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-950/70 px-4 py-6">
            <div className={`w-full ${sizeClass} rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl`}> 
                <div className="flex items-start justify-between gap-4">
                    <div>
                        {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
                        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-5">{children}</div>

                {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
            </div>
        </div>
    );
}
