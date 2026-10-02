/**
 * Utility functions to simplify religious and chemical jargon into
 * clear, accessible, user-friendly plain English for all consumers.
 */

export function simplifyHalalText(text) {
    if (!text || typeof text !== 'string') return text || '';

    return text
        // Remove (Syubhah), (syubhah), or Syubhah references
        .replace(/\s*\(\s*syubhah\s*\)/gi, '')
        .replace(/\bsyubhah\b/gi, 'doubtful')
        // Remove (Mushbooh), (mushbooh), or Mushbooh references
        .replace(/\s*\(\s*mushbooh\s*\)/gi, '')
        .replace(/\bmushbooh\b/gi, 'doubtful')
        // Simplify "prohibited (haram)" -> "prohibited"
        .replace(/\bprohibited\s*\(\s*haram\s*\)/gi, 'prohibited')
        .replace(/\s*\(\s*haram\s*\)/gi, '')
        // Replace chemistry jargon "compound(s)" with everyday "ingredient(s)"
        .replace(/\bcompound\(s\)/gi, 'ingredient(s)')
        .replace(/\bcompounds\b/gi, 'ingredients')
        .replace(/\bcompound\b/gi, 'ingredient')
        // Clean up multiple spaces or spaces before punctuation
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,;:])/g, '$1')
        .trim();
}

export function simplifyStatus(status) {
    if (!status || typeof status !== 'string') return 'Unknown';
    const clean = simplifyHalalText(status).trim();
    const lower = clean.toLowerCase();

    if (lower === 'haram' || lower.includes('prohibit')) {
        return 'Prohibited';
    }
    if (
        lower === 'doubtful' ||
        lower.includes('syubhah') ||
        lower.includes('mushbooh') ||
        lower.includes('review')
    ) {
        return 'Doubtful';
    }
    if (lower === 'halal') {
        return 'Halal';
    }
    return clean;
}
