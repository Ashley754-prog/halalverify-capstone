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
    tooltip,
}) => {
    const colorMap = {
        blue: 'bg-blue-100/80 text-blue-600 border-blue-200/80',
        emerald: 'bg-emerald-100/80 text-emerald-600 border-emerald-200/80',
        green: 'bg-green-100/80 text-green-600 border-green-200/80',
        yellow: 'bg-amber-100/80 text-amber-600 border-amber-200/80',
        amber: 'bg-amber-100/80 text-amber-600 border-amber-200/80',
        red: 'bg-rose-100/80 text-rose-600 border-rose-200/80',
        rose: 'bg-rose-100/80 text-rose-600 border-rose-200/80',
        teal: 'bg-teal-100/80 text-teal-600 border-teal-200/80',
        purple: 'bg-purple-100/80 text-purple-600 border-purple-200/80',
        orange: 'bg-orange-100/80 text-orange-600 border-orange-200/80',
        gray: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    const formattedValue = typeof value === 'number'
        ? value.toLocaleString()
        : (value === null || value === undefined ? '—' : value);

    return (
        <div
            onClick={onClick}
            title={tooltip || (onClick ? `View ${title}` : undefined)}
            className={`bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-3 sm:gap-3.5 min-w-0 transition duration-150 ${
                onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0' : ''
            } ${className}`}
        >
            {/* Standardized Icon Container */}
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {React.isValidElement(icon)
                    ? React.cloneElement(icon, { size: 19, className: 'shrink-0' })
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
                    <p className="text-lg sm:text-2xl font-black text-slate-900 truncate tracking-tight">
                        {formattedValue}
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
