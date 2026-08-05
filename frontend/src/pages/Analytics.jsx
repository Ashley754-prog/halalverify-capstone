import React from 'react';
import { BarChart2, Target, Eye, FileText, Users, TrendingUp } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import { MODEL_METRICS } from '../data/constants';

const MetricCard = ({ label, value, unit, sublabel, color = 'emerald', icon }) => {
    const colors = {
        emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/20',
        blue: 'from-blue-500 to-blue-700 shadow-blue-500/20',
        amber: 'from-amber-500 to-amber-700 shadow-amber-500/20',
        purple: 'from-purple-500 to-purple-700 shadow-purple-500/20',
        red: 'from-red-500 to-red-700 shadow-red-500/20',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 sm:p-6 text-white shadow-lg`}>
            <div className="flex justify-between items-start mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/80">{label}</p>
                <div className="p-1.5 sm:p-2 bg-white/15 rounded-lg">{icon}</div>
            </div>
            <p className="text-3xl sm:text-4xl font-black tracking-tight">
                {value}
                <span className="text-base sm:text-lg font-semibold ml-1 text-white/80">{unit}</span>
            </p>
            {sublabel && <p className="text-[11px] sm:text-xs text-white/70 mt-1 font-medium">{sublabel}</p>}
        </div>
    );
};

const BatchTable = ({ batches }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600 shrink-0" /> YOLOv8-Nano Training Batch Results
            </h3>
            <p className="text-xs text-slate-500 mt-1">Performance progression across training batches (n=50 to n=200 product samples)</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 sm:px-6 text-left font-bold">Batch</th>
                        <th className="px-4 py-3 sm:px-6 text-left font-bold">Precision (%)</th>
                        <th className="px-4 py-3 sm:px-6 text-left font-bold">Recall (%)</th>
                        <th className="px-4 py-3 sm:px-6 text-left font-bold">mAP₅₀ (%)</th>
                        <th className="px-4 py-3 sm:px-6 text-left font-bold">Progress</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {batches.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-slate-800 whitespace-nowrap">{b.batch}</td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-600">{b.precision.toFixed(1)}</td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-600">{b.recall.toFixed(1)}</td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4 font-bold text-emerald-700">{b.mAP50.toFixed(1)}</td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                                <div className="w-20 sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${b.mAP50}%` }} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const Analytics = () => {
    const { yolov8, easyocr, paddleocr, sus } = MODEL_METRICS;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            <Topbar
                title="Analytics & Model Performance"
                subtitle="Technical evaluation metrics for Specific Objective #3 — Precision, Recall, mAP₅₀, CER, and SUS scores."
            />

            {/* Section: YOLOv8 */}
            <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">Module 1</span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">YOLOv8-Nano + EasyOCR</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <MetricCard label="Precision" value={yolov8.precision} unit="%" sublabel="Logo detection accuracy" color="emerald" icon={<Target size={18} />} />
                    <MetricCard label="Recall" value={yolov8.recall} unit="%" sublabel="True positive rate" color="blue" icon={<Eye size={18} />} />
                    <MetricCard label="mAP₅₀" value={yolov8.mAP50} unit="%" sublabel="Mean Avg. Precision @ IoU 0.5" color="purple" icon={<BarChart2 size={18} />} />
                    <MetricCard label="CER" value={easyocr.cer} unit="%" sublabel="Character Error Rate (EasyOCR)" color="amber" icon={<FileText size={18} />} />
                </div>
                <BatchTable batches={yolov8.batches} />
            </div>

            {/* Section: PaddleOCR */}
            <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">Module 2</span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] sm:text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">PaddleOCR Structure</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <MetricCard label="Layout Accuracy" value={paddleocr.layoutAccuracy} unit="%" sublabel="Correct structural zone segmentation" color="purple" icon={<FileText size={18} />} />
                    <MetricCard label="Field Extraction Rate" value={paddleocr.fieldExtractionRate} unit="%" sublabel="Correctly extracted logo fields" color="blue" icon={<Target size={18} />} />
                </div>
            </div>

            {/* Section: SUS */}
            <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">Usability Evaluation</span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">System Usability Scale (SUS)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard label="SUS Score" value={sus.score} unit="/100" sublabel={`Rating: ${sus.rating}`} color="emerald" icon={<Users size={18} />} />
                    <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col justify-center">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">SUS Score Interpretation</p>
                        <div className="flex flex-col gap-2">
                            {[
                                { range: '≥ 90', label: 'Best Imaginable', color: 'bg-emerald-500' },
                                { range: '≥ 80', label: 'Excellent', color: 'bg-blue-500' },
                                { range: '≥ 70', label: 'Good', color: 'bg-amber-500' },
                                { range: '≥ 51', label: 'OK', color: 'bg-orange-500' },
                                { range: '< 51', label: 'Poor / Failing', color: 'bg-red-500' },
                            ].map(({ range, label, color }) => (
                                <div key={label} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${color} ${sus.score >= parseInt(range) || range === '≥ 80' ? '' : 'opacity-30'}`} />
                                    <span className={`text-xs sm:text-sm font-medium ${label === 'Excellent' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                                        {range} — {label}
                                        {label === 'Excellent' && <span className="ml-2 text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Current Score</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-4">Based on {sus.respondents} respondents from Zamboanga City consumer/inspector group.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;