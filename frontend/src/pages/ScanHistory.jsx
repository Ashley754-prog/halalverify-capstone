import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import { simplifyStatus } from '../utils/textFormatters';

import {
    calculateScanStats,
    isCertificateMode,
    getFlaggedItems,
} from '../components/history/scanHistoryUtils';
import ScanMetricsCards from '../components/history/ScanMetricsCards';
import ScanFilterBar from '../components/history/ScanFilterBar';
import ScanMobileCard from '../components/history/ScanMobileCard';
import ScanDesktopTable from '../components/history/ScanDesktopTable';
import ScanDetailModal from '../components/history/ScanDetailModal';

export const ScanHistory = ({ userRole, onViewChange }) => {
    const [modeFilter, setModeFilter] = useState('all');
    const [verdictFilter, setVerdictFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [selectedScan, setSelectedScan] = useState(null);

    const isAdmin = userRole === 'admin';

    const fetchScanHistory = useCallback(async (showFullLoading = false) => {
        try {
            if (showFullLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError('');

            // 1. Direct Supabase Query (Fast ~100ms response)
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
    const stats = useMemo(() => calculateScanStats(scanHistory), [scanHistory]);

    // Filtering logic
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

    const handleClearFilters = () => {
        setSearch('');
        setModeFilter('all');
        setVerdictFilter('all');
    };

    return (
        <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-7xl mx-auto w-full">
            {/* Quick KPI Summary Strip */}
            <ScanMetricsCards stats={stats} />

            {/* Filter and Search Bar Controls */}
            <ScanFilterBar
                modeFilter={modeFilter}
                setModeFilter={setModeFilter}
                verdictFilter={verdictFilter}
                setVerdictFilter={setVerdictFilter}
                search={search}
                setSearch={setSearch}
                refreshing={refreshing}
                onRefresh={() => fetchScanHistory(false)}
                isAdmin={isAdmin}
            />

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

            {/* Mobile View: Modern Card Feed (Screens < 768px) */}
            {!loading && (
                <div className="block md:hidden space-y-3">
                    {filtered.map((item) => (
                        <ScanMobileCard
                            key={item.id}
                            item={item}
                            onClick={setSelectedScan}
                        />
                    ))}

                    {filtered.length === 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-3">
                            <Layers size={28} className="mx-auto text-slate-300" />
                            <p className="text-xs sm:text-sm font-semibold text-slate-600">No scan records match your criteria.</p>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                >
                                    Clear search & filters
                                </button>
                                {onViewChange && (
                                    <>
                                        <span className="text-slate-300">&bull;</span>
                                        <button
                                            type="button"
                                            onClick={() => onViewChange('scanner')}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                        >
                                            Launch Scanner
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop View: High-Density Responsive Table (Screens >= 768px) */}
            {!loading && (
                <ScanDesktopTable
                    items={filtered}
                    onSelectItem={setSelectedScan}
                    onClearFilters={handleClearFilters}
                />
            )}

            {/* Scan Inspection & Audit Detail Modal */}
            <ScanDetailModal
                scan={selectedScan}
                onClose={() => setSelectedScan(null)}
            />
        </div>
    );
};

export default ScanHistory;
