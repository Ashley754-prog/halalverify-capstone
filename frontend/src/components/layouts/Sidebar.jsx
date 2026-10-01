
import { useEffect, useState } from 'react';
import { Home, LayoutDashboard, Camera, Package, MapPin, BookOpen, Clock, Flag, BarChart2, Settings, LogOut, LogIn, Menu, ShieldCheck } from 'lucide-react';
import NavItem from '../ui/NavItem';
import { supabase } from '../../lib/supabaseClient';

export const Sidebar = ({ children, currentView, onViewChange, userRole, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const isOpen = isSidebarOpen;
    const [pendingCount, setPendingCount] = useState(0);

    // Live sync pending approvals count for admin badge
    useEffect(() => {
        if (userRole !== 'admin') return;

        let isMounted = true;
        const fetchPendingCount = async () => {
            try {
                const { count } = await supabase
                    .from('establishments')
                    .select('id', { count: 'exact', head: true })
                    .or('halal_status.ilike.%pending%,halal_status.ilike.%needs_review%');

                if (isMounted && typeof count === 'number') {
                    setPendingCount(count);
                }
            } catch {
                // Silently ignore if offline
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 25000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [userRole]);

    // Helper to handle view changes and auto-close drawer on mobile viewports
    const handleNavClick = (viewName) => {
        onViewChange(viewName);
        // Automatically close sidebar drawer on mobile screens after selecting a view
        if (window.innerWidth < 768 && isOpen) {
            toggleSidebar();
        }
    };

    return (
        <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-50 relative">
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/70 z-[9998] md:hidden backdrop-blur-sm transition-opacity"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-[9999]
                ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} 
                bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800
            `}>
                {/* Sidebar Header */}
                <div className={`border-b border-slate-800 flex items-center ${isOpen ? 'p-4 justify-between' : 'p-4 justify-center'}`}>
                    {isOpen && (
                        <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => handleNavClick('landing')}
                            title="Return to Home Landing Page"
                        >
                            <img src="/halalverify-logo.png" alt="HalalVerify Logo" className="h-8 w-8 rounded-full group-hover:scale-105 transition" />
                            <span className="font-extrabold tracking-wider text-white text-sm group-hover:text-emerald-400 transition">HALALVERIFY</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="inline-flex items-center justify-center rounded-xl p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none"
                        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
                    >
                        {isOpen ? <Menu size={20} className="md:hidden" /> : null}
                        <Menu size={20} className={isOpen ? 'hidden md:block' : 'block'} />
                    </button>
                </div>

                {/* Sidebar Navigation Links */}
                <div className="flex-1 flex flex-col justify-between py-3 overflow-y-auto">
                    <nav className="px-3 space-y-3">
                        {/* Section 1: Main Features */}
                        <div className="space-y-1">
                            {isOpen ? (
                                <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    Main
                                </p>
                            ) : (
                                <div className="my-1 border-t border-slate-800/80 mx-2" />
                            )}
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'landing'} 
                                icon={<Home size={18} />} 
                                label="Home" 
                                onClick={() => handleNavClick('landing')} 
                            />
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'dashboard'} 
                                icon={<LayoutDashboard size={18} />} 
                                label="Dashboard" 
                                onClick={() => handleNavClick('dashboard')} 
                            />
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'scanner'} 
                                icon={<Camera size={18} />} 
                                label="Halal Scanner" 
                                onClick={() => handleNavClick('scanner')} 
                            />
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'products'} 
                                icon={<Package size={18} />} 
                                label="Product Catalog" 
                                onClick={() => handleNavClick('products')} 
                            />
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'map'} 
                                icon={<MapPin size={18} />} 
                                label="Establishments Map" 
                                onClick={() => handleNavClick('map')} 
                            />
                        </div>

                        {/* Section 2: Community & Knowledge */}
                        <div className="space-y-1">
                            {isOpen ? (
                                <p className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    Community & Tools
                                </p>
                            ) : (
                                <div className="my-2 border-t border-slate-800/80 mx-2" />
                            )}
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'registry'} 
                                icon={<BookOpen size={18} />} 
                                label="Local Registry" 
                                onClick={() => handleNavClick('registry')} 
                            />
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'scan-history'} 
                                icon={<Clock size={18} />} 
                                label="Scan History" 
                                onClick={() => handleNavClick('scan-history')} 
                            />
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'report-issue'} 
                                icon={<Flag size={18} />} 
                                label="Report Issue" 
                                onClick={() => handleNavClick('report-issue')} 
                            />
                        </div>

                        {/* Section 3: Management (Admin Only) */}
                        {userRole === 'admin' && (
                            <div className="space-y-1">
                                {isOpen ? (
                                    <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                                            <ShieldCheck size={12} className="text-emerald-500" />
                                            Management
                                        </span>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                                            Admin
                                        </span>
                                    </div>
                                ) : (
                                    <div className="my-2 border-t border-emerald-900/60 mx-2" />
                                )}
                                <NavItem 
                                    collapsed={!isOpen} 
                                    active={currentView === 'verification-queue'} 
                                    icon={<ShieldCheck size={18} />} 
                                    label="Verification Queue" 
                                    badge={pendingCount > 0 ? pendingCount : null}
                                    onClick={() => handleNavClick('verification-queue')} 
                                />
                                <NavItem 
                                    collapsed={!isOpen} 
                                    active={currentView === 'analytics'} 
                                    icon={<BarChart2 size={18} />} 
                                    label="Analytics" 
                                    onClick={() => handleNavClick('analytics')} 
                                />
                            </div>
                        )}
                    </nav>

                    <div className="px-3 space-y-1 pt-4 border-t border-slate-800/60">
                        <NavItem 
                            collapsed={!isOpen} 
                            active={currentView === 'settings'} 
                            icon={<Settings size={18} />} 
                            label="Settings" 
                            onClick={() => handleNavClick('settings')} 
                        />
                        {userRole ? (
                            <button
                                onClick={onSignOut}
                                className={`w-full flex items-center rounded-xl transition-all ${
                                    isOpen ? 'gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-950/30' : 'justify-center p-3 text-red-400 hover:bg-slate-800'
                                }`}
                                title="Sign Out"
                            >
                                <LogOut size={18} className="shrink-0" />
                                {isOpen && <span className="font-medium truncate">Sign Out</span>}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleNavClick('login')}
                                className={`w-full flex items-center rounded-xl transition-all ${
                                    isOpen ? 'gap-3 px-4 py-3 text-sm text-emerald-400 hover:bg-emerald-950/30 font-semibold' : 'justify-center p-3 text-emerald-400 hover:bg-slate-800'
                                }`}
                                title="Sign In"
                            >
                                <LogIn size={18} className="shrink-0" />
                                {isOpen && <span className="font-medium truncate">Sign In / Register</span>}
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <main className={`min-w-0 flex-1 flex flex-col h-screen h-[100dvh] w-full ${currentView === 'map' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {children}
            </main>
        </div>
    );
};

export default Sidebar;