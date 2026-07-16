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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`p-4 rounded-xl border ${colorMap[color] || 'bg-slate-50 text-slate-600'}`}>{icon}</div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

export default KpiCard;