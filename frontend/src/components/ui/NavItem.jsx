

export const NavItem = ({ active, icon, label, onClick, collapsed = false, badge = null }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            active
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
        } ${collapsed ? 'justify-center px-3' : ''}`}
        title={label}
    >
        <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0">{icon}</span>
            {!collapsed && <span className="transition-all duration-200 truncate">{label}</span>}
        </div>
        {!collapsed && badge !== null && badge !== undefined && (
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                active ? 'bg-white text-emerald-800' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
                {badge}
            </span>
        )}
    </button>
);

export default NavItem;