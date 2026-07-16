import React from 'react';

export const NavItem = ({ active, icon, label, onClick, collapsed = false }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            } ${collapsed ? 'justify-center px-3' : ''}`}
        title={label}
    >
        {icon}
        {!collapsed && <span className="transition-all duration-200">{label}</span>}
    </button>
);

export default NavItem;