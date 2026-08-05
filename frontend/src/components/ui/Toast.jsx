import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'info', visible, onClose }) {
    useEffect(() => {
        if (!visible) return;

        const timer = window.setTimeout(() => onClose?.(), 3200);
        return () => window.clearTimeout(timer);
    }, [visible, onClose]);

    if (!visible) return null;

    const styles = {
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        error: 'border-red-200 bg-red-50 text-red-800',
        info: 'border-slate-200 bg-white text-slate-700'
    };

    const icons = {
        success: <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />,
        error: <AlertTriangle size={18} className="text-red-600 shrink-0" />,
        info: <AlertTriangle size={18} className="text-slate-600 shrink-0" />
    };

    return (
        <div 
            className={`fixed top-4 left-4 right-4 sm:top-16 sm:left-auto sm:right-5 sm:max-w-md z-50 flex items-center justify-between gap-3 rounded-2xl border px-3.5 sm:px-4 py-3 shadow-xl backdrop-blur transition-all ${styles[type]}`}
        >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {icons[type]}
                <p className="text-xs sm:text-sm font-medium truncate">{message}</p>
            </div>
            <button 
                onClick={onClose} 
                className="rounded-full p-1 transition hover:bg-black/5 shrink-0"
                aria-label="Close notification"
            >
                <X size={15} />
            </button>
        </div>
    );
}