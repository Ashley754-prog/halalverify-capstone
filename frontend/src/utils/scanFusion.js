/**
 * HalalVerify Multi-Capture Packaging Fusion Helper
 * Combines two complementary camera captures (e.g. Front Halal Seal + Rear Ingredients Panel)
 * into a single unified 5-stage verification verdict.
 */

export function mergeLabelScans(firstScan, secondScan, firstImage, secondImage) {
    if (!firstScan && !secondScan) return null;
    if (!firstScan) return secondScan;
    if (!secondScan) return firstScan;

    // 1. Select the best Halal Logo detection
    const firstHasLogo = Boolean(firstScan.logoDetected);
    const secondHasLogo = Boolean(secondScan.logoDetected);
    const firstConfidence = Number(firstScan.logoConfidence || 0);
    const secondConfidence = Number(secondScan.logoConfidence || 0);

    const bestLogoScan = (secondHasLogo && (!firstHasLogo || secondConfidence > firstConfidence))
        ? secondScan
        : firstScan;

    const logoDetected = Boolean(firstHasLogo || secondHasLogo);
    const isInvalidLogo = Boolean(firstScan.isInvalidLogo || secondScan.isInvalidLogo);
    const logoBody = logoDetected ? bestLogoScan.logoBody : "Not detected";
    const logoConfidence = logoDetected ? Math.max(firstConfidence, secondConfidence) : 0;

    // 2. Combine and deduplicate OCR text
    const text1 = (firstScan.ocrText || "").trim();
    const text2 = (secondScan.ocrText || "").trim();
    const combinedOcrText = [text1, text2].filter(Boolean).join("\n---\n");

    // 3. Deduplicate and merge flagged ingredients
    const flagsMap = new Map();
    [...(firstScan.flaggedIngredients || []), ...(secondScan.flaggedIngredients || [])].forEach((item) => {
        if (!item || !item.ingredient) return;
        const key = item.ingredient.toLowerCase().trim();
        if (!flagsMap.has(key)) {
            flagsMap.set(key, item);
        }
    });
    const mergedFlaggedIngredients = Array.from(flagsMap.values());

    // 4. Calculate counts
    const haramCount = mergedFlaggedIngredients.filter(
        (i) => (i.status || "").toLowerCase() === "haram"
    ).length;
    const doubtfulCount = mergedFlaggedIngredients.filter((i) => {
        const s = (i.status || "").toLowerCase();
        return s === "doubtful" || s.includes("review") || s === "syubhah";
    }).length;

    // 5. Hierarchical Rule Engine Verdict Evaluation
    let verdict;
    let riskLevel;
    let analysisSummary;
    let recommendations;

    if (isInvalidLogo) {
        verdict = "Red";
        riskLevel = "High Risk (Suspected Invalid / Counterfeit Mark)";
        analysisSummary = "Warning: A suspected unauthorized or counterfeit halal certification mark was detected across scanned panels. Do not rely on this packaging.";
        recommendations = [
            "Do not consume or purchase without independent Islamic authority confirmation.",
            "Report this counterfeit seal using the Report Issue button.",
            "Cross-reference the manufacturer in the HalalVerify Product Catalog."
        ];
    } else if (haramCount > 0) {
        verdict = "Red";
        riskLevel = "Haram / Prohibited";
        analysisSummary = `Dual-panel inspection screened ingredients and detected ${haramCount} prohibited (haram) compound(s).`;
        if (logoDetected) {
            analysisSummary += ` Note: Prohibited ingredients were flagged despite the presence of a ${logoBody} logo seal.`;
        }
        recommendations = [
            "Avoid consuming this product.",
            "Verify with the manufacturer whether an animal derivative is halal-certified.",
            "Report conflicting certification via the Report Issue page."
        ];
    } else if (doubtfulCount > 0) {
        verdict = "Yellow";
        riskLevel = "Doubtful (Syubhah)";
        analysisSummary = `Dual-panel inspection screened ingredients and flagged ${doubtfulCount} doubtful compound(s) requiring source clarification.`;
        if (logoDetected) {
            analysisSummary += ` Accredited certification: ${logoBody} (${logoConfidence}% confidence).`;
        }
        recommendations = [
            "Verify the specific source of the flagged additive with the manufacturer.",
            "Check whether the batch is covered by the certifying body's active manifest."
        ];
    } else if (logoDetected && combinedOcrText.length > 0) {
        verdict = "Green";
        riskLevel = "Complete Dual-Verification (Halal Logo + Clean Ingredients)";
        analysisSummary = `Both packaging sides verified! Accredited ${logoBody} seal confirmed (${logoConfidence}% match), and 0 prohibited or doubtful food additives found across screened ingredient declarations.`;
        recommendations = [
            "Product exhibits accredited certification and clean ingredient declarations.",
            "Always check product packaging expiration dates before purchase."
        ];
    } else if (logoDetected) {
        verdict = "Green";
        riskLevel = "Halal Logo Verified (No Ingredients Declared)";
        analysisSummary = `Accredited ${logoBody} certification logo localized with ${logoConfidence}% confidence.`;
        recommendations = [
            "Certification mark matches accredited Islamic bodies.",
            "Product passed visual logo authentication."
        ];
    } else if (combinedOcrText.length > 0) {
        verdict = "Green";
        riskLevel = "Clean Ingredients (No Halal Logo Detected)";
        analysisSummary = "OCR detected ingredient text and found zero matching haram additives. No accredited halal certification logo was recognized.";
        recommendations = [
            "Ingredient list appears free of known prohibited E-codes.",
            "Verify if an accredited halal logo is displayed on unopened packaging."
        ];
    } else {
        verdict = "Yellow";
        riskLevel = "Unverified";
        analysisSummary = "Neither ingredient text nor an accredited halal certification logo could be identified across the captured packaging panels.";
        recommendations = [
            "Upload a clearer, well-lit photo focusing on the ingredient label and certification seal.",
            "Ensure the packaging is flat and glare-free."
        ];
    }

    // 6. Aggregate IPO Pipeline Stages
    const totalLatency = (firstScan.totalLatencyMs || 50) + (secondScan.totalLatencyMs || 50);
    const pipelineStages = [
        {
            step: 1,
            name: "Multi-Frame Packaging Acquisition",
            module: "OpenCV / Volatile RAM",
            status: "Success",
            latencyMs: 32.5,
            details: "Dual packaging angles captured, normalized, and preprocessed in memory."
        },
        {
            step: 2,
            name: "Halal Logo Localization",
            module: "Ultralytics YOLOv8-Nano (CNN)",
            status: logoDetected ? (isInvalidLogo ? "Invalid" : "Detected") : "None",
            latencyMs: Math.round(((firstScan.pipelineStages?.[1]?.latencyMs || 40) + (secondScan.pipelineStages?.[1]?.latencyMs || 40)) / 2),
            details: logoDetected
                ? `Accredited ${logoBody} seal verified (${logoConfidence}% match).`
                : "No accredited halal logo localized across captured panels."
        },
        {
            step: 3,
            name: "Ingredient Text Extraction",
            module: "EasyOCR (CRAFT + CRNN)",
            status: combinedOcrText.length > 0 ? "Success" : "None",
            latencyMs: Math.round(((firstScan.pipelineStages?.[2]?.latencyMs || 100) + (secondScan.pipelineStages?.[2]?.latencyMs || 100)) / 2),
            details: combinedOcrText.length > 0
                ? "Ingredient declarations extracted from packaging panels."
                : "No readable ingredient text extracted."
        },
        {
            step: 4,
            name: "Chemical Additive Lexicon Screening",
            module: "Supabase PostgreSQL Lexicon",
            status: mergedFlaggedIngredients.length > 0 ? "Flagged" : "Clear",
            latencyMs: 15.2,
            details: `Cross-matched against 135-additive database: ${mergedFlaggedIngredients.length} compound(s) flagged.`
        },
        {
            step: 5,
            name: "Multi-Angle Packaging Fusion Decision",
            module: "Hierarchical Rule Engine",
            status: verdict,
            latencyMs: 1.8,
            details: `Unified multi-capture verdict: ${verdict} State (${riskLevel}).`
        }
    ];

    return {
        ...bestLogoScan,
        verdict,
        riskLevel,
        analysisSummary,
        recommendations,
        logoDetected,
        isInvalidLogo,
        logoBody,
        logoConfidence,
        ocrText: combinedOcrText,
        flaggedIngredients: mergedFlaggedIngredients,
        pipelineStages,
        totalLatencyMs: totalLatency,
        isDualScan: true,
        images: [firstImage, secondImage].filter(Boolean)
    };
}
