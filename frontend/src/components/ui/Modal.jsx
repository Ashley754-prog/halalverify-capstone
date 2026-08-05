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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
            <div className={`w-full ${sizeClass} max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl transition-all`}> 
                <div className="flex items-start justify-between gap-4 shrink-0">
                    <div>
                        {title && <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>}
                        {description && <p className="mt-1 text-xs sm:text-sm text-slate-500">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 sm:p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-4 sm:mt-5 overflow-y-auto flex-1">{children}</div>

                {footer && (
                    <div className="mt-5 sm:mt-6 flex flex-row justify-between sm:flex-row sm:justify-end items-center gap-2 sm:gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}