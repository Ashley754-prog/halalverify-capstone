import { BookOpen, Users, Award } from 'lucide-react';
import { PROPONENTS, JURISDICTION } from '../data/constants';

export const Settings = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-6xl mx-auto w-full">
            {/* Header Title */}
            <div className="border-b border-slate-200/80 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">System Information</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Architecture overview, research framework, and development team details
                </p>
            </div>

            {/* Architecture Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">Database & Registry Architecture</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Product and establishment searches connect directly to the Supabase cloud database with 13,000+ verified records.
                        Image scanning and logo OCR utilize the cloud computer vision microservice.
                    </p>
                </div>
            </div>

            {/* About / Capstone Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 sm:mb-4 border-b border-slate-100 pb-2.5 sm:pb-3 flex items-center gap-2">
                        <Users size={16} />
                        About The Developers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {PROPONENTS.map((name, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 sm:p-5">
                                <p className="text-sm sm:text-base font-extrabold text-slate-800">{name}</p>
                                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Computer Science Research Scholar</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
                        <Award size={16} />
                        Academic & Judicial Framework
                    </h3>
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
        </div>
    );
};

export default Settings;
