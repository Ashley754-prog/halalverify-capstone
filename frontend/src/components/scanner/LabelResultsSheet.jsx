import { useState } from 'react';
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Flag,
    ChevronDown,
    Layers,
    PlusCircle,
    ChevronRight,
    Package,
    ScanSearch,
    Camera,
    Info,
} from 'lucide-react';
import { simplifyHalalText, simplifyStatus } from '../../utils/textFormatters';

export const LabelResultsSheet = ({
    scanResult,
    isLoading,
    onReset,
    onRetry = null,
    onClose,
    onViewChange,
    onScanSecondary,
}) => {
    const [touchStartY, setTouchStartY] = useState(null);

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
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 text-xs font-semibold whitespace-nowrap transition disabled:opacity-50 shadow-xs cursor-pointer"
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
                                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700/60 active:scale-95 cursor-pointer"
                                title="Collapse sheet"
                                aria-label="Collapse inspection sheet"
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-4 sm:p-5 space-y-3 max-h-[75vh]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                            <p className="text-sm text-slate-200 font-semibold">Screening Ingredients & Logos...</p>
                            <span className="text-xs text-slate-400">Matching against Philippine Halal Standards</span>
                        </div>
                    )}

                    {!isLoading && scanResult && scanResult.riskLevel === 'No Product Detected' ? (
                        <div className="space-y-4 py-2">
                            <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 text-center flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shadow-inner">
                                    <ScanSearch size={32} />
                                </div>
                                <div className="space-y-1 max-w-sm">
                                    <h4 className="text-base font-bold text-white">No Food Label Detected</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        The camera could not find an ingredient declaration or Halal logo in this photo.
                                    </p>
                                </div>

                                <div className="w-full text-left bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-300">
                                    <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">
                                        Tips for a clear scan:
                                    </span>
                                    <ul className="space-y-1.5 text-[11px] text-slate-400">
                                        <li className="flex items-start gap-1.5">
                                            <span className="text-emerald-400 font-bold">•</span>
                                            <span>Point camera directly at the printed ingredient list on the package.</span>
                                        </li>
                                        <li className="flex items-start gap-1.5">
                                            <span className="text-emerald-400 font-bold">•</span>
                                            <span>Hold steady and tap the screen on the printed text to focus.</span>
                                        </li>
                                        <li className="flex items-start gap-1.5">
                                            <span className="text-emerald-400 font-bold">•</span>
                                            <span>Turn on the flashlight if lighting is dim or shadowy.</span>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                                >
                                    <Camera size={15} />
                                    <span>Retake Photo</span>
                                </button>
                            </div>
                        </div>
                    ) : !isLoading && scanResult ? (
                        <div className="space-y-3">
                            {/* 1. Primary Verdict Card (Always #1 at the top) */}
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
                                    <p className="text-lg sm:text-xl font-bold tracking-tight">
                                        {simplifyHalalText(
                                            scanResult.riskLevel || (
                                                scanResult.verdict === 'Green'
                                                    ? 'Verified Halal'
                                                    : scanResult.verdict === 'Yellow'
                                                    ? 'Doubtful'
                                                    : 'Prohibited (Not Halal)'
                                            )
                                        )}
                                    </p>
                                    <p className="text-xs opacity-90 leading-snug">
                                        {simplifyHalalText(scanResult.analysisSummary || scanResult.riskLevel)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/30 border border-white/10 shrink-0">
                                    {scanResult.verdict === 'Green' ? (
                                        <ShieldCheck size={26} className="text-emerald-400" />
                                    ) : scanResult.verdict === 'Yellow' ? (
                                        <AlertTriangle size={26} className="text-amber-400" />
                                    ) : (
                                        <ShieldAlert size={26} className="text-red-400" />
                                    )}
                                </div>
                            </div>

                            {/* Server Sleeping / Offline Fallback Notice */}
                            {scanResult.analysisSummary?.toLowerCase().includes('offline') && onRetry && (
                                <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-100 text-xs space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-amber-300">
                                        <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                                        <span>Cloud AI Server Was Asleep</span>
                                    </div>
                                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                                        Render free containers take ~30s to wake up on the first scan. The server is now awake!
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onRetry}
                                        className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <RefreshCw size={13} className="shrink-0" />
                                        <span>Retry Scan Now (Server Awake)</span>
                                    </button>
                                </div>
                            )}

                            {/* 2. Modern Horizontal Certifying Body Badge (No boxy white borders, read-only) */}
                            {scanResult.logoDetected ? (
                                <div
                                    className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${
                                        scanResult.isInvalidLogo
                                            ? 'bg-red-950/40 border-red-500/40'
                                            : 'bg-slate-800/90 border-emerald-500/35'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                                                scanResult.isInvalidLogo
                                                    ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                            }`}
                                        >
                                            {scanResult.isInvalidLogo ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                                {scanResult.isInvalidLogo ? 'Unrecognized Seal' : 'Accredited Halal Seal'}
                                            </span>
                                            <strong className="text-white font-bold text-xs sm:text-sm block truncate">
                                                {scanResult.logoBody}
                                            </strong>
                                        </div>
                                    </div>

                                    {scanResult.logoConfidence > 0 && (
                                        <span
                                            className={`shrink-0 inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-1 rounded-full border ${
                                                scanResult.isInvalidLogo
                                                    ? 'text-red-200 bg-red-900/60 border-red-500/40'
                                                    : 'text-emerald-300 bg-emerald-950/80 border-emerald-500/35'
                                            }`}
                                        >
                                            {scanResult.logoConfidence}% match
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between gap-2 text-xs text-slate-300">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <ShieldCheck size={15} className="text-slate-500 shrink-0" />
                                        <span className="truncate text-slate-400">No Halal seal on this side</span>
                                    </div>
                                    {onScanSecondary && (
                                        <button
                                            type="button"
                                            onClick={() => onScanSecondary('logo')}
                                            className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold shrink-0 transition cursor-pointer"
                                        >
                                            + Scan Front Seal
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* 3. Screened Additives & Ingredients */}
                            {(() => {
                                const visibleFlagged = (scanResult.flaggedIngredients || []).filter((f) => {
                                    const st = (f.status || '').toLowerCase().trim();
                                    return !['halal', 'safe', 'compliant', 'verified', 'approved'].includes(st);
                                });
                                return (
                                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                                Ingredients & Additives
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {visibleFlagged.length} Flagged
                                            </span>
                                        </div>

                                        {visibleFlagged.length > 0 ? (
                                            <div className="space-y-2 pt-1">
                                                {visibleFlagged.map((flag, idx) => {
                                                    const isHaram = (flag.status || '').toLowerCase().includes('haram') || (flag.status || '').toLowerCase().includes('prohibit');
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
                                                                <span>{simplifyHalalText(flag.ingredient)}</span>
                                                                <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded border ${
                                                                    isHaram
                                                                        ? 'bg-red-900/80 border-red-400/50 text-red-100'
                                                                        : 'bg-amber-900/80 border-amber-400/50 text-amber-100'
                                                                }`}>
                                                                    {simplifyStatus(flag.status)}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] opacity-90 leading-relaxed">
                                                                {simplifyHalalText(flag.reason)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                                                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                                <span>No prohibited or doubtful food additives found.</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* 4. Multi-Section Continuation (Compact 1-Line Action) */}
                            {onScanSecondary && (
                                isMultiPart ? (
                                    <div className="p-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                                            <Layers size={14} className="text-emerald-400 shrink-0" />
                                            <span>Combined {totalImages} packaging sections</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onScanSecondary('continue-ingredients')}
                                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                                        >
                                            <PlusCircle size={12} />
                                            <span>Scan Part {totalImages + 1}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onScanSecondary('continue-ingredients')}
                                        className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between gap-2 transition cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Layers size={14} className="text-emerald-400 shrink-0" />
                                            <span className="text-xs font-medium text-slate-300 truncate">
                                                Long label? Scan continuing ingredients (Part 2)
                                            </span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-500 shrink-0" />
                                    </button>
                                )
                            )}

                            {/* Optional Catalog Lookup Shortcut if no logo was found */}
                            {scanResult.riskLevel === 'No Halal Logo Found' && (
                                <button
                                    type="button"
                                    onClick={() => onViewChange?.('products')}
                                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs cursor-pointer"
                                >
                                    <Package size={14} className="text-emerald-400 shrink-0" />
                                    <span>Search Brand in Verified Catalog</span>
                                </button>
                            )}

                            {/* 5. Footer Actions */}
                            <div className="pt-1 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                                >
                                    <RefreshCw size={14} />
                                    <span>Scan Next Product</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nonHalalFlags = (scanResult.flaggedIngredients || []).filter((f) => {
                                            const st = (f.status || '').toLowerCase().trim();
                                            return !['halal', 'safe', 'compliant', 'verified', 'approved'].includes(st);
                                        });
                                        const issueType = scanResult.isInvalidLogo
                                            ? 'Suspicious / Counterfeit Logo'
                                            : scanResult.riskLevel === 'No Product Detected'
                                            ? 'Wrong Verdict (Scanner Error)'
                                            : nonHalalFlags.length > 0
                                            ? 'Ingredient Incorrectly Flagged'
                                            : 'Wrong Verdict (Scanner Error)';

                                        const descLines = [
                                            `Result: ${scanResult.riskLevel || scanResult.verdict}`,
                                            scanResult.analysisSummary ? `Details: ${scanResult.analysisSummary}` : '',
                                            scanResult.logoDetected ? `Logo: ${scanResult.logoBody} (${scanResult.logoConfidence}% match)` : 'Logo: None detected',
                                        ];
                                        if (nonHalalFlags.length > 0) {
                                            descLines.push(`Flagged: ${nonHalalFlags.map(f => f.ingredient).join(', ')}`);
                                        }

                                        onViewChange?.('report-issue', {
                                            relatedTo: 'product',
                                            subjectName: scanResult.logoDetected ? `${scanResult.logoBody} Product` : 'Scanned Food Packaging',
                                            issueType,
                                            description: descLines.join('\n'),
                                            evidenceUrl: scanResult.images?.[0] || ''
                                        });
                                    }}
                                    className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                                >
                                    <Flag size={13} />
                                    <span>Report</span>
                                </button>
                            </div>

                            {/* 6. Modern 1-Line Subtle Advisory Caption */}
                            <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 pt-0.5">
                                <Info size={11} className="shrink-0 text-slate-500" />
                                <span>Automated packaging check · Verify physical seal if in doubt.</span>
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default LabelResultsSheet;
