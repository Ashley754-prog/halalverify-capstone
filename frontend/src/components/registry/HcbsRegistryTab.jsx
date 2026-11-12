import { useState, useEffect } from 'react';
import { Award, Building2, Globe, ShieldCheck, Calendar, FileText, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';
import Modal from '../ui/Modal';

const HCB_LOGO_LOOKUP = {
    IDCP: '/logos/IDCP.png',
    HDIP: '/logos/HDIP.png',
    NCMF: '/logos/NCMF.png',
    DTI: '/logos/DTI.png',
    HICCIP: '/logos/HICCIP.png',
    PRIME: '/logos/PRIME.png',
    MINHA: '/logos/MinHA.png',
    PHILCOSED: '/logos/Philcosed.png',
    AHIP: '/logos/AHIP.png',
    BPCC: '/logos/BPCC.png',
    BUSC: '/logos/BUSC.png',
    FIQHI: '/logos/FIQHI.png',
    MASLAHA: '/logos/MASLAHA.png',
    MMHCB: '/logos/MMHCB.png',
    PUCOI: '/logos/PUCOI.png',
    BPJPH: '/logos/BPJPH.png',
    MUI: '/logos/BPJPH.png',
    JAKIM: '/logos/JAKIM.png',
    MUIS: '/logos/MUIS.png',
    CICOT: '/logos/CICOT.svg',
};

function resolveHcbLogo(body) {
    if (!body) return null;
    if (body.logo_url) return body.logo_url;
    const rawCode = (body.code || body.acronym || '').toUpperCase().trim();
    if (HCB_LOGO_LOOKUP[rawCode]) return HCB_LOGO_LOOKUP[rawCode];
    const combined = `${rawCode} ${(body.name || '').toUpperCase()}`;
    for (const [key, src] of Object.entries(HCB_LOGO_LOOKUP)) {
        if (combined.includes(key)) return src;
    }
    return null;
}

function HcbCategoryIcon({ body, isGov, isIntl, isLocal, onPreview }) {
    const logoSrc = resolveHcbLogo(body);
    if (logoSrc) {
        return (
            <button
                type="button"
                onClick={() => onPreview?.(body)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-slate-200/90 bg-white p-1.5 sm:p-2 flex items-center justify-center shrink-0 shadow-xs hover:border-emerald-500 hover:shadow-sm transition cursor-pointer group"
                title="Click to view full seal"
                aria-label={`View ${body.code || body.name} official seal`}
            >
                <img
                    src={logoSrc}
                    alt={body.code || body.name || 'HCB'}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    loading="lazy"
                />
            </button>
        );
    }
    return (
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 ${
            isGov ? 'bg-blue-100 text-blue-700' : isIntl ? 'bg-purple-100 text-purple-700' : isLocal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
            {isGov ? <Building2 size={26} /> : isIntl ? <Globe size={26} /> : isLocal ? <Award size={26} /> : <ShieldCheck size={26} />}
        </div>
    );
}

export default function HcbsRegistryTab({
    hcbs,
    hcbSearch,
    setHcbSearch,
    hcbCategoryFilter,
    setHcbCategoryFilter,
    isAdmin,
    onOpenModal,
    onDeleteHcb,
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [previewHcb, setPreviewHcb] = useState(null);

    const filteredHcbs = hcbs.filter(body => {
        const matchesSearch = (body.name || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.code || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.acronym || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.country || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.registry_reference || '').toLowerCase().includes(hcbSearch.toLowerCase());
        
        const matchesCategory = hcbCategoryFilter === 'all' || 
            body.category === hcbCategoryFilter ||
            (hcbCategoryFilter === 'Accredited HCB' && (body.category === 'National HCB' || body.category === 'Local & Regional HCB' || body.category === 'Accredited HCB'));
        return matchesSearch && matchesCategory;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [hcbSearch, hcbCategoryFilter]);

    const totalItems = filteredHcbs.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedHcbs = filteredHcbs.slice(startIndex, startIndex + itemsPerPage);

    const handleResetFilters = () => {
        setHcbSearch('');
        setHcbCategoryFilter('all');
    };

    return (
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2.5 sm:gap-3 mb-3 sm:mb-6 shrink-0">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                        <Award className="text-emerald-600 shrink-0" size={18} /> Accredited Halal Certifying Bodies (HCB)
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                        Recognized by Philippine National Standards, NCMF, DTI Halal Board, and Zamboanga City Ordinance No. 489.
                    </p>
                </div>

                <div className="flex flex-col gap-2 w-full md:flex-row md:items-center md:w-auto">
                    <SearchBar
                        value={hcbSearch}
                        onChange={setHcbSearch}
                        placeholder="Search code, name..."
                        className="w-full md:w-64"
                        size="sm"
                    />
                    <select
                        value={hcbCategoryFilter}
                        onChange={(e) => setHcbCategoryFilter(e.target.value)}
                        className="h-8.5 sm:h-9 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto"
                        aria-label="Filter by certifying authority category"
                    >
                        <option value="all">All Bodies</option>
                        <option value="Local & Regional HCB">Local & Regional</option>
                        <option value="National HCB">National HCBs</option>
                        <option value="Government Oversight">Government</option>
                        <option value="International Authority">International</option>
                    </select>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                {filteredHcbs.length === 0 ? (
                    <EmptyState
                        icon={Award}
                        title="No certifying bodies found"
                        description="No certifying bodies match your active search or category filter."
                        resetText="Reset Filters"
                        onReset={handleResetFilters}
                    />
                ) : (
                    paginatedHcbs.map((body) => {
                        const isGov = body.category === 'Government Oversight';
                        const isIntl = body.category === 'International Authority';
                        const isLocal = body.category === 'Local & Regional HCB';

                        return (
                            <div key={body.id || body.code} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 hover:border-slate-300 transition shadow-xs">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                                        <HcbCategoryIcon body={body} isGov={isGov} isIntl={isIntl} isLocal={isLocal} onPreview={setPreviewHcb} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                <span className="font-mono font-bold text-xs bg-slate-200/90 text-slate-800 px-2 py-0.5 rounded-md">
                                                    {body.code || body.acronym || 'HCB'}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    isGov ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                                                    isIntl ? 'bg-purple-50 text-purple-700 border border-purple-200' : 
                                                    isLocal ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {body.category || 'Accredited HCB'}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words">{body.name}</h4>
                                        </div>
                                    </div>
                                </div>

                                {body.accreditation_details && (
                                    <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-100">
                                        {body.accreditation_details}
                                    </p>
                                )}

                                <div className="space-y-1 text-xs text-slate-600 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/60 font-mono">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-sans text-slate-400 flex items-center gap-1">
                                            <Calendar size={12} /> Validity:
                                        </span>
                                        <span className="font-bold text-slate-800 text-[11px]">{body.validity_period || 'Continuous Audit'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-sans text-slate-400 flex items-center gap-1">
                                            <FileText size={12} /> Registry Ref:
                                        </span>
                                        <span className="font-bold text-slate-800 text-[11px] truncate max-w-[180px]">{body.registry_reference || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-sans text-slate-400 flex items-center gap-1">
                                            <Globe size={12} /> Jurisdiction:
                                        </span>
                                        <span className="font-semibold text-slate-700 text-[11px]">{body.country || 'Philippines'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-200/60">
                                    {body.website ? (
                                        <a
                                            href={body.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                        >
                                            <span>Official Portal</span>
                                            <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No web portal listed</span>
                                    )}

                                    {isAdmin && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onOpenModal('edit-hcb', body)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                            >
                                                <Pencil size={12} /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteHcb(body)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition cursor-pointer"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Standardized Global Pagination */}
            {totalItems > 0 && (
                <Pagination
                    currentPage={safePage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemsPerPageOptions={[6, 12, 18]}
                    itemLabel="certifiers"
                />
            )}

            {/* Seal Preview Modal */}
            {previewHcb && (() => {
                const isGov = previewHcb.category?.toLowerCase().includes('government');
                const isIntl = previewHcb.category?.toLowerCase().includes('international');
                const isLocal = previewHcb.category?.toLowerCase().includes('local');
                const previewLogoSrc = resolveHcbLogo(previewHcb);

                return (
                    <Modal
                        isOpen={Boolean(previewHcb)}
                        onClose={() => setPreviewHcb(null)}
                        title={`${previewHcb.code || previewHcb.acronym || 'HCB'} Official Seal`}
                        description={previewHcb.name}
                        size="md"
                        compactOnMobile
                        footer={
                            <div className="flex items-center justify-between w-full">
                                {previewHcb.website ? (
                                    <a
                                        href={previewHcb.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                        <span>Visit Official Portal</span>
                                        <ExternalLink size={13} />
                                    </a>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">No web portal listed</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPreviewHcb(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        }
                    >
                        <div className="flex flex-col items-center gap-3.5 py-1">
                            <div className="w-full flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 min-h-[190px] sm:min-h-[220px]">
                                {previewLogoSrc ? (
                                    <img
                                        src={previewLogoSrc}
                                        alt={previewHcb.name}
                                        className="max-h-48 sm:max-h-56 max-w-full object-contain drop-shadow-sm select-none"
                                    />
                                ) : (
                                    <div className="text-slate-400 text-sm italic">No image available</div>
                                )}
                            </div>

                            <div className="w-full flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-bold text-xs bg-slate-200/90 text-slate-800 px-2 py-0.5 rounded-md">
                                    {previewHcb.code || previewHcb.acronym || 'HCB'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isGov ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    isIntl ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                    isLocal ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                    {previewHcb.category || 'Accredited HCB'}
                                </span>
                            </div>

                            {previewHcb.accreditation_details && (
                                <p className="w-full text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70">
                                    {previewHcb.accreditation_details}
                                </p>
                            )}

                            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 font-mono">
                                <div>
                                    <span className="text-[10px] uppercase font-sans text-slate-400 block">Validity</span>
                                    <span className="font-bold text-slate-800 text-[11px]">{previewHcb.validity_period || 'Continuous Audit'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-sans text-slate-400 block">Registry Ref</span>
                                    <span className="font-bold text-slate-800 text-[11px] truncate block">{previewHcb.registry_reference || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-sans text-slate-400 block">Jurisdiction</span>
                                    <span className="font-semibold text-slate-700 text-[11px]">{previewHcb.country || 'Philippines'}</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                );
            })()}
        </div>
    );
}
