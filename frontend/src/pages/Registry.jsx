import React, { useEffect, useState } from 'react';
import { 
    Search, 
    ShieldCheck, 
    MapPin, 
    Database, 
    Pencil, 
    AlertOctagon, 
    Save, 
    Plus, 
    Trash2, 
    Flag, 
    Award, 
    ExternalLink, 
    Globe, 
    Calendar, 
    FileText, 
    Building2,
    CheckCircle2,
    Filter
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import { API_BASE_URL, authFetch } from '../utils/api';

const ADDITIVE_STATUSES = ['Halal', 'Haram', 'Doubtful', 'Needs Review'];
const ADDITIVE_ORIGINS = ['Plant', 'Animal', 'Insect', 'Synthetic / Mineral', 'Multiple / Unknown'];
const ESTABLISHMENT_STATUSES = ['verified', 'needs_review'];
const HCB_CATEGORIES = ['Accredited HCB', 'Government Oversight', 'International Authority'];
const HCB_STATUSES = ['Accredited', 'Active Oversight', 'International Recognized', 'active', 'inactive', 'suspended'];

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

                const [additivesResponse, establishmentsResponse, hcbsResponse] = await Promise.all([
                    authFetch(`${API_BASE_URL}/registry/additives`),
                    authFetch(`${API_BASE_URL}/registry/establishments`),
                    authFetch(`${API_BASE_URL}/api/v1/hcb-registry`),
                ]);

                if (!additivesResponse.ok || !establishmentsResponse.ok) {
                    throw new Error('Failed to load core registry data');
                }

                const additivesJson = await additivesResponse.json();
                const establishmentsJson = await establishmentsResponse.json();
                const hcbsJson = hcbsResponse.ok ? await hcbsResponse.json() : { data: [] };

                setAdditives(additivesJson.data || []);
                setEstablishments(establishmentsJson.data || []);
                setHcbs(hcbsJson.data || []);
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

    // Filtered lists
    const filteredAdditives = additives.filter(item => {
        const matchesSearch = (item.code || '').toLowerCase().includes(dictSearch.toLowerCase()) ||
            (item.name || '').toLowerCase().includes(dictSearch.toLowerCase()) ||
            (item.source_description || '').toLowerCase().includes(dictSearch.toLowerCase());
        
        const matchesStatus = additiveStatusFilter === 'all' || item.status === additiveStatusFilter;
        const matchesOrigin = additiveOriginFilter === 'all' || 
            (item.origin && item.origin.toLowerCase().includes(additiveOriginFilter.toLowerCase()));

        return matchesSearch && matchesStatus && matchesOrigin;
    });

    const filteredEstablishments = establishments.filter(shop =>
        (shop.name || '').toLowerCase().includes(localSearch.toLowerCase()) ||
        (shop.address || '').toLowerCase().includes(localSearch.toLowerCase())
    );

    const filteredHcbs = hcbs.filter(body => {
        const matchesSearch = (body.name || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.code || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.acronym || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.registry_reference || '').toLowerCase().includes(hcbSearch.toLowerCase());
        
        const matchesCategory = hcbCategoryFilter === 'all' || body.category === hcbCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col h-full">
            <Topbar
                title="Municipal & National Compliance Directories"
                subtitle="Philippine accredited HCBs, raw chemical E-number ledgers, and Zamboanga City Ordinance No. 489 registry."
            />

            {/* Navigation Tabs and Actions */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                        onClick={() => setRegistryMode('additives')}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
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
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
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
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
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
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4 sm:mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                                <Database className="text-emerald-600 shrink-0" size={20} /> Chemical Reference Database
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                E-numbers, scientific classifications, and scholar compliance statuses.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {/* Status Filter */}
                            <select
                                value={additiveStatusFilter}
                                onChange={(e) => setAdditiveStatusFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Halal">Halal Only</option>
                                <option value="Doubtful">Doubtful Only</option>
                                <option value="Haram">Haram Only</option>
                            </select>

                            {/* Origin Filter */}
                            <select
                                value={additiveOriginFilter}
                                onChange={(e) => setAdditiveOriginFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                            >
                                <option value="all">All Origins</option>
                                <option value="Plant">Plant Origin</option>
                                <option value="Animal">Animal Origin</option>
                                <option value="Insect">Insect Origin</option>
                                <option value="Synthetic">Synthetic / Mineral</option>
                            </select>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search additives or code..."
                                    value={dictSearch}
                                    onChange={(e) => setDictSearch(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1 sm:pr-2 pb-4">
                        {filteredAdditives.map((item) => (
                            <div key={item.id || item.code} className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full gap-3 sm:gap-4 hover:border-slate-300 transition shadow-sm">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300">
                                        {item.code}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {item.origin && (
                                            <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">
                                                {item.origin}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                            item.status === 'Haram'
                                                ? 'bg-red-50 text-red-600 border border-red-200'
                                                : item.status === 'Halal'
                                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{item.name}</h4>
                                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-3">
                                        Source: <span className="italic">{item.source_description || 'Unspecified origin.'}</span>
                                    </p>
                                    {item.reason && (
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                                            Ruling: <span className="italic">{item.reason}</span>
                                        </p>
                                    )}
                                </div>

                                {isAdmin && (
                                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                                        <button onClick={() => openModal('flag-additive', item)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-lg transition-colors">
                                            <AlertOctagon size={13} /> Flag
                                        </button>
                                        <button onClick={() => openModal('edit-additive', item)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-1.5 rounded-lg transition-colors">
                                            <Pencil size={13} /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteAdditive(item)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors">
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: ACCREDITED HCB & REGULATORY BODIES */}
            {registryMode === 'hcb' && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4 sm:mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                                <Award className="text-emerald-600 shrink-0" size={20} /> Accredited Halal Certification Bodies (HCBs) & Oversight
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Recognized by Philippine National Standards, NCMF, DTI Halal Board, and Zamboanga City Ordinance No. 489.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <select
                                value={hcbCategoryFilter}
                                onChange={(e) => setHcbCategoryFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                            >
                                <option value="all">All Organizations</option>
                                <option value="Accredited HCB">Accredited HCBs</option>
                                <option value="Government Oversight">Government Oversight</option>
                                <option value="International Authority">International Authorities</option>
                            </select>

                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search HCB code, name, or registry ref..."
                                    value={hcbSearch}
                                    onChange={(e) => setHcbSearch(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1 pb-4">
                        {filteredHcbs.map((body) => {
                            const isGov = body.category === 'Government Oversight';
                            const isIntl = body.category === 'International Authority';

                            return (
                                <div key={body.id || body.code} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {body.seal_url ? (
                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                                                    <img src={body.seal_url} alt={body.code || body.name} className="max-h-full max-w-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isGov ? 'bg-blue-100 text-blue-700' : isIntl ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {isGov ? <Building2 size={22} /> : isIntl ? <Globe size={22} /> : <ShieldCheck size={22} />}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                                        {body.code || body.acronym || 'HCB'}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        isGov ? 'bg-blue-50 text-blue-700 border border-blue-200' : isIntl ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                        {body.category || 'Accredited HCB'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug">{body.name}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    {body.accreditation_details && (
                                        <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-100">
                                            {body.accreditation_details}
                                        </p>
                                    )}

                                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 font-mono">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-sans text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> Validity:
                                            </span>
                                            <span className="font-bold text-slate-800 text-[11px]">{body.validity_period || 'Continuous Audit'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-sans text-slate-400 flex items-center gap-1">
                                                <FileText size={12} /> Registry Ref:
                                            </span>
                                            <span className="font-bold text-slate-800 text-[11px] truncate max-w-[180px]">{body.registry_reference || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-sans text-slate-400 flex items-center gap-1">
                                                <Globe size={12} /> Jurisdiction:
                                            </span>
                                            <span className="font-semibold text-slate-700 text-[11px]">{body.country || 'Philippines'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 gap-2">
                                        {body.website ? (
                                            <a
                                                href={body.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                            >
                                                <span>Official Portal</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400">No portal listed</span>
                                        )}

                                        {isAdmin && (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openModal('edit-hcb', body)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-200/70 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                                                >
                                                    <Pencil size={12} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteHcb(body)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 3: ESTABLISHMENTS LEDGER */}
            {registryMode === 'establishments' && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                                <Database className="text-emerald-600 shrink-0" size={20} /> Zamboanga Ordinance No. 489 Registers
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Active certificates, business clearances, and inspection audits in Zamboanga City.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search establishments or addresses..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1 sm:pr-2 pb-4">
                        {filteredEstablishments.map((shop) => (
                            <div key={shop.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 sm:gap-5 h-full hover:border-slate-300 transition shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="pr-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                                            {shop.type || 'Establishment'}
                                        </span>
                                        <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{shop.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{shop.address}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                                        shop.halal_status === 'verified' || shop.halal_status === 'Verified'
                                            ? 'bg-green-50 text-green-600 border border-green-200'
                                            : 'bg-red-50 text-red-600 border border-red-200'
                                    }`}>
                                        {shop.halal_status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 text-xs bg-slate-100/70 p-2.5 sm:p-3 rounded-lg border border-slate-200/60 font-mono text-slate-600">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Cert ID</span>
                                        <span className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">{shop.certificate_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Expiry Date</span>
                                        <span className="font-bold text-slate-800 text-[11px] sm:text-xs">{shop.expiry_date || 'N/A'}</span>
                                    </div>
                                </div>

                                {isAdmin ? (
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => openModal('flag-establishment', shop)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-lg transition-colors">
                                            <AlertOctagon size={13} /> Flag Issue
                                        </button>
                                        <button onClick={() => openModal('edit-establishment', shop)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-1.5 rounded-lg transition-colors">
                                            <Pencil size={13} /> Edit Record
                                        </button>
                                        <button onClick={() => handleDeleteEstablishment(shop)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors">
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleReportEstablishment(shop)}
                                            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 py-1.5 rounded-lg transition"
                                            title="Report issue or flag establishment"
                                        >
                                            <Flag size={13} className="text-amber-500" />
                                            <span>Flag / Report Establishment</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* UNIFIED RECORD MODAL */}
            <Modal
                isOpen={!!activeModal}
                title={
                    activeModal?.startsWith('add-additive') ? 'Add Chemical Additive' :
                    activeModal?.startsWith('edit-additive') ? 'Edit Chemical Additive' :
                    activeModal?.startsWith('flag-additive') ? 'Review Chemical Additive' :
                    activeModal?.startsWith('add-hcb') ? 'Register Halal Certifying Body / Agency' :
                    activeModal?.startsWith('edit-hcb') ? 'Edit Certifying Body / Agency' :
                    activeModal?.startsWith('add-establishment') ? 'Add Establishment Record' :
                    activeModal?.startsWith('edit-establishment') ? 'Edit Establishment Record' :
                    'Review Registry Record'
                }
                description="Manage chemical classifications, accredited bodies, and municipal clearance profiles."
                onClose={closeModal}
                footer={[
                    <button key="save" type="submit" form="registry-modal-form" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700">
                        <Save size={14} /> Save Record
                    </button>,
                    <button key="cancel" type="button" onClick={closeModal} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Cancel
                    </button>
                ]}
            >
                <form id="registry-modal-form" onSubmit={handleModalSubmit} className="space-y-3 sm:space-y-4">
                    {/* HCB FORM */}
                    {(activeModal === 'add-hcb' || activeModal === 'edit-hcb') && (
                        <>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Organization Name *</label>
                                    <input
                                        required
                                        placeholder="e.g. Islamic Da'wah Council of the Philippines"
                                        value={modalForm.name || ''}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Acronym / Code</label>
                                    <input
                                        placeholder="e.g. IDCP"
                                        value={modalForm.code || ''}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, code: e.target.value, acronym: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Category</label>
                                    <select
                                        value={modalForm.category || 'Accredited HCB'}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    >
                                        {HCB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Status</label>
                                    <select
                                        value={modalForm.status || 'Accredited'}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    >
                                        {HCB_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Country</label>
                                    <input
                                        placeholder="Philippines"
                                        value={modalForm.country || 'Philippines'}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, country: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Validity Period</label>
                                    <input
                                        placeholder="e.g. Active (2024-2027) or Statutory"
                                        value={modalForm.validity_period || ''}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, validity_period: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Registry Reference</label>
                                    <input
                                        placeholder="e.g. NCMF-HCB-001-NCR"
                                        value={modalForm.registry_reference || ''}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, registry_reference: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Website URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={modalForm.website || ''}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, website: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Seal / Logo Image URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://.../seal.png"
                                        value={modalForm.seal_url || ''}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, seal_url: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Accreditation Details</label>
                                <textarea
                                    rows={3}
                                    placeholder="Scope of accreditation, certified product sectors, or authority mandate..."
                                    value={modalForm.accreditation_details || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, accreditation_details: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    {/* ADDITIVE FORM */}
                    {(activeModal === 'add-additive' || activeModal === 'edit-additive') && (
                        <>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Code (E-Number) *</label>
                                    <input
                                        required
                                        placeholder="e.g. E120"
                                        value={modalForm.code || ''}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, code: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Status</label>
                                    <select
                                        value={modalForm.status || 'Doubtful'}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    >
                                        {ADDITIVE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Origin Type</label>
                                    <select
                                        value={modalForm.origin || 'Plant'}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, origin: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    >
                                        {ADDITIVE_ORIGINS.map(orig => <option key={orig} value={orig}>{orig}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Common / Scientific Name *</label>
                                <input
                                    required
                                    placeholder="e.g. Cochineal / Carmine or Gelatin"
                                    value={modalForm.name || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Source Description (Origins)</label>
                                <textarea
                                    placeholder="e.g. Insect-derived colorant from crushed female cochineal beetles..."
                                    value={modalForm.source || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, source: e.target.value }))}
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Scholarship Reason / Ruling Notes</label>
                                <textarea
                                    placeholder="Islamic jurisprudence basis for classification..."
                                    value={modalForm.reason || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, reason: e.target.value }))}
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    {/* FLAG ADDITIVE FORM */}
                    {activeModal === 'flag-additive' && (
                        <>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Compliance Review Status</label>
                                <select
                                    value={modalForm.status || 'Doubtful'}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="Halal">Halal</option>
                                    <option value="Doubtful">Doubtful</option>
                                    <option value="Haram">Haram</option>
                                    <option value="Needs Review">Needs Review</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Review Reason / Reference</label>
                                <textarea
                                    required
                                    value={modalForm.reason || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, reason: e.target.value }))}
                                    rows={4}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    placeholder="Provide jurisprudence basis or lab findings..."
                                />
                            </div>
                        </>
                    )}

                    {/* ESTABLISHMENT FORMS */}
                    {(activeModal === 'add-establishment' || activeModal === 'edit-establishment') && (
                        <>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Establishment Name *</label>
                                    <input required value={modalForm.name || ''} onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Status</label>
                                    <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                        {ESTABLISHMENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Address</label>
                                <input value={modalForm.address || ''} onChange={(e) => setModalForm(prev => ({ ...prev, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                            </div>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Certificate Number</label>
                                    <input value={modalForm.certNo || ''} onChange={(e) => setModalForm(prev => ({ ...prev, certNo: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Expiry Date</label>
                                    <input type="date" value={modalForm.expiry || ''} onChange={(e) => setModalForm(prev => ({ ...prev, expiry: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                </div>
                            </div>
                        </>
                    )}

                    {activeModal === 'flag-establishment' && (
                        <>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Review Status</label>
                                <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                    <option value="needs_review">needs_review</option>
                                    <option value="verified">verified</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Reason / Review Note</label>
                                <textarea value={modalForm.reason || ''} onChange={(e) => setModalForm(prev => ({ ...prev, reason: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" placeholder="Describe the compliance flag..." />
                            </div>
                        </>
                    )}
                </form>
            </Modal>

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
