import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPassword = ({ onViewChange }) => {
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4">
            <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">

                {/* Left side brand panel */}
                <div className="flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-6 md:p-10 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">System Gateway</p>
                <div className="mt-3 md:mt-6 flex h-20 w-20 md:h-40 md:w-40 items-center justify-center rounded-full backdrop-blur-md">
                    <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-20 w-20 md:h-40 md:w-40 rounded-full object-cover object-center" />
                </div>
                <h2 className="mt-3 md:mt-6 text-center text-xl md:text-3xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
                <p className="mt-1 md:mt-2 text-center text-xs text-emerald-100 font-medium">Zamboanga Local Compliance Pipeline</p>
                </div>

                {/* Right side form */}
                <div className="flex items-center justify-center p-6 md:p-12 bg-white">
                    <div className="flex min-h-0 md:min-h-[420px] flex-col justify-center w-full max-w-sm">
                        {!submitted ? (
                            <>
                                <div className="mb-6">
                                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recovery</h3>
                                    <p className="text-sm text-slate-500 mt-1">Request a secure credential recovery link</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Account Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input type="email" placeholder="inspector@zamboanga.gov" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-10 pr-4 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 text-sm text-slate-800" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSubmitted(true)}
                                    className="w-full rounded-xl bg-emerald-600 py-3.5 mt-6 font-bold text-white tracking-wide transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10"
                                >
                                    Send Reset Link
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onViewChange('reset-password')}
                                    className="mt-3 w-full text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                                >
                                    Go to Reset Password Page
                                </button>

                                <div className="mt-8 text-center text-sm">
                                    <span className="text-slate-500">Remember your password? </span>
                                    <button
                                        onClick={() => onViewChange('login')}
                                        className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Email Dispatched</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    We have successfully issued password recovery directions to your registered address.
                                </p>
                                <button
                                    onClick={() => onViewChange('login')}
                                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3.5 mt-8 font-bold text-sm transition active:scale-95 duration-150 border border-slate-300"
                                >
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

export default ForgotPassword;