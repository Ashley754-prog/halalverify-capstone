import { useState } from 'react';
import {
    ShieldCheck,
    Store,
    Package,
    CheckCircle2,
    XCircle,
    FileText,
    ExternalLink,
    ZoomIn,
    ZoomOut,
    RotateCw,
    MapPin,
    AlertTriangle,
    UtensilsCrossed,
    Phone,
    Globe,
    Compass,
    Copy,
    Check,
    Clock,
    X,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { getSafeUrl } from '../../utils/security';

function formatSystemNotice(rawNote) {
    if (!rawNote) return null;
    const text = String(rawNote).trim();
    if (!text.startsWith('FATAL INVARIANT') && !text.startsWith('[AI ')) {
        return null;
    }
    return text
        .replace(/^FATAL INVARIANT FAILED:\s*/i, '')
        .replace(/\(Confidence:\s*\d+%\)\.?\s*/i, '')
        .replace(/^\[AI [^\]]+\]\s*/i, '')
        .split('|')[0]
        .trim();
}

export default function VerificationInspectionModal({
    inspectingItem,
    setInspectingItem,
    inspectingType,
    closeInspection,
    processingId,
    handleVerifyProduct,
    handleVerifyEstablishment,
    selectedStatus,
    setSelectedStatus,
    zoomLevel,
    setZoomLevel,
    rotation,
    setRotation,
    autoVerifyingId,
    handleAutoVerifyProduct,
    handleAutoVerifyEstablishment,
    aiEvalResult,
    selectedHcbId,
    setSelectedHcbId,
    certifyingBodies,
    certNumber,
    setCertNumber,
    expiryDate,
    setExpiryDate,
    newMenuItemName,
    setNewMenuItemName,
    addingMenuItem,
    handleAddMenuItem,
    handleDeleteMenuItem,
    adminNotes,
    setAdminNotes,
}) {
    const [selectedImageTab, setSelectedImageTab] = useState('primary');
    const [copiedCert, setCopiedCert] = useState(false);

    if (!inspectingItem) return null;

    const imagesList = [];
    if (inspectingItem.certificate_url) {
        imagesList.push({
            id: 'cert',
            type: 'primary',
            label: 'Certificate Document',
            url: inspectingItem.certificate_url,
        });
    }
    if (inspectingItem.logo_url || inspectingItem.image_url) {
        imagesList.push({
            id: 'signage',
            type: 'storefront',
            label: inspectingType === 'product' ? 'Packaging Photo' : 'Storefront Photo',
            url: inspectingItem.logo_url || inspectingItem.image_url,
        });
    }

    const currentActiveImg =
        selectedImageTab === 'storefront' && imagesList.find((img) => img.type === 'storefront')
            ? imagesList.find((img) => img.type === 'storefront')?.url
            : imagesList[0]?.url || null;

    const handleCopyCert = () => {
        const textToCopy = certNumber || inspectingItem.certificate_no || inspectingItem.certificate_number;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopiedCert(true);
        setTimeout(() => setCopiedCert(false), 2000);
    };

    const handleQuickAddNote = (tagText) => {
        setAdminNotes((prev) => {
            const trimmed = (prev || '').trim();
            if (!trimmed) return tagText;
            if (trimmed.includes(tagText)) return prev;
            return `${trimmed}; ${tagText}`;
        });
    };

    const systemNotice = formatSystemNotice(inspectingItem.admin_notes);
    const hasPrayerSpace = Boolean(
        inspectingItem.has_prayer_space ||
            (inspectingItem.description &&
                (inspectingItem.description.toLowerCase().includes('prayer') ||
                    inspectingItem.description.toLowerCase().includes('musalah'))) ||
            (Array.isArray(inspectingItem.amenities) &&
                inspectingItem.amenities.some((a) => String(a).toLowerCase().includes('prayer')))
    );
    const hasAlcoholFree = Boolean(
        inspectingItem.is_alcohol_free ||
            (inspectingItem.description && inspectingItem.description.toLowerCase().includes('alcohol')) ||
            (Array.isArray(inspectingItem.amenities) &&
                inspectingItem.amenities.some((a) => String(a).toLowerCase().includes('alcohol')))
    );
    const contactPhone = inspectingItem.phone || inspectingItem.contact_number;
    const webLink = inspectingItem.source_url || inspectingItem.social_media_url;

    return (
        <Modal
            isOpen={!!inspectingItem}
            onClose={closeInspection}
            size="3xl"
            title={
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={12} className="text-amber-600" />
                            Pending Review
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                            ID: {inspectingItem.id}
                        </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {inspectingItem.name}
                    </h2>
                </div>
            }
            description={
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {inspectingType === 'product' ? <Package size={11} /> : <Store size={11} />}
                        {inspectingType === 'product' ? (inspectingItem.category || 'Food Item') : (inspectingItem.type || 'Restaurant')}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin size={12} className="text-slate-400" />
                        {inspectingItem.address || inspectingItem.city || 'Zamboanga City'}
                    </span>
                    {inspectingItem.created_at && (
                        <>
                            <span>•</span>
                            <span>
                                Submitted:{' '}
                                {new Date(inspectingItem.created_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </span>
                        </>
                    )}
                </div>
            }
            footer={
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={closeInspection}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                        Cancel
                    </button>

                    <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            disabled={processingId === inspectingItem.id}
                            onClick={() =>
                                inspectingType === 'product'
                                    ? handleVerifyProduct(inspectingItem, 'REJECTED')
                                    : handleVerifyEstablishment('REJECTED')
                            }
                            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                            <XCircle size={15} />
                            <span>Reject Submission</span>
                        </button>
                        <button
                            type="button"
                            disabled={processingId === inspectingItem.id}
                            onClick={() =>
                                inspectingType === 'product'
                                    ? handleVerifyProduct(inspectingItem, 'VERIFIED')
                                    : handleVerifyEstablishment(selectedStatus)
                            }
                            className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            <CheckCircle2 size={15} />
                            <span>
                                {inspectingType === 'product'
                                    ? 'Approve & Publish Product'
                                    : selectedStatus === 'verified'
                                    ? 'Approve as Certified'
                                    : selectedStatus === 'muslim_owned'
                                    ? 'Approve as Muslim-Owned'
                                    : selectedStatus === 'muslim_friendly'
                                    ? 'Approve as Muslim-Friendly'
                                    : selectedStatus === 'vegetarian_vegan'
                                    ? 'Approve as Plant-Based'
                                    : 'Approve & Publish'}
                            </span>
                        </button>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pb-1">
                {/* Left Column: Clean Document & Photo Viewer */}
                <div className="lg:col-span-6 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 p-4 text-slate-200 min-h-[420px] lg:min-h-[520px]">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800 shrink-0 gap-2">
                        <span className="font-bold text-slate-200 flex items-center gap-2">
                            <FileText size={15} className="text-emerald-400" />
                            <span>Submitted Photo / Document</span>
                        </span>

                        {currentActiveImg && (
                            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={13} />
                                </button>
                                <span className="text-[11px] font-mono px-1 text-slate-300">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRotation((r) => (r + 90) % 360)}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                                    title="Rotate 90°"
                                >
                                    <RotateCw size={13} />
                                </button>

                                {getSafeUrl(currentActiveImg) && (
                                    <a
                                        href={getSafeUrl(currentActiveImg)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 transition ml-0.5"
                                        title="Open full image in new tab"
                                    >
                                        <ExternalLink size={13} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 mt-3 flex items-center justify-center overflow-hidden bg-slate-950 rounded-xl relative border border-slate-800 min-h-[340px]">
                        {currentActiveImg ? (
                            <img
                                src={currentActiveImg}
                                alt="Submitted verification evidence"
                                style={{
                                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.15s ease',
                                }}
                                className="max-h-[440px] w-full object-contain cursor-grab select-none p-2"
                            />
                        ) : (
                            <div className="text-center p-8 max-w-sm mx-auto space-y-2">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                                    <FileText size={22} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-200">No Photo Attached</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    No certificate or storefront photo was uploaded with this submission.
                                </p>
                            </div>
                        )}
                    </div>

                    {imagesList.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                            {imagesList.map((img) => (
                                <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => setSelectedImageTab(img.type)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                        selectedImageTab === img.type
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                    }`}
                                >
                                    <FileText size={12} />
                                    <span>{img.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Clean Review Form */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                    {/* System Review Notice (if auto-approval was skipped) */}
                    {systemNotice && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5">
                            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block">Why this needs manual review:</span>
                                <span className="text-amber-800 leading-relaxed">{systemNotice}</span>
                            </div>
                        </div>
                    )}

                    {/* Optional Document Auto-Fill Helper */}
                    {(inspectingItem.certificate_url || inspectingType === 'product') && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
                            <div className="text-xs">
                                <span className="font-bold text-slate-800 block">
                                    {inspectingType === 'product' ? 'Ingredient & Credential Check' : 'Auto-Read Certificate Details'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    {inspectingType === 'product'
                                        ? 'Check ingredients against the food additives list'
                                        : 'Extract certificate number and expiry date from the photo'}
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={autoVerifyingId === inspectingItem.id}
                                onClick={() => {
                                    if (inspectingType === 'product') {
                                        handleAutoVerifyProduct(inspectingItem.id, false);
                                    } else {
                                        handleAutoVerifyEstablishment(inspectingItem.id, false);
                                    }
                                }}
                                className="shrink-0 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300 transition disabled:opacity-50 cursor-pointer"
                            >
                                {autoVerifyingId === inspectingItem.id ? 'Scanning...' : 'Scan & Auto-Fill'}
                            </button>
                        </div>
                    )}

                    {aiEvalResult && (
                        <div className="rounded-xl bg-white p-3 border border-emerald-200 text-xs space-y-1">
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                {aiEvalResult.is_auto_approved ? (
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                ) : (
                                    <AlertTriangle size={14} className="text-amber-600" />
                                )}
                                <span>
                                    {aiEvalResult.is_auto_approved ? 'Credentials Verified' : 'Review Notice'} (Score: {aiEvalResult.score}%)
                                </span>
                            </p>
                            <p className="text-[11px] text-slate-600">
                                {aiEvalResult.audit_trail?.reasons?.[0] || 'Details extracted from submission.'}
                            </p>
                        </div>
                    )}

                    {/* Submitted Details Summary */}
                    <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 text-xs">
                        <span className="font-bold text-slate-800 text-xs block border-b border-slate-100 pb-2">
                            {inspectingType === 'product' ? 'Product Information' : 'Establishment Information'}
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-slate-400 block text-[11px] mb-1">
                                    Name (Editable)
                                </label>
                                <input
                                    type="text"
                                    value={inspectingItem.name || ''}
                                    onChange={(e) =>
                                        setInspectingItem?.((prev) =>
                                            prev ? { ...prev, name: e.target.value } : prev
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-900 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 block text-[11px] mb-1">
                                    {inspectingType === 'product' ? 'Brand (Editable)' : 'Category'}
                                </label>
                                {inspectingType === 'product' ? (
                                    <input
                                        type="text"
                                        value={inspectingItem.brand || ''}
                                        placeholder="Unbranded"
                                        onChange={(e) =>
                                            setInspectingItem?.((prev) =>
                                                prev ? { ...prev, brand: e.target.value } : prev
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none"
                                    />
                                ) : (
                                    <span className="font-semibold text-slate-800 block py-1.5">
                                        {inspectingItem.type || 'Restaurant'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="text-slate-400 block text-[11px] mb-1">
                                    {inspectingType === 'product' ? 'Location' : 'Address (Editable)'}
                                </label>
                                {inspectingType === 'product' ? (
                                    <span className="font-semibold text-slate-800 block py-1.5">
                                        {inspectingItem.address || inspectingItem.city || 'Zamboanga City'}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        value={inspectingItem.address || ''}
                                        placeholder="Zamboanga City"
                                        onChange={(e) =>
                                            setInspectingItem?.((prev) =>
                                                prev ? { ...prev, address: e.target.value } : prev
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none"
                                    />
                                )}
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px] mb-1">Contact Phone</span>
                                {contactPhone ? (
                                    <a href={`tel:${contactPhone}`} className="font-semibold text-emerald-700 hover:underline flex items-center gap-1 py-1.5">
                                        <Phone size={11} />
                                        {contactPhone}
                                    </a>
                                ) : (
                                    <span className="text-slate-400 block py-1.5">Not provided</span>
                                )}
                            </div>
                        </div>

                        {webLink && (
                            <div className="pt-1">
                                <span className="text-slate-400 block text-[11px] mb-1">Website / Social Link</span>
                                <a
                                    href={getSafeUrl(webLink)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1.5 truncate"
                                >
                                    <Globe size={12} className="shrink-0" />
                                    <span className="truncate">{webLink}</span>
                                    <ExternalLink size={11} className="shrink-0" />
                                </a>
                            </div>
                        )}

                        {inspectingType !== 'product' && (hasPrayerSpace || hasAlcoholFree) && (
                            <div className="pt-1">
                                <span className="text-slate-400 block text-[11px] mb-1">Amenities</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {hasPrayerSpace && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            <Compass size={11} />
                                            Prayer Space (Musalah)
                                        </span>
                                    )}
                                    {hasAlcoholFree && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            <ShieldCheck size={11} />
                                            Alcohol-Free
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Verification & Classification Fields */}
                    <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3.5">
                        <span className="font-bold text-slate-800 text-xs block border-b border-slate-100 pb-2">
                            Verification Details
                        </span>

                        {inspectingType !== 'product' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Halal Classification Tier
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold text-slate-800 bg-white focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="verified">Formally Halal Certified</option>
                                    <option value="muslim_owned">Muslim-Owned Kitchen (Pork-Free)</option>
                                    <option value="muslim_friendly">Muslim-Friendly Venue</option>
                                    <option value="vegetarian_vegan">Vegetarian / Vegan</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Certifying Body (Optional for Community Tiers)
                            </label>
                            <select
                                value={selectedHcbId}
                                onChange={(e) => setSelectedHcbId(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold text-slate-800 bg-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="">Select Certifying Body...</option>
                                {certifyingBodies.map((cb) => (
                                    <option key={cb.id} value={cb.id}>
                                        {cb.code} - {cb.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Certificate Number
                                    </label>
                                    {(certNumber || inspectingItem.certificate_number || inspectingItem.certificate_no) && (
                                        <button
                                            type="button"
                                            onClick={handleCopyCert}
                                            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                                        >
                                            {copiedCert ? <Check size={11} /> : <Copy size={11} />}
                                            <span>{copiedCert ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={certNumber}
                                    onChange={(e) => setCertNumber(e.target.value)}
                                    placeholder="e.g. IDCP-ZC-2025"
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono text-slate-800 bg-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 bg-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Menu Highlights & Dishes */}
                        {inspectingType !== 'product' && (
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                                        <UtensilsCrossed size={13} className="text-emerald-600" />
                                        Menu Highlights & Dishes
                                    </span>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {inspectingItem.associated_products?.length || 0} Dishes
                                    </span>
                                </div>

                                {inspectingItem.associated_products && inspectingItem.associated_products.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                        {inspectingItem.associated_products.map((p, idx) => (
                                            <span
                                                key={p.id || `${p.name}-${idx}`}
                                                className="text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-medium text-slate-700 flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                                <span>{p.name}</span>
                                                {handleDeleteMenuItem && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteMenuItem(p)}
                                                        className="text-slate-400 hover:text-red-500 transition cursor-pointer ml-0.5"
                                                        title={`Remove ${p.name}`}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400">No menu items listed yet.</p>
                                )}

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="text"
                                        value={newMenuItemName}
                                        onChange={(e) => setNewMenuItemName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddMenuItem();
                                            }
                                        }}
                                        placeholder="Add a dish (e.g. Beef Satti)..."
                                        className="flex-1 rounded-xl border border-slate-300 p-2 text-xs text-slate-800 bg-white focus:border-emerald-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        disabled={addingMenuItem || !newMenuItemName.trim()}
                                        onClick={handleAddMenuItem}
                                        className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-50 cursor-pointer"
                                    >
                                        {addingMenuItem ? 'Adding...' : '+ Add'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Admin Notes */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block font-semibold text-slate-700 text-xs">
                                    Admin Notes (Optional)
                                </label>
                                <span className="text-[10px] text-slate-400">Quick tags</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    'Valid Certificate',
                                    'Verified Kitchen Signage',
                                    'Cross-checked Database',
                                    'Pork-Free Declared',
                                ].map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleQuickAddNote(tag)}
                                        className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                rows={2}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add optional verification notes..."
                                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 bg-white focus:border-emerald-500 focus:outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
