import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', visible, onClose, action = null }) {
    useEffect(() => {
        if (!visible) return;

        const timer = window.setTimeout(() => onClose?.(), 3400);
        return () => window.clearTimeout(timer);
    }, [visible, onClose]);

    if (!visible) return null;

    const styles = {
        success: 'border-emerald-200/90 bg-white/95 text-slate-800 shadow-xl shadow-emerald-950/10',
        error: 'border-rose-200/90 bg-white/95 text-slate-800 shadow-xl shadow-rose-950/10',
        warning: 'border-amber-200/90 bg-white/95 text-slate-800 shadow-xl shadow-amber-950/10',
        info: 'border-slate-200/90 bg-white/95 text-slate-800 shadow-xl shadow-slate-950/10',
    };

    const iconContainers = {
        success: (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={17} />
            </div>
        ),
        error: (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertCircle size={17} />
            </div>
        ),
        warning: (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <AlertTriangle size={17} />
            </div>
        ),
        info: (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <Info size={17} />
            </div>
        ),
    };

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-16 sm:bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-[10002] flex items-center justify-between gap-3 rounded-2xl border px-3.5 sm:px-4 py-3 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-3 ${styles[type] || styles.info}`}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {iconContainers[type] || iconContainers.info}
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 leading-snug break-words">
                        {message}
                    </p>
                    {action && (
                        <button
                            type="button"
                            onClick={action.onClick}
                            className="mt-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
                aria-label="Close notification"
            >
                <X size={15} />
            </button>
        </div>
    );
}
