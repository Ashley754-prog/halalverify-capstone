/**
 * Skeleton loading placeholders for Verification Queue tabs.
 * Prevents layout shift and eliminates false "Queue is clean!" flash on initial load.
 */

export function EstablishmentSkeletons({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={`est-skel-${i}`}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            <div className="h-4 w-16 bg-slate-200 rounded-md" />
                            <div className="h-4 w-20 bg-slate-200 rounded-md" />
                        </div>
                        <div className="h-3 w-12 bg-slate-200 rounded" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3.5 w-1/2 bg-slate-100 rounded" />
                    <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg" />
                    <div className="pt-2 flex gap-2">
                        <div className="h-8 flex-1 bg-slate-200 rounded-xl" />
                        <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ProductSkeletons({ count = 5 }) {
    return (
        <div className="divide-y divide-slate-100 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={`prod-skel-${i}`} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-12 rounded-xl bg-slate-200 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-32 bg-slate-200 rounded" />
                                <div className="h-4 w-16 bg-slate-100 rounded" />
                            </div>
                            <div className="h-3 w-48 bg-slate-100 rounded" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                        <div className="h-8 w-24 bg-slate-100 rounded-xl" />
                        <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                        <div className="h-8 w-16 bg-slate-100 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}
