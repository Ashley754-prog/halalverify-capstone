import { FileText, Upload, X, Loader2, ShieldCheck } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../../data/constants';

export default function ProductContributionForm({
  prodForm,
  setProdForm,
  onSubmit,
  submitting,
  uploadingImage,
  onFileUpload,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs sm:text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Lucky Me! Pancit Canton"
            value={prodForm.name}
            onChange={(e) => setProdForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
          <input
            type="text"
            placeholder="e.g., Monde Nissin"
            value={prodForm.brand}
            onChange={(e) => setProdForm((prev) => ({ ...prev, brand: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Category</label>
          <select
            value={prodForm.category}
            onChange={(e) => setProdForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white text-slate-800"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c} className="text-slate-800 bg-white">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Barcode (EAN-13)</label>
          <input
            type="text"
            placeholder="e.g., 4800016445566"
            value={prodForm.barcode}
            onChange={(e) => setProdForm((prev) => ({ ...prev, barcode: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Upload Product Package Photo */}
      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Product Packaging / Halal Logo Photo
        </label>
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-emerald-500 transition">
          {prodForm.image_url ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
              <div className="flex items-center gap-2 truncate">
                <FileText size={18} className="text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-900 font-medium truncate">Package Photo Uploaded</span>
              </div>
              <button
                type="button"
                onClick={() => setProdForm((prev) => ({ ...prev, image_url: '' }))}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <Upload size={22} className="text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-emerald-600 hover:underline">
                {uploadingImage ? 'Uploading to storage...' : 'Click to select packaging photo'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                onChange={(e) => onFileUpload(e, 'products')}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Ingredients Summary</label>
        <textarea
          rows={2}
          placeholder="e.g., Wheat Flour, Palm Oil, Salt, Tartrazine (E102)"
          value={prodForm.ingredients_summary}
          onChange={(e) => setProdForm((prev) => ({ ...prev, ingredients_summary: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      <div className="pt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 transition"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
        </button>
      </div>
    </form>
  );
}
