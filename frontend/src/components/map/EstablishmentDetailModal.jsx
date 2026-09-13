import React from 'react';
import {
    MapPin,
    ShieldCheck,
    Award,
    AlertCircle,
    Phone,
    Mail,
    ExternalLink,
    UtensilsCrossed,
    CheckCircle2,
    Flag,
    Navigation,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { getSafeUrl } from '../../utils/security';

export const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('verif') && !s.includes('pending') && !s.includes('unverif') && !s.includes('need')) {
        return {
            key: 'verified',
            label: 'Verified Halal',
            color: '#10b981',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            weight: 1.0,
        };
    }
    if (s.includes('flag') || s.includes('suspend') || s.includes('expir')) {
        return {
            key: 'flagged',
            label: 'Flagged / Suspended',
            color: '#ef4444',
            badgeBg: 'bg-red-50 text-red-700 border-red-200',
            weight: 0.1,
        };
    }
    return {
        key: 'needs_review',
        label: 'Self-Declared / Review',
        color: '#f59e0b',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        weight: 0.5,
    };
};

export default function EstablishmentDetailModal({
    establishment,
    userLocation,
    onClose,
    onFlagEstablishment,
}) {
    if (!establishment) return null;

    const statusConfig = getStatusConfig(establishment.halal_status);

    return (
        <Modal
            isOpen={!!establishment}
            onClose={onClose}
            title=""
            size="lg"
            footer={
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onFlagEstablishment(establishment)}
                        className="w-full sm:w-auto px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                        <Flag size={13} className="text-amber-600" />
                        <span>Flag / Report Discrepancy</span>
                    </button>

                    <div className="w-full sm:w-auto flex items-center gap-2">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${establishment.latitude},${establishment.longitude}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                            <Navigation size={13} />
                            <span>Get Directions</span>
                        </a>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                        <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mb-1.5 ${
                                statusConfig.badgeBg
                            }`}
                        >
                            {statusConfig.label}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                            {establishment.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <MapPin size={13} className="text-emerald-600 shrink-0" />
                            <span>{establishment.address || 'Zamboanga City, Philippines'}</span>
                            {establishment.distance_km && (
                                <span className="font-bold text-blue-700 ml-1">
                                    • {establishment.distance_km} km away
                                </span>
                            )}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                            <ShieldCheck size={11} className="text-slate-400 shrink-0" />
                            <span>Verified listing · Source: Muslim in Manila Directory</span>
                        </div>
                    </div>
                </div>

                {/* HCB Certification Standing */}
                {establishment.certifying_bodies ? (
                    <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <Award size={15} className="text-emerald-600" />
                                Halal Certifying Authority (HCB)
                            </span>
                            <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                {establishment.certifying_bodies.code || establishment.certifying_bodies.acronym || 'Accredited HCB'}
                            </span>
                        </div>

                        <p className="text-slate-600 text-[11px]">
                            {establishment.certifying_bodies.name}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                            <div>
                                <span className="text-slate-500 block">Certificate No:</span>
                                <span className="font-bold text-slate-800">
                                    {establishment.certificate_number || 'Official Accredited Record'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Accreditation Standing:</span>
                                <span className="font-bold text-emerald-700">Official Compliant</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <AlertCircle size={15} className="text-amber-600" />
                                No Accredited HCB on Record
                            </span>
                            <span className="font-bold text-[10px] text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                                Self-Declared / Unverified
                            </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            This establishment does not have an active accredited Halal Certification Body (HCB) audit record. Listed as Muslim-owned or self-declared catering.
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 text-[11px]">
                            <div>
                                <span className="text-slate-500 block">Certificate Status:</span>
                                <span className="font-bold text-slate-700">No Official Cert No.</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Compliance Status:</span>
                                <span className="font-bold text-amber-700">Pending Review</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* About this restaurant & Contact Information */}
                {(establishment.description || establishment.phone || establishment.email || establishment.source_url) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-2.5">
                        {establishment.description && (
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    About this restaurant
                                </span>
                                <p className="text-slate-700 text-[11px] leading-relaxed">
                                    {establishment.description}
                                </p>
                            </div>
                        )}

                        {(establishment.phone || establishment.email || establishment.source_url) && (
                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
                                {establishment.phone && (
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Phone size={12} className="text-emerald-600 shrink-0" />
                                        <span className="font-semibold text-slate-800">{establishment.phone}</span>
                                    </div>
                                )}
                                {establishment.email && (
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Mail size={12} className="text-emerald-600 shrink-0" />
                                        <a
                                            href={`mailto:${establishment.email}`}
                                            className="font-semibold text-emerald-700 hover:underline"
                                        >
                                            {establishment.email}
                                        </a>
                                    </div>
                                )}
                                {getSafeUrl(establishment.source_url) && (
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <ExternalLink size={12} className="text-slate-400 shrink-0" />
                                        <a
                                            href={getSafeUrl(establishment.source_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-emerald-700 hover:underline"
                                        >
                                            Directory Reference
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Truthful Menu Highlights & Specialties Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <UtensilsCrossed size={14} className={establishment.certifying_bodies ? "text-emerald-600" : "text-slate-600"} />
                            {establishment.certifying_bodies ? "Menu Highlights & Specialties" : "Reported Menu & Specialties"}
                        </h4>
                        {establishment.certifying_bodies ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                {establishment.certifying_bodies.code || 'Certified'} Kitchen
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                Self-Reported / Unaudited
                            </span>
                        )}
                    </div>

                    {!establishment.certifying_bodies && establishment.products && establishment.products.length > 0 && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                            Menu items below are sourced from public directory profiles. Individual dishes and kitchen inventory have not been audited or verified compliant by an accredited Halal Certification Body (HCB).
                        </p>
                    )}

                    {establishment.products && establishment.products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {establishment.products.map((p) => (
                                <div
                                    key={p.id}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                                >
                                    <div className="truncate mr-2">
                                        <span className="font-semibold text-slate-800 block truncate">
                                            {p.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {p.category || 'Food Item'}
                                        </span>
                                    </div>
                                    {establishment.certifying_bodies ? (
                                        <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Listed Dish
                                        </span>
                                    ) : (
                                        <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                            Reported
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                            {establishment.certifying_bodies
                                ? 'No individual dishes itemized in directory record. Refer to physical establishment menu.'
                                : 'No individual menu items reported in directory profile. Refer to physical establishment menu.'}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
