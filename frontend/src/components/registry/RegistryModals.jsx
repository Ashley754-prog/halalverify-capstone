import { useState } from 'react';
import { Upload, Loader2, ExternalLink, UtensilsCrossed } from 'lucide-react';
import Modal from '../ui/Modal';
import { ESTABLISHMENT_TYPES, ESTABLISHMENT_HALAL_TIERS, getEstablishmentPhoto } from '../../data/constants';
import { supabase } from '../../lib/supabaseClient';

const ADDITIVE_STATUSES = ['Halal', 'Doubtful', 'Haram'];
const ADDITIVE_ORIGINS = ['Plant', 'Animal', 'Insect', 'Synthetic / Mineral', 'Multiple / Unknown'];
const HCB_CATEGORIES = ['Local & Regional HCB', 'National HCB', 'Government Oversight', 'International Authority'];
const STANDARD_AMENITIES = [
    'Dedicated Prayer Space (Musalah)',
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
    const [newSpecialtyInput, setNewSpecialtyInput] = useState('');

    const handleAddSpecialty = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const val = (newSpecialtyInput || '').trim();
        if (!val) return;
        setModalForm(prev => {
            const current = Array.isArray(prev.menu_highlights) ? [...prev.menu_highlights] : [];
            if (current.includes(val)) return prev;
            return {
                ...prev,
                menu_highlights: [...current, val],
            };
        });
        setNewSpecialtyInput('');
    };

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
                                {(() => {
                                    const currentType = modalForm.type ?? 'Restaurant';
                                    const isStandard = ESTABLISHMENT_TYPES.includes(currentType);
                                    const isCustom = modalForm.isCustomType || (!isStandard && Boolean(currentType));
                                    const selectValue = isCustom ? '__custom__' : currentType;

                                    return (
                                        <div className="space-y-2">
                                            <select
                                                value={selectValue}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '__custom__') {
                                                        setModalForm(prev => ({
                                                            ...prev,
                                                            isCustomType: true,
                                                            type: isStandard ? '' : (prev.type || ''),
                                                        }));
                                                    } else {
                                                        setModalForm(prev => ({
                                                            ...prev,
                                                            type: val,
                                                            isCustomType: false,
                                                        }));
                                                    }
                                                }}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                                            >
                                                {ESTABLISHMENT_TYPES.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="__custom__">+ Other / Custom Category...</option>
                                            </select>
                                            {isCustom && (
                                                <input
                                                    type="text"
                                                    value={modalForm.type || ''}
                                                    onChange={(e) => setModalForm(prev => ({ ...prev, type: e.target.value, isCustomType: true }))}
                                                    placeholder="Type custom category name (e.g. Barbecue House)..."
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                                    autoFocus
                                                />
                                            )}
                                        </div>
                                    );
                                })()}
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
                        {(() => {
                            const hasActivePhoto = Boolean(
                                modalForm.photo_url && modalForm.photo_url !== 'none'
                            );
                            const hasRemovedPhoto = modalForm.photo_url === 'none';
                            const defaultPhoto = getEstablishmentPhoto({ name: modalForm.name });
                            const isShowingDefault = !hasActivePhoto && !hasRemovedPhoto && Boolean(defaultPhoto);

                            return (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                                            Venue Storefront Photo
                                        </span>
                                        {(hasActivePhoto || isShowingDefault) && (
                                            <a
                                                href={hasActivePhoto ? modalForm.photo_url : defaultPhoto}
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
                                    placeholder="Add custom facility (e.g. Free Wi-Fi, Outdoor Dining)..."
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

                        {/* Cuisine & Specialties (Menu Highlights) */}
                        <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/70 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wide text-rose-900/80 flex items-center gap-1.5">
                                    <UtensilsCrossed size={13} className="text-rose-700" />
                                    <span>Cuisine & Specialties (Menu Highlights)</span>
                                </span>
                                <span className="text-[11px] text-rose-800/60 font-medium">
                                    {(modalForm.menu_highlights || []).length} dish{(modalForm.menu_highlights || []).length === 1 ? '' : 'es'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-xs">
                                {(modalForm.menu_highlights || []).map((dish) => (
                                    <span
                                        key={dish}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium bg-white text-rose-900 border-rose-200 shadow-2xs"
                                    >
                                        <span>{dish}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nextDishes = (modalForm.menu_highlights || []).filter(d => d !== dish);
                                                setModalForm(prev => ({ ...prev, menu_highlights: nextDishes }));
                                            }}
                                            className="text-rose-400 hover:text-rose-700 font-bold ml-0.5 cursor-pointer"
                                            title={`Remove ${dish}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {(!modalForm.menu_highlights || modalForm.menu_highlights.length === 0) && (
                                    <span className="text-[11px] text-rose-800/60 italic py-0.5">
                                        No specialties or dishes added yet. Type below to add.
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    value={newSpecialtyInput}
                                    onChange={(e) => setNewSpecialtyInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSpecialty(e);
                                        }
                                    }}
                                    placeholder="Add specialty or dish (e.g. Beef Satti, Chicken Inasal, Barbecue Skewers)..."
                                    className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-rose-400 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSpecialty}
                                    disabled={!newSpecialtyInput.trim()}
                                    className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold transition cursor-pointer shrink-0 disabled:opacity-40"
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
