import React, { useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const Login = ({ onLogin, layout = 'login' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            setErrorMessage(
                profileError.code === 'PGRST116'
                    ? 'Login succeeded, but no profile record was found. Please contact support.'
                    : `Login succeeded, but profile access failed: ${profileError.message}`
            );
            setIsLoading(false);
            return;
        }

        onLogin('dashboard', profile?.role || 'user');
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4">
            <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-500 md:grid-cols-2">
                <div className={`flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-10 text-white transition-all duration-500 ease-out ${layout === 'create' ? 'md:order-2' : 'md:order-1'} ${mounted ? 'opacity-100 translate-x-0' : layout === 'create' ? 'opacity-0 translate-x-8' : 'opacity-0 -translate-x-8'}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">System Gateway</p>
                    <div className="mt-6 flex h-40 w-40 items-center justify-center rounded-full backdrop-blur-md">
                        <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-40 w-40 rounded-full object-cover object-center" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
                </div>

                <div className={`flex items-center justify-center bg-white p-8 transition-all duration-500 md:p-12 ${layout === 'create' ? 'md:order-1' : 'md:order-2'}`}>
                    <form onSubmit={handleSignIn} className={`flex min-h-[420px] w-full max-w-sm flex-col justify-center transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-x-0' : layout === 'create' ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8'}`}>
                        <div className="mb-8">
                            <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 text-center">Login</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold tracking-wide text-white transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div className="mt-8 text-center text-sm">
                            <span className="text-slate-500">Don&apos;t have an account? </span>
                            <button
                                type="button"
                                onClick={() => onLogin('create-account', null)}
                                className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
