import { supabase } from '../lib/supabaseClient';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * fetch wrapper that attaches the current Supabase session token.
 * Backend write endpoints reject requests without a valid bearer token.
 */
export async function authFetch(url, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = new Headers(options.headers || {});

    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    return fetch(url, { ...options, headers });
}

/**
 * HalalVerify backend analysis: FastAPI + EasyOCR + Supabase.
 */
export async function analyzeImage(base64Image, mode) {
    const endpoint = mode === 'label'
        ? `${API_BASE_URL}/analyze/label`
        : `${API_BASE_URL}/analyze/certificate`;

    const response = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Backend unavailable (${response.status}): ${errorText}`);
    }

    return response.json();
}

/**
 * Offline placeholder shown ONLY when the FastAPI server is unreachable.
 * Never use for production or evaluation.
 */
export function simulateFallback(mode) {
    if (mode === 'label') {
        return {
            logoDetected: false,
            logoConfidence: 0,
            logoBody: 'Not checked (offline)',
            ingredientsFound: [],
            flaggedIngredients: [],
            verdict: 'Yellow',
            riskLevel: 'Unverified',
            analysisSummary:
                'The backend server is offline, so no OCR analysis was performed. This is placeholder data.',
            recommendations: [
                'Reconnect and scan again — this result is not a verification.',
            ],
            ocrText: '',
        };
    }
    return {
        certifyingBody: 'Not detected (offline)',
        establishmentName: 'Not detected',
        certificateNumber: 'Not detected',
        expirationDate: null,
        isExpired: false,
        layoutConfidence: 0,
        structuralZones: [],
        status: 'Suspicious',
        authenticationNote:
            'The backend server is offline, so no certificate analysis was performed. This is placeholder data.',
    };
}
