import { MapPin } from 'lucide-react';
import { getFieldStyles } from './fieldStyles';
import {
    ZAMBOANGA_BARANGAYS,
    parseZamboangaAddress,
    formatZamboangaAddress,
    resolveZamboangaDistrict,
} from '../../data/constants';

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
    const styles = getFieldStyles(variant);
    const parsed = parseZamboangaAddress(value?.address || '');
    const street = value?.street !== undefined ? value.street : parsed.street;
    const barangay = value?.barangay !== undefined ? value.barangay : parsed.barangay;
    const city = value?.city || 'Zamboanga City';
    const labelClass = styles.label.replace(/\bmb-1(\.5)?\b/g, '').replace(/\s+/g, ' ').trim();
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
                        <label htmlFor={`${idPrefix}-street`} className={labelClass}>
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
                        <label htmlFor={`${idPrefix}-barangay`} className={labelClass}>
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
