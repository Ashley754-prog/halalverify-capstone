import { useState } from 'react';
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    FileText,
    RefreshCw,
    Flag,
    ChevronDown,
    Camera,
    Layers,
    PlusCircle,
    ChevronRight,
    Cpu
} from 'lucide-react';

export const LabelResultsSheet = ({
    scanResult,
    isLoading,
    onReset,
    onClose,
    onViewChange,
    onScanSecondary
}) => {
    const [touchStartY, setTouchStartY] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const handleTouchStart = (e) => {
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e) => {
        if (touchStartY === null) return;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY;
        if (deltaY > 40) {
            onClose();
        }
        setTouchStartY(null);
    };

    const totalImages = scanResult?.images?.length || 1;
    const isMultiPart = totalImages > 1 || scanResult?.isDualScan;

    return (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
            {/* Clickable Backdrop to collapse */}
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-label="Collapse inspection sheet"
            />

            <div className="relative w-full max-h-[88%] bg-slate-900 border-t border-slate-700/80 rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 text-slate-100 z-10">
                {/* Grab Handle & Sheet Header */}
                <div 
                    className="p-3 pb-2 flex flex-col items-center border-b border-slate-800 touch-none select-none"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div 
                        className="w-full py-1.5 flex justify-center cursor-pointer active:opacity-75"
                        onClick={onClose}
                        title="Swipe down or tap to return to camera"
                    >
                        <div className="w-12 h-1 bg-slate-600 rounded-full hover:bg-slate-500 transition" />
                    </div>

                    <div className="w-full flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-200 truncate">
                                Verification Result
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
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 text-xs font-semibold whitespace-nowrap transition disabled:opacity-50 shadow-xs"
                                title="Retake photo or scan another product"
                            >
                                <RefreshCw size={12} className={`text-emerald-400 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                                <span>Scan New</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700/60 active:scale-95"
                                title="Collapse sheet"
                                aria-label="Collapse inspection sheet"
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 max-h-[75vh]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                            <p className="text-sm text-slate-200 font-semibold">Screening Ingredients & Logos...</p>
                            <span className="text-xs text-slate-400">Matching against Philippine Halal Standards</span>
                        </div>
                    )}

                    {!isLoading && scanResult && (
                        <div className="space-y-3.5">
                            {/* 1. Primary Verdict Card */}
                            <div
                                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                                    scanResult.verdict === 'Green'
                                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-100'
                                        : scanResult.verdict === 'Yellow'
                                        ? 'bg-amber-950/60 border-amber-500/40 text-amber-100'
                                        : 'bg-red-950/60 border-red-500/40 text-red-100'
                                }`}
                            >
                                <div className="space-y-1 min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                        Halal Status
                                    </span>
                                    <p className="text-xl font-bold tracking-tight">
                                        {scanResult.riskLevel || (
                                            scanResult.verdict === 'Green'
                                                ? 'Verified Halal'
                                                : scanResult.verdict === 'Yellow'
                                                ? 'Needs Review'
                                                : 'Prohibited (Not Halal)'
                                        )}
                                    </p>
                                    <p className="text-xs opacity-90 leading-snug">
                                        {scanResult.analysisSummary || scanResult.riskLevel}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/30 border border-white/10 shrink-0">
                                    {scanResult.verdict === 'Green' ? (
                                        <ShieldCheck size={28} className="text-emerald-400" />
                                    ) : scanResult.verdict === 'Yellow' ? (
                                        <AlertTriangle size={28} className="text-amber-400" />
                                    ) : (
                                        <ShieldAlert size={28} className="text-red-400" />
                                    )}
                                </div>
                            </div>

                            {/* 2. Packaging Continuation or Guidance */}
                            {scanResult.riskLevel === 'No Product Detected' ? (
                                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-200">
                                    <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                                        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                                        <span>How to get an accurate scan</span>
                                    </p>
                                    <p className="text-[11px] text-amber-100/80 leading-relaxed">
                                        Point your camera directly at the packaging showing either the list of ingredients or an accredited Halal logo. Ensure the text is clear, well-lit, and not blurry.
                                    </p>
                                </div>
                            ) : isMultiPart ? (
                                /* Multi-Part Already Captured View */
                                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layers size={14} className="text-emerald-400" />
                                            <span className="text-xs font-semibold text-emerald-300">
                                                Multi-Section Fusion ({totalImages} Panels Combined)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onScanSecondary?.('continue-ingredients')}
                                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                        >
                                            <PlusCircle size={12} />
                                            <span>Add Part {totalImages + 1}</span>
                                        </button>
                                    </div>

                                    {scanResult.images && scanResult.images.length > 1 && (
                                        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                                            {scanResult.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setSelectedImageIndex(idx)}
                                                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                                                        selectedImageIndex === idx
                                                            ? 'border-emerald-400 ring-2 ring-emerald-500/40'
                                                            : 'border-slate-700 opacity-60'
                                                    }`}
                                                >
                                                    <img src={img} alt={`Part ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <span className="absolute bottom-0 right-0 px-1 text-[8px] font-bold bg-black/80 text-white rounded-tl">
                                                        Part {idx + 1}
                                                    </span>
                                                </button>
                                            ))}
                                            <span className="text-[11px] text-slate-400 ml-1">
                                                All text combined & evaluated together
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Single Capture Actions: Prompt to Add Next Section or Logo */
                                <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl space-y-2">
                                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                                        Packaging Continuation
                                    </span>

                                    {/* Action 1: Long Ingredients Continuation */}
                                    <button
                                        type="button"
                                        onClick={() => onScanSecondary?.('continue-ingredients')}
                                        className="w-full p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex items-center justify-between gap-2 group transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                                                <Layers size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition">
                                                    + Scan Continuing Ingredients (Part 2)
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    For long labels or packaging that wraps around
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={15} className="text-slate-500 group-hover:text-emerald-400 transition" />
                                    </button>

                                    {/* Action 2: Scan Logo (If not yet found) */}
                                    {!scanResult.logoDetected && (
                                        <button
                                            type="button"
                                            onClick={() => onScanSecondary?.('logo')}
                                            className="w-full p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex items-center justify-between gap-2 group transition"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-md bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                                                    <ShieldCheck size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-white group-hover:text-blue-300 transition">
                                                        + Scan Halal Logo (Front Panel)
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        Verify accredited certification seal on front
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight size={15} className="text-slate-500 group-hover:text-blue-400 transition" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* 3. Screened Additives & Ingredients */}
                            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                        Ingredients & Additives
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {scanResult.flaggedIngredients?.length || 0} Flagged
                                    </span>
                                </div>

                                {scanResult.flaggedIngredients?.length > 0 ? (
                                    <div className="space-y-2 pt-1">
                                        {scanResult.flaggedIngredients.map((flag, idx) => {
                                            const isHaram = (flag.status || '').toLowerCase() === 'haram';
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                                                        isHaram
                                                            ? 'bg-red-950/60 border-red-500/40 text-red-200'
                                                            : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between font-bold">
                                                        <span>{flag.ingredient}</span>
                                                        <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded border ${
                                                            isHaram
                                                                ? 'bg-red-900/80 border-red-400/50 text-red-100'
                                                                : 'bg-amber-900/80 border-amber-400/50 text-amber-100'
                                                        }`}>
                                                            {flag.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] opacity-90 leading-relaxed">
                                                        {flag.reason}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : scanResult.riskLevel === 'No Product Detected' ? (
                                    <div className="p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-lg text-xs text-slate-400 flex items-center gap-2">
                                        <FileText size={15} className="text-slate-500 shrink-0" />
                                        <span>No ingredient label detected in this photo.</span>
                                    </div>
                                ) : (
                                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                        <span>No prohibited or doubtful food additives found.</span>
                                    </div>
                                )}
                            </div>

                            {/* 4. Halal Logo Status */}
                            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className={scanResult.logoDetected ? 'text-emerald-400' : 'text-slate-500'} />
                                    <span className="text-slate-300">
                                        Halal Seal: <strong className="text-white font-semibold">{scanResult.logoDetected ? scanResult.logoBody : 'Not detected on this panel'}</strong>
                                    </span>
                                </div>
                                {scanResult.logoDetected && scanResult.logoConfidence > 0 && (
                                    <span className="font-mono text-[10px] text-emerald-300 bg-emerald-900/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                        {scanResult.logoConfidence}% match
                                    </span>
                                )}
                            </div>

                            {/* 5. Recommendations / Next Steps */}
                            {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                                        Next Steps
                                    </span>
                                    <ul className="space-y-1.5 text-xs text-slate-300">
                                        {scanResult.recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                                                <span className="leading-snug">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 6. Collapsible Technical & IPO Pipeline Details (Thesis Reference) */}
                            <details className="group rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                                <summary className="cursor-pointer font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between select-none">
                                    <span className="flex items-center gap-1.5">
                                        <Cpu size={14} className="text-emerald-400" />
                                        <span>Technical & Pipeline Details (Thesis Defense)</span>
                                    </span>
                                    <ChevronDown size={14} className="transition-transform group-open:rotate-180 text-slate-500" />
                                </summary>

                                <div className="mt-3 space-y-3 pt-2 border-t border-slate-800/80">
                                    {/* 5 Stages Breakdown */}
                                    {scanResult.pipelineStages?.length > 0 && (
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                                5-Stage IPO Execution
                                            </span>
                                            {scanResult.pipelineStages.map((st) => (
                                                <div key={st.step} className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-300">
                                                        <strong className="text-emerald-400 mr-1.5">#{st.step}</strong>
                                                        {st.name}
                                                    </span>
                                                    <span className="font-mono text-slate-400 text-[10px]">
                                                        {st.latencyMs ? `${st.latencyMs}ms` : st.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Raw Extracted OCR Text */}
                                    {scanResult.ocrText && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                                Raw Extracted OCR Text
                                            </span>
                                            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap select-text">
                                                {scanResult.ocrText}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </details>

                            {/* 7. Footer Actions */}
                            <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                                >
                                    <RefreshCw size={14} /> {scanResult.riskLevel === 'No Product Detected' ? 'Scan Food Product' : 'Scan Next Product'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onViewChange?.('report-issue')}
                                    className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition"
                                >
                                    <Flag size={13} /> Report
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
