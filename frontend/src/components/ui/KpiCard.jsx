import React from 'react';

export const KpiCard = ({ title, value, icon, color }) => {
    const colorMap = {
        blue: 'bg-blue-100 text-blue-600 border-blue-200',
        emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        green: 'bg-green-100 text-green-600 border-green-200',
        yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
        red: 'bg-red-100 text-red-600 border-red-200',
        orange: 'bg-orange-100 text-orange-600 border-orange-200',
        gray: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* Compact Icon Badge */}
            <div className={`p-2.5 sm:p-3.5 rounded-xl border shrink-0 ${colorMap[color] || 'bg-slate-50 text-slate-600'}`}>
                {React.isValidElement(icon) 
                    ? React.cloneElement(icon, { className: 'w-4 h-4 sm:w-6 sm:h-6' }) 
                    : icon}
            </div>

            {/* Metric Value & Label */}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                    {title}
                </p>
                <p className="text-base sm:text-2xl font-black text-slate-800 truncate mt-0.5 sm:mt-1">
                    {value}
                </p>
            </div>
        </div>
    );
};

export default KpiCard;