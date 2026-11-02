import { useState } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ScanSearch,
    FileText,
    Clock,
    ShieldCheck,
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Info,
    Layers,
    Cpu,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { simplifyStatus, simplifyHalalText } from '../../utils/textFormatters';
import {
    getFlaggedItems,
    getConfidencePct,
    formatFullDate,
    getRawResult,
    hasRecognizedLogo,
    resolveReferenceLogoSrc,
} from './scanHistoryUtils';

export const ScanDetailModal = ({ scan, onClose }) => {
    const [copiedText, setCopiedText] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

    if (!scan) return null;

    const raw = getRawResult(scan);
    const hasLogo = hasRecognizedLogo(scan);
    const certLogoSrc = resolveReferenceLogoSrc(scan.detected_logo || raw?.logoBody);

    const handleCopy = async (text, type = 'text') => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'text') {
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
            } else {
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2000);
            }
        } catch {
            // Safe fallback
        }
    };

    const simplified = simplifyStatus(scan.verdict);
    const confPct = getConfidencePct(scan.confidence);
    const isHalal = simplified === 'Halal' || simplified === 'Valid';
    const isDoubtful = simplified === 'Doubtful' || simplified === 'Suspicious';
    const isProhibited = simplified === 'Prohibited' || simplified === 'Haram' || simplified === 'Expired';

    let bannerBg = 'bg-slate-50 border-slate-200 text-slate-800';
    let bannerIcon = <AlertTriangle size={24} className="text-slate-500 shrink-0" />;
    let defaultBannerDesc = 'Scan completed with standard verification parameters.';

    if (isHalal) {
        bannerBg = 'bg-emerald-50/80 border-emerald-200 text-emerald-950';
        bannerIcon = <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />;
        defaultBannerDesc = 'Zero prohibited or non-halal items detected. Verified compliant.';
    } else if (isDoubtful) {
        bannerBg = 'bg-amber-50/80 border-amber-200 text-amber-950';
        bannerIcon = <AlertTriangle size={24} className="text-amber-600 shrink-0" />;
        defaultBannerDesc = 'Contains additives of unverified origin (Syubhah). Verification recommended.';
    } else if (isProhibited) {
        bannerBg = 'bg-rose-50/80 border-rose-200 text-rose-950';
        bannerIcon = <XCircle size={24} className="text-rose-600 shrink-0" />;
        defaultBannerDesc = 'Contains confirmed non-halal or prohibited ingredients.';
    }

    // Use actual dynamic analysis summary from the scanner if available
    const activeSummary = raw?.analysisSummary
        ? simplifyHalalText(raw.analysisSummary)
        : defaultBannerDesc;

    const flagged = getFlaggedItems(scan);
    const recommendations = Array.isArray(raw?.recommendations) ? raw.recommendations : [];
    const capturedImages = Array.isArray(raw?.images) ? raw.images : [];
    const pipelineStages = Array.isArray(raw?.pipelineStages) ? raw.pipelineStages : [];

    return (
        <Modal
            isOpen={!!scan}
            onClose={onClose}
            title="Scan Inspection Audit"
            description={`Audit record for ${scan.image_name || 'scanned item'}`}
            size="lg"
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer active:scale-95"
                >
                    Close
                </button>
            }
        >
            <div className="space-y-4 text-slate-800">
                {/* 1. Dynamic Verdict Hero Banner */}
                <div className={`rounded-2xl border p-4 ${bannerBg}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            {bannerIcon}
                            <div className="min-w-0">
                                <h4 className="text-base sm:text-lg font-black uppercase tracking-tight">
                                    Verdict: {simplified}
                                </h4>
                                <p className="text-xs text-slate-700 mt-1 leading-relaxed break-words">
                                    {activeSummary}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            {hasLogo && confPct > 0 ? (
                                <>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                                        Seal Match
                                    </span>
                                    <div className="text-base sm:text-lg font-black font-mono text-slate-900">
                                        {confPct.toFixed(0)}%
                                    </div>
                                </>
                            ) : (
                                <span className="inline-block text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2 py-1 rounded-lg">
                                    Ingredient Screen
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <span className="font-semibold text-slate-400 block mb-1">Scan Mode</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                            {scan.mode === 'label' ? <ScanSearch size={14} className="text-blue-600 shrink-0" /> : <FileText size={14} className="text-emerald-600 shrink-0" />}
                            <span className="truncate">{scan.mode === 'label' ? 'Packaging Label OCR' : 'Certificate Scan'}</span>
                        </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <span className="font-semibold text-slate-400 block mb-1">Scan Timestamp</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                            <Clock size={14} className="text-slate-500 shrink-0" />
                            <span className="truncate">{formatFullDate(scan.created_at)}</span>
                        </span>
                    </div>
                </div>

                {/* 3. Detected Certifying Body Card (if present) */}
                {scan.detected_logo && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center gap-3">
                        {certLogoSrc ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0 flex items-center justify-center">
                                <img
                                    src={certLogoSrc}
                                    alt={scan.detected_logo}
                                    className="w-full h-full object-cover scale-110"
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <ShieldCheck size={20} />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Recognized Halal Certifier
                            </span>
                            <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {scan.detected_logo}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                                {raw?.isInvalidLogo ? (
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                        Unaccredited / Suspicious Seal (Flagged)
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Accredited Certification Mark {confPct > 0 ? `· ${confPct.toFixed(0)}% Match` : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Actionable Guidance / Recommendations (if returned by scanner) */}
                {recommendations.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Info size={14} className="text-emerald-600" />
                            <span>Recommended Consumer Guidance</span>
                        </h4>
                        <ul className="space-y-1.5 pl-1">
                            {recommendations.map((rec, i) => (
                                <li key={i} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                                    <span className="text-emerald-500 font-bold shrink-0">•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 5. Multi-Panel Photo Previews (if multi-angle scan) */}
                {capturedImages.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Layers size={13} className="text-emerald-600" />
                            <span>Fused Packaging Captures ({capturedImages.length})</span>
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {capturedImages.map((imgSrc, idx) => (
                                <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 shrink-0 shadow-xs">
                                    <img src={imgSrc} alt={`Capture Part ${idx + 1}`} className="w-full h-full object-cover" />
                                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-center font-bold text-emerald-300 py-0.5">
                                        Part {idx + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. Flagged Additives & Risks */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                            Flagged Additives & Risks ({flagged.length})
                        </h4>
                    </div>

                    {flagged.length === 0 ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>No prohibited or doubtful food additives found in this scan.</span>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {flagged.map((f, i) => {
                                const isHaram = f.status?.toLowerCase() === 'haram' || f.status?.toLowerCase() === 'prohibited';
                                return (
                                    <div
                                        key={i}
                                        className={`rounded-xl border p-3 text-xs ${
                                            isHaram
                                                ? 'border-rose-200 bg-rose-50/60'
                                                : 'border-amber-200 bg-amber-50/60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-slate-900">
                                                {f.matched_text}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                isHaram ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {f.status || 'Doubtful'}
                                            </span>
                                        </div>
                                        {f.reason && (
                                            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                                                {f.reason}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 7. Extracted OCR Ingredients & Text */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText size={14} className="text-slate-500 shrink-0" />
                            Extracted OCR Ingredients & Text
                        </h4>
                        {scan.extracted_text && (
                            <button
                                type="button"
                                onClick={() => handleCopy(scan.extracted_text, 'text')}
                                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                            >
                                {copiedText ? (
                                    <>
                                        <Check size={12} className="text-emerald-600" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={12} />
                                        <span>Copy text</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-36 overflow-y-auto text-xs text-slate-700 leading-relaxed">
                        {scan.extracted_text ? (
                            <p className="whitespace-pre-wrap select-all font-mono text-[11px]">
                                {scan.extracted_text}
                            </p>
                        ) : (
                            <p className="text-slate-400 italic">No textual ingredients extracted for this scan.</p>
                        )}
                    </div>
                </div>

                {/* 8. Collapsible Technical Audit & Forensic Details Accordion */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowTechnicalDetails((prev) => !prev)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/80 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                        <span className="flex items-center gap-1.5">
                            <Cpu size={14} className="text-slate-500" />
                            <span>Technical Audit & Pipeline Trace</span>
                        </span>
                        {showTechnicalDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {showTechnicalDetails && (
                        <div className="p-3.5 bg-white border-t border-slate-200 text-xs space-y-3 animate-in fade-in duration-150">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                    <span className="text-slate-400 block font-semibold">OCR Engine</span>
                                    <span className="font-mono text-slate-800">{raw?.ocrEngine || 'RapidOCR (ONNX Runtime)'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-semibold">Total Pipeline Latency</span>
                                    <span className="font-mono text-slate-800">
                                        {raw?.totalLatencyMs ? `${Math.round(raw.totalLatencyMs)} ms` : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {pipelineStages.length > 0 && (
                                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        Pipeline Stages ({pipelineStages.length})
                                    </span>
                                    {pipelineStages.map((stage, idx) => (
                                        <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-800 truncate">
                                                    {stage.step}. {stage.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    {stage.module}
                                                </div>
                                                {stage.details && (
                                                    <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                                                        {stage.details}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                    stage.status === 'Success' || stage.status === 'Detected'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {stage.status}
                                                </span>
                                                {typeof stage.latencyMs === 'number' && (
                                                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                                                        {Math.round(stage.latencyMs)}ms
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 9. Audit Identifier Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                        Audit ID: <span className="font-mono text-slate-600">#{String(scan.id)}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => handleCopy(String(scan.id), 'id')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                        {copiedId ? (
                            <>
                                <Check size={11} className="text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={11} />
                                <span>Copy ID</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ScanDetailModal;
