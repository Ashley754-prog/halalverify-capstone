import { useEffect, useState, useRef } from 'react';
import { User, Lock, Eye, EyeOff, Compass, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { fetchUserRole, signInWithProvider } from '../lib/auth';

export const Login = ({ onLogin, onViewChange, layout = 'login' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const oauthTimerRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 20);
        return () => clearTimeout(t);
    }, []);

    // Reset OAuth loading state when returning from OAuth popup/tab or on page focus/restore
    useEffect(() => {
        const handleWindowActive = () => {
            setOauthLoading('');
            if (oauthTimerRef.current) {
                clearTimeout(oauthTimerRef.current);
                oauthTimerRef.current = null;
            }
        };

        window.addEventListener('pageshow', handleWindowActive);
        window.addEventListener('focus', handleWindowActive);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleWindowActive();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('pageshow', handleWindowActive);
            window.removeEventListener('focus', handleWindowActive);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (oauthTimerRef.current) {
                clearTimeout(oauthTimerRef.current);
            }
        };
    }, []);

    const handleSignIn = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
        }

        const role = await fetchUserRole(data.user.id);

        if (!role) {
            setErrorMessage('Login succeeded, but no profile record was found. Please contact support.');
            setIsLoading(false);
            return;
        }

        onLogin('dashboard', role);
        setIsLoading(false);
    };

    const handleProviderSignIn = async (provider) => {
        if (oauthTimerRef.current) {
            clearTimeout(oauthTimerRef.current);
        }
        setOauthLoading(provider);
        setErrorMessage('');

        // Fallback auto-reset timer in case redirect is delayed, blocked, or cancelled by the user
        oauthTimerRef.current = setTimeout(() => {
            setOauthLoading('');
        }, 4000);

        try {
            await signInWithProvider(provider);
        } catch (error) {
            if (oauthTimerRef.current) {
                clearTimeout(oauthTimerRef.current);
                oauthTimerRef.current = null;
            }
            const providerName = provider === 'google' ? 'Google' : 'Facebook';
            const msg = error.message || '';
            if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('unsupported')) {
                setErrorMessage(`${providerName} authentication needs to be enabled in your Supabase Project Dashboard.`);
            } else {
                setErrorMessage(msg);
            }
            setOauthLoading('');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4">
            <div className="my-6 grid h-[calc(100vh-3rem)] max-h-[620px] min-h-0 w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-500 md:grid-cols-2">
                <div className={`flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-6 md:p-10 text-white transition-all duration-500 ease-out ${layout === 'create' ? 'md:order-2' : 'md:order-1'} ${mounted ? 'opacity-100 translate-x-0' : layout === 'create' ? 'opacity-0 translate-x-8' : 'opacity-0 -translate-x-8'}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">System Gateway</p>
                    <div className="mt-3 md:mt-6 flex h-20 w-20 md:h-40 md:w-40 items-center justify-center rounded-full backdrop-blur-md">
                        <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-20 w-20 md:h-40 md:w-40 rounded-full object-cover object-center" />
                    </div>
                    <h2 className="mt-3 md:mt-6 text-center text-xl md:text-3xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
                </div>

                <div className={`flex min-h-0 items-center justify-center overflow-hidden bg-white p-6 md:p-12 transition-all duration-500 ${layout === 'create' ? 'md:order-1' : 'md:order-2'}`}>
                    <form onSubmit={handleSignIn} className={`no-scrollbar flex h-full min-h-0 w-full max-w-sm flex-col justify-start overflow-y-auto py-2 pr-2 transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-x-0' : layout === 'create' ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8'}`}>
                        <div className="mb-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => (onViewChange ? onViewChange('landing') : onLogin('landing', null))}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition p-1.5 rounded-lg hover:bg-slate-100 active:scale-95"
                            >
                                <ArrowLeft size={15} />
                                <span>Return to Home</span>
                            </button>
                        </div>

                        <div className="mb-5 md:mb-7">
                            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 text-center">Login</h3>
                        </div>

                        <div className="space-y-4 md:space-y-5">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3.5 sm:pl-10 sm:pr-4 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-10 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3.5 sm:pl-10 sm:pr-11 sm:text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => onLogin('forgot-password', null)}
                                        className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
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
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold tracking-wide text-white transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-sm"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div className="mt-5">
                            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <span className="h-px flex-1 bg-slate-200" />
                                <span>Or sign in with</span>
                                <span className="h-px flex-1 bg-slate-200" />
                            </div>
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={() => handleProviderSignIn('google')}
                                    disabled={Boolean(oauthLoading)}
                                    className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm shadow-xs"
                                >
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <span>{oauthLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-500">Don&apos;t have an account? </span>
                            <button
                                type="button"
                                onClick={() => onLogin('create-account', null)}
                                className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                            >
                                Create Account
                            </button>
                        </div>

                        {/* Prominent Guest Access Option */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => onLogin('scanner', null)}
                                className="w-full group flex items-center justify-between p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition text-left shadow-xs active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition">
                                        <Compass size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition flex items-center gap-1.5">
                                            Continue as Guest
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full">
                                                Instant
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            Scan, search & find Halal spots without signing in
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-emerald-600 group-hover:translate-x-1 transition shrink-0" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
