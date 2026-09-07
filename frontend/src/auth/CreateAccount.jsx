import { useEffect, useState } from 'react';
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
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
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getFullName = () => {
    return [form.firstName, form.middleName, form.lastName]
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

        <div className={`flex min-h-0 items-center justify-center overflow-hidden bg-white p-6 md:p-12 transition-all duration-500 ${layout === 'create' ? 'md:order-1' : 'md:order-2'} ${mounted ? 'opacity-100 translate-x-0' : layout === 'create' ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8'}`}>
          <form onSubmit={handleCreateAccount} className="no-scrollbar flex h-full min-h-0 w-full max-w-sm flex-col justify-start overflow-y-auto py-2 pr-2">
            <div className="mb-4 shrink-0">
              <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 text-center">Create Account</h3>
            </div>

            <div className="shrink-0 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type="text" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} placeholder="John" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3 sm:pl-10 sm:pr-4 sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Middle Name <span className="font-normal text-slate-400">(optional)</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={form.middleName} onChange={e => handleChange('middleName', e.target.value)} placeholder="A." className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3 sm:pl-10 sm:pr-4 sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type="text" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} placeholder="Doe" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3 sm:pl-10 sm:pr-4 sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={form.username} onChange={e => handleChange('username', e.target.value)} placeholder="jdoe123" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3 sm:pl-10 sm:pr-4 sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3 sm:pl-10 sm:pr-4 sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-10 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3 sm:pl-10 sm:pr-11 sm:text-sm" />
                  <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-10 text-[12px] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:py-3 sm:pl-10 sm:pr-11 sm:text-sm" />
                  <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="mt-4 shrink-0">
              <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold tracking-wide text-white transition hover:bg-emerald-700 active:scale-95 duration-150 shadow-md shadow-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-sm">
                {isLoading ? 'Creating Account...' : 'Register Account'}
              </button>

              <div className="mt-5">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>Or create with</span>
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

              <div className="mt-4 text-center text-sm">
                <span className="text-slate-500">Already have an account? </span>
                <button type="button" onClick={() => onViewChange('login')} className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline">
                  Back to Login
                </button>
              </div>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => onViewChange('scanner')}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-700 hover:underline"
                >
                  Continue as Guest (Scan & Search)
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
