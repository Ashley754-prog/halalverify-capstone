import { simplifyStatus } from '../../utils/textFormatters';

export const isCertificateMode = (mode) => {
    return mode === 'cert' || mode === 'certificate';
};

export const getConfidencePct = (confidence) => {
    const raw = Number(confidence || 0);
    const pct = raw > 1 ? raw : raw * 100;
    return Math.min(100, Math.max(0, pct));
};

export const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

export const formatFullDate = (dateStr) => {
    if (!dateStr) return 'No date';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

export const getFlaggedItems = (item) => {
    if (!item) return [];
    if (Array.isArray(item.scan_flagged_items) && item.scan_flagged_items.length > 0) {
        return item.scan_flagged_items;
    }
    try {
        const raw = typeof item.raw_result === 'string' ? JSON.parse(item.raw_result) : item.raw_result;
        if (raw && Array.isArray(raw.flaggedIngredients)) {
            return raw.flaggedIngredients.map(f => ({
                matched_text: f.matched_text || f.ingredient || f.name,
                status: f.status,
                reason: f.reason,
                additive_id: f.additive_id || f.code,
            }));
        }
    } catch {
        // Safe fallback
    }
    return [];
};

export const calculateScanStats = (scans) => {
    let halal = 0;
    let doubtful = 0;
    let prohibited = 0;

    scans.forEach(s => {
        const status = simplifyStatus(s.verdict).toLowerCase();
        if (status === 'halal' || status === 'valid' || status === 'green') {
            halal++;
        } else if (status === 'doubtful' || status === 'suspicious' || status === 'yellow') {
            doubtful++;
        } else if (status === 'prohibited' || status === 'haram' || status === 'expired' || status === 'red') {
            prohibited++;
        }
    });

    return {
        total: scans.length,
        halal,
        doubtful,
        prohibited,
    };
};

export const MODE_FILTERS = [
    { id: 'all', label: 'All Scans' },
    { id: 'label', label: 'Product Labels' },
    { id: 'certificate', label: 'Certificates' },
];

export const VERDICT_FILTERS = [
    { id: 'all', label: 'All Results' },
    { id: 'halal', label: 'Halal' },
    { id: 'doubtful', label: 'Doubtful' },
    { id: 'prohibited', label: 'Prohibited' },
];
