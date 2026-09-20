import React, { useEffect, useState } from 'react';
import { 
    ShieldCheck, 
    MapPin, 
    Plus, 
    Award
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Toast from '../components/ui/Toast';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import AdditivesRegistryTab from '../components/registry/AdditivesRegistryTab';
import HcbsRegistryTab from '../components/registry/HcbsRegistryTab';
import EstablishmentsRegistryTab from '../components/registry/EstablishmentsRegistryTab';
import RegistryModals, {
    ADDITIVE_STATUSES,
    ADDITIVE_ORIGINS,
    ESTABLISHMENT_STATUSES,
    HCB_CATEGORIES,
    HCB_STATUSES
} from '../components/registry/RegistryModals';
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

    const saveRegistryRecord = async (endpoint, method, payload) => {
        const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: payload ? JSON.stringify(payload) : undefined,
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(details || 'Failed to save registry record');
        }

        const json = await response.json();
        return json.data;
    };

    const deleteRegistryRecord = async (endpoint) => {
        const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(details || 'Failed to delete registry record');
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
                const created = await saveRegistryRecord('/api/v1/admin/additives', 'POST', {
                    code: requireText(modalForm.code, 'Code'),
                    name: requireText(modalForm.name, 'Name'),
                    status: modalForm.status || 'Doubtful',
                    origin: modalForm.origin || 'Plant',
                    source_description: modalForm.source || null,
                    reason: modalForm.reason || null,
                });

                setAdditives(prev => [created, ...prev]);
                updateToast('New chemical additive saved.', 'success');
            } else if (activeModal === 'edit-additive') {
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/additives/${selectedItem.id}`,
                    'PUT',
                    {
                        code: requireText(modalForm.code, 'Code'),
                        name: requireText(modalForm.name, 'Name'),
                        status: modalForm.status,
                        origin: modalForm.origin,
                        source_description: modalForm.source,
                        reason: modalForm.reason,
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive record updated.', 'success');
            } else if (activeModal === 'flag-additive') {
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/additives/${selectedItem.id}`,
                    'PATCH',
                    {
                        status: modalForm.status,
                        reason: modalForm.reason,
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive status review saved.', 'success');
            } else if (activeModal === 'add-hcb') {
                const created = await saveRegistryRecord('/api/v1/admin/hcb-registry', 'POST', {
                    name: requireText(modalForm.name, 'Organization name'),
                    code: modalForm.code || null,
                    acronym: modalForm.acronym || modalForm.code || null,
                    category: modalForm.category || 'Accredited HCB',
                    status: modalForm.status || 'Accredited',
                    country: modalForm.country || 'Philippines',
                    validity_period: modalForm.validity_period || null,
                    registry_reference: modalForm.registry_reference || null,
                    website: modalForm.website || null,
                    seal_url: modalForm.seal_url || null,
                    accreditation_details: modalForm.accreditation_details || null,
                });

                setHcbs(prev => [created, ...prev]);
                updateToast('New certifying body registered.', 'success');
            } else if (activeModal === 'edit-hcb') {
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/hcb-registry/${selectedItem.id}`,
                    'PUT',
                    {
                        name: requireText(modalForm.name, 'Organization name'),
                        code: modalForm.code || null,
                        acronym: modalForm.acronym || modalForm.code || null,
                        category: modalForm.category,
                        status: modalForm.status,
                        country: modalForm.country,
                        validity_period: modalForm.validity_period,
                        registry_reference: modalForm.registry_reference,
                        website: modalForm.website,
                        seal_url: modalForm.seal_url,
                        accreditation_details: modalForm.accreditation_details,
                    }
                );

                setHcbs(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Certifying body updated.', 'success');
            } else if (activeModal === 'add-establishment') {
                const created = await saveRegistryRecord('/registry/establishments', 'POST', {
                    name: requireText(modalForm.name, 'Establishment name'),
                    type: modalForm.type || null,
                    address: modalForm.address || null,
                    city: modalForm.city || 'Zamboanga City',
                    certificate_number: modalForm.certNo || null,
                    expiry_date: modalForm.expiry || null,
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
                        type: modalForm.type || null,
                        address: modalForm.address || null,
                        city: modalForm.city || 'Zamboanga City',
                        certificate_number: modalForm.certNo,
                        expiry_date: modalForm.expiry || null,
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
                        halal_status: modalForm.status,
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
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col h-full">
            <Topbar
                title="Municipal & National Compliance Directories"
                subtitle="Philippine accredited HCBs, raw chemical E-number ledgers, and Zamboanga City Ordinance No. 489 registry."
                onBack={() => onViewChange?.('back')}
            />

            {/* Navigation Tabs and Actions */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-wrap gap-2 sm:gap-3">
                    <button
                        onClick={() => setRegistryMode('additives')}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                            registryMode === 'additives'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <ShieldCheck size={18} /> Raw Chemical Additives Ledger
                        </span>
                    </button>
                    
                    <button
                        onClick={() => setRegistryMode('hcb')}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                            registryMode === 'hcb'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Award size={18} /> Accredited HCB & Regulatory Bodies
                        </span>
                    </button>

                    <button
                        onClick={() => setRegistryMode('establishments')}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                            registryMode === 'establishments'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <MapPin size={18} /> Zamboanga Clearance Registers
                        </span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {registryMode === 'establishments' && (
                        <button
                            type="button"
                            onClick={handleOpenContribution}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-[0.98]"
                        >
                            <Plus size={16} />
                            Submit Missing Establishment
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-700 transition shadow-sm"
                        >
                            <Plus size={16} />
                            {registryMode === 'additives' ? 'Add Additive' : registryMode === 'hcb' ? 'Register HCB / Agency' : 'Admin Quick Add'}
                        </button>
                    )}
                </div>
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
