import {
  MapPin,
  FileText,
  Upload,
  X,
  Loader2,
  Phone,
  Globe,
  ShieldCheck,
  HeartHandshake,
  BadgeCheck,
  Store,
  Leaf,
  Compass,
} from 'lucide-react';
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
      {/* 2-Level Conceptual Hierarchy for Halal Classification */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block font-bold text-slate-800 text-xs sm:text-sm">
            Halal Classification Tier <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">Select tier</span>
        </div>

        {/* Level 1: Institutional Certification */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <BadgeCheck size={15} className="text-emerald-700 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Institutional Certification
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              (Third-Party Audited)
            </span>
          </div>

          {ESTABLISHMENT_HALAL_TIERS.filter((t) => t.id === 'halal_certified').map((tier) => {
            const isSelected = currentTier === tier.id;
            return (
              <button
                type="button"
                key={tier.id}
                onClick={() => setEstForm((prev) => ({ ...prev, halal_tier: tier.id }))}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <BadgeCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
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
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                }`}>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Level 2: Community & Lifestyle Accommodations */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Store size={15} className="text-slate-600 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Community & Dietary Accommodations
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                (Self-Declared Practices)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              For dining places without formal third-party certificates, declare their kitchen operation:
            </p>
          </div>

          <div className="space-y-1.5">
            {ESTABLISHMENT_HALAL_TIERS.filter((t) => t.id !== 'halal_certified').map((tier) => {
              const isSelected = currentTier === tier.id;
              const config = {
                muslim_owned: {
                  icon: Store,
                  iconActive: 'bg-sky-600 text-white',
                  badge: isSelected ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-50 text-sky-700 border-sky-200',
                  activeBorder: 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-500/20',
                  dotBorder: 'border-sky-600 bg-sky-600',
                },
                muslim_friendly: {
                  icon: HeartHandshake,
                  iconActive: 'bg-indigo-600 text-white',
                  badge: isSelected ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  activeBorder: 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500/20',
                  dotBorder: 'border-indigo-600 bg-indigo-600',
                },
                vegetarian_vegan: {
                  icon: Leaf,
                  iconActive: 'bg-teal-600 text-white',
                  badge: isSelected ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-50 text-teal-700 border-teal-200',
                  activeBorder: 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-500/20',
                  dotBorder: 'border-teal-600 bg-teal-600',
                },
              }[tier.id] || {
                icon: Store,
                iconActive: 'bg-slate-700 text-white',
                badge: 'bg-slate-100 text-slate-600 border-slate-200',
                activeBorder: 'border-slate-500 bg-slate-50 ring-1 ring-slate-400',
                dotBorder: 'border-slate-600 bg-slate-600',
              };

              const IconComponent = config.icon;

              return (
                <button
                  type="button"
                  key={tier.id}
                  onClick={() => setEstForm((prev) => ({ ...prev, halal_tier: tier.id }))}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? `${config.activeBorder} shadow-xs`
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? config.iconActive : 'bg-slate-100 text-slate-500'
                    }`}>
                      <IconComponent size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                          {tier.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${config.badge}`}>
                          {tier.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? config.dotBorder : 'border-slate-300'
                  }`}>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
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
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs">
            <p className="font-semibold flex items-center gap-1.5">
              <HeartHandshake size={15} className="text-sky-600 shrink-0" />
              Community-Backed Transparency
            </p>
            <p className="text-[11px] text-sky-700 mt-0.5">
              No formal certificate upload is required for Muslim-owned or friendly spots. The automated checker validates local Zamboanga address and contact availability to list it under the community directory.
            </p>
          </div>

          {/* Storefront / Menu Photo Upload for Community Listings */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Storefront or Menu Signboard Photo <span className="text-slate-400 font-normal">(Optional, helps community verify)</span>
            </label>
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center hover:border-emerald-500 transition">
              {estForm.logo_url || estForm.certificate_url ? (
                <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-lg p-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-sky-600 shrink-0" />
                    <span className="text-xs text-sky-900 font-medium truncate">Photo Attached</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEstForm((prev) => ({ ...prev, logo_url: '', certificate_url: '' }))}
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <Upload size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-sky-600 hover:underline">
                    {uploadingImage ? 'Uploading to storage...' : 'Click to select storefront or menu photo'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => onFileUpload(e, 'logos')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Venue Features & Amenities (Benchmark: Muslim in Manila / Zabihah) */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
        <span className="text-xs font-semibold text-slate-700 block">
          Dining Amenities & Facilities <span className="text-slate-400 font-normal">(Optional, helps Muslim travelers)</span>
        </span>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setEstForm((prev) => ({ ...prev, has_prayer_space: !prev.has_prayer_space }))}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
              estForm.has_prayer_space
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Compass size={14} className={estForm.has_prayer_space ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Dedicated Prayer Space (Musalah)</span>
          </button>

          <button
            type="button"
            onClick={() => setEstForm((prev) => ({ ...prev, is_alcohol_free: !prev.is_alcohol_free }))}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
              estForm.is_alcohol_free
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck size={14} className={estForm.is_alcohol_free ? 'text-emerald-600' : 'text-slate-400'} />
            <span>100% Alcohol-Free Premises</span>
          </button>
        </div>
      </div>

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
