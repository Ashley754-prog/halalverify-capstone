import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Store,
    Package,
    Flag,
    AlertCircle,
    CheckCircle2,
    XCircle,
    FileText,
    ExternalLink,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Award,
    Calendar,
    MapPin,
    User,
    Loader2,
    Clock,
    RefreshCw,
    Search,
    AlertTriangle
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

export default function VerificationQueue({ userRole, onViewChange }) {
    const [activeTab, setActiveTab] = useState('establishments'); // 'establishments' | 'products' | 'reports'
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // Data lists
    const [establishments, setEstablishments] = useState([]);
    const [products, setProducts] = useState([]);
    const [reports, setReports] = useState([]);

    // Inspection Modal state
    const [inspectingItem, setInspectingItem] = useState(null);
    const [inspectType, setInspectType] = useState(null); // 'establishment' | 'report' | 'product'
    const [adminNotes, setAdminNotes] = useState('');
    const [certNumber, setCertNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [selectedHcbId, setSelectedHcbId] = useState('');

    // Document Viewer state
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Toast
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    // Accredited HCBs list for assignment
    const [certifyingBodies, setCertifyingBodies] = useState([]);

    const fetchQueueData = async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/pending-approvals`);
            if (res.ok) {
                const json = await res.json();
                setEstablishments(json.data?.establishments || []);
                setProducts(json.data?.products || []);
                setReports(json.data?.reports || []);
            } else {
                // Fallback direct Supabase query
                await fetchSupabaseDirect();
            }
        } catch (err) {
            console.warn('Backend pending approvals error, fallback to Supabase:', err);
            await fetchSupabaseDirect();
        } finally {
            setLoading(false);
        }
    };

    const fetchSupabaseDirect = async () => {
        try {
            const { data: estData } = await supabase
                .from('establishments')
                .select('*, certifying_bodies(*)')
                .or('halal_status.ilike.%pending%,halal_status.ilike.%needs_review%')
                .order('created_at', { ascending: false });

            const { data: prodData } = await supabase
                .from('products')
                .select('*, establishments(id, name, city)')
                .ilike('status', '%pending%')
                .order('created_at', { ascending: false });

            const { data: repData } = await supabase
                .from('issue_reports')
                .select('*, products(id, name), establishments(id, name, city)')
                .or('status.eq.open,status.eq.reviewing')
                .order('created_at', { ascending: false });

            setEstablishments(estData || []);
            setProducts(prodData || []);
            setReports(repData || []);
        } catch (sbErr) {
            console.error('Direct Supabase fetch failed:', sbErr);
        }
    };

    const fetchCertifyingBodies = async () => {
        try {
            const { data } = await supabase.from('certifying_bodies').select('id, name, code');
            setCertifyingBodies(data || []);
        } catch (e) {
            console.warn('Could not load HCB list:', e);
        }
    };

    useEffect(() => {
        fetchQueueData();
        fetchCertifyingBodies();
    }, []);

    const openInspection = (item, type) => {
        setInspectingItem(item);
        setInspectType(type);
        setAdminNotes(item.admin_notes || '');
        setCertNumber(item.certificate_number || '');
        setExpiryDate(item.expiry_date || '');
        setSelectedHcbId(item.certifying_body_id || '');
        setZoomLevel(1);
        setRotation(0);
    };

    const closeInspection = () => {
        setInspectingItem(null);
        setInspectType(null);
        setAdminNotes('');
        setCertNumber('');
        setExpiryDate('');
        setSelectedHcbId('');
    };

    // Verify / Reject Establishment
    const handleVerifyEstablishment = async (status) => {
        if (!inspectingItem) return;
        const estId = inspectingItem.id;

        try {
            setProcessingId(estId);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/establishments/${estId}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: status,
                    admin_notes: adminNotes,
                    certificate_number: certNumber || undefined,
                    expiry_date: expiryDate || undefined,
                    certifying_body_id: selectedHcbId || undefined,
                }),
            });

            if (!res.ok) {
                // Supabase direct fallback
                const { data: { session } } = await supabase.auth.getSession();
                const nowIso = new Date().toISOString();
                const { error: sbErr } = await supabase
                    .from('establishments')
                    .update({
                        halal_status: status.toLowerCase(),
                        admin_notes: adminNotes,
                        certificate_number: certNumber || inspectingItem.certificate_number,
                        expiry_date: expiryDate || inspectingItem.expiry_date,
                        certifying_body_id: selectedHcbId || inspectingItem.certifying_body_id,
                        verified_at: nowIso,
                        verified_by: session?.user?.id || null,
                    })
                    .eq('id', estId);

                if (sbErr) throw sbErr;
            }

            setToast({
                visible: true,
                message: `Establishment marked as ${status.toUpperCase()} successfully.`,
                type: status === 'VERIFIED' ? 'success' : 'info',
            });

            closeInspection();
            fetchQueueData();
        } catch (err) {
            console.error('Failed to verify establishment:', err);
            setToast({
                visible: true,
                message: 'Failed to update establishment verification status.',
                type: 'error',
            });
        } finally {
            setProcessingId(null);
        }
    };

    // Verify / Reject Standalone Product
    const handleVerifyProduct = async (product, status) => {
        try {
            setProcessingId(product.id);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/products/${product.id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status }),
            });

            if (!res.ok) {
                const { data: { session } } = await supabase.auth.getSession();
                const { error } = await supabase
                    .from('products')
                    .update({
                        status: status.toUpperCase(),
                        verified_at: new Date().toISOString(),
                        verified_by: session?.user?.id || null,
                    })
                    .eq('id', product.id);
                if (error) throw error;
            }

            setToast({
                visible: true,
                message: `Product ${product.name} marked as ${status.toUpperCase()}.`,
                type: status === 'VERIFIED' ? 'success' : 'info',
            });
            fetchQueueData();
        } catch (err) {
            console.error('Failed to verify product:', err);
            setToast({ visible: true, message: 'Could not update product status.', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    // Resolve or Dismiss Issue Report
    const handleResolveReport = async (report, resolutionStatus, suspendEstablishment = false) => {
        try {
            setProcessingId(report.id);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/reports/${report.id}/resolve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: resolutionStatus,
                    resolution_notes: adminNotes || `Resolved by administrator.`,
                    suspend_establishment: suspendEstablishment,
                }),
            });

            if (!res.ok) {
                const { data: { session } } = await supabase.auth.getSession();
                const nowIso = new Date().toISOString();
                await supabase
                    .from('issue_reports')
                    .update({
                        status: resolutionStatus,
                        resolution_notes: adminNotes || 'Resolved by administrator.',
                        resolved_at: nowIso,
                        resolved_by: session?.user?.id || null,
                    })
                    .eq('id', report.id);

                if (suspendEstablishment && report.establishment_id) {
                    await supabase
                        .from('establishments')
                        .update({
                            halal_status: 'flagged',
                            admin_notes: `Suspended via report #${report.id}`,
                            verified_at: nowIso,
                            verified_by: session?.user?.id || null,
                        })
                        .eq('id', report.establishment_id);
                }
            }

            setToast({
                visible: true,
                message: `Report marked as ${resolutionStatus.toUpperCase()}.${suspendEstablishment ? ' Establishment suspended.' : ''}`,
                type: 'success',
            });
            closeInspection();
            fetchQueueData();
        } catch (err) {
            console.error('Failed to resolve report:', err);
            setToast({ visible: true, message: 'Could not resolve report.', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 flex-1 flex flex-col h-full bg-slate-50">
            <Topbar
                title="Admin Anti-Fraud & Document Verification Queue"
                subtitle="Review pending community submissions, audit uploaded Halal certificates, and resolve user-flagged compliance discrepancies."
            />

            {/* Navigation Tabs Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('establishments')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                            activeTab === 'establishments'
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <Store size={15} />
                        <span>Establishments</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            activeTab === 'establishments' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                            {establishments.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                            activeTab === 'products'
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <Package size={15} />
                        <span>Community Products</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            activeTab === 'products' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                            {products.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('reports')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                            activeTab === 'reports'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <Flag size={15} />
                        <span>User Flags & Reports</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            activeTab === 'reports' ? 'bg-white text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                            {reports.length}
                        </span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={fetchQueueData}
                    disabled={loading}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
                    title="Refresh Queue"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {/* Tab 1: Establishment Submissions */}
            {activeTab === 'establishments' && (
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Pending Establishment Registrations ({establishments.length})
                            </h3>
                            <p className="text-xs text-slate-500">
                                Verify physical certificates against accredited certifying body ledgers before publishing to public search.
                            </p>
                        </div>
                    </div>

                    {establishments.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 space-y-2">
                            <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                            <p className="text-sm font-bold text-slate-700">Verification Queue is Clean!</p>
                            <p className="text-xs">No pending establishment submissions require administrative review at this time.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                            {establishments.map((est) => (
                                <div
                                    key={est.id}
                                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col justify-between space-y-3 shadow-xs"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                                {est.halal_status?.toUpperCase() || 'PENDING'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {est.created_at ? new Date(est.created_at).toLocaleDateString() : 'Recent'}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                                            {est.name}
                                        </h4>

                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin size={12} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{est.address || est.city || 'Zamboanga City'}</span>
                                        </p>

                                        <div className="rounded-lg bg-white p-2 border border-slate-200/80 text-[11px] space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Certifier:</span>
                                                <span className="font-bold text-slate-700">
                                                    {est.certifying_bodies?.code || 'Not Specified'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Cert No:</span>
                                                <span className="font-semibold text-slate-800">
                                                    {est.certificate_number || 'Awaiting Input'}
                                                </span>
                                            </div>
                                        </div>

                                        {est.certificate_url && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-xs flex items-center justify-between text-emerald-800">
                                                <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                                                    <FileText size={13} className="text-emerald-600" />
                                                    Certificate Attached
                                                </span>
                                                <span className="text-[10px] text-emerald-700 font-bold">Image / Doc</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openInspection(est, 'establishment')}
                                        className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <ShieldCheck size={14} />
                                        <span>Side-by-Side Inspect & Verify</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Community Products */}
            {activeTab === 'products' && (
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                User-Submitted Food Products ({products.length})
                            </h3>
                            <p className="text-xs text-slate-500">
                                Audit community product submissions before indexing them in the public database.
                            </p>
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 space-y-2">
                            <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                            <p className="text-sm font-bold text-slate-700">All Products Verified!</p>
                            <p className="text-xs">No pending community products awaiting approval.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {products.map((prod) => (
                                <div key={prod.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900">{prod.name}</span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                {prod.status}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Category: <b className="text-slate-700">{prod.category || 'Food Item'}</b> • 
                                            Establishment: <b className="text-slate-700">{prod.establishments?.name || 'Standalone'}</b>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            disabled={processingId === prod.id}
                                            onClick={() => handleVerifyProduct(prod, 'VERIFIED')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1"
                                        >
                                            <CheckCircle2 size={13} />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={processingId === prod.id}
                                            onClick={() => handleVerifyProduct(prod, 'REJECTED')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1"
                                        >
                                            <XCircle size={13} />
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: User Flags & Issue Reports */}
            {activeTab === 'reports' && (
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Open User Issue Reports & Flags ({reports.length})
                            </h3>
                            <p className="text-xs text-slate-500">
                                Authenticated reports flagged by community users regarding expired certificates or questionable ingredients.
                            </p>
                        </div>
                    </div>

                    {reports.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 space-y-2">
                            <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                            <p className="text-sm font-bold text-slate-700">No Open Reports!</p>
                            <p className="text-xs">The community flag queue is completely resolved.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map((rep) => (
                                <div
                                    key={rep.id}
                                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                                {rep.issue_type}
                                            </span>
                                            <span className="text-xs font-bold text-slate-800">
                                                Subject: {rep.subject_name || rep.products?.name || rep.establishments?.name || 'Report Target'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {rep.created_at ? new Date(rep.created_at).toLocaleString() : ''}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                        "{rep.description}"
                                    </p>

                                    {rep.evidence_url && (
                                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                                            <FileText size={13} />
                                            <a href={rep.evidence_url} target="_blank" rel="noreferrer" className="underline font-semibold flex items-center gap-1">
                                                View Attached Photo Evidence <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                        <button
                                            type="button"
                                            disabled={processingId === rep.id}
                                            onClick={() => handleResolveReport(rep, 'dismissed')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition"
                                        >
                                            Dismiss Flag
                                        </button>
                                        <button
                                            type="button"
                                            disabled={processingId === rep.id}
                                            onClick={() => handleResolveReport(rep, 'resolved')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                                        >
                                            Resolve Issue
                                        </button>
                                        {rep.establishment_id && (
                                            <button
                                                type="button"
                                                disabled={processingId === rep.id}
                                                onClick={() => handleResolveReport(rep, 'resolved', true)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1"
                                                title="Flag and suspend establishment based on confirmed violation"
                                            >
                                                <AlertTriangle size={12} />
                                                <span>Suspend Establishment</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Side-by-Side Inspection Modal (Section 6 Requirement) */}
            {inspectingItem && (
                <Modal
                    isOpen={!!inspectingItem}
                    onClose={closeInspection}
                    title=""
                    size="xl"
                >
                    <div className="space-y-4">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                            <div>
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 mb-1">
                                    DOCUMENT VERIFICATION WORKFLOW
                                </span>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                    {inspectingItem.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Submitted by User ID: <span className="font-mono text-slate-700">{inspectingItem.submitted_by || 'Anonymous'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Side-by-Side Layout Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
                            {/* Left Column: Certificate Document Viewer */}
                            <div className="flex flex-col space-y-2 bg-slate-900 rounded-xl p-3 text-slate-200">
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                        <FileText size={14} className="text-emerald-400" />
                                        Physical Document Preview
                                    </span>
                                    {inspectingItem.certificate_url && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                                                className="p-1 rounded bg-slate-800 hover:bg-slate-700"
                                                title="Zoom Out"
                                            >
                                                <ZoomOut size={13} />
                                            </button>
                                            <span className="text-[10px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                                            <button
                                                type="button"
                                                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                                                className="p-1 rounded bg-slate-800 hover:bg-slate-700"
                                                title="Zoom In"
                                            >
                                                <ZoomIn size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRotation((r) => (r + 90) % 360)}
                                                className="p-1 rounded bg-slate-800 hover:bg-slate-700"
                                                title="Rotate"
                                            >
                                                <RotateCw size={13} />
                                            </button>
                                            <a
                                                href={inspectingItem.certificate_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 ml-1 text-emerald-400"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={13} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-h-[300px] flex items-center justify-center overflow-hidden bg-slate-950 rounded-lg relative">
                                    {inspectingItem.certificate_url ? (
                                        <img
                                            src={inspectingItem.certificate_url}
                                            alt="Submitted Certificate"
                                            style={{
                                                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                                transition: 'transform 0.15s ease',
                                            }}
                                            className="max-h-[360px] object-contain cursor-grab"
                                        />
                                    ) : (
                                        <div className="text-center p-6 text-slate-500 space-y-2">
                                            <FileText size={32} className="mx-auto text-slate-600" />
                                            <p className="text-xs font-semibold">No uploaded document attachment.</p>
                                            <p className="text-[11px] text-slate-600">
                                                User submitted establishment details without a digital copy of the certificate.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Submitted Metadata Audit Form */}
                            <div className="space-y-3 text-xs">
                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5">
                                    <span className="font-black text-slate-700 block uppercase tracking-wider text-[10px]">
                                        Cross-Match & Assign Credentials
                                    </span>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Accredited Halal Body (HCB)</label>
                                        <select
                                            value={selectedHcbId}
                                            onChange={(e) => setSelectedHcbId(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-800 bg-white"
                                        >
                                            <option value="">Select Certifying Body...</option>
                                            {certifyingBodies.map((cb) => (
                                                <option key={cb.id} value={cb.id}>
                                                    {cb.code} — {cb.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">Certificate No.</label>
                                            <input
                                                type="text"
                                                value={certNumber}
                                                onChange={(e) => setCertNumber(e.target.value)}
                                                placeholder="e.g. UCZP-ZAM-2024"
                                                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-800 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">Expiration Date</label>
                                            <input
                                                type="date"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-800 bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
                                        <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                                            {inspectingItem.address || inspectingItem.city || 'Zamboanga City'}
                                        </p>
                                    </div>
                                </div>

                                {inspectingItem.associated_products && inspectingItem.associated_products.length > 0 && (
                                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                                        <span className="font-bold text-slate-700 block text-[11px]">
                                            Submitted Menu Items ({inspectingItem.associated_products.length}):
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {inspectingItem.associated_products.map((p) => (
                                                <span key={p.id} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-semibold text-slate-700">
                                                    {p.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Administrative Audit Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Record verification rationale or notes on authenticity..."
                                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                            <button
                                type="button"
                                onClick={closeInspection}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                            >
                                Cancel
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={processingId === inspectingItem.id}
                                    onClick={() => handleVerifyEstablishment('REJECTED')}
                                    className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition flex items-center gap-1.5"
                                >
                                    <XCircle size={14} />
                                    <span>Reject Submission</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={processingId === inspectingItem.id}
                                    onClick={() => handleVerifyEstablishment('VERIFIED')}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Approve & Publish to Registry</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ visible: false, message: '', type: 'info' })}
            />
        </div>
    );
}
