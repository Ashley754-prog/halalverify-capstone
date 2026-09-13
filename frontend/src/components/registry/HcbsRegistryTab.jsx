import React from 'react';
import { Award, Search, Building2, Globe, ShieldCheck, Calendar, FileText, ExternalLink, Pencil, Trash2 } from 'lucide-react';

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
    const filteredHcbs = hcbs.filter(body => {
        const matchesSearch = (body.name || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.code || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.acronym || '').toLowerCase().includes(hcbSearch.toLowerCase()) ||
            (body.registry_reference || '').toLowerCase().includes(hcbSearch.toLowerCase());
        
        const matchesCategory = hcbCategoryFilter === 'all' || body.category === hcbCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4 sm:mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                        <Award className="text-emerald-600 shrink-0" size={20} /> Accredited Halal Certification Bodies (HCBs) & Oversight
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Recognized by Philippine National Standards, NCMF, DTI Halal Board, and Zamboanga City Ordinance No. 489.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                        value={hcbCategoryFilter}
                        onChange={(e) => setHcbCategoryFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="all">All Organizations</option>
                        <option value="Accredited HCB">Accredited HCBs</option>
                        <option value="Government Oversight">Government Oversight</option>
                        <option value="International Authority">International Authorities</option>
                    </select>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search HCB code, name, or registry ref..."
                            value={hcbSearch}
                            onChange={(e) => setHcbSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1 pb-4">
                {filteredHcbs.map((body) => {
                    const isGov = body.category === 'Government Oversight';
                    const isIntl = body.category === 'International Authority';

                    return (
                        <div key={body.id || body.code} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    {body.seal_url ? (
                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                                            <img src={body.seal_url} alt={body.code || body.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                            isGov ? 'bg-blue-100 text-blue-700' : isIntl ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {isGov ? <Building2 size={22} /> : isIntl ? <Globe size={22} /> : <ShieldCheck size={22} />}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                                {body.code || body.acronym || 'HCB'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                isGov ? 'bg-blue-50 text-blue-700 border border-blue-200' : isIntl ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {body.category || 'Accredited HCB'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug">{body.name}</h4>
                                    </div>
                                </div>
                            </div>

                            {body.accreditation_details && (
                                <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-100">
                                    {body.accreditation_details}
                                </p>
                            )}

                            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 font-mono">
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

                            <div className="flex items-center justify-between pt-1 gap-2">
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
                                    <span className="text-xs text-slate-400">No portal listed</span>
                                )}

                                {isAdmin && (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onOpenModal('edit-hcb', body)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-200/70 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                                        >
                                            <Pencil size={12} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteHcb(body)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
