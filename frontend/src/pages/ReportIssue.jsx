import React, { useState } from 'react';
import { Flag, ScanSearch, FileText, Store, CheckCircle, Upload, X, FileImage, AlertTriangle } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../utils/api';

const ISSUE_TYPES = [
    'Wrong Verdict (Scanner Error)',
    'Suspicious / Counterfeit Logo',
    'Missing Halal Logo Not Detected',
    'Ingredient Incorrectly Flagged',
    'Establishment Status Incorrect',
    'Other',
];

export const ReportIssue = ({ userRole, onViewChange }) => {
    const [submitted, setSubmitted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [form, setForm] = useState({
        issueType: '',
        relatedTo: 'product',
        name: '',
        description: '',
        evidenceUrl: '',
    });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
        setShowConfirmModal(true);
    };

    const confirmSubmission = async () => {
        try {
            setIsSubmitting(true);

            let success = false;
            try {
                const response = await authFetch(`${API_BASE_URL}/reports/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        issue_type: form.issueType,
                        related_to: form.relatedTo,
                        subject_name: form.name,
                        description: form.description,
                        evidence_url: form.evidenceUrl || null,
                    }),
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
                    issue_type: form.issueType,
                    related_to: form.relatedTo,
                    subject_name: form.name,
                    description: form.description,
                    evidence_url: form.evidenceUrl || null,
                    status: 'open',
                });

                if (sbErr) throw sbErr;
            }

            setSubmitted(true);
            setShowConfirmModal(false);
            setToast({
                visible: true,
                message: 'Report submitted successfully. Thank you for helping protect HalalVerify.',
                type: 'success',
            });
        } catch (error) {
            console.error(error);
            setToast({
                visible: true,
                message: error.message || 'Could not submit report. Please check your connection.',
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSubmitted(false);
        setForm({ issueType: '', relatedTo: 'product', name: '', description: '', evidenceUrl: '' });
        setToast({ visible: false, message: '', type: 'info' });
    };

    if (!userRole) {
        return (
            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1">
                <Topbar title="Report an Issue" subtitle="Help us improve HalalVerify's accuracy." />
                <div className="max-w-lg mx-auto mt-6 sm:mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-100 flex items-center justify-center">
                        <Flag size={28} className="text-amber-600 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Account Required</h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                        To maintain report integrity and prevent abuse, submitting verification discrepancies or data reports requires signing in to your HalalVerify account.
                    </p>
                    <button
                        onClick={() => onViewChange?.('login')}
                        className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition shadow-sm"
                    >
                        Sign In / Register
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1">
                <Topbar title="Report an Issue" subtitle="Help us improve HalalVerify's accuracy." />
                <div className="max-w-lg mx-auto mt-6 sm:mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center flex flex-col items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle size={28} className="text-emerald-600 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Report Submitted</h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                        Thank you! Your report has been logged and will be reviewed by our team. This helps us improve the accuracy of the HalalVerify pipeline.
                    </p>
                    <button
                        onClick={resetForm}
                        className="mt-2 sm:mt-4 px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition"
                    >
                        Submit Another Report
                    </button>
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
            <Topbar
                title="Report an Issue"
                subtitle="Flag incorrect scanner results, suspicious logos, or database inaccuracies."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1.5 sm:mb-2">
                            Issue Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={form.issueType}
                            onChange={e => handleChange('issueType', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                        >
                            <option value="">Select an issue type...</option>
                            {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2 sm:mb-3">
                            This issue is related to
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                            {[
                                { value: 'product', label: 'Product Label', icon: <ScanSearch size={18} /> },
                                { value: 'logo', label: 'Logo', icon: <FileText size={18} /> },
                                { value: 'establishment', label: 'Establishment', icon: <Store size={18} /> },
                            ].map(opt => (
                                <button
                                    type="button"
                                    key={opt.value}
                                    onClick={() => handleChange('relatedTo', opt.value)}
                                    className={`flex flex-row sm:flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
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
                            {form.relatedTo === 'establishment' ? 'Establishment Name' : 'Product / Logo Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder={form.relatedTo === 'establishment' ? 'e.g. Sulu Sunset Grill' : 'e.g. Nestlé KitKat, HAL-2026-0089'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1.5 sm:mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={form.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="Describe the issue in detail. What did the system get wrong? What was the correct result?"
                            rows={5}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 sm:py-3.5 font-bold text-xs sm:text-sm text-white tracking-wide transition hover:bg-emerald-700 active:scale-[0.98] duration-150 shadow-md shadow-emerald-600/10 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Flag size={16} /> {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>

                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                            <Flag size={16} className="text-emerald-600 shrink-0" /> Why Report?
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Your reports directly improve HalalVerify's accuracy. Each flag is reviewed by our team and can help improve future OCR and logo detection results.
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6">
                        <h4 className="font-bold text-emerald-800 text-xs sm:text-sm mb-2 sm:mb-3">Common Issues to Report</h4>
                        <ul className="text-xs text-emerald-700 space-y-2">
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Scanner says "Green" but product contains suspicious ingredients</li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Invalid or unverified certificate was marked as "Valid"</li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Legitimate Halal logo was not detected</li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Establishment status is outdated in the registry</li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6">
                        <h4 className="font-bold text-slate-700 text-xs sm:text-sm mb-2">Limitations Notice</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Reports are advisory only. HalalVerify outputs are not a legal substitute for verification by accredited halal certifying bodies.
                        </p>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showConfirmModal}
                title="Confirm report submission"
                description="This will submit your issue for review by the HalalVerify team."
                onClose={() => setShowConfirmModal(false)}
                footer={[
                    <button
                        key="cancel"
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setShowConfirmModal(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>,
                    <button
                        key="submit"
                        type="button"
                        disabled={isSubmitting}
                        onClick={confirmSubmission}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                ]}
            >
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 text-xs sm:text-sm text-slate-600 space-y-1.5 sm:space-y-2">
                    <p><span className="font-semibold text-slate-800">Issue type:</span> {form.issueType || 'Not selected'}</p>
                    <p><span className="font-semibold text-slate-800">Related to:</span> {form.relatedTo === 'establishment' ? 'Establishment' : form.relatedTo === 'logo' ? 'Logo' : 'Product'}</p>
                    <p><span className="font-semibold text-slate-800">Summary:</span> {form.name || 'No subject provided'}</p>
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