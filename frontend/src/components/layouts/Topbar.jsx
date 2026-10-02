
import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, ArrowLeft, ShieldCheck, ChevronDown, Settings, LogOut } from 'lucide-react';
import { getInitials } from '../../utils/textFormatters';

// Page Header Topbar (used inside views like Settings, Dashboard, etc.)
export const Topbar = ({ title, subtitle, action, onBack }) => (
    <div className="top-0 z-20 mb-3 sm:mb-5 w-full rounded-2xl border border-slate-200 bg-white p-3 sm:px-4 sm:py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0 border border-slate-200 shadow-xs active:scale-95"
                        title="Go back"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                    {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {action && <div className="flex items-center shrink-0">{action}</div>}
        </div>
    </div>
);

// App Header Banner (positioned at top of application layout)
export const AppTopbar = ({
    isSidebarOpen,
    onToggleSidebar,
    onProfileClick,
    userRole,
    currentUser,
    currentView,
    onViewChange,
    onSignOut,
    onSignInClick,
    onLogoClick,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const displayName = currentUser?.full_name?.trim() || currentUser?.email?.split('@')[0] || (userRole === 'admin' ? 'Administrator' : 'User');
    const email = currentUser?.email || '';
    const initials = getInitials(currentUser?.full_name, currentUser?.email);

    return (
        <div className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-900 px-3 py-2.5 sm:px-5 sm:py-3 shadow-lg shadow-slate-900/10 shrink-0">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Mobile Menu Toggle Button */}
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition md:hidden shrink-0"
                        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>

                    <div 
                        onClick={onLogoClick} 
                        className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
                        title="Return to Home Landing Page"
                    >
                        <img 
                            src="/halalverify-logo.png" 
                            alt="HALALVERIFY logo" 
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-slate-700 group-hover:scale-105 transition shrink-0" 
                        />
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-lg font-black tracking-[0.12em] text-white group-hover:text-emerald-400 transition truncate">
                                HALALVERIFY
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Right side: User Identity Pill or Sign In button */}
                <div className="flex items-center gap-2 shrink-0">
                    {userRole ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                className="flex items-center gap-2 sm:gap-2.5 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 transition shadow-sm group focus:outline-hidden"
                                aria-expanded={isMenuOpen}
                                aria-label="Open user account menu"
                            >
                                {/* Avatar Circle with dynamic initials */}
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-inner transition ${
                                    userRole === 'admin'
                                        ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/50 group-hover:ring-emerald-400'
                                        : 'bg-sky-500/20 text-sky-300 ring-2 ring-sky-500/50 group-hover:ring-sky-400'
                                }`}>
                                    {initials}
                                </div>

                                {/* User Name & Role Pill Stack (Desktop & Tablet) */}
                                <div className="hidden sm:flex flex-col items-start text-left min-w-0 max-w-[140px] md:max-w-[180px]">
                                    <span className="text-xs font-semibold text-slate-100 truncate w-full group-hover:text-emerald-300 transition">
                                        {displayName}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {userRole === 'admin' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 leading-tight">
                                                <ShieldCheck size={10} className="text-emerald-400 shrink-0" />
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/60 leading-tight">
                                                <User size={10} className="text-sky-400 shrink-0" />
                                                Consumer
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Dropdown Chevron */}
                                <ChevronDown 
                                    size={14} 
                                    className={`text-slate-400 group-hover:text-slate-200 transition shrink-0 mr-1 sm:mr-0 transform ${
                                        isMenuOpen ? 'rotate-180 text-emerald-400' : ''
                                    }`} 
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-3 py-2.5 border-b border-slate-800 mb-1 bg-slate-950/40 rounded-xl">
                                        <p className="text-xs font-bold text-white truncate">{displayName}</p>
                                        {email && <p className="text-[11px] text-slate-400 truncate mt-0.5">{email}</p>}
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Access Role</span>
                                            {userRole === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                    <ShieldCheck size={11} /> Administrator
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                                                    <User size={11} /> Consumer
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { setIsMenuOpen(false); onProfileClick?.(); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left"
                                    >
                                        <User size={14} className="text-slate-400" />
                                        Profile & Account
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsMenuOpen(false); onViewChange?.('settings'); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left"
                                    >
                                        <Settings size={14} className="text-slate-400" />
                                        Settings
                                    </button>
                                    <div className="border-t border-slate-800 my-1" />
                                    <button
                                        type="button"
                                        onClick={() => { setIsMenuOpen(false); onSignOut?.(); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-xl transition text-left"
                                    >
                                        <LogOut size={14} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={onSignInClick}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition shrink-0 whitespace-nowrap active:scale-95"
                        >
                            <User size={14} className="shrink-0" />
                            <span className="whitespace-nowrap">Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Topbar;