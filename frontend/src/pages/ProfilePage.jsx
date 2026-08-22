import React, { useEffect, useState } from 'react';
import { User, Mail, Save, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import { supabase } from '../lib/supabaseClient';

const ProfilePage = ({ onViewChange }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [name, setName] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                if (isMounted) {
                    setErrorMessage('Could not load your account session. Try signing in again.');
                    setLoading(false);
                }
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, role, email')
                .eq('id', user.id)
                .single();

            if (!isMounted) return;

            setUserId(user.id);
            setEmail(profile?.email || user.email || '');
            setRole(profile?.role || 'user');
            setName(profile?.full_name || '');

            if (profileError) {
                console.warn('Profile load warning:', profileError.message);
            }

            setLoading(false);
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId || saving) return;

        setSaving(true);
        setErrorMessage('');

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: name.trim() })
            .eq('id', userId);

        setSaving(false);

        if (error) {
            setErrorMessage(`Save failed: ${error.message}`);
            return;
        }

        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };

    const isAdmin = role === 'admin';

    return (
        <div className="p-4 sm:p-6 md:p-8 w-full space-y-4 sm:space-y-6">
            {/* Topbar Header */}
            <Topbar
                title="Profile & Account Settings"
                subtitle="Manage your personal details and system verification preferences"
            />

            {loading ? (
                <div className="flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 p-10 text-sm text-slate-500 shadow-sm">
                    <Loader2 size={18} className="animate-spin text-emerald-600" />
                    Loading your profile...
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Widescreen Layout Grid (Split on web view, stacked on mobile) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                        {/* Left Column: Avatar & Account Info (1 col on web) */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-slate-100 bg-emerald-600 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-md">
                                <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base sm:text-lg font-bold text-slate-800">{name || 'User Profile'}</h3>
                                <p className="text-xs text-slate-500">{email}</p>
                            </div>

                            <div className={`w-full pt-3 pb-1 border-t flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-xl border ${isAdmin
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                : 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                                <ShieldCheck size={16} />
                                {isAdmin ? 'Administrator Account' : 'Standard Account'}
                            </div>
                        </div>

                        {/* Right Column: Personal Information Form (2 cols on web) */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1">
                                <User size={18} className="text-emerald-600" />
                                Personal Information
                            </h3>

                            {errorMessage && (
                                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm text-red-700">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    {errorMessage}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="profile-full-name" className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                        <User size={13} className="text-slate-400" />
                                        Full Name
                                    </label>
                                    <input
                                        id="profile-full-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Juan Dela Cruz"
                                        maxLength={80}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="profile-email" className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                        <Mail size={13} className="text-slate-400" />
                                        Email Address
                                    </label>
                                    <input
                                        id="profile-email"
                                        type="email"
                                        value={email}
                                        readOnly
                                        disabled
                                        title="Email address is managed by your sign-in account"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Actions Footer Bar (Side-by-Side buttons for all viewport sizes) */}
                    <div className="flex items-center justify-end gap-3 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm">
                        {savedSuccess && (
                            <span className="text-xs font-semibold text-emerald-600 items-center gap-1 hidden sm:inline-flex">
                                <CheckCircle2 size={15} />
                                Profile Updated!
                            </span>
                        )}

                        {errorMessage && !savedSuccess && (
                            <span className="text-xs font-semibold text-red-600 items-center gap-1 hidden sm:inline-flex">
                                <AlertCircle size={15} />
                                Not saved
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => onViewChange?.('dashboard')}
                            className="px-4 sm:px-6 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                        >
                            {saving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProfilePage;
