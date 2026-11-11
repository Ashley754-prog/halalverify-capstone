import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  HeartHandshake,
  BadgeCheck,
  Store,
  Navigation,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  ESTABLISHMENT_HALAL_TIERS,
  SUBMITTER_ROLES,
  findZamboangaBarangay,
  parseZamboangaAddress,
  formatZamboangaAddress,
  isValidPhPhone,
} from '../../data/constants';
import AddressFields from '../shared/AddressFields';
import CategorySelect from '../shared/CategorySelect';
import AmenitiesPicker from '../shared/AmenitiesPicker';
import DishesInput from '../shared/DishesInput';
import UploadBox from '../shared/UploadBox';
import SubmitterRoleSelect from '../shared/SubmitterRoleSelect';
import { getFieldStyles } from '../shared/fieldStyles';

const STEPS = [
  { id: 1, label: 'Business' },
  { id: 2, label: 'Halal Tier' },
  { id: 3, label: 'Menu & Amenities' },
];

const TIER_STYLES = {
  halal_certified: {
    icon: BadgeCheck,
    iconActive: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeBorder: 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500/20',
    dot: 'border-emerald-600 bg-emerald-600',
  },
  muslim_owned: {
    icon: Store,
    iconActive: 'bg-sky-600 text-white',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    activeBorder: 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-500/20',
    dot: 'border-sky-600 bg-sky-600',
  },
  muslim_friendly: {
    icon: HeartHandshake,
    iconActive: 'bg-indigo-600 text-white',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeBorder: 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500/20',
    dot: 'border-indigo-600 bg-indigo-600',
  },
};

const ZAMBOANGA_BOUNDS = { latMin: 6.8, latMax: 7.45, lngMin: 121.8, lngMax: 122.45 };

