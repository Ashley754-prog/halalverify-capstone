import { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    Store,
    Package,
    Flag,
    RefreshCw,
    Sparkles,
    ChevronRight,
    BarChart2,
} from 'lucide-react';
import Toast from '../components/ui/Toast';
import VerificationQueueTabs from '../components/verification/VerificationQueueTabs';
import VerificationInspectionModal from '../components/verification/VerificationInspectionModal';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

export default function VerificationQueue({ onViewChange }) {
    const [activeTab, setActiveTab] = useState('establishments'); // 'establishments' | 'products' | 'reports'
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [autoVerifyingId, setAutoVerifyingId] = useState(null);
    const [autoVerifyingAll, setAutoVerifyingAll] = useState(false);
    const [aiEvalResult, setAiEvalResult] = useState(null);
    const [newMenuItemName, setNewMenuItemName] = useState('');
    const [addingMenuItem, setAddingMenuItem] = useState(false);

    // Data lists
    const [establishments, setEstablishments] = useState([]);
    const [products, setProducts] = useState([]);
    const [reports, setReports] = useState([]);

    // Inspection Modal state
    const [inspectingItem, setInspectingItem] = useState(null);
    const [inspectingType, setInspectingType] = useState('establishment'); // 'establishment' | 'product'
    const [adminNotes, setAdminNotes] = useState('');
    const [certNumber, setCertNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [selectedHcbId, setSelectedHcbId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('verified');

    // Document Viewer state
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Toast
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    // Accredited HCBs list for assignment
    const [certifyingBodies, setCertifyingBodies] = useState([]);

    const fetchSupabaseDirect = useCallback(async () => {
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
    }, []);

    const fetchQueueData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/pending-approvals`);
            if (res.ok) {
                const json = await res.json();
                setEstablishments(json.data?.establishments || []);
                setProducts(json.data?.products || []);
                setReports(json.data?.reports || []);
            } else {
                await fetchSupabaseDirect();
            }
        } catch (err) {
            console.warn('Backend pending approvals error, fallback to Supabase:', err);
            await fetchSupabaseDirect();
        } finally {
            setLoading(false);
        }
    }, [fetchSupabaseDirect]);

    const fetchCertifyingBodies = useCallback(async () => {
        try {
            const { data } = await supabase.from('certifying_bodies').select('id, name, code');
            setCertifyingBodies(data || []);
        } catch (e) {
            console.warn('Could not load HCB list:', e);
        }
    }, []);

    useEffect(() => {
        fetchQueueData();
        fetchCertifyingBodies();
    }, [fetchQueueData, fetchCertifyingBodies]);

    const openInspection = (item, type = 'establishment') => {
        setInspectingType(type);
        setInspectingItem(item);
        setAdminNotes(item.admin_notes || '');
        setCertNumber(item.certificate_number || item.certificate_no || '');
        setExpiryDate(item.expiry_date || '');
        setSelectedHcbId(item.certifying_body_id || '');
        setNewMenuItemName('');
        const st = (item.halal_status || item.status || '').toLowerCase();
        if (['muslim_owned', 'muslim_friendly', 'vegetarian_vegan', 'pork_free_declared'].includes(st)) {
            setSelectedStatus(st);
        } else if (st.includes('community')) {
            setSelectedStatus('muslim_owned');
        } else {
            setSelectedStatus('verified');
        }
        setAiEvalResult(null);
        setZoomLevel(1);
        setRotation(0);

        if (type === 'establishment' && item.id && (!item.associated_products || item.associated_products.length === 0)) {
            supabase
                .from('products')
                .select('*')
                .eq('establishment_id', item.id)
                .then(({ data, error }) => {
                    if (!error && data) {
                        setInspectingItem(prev => (prev && prev.id === item.id ? { ...prev, associated_products: data } : prev));
                    }
                })
                .catch(console.warn);
        }
    };

    const handleAddMenuItem = async () => {
        if (!newMenuItemName.trim() || !inspectingItem?.id) return;
        try {
            setAddingMenuItem(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData?.session?.user?.id || null;
            const newProd = {
                name: newMenuItemName.trim(),
                establishment_id: inspectingItem.id,
                category: 'Food & Beverage',
                status: 'VERIFIED',
                submitted_by: userId,
                source: inspectingItem.source || 'Admin Itemized Menu Dish',
            };
            const { data, error } = await supabase.from('products').insert(newProd).select();
            if (!error && data?.[0]) {
                setInspectingItem(prev => ({
                    ...prev,
                    associated_products: [...(prev.associated_products || []), data[0]]
                }));
                setNewMenuItemName('');
                setToast({
                    visible: true,
                    message: `Added "${newMenuItemName.trim()}" to establishment menu.`,
                    type: 'success',
                });
            }
        } catch (err) {
            console.error('Failed to add menu item:', err);
        } finally {
            setAddingMenuItem(false);
        }
    };

    const closeInspection = () => {
        setInspectingItem(null);
        setInspectingType('establishment');
        setAdminNotes('');
        setCertNumber('');
        setExpiryDate('');
        setSelectedHcbId('');
        setSelectedStatus('verified');
        setAiEvalResult(null);
        setZoomLevel(1);
        setRotation(0);
        setNewMenuItemName('');
    };

    const handleAutoVerifyEstablishment = async (estId, autoApprove = true) => {
        try {
            setAutoVerifyingId(estId);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/establishments/${estId}/auto-verify?auto_approve=${autoApprove}`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                const evalData = data.evaluation || {};

                if (inspectingItem && inspectingItem.id === estId) {
                    setAiEvalResult(evalData);
                    if (evalData.certificate_number) setCertNumber(evalData.certificate_number);
                    if (evalData.expiry_date) setExpiryDate(evalData.expiry_date);
                    if (evalData.certifying_body_id) setSelectedHcbId(evalData.certifying_body_id);
                    if (evalData.admin_notes) setAdminNotes(evalData.admin_notes);
                }

                if (data.is_auto_approved && autoApprove) {
                    setToast({
                        visible: true,
                        message: `AI Auto-Approved: Confidence ${data.score}%. Verified & published to map!`,
                        type: 'success',
                    });
                    if (inspectingItem && inspectingItem.id === estId) {
                        closeInspection();
                    }
                    fetchQueueData();
                } else {
                    const firstReason = evalData.audit_trail?.reasons?.[0];
                    setToast({
                        visible: true,
                        message: `AI Screened (Score: ${data.score}%). ${firstReason ? firstReason : 'Form auto-filled. Please inspect.'}`,
                        type: 'info',
                    });
                    fetchQueueData();
                }
            } else {
                setToast({ visible: true, message: 'Automated verification service unavailable.', type: 'error' });
            }
        } catch (err) {
            console.error('Auto verify failed:', err);
            setToast({ visible: true, message: 'Could not contact automated verification service.', type: 'error' });
        } finally {
            setAutoVerifyingId(null);
        }
    };

    const handleAutoVerifyProduct = async (prodId, autoApprove = true) => {
        try {
            setAutoVerifyingId(prodId);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/products/${prodId}/auto-verify?auto_approve=${autoApprove}`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                if (data && (!autoApprove || inspectingItem?.id === prodId)) {
                    setAiEvalResult(data.evaluation || data);
                }
                if (data.is_auto_approved && autoApprove) {
                    setToast({
                        visible: true,
                        message: `AI Auto-Approved Product: Confidence ${data.score}%. Published to catalog!`,
                        type: 'success',
                    });
                    fetchQueueData();
                } else {
                    setToast({
                        visible: true,
                        message: `AI Screened: Score ${data.score}%. Manual inspection advised.`,
                        type: 'info',
                    });
                    fetchQueueData();
                }
            } else {
                setToast({ visible: true, message: 'Automated product check failed.', type: 'error' });
            }
        } catch (err) {
            console.error('Auto verify product error:', err);
            setToast({ visible: true, message: 'Automated product check encountered an error.', type: 'error' });
        } finally {
            setAutoVerifyingId(null);
        }
    };

    const handleAutoVerifyAll = async () => {
        try {
            setAutoVerifyingAll(true);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/auto-verify-all?auto_approve=true`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                setToast({
                    visible: true,
                    message: data.message || 'Batch automated verification complete!',
                    type: 'success',
                });
                fetchQueueData();
            } else {
                setToast({ visible: true, message: 'Batch auto-verification failed.', type: 'error' });
            }
        } catch (err) {
            console.error('Batch auto-verify error:', err);
            setToast({ visible: true, message: 'Batch auto-verification encountered an error.', type: 'error' });
        } finally {
            setAutoVerifyingAll(false);
        }
    };

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

            if (['verified', 'muslim_owned', 'muslim_friendly', 'vegetarian_vegan'].includes(status.toLowerCase())) {
                try {
                    const nowIso = new Date().toISOString();
                    const { data: { session } } = await supabase.auth.getSession();
                    await supabase
                        .from('products')
                        .update({
                            status: 'VERIFIED',
                            verified_at: nowIso,
                            verified_by: session?.user?.id || null,
                        })
                        .eq('establishment_id', estId);
                } catch (prodCascadeErr) {
                    console.warn('Cascaded product verification notice:', prodCascadeErr);
                }
            }

            if (newMenuItemName && newMenuItemName.trim()) {
                try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const userId = sessionData?.session?.user?.id || null;
                    await supabase.from('products').insert({
                        name: newMenuItemName.trim(),
                        establishment_id: estId,
                        category: 'Food & Beverage',
                        status: 'VERIFIED',
                        submitted_by: userId,
                        source: inspectingItem.source || 'Admin Itemized Menu Dish',
                    });
                    setNewMenuItemName('');
                } catch (addErr) {
                    console.warn('Auto-save pending menu item notice:', addErr);
                }
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
            if (inspectingItem && inspectingItem.id === product.id) {
                closeInspection();
            }
            fetchQueueData();
        } catch (err) {
            console.error('Failed to verify product:', err);
            setToast({ visible: true, message: 'Could not update product status.', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

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
            {/* Navigation Tabs Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 shrink-0">
                {/* Row 1 on mobile: Module Title & Action Buttons */}
                <div className="flex md:hidden items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-1.5 font-black text-slate-800 text-xs tracking-tight">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span>Audit Queue</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleAutoVerifyAll}
                            disabled={autoVerifyingAll || (establishments.length === 0 && products.length === 0)}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Automatically run OCR & HCB validation across all pending submissions"
                        >
                            <Sparkles size={13} className={autoVerifyingAll ? 'animate-spin' : ''} />
                            <span>{autoVerifyingAll ? 'Auditing...' : 'Auto-Verify'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={fetchQueueData}
                            disabled={loading}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition flex items-center justify-center text-xs"
                            title="Refresh Queue"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-600' : ''} />
                        </button>

                        {onViewChange && (
                            <button
                                type="button"
                                onClick={() => onViewChange('analytics')}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition flex items-center justify-center text-xs"
                                title="Open Analytics Dashboard"
                            >
                                <BarChart2 size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Row */}
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-nowrap">
                    <div className="hidden sm:flex items-center gap-1.5 pr-2.5 mr-0.5 border-r border-slate-200 shrink-0">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span className="font-black text-slate-800 text-sm tracking-tight">Audit Queue</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setActiveTab('establishments')}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                            activeTab === 'establishments'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/80'
                        }`}
                    >
                        <Store size={14} />
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
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                            activeTab === 'products'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/80'
                        }`}
                    >
                        <Package size={14} />
                        <span><span className="hidden sm:inline">Community </span>Products</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            activeTab === 'products' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                            {products.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('reports')}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                            activeTab === 'reports'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/80'
                        }`}
                    >
                        <Flag size={14} />
                        <span><span className="hidden sm:inline">User Flags & </span>Reports</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            activeTab === 'reports' ? 'bg-white text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                            {reports.length}
                        </span>
                    </button>
                </div>

                {/* Actions on desktop */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleAutoVerifyAll}
                        disabled={autoVerifyingAll || (establishments.length === 0 && products.length === 0)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition flex items-center gap-1.5 text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Automatically run OCR & HCB validation across all pending submissions"
                    >
                        <Sparkles size={14} className={autoVerifyingAll ? 'animate-spin' : ''} />
                        <span>{autoVerifyingAll ? 'Auditing All...' : 'Auto-Verify All (AI)'}</span>
                    </button>

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

                    {onViewChange && (
                        <button
                            type="button"
                            onClick={() => onViewChange('analytics')}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs"
                        >
                            <span>Analytics</span>
                            <ChevronRight size={13} />
                        </button>
                    )}
                </div>
            </div>

            <VerificationQueueTabs
                activeTab={activeTab}
                establishments={establishments}
                products={products}
                reports={reports}
                onViewChange={onViewChange}
                openInspection={openInspection}
                autoVerifyingId={autoVerifyingId}
                processingId={processingId}
                handleAutoVerifyEstablishment={handleAutoVerifyEstablishment}
                handleAutoVerifyProduct={handleAutoVerifyProduct}
                handleVerifyProduct={handleVerifyProduct}
                handleResolveReport={handleResolveReport}
            />

            <VerificationInspectionModal
                inspectingItem={inspectingItem}
                inspectingType={inspectingType}
                closeInspection={closeInspection}
                processingId={processingId}
                handleVerifyProduct={handleVerifyProduct}
                handleVerifyEstablishment={handleVerifyEstablishment}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
                rotation={rotation}
                setRotation={setRotation}
                autoVerifyingId={autoVerifyingId}
                handleAutoVerifyProduct={handleAutoVerifyProduct}
                handleAutoVerifyEstablishment={handleAutoVerifyEstablishment}
                aiEvalResult={aiEvalResult}
                selectedHcbId={selectedHcbId}
                setSelectedHcbId={setSelectedHcbId}
                certifyingBodies={certifyingBodies}
                certNumber={certNumber}
                setCertNumber={setCertNumber}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                newMenuItemName={newMenuItemName}
                setNewMenuItemName={setNewMenuItemName}
                addingMenuItem={addingMenuItem}
                handleAddMenuItem={handleAddMenuItem}
                adminNotes={adminNotes}
                setAdminNotes={setAdminNotes}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ visible: false, message: '', type: 'info' })}
            />
        </div>
    );
}
