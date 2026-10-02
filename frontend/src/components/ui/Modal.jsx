import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '4xl': 'max-w-7xl',
    full: 'max-w-[95vw]',
};

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

    const sizeClass = SIZE_CLASSES[size] || 'max-w-md';

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-xs">
            <div className={`w-full ${sizeClass} max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white text-slate-900 [color-scheme:light] p-4 sm:p-6 shadow-2xl transition-all`}> 
                {(title || description) ? (
                    <div className="flex items-start justify-between gap-4 shrink-0 pb-3 border-b border-slate-100">
                        <div className="min-w-0 flex-1">
                            {title && (
                                typeof title === 'string' ? (
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
                                ) : (
                                    title
                                )
                            )}
                            {description && (
                                typeof description === 'string' ? (
                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">{description}</p>
                                ) : (
                                    description
                                )
                            )}
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 shrink-0"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                ) : onClose ? (
                    <div className="flex justify-end shrink-0 -mb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : null}

                <div className="mt-3 sm:mt-4 overflow-y-auto flex-1 pr-1 sm:pr-2">{children}</div>

                {footer && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-row justify-between sm:flex-row sm:justify-end items-center gap-2 sm:gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}