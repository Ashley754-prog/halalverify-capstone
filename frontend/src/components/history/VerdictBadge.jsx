import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { simplifyStatus } from '../../utils/textFormatters';

const STYLES = {
    Green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    Red: 'bg-rose-50 text-rose-700 border-rose-200',
    Halal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Doubtful: 'bg-amber-50 text-amber-700 border-amber-200',
    Prohibited: 'bg-rose-50 text-rose-700 border-rose-200',
    Haram: 'bg-rose-50 text-rose-700 border-rose-200',
    Valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Expired: 'bg-rose-50 text-rose-700 border-rose-200',
    Suspicious: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ICONS = {
    Green: <CheckCircle2 size={12} className="shrink-0" />,
    Yellow: <AlertTriangle size={12} className="shrink-0" />,
    Red: <XCircle size={12} className="shrink-0" />,
    Halal: <CheckCircle2 size={12} className="shrink-0" />,
    Doubtful: <AlertTriangle size={12} className="shrink-0" />,
    Prohibited: <XCircle size={12} className="shrink-0" />,
    Haram: <XCircle size={12} className="shrink-0" />,
    Valid: <CheckCircle2 size={12} className="shrink-0" />,
    Expired: <XCircle size={12} className="shrink-0" />,
    Suspicious: <AlertTriangle size={12} className="shrink-0" />,
};

export const VerdictBadge = ({ verdict, className = '' }) => {
    const display = simplifyStatus(verdict);
    const style = STYLES[display] || STYLES[verdict] || 'bg-slate-100 text-slate-700 border-slate-200';
    const icon = ICONS[display] || ICONS[verdict] || <AlertTriangle size={12} className="shrink-0" />;

    return (
        <span
            className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 border ${style} ${className}`}
        >
            {icon}
            <span>{display || 'Unknown'}</span>
        </span>
    );
};

export default VerdictBadge;
