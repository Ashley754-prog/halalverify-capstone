import React from 'react';
import { LayoutDashboard, CheckCircle2, ShieldAlert, Users } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import Topbar from '../components/layouts/Topbar';

export const Dashboard = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            <Topbar
                title="Live System Telemetry"
                subtitle="Computer Vision Pipeline Metrics and Regional Usability statistics."
                action={
                    <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold border border-emerald-200">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {/* Mobile: compact label */}
                            <span className="sm:hidden font-semibold">15 FPS</span>
                            {/* Desktop/tablet: full label */}
                            <span className="hidden sm:inline truncate">YOLOv8-Nano Weight Active (15 FPS)</span>
                        </div>
                }
            />

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <KpiCard title="YOLOv8 mAP₅₀" value="92.4%" icon={<LayoutDashboard />} color="emerald" />
                <KpiCard title="EasyOCR Precision" value="93.1%" icon={<CheckCircle2 />} color="green" />
                <KpiCard title="System Usability Score" value="83.5" icon={<Users />} color="yellow" />
                <KpiCard title="Flagged Additives" value="6 Active" icon={<ShieldAlert />} color="red" />
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1 sm:mb-2">Technical Implementation Overview</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">Evaluation results collected from testing on standard Android/iOS smartphones.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="border border-slate-100 rounded-xl p-4 sm:p-5 bg-slate-50/50">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Model Accuracy Benchmarks</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-slate-600 font-medium">Logo Recognition Recall</span>
                                <span className="font-bold text-slate-800">90.8%</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-slate-600 font-medium">Character Error Rate (CER)</span>
                                <span className="font-bold text-slate-800">4.2%</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-slate-600 font-medium">Pipeline Average Processing Time</span>
                                <span className="font-bold text-slate-800">1.2 seconds</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-4 sm:p-5 bg-slate-50/50">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Zamboanga Local Compliance Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-slate-600 font-medium">Registered Establishments</span>
                                <span className="font-bold text-slate-800">4 Monitored</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-slate-600 font-medium">Ordinance No. 489 Standards</span>
                                <span className="font-bold text-emerald-600">Compliant</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-slate-600 font-medium">Usability Rating (SUS)</span>
                                <span className="font-bold text-slate-800">Excellent (Grade A)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;