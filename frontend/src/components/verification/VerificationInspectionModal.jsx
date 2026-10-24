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
    Sparkles,
    UtensilsCrossed,
    Phone,
    Globe,
    Compass,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { getSafeUrl } from '../../utils/security';

export default function VerificationInspectionModal({
    inspectingItem,
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
    adminNotes,
    setAdminNotes,
}) {
    if (!inspectingItem) return null;

    return (
        <Modal
            isOpen={!!inspectingItem}
            onClose={closeInspection}
            size="3xl"
            title={
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 tracking-wider uppercase">
                            <ShieldCheck size={12} className="text-amber-600" />
                            {inspectingType === 'product' ? 'Product Verification Workflow' : 'Document Verification Workflow'}
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
                inspectingType === 'product' ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Package size={11} className="text-slate-500" />
                            {inspectingItem.category || 'Food Item'}
                        </span>
                        {inspectingItem.brand && (
                            <>
                                <span>•</span>
                                <span>Brand: <strong className="text-slate-700">{inspectingItem.brand}</strong></span>
                            </>
                        )}
                        <span>•</span>
                        <span>Venue: <strong className="text-slate-700">{inspectingItem.establishments?.name || 'Standalone / Packaged'}</strong></span>
                        {inspectingItem.created_at && (
                            <>
                                <span>•</span>
                                <span>Received: {new Date(inspectingItem.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Store size={11} className="text-slate-500" />
                            {inspectingItem.source?.includes('Owner') || inspectingItem.submitter_role === 'owner' ? 'Business Owner / Staff' : 'Customer / Scout'}
                        </span>
                        <span>•</span>
                        <span>Submitted by: <strong className="font-mono text-slate-700">{inspectingItem.submitted_by || 'Anonymous Contributor'}</strong></span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-600">
                            <MapPin size={12} className="text-slate-400" />
                            {inspectingItem.address || inspectingItem.city || 'Zamboanga City'}
                        </span>
                        {inspectingItem.created_at && (
                            <>
                                <span>•</span>
                                <span>Received: {new Date(inspectingItem.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </>
                        )}
                    </div>
                )
            }
            footer={
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={closeInspection}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                        Cancel
                    </button>

                    <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            disabled={processingId === inspectingItem.id}
                            onClick={() => inspectingType === 'product' ? handleVerifyProduct(inspectingItem, 'REJECTED') : handleVerifyEstablishment('REJECTED')}
                            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <XCircle size={15} />
                            <span>Reject Submission</span>
                        </button>
                        <button
                            type="button"
                            disabled={processingId === inspectingItem.id}
                            onClick={() => inspectingType === 'product' ? handleVerifyProduct(inspectingItem, 'VERIFIED') : handleVerifyEstablishment(selectedStatus)}
                            className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
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
                                    : 'Approve & Publish to Registry'}
                            </span>
                        </button>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pb-1">
                {/* Left Column: Certificate / Photo Document Viewer */}
                <div className="lg:col-span-6 xl:col-span-7 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 p-4 text-slate-200 shadow-inner min-h-[420px] lg:min-h-[520px]">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800 shrink-0">
                        <span className="font-bold text-slate-200 flex items-center gap-2">
                            <FileText size={15} className="text-emerald-400" />
                            <span>
                                {inspectingItem.certificate_url
                                    ? 'Physical Document Preview'
                                    : inspectingItem.logo_url || inspectingItem.image_url
                                    ? (inspectingType === 'product' ? 'Packaging / Label Photo' : 'Storefront / Signboard Photo')
                                    : 'Physical Document Preview'}
                            </span>
                        </span>
                        {(inspectingItem.certificate_url || inspectingItem.logo_url || inspectingItem.image_url) && (
                            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={13} />
                                </button>
                                <span className="text-[11px] font-mono px-1 text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                    title="Zoom In"
                                >
                                    <ZoomIn size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRotation((r) => (r + 90) % 360)}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                    title="Rotate 90°"
                                >
                                    <RotateCw size={13} />
                                </button>
                                {getSafeUrl(inspectingItem.certificate_url || inspectingItem.logo_url || inspectingItem.image_url) && (
                                    <a
                                        href={getSafeUrl(inspectingItem.certificate_url || inspectingItem.logo_url || inspectingItem.image_url)}
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

                    <div className="flex-1 mt-3 flex items-center justify-center overflow-hidden bg-slate-950/80 rounded-xl relative border border-slate-800/80">
                        {(inspectingItem.certificate_url || inspectingItem.logo_url || inspectingItem.image_url) ? (
                            <img
                                src={inspectingItem.certificate_url || inspectingItem.logo_url || inspectingItem.image_url}
                                alt={inspectingItem.certificate_url ? 'Submitted Certificate' : inspectingType === 'product' ? 'Product Packaging Photo' : 'Storefront or Signboard Photo'}
                                style={{
                                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.15s ease',
                                }}
                                className="max-h-[480px] w-full object-contain cursor-grab select-none p-2"
                            />
                        ) : (
                            <div className="text-center p-8 max-w-sm mx-auto space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                                    <FileText size={26} className="text-slate-400" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-200">No Document or Photo Attached</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {inspectingType === 'product'
                                        ? 'The contributor registered this product without uploading a digital scan of a certificate or packaging photo.'
                                        : 'The contributor registered this establishment without uploading a digital scan of a certificate or storefront signboard.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Submitted Metadata Audit Form */}
                <div className="lg:col-span-6 xl:col-span-5 flex flex-col space-y-4">
                    {inspectingType === 'product' ? (
                        <>
                            {/* AI Document / Additive Screening Panel */}
                            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-white p-3.5 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-emerald-600" />
                                        AI Additive & Cert Screening
                                    </span>
                                    <button
                                        type="button"
                                        disabled={autoVerifyingId === inspectingItem.id}
                                        onClick={() => handleAutoVerifyProduct(inspectingItem.id, false)}
                                        className="text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                                    >
                                        <Sparkles size={13} className={autoVerifyingId === inspectingItem.id ? 'animate-spin text-emerald-600' : ''} />
                                        <span>{autoVerifyingId === inspectingItem.id ? 'Screening...' : 'Scan & Screen Product'}</span>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Screen listed ingredients against the chemical additives database and verify certifying body credentials.
                                </p>

                                {aiEvalResult && (
                                    <div className="mt-2 rounded-xl bg-white p-3 border border-emerald-200 text-xs space-y-2 shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-700">AI Confidence:</span>
                                            <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                                                aiEvalResult.score >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {aiEvalResult.score}% Match
                                            </span>
                                        </div>
                                        <div>
                                            {aiEvalResult.is_auto_approved ? (
                                                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                                                    <CheckCircle2 size={14} /> High Confidence: Clean additive screening and valid cert.
                                                </span>
                                            ) : (
                                                <span className="text-amber-700 font-bold flex items-center gap-1.5">
                                                    <AlertTriangle size={14} /> Notice: {aiEvalResult.audit_trail?.reasons?.[0] || 'Manual audit required.'}
                                                </span>
                                            )}
                                        </div>
                                        {aiEvalResult.audit_trail?.notes && aiEvalResult.audit_trail.notes.length > 0 && (
                                            <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5 pt-1.5 border-t border-slate-100">
                                                {aiEvalResult.audit_trail.notes.map((note, idx) => (
                                                    <li key={idx} className="truncate">{note}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Product Profile Card */}
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                                        <Package size={14} className="text-emerald-600" />
                                        Product Specifications
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        Contributed Details
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Product Name</span>
                                        <span className="font-bold text-slate-900">{inspectingItem.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Brand Name</span>
                                        <span className="font-semibold text-slate-800">{inspectingItem.brand || 'Unbranded / N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Category</span>
                                        <span className="font-semibold text-slate-800">{inspectingItem.category || 'Food Item'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Venue / Establishment</span>
                                        <span className="font-semibold text-slate-800">{inspectingItem.establishments?.name || 'Standalone / Packaged'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Submitted By</span>
                                        <span className="font-mono text-slate-700 truncate block">{inspectingItem.submitted_by || inspectingItem.source || 'Community Contributor'}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Ingredients Summary</span>
                                    <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed font-mono">
                                        {inspectingItem.ingredients_summary || 'No ingredients summary provided.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Cert Number</span>
                                        <span className="font-mono font-bold text-slate-800 text-xs truncate block">{inspectingItem.certificate_no || inspectingItem.certificate_number || 'None'}</span>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Expiry Date</span>
                                        <span className="font-mono font-bold text-slate-800 text-xs block">{inspectingItem.expiry_date || 'N/A'}</span>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Certifier</span>
                                        <span className="font-bold text-slate-800 text-xs truncate block">{inspectingItem.certifying_bodies?.code || inspectingItem.source || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* AI Document Auto-Detection Panel */}
                            {inspectingItem.certificate_url && (
                                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-white p-3.5 space-y-2.5 shadow-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-emerald-600" />
                                            AI Auto-Detection & OCR Assist
                                        </span>
                                        <button
                                            type="button"
                                            disabled={autoVerifyingId === inspectingItem.id}
                                            onClick={() => handleAutoVerifyEstablishment(inspectingItem.id, false)}
                                            className="text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                                        >
                                            <Sparkles size={13} className={autoVerifyingId === inspectingItem.id ? 'animate-spin text-emerald-600' : ''} />
                                            <span>{autoVerifyingId === inspectingItem.id ? 'Scanning Document...' : 'Scan & Auto-Fill Form'}</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Run AI inspection to automatically extract the certificate number, expiration date, and certifying body from the image.
                                    </p>

                                    {aiEvalResult && (
                                        <div className="mt-2 rounded-xl bg-white p-3 border border-emerald-200 text-xs space-y-2 shadow-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-700">AI Confidence:</span>
                                                <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                                                    aiEvalResult.score >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {aiEvalResult.score}% Match
                                                </span>
                                            </div>
                                            <div>
                                                {aiEvalResult.is_auto_approved ? (
                                                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                                                        <CheckCircle2 size={14} /> High Confidence: Active & accredited certificate verified.
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-700 font-bold flex items-center gap-1.5">
                                                        <AlertTriangle size={14} /> Notice: {aiEvalResult.audit_trail?.reasons?.[0] || 'Manual confirmation required.'}
                                                    </span>
                                                )}
                                            </div>
                                            {aiEvalResult.audit_trail?.notes && aiEvalResult.audit_trail.notes.length > 0 && (
                                                <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5 pt-1.5 border-t border-slate-100">
                                                    {aiEvalResult.audit_trail.notes.map((note, idx) => (
                                                        <li key={idx} className="truncate">{note}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submitted Business Profile Card */}
                            {(() => {
                                const hasPrayerSpace = Boolean(
                                    inspectingItem.has_prayer_space ||
                                    (inspectingItem.description && (inspectingItem.description.toLowerCase().includes('prayer') || inspectingItem.description.toLowerCase().includes('musalah'))) ||
                                    (Array.isArray(inspectingItem.amenities) && inspectingItem.amenities.some((a) => String(a).toLowerCase().includes('prayer')))
                                );
                                const hasAlcoholFree = Boolean(
                                    inspectingItem.is_alcohol_free ||
                                    (inspectingItem.description && inspectingItem.description.toLowerCase().includes('alcohol')) ||
                                    (Array.isArray(inspectingItem.amenities) && inspectingItem.amenities.some((a) => String(a).toLowerCase().includes('alcohol')))
                                );
                                const contactPhone = inspectingItem.phone || inspectingItem.contact_number;
                                const webLink = inspectingItem.source_url || inspectingItem.social_media_url;
                                const submitterRole = (inspectingItem.source?.includes('Owner') || inspectingItem.submitter_role === 'owner')
                                    ? 'Business Owner / Staff'
                                    : 'Customer / Community Scout';

                                return (
                                    <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                            <span className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                                                <Store size={14} className="text-emerald-600" />
                                                Submitted Business Profile
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-400">
                                                Contributed Details
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Business Name</span>
                                                <span className="font-bold text-slate-900">{inspectingItem.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Venue Category</span>
                                                <span className="font-semibold text-slate-800">{inspectingItem.type || 'Restaurant'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Submitter Role</span>
                                                <span className="font-semibold text-slate-800">{submitterRole}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Contact Phone</span>
                                                {contactPhone ? (
                                                    <a href={`tel:${contactPhone}`} className="font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                                                        <Phone size={11} className="text-emerald-600" />
                                                        {contactPhone}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 italic">Not provided</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Physical Address</span>
                                            <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-start gap-1.5">
                                                <MapPin size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                                <span>{inspectingItem.address || inspectingItem.city || 'Zamboanga City'}</span>
                                            </p>
                                        </div>

                                        {webLink && (
                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Facebook / Web Link</span>
                                                <a
                                                    href={getSafeUrl(webLink)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1.5 bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/80 truncate"
                                                >
                                                    <Globe size={13} className="text-emerald-600 shrink-0" />
                                                    <span className="truncate">{webLink}</span>
                                                    <ExternalLink size={11} className="shrink-0 text-emerald-500 ml-auto" />
                                                </a>
                                            </div>
                                        )}

                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Declared Guest Amenities</span>
                                            <div className="flex flex-wrap gap-2">
                                                {hasPrayerSpace && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        <Compass size={13} className="text-emerald-600" />
                                                        Dedicated Prayer Space (Musalah)
                                                    </span>
                                                )}
                                                {hasAlcoholFree && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        <ShieldCheck size={13} className="text-emerald-600" />
                                                        100% Alcohol-Free Premises
                                                    </span>
                                                )}
                                                {!hasPrayerSpace && !hasAlcoholFree && (
                                                    <span className="text-xs text-slate-400 italic">No special guest amenities declared.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Credentials Cross-Match Form Card */}
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3.5 shadow-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="font-black text-slate-800 uppercase tracking-wider text-xs">
                                        Cross-Match & Assign Credentials
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        Official Certification Data
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Approved Halal Classification Tier
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                                    >
                                        <option value="verified">Formally Halal Certified (With Accredited HCB)</option>
                                        <option value="muslim_owned">Muslim-Owned Kitchen (Pork-Free)</option>
                                        <option value="muslim_friendly">Muslim-Friendly Venue (Pork-Free Selections)</option>
                                        <option value="vegetarian_vegan">Vegetarian / Vegan Kitchen (Plant-Based)</option>
                                    </select>
                                    {selectedStatus !== 'verified' && (
                                        <p className="text-[11px] text-sky-700 bg-sky-50 border border-sky-200 rounded-lg p-2 mt-1.5">
                                            This establishment will be published under the Community & Lifestyle directory. An official certificate number is optional.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Accredited Halal Body (HCB)
                                    </label>
                                    <select
                                        value={selectedHcbId}
                                        onChange={(e) => setSelectedHcbId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                                    >
                                        <option value="">Select Certifying Body...</option>
                                        {certifyingBodies.map((cb) => (
                                            <option key={cb.id} value={cb.id}>
                                                {cb.code} : {cb.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Certificate No.
                                        </label>
                                        <input
                                            type="text"
                                            value={certNumber}
                                            onChange={(e) => setCertNumber(e.target.value)}
                                            placeholder="e.g. UCZP-ZAM-2024"
                                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Expiration Date
                                        </label>
                                        <input
                                            type="date"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submitted Menu Items & Specialties */}
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                        <UtensilsCrossed size={13} className="text-emerald-600" />
                                        Menu Highlights & Specialties
                                    </span>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {(inspectingItem.associated_products?.length || 0)} Dishes
                                    </span>
                                </div>

                                {inspectingItem.associated_products && inspectingItem.associated_products.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 pt-1">
                                        {inspectingItem.associated_products.map((p) => (
                                            <span key={p.id || p.name} className="text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-medium text-slate-700 flex items-center gap-1">
                                                <CheckCircle2 size={11} className="text-emerald-600" />
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">No menu items itemized yet.</p>
                                )}

                                {/* Admin quick-add menu item */}
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMenuItemName}
                                        onChange={(e) => setNewMenuItemName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMenuItem(); } }}
                                        placeholder="Itemize dish (e.g. KangKong Chips)..."
                                        className="flex-1 rounded-xl border border-slate-300 p-2 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        disabled={addingMenuItem || !newMenuItemName.trim()}
                                        onClick={handleAddMenuItem}
                                        className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-50"
                                    >
                                        {addingMenuItem ? 'Adding...' : '+ Add'}
                                    </button>
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2 shadow-xs">
                                <label className="block font-bold text-slate-800 text-xs">
                                    Administrative Audit Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Record verification rationale or notes on authenticity..."
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}
