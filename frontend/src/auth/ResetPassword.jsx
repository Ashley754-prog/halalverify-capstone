import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

export const ResetPassword = ({ onViewChange }) => {
    const [submitted, setSubmitted] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4">
            <div className="my-6 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
                <div className="flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-6 md:p-10 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Security Center</p>
                <div className="mt-3 md:mt-6 flex h-20 w-20 md:h-40 md:w-40 items-center justify-center rounded-full backdrop-blur-md">
                    <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-20 w-20 md:h-40 md:w-40 rounded-full object-cover object-center" />
                </div>
                <h2 className="mt-3 md:mt-6 text-center text-xl md:text-3xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
                <p className="mt-1 md:mt-2 text-center text-xs text-emerald-100 font-medium">Set a new password for your account</p>
                </div>

                <div className="flex items-center justify-center bg-white p-6 md:p-12">
                    <div className="flex w-full max-w-sm flex-col justify-center">
                        {!submitted ? (
                            <>
                                <div className="mb-6">
                                    <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">Reset Password</h3>
                                    <p className="mt-1 text-sm text-slate-500">Choose a new password for your HalalVerify account.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(prev => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none"
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setSubmitted(true)} className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 font-bold tracking-wide text-white transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10">
                                    Update Password
                                </button>

                                <button onClick={() => onViewChange('login')} className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700">
                                    <ArrowLeft size={16} /> Back to Login
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Password Updated</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">Your password has been changed successfully. You can now sign in with your new credentials.</p>
                                <button onClick={() => onViewChange('login')} className="mt-8 w-full rounded-xl border border-slate-300 bg-slate-100 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-200">
                                    Return to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
