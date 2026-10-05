
import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, ArrowLeft, ChevronDown, ShieldCheck, Settings, LogOut } from 'lucide-react';

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
    onSignOut,
    onSignInClick,
    onLogoClick,
    onViewChange,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isDropdownOpen]);

    const isAdmin = (currentUser?.role || userRole) === 'admin';
    const displayName = currentUser?.name || (isAdmin ? 'System Admin' : 'Community User');
    const displayEmail = currentUser?.email || '';

    const getInitials = (name, email) => {
        const cleanName = (name || '').trim();
        if (cleanName) {
            const parts = cleanName.split(/\s+/);
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return cleanName.slice(0, 2).toUpperCase();
        }
        if (email && email.trim()) {
            return email.trim().slice(0, 2).toUpperCase();
        }
        return isAdmin ? 'SA' : 'CU';
    };

    const initials = getInitials(displayName, displayEmail);

    return (
        <div className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg shadow-slate-900/10 shrink-0">
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
                            <h1 className="text-sm sm:text-xl font-black tracking-[0.12em] sm:tracking-[0.18em] text-white group-hover:text-emerald-400 transition truncate">HALALVERIFY</h1>
                        </div>
                    </div>
                </div>

                {/* Right side: User Profile Dropdown or Sign In button */}
                <div className="flex items-center gap-2 shrink-0">
                    {userRole ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                aria-expanded={isDropdownOpen}
                                aria-label="User account menu"
                                className={`flex items-center gap-2 sm:gap-2.5 py-1 px-1.5 sm:px-2 rounded-full transition-all border cursor-pointer ${
                                    isDropdownOpen
                                        ? 'bg-slate-800 border-emerald-500/60 shadow-md ring-2 ring-emerald-500/20'
                                        : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                {/* Avatar Circle with Initials */}
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-inner shrink-0">
                                    {initials}
                                </div>

                                {/* Name & Role indicator (responsive) */}
                                <div className="hidden sm:flex flex-col text-left leading-tight min-w-0 max-w-[130px] md:max-w-[160px]">
                                    <span className="text-xs font-semibold text-white truncate">
                                        {displayName}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                            {isAdmin ? 'Admin' : 'Verifier'}
                                        </span>
                                    </div>
                                </div>

                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform duration-200 shrink-0 mr-1 ${
                                        isDropdownOpen ? 'rotate-180 text-white' : ''
                                    }`}
                                />
                            </button>

                            {/* Dropdown Menu Card */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-1">
                                    {/* User Details Header */}
                                    <div className="p-3 bg-slate-50/90 rounded-xl mb-1 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                                                {initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 truncate" title={displayName}>
                                                    {displayName}
                                                </p>
                                                {displayEmail && (
                                                    <p className="text-xs text-slate-500 truncate" title={displayEmail}>
                                                        {displayEmail}
                                                    </p>
                                                )}
                                                <div className="mt-1.5 flex items-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                        isAdmin
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}>
                                                        {isAdmin ? (
                                                            <>
                                                                <ShieldCheck size={12} className="text-emerald-600" />
                                                                <span>System Administrator</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <User size={12} className="text-slate-600" />
                                                                <span>Community Verifier</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation Items */}
                                    <div className="space-y-0.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                if (onProfileClick) onProfileClick();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition text-left cursor-pointer"
                                        >
                                            <User size={16} className="text-slate-500 shrink-0" />
                                            <span>Profile & Account</span>
                                        </button>

                                        {onViewChange && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    onViewChange('settings');
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition text-left cursor-pointer"
                                            >
                                                <Settings size={16} className="text-slate-500 shrink-0" />
                                                <span>Settings</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Sign Out Action */}
                                    {onSignOut && (
                                        <>
                                            <div className="my-1 border-t border-slate-100" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    onSignOut();
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left cursor-pointer group"
                                            >
                                                <LogOut size={16} className="text-rose-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                                <span>Sign Out</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={onSignInClick}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition shrink-0 whitespace-nowrap active:scale-95"
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