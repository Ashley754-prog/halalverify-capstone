import React from 'react';
import { Menu, X, User } from 'lucide-react';

// Page Header Topbar (used inside views like Settings, Dashboard, etc.)
export const Topbar = ({ title, subtitle, action }) => (
    <div className="top-0 z-20 mb-3 sm:mb-5 w-full rounded-2xl border border-slate-200 bg-white p-3 sm:px-4 sm:py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center shrink-0">{action}</div>}
        </div>
    </div>
);

// App Header Banner (positioned at top of application layout)
export const AppTopbar = ({ isSidebarOpen, onToggleSidebar, onProfileClick, userRole, onSignInClick, onLogoClick }) => (
    <div className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-5 sm:py-4 shadow-lg shadow-slate-900/10">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle Button */}
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition md:hidden"
                    aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                <div 
                    onClick={onLogoClick} 
                    className="flex items-center gap-2.5 cursor-pointer group"
                    title="Return to Home Landing Page"
                >
                    <img 
                        src="/halalverify-logo.png" 
                        alt="HALALVERIFY logo" 
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-slate-700 group-hover:scale-105 transition" 
                    />
                    <div>
                        <h1 className="text-base sm:text-xl font-black tracking-[0.18em] text-white group-hover:text-emerald-400 transition">HALALVERIFY</h1>
                    </div>
                </div>
            </div>

            {/* Right side: profile circle or Sign In button */}
            <div className="flex items-center gap-2">
                {userRole ? (
                    <button
                        type="button"
                        onClick={onProfileClick}
                        aria-label="Open profile"
                        className="ml-2 h-9 w-9 rounded-full bg-slate-700 hover:bg-slate-600 transition flex items-center justify-center border border-slate-600 text-white text-sm font-semibold"
                    >
                        <User size={16} />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onSignInClick}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                    >
                        <User size={14} />
                        <span>Sign In</span>
                    </button>
                )}
            </div>
        </div>
    </div>
);

export default Topbar;