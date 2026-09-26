import { supabase } from '../lib/supabaseClient';

// Cleanse any legacy local tunnel pointers from browser localStorage
if (typeof window !== 'undefined') {
    try {
        const stored = localStorage.getItem('halalverify_api_url');
        if (stored && (stored.includes('ngrok') || stored.includes('trycloudflare') || stored.includes('localhost'))) {
            localStorage.removeItem('halalverify_api_url');
        }
    } catch (_) {}
}

function resolveApiBaseUrl() {
    if (typeof window !== 'undefined') {
        const customUrl = localStorage.getItem('halalverify_api_url');
        if (customUrl && !customUrl.includes('trycloudflare.com') && !customUrl.includes('ngrok')) {
            return customUrl.replace(/\/+$/, '');
        }

        const envUrl = import.meta.env.VITE_API_BASE_URL;
        if (envUrl && envUrl.startsWith('http') && !envUrl.includes('trycloudflare.com') && !envUrl.includes('ngrok')) {
            return envUrl.replace(/\/+$/, '');
        }
    }

    // Default primary cloud backend (100% cloud execution, 0MB local dependency)
    return 'https://halalverify-backend.onrender.com';
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * fetch wrapper that attaches the current Supabase session token.
 * Backend write endpoints reject requests without a valid bearer token.
 */
export async function authFetch(url, options = {}) {
    const { timeout = 30000, signal: userSignal, ...fetchOptions } = options;
    const { data: { session } } = await supabase.auth.getSession();
    const headers = new Headers(fetchOptions.headers || {});

    // Ensure ngrok free interstitial page is bypassed for API calls
    headers.set('ngrok-skip-browser-warning', 'true');

    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    if (timeout && !userSignal) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const res = await fetch(url, { ...fetchOptions, headers, signal: controller.signal });
            clearTimeout(timeoutId);
            return res;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    return fetch(url, { ...fetchOptions, headers, signal: userSignal });
}

/**
 * HalalVerify backend analysis: FastAPI + EasyOCR + Supabase.
 * Tries the primary API endpoint first; if unreachable, falls back to the secure permanent domain.
 */
export async function analyzeImage(base64Image, mode) {
    const primaryUrl = resolveApiBaseUrl();
    const cloudUrl = 'https://halalverify-backend.onrender.com';
    const endpointsToTry = [
        primaryUrl,
        primaryUrl !== cloudUrl ? cloudUrl : null
    ].filter(Boolean);

    let lastError = null;

    for (const baseUrl of endpointsToTry) {
        const endpoint = mode === 'label'
            ? `${baseUrl}/analyze/label`
            : `${baseUrl}/analyze/certificate`;

        try {
            console.log(`[HalalVerify API] Sending scan request to ${endpoint}`);
            const response = await authFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ imageBase64: base64Image }),
                timeout: 45000,
            });

            if (response.ok) {
                return await response.json();
            }

            const errorText = await response.text().catch(() => '');
            lastError = new Error(`Backend (${baseUrl}) returned ${response.status}: ${errorText}`);
            console.warn(`[HalalVerify API] HTTP error from ${baseUrl}:`, lastError);
        } catch (err) {
            lastError = err;
            console.warn(`[HalalVerify API] Connection failure on ${baseUrl}:`, err.message || err);
        }
    }

    throw lastError || new Error('Backend server is unreachable on all configured endpoints.');
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
            pipelineStages: [
                { step: 1, name: "Image Acquisition & Preprocessing", module: "OpenCV / Volatile Memory", status: "Success", latencyMs: 25.4, details: "Frame captured and scaled in volatile memory." },
                { step: 2, name: "Halal Logo Localization", module: "Ultralytics YOLOv8-Nano (CNN)", status: "None", latencyMs: 45.1, details: "Offline fallback state: no server inference available." },
                { step: 3, name: "Ingredient Label Text Extraction", module: "EasyOCR (CRAFT + CRNN)", status: "Offline", latencyMs: 0, details: "Optical recognition offline." },
                { step: 4, name: "Chemical Additive Lexicon Screening", module: "Supabase PostgreSQL Lexicon", status: "Pending", latencyMs: 0, details: "135-additive database not queried." },
                { step: 5, name: "Decision-Tree Compliance Classification", module: "Hierarchical Rule Engine", status: "Yellow", latencyMs: 1.2, details: "Defaulted to Yellow (Unverified) due to offline state." }
            ],
            totalLatencyMs: 71.7,
        };
    }
    return {
        certifyingBody: 'Not detected (offline)',
        establishmentName: 'Not detected',
        certificateNumber: 'Not detected',
        expirationDate: null,
        layoutConfidence: 0,
        structuralZones: [],
        status: 'Suspicious',
        authenticationNote:
            'The backend server is offline, so no certificate analysis was performed. This is placeholder data.',
    };
}
