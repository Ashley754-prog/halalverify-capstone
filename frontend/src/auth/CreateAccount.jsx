import { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, Compass, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { signInWithProvider } from '../lib/auth';

export const CreateAccount = ({ onViewChange, layout = 'create' }) => {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const oauthTimerRef = useRef(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

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

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getFullName = () => {
    return [form.firstName, form.lastName]
      .map(value => value.trim())
      .filter(Boolean)
      .join(' ');
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: getFullName(),
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Account created successfully. You can now sign in.');
    setIsLoading(false);

    setTimeout(() => {
      onViewChange('login');
    }, 900);
  };

  const handleProviderSignIn = async (provider) => {
    if (oauthTimerRef.current) {
      clearTimeout(oauthTimerRef.current);
    }
    setOauthLoading(provider);
    setErrorMessage('');

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
    <div className="flex min-h-screen items-center justify-center bg-[#0e1625] px-4 py-6 sm:py-10">
      <div className="my-auto grid min-h-0 w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-500 md:grid-cols-2">
        {/* Brand Showcase Panel (Visible on Desktop) */}
        <div className={`hidden md:flex flex-col items-center justify-center bg-linear-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-8 lg:p-10 text-white transition-all duration-500 ease-out ${layout === 'create' ? 'md:order-2' : 'md:order-1'} ${mounted ? 'opacity-100 translate-x-0' : layout === 'create' ? 'opacity-0 translate-x-8' : 'opacity-0 -translate-x-8'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">System Gateway</p>
          <div className="mt-6 flex h-32 w-32 lg:h-36 lg:w-36 items-center justify-center rounded-full backdrop-blur-md">
            <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-32 w-32 lg:h-36 lg:w-36 rounded-full object-cover object-center shadow-xl" />
          </div>
          <h2 className="mt-6 text-center text-2xl lg:text-3xl font-black tracking-[0.25em] text-white">HALALVERIFY</h2>
          <p className="mt-2 text-center text-sm font-medium text-emerald-100/90 leading-relaxed max-w-xs">
            Zamboanga Halal Compliance, Food Safety &amp; Optical Inspection System
          </p>
        </div>

        {/* Form Panel */}
        <div className={`flex min-h-0 items-center justify-center bg-white p-6 sm:p-8 md:p-10 transition-all duration-500 ${layout === 'create' ? 'md:order-1' : 'md:order-2'} ${mounted ? 'opacity-100 translate-x-0' : layout === 'create' ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8'}`}>
          <form onSubmit={handleCreateAccount} className="no-scrollbar flex w-full max-w-md flex-col justify-start py-1">
            {/* Mobile Brand Header */}
            <div className="md:hidden flex items-center justify-center gap-2 mb-3">
              <img src="/halalverify-logo.png" alt="HalalVerify Logo" className="h-8 w-8 rounded-full object-cover shadow-xs" />
              <span className="font-black tracking-wider text-slate-900 text-base">HALALVERIFY</span>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onViewChange?.('landing')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition p-1 rounded-lg hover:bg-slate-100 active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Return to Home</span>
              </button>
            </div>

            {/* Title and Subtitle matching benchmark accessibility */}
            <div className="mb-4 text-center">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-950">Access Your Account</h3>
              <p className="text-sm sm:text-base font-medium text-emerald-800/90 mt-1.5 leading-snug">
                Create an account to submit listings, track scans, and access verification features.
              </p>
            </div>

            {/* Benchmark Pill Toggle Switch */}
            <div className="mb-6 flex rounded-full bg-slate-100 p-1.5 border border-slate-200">
              <button
                type="button"
                onClick={() => onViewChange?.('login')}
                className="flex-1 rounded-full py-3 text-base font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                className="flex-1 rounded-full py-3 text-base font-bold text-white bg-emerald-800 shadow-xs cursor-default"
              >
                Register
              </button>
            </div>

            {/* Large, User-Friendly Input Fields for Easy Reading */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-2 block text-base font-bold text-slate-800">First Name</label>
                  <input
                    required
                    type="text"
                    value={form.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    placeholder="John"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-base font-bold text-slate-800">Last Name</label>
                  <input
                    required
                    type="text"
                    value={form.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-base font-bold text-slate-800">Email Address</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                />
              </div>

              <div>
                <label className="mb-2 block text-base font-bold text-slate-800">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    placeholder="Create a password"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 pr-12 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-base font-bold text-slate-800">Confirm Password</label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 pr-12 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
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

            {successMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {successMessage}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="h-12 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-base font-bold tracking-wide text-white transition active:scale-95 duration-150 shadow-md shadow-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </button>

              <div className="pt-1">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>Or continue with</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleProviderSignIn('google')}
                    disabled={Boolean(oauthLoading)}
                    className="h-12 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    <span className="text-lg font-black leading-none text-[#4285f4]">G</span>
                    {oauthLoading === 'google' ? 'Opening...' : 'Continue with Google'}
                  </button>
                </div>
              </div>

              {/* Guest Access Option */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onViewChange('scanner')}
                  className="w-full group flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition text-left cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                      <Compass size={18} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition flex items-center gap-1.5">
                        Continue as Guest
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Instant
                        </span>
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Scan, search &amp; find Halal spots without signing in
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-emerald-700 group-hover:translate-x-1 transition shrink-0" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
