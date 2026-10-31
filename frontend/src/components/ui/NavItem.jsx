export const NavItem = ({ active, icon, label, onClick, collapsed = false, badge = null }) => (
    <div className="relative group w-full">
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            } ${collapsed ? 'justify-center px-2.5' : ''}`}
            title={collapsed ? (badge !== null && badge !== undefined ? `${label} (${badge})` : label) : undefined}
            aria-label={label}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0">{icon}</span>
                {!collapsed && <span className="transition-all duration-200 truncate">{label}</span>}
            </div>
            {!collapsed && badge !== null && badge !== undefined && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    active ? 'bg-white text-emerald-800' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                    {badge}
                </span>
            )}
            {collapsed && badge !== null && badge !== undefined && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
            )}
        </button>

        {/* Floating tooltip when sidebar is collapsed */}
        {collapsed && (
            <div className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[100] animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-950 border border-slate-700/80 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5">
                    <span>{label}</span>
                    {badge !== null && badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                            {badge}
                        </span>
                    )}
                </div>
            </div>
        )}
    </div>
);

export default NavItem;
