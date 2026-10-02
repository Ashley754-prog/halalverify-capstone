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
} from 'lucide-react';
import Modal from '../ui/Modal';
import { simplifyStatus } from '../../utils/textFormatters';
import { getFlaggedItems, getConfidencePct, formatFullDate } from './scanHistoryUtils';

export const ScanDetailModal = ({ scan, onClose }) => {
    const [copiedText, setCopiedText] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    if (!scan) return null;

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
    let bannerDesc = 'Scan completed with standard verification parameters.';

    if (isHalal) {
        bannerBg = 'bg-emerald-50/80 border-emerald-200 text-emerald-950';
        bannerIcon = <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />;
        bannerDesc = 'Zero prohibited or non-halal items detected. Verified compliant.';
    } else if (isDoubtful) {
        bannerBg = 'bg-amber-50/80 border-amber-200 text-amber-950';
        bannerIcon = <AlertTriangle size={24} className="text-amber-600 shrink-0" />;
        bannerDesc = 'Contains additives of unverified origin (Syubhah). Verification recommended.';
    } else if (isProhibited) {
        bannerBg = 'bg-rose-50/80 border-rose-200 text-rose-950';
        bannerIcon = <XCircle size={24} className="text-rose-600 shrink-0" />;
        bannerDesc = 'Contains confirmed non-halal or prohibited ingredients.';
    }

    const flagged = getFlaggedItems(scan);

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
                    className="w-full sm:w-auto px-5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                    Close
                </button>
            }
        >
            <div className="space-y-4">
                {/* Verdict Hero Banner */}
                <div className={`rounded-2xl border p-4 ${bannerBg}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            {bannerIcon}
                            <div>
                                <h4 className="text-base sm:text-lg font-black uppercase tracking-tight">
                                    Verdict: {simplified}
                                </h4>
                                <p className="text-xs text-slate-600 mt-0.5">{bannerDesc}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Match Score</span>
                            <div className="text-lg font-black font-mono text-slate-800">{confPct.toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <span className="font-semibold text-slate-400 block mb-1">Scan Mode</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            {scan.mode === 'label' ? <ScanSearch size={14} className="text-blue-600" /> : <FileText size={14} className="text-emerald-600" />}
                            {scan.mode === 'label' ? 'Packaging Label OCR' : 'Establishment Certificate Scan'}
                        </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <span className="font-semibold text-slate-400 block mb-1">Scan Timestamp</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-500" />
                            {formatFullDate(scan.created_at)}
                        </span>
                    </div>

                    {scan.detected_logo && (
                        <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                            <span className="font-semibold text-slate-400 block mb-1">Detected Certifying Body</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                {scan.detected_logo}
                            </span>
                        </div>
                    )}
                </div>

                {/* Flagged Additives Section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-500" />
                            Flagged Additives & Risks ({flagged.length})
                        </h4>
                    </div>

                    {flagged.length === 0 ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>No flagged or doubtful additives were identified in this product scan.</span>
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
                                                ? 'border-rose-200 bg-rose-50/50'
                                                : 'border-amber-200 bg-amber-50/50'
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

                {/* Extracted Ingredients / OCR Text */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText size={14} className="text-slate-500" />
                            Extracted OCR Ingredients & Text
                        </h4>
                        {scan.extracted_text && (
                            <button
                                type="button"
                                onClick={() => handleCopy(scan.extracted_text, 'text')}
                                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
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

                {/* Audit Identifier Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                        Audit ID: <span className="font-mono text-slate-600">#{String(scan.id)}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => handleCopy(String(scan.id), 'id')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
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
