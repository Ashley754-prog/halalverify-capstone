import { useEffect, useState } from 'react';
import {
    ShieldCheck,
    Smartphone,
    Copy,
    Check,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getMfaStatus, verifyTotpCode } from '../../lib/auth';

export const TwoFactorSettingsCard = ({ role = 'user' }) => {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [verifiedFactors, setVerifiedFactors] = useState([]);
    const [enrollment, setEnrollment] = useState(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [confirmDisableId, setConfirmDisableId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const refreshFactors = async () => {
        try {
            const status = await getMfaStatus();
            setVerifiedFactors(status.verifiedFactors);
        } catch (err) {
            setErrorMessage(err?.message || 'Unable to load two-factor authentication status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshFactors();
    }, []);

    const handleStartEnrollment = async () => {
        setBusy(true);
        setErrorMessage('');
        setStatusMessage('');
        try {
            const status = await getMfaStatus();
            // Remove stale unverified factors left over from cancelled setups
            for (const stale of status.unverifiedFactors) {
                await supabase.auth.mfa.unenroll({ factorId: stale.id }).catch(() => {});
            }

            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName: 'Authenticator App',
            });
            if (error) throw error;

            setEnrollment({
                factorId: data.id,
                qrCode: data.totp.qr_code,
                secret: data.totp.secret,
            });
            setVerifyCode('');
        } catch (err) {
            setErrorMessage(err?.message || 'Could not start two-factor setup.');
        } finally {
            setBusy(false);
        }
    };

    const handleCancelEnrollment = async () => {
        const pendingId = enrollment?.factorId;
        setEnrollment(null);
        setVerifyCode('');
        setErrorMessage('');
        if (pendingId) {
            await supabase.auth.mfa.unenroll({ factorId: pendingId }).catch(() => {});
        }
    };

    const handleConfirmEnrollment = async (e) => {
        e.preventDefault();
        if (!enrollment?.factorId || busy) return;

        setBusy(true);
        setErrorMessage('');
        try {
            await verifyTotpCode(enrollment.factorId, verifyCode);
            setEnrollment(null);
            setVerifyCode('');
            setStatusMessage('Two-factor authentication is now active on your account.');
            await refreshFactors();
        } catch (err) {
            setErrorMessage(err?.message || 'Verification failed. Check your 6-digit code and try again.');
        } finally {
            setBusy(false);
        }
    };

    const handleDisableFactor = async (factorId) => {
        setBusy(true);
        setErrorMessage('');
        setStatusMessage('');
        try {
            const { error } = await supabase.auth.mfa.unenroll({ factorId });
            if (error) throw error;
            await supabase.auth.refreshSession().catch(() => {});
            setConfirmDisableId(null);
            setStatusMessage('Two-factor authentication has been disabled.');
            await refreshFactors();
        } catch (err) {
            setErrorMessage(
                err?.message ||
                'Could not disable 2FA. Please sign out and sign back in with your 6-digit code first.'
            );
        } finally {
            setBusy(false);
        }
    };

    const handleCopySecret = async () => {
        if (!enrollment?.secret) return;
        try {
            await navigator.clipboard.writeText(enrollment.secret);
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        } catch {
            // Safe fallback
        }
    };

    const isEnabled = verifiedFactors.length > 0;
    const isAdmin = role === 'admin';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                        <Smartphone size={18} className="text-emerald-600" />
                        Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Protect your account with a 6-digit code from Google Authenticator, Authy, or Microsoft Authenticator.
                    </p>
                </div>

                {!loading && (
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-center shrink-0 ${
                            isEnabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                    >
                        <ShieldCheck size={14} />
                        {isEnabled ? 'Enabled' : 'Off'}
                    </span>
                )}
            </div>

            {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 font-medium">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {statusMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 font-medium">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {loading ? (
                <div className="py-4 flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    <span>Checking two-factor security status...</span>
                </div>
            ) : enrollment ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4 items-center">
                        <div className="mx-auto sm:mx-0 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs w-40 h-40 flex items-center justify-center shrink-0">
                            <img
                                src={enrollment.qrCode}
                                alt="2FA Authenticator QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="space-y-3 min-w-0">
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-bold text-slate-800">
                                    1. Scan this QR code in your Authenticator app
                                </p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    On a single phone? Tap <strong>Copy Setup Key</strong> below and paste it into Google Authenticator or Authy.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <code className="flex-1 min-w-0 truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-700">
                                    {enrollment.secret}
                                </code>
                                <button
                                    type="button"
                                    onClick={handleCopySecret}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 transition cursor-pointer"
                                >
                                    {copiedSecret ? (
                                        <>
                                            <Check size={14} className="text-emerald-600" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span>Copy Key</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleConfirmEnrollment} className="pt-3 border-t border-slate-200/80 space-y-3">
                        <label
                            htmlFor="mfa-enroll-code"
                            className="block text-xs font-bold text-slate-700"
                        >
                            2. Enter the 6-digit code shown in your app to activate
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                                id="mfa-enroll-code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter 6-digit code"
                                className="h-10 sm:w-48 rounded-xl border border-slate-300 bg-white px-3.5 text-center font-mono text-sm font-bold tracking-[0.25em] text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <button
                                type="submit"
                                disabled={busy || verifyCode.length !== 6}
                                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                <span>Verify &amp; Enable 2FA</span>
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={handleCancelEnrollment}
                                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-600 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : isEnabled ? (
                <div className="space-y-3">
                    {verifiedFactors.map((factor) => (
                        <div
                            key={factor.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3"
                        >
                            <div className="space-y-0.5">
                                <p className="text-xs sm:text-sm font-bold text-slate-800">
                                    {factor.friendly_name || 'Authenticator App (TOTP)'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Active — 6-digit code required whenever you sign in.
                                </p>
                            </div>

                            {confirmDisableId === factor.id ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleDisableFactor(factor.id)}
                                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                        {busy ? 'Removing...' : 'Confirm Disable'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => setConfirmDisableId(null)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 transition cursor-pointer"
                                    >
                                        Keep On
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirmDisableId(factor.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-600 transition cursor-pointer self-start sm:self-center"
                                >
                                    <Trash2 size={14} />
                                    <span>Disable 2FA</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {isAdmin && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
                            <strong>Recommended for Administrators:</strong> Enable 2FA to add a second verification step before accessing moderation tools and registry approvals.
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-slate-600">
                            Optional for community accounts — add extra protection without relying on email or SMS limits.
                        </p>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={handleStartEnrollment}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-55 text-white text-xs sm:text-sm font-bold transition active:scale-[0.98] cursor-pointer shrink-0"
                        >
                            {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                            <span>Enable 2FA</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSettingsCard;
