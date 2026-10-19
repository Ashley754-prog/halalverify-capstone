import { useEffect, useState } from 'react';
import {
    User,
    Mail,
    Save,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Building2,
    Package,
    Flag,
    Clock,
    XCircle,
    History,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../utils/api';

const ProfilePage = ({ onViewChange }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [name, setName] = useState('');

    // User Contributions & Issue Reports Tracker
    const [submissionsLoading, setSubmissionsLoading] = useState(true);
    const [myEstablishments, setMyEstablishments] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        let isMounted = true;

        const loadProfileAndActivity = async () => {
            const { data: { session }, error: userError } = await supabase.auth.getSession();
            const user = session?.user;

            if (userError || !user) {
                if (isMounted) {
                    setErrorMessage('Could not load your account session. Try signing in again.');
                    setLoading(false);
                    setSubmissionsLoading(false);
                }
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, role, email')
                .eq('id', user.id)
                .single();

            if (!isMounted) return;

            setUserId(user.id);
            setEmail(profile?.email || user.email || '');
            setRole(profile?.role || 'user');
            setName(profile?.full_name || '');

            if (profileError) {
                console.warn('Profile load warning:', profileError.message);
            }

            setLoading(false);

            // Load user's submitted establishments, products, and issue reports
            try {
                let loadedFromApi = false;
                if (session?.access_token) {
                    try {
                        const res = await fetch(`${API_BASE_URL}/api/v1/my-submissions`, {
                            headers: { Authorization: `Bearer ${session.access_token}` },
                        });
                        if (res.ok) {
                            const payload = await res.json();
                            if (isMounted) {
                                setMyEstablishments(payload.establishments || []);
                                setMyProducts(payload.products || []);
                                setMyReports(payload.reports || []);
                            }
                            loadedFromApi = true;
                        }
                    } catch {
                        // Fall back to direct Supabase queries below
                    }
                }

                if (!loadedFromApi) {
                    const [estRes, prodRes, repRes] = await Promise.all([
                        supabase
                            .from('establishments')
                            .select('id, name, type, address, halal_status, admin_notes, created_at, verified_at')
                            .eq('submitted_by', user.id)
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('products')
                            .select('id, name, brand, category, status, admin_notes, created_at, verified_at')
                            .eq('submitted_by', user.id)
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('issue_reports')
                            .select('id, issue_type, subject_name, related_to, status, resolution_notes, created_at')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false }),
                    ]);
                    if (isMounted) {
                        setMyEstablishments(estRes.data || []);
                        setMyProducts(prodRes.data || []);
                        setMyReports(repRes.data || []);
                    }
                }
            } catch (err) {
                console.warn('Failed to load user submissions:', err);
            } finally {
                if (isMounted) {
                    setSubmissionsLoading(false);
                }
            }
        };

        loadProfileAndActivity();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId || saving) return;

        setSaving(true);
        setErrorMessage('');

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: name.trim() })
            .eq('id', userId);

        setSaving(false);

        if (error) {
            setErrorMessage(`Save failed: ${error.message}`);
            return;
        }

        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };

    const isAdmin = role === 'admin';

    // Combine and normalize items for the tracker list
    const combinedSubmissions = [
        ...myEstablishments.map((est) => {
            const rawStatus = (est.halal_status || '').toLowerCase();
            let badgeType = 'pending';
            let badgeLabel = 'Pending Review';
            if (rawStatus === 'certified' || rawStatus === 'verified') {
                badgeType = 'approved';
                badgeLabel = 'Verified & Live';
            } else if (rawStatus === 'rejected' || rawStatus === 'non_halal') {
                badgeType = 'rejected';
                badgeLabel = 'Declined';
            }
            return {
                uid: `est-${est.id}`,
                kind: 'establishment',
                kindLabel: 'Establishment',
                title: est.name || 'Unnamed Establishment',
                subtitle: `${est.type || 'Restaurant'} • ${est.address || 'Zamboanga City'}`,
                badgeType,
                badgeLabel,
                createdAt: est.created_at,
                note: est.admin_notes,
            };
        }),
        ...myProducts.map((prod) => {
            const rawStatus = (prod.status || '').toUpperCase();
            let badgeType = 'pending';
            let badgeLabel = 'Pending Review';
            if (rawStatus === 'VERIFIED' || rawStatus === 'CERTIFIED') {
                badgeType = 'approved';
                badgeLabel = 'Verified & Live';
            } else if (rawStatus === 'REJECTED' || rawStatus === 'NON_HALAL') {
                badgeType = 'rejected';
                badgeLabel = 'Declined';
            }
            return {
                uid: `prod-${prod.id}`,
                kind: 'product',
                kindLabel: 'Product',
                title: prod.name || 'Unnamed Product',
                subtitle: `${prod.brand ? `${prod.brand} • ` : ''}${prod.category || 'Food & Beverage'}`,
                badgeType,
                badgeLabel,
                createdAt: prod.created_at,
                note: prod.admin_notes,
            };
        }),
        ...myReports.map((rep) => {
            const rawStatus = (rep.status || 'pending').toLowerCase();
            let badgeType = 'pending';
            let badgeLabel = 'Under Review';
            if (rawStatus === 'resolved' || rawStatus === 'approved' || rawStatus === 'closed') {
                badgeType = 'approved';
                badgeLabel = 'Resolved';
            } else if (rawStatus === 'rejected' || rawStatus === 'dismissed') {
                badgeType = 'rejected';
                badgeLabel = 'Dismissed';
            }
            return {
                uid: `rep-${rep.id}`,
                kind: 'report',
                kindLabel: 'Issue Report',
                title: rep.subject_name || rep.related_to || 'Community Report',
                subtitle: rep.issue_type || 'Halal Compliance Concern',
                badgeType,
                badgeLabel,
                createdAt: rep.created_at,
                note: rep.resolution_notes,
            };
        }),
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const filteredSubmissions = combinedSubmissions.filter((item) => {
        if (activeFilter === 'all') return true;
        return item.kind === activeFilter;
    });

    const formatCleanNote = (note) => {
        if (!note) return '';
        // Strip internal pipe-separated AI audit tags if present, showing only human-friendly summary
        const parts = note
            .split('|')
            .map((s) => s.trim())
            .filter(
                (s) =>
                    s &&
                    !s.startsWith('[AI ') &&
                    !s.startsWith('Classification Tier:') &&
                    !s.startsWith('Ownership Declaration:') &&
                    !s.startsWith('Consumer Contribution:') &&
                    !s.startsWith('Brand Declaration:')
            );
        return parts.slice(0, 2).join(' • ');
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 w-full space-y-4 sm:space-y-6">
            {loading ? (
                <div className="flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 p-10 text-sm text-slate-500 shadow-sm">
                    <Loader2 size={18} className="animate-spin text-emerald-600" />
                    Loading your profile...
                </div>
            ) : (
                <>
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Widescreen Layout Grid (Split on web view, stacked on mobile) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                            {/* Left Column: Avatar & Account Info (1 col on web) */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-slate-100 bg-emerald-600 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-md">
                                    <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-800">{name || 'User Profile'}</h3>
                                    <p className="text-xs text-slate-500">{email}</p>
                                </div>

                                <div className={`w-full pt-3 pb-1 border-t flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-xl border ${isAdmin
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                    : 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                                    <ShieldCheck size={16} />
                                    {isAdmin ? 'Administrator Account' : 'Standard Account'}
                                </div>
                            </div>

                            {/* Right Column: Personal Information Form (2 cols on web) */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
                                <h3 className="text-sm sm:text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1">
                                    <User size={18} className="text-emerald-600" />
                                    Personal Information
                                </h3>

                                {errorMessage && (
                                    <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm text-red-700">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div className="space-y-1.5">
                                        <label htmlFor="profile-full-name" className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                            <User size={13} className="text-slate-400" />
                                            Full Name
                                        </label>
                                        <input
                                            id="profile-full-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Juan Dela Cruz"
                                            maxLength={80}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="profile-email" className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                            <Mail size={13} className="text-slate-400" />
                                            Email Address
                                        </label>
                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={email}
                                            readOnly
                                            disabled
                                            title="Email address is managed by your sign-in account"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Actions Footer Bar (Side-by-Side buttons for all viewport sizes) */}
                        <div className="flex items-center justify-end gap-3 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm">
                            {savedSuccess && (
                                <span className="text-xs font-semibold text-emerald-600 items-center gap-1 hidden sm:inline-flex">
                                    <CheckCircle2 size={15} />
                                    Profile Updated!
                                </span>
                            )}

                            {errorMessage && !savedSuccess && (
                                <span className="text-xs font-semibold text-red-600 items-center gap-1 hidden sm:inline-flex">
                                    <AlertCircle size={15} />
                                    Not saved
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => onViewChange?.('back')}
                                className="px-4 sm:px-6 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                            >
                                {saving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>

                    {/* My Contributions & Reports Tracker */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                                    <History size={18} className="text-emerald-600" />
                                    My Contributions &amp; Issue Reports
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Track the verification status of establishments, products, and reports you submitted.
                                </p>
                            </div>

                            {/* Filter Pills */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {[
                                    { id: 'all', label: `All (${combinedSubmissions.length})` },
                                    { id: 'establishment', label: `Places (${myEstablishments.length})` },
                                    { id: 'product', label: `Products (${myProducts.length})` },
                                    { id: 'report', label: `Reports (${myReports.length})` },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                            activeFilter === tab.id
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {submissionsLoading ? (
                            <div className="py-8 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
                                <Loader2 size={16} className="animate-spin text-emerald-600" />
                                Loading your submission history...
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="py-8 text-center space-y-1.5 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                                    No submissions found in this category yet
                                </p>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    When you contribute a Halal establishment, packaged product, or compliance report, its live review status will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredSubmissions.map((item) => {
                                    const IconComp =
                                        item.kind === 'establishment'
                                            ? Building2
                                            : item.kind === 'product'
                                            ? Package
                                            : Flag;

                                    const badgeStyles =
                                        item.badgeType === 'approved'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : item.badgeType === 'rejected'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-amber-50 text-amber-800 border-amber-200';

                                    const BadgeIcon =
                                        item.badgeType === 'approved'
                                            ? CheckCircle2
                                            : item.badgeType === 'rejected'
                                            ? XCircle
                                            : Clock;

                                    const cleanNote = formatCleanNote(item.note);

                                    return (
                                        <div
                                            key={item.uid}
                                            className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                        >
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                                                    <IconComp size={17} />
                                                </div>
                                                <div className="min-w-0 space-y-0.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                                            {item.title}
                                                        </span>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                            {item.kindLabel}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                                                    {cleanNote && (
                                                        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1 mt-1">
                                                            {cleanNote}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0 pl-12 sm:pl-0">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyles}`}
                                                >
                                                    <BadgeIcon size={13} />
                                                    {item.badgeLabel}
                                                </span>
                                                {item.createdAt && (
                                                    <span className="text-[11px] text-slate-400">
                                                        {new Date(item.createdAt).toLocaleDateString('en-PH', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfilePage;

