import { useState } from 'react';
import {
  Building2,
  Package,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { validateUploadFile } from '../../utils/security';
import EstablishmentContributionForm from './EstablishmentContributionForm';
import ProductContributionForm from './ProductContributionForm';

function cleanReasonText(text) {
  if (!text) return '';
  return text
    .replace(/^Needs manual review:\s*/i, '')
    .replace(/^Potential duplicate listing detected\s*/i, 'Potential duplicate: ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
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
    halal_tier: 'halal_certified',
    contact_number: '',
    social_media_url: '',
    submitter_role: 'community',
    certificate_number: '',
    expiry_date: '',
    certificate_url: '',
    logo_url: '',
    product_names: '',
  });

  // Form state for product
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: '',
    category: 'Food & Beverage',
    barcode: '',
    halal_tier: 'halal_certified',
    submitter_role: 'consumer',
    certificate_no: '',
    expiry_date: '',
    image_url: '',
    ingredients_summary: '',
  });

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

  const handleEstablishmentSubmit = async (e) => {
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

      const payload = {
        name: estForm.name.trim(),
        type: estForm.type,
        address: estForm.address.trim(),
        city: estForm.city || 'Zamboanga City',
        halal_tier: estForm.halal_tier || 'halal_certified',
        contact_number: estForm.contact_number?.trim() || null,
        social_media_url: estForm.social_media_url?.trim() || null,
        submitter_role: estForm.submitter_role || 'community',
        certificate_number: estForm.certificate_number?.trim() || null,
        expiry_date: estForm.expiry_date || null,
        certificate_url: estForm.certificate_url || null,
        logo_url: estForm.logo_url || null,
        product_names: estForm.product_names
          ? estForm.product_names.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
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

      // 2. Direct Supabase Fallback
      if (!success) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error('You must be logged in to submit an establishment.');
        }

        const fallbackStatus = payload.halal_tier === 'halal_certified' 
          ? 'PENDING_VERIFICATION' 
          : 'community_listed';

        const { error: sbErr } = await supabase.from('establishments').insert({
          name: payload.name,
          type: payload.type,
          address: payload.address,
          city: payload.city,
          phone: payload.contact_number,
          source_url: payload.social_media_url,
          certificate_number: payload.certificate_number,
          expiry_date: payload.expiry_date,
          certificate_url: payload.certificate_url,
          logo_url: payload.logo_url,
          halal_status: fallbackStatus,
          submitted_by: userId,
          source: payload.submitter_role === 'owner' ? 'Business Owner Submission' : 'Community User Submission',
        });

        if (sbErr) throw sbErr;
      }

      setIsSuccess(true);
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

      // 2. Direct Supabase Fallback
      if (!success) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error('You must be logged in to submit a product.');
        }

        const fallbackStatus = payload.halal_tier === 'halal_certified' ? 'PENDING_VERIFICATION' : 'COMMUNITY_LISTED';

        const { error: sbErr } = await supabase.from('products').insert({
          name: payload.name,
          brand: payload.brand,
          category: payload.category,
          barcode: payload.barcode,
          certificate_no: payload.certificate_no,
          expiry_date: payload.expiry_date,
          image_url: payload.image_url,
          ingredients_summary: payload.ingredients_summary,
          status: fallbackStatus,
          submitted_by: userId,
          source: payload.submitter_role === 'brand' ? 'Brand Representative Submission' : 'Community User Submission',
        });

        if (sbErr) throw sbErr;
      }

      setIsSuccess(true);
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
    });
    setProdForm({
      name: '',
      brand: '',
      category: 'Food & Beverage',
      barcode: '',
      halal_tier: 'halal_certified',
      submitter_role: 'consumer',
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
  const score = submissionResult?.audit_trail?.score;
  const auditNotes = submissionResult?.audit_trail?.notes || [];
  const reviewReasons = submissionResult?.audit_trail?.reasons || [];

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
      size={isSuccess ? 'md' : 'lg'}
    >
      {isSuccess ? (
        <div className="py-2 text-center space-y-4">
          {/* Status Icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            {isAutoApproved ? (
              <Sparkles size={28} className="text-emerald-600" />
            ) : (
              <CheckCircle2 size={28} className="text-emerald-600" />
            )}
          </div>

          {/* Status Pill & Headings */}
          <div className="space-y-1.5">
            <div>
              {isAutoApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instant Verified &amp; Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
                  <Clock size={12} className="text-amber-600" />
                  Queued for Auditor Review
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAutoApproved ? 'Verified & Published Live!' : 'Submission Received!'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {isAutoApproved
                ? 'Your submission passed automated verification checks and has been published immediately to the public directory.'
                : 'Thank you for contributing! Your submission has been saved and scheduled for administrative verification.'}
            </p>
          </div>

          {/* Submission Receipt Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left space-y-3 shadow-2xs">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
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

            {/* Score line */}
            {score !== undefined && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className={isAutoApproved ? 'text-emerald-600' : 'text-slate-400'} />
                  Verification Score
                </span>
                <span className="font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                  {score} / 100
                </span>
              </div>
            )}

            {/* Verification checklist or notes */}
            {isAutoApproved ? (
              auditNotes.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Verification Highlights</p>
                  <ul className="space-y-1">
                    {auditNotes.slice(0, 3).map((note, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold leading-none mt-0.5">✓</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : reviewReasons.length > 0 ? (
              <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Auditor Review Checklist</p>
                <ul className="space-y-1.5">
                  {reviewReasons.map((reason, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span className="leading-snug">{cleanReasonText(reason)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-200/60 text-xs text-slate-500 flex items-center gap-2">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <span>Auditors regularly review submissions within 24–48 hours.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-center gap-3">
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
