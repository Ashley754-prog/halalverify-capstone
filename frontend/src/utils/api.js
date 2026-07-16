const apiKey = ""; // Insert your Gemini API key here if utilizing cloud computing
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function analyzeWithGemini(base64Image, mode) {
    if (apiKey) {
        const model = "gemini-2.5-flash-preview-09-2025";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        let systemPrompt = "";
        if (mode === 'label') {
            systemPrompt = `You are the HalalVerify Computer Vision backend. Respond strictly in JSON:
    {
      "logoDetected": boolean,
      "logoConfidence": number (0 to 1),
      "logoBody": "Islamic Da'wah Council of the Philippines (IDCP)" | "other",
      "ingredientsFound": ["string"],
      "flaggedIngredients": [{"ingredient": "string", "status": "Haram"|"Doubtful", "reason": "string"}],
      "verdict": "Green"|"Yellow"|"Red",
      "analysisSummary": "string"
    }`;
        } else {
            systemPrompt = `You are the HalalVerify Document Layout Analyzer. Respond strictly in JSON:
    {
      "certifyingBody": "string",
      "establishmentName": "string",
      "certificateNumber": "string",
      "expirationDate": "YYYY-MM-DD",
      "isExpired": boolean,
      "layoutConfidence": number,
      "structuralZones": ["string"],
      "status": "Valid"|"Expired"|"Suspicious",
      "authenticationNote": "string"
    }`;
        }

        const base64Data = base64Image.split(",")[1] || base64Image;

        const payload = {
            contents: [{ parts: [{ text: "Analyze image." }, { inlineData: { mimeType: "image/png", data: base64Data } }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("HTTP connection error");
        const data = await response.json();
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    }

    const endpoint = mode === 'label' ? `${API_BASE_URL}/analyze/label` : `${API_BASE_URL}/analyze/certificate`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image, mode })
    });

    if (!response.ok) {
        throw new Error("Backend unavailable");
    }

    return response.json();
}

export function simulateFallback(mode) {
    if (mode === 'label') {
        return {
            logoDetected: true,
            logoConfidence: 0.94,
            logoBody: "Islamic Da'wah Council of the Philippines (IDCP)",
            ingredientsFound: ["Water", "Sugar", "Soybeans", "Wheat", "Gelatin (E441)", "Sodium Benzoate"],
            flaggedIngredients: [
                { ingredient: "Gelatin (E441)", status: "Doubtful", reason: "Animal-derived binder. Source not verified on packaging." }
            ],
            verdict: "Yellow",
            analysisSummary: "Accredited logo detected (IDCP), but ingredients contain E441 (Gelatin) with unverified origins. Advisory status: Yellow."
        };
    }
    return {
        certifyingBody: "Halal Development Institute of the Philippines (HDIP)",
        establishmentName: "Zamboanga Halal Food Haven",
        certificateNumber: "HDIP-2026-90412",
        expirationDate: "2027-04-12",
        isExpired: false,
        layoutConfidence: 0.89,
        structuralZones: ["Header Zone", "Entity Identity", "Validity Block", "Authority Signature Seal"],
        status: "Valid",
        authenticationNote: "Passed layout structural segmentation. Certificate matches authorized HDIP formatting structures."
    };
}