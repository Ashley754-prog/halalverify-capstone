import React from 'react';
import Modal from '../ui/Modal';

export default function ProductFormModal({
    isOpen,
    isEdit,
    modalForm,
    setModalForm,
    manufacturers,
    categories,
    statuses,
    isSaving,
    onClose,
    onSubmit,
}) {
    if (!isOpen) return null;

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
                        <label className="text-xs font-bold text-slate-700">Barcode (GTIN / EAN)</label>
                        <input
                            type="text"
                            value={modalForm.barcode}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, barcode: e.target.value }))}
                            placeholder="e.g. 4800016012345"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Halal Status</label>
                        <select
                            value={modalForm.status}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, status: e.target.value }))}
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

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Data Source</label>
                        <input
                            type="text"
                            value={modalForm.source}
                            onChange={(e) => setModalForm((prev) => ({ ...prev, source: e.target.value }))}
                            placeholder="e.g. IDCP Published Registry"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                        />
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
