import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CheckCircle2, ShieldAlert, BarChart3, Users, RefreshCw } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import Topbar from '../components/layouts/Topbar';

const API_BASE_URL = 'http://127.0.0.1:8000';

const emptySummary = {
    totals: {
        scans: 0,
        label_scans: 0,
        certificate_scans: 0,
        additives: 0,
        flagged_additives: 0,
        establishments: 0,
        open_reports: 0,
    },
    breakdowns: {
        scan_verdicts: {},
        additive_statuses: {},
        establishment_statuses: {},
        report_statuses: {},
    },
    latest_scans: [],
};

const formatPercent = (value, total) => {
    if (!total) return '0%';
    return `${Math.round((value / total) * 100)}%`;
};

const StatusRow = ({ label, value, total, tone = 'emerald' }) => {
    const toneClass = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        slate: 'bg-slate-500',
    }[tone];

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium capitalize">{label.replaceAll('_', ' ')}</span>
                <span className="font-bold text-slate-800">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${toneClass}`} style={{ width: formatPercent(value, total) }} />
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const [summary, setSummary] = useState(emptySummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadSummary = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/dashboard-summary`);

            if (!response.ok) {
                throw new Error('Dashboard summary request failed');
            }

            const json = await response.json();
            setSummary(json.data || emptySummary);
        } catch (err) {
            console.error(err);
            setError('Could not load dashboard data. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, []);

    const { totals, breakdowns, latest_scans: latestScans } = summary;
    const verifiedCount = breakdowns.establishment_statuses.verified || breakdowns.establishment_statuses.Verified || 0;
    const doubtfulCount = breakdowns.scan_verdicts.Doubtful || breakdowns.scan_verdicts.Yellow || 0;
    const haramCount = breakdowns.scan_verdicts.Haram || breakdowns.scan_verdicts.Red || 0;

    return (
        <div className="p-8">
            <Topbar
                title="Live System Dashboard"
                subtitle="Current database totals from Supabase and recent scanner activity."
                action={
                    <button
                        type="button"
                        onClick={loadSummary}
                        className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-semibold border border-emerald-200 hover:bg-emerald-200"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh Data
                    </button>
                }
            />

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KpiCard title="Total Scans" value={totals.scans} icon={<LayoutDashboard />} color="emerald" />
                <KpiCard title="Label Scans" value={totals.label_scans} icon={<CheckCircle2 />} color="green" />
                <KpiCard title="Certificate Scans" value={totals.certificate_scans} icon={<BarChart3 />} color="yellow" />
                <KpiCard title="Flagged Additives" value={totals.flagged_additives} icon={<ShieldAlert />} color="red" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Operational Summary</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        These values come from the actual Supabase tables, not frontend mock constants.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Scan Verdict Breakdown</h4>
                            <div className="space-y-4">
                                <StatusRow label="Doubtful" value={doubtfulCount} total={totals.scans} tone="amber" />
                                <StatusRow label="Haram" value={haramCount} total={totals.scans} tone="red" />
                                {Object.entries(breakdowns.scan_verdicts).map(([status, count]) => (
                                    !['Doubtful', 'Yellow', 'Haram', 'Red'].includes(status) && (
                                        <StatusRow key={status} label={status} value={count} total={totals.scans} tone="emerald" />
                                    )
                                ))}
                            </div>
                        </div>

                        <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Registry Health</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 font-medium">Additive Records</span>
                                    <span className="font-bold text-slate-800">{totals.additives}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 font-medium">Registered Establishments</span>
                                    <span className="font-bold text-slate-800">{totals.establishments}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 font-medium">Verified Establishments</span>
                                    <span className="font-bold text-emerald-600">{verifiedCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 font-medium">Open Issue Reports</span>
                                    <span className="font-bold text-amber-600">{totals.open_reports}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Users size={18} className="text-emerald-600" /> Recent Scans
                    </h3>
                    <p className="text-sm text-slate-500 mb-5">Latest saved scan-history records.</p>

                    <div className="space-y-3">
                        {latestScans.length === 0 && (
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                                No scans saved yet.
                            </div>
                        )}

                        {latestScans.map(scan => (
                            <div key={scan.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-bold text-slate-800 text-sm">{scan.image_name || 'Scan Record'}</p>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500 border border-slate-200">
                                        {scan.mode}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Verdict: {scan.verdict || 'Unknown'}</p>
                                <p className="mt-1 text-xs text-slate-400">Confidence: {Math.round((scan.confidence || 0) * 100)}%</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
