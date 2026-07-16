import React, { useState } from 'react';
import { DownloadCloud, CheckCircle, Database } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import { PROPONENTS, JURISDICTION } from '../data/constants';

export const Settings = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState('Today, 08:30 AM');

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            const now = new Date();
            setLastSync(`Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        }, 2000);
    };

    return (
        <div className="p-8 space-y-6">
            <Topbar
                title="System Settings"
                subtitle="Manage application preferences and offline database."
            />

            {/* Offline Sync Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Local Database Sync</h3>
                        <p className="text-xs text-slate-500 mt-1">Download the latest Halal Establishments and E-Numbers dictionary for offline scanning.</p>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Last Synced</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500" /> {lastSync}
                        </p>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                            isSyncing
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                        }`}
                    >
                        <DownloadCloud size={18} />
                        {isSyncing ? 'Downloading...' : 'Update Database'}
                    </button>
                </div>
            </div>

            {/* About / Capstone Info (Migrated from Proponents.jsx) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-emerald-600 mb-4 border-b border-slate-100 pb-3">
                    About The Developers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {PROPONENTS.map((name, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                            <p className="text-base font-extrabold text-slate-800">{name}</p>
                            <p className="text-xs text-slate-400 mt-1">Computer Science Research Scholar</p>
                        </div>
                    ))}
                </div>

                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-emerald-600 mb-2">Academic & Judicial Framework</h3>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
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
