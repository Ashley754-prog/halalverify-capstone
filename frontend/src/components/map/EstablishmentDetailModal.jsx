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
    Flag,
    Navigation,
    Store,
    HeartHandshake,
    Leaf,
    Compass,
    Camera,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { getSafeUrl } from '../../utils/security';
import { getStatusConfig, resolveZamboangaDistrict, getEstablishmentPhoto } from '../../data/constants';

export default function EstablishmentDetailModal({
    establishment,
    userLocation,
    onClose,
    onFlagEstablishment,
}) {
    if (!establishment) return null;

    const statusConfig = getStatusConfig(establishment);
    const districtInfo = resolveZamboangaDistrict(establishment);
    const evidenceUrl = getEstablishmentPhoto(establishment) || getSafeUrl(establishment.certificate_url || establishment.logo_url || establishment.photo_url);

    const isFormallyCertified = Boolean(
        (statusConfig.key === 'verified' || establishment.halal_tier === 'halal_certified') &&
        (establishment.certifying_bodies || establishment.certifying_body_id)
    );

    const isDirectoryVenue = Boolean(
        establishment.source &&
        (establishment.source.toLowerCase().includes('directory') || establishment.source.toLowerCase().includes('manila'))
    );

    const relationshipLabel = isFormallyCertified
        ? 'Official Registry'
        : isDirectoryVenue
        ? 'Owner Declared'
        : (
            establishment.submitter_role === 'owner' ||
            (establishment.source && establishment.source.toLowerCase().includes('owner'))
        ) ? 'Business Owner' : (
            establishment.submitter_role === 'community' ||
            (establishment.source && establishment.source.toLowerCase().includes('community'))
        ) ? 'Community Submission' : 'Directory Record';

    const hasPrayerSpace = Boolean(
        establishment.has_prayer_space ||
        (establishment.description && (establishment.description.toLowerCase().includes('prayer space') || establishment.description.toLowerCase().includes('musalah') || establishment.description.toLowerCase().includes('prayer'))) ||
        (Array.isArray(establishment.amenities) && establishment.amenities.some((a) => a.toLowerCase().includes('prayer')))
    );
    const isAlcoholFree = Boolean(
        establishment.is_alcohol_free ||
        (establishment.description && establishment.description.toLowerCase().includes('alcohol')) ||
        (Array.isArray(establishment.amenities) && establishment.amenities.some((a) => a.toLowerCase().includes('alcohol')))
    );

    const rawDesc = establishment.description || '';
    const bioText = (() => {
        if (!rawDesc) return '';
        const parts = rawDesc.split('|').map((p) => p.trim()).filter(Boolean);
        const realParts = [];
        for (const p of parts) {
            const pLower = p.toLowerCase();
            if (pLower.startsWith('[tier:') || (pLower.startsWith('[') && pLower.endsWith(']'))) continue;
            if (
                pLower.startsWith('amenities:') ||
                pLower.includes('alcohol-free') ||
                pLower.includes('prayer space') ||
                pLower.includes('musalah')
            ) {
                continue;
            }
            if (
                pLower.startsWith('dishes:') ||
                pLower.startsWith('menu:') ||
                pLower.startsWith('specialties:')
            ) {
                continue;
            }
            if (
                pLower.startsWith('ai audited') ||
                pLower.startsWith('confidence:') ||
                pLower.startsWith('issues:') ||
                pLower.startsWith('fatal invariant')
            ) {
                continue;
            }
            realParts.push(p);
        }
        return realParts.join(' | ');
    })();

    const directionsUrl = (() => {
        const dest = (establishment.latitude && establishment.longitude)
            ? `${establishment.latitude},${establishment.longitude}`
            : encodeURIComponent(`${establishment.name || ''}, ${establishment.address || ''}`);
        const originParam = (userLocation?.lat && userLocation?.lng)
            ? `&origin=${userLocation.lat},${userLocation.lng}`
            : '';
        return `https://www.google.com/maps/dir/?api=1&destination=${dest}${originParam}`;
    })();

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
                            href={directionsUrl}
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
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    statusConfig.badgeBg
                                }`}
                            >
                                {statusConfig.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                <Store size={11} className="text-slate-500" />
                                <span>{relationshipLabel}</span>
                            </span>
                            {districtInfo && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${districtInfo.badgeClass}`}>
                                    <MapPin size={10} />
                                    <span>{districtInfo.shortLabel}</span>
                                </span>
                            )}
                        </div>
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
                            <span>Source: {establishment.source || (establishment.submitter_role === 'owner' ? 'Business Owner Submission' : 'Official Halal Registry')}</span>
                        </div>
                    </div>
                </div>

                {/* Classification & Certification Standing */}
                {isFormallyCertified ? (
                    <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <Award size={15} className="text-emerald-600" />
                                Halal Certifying Authority (HCB)
                            </span>
                            <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                {establishment.certifying_bodies?.code || establishment.certifying_bodies?.acronym || 'Accredited HCB'}
                            </span>
                        </div>

                        <p className="text-slate-600 text-[11px]">
                            {establishment.certifying_bodies?.name || 'Formally certified under accredited Halal standards and administrative review.'}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                            <div>
                                <span className="text-slate-500 block">Certificate No:</span>
                                <span className="font-bold text-slate-800 font-mono">
                                    {establishment.certificate_number || 'Official Accredited Record'}
                                </span>
                            </div>
                            {establishment.expiry_date && (
                                <div>
                                    <span className="text-slate-500 block">Expiry Date:</span>
                                    <span className="font-bold text-emerald-800 font-mono">
                                        {establishment.expiry_date}
                                    </span>
                                </div>
                            )}
                            <div>
                                <span className="text-slate-500 block">Accreditation:</span>
                                <span className="font-bold text-emerald-700">Official Compliant</span>
                            </div>
                        </div>
                    </div>
                ) : statusConfig.key === 'muslim_owned' ? (
                    <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-sky-900 flex items-center gap-1.5">
                                <Store size={15} className="text-sky-600" />
                                Muslim-Owned Kitchen
                            </span>
                            <span className="font-bold text-[10px] text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-300">
                                Owner Self-Declaration
                            </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            Operated by Muslim proprietors stating a halal food offering. Because this venue operates without formal third-party audit, patrons are encouraged to confirm specific kitchen practices and ingredient sourcing directly.
                        </p>
                    </div>
                ) : statusConfig.key === 'muslim_friendly' ? (
                    <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                                <HeartHandshake size={15} className="text-indigo-600" />
                                Muslim-Friendly Accommodations
                            </span>
                            <span className="font-bold text-[10px] text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-300">
                                Dietary Options
                            </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            Establishment provides dedicated pork-free options and food accommodations for Muslim diners. Not under formal third-party certification.
                        </p>
                    </div>
                ) : statusConfig.key === 'vegetarian_vegan' ? (
                    <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-teal-900 flex items-center gap-1.5">
                                <Leaf size={15} className="text-teal-600" />
                                Plant-Based / Vegan Kitchen
                            </span>
                            <span className="font-bold text-[10px] text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-300">
                                100% Plant-Based
                            </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            Vegetarian and plant-based menu with zero meat or animal-derived ingredients, eliminating halal slaughter and non-halal gelatin concerns.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <AlertCircle size={15} className="text-amber-600" />
                                Unverified / Under Review
                            </span>
                            <span className="font-bold text-[10px] text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                                Pending Audit
                            </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            This establishment does not have an active accredited Halal Certification Body record or verified community listing. Please verify directly with restaurant management.
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

                {/* Uploaded Verification Photo or Formal Certificate */}
                {evidenceUrl && (
                    <div className={`rounded-xl border p-3 text-xs space-y-2 ${
                        isFormallyCertified
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : 'border-slate-200 bg-slate-50/70'
                    }`}>
                        <div className="flex items-center justify-between gap-2">
                            <span className={`font-bold flex items-center gap-1.5 ${
                                isFormallyCertified ? 'text-emerald-900' : 'text-slate-800'
                            }`}>
                                {isFormallyCertified ? (
                                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <Camera size={14} className="text-slate-600 shrink-0" />
                                )}
                                {isFormallyCertified
                                    ? 'Halal Certificate / Audit Document'
                                    : 'Storefront / Signboard Photo'}
                            </span>
                            <a
                                href={evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-[11px] font-bold hover:underline ${
                                    isFormallyCertified ? 'text-emerald-700 hover:text-emerald-900' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>Open Full Image</span>
                                <ExternalLink size={11} />
                            </a>
                        </div>
                        <a
                            href={evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block rounded-lg overflow-hidden border bg-white max-h-48 ${
                                isFormallyCertified ? 'border-emerald-200/80' : 'border-slate-200'
                            }`}
                        >
                            <img
                                src={evidenceUrl}
                                alt={`${establishment.name} verification photo`}
                                className="w-full h-40 object-cover hover:opacity-95 transition"
                            />
                        </a>
                    </div>
                )}

                {/* Consumer Discretion & Advisory Disclaimer for Unverified / Non-Certified Venues */}
                {!isFormallyCertified && (
                    <div className="rounded-xl bg-amber-50/90 border border-amber-300/90 p-2.5 text-left flex items-start gap-2">
                        <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-amber-950 leading-snug">
                            <span className="font-extrabold block text-amber-900">
                                Consumer Discretion &amp; Advisory Disclaimer
                            </span>
                            This venue does not hold an active third-party Halal Certification Body (HCB) certificate on file. Please verify current ingredients, meat sourcing, or Halal accreditation directly with management before dining. Consumption of unverified items is at the consumer&apos;s own discretion.
                        </div>
                    </div>
                )}

                {/* Dining Amenities & Facilities */}
                {(hasPrayerSpace || isAlcoholFree) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Dining Amenities & Facilities
                        </span>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                            {hasPrayerSpace && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                    <Compass size={13} className="text-emerald-600" />
                                    Dedicated Prayer Space (Musalah)
                                </span>
                            )}
                            {isAlcoholFree && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                    <ShieldCheck size={13} className="text-emerald-600" />
                                    100% Alcohol-Free Premises
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* About this restaurant & Contact Information */}
                {(bioText || establishment.phone || establishment.email || establishment.source_url) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-2.5">
                        {bioText ? (
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    About this establishment
                                </span>
                                <p className="text-slate-700 text-[11px] leading-relaxed">
                                    {bioText}
                                </p>
                            </div>
                        ) : null}

                        {(establishment.phone || establishment.email || establishment.facebook_url || establishment.website_url || establishment.source_url) && (
                            <div className={`${bioText ? 'pt-2 border-t border-slate-200/60' : ''} flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]`}>
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
                                {establishment.facebook_url && (
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-[#1877F2] shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        <a
                                            href={getSafeUrl(establishment.facebook_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-[#1877F2] hover:underline"
                                        >
                                            Visit Facebook
                                        </a>
                                    </div>
                                )}
                                {getSafeUrl(establishment.source_url) && !getSafeUrl(establishment.source_url).includes('google.com/maps') && !getSafeUrl(establishment.source_url).includes('maps.google.com') && (
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

            </div>
        </Modal>
    );
}
