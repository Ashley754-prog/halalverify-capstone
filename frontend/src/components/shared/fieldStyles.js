// Shared input styling per screen so the same field looks consistent everywhere.
export const FIELD_VARIANTS = {
    registry: {
        label: 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600',
        input: 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none',
        select: 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer',
        grid: 'grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2',
        panel: 'p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5',
        chipOn: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
        chipOff: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
    },
    queue: {
        label: 'text-slate-600 font-semibold block text-[11px] mb-1',
        input: 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none',
        select: 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer',
        grid: 'grid gap-3 grid-cols-1 sm:grid-cols-2',
        panel: 'p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2',
        chipOn: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
        chipOff: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
    },
    form: {
        label: 'block font-semibold text-slate-700 mb-1',
        input: 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition',
        select: 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer',
        grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
        panel: 'p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5',
        chipOn: 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs ring-1 ring-emerald-500/20',
        chipOff: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
    },
};

export const getFieldStyles = (variant) => FIELD_VARIANTS[variant] || FIELD_VARIANTS.registry;
