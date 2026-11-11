import { SUBMITTER_ROLES } from '../../data/constants';
import { getFieldStyles } from './fieldStyles';

/**
 * Shared submitter role picker.
 * Supports segment mode for user submission forms and select dropdown mode for admin edit modals.
 */
export default function SubmitterRoleSelect({
    value = 'community',
    onChange,
    variant = 'registry',
    id = 'submitter-role',
}) {
    const styles = getFieldStyles(variant);
    const normalizedValue = value === 'owner' ? 'owner' : 'community';

    if (variant === 'form') {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                    <span className="text-xs font-bold text-slate-800 block">Submitter Role</span>
                    <span className="text-[11px] text-slate-500">Helps our moderation team review your entry</span>
                </div>
                <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-xs font-medium shrink-0" role="radiogroup" aria-label="Submitter role">
                    {SUBMITTER_ROLES.map((role) => {
                        const active = normalizedValue === role.id;
                        return (
                            <button
                                key={role.id}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => onChange(role.id)}
                                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                                    active ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {role.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <select
            id={id}
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            className={styles.select}
        >
            {SUBMITTER_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                    {role.label}
                </option>
            ))}
        </select>
    );
}
