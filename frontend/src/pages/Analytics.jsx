import React, { useEffect, useState } from 'react';
import { Target, Eye, FileText, Users, BarChart2, Database, RefreshCw } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import { API_BASE_URL, authFetch } from '../utils/api';

const emptyAnalytics = {
    totals: {
        scans: 0,
        label_scans: 0,
        certificate_scans: 0,
        additives: 0,
        establishments: 0,
        issue_reports: 0,
    },
    quality: {
        average_confidence: 0,
        high_confidence_scans: 0,
    },
    breakdowns: {
        scan_verdicts: {},
        scan_modes: {},
        additive_statuses: {},
        establishment_statuses: {},
        report_statuses: {},
    },
};

const MetricCard = ({ label, value, unit, sublabel, color = 'emerald', icon }) => {
    const colors = {
        emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/20',
        blue: 'from-blue-500 to-blue-700 shadow-blue-500/20',
        amber: 'from-amber-500 to-amber-700 shadow-amber-500/20',
        purple: 'from-purple-500 to-purple-700 shadow-purple-500/20',
        red: 'from-red-500 to-red-700 shadow-red-500/20',
        slate: 'from-slate-600 to-slate-800 shadow-slate-500/20',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 sm:p-6 text-white shadow-lg`}>
            <div className="flex justify-between items-start mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/80">{label}</p>
                <div className="p-1.5 sm:p-2 bg-white/15 rounded-lg">{icon}</div>
            </div>
            <p className="text-3xl sm:text-4xl font-black tracking-tight">
                {value}
                <span className="text-base sm:text-lg font-semibold ml-1 text-white/80">{unit}</span>
            </p>
            {sublabel && <p className="text-[11px] sm:text-xs text-white/70 mt-1 font-medium">{sublabel}</p>}
        </div>
    );
};

const BreakdownPanel = ({ title, description, items }) => {
    const entries = Object.entries(items || {});

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">{description}</p>

            <div className="space-y-3">
                {entries.length === 0 && (
                    <p className="text-sm text-slate-400">No records yet.</p>
                )}

                {entries.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                        <span className="font-semibold capitalize text-slate-600">{label.replaceAll('_', ' ')}</span>
                        <span className="font-bold text-slate-900">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PENDING_METRICS = [
    { label: 'Precision', icon: <Target size={18} />, note: 'Logo detection benchmark — depends on Spike S2 outcome' },
    { label: 'Recall', icon: <Eye size={18} />, note: 'Logo detection benchmark — depends on Spike S2 outcome' },
    { label: 'mAP50', icon: <BarChart2 size={18} />, note: 'Logo detection benchmark — depends on Spike S2 outcome' },
    { label: 'CER', icon: <FileText size={18} />, note: 'OCR accuracy — measured by Spike S3 (30-label baseline)' },
    { label: 'SUS Score', icon: <Users size={18} />, note: 'Usability — measured during UAT (30–50 respondents)' },
];

export const Analytics = () => {
    const [analytics, setAnalytics] = useState(emptyAnalytics);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await authFetch(`${API_BASE_URL}/analytics-summary`);

            if (!response.ok) {
                throw new Error('Analytics summary request failed');
            }

            const json = await response.json();
            setAnalytics(json.data || emptyAnalytics);
        } catch (err) {
            console.error(err);
            setError('Could not load analytics data. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const { totals, quality, breakdowns } = analytics;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            <Topbar
                title="Analytics & Model Performance"
                subtitle="Live Supabase usage analytics. Evaluation metrics appear only after they are measured."
                action={
                    <button
                        type="button"
                        onClick={loadAnalytics}
                        className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-semibold border border-emerald-200 hover:bg-emerald-200"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh Analytics
                    </button>
                }
            />

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live System Data</span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Supabase</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricCard label="Total Scans" value={totals.scans} unit="" sublabel="Saved scan history rows" color="emerald" icon={<Database size={18} />} />
                    <MetricCard label="Avg. Confidence" value={quality.average_confidence} unit="%" sublabel="Average scanner confidence" color="blue" icon={<Target size={18} />} />
                    <MetricCard label="High Confidence" value={quality.high_confidence_scans} unit="" sublabel="Scans at 80% or higher" color="purple" icon={<Eye size={18} />} />
                    <MetricCard label="Reports" value={totals.issue_reports} unit="" sublabel="Submitted issue reports" color="amber" icon={<FileText size={18} />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <BreakdownPanel title="Scan Verdicts" description="Classifications generated by label/certificate scans." items={breakdowns.scan_verdicts} />
                    <BreakdownPanel title="Additive Statuses" description="Current classifications in the additive registry." items={breakdowns.additive_statuses} />
                    <BreakdownPanel title="Establishment Statuses" description="Current compliance status of local establishments." items={breakdowns.establishment_statuses} />
                </div>
            </section>

            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Capstone Evaluation Metrics</span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Pending Evaluation</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                    <p className="text-xs sm:text-sm text-slate-500 mb-4">
                        No evaluation has been conducted yet. Values below will be filled in only after real
                        measurements exist (spike reports and UAT), so the manuscript never cites unmeasured numbers.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {PENDING_METRICS.map((metric) => (
                            <div key={metric.label} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{metric.label}</span>
                                    <span className="text-slate-400">{metric.icon}</span>
                                </div>
                                <p className="text-lg font-black text-slate-400">—</p>
                                <p className="text-[11px] text-slate-500 leading-snug">{metric.note}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Analytics;
