import { simplifyStatus } from '../../utils/textFormatters';

export const isCertificateMode = (mode) => {
    return mode === 'cert' || mode === 'certificate';
};

export const getRawResult = (item) => {
    if (!item?.raw_result) return null;
    if (typeof item.raw_result === 'object') return item.raw_result;
    try {
        return JSON.parse(item.raw_result);
    } catch {
        return null;
    }
};

export const hasRecognizedLogo = (item) => {
    if (!item) return false;
    const raw = getRawResult(item);
    if (raw?.logoDetected) return true;
    const logoStr = (item.detected_logo || '').trim().toLowerCase();
    if (!logoStr) return false;
    if (
        logoStr.includes('not detected') ||
        logoStr.includes('no logo') ||
        logoStr.includes('no halal logo') ||
        logoStr === 'none'
    ) {
        return false;
    }
    return true;
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
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

export const getFlaggedItems = (item) => {
    if (!item) return [];
    const isNonHalalFlag = (f) => {
        const st = (f?.status || '').toLowerCase().trim();
        return !['halal', 'safe', 'compliant', 'verified', 'approved'].includes(st);
    };
    if (Array.isArray(item.scan_flagged_items) && item.scan_flagged_items.length > 0) {
        return item.scan_flagged_items.filter(isNonHalalFlag);
    }
    try {
        const raw = getRawResult(item);
        if (raw && Array.isArray(raw.flaggedIngredients)) {
            return raw.flaggedIngredients
                .filter(isNonHalalFlag)
                .map(f => ({
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

const CERTIFIER_LOGO_MAP = [
    { keys: ['idcp', 'philippines2', 'da\'wah', 'dawah'], src: '/logos/IDCP.jpg' },
    { keys: ['hdip', 'philippines3', 'halal development institute'], src: '/logos/HDIP.jpg' },
    { keys: ['ncmf', 'national_halal_logo', 'philippines1', 'national halal seal', 'dti'], src: '/logos/NCMF.jpg' },
    { keys: ['hiccip'], src: '/logos/HICCIP.png' },
    { keys: ['prime'], src: '/logos/PRIME.png' },
    { keys: ['minha', 'mindanao halal authority'], src: '/logos/MinHA.png' },
    { keys: ['philcosed'], src: '/logos/Philcosed.png' },
    { keys: ['ahip'], src: '/logos/AHIP.png' },
    { keys: ['bpcc'], src: '/logos/BPCC.png' },
    { keys: ['busc'], src: '/logos/BUSC.png' },
    { keys: ['fiqhi'], src: '/logos/FIQHI.png' },
    { keys: ['maslaha'], src: '/logos/MASLAHA.png' },
    { keys: ['mmhcb'], src: '/logos/MMHCB.png' },
    { keys: ['pucoi'], src: '/logos/PUCOI.png' },
    { keys: ['invalid', 'counterfeit', 'unrecognized'], src: '/logos/Invalid_Logo.png' },
];

export const resolveReferenceLogoSrc = (logoBodyStr = '') => {
    const combined = (logoBodyStr || '').toLowerCase();
    for (const item of CERTIFIER_LOGO_MAP) {
        if (item.keys.some((k) => combined.includes(k))) {
            return item.src;
        }
    }
    return null;
};

export const MODE_FILTERS = [
    { id: 'all', label: 'All Scans' },
    { id: 'label', label: 'Product Labels' },
    { id: 'certificate', label: 'Certificates' },
];

export const VERDICT_FILTERS = [
    { id: 'all', label: 'All Verdicts' },
    { id: 'halal', label: 'Halal Verified' },
    { id: 'doubtful', label: 'Doubtful' },
    { id: 'prohibited', label: 'Prohibited' },
];
