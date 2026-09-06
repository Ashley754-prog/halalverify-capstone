import React, { useState, useEffect } from 'react';
import {
  Flag,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Loader2,
  X,
  FileImage,
  ShieldAlert,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../../utils/api';

const VIOLATION_CATEGORIES = [
  'Expired Certificate',
  'Fraudulent / Unaccredited Logo',
  'Prohibited / Haram Ingredients Detected',
  'Establishment Status / Address Incorrect',
  'Wrong Verdict (Scanner Error)',
  'Suspected Cross-Contamination',
  'Other Concern',
];

export default function ReportIssueModal({
  isOpen,
  onClose,
  initialData = {}, // { relatedTo, subjectName, productId, establishmentId }
  onSubmitted,
}) {
  const [issueType, setIssueType] = useState(VIOLATION_CATEGORIES[0]);
  const [relatedTo, setRelatedTo] = useState(initialData.relatedTo || 'product');
  const [subjectName, setSubjectName] = useState(initialData.subjectName || '');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRelatedTo(initialData.relatedTo || 'product');
      setSubjectName(initialData.subjectName || '');
      setIssueType(VIOLATION_CATEGORIES[0]);
      setDescription('');
      setEvidenceUrl('');
      setErrorMessage('');
      setIsSuccess(false);
    }
  }, [isOpen, initialData]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid image (PNG, JPG, WEBP) or PDF document.');
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
    if (!description.trim()) {
      setErrorMessage('Please provide a brief description of the issue.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        issue_type: issueType,
        related_to: relatedTo,
        subject_name: subjectName.trim() || 'General Community Report',
        product_id: initialData.productId || null,
        establishment_id: initialData.establishmentId || null,
        description: description.trim(),
        evidence_url: evidenceUrl || null,
      };

      let success = false;

      // 1. Try Backend API
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
      title={isSuccess ? '' : 'Report Non-Compliance or Issue'}
      description={
        isSuccess
          ? ''
          : 'Flag discrepancies, counterfeit logos, or expired certificates for administrative audit in Zamboanga City.'
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
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition"
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
          {subjectName && (
            <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-amber-600 shrink-0" />
              <div className="truncate">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  Reporting {relatedTo === 'establishment' ? 'Establishment' : 'Product'}
                </p>
                <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{subjectName}</p>
              </div>
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
            >
              {VIOLATION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* If no subject pre-filled, allow entering name */}
          {!subjectName && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Establishment or Product Name
              </label>
              <input
                type="text"
                placeholder="e.g., Al-Madina Eatery or Brand Name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Detailed Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description of Discrepancy <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide details about what you observed (e.g., expired certificate date, unaccredited seal, non-compliant additive)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Attach Photo Proof (Packaging, Receipt, or Certificate)
            </label>
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-3.5 text-center hover:border-emerald-500 transition">
              {evidenceUrl ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 truncate">
                    <FileImage size={18} className="text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-900 font-medium truncate">Proof Photo Attached</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceUrl('')}
                    className="text-slate-400 hover:text-red-500 p-1"
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

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-700/20 disabled:opacity-50 transition"
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
