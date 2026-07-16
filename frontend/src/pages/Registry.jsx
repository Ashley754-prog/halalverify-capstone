import React, { useState } from 'react';
import { Search, ShieldCheck, MapPin, Database, Pencil, AlertOctagon, Save } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { E_NUMBERS_DATABASE, LOCAL_ESTABLISHMENTS } from '../data/constants';

export const Registry = ({ userRole }) => {
    const [registryMode, setRegistryMode] = useState('additives'); // 'additives' or 'establishments'
    const [dictSearch, setDictSearch] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [additives, setAdditives] = useState(E_NUMBERS_DATABASE);
    const [establishments, setEstablishments] = useState(LOCAL_ESTABLISHMENTS);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalForm, setModalForm] = useState({});
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const openModal = (modalType, item) => {
        setSelectedItem(item);
        setActiveModal(modalType);

        if (modalType === 'flag-additive') {
            setModalForm({ reason: item.flagReason || '', status: item.status });
        } else if (modalType === 'edit-additive') {
            setModalForm({ code: item.code, name: item.name, status: item.status, source: item.source });
        } else if (modalType === 'flag-establishment') {
            setModalForm({ reason: item.flagReason || '', status: item.status });
        } else {
            setModalForm({ name: item.name, address: item.address, certNo: item.certNo, expiry: item.expiry, status: item.status });
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

    const handleModalSubmit = (event) => {
        event.preventDefault();

        if (activeModal === 'flag-additive') {
            setAdditives(prev => prev.map(item => item.code === selectedItem.code ? { ...item, status: modalForm.status, flagReason: modalForm.reason } : item));
            updateToast('Additive flagged for review.', 'info');
        } else if (activeModal === 'edit-additive') {
            setAdditives(prev => prev.map(item => item.code === selectedItem.code ? { ...item, ...modalForm } : item));
            updateToast('Additive record updated.', 'success');
        } else if (activeModal === 'flag-establishment') {
            setEstablishments(prev => prev.map(item => item.id === selectedItem.id ? { ...item, status: modalForm.status, flagReason: modalForm.reason } : item));
            updateToast('Establishment flagged for review.', 'info');
        } else if (activeModal === 'edit-establishment') {
            setEstablishments(prev => prev.map(item => item.id === selectedItem.id ? { ...item, ...modalForm } : item));
            updateToast('Establishment record updated.', 'success');
        }

        closeModal();
    };

    return (
        <div className="p-8 space-y-6 flex-1 flex flex-col h-full">
            <Topbar
                title="Municipal Compliance Directories"
                subtitle="Zamboanga Ordinance No. 489 active establishment register & raw chemical classifications[cite: 1]."
            />

            <div className="flex gap-4 mb-2">
                <button
                    onClick={() => setRegistryMode('additives')}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                        registryMode === 'additives'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                >
                    <span className="flex items-center gap-2"><ShieldCheck size={18} /> Raw Chemical Additives Ledger</span>
                </button>
                <button
                    onClick={() => setRegistryMode('establishments')}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                        registryMode === 'establishments'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                >
                    <span className="flex items-center gap-2"><MapPin size={18} /> Zamboanga Clearance Registers</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                {registryMode === 'additives' ? (
                    <div className="flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <Database className="text-emerald-600" /> Database Search
                            </h3>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search additives (e.g. E120, Carmine)..."
                                    value={dictSearch}
                                    onChange={(e) => setDictSearch(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                            {additives.filter(item =>
                                item.code.toLowerCase().includes(dictSearch.toLowerCase()) ||
                                item.name.toLowerCase().includes(dictSearch.toLowerCase())
                            ).map((item, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between h-full gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded border border-slate-300">{item.code}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                            item.status === 'Haram' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}>{item.status}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-800 leading-tight">{item.name}</h4>
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-3">Source: <span className="italic">{item.source}</span></p>
                                    </div>
                                    {userRole === 'admin' && (
                                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                                            <button onClick={() => openModal('flag-additive', item)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-lg transition-colors">
                                                <AlertOctagon size={13} /> Flag
                                            </button>
                                            <button onClick={() => openModal('edit-additive', item)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-1.5 rounded-lg transition-colors">
                                                <Pencil size={13} /> Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <Database className="text-emerald-600" /> Active Certifications
                            </h3>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search establishments or addresses..."
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                            {establishments.filter(shop =>
                                shop.name.toLowerCase().includes(localSearch.toLowerCase()) ||
                                shop.address.toLowerCase().includes(localSearch.toLowerCase())
                            ).map((shop, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between gap-5 h-full">
                                    <div className="flex justify-between items-start">
                                        <div className="pr-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{shop.type}</span>
                                            <h4 className="text-base font-bold text-slate-800 leading-tight">{shop.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{shop.address}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                            shop.status === 'Verified' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                                        }`}>{shop.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 text-xs bg-slate-100/70 p-3 rounded-lg border border-slate-200/60 font-mono text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Cert ID</span>
                                            <span className="font-bold text-slate-800">{shop.certNo}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Expiry Date</span>
                                            <span className="font-bold text-slate-800">{shop.expiry}</span>
                                        </div>
                                    </div>
                                    {userRole === 'admin' && (
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => openModal('flag-establishment', shop)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-lg transition-colors">
                                                <AlertOctagon size={13} /> Flag Issue
                                            </button>
                                            <button onClick={() => openModal('edit-establishment', shop)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-1.5 rounded-lg transition-colors">
                                                <Pencil size={13} /> Edit Record
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
                title={activeModal?.includes('flag') ? 'Review registry item' : 'Edit registry item'}
                description={activeModal?.includes('flag') ? 'Add a review note for this record.' : 'Update the selected registry entry.'}
                onClose={closeModal}
                footer={[
                    <button key="cancel" type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>,
                    <button key="save" type="submit" form="registry-modal-form" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Save size={14} /> Save</button>
                ]}
            >
                <form id="registry-modal-form" onSubmit={handleModalSubmit} className="space-y-4">
                    {activeModal === 'flag-additive' || activeModal === 'flag-establishment' ? (
                        <>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Review Status</label>
                                <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                    <option value="Doubtful">Doubtful</option>
                                    <option value="Haram">Haram</option>
                                    <option value="Needs Review">Needs Review</option>
                                    <option value="Verified">Verified</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Reason / Note</label>
                                <textarea value={modalForm.reason || ''} onChange={(e) => setModalForm(prev => ({ ...prev, reason: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" placeholder="Describe the concern or review note..." />
                            </div>
                        </>
                    ) : (
                        <>
                            {activeModal === 'edit-additive' ? (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Code</label>
                                            <input value={modalForm.code || ''} onChange={(e) => setModalForm(prev => ({ ...prev, code: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Status</label>
                                            <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                                <option value="Haram">Haram</option>
                                                <option value="Doubtful">Doubtful</option>
                                                <option value="Needs Review">Needs Review</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Name</label>
                                        <input value={modalForm.name || ''} onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Source</label>
                                        <textarea value={modalForm.source || ''} onChange={(e) => setModalForm(prev => ({ ...prev, source: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Establishment Name</label>
                                            <input value={modalForm.name || ''} onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Status</label>
                                            <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                                <option value="Verified">Verified</option>
                                                <option value="Expired">Expired</option>
                                                <option value="Needs Review">Needs Review</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Address</label>
                                        <input value={modalForm.address || ''} onChange={(e) => setModalForm(prev => ({ ...prev, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Certificate Number</label>
                                            <input value={modalForm.certNo || ''} onChange={(e) => setModalForm(prev => ({ ...prev, certNo: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Expiry Date</label>
                                            <input value={modalForm.expiry || ''} onChange={(e) => setModalForm(prev => ({ ...prev, expiry: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none" />
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