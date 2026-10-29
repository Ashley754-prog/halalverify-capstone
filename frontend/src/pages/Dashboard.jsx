import { useEffect, useState } from 'react';
import {
    ScanSearch,
    ShieldAlert,
    Store,
    Flag,
    Package,
    ArrowRight,
    Camera,
    MapPin,
    BookOpen,
    Award,
    Cpu,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    ShieldCheck,
} from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

export const Dashboard = ({ userRole, onViewChange }) => {
    const [summary, setSummary] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [showTechDetails, setShowTechDetails] = useState(userRole === 'admin');

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        const loadSummary = async () => {
            // 1. Direct Supabase telemetry query (Instant ~100ms, zero cold start)
            try {
                const queries = [
                    supabase.from('products').select('*', { count: 'exact', head: true }),
                    supabase.from('additives').select('*', { count: 'exact', head: true }).in('status', ['Haram', 'Doubtful']),
                    supabase.from('establishments').select('*', { count: 'exact', head: true }),
                    supabase.from('certifying_bodies').select('*', { count: 'exact', head: true }),
                ];

                // Only query open reports and total scans for admin or high-level telemetry
                if (isAdmin) {
                    queries.push(supabase.from('issue_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'));
                    queries.push(supabase.from('scan_history').select('*', { count: 'exact', head: true }));
                }

                const results = await Promise.all(queries);
                const prodCount = results[0];
                const addCount = results[1];
                const estCount = results[2];
                const hcbCount = results[3];
                const repCount = isAdmin ? results[4] : { count: 0 };
                const scansCount = isAdmin ? results[5] : { count: 0 };

                setSummary({
                    totals: {
                        products: prodCount.count ?? 0,
                        flagged_additives: addCount.count ?? 0,
                        establishments: estCount.count ?? 0,
                        certifiers: hcbCount.count ?? 18,
                        open_reports: repCount.count ?? 0,
                        scans: scansCount.count ?? 0,
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
    }, [isAdmin]);

    const totals = summary?.totals;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {isAdmin ? 'Operations & Telemetry Dashboard' : 'Halal Verification Hub'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {isAdmin
                            ? 'Real-time inspection telemetry, verification backlog, and regulatory registry for Zamboanga City.'
                            : 'AI-assisted Halal food safety, product directory, and Zamboanga certified dining guide.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        AI Vision Cloud Online
                    </span>
                </div>
            </div>

            {loadError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm font-semibold text-amber-700">
                    Could not reach the backend server. Live statistics are unavailable right now.
                </div>
            )}

            {/* Consumer Quick Action Grid (For Shoppers & Community) */}
            {!isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        type="button"
                        onClick={() => onViewChange?.('scanner')}
                        className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl text-white text-left shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/20 transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Camera size={22} className="text-white" />
                        </div>
                        <h3 className="font-bold text-base text-white">Instant AI Scanner</h3>
                        <p className="text-xs text-emerald-100/90 mt-1 leading-snug">
                            Scan packaged food labels, ingredient lists, and Halal certification marks.
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white mt-4 group-hover:translate-x-1 transition-transform">
                            Open Scanner <ArrowRight size={13} />
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onViewChange?.('map')}
                        className="group bg-white border border-slate-200 hover:border-emerald-300 p-5 rounded-2xl text-left shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <MapPin size={22} />
                        </div>
                        <h3 className="font-bold text-base text-slate-800">Dining & Venues Map</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Locate Halal-certified and Muslim-owned restaurants in Zamboanga City.
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-4 group-hover:translate-x-1 transition-transform">
                            Explore Map <ArrowRight size={13} />
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onViewChange?.('products')}
                        className="group bg-white border border-slate-200 hover:border-emerald-300 p-5 rounded-2xl text-left shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Package size={22} />
                        </div>
                        <h3 className="font-bold text-base text-slate-800">Verified Products</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Browse screened consumer goods, packaged snacks, and grocery items.
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-4 group-hover:translate-x-1 transition-transform">
                            Browse Catalog <ArrowRight size={13} />
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onViewChange?.('registry')}
                        className="group bg-white border border-slate-200 hover:border-emerald-300 p-5 rounded-2xl text-left shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <BookOpen size={22} />
                        </div>
                        <h3 className="font-bold text-base text-slate-800">Additives & E-Codes</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Look up food additives, emulsifiers, and Halal certifying bodies.
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-4 group-hover:translate-x-1 transition-transform">
                            Search Standards <ArrowRight size={13} />
                        </span>
                    </button>
                </div>
            )}

            {/* KPI Summary Cards */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    {isAdmin ? 'System Metrics & Registry Ledgers' : 'Verified Halal Data Ledgers'}
                </h3>
                <div className={`grid gap-3 sm:gap-4 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
                    <KpiCard title="Verified Products" value={totals ? (totals.products ?? 0) : '...'} icon={<Package />} color="emerald" />
                    <KpiCard title="Dining Venues" value={totals ? totals.establishments : '...'} icon={<Store />} color="blue" />
                    <KpiCard title="Screened Additives" value={totals ? totals.flagged_additives : '...'} icon={<ShieldAlert />} color="red" />
                    <KpiCard title="Accredited HCBs" value={totals ? (totals.certifiers ?? 18) : 18} icon={<Award />} color="teal" />
                    {isAdmin && (
                        <KpiCard title="Open Reports" value={totals ? totals.open_reports : '...'} icon={<Flag />} color="yellow" />
                    )}
                </div>
            </div>

            {/* Admin Management Shortcuts */}
            {isAdmin && (
                <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Admin Operations</span>
                        <h4 className="text-base font-bold text-white mt-0.5">Moderation & Verification Backlog</h4>
                        <p className="text-xs text-slate-400 mt-1">Review pending community product submissions, restaurant claims, and flagged issues.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => onViewChange?.('verification-queue')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                            Open Queue
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange?.('analytics')}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer"
                        >
                            View Analytics
                        </button>
                    </div>
                </div>
            )}

            {/* Pipeline Architecture & Capstone System Specs (Expandable for Regular Users, Always Visible for Admin) */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowTechDetails((prev) => !prev)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Cpu size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800">
                                Capstone AI Architecture & Pipeline Specifications
                            </h3>
                            <p className="text-xs text-slate-500">
                                Computer vision pipeline, YOLOv8 logo detection, and Codex Alimentarius lexicon screening.
                            </p>
                        </div>
                    </div>
                    <div className="text-slate-400 hover:text-slate-600 shrink-0">
                        {showTechDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </button>

                {showTechDetails && (
                    <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Label Scanner &amp; Parser</h4>
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        YOLOv8 + RapidOCR
                                    </span>
                                </div>
                                <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-600 space-y-1.5 pt-1">
                                    <li><span className="font-semibold text-slate-700">RapidOCR (ONNX Runtime):</span> Extracts ingredient text declarations and E-numbers from label imagery.</li>
                                    <li><span className="font-semibold text-slate-700">Ultralytics YOLOv8-Nano:</span> Localizes and identifies accredited Halal certification marks (IDCP, HDIP, etc.).</li>
                                    <li><span className="font-semibold text-slate-700">Lexicon Matcher:</span> Screens detected ingredients against SMIIC 1:2019 and Codex Alimentarius guidelines.</li>
                                    <li><span className="font-semibold text-slate-700">Decision Engine:</span> Outputs Halal, Doubtful, or Prohibited advisory verdict.</li>
                                </ul>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Halal Certificate Analyzer</h4>
                                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                        Registry Cross-Match
                                    </span>
                                </div>
                                <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-600 space-y-1.5 pt-1">
                                    <li><span className="font-semibold text-slate-700">OCR Extraction:</span> Parses establishment name, certificate number, accrediting body, and expiry date.</li>
                                    <li><span className="font-semibold text-slate-700">Fuzzy Matching:</span> Cross-references parsed credentials against the Zamboanga Ordinance No. 489 directory.</li>
                                    <li><span className="font-semibold text-slate-700">Validity Assessment:</span> Flags expired, unaccredited, or unverified establishment claims.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>YOLOv8-Nano logo verification (mAP@50 0.995) &bull; 135+ INS additive database</span>
                            </span>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => onViewChange?.('analytics')}
                                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                >
                                    <span>View System Analytics</span>
                                    <ArrowRight size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
