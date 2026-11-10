import { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    Store,
    Package,
    Flag,
    RefreshCw,
    ChevronRight,
    BarChart2,
} from 'lucide-react';
import Toast from '../components/ui/Toast';
import ConfirmActionModal from '../components/ui/ConfirmActionModal';
import VerificationQueueTabs from '../components/verification/VerificationQueueTabs';
import VerificationInspectionModal from '../components/verification/VerificationInspectionModal';
import ReportAdjudicationModal from '../components/verification/ReportAdjudicationModal';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import { isMachineNote, extractMenuHighlights, deriveEstablishmentTier } from '../utils/verificationNotes';

export default function VerificationQueue({ onViewChange, initialTab = 'establishments' }) {
    const [activeTab, setActiveTab] = useState(
        ['establishments', 'products', 'reports'].includes(initialTab) ? initialTab : 'establishments'
    ); // 'establishments' | 'products' | 'reports'

    useEffect(() => {
        if (['establishments', 'products', 'reports'].includes(initialTab)) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const [processingId, setProcessingId] = useState(null);
    const [autoVerifyingId, setAutoVerifyingId] = useState(null);
    const [autoVerifyingAll, setAutoVerifyingAll] = useState(false);
    const [aiEvalResult, setAiEvalResult] = useState(null);
    const [newMenuItemName, setNewMenuItemName] = useState('');
    const [addingMenuItem, setAddingMenuItem] = useState(false);

    // Confirmation Modals
    const [confirmBatchModalOpen, setConfirmBatchModalOpen] = useState(false);
    const [rejectTargetProduct, setRejectTargetProduct] = useState(null);
    const [adjudicatingReport, setAdjudicatingReport] = useState(null);

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
        const [estRes, prodRes, repRes] = await Promise.all([
            supabase
                .from('establishments')
                .select('*, certifying_bodies(*)')
                .or('halal_status.ilike.%pending%,halal_status.ilike.%needs_review%,halal_status.ilike.%review%')
                .order('created_at', { ascending: false }),
            supabase
                .from('products')
                .select('*, establishments(id, name, city, halal_status)')
                .ilike('status', '%pending%')
                .order('created_at', { ascending: false }),
            supabase
                .from('issue_reports')
                .select('*, products(id, name), establishments(id, name, city)')
                .or('status.eq.open,status.eq.reviewing')
                .order('created_at', { ascending: false }),
        ]);

        if (estRes.error && prodRes.error && repRes.error) {
            throw new Error('Supabase direct query failed across all tables');
        }

        if (!estRes.error) {
            const enriched = (estRes.data || []).map((e) => {
                const dishes = extractMenuHighlights(e);
                return {
                    ...e,
                    menu_highlights: dishes,
                    associated_products: dishes.map((name, idx) => ({
                        id: `dish-${idx}`,
                        name,
                        category: 'Food Item',
                        status: 'PENDING_VERIFICATION',
                    })),
                };
            });
            setEstablishments(enriched);
        }
        if (!prodRes.error) setProducts(prodRes.data || []);
        if (!repRes.error) setReports(repRes.data || []);
    }, []);

    const fetchQueueData = useCallback(async ({ background = false } = {}) => {
        try {
            if (background) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
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
            try {
                await fetchSupabaseDirect();
            } catch (sbErr) {
                console.error('Direct Supabase fetch failed:', sbErr);
                setError('Failed to fetch verification queue data. Please try again.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
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
        const rawNotes = (item.admin_notes || '').trim();
        setAdminNotes(isMachineNote(rawNotes) ? '' : rawNotes);

        setCertNumber(item.certificate_number || item.certificate_no || '');
        setExpiryDate(item.expiry_date || '');
        setSelectedHcbId(item.certifying_body_id || '');
        setNewMenuItemName('');

        if (type === 'establishment') {
            const derivedTier = deriveEstablishmentTier(item);
            const hasCertificationEvidence = Boolean(
                item.certificate_number || item.certifying_body_id || item.certificate_url
            );
            if (derivedTier === 'halal_certified' && !hasCertificationEvidence) {
                // Never preselect the strongest claim when no certificate evidence exists.
                setSelectedStatus('');
            } else if (derivedTier === 'halal_certified') {
                setSelectedStatus('verified');
            } else if (['muslim_owned', 'muslim_friendly'].includes(derivedTier)) {
                setSelectedStatus(derivedTier);
            } else if (derivedTier === 'pork_free_declared') {
                setSelectedStatus('muslim_friendly');
            } else {
                setSelectedStatus('');
            }
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
                .then(({ data, error: pErr }) => {
                    if (!pErr && data) {
                        setInspectingItem((prev) =>
                            prev && prev.id === item.id ? { ...prev, associated_products: data } : prev
                        );
                    }
                })
                .catch(console.warn);
        }
    };

    const handleAddMenuItem = async () => {
        if (!newMenuItemName.trim() || !inspectingItem?.id) return;
        const dishName = newMenuItemName.trim();
        try {
            setAddingMenuItem(true);
            const currentHighlights = extractMenuHighlights(inspectingItem);
            const updatedHighlights = Array.from(new Set([...currentHighlights, dishName]));

            // Build updated description preserving existing tags
            let curDesc = inspectingItem.description || '';
            const dishesStr = `Dishes: ${updatedHighlights.join(', ')}`;
            if (/(?:Dishes|Specialties|Menu):\s*[^|\n\]]+/i.test(curDesc)) {
                curDesc = curDesc.replace(/(?:Dishes|Specialties|Menu):\s*[^|\n\]]+/i, dishesStr);
            } else {
                curDesc = curDesc ? `${curDesc} | ${dishesStr}` : dishesStr;
            }

            // Persist through the backend so the browser never writes workflow tables directly.
            const estRes = await authFetch(`${API_BASE_URL}/api/v1/registry/establishments/${inspectingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_highlights: updatedHighlights, description: curDesc }),
            });
            if (!estRes.ok) {
                const errData = await estRes.json().catch(() => ({}));
                throw new Error(errData.detail || 'Could not save menu highlights.');
            }

            const createdItem = {
                id: `dish-${Date.now()}`,
                name: dishName,
                category: 'Food Item',
                status: 'VERIFIED',
            };

            setInspectingItem((prev) => ({
                ...prev,
                description: curDesc,
                menu_highlights: updatedHighlights,
                associated_products: [...(prev.associated_products || []), createdItem],
            }));
            setEstablishments((prev) =>
                prev.map((est) =>
                    est.id === inspectingItem.id
                        ? {
                              ...est,
                              description: curDesc,
                              menu_highlights: updatedHighlights,
                              associated_products: [...(est.associated_products || []), createdItem],
                          }
                        : est
                )
            );
            setNewMenuItemName('');
            setToast({
                visible: true,
                message: `Added "${dishName}" to menu highlights.`,
                type: 'success',
            });
            window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (err) {
            console.error('Failed to add menu item:', err);
            setToast({ visible: true, message: err.message || 'Could not save menu item.', type: 'error' });
        } finally {
            setAddingMenuItem(false);
        }
    };

    const handleDeleteMenuItem = async (productToRemove) => {
        if (!productToRemove || !inspectingItem?.id) return;
        const prodId = productToRemove.id;
        const prodName = productToRemove.name || productToRemove;

        const currentHighlights = extractMenuHighlights(inspectingItem);
        const updatedHighlights = currentHighlights.filter((d) => d !== prodName);

        let curDesc = inspectingItem.description || '';
        if (/(?:Dishes|Specialties|Menu):\s*[^|\n\]]+/i.test(curDesc)) {
            curDesc = curDesc.replace(
                /(?:Dishes|Specialties|Menu):\s*[^|\n\]]+/i,
                updatedHighlights.length > 0 ? `Dishes: ${updatedHighlights.join(', ')}` : ''
            ).trim();
            curDesc = curDesc.replace(/\s*\|\s*\|\s*/g, ' | ').replace(/^\s*\|\s*|\s*\|\s*$/g, '').trim();
        }

        setInspectingItem((prev) => ({
            ...prev,
            description: curDesc,
            menu_highlights: updatedHighlights,
            associated_products: (prev.associated_products || []).filter((p) =>
                prodId ? p.id !== prodId : p.name !== prodName
            ),
        }));
        setEstablishments((prev) =>
            prev.map((est) =>
                est.id === inspectingItem.id
                    ? {
                          ...est,
                          description: curDesc,
                          menu_highlights: updatedHighlights,
                          associated_products: (est.associated_products || []).filter((p) =>
                              prodId ? p.id !== prodId : p.name !== prodName
                          ),
                      }
                    : est
            )
        );

        try {
            const estRes = await authFetch(`${API_BASE_URL}/api/v1/registry/establishments/${inspectingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_highlights: updatedHighlights, description: curDesc }),
            });
            if (!estRes.ok) {
                const errData = await estRes.json().catch(() => ({}));
                throw new Error(errData.detail || 'Could not remove menu highlight.');
            }

            // Clean up legacy product row if one existed
            if (prodId && !String(prodId).startsWith('local-') && !String(prodId).startsWith('dish-')) {
                const prodRes = await authFetch(`${API_BASE_URL}/api/v1/products/${prodId}`, { method: 'DELETE' });
                if (!prodRes.ok) {
                    const errData = await prodRes.json().catch(() => ({}));
                    throw new Error(errData.detail || 'Could not remove linked product.');
                }
            }
            window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (err) {
            console.error('Delete dish failed:', err);
            setToast({ visible: true, message: err.message || 'Could not remove menu highlight.', type: 'error' });
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
            const res = await authFetch(
                `${API_BASE_URL}/api/v1/admin/establishments/${estId}/auto-verify?auto_approve=${autoApprove}`,
                { method: 'POST' }
            );
            if (res.ok) {
                const data = await res.json();
                const evalData = data.evaluation || {};

                if (inspectingItem && inspectingItem.id === estId) {
                    setAiEvalResult(evalData);
                    if (evalData.certificate_number) setCertNumber(evalData.certificate_number);
                    if (evalData.expiry_date) setExpiryDate(evalData.expiry_date);
                    if (evalData.certifying_body_id) setSelectedHcbId(evalData.certifying_body_id);
                    if (evalData.admin_notes && !isMachineNote(evalData.admin_notes)) {
                        setAdminNotes(evalData.admin_notes);
                    }
                }

                if (data.is_auto_approved && autoApprove) {
                    setToast({
                        visible: true,
                        message: `AI verified with ${data.score}% confidence. Published to directory.`,
                        type: 'success',
                    });
                    if (inspectingItem && inspectingItem.id === estId) {
                        closeInspection();
                    }
                    window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
                    fetchQueueData({ background: true });
                } else {
                    const firstReason = evalData.audit_trail?.reasons?.[0];
                    setToast({
                        visible: true,
                        message: `AI screened (${data.score}% confidence). ${firstReason || 'Form auto-filled for review.'}`,
                        type: 'info',
                    });
                    fetchQueueData({ background: true });
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
            const res = await authFetch(
                `${API_BASE_URL}/api/v1/admin/products/${prodId}/auto-verify?auto_approve=${autoApprove}`,
                { method: 'POST' }
            );
            if (res.ok) {
                const data = await res.json();
                const evalData = data.evaluation || data || {};
                if (!autoApprove || inspectingItem?.id === prodId) {
                    setAiEvalResult(evalData);
                    if (evalData.certificate_no) setCertNumber(evalData.certificate_no);
                    if (evalData.expiry_date) setExpiryDate(evalData.expiry_date);
                    if (evalData.certifying_body_id) setSelectedHcbId(evalData.certifying_body_id);
                    if (evalData.admin_notes && !isMachineNote(evalData.admin_notes)) {
                        setAdminNotes(evalData.admin_notes);
                    }
                }
                if (data.is_auto_approved && autoApprove) {
                    setToast({
                        visible: true,
                        message: `AI verified with ${data.score}% confidence. Published to product catalog.`,
                        type: 'success',
                    });
                    window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
                    fetchQueueData({ background: true });
                } else {
                    setToast({
                        visible: true,
                        message: `AI screened (${data.score}% confidence). Manual review recommended.`,
                        type: 'info',
                    });
                    fetchQueueData({ background: true });
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

    const executeAutoVerifyAll = async () => {
        try {
            setAutoVerifyingAll(true);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/auto-verify-all?auto_approve=true`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                setToast({
                    visible: true,
                    message: data.message || 'Batch automated verification complete.',
                    type: 'success',
                });
                window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
                fetchQueueData({ background: true });
            } else {
                setToast({ visible: true, message: 'Batch auto-verification failed.', type: 'error' });
            }
        } catch (err) {
            console.error('Batch auto-verify error:', err);
            setToast({ visible: true, message: 'Batch auto-verification encountered an error.', type: 'error' });
        } finally {
            setAutoVerifyingAll(false);
            setConfirmBatchModalOpen(false);
        }
    };

    const handleVerifyEstablishment = async (status) => {
        if (!inspectingItem) return;
        if (!status) {
            setToast({ visible: true, message: 'Select a verification tier before approving.', type: 'error' });
            return;
        }
        const estId = inspectingItem.id;

        try {
            setProcessingId(estId);
            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/establishments/${estId}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: status,
                    admin_notes: adminNotes?.trim() ? adminNotes : undefined,
                    certificate_number: certNumber || undefined,
                    expiry_date: expiryDate || undefined,
                    certifying_body_id: selectedHcbId || undefined,
                    name: inspectingItem.name || undefined,
                    address: inspectingItem.address || undefined,
                    type: inspectingItem.type || undefined,
                    phone: inspectingItem.phone || inspectingItem.contact_number || undefined,
                    source_url: inspectingItem.source_url || inspectingItem.social_media_url || undefined,
                    amenities: inspectingItem.amenities || undefined,
                    menu_highlights: newMenuItemName && newMenuItemName.trim()
                        ? Array.from(new Set([...extractMenuHighlights(inspectingItem), newMenuItemName.trim()]))
                        : undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to update establishment verification status.');
            }

            const estName = inspectingItem?.name ? `"${inspectingItem.name}"` : 'Establishment';
            let estStatusText = status.toLowerCase();
            if (estStatusText === 'verified') {
                estStatusText = 'verified and published to directory';
            } else if (estStatusText === 'rejected') {
                estStatusText = 'declined';
            } else if (estStatusText === 'muslim_owned') {
                estStatusText = 'marked as Muslim-owned';
            } else if (estStatusText === 'muslim_friendly') {
                estStatusText = 'marked as Muslim-friendly';
            } else {
                estStatusText = `marked as ${estStatusText.replace(/_/g, ' ')}`;
            }

            setToast({
                visible: true,
                message: `${estName} ${estStatusText}.`,
                type: status.toUpperCase() === 'VERIFIED' ? 'success' : 'info',
            });

            closeInspection();
            window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
            fetchQueueData({ background: true });
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

    const handleVerifyProduct = async (product, status, notesOverride) => {
        try {
            setProcessingId(product.id);
            const isModalTarget = inspectingItem && inspectingItem.id === product.id;
            const finalNotes = notesOverride !== undefined ? notesOverride : (isModalTarget ? adminNotes : undefined);

            const payload = {
                status: status,
                admin_notes: finalNotes || undefined,
                name: product.name || undefined,
                brand: product.brand || undefined,
            };

            if (isModalTarget) {
                if (certNumber) payload.certificate_no = certNumber;
                if (expiryDate) payload.expiry_date = expiryDate;
                if (selectedHcbId) payload.certifying_body_id = selectedHcbId;
            }

            const res = await authFetch(`${API_BASE_URL}/api/v1/admin/products/${product.id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Could not update product status.');
            }

            const prodName = product?.name ? `"${product.name}"` : 'Product';
            let prodStatusText = status.toLowerCase();
            if (prodStatusText === 'verified') {
                prodStatusText = 'verified and published to catalog';
            } else if (prodStatusText === 'rejected') {
                prodStatusText = 'declined';
            } else {
                prodStatusText = `marked as ${prodStatusText.replace(/_/g, ' ')}`;
            }

            setToast({
                visible: true,
                message: `${prodName} ${prodStatusText}.`,
                type: status.toUpperCase() === 'VERIFIED' ? 'success' : 'info',
            });
            if (inspectingItem && inspectingItem.id === product.id) {
                closeInspection();
            }
            window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
            fetchQueueData({ background: true });
        } catch (err) {
            console.error('Failed to verify product:', err);
            setToast({ visible: true, message: 'Could not update product status.', type: 'error' });
        } finally {
            setProcessingId(null);
            setRejectTargetProduct(null);
        }
    };

    const handleResolveReport = async (report, resolutionStatus, suspendEstablishment = false, notesOverride = '') => {
        try {
            setProcessingId(report.id);
            let finalNotes = (notesOverride || adminNotes || 'Resolved by administrator.').trim();
            if (resolutionStatus === 'dismissed' && !finalNotes.toLowerCase().startsWith('dismissed')) {
                finalNotes = `Dismissed: ${finalNotes}`;
            }

            let success = false;
            try {
                const res = await authFetch(`${API_BASE_URL}/api/v1/admin/reports/${report.id}/resolve`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: resolutionStatus,
                        resolution_notes: finalNotes,
                        suspend_establishment: suspendEstablishment,
                    }),
                });
                if (res.ok) {
                    success = true;
                }
            } catch (apiErr) {
                console.warn('Backend resolve failed, falling back to direct Supabase:', apiErr);
            }

            if (!success) {
                const dbStatus = resolutionStatus === 'dismissed' ? 'resolved' : resolutionStatus;
                const { data: { session } } = await supabase.auth.getSession();
                const adminId = session?.user?.id;

                const { error: sbErr } = await supabase
                    .from('issue_reports')
                    .update({
                        status: dbStatus,
                        resolution_notes: finalNotes,
                        resolved_at: new Date().toISOString(),
                        resolved_by: adminId || null,
                    })
                    .eq('id', report.id);

                if (sbErr) throw sbErr;
            }

            const repLabel = report?.id ? `Report #${String(report.id).slice(0, 8)}` : 'Report';
            const actionLabel = resolutionStatus.toLowerCase() === 'resolved' ? 'resolved' : `marked as ${resolutionStatus.toLowerCase()}`;
            setToast({
                visible: true,
                message: `${repLabel} ${actionLabel}.${suspendEstablishment ? ' Establishment suspended.' : ''}`,
                type: 'success',
            });
            setAdjudicatingReport(null);
            closeInspection();
            window.dispatchEvent(new CustomEvent('verification-queue-changed'));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
            fetchQueueData({ background: true });
        } catch (err) {
            console.error('Failed to resolve report:', err);
            setToast({ visible: true, message: 'Could not resolve report.', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 flex-1 flex flex-col bg-slate-50 min-h-full">
            {/* Navigation Tabs Bar */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 shrink-0">
                {/* Row 1 on mobile: Module Title & Action Buttons */}
                <div className="flex md:hidden items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-1.5 font-black text-slate-800 text-xs tracking-tight">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span>Audit Queue</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setConfirmBatchModalOpen(true)}
                            disabled={autoVerifyingAll || (establishments.length === 0 && products.length === 0)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                            title="Automatically validate pending submissions against the HCB registry"
                            aria-label="Auto-verify all pending submissions"
                        >
                            <ShieldCheck size={13} className={autoVerifyingAll ? 'animate-spin' : ''} />
                            <span>{autoVerifyingAll ? 'Checking...' : 'Auto-Verify'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fetchQueueData()}
                            disabled={loading || refreshing}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition flex items-center justify-center text-xs focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                            title="Refresh Queue"
                            aria-label="Refresh Queue"
                        >
                            <RefreshCw size={13} className={loading || refreshing ? 'animate-spin text-emerald-600' : ''} />
                        </button>

                        {onViewChange && (
                            <button
                                type="button"
                                onClick={() => onViewChange('analytics')}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition flex items-center justify-center text-xs focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                                title="Open Analytics Dashboard"
                                aria-label="Open Analytics Dashboard"
                            >
                                <BarChart2 size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Row */}
                <div
                    role="tablist"
                    aria-label="Verification Queue Categories"
                    className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-nowrap"
                >
                    <div className="hidden sm:flex items-center gap-1.5 pr-2.5 mr-0.5 border-r border-slate-200 shrink-0">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span className="font-black text-slate-800 text-sm tracking-tight">Audit Queue</span>
                    </div>

                    <button
                        type="button"
                        role="tab"
                        id="tab-establishments"
                        aria-selected={activeTab === 'establishments'}
                        aria-controls="panel-establishments"
                        onClick={() => setActiveTab('establishments')}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none ${
                            activeTab === 'establishments'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/80'
                        }`}
                    >
                        <Store size={14} />
                        <span>Establishments</span>
                        <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeTab === 'establishments' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                            {loading && establishments.length === 0 ? '...' : establishments.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        role="tab"
                        id="tab-products"
                        aria-selected={activeTab === 'products'}
                        aria-controls="panel-products"
                        onClick={() => setActiveTab('products')}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none ${
                            activeTab === 'products'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/80'
                        }`}
                    >
                        <Package size={14} />
                        <span><span className="hidden sm:inline">Community </span>Products</span>
                        <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeTab === 'products' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                            {loading && products.length === 0 ? '...' : products.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        role="tab"
                        id="tab-reports"
                        aria-selected={activeTab === 'reports'}
                        aria-controls="panel-reports"
                        onClick={() => setActiveTab('reports')}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none ${
                            activeTab === 'reports'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/80'
                        }`}
                    >
                        <Flag size={14} />
                        <span><span className="hidden sm:inline">User Flags & </span>Reports</span>
                        <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeTab === 'reports' ? 'bg-white text-amber-800' : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                            {loading && reports.length === 0 ? '...' : reports.length}
                        </span>
                    </button>
                </div>

                {/* Actions on desktop */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setConfirmBatchModalOpen(true)}
                        disabled={autoVerifyingAll || (establishments.length === 0 && products.length === 0)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white transition flex items-center gap-1.5 text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none cursor-pointer"
                        title="Runs AI checks on all pending establishments and products"
                        aria-label="Auto-verify all pending submissions"
                    >
                        <ShieldCheck size={14} className={autoVerifyingAll ? 'animate-spin' : ''} />
                        <span>{autoVerifyingAll ? 'Checking All...' : 'Auto-Verify All'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => fetchQueueData()}
                        disabled={loading || refreshing}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none cursor-pointer"
                        title="Refresh Queue"
                        aria-label="Refresh Queue"
                    >
                        <RefreshCw size={14} className={loading || refreshing ? 'animate-spin text-emerald-600' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    {onViewChange && (
                        <button
                            type="button"
                            onClick={() => onViewChange('analytics')}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none cursor-pointer"
                        >
                            <span>Analytics</span>
                            <ChevronRight size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Panels */}
            <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="flex-1 flex flex-col"
            >
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
                    onInspectReport={(rep) => setAdjudicatingReport(rep)}
                    loading={loading}
                    refreshing={refreshing}
                    error={error}
                    onRetry={() => fetchQueueData()}
                    onRequestRejectProduct={(prod) => setRejectTargetProduct(prod)}
                />
            </div>

            {/* Shared Inspection & Full Evidence Modal */}
            <VerificationInspectionModal
                key={inspectingItem?.id || 'none'}
                inspectingItem={inspectingItem}
                setInspectingItem={setInspectingItem}
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
                handleDeleteMenuItem={handleDeleteMenuItem}
                adminNotes={adminNotes}
                setAdminNotes={setAdminNotes}
            />

            {/* Adjudicate Report Modal with Evidence & Investigation Notes */}
            <ReportAdjudicationModal
                isOpen={!!adjudicatingReport}
                onClose={() => setAdjudicatingReport(null)}
                report={adjudicatingReport}
                onResolve={handleResolveReport}
                processingId={processingId}
            />

            {/* Rejection Confirmation Modal with Optional Rationale */}
            <ConfirmActionModal
                isOpen={!!rejectTargetProduct}
                onClose={() => setRejectTargetProduct(null)}
                title="Reject Product Submission"
                description="Are you sure you want to decline this product submission? It will not be indexed or published to the public directory."
                itemName={rejectTargetProduct?.name}
                itemSubtitle={
                    rejectTargetProduct?.brand
                        ? `Brand: ${rejectTargetProduct.brand} • Category: ${rejectTargetProduct.category || 'Food & Beverage'}`
                        : `Category: ${rejectTargetProduct?.category || 'Food & Beverage'}`
                }
                confirmText="Reject Product"
                confirmVariant="danger"
                isProcessing={processingId === rejectTargetProduct?.id}
                showReasonInput={true}
                reasonLabel="Rejection Rationale (Saved to Audit Notes)"
                reasonPlaceholder="Optional reason (e.g. Unverified additives, blurry packaging photo, duplicate entry)..."
                onConfirm={(reason) => {
                    if (rejectTargetProduct) {
                        handleVerifyProduct(rejectTargetProduct, 'REJECTED', reason || 'Declined during administrative audit.');
                    }
                }}
            />

            {/* Bulk AI Auto-Verify All Confirmation Dialog */}
            <ConfirmActionModal
                isOpen={confirmBatchModalOpen}
                onClose={() => setConfirmBatchModalOpen(false)}
                title="Run Batch AI Auto-Verification"
                description={`Execute automated AI verification across all ${establishments.length} pending establishments and ${products.length} pending products? Submissions meeting strict certification invariants will be auto-published live.`}
                confirmText="Execute Auto-Verify All"
                confirmVariant="primary"
                isProcessing={autoVerifyingAll}
                onConfirm={() => executeAutoVerifyAll()}
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
