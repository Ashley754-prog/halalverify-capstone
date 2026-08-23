import React, { useEffect, useState } from 'react';
import { ScanSearch, ShieldAlert, Store, Flag, Package } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import Topbar from '../components/layouts/Topbar';
import { API_BASE_URL, authFetch } from '../utils/api';

export const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                const response = await authFetch(`${API_BASE_URL}/dashboard-summary`);
                if (!response.ok) {
                    throw new Error('Dashboard summary request failed');
                }
                const json = await response.json();
                setSummary(json.data || null);
                setLoadError(false);
            } catch (err) {
                console.error(err);
                setSummary(null);
                setLoadError(true);
            }
        };
        loadSummary();
    }, []);

    const totals = summary?.totals;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            <Topbar
                title="Live System Telemetry"
                subtitle="Real-time registry and scan statistics from the HalalVerify database."
            />

            {loadError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm font-semibold text-amber-700">
                    Could not reach the backend server. Live statistics are unavailable right now.
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <KpiCard title="Total Scans" value={totals ? totals.scans : '...'} icon={<ScanSearch />} color="emerald" />
                <KpiCard title="Verified Products" value={totals ? (totals.products ?? 0) : '...'} icon={<Package />} color="emerald" />
                <KpiCard title="Flagged Additives" value={totals ? totals.flagged_additives : '...'} icon={<ShieldAlert />} color="red" />
                <KpiCard title="Establishments" value={totals ? totals.establishments : '...'} icon={<Store />} color="blue" />
                <KpiCard title="Open Reports" value={totals ? totals.open_reports : '...'} icon={<Flag />} color="yellow" />
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1 sm:mb-2">Pipeline Overview</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">What the system actually runs today.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="border border-slate-100 rounded-xl p-4 sm:p-5 bg-slate-50/50">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Label Scanner &amp; Parser</h4>
                        <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-600 space-y-1.5">
                            <li>EasyOCR extracts ingredient text and E-numbers from the captured photo.</li>
                            <li>Extracted codes are matched against the additive registry in Supabase.</li>
                            <li>Result is classified Halal, Haram, or Doubtful — advisory only.</li>
                        </ul>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-4 sm:p-5 bg-slate-50/50">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Halal Certificate Analyzer</h4>
                        <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-600 space-y-1.5">
                            <li>OCR reads certificate number, establishment, certifying body, and expiry.</li>
                            <li>Fields are fuzzy-matched against the local establishment registry.</li>
                            <li>Result is Valid, Suspicious, or Expired — advisory only.</li>
                        </ul>
                    </div>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-400 mt-4">
                    Model evaluation benchmarks (Precision, Recall, mAP50, CER, SUS) are pending
                    capstone evaluation and will be published in Analytics once measured.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
