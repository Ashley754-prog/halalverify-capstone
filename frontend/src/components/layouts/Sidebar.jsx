import React from 'react';
import { LayoutDashboard, Camera, Package, MapPin, BookOpen, Clock, Flag, BarChart2, Settings, LogOut, Menu} from 'lucide-react';
import NavItem from '../ui/NavItem';

export const Sidebar = ({ children, currentView, onViewChange, userRole, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const isOpen = isSidebarOpen;

    // Helper to handle view changes and auto-close drawer on mobile viewports
    const handleNavClick = (viewName) => {
        onViewChange(viewName);
        // Automatically close sidebar drawer on mobile screens after selecting a view
        if (window.innerWidth < 768 && isOpen) {
            toggleSidebar();
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 relative">
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
                        <div className="flex items-center gap-2">
                            <img src="/halalverify-logo.png" alt="HalalVerify Logo" className="h-8 w-8 rounded-full" />
                            <span className="font-extrabold tracking-wider text-white text-sm">HALALVERIFY</span>
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
                <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
                    <nav className="px-3 space-y-1">
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
                        {userRole === 'admin' && (
                            <NavItem 
                                collapsed={!isOpen} 
                                active={currentView === 'analytics'} 
                                icon={<BarChart2 size={18} />} 
                                label="Analytics" 
                                onClick={() => handleNavClick('analytics')} 
                            />
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
                    </div>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <main className="min-w-0 flex-1 flex flex-col h-screen overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
};

export default Sidebar;