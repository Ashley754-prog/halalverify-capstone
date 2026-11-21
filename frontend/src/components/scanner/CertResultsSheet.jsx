import { useState } from 'react';
import {
    Sparkles,
    RefreshCw,
    Flag,
    ChevronDown,
    MapPin,
    ShieldCheck,
    ShieldAlert,
    XCircle,
    Info
} from 'lucide-react';

function getCertStatusMeta(status, authenticationNote) {
    const normalized = String(status || '').trim().toLowerCase();

    if (normalized === 'valid') {
        return {
            key: 'Valid',
            title: 'Valid',
            subtitle: authenticationNote || 'Certificate matches the HalalVerify registry and is currently active.',
            bannerClass: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100',
            iconBoxClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
            Icon: ShieldCheck,
        };
    }

    if (normalized === 'expired') {
        return {
            key: 'Expired',
            title: 'Expired',
            subtitle: authenticationNote || 'Certificate matched the registry, but its validity date has passed.',
            bannerClass: 'bg-rose-950/60 border-rose-500/50 text-rose-100',
            iconBoxClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
            Icon: XCircle,
        };
    }

    if (normalized === 'invalid' || normalized === 'suspended') {
        return {
            key: 'Invalid',
            title: 'Invalid',
            subtitle: authenticationNote || 'Certificate does not match an active record in the HalalVerify registry.',
            bannerClass: 'bg-rose-950/60 border-rose-500/50 text-rose-100',
            iconBoxClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
            Icon: ShieldAlert,
        };
    }

    return {
        key: 'Unverified',
        title: 'Unverified',
        subtitle: authenticationNote || 'Could not match this certificate against the local registry.',
        bannerClass: 'bg-slate-800/80 border-slate-600/60 text-slate-100',
        iconBoxClass: 'bg-slate-700/60 border-slate-600/60 text-slate-300',
        Icon: Info,
    };
}

