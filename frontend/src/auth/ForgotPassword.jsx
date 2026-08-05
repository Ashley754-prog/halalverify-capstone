import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getAuthRedirectUrl } from '../lib/auth';

export const ForgotPassword = ({ onViewChange }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: getAuthRedirectUrl(),
        });

        if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
        }

        setSubmitted(true);
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4">
            <div className="my-6 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
                <div className="flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-6 md:p-10 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">System Gateway</p>
                    <div className="mt-3 md:mt-6 flex h-20 w-20 md:h-40 md:w-40 items-center justify-center rounded-full backdrop-blur-md">
                        <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-20 w-20 md:h-40 md:w-40 rounded-full object-cover object-center" />
                    </div>
                    <h2 className="mt-3 md:mt-6 text-center text-xl md:text-3xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
                    <p className="mt-1 md:mt-2 text-center text-xs font-medium text-emerald-100">Zamboanga Local Compliance Pipeline</p>
                </div>

                <div className="flex items-center justify-center bg-white p-6 md:p-12">
                    <div className="flex min-h-0 md:min-h-[420px] w-full max-w-sm flex-col justify-center">
                        {!submitted ? (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">Recovery</h3>
                                    <p className="mt-1 text-sm text-slate-500">Request a secure credential recovery link</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Account Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 font-bold tracking-wide text-white transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                                </button>

                                <div className="mt-8 text-center text-sm">
                                    <span className="text-slate-500">Remember your password? </span>
                                    <button
                                        type="button"
                                        onClick={() => onViewChange('login')}
                                        className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="py-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Email Dispatched</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                    If an account exists for that email, Supabase sent a password reset link. Open it on this device to continue.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => onViewChange('login')}
                                    className="mt-8 w-full rounded-xl border border-slate-300 bg-slate-100 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
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
