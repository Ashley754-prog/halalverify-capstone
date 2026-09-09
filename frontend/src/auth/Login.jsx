import { useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff, Compass, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { fetchUserRole, signInWithProvider } from '../lib/auth';

export const Login = ({ onLogin, layout = 'login' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 20);
        return () => clearTimeout(t);
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
        setOauthLoading(provider);
        setErrorMessage('');

        try {
            await signInWithProvider(provider);
        } catch (error) {
            setErrorMessage(error.message);
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
                        <div className="mb-6 md:mb-8">
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
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                {[
                                    { provider: 'google', label: 'Google', icon: 'G' },
                                    { provider: 'facebook', label: 'Facebook', icon: 'f' },
                                ].map(({ provider, label, icon }) => (
                                    <button
                                        key={provider}
                                        type="button"
                                        onClick={() => handleProviderSignIn(provider)}
                                        disabled={Boolean(oauthLoading)}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
                                    >
                                        <span className={`text-base font-black leading-none sm:text-lg ${provider === 'google' ? 'text-[#4285f4]' : 'text-[#1877f2]'}`}>{icon}</span>
                                        {oauthLoading === provider ? 'Opening...' : label}
                                    </button>
                                ))}
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
