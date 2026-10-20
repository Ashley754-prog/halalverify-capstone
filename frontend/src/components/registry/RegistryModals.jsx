import { useState } from 'react';
import { Compass, ShieldCheck, Upload, Loader2, ExternalLink } from 'lucide-react';
import Modal from '../ui/Modal';
import { ESTABLISHMENT_TYPES, ESTABLISHMENT_HALAL_TIERS } from '../../data/constants';
import { supabase } from '../../lib/supabaseClient';

const ADDITIVE_STATUSES = ['Halal', 'Doubtful', 'Haram'];
const ADDITIVE_ORIGINS = ['Plant', 'Animal', 'Insect', 'Synthetic / Mineral', 'Multiple / Unknown'];
const HCB_CATEGORIES = ['Local & Regional HCB', 'National HCB', 'Government Oversight', 'International Authority'];

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
    onClose,
    onSubmit,
}) {
    const [isUploadingCert, setIsUploadingCert] = useState(false);

    if (!activeModal) return null;

    const handleCertFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploadingCert(true);
            const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
            const filePath = `certificates/est_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from('submissions')
                .upload(filePath, file, { upsert: true });

            if (!upErr) {
                const { data: pub } = supabase.storage.from('submissions').getPublicUrl(filePath);
                if (pub?.publicUrl) {
                    setModalForm((prev) => ({ ...prev, certificate_url: pub.publicUrl }));
                    return;
                }
            }
            // Fallback to local object URL or data URL if storage bucket is restricted
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    setModalForm((prev) => ({ ...prev, certificate_url: reader.result }));
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.warn('Certificate upload fallback:', err);
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
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition shadow-sm"
                >
                    {submitButtonLabel}
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
                                <select
                                    value={modalForm.type || 'Restaurant'}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                >
                                    {ESTABLISHMENT_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
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
                                    <option value="verified">Verified / Published</option>
                                    <option value="needs_review">Needs Review</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Address in Zamboanga City</label>
                            <input
                                value={modalForm.address || ''}
                                onChange={(e) => setModalForm(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                placeholder="Street, Barangay, Zamboanga City"
                            />
                        </div>

                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Contact Number</label>
                                <input
                                    value={modalForm.phone || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    placeholder="e.g. 09178823419"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">City Jurisdiction</label>
                                <input
                                    value={modalForm.city || 'Zamboanga City'}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Submitter Relationship</label>
                            <select
                                value={modalForm.source?.includes('Owner') ? 'owner' : 'community'}
                                onChange={(e) => setModalForm(prev => ({
                                    ...prev,
                                    source: e.target.value === 'owner' ? 'Business Owner Submission' : 'Community User Submission'
                                }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="owner">Business Owner / Staff (Proprietor)</option>
                                <option value="community">Customer / Community Scout (Visitor)</option>
                            </select>
                        </div>

                        {/* Adaptive Halal Tier Box */}
                        {(modalForm.halal_tier === 'halal_certified' || modalForm.halal_tier === 'verified') ? (
                            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                                <p className="text-xs font-semibold text-emerald-800">
                                    Formal Halal Certification Credentials
                                </p>
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
                        ) : modalForm.halal_tier === 'muslim_owned' ? (
                            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                                <p className="text-xs font-bold text-sky-900">
                                    Community Standard: Muslim-Owned (Pork-Free Kitchen)
                                </p>
                                <p className="text-xs text-sky-700 mt-1 leading-relaxed">
                                    This establishment operates under 100% Muslim ownership and serves strictly pork-free, alcohol-free food without requiring formal third-party certification.
                                </p>
                            </div>
                        ) : modalForm.halal_tier === 'muslim_friendly' ? (
                            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
                                <p className="text-xs font-bold text-indigo-900">
                                    Community Standard: Muslim-Friendly Venue
                                </p>
                                <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                                    Offers dedicated pork-free or alcohol-free preparations, or provides dedicated prayer amenities for Muslim patrons.
                                </p>
                            </div>
                        ) : modalForm.halal_tier === 'vegetarian_vegan' ? (
                            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
                                <p className="text-xs font-bold text-teal-900">
                                    Dietary Standard: Vegetarian / Vegan
                                </p>
                                <p className="text-xs text-teal-700 mt-1 leading-relaxed">
                                    Plant-based menu serving zero meat or animal by-products, naturally compliant with Halal dietary requirements.
                                </p>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                                <p className="text-xs font-bold text-amber-900">
                                    Review Status: Standard Registry Listing
                                </p>
                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                    General establishment entry awaiting standard compliance audit.
                                </p>
                            </div>
                        )}

                        {/* Halal Certificate / Storefront Verification Evidence Upload */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Halal Certificate / Storefront Evidence
                                </span>
                                {modalForm.certificate_url && (
                                    <a
                                        href={modalForm.certificate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>Preview Uploaded Evidence</span>
                                        <ExternalLink size={11} />
                                    </a>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition shrink-0">
                                    {isUploadingCert ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin text-emerald-600" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={13} className="text-emerald-600" />
                                            <span>Upload Certificate Photo</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleCertFileUpload}
                                        className="hidden"
                                    />
                                </label>
                                <input
                                    type="url"
                                    value={modalForm.certificate_url || ''}
                                    onChange={(e) => setModalForm((prev) => ({ ...prev, certificate_url: e.target.value }))}
                                    placeholder="Or paste certificate / evidence image URL..."
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Guest Amenities & Facilities */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-600 block">
                                Guest Amenities & Facilities
                            </span>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setModalForm(prev => ({ ...prev, has_prayer_space: !prev.has_prayer_space }))}
                                    className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
                                        modalForm.has_prayer_space
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <Compass size={14} className={modalForm.has_prayer_space ? 'text-emerald-600' : 'text-slate-400'} />
                                    <span>Dedicated Prayer Space (Musalah)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalForm(prev => ({ ...prev, is_alcohol_free: !prev.is_alcohol_free }))}
                                    className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
                                        modalForm.is_alcohol_free
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <ShieldCheck size={14} className={modalForm.is_alcohol_free ? 'text-emerald-600' : 'text-slate-400'} />
                                    <span>100% Alcohol-Free Premises</span>
                                </button>
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
    );
}
