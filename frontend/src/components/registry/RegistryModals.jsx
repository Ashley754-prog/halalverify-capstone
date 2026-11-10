import { useState } from 'react';
import { Upload, Loader2, ExternalLink } from 'lucide-react';
import Modal from '../ui/Modal';
import { ESTABLISHMENT_TYPES, ESTABLISHMENT_HALAL_TIERS } from '../../data/constants';
import { supabase } from '../../lib/supabaseClient';

const ADDITIVE_STATUSES = ['Halal', 'Doubtful', 'Haram'];
const ADDITIVE_ORIGINS = ['Plant', 'Animal', 'Insect', 'Synthetic / Mineral', 'Multiple / Unknown'];
const HCB_CATEGORIES = ['Local & Regional HCB', 'National HCB', 'Government Oversight', 'International Authority'];
const STANDARD_AMENITIES = [
    'Dedicated Prayer Space (Musalah)',
    '100% Alcohol-Free Premises',
    'Pork-Free Kitchen',
    'Halal Meat Sourced',
    'Wudu (Ablution) Facility',
    'Family Dining Section',
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
    onClose,
    onSubmit,
}) {
    const [isUploadingCert, setIsUploadingCert] = useState(false);
    const [customAmenityInput, setCustomAmenityInput] = useState('');

    const handleToggleAmenity = (amenityName) => {
        setModalForm(prev => {
            const current = Array.isArray(prev.amenities) ? [...prev.amenities] : [];
            const exists = current.includes(amenityName);
            const updated = exists ? current.filter(a => a !== amenityName) : [...current, amenityName];
            return {
                ...prev,
                amenities: updated,
                has_prayer_space: updated.some(a => a.toLowerCase().includes('prayer')),
                is_alcohol_free: updated.some(a => a.toLowerCase().includes('alcohol')),
            };
        });
    };

    const handleAddCustomAmenity = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const val = customAmenityInput.trim();
        if (!val) return;
        setModalForm(prev => {
            const current = Array.isArray(prev.amenities) ? [...prev.amenities] : [];
            if (!current.includes(val)) {
                current.push(val);
            }
            return {
                ...prev,
                amenities: current,
                has_prayer_space: current.some(a => a.toLowerCase().includes('prayer')),
                is_alcohol_free: current.some(a => a.toLowerCase().includes('alcohol')),
            };
        });
        setCustomAmenityInput('');
    };

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
                    setModalForm((prev) => ({ ...prev, certificate_url: pub.publicUrl, photo_url: pub.publicUrl }));
                    return;
                }
            }
            // Fallback to local object URL or data URL if storage bucket is restricted
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    setModalForm((prev) => ({ ...prev, certificate_url: reader.result, photo_url: reader.result }));
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
                                <input
                                    list="venue-categories"
                                    value={modalForm.type || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, type: e.target.value }))}
                                    placeholder="e.g. Barbecue House, Restaurant, Fast Food"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                                <datalist id="venue-categories">
                                    <option value="Restaurant" />
                                    <option value="Barbecue House" />
                                    <option value="Burger House" />
                                    <option value="Satti House" />
                                    <option value="Halal Carinderia" />
                                    <option value="Casual Dining Bistro" />
                                    <option value="Moro & Tausug Restaurant" />
                                    <option value="Sizzling & Grill House" />
                                    <option value="Cafeteria / Eatery" />
                                    <option value="Bakery & Pastry" />
                                    <option value="Fast Food" />
                                    <option value="Cafe / Coffee Shop" />
                                    <option value="Halal Meat & Poultry Shop" />
                                    <option value="Grocery / Supermarket" />
                                </datalist>
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
                                    <option value="verified">Operational / Published</option>
                                    <option value="needs_review">Needs Review</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="relocated">Relocated / Moved</option>
                                    <option value="permanently_closed">Permanently Closed</option>
                                    <option value="demolished">Demolished / Ceased Operations</option>
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
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Facebook Page URL</label>
                                <input
                                    type="text"
                                    value={modalForm.facebook_url || ''}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, facebook_url: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    placeholder="https://www.facebook.com/yourpage"
                                />
                            </div>
                        </div>

                        {/* Formal Halal Certification Credentials */}
                        {(modalForm.halal_tier === 'halal_certified' || modalForm.halal_tier === 'verified') && (
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
                        )}

                        {/* Simplified Venue Photo Upload */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                                    Venue Storefront Photo
                                </span>
                                {(modalForm.photo_url || modalForm.certificate_url) && (
                                    <a
                                        href={modalForm.photo_url || modalForm.certificate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>View Full Photo</span>
                                        <ExternalLink size={11} />
                                    </a>
                                )}
                            </div>
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
                                            <span>{modalForm.photo_url || modalForm.certificate_url ? 'Change Photo' : 'Upload Photo'}</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleCertFileUpload}
                                        className="hidden"
                                    />
                                </label>
                                {(modalForm.photo_url || modalForm.certificate_url) ? (
                                    <button
                                        type="button"
                                        onClick={() => setModalForm(prev => ({ ...prev, photo_url: '', certificate_url: '' }))}
                                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                                    >
                                        Remove Photo
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">No custom photo uploaded</span>
                                )}
                            </div>
                        </div>

                        {/* Guest Amenities & Facilities */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Guest Amenities & Facilities
                                </span>
                                <span className="text-[11px] text-slate-400">Select all that apply</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {STANDARD_AMENITIES.map((name) => {
                                    const isSelected = Array.isArray(modalForm.amenities) && modalForm.amenities.includes(name);
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => handleToggleAmenity(name)}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {name}
                                        </button>
                                    );
                                })}
                                {Array.isArray(modalForm.amenities) && modalForm.amenities.filter(a => !STANDARD_AMENITIES.includes(a)).map((customName) => (
                                    <span
                                        key={customName}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                    >
                                        <span>{customName}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAmenity(customName)}
                                            className="text-white hover:text-emerald-100 font-bold ml-0.5 cursor-pointer"
                                            title="Remove custom facility"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    value={customAmenityInput}
                                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(e); } }}
                                    placeholder="Add custom facility (e.g. Separate Halal Utensils)..."
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomAmenity}
                                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
                                >
                                    + Add
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
