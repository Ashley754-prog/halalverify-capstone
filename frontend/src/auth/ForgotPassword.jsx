import { useState } from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
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
        <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4 py-6">
            <div className="my-auto grid min-h-0 w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
                <div className="flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-6 md:p-10 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">System Gateway</p>
                    <div className="mt-4 md:mt-6 flex h-20 w-20 md:h-36 md:w-36 items-center justify-center rounded-full backdrop-blur-md">
                        <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-20 w-20 md:h-36 md:w-36 rounded-full object-cover object-center shadow-lg" />
                    </div>
                    <h2 className="mt-4 md:mt-6 text-center text-xl md:text-2xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
                    <p className="mt-1 text-center text-xs font-medium text-emerald-100/90">Zamboanga Local Compliance Pipeline</p>
                </div>

                <div className="flex items-center justify-center bg-white p-6 md:p-10">
                    <div className="flex min-h-0 w-full max-w-sm flex-col justify-center">
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="w-full">
                                <div className="mb-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => onViewChange?.('login')}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition p-1 rounded-lg hover:bg-slate-100 active:scale-95 cursor-pointer"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>Back to Sign In</span>
                                    </button>
                                </div>

                                <div className="mb-6 text-center">
                                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Account Recovery</h3>
                                    <p className="mt-1 text-xs text-slate-500">Enter your email to receive a secure password reset link.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700">Account Email</label>
                                        <input
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-6 w-full rounded-xl bg-emerald-700 hover:bg-emerald-600 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-white transition active:scale-95 duration-150 shadow-md shadow-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                >
                                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                                </button>

                                <div className="mt-6 text-center text-xs">
                                    <span className="text-slate-500">Remember your password? </span>
                                    <button
                                        type="button"
                                        onClick={() => onViewChange('login')}
                                        className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline cursor-pointer"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="py-6 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
                                    <CheckCircle size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Email Dispatched</h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                    If an account exists for that email, Supabase sent a password reset link. Open it on this device to continue.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => onViewChange('login')}
                                    className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-200 cursor-pointer"
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
