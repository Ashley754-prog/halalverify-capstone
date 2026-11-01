import { useState, useEffect, useMemo } from 'react';
import {
  Flag,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Loader2,
  X,
  FileImage,
  Store,
  Package,
  ScanSearch,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { validateUploadFile } from '../../utils/security';

export const CATEGORIES_BY_TARGET = {
  establishment_certified: [
    'Expired, Fake, or Questionable Halal Certificate',
    'Permanently Closed or Relocated',
    'Incorrect Address, Map Pin, or Phone',
    'Pork or Alcohol Detected on Premises',
    'Suspected Cross-Contamination or Storage Issue',
    'Duplicate Establishment Listing',
    'Other Listing or Operational Issue',
  ],
  establishment_community: [
    'Permanently Closed or Relocated',
    'Incorrect Address, Map Pin, or Phone',
    'Pork or Alcohol Detected on Premises',
    'Suspected Cross-Contamination or Storage Issue',
    'Misleading Halal / Muslim-Friendly Claim',
    'Duplicate Establishment Listing',
    'Other Listing or Operational Issue',
  ],
  product: [
    'Prohibited or Non-Halal Ingredient / E-Number Detected',
    'Counterfeit or Unaccredited Halal Seal',
    'Incorrect Product Details or Ingredients List',
    'Product Discontinued or Recalled',
    'Duplicate Product Listing',
    'Other Product Discrepancy',
  ],
  scanner: [
    'Safe Ingredient Falsely Flagged as Haram',
    'Haram Ingredient Missed by Scanner',
    'Text Recognition / Image Crop Failure',
    'Other Scanner Issue',
  ],
};

export function getCategoriesForTarget(relatedTo, halalTier) {
  if (relatedTo === 'product') return CATEGORIES_BY_TARGET.product;
  if (relatedTo === 'scanner') return CATEGORIES_BY_TARGET.scanner;
  const tierLower = String(halalTier || '').toLowerCase();
  const isCertified = tierLower.includes('cert') || tierLower === 'halal_certified' || tierLower === 'certified';
  return isCertified ? CATEGORIES_BY_TARGET.establishment_certified : CATEGORIES_BY_TARGET.establishment_community;
}

export default function ReportIssueModal({
  isOpen,
  onClose,
  initialData = {},
  onSubmitted,
  onSuccess,
}) {
  const resolvedRelatedTo = initialData.relatedTo || initialData.related_to || 'establishment';
  const resolvedSubjectName =
    initialData.subjectName ||
    initialData.subject_name ||
    initialData.establishment_name ||
    initialData.product_name ||
    initialData.name ||
    '';
  const resolvedEstablishmentId = initialData.establishmentId || initialData.establishment_id || null;
  const resolvedProductId = initialData.productId || initialData.product_id || null;
  const resolvedHalalTier = initialData.halalTier || initialData.halal_tier || initialData.halal_status || initialData.tier || '';

  const [relatedTo, setRelatedTo] = useState(resolvedRelatedTo);
  const [subjectName, setSubjectName] = useState(resolvedSubjectName);
  const [establishmentId, setEstablishmentId] = useState(resolvedEstablishmentId);
  const [productId, setProductId] = useState(resolvedProductId);
  const [halalTier, setHalalTier] = useState(resolvedHalalTier);

  const availableCategories = useMemo(
    () => getCategoriesForTarget(relatedTo, halalTier),
    [relatedTo, halalTier]
  );

  const [issueType, setIssueType] = useState(availableCategories[0] || 'Other Issue');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const rel = initialData.relatedTo || initialData.related_to || 'establishment';
      const name =
        initialData.subjectName ||
        initialData.subject_name ||
        initialData.establishment_name ||
        initialData.product_name ||
        initialData.name ||
        '';
      const estId = initialData.establishmentId || initialData.establishment_id || null;
      const prodId = initialData.productId || initialData.product_id || null;
      const tier = initialData.halalTier || initialData.halal_tier || initialData.halal_status || initialData.tier || '';

      setRelatedTo(rel);
      setSubjectName(name);
      setEstablishmentId(estId);
      setProductId(prodId);
      setHalalTier(tier);

      const cats = getCategoriesForTarget(rel, tier);
      setIssueType(cats[0] || 'Other Issue');
      setDescription('');
      setEvidenceUrl('');
      setDeclarationAccepted(false);
      setErrorMessage('');
      setIsSuccess(false);
    }
  }, [isOpen, initialData]);

  const handleFileUpload = async (e) => {
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
      const filePath = `reports/${Date.now()}_${cleanFileName}`;

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

      setEvidenceUrl(publicUrlData?.publicUrl || '');
    } catch (err) {
      console.error('Evidence upload error:', err);
      setErrorMessage('Failed to upload proof image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanDesc = description.trim();
    if (cleanDesc.length < 20) {
      setErrorMessage('Please provide a descriptive explanation (minimum 20 characters) to help administrators investigate.');
      return;
    }

    if (!declarationAccepted) {
      setErrorMessage('Please confirm the honesty declaration before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        issue_type: issueType,
        related_to: relatedTo,
        subject_name: subjectName.trim() || 'General Community Report',
        product_id: productId || null,
        establishment_id: establishmentId || null,
        description: cleanDesc,
        evidence_url: evidenceUrl || null,
      };

      let success = false;

      // 1. Backend REST Endpoint
      try {
        const response = await authFetch(`${API_BASE_URL}/reports/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          success = true;
        }
      } catch (apiErr) {
        console.warn('Backend reporting endpoint unavailable, falling back to direct Supabase:', apiErr);
      }

      // 2. Direct Supabase Fallback
      if (!success) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error('Authentication required to submit a report.');
        }

        const { error: sbErr } = await supabase.from('issue_reports').insert({
          user_id: userId,
          issue_type: payload.issue_type,
          related_to: payload.related_to,
          subject_name: payload.subject_name,
          product_id: payload.product_id,
          establishment_id: payload.establishment_id,
          evidence_url: payload.evidence_url,
          description: payload.description,
          status: 'open',
        });

        if (sbErr) throw sbErr;
      }

      setIsSuccess(true);
      onSubmitted?.();
      onSuccess?.();
    } catch (err) {
      console.error('Report submission error:', err);
      setErrorMessage(err.message || 'Failed to submit report. Please check your network.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuccess ? '' : 'Report Issue or Discrepancy'}
      description={
        isSuccess
          ? ''
          : 'Flag compliance concerns, closures, or incorrect information for administrative audit under Zamboanga Ordinance No. 489.'
      }
      size="md"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Report Logged Successfully</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your report has been securely registered and queued for administrative compliance review. Thank you for protecting the halal integrity of Zamboanga City!
            </p>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Context Item Header */}
          {subjectName ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 text-emerald-700">
                  {relatedTo === 'product' ? (
                    <Package size={16} />
                  ) : relatedTo === 'scanner' ? (
                    <ScanSearch size={16} />
                  ) : (
                    <Store size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Reporting {relatedTo === 'product' ? 'Product' : relatedTo === 'scanner' ? 'Scanner Verdict' : 'Establishment'}
                  </p>
                  <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                    {subjectName}
                  </p>
                </div>
              </div>

              {halalTier && (
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300/60">
                  {halalTier.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Establishment or Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Al-Madina Eatery or Brand Name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          )}

          {/* Violation Category Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Violation / Issue Category <span className="text-red-500">*</span>
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 bg-white font-medium text-slate-800 cursor-pointer"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Description of Discrepancy <span className="text-red-500">*</span>
              </label>
              <span className={`text-[10px] font-semibold ${description.trim().length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {description.trim().length} / 20 min chars
              </span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Provide clear factual details (minimum 20 characters) about what you observed (e.g. venue permanently closed, alcohol served on site, incorrect address)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 resize-none text-xs sm:text-sm"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Attach Photo Proof <span className="text-slate-400 font-normal">(Recommended)</span>
            </label>
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-3.5 text-center hover:border-emerald-500 transition bg-slate-50/50">
              {evidenceUrl ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 truncate">
                    <FileImage size={18} className="text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-900 font-medium truncate">Proof Photo Attached</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceUrl('')}
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                    title="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <Upload size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-emerald-600 hover:underline">
                    {uploadingImage ? 'Uploading photo...' : 'Click to take or upload photo evidence'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={uploadingImage}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Truthfulness Declaration Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="leading-tight">
                I declare in good faith that this report reflects truthful observations regarding halal integrity or listing accuracy under Zamboanga Ordinance No. 489.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage || description.trim().length < 20 || !declarationAccepted}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
              <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
