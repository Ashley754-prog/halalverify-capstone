import { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { getMfaStatus, verifyTotpCode } from '../lib/auth';

export const MfaChallengeScreen = ({ onVerified, onSignOut }) => {
    const [code, setCode] = useState('');
    const [factorId, setFactorId] = useState('');
    const [loadingFactor, setLoadingFactor] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadFactor = async () => {
            try {
                const status = await getMfaStatus();
                if (!isMounted) return;
                if (!status.needsChallenge) {
                    onVerified?.();
                    return;
                }
                setFactorId(status.verifiedFactors[0]?.id || '');
            } catch (err) {
                if (isMounted) {
                    setErrorMessage(err?.message || 'Unable to load two-factor verification settings.');
                }
            } finally {
                if (isMounted) {
                    setLoadingFactor(false);
                }
            }
        };

        loadFactor();
        return () => {
            isMounted = false;
        };
    }, [onVerified]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting || !factorId) return;

        setSubmitting(true);
        setErrorMessage('');
        try {
            await verifyTotpCode(factorId, code);
            await onVerified?.();
        } catch (err) {
            setErrorMessage(err?.message || 'Invalid verification code. Please check your authenticator app and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-dvh items-center justify-center bg-[#0e1625] px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                        <ShieldCheck size={28} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Two-Factor Verification
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Enter the 6-digit code from your authenticator app to finish signing in.
                        </p>
                    </div>
                </div>

                {loadingFactor ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 size={18} className="animate-spin text-emerald-600" />
                        <span>Checking security factor...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="mfa-login-code"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                            >
                                6-Digit Authenticator Code
                            </label>
                            <div className="relative">
                                <KeyRound
                                    size={17}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    id="mfa-login-code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    autoFocus
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 text-center font-mono text-xl font-bold tracking-[0.4em] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || code.length !== 6 || !factorId}
                            className="h-12 w-full rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-55 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md shadow-emerald-900/20 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <span>Verify &amp; Continue</span>
                            )}
                        </button>
                    </form>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                        Switched phones or wrong account?
                    </span>
                    <button
                        type="button"
                        onClick={onSignOut}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 transition cursor-pointer"
                    >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MfaChallengeScreen;
