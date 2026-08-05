import React from 'react';
import { Menu, X } from 'lucide-react';

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
export const AppTopbar = ({ isSidebarOpen, onToggleSidebar }) => (
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

                <img 
                    src="/halalverify-logo.png" 
                    alt="HALALVERIFY logo" 
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-slate-700" 
                />
                <div>
                    <h1 className="text-base sm:text-xl font-black tracking-[0.18em] text-white">HALALVERIFY</h1>
                </div>
            </div>
        </div>
    </div>
);

export default Topbar;