import { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { validateUploadFile } from '../../utils/security';
import {
  geocodeZamboangaAddress,
  formatZamboangaAddress,
  parseZamboangaAddress,
  cleanAmenities,
  normalizeWebLink,
} from '../../data/constants';
import EstablishmentContributionForm from './EstablishmentContributionForm';
import ProductContributionForm from './ProductContributionForm';

function cleanReasonText(text) {
  if (!text) return '';
  return String(text)
    .replace(/^Needs manual review:\s*/i, '')
    .replace(/^Potential duplicate listing detected\s*/i, 'Potential duplicate: ')
    .replace(/\s*\([+-]?\d+\s*pts?\)\.?$/i, '')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function cleanHighlightNote(note) {
  if (!note) return '';
  return String(note)
    .replace(/\s*\([+-]?\d+\s*pts?\)\.?$/i, '')
    .trim();
}

function isOptionalFieldNotice(reason, tierKey) {
  if (!reason) return false;
  const lower = String(reason).toLowerCase();
  if (lower.includes('no public contact phone number')) return true;
  if (tierKey !== 'halal_certified' && lower.includes('no physical storefront or menu photo')) return true;
  return false;
}

function getTierBadgeInfo(tier) {
  switch (tier) {
    case 'halal_certified':
      return { label: 'Halal Certified', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'muslim_owned':
      return { label: 'Muslim-Owned', color: 'bg-teal-50 text-teal-800 border-teal-200' };
    case 'muslim_friendly':
      return { label: 'Muslim-Friendly', color: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'vegetarian_vegan':
      return { label: 'Vegetarian / Vegan', color: 'bg-lime-50 text-lime-800 border-lime-200' };
    case 'pork_free_declared':
      return { label: 'Pork-Free Declared', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    default:
      return { label: 'Community Listing', color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

export default function ContributionModal({
  isOpen,
  onClose,
  initialTab = 'establishment', // 'establishment' | 'product'
  initialProductData = null,
  onSubmitted,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Form state for establishment
  const [estForm, setEstForm] = useState({
    name: '',
    type: 'Restaurant',
    address: '',
    city: 'Zamboanga City',
    latitude: null,
    longitude: null,
    halal_tier: 'halal_certified',
    contact_number: '',
    social_media_url: '',
    submitter_role: 'community',
    certificate_number: '',
    expiry_date: '',
    certificate_url: '',
    logo_url: '',
    product_names: '',
    amenities: [],
  });

  // Form state for product
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: '',
    category: 'Food & Beverage',
    barcode: '',
    halal_tier: 'halal_certified',
    submitter_role: 'consumer',
    certifying_body: '',
    certificate_no: '',
    expiry_date: '',
    image_url: '',
    ingredients_summary: '',
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialProductData) {
        setProdForm((prev) => ({
          ...prev,
          halal_tier: initialProductData.halal_tier || prev.halal_tier,
          certifying_body: initialProductData.certifying_body || prev.certifying_body,
          ingredients_summary: initialProductData.ingredients_summary || prev.ingredients_summary,
        }));
      }
    }
  }, [isOpen, initialTab, initialProductData]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file, { maxSizeMB: 10 });
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMessage('');

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${type}/${Date.now()}_${cleanFileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(data.path);

      const url = publicUrlData?.publicUrl || '';

      if (type === 'certificates') {
        setEstForm((prev) => ({ ...prev, certificate_url: url }));
      } else if (type === 'logos') {
        setEstForm((prev) => ({ ...prev, logo_url: url }));
      } else if (type === 'products') {
        setProdForm((prev) => ({ ...prev, image_url: url }));
      }
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMessage('Failed to upload file to storage. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEstablishmentSubmit = async (e, overrideProductNames) => {
    e.preventDefault();
    if (!estForm.name.trim()) {
      setErrorMessage('Establishment name is required.');
      return;
    }
    if (!estForm.address.trim()) {
      setErrorMessage('Address in Zamboanga City is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const rawAmenities = Array.isArray(estForm.amenities) ? estForm.amenities : [];
      const amenities = cleanAmenities(rawAmenities);

      const rawProductNames = overrideProductNames !== undefined ? overrideProductNames : estForm.product_names;
      const parsedProductNames = rawProductNames
        ? (typeof rawProductNames === 'string' ? rawProductNames.split(',') : rawProductNames)
            .map((s) => String(s).trim())
            .filter(Boolean)
        : [];

      const descParts = [];
      if (estForm.halal_tier && estForm.halal_tier !== 'halal_certified') {
        descParts.push(`[Tier: ${estForm.halal_tier}]`);
      }
      if (amenities.length > 0) {
        descParts.push(`Amenities: ${amenities.join(' • ')}`);
      }
      if (parsedProductNames.length > 0) {
        descParts.push(`Dishes: ${parsedProductNames.join(', ')}`);
      }
      const fullDescription = descParts.length > 0 ? descParts.join(' | ') : null;

      const parsedAddr = parseZamboangaAddress(estForm.address || '');
      const cleanStreet = estForm.street !== undefined ? estForm.street : parsedAddr.street;
      const cleanBarangay = estForm.barangay !== undefined ? estForm.barangay : parsedAddr.barangay;
      const cleanCity = estForm.city || 'Zamboanga City';
      const cleanAddress = formatZamboangaAddress(cleanStreet, cleanBarangay, cleanCity);
      const resolvedCoords =
        estForm.latitude && estForm.longitude
          ? { latitude: estForm.latitude, longitude: estForm.longitude }
          : await geocodeZamboangaAddress(cleanAddress, cleanCity, cleanBarangay);

      const payload = {
        name: estForm.name.trim(),
        type: estForm.type,
        address: cleanAddress,
        city: cleanCity,
        latitude: resolvedCoords.latitude,
        longitude: resolvedCoords.longitude,
        halal_tier: estForm.halal_tier || 'halal_certified',
        contact_number: estForm.contact_number?.trim() || null,
        social_media_url: normalizeWebLink(estForm.social_media_url),
        submitter_role: estForm.submitter_role || 'community',
        certificate_number: estForm.certificate_number?.trim() || null,
        expiry_date: estForm.expiry_date || null,
        certificate_url: estForm.certificate_url || null,
        logo_url: estForm.logo_url || null,
        amenities: amenities,
        product_names: parsedProductNames,
        menu_highlights: parsedProductNames,
        description: fullDescription,
      };
      let success = false;

      // 1. Try Backend API
      try {
        const response = await authFetch(`${API_BASE_URL}/establishments/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const resJson = await response.json();
          setSubmissionResult(resJson);
          success = true;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('Backend establishment submission error:', response.status, errData);
          if (response.status === 401) {
            throw new Error('Your session has expired or authentication is required. Please log in again.');
          }
          if (errData?.detail) {
            throw new Error(errData.detail);
          }
        }
      } catch (apiErr) {
        if (apiErr.message && !apiErr.message.toLowerCase().includes('fetch')) {
          throw apiErr;
        }
        console.warn('Backend submission endpoint unavailable, falling back to direct Supabase:', apiErr);
      }

      if (!success) {
        throw new Error('The verification service is unavailable. Please try again in a moment.');
      }

      setIsSuccess(true);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      onSubmitted?.();
    } catch (err) {
      console.error('Establishment submission error:', err);
      setErrorMessage(err.message || 'Submission failed. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        name: prodForm.name.trim(),
        brand: prodForm.brand?.trim() || null,
        category: prodForm.category,
        barcode: prodForm.barcode?.trim() || null,
        halal_tier: prodForm.halal_tier || 'halal_certified',
        submitter_role: prodForm.submitter_role || 'consumer',
        certifying_body: prodForm.certifying_body || null,
        certificate_no: prodForm.certificate_no?.trim() || null,
        expiry_date: prodForm.expiry_date || null,
        image_url: prodForm.image_url || null,
        ingredients_summary: prodForm.ingredients_summary?.trim() || null,
      };

      let success = false;

      // 1. Try Backend API
      try {
        const response = await authFetch(`${API_BASE_URL}/products/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const resJson = await response.json();
          setSubmissionResult(resJson);
          success = true;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('Backend product submission error:', response.status, errData);
          if (response.status === 401) {
            throw new Error('Your session has expired or authentication is required. Please log in again.');
          }
          if (errData?.detail) {
            throw new Error(errData.detail);
          }
        }
      } catch (apiErr) {
        if (apiErr.message && !apiErr.message.toLowerCase().includes('fetch')) {
          throw apiErr;
        }
        console.warn('Backend submission endpoint unavailable, falling back to direct Supabase:', apiErr);
      }

      if (!success) {
        throw new Error('The verification service is unavailable. Please try again in a moment.');
      }

      setIsSuccess(true);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      onSubmitted?.();
    } catch (err) {
      console.error('Product submission error:', err);
      setErrorMessage(err.message || 'Submission failed. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSubmissionResult(null);
    setErrorMessage('');
    setEstForm({
      name: '',
      type: 'Restaurant',
      address: '',
      city: 'Zamboanga City',
      halal_tier: 'halal_certified',
      contact_number: '',
      social_media_url: '',
      submitter_role: 'community',
      certificate_number: '',
      expiry_date: '',
      certificate_url: '',
      logo_url: '',
      product_names: '',
      amenities: [],
      latitude: null,
      longitude: null,
    });
    setProdForm({
      name: '',
      brand: '',
      category: 'Food & Beverage',
      barcode: '',
      halal_tier: 'halal_certified',
      submitter_role: 'consumer',
      certifying_body: '',
      certificate_no: '',
      expiry_date: '',
      image_url: '',
      ingredients_summary: '',
    });
  };

  const handleClose = () => {
    if (isSuccess) {
      handleReset();
    }
    onClose?.();
  };

  const isAutoApproved = Boolean(submissionResult?.auto_approved);
  const submittedItemName = submissionResult?.data?.name || (activeTab === 'establishment' ? estForm.name : prodForm.name);
  const currentTierKey = submissionResult?.audit_trail?.halal_tier || (activeTab === 'establishment' ? estForm.halal_tier : prodForm.halal_tier);
  const tierBadge = getTierBadgeInfo(currentTierKey);
  const auditNotes = submissionResult?.audit_trail?.notes || [];
  const reviewReasons = submissionResult?.audit_trail?.reasons || [];

  const displayHighlights = auditNotes
    .filter(
      (note) =>
        !note.startsWith('Consumer Contribution:') &&
        !note.startsWith('Brand Declaration:') &&
        !note.startsWith('Ownership Declaration:') &&
        !note.startsWith('Classification Tier:') &&
        !note.startsWith('Duplicate alert:')
    )
    .map(cleanHighlightNote)
    .filter(Boolean);

  const notableReasons = reviewReasons
    .filter((reason) => !isOptionalFieldNotice(reason, currentTierKey))
    .map(cleanReasonText)
    .filter(Boolean);

  const nextStepMessage = isAutoApproved
    ? 'Published live to the public registry.'
    : currentTierKey === 'halal_certified'
      ? 'Pending Halal Certifying Body credential verification by Admin.'
      : 'Pending administrative moderation before public listing.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuccess ? '' : 'Contribute to Halal Registry'}
      description={
        isSuccess
          ? ''
          : 'Submit a local Zamboanga dining spot or packaged product for administrative halal verification.'
      }
      size={isSuccess ? 'md' : 'contribution'}
      compactOnMobile
    >
      {isSuccess ? (
        <div className="pt-0.5 text-center space-y-3">
          {/* Status Icon */}
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            {isAutoApproved ? (
              <Sparkles size={22} className="text-emerald-600" />
            ) : (
              <CheckCircle2 size={22} className="text-emerald-600" />
            )}
          </div>

          {/* Status Pill & Headings */}
          <div className="space-y-1">
            <div>
              {isAutoApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instant Verified &amp; Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
                  <Clock size={12} className="text-amber-600" />
                  Queued for Admin Review
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {isAutoApproved ? 'Verified & Published Live!' : 'Submission Received!'}
            </h3>

            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {isAutoApproved
                ? 'Your submission passed automated verification checks and has been published immediately to the public directory.'
                : 'Thank you for contributing! Your submission has been saved and scheduled for administrative verification.'}
            </p>
          </div>

          {/* Submission Receipt Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left space-y-2.5 shadow-2xs">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Submitted Entry</p>
                <h4 className="font-bold text-slate-800 text-sm truncate">
                  {submittedItemName || 'New Contribution'}
                </h4>
              </div>
              {tierBadge && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${tierBadge.color}`}>
                  {tierBadge.label}
                </span>
              )}
            </div>

            {/* Automated Pre-Check Summary */}
            {displayHighlights.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isAutoApproved ? 'Verification Highlights' : 'Automated Pre-Check Summary'}
                </p>
                <ul className="space-y-1">
                  {displayHighlights.slice(0, 4).map((note, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold leading-none mt-0.5">✓</span>
                      <span className="leading-snug">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notable Auditor Review Notices (if any blocking reason triggered) */}
            {!isAutoApproved && notableReasons.length > 0 && (
              <div className={`space-y-1 ${displayHighlights.length > 0 ? 'pt-2 border-t border-slate-200/60' : ''}`}>
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Auditor Review Notes</p>
                <ul className="space-y-1">
                  {notableReasons.slice(0, 3).map((reason, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span className="leading-snug">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tier-appropriate next step footer */}
            <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex items-center gap-1.5">
              {isAutoApproved ? (
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
              ) : (
                <Clock size={12} className="text-amber-500 shrink-0" />
              )}
              <span>{nextStepMessage}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white pt-1.5 pb-0.5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-2xs cursor-pointer"
            >
              Submit Another
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-700/20 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('establishment');
                setErrorMessage('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'establishment'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 size={16} />
              <span>Halal Establishment</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('product');
                setErrorMessage('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'product'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package size={16} />
              <span>Packaged Product</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sub-form components */}
          {activeTab === 'establishment' ? (
            <EstablishmentContributionForm
              estForm={estForm}
              setEstForm={setEstForm}
              onSubmit={handleEstablishmentSubmit}
              submitting={submitting}
              uploadingImage={uploadingImage}
              onFileUpload={handleFileUpload}
              onCancel={onClose}
            />
          ) : (
            <ProductContributionForm
              prodForm={prodForm}
              setProdForm={setProdForm}
              onSubmit={handleProductSubmit}
              submitting={submitting}
              uploadingImage={uploadingImage}
              onFileUpload={handleFileUpload}
              onCancel={onClose}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
