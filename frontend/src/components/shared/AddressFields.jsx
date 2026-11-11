import { MapPin } from 'lucide-react';
import {
    ZAMBOANGA_BARANGAYS,
    parseZamboangaAddress,
    formatZamboangaAddress,
    resolveZamboangaDistrict,
} from '../../data/constants';

const VARIANTS = {
    registry: {
        label: 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600',
        input: 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-none',
        select: 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer',
        grid: 'grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2',
    },
    queue: {
        label: 'text-slate-600 font-semibold block text-[11px] mb-1',
        input: 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none',
        select: 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer',
        grid: 'grid gap-3 grid-cols-1 sm:grid-cols-2',
    },
    form: {
        label: 'font-semibold text-slate-700',
        input: 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition',
        select: 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer',
        grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    },
};

const DISTRICT_1 = ZAMBOANGA_BARANGAYS.filter((b) => b.district === 'district_1');
const DISTRICT_2 = ZAMBOANGA_BARANGAYS.filter((b) => b.district === 'district_2');

/**
 * Shared Street / Landmark + Barangay inputs.
 * `value` is the form object holding address, street, barangay and city.
 * `onChange` receives a patch containing street, barangay and the combined address.
 * Used by the Local Registry modal, the Verification Queue modal and the submission form.
 */
export default function AddressFields({
    value,
    onChange,
    variant = 'registry',
    idPrefix = 'addr',
    streetAction = null,
    originalAddress = '',
}) {
    const styles = VARIANTS[variant] || VARIANTS.registry;
    const parsed = parseZamboangaAddress(value?.address || '');
    const street = value?.street !== undefined ? value.street : parsed.street;
    const barangay = value?.barangay !== undefined ? value.barangay : parsed.barangay;
    const city = value?.city || 'Zamboanga City';
    const preview = formatZamboangaAddress(street, barangay, city);
    const district = resolveZamboangaDistrict({ address: preview, barangay });
    const changed =
        Boolean(originalAddress) &&
        originalAddress.trim().toLowerCase() !== preview.trim().toLowerCase();

    const emit = (nextStreet, nextBarangay) =>
        onChange({
            street: nextStreet,
            barangay: nextBarangay,
            address: formatZamboangaAddress(nextStreet, nextBarangay, city),
        });

    return (
        <div className="space-y-2">
            <div className={styles.grid}>
                <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <label htmlFor={`${idPrefix}-street`} className={variant === 'form' ? styles.label : styles.label.replace(/\bmb-1(\.5)?\b/, '')}>
                            Street / Landmark
                        </label>
                        {streetAction}
                    </div>
                    <input
                        id={`${idPrefix}-street`}
                        type="text"
                        value={street}
                        placeholder="e.g. 193 Don Toribio St or KCC Mall"
                        onChange={(e) => emit(e.target.value, barangay)}
                        className={styles.input}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <label htmlFor={`${idPrefix}-barangay`} className={variant === 'form' ? styles.label : styles.label.replace(/\bmb-1(\.5)?\b/, '')}>
                            Barangay <span className="text-red-500">*</span>
                        </label>
                        {district && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border leading-none normal-case tracking-normal ${district.badgeClass}`}>
                                {district.shortLabel}
                            </span>
                        )}
                    </div>
                    <select
                        id={`${idPrefix}-barangay`}
                        value={barangay}
                        onChange={(e) => emit(street, e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Select Barangay</option>
                        <optgroup label="District 1 (West Coast & Downtown)">
                            {DISTRICT_1.map((b) => (
                                <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="District 2 (East Coast)">
                            {DISTRICT_2.map((b) => (
                                <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>

            {(street || barangay) && (
                <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
                    <MapPin size={12} className="text-emerald-600 shrink-0" />
                    <span className="truncate" title={preview}>{preview}</span>
                </div>
            )}

            {changed && (
                <p className="px-1 text-[11px] text-amber-700 font-medium">
                    Submitted as: <span className="font-semibold">{originalAddress}</span>
                </p>
            )}
        </div>
    );
}