export const CertResultsSheet = ({
    certResult,
    isLoading,
    loadingStage = 'scanning',
    onReset,
    onRetry,
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
        <div className="absolute inset-0 z-40 flex flex-col justify-end lg:static lg:inset-auto lg:z-auto lg:h-full lg:max-h-full">
            {/* Clickable Backdrop to collapse (Mobile only) */}
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity lg:hidden"
                onClick={onClose}
                aria-label="Collapse inspection sheet"
            />

            <div className="relative w-full max-h-[88%] lg:max-h-full lg:h-full bg-slate-900 border-t lg:border border-slate-700 rounded-t-3xl lg:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom lg:animate-none duration-300 text-slate-100 z-10 overflow-hidden">
                {/* Grab Handle & Sheet Header with Swipe-Down Gesture */}
                <div 
                    className="p-3 pb-2 flex flex-col items-center border-b border-slate-800 touch-none select-none shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Draggable & Tappable Pill Handle */}
                    <div 
                        className="w-full py-1.5 flex justify-center cursor-pointer active:opacity-75 lg:hidden"
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
                <div className="overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[75vh] lg:max-h-none lg:flex-1">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                            <RefreshCw className="h-9 w-9 text-emerald-400 animate-spin" />
                            <p className="text-sm text-slate-300 font-semibold">
                                {loadingStage === 'waking'
                                    ? 'Waking Up Cloud AI Server...'
                                    : 'Running Optical AI Analysis...'}
                            </p>
                            <span className="text-xs text-slate-500 max-w-xs leading-relaxed">
                                {loadingStage === 'waking'
                                    ? 'Free cloud servers sleep after 15 minutes of inactivity. Retrying your certificate scan automatically...'
                                    : 'Evaluating Certificate Security & Metadata'}
                            </span>
                        </div>
                    )}

                    {!isLoading && certResult && (() => {
                        const isOfflineNotice = Boolean(
                            certResult.isOfflineFallback ||
                            certResult.authenticationNote?.toLowerCase().includes('offline')
                        );

                        if (isOfflineNotice) {
                            return (
                                <div className="space-y-4 py-2">
                                    <div className="rounded-2xl border border-amber-500/45 bg-amber-950/35 p-5 text-center flex flex-col items-center justify-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
                                            <Sparkles size={26} />
                                        </div>
                                        <div className="space-y-1.5 max-w-sm">
                                            <h4 className="text-base font-bold text-amber-200">
                                                Cloud AI Server Was Asleep
                                            </h4>
                                            <p className="text-xs text-amber-100/85 leading-relaxed">
                                                No certificate scan ran yet. Free cloud servers go to sleep after 15 minutes of inactivity and take ~20–40 seconds to wake up. Tap below to scan this same certificate now.
                                            </p>
                                        </div>

                                        <div className="w-full space-y-2 pt-1">
                                            {onRetry && (
                                                <button
                                                    type="button"
                                                    onClick={onRetry}
                                                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                                                >
                                                    <RefreshCw size={15} />
                                                    <span>Retry Scan Now</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={onReset}
                                                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                                            >
                                                <RefreshCw size={14} />
                                                <span>Scan Another Certificate</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        const statusMeta = getCertStatusMeta(certResult.status, certResult.authenticationNote);
                        const StatusIcon = statusMeta.Icon;
                        const isValidCert = statusMeta.key === 'Valid';

                        return (
                        <div className="space-y-4">
                            <div
                                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${statusMeta.bannerClass}`}
                            >
                                <div className="min-w-0 space-y-1">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Document Status
                                    </span>
                                    <p className="text-xl font-black tracking-tight">{statusMeta.title}</p>
                                    {statusMeta.subtitle && (
                                        <p className="text-xs leading-relaxed opacity-90">
                                            {statusMeta.subtitle}
                                        </p>
                                    )}
                                </div>
                                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${statusMeta.iconBoxClass}`}>
                                    <StatusIcon size={22} />
                                </div>
                            </div>

                            <div
                                className={`p-3 rounded-xl border text-[11px] leading-relaxed space-y-1 ${
                                    isValidCert
                                        ? 'bg-slate-800/60 border-slate-700/70 text-slate-300'
                                        : statusMeta.key === 'Unverified'
                                        ? 'bg-slate-800/70 border-slate-600/50 text-slate-200'
                                        : 'bg-rose-950/35 border-rose-500/35 text-rose-200/95'
                                }`}
                            >
                                <p className={`font-bold text-xs ${
                                    isValidCert
                                        ? 'text-slate-200'
                                        : statusMeta.key === 'Unverified'
                                        ? 'text-slate-100'
                                        : 'text-rose-300'
                                }`}>
                                    Consumer Discretion &amp; Advisory Notice
                                </p>
                                <p>
                                    This check compares optical text against HalalVerify&apos;s local registry under RA 10817 and Zamboanga City Ordinance No. 489. For official confirmation, verify the physical certificate directly with establishment management or the issuing Halal Certifying Body.
                                </p>
                            </div>

                            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
                                <p className="text-slate-300">Certifying Body: <span className="font-bold text-white">{certResult.certifyingBody}</span></p>
                                <p className="text-slate-300">Establishment: <span className="font-bold text-white">{certResult.establishmentName}</span></p>
                                <p className="text-slate-300">Serial Key: <span className="font-bold font-mono text-emerald-400">{certResult.certificateNumber}</span></p>
                                <p className="text-slate-300">Expiry Date: <span className="font-bold text-white">{certResult.expirationDate || 'Not detected'}</span></p>
                            </div>

                            {/* Map Bridge for Certified Establishment */}
                            {isValidCert && certResult.establishmentName && (
                                <button
                                    type="button"
                                    onClick={() => onViewChange?.('map', { searchQuery: certResult.establishmentName })}
                                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
                                >
                                    <MapPin size={14} className="text-emerald-400" />
                                    <span>Find &ldquo;{certResult.establishmentName}&rdquo; on Establishments Map</span>
                                </button>
                            )}

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
                                    onClick={() => {
                                        onViewChange?.('report-issue', {
                                            relatedTo: 'establishment',
                                            subjectName: certResult.establishmentName || 'Scanned Certificate',
                                            issueType: statusMeta.key === 'Unverified' || statusMeta.key === 'Invalid' ? 'Establishment Status Incorrect' : 'Wrong Verdict (Scanner Error)',
                                            description: `Certificate Verification: ${statusMeta.key}\nEstablishment: ${certResult.establishmentName || 'N/A'}\nCertifier: ${certResult.certifyingBody || 'N/A'}\nCertificate Number: ${certResult.certificateNumber || 'N/A'}\nExpiry Date: ${certResult.expirationDate || 'N/A'}`
                                        });
                                    }}
                                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition"
                                >
                                    <Flag size={15} /> Report Discrepancy
                                </button>
                            </div>
                        </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default CertResultsSheet;
