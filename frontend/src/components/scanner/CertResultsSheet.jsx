import { useState } from 'react';
import {
    Sparkles,
    RefreshCw,
    Flag,
    ChevronDown
} from 'lucide-react';

export const CertResultsSheet = ({
    certResult,
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
                                Certificate Verification
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
                                title="Retake photo or scan another certificate"
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
                            <span className="text-xs text-slate-500">Evaluating Certificate Security & Metadata</span>
                        </div>
                    )}

                    {!isLoading && certResult && (
                        <div className="space-y-4">
                            <div
                                className={`p-4 rounded-2xl border flex items-center justify-between ${
                                    certResult.status === 'Valid'
                                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                        : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                                }`}
                            >
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Document Status
                                    </span>
                                    <p className="text-xl font-black">{certResult.status}</p>
                                </div>
                            </div>

                            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
                                <p className="text-slate-300">Certifying Body: <span className="font-bold text-white">{certResult.certifyingBody}</span></p>
                                <p className="text-slate-300">Establishment: <span className="font-bold text-white">{certResult.establishmentName}</span></p>
                                <p className="text-slate-300">Serial Key: <span className="font-bold font-mono text-emerald-400">{certResult.certificateNumber}</span></p>
                                <p className="text-slate-300">Expiry Date: <span className="font-bold text-white">{certResult.expirationDate || 'Not detected'}</span></p>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                                >
                                    <RefreshCw size={15} /> Scan Another Certificate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onViewChange?.('report-issue')}
                                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition"
                                >
                                    <Flag size={15} /> Report Discrepancy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertResultsSheet;
