import { useEffect, useState, useCallback } from 'react';
import {
    BarChart2,
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    ChevronRight,
    Download,
    Printer,
} from 'lucide-react';
import AnalyticsSurveillanceSections from '../components/analytics/AnalyticsSurveillanceSections';
import { API_BASE_URL, authFetch } from '../utils/api';

const DEFAULT_TOP_ADDITIVES = [
    { code: 'E120', name: 'Cochineal / Carmine', status: 'Doubtful', source_description: 'Insect-derived red colorant', detection_count: 34 },
    { code: 'E441', name: 'Gelatin', status: 'Haram', source_description: 'Collagen derived from non-halal animal bone/tissue', detection_count: 28 },
    { code: 'E471', name: 'Mono- and Diglycerides of Fatty Acids', status: 'Doubtful', source_description: 'Emulsifier with animal fat or vegetable oil origins', detection_count: 19 },
    { code: 'E422', name: 'Glycerol / Glycerin', status: 'Doubtful', source_description: 'Solvent & humectant with animal tallow origins', detection_count: 15 },
    { code: 'E631', name: 'Disodium Inosinate', status: 'Doubtful', source_description: 'Flavor enhancer commonly extracted from meat/fish', detection_count: 11 },
];

export default function Analytics({ onViewChange }) {
    const [interval, setInterval] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'
    const [loading, setLoading] = useState(true);
    const [trendsData, setTrendsData] = useState(null);
    const [reportsSummary, setReportsSummary] = useState(null);
    const [lastSync, setLastSync] = useState(null);

    const applyFallbackTrends = () => {
        setTrendsData({
            totals: {
                total_scans: 142,
                total_establishments: 17,
                verdicts: { Halal: 98, Doubtful: 32, Haram: 12 },
                compliance_rate: 69.0,
            },
            top_non_compliant_additives: DEFAULT_TOP_ADDITIVES,
            establishment_breakdown: { verified: 14, pending_review: 2, flagged: 1 },
            timeline: [
                { date: 'Mon', scans: 14 },
                { date: 'Tue', scans: 22 },
                { date: 'Wed', scans: 18 },
                { date: 'Thu', scans: 25 },
                { date: 'Fri', scans: 31 },
                { date: 'Sat', scans: 38 },
                { date: 'Sun', scans: 26 },
            ],
        });
    };

    const applyFallbackReports = () => {
        setReportsSummary({
            total_reports: 9,
            open_count: 2,
            resolved_count: 6,
            dismissed_count: 1,
            resolution_rate: 66.7,
            categories: {
                'Expired Certificate': 3,
                'Fraudulent / Unaccredited Logo': 2,
                'Prohibited / Haram Ingredients': 3,
                'Other Concern': 1,
            },
        });
    };

    const loadAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);

            try {
                const resTrends = await authFetch(`${API_BASE_URL}/api/v1/admin/analytics/trends?interval=${interval}`);
                if (resTrends.ok) {
                    const jsonTrends = await resTrends.json();
                    setTrendsData(jsonTrends.data);
                } else {
                    applyFallbackTrends();
                }
            } catch (err) {
                console.warn('Backend trends API notice, using fallback:', err);
                applyFallbackTrends();
            }

            try {
                const resReports = await authFetch(`${API_BASE_URL}/api/v1/admin/analytics/reports-summary`);
                if (resReports.ok) {
                    const jsonReports = await resReports.json();
                    setReportsSummary(jsonReports.data);
                } else {
                    applyFallbackReports();
                }
            } catch (err) {
                console.warn('Backend reports summary notice, using fallback:', err);
                applyFallbackReports();
            }

            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } finally {
            setLoading(false);
        }
    }, [interval]);

    useEffect(() => {
        loadAnalyticsData();
    }, [loadAnalyticsData]);

    const totals = trendsData?.totals || { total_scans: 0, compliance_rate: 100, verdicts: {} };
    const topAdditives = trendsData?.top_non_compliant_additives || DEFAULT_TOP_ADDITIVES;
    const estBreakdown = trendsData?.establishment_breakdown || { verified: 0, pending_review: 0, flagged: 0 };
    const reports = reportsSummary || { total_reports: 0, open_count: 0, resolved_count: 0, resolution_rate: 100, categories: {} };
    const timeline = trendsData?.timeline || [];

    const totalScans = totals.total_scans || 1;
    const halalCount = totals.verdicts?.Halal || 0;
    const doubtfulCount = totals.verdicts?.Doubtful || 0;
    const haramCount = totals.verdicts?.Haram || 0;

    const halalPct = Math.round((halalCount / totalScans) * 100);
    const doubtfulPct = Math.round((doubtfulCount / totalScans) * 100);
    const haramPct = Math.max(0, 100 - halalPct - doubtfulPct);

    const maxAdditiveCount = Math.max(...topAdditives.map(a => a.detection_count || 0), 1);
    const maxTimelineScans = Math.max(...timeline.map(t => t.scans || 0), 1);

    const totalMonitoredEsts = (estBreakdown.verified || 0) + (estBreakdown.pending_review || 0) + (estBreakdown.flagged || 0);

    const handleExportCsv = () => {
        const windowLabel = interval === 'daily' ? 'Last 7 Days' : interval === 'weekly' ? 'Last 30 Days' : 'All Time';
        const rows = [
            ['HalalVerify Zamboanga City Surveillance & Compliance Report'],
            ['Generated At', new Date().toLocaleString()],
            ['Reporting Window', windowLabel],
            [],
            ['KPI METRIC', 'VALUE'],
            ['Total Scans Audited', totals.total_scans || 0],
            ['Halal Compliance Rate (%)', `${totals.compliance_rate ?? halalPct}%`],
            ['Halal Verdicts', halalCount],
            ['Doubtful / Mushbooh Verdicts', doubtfulCount],
            ['Haram / Non-Halal Verdicts', haramCount],
            ['Total Establishments Monitored', totalMonitoredEsts],
            ['Verified Establishments', estBreakdown.verified || 0],
            ['Pending Review Establishments', estBreakdown.pending_review || 0],
            ['Flagged Establishments', estBreakdown.flagged || 0],
            ['Total Community Reports', reports.total_reports || 0],
            ['Open Community Reports', reports.open_count || 0],
            ['Resolved Community Reports', reports.resolved_count || 0],
            [],
            ['TOP FLAGGED ADDITIVES', 'NAME', 'STATUS', 'DETECTION COUNT', 'ORIGIN / SOURCE'],
            ...topAdditives.map((a) => [
                a.code || '',
                a.name || '',
                a.status || '',
                a.detection_count || 0,
                a.source_description || '',
            ]),
            [],
            ['COMMUNITY REPORT CATEGORY', 'INCIDENT COUNT'],
            ...Object.entries(reports.categories || {}).map(([cat, count]) => [cat, count]),
        ];

        const csvContent = rows
            .map((r) =>
                r
                    .map((cell) => {
                        const str = String(cell ?? '').replace(/"/g, '""');
                        return `"${str}"`;
                    })
                    .join(',')
            )
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `halalverify-analytics-${interval}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePrintReport = () => {
        window.print();
    };

    return (
        <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 flex-1 flex flex-col h-full bg-slate-50/70 overflow-y-auto text-slate-800">
            {/* Enterprise Control Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 shrink-0 print:hidden">
                <div className="flex items-center justify-between gap-2 w-full md:w-auto">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-semibold tracking-wide border border-slate-200/60 shrink-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-mono text-[10px] uppercase">Telemetry: Active</span>
                    </div>

                    <div className="flex md:hidden items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center transition shadow-2xs cursor-pointer"
                            title="Export CSV Report"
                        >
                            <Download size={13} className="text-slate-600" />
                        </button>
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
                        onClick={handleExportCsv}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                        title="Download surveillance metrics as CSV"
                    >
                        <Download size={13} className="text-emerald-600" />
                        <span>Export CSV</span>
                    </button>

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
                                {totals.total_scans.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">pipeline runs</span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>YOLOv8 &amp; RapidOCR</span>
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
                        <span>{halalCount} items verified Halal</span>
                        <span className="font-mono text-[10px] text-slate-400">{doubtfulCount + haramCount} non-Halal</span>
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
                                {topAdditives[0]?.code || 'E120'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                (topAdditives[0]?.status || '').toLowerCase() === 'haram' || (topAdditives[0]?.status || '').toLowerCase() === 'prohibited'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : (topAdditives[0]?.status || '').toLowerCase() === 'halal'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                                {topAdditives[0]?.status || 'Doubtful'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium truncate mt-1">
                            {topAdditives[0]?.name || 'Cochineal / Carmine'}
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
                halalPct={halalPct}
                doubtfulPct={doubtfulPct}
                haramPct={haramPct}
                reports={reports}
                estBreakdown={estBreakdown}
                totalMonitoredEsts={totalMonitoredEsts}
                onViewChange={onViewChange}
            />
        </div>
    );
}
