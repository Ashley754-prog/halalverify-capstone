import React, { useState } from 'react';
import { LayoutDashboard, Camera, BookOpen, Clock, Flag, BarChart2, Settings, LogOut, ShieldCheck } from 'lucide-react';
import NavItem from '../ui/NavItem';

export const Sidebar = ({ children, currentView, onViewChange, userRole, onSignOut }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800`}>
                <div className={`border-b border-slate-800 flex items-center ${isOpen ? 'p-5 justify-between' : 'p-4 justify-center'}`}>
                    {isOpen ? (
                        <button onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 text-lg font-black tracking-widest text-white focus:outline-none">
                            <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-7 w-7 rounded-full object-cover" />
                            HALALVERIFY
                        </button>
                    ) : (
                        <button onClick={() => setIsOpen(true)} className="flex items-center justify-center text-slate-300 focus:outline-none">
                            <img src="/halalverify-logo.png" alt="HALALVERIFY logo" className="h-8 w-8 rounded-full object-cover" />
                        </button>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-between py-4">
                    <nav className="px-3 space-y-1">
                        <NavItem collapsed={!isOpen} active={currentView === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => onViewChange('dashboard')} />
                        <NavItem collapsed={!isOpen} active={currentView === 'scanner'} icon={<Camera size={18} />} label="Halal Scanner" onClick={() => onViewChange('scanner')} />
                        <NavItem collapsed={!isOpen} active={currentView === 'registry'} icon={<BookOpen size={18} />} label="Local Registry" onClick={() => onViewChange('registry')} />
                        <NavItem collapsed={!isOpen} active={currentView === 'scan-history'} icon={<Clock size={18} />} label="Scan History" onClick={() => onViewChange('scan-history')} />
                        <NavItem collapsed={!isOpen} active={currentView === 'report-issue'} icon={<Flag size={18} />} label="Report Issue" onClick={() => onViewChange('report-issue')} />
                        {/* Admin-only link */}
                        {userRole === 'admin' && (
                            <NavItem collapsed={!isOpen} active={currentView === 'analytics'} icon={<BarChart2 size={18} />} label="Analytics" onClick={() => onViewChange('analytics')} />
                        )}
                    </nav>

                    <div className="px-3 space-y-1">
                        <NavItem collapsed={!isOpen} active={currentView === 'settings'} icon={<Settings size={18} />} label="Settings" onClick={() => onViewChange('settings')} />
                        <button
                            onClick={onSignOut}
                            className={`w-full flex items-center rounded-xl transition-all ${isOpen ? 'gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-950/30' : 'justify-center p-3 text-red-400 hover:bg-slate-800'}`}
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                            {isOpen && <span className="font-medium">Sign Out</span>}
                        </button>
                    </div>
                </div>
            </aside>

            <main className="min-w-0 flex-1 flex flex-col h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default Sidebar;