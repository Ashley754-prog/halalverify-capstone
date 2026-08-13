import React, { useEffect, useState, useCallback } from 'react';
import { Clock, ScanSearch, FileText, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';

const API_BASE_URL = 'http://127.0.0.1:8000';

const VerdictBadge = ({ verdict }) => {
    const styles = {
        Green: 'bg-green-50 text-green-700 border border-green-200',
        Yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
        Red: 'bg-red-50 text-red-700 border border-red-200',
        Halal: 'bg-green-50 text-green-700 border border-green-200',
        Doubtful: 'bg-amber-50 text-amber-700 border border-amber-200',
        Haram: 'bg-red-50 text-red-700 border border-red-200',
        Valid: 'bg-green-50 text-green-700 border border-green-200',
        Expired: 'bg-red-50 text-red-700 border border-red-200',
        Suspicious: 'bg-amber-50 text-amber-700 border border-amber-200',
    };

    const icons = {
        Green: <CheckCircle size={12} />,
        Yellow: <AlertTriangle size={12} />,
        Red: <XCircle size={12} />,
        Halal: <CheckCircle size={12} />,
        Doubtful: <AlertTriangle size={12} />,
        Haram: <XCircle size={12} />,
        Valid: <CheckCircle size={12} />,
        Expired: <XCircle size={12} />,
        Suspicious: <AlertTriangle size={12} />,
    };

    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${styles[verdict] || 'bg-slate-100 text-slate-600'}`}>
            {icons[verdict] || <AlertTriangle size={12} />} {verdict || 'Unknown'}
        </span>
    );
};

const isCertificateMode = (mode) => {
    return mode === 'cert' || mode === 'certificate';
};

const FILTERS = [
    { id: 'all', label: 'All Scans' },
    { id: 'label', label: 'Label Scans' },
    { id: 'certificate', label: 'Logo Scans' },
];

export const ScanHistory = ({ userRole }) => {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = userRole === 'admin';

    const fetchScanHistory = useCallback(async (showFullLoading = false) => {
        try {
            if (showFullLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError('');

            const response = await fetch(`${API_BASE_URL}/scan-history?t=${Date.now()}`, {
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error('Failed to load scan history');
            }

            const json = await response.json();
            setScanHistory(json.data || []);
        } catch (err) {
            console.error(err);
            setError('Could not load scan history. Please check if the backend is running.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchScanHistory(true);

        const intervalId = window.setInterval(() => {
            fetchScanHistory(false);
        }, 10000);

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

    const filtered = scanHistory.filter(item => {
        const modeMatch =
            filter === 'all' ||
            item.mode === filter ||
            (filter === 'certificate' && isCertificateMode(item.mode));

        const name = item.image_name || '';
        const text = item.extracted_text || '';
        const logo = item.detected_logo || '';
        const searchValue = search.toLowerCase();

        const searchMatch =
            name.toLowerCase().includes(searchValue) ||
            text.toLowerCase().includes(searchValue) ||
            logo.toLowerCase().includes(searchValue);

        return modeMatch && searchMatch;
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1">
            <Topbar
                title="Scan History"
                subtitle={isAdmin ? "Full audit log of all scan events across all users." : "Your personal scan log and past verification results."}
            />

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3.5 sm:px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${
                                filter === f.id
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/10'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <input
                        type="text"
                        placeholder={isAdmin ? "Search product or user..." : "Search product..."}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                        type="button"
                        onClick={() => fetchScanHistory(false)}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Loading scan history...
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Scan ID</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Product / Certificate</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Mode</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Verdict</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Confidence</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Date & Time</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                        {String(item.id).slice(0, 8)}
                                    </td>

                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                        <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                                            {item.image_name || 'Unnamed Scan'}
                                        </p>

                                        {item.scan_flagged_items?.length > 0 && (
                                            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                                                {item.scan_flagged_items.length} ingredient(s) flagged
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                            item.mode === 'label'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-purple-50 text-purple-700'
                                        }`}>
                                            {item.mode === 'label' ? <ScanSearch size={12} /> : <FileText size={12} />}
                                            {item.mode === 'label' ? 'Label' : 'Logo'}
                                        </span>
                                    </td>

                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <VerdictBadge verdict={item.verdict} />
                                    </td>

                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500"
                                                    style={{ width: `${Number(item.confidence || 0) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-slate-600">
                                                {(Number(item.confidence || 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs text-slate-500 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {item.created_at
                                                ? new Date(item.created_at).toLocaleString('en-PH', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : 'No date'}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 sm:py-16 text-center text-slate-400 text-xs sm:text-sm">
                                        No scan records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ScanHistory;
