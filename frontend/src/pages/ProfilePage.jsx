import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Mail, AtSign, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import Topbar from '../components/layouts/Topbar'; 

const ProfilePage = () => {
    const navigate = useNavigate();
    const [preview, setPreview] = useState(null);
    const [name, setName] = useState('Jane Doe');
    const [username, setUsername] = useState('janedoe');
    const [email, setEmail] = useState('jane.doe@example.com');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [bio, setBio] = useState('');
    const [savedSuccess, setSavedSuccess] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Wire up actual backend / Supabase update logic
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 w-full space-y-4 sm:space-y-6">
            {/* Topbar Header */}
            <Topbar 
                title="Profile & Account Settings" 
                subtitle="Manage your personal details and system verification preferences" 
            />

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Widescreen Layout Grid (Split on web view, stacked on mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    
                    {/* Left Column: Avatar & Account Info (1 col on web) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative group">
                            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-slate-100 bg-emerald-600 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-md">
                                {preview ? (
                                    <img src={preview} alt="Profile Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            
                            {/* Overlay Camera Upload Button */}
                            <label className="absolute bottom-1 right-1 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg cursor-pointer transition-transform active:scale-95">
                                <Camera size={16} />
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-bold text-slate-800">{name || 'User Profile'}</h3>
                            <p className="text-xs text-slate-500">@{username || 'username'}</p>
                        </div>

                        <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-100">
                            <ShieldCheck size={16} />
                            Verified System Account
                        </div>
                    </div>

                    {/* Right Column: Personal Information Form (2 cols on web) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <User size={18} className="text-emerald-600" />
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <User size={13} className="text-slate-400" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Jane Doe"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <AtSign size={13} className="text-slate-400" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="janedoe"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Mail size={13} className="text-slate-400" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. +1 555 555 5555"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="City, Country"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Website</label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://your.site"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Short Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us something about yourself"
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
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

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 sm:px-6 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                    >
                        <Save size={16} />
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;