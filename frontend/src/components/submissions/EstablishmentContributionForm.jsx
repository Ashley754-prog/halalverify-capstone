import { useState } from 'react';
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
  Navigation,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  AlertCircle,
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
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [newDishTag, setNewDishTag] = useState('');

  const currentTier = estForm.halal_tier || 'halal_certified';
  const isCertifiedTier = currentTier === 'halal_certified';

  // Parse product_names into an array of tags
  const dishTags = estForm.product_names
    ? estForm.product_names
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const handleAddDishTag = (tagToAdd) => {
    const trimmed = (tagToAdd || newDishTag).trim();
    if (!trimmed) return;
    if (dishTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setNewDishTag('');
      return;
    }
    const updated = [...dishTags, trimmed].join(', ');
    setEstForm((prev) => ({ ...prev, product_names: updated }));
    setNewDishTag('');
  };

  const handleRemoveDishTag = (tagToRemove) => {
    const updated = dishTags.filter((t) => t !== tagToRemove).join(', ');
    setEstForm((prev) => ({ ...prev, product_names: updated }));
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
        setEstForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name && !estForm.address?.trim()) {
              setEstForm((prev) => ({
                ...prev,
                address: data.display_name,
              }));
            }
          }
        } catch {
          // Ignore reverse geocoding network errors; coordinates remain pinned
        }
        setLocatingGps(false);
        setGpsStatus(`GPS pinned (${lat}, ${lng})`);
      },
      () => {
        setLocatingGps(false);
        setGpsStatus('Could not access GPS. Please allow location access or type the address.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const validateStep1 = () => {
    if (!estForm.name || !estForm.name.trim()) {
      setStepError('Establishment name is required.');
      return false;
    }
    if (!estForm.address || !estForm.address.trim()) {
      setStepError('Physical address in Zamboanga City is required.');
      return false;
    }
    setStepError('');
    return true;
  };

  const handleNextFromStep1 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleNextFromStep2 = (e) => {
    e.preventDefault();
    setStepError('');
    setCurrentStep(3);
  };

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Wizard Step Indicator */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-white shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
              Step {currentStep} of 3
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {currentStep === 1 && 'Establishment Details'}
              {currentStep === 2 && 'Halal Assurance Tier'}
              {currentStep === 3 && 'Menu & Amenities'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {currentStep === 1 && '33% Completed'}
            {currentStep === 2 && '66% Completed'}
            {currentStep === 3 && 'Final Step'}
          </span>
        </div>

        {/* Progress Fill Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Step Buttons for Navigation */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1 || validateStep1()) {
                setCurrentStep(1);
              }
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              currentStep === 1
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : currentStep > 1
                ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {currentStep > 1 ? (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">
                1
              </span>
            )}
            <span className="truncate">1. Business</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (validateStep1()) {
                setCurrentStep(2);
              }
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              currentStep === 2
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : currentStep > 2
                ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {currentStep > 2 ? (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">
                2
              </span>
            )}
            <span className="truncate">2. Halal Tier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (validateStep1()) {
                setCurrentStep(3);
              }
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              currentStep === 3
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">
              3
            </span>
            <span className="truncate">3. Amenities</span>
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {stepError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Form Contents */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* ======================================================== */}
        {/* STEP 1: BUSINESS DETAILS */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Submitter Affiliation Segmented Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Submitter Affiliation</span>
                <span className="text-[11px] text-slate-500">Helps our moderation team classify verification documents</span>
              </div>
              <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-xs font-medium shrink-0">
                <button
                  type="button"
                  onClick={() => setEstForm((prev) => ({ ...prev, submitter_role: 'owner' }))}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    estForm.submitter_role === 'owner'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Business Owner / Staff
                </button>
                <button
                  type="button"
                  onClick={() => setEstForm((prev) => ({ ...prev, submitter_role: 'community' }))}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    (estForm.submitter_role || 'community') === 'community'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Customer / Community
                </button>
              </div>
            </div>

            {/* Name and Category */}
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
                  onChange={(e) => {
                    setStepError('');
                    setFieldErrors((prev) => ({ ...prev, name: '' }));
                    setEstForm((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition ${
                    fieldErrors.name
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category / Type</label>
                <select
                  value={estForm.type}
                  onChange={(e) => setEstForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-slate-800 transition cursor-pointer"
                >
                  {ESTABLISHMENT_TYPES.map((t) => (
                    <option key={t} value={t} className="text-slate-800 bg-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address & GPS Pin Card */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block font-semibold text-slate-700">
                  Physical Address in Zamboanga City <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  disabled={locatingGps}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {locatingGps ? (
                    <Loader2 size={12} className="animate-spin text-emerald-600" />
                  ) : (
                    <Navigation size={12} className="text-emerald-600" />
                  )}
                  <span>{locatingGps ? 'Locating...' : 'Pin Current GPS'}</span>
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="e.g., Gov. Lim Ave, Zone II, Zamboanga City"
                value={estForm.address}
                onChange={(e) => {
                  setStepError('');
                  setFieldErrors((prev) => ({ ...prev, address: '' }));
                  setEstForm((prev) => ({ ...prev, address: e.target.value }));
                }}
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition ${
                  fieldErrors.address
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {fieldErrors.address && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.address}</p>
              )}

              {/* Pin Coordinates Card */}
              {estForm.latitude && estForm.longitude ? (
                <div className="mt-1.5 flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs text-emerald-900 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Coordinates pinned ({estForm.latitude}, {estForm.longitude})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEstForm((prev) => ({ ...prev, latitude: null, longitude: null }));
                      setGpsStatus('');
                    }}
                    className="text-slate-400 hover:text-rose-600 font-semibold text-[11px] cursor-pointer"
                  >
                    Clear Pin
                  </button>
                </div>
              ) : gpsStatus ? (
                <p className="mt-1 text-[11px] text-amber-600 font-medium">{gpsStatus}</p>
              ) : null}
            </div>

            {/* Public Contact & Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Phone / Mobile <span className="text-emerald-600 font-normal text-[11px]">(Fast verification)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 0917 123 4567 or (062) 991-2345"
                  value={estForm.contact_number || ''}
                  onChange={(e) => setEstForm((prev) => ({ ...prev, contact_number: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Facebook Page or Web Link <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g., https://facebook.com/almakkah"
                  value={estForm.social_media_url || ''}
                  onChange={(e) => setEstForm((prev) => ({ ...prev, social_media_url: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer transition active:scale-95"
              >
                <span>Continue to Halal Tier</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: HALAL TIER SELECTION */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Friendly Guidance Banner */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Step 2: Select Halal Assurance Category</p>
                <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                  Choose the classification that accurately describes this establishment. Community trust and verification badges rely on proper reporting.
                </p>
              </div>
            </div>

            {/* Option A: Formally Certified */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700">
                <BadgeCheck size={15} className="text-emerald-700 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Institutional Certification (With Paper Certificate)
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
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <BadgeCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                            {tier.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {tier.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {tier.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Option B: Community Verified / Muslim-Owned / Friendly */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Store size={15} className="text-slate-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Community Verified (Without 3rd-Party Certificate)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                For Muslim-owned eateries, carinderias, or pork-free kitchens:
              </p>

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
                        isSelected ? `${config.activeBorder} shadow-xs` : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? config.iconActive : 'bg-slate-100 text-slate-500'
                          }`}
                        >
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
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? config.dotBorder : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Verification Proof Upload Area */}
            {isCertifiedTier ? (
              <div className="space-y-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Halal Certificate Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Certificate Number <span className="text-slate-400 font-normal">(Auto-verified if uploaded)</span>
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
                    <label className="block font-semibold text-slate-700 mb-1">Certificate Expiry Date</label>
                    <input
                      type="date"
                      value={estForm.expiry_date}
                      onChange={(e) => setEstForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Upload Certificate Document or Photo
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
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center">
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-emerald-600 hover:underline">
                          {uploadingImage ? 'Uploading to storage...' : 'Click to select certificate image or PDF'}
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
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs">
                  <p className="font-semibold flex items-center gap-1.5">
                    <HeartHandshake size={15} className="text-sky-600 shrink-0" />
                    Easy Community Listing
                  </p>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    No 3rd-party certificate is needed. A storefront or menu signboard photo allows immediate community discovery.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Storefront or Signboard Photo <span className="text-sky-600 font-normal text-[11px]">(Recommended)</span>
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
                          {uploadingImage ? 'Uploading to storage...' : 'Click to select storefront photo'}
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

            {/* Step 2 Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer transition active:scale-95"
              >
                <span>Continue to Menu & Amenities</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: MENU & AMENITIES */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Friendly Guidance Banner */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
              <Store size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Step 3: Menu Highlights & Dining Amenities</p>
                <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                  List popular dishes and prayer facilities to help local diners and Muslim travelers plan their visit.
                </p>
              </div>
            </div>

            {/* Interactive Popular Dishes Chip Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Popular Dishes / Specialties
              </label>
              <div className="rounded-xl border border-slate-300 bg-white p-2.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dishTags.map((dish) => (
                    <span
                      key={dish}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold"
                    >
                      <span>{dish}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDishTag(dish)}
                        className="text-emerald-600 hover:text-red-500 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {dishTags.length === 0 && (
                    <span className="text-[11px] text-slate-400 py-0.5">
                      No dishes added yet. Type below and press Enter or click Add.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="e.g., Beef Satti, Chicken Inasal, Roti Canai"
                    value={newDishTag}
                    onChange={(e) => setNewDishTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDishTag(newDishTag);
                      }
                    }}
                    className="flex-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDishTag(newDishTag)}
                    disabled={!newDishTag.trim()}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Popular dishes show up directly on recommendation and map search cards.
              </p>
            </div>

            {/* Venue Features & Amenities Checkboxes */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block">
                Diner Amenities & Kitchen Protocols
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEstForm((prev) => ({ ...prev, has_prayer_space: !prev.has_prayer_space }))}
                  className={`p-2.5 rounded-xl border text-left font-medium flex items-center gap-2.5 transition cursor-pointer ${
                    estForm.has_prayer_space
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Compass size={16} className={estForm.has_prayer_space ? 'text-emerald-600' : 'text-slate-400'} />
                  <div>
                    <span className="font-semibold block">Dedicated Prayer Space</span>
                    <span className="text-[10px] text-slate-500">Musalah / prayer area on-site</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEstForm((prev) => ({ ...prev, is_alcohol_free: !prev.is_alcohol_free }))}
                  className={`p-2.5 rounded-xl border text-left font-medium flex items-center gap-2.5 transition cursor-pointer ${
                    estForm.is_alcohol_free
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck size={16} className={estForm.is_alcohol_free ? 'text-emerald-600' : 'text-slate-400'} />
                  <div>
                    <span className="font-semibold block">100% Alcohol-Free</span>
                    <span className="text-[10px] text-slate-500">No alcohol served on premises</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3 Actions (Submit) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer transition active:scale-95"
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
