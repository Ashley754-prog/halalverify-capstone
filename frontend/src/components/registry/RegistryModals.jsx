import { useState } from 'react';
import { Upload, Loader2, ExternalLink } from 'lucide-react';
import Modal from '../ui/Modal';
import { ESTABLISHMENT_HALAL_TIERS, getEstablishmentPhoto } from '../../data/constants';
import AddressFields from '../shared/AddressFields';
import CategorySelect from '../shared/CategorySelect';
import AmenitiesPicker from '../shared/AmenitiesPicker';
import DishesInput from '../shared/DishesInput';
import SubmitterRoleSelect from '../shared/SubmitterRoleSelect';
import { supabase } from '../../lib/supabaseClient';
import { buildScopedUploadPath, getSafeUrl, validateUploadFile } from '../../utils/security';

const ADDITIVE_STATUSES = ['Halal', 'Doubtful', 'Haram'];
const ADDITIVE_ORIGINS = ['Plant', 'Animal', 'Insect', 'Synthetic / Mineral', 'Multiple / Unknown'];
const HCB_CATEGORIES = ['Local & Regional HCB', 'National HCB', 'Government Oversight', 'International Authority'];

const ESTABLISHMENT_STATUS_OPTIONS = [
    { value: 'verified', label: 'Operational / Verified' },
    { value: 'for_renewal', label: 'For Renewal' },
    { value: 'needs_review', label: 'Needs Review' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'pending_verification', label: 'Pending Verification' },
    { value: 'expired', label: 'Expired' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'relocated', label: 'Relocated' },
    { value: 'permanently_closed', label: 'Permanently Closed' },
    { value: 'closed', label: 'Closed' },
    { value: 'demolished', label: 'Demolished' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const normalizeAdditiveCode = (code) => {
    if (!code) return '';
    const trimmed = String(code).trim();
    const match = trimmed.match(/^(?:ins\s*[-]?|e\s*[-]?|#)?\s*(\d+[a-zA-Z]?)$/i);
    if (match) {
        return `E${match[1].toUpperCase()}`;
    }
    return trimmed.toUpperCase();
};

export default function RegistryModals({
    activeModal,
    modalForm,
    setModalForm,
    certifyingBodies = [],
    onClose,
    onSubmit,
}) {
    const [isUploadingCert, setIsUploadingCert] = useState(false);
    const [uploadError, setUploadError] = useState('');

    if (!activeModal) return null;

    const handleCertFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const check = validateUploadFile(file, {
            maxSizeMB: 10,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        });
        if (!check.valid) {
            setUploadError(check.error || 'Unsupported file format or size.');
            return;
        }

        setUploadError('');
        setIsUploadingCert(true);
        try {
            const { data: userRes } = await supabase.auth.getUser();
            const filePath = buildScopedUploadPath(userRes?.user?.id, 'certificates/establishments', file.name);
            const { error: upErr } = await supabase.storage
                .from('submissions')
                .upload(filePath, file, { upsert: false });

            if (!upErr) {
                const { data: pub } = supabase.storage.from('submissions').getPublicUrl(filePath);
                if (pub?.publicUrl) {
                    const isCertTier = (modalForm.halal_tier || 'halal_certified') === 'halal_certified';
                    setModalForm((prev) => ({
                        ...prev,
                        photo_url: pub.publicUrl,
                        logo_url: pub.publicUrl,
                        certificate_url: isCertTier ? pub.publicUrl : '',
                    }));
                    setIsUploadingCert(false);
                    return;
                }
            }
            // Fallback to data URL if storage bucket upload fails
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        const isCertTier = (modalForm.halal_tier || 'halal_certified') === 'halal_certified';
                        setModalForm((prev) => ({
                            ...prev,
                            photo_url: reader.result,
                            logo_url: reader.result,
                            certificate_url: isCertTier ? reader.result : '',
                        }));
                    }
                    resolve();
                };
                reader.onerror = () => {
                    setUploadError('Failed to read the selected file.');
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        } catch (err) {
            console.warn('Certificate upload fallback:', err);
            setUploadError('File upload failed. Please try again.');
        } finally {
            setIsUploadingCert(false);
        }
    };

    const modalTitle =
        activeModal?.startsWith('add-additive') ? 'Add Chemical Additive' :
        activeModal?.startsWith('edit-additive') ? 'Edit Chemical Additive' :
        activeModal?.startsWith('flag-additive') ? 'Review Chemical Additive' :
        activeModal?.startsWith('add-hcb') ? 'Register Halal Certifying Body / Agency' :
        activeModal?.startsWith('edit-hcb') ? 'Edit Certifying Body / Agency' :
        activeModal?.startsWith('add-establishment') ? 'Add Establishment Record' :
        activeModal?.startsWith('edit-establishment') ? 'Edit Establishment Record' :
        'Review Registry Record';

    const modalDescription =
        activeModal?.includes('establishment')
            ? 'Update establishment profile, verification standard, and dining clearance.'
            : activeModal?.includes('additive')
            ? 'Manage chemical additive classification, origins, and Halal jurisprudence.'
            : activeModal?.includes('hcb')
            ? 'Manage accredited Halal certifying authorities and regulatory bodies.'
            : 'Review and manage verified registry ledger records.';

    const submitButtonLabel =
        activeModal?.startsWith('add-additive') ? 'Add Additive' :
        activeModal?.startsWith('edit-additive') ? 'Save Changes' :
        activeModal?.startsWith('add-hcb') ? 'Register Authority' :
        activeModal?.startsWith('edit-hcb') ? 'Save Changes' :
        activeModal?.startsWith('add-establishment') ? 'Save Establishment' :
        activeModal?.startsWith('edit-establishment') ? 'Save Changes' :
        'Save Record';

    return (
        <Modal
            isOpen={!!activeModal}
            title={modalTitle}
            description={modalDescription}
            onClose={onClose}
            footer={[
                <button
                    key="save"
                    type="submit"
                    form="registry-modal-form"
                    disabled={isUploadingCert}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition shadow-sm disabled:opacity-50"
                >
                    {isUploadingCert ? 'Uploading File...' : submitButtonLabel}
                </button>,
                <button
                    key="cancel"
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                    Cancel
                </button>
            ]}
        >
            <form id="registry-modal-form" onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
                {/* HCB FORM */}
                {(activeModal === 'add-hcb' || activeModal === 'edit-hcb') && (
                    <>
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
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Acronym / Code</label>
                                <input
                                    placeholder="e.g. IDCP"
                                    value={modalForm.code || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, code: e.target.value, acronym: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Country / Jurisdiction</label>
                                <input
                                    placeholder="Philippines"
                                    value={modalForm.country || 'Philippines'}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, country: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Category</label>
                            <select
                                value={modalForm.category || 'Accredited HCB'}
                                onChange={(e) => setModalForm(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                            >
                                {HCB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
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
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Code / Identifier (E-Number or Code) *</label>
                                <input
                                    required
                                    placeholder="e.g. E120, 120, or custom code"
                                    value={modalForm.code || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, code: e.target.value }))}
                                    onBlur={() => {
                                        if (modalForm.code && modalForm.code.trim()) {
                                            setModalForm(prev => ({ ...prev, code: normalizeAdditiveCode(prev.code) }));
                                        }
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                                {modalForm.code && modalForm.code.trim() && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                        <span>Canonical code:</span>
                                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                            {normalizeAdditiveCode(modalForm.code)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Halal Status</label>
                                <select
                                    value={modalForm.status || 'Doubtful'}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                >
                                    {ADDITIVE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Common / Scientific Name *</label>
                                <input
                                    required
                                    placeholder="e.g. Carmine, Lecithin, Gelatin"
                                    value={modalForm.name || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
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
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Source Description (Origins)</label>
                            <textarea
                                placeholder="e.g. Insect-derived colorant from crushed female cochineal beetles..."
                                value={modalForm.source || ''}
                                onChange={(e) => setModalForm(prev => ({ ...prev, source: e.target.value }))}
                                rows={2}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Islamic Jurisprudence / Ruling Notes</label>
                            <textarea
                                placeholder="Islamic jurisprudence basis for classification..."
                                value={modalForm.reason || ''}
                                onChange={(e) => setModalForm(prev => ({ ...prev, reason: e.target.value }))}
                                rows={2}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
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
                                <input
                                    required
                                    value={modalForm.name || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    placeholder="Business or venue name"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Venue Category</label>
                                <CategorySelect
                                    value={modalForm.type}
                                    isCustom={modalForm.isCustomType}
                                    onChange={(patch) => setModalForm(prev => ({ ...prev, ...patch }))}
                                    variant="registry"
                                    id="registry-est-category"
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Verification Standard</label>
                                <select
                                    value={modalForm.halal_tier || 'halal_certified'}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, halal_tier: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                >
                                    {ESTABLISHMENT_HALAL_TIERS.map(tier => (
                                        <option key={tier.id} value={tier.id}>{tier.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Registry Status</label>
                                <select
                                    value={modalForm.status || 'verified'}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                >
                                    {ESTABLISHMENT_STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Submitter Role</label>
                                <SubmitterRoleSelect
                                    variant="registry"
                                    id="registry-est-role"
                                    value={modalForm.submitter_role || (modalForm.source && modalForm.source.toLowerCase().includes('owner') ? 'owner' : 'community')}
                                    onChange={(roleId) => setModalForm(prev => ({
                                        ...prev,
                                        submitter_role: roleId,
                                        source: roleId === 'owner' ? 'Business Owner Submission' : 'Community User Submission',
                                    }))}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Contact Number</label>
                                <input
                                    value={modalForm.phone || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    placeholder="e.g. 09178823419"
                                />
                            </div>
                        </div>

                        <AddressFields
                            variant="registry"
                            idPrefix="registry-est"
                            value={modalForm}
                            onChange={(patch) => setModalForm(prev => ({ ...prev, ...patch }))}
                        />

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Facebook Page URL</label>
                            <input
                                type="text"
                                value={modalForm.facebook_url || ''}
                                onChange={(e) => setModalForm(prev => ({ ...prev, facebook_url: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                placeholder="https://www.facebook.com/yourpage"
                            />
                        </div>

                        {/* Formal Halal Certification Credentials */}
                        {(modalForm.halal_tier === 'halal_certified' || modalForm.halal_tier === 'verified') && (
                            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                                <p className="text-xs font-semibold text-emerald-800">
                                    Formal Halal Certification Credentials
                                </p>
                                {certifyingBodies.length > 0 && (
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-emerald-900">
                                            Accredited Certifying Body (HCB)
                                        </label>
                                        <select
                                            value={modalForm.certifying_body_id || ''}
                                            onChange={(e) => setModalForm(prev => ({ ...prev, certifying_body_id: e.target.value }))}
                                            className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                        >
                                            <option value="">-- Select Certifying Body --</option>
                                            {certifyingBodies.map((cb) => (
                                                <option key={cb.id} value={cb.id}>
                                                    {cb.code ? `${cb.code} — ${cb.name}` : cb.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-emerald-900">Certificate Number</label>
                                        <input
                                            value={modalForm.certNo || ''}
                                            onChange={(e) => setModalForm(prev => ({ ...prev, certNo: e.target.value }))}
                                            className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                            placeholder="e.g. IDCP-2025-1029"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-emerald-900">Certificate Expiry Date</label>
                                        <input
                                            type="date"
                                            value={modalForm.expiry || ''}
                                            onChange={(e) => setModalForm(prev => ({ ...prev, expiry: e.target.value }))}
                                            className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Simplified Venue Photo Upload */}
                        {(() => {
                            const hasActivePhoto = Boolean(
                                modalForm.photo_url && modalForm.photo_url !== 'none'
                            );
                            const hasRemovedPhoto = modalForm.photo_url === 'none';
                            const defaultPhoto = getEstablishmentPhoto({ name: modalForm.name });
                            const isShowingDefault = !hasActivePhoto && !hasRemovedPhoto && Boolean(defaultPhoto);
                            const rawPreviewHref = hasActivePhoto ? modalForm.photo_url : defaultPhoto;
                            const safePreviewHref = getSafeUrl(rawPreviewHref);

                            return (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                                            Venue Storefront Photo
                                        </span>
                                        {(hasActivePhoto || isShowingDefault) && safePreviewHref && (
                                            <a
                                                href={safePreviewHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                                            >
                                                <span>View Full Photo</span>
                                                <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                    {uploadError && (
                                        <p className="text-xs font-medium text-red-600">{uploadError}</p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition shadow-xs active:scale-[0.98] shrink-0">
                                            {isUploadingCert ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin text-white" />
                                                    <span>Uploading Image...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={14} />
                                                    <span>{hasActivePhoto || isShowingDefault ? 'Change Photo' : 'Upload Photo'}</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleCertFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        {(hasActivePhoto || isShowingDefault) ? (
                                            <button
                                                type="button"
                                                onClick={() => setModalForm(prev => ({ ...prev, photo_url: 'none', certificate_url: '' }))}
                                                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                                            >
                                                Remove Photo
                                            </button>
                                        ) : hasRemovedPhoto ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-slate-500 italic">Photo removed (placeholder active)</span>
                                                {defaultPhoto && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalForm(prev => ({ ...prev, photo_url: '', certificate_url: '' }))}
                                                        className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                                                    >
                                                        Restore Default
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No custom photo uploaded</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Menu */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Popular Dishes / Specialties
                                </label>
                                <span className="text-[11px] text-slate-400 font-medium">
                                    {(modalForm.menu_highlights || []).length} dish{(modalForm.menu_highlights || []).length === 1 ? '' : 'es'}
                                </span>
                            </div>
                            <DishesInput
                                dishes={modalForm.menu_highlights || []}
                                onChange={(list) => setModalForm(prev => ({ ...prev, menu_highlights: list }))}
                                placeholder="Add specialty or dish, e.g. Beef Satti, Chicken Inasal..."
                            />
                        </div>

                        {/* Amenities */}
                        <AmenitiesPicker
                            variant="registry"
                            amenities={modalForm.amenities || []}
                            allowCustom={true}
                            onChange={(list) => setModalForm(prev => ({
                                ...prev,
                                amenities: list,
                                has_prayer_space: list.some(a => a.toLowerCase().includes('prayer')),
                            }))}
                        />
                    </>
                )}

                {activeModal === 'flag-establishment' && (
                    <>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Review Status</label>
                            <select value={modalForm.status || ''} onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none">
                                {ESTABLISHMENT_STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
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
    );
}
