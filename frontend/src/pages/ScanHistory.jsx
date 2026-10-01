import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Clock,
    ScanSearch,
    FileText,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Search,
    X,
    ChevronRight,
    Copy,
    Check,
    Eye,
    ShieldCheck,
    Layers,
    Filter,
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import { simplifyStatus } from '../utils/textFormatters';

const VerdictBadge = ({ verdict, className = '' }) => {
    const display = simplifyStatus(verdict);
    const styles = {
        Green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Yellow: 'bg-amber-50 text-amber-700 border-amber-200',
        Red: 'bg-rose-50 text-rose-700 border-rose-200',
        Halal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Doubtful: 'bg-amber-50 text-amber-700 border-amber-200',
        Prohibited: 'bg-rose-50 text-rose-700 border-rose-200',
        Haram: 'bg-rose-50 text-rose-700 border-rose-200',
        Valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Expired: 'bg-rose-50 text-rose-700 border-rose-200',
        Suspicious: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    const icons = {
        Green: <CheckCircle2 size={12} className="shrink-0" />,
        Yellow: <AlertTriangle size={12} className="shrink-0" />,
        Red: <XCircle size={12} className="shrink-0" />,
        Halal: <CheckCircle2 size={12} className="shrink-0" />,
        Doubtful: <AlertTriangle size={12} className="shrink-0" />,
        Prohibited: <XCircle size={12} className="shrink-0" />,
        Haram: <XCircle size={12} className="shrink-0" />,
        Valid: <CheckCircle2 size={12} className="shrink-0" />,
        Expired: <XCircle size={12} className="shrink-0" />,
        Suspicious: <AlertTriangle size={12} className="shrink-0" />,
    };

    const style = styles[display] || styles[verdict] || 'bg-slate-100 text-slate-700 border-slate-200';
    const icon = icons[display] || icons[verdict] || <AlertTriangle size={12} className="shrink-0" />;

    return (
        <span
            className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 border ${style} ${className}`}
        >
            {icon}
            <span>{display || 'Unknown'}</span>
        </span>
    );
};

const isCertificateMode = (mode) => {
    return mode === 'cert' || mode === 'certificate';
};

const getConfidencePct = (confidence) => {
    const raw = Number(confidence || 0);
    const pct = raw > 1 ? raw : raw * 100;
    return Math.min(100, Math.max(0, pct));
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

const formatFullDate = (dateStr) => {
    if (!dateStr) return 'No date';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

const getFlaggedItems = (item) => {
    if (!item) return [];
    if (Array.isArray(item.scan_flagged_items) && item.scan_flagged_items.length > 0) {
        return item.scan_flagged_items;
    }
    try {
        const raw = typeof item.raw_result === 'string' ? JSON.parse(item.raw_result) : item.raw_result;
        if (raw && Array.isArray(raw.flaggedIngredients)) {
            return raw.flaggedIngredients.map(f => ({
                matched_text: f.matched_text || f.ingredient || f.name,
                status: f.status,
                reason: f.reason,
                additive_id: f.additive_id || f.code,
            }));
        }
    } catch {
        // fallback
    }
    return [];
};

const MODE_FILTERS = [
    { id: 'all', label: 'All Modes' },
    { id: 'label', label: 'Label OCR' },
    { id: 'certificate', label: 'Logo Scan' },
];

const VERDICT_FILTERS = [
    { id: 'all', label: 'All Results' },
    { id: 'halal', label: 'Halal' },
    { id: 'doubtful', label: 'Doubtful' },
    { id: 'prohibited', label: 'Prohibited' },
];

export const ScanHistory = ({ userRole, onViewChange }) => {
    const [modeFilter, setModeFilter] = useState('all');
    const [verdictFilter, setVerdictFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [selectedScan, setSelectedScan] = useState(null);
    const [copiedText, setCopiedText] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    const isAdmin = userRole === 'admin';

    const fetchScanHistory = useCallback(async (showFullLoading = false) => {
        try {
            if (showFullLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError('');

            // 1. Direct Supabase Query (Instant ~100ms, zero cold start)
            try {
                const { data: { session } } = await supabase.auth.getSession();
                let query = supabase
                    .from('scan_history')
                    .select('*, scan_flagged_items(*)')
                    .order('created_at', { ascending: false });

                if (!isAdmin && session?.user?.id) {
                    query = query.eq('user_id', session.user.id);
                }

                const { data: sbData, error: sbErr } = await query;
                if (!sbErr && sbData) {
                    setScanHistory(sbData);
                    return;
                }
            } catch (sbErr) {
                console.warn('Direct Supabase scan history failed, falling back to API:', sbErr);
            }

            // 2. Fallback to backend API
            const response = await authFetch(`${API_BASE_URL}/scan-history?t=${Date.now()}`, {
                cache: 'no-store',
                timeout: 2500,
            });

            if (!response.ok) {
                throw new Error('Failed to load scan history');
            }

            const json = await response.json();
            setScanHistory(json.data || []);
        } catch (err) {
            console.error(err);
            setError('Could not load scan history. Please check if your database or backend is accessible.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchScanHistory(true);

        const intervalId = window.setInterval(() => {
            fetchScanHistory(false);
        }, 12000);

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchScanHistory(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchScanHistory]);

    // High level metrics
    const stats = useMemo(() => {
        let halal = 0;
        let doubtful = 0;
        let prohibited = 0;

        scanHistory.forEach(s => {
            const status = simplifyStatus(s.verdict).toLowerCase();
            if (status === 'halal' || status === 'valid' || status === 'green') {
                halal++;
            } else if (status === 'doubtful' || status === 'suspicious' || status === 'yellow') {
                doubtful++;
            } else if (status === 'prohibited' || status === 'haram' || status === 'expired' || status === 'red') {
                prohibited++;
            }
        });

        return {
            total: scanHistory.length,
            halal,
            doubtful,
            prohibited,
        };
    }, [scanHistory]);

    // Filtering
    const filtered = useMemo(() => {
        return scanHistory.filter(item => {
            const modeMatch =
                modeFilter === 'all' ||
                item.mode === modeFilter ||
                (modeFilter === 'certificate' && isCertificateMode(item.mode));

            const simplifiedVerdict = simplifyStatus(item.verdict).toLowerCase();
            const verdictMatch =
                verdictFilter === 'all' ||
                (verdictFilter === 'halal' && (simplifiedVerdict === 'halal' || simplifiedVerdict === 'valid')) ||
                (verdictFilter === 'doubtful' && (simplifiedVerdict === 'doubtful' || simplifiedVerdict === 'suspicious')) ||
                (verdictFilter === 'prohibited' && (simplifiedVerdict === 'prohibited' || simplifiedVerdict === 'haram' || simplifiedVerdict === 'expired'));

            const name = item.image_name || '';
            const text = item.extracted_text || '';
            const logo = item.detected_logo || '';
            const id = String(item.id || '');
            const flaggedTexts = getFlaggedItems(item).map(f => f.matched_text || '').join(' ');
            const searchValue = search.toLowerCase().trim();

            const searchMatch =
                !searchValue ||
                name.toLowerCase().includes(searchValue) ||
                text.toLowerCase().includes(searchValue) ||
                logo.toLowerCase().includes(searchValue) ||
                id.toLowerCase().includes(searchValue) ||
                flaggedTexts.toLowerCase().includes(searchValue);

            return modeMatch && verdictMatch && searchMatch;
        });
    }, [scanHistory, modeFilter, verdictFilter, search]);

    const handleCopy = async (text, type = 'text') => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'text') {
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
            } else {
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2000);
            }
        } catch {
            // ignore
        }
    };

    return (
        <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-7xl mx-auto w-full">
            <Topbar
                title="Scan History"
                subtitle={isAdmin ? "Full audit log of all verification events across the network." : "Your personal scan log and verification audit history."}
                onBack={() => onViewChange?.('back')}
            />

            {/* Quick KPI Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Scans</span>
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                            <Layers size={15} />
                        </div>
                    </div>
                    <div className="mt-1.5 text-xl sm:text-2xl font-black text-slate-900">{stats.total}</div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Recorded scan events</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Halal Verified</span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={15} />
                        </div>
                    </div>
                    <div className="mt-1.5 text-xl sm:text-2xl font-black text-emerald-600">{stats.halal}</div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Passed verification</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Doubtful Scans</span>
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                            <AlertTriangle size={15} />
                        </div>
                    </div>
                    <div className="mt-1.5 text-xl sm:text-2xl font-black text-amber-600">{stats.doubtful}</div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Require origin review</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Prohibited</span>
                        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                            <XCircle size={15} />
                        </div>
                    </div>
                    <div className="mt-1.5 text-xl sm:text-2xl font-black text-rose-600">{stats.prohibited}</div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Non-compliant items</p>
                </div>
            </div>

            {/* Filter and Search Bar Controls */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                    {/* Mode Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        {MODE_FILTERS.map(f => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setModeFilter(f.id)}
                                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap border shrink-0 ${
                                    modeFilter === f.id
                                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/10'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Search and Refresh Bar */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={isAdmin ? "Search product, text, or ID..." : "Search scans, ingredients..."}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8.5 pr-8 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchScanHistory(false)}
                            disabled={refreshing}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition disabled:opacity-60"
                            title="Refresh scan history"
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Verdict Quick Filter Pills */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 overflow-x-auto no-scrollbar">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                        <Filter size={11} /> Status:
                    </span>
                    {VERDICT_FILTERS.map(vf => {
                        const isSelected = verdictFilter === vf.id;
                        return (
                            <button
                                key={vf.id}
                                type="button"
                                onClick={() => setVerdictFilter(vf.id)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap shrink-0 border ${
                                    isSelected
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                {vf.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 space-y-3 shadow-xs">
                    <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">Loading your scan records...</p>
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm font-semibold text-rose-700 flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* Mobile View: Modern Card Feed (Visible on screens < 768px) */}
            {!loading && (
                <div className="block md:hidden space-y-3">
                    {filtered.map((item) => {
                        const flagged = getFlaggedItems(item);
                        const displayFlagged = flagged.slice(0, 2);
                        const remainingFlagged = flagged.length - 2;
                        const confPct = getConfidencePct(item.confidence);

                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedScan(item)}
                                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs active:scale-[0.99] hover:border-emerald-300 transition-all cursor-pointer group"
                            >
                                {/* Card Header: Mode, Scan ID, Verdict */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                                            item.mode === 'label'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-purple-50 text-purple-700'
                                        }`}>
                                            {item.mode === 'label' ? <ScanSearch size={11} /> : <FileText size={11} />}
                                            {item.mode === 'label' ? 'Label' : 'Logo'}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 truncate">
                                            #{String(item.id).slice(0, 8)}
                                        </span>
                                    </div>
                                    <VerdictBadge verdict={item.verdict} />
                                </div>

                                {/* Product / Scan Title */}
                                <div className="mb-2">
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">
                                        {item.image_name || (item.mode === 'label' ? 'Product Label Scan' : 'Certificate Scan')}
                                    </h4>
                                    {item.detected_logo && (
                                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                            <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                                            <span className="truncate">Certifier: <strong>{item.detected_logo}</strong></span>
                                        </p>
                                    )}
                                </div>

                                {/* Additives / Status Chips */}
                                <div className="mb-3">
                                    {flagged.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {displayFlagged.map((f, i) => {
                                                const isHaram = f.status?.toLowerCase() === 'haram' || f.status?.toLowerCase() === 'prohibited';
                                                return (
                                                    <span
                                                        key={i}
                                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                                            isHaram
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}
                                                    >
                                                        {isHaram ? <XCircle size={10} /> : <AlertTriangle size={10} />}
                                                        <span className="truncate max-w-[120px]">{f.matched_text}</span>
                                                    </span>
                                                );
                                            })}
                                            {remainingFlagged > 0 && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                                    +{remainingFlagged} more
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                                            <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
                                            <span>All detected ingredients verified compliant</span>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer: Confidence + Date + Action Hint */}
                                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all"
                                                style={{ width: `${confPct}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-mono font-semibold text-slate-600">
                                            {confPct.toFixed(0)}%
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                            <Clock size={11} className="shrink-0" />
                                            {formatDate(item.created_at)}
                                        </span>
                                        <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                            <Layers size={28} className="mx-auto text-slate-300" />
                            <p className="text-xs sm:text-sm font-semibold text-slate-600">No scan records match your criteria.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setModeFilter('all');
                                    setVerdictFilter('all');
                                }}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                            >
                                Clear search & filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop View: High-Density Responsive Table (Visible on screens >= 768px) */}
            {!loading && (
                <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[100px]">Scan ID</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[240px]">Product / Certificate</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[100px]">Mode</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[130px]">Verdict</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[120px]">Confidence</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[140px]">Date & Time</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap min-w-[80px] text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((item) => {
                                    const flagged = getFlaggedItems(item);
                                    const displayFlagged = flagged.slice(0, 2);
                                    const remainingFlagged = flagged.length - 2;
                                    const confPct = getConfidencePct(item.confidence);

                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedScan(item)}
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                #{String(item.id).slice(0, 8)}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-emerald-700 transition">
                                                    {item.image_name || (item.mode === 'label' ? 'Product Label Scan' : 'Certificate Scan')}
                                                </p>

                                                {flagged.length > 0 ? (
                                                    <div className="mt-1 flex flex-wrap items-center gap-1">
                                                        {displayFlagged.map((f, i) => {
                                                            const isHaram = f.status?.toLowerCase() === 'haram' || f.status?.toLowerCase() === 'prohibited';
                                                            return (
                                                                <span
                                                                    key={i}
                                                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                                        isHaram
                                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    }`}
                                                                >
                                                                    {f.matched_text}
                                                                </span>
                                                            );
                                                        })}
                                                        {remainingFlagged > 0 && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                +{remainingFlagged} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : item.detected_logo ? (
                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                                                        Certifier: {item.detected_logo}
                                                    </span>
                                                ) : null}
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                                    item.mode === 'label'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-purple-50 text-purple-700'
                                                }`}>
                                                    {item.mode === 'label' ? <ScanSearch size={12} /> : <FileText size={12} />}
                                                    {item.mode === 'label' ? 'Label' : 'Logo'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <VerdictBadge verdict={item.verdict} />
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{ width: `${confPct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono text-slate-600 font-semibold">
                                                        {confPct.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedScan(item);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
                                                >
                                                    <Eye size={12} />
                                                    <span>View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs sm:text-sm">
                                            <p className="font-semibold text-slate-600">No scan records match your criteria.</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearch('');
                                                    setModeFilter('all');
                                                    setVerdictFilter('all');
                                                }}
                                                className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                            >
                                                Clear search & filters
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Scan Inspection & Audit Detail Modal */}
            <Modal
                isOpen={!!selectedScan}
                onClose={() => setSelectedScan(null)}
                title="Scan Inspection Audit"
                description={selectedScan ? `Audit record for ${selectedScan.image_name || 'scanned item'}` : ''}
                size="lg"
                footer={
                    <button
                        type="button"
                        onClick={() => setSelectedScan(null)}
                        className="w-full sm:w-auto px-5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 text-white hover:bg-slate-800 transition"
                    >
                        Close
                    </button>
                }
            >
                {selectedScan && (
                    <div className="space-y-4">
                        {/* Verdict Hero Banner */}
                        {(() => {
                            const simplified = simplifyStatus(selectedScan.verdict);
                            const confPct = getConfidencePct(selectedScan.confidence);
                            const isHalal = simplified === 'Halal' || simplified === 'Valid';
                            const isDoubtful = simplified === 'Doubtful' || simplified === 'Suspicious';
                            const isProhibited = simplified === 'Prohibited' || simplified === 'Haram' || simplified === 'Expired';

                            let bannerBg = 'bg-slate-50 border-slate-200 text-slate-800';
                            let bannerIcon = <AlertTriangle size={24} className="text-slate-500 shrink-0" />;
                            let bannerDesc = 'Scan completed with standard verification parameters.';

                            if (isHalal) {
                                bannerBg = 'bg-emerald-50/80 border-emerald-200 text-emerald-950';
                                bannerIcon = <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />;
                                bannerDesc = 'Zero prohibited or non-halal items detected. Verified compliant.';
                            } else if (isDoubtful) {
                                bannerBg = 'bg-amber-50/80 border-amber-200 text-amber-950';
                                bannerIcon = <AlertTriangle size={24} className="text-amber-600 shrink-0" />;
                                bannerDesc = 'Contains additives of unverified origin (Syubhah). Verification recommended.';
                            } else if (isProhibited) {
                                bannerBg = 'bg-rose-50/80 border-rose-200 text-rose-950';
                                bannerIcon = <XCircle size={24} className="text-rose-600 shrink-0" />;
                                bannerDesc = 'Contains confirmed non-halal or prohibited ingredients.';
                            }

                            return (
                                <div className={`rounded-2xl border p-4 ${bannerBg}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            {bannerIcon}
                                            <div>
                                                <h4 className="text-base sm:text-lg font-black uppercase tracking-tight">
                                                    Verdict: {simplified}
                                                </h4>
                                                <p className="text-xs text-slate-600 mt-0.5">{bannerDesc}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Match Score</span>
                                            <div className="text-lg font-black font-mono text-slate-800">{confPct.toFixed(0)}%</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                                <span className="font-semibold text-slate-400 block mb-1">Scan Mode</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    {selectedScan.mode === 'label' ? <ScanSearch size={14} className="text-blue-600" /> : <FileText size={14} className="text-purple-600" />}
                                    {selectedScan.mode === 'label' ? 'Packaging Label OCR' : 'Logo / Certificate Scan'}
                                </span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                                <span className="font-semibold text-slate-400 block mb-1">Scan Timestamp</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-500" />
                                    {formatFullDate(selectedScan.created_at)}
                                </span>
                            </div>

                            {selectedScan.detected_logo && (
                                <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                                    <span className="font-semibold text-slate-400 block mb-1">Detected Certifying Body</span>
                                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-emerald-600" />
                                        {selectedScan.detected_logo}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Flagged Additives Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    <AlertTriangle size={14} className="text-amber-500" />
                                    Flagged Additives & Risks ({getFlaggedItems(selectedScan).length})
                                </h4>
                            </div>

                            {(() => {
                                const flagged = getFlaggedItems(selectedScan);
                                if (flagged.length === 0) {
                                    return (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                            <span>No flagged or doubtful additives were identified in this product scan.</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                        {flagged.map((f, i) => {
                                            const isHaram = f.status?.toLowerCase() === 'haram' || f.status?.toLowerCase() === 'prohibited';
                                            return (
                                                <div
                                                    key={i}
                                                    className={`rounded-xl border p-3 text-xs ${
                                                        isHaram
                                                            ? 'border-rose-200 bg-rose-50/50'
                                                            : 'border-amber-200 bg-amber-50/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-bold text-slate-900">
                                                            {f.matched_text}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                            isHaram ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {f.status || 'Doubtful'}
                                                        </span>
                                                    </div>
                                                    {f.reason && (
                                                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                                                            {f.reason}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Extracted Ingredients / OCR Text */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    <FileText size={14} className="text-slate-500" />
                                    Extracted OCR Ingredients & Text
                                </h4>
                                {selectedScan.extracted_text && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(selectedScan.extracted_text, 'text')}
                                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                    >
                                        {copiedText ? (
                                            <>
                                                <Check size={12} className="text-emerald-600" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                <span>Copy text</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-36 overflow-y-auto text-xs text-slate-700 leading-relaxed">
                                {selectedScan.extracted_text ? (
                                    <p className="whitespace-pre-wrap select-all font-mono text-[11px]">
                                        {selectedScan.extracted_text}
                                    </p>
                                ) : (
                                    <p className="text-slate-400 italic">No textual ingredients extracted for this scan.</p>
                                )}
                            </div>
                        </div>

                        {/* Audit Identifier Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                                Audit ID: <span className="font-mono text-slate-600">#{String(selectedScan.id)}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(String(selectedScan.id), 'id')}
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                            >
                                {copiedId ? (
                                    <>
                                        <Check size={11} className="text-emerald-600" />
                                        <span className="text-emerald-600">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={11} />
                                        <span>Copy ID</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ScanHistory;
