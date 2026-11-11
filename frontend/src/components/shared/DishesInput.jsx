import { useState } from 'react';
import { X, Plus } from 'lucide-react';

/**
 * Shared chip input for popular dishes or specialties.
 * onChange receives the full dishes array.
 * onDraftChange reports the text typed but not yet added, so a parent can include it on submit.
 */
export default function DishesInput({ dishes = [], onChange, placeholder, onDraftChange = null }) {
    const [draft, setDraft] = useState('');


    const add = () => {
        const val = draft.trim();
        if (!val) return;
        if (!dishes.some((d) => d.toLowerCase() === val.toLowerCase())) {
            onChange([...dishes, val]);
        }
        setDraft('');
        onDraftChange?.('');
    };

    const updateDraft = (value) => {
        setDraft(value);
        onDraftChange?.(value);
    };

    return (
        <div className="rounded-xl border border-slate-300 bg-white p-2.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
            <div className="flex flex-wrap gap-1.5 mb-2">
                {dishes.map((dish) => (
                    <span
                        key={dish}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold"
                    >
                        <span>{dish}</span>
                        <button
                            type="button"
                            onClick={() => onChange(dishes.filter((d) => d !== dish))}
                            className="text-emerald-600 hover:text-red-500 cursor-pointer"
                            aria-label={`Remove ${dish}`}
                        >
                            <X size={13} />
                        </button>
                    </span>
                ))}
                {dishes.length === 0 && (
                    <span className="text-[11px] text-slate-400 py-0.5">
                        No dishes added yet. Type below and press Enter or click Add.
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <input
                    type="text"
                    placeholder={placeholder || 'e.g., Beef Satti, Chicken Inasal, Roti Canai'}
                    value={draft}
                    onChange={(e) => updateDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            add();
                        }
                    }}
                    className="flex-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                />
                <button
                    type="button"
                    onClick={add}
                    disabled={!draft.trim()}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                >
                    <Plus size={13} />
                    <span>Add</span>
                </button>
            </div>
        </div>
    );
}
