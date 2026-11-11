import { useState } from 'react';
import { ESTABLISHMENT_AMENITIES, cleanAmenities } from '../../data/constants';
import { getFieldStyles } from './fieldStyles';

/**
 * Shared amenity toggles. The options come from ESTABLISHMENT_AMENITIES.
 * Optional custom facilities are supported when allowCustom is true.
 * onChange receives the full cleaned amenities array.
 */
export default function AmenitiesPicker({
    amenities = [],
    onChange,
    variant = 'registry',
    allowCustom = false,
}) {
    const styles = getFieldStyles(variant);
    const [customInput, setCustomInput] = useState('');
    const selected = cleanAmenities(amenities);
    const standardLabels = ESTABLISHMENT_AMENITIES.map((a) => a.label);
    const customSelected = selected.filter((a) => !standardLabels.includes(a)
        && !ESTABLISHMENT_AMENITIES.some((d) => d.match.some((m) => a.toLowerCase().includes(m))));

    const isOn = (def) => selected.some((a) => a === def.label || def.match.some((m) => a.toLowerCase().includes(m)));

    const toggle = (def) => {
        const without = selected.filter((a) => !(a === def.label || def.match.some((m) => a.toLowerCase().includes(m))));
        onChange(isOn(def) ? without : [...without, def.label]);
    };

    const addCustom = (e) => {
        if (e?.preventDefault) e.preventDefault();
        const val = customInput.trim();
        if (!val) return;
        const cleaned = cleanAmenities([val]);
        if (cleaned.length && !selected.includes(cleaned[0])) {
            onChange([...selected, cleaned[0]]);
        }
        setCustomInput('');
    };

    return (
        <div className={styles.panel}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Amenities</span>
                <span className="text-[11px] text-slate-400">Select all that apply</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ESTABLISHMENT_AMENITIES.map((def) => {
                    const on = isOn(def);
                    return (
                        <button
                            key={def.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(def)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${on ? styles.chipOn : styles.chipOff}`}
                        >
                            <span className="font-semibold block text-xs">{def.shortLabel}</span>
                            <span className={`text-[10px] ${on ? 'opacity-90' : 'text-slate-500'}`}>{def.hint}</span>
                        </button>
                    );
                })}
            </div>

            {allowCustom && (
                <>
                    {customSelected.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                            {customSelected.map((name) => (
                                <span
                                    key={name}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${styles.chipOn}`}
                                >
                                    <span>{name}</span>
                                    <button
                                        type="button"
                                        onClick={() => onChange(selected.filter((a) => a !== name))}
                                        className="font-bold ml-0.5 cursor-pointer"
                                        title="Remove custom facility"
                                        aria-label={`Remove ${name}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') addCustom(e); }}
                            placeholder="Add custom facility (e.g. Free Wi-Fi, Outdoor Dining)..."
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={addCustom}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
                        >
                            + Add
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
