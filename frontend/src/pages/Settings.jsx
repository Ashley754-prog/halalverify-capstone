import React from 'react';
import { BookOpen } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import { PROPONENTS, JURISDICTION } from '../data/constants';

export const Settings = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1">
            <Topbar
                title="System Settings"
                subtitle="Application information and capstone details."
            />

            {/* Offline dictionary status — honest placeholder until offline caching is actually built */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex items-start gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                    <BookOpen size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">Offline Dictionary</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Not yet available. Offline caching of the additive and establishment registry is
                        a planned feature — scanning currently requires an active connection to the backend.
                    </p>
                </div>
            </div>

            {/* About / Capstone Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mt-6 sm:mt-8">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 sm:mb-4 border-b border-slate-100 pb-2.5 sm:pb-3">
                    About The Developers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6">
                    {PROPONENTS.map((name, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 sm:p-5">
                            <p className="text-sm sm:text-base font-extrabold text-slate-800">{name}</p>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Computer Science Research Scholar</p>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 mb-2">Academic & Judicial Framework</h3>
                <div className="text-xs sm:text-sm text-slate-600 space-y-2 sm:space-y-3 leading-relaxed">
                    <p>
                        <strong>Sector Priority Focus:</strong> Smart Food Safety, Applied Computer Vision Systems, Regulatory Inspection Automation.
                    </p>
                    <p>
                        <strong>Jurisdictional Directive:</strong> Tailored targeting frameworks aligned specifically with <strong>{JURISDICTION}</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
