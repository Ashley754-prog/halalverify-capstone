import { ShieldCheck, FileText, MapPin, Loader2, CheckCircle2, Phone, UtensilsCrossed } from 'lucide-react';
import { ESTABLISHMENT_HALAL_TIERS } from '../../data/constants';
import { deriveEstablishmentTier, formatShortDate } from '../../utils/verificationNotes';
import QueueStatusBadge from './QueueStatusBadge';
import AiTriageBadge from './AiTriageBadge';

const TIER_MAP = Object.fromEntries(
    ESTABLISHMENT_HALAL_TIERS.map((tier) => [tier.id, tier])
);

export default function EstablishmentQueueCard({
    est,
    openInspection,
    autoVerifyingId,
    handleAutoVerifyEstablishment,
}) {
    const isAutoVerifying = autoVerifyingId === est.id;
    const tierId = deriveEstablishmentTier(est);
    const tierConfig = TIER_MAP[tierId] || TIER_MAP.halal_certified;
    const isCertified = tierId === 'halal_certified';

    const tierBadgeStyles = {
        halal_certified: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        muslim_owned: 'bg-sky-50 text-sky-800 border-sky-200',
        muslim_friendly: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        vegetarian_vegan: 'bg-teal-50 text-teal-800 border-teal-200',
    };

    return (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col justify-between space-y-3 shadow-xs">
            <div className="space-y-2.5">
                {/* Header row: Badges & Submission Date */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <QueueStatusBadge status={est.halal_status} />
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-tight ${
                                tierBadgeStyles[tierId] || tierBadgeStyles.halal_certified
                            }`}
                        >
                            {tierConfig.badge || tierConfig.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {est.source?.includes('Owner') || est.submitter_role === 'owner' ? 'Owner / Staff' : 'Customer / Scout'}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium shrink-0 pt-0.5">
                        {formatShortDate(est.created_at)}
                    </span>
                </div>

                {/* Name */}
                <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2" title={est.name}>
                    {est.name}
                </h4>

                {/* Address */}
                <p className="text-xs text-slate-600 flex items-center gap-1" title={est.address || est.city}>
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{est.address || est.city || 'Zamboanga City'}</span>
                </p>

                {/* Tier-Aware Details Box */}
                {isCertified ? (
                    <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-[11px] space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Accredited Certifier:</span>
                            <span className="font-bold text-slate-800 truncate ml-2">
                                {est.certifying_bodies?.code || (est.certificate_number ? 'Recorded' : 'Not Specified')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Certificate No:</span>
                            <span className="font-mono font-semibold text-slate-800 truncate ml-2">
                                {est.certificate_number || 'Awaiting Verification'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-[11px] space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                                <Phone size={10} className="text-slate-400" />
                                <span>Contact:</span>
                            </span>
                            <span className="font-semibold text-slate-800 truncate ml-2">
                                {est.phone || 'None provided'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                                <UtensilsCrossed size={10} className="text-slate-400" />
                                <span>Menu Items:</span>
                            </span>
                            <span className="font-semibold text-slate-800 truncate ml-2">
                                {est.associated_products?.length
                                    ? `${est.associated_products.length} dishes recorded`
                                    : 'Awaiting itemization'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Dynamic AI Triage Badge */}
                <AiTriageBadge adminNotes={est.admin_notes} />

                {/* Certificate Attached Indicator */}
                {est.certificate_url && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-xs flex items-center justify-between text-emerald-800">
                        <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                            <FileText size={13} className="text-emerald-600" />
                            Certificate Attached
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                            Verified File
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => openInspection(est, 'establishment')}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                >
                    <ShieldCheck size={14} />
                    <span>Inspect & Verify</span>
                </button>
                {est.certificate_url && (
                    <button
                        type="button"
                        disabled={isAutoVerifying}
                        onClick={() => handleAutoVerifyEstablishment(est.id, true)}
                        className="py-2 px-3 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-[0.98] transition flex items-center justify-center gap-1 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                        title="Run certificate OCR & auto-approve if accredited"
                        aria-label={`Run automated verification check on ${est.name}`}
                    >
                        {isAutoVerifying ? (
                            <Loader2 size={13} className="animate-spin text-emerald-600" />
                        ) : (
                            <CheckCircle2 size={13} className="text-emerald-600" />
                        )}
                        <span className="hidden sm:inline">Auto-Verify</span>
                    </button>
                )}
            </div>
        </div>
    );
}
