import { ESTABLISHMENT_TYPES } from '../../data/constants';
import { getFieldStyles } from './fieldStyles';

/**
 * Shared venue category dropdown with an "Other" option and custom text box.
 * onChange receives a patch with type and isCustomType.
 */
export default function CategorySelect({
    value,
    isCustom = false,
    onChange,
    variant = 'registry',
    id = 'venue-category',
}) {
    const styles = getFieldStyles(variant);
    const current = value ?? 'Restaurant';
    const isStandard = ESTABLISHMENT_TYPES.includes(current);
    const custom = isCustom || (!isStandard && Boolean(current));
    const selectValue = custom ? '__custom__' : current;

    return (
        <div className="space-y-2">
            <select
                id={id}
                value={selectValue}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                        onChange({ isCustomType: true, type: isStandard ? '' : current });
                    } else {
                        onChange({ isCustomType: false, type: val });
                    }
                }}
                className={styles.select}
            >
                {ESTABLISHMENT_TYPES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">Other</option>
            </select>
            {custom && (
                <input
                    type="text"
                    value={current}
                    onChange={(e) => onChange({ type: e.target.value, isCustomType: true })}
                    placeholder="Specify category, e.g. Barbecue House"
                    className={styles.input}
                    aria-label="Custom venue category"
                />
            )}
        </div>
    );
}
