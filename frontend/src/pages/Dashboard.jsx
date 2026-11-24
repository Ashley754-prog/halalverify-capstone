import { useEffect, useState } from 'react';
import {
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
} from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { getTodayIsoDate } from '../data/constants';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

export const Dashboard = ({ userRole, onViewChange }) => {
    const [summary, setSummary] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [showTechDetails, setShowTechDetails] = useState(userRole === 'admin');
    const [recentProducts, setRecentProducts] = useState([]);
    const [recentEstablishments, setRecentEstablishments] = useState([]);
    const [recentLoading, setRecentLoading] = useState(false);
    const [recentError, setRecentError] = useState(false);

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        const loadSummary = async () => {
            // 1. Direct Supabase telemetry query (Instant ~100ms, zero cold start)
            try {
                let prodQuery = supabase.from('products').select('*', { count: 'exact', head: true });
                let estQuery = supabase.from('establishments').select('*', { count: 'exact', head: true });

                if (!isAdmin) {
                    const today = getTodayIsoDate();
                    prodQuery = prodQuery
                        .not(
                            'status',
                            'in',
                            '("REJECTED","PENDING","PENDING_VERIFICATION","needs_review","pending_review","draft","inactive","Expired","Flagged","Suspended","HARAM")'
                        )
                        .or(`expiry_date.is.null,expiry_date.gte.${today}`);
                    estQuery = estQuery
                        .not(
                            'halal_status',
                            'in',
                            '("pending","pending_review","pending_verification","needs_review","rejected","flagged","suspended","relocated","permanently_closed","demolished","closed","haram","expired","REJECTED","PENDING_VERIFICATION","FLAGGED","SUSPENDED")'
                        )
                        .or(`expiry_date.is.null,expiry_date.gte.${today}`);
                }

                const queries = [
                    prodQuery,
                    supabase.from('additives').select('*', { count: 'exact', head: true }).in('status', ['Haram', 'Doubtful']),
                    estQuery,
                    supabase.from('certifying_bodies').select('*', { count: 'exact', head: true }),
                ];

                // Only query open reports and total scans for admin or high-level telemetry
                if (isAdmin) {
                    queries.push(supabase.from('issue_reports').select('*', { count: 'exact', head: true }).in('status', ['open', 'reviewing', 'pending']));
                    queries.push(supabase.from('scan_history').select('*', { count: 'exact', head: true }));
                }

                const results = await Promise.all(queries);
                const prodCount = results[0];
                const addCount = results[1];
                const estCount = results[2];
                const hcbCount = results[3];
                const repCount = isAdmin ? results[4] : { count: 0 };
                const scansCount = isAdmin ? results[5] : { count: 0 };

                if (prodCount.error || estCount.error || hcbCount.error) {
                    throw prodCount.error || estCount.error || hcbCount.error;
                }

                setSummary({
                    totals: {
                        products: prodCount.count ?? 0,
                        flagged_additives: addCount.count ?? 0,
                        establishments: estCount.count ?? 0,
                        certifiers: hcbCount.count ?? 0,
                        open_reports: repCount.count ?? 0,
                        scans: scansCount.count ?? 0,
                    }
                });
                setLoadError(false);
                return;
            } catch (sbErr) {
                console.warn('Direct Supabase summary failed:', sbErr);
            }

            // 2. Fallback to backend API only when authenticated (endpoint requires auth)
            if (!userRole) {
                setSummary(null);
                setLoadError(true);
                return;
            }
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
    }, [isAdmin, userRole]);

    useEffect(() => {
        if (isAdmin) return;

        let isMounted = true;
        const loadRecentlyVerified = async () => {
            setRecentLoading(true);
            setRecentError(false);
            const today = getTodayIsoDate();

            try {
                const [productsResult, establishmentsResult] = await Promise.all([
                    supabase
                        .from('products')
                        .select('id, name, brand, category, status, created_at')
                        .in('status', ['Halal', 'halal', 'HALAL', 'Verified', 'verified', 'VERIFIED', 'For Renewal', 'for_renewal'])
                        .or(`expiry_date.is.null,expiry_date.gte.${today}`)
                        .order('created_at', { ascending: false })
                        .limit(3),
                    supabase
                        .from('establishments')
                        .select('id, name, type, address, halal_status, created_at')
                        .in('halal_status', ['verified', 'VERIFIED', 'halal_certified', 'Halal Certified', 'for_renewal', 'For Renewal'])
                        .or(`expiry_date.is.null,expiry_date.gte.${today}`)
                        .order('created_at', { ascending: false })
                        .limit(3),
                ]);

                if (productsResult.error) throw productsResult.error;
                if (establishmentsResult.error) throw establishmentsResult.error;

                if (isMounted) {
                    setRecentProducts(productsResult.data || []);
                    setRecentEstablishments(establishmentsResult.data || []);
                }
            } catch (error) {
                console.error('Failed to load recently verified dashboard entries:', error);
                if (isMounted) setRecentError(true);
            } finally {
                if (isMounted) setRecentLoading(false);
            }
        };

        loadRecentlyVerified();
        return () => {
            isMounted = false;
        };
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
                        className="group flex flex-col justify-between bg-emerald-800 hover:bg-emerald-900 border border-emerald-900 p-5 rounded-2xl text-white text-left shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-700 border border-emerald-600/60 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-emerald-700/90">
                                <Camera size={20} className="text-white" aria-hidden="true" />
                            </div>
                            <h3 className="font-bold text-base text-white">Instant AI Scanner</h3>
                            <p className="text-xs text-emerald-50/90 mt-1.5 leading-relaxed">
                                Scan packaged food labels, ingredient lists, and Halal certification marks.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white mt-4 pt-3 border-t border-emerald-700/80 group-hover:gap-2 transition-all">
                            Open Scanner <ArrowRight size={14} aria-hidden="true" />
                        </span>
                    </button>

                    {[
                        {
                            view: 'map',
                            title: 'Dining & Venues Map',
                            description: 'Locate Halal-certified and Muslim-owned restaurants in Zamboanga City.',
                            cta: 'Explore Map',
                            icon: MapPin,
                        },
                        {
                            view: 'products',
                            title: 'Verified Products',
                            description: 'Browse screened consumer goods, packaged snacks, and grocery items.',
                            cta: 'Browse Catalog',
                            icon: Package,
                        },
                        {
                            view: 'registry',
                            title: 'Additives & E-Codes',
                            description: 'Look up food additives, emulsifiers, and Halal certifying bodies.',
                            cta: 'Search Standards',
                            icon: BookOpen,
                        },
                    ].map(({ view, title, description, cta, icon: Icon }) => (
                        <button
                            key={view}
                            type="button"
                            onClick={() => onViewChange?.(view)}
                            className="group flex flex-col justify-between bg-white hover:bg-slate-50/80 border border-slate-300/90 hover:border-emerald-600/60 p-5 rounded-2xl text-left shadow-2xs hover:shadow-sm transition-all cursor-pointer active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-emerald-800 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-emerald-50 group-hover:border-emerald-200">
                                    <Icon size={20} aria-hidden="true" />
                                </div>
                                <h3 className="font-bold text-base text-slate-900">{title}</h3>
                                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                    {description}
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 mt-4 pt-3 border-t border-slate-100 group-hover:gap-2 transition-all">
                                {cta} <ArrowRight size={14} aria-hidden="true" />
                            </span>
                        </button>
                    ))}
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
                    <KpiCard title="Flagged Additives" value={totals ? totals.flagged_additives : '...'} icon={<ShieldAlert />} color="red" />
                    <KpiCard title="Accredited HCBs" value={totals ? (totals.certifiers ?? 0) : '...'} icon={<Award />} color="teal" />
                    {isAdmin && (
                        <KpiCard title="Open Reports" value={totals ? totals.open_reports : '...'} icon={<Flag />} color="yellow" />
                    )}
                </div>
            </div>

            {!isAdmin && (
                <section aria-labelledby="recently-verified-heading" className="space-y-3">
                    <div>
                        <div>
                            <h3 id="recently-verified-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Recently Verified
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                A quick look at verified products and dining venues in the directory.
                            </p>
                        </div>
                    </div>

                    {recentLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                            Loading recently verified entries...
                        </div>
                    ) : recentError ? (
                        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                            Recently verified entries are temporarily unavailable.
                        </div>
                    ) : recentProducts.length === 0 && recentEstablishments.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                            No verified entries are available to show right now.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {[
                                { title: 'Products', items: recentProducts, kind: 'product' },
                                { title: 'Dining venues', items: recentEstablishments, kind: 'establishment' },
                            ].map(({ title, items, kind }) => (
                                <div key={kind} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                                        {kind === 'product' ? (
                                            <button
                                                type="button"
                                                onClick={() => onViewChange?.('products')}
                                                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                                            >
                                                Browse products <ArrowRight size={13} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => onViewChange?.('map')}
                                                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                                            >
                                                Explore venues <ArrowRight size={13} />
                                            </button>
                                        )}
                                    </div>
                                    {items.length > 0 ? (
                                        <ul className="divide-y divide-slate-100">
                                            {items.map((item) => (
                                                <li key={item.id} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                                                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${kind === 'product' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        {kind === 'product' ? <Package size={16} /> : <Store size={16} />}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                                            {kind === 'product'
                                                                ? [item.brand, item.category].filter(Boolean).join(' · ') || 'Verified product'
                                                                : [item.type, item.address].filter(Boolean).join(' · ') || 'Verified dining venue'}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                                        Verified
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-slate-500">No recent verified {kind === 'product' ? 'products' : 'venues'} found.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

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

            {/* Pipeline Architecture & Capstone System Specs (Hidden from regular users, visible only to admin and developers) */}
            {isAdmin && (
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
                                        YOLOv8 + Gemini Vision
                                    </span>
                                </div>
                                <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-600 space-y-1.5 pt-1">
                                    <li><span className="font-semibold text-slate-700">Gemini Vision (RapidOCR Failover):</span> Extracts ingredient text declarations and E-numbers from label imagery.</li>
                                    <li><span className="font-semibold text-slate-700">Ultralytics YOLOv8-Nano:</span> Localizes and identifies accredited Halal certification marks (IDCP, HDIP, etc.).</li>
                                    <li><span className="font-semibold text-slate-700">Lexicon Matcher:</span> Screens detected ingredients against SMIIC 1:2019 and Codex Alimentarius guidelines.</li>
                                    <li><span className="font-semibold text-slate-700">Decision Engine:</span> Outputs Clean, Doubtful, Haram, or Unverified advisory verdict.</li>
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
                                <span>YOLOv8-Nano logo verification (mAP@50 0.995) &bull; 158+ INS additive database</span>
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
            )}
        </div>
    );
};

export default Dashboard;
