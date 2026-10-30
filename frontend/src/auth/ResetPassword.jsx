import { useEffect, useState } from 'react';
import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { signOut } from '../lib/auth';

export const ResetPassword = ({ onViewChange }) => {
    const [submitted, setSubmitted] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [hasRecoverySession, setHasRecoverySession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const verifyRecoverySession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (isMounted) {
                setHasRecoverySession(Boolean(session));
                setCheckingSession(false);
            }
        };

        verifyRecoverySession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
                setHasRecoverySession(Boolean(session));
                setCheckingSession(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
        }

        setSubmitted(true);
        setIsLoading(false);
        await signOut();
    };

    if (checkingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 px-6 py-4 text-base font-semibold text-slate-200">
                    Verifying reset link...
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4 py-6 sm:py-10">
            <div className="my-auto grid min-h-0 w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
                <div className="hidden md:flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-8 lg:p-10 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Security Center</p>
                    <div className="mt-6 flex h-32 w-32 lg:h-36 lg:w-36 items-center justify-center rounded-full backdrop-blur-md">
                        <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-32 w-32 lg:h-36 lg:w-36 rounded-full object-cover object-center shadow-xl" />
                    </div>
                    <h2 className="mt-6 text-center text-2xl lg:text-3xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
                    <p className="mt-2 text-center text-sm font-medium text-emerald-100/90 leading-relaxed max-w-xs">Set a new password for your account</p>
                </div>

                <div className="flex items-center justify-center bg-white p-6 sm:p-8 md:p-10">
                    <div className="flex w-full max-w-md flex-col justify-center">
                        {!hasRecoverySession ? (
                            <>
                                <div className="md:hidden flex items-center justify-center gap-2 mb-3">
                                    <img src="/halalverify-logo.png" alt="HalalVerify Logo" className="h-8 w-8 rounded-full object-cover shadow-xs" />
                                    <span className="font-black tracking-wider text-slate-900 text-base">HALALVERIFY</span>
                                </div>

                                <div className="mb-6 text-center">
                                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-950">Reset Password</h3>
                                    <p className="mt-1.5 text-sm sm:text-base font-medium text-emerald-800/90 leading-snug">
                                        Open the password reset link from your email first, then return here to choose a new password.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onViewChange('forgot-password')}
                                    className="h-12 w-full rounded-xl bg-emerald-800 hover:bg-emerald-700 text-base font-bold tracking-wide text-white transition active:scale-95 shadow-md shadow-emerald-900/20 cursor-pointer"
                                >
                                    Request Reset Link
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onViewChange('login')}
                                    className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900 cursor-pointer"
                                >
                                    <ArrowLeft size={16} /> Back to Login
                                </button>
                            </>
                        ) : !submitted ? (
                            <form onSubmit={handleSubmit}>
                                <div className="md:hidden flex items-center justify-center gap-2 mb-3">
                                    <img src="/halalverify-logo.png" alt="HalalVerify Logo" className="h-8 w-8 rounded-full object-cover shadow-xs" />
                                    <span className="font-black tracking-wider text-slate-900 text-base">HALALVERIFY</span>
                                </div>

                                <div className="mb-6 text-center">
                                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-950">Reset Password</h3>
                                    <p className="mt-1.5 text-sm sm:text-base font-medium text-emerald-800/90 leading-snug">Choose a new password for your HalalVerify account.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-base font-bold text-slate-800">New Password</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                placeholder="••••••••"
                                                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 pr-12 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword((prev) => !prev)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer"
                                                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-base font-bold text-slate-800">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                placeholder="••••••••"
                                                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 pr-12 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer"
                                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-6 h-12 w-full rounded-xl bg-emerald-800 hover:bg-emerald-700 text-base font-bold tracking-wide text-white transition active:scale-95 duration-150 shadow-md shadow-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                >
                                    {isLoading ? 'Updating Password...' : 'Update Password'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onViewChange('login')}
                                    className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                >
                                    <ArrowLeft size={16} /> Back to Login
                                </button>
                            </form>
                        ) : (
                            <div className="py-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-xs">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-emerald-950">Password Updated</h3>
                                <p className="mt-2 text-base leading-relaxed text-slate-600">
                                    Your password has been changed successfully. You can now sign in with your new credentials.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => onViewChange('login')}
                                    className="mt-6 h-12 w-full rounded-xl border border-slate-300 bg-slate-100 text-base font-bold text-slate-800 transition hover:bg-slate-200 cursor-pointer"
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

export default ResetPassword;
