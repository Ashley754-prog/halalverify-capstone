import { FileText, ShieldCheck, CheckCircle2, XCircle, Loader2, Package, Store } from 'lucide-react';
import { getSafeUrl } from '../../utils/security';
import { formatShortDate } from '../../utils/verificationNotes';
import QueueStatusBadge from './QueueStatusBadge';
import AiTriageBadge from './AiTriageBadge';

export default function ProductQueueRow({
    prod,
    openInspection,
    autoVerifyingId,
    processingId,
    handleAutoVerifyProduct,
    handleVerifyProduct,
    onRequestReject,
}) {
    const isAutoVerifying = autoVerifyingId === prod.id;
    const isProcessing = processingId === prod.id;
    const isAnyActionBusy = isAutoVerifying || isProcessing;

    const imgUrl = prod.image_url || prod.front_label_url || prod.logo_url;
    const hasIngredients = Boolean(prod.ingredients_summary || prod.ingredients_text);
    const isDish = Boolean(prod.establishment_id && !prod.brand && !prod.barcode);

    // Linked establishment status hint
    const estStatus = prod.establishments?.halal_status;
    const isEstPending = estStatus && (estStatus.includes('pending') || estStatus.includes('review'));

    return (
        <div className="py-4 border-b border-slate-100 last:border-b-0 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition hover:bg-slate-50/50 -mx-2 px-2 rounded-xl">
            {/* Left: Product Thumbnail & Metadata */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Visual Thumbnail */}
                <div className="size-11 sm:size-12 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                    {getSafeUrl(imgUrl) ? (
                        <img
                            src={getSafeUrl(imgUrl)}
                            alt={prod.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Package size={20} className="text-slate-400" />
                    )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate" title={prod.name}>
                            {prod.name}
                        </span>
                        <QueueStatusBadge status={prod.status} />

                        {isDish ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Menu Dish
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                Packaged
                            </span>
                        )}

                        {hasIngredients && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Ingredients Declared
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {prod.brand && (
                            <>
                                <span>
                                    Brand: <strong className="font-semibold text-slate-800">{prod.brand}</strong>
                                </span>
                                <span>•</span>
                            </>
                        )}
                        <span>
                            Category: <strong className="font-semibold text-slate-800">{prod.category || 'Food & Beverage'}</strong>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                            <Store size={11} className="text-slate-400 shrink-0" />
                            {prod.establishments?.name ? (
                                <span>
                                    <strong className="font-semibold text-slate-800">{prod.establishments.name}</strong>
                                    {isEstPending && (
                                        <span className="ml-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                            Venue Pending
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="text-slate-500">Standalone Item</span>
                            )}
                        </span>
                        {prod.created_at && (
                            <>
                                <span>•</span>
                                <span className="text-slate-500">{formatShortDate(prod.created_at)}</span>
                            </>
                        )}
                    </div>

                    {/* AI Triage Warning / Audit Hint */}
                    <AiTriageBadge adminNotes={prod.admin_notes} compact />
                </div>
            </div>

            {/* Right: Actions (Desktop Row, Mobile Touch-Friendly Grid) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 self-stretch md:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                    type="button"
                    onClick={() => openInspection(prod, 'product')}
                    disabled={isAnyActionBusy}
                    className="min-h-9 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                    title="Inspect packaging photos, declared additives, and certification records"
                    aria-label={`Inspect ${prod.name}`}
                >
                    <FileText size={13} />
                    <span>Inspect</span>
                </button>

                <button
                    type="button"
                    disabled={isAnyActionBusy}
                    onClick={() => handleAutoVerifyProduct(prod.id, true)}
                    className="min-h-9 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                    title="Screen ingredient text & verify certifying body credentials"
                    aria-label={`Run AI auto-check on ${prod.name}`}
                >
                    {isAutoVerifying ? (
                        <Loader2 size={13} className="animate-spin text-emerald-600" />
                    ) : (
                        <ShieldCheck size={13} className="text-emerald-600" />
                    )}
                    <span>Auto-Check</span>
                </button>

                <button
                    type="button"
                    disabled={isAnyActionBusy}
                    onClick={() => handleVerifyProduct(prod, 'VERIFIED')}
                    className="min-h-9 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                    aria-label={`Approve and publish ${prod.name}`}
                >
                    {isProcessing ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : (
                        <CheckCircle2 size={13} />
                    )}
                    <span>Approve</span>
                </button>

                <button
                    type="button"
                    disabled={isAnyActionBusy}
                    onClick={() => onRequestReject(prod)}
                    className="min-h-9 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] border border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:outline-none"
                    aria-label={`Reject submission for ${prod.name}`}
                >
                    <XCircle size={13} />
                    <span>Reject</span>
                </button>
            </div>
        </div>
    );
}
