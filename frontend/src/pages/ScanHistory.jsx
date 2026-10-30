import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Layers, Lock, ChevronDown } from 'lucide-react';
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
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';

export const ScanHistory = ({ userRole, onViewChange }) => {
    const [modeFilter, setModeFilter] = useState('all');
    const [verdictFilter, setVerdictFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [selectedScan, setSelectedScan] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        setCurrentPage(1);
    }, [modeFilter, verdictFilter, search]);

    const fetchScanHistory = useCallback(async (showFullLoading = false) => {
        try {
            if (showFullLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError('');

            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            // Non-authenticated guest users cannot view other people's cloud scans
            if (!isAdmin && !currentUserId) {
                setScanHistory([]);
                setIsGuest(true);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            setIsGuest(false);

            // 1. Direct Supabase Query (Fast ~100ms response scoped to user or admin)
            try {
                const buildQuery = (columns) => {
                    let q = supabase
                        .from('scan_history')
                        .select(columns)
                        .order('created_at', { ascending: false });
                    if (!isAdmin && currentUserId) {
                        q = q.eq('user_id', currentUserId);
                    }
                    return q;
                };

                let { data: sbData, error: sbErr } = await buildQuery('*, scan_flagged_items(*)');

                // The joined table may be locked by database permissions. Retry without the join
                // so the history list still loads instead of failing completely.
                if (sbErr) {
                    console.warn('Scan history join failed, retrying without flagged items:', sbErr.message);
                    ({ data: sbData, error: sbErr } = await buildQuery('*'));
                }

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

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedScans = filtered.slice(startIndex, startIndex + itemsPerPage);

    const handleClearFilters = () => {
        setSearch('');
        setModeFilter('all');
        setVerdictFilter('all');
    };

    return (
        <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-7xl mx-auto w-full">
            {/* Quick KPI Summary Strip */}
            {!isGuest && <ScanMetricsCards stats={stats} />}

            {isGuest && !loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm my-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Lock size={22} />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">Personal Scan History</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            Sign in to automatically sync and access your verified product and ingredient scans across your devices.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onViewChange?.('login')}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer active:scale-95"
                        >
                            Sign In / Register
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange?.('scanner')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95"
                        >
                            Start New Scan
                        </button>
                    </div>
                </div>
            ) : (
                <>
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

                    {/* Empty State */}
                    {!loading && filtered.length === 0 && (
                        <EmptyState
                            icon={Layers}
                            title="No scan records match your criteria"
                            description="Try clearing your filters or searching a different term to view previous scan reports."
                            resetText="Clear Filters"
                            onReset={handleClearFilters}
                            actionText={onViewChange ? 'Start New Scan' : undefined}
                            onAction={onViewChange ? () => onViewChange('scanner') : undefined}
                            className="bg-white shadow-xs"
                        />
                    )}

                    {/* Mobile View: Modern Card Feed (Screens < 768px) */}
                    {!loading && filtered.length > 0 && (
                        <div className="block md:hidden space-y-3">
                            {paginatedScans.map((item) => (
                                <ScanMobileCard
                                    key={item.id}
                                    item={item}
                                    onClick={setSelectedScan}
                                />
                            ))}
                        </div>
                    )}

                    {/* Desktop View: High-Density Responsive Table (Screens >= 768px) */}
                    {!loading && filtered.length > 0 && (
                        <ScanDesktopTable
                            items={paginatedScans}
                            onSelectItem={setSelectedScan}
                            onClearFilters={handleClearFilters}
                        />
                    )}

                    {/* Standardized Global Pagination */}
                    {!loading && filtered.length > 0 && (
                        <Pagination
                            currentPage={safeCurrentPage}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                            itemsPerPageOptions={[10, 25, 50]}
                            itemLabel="scans"
                            className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm"
                        />
                    )}
                </>
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
