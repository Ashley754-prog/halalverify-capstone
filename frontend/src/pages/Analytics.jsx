import { useEffect, useState, useCallback } from 'react';
import {
    BarChart2,
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    ChevronRight,
    Printer,
} from 'lucide-react';
import AnalyticsSurveillanceSections from '../components/analytics/AnalyticsSurveillanceSections';
import { API_BASE_URL, authFetch } from '../utils/api';

export default function Analytics({ onViewChange }) {
    const [interval, setInterval] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trendsData, setTrendsData] = useState(null);
    const [reportsSummary, setReportsSummary] = useState(null);
    const [lastSync, setLastSync] = useState(null);

    const loadAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const errors = [];

            const fetchTrends = async () => {
                try {
                    const resTrends = await authFetch(`${API_BASE_URL}/api/v1/admin/analytics/trends?interval=${interval}`);
                    if (resTrends.ok) {
                        const jsonTrends = await resTrends.json();
                        setTrendsData(jsonTrends.data || null);
                    } else {
                        const errBody = await resTrends.json().catch(() => ({}));
                        errors.push(errBody.detail || `Trends request failed (${resTrends.status})`);
                        setTrendsData(null);
                    }
                } catch (err) {
                    console.warn('Backend trends API failed:', err);
                    errors.push('Could not load scan analytics trends from the backend.');
                    setTrendsData(null);
                }
            };

            const fetchReports = async () => {
                try {
                    const resReports = await authFetch(`${API_BASE_URL}/api/v1/admin/analytics/reports-summary`);
                    if (resReports.ok) {
                        const jsonReports = await resReports.json();
                        setReportsSummary(jsonReports.data || null);
                    } else {
                        const errBody = await resReports.json().catch(() => ({}));
                        errors.push(errBody.detail || `Reports summary failed (${resReports.status})`);
                        setReportsSummary(null);
                    }
                } catch (err) {
                    console.warn('Backend reports summary API failed:', err);
                    errors.push('Could not load compliance reports telemetry from the backend.');
                    setReportsSummary(null);
                }
            };

            await Promise.all([fetchTrends(), fetchReports()]);

            if (errors.length > 0) {
                setError(errors.join(' '));
            }
            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } finally {
            setLoading(false);
        }
    }, [interval]);

    useEffect(() => {
        loadAnalyticsData();
    }, [loadAnalyticsData]);

    const totals = trendsData?.totals || { total_scans: 0, compliance_rate: 0, verdicts: { Halal: 0, Doubtful: 0, Haram: 0 } };
    const topAdditives = trendsData?.top_non_compliant_additives || [];
    const estBreakdown = trendsData?.establishment_breakdown || { verified: 0, pending_review: 0, flagged: 0 };
    const reports = reportsSummary || { total_reports: 0, open_count: 0, resolved_count: 0, dismissed_count: 0, resolution_rate: 0, categories: {} };
    const timeline = trendsData?.timeline || [];

    const totalScans = totals.total_scans || 0;
    const halalCount = totals.verdicts?.Halal || 0;
    const doubtfulCount = totals.verdicts?.Doubtful || 0;
    const haramCount = totals.verdicts?.Haram || 0;
    const unverifiedCount = totals.verdicts?.Other || 0;

    const halalPct = totalScans > 0 ? Math.round((halalCount / totalScans) * 100) : 0;
    const doubtfulPct = totalScans > 0 ? Math.round((doubtfulCount / totalScans) * 100) : 0;
    const haramPct = totalScans > 0 ? Math.round((haramCount / totalScans) * 100) : 0;
    const unverifiedPct = totalScans > 0 ? Math.round((unverifiedCount / totalScans) * 100) : 0;

    const maxAdditiveCount = topAdditives.length > 0 ? Math.max(...topAdditives.map(a => a.detection_count || 0), 1) : 1;
    const maxTimelineScans = timeline.length > 0 ? Math.max(...timeline.map(t => t.scans || 0), 1) : 1;

    const totalMonitoredEsts = (estBreakdown.verified || 0) + (estBreakdown.pending_review || 0) + (estBreakdown.flagged || 0);
    const windowLabel = interval === 'daily' ? 'Last 7 Days' : interval === 'weekly' ? 'Last 30 Days' : 'All Time';

    const handlePrintReport = () => {
        window.print();
    };

    return (
        <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 flex-1 flex flex-col h-full bg-slate-50/70 overflow-y-auto text-slate-800 print:overflow-visible print:h-auto print:bg-white print:p-0">
            {/* Print-Only Formal Report Header */}
            <div className="hidden print:flex items-end justify-between border-b-2 border-slate-800 pb-3 mb-2">
                <div>
                    <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        HalalVerify Surveillance &amp; Compliance Report
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                        Zamboanga City Halal Verification Analytics &bull; Reporting Window: <strong>{windowLabel}</strong>
                    </p>
                </div>
                <div className="text-right text-[11px] text-slate-600 font-mono">
                    <div>Generated: {new Date().toLocaleDateString()}</div>
                    <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>

            {/* Control Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 shrink-0 print:hidden">
                <div className="flex items-center justify-between gap-2 w-full md:w-auto">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60 shrink-0">
                        <span className={`inline-flex rounded-full h-2 w-2 ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="font-mono text-[10px]">
                            {error ? 'Sync Issue' : lastSync ? `Synced ${lastSync}` : 'Live Data'}
                        </span>
                    </div>

                    <div className="flex md:hidden items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={handlePrintReport}
                            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center transition shadow-2xs cursor-pointer"
                            title="Print or Save as PDF"
                        >
                            <Printer size={13} className="text-slate-600" />
                        </button>
                        <button
                            type="button"
                            onClick={loadAnalyticsData}
                            disabled={loading}
                            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center transition shadow-2xs disabled:opacity-50"
                            title="Reload latest telemetry metrics"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange?.('verification-queue')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
                        >
                            <span>Audit Queue</span>
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider hidden lg:inline">
                        Window:
                    </span>
                    <div className="inline-flex w-full md:w-auto p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
                        <button
                            type="button"
                            onClick={() => setInterval('daily')}
                            className={`flex-1 md:flex-none text-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                interval === 'daily'
                                    ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/60'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            7 Days
                        </button>
                        <button
                            type="button"
                            onClick={() => setInterval('weekly')}
                            className={`flex-1 md:flex-none text-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                interval === 'weekly'
                                    ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/60'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            30 Days
                        </button>
                        <button
                            type="button"
                            onClick={() => setInterval('monthly')}
                            className={`flex-1 md:flex-none text-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                interval === 'monthly'
                                    ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/60'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 shrink-0">
                    {lastSync && (
                        <span className="text-[11px] text-slate-400 font-mono hidden lg:inline-block">
                            Synced: {lastSync}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handlePrintReport}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                        title="Print or Save Report as PDF"
                    >
                        <Printer size={13} className="text-slate-600" />
                        <span>Print / PDF</span>
                    </button>

                    <button
                        type="button"
                        onClick={loadAnalyticsData}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                        title="Reload latest telemetry metrics"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
                        <span>Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onViewChange?.('verification-queue')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                        <span>Audit Queue</span>
                        <ChevronRight size={13} />
                    </button>
                </div>
            </div>

            {/* Error Alert Banner */}
            {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                        <span>{error} Showing verified zero/empty telemetry rather than placeholder numbers.</span>
                    </div>
                    <button
                        type="button"
                        onClick={loadAnalyticsData}
                        className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 shrink-0 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Top KPI Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                            Total Scans Audited
                        </span>
                        <div className="p-1 rounded bg-slate-100 text-slate-600">
                            <BarChart2 size={15} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                                {(totals.total_scans || 0).toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">pipeline runs</span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>YOLOv8 &amp; Dual-Tier OCR</span>
                        <span className="text-emerald-700 font-medium font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            PNS 101:2018
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                            Halal Compliance Rate
                        </span>
                        <div className="p-1 rounded bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={15} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                                {totals.compliance_rate}%
                            </span>
                            <span className="text-[11px] text-emerald-700 font-semibold">compliant</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${totals.compliance_rate}%` }}
                            />
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{halalCount} clean / valid scans</span>
                        <span className="font-mono text-[10px] text-slate-400">{doubtfulCount + haramCount} flagged</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                            Most Detected E-Number
                        </span>
                        <div className="p-1 rounded bg-amber-50 text-amber-700">
                            <AlertTriangle size={15} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                                {topAdditives[0]?.code || '—'}
                            </span>
                            {topAdditives[0]?.status && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                    (topAdditives[0]?.status || '').toLowerCase() === 'haram' || (topAdditives[0]?.status || '').toLowerCase() === 'prohibited'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : (topAdditives[0]?.status || '').toLowerCase() === 'halal'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                    {topAdditives[0].status}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium truncate mt-1">
                            {topAdditives[0]?.name || 'No detections recorded yet'}
                        </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Trigger frequency</span>
                        <span className="font-mono font-semibold text-slate-800">
                            {topAdditives[0]?.detection_count || 0} incidents
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                            Flag Resolution Rate
                        </span>
                        <div className="p-1 rounded bg-slate-100 text-slate-600">
                            <ShieldAlert size={15} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                                {reports.resolution_rate}%
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold">closed</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-slate-700 h-full rounded-full transition-all duration-500"
                                style={{ width: `${reports.resolution_rate}%` }}
                            />
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{reports.resolved_count} resolved</span>
                        <span className="font-mono text-amber-700 font-semibold text-[10px] bg-amber-50 px-1 rounded">
                            {reports.open_count} pending
                        </span>
                    </div>
                </div>
            </div>

            <AnalyticsSurveillanceSections
                timeline={timeline}
                maxTimelineScans={maxTimelineScans}
                topAdditives={topAdditives}
                maxAdditiveCount={maxAdditiveCount}
                totalScans={totalScans}
                halalCount={halalCount}
                doubtfulCount={doubtfulCount}
                haramCount={haramCount}
                unverifiedCount={unverifiedCount}
                halalPct={halalPct}
                doubtfulPct={doubtfulPct}
                haramPct={haramPct}
                unverifiedPct={unverifiedPct}
                reports={reports}
                estBreakdown={estBreakdown}
                totalMonitoredEsts={totalMonitoredEsts}
                onViewChange={onViewChange}
            />
        </div>
    );
}
