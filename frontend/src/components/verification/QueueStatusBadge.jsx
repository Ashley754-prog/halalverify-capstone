/**
 * Standardized status badge for the Verification Queue.
 * Formats raw database status enums into clean, human-readable labels and consistent tokens.
 */
export default function QueueStatusBadge({ status, className = '' }) {
    const raw = String(status || '').trim();
    const lower = raw.toLowerCase();

    let label = 'Pending';
    let style = 'bg-amber-50 text-amber-800 border-amber-200';

    if (lower === 'needs_review' || lower.includes('review')) {
        label = 'Needs Review';
        style = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (lower === 'pending_verification' || lower === 'pending') {
        label = 'Pending Review';
        style = 'bg-slate-100 text-slate-700 border-slate-200';
    } else if (lower === 'verified' || lower === 'halal') {
        label = 'Verified';
        style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (lower === 'rejected' || lower === 'flagged' || lower === 'suspended') {
        label = raw.replace(/_/g, ' ').toUpperCase();
        style = 'bg-rose-50 text-rose-800 border-rose-200';
    } else if (lower === 'muslim_owned') {
        label = 'Muslim-Owned';
        style = 'bg-sky-50 text-sky-800 border-sky-200';
    } else if (lower === 'muslim_friendly') {
        label = 'Muslim-Friendly';
        style = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    } else if (lower === 'vegetarian_vegan') {
        label = 'Plant-Based';
        style = 'bg-teal-50 text-teal-800 border-teal-200';
    } else if (raw) {
        label = raw.replace(/_/g, ' ');
    }

    return (
        <span
            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-tight ${style} ${className}`}
        >
            {label}
        </span>
    );
}
