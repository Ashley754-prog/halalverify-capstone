import {
  FileText,
  Upload,
  X,
  Loader2,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  Leaf,
} from 'lucide-react';
import { PRODUCT_CATEGORIES, PRODUCT_HALAL_TIERS } from '../../data/constants';

export default function ProductContributionForm({
  prodForm,
  setProdForm,
  onSubmit,
  submitting,
  uploadingImage,
  onFileUpload,
  onCancel,
}) {
  const currentTier = prodForm.halal_tier || 'halal_certified';
  const isCertified = currentTier === 'halal_certified';

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs sm:text-sm">
      {/* 1. Product Halal Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block font-bold text-slate-800 text-xs sm:text-sm">
            1. Select Product Halal Status <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">Choose 1 option</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Choose the option that best matches this product's packaging and ingredients:
        </p>

        <div className="space-y-1.5">
          {PRODUCT_HALAL_TIERS.map((tier) => {
            const isSelected = currentTier === tier.id;
            const config = {
              halal_certified: {
                icon: BadgeCheck,
                iconActive: 'bg-emerald-600 text-white',
                badgeBg: isSelected ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                activeBorder: 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500/20 shadow-xs',
                dotBorder: 'border-emerald-600 bg-emerald-600',
              },
              pork_free_declared: {
                icon: CheckCircle2,
                iconActive: 'bg-sky-600 text-white',
                badgeBg: isSelected ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-50 text-sky-700 border-sky-200',
                activeBorder: 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-500/20 shadow-xs',
                dotBorder: 'border-sky-600 bg-sky-600',
              },
              vegetarian_vegan: {
                icon: Leaf,
                iconActive: 'bg-teal-600 text-white',
                badgeBg: isSelected ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-50 text-teal-700 border-teal-200',
                activeBorder: 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-500/20 shadow-xs',
                dotBorder: 'border-teal-600 bg-teal-600',
              },
            }[tier.id] || {
              icon: BadgeCheck,
              iconActive: 'bg-slate-700 text-white',
              badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
              activeBorder: 'border-slate-500 bg-slate-50 ring-1 ring-slate-400',
              dotBorder: 'border-slate-600 bg-slate-600',
            };

            const IconComponent = config.icon;

            return (
              <button
                type="button"
                key={tier.id}
                onClick={() => setProdForm((prev) => ({ ...prev, halal_tier: tier.id }))}
                className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? `${config.activeBorder}`
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
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${config.badgeBg}`}>
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

      {isCertified && (
        <div className="space-y-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Certifying Body / Seal on Packaging <span className="text-emerald-600 font-normal text-[11px]">(For instant verification)</span>
            </label>
            <select
              value={prodForm.certifying_body || ''}
              onChange={(e) => setProdForm((prev) => ({ ...prev, certifying_body: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="">Select Certifying Body (Shown on packaging)</option>
              <option value="IDCP">IDCP (Islamic Da'wah Council of the Philippines)</option>
              <option value="HDIP">HDIP (Halal Development Institute of the Philippines)</option>
              <option value="NCMF">NCMF / DTI (National Halal Seal)</option>
              <option value="PRIME">PRIME (Philippine Ulama Congress Organization / Prime)</option>
              <option value="HICCIP">HICCIP (Halal International Chamber of Commerce)</option>
              <option value="MMHCB">MMHCB (Muslim Mindanao Halal Certification Board)</option>
              <option value="BPCC">BPCC (Bangsamoro Consultative Council)</option>
              <option value="BUSC">BUSC (Basilan Ulama Supreme Council)</option>
              <option value="MINHA">MinHA (Mindanao Halal Authority)</option>
              <option value="MASLAHA">MASLAHA (Maslaha Halal Certification)</option>
              <option value="FIQHI">FIQHI (Fiqhi Halal Certification)</option>
              <option value="PUCOI">PUCOI (Philippine Ulama Congress Organization Inc.)</option>
              <option value="PHILCOSED">Philcosed (Philippine Council for Socio-Economic Dev.)</option>
              <option value="AHIP">AHIP (Alliance of Halal Integrity in the Philippines)</option>
              <option value="JAKIM">JAKIM (Department of Islamic Development Malaysia)</option>
              <option value="MUIS">MUIS (Majlis Ugama Islam Singapura)</option>
              <option value="MUI">BPJPH / MUI (Indonesia)</option>
              <option value="OTHER">Other Accredited Body</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Halal Certificate Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., IDCP-2024-0774"
                value={prodForm.certificate_no}
                onChange={(e) => setProdForm((prev) => ({ ...prev, certificate_no: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Certificate Expiry Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={prodForm.expiry_date}
                onChange={(e) => setProdForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Product Package Photo */}
      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Product Packaging Photo <span className="text-emerald-600 font-normal text-[11px]">(Required for Instant AI Verification)</span>
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
                className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <Upload size={22} className="text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-emerald-600 hover:underline">
                {uploadingImage ? 'Uploading to storage...' : 'Click to upload packaging or Halal seal photo'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 10MB (AI automatically reads text from photo)</span>
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
        <label className="block font-semibold text-slate-700 mb-1">
          Ingredients List <span className="text-slate-400 font-normal">(Optional if visible in packaging photo)</span>
        </label>
        <textarea
          rows={2}
          placeholder="e.g., Wheat Flour, Palm Oil, Salt, Tartrazine (E102)"
          value={prodForm.ingredients_summary}
          onChange={(e) => setProdForm((prev) => ({ ...prev, ingredients_summary: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      <div className="pt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 transition cursor-pointer active:scale-95"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          <span>{submitting ? 'Screening & Submitting...' : 'Submit for Verification'}</span>
        </button>
      </div>
    </form>
  );
}
