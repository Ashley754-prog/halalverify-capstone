import { useState } from 'react';
import {
    ShieldCheck,
    Store,
    Package,
    CheckCircle2,
    XCircle,
    FileText,
    Camera,
    ExternalLink,
    ZoomIn,
    ZoomOut,
    RotateCw,
    MapPin,
    AlertTriangle,
    Phone,
    Copy,
    Check,
    Clock,
    X,
} from 'lucide-react';
import Modal from '../ui/Modal';
import AddressFields from '../shared/AddressFields';
import CategorySelect from '../shared/CategorySelect';
import SubmitterRoleSelect from '../shared/SubmitterRoleSelect';
import AmenitiesPicker from '../shared/AmenitiesPicker';
import { getSafeUrl } from '../../utils/security';
import { formatSystemNotice, formatShortDate, extractMenuHighlights, deriveEstablishmentTier } from '../../utils/verificationNotes';
import { cleanAmenities } from '../../data/constants';

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
}) {
    const [selectedImageTab, setSelectedImageTab] = useState('primary');
    const [copiedCert, setCopiedCert] = useState(false);

    if (!inspectingItem) return null;

    const isFormallyCertified =
        inspectingType === 'product' ||
        deriveEstablishmentTier(inspectingItem) === 'halal_certified' ||
        Boolean(inspectingItem.certificate_number);

    const imagesList = [];
    if (inspectingItem.certificate_url && isFormallyCertified) {
        imagesList.push({
            id: 'cert',
            type: 'primary',
            label: 'Certificate Document',
            url: inspectingItem.certificate_url,
        });
    }
    const secondaryPhoto =
        inspectingItem.image_url ||
        inspectingItem.front_label_url ||
        inspectingItem.logo_url ||
        (!isFormallyCertified ? inspectingItem.certificate_url : null);

    if (secondaryPhoto && !imagesList.some((img) => img.url === secondaryPhoto)) {
        imagesList.push({
            id: 'signage',
            type: 'storefront',
            label: inspectingType === 'product' ? 'Packaging / Label Photo' : 'Storefront Photo',
            url: secondaryPhoto,
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


    const systemNotice = formatSystemNotice(inspectingItem.admin_notes);
    const contactPhone = inspectingItem.phone || inspectingItem.contact_number;
    const webLink = inspectingItem.source_url || inspectingItem.social_media_url;


    return (
        <Modal
            isOpen={!!inspectingItem}
            onClose={closeInspection}
            size="3xl"
            compactOnMobile
            title={
                <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-2 flex-nowrap min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            <Clock size={11} className="text-amber-600 shrink-0" />
                            <span>Pending Review</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate">
                            <span className="sm:hidden">#{String(inspectingItem.id || '').slice(0, 8)}</span>
                            <span className="hidden sm:inline">ID: {inspectingItem.id}</span>
                        </span>
                    </div>

                    <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                        {inspectingItem.name}
                    </h2>
                </div>
            }
            description={
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-600 flex-nowrap sm:flex-wrap pt-0.5 overflow-hidden">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                        {inspectingType === 'product' ? <Package size={11} /> : <Store size={11} />}
                        <span className="truncate max-w-[110px] sm:max-w-none">
                            {inspectingType === 'product' ? (inspectingItem.category || 'Food & Beverage') : (inspectingItem.type || 'Restaurant')}
                        </span>
                    </span>
                    <span className="text-slate-300 shrink-0">•</span>

                    {inspectingType === 'product' ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium truncate">
                            <Store size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">
                                {inspectingItem.establishments?.name
                                    ? `Linked: ${inspectingItem.establishments.name}`
                                    : 'Standalone Product'}
                            </span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium truncate min-w-0">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">
                                {inspectingItem.address || inspectingItem.city || 'Zamboanga City'}
                            </span>
                        </span>
                    )}

                    {inspectingItem.created_at && (
                        <>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="hidden sm:inline text-slate-500 shrink-0">
                                Submitted: {formatShortDate(inspectingItem.created_at)}
                            </span>
                        </>
                    )}
                </div>
            }
            footer={
                <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={closeInspection}
                        className="hidden sm:inline-flex px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                        Cancel
                    </button>

                    <div className="w-full sm:w-auto flex items-center justify-end gap-2 sm:gap-2.5">
                        <button
                            type="button"
                            disabled={processingId === inspectingItem.id}
                            onClick={() =>
                                inspectingType === 'product'
                                    ? handleVerifyProduct(inspectingItem, 'REJECTED')
                                    : handleVerifyEstablishment('REJECTED')
                            }
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                        >
                            <XCircle size={14} className="shrink-0" />
                            <span className="sm:hidden">Reject</span>
                            <span className="hidden sm:inline">Reject Submission</span>
                        </button>
                        <button
                            type="button"
                            disabled={processingId === inspectingItem.id || (inspectingType !== 'product' && !selectedStatus)}
                            onClick={() =>
                                inspectingType === 'product'
                                    ? handleVerifyProduct(inspectingItem, 'VERIFIED')
                                    : handleVerifyEstablishment(selectedStatus)
                            }
                            className="flex-[1.4] sm:flex-none px-3.5 sm:px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span>
                                {inspectingType === 'product'
                                    ? 'Approve Product'
                                    : !selectedStatus
                                    ? 'Select Tier'
                                    : selectedStatus === 'verified'
                                    ? 'Approve as Certified'
                                    : selectedStatus === 'muslim_owned'
                                    ? 'Approve as Muslim-Owned'
                                    : selectedStatus === 'muslim_friendly'
                                    ? 'Approve as Muslim-Friendly'
                                    : 'Approve & Publish'}
                            </span>
                        </button>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start pb-1">
                {/* Left Column: Clean Document & Photo Viewer */}
                <div className="lg:col-span-6 lg:sticky lg:top-0 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 p-3 sm:p-4 text-slate-200">
                    <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800 shrink-0 gap-2">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5 min-w-0 truncate">
                            {isFormallyCertified && inspectingItem.certificate_url ? (
                                <FileText size={14} className="text-emerald-400 shrink-0" />
                            ) : (
                                <Camera size={14} className="text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate sm:hidden">
                                {inspectingType === 'product'
                                    ? 'Product Packaging Photo'
                                    : isFormallyCertified && inspectingItem.certificate_url
                                    ? 'Certificate Document'
                                    : 'Storefront Photo'}
                            </span>
                            <span className="hidden sm:inline truncate">
                                {inspectingType === 'product'
                                    ? 'Submitted Product Packaging / Label'
                                    : isFormallyCertified && inspectingItem.certificate_url
                                    ? 'Submitted Certificate Document'
                                    : 'Submitted Storefront / Venue Photo'}
                            </span>
                        </span>

                        {currentActiveImg && (
                            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                                    title="Zoom Out"
                                    aria-label="Zoom out"
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
                                    aria-label="Zoom in"
                                >
                                    <ZoomIn size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRotation((r) => (r + 90) % 360)}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                                    title="Rotate 90°"
                                    aria-label="Rotate image"
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
                                        aria-label="Open full image in new tab"
                                    >
                                        <ExternalLink size={13} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-center overflow-hidden bg-slate-950 rounded-xl relative border border-slate-800">
                        {currentActiveImg ? (
                            <img
                                src={currentActiveImg}
                                alt="Submitted verification evidence"
                                style={{
                                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.15s ease',
                                }}
                                className="max-h-[220px] sm:max-h-[380px] w-full object-contain cursor-grab select-none"
                            />
                        ) : (
                            <div className="text-center py-8 px-6 max-w-sm mx-auto space-y-2">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                                    <FileText size={20} />
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-200">No Photo Attached</h4>
                                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
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
                                    {img.type === 'primary' ? (
                                        <FileText size={12} />
                                    ) : (
                                        <Camera size={12} />
                                    )}
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
                    {((isFormallyCertified && inspectingItem.certificate_url) || inspectingType === 'product') && (
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

                    {/* Submitted Details Summary - Conditional for Product vs Establishment */}
                    {inspectingType === 'product' ? (
                        <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-slate-800 text-xs">
                                    Product Submission Details
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">
                                    Editable by Admin
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="inspect-product-name" className="text-slate-600 font-semibold block text-[11px] mb-1">
                                        Product Name
                                    </label>
                                    <input
                                        id="inspect-product-name"
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
                                    <label htmlFor="inspect-product-brand" className="text-slate-600 font-semibold block text-[11px] mb-1">
                                        Brand Name
                                    </label>
                                    <input
                                        id="inspect-product-brand"
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
                                </div>
                                <div>
                                    <span className="text-slate-600 font-semibold block text-[11px] mb-1">Category</span>
                                    <span className="font-semibold text-slate-800 block py-1.5">
                                        {inspectingItem.category || 'Food & Beverage'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-600 font-semibold block text-[11px] mb-1">Barcode</span>
                                    <span className="font-mono text-slate-800 block py-1.5">
                                        {inspectingItem.barcode || 'None registered'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-600 font-semibold block text-[11px] mb-1">Linked Venue</span>
                                    <span className="font-semibold text-slate-800 block py-1.5">
                                        {inspectingItem.establishments?.name || 'Standalone Product'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-600 font-semibold block text-[11px] mb-1">Source</span>
                                    <span className="text-slate-700 block py-1.5">
                                        {inspectingItem.source || 'Community User Submission'}
                                    </span>
                                </div>
                            </div>

                            {/* Declared Ingredients List */}
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                <span className="text-slate-700 font-bold block text-xs">
                                    Declared Ingredients & Chemical Additives
                                </span>
                                {inspectingItem.ingredients_summary || inspectingItem.ingredients_text ? (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                                        {inspectingItem.ingredients_summary || inspectingItem.ingredients_text}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">
                                        No ingredient declaration or text provided with this submission.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-slate-800 text-xs">
                                    Establishment Information
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">
                                    Editable by Admin
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="inspect-est-name" className="text-slate-600 font-semibold block text-[11px] mb-1">
                                        Establishment Name
                                    </label>
                                    <input
                                        id="inspect-est-name"
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
                                    <label htmlFor="inspect-venue-category" className="text-slate-600 font-semibold block text-[11px] mb-1">
                                        Venue Category
                                    </label>
                                    <CategorySelect
                                        value={inspectingItem.type}
                                        isCustom={inspectingItem.isCustomType}
                                        onChange={(patch) =>
                                            setInspectingItem?.((prev) => (prev ? { ...prev, ...patch } : prev))
                                        }
                                        variant="queue"
                                        id="inspect-venue-category"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="inspect-submitter-role" className="text-slate-600 font-semibold block text-[11px] mb-1">
                                        Submitter Role
                                    </label>
                                    <SubmitterRoleSelect
                                        variant="queue"
                                        id="inspect-submitter-role"
                                        value={
                                            inspectingItem.submitter_role === 'owner' || inspectingItem.source?.includes('Owner')
                                                ? 'owner'
                                                : 'community'
                                        }
                                        onChange={(roleId) => {
                                            const isOwner = roleId === 'owner';
                                            setInspectingItem?.((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          submitter_role: roleId,
                                                          source: isOwner ? 'Business Owner Submission' : 'Community User Submission',
                                                      }
                                                    : prev
                                            );
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="inspect-est-phone" className="text-slate-600 font-semibold block text-[11px] mb-1">
                                        Contact Number
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            id="inspect-est-phone"
                                            type="text"
                                            value={inspectingItem.phone || inspectingItem.contact_number || ''}
                                            placeholder="e.g. 09171234567"
                                            onChange={(e) =>
                                                setInspectingItem?.((prev) =>
                                                    prev ? { ...prev, phone: e.target.value, contact_number: e.target.value } : prev
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none"
                                        />
                                        {contactPhone && (
                                            <a
                                                href={`tel:${contactPhone}`}
                                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-emerald-700 transition shrink-0"
                                                title={`Call ${contactPhone}`}
                                                aria-label={`Call ${contactPhone}`}
                                            >
                                                <Phone size={13} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <AddressFields
                                        variant="queue"
                                        idPrefix="inspect-est"
                                        value={inspectingItem}
                                        originalAddress={inspectingItem.original_address || ''}
                                        onChange={(patch) =>
                                            setInspectingItem?.((prev) => (prev ? { ...prev, ...patch } : prev))
                                        }
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="inspect-est-website" className="text-slate-600 font-semibold block text-[11px] mb-1">
                                        Facebook Page or Web Link
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="inspect-est-website"
                                            type="text"
                                            value={inspectingItem.source_url || inspectingItem.social_media_url || ''}
                                            placeholder="e.g. https://facebook.com/venue"
                                            onChange={(e) =>
                                                setInspectingItem?.((prev) =>
                                                    prev ? { ...prev, source_url: e.target.value, social_media_url: e.target.value } : prev
                                                )
                                            }
                                            className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none"
                                        />
                                        {webLink && getSafeUrl(webLink) && (
                                            <a
                                                href={getSafeUrl(webLink)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
                                                title="Open link in new tab"
                                                aria-label="Open link in new tab"
                                            >
                                                <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                let list = Array.isArray(inspectingItem.amenities) ? [...inspectingItem.amenities] : [];
                                if (inspectingItem.has_prayer_space && !list.some((a) => String(a).toLowerCase().includes('prayer') || String(a).toLowerCase().includes('musalah'))) {
                                    list.push('Dedicated Prayer Space (Musalah)');
                                }
                                const activeAmenities = cleanAmenities(list);

                                return (
                                    <div className="pt-1">
                                        <AmenitiesPicker
                                            variant="queue"
                                            amenities={activeAmenities}
                                            allowCustom={true}
                                            onChange={(nextAmenities) =>
                                                setInspectingItem?.((prev) =>
                                                    prev
                                                        ? {
                                                              ...prev,
                                                              amenities: nextAmenities,
                                                              has_prayer_space: nextAmenities.some((a) => a.toLowerCase().includes('prayer')),
                                                          }
                                                        : prev
                                                )
                                            }
                                        />
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Verification & Classification Fields */}
                    <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3.5">
                        <span className="font-bold text-slate-800 text-xs block border-b border-slate-100 pb-2">
                            Verification Credentials & Ledgers
                        </span>

                        {inspectingType !== 'product' && (
                            <div>
                                <label htmlFor="inspect-classification-tier" className="block text-xs font-semibold text-slate-700 mb-1">
                                    Verification Standard
                                </label>
                                <select
                                    id="inspect-classification-tier"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold text-slate-800 bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                                >
                                    <option value="" disabled>Select verification tier…</option>
                                    <option value="verified">Halal Certified</option>
                                    <option value="muslim_owned">Muslim-Owned</option>
                                    <option value="muslim_friendly">Muslim-Friendly</option>
                                </select>
                            </div>
                        )}

                        {(inspectingType === 'product' || selectedStatus === 'verified') ? (
                            <>
                                <div>
                            <label htmlFor="inspect-cert-body" className="block text-xs font-semibold text-slate-700 mb-1">
                                {inspectingType === 'product'
                                    ? 'Accredited Certifying Body (Optional)'
                                    : 'Accredited Certifying Body'}
                            </label>
                            <select
                                id="inspect-cert-body"
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
                                    <label htmlFor="inspect-cert-number" className="block text-xs font-semibold text-slate-700">
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
                                    id="inspect-cert-number"
                                    type="text"
                                    value={certNumber}
                                    onChange={(e) => setCertNumber(e.target.value)}
                                    placeholder="e.g. IDCP-ZC-2025"
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono text-slate-800 bg-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="inspect-cert-expiry" className="block text-xs font-semibold text-slate-700 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    id="inspect-cert-expiry"
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 bg-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>
                            </>
                        ) : (
                            <div className="rounded-xl border border-teal-200/80 bg-teal-50/70 p-3.5 text-xs text-teal-900 space-y-1.5">
                                <div className="flex items-center gap-2 font-bold text-teal-950">
                                    <span>Community Sourced Listing</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 font-semibold text-teal-800 ml-auto border border-teal-200">
                                        {selectedStatus === 'muslim_owned'
                                            ? 'Muslim-Owned'
                                            : 'Muslim-Friendly'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-teal-800 leading-relaxed">
                                    No 3rd-party paper certificate is required for this community tier. Verified via submitted photos, Muslim ownership declaration, and dining amenities.
                                </p>
                            </div>
                        )}

                        {/* Menu Highlights & Dishes (Only for Establishments) */}
                        {inspectingType !== 'product' && (() => {
                            const dishesList = (inspectingItem.associated_products && inspectingItem.associated_products.length > 0)
                                ? inspectingItem.associated_products
                                : extractMenuHighlights(inspectingItem).map((name, idx) => ({ id: `dish-${idx}`, name }));

                            return (
                                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-700 text-xs">
                                            Popular Dishes / Specialties
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400">
                                            {dishesList.length} dish{dishesList.length === 1 ? '' : 'es'}
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-300 bg-white p-2.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                                        <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto pr-1">
                                            {dishesList.map((p, idx) => (
                                                <span
                                                    key={p.id || `${p.name}-${idx}`}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold"
                                                >
                                                    <span>{p.name}</span>
                                                    {handleDeleteMenuItem && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteMenuItem(p)}
                                                            className="text-emerald-600 hover:text-red-500 transition cursor-pointer"
                                                            title={`Remove ${p.name}`}
                                                            aria-label={`Remove ${p.name}`}
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                            {dishesList.length === 0 && (
                                                <span className="text-[11px] text-slate-400 py-0.5">
                                                    No dishes added yet. Type below and press Enter or click Add.
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
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
                                                placeholder="Add specialty or dish, e.g. Beef Satti, Chicken Inasal..."
                                                className="flex-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                                            />
                                            <button
                                                type="button"
                                                disabled={addingMenuItem || !newMenuItemName.trim()}
                                                onClick={handleAddMenuItem}
                                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                                            >
                                                <span>{addingMenuItem ? 'Adding...' : '+ Add'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                    </div>
                </div>
            </div>
        </Modal>
    );
}
