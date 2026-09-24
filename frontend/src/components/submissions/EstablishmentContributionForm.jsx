import { MapPin, FileText, Upload, X, Loader2 } from 'lucide-react';
import { ESTABLISHMENT_TYPES } from '../../data/constants';

export default function EstablishmentContributionForm({
  estForm,
  setEstForm,
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
            Establishment Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Al-Makkah Restaurant"
            value={estForm.name}
            onChange={(e) => setEstForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Category / Type</label>
          <select
            value={estForm.type}
            onChange={(e) => setEstForm((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white text-slate-800"
          >
            {ESTABLISHMENT_TYPES.map((t) => (
              <option key={t} value={t} className="text-slate-800 bg-white">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Physical Address in Zamboanga City <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            required
            placeholder="e.g., Gov. Lim Ave, Zone II, Zamboanga City"
            value={estForm.address}
            onChange={(e) => setEstForm((prev) => ({ ...prev, address: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Halal Certificate Number (if displayed)
          </label>
          <input
            type="text"
            placeholder="e.g., IDCP-ZC-2024-019"
            value={estForm.certificate_number}
            onChange={(e) => setEstForm((prev) => ({ ...prev, certificate_number: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Certificate Validity / Expiry</label>
          <input
            type="date"
            value={estForm.expiry_date}
            onChange={(e) => setEstForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Upload Certificate Photo / Document */}
      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Upload Certificate Document / Photo (Recommended for Fast Verification)
        </label>
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-emerald-500 transition">
          {estForm.certificate_url ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
              <div className="flex items-center gap-2 truncate">
                <FileText size={18} className="text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-900 font-medium truncate">Certificate Uploaded</span>
              </div>
              <button
                type="button"
                onClick={() => setEstForm((prev) => ({ ...prev, certificate_url: '' }))}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <Upload size={22} className="text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-emerald-600 hover:underline">
                {uploadingImage ? 'Uploading to storage...' : 'Click to select certificate image'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={uploadingImage}
                onChange={(e) => onFileUpload(e, 'certificates')}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Verified Food / Menu Items (Separated by commas)
        </label>
        <input
          type="text"
          placeholder="e.g., Beef Satti, Chicken Inasal, Roti Canai"
          value={estForm.product_names}
          onChange={(e) => setEstForm((prev) => ({ ...prev, product_names: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 placeholder:opacity-100 outline-none focus:border-emerald-500"
        />
        <p className="text-[11px] text-slate-400 mt-1">Help the community know what dishes are served here.</p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          <span>{submitting ? 'Submitting for Audit...' : 'Submit Establishment'}</span>
        </button>
      </div>
    </form>
  );
}
