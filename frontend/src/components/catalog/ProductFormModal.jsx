
import { useState } from 'react';
import { Upload, Loader2, ExternalLink } from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';

export default function ProductFormModal({
    isOpen,
    isEdit,
    modalForm,
    setModalForm,
    manufacturers,
    certifyingBodies = [],
    categories,
    statuses,
    isSaving,
    onClose,
    onSubmit,
}) {
    const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

    if (!isOpen) return null;

    const handleEvidenceUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploadingEvidence(true);
            const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
            const filePath = `certificates/prod_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from('submissions')
                .upload(filePath, file, { upsert: true });

            if (!upErr) {
                const { data: pub } = supabase.storage.from('submissions').getPublicUrl(filePath);
                if (pub?.publicUrl) {
                    setModalForm((prev) => ({ ...prev, image_url: pub.publicUrl }));
                    return;
                }
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    setModalForm((prev) => ({ ...prev, image_url: reader.result }));
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.warn('Product evidence upload fallback:', err);
        } finally {
            setIsUploadingEvidence(false);
        }
    };

    const isNonCertified = modalForm.status === 'Pork-Free Declared' || modalForm.status === 'Vegetarian / Vegan';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Product Record' : 'Register New Halal Product'}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700">Product Name *</label>
                        <input
                            type="text"
                            required
                            value={modalForm.name}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Purefoods Corned Beef 150g"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Brand</label>
                        <input
                            type="text"
                            value={modalForm.brand}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, brand: e.target.value }))}
                            placeholder="e.g. Purefoods"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Category</label>
                        <select
                            value={modalForm.category}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, category: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                        >
                            {categories.filter((c) => c !== 'All Categories').map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>


                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Halal Status</label>
                        <select
                            value={modalForm.status}
                            onChange={(e) => {
                                const newStatus = e.target.value;
                                const isNowNonCertified = newStatus === 'Pork-Free Declared' || newStatus === 'Vegetarian / Vegan';
                                setModalForm((prev) => ({
                                    ...prev,
                                    status: newStatus,
                                    ...(isNowNonCertified ? { certifying_body_id: '', certificate_no: '', expiry_date: '' } : {}),
                                }));
                            }}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                        >
                            {statuses.filter((s) => s !== 'All Statuses').map((st) => (
                                <option key={st} value={st}>
                                    {st}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Manufacturer</label>
                        <select
                            value={modalForm.manufacturer_id}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, manufacturer_id: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                        >
                            <option value="">-- Select Manufacturer --</option>
                            {manufacturers.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!isNonCertified && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Halal Certifying Body</label>
                                <select
                                    value={modalForm.certifying_body_id || ''}
                                    onChange={(e) => setModalForm((prev) => ({ ...prev, certifying_body_id: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                                >
                                    <option value="">-- Select Certifying Body --</option>
                                    {certifyingBodies.map((cb) => (
                                        <option key={cb.id} value={cb.id}>
                                            {cb.code ? `${cb.code} - ${cb.name}` : cb.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Certificate Number</label>
                                <input
                                    type="text"
                                    value={modalForm.certificate_no}
                                    onChange={(e) => setModalForm((prev) => ({ ...prev, certificate_no: e.target.value }))}
                                    placeholder="e.g. IDCP-2024-0891"
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Certificate Expiry Date</label>
                                <input
                                    type="date"
                                    value={modalForm.expiry_date}
                                    onChange={(e) => setModalForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Data Source</label>
                        <input
                            type="text"
                            value={modalForm.source}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, source: e.target.value }))}
                            placeholder="e.g. Manual Registry Entry, IDCP, or Community Submission"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                            Source Link / Verification URL <span className="font-normal text-slate-400">(Optional)</span>
                        </label>
                        <input
                            type="url"
                            value={modalForm.source_url || ''}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, source_url: e.target.value }))}
                            placeholder="e.g. https://example.com/verify (Leave empty if none)"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-700">
                                Halal Certificate / Packaging Evidence Photo <span className="font-normal text-slate-400">(Optional)</span>
                            </label>
                            {modalForm.image_url && (
                                <a
                                    href={modalForm.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                                >
                                    <span>Preview Evidence</span>
                                    <ExternalLink size={11} />
                                </a>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition shrink-0">
                                {isUploadingEvidence ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin text-emerald-600" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={13} className="text-emerald-600" />
                                        <span>Upload Certificate / Photo</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleEvidenceUpload}
                                    className="hidden"
                                />
                            </label>
                            <input
                                type="url"
                                value={modalForm.image_url || ''}
                                onChange={(e) => setModalForm((prev) => ({ ...prev, image_url: e.target.value }))}
                                placeholder="Or paste certificate / packaging photo URL..."
                                className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700">Ingredients Summary</label>
                        <textarea
                            rows={2}
                            value={modalForm.ingredients_summary}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, ingredients_summary: e.target.value }))}
                            placeholder="e.g. Cooked Beef, Beef Broth, Iodized Salt, Sugar, Spices..."
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
