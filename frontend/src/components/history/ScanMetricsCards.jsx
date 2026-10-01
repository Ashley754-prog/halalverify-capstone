import { Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const ScanMetricsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Scans</span>
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <Layers size={15} />
                    </div>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-slate-900">{stats.total}</div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Recorded scan events</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Halal Verified</span>
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={15} />
                    </div>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-emerald-600">{stats.halal}</div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Passed verification</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Doubtful Scans</span>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                        <AlertTriangle size={15} />
                    </div>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-amber-600">{stats.doubtful}</div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Require origin review</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Prohibited</span>
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                        <XCircle size={15} />
                    </div>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-rose-600">{stats.prohibited}</div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Non-compliant items</p>
            </div>
        </div>
    );
};

export default ScanMetricsCards;
