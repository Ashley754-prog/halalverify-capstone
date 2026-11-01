import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { parseAiTriage } from '../../utils/verificationNotes';

/**
 * Standardized AI triage status badge for both Establishments cards and Community Products rows.
 * Replaces hardcoded strings and displays dynamic confidence scores and invariant statuses.
 */
export default function AiTriageBadge({ adminNotes, className = '', compact = false }) {
    const triage = parseAiTriage(adminNotes);
    if (!triage || !triage.kind) return null;

    if (triage.kind === 'blocked') {
        return (
            <div
                className={`rounded-lg bg-rose-50 border border-rose-200 text-rose-800 ${
                    compact ? 'p-1.5 text-[10px]' : 'p-2 text-[11px]'
                } font-bold flex items-center justify-between gap-1.5 ${className}`}
                title={triage.reasons?.length ? triage.reasons.join('; ') : 'Critical invariant failure detected during AI screening'}
            >
                <span className="flex items-center gap-1.5 truncate">
                    <AlertOctagon size={compact ? 12 : 13} className="text-rose-600 shrink-0" />
                    <span className="truncate">AI Invariant Blocked</span>
                </span>
                <span className="text-[10px] text-rose-700 bg-rose-100/90 px-1.5 py-0.2 rounded font-mono shrink-0">
                    Review Required
                </span>
            </div>
        );
    }

    if (triage.kind === 'needs_review') {
        return (
            <div
                className={`rounded-lg bg-amber-50 border border-amber-200 text-amber-900 ${
                    compact ? 'p-1.5 text-[10px]' : 'p-2 text-[11px]'
                } font-bold flex items-center justify-between gap-1.5 ${className}`}
                title={triage.reasons?.length ? triage.reasons.join('; ') : 'AI screened submission, manual administrative review recommended'}
            >
                <span className="flex items-center gap-1.5 truncate">
                    <AlertTriangle size={compact ? 12 : 13} className="text-amber-600 shrink-0" />
                    <span className="truncate">AI Screened · Needs Review</span>
                </span>
                {triage.score !== null && (
                    <span className="text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded font-mono shrink-0">
                        {triage.score}%
                    </span>
                )}
            </div>
        );
    }

    if (triage.kind === 'auto_published') {
        return (
            <div
                className={`rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 ${
                    compact ? 'p-1.5 text-[10px]' : 'p-2 text-[11px]'
                } font-bold flex items-center justify-between gap-1.5 ${className}`}
                title="Passed automated verification with high confidence"
            >
                <span className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 size={compact ? 12 : 13} className="text-emerald-600 shrink-0" />
                    <span className="truncate">AI Pre-Approved</span>
                </span>
                {triage.score !== null && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded font-mono shrink-0">
                        {triage.score}%
                    </span>
                )}
            </div>
        );
    }

    return null;
}
