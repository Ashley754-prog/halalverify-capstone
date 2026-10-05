import { useEffect, useState } from 'react';
import { ScanSearch, ShieldAlert, Store, Flag, Package, Camera, Compass, BookOpen, ArrowRight } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

export const Dashboard = ({ onViewChange }) => {
    const [summary, setSummary] = useState(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const loadSummary = async () => {
            // 1. Direct Supabase telemetry query (Instant ~100ms, zero cold start)
            try {
                const [scansCount, prodCount, addCount, estCount, repCount] = await Promise.all([
                    supabase.from('scan_history').select('*', { count: 'exact', head: true }),
                    supabase.from('products').select('*', { count: 'exact', head: true }),
                    supabase.from('additives').select('*', { count: 'exact', head: true }).in('status', ['Haram', 'Doubtful']),
                    supabase.from('establishments').select('*', { count: 'exact', head: true }),
                    supabase.from('issue_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                ]);

                setSummary({
                    totals: {
                        scans: scansCount.count ?? 0,
                        products: prodCount.count ?? 0,
                        flagged_additives: addCount.count ?? 0,
                        establishments: estCount.count ?? 0,
                        open_reports: repCount.count ?? 0,
                    }
                });
                setLoadError(false);
                return;
            } catch (sbErr) {
                console.warn('Direct Supabase summary failed, trying backend fallback:', sbErr);
            }

            // 2. Fallback to backend API if direct query fails
            try {
                const response = await authFetch(`${API_BASE_URL}/dashboard-summary`, { timeout: 2000 });
                if (response.ok) {
                    const json = await response.json();
                    setSummary(json.data || null);
                    setLoadError(false);
                    return;
                }
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
            {loadError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm font-semibold text-amber-700">
                    Could not reach the backend server. Live statistics are unavailable right now.
                </div>
            )}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <KpiCard title="Total Scans" value={totals ? totals.scans : '...'} icon={<ScanSearch />} color="emerald" />
                <KpiCard title="Verified Products" value={totals ? (totals.products ?? 0) : '...'} icon={<Package />} color="emerald" />
                <KpiCard title="Flagged Additives" value={totals ? totals.flagged_additives : '...'} icon={<ShieldAlert />} color="red" />
                <KpiCard title="Establishments" value={totals ? totals.establishments : '...'} icon={<Store />} color="blue" />
                <KpiCard title="Open Reports" value={totals ? totals.open_reports : '...'} icon={<Flag />} color="yellow" />
            </div>

            {/* Quick Actions Navigation Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-700/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300">Quick Access</span>
                        <h2 className="text-lg sm:text-xl font-black text-white">Start Verification Workflow</h2>
                        <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
                            Verify packaged product labels with dual AI OCR, browse 13,000+ verified halal items, or locate accredited dining spots in Zamboanga City.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => onViewChange?.('scanner')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-sm active:scale-95"
                        >
                            <Camera size={16} />
                            <span>Launch Scanner</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange?.('products')}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm border border-emerald-600/60 transition active:scale-95"
                        >
                            <Package size={15} />
                            <span>Catalog</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange?.('map')}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm border border-emerald-600/60 transition active:scale-95"
                        >
                            <Compass size={15} />
                            <span>Map</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange?.('registry')}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm border border-emerald-600/60 transition active:scale-95"
                        >
                            <BookOpen size={15} />
                            <span>Registry</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pipeline Architecture Overview */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1 sm:mb-2">Pipeline Architecture</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">Real-time inspection workflow for product labels and establishment certificates.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="border border-slate-100 rounded-xl p-4 sm:p-5 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Label Scanner &amp; Parser</h4>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">YOLOv8 + RapidOCR</span>
                        </div>
                        <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-600 space-y-1.5 pt-1">
                            <li><span className="font-semibold text-slate-700">RapidOCR (ONNX Runtime):</span> Extracts ingredient text declarations and E-numbers from label imagery.</li>
                            <li><span className="font-semibold text-slate-700">Ultralytics YOLOv8-Nano:</span> Localizes and identifies accredited Halal certification marks (IDCP, HDIP, etc.).</li>
                            <li><span className="font-semibold text-slate-700">Lexicon Matcher:</span> Screens detected ingredients against SMIIC 1:2019 and Codex Alimentarius guidelines.</li>
                            <li><span className="font-semibold text-slate-700">Decision Engine:</span> Outputs Halal, Doubtful, or Prohibited advisory verdict.</li>
                        </ul>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-4 sm:p-5 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Halal Certificate Analyzer</h4>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Registry Cross-Match</span>
                        </div>
                        <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-600 space-y-1.5 pt-1">
                            <li><span className="font-semibold text-slate-700">OCR Extraction:</span> Parses establishment name, certificate number, accrediting body, and expiry date.</li>
                            <li><span className="font-semibold text-slate-700">Fuzzy Matching:</span> Cross-references parsed credentials against the Zamboanga Ordinance No. 489 directory.</li>
                            <li><span className="font-semibold text-slate-700">Validity Assessment:</span> Flags expired, unaccredited, or unverified establishment claims.</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>YOLOv8-Nano logo verification (mAP@50 0.995) &bull; 135+ INS additive database</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => onViewChange?.('analytics')}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                        <span>View System Analytics</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
