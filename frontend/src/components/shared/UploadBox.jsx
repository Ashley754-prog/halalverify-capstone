import { Upload, FileText, X } from 'lucide-react';

/**
 * Shared dashed upload box with an attached state.
 * Used for the certificate document and the storefront photo on the submission form.
 */
export default function UploadBox({
    label,
    badge = null,
    hint,
    prompt,
    attachedLabel,
    url,
    uploading = false,
    accept = 'image/*',
    onPick,
    onClear,
    tone = 'emerald',
    id,
}) {
    const toneText = tone === 'sky' ? 'text-sky-600' : 'text-emerald-600';
    const toneAttached = tone === 'sky' ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900';

    return (
        <div>
            <label htmlFor={id} className="block font-semibold text-slate-700 mb-1">
                {label} {badge && <span className={`${toneText} font-normal text-[11px]`}>{badge}</span>}
            </label>
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center hover:border-emerald-500 transition">
                {url ? (
                    <div className={`flex items-center justify-between border rounded-lg p-2 ${toneAttached}`}>
                        <div className="flex items-center gap-2 truncate">
                            <FileText size={16} className={`${toneText} shrink-0`} />
                            <span className="text-xs font-medium truncate">{attachedLabel}</span>
                        </div>
                        <button
                            type="button"
                            onClick={onClear}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                            aria-label={`Remove ${attachedLabel}`}
                        >
                            <X size={15} />
                        </button>
                    </div>
                ) : (
                    <label htmlFor={id} className="cursor-pointer flex flex-col items-center">
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <span className={`text-xs font-semibold ${toneText} hover:underline`}>
                            {uploading ? 'Uploading to storage...' : prompt}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">{hint}</span>
                    </label>
                )}
                <input
                    id={id}
                    type="file"
                    accept={accept}
                    disabled={uploading}
                    onChange={onPick}
                    className="hidden"
                />
            </div>
        </div>
    );
}