export default function EstablishmentContributionForm({
  estForm,
  setEstForm,
  onSubmit,
  submitting,
  uploadingImage,
  onFileUpload,
  onCancel,
}) {
  const styles = getFieldStyles('form');
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [pendingDish, setPendingDish] = useState('');

  const currentTier = estForm.halal_tier || 'halal_certified';
  const isCertifiedTier = currentTier === 'halal_certified';
  const dishes = estForm.product_names
    ? estForm.product_names.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const hasGpsPin = estForm.pin_source === 'gps' && estForm.latitude && estForm.longitude;

  const getAddressParts = () => {
    const parsed = parseZamboangaAddress(estForm.address || '');
    return {
      street: estForm.street !== undefined ? estForm.street : parsed.street,
      barangay: estForm.barangay !== undefined ? estForm.barangay : parsed.barangay,
    };
  };

  // Typing or picking an address drops any pin that no longer matches it.
  // A precise GPS pin is kept only while it still sits near the chosen barangay.
  const handleAddressChange = (patch) => {
    setStepError('');
    setEstForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.address !== undefined && patch.address !== prev.address) {
        let keepGps = false;
        if (prev.pin_source === 'gps' && prev.latitude && prev.longitude) {
          const brgy = findZamboangaBarangay(next.barangay, false);
          keepGps = !brgy
            || (Math.abs(prev.latitude - brgy.lat) <= 0.02 && Math.abs(prev.longitude - brgy.lng) <= 0.02);
        }
        if (!keepGps) {
          next.latitude = null;
          next.longitude = null;
          next.pin_source = null;
        }
      }
      return next;
    });
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    setGpsStatus('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const inBounds =
          lat >= ZAMBOANGA_BOUNDS.latMin && lat <= ZAMBOANGA_BOUNDS.latMax &&
          lng >= ZAMBOANGA_BOUNDS.lngMin && lng <= ZAMBOANGA_BOUNDS.lngMax;

        if (!inBounds) {
          setLocatingGps(false);
          setGpsStatus('Your device reports a location outside Zamboanga City. Choose the barangay instead.');
          return;
        }

        setEstForm((prev) => ({ ...prev, latitude: lat, longitude: lng, pin_source: 'gps' }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              const parsed = parseZamboangaAddress(data.display_name);
              setEstForm((prev) => {
                const hasAddress = (prev.street || '').trim() || (prev.barangay || '').trim() || (prev.address || '').trim();
                if (hasAddress) return prev;
                return {
                  ...prev,
                  street: parsed.street,
                  barangay: parsed.barangay,
                  address: formatZamboangaAddress(parsed.street, parsed.barangay, prev.city || 'Zamboanga City'),
                };
              });
            }
          }
        } catch {
          // Reverse geocoding is optional. The GPS pin is already saved.
        }
        setLocatingGps(false);
        setGpsStatus('');
      },
      () => {
        setLocatingGps(false);
        setGpsStatus('Could not access GPS. Please allow location access or choose the barangay.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const validateStep1 = () => {
    if (!estForm.name || !estForm.name.trim()) {
      setStepError('Establishment name is required.');
      return false;
    }
    const { street, barangay } = getAddressParts();
    if (!barangay || !findZamboangaBarangay(barangay, false)) {
      setStepError('Select the barangay where the venue is located.');
      return false;
    }
    if (!street || !street.trim()) {
      setStepError('Enter the street, building or landmark.');
      return false;
    }
    if (estForm.contact_number && estForm.contact_number.trim() && !isValidPhPhone(estForm.contact_number)) {
      setStepError('Enter a valid Philippine phone number, for example 09171234567.');
      return false;
    }
    setStepError('');
    return true;
  };

  const goToStep = (target) => {
    if (target > 1 && !validateStep1()) return;
    setStepError('');
    setCurrentStep(target);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    const finalDishes = [...dishes];
    const pending = pendingDish.trim();
    if (pending && !finalDishes.some((d) => d.toLowerCase() === pending.toLowerCase())) {
      finalDishes.push(pending);
    }
    const names = finalDishes.join(', ');
    setEstForm((prev) => ({ ...prev, product_names: names }));
    onSubmit(e, names);
  };

  const actionBar = 'sticky bottom-0 z-10 -mx-1 px-1 pt-3 pb-1 bg-white border-t border-slate-100 flex items-center justify-between gap-3';
  const primaryBtn = 'px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer transition active:scale-95';
  const secondaryBtn = 'px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer transition flex items-center gap-1.5';

  const renderTierCard = (tier, compact = false) => {
    const isSelected = currentTier === tier.id;
    const cfg = TIER_STYLES[tier.id] || TIER_STYLES.muslim_owned;
    const Icon = cfg.icon;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        key={tier.id}
        onClick={() => setEstForm((prev) => ({ ...prev, halal_tier: tier.id }))}
        className={`w-full ${compact ? 'p-2.5' : 'p-3'} rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
          isSelected ? `${cfg.activeBorder} shadow-xs` : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? cfg.iconActive : 'bg-slate-100 text-slate-500'}`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">{tier.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${cfg.badge}`}>
                {tier.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tier.description}</p>
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? cfg.dot : 'border-slate-300'}`}>
          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Compact step indicator */}
      <div>
        <p className="text-xs font-bold text-slate-800 mb-2">
          Step {currentStep} of {STEPS.length}
          <span className="font-medium text-slate-500"> · {STEPS[currentStep - 1].label}</span>
        </p>
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Submission steps">
          {STEPS.map((step) => {
            const done = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => goToStep(step.id)}
                className="text-left cursor-pointer group"
              >
                <span className={`block h-1.5 rounded-full transition-colors ${done || active ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-slate-300'}`} />
                <span className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${active ? 'text-emerald-700' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                  {done && <CheckCircle2 size={11} className="text-emerald-500" />}
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {stepError && (
        <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{stepError}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
        {/* STEP 1: BUSINESS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <SubmitterRoleSelect
              variant="form"
              value={estForm.submitter_role}
              onChange={(roleId) => setEstForm((prev) => ({ ...prev, submitter_role: roleId }))}
            />

            <div className={styles.grid}>
              <div>
                <label htmlFor="submit-est-name" className={styles.label}>
                  Establishment Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="submit-est-name"
                  type="text"
                  required
                  placeholder="e.g., Al-Makkah Restaurant"
                  value={estForm.name}
                  onChange={(e) => {
                    setStepError('');
                    setEstForm((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="submit-est-category" className={styles.label}>Category / Type</label>
                <CategorySelect
                  variant="form"
                  id="submit-est-category"
                  value={estForm.type}
                  isCustom={estForm.isCustomType}
                  onChange={(patch) => setEstForm((prev) => ({ ...prev, ...patch }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <AddressFields
                variant="form"
                idPrefix="submit-est"
                value={estForm}
                onChange={handleAddressChange}
                streetAction={
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    disabled={locatingGps}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer disabled:opacity-50"
                  >
                    {locatingGps ? (
                      <Loader2 size={11} className="animate-spin text-emerald-600" />
                    ) : (
                      <Navigation size={11} className="text-emerald-600" />
                    )}
                    <span>{locatingGps ? 'Locating...' : 'Pin GPS'}</span>
                  </button>
                }
              />
              {hasGpsPin ? (
                <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs text-emerald-900 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Precise GPS pin saved</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEstForm((prev) => ({ ...prev, latitude: null, longitude: null, pin_source: null }));
                      setGpsStatus('');
                    }}
                    className="text-slate-400 hover:text-rose-600 font-semibold text-[11px] cursor-pointer"
                  >
                    Clear Pin
                  </button>
                </div>
              ) : gpsStatus ? (
                <p className="text-[11px] text-amber-600 font-medium">{gpsStatus}</p>
              ) : (
                <p className="text-[11px] text-slate-400">The map pin is placed from the street and barangay. Use Pin GPS for an exact spot.</p>
              )}
            </div>

            <div className={styles.grid}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="submit-est-phone" className="font-semibold text-slate-700">
                    Contact Phone
                  </label>
                </div>
                <input
                  id="submit-est-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g., 0917 123 4567"
                  value={estForm.contact_number || ''}
                  onChange={(e) => {
                    setStepError('');
                    setEstForm((prev) => ({ ...prev, contact_number: e.target.value }));
                  }}
                  className={styles.input}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="submit-est-link" className="font-semibold text-slate-700">
                    Facebook Page URL
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                </div>
                <input
                  id="submit-est-link"
                  type="text"
                  inputMode="url"
                  placeholder="e.g., facebook.com/almakkah"
                  value={estForm.social_media_url || ''}
                  onChange={(e) => setEstForm((prev) => ({ ...prev, social_media_url: e.target.value }))}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={actionBar}>
              <button type="button" onClick={onCancel} className={secondaryBtn}>Cancel</button>
              <button type="button" onClick={() => goToStep(2)} className={primaryBtn}>
                <span>Continue to Halal Tier</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: HALAL TIER */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div role="radiogroup" aria-label="Halal assurance category" className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <ShieldCheck size={15} className="text-emerald-700 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">With a halal certificate</span>
                </div>
                {ESTABLISHMENT_HALAL_TIERS.filter((t) => t.id === 'halal_certified').map((t) => renderTierCard(t))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Store size={15} className="text-slate-600 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Without a certificate</span>
                </div>
                <p className="text-[11px] text-slate-500">For Muslim-owned eateries, carinderias, or pork-free kitchens. An admin reviews these before they appear publicly.</p>
                <div className="space-y-1.5">
                  {ESTABLISHMENT_HALAL_TIERS.filter((t) => t.id !== 'halal_certified').map((t) => renderTierCard(t, true))}
                </div>
              </div>
            </div>

            {isCertifiedTier ? (
              <div className="space-y-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Halal Certificate Details</span>
                </div>
                <div className={styles.grid}>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label htmlFor="submit-est-certno" className="block text-xs font-bold text-slate-700">
                        Certificate Number
                      </label>
                      <span className={styles.hint}>Auto-read on upload</span>
                    </div>
                    <input
                      id="submit-est-certno"
                      type="text"
                      placeholder="e.g., IDCP-ZC-2024-019"
                      value={estForm.certificate_number}
                      onChange={(e) => setEstForm((prev) => ({ ...prev, certificate_number: e.target.value }))}
                      className={`${styles.input} font-mono`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label htmlFor="submit-est-expiry" className="block text-xs font-bold text-slate-700">
                        Certificate Expiry Date
                      </label>
                      <span className={styles.hint}>Optional</span>
                    </div>
                    <input
                      id="submit-est-expiry"
                      type="date"
                      value={estForm.expiry_date}
                      onChange={(e) => setEstForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                      className={styles.input}
                    />
                  </div>
                </div>
                <UploadBox
                  id="submit-est-cert-file"
                  label="Certificate Document or Photo"
                  prompt="Click to select certificate image or PDF"
                  hint="PNG, JPG, PDF up to 10MB"
                  attachedLabel="Certificate uploaded"
                  accept="image/*,application/pdf"
                  url={estForm.certificate_url}
                  uploading={uploadingImage}
                  onPick={(e) => onFileUpload(e, 'certificates')}
                  onClear={() => setEstForm((prev) => ({ ...prev, certificate_url: '' }))}
                />
                {!estForm.certificate_url && (
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-700">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>Without a certificate file, an admin has to review this listing manually.</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800">
                <p className="font-semibold flex items-center gap-1.5">
                  <HeartHandshake size={15} className="text-sky-600 shrink-0" />
                  No certificate needed
                </p>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  A clear storefront or menu photo helps our admins confirm the venue before it is published.
                </p>
              </div>
            )}

            <UploadBox
              id="submit-est-photo"
              tone="sky"
              label="Storefront or Signboard Photo"
              badge={isCertifiedTier ? 'Optional' : 'Recommended'}
              prompt="Click to select storefront photo"
              hint="PNG, JPG up to 10MB"
              attachedLabel="Storefront photo attached"
              accept="image/*"
              url={estForm.logo_url}
              uploading={uploadingImage}
              onPick={(e) => onFileUpload(e, 'logos')}
              onClear={() => setEstForm((prev) => ({ ...prev, logo_url: '' }))}
            />

            <div className={actionBar}>
              <button type="button" onClick={() => goToStep(1)} className={secondaryBtn}>
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="button" onClick={() => goToStep(3)} className={primaryBtn}>
                <span>Continue to Menu &amp; Amenities</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MENU & AMENITIES */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className={styles.label}>Popular Dishes / Specialties</label>
              <DishesInput
                dishes={dishes}
                onChange={(list) => setEstForm((prev) => ({ ...prev, product_names: list.join(', ') }))}
                onDraftChange={setPendingDish}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Popular dishes show up directly on recommendation and map search cards.
              </p>
            </div>

            <AmenitiesPicker
              variant="form"
              amenities={estForm.amenities}
              onChange={(list) => setEstForm((prev) => ({ ...prev, amenities: list }))}
            />

            <div className={actionBar}>
              <button type="button" onClick={() => goToStep(2)} className={secondaryBtn}>
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className={`${primaryBtn} disabled:opacity-50`}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>{submitting ? 'Submitting...' : 'Submit Establishment'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
