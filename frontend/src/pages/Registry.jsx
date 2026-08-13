import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck, MapPin, Database, Pencil, AlertOctagon, Save, Plus, Trash2 } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ADDITIVE_STATUSES = ['Halal', 'Haram', 'Doubtful', 'Needs Review'];
const ESTABLISHMENT_STATUSES = ['verified', 'expired', 'needs_review'];

const emptyAdditiveForm = {
    code: '',
    name: '',
    status: 'Doubtful',
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

export const Registry = ({ userRole }) => {
    const [registryMode, setRegistryMode] = useState('additives');
    const [dictSearch, setDictSearch] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [additives, setAdditives] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalForm, setModalForm] = useState({});
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        const fetchRegistryData = async () => {
            try {
                setLoading(true);
                setError('');

                const [additivesResponse, establishmentsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/registry/additives`),
                    fetch(`${API_BASE_URL}/registry/establishments`),
                ]);

                if (!additivesResponse.ok || !establishmentsResponse.ok) {
                    throw new Error('Failed to load registry data');
                }

                const additivesJson = await additivesResponse.json();
                const establishmentsJson = await establishmentsResponse.json();

                setAdditives(additivesJson.data || []);
                setEstablishments(establishmentsJson.data || []);
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
                source: item.source_description || item.source || '',
                reason: item.reason || '',
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
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

        if (!confirmed) {
            return;
        }

        try {
            await deleteRegistryRecord(`/registry/additives/${item.id}`);
            setAdditives(prev => prev.filter(entry => entry.id !== item.id));
            updateToast('Additive deleted from database.', 'success');
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not delete additive. Please check the backend.', 'error');
        }
    };

    const handleDeleteEstablishment = async (item) => {
        const label = item.name || 'this establishment';
        const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);

        if (!confirmed) {
            return;
        }

        try {
            await deleteRegistryRecord(`/registry/establishments/${item.id}`);
            setEstablishments(prev => prev.filter(entry => entry.id !== item.id));
            updateToast('Establishment deleted from database.', 'success');
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not delete establishment. Please check the backend.', 'error');
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
                const created = await saveRegistryRecord('/registry/additives', 'POST', {
                    code: requireText(modalForm.code, 'Code'),
                    name: requireText(modalForm.name, 'Name'),
                    status: modalForm.status || 'Doubtful',
                    source_description: modalForm.source || null,
                    reason: modalForm.reason || null,
                });

                setAdditives(prev => [created, ...prev]);
                updateToast('New additive saved to database.', 'success');
            } else if (activeModal === 'flag-additive') {
                const updated = await saveRegistryRecord(
                    `/registry/additives/${selectedItem.id}`,
                    'PATCH',
                    {
                        status: modalForm.status,
                        reason: modalForm.reason,
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive review saved to database.', 'success');
            } else if (activeModal === 'edit-additive') {
                const updated = await saveRegistryRecord(
                    `/registry/additives/${selectedItem.id}`,
                    'PATCH',
                    {
                        code: requireText(modalForm.code, 'Code'),
                        name: requireText(modalForm.name, 'Name'),
                        status: modalForm.status,
                        source_description: modalForm.source,
                        reason: modalForm.reason,
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive record saved to database.', 'success');
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
            }

            closeModal();
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not save registry changes. Please check the backend.', 'error');
        }
    };
    const filteredAdditives = additives.filter(item =>
        (item.code || '').toLowerCase().includes(dictSearch.toLowerCase()) ||
        (item.name || '').toLowerCase().includes(dictSearch.toLowerCase())
    );

    const filteredEstablishments = establishments.filter(shop =>
        (shop.name || '').toLowerCase().includes(localSearch.toLowerCase()) ||
        (shop.address || '').toLowerCase().includes(localSearch.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col h-full">
            <Topbar
                title="Municipal Compliance Directories"
                subtitle="Zamboanga Ordinance No. 489 active establishment register and chemical classifications."
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
                <button
                    onClick={() => setRegistryMode('additives')}
                    className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
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
                    onClick={() => setRegistryMode('establishments')}
                    className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
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

                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => openModal(registryMode === 'additives' ? 'add-additive' : 'add-establishment')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/10 hover:bg-emerald-700"
                    >
                        <Plus size={16} />
                        {registryMode === 'additives' ? 'Add Additive' : 'Add Establishment'}
                    </button>
                )}
            </div>

            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Loading registry data...
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                {registryMode === 'additives' ? (
                    <div className="flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                                <Database className="text-emerald-600 shrink-0" size={20} /> Database Search
                            </h3>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search additives, e.g. E120, Carmine..."
                                    value={dictSearch}
                                    onChange={(e) => setDictSearch(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1 sm:pr-2 pb-4">
                            {filteredAdditives.map((item) => (
                                <div key={item.id || item.code} className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full gap-3 sm:gap-4">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 sm:px-2.5 py-1 rounded border border-slate-300">
                                            {item.code}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider ${
                                            item.status === 'Haram'
                                                ? 'bg-red-50 text-red-600 border border-red-200'
                                                : item.status === 'Halal'
                                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{item.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1.5 sm:mt-2 line-clamp-3">
                                            Source: <span className="italic">{item.source_description || 'No source description yet.'}</span>
                                        </p>
                                        {item.reason && (
                                            <p className="text-xs text-slate-500 mt-1.5 sm:mt-2 line-clamp-3">
                                                Reason: <span className="italic">{item.reason}</span>
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
                                            <button onClick={() => handleDeleteAdditive(item)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 rounded-lg transition-colors">
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                                <Database className="text-emerald-600 shrink-0" size={20} /> Active Certifications
                            </h3>
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
                                <div key={shop.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 sm:gap-5 h-full">
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

                                    {isAdmin && (
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
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!activeModal}
                title={activeModal?.startsWith('add') ? 'Add registry item' : activeModal?.includes('flag') ? 'Review registry item' : 'Edit registry item'}
                description={activeModal?.includes('flag') ? 'Add a review note for this record.' : 'Enter the registry details to save in Supabase.'}
                onClose={closeModal}
                footer={[
                    <button key="save" type="submit" form="registry-modal-form" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700"><Save size={14} /> Save</button>,
                    <button key="cancel" type="button" onClick={closeModal} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                ]}
            >
                <form id="registry-modal-form" onSubmit={handleModalSubmit} className="space-y-3 sm:space-y-4">
                    {activeModal === 'flag-additive' || activeModal === 'flag-establishment' ? (
                        <>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Review Status</label>
                                <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                    <option value="Doubtful">Doubtful</option>
                                    <option value="Haram">Haram</option>
                                    <option value="Needs Review">Needs Review</option>
                                    <option value="Verified">Verified</option>
                                    <option value="verified">verified</option>
                                    <option value="expired">expired</option>
                                    <option value="needs_review">needs_review</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Reason / Note</label>
                                <textarea value={modalForm.reason || ''} onChange={(e) => setModalForm(prev => ({ ...prev, reason: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" placeholder="Describe the concern or review note..." />
                            </div>
                        </>
                    ) : (
                        <>
                            {activeModal === 'edit-additive' || activeModal === 'add-additive' ? (
                                <>
                                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Code</label>
                                            <input required value={modalForm.code || ''} onChange={(e) => setModalForm(prev => ({ ...prev, code: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Status</label>
                                            <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                                {ADDITIVE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Name</label>
                                        <input value={modalForm.name || ''} onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Source</label>
                                        <textarea value={modalForm.source || ''} onChange={(e) => setModalForm(prev => ({ ...prev, source: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Reason</label>
                                        <textarea value={modalForm.reason || ''} onChange={(e) => setModalForm(prev => ({ ...prev, reason: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Establishment Name</label>
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
                        </>
                    )}
                </form>
            </Modal>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ visible: false, message: '', type: 'info' })} />
        </div>
    );
};

export default Registry;
