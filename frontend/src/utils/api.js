const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * HalalVerify real backend: FastAPI + EasyOCR + Supabase.
 * No fallback stubs. The backend owns the pipeline.
 */
export async function analyzeWithGemini(base64Image, mode) {
    const endpoint = mode === "label"
        ? `${API_BASE_URL}/analyze/label`
        : `${API_BASE_URL}/analyze/certificate`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Backend unavailable (${response.status}): ${errorText}`);
    }

    return response.json();
}

/**
 * Kept for offline-only fallback when the FastAPI server is completely unreachable.
 * Use ONLY as a last resort during demos — never for production or evaluation.
 */
export function simulateFallback(mode) {
    if (mode === "label") {
        return {
            logoDetected: false,
            logoConfidence: 0,
            logoBody: "Not checked (offline)",
            ingredientsFound: [],
            flaggedIngredients: [],
            verdict: "Yellow",
            riskLevel: "Unverified",
            analysisSummary:
                "FastAPI backend is offline. This is placeholder data. Start the backend with: uvicorn app.main:app --reload",
            recommendations: [
                "Start the FastAPI backend server.",
                "Ensure the backend is running on http://127.0.0.1:8000.",
            ],
            ocrText: "",
        };
    }
    return {
        certifyingBody: "Not detected (offline)",
        establishmentName: "Not detected",
        certificateNumber: "Not detected",
        expirationDate: null,
        isExpired: false,
        layoutConfidence: 0,
        structuralZones: [],
        status: "Suspicious",
        authenticationNote:
            "FastAPI backend is offline. Start it with: uvicorn app.main:app --reload",
    };
}
