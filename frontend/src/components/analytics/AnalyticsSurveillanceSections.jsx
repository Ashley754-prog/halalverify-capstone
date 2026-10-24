import {
    ShieldAlert,
    AlertTriangle,
    Store,
    ChevronRight,
    AlertOctagon,
    PieChart,
    ExternalLink,
    Activity,
} from 'lucide-react';

export default function AnalyticsSurveillanceSections({
    timeline,
    maxTimelineScans,
    topAdditives,
    maxAdditiveCount,
    totalScans,
    halalCount,
    doubtfulCount,
    haramCount,
    halalPct,
    doubtfulPct,
    haramPct,
    reports,
    estBreakdown,
    totalMonitoredEsts,
    onViewChange,
}) {
    return (
        <>
            {/* Scan Activity Velocity & Frequency Strip */}
            {timeline.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Activity size={15} className="text-slate-500" />
                            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                                Scan Velocity &amp; Pipeline Load
                            </h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                            Recent evaluation volume by date
                        </span>
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-7 lg:grid-cols-14 gap-1.5 sm:gap-2 items-end h-24 pt-4 border-t border-slate-100">
                        {timeline.slice(-14).map((pt, idx) => {
                            const hasScans = (pt.scans || 0) > 0;
                            const heightPct = hasScans
                                ? Math.max(20, Math.round((pt.scans / maxTimelineScans) * 100))
                                : 10;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                    {hasScans && (
                                        <span className="text-[10px] font-mono font-bold text-emerald-700 mb-1 group-hover:scale-110 transition-transform">
                                            {pt.scans}
                                        </span>
                                    )}
                                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                                        {pt.date}: {pt.scans} {pt.scans === 1 ? 'scan' : 'scans'}
                                    </div>
                                    <div
                                        className={`w-full transition-all rounded-xs ${
                                            hasScans
                                                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400 shadow-2xs'
                                                : 'bg-slate-100 group-hover:bg-slate-200'
                                        }`}
                                        style={{ height: `${heightPct}%` }}
                                    />
                                    <span className="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-full font-medium">
                                        {pt.date.length > 5 ? pt.date.slice(-5) : pt.date}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Middle Section: Top 5 Additives Surveillance Table & Scan Verdict Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-3.5 sm:p-4 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                    <AlertOctagon size={15} className="text-red-600" />
                                    <span>High-Risk &amp; Questionable Additive Surveillance</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Ranked by trigger frequency in Philippine market packaging (PNS/BAFS 101:2018).
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                Top 5 Critical
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                                        <th className="py-2.5 px-3 text-center w-12">#</th>
                                        <th className="py-2.5 px-3 w-24">Code</th>
                                        <th className="py-2.5 px-3">Additive Name</th>
                                        <th className="py-2.5 px-3 w-32">Classification</th>
                                        <th className="py-2.5 px-3 hidden sm:table-cell">Source Profile</th>
                                        <th className="py-2.5 px-3 text-right w-24">Detections</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {topAdditives.slice(0, 5).map((add, idx) => {
                                        const rawStatus = (add.status || '').toLowerCase();
                                        const isHaram = rawStatus === 'haram' || rawStatus === 'prohibited';
                                        const isHalal = rawStatus === 'halal';
                                        return (
                                            <tr key={add.code} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                                        {add.code}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="font-medium text-slate-900 block truncate max-w-xs sm:max-w-none">
                                                        {add.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 sm:hidden block truncate">
                                                        {add.source_description}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                                        isHaram
                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                            : isHalal
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            isHaram ? 'bg-red-500' : isHalal ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`} />
                                                        {add.status || 'Doubtful'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 hidden sm:table-cell text-slate-500 text-[11px]">
                                                    <span className="line-clamp-1">
                                                        {add.source_description || 'Origin under inspection'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <span className="font-mono font-bold text-slate-900 text-[11px]">
                                                        {add.detection_count || 0}
                                                    </span>
                                                    <div className="w-14 h-1 bg-slate-100 rounded-full ml-auto mt-1 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                isHaram ? 'bg-red-500' : isHalal ? 'bg-emerald-500' : 'bg-amber-500'
                                                            }`}
                                                            style={{ width: `${Math.round(((add.detection_count || 0) / maxAdditiveCount) * 100)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">
                            Standard reference: <strong className="font-semibold text-slate-700">PNS/BAFS 101:2018</strong> &amp; Codex Alimentarius.
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            Registry: 400+ Codes
                        </span>
                    </div>
                </div>

                {/* Right 1 Col: Scan Verdict Ratio & Compliance Breakdown */}
                <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                <PieChart size={15} className="text-emerald-700" />
                                <span>Scan Verdict Distribution</span>
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Breakdown of {totalScans.toLocaleString()} evaluated consumer products.
                            </p>
                        </div>

                        <div className="pt-3.5 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                                <span>Compliance Composition</span>
                                <span>{halalPct}% Halal</span>
                            </div>
                            <div className="w-full h-2.5 rounded bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 border border-slate-200/60">
                                <div
                                    className="bg-emerald-600 rounded-xs transition-all duration-500"
                                    style={{ width: `${halalPct}%` }}
                                    title={`Halal: ${halalCount} (${halalPct}%)`}
                                />
                                <div
                                    className="bg-amber-500 rounded-xs transition-all duration-500"
                                    style={{ width: `${doubtfulPct}%` }}
                                    title={`Doubtful: ${doubtfulCount} (${doubtfulPct}%)`}
                                />
                                <div
                                    className="bg-red-500 rounded-xs transition-all duration-500"
                                    style={{ width: `${haramPct}%` }}
                                    title={`Haram: ${haramCount} (${haramPct}%)`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-4">
                            <div className="p-2.5 rounded border border-slate-200/70 bg-slate-50/50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                        Verified Halal
                                    </span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-mono font-bold text-slate-900">{halalCount}</span>
                                        <span className="font-mono text-[10px] text-slate-400">({halalPct}%)</span>
                                    </div>
                                </div>
                                <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${halalPct}%` }} />
                                </div>
                            </div>

                            <div className="p-2.5 rounded border border-slate-200/70 bg-slate-50/50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        Doubtful
                                    </span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-mono font-bold text-slate-900">{doubtfulCount}</span>
                                        <span className="font-mono text-[10px] text-slate-400">({doubtfulPct}%)</span>
                                    </div>
                                </div>
                                <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${doubtfulPct}%` }} />
                                </div>
                            </div>

                            <div className="p-2.5 rounded border border-slate-200/70 bg-slate-50/50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        Prohibited / Non-Halal
                                    </span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-mono font-bold text-slate-900">{haramCount}</span>
                                        <span className="font-mono text-[10px] text-slate-400">({haramPct}%)</span>
                                    </div>
                                </div>
                                <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${haramPct}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded border border-amber-200 bg-amber-50/60 text-[11px] text-amber-900 space-y-1">
                        <span className="font-bold flex items-center gap-1">
                            <AlertTriangle size={13} className="text-amber-700" />
                            City Ordinance No. 489 Alert
                        </span>
                        <p className="text-amber-800/90 leading-relaxed">
                            Doubtful and prohibited ingredient detections trigger automated flag alerts in the administrative review queue.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Reports Summary & Establishment Standings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                    <ShieldAlert size={15} className="text-amber-600" />
                                    <span>Community Reports &amp; Grievance Categories</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {reports.total_reports} total flags submitted by registered consumers
                                </p>
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {reports.resolution_rate}% Resolved
                            </span>
                        </div>

                        <div className="space-y-2 pt-3">
                            {Object.entries(reports.categories || {}).length === 0 ? (
                                <p className="text-xs text-slate-400 py-3 text-center">No category reports recorded yet.</p>
                            ) : (
                                Object.entries(reports.categories).map(([cat, count]) => {
                                    const sharePct = Math.round((count / (reports.total_reports || 1)) * 100);
                                    return (
                                        <div
                                            key={cat}
                                            className="p-2.5 rounded border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-800">{cat}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] text-slate-400">{sharePct}%</span>
                                                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                                                        {count}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-slate-600 rounded-full" style={{ width: `${sharePct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Resolution metric</span>
                        <span className="font-mono font-medium text-slate-700">
                            {reports.resolved_count} resolved • {reports.open_count} open audit
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                    <Store size={15} className="text-emerald-700" />
                                    <span>Zamboanga Establishment Registry Standing</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Official directory standing across UCZP, IDCP, BUSC &amp; BPCC vetted venues
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onViewChange?.('map')}
                                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 hover:underline"
                            >
                                <span>Open Map</span>
                                <ExternalLink size={12} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 pt-3">
                            <div className="rounded border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                                <span className="text-2xl font-bold font-mono text-emerald-800 block">
                                    {estBreakdown.verified}
                                </span>
                                <span className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mt-1">
                                    Verified
                                </span>
                                <span className="text-[10px] text-emerald-700/80 font-mono block">Compliant</span>
                            </div>

                            <div className="rounded border border-amber-200 bg-amber-50/50 p-3 text-center">
                                <span className="text-2xl font-bold font-mono text-amber-800 block">
                                    {estBreakdown.pending_review}
                                </span>
                                <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wider mt-1">
                                    Pending
                                </span>
                                <span className="text-[10px] text-amber-700/80 font-mono block">Under Review</span>
                            </div>

                            <div className="rounded border border-red-200 bg-red-50/50 p-3 text-center">
                                <span className="text-2xl font-bold font-mono text-red-800 block">
                                    {estBreakdown.flagged}
                                </span>
                                <span className="block text-[11px] font-semibold text-red-800 uppercase tracking-wider mt-1">
                                    Flagged
                                </span>
                                <span className="text-[10px] text-red-700/80 font-mono block">Notice Issued</span>
                            </div>
                        </div>

                        <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
                            <span>Total Monitored Establishments</span>
                            <span className="font-mono font-bold text-slate-900">{totalMonitoredEsts} venues</span>
                        </div>
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
                        <span className="text-[11px]">Audit pending submissions?</span>
                        <button
                            type="button"
                            onClick={() => onViewChange?.('verification-queue')}
                            className="font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 hover:underline text-xs"
                        >
                            <span>Open Verification Queue</span>
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
