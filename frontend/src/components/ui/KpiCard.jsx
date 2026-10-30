import React from 'react';

export const KpiCard = ({
    title,
    value,
    icon,
    color = 'emerald',
    subtitle,
    trend,
    onClick,
    className = '',
}) => {
    const colorMap = {
        blue: 'bg-blue-100 text-blue-600 border-blue-200',
        emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        green: 'bg-green-100 text-green-600 border-green-200',
        yellow: 'bg-amber-100 text-amber-600 border-amber-200',
        amber: 'bg-amber-100 text-amber-600 border-amber-200',
        red: 'bg-rose-100 text-rose-600 border-rose-200',
        rose: 'bg-rose-100 text-rose-600 border-rose-200',
        teal: 'bg-teal-100 text-teal-600 border-teal-200',
        purple: 'bg-purple-100 text-purple-600 border-purple-200',
        orange: 'bg-orange-100 text-orange-600 border-orange-200',
        gray: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-2.5 sm:gap-3.5 min-w-0 transition-all ${
                onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm active:scale-[0.99]' : ''
            } ${className}`}
        >
            {/* Compact Icon Badge */}
            <div className={`p-2.5 sm:p-3 rounded-xl border shrink-0 ${colorMap[color] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {React.isValidElement(icon)
                    ? React.cloneElement(icon, { size: 18, className: 'shrink-0' })
                    : icon}
            </div>

            {/* Metric Value & Label */}
            <div className="min-w-0 flex-1">
                <p
                    className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight truncate"
                    title={title}
                >
                    {title}
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-lg sm:text-2xl font-black text-slate-900 truncate">
                        {value}
                    </p>
                    {trend && (
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate">
                            {trend}
                        </span>
                    )}
                </div>
                {subtitle && (
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default KpiCard;
