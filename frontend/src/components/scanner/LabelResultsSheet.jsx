import { useState } from 'react';
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Sparkles,
    RefreshCw,
    Flag,
    ChevronDown
} from 'lucide-react';

export const LabelResultsSheet = ({
    scanResult,
    isLoading,
    onReset,
    onClose,
    onViewChange
}) => {
    const [touchStartY, setTouchStartY] = useState(null);

    const handleTouchStart = (e) => {
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e) => {
        if (touchStartY === null) return;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY;
        // If swiped down by more than 40px, dismiss sheet to return to camera
        if (deltaY > 40) {
            onClose();
        }
        setTouchStartY(null);
    };

    return (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
            {/* Clickable Backdrop to collapse */}
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-label="Collapse inspection sheet"
            />

            <div className="relative w-full max-h-[88%] bg-slate-900 border-t border-slate-700 rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 text-slate-100 z-10">
                {/* Grab Handle & Sheet Header with Swipe-Down Gesture */}
                <div 
                    className="p-3 pb-2 flex flex-col items-center border-b border-slate-800 touch-none select-none"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Draggable & Tappable Pill Handle */}
                    <div 
                        className="w-full py-1.5 flex justify-center cursor-pointer active:opacity-75"
                        onClick={onClose}
                        title="Swipe down or tap to return to camera"
                    >
                        <div className="w-14 h-1.5 bg-slate-600 rounded-full hover:bg-slate-500 transition" />
                    </div>

                    <div className="w-full flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <Sparkles size={16} className="text-emerald-400 shrink-0" />
                            <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-200 truncate">
                                Inspection & Pipeline
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReset();
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 text-xs font-semibold whitespace-nowrap transition disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                                title="Retake photo or scan another product"
                            >
                                <RefreshCw size={12} className={`text-emerald-400 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                                <span>Scan Again</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700/60 active:scale-95"
                                title="Collapse sheet and return to camera"
                                aria-label="Collapse inspection sheet"
                            >
                                <ChevronDown size={17} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[75vh]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <RefreshCw className="h-9 w-9 text-emerald-400 animate-spin" />
                            <p className="text-sm text-slate-300 font-semibold">Running Optical AI Analysis...</p>
                            <span className="text-xs text-slate-500">Executing YOLOv8-Nano and EasyOCR pipeline</span>
                        </div>
                    )}

                    {!isLoading && scanResult && (
                        <div className="space-y-4">
                            {/* Verdict Banner */}
                            <div
                                className={`p-4 rounded-2xl border flex items-center justify-between ${
                                    scanResult.verdict === 'Green'
                                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                        : scanResult.verdict === 'Yellow'
                                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                                        : 'bg-red-950/60 border-red-500/50 text-red-200'
                                }`}
                            >
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Classification Verdict
                                    </span>
                                    <p className="text-xl font-black tracking-wide">
                                        {scanResult.verdict} State
                                    </p>
                                    <p className="text-xs font-semibold mt-0.5 opacity-90">
                                        {scanResult.riskLevel}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/30 border border-white/10">
                                    {scanResult.verdict === 'Green' ? (
                                        <ShieldCheck size={28} className="text-emerald-400" />
                                    ) : scanResult.verdict === 'Yellow' ? (
                                        <AlertTriangle size={28} className="text-amber-400" />
                                    ) : (
                                        <ShieldAlert size={28} className="text-red-400" />
                                    )}
                                </div>
                            </div>

                            {/* Halal Logo Localization (YOLOv8-Nano) */}
                            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                                        <ShieldCheck size={14} /> Halal Logo Localization
                                    </span>
                                    <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                                        YOLOv8-Nano
                                    </span>
                                </div>

                                {scanResult.isInvalidLogo ? (
                                    <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                                            <ShieldAlert size={14} className="text-red-400 animate-pulse" />
                                            <span>Suspected Counterfeit / Invalid Mark</span>
                                        </div>
                                        <p className="text-xs text-red-300/90 leading-relaxed">
                                            An unauthorized, altered, or unverified halal certification logo was localized. Do not rely on this mark.
                                        </p>
                                    </div>
                                ) : scanResult.logoDetected ? (
                                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-300">
                                                {scanResult.logoBody}
                                            </span>
                                            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-800/60 text-emerald-200 rounded">
                                                {scanResult.logoConfidence}% Match
                                            </span>
                                        </div>
                                        <p className="text-xs text-emerald-300/80 leading-relaxed">
                                            Official certification mark recognized and cross-referenced with accredited Islamic bodies.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                                        No accredited halal certification seal localized in this photo frame.
                                    </p>
                                )}
                            </div>

                            {/* Analysis Summary & Flagged Additives */}
                            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                                <span className="text-xs uppercase font-bold text-slate-300">Analysis Summary</span>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {scanResult.analysisSummary}
                                </p>

                                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Screened Additive Compounds
                                    </span>
                                    {scanResult.flaggedIngredients?.length > 0 ? (
                                        scanResult.flaggedIngredients.map((flag, idx) => (
                                            <div key={idx} className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl space-y-1">
                                                <div className="flex items-center justify-between text-xs font-bold text-red-300">
                                                    <span>{flag.ingredient}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-red-900/80 text-red-200 text-[10px]">
                                                        {flag.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-red-300/80 leading-relaxed">
                                                    {flag.reason}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                                            <CheckCircle2 size={15} className="text-emerald-400" />
                                            <span>Zero prohibited additives identified against local database.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Extracted Ingredients Text (EasyOCR) */}
                            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-1.5">
                                        <FileText size={14} className="text-emerald-400" /> Extracted Ingredients Text
                                    </span>
                                    <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                                        EasyOCR Engine
                                    </span>
                                </div>
                                {scanResult.ocrText ? (
                                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-44 overflow-y-auto select-text">
                                        {scanResult.ocrText}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                                        No readable ingredient text extracted from this photo frame.
                                    </p>
                                )}
                            </div>

                            {/* 5-Stage IPO Process Inspector */}
                            {scanResult.pipelineStages?.length > 0 && (
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                                            <Sparkles size={14} /> IPO Process Inspector (5 Stages)
                                        </span>
                                        {scanResult.totalLatencyMs && (
                                            <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                                                {scanResult.totalLatencyMs} ms total
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {scanResult.pipelineStages.map((st) => (
                                            <div key={st.step} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">
                                                            {st.step}
                                                        </span>
                                                        {st.name}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {st.latencyMs !== undefined && (
                                                            <span className="text-[10px] font-mono text-slate-400">{st.latencyMs}ms</span>
                                                        )}
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                                                            {st.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                                                    <span className="text-emerald-400 font-mono mr-1">[{st.module}]</span>
                                                    {st.details}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {scanResult.recommendations?.length > 0 && (
                                <div className="bg-blue-950/60 border border-blue-500/40 rounded-2xl p-4 space-y-2">
                                    <span className="text-xs uppercase font-bold text-blue-300">Recommendations</span>
                                    <ul className="list-disc pl-4 text-xs text-blue-200/90 space-y-1">
                                        {scanResult.recommendations.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                                >
                                    <RefreshCw size={15} /> Retake / Scan Next
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onViewChange?.('report-issue')}
                                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition"
                                >
                                    <Flag size={15} /> Report Issue
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelResultsSheet;
