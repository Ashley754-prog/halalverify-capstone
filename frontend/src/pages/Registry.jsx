import { useEffect, useState } from 'react';
import { 
    ShieldCheck, 
    MapPin, 
    Plus, 
    Award,
    Store
} from 'lucide-react';

import Toast from '../components/ui/Toast';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import AdditivesRegistryTab from '../components/registry/AdditivesRegistryTab';
import HcbsRegistryTab from '../components/registry/HcbsRegistryTab';
import EstablishmentsRegistryTab from '../components/registry/EstablishmentsRegistryTab';
import RegistryModals from '../components/registry/RegistryModals';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

const emptyAdditiveForm = {
    code: '',
    name: '',
    status: 'Doubtful',
    origin: 'Plant',
    source: '',
    reason: '',
};

const emptyEstablishmentForm = {
    name: '',
    type: '',
    address: '',
    city: 'Zamboanga City',
    status: 'needs_review',
    certNo: '',
    expiry: '',
};

const emptyHcbForm = {
    name: '',
    code: '',
    acronym: '',
    category: 'Accredited HCB',
    status: 'Accredited',
    country: 'Philippines',
    validity_period: '',
    registry_reference: '',
    website: '',
    seal_url: '',
    accreditation_details: '',
};

export const Registry = ({ userRole, onViewChange }) => {
    const [registryMode, setRegistryMode] = useState('additives');
    const [dictSearch, setDictSearch] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [hcbSearch, setHcbSearch] = useState('');
    
    // Filters
    const [additiveStatusFilter, setAdditiveStatusFilter] = useState('all');
    const [additiveOriginFilter, setAdditiveOriginFilter] = useState('all');
    const [hcbCategoryFilter, setHcbCategoryFilter] = useState('all');

    // Data lists
    const [additives, setAdditives] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [hcbs, setHcbs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalForm, setModalForm] = useState({});
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [showContributionModal, setShowContributionModal] = useState(false);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingTarget, setReportingTarget] = useState(null);

    const isAdmin = userRole === 'admin';

    const handleOpenContribution = () => {
        if (!userRole) {
            setShowAuthPrompt(true);
        } else {
            setShowContributionModal(true);
        }
    };

    const handleReportEstablishment = (shop) => {
        if (!userRole) {
            setShowAuthPrompt(true);
        } else {
            setReportingTarget({
                relatedTo: 'establishment',
                subjectName: shop.name,
                establishmentId: shop.id,
            });
            setShowReportModal(true);
        }
    };

    useEffect(() => {
        const fetchRegistryData = async () => {
            try {
                setLoading(true);
                setError('');

                // 1. Direct Supabase Query (Instant ~150ms, zero cold start)
                try {
                    const [sbAdd, sbEst, sbHcb] = await Promise.all([
                        supabase.from('additives').select('*').order('code'),
                        supabase.from('establishments').select('*').order('name'),
                        supabase.from('certifying_bodies').select('*').order('name'),
                    ]);

                    if (!sbAdd.error && !sbEst.error) {
                        setAdditives(sbAdd.data || []);
                        setEstablishments(sbEst.data || []);
                        setHcbs(sbHcb.data || []);
                        return;
                    }
                } catch (sbErr) {
                    console.warn('Direct Supabase registry fetch failed, attempting backend fallback:', sbErr);
                }

                // 2. Fallback to Backend API with a 2-second timeout
                try {
                    const [additivesResponse, establishmentsResponse, hcbsResponse] = await Promise.all([
                        authFetch(`${API_BASE_URL}/registry/additives`, { timeout: 2000 }),
                        authFetch(`${API_BASE_URL}/registry/establishments`, { timeout: 2000 }),
                        authFetch(`${API_BASE_URL}/api/v1/hcb-registry`, { timeout: 2000 }),
                    ]);

                    if (additivesResponse.ok && establishmentsResponse.ok) {
                        const additivesJson = await additivesResponse.json();
                        const establishmentsJson = await establishmentsResponse.json();
                        const hcbsJson = hcbsResponse.ok ? await hcbsResponse.json() : { data: [] };

                        setAdditives(additivesJson.data || []);
                        setEstablishments(establishmentsJson.data || []);
                        setHcbs(hcbsJson.data || []);
                        return;
                    }
                } catch (apiErr) {
                    console.warn('Backend registry endpoint unavailable or timed out:', apiErr);
                }

                throw new Error('Failed to load core registry data from both database and API');
            } catch (err) {
                console.error(err);
                setError('Could not load registry data. Please check if the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchRegistryData();
    }, []);

    const openModal = (modalType, item = null) => {
        setSelectedItem(item);
        setActiveModal(modalType);

        if (modalType === 'add-additive') {
            setModalForm(emptyAdditiveForm);
            return;
        }

        if (modalType === 'add-establishment') {
            setModalForm(emptyEstablishmentForm);
            return;
        }

        if (modalType === 'add-hcb') {
            setModalForm(emptyHcbForm);
            return;
        }

        if (modalType === 'flag-additive') {
            setModalForm({
                reason: item.flagReason || item.reason || '',
                status: item.status || 'Doubtful',
            });
        } else if (modalType === 'edit-additive') {
            setModalForm({
                code: item.code || '',
                name: item.name || '',
                status: item.status || 'Doubtful',
                origin: item.origin || 'Plant',
                source: item.source_description || item.source || '',
                reason: item.reason || '',
            });
        } else if (modalType === 'edit-hcb') {
            setModalForm({
                name: item.name || '',
                code: item.code || '',
                acronym: item.acronym || '',
                category: item.category || 'Accredited HCB',
                status: item.status || 'Accredited',
                country: item.country || 'Philippines',
                validity_period: item.validity_period || '',
                registry_reference: item.registry_reference || '',
                website: item.website || '',
                seal_url: item.seal_url || '',
                accreditation_details: item.accreditation_details || '',
            });
        } else if (modalType === 'flag-establishment') {
            setModalForm({
                reason: item.flagReason || '',
                status: item.halal_status || item.status || 'needs_review',
            });
        } else {
            setModalForm({
                name: item.name || '',
                type: item.type || '',
                address: item.address || '',
                city: item.city || 'Zamboanga City',
                certNo: item.certificate_number || item.certNo || '',
                expiry: item.expiry_date || item.expiry || '',
                status: item.halal_status || item.status || 'needs_review',
            });
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedItem(null);
        setModalForm({});
    };

    const updateToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const safeTrim = (v) => (typeof v === 'string' ? v.trim() : null) || null;

    const parseApiError = async (response, fallbackMsg) => {
        let errorMsg = fallbackMsg;
        try {
            const errJson = await response.json();
            if (errJson?.detail) {
                errorMsg = typeof errJson.detail === 'string'
                    ? errJson.detail
                    : JSON.stringify(errJson.detail);
            } else if (errJson?.message) {
                errorMsg = errJson.message;
            }
        } catch {
            try {
                const text = await response.text();
                if (text) errorMsg = text;
            } catch {
                void 0;
            }
        }

        if (response.status === 401) {
            errorMsg = 'Authentication required. Please sign in with an administrator account.';
        } else if (response.status === 403) {
            errorMsg = 'Admin privileges required. Your account does not have permission to modify registry records.';
        }

        return errorMsg;
    };

    const saveRegistryRecord = async (endpoint, method, payload) => {
        const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: payload ? JSON.stringify(payload) : undefined,
        });

        if (!response.ok) {
            const msg = await parseApiError(response, 'Failed to save registry record');
            throw new Error(msg);
        }

        const json = await response.json();
        return json.data;
    };

    const deleteRegistryRecord = async (endpoint) => {
        const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const msg = await parseApiError(response, 'Failed to delete registry record');
            throw new Error(msg);
        }
    };

    const handleDeleteAdditive = async (item) => {
        const label = item.code || item.name || 'this additive';
        const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await deleteRegistryRecord(`/api/v1/admin/additives/${item.id}`);
            setAdditives(prev => prev.filter(entry => entry.id !== item.id));
            updateToast('Additive deleted from chemical database.', 'success');
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not delete additive.', 'error');
        }
    };

    const handleDeleteHcb = async (item) => {
        const label = item.code || item.name || 'this organization';
        const confirmed = window.confirm(`Remove ${label} from registry? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await deleteRegistryRecord(`/api/v1/admin/hcb-registry/${item.id}`);
            setHcbs(prev => prev.filter(entry => entry.id !== item.id));
            updateToast('Certifying body removed from registry.', 'success');
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not remove certifying body.', 'error');
        }
    };

    const handleDeleteEstablishment = async (item) => {
        const label = item.name || 'this establishment';
        const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await deleteRegistryRecord(`/registry/establishments/${item.id}`);
            setEstablishments(prev => prev.filter(entry => entry.id !== item.id));
            updateToast('Establishment deleted from database.', 'success');
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not delete establishment.', 'error');
        }
    };

    const requireText = (value, label) => {
        if (!value || !value.trim()) {
            throw new Error(`${label} is required.`);
        }
        return value.trim();
    };

    const handleModalSubmit = async (event) => {
        event.preventDefault();

        try {
            if (activeModal === 'add-additive') {
                const addStatus = modalForm.status === 'Needs Review' ? 'Doubtful' : (modalForm.status || 'Doubtful');
                const created = await saveRegistryRecord('/api/v1/admin/additives', 'POST', {
                    code: requireText(modalForm.code, 'Code'),
                    name: requireText(modalForm.name, 'Name'),
                    status: addStatus,
                    origin: modalForm.origin || 'Plant',
                    source_description: safeTrim(modalForm.source),
                    reason: safeTrim(modalForm.reason),
                });

                setAdditives(prev => [created, ...prev]);
                updateToast('New chemical additive saved.', 'success');
            } else if (activeModal === 'edit-additive') {
                const addStatus = modalForm.status === 'Needs Review' ? 'Doubtful' : (modalForm.status || 'Doubtful');
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/additives/${selectedItem.id}`,
                    'PUT',
                    {
                        code: requireText(modalForm.code, 'Code'),
                        name: requireText(modalForm.name, 'Name'),
                        status: addStatus,
                        origin: modalForm.origin || 'Plant',
                        source_description: safeTrim(modalForm.source),
                        reason: safeTrim(modalForm.reason),
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive record updated.', 'success');
            } else if (activeModal === 'flag-additive') {
                const addStatus = modalForm.status === 'Needs Review' ? 'Doubtful' : (modalForm.status || 'Doubtful');
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/additives/${selectedItem.id}`,
                    'PATCH',
                    {
                        status: addStatus,
                        reason: safeTrim(modalForm.reason),
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive status review saved.', 'success');
            } else if (activeModal === 'add-hcb') {
                const created = await saveRegistryRecord('/api/v1/admin/hcb-registry', 'POST', {
                    name: requireText(modalForm.name, 'Organization name'),
                    code: safeTrim(modalForm.code),
                    acronym: safeTrim(modalForm.acronym) || safeTrim(modalForm.code),
                    category: modalForm.category || 'Accredited HCB',
                    status: modalForm.status || 'Accredited',
                    country: safeTrim(modalForm.country) || 'Philippines',
                    validity_period: safeTrim(modalForm.validity_period),
                    registry_reference: safeTrim(modalForm.registry_reference),
                    website: safeTrim(modalForm.website),
                    seal_url: safeTrim(modalForm.seal_url),
                    accreditation_details: safeTrim(modalForm.accreditation_details),
                });

                setHcbs(prev => [created, ...prev]);
                updateToast('New certifying body registered.', 'success');
            } else if (activeModal === 'edit-hcb') {
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/hcb-registry/${selectedItem.id}`,
                    'PUT',
                    {
                        name: requireText(modalForm.name, 'Organization name'),
                        code: safeTrim(modalForm.code),
                        acronym: safeTrim(modalForm.acronym) || safeTrim(modalForm.code),
                        category: modalForm.category,
                        status: modalForm.status,
                        country: safeTrim(modalForm.country),
                        validity_period: safeTrim(modalForm.validity_period),
                        registry_reference: safeTrim(modalForm.registry_reference),
                        website: safeTrim(modalForm.website),
                        seal_url: safeTrim(modalForm.seal_url),
                        accreditation_details: safeTrim(modalForm.accreditation_details),
                    }
                );

                setHcbs(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Certifying body updated.', 'success');
            } else if (activeModal === 'add-establishment') {
                const created = await saveRegistryRecord('/registry/establishments', 'POST', {
                    name: requireText(modalForm.name, 'Establishment name'),
                    type: safeTrim(modalForm.type),
                    address: safeTrim(modalForm.address) || 'Zamboanga City',
                    city: safeTrim(modalForm.city) || 'Zamboanga City',
                    certificate_number: safeTrim(modalForm.certNo),
                    expiry_date: safeTrim(modalForm.expiry),
                    halal_status: modalForm.status || 'needs_review',
                });

                setEstablishments(prev => [created, ...prev]);
                updateToast('New establishment saved to database.', 'success');
            } else if (activeModal === 'edit-establishment') {
                const updated = await saveRegistryRecord(
                    `/registry/establishments/${selectedItem.id}`,
                    'PATCH',
                    {
                        name: requireText(modalForm.name, 'Establishment name'),
                        type: safeTrim(modalForm.type),
                        address: safeTrim(modalForm.address),
                        city: safeTrim(modalForm.city) || 'Zamboanga City',
                        certificate_number: safeTrim(modalForm.certNo),
                        expiry_date: safeTrim(modalForm.expiry),
                        halal_status: modalForm.status,
                    }
                );

                setEstablishments(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Establishment record saved to database.', 'success');
            } else if (activeModal === 'flag-establishment') {
                const updated = await saveRegistryRecord(
                    `/registry/establishments/${selectedItem.id}`,
                    'PATCH',
                    {
                        halal_status: modalForm.status || 'needs_review',
                    }
                );

                setEstablishments(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Establishment review saved to database.', 'success');
            }

            closeModal();
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not save registry changes.', 'error');
        }
    };

    return (
        <div className="p-3 sm:p-6 md:p-8 space-y-3 sm:space-y-5 flex-1 flex flex-col h-full">
            {/* Module Title and Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 pb-1 border-b border-slate-200/80 shrink-0">
                <div>
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Store className="text-emerald-600" size={22} />
                        Local Halal Registry
                    </h2>
                    <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
                        Verified reference ledgers for food additives, certifying authorities, and Zamboanga establishments.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {registryMode === 'establishments' && (
                        <button
                            type="button"
                            onClick={handleOpenContribution}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-[0.98]"
                        >
                            <Plus size={14} />
                            <span>Submit <span className="hidden sm:inline">Establishment</span></span>
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => {
                                if (registryMode === 'additives') openModal('add-additive');
                                else if (registryMode === 'hcb') openModal('add-hcb');
                                else openModal('add-establishment');
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-sm"
                        >
                            <Plus size={14} />
                            <span>{registryMode === 'additives' ? 'Add Additive' : registryMode === 'hcb' ? 'Register HCB' : 'Quick Add'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Segmented Tab Navigation Control: Guaranteed Single Row on All Devices */}
            <div className="bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/90 grid grid-cols-3 gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => setRegistryMode('additives')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 truncate ${
                        registryMode === 'additives'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <ShieldCheck size={14} className={`shrink-0 ${registryMode === 'additives' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate"><span className="hidden sm:inline">Food </span>Additives</span>
                    <span className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded-full shrink-0 ${
                        registryMode === 'additives' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                        {additives.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setRegistryMode('hcb')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 truncate ${
                        registryMode === 'hcb'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Award size={14} className={`shrink-0 ${registryMode === 'hcb' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate"><span className="hidden sm:inline">Certifiers (</span>HCB<span className="hidden sm:inline">)</span></span>
                    <span className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded-full shrink-0 ${
                        registryMode === 'hcb' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                        {hcbs.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setRegistryMode('establishments')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 truncate ${
                        registryMode === 'establishments'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <MapPin size={14} className={`shrink-0 ${registryMode === 'establishments' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate"><span className="hidden sm:inline">Venues & </span>Directory</span>
                    <span className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded-full shrink-0 ${
                        registryMode === 'establishments' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                        {establishments.length}
                    </span>
                </button>
            </div>



            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Loading directory records from Supabase...
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            {/* TAB 1: ADDITIVES LEDGER */}
            {registryMode === 'additives' && (
                <AdditivesRegistryTab
                    additives={additives}
                    dictSearch={dictSearch}
                    setDictSearch={setDictSearch}
                    additiveStatusFilter={additiveStatusFilter}
                    setAdditiveStatusFilter={setAdditiveStatusFilter}
                    additiveOriginFilter={additiveOriginFilter}
                    setAdditiveOriginFilter={setAdditiveOriginFilter}
                    isAdmin={isAdmin}
                    onOpenModal={openModal}
                    onDeleteAdditive={handleDeleteAdditive}
                />
            )}

            {/* TAB 2: ACCREDITED HCB & REGULATORY BODIES */}
            {registryMode === 'hcb' && (
                <HcbsRegistryTab
                    hcbs={hcbs}
                    hcbSearch={hcbSearch}
                    setHcbSearch={setHcbSearch}
                    hcbCategoryFilter={hcbCategoryFilter}
                    setHcbCategoryFilter={setHcbCategoryFilter}
                    isAdmin={isAdmin}
                    onOpenModal={openModal}
                    onDeleteHcb={handleDeleteHcb}
                />
            )}

            {/* TAB 3: ESTABLISHMENTS LEDGER */}
            {registryMode === 'establishments' && (
                <EstablishmentsRegistryTab
                    establishments={establishments}
                    localSearch={localSearch}
                    setLocalSearch={setLocalSearch}
                    isAdmin={isAdmin}
                    onOpenModal={openModal}
                    onDeleteEstablishment={handleDeleteEstablishment}
                    onReportEstablishment={handleReportEstablishment}
                />
            )}

            {/* UNIFIED RECORD MODAL */}
            <RegistryModals
                activeModal={activeModal}
                modalForm={modalForm}
                setModalForm={setModalForm}
                onClose={closeModal}
                onSubmit={handleModalSubmit}
            />

            {/* Community Contribution Modal */}
            <ContributionModal
                isOpen={showContributionModal}
                onClose={() => setShowContributionModal(false)}
                initialTab="establishment"
                onSubmitted={() => {
                    updateToast('Thank you! Establishment submitted for verification.', 'success');
                }}
            />

            {/* Guest Authentication Prompt Modal */}
            <AuthPromptModal
                isOpen={showAuthPrompt}
                onClose={() => setShowAuthPrompt(false)}
                onNavigate={(v) => onViewChange?.(v)}
                actionTitle="Submit Establishment"
            />

            {/* Context-Aware Report / Flag Modal */}
            <ReportIssueModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                initialData={reportingTarget || {}}
                onSubmitted={() => {
                    updateToast('Report submitted for administrative review.', 'success');
                }}
            />

            <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ visible: false, message: '', type: 'info' })} />
        </div>
    );
};

export default Registry;
