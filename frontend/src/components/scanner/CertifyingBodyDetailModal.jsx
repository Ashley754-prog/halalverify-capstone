import { useEffect } from 'react';
import {
    ShieldCheck,
    ShieldAlert,
    ExternalLink,
    CheckCircle2,
    Award,
    FileText,
    Globe,
    Phone,
    Mail,
    MapPin,
    Calendar,
    X,
    Building2,
    BookOpen,
    Info,
    AlertTriangle,
} from 'lucide-react';

export const CertifyingBodyDetailModal = ({ profile, onClose }) => {
    // Keyboard Escape listener and body scroll lock
    useEffect(() => {
        if (!profile) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [profile, onClose]);

    if (!profile) return null;

    const isUnaccredited = profile.code === 'UNACCREDITED' || profile.status === 'Unaccredited';

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hcb-modal-title"
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col text-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Background Accent */}
                <div
                    className={`relative p-5 sm:p-6 border-b border-slate-800 ${
                        isUnaccredited
                            ? 'bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900'
                            : 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900'
                    }`}
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700/70 transition cursor-pointer"
                        aria-label="Close certifying body profile"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-start gap-4 pr-10">
                        {/* Circular Seal Medallion */}
                        <div className="relative shrink-0">
                            <div
                                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full p-0.5 flex items-center justify-center shadow-lg ${
                                    isUnaccredited
                                        ? 'bg-gradient-to-b from-red-400 to-red-600 ring-4 ring-red-500/20'
                                        : 'bg-gradient-to-b from-emerald-400 to-emerald-600 ring-4 ring-emerald-500/20'
                                }`}
                            >
                                {profile.logoSrc ? (
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                                        <img
                                            src={profile.logoSrc}
                                            alt={profile.name}
                                            className="w-full h-full object-cover scale-110"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                        {isUnaccredited ? (
                                            <ShieldAlert size={36} className="text-red-400" />
                                        ) : (
                                            <ShieldCheck size={36} className="text-emerald-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div
                                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 ${
                                    isUnaccredited ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-950'
                                }`}
                            >
                                {isUnaccredited ? (
                                    <AlertTriangle size={13} strokeWidth={2.5} />
                                ) : (
                                    <CheckCircle2 size={14} strokeWidth={3} />
                                )}
                            </div>
                        </div>

                        {/* Title & Metadata Badges */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                                    {profile.flag} {profile.category}
                                </span>
                                <span
                                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                        isUnaccredited
                                            ? 'bg-red-950/80 border-red-500/50 text-red-300'
                                            : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                    }`}
                                >
                                    {profile.statusBadge}
                                </span>
                            </div>

                            <h2
                                id="hcb-modal-title"
                                className="text-base sm:text-lg font-bold text-white leading-tight"
                            >
                                {profile.name}
                            </h2>

                            <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-300">{profile.shortName}</span>
                                {profile.headquarters && (
                                    <>
                                        <span className="text-slate-600">•</span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={11} className="text-slate-500 shrink-0" />
                                            {profile.headquarters}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2.5">
                        {profile.website && (
                            <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                            >
                                <Globe size={14} />
                                <span>Visit Official Website</span>
                                <ExternalLink size={12} className="opacity-80" />
                            </a>
                        )}

                        {profile.registryUrl && (
                            <a
                                href={profile.registryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                            >
                                <FileText size={14} className="text-emerald-400" />
                                <span>Registry Lookup</span>
                                <ExternalLink size={12} className="text-slate-500" />
                            </a>
                        )}
                    </div>

                    {/* Key Facts Summary Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Award size={11} className="text-emerald-400" />
                                Status
                            </span>
                            <p className="text-xs font-semibold text-slate-100 truncate">
                                {profile.status}
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Calendar size={11} className="text-emerald-400" />
                                Established
                            </span>
                            <p className="text-xs font-semibold text-slate-100 truncate">
                                {profile.founded}
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Globe size={11} className="text-emerald-400" />
                                Country
                            </span>
                            <p className="text-xs font-semibold text-slate-100 truncate">
                                {profile.country}
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Building2 size={11} className="text-emerald-400" />
                                Scope
                            </span>
                            <p className="text-xs font-semibold text-slate-100 truncate">
                                {profile.auditingScope?.length || 0} Categories
                            </p>
                        </div>
                    </div>

                    {/* Authority Overview */}
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-2">
                        <div className="flex items-center gap-2">
                            <BookOpen size={15} className="text-emerald-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                Institutional Background & Authority
                            </h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {profile.overview}
                        </p>
                    </div>

                    {/* Consumer Assurance Guarantee */}
                    <div
                        className={`p-4 rounded-2xl border space-y-2 ${
                            isUnaccredited
                                ? 'bg-red-950/30 border-red-500/30 text-red-200'
                                : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {isUnaccredited ? (
                                <ShieldAlert size={15} className="text-red-400" />
                            ) : (
                                <ShieldCheck size={15} className="text-emerald-400" />
                            )}
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                                {isUnaccredited ? 'Consumer Risk Warning' : 'Consumer Assurance Guarantee'}
                            </h3>
                        </div>
                        <p className="text-xs leading-relaxed opacity-95">
                            {profile.consumerAssurance}
                        </p>
                    </div>

                    {/* Legal Mandate & Statutory Basis */}
                    {profile.legalMandate && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <FileText size={13} className="text-emerald-400" />
                                Legal Mandate & Regulatory Recognition
                            </h3>
                            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                                {profile.legalMandate}
                            </div>
                        </div>
                    )}

                    {/* Auditing & Inspection Scope */}
                    {Array.isArray(profile.auditingScope) && profile.auditingScope.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-400" />
                                Certified Auditing Scope
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {profile.auditingScope.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2 text-xs text-slate-300"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Standards & International Affiliations */}
                    {Array.isArray(profile.standards) && profile.standards.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Award size={13} className="text-emerald-400" />
                                Technical Standards & Accreditations
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {profile.standards.map((std, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-emerald-300"
                                    >
                                        {std}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {Array.isArray(profile.affiliations) && profile.affiliations.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Globe size={13} className="text-emerald-400" />
                                Institutional Affiliations
                            </h3>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                                {profile.affiliations.map((aff, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-emerald-400 font-bold">•</span>
                                        <span>{aff}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Public Contact & Headquarters */}
                    <div className="pt-2 border-t border-slate-800 space-y-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Info size={13} className="text-emerald-400" />
                            Official Contact & Verification Hotlines
                        </h3>

                        <div className="space-y-1.5 text-xs text-slate-300">
                            {profile.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span>{profile.address}</span>
                                </div>
                            )}
                            {profile.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={13} className="text-slate-400 shrink-0" />
                                    <a
                                        href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
                                        className="hover:text-emerald-300 transition"
                                    >
                                        {profile.phone}
                                    </a>
                                </div>
                            )}
                            {profile.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={13} className="text-slate-400 shrink-0" />
                                    <a
                                        href={`mailto:${profile.email}`}
                                        className="hover:text-emerald-300 transition"
                                    >
                                        {profile.email}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 truncate">
                        HalalVerify Authority Knowledge Base · PNS 2067:2008
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CertifyingBodyDetailModal;
