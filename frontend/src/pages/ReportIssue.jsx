import { useState, useEffect, useMemo } from 'react';
import { Flag, ScanSearch, FileText, Store, CheckCircle, Upload, X, FileImage, ShieldCheck } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../utils/api';
import { validateUploadFile } from '../utils/security';
import { getCategoriesForTarget } from '../components/reports/ReportIssueModal';

export const ReportIssue = ({ userRole, onViewChange, initialParams = {} }) => {
    const [submitted, setSubmitted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [declarationAccepted, setDeclarationAccepted] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const [form, setForm] = useState(() => ({
        issueType: initialParams?.issueType || '',
        relatedTo: initialParams?.relatedTo || 'product',
        name: initialParams?.subjectName || initialParams?.name || '',
        description: initialParams?.description || '',
        evidenceUrl: initialParams?.evidenceUrl || '',
        productId: initialParams?.productId || initialParams?.product_id || null,
        establishmentId: initialParams?.establishmentId || initialParams?.establishment_id || null,
    }));

    const availableCategories = useMemo(() => {
        const mappedTarget = form.relatedTo === 'logo' ? 'scanner' : form.relatedTo;
        return getCategoriesForTarget(mappedTarget);
    }, [form.relatedTo]);

    useEffect(() => {
        if (!form.issueType || !availableCategories.includes(form.issueType)) {
            setForm(prev => ({ ...prev, issueType: availableCategories[0] || 'Other' }));
        }
    }, [availableCategories, form.issueType]);

    useEffect(() => {
        if (initialParams && Object.keys(initialParams).length > 0) {
            setForm(prev => ({
                ...prev,
                issueType: initialParams.issueType || prev.issueType,
                relatedTo: initialParams.relatedTo || prev.relatedTo,
                name: initialParams.subjectName || initialParams.name || prev.name,
                description: initialParams.description || prev.description,
                evidenceUrl: initialParams.evidenceUrl || prev.evidenceUrl,
                productId: initialParams.productId || initialParams.product_id || prev.productId,
                establishmentId: initialParams.establishmentId || initialParams.establishment_id || prev.establishmentId,
            }));
        }
    }, [initialParams]);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateUploadFile(file, { maxSizeMB: 10 });
        if (!validation.valid) {
            setToast({
                visible: true,
                message: validation.error,
                type: 'error',
            });
            return;
        }

        try {
            setUploadingImage(true);
            const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const filePath = `reports/${Date.now()}_${cleanName}`;

            const { data, error } = await supabase.storage
                .from('submissions')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('submissions')
                .getPublicUrl(data.path);

            handleChange('evidenceUrl', publicUrlData?.publicUrl || '');
        } catch (err) {
            console.error('Evidence upload error:', err);
            setToast({
                visible: true,
                message: 'Failed to upload photo proof. Please try again.',
                type: 'error',
            });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanDesc = form.description.trim();
        if (cleanDesc.length < 20) {
            setToast({
                visible: true,
                message: 'Please provide at least 20 characters in the description explaining the issue.',
                type: 'error',
            });
            return;
        }
        if (!declarationAccepted) {
            setToast({
                visible: true,
                message: 'Please check the declaration confirming the honesty of your report.',
                type: 'error',
            });
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmSubmission = async () => {
        try {
            setIsSubmitting(true);

            const payload = {
                issue_type: form.issueType,
                related_to: form.relatedTo === 'logo' ? 'scanner' : form.relatedTo,
                subject_name: form.name.trim() || 'General Community Report',
                description: form.description.trim(),
                evidence_url: form.evidenceUrl || null,
                product_id: form.productId || null,
                establishment_id: form.establishmentId || null,
            };

            let success = false;
            try {
                const response = await authFetch(`${API_BASE_URL}/reports/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    success = true;
                }
            } catch (apiErr) {
                console.warn('Backend reporting API unavailable, falling back to direct Supabase:', apiErr);
            }

            if (!success) {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;
                if (!userId) throw new Error('You must be logged in to submit a report.');

                const { error: sbErr } = await supabase.from('issue_reports').insert({
                    user_id: userId,
                    issue_type: payload.issue_type,
                    related_to: payload.related_to,
                    subject_name: payload.subject_name,
                    description: payload.description,
                    evidence_url: payload.evidence_url,
                    product_id: payload.product_id,
                    establishment_id: payload.establishment_id,
                    status: 'open',
                });

                if (sbErr) throw sbErr;
            }

            setSubmitted(true);
            setShowConfirmModal(false);
            setToast({
                visible: true,
                message: 'Report submitted successfully. Thank you for protecting halal integrity.',
                type: 'success',
            });
        } catch (err) {
            console.error('Submission failed:', err);
            setToast({
                visible: true,
                message: err.message || 'Failed to submit report. Please check your connection.',
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                    <CheckCircle size={36} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">Report Registered</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Your report for <span className="font-semibold text-slate-800">{form.name}</span> has been securely queued for administrative review. Thank you for safeguarding Zamboanga City halal standards.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-xs">
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setDeclarationAccepted(false);
                            setForm({
                                issueType: availableCategories[0] || '',
                                relatedTo: 'product',
                                name: '',
                                description: '',
                                evidenceUrl: '',
                                productId: null,
                                establishmentId: null,
                            });
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Report Another Issue
                    </button>
                    {onViewChange && (
                        <button
                            onClick={() => onViewChange('home')}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 font-bold text-xs sm:text-sm text-white hover:bg-emerald-700 transition cursor-pointer"
                        >
                            Return to Home
                        </button>
                    )}
                </div>

                <Toast
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ visible: false, message: '', type: 'info' })}
                />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">Report an Issue</h1>
                <p className="text-xs sm:text-sm text-slate-500">Flag incorrect scanner results, non-compliant venues, or database inaccuracies for administrative audit under Zamboanga Ordinance No. 489.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                    {(initialParams?.subjectName || initialParams?.name) && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
                            <span>Pre-filled with details from your recent selection. You can review or adjust anything before submitting.</span>
                            <span className="text-[10px] font-bold uppercase bg-emerald-100 px-2 py-0.5 rounded text-emerald-700 shrink-0">Auto-Linked</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2 sm:mb-3">
                            This issue is related to
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                            {[
                                { value: 'product', label: 'Packaged Product', icon: <ScanSearch size={18} /> },
                                { value: 'establishment', label: 'Establishment', icon: <Store size={18} /> },
                                { value: 'logo', label: 'Scanner / Logo', icon: <FileText size={18} /> },
                            ].map(opt => (
                                <button
                                    type="button"
                                    key={opt.value}
                                    onClick={() => handleChange('relatedTo', opt.value)}
                                    className={`flex flex-row sm:flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                                        form.relatedTo === opt.value
                                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/10'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1.5 sm:mb-2">
                            Issue Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={form.issueType}
                            onChange={e => handleChange('issueType', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                        >
                            {availableCategories.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1.5 sm:mb-2">
                            {form.relatedTo === 'establishment' ? 'Establishment Name' : 'Product / Brand Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder={form.relatedTo === 'establishment' ? 'e.g. Al-Madina Eatery' : 'e.g. Nestlé KitKat'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition font-medium"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-[10px] font-semibold ${form.description.trim().length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {form.description.trim().length} / 20 min chars
                            </span>
                        </div>
                        <textarea
                            required
                            value={form.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="Describe the discrepancy clearly (minimum 20 characters). What did you observe? What information needs correction?"
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1.5 sm:mb-2">
                            Attach Photo Proof (Packaging, Receipt, or Certificate)
                        </label>
                        <div className="rounded-xl border-2 border-dashed border-slate-200 p-3.5 text-center hover:border-emerald-500 transition bg-slate-50/50">
                            {form.evidenceUrl ? (
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                                    <div className="flex items-center gap-2 truncate">
                                        <FileImage size={18} className="text-emerald-600 shrink-0" />
                                        <span className="text-xs text-emerald-900 font-medium truncate">Proof Photo Attached</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('evidenceUrl', '')}
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

                    <button
                        type="submit"
                        disabled={isSubmitting || form.description.trim().length < 20 || !declarationAccepted}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 sm:py-3.5 font-bold text-xs sm:text-sm text-white tracking-wide transition hover:bg-emerald-700 active:scale-[0.98] duration-150 shadow-md shadow-emerald-600/10 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Flag size={16} /> {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>

                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-600 shrink-0" /> Why Report?
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Your reports directly protect HalalVerify's authenticity and compliance in Zamboanga City. Each submission is carefully reviewed by administrators before any directory modifications are made.
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-2">
                        <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Report Scope Guidelines</h5>
                        <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                            <li>Report expired or fraudulent certificates</li>
                            <li>Report permanently closed or relocated venues</li>
                            <li>Report non-halal ingredients or cross-contamination</li>
                            <li>Do not use for personal disputes or food taste complaints</li>
                        </ul>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Confirm Report Submission"
                description="Are you sure you want to submit this compliance report for administrative investigation?"
            >
                <div className="space-y-4 pt-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Target:</span>
                            <span className="font-bold text-slate-800">{form.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Category:</span>
                            <span className="font-bold text-amber-700">{form.issueType}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowConfirmModal(false)}
                            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs sm:text-sm transition cursor-pointer"
                        >
                            Review Details
                        </button>
                        <button
                            type="button"
                            onClick={confirmSubmission}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs sm:text-sm text-white transition cursor-pointer"
                        >
                            {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ visible: false, message: '', type: 'info' })}
            />
        </div>
    );
};

export default ReportIssue;
