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
        success: <CheckCircle2 size={18} className="text-emerald-600" />,
        error: <AlertTriangle size={18} className="text-red-600" />,
        info: <AlertTriangle size={18} className="text-slate-600" />
    };

    return (
        <div className={`fixed bottom-5 right-5 z-130 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${styles[type]}`}>
            {icons[type]}
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="ml-2 rounded-full p-1 transition hover:bg-black/5">
                <X size={15} />
            </button>
        </div>
    );
}
