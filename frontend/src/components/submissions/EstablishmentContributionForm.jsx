import { MapPin, FileText, Upload, X, Loader2, Phone, Globe, ShieldCheck, HeartHandshake } from 'lucide-react';
import { ESTABLISHMENT_TYPES, ESTABLISHMENT_HALAL_TIERS } from '../../data/constants';

export default function EstablishmentContributionForm({
  estForm,
  setEstForm,
  onSubmit,
  submitting,
  uploadingImage,
  onFileUpload,
  onCancel,
}) {
  const currentTier = estForm.halal_tier || 'halal_certified';
  const isCertifiedTier = currentTier === 'halal_certified';

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs sm:text-sm">
      {/* Factor 1: Transparent Halal Classification Tier */}
      <div>
        <label className="block font-bold text-slate-800 mb-1.5">
          Halal Classification Tier <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ESTABLISHMENT_HALAL_TIERS.map((tier) => {
            const isSelected = currentTier === tier.id;
            return (
              <button
                type="button"
                key={tier.id}
                onClick={() => setEstForm((prev) => ({ ...prev, halal_tier: tier.id }))}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`font-bold text-xs ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {tier.label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {tier.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {tier.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submitter Relationship Declaration */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <HeartHandshake size={15} className="text-emerald-600 shrink-0" />
          Your Relationship to this Venue:
        </span>
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setEstForm((prev) => ({ ...prev, submitter_role: 'owner' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              estForm.submitter_role === 'owner'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Business Owner / Staff
          </button>
          <button
            type="button"
            onClick={() => setEstForm((prev) => ({ ...prev, submitter_role: 'community' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              (estForm.submitter_role || 'community') === 'community'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer / Community Scout
          </button>
        </div>
      </div>

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

      {/* Public Contact & Social Media Links (Factor 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Contact Phone / Mobile <span className="text-slate-400 font-normal">(Actionable info)</span>
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g., 0917 123 4567 or (062) 991-2345"
              value={estForm.contact_number || ''}
              onChange={(e) => setEstForm((prev) => ({ ...prev, contact_number: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Facebook Page or Web Link <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              placeholder="e.g., https://facebook.com/almakkah"
              value={estForm.social_media_url || ''}
              onChange={(e) => setEstForm((prev) => ({ ...prev, social_media_url: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Certificate Credentials Section (Rendered for Certified Tier, or notice for others) */}
      {isCertifiedTier ? (
        <div className="space-y-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Accredited Certification Credentials (IDCP, HDIP, NCMF, etc.)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Halal Certificate Number
              </label>
              <input
                type="text"
                placeholder="e.g., IDCP-ZC-2024-019"
                value={estForm.certificate_number}
                onChange={(e) => setEstForm((prev) => ({ ...prev, certificate_number: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 font-mono"
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

          {/* Upload Certificate Photo */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Upload Certificate Photo (Enables Instant AI Verification)
            </label>
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center hover:border-emerald-500 transition">
              {estForm.certificate_url ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-900 font-medium truncate">Certificate Uploaded</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEstForm((prev) => ({ ...prev, certificate_url: '' }))}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <Upload size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-emerald-600 hover:underline">
                    {uploadingImage ? 'Uploading to storage...' : 'Click to select certificate image'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 10MB</span>
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
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs">
          <p className="font-semibold flex items-center gap-1.5">
            <HeartHandshake size={15} className="text-sky-600 shrink-0" />
            Community-Backed Transparency
          </p>
          <p className="text-[11px] text-sky-700 mt-0.5">
            No formal certificate upload is required for Muslim-owned or friendly spots. The automated checker validates local Zamboanga address and contact availability to list it under the community directory.
          </p>
        </div>
      )}

      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Popular Food / Menu Items (Separated by commas)
        </label>
        <input
          type="text"
          placeholder="e.g., Beef Satti, Chicken Inasal, Roti Canai"
          value={estForm.product_names}
          onChange={(e) => setEstForm((prev) => ({ ...prev, product_names: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500"
        />
        <p className="text-[11px] text-slate-400 mt-1">Helps community diners search dishes served at this location.</p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer transition active:scale-95"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          <span>{submitting ? 'Auditing & Submitting...' : 'Submit Establishment'}</span>
        </button>
      </div>
    </form>
  );
}
