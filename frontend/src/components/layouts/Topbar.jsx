import React from 'react';

export const Topbar = ({ title, subtitle, action }) => (
    <div className="top-0 z-20 mb-6 w-full rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center">{action}</div>}
        </div>
    </div>
);

export default Topbar;