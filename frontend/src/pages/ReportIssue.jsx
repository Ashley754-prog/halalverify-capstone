import React, { useState } from 'react';
import { Flag, ScanSearch, FileText, Store, CheckCircle } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';

const API_BASE_URL = 'http://127.0.0.1:8000';

const ISSUE_TYPES = [
    'Wrong Verdict (Scanner Error)',
    'Suspicious / Counterfeit Certificate',
    'Missing Halal Logo Not Detected',
    'Ingredient Incorrectly Flagged',
    'Establishment Status Incorrect',
    'Other',
];

export const ReportIssue = () => {
    const [submitted, setSubmitted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [form, setForm] = useState({
        issueType: '',
        relatedTo: 'product',
        name: '',
        description: '',
    });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const confirmSubmission = async () => {
        try {
            setIsSubmitting(true);

            const response = await fetch(`${API_BASE_URL}/issue-reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    issue_type: form.issueType,
                    related_to: form.relatedTo,
                    subject_name: form.name,
                    description: form.description,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit report');
            }

            setSubmitted(true);
            setShowConfirmModal(false);
            setToast({
                visible: true,
                message: 'Report submitted successfully. Thank you for helping improve HalalVerify.',
                type: 'success',
            });
        } catch (error) {
            console.error(error);
            setToast({
                visible: true,
                message: 'Could not submit report. Please check if the backend is running.',
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSubmitted(false);
        setForm({ issueType: '', relatedTo: 'product', name: '', description: '' });
        setToast({ visible: false, message: '', type: 'info' });
    };

    if (submitted) {
        return (
            <div className="p-4 sm:p-6 md:p-8">
                <Topbar title="Report an Issue" subtitle="Help us improve HalalVerify's accuracy." />
                <div className="max-w-lg mx-auto mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Report Submitted</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                        Thank you! Your report has been saved and will be reviewed by our team. This helps us improve the accuracy of the HalalVerify pipeline.
                    </p>
                    <button
                        onClick={resetForm}
                        className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
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
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            <Topbar
                title="Report an Issue"
                subtitle="Flag incorrect scanner results, suspicious certificates, or database inaccuracies."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                            Issue Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={form.issueType}
                            onChange={e => handleChange('issueType', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                        >
                            <option value="">Select an issue type...</option>
                            {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-3">
                            This issue is related to
                        </label>
                        <div className="flex gap-3">
                            {[
                                { value: 'product', label: 'Product Label', icon: <ScanSearch size={16} /> },
                                { value: 'certificate', label: 'Certificate', icon: <FileText size={16} /> },
                                { value: 'establishment', label: 'Establishment', icon: <Store size={16} /> },
                            ].map(opt => (
                                <button
                                    type="button"
                                    key={opt.value}
                                    onClick={() => handleChange('relatedTo', opt.value)}
                                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-semibold transition-all ${
                                        form.relatedTo === opt.value
                                            ? 'bg-emerald-600 text-white border-emerald-500'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                            {form.relatedTo === 'establishment' ? 'Establishment Name' : 'Product / Certificate Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder={form.relatedTo === 'establishment' ? 'e.g. Sulu Sunset Grill' : 'e.g. Nestle KitKat, HAL-2026-0089'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={form.description}
                            onChange={e => handleChange('description', e.target.value)}
                            placeholder="Describe the issue in detail. What did the system get wrong? What was the correct result?"
                            rows={5}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold text-white tracking-wide transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Flag size={16} /> {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>

                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                            <Flag size={16} className="text-emerald-600" /> Why Report?
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Your reports directly improve HalalVerify's accuracy. Each flag is reviewed by our team and can help improve future OCR and logo detection results.
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                        <h4 className="font-bold text-emerald-800 text-sm mb-3">Common Issues to Report</h4>
                        <ul className="text-xs text-emerald-700 space-y-2">
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Scanner says “Green” but product contains suspicious ingredients</li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Expired certificate was marked as “Valid”</li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Legitimate Halal logo was not detected</li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Establishment status is outdated in the registry</li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h4 className="font-bold text-slate-700 text-sm mb-2">Limitations Notice</h4>
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
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>,
                    <button
                        key="submit"
                        type="button"
                        disabled={isSubmitting}
                        onClick={confirmSubmission}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                ]}
            >
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-800">Issue type:</span> {form.issueType || 'Not selected'}</p>
                    <p className="mt-2"><span className="font-semibold text-slate-800">Related to:</span> {form.relatedTo === 'establishment' ? 'Establishment' : form.relatedTo === 'certificate' ? 'Certificate' : 'Product'}</p>
                    <p className="mt-2"><span className="font-semibold text-slate-800">Summary:</span> {form.name || 'No subject provided'}</p>
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