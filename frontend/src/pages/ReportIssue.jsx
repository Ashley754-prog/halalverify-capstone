import React, { useState } from 'react';
import { Flag, ScanSearch, FileText, Store, CheckCircle } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';

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
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [form, setForm] = useState({
        issueType: '',
        relatedTo: 'product', // 'product' | 'establishment' | 'certificate'
        name: '',
        description: '',
    });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const confirmSubmission = () => {
        setSubmitted(true);
        setShowConfirmModal(false);
        setToast({ visible: true, message: 'Report submitted successfully. Thank you for helping improve HalalVerify.', type: 'success' });
    };

    const resetForm = () => {
        setSubmitted(false);
        setForm({ issueType: '', relatedTo: 'product', name: '', description: '' });
        setToast({ visible: false, message: '', type: 'info' });
    };

    if (submitted) {
        return (
            <div className="p-8">
                <Topbar title="Report an Issue" subtitle="Help us improve HalalVerify's accuracy." />
                <div className="max-w-lg mx-auto mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Report Submitted</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                        Thank you! Your report has been logged and will be reviewed by our team. This helps us improve the accuracy of the HalalVerify pipeline.
                    </p>
                    <button
                        onClick={resetForm}
                        className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
                    >
                        Submit Another Report
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <Topbar
                title="Report an Issue"
                subtitle="Flag incorrect scanner results, suspicious certificates, or database inaccuracies."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">

                    {/* Issue Type */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Issue Type <span className="text-red-500">*</span></label>
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

                    {/* Related To */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-3">This issue is related to</label>
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

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                            {form.relatedTo === 'establishment' ? 'Establishment Name' : 'Product / Certificate Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder={form.relatedTo === 'establishment' ? 'e.g. Sulu Sunset Grill' : 'e.g. Nestlé KitKat, HAL-2026-0089'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Description <span className="text-red-500">*</span></label>
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
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold text-white tracking-wide transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10"
                    >
                        <Flag size={16} /> Submit Report
                    </button>
                </form>

                {/* Right side info panel */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                            <Flag size={16} className="text-emerald-600" /> Why Report?
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Your reports directly improve HalalVerify's accuracy. Each flag is reviewed by our team and used to retrain the YOLOv8 and EasyOCR models for better detection performance.
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                        <h4 className="font-bold text-emerald-800 text-sm mb-3">Common Issues to Report</h4>
                        <ul className="text-xs text-emerald-700 space-y-2">
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Scanner says "Green" but product contains suspicious ingredients</li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span> Expired certificate was marked as "Valid"</li>
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
                    <button key="cancel" type="button" onClick={() => setShowConfirmModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>,
                    <button key="submit" type="button" onClick={confirmSubmission} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Submit Report</button>
                ]}
            >
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-800">Issue type:</span> {form.issueType || 'Not selected'}</p>
                    <p className="mt-2"><span className="font-semibold text-slate-800">Related to:</span> {form.relatedTo === 'establishment' ? 'Establishment' : form.relatedTo === 'certificate' ? 'Certificate' : 'Product'}</p>
                    <p className="mt-2"><span className="font-semibold text-slate-800">Summary:</span> {form.name || 'No subject provided'}</p>
                </div>
            </Modal>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ visible: false, message: '', type: 'info' })} />
        </div>
    );
};

export default ReportIssue;
