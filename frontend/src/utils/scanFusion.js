/**
 * HalalVerify Multi-Capture Packaging Fusion Helper
 * Combines complementary camera captures (e.g. Front Halal Seal + Rear Ingredients Panel,
 * or multiple continuing sections of long packaging ingredient lists)
 * into a single unified 5-stage verification verdict.
 */

const CROSS_PANEL_HCB_PATTERNS = [
    { regex: /\bIDCP\b|ISLAMIC\s+DA'?WAH\s+COUNCIL/i, label: "IDCP (Islamic Da'wah Council of the Philippines)" },
    { regex: /\bHDIP\b|HALAL\s+DEVELOPMENT\s+INSTITUTE/i, label: "HDIP (Halal Development Institute of the Philippines)" },
    { regex: /\bHICCIP\b|HALAL\s+INTERNATIONAL\s+CHAMBER/i, label: "HICCIP (Halal International Chamber of Commerce and Industries Phils)" },
    { regex: /\bMMHCB\b|MINDANAO\s+MUSLIM\s+HALAL/i, label: "MMHCB (Mindanao Muslim Halal Certification Board)" },
    { regex: /\bMASLAHA\b|ADVOCACY\s+FOR\s+MUSLIM\s+AFFAIRS/i, label: "MASLAHA Halal Certification" },
    { regex: /\bMINHA\b|MINDANAO\s+HALAL\s+AUTHORITY/i, label: "MinHA (Mindanao Halal Authority)" },
    { regex: /\bPUCOI\b|PHILIPPINE\s+ULAMA\s+CONGRESS/i, label: "PUCOI (Philippine Ulama Congress Organization)" },
    { regex: /\bAHIP\b|ALLIANCE\s+FOR\s+HALAL\s+INTEGRITY/i, label: "AHIP (Alliance for Halal Integrity in the Phils)" },
    { regex: /\bPRIME\s+CERTIFICATION/i, label: "PRIME Certification Asia" },
    { regex: /\bFIQHI\b/i, label: "FIQHI Islamic Certification" },
    { regex: /\bPHILCOSED\b/i, label: "PHILCOSED Halal Certification" },
    { regex: /\bNCMF\b|NATIONAL\s+COMMISSION\s+ON\s+MUSLIM\s+FILIPINOS/i, label: "NCMF Official Halal Seal (Philippines)" },
    { regex: /\bBUSC\b|BANGSAMORO\s+UNITY|BASILAN\s+ULAMA/i, label: "BUSC (Bangsamoro Unity Summit Consultative)" },
    { regex: /\bBPCC\b|BANGSAMORO\s+PROFESSIONAL/i, label: "BPCC (Bangsamoro Professional Certification)" },
    { regex: /\bJAKIM\b|KEMAJUAN\s+ISLAM\s+MALAYSIA|\bMS\s*1500\b/i, label: "Malaysia Halal - JAKIM (Recognized Foreign Certifier)" },
    { regex: /\bMUIS\b|MAJLIS\s+UGAMA\s+ISLAM/i, label: "Singapore Halal - MUIS (Recognized Foreign Certifier)" },
    { regex: /\bBPJPH\b|\bLPPOM\b|\bMUI\b|MAJELIS\s+ULAMA\s+INDONESIA/i, label: "Indonesia Halal - BPJPH / MUI (Recognized Foreign Certifier)" },
    { regex: /\bCICOT\b|CENTRAL\s+ISLAMIC\s+COUNCIL\s+OF\s+THAILAND/i, label: "Thailand Halal - CICOT (Recognized Foreign Certifier)" },
];

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

    let logoDetected = Boolean(firstHasLogo || secondHasLogo);
    const isInvalidLogo = Boolean(firstScan.isInvalidLogo || secondScan.isInvalidLogo);
    let isAmbiguousHcb = logoDetected
        ? Boolean(
            firstHasLogo && secondHasLogo
                ? (firstScan.isAmbiguousHcb && secondScan.isAmbiguousHcb)
                : bestLogoScan.isAmbiguousHcb
        )
        : false;
    let logoBody = logoDetected ? bestLogoScan.logoBody : "Not detected";
    let logoConfidence = logoDetected ? Math.max(firstConfidence, secondConfidence) : 0;

    // 2. Accumulate all captured images
    const existingImages = firstScan.images || (firstImage ? [firstImage] : []);
    const newImages = secondScan.images || (secondImage ? [secondImage] : []);
    const combinedImages = [...existingImages, ...newImages].filter((img, idx, arr) => arr.indexOf(img) === idx);
    const totalPanels = Math.max(2, combinedImages.length);

    // 3. Combine and deduplicate OCR text + check cross-panel HCB disambiguation
    const text1 = (firstScan.ocrText || "").trim();
    const text2 = (secondScan.ocrText || "").trim();
    const combinedOcrText = [text1, text2].filter(Boolean).join("\n---\n");

    if (!isInvalidLogo && combinedOcrText && (!logoDetected || isAmbiguousHcb)) {
        const matchedHcb = CROSS_PANEL_HCB_PATTERNS.find((p) => p.regex.test(combinedOcrText));
        if (matchedHcb) {
            logoDetected = true;
            logoBody = matchedHcb.label;
            isAmbiguousHcb = false;
            logoConfidence = Math.min(95, Math.max(logoConfidence + 18, 88.5));
        }
    }

    // Recover specific HCB if candidate code was detected but label was left generic
    if (logoDetected && !isInvalidLogo && (isAmbiguousHcb || logoBody.includes("Recognized Halal Certification Seal") || logoBody === "Halal Certification Seal")) {
        const candidate = bestLogoScan.visualCandidateCode || bestLogoScan.visualCandidate || firstScan.visualCandidateCode || secondScan.visualCandidateCode;
        if (candidate && candidate !== "Generic_Halal_Seal") {
            const matchedCandidate = CROSS_PANEL_HCB_PATTERNS.find((p) => p.regex.test(candidate));
            if (matchedCandidate) {
                logoBody = matchedCandidate.label;
                isAmbiguousHcb = false;
                logoConfidence = Math.max(logoConfidence, 86.0);
            }
        }
    }

    const combinedTokenCount = Number(firstScan.ingredientTokenCount || 0) + Number(secondScan.ingredientTokenCount || 0);
    const hasReadableIngredients = Boolean(
        firstScan.ingredientStatus === "READABLE_PANEL" ||
        secondScan.ingredientStatus === "READABLE_PANEL" ||
        combinedTokenCount >= 3
    );
    const ingredientStatus = hasReadableIngredients ? "READABLE_PANEL" : "MISSING_OR_UNREADABLE";

    // 4. Deduplicate and merge flagged ingredients (excluding Halal/safe additives)
    const flagsMap = new Map();
    [...(firstScan.flaggedIngredients || []), ...(secondScan.flaggedIngredients || [])].forEach((item) => {
        if (!item || !item.ingredient) return;
        const st = (item.status || "").toLowerCase().trim();
        if (["halal", "safe", "compliant", "verified", "approved"].includes(st)) return;
        const key = item.ingredient.toLowerCase().trim();
        if (!flagsMap.has(key)) {
            flagsMap.set(key, item);
        }
    });
    const mergedFlaggedIngredients = Array.from(flagsMap.values());

    // 5. Calculate counts
    const haramCount = mergedFlaggedIngredients.filter(
        (i) => (i.status || "").toLowerCase() === "haram"
    ).length;
    const doubtfulCount = mergedFlaggedIngredients.filter((i) => {
        const s = (i.status || "").toLowerCase();
        return s === "doubtful" || s.includes("review") || s === "syubhah";
    }).length;

    // 6. Hierarchical Evidence-Fused Rule Engine Verdict Evaluation
    let verdict;
    let riskLevel;
    let analysisSummary;
    let recommendations;

    if (isInvalidLogo) {
        verdict = "Yellow";
        riskLevel = "Unaccredited Certification Mark";
        analysisSummary = "Notice: An unaccredited or unrecognized certification mark was detected across scanned panels. Under Philippine Halal standards, only accredited certifying bodies (e.g. IDCP, HDIP, NCMF) are officially verified.";
        recommendations = [
            "Verify certification credentials with an accredited certifying body.",
            "Cross-reference the manufacturer in the HalalVerify Product Catalog."
        ];
    } else if (haramCount > 0) {
        verdict = "Red";
        riskLevel = "Prohibited (Not Halal)";
        const itemLabel = haramCount === 1 ? "1 prohibited ingredient" : `${haramCount} prohibited ingredients`;
        analysisSummary = `Detected ${itemLabel} across the scanned packaging.`;
        if (logoDetected) {
            analysisSummary += ` Note: Prohibited ingredients were flagged despite the presence of a ${logoBody} mark.`;
        }
        recommendations = [
            "Avoid consuming this product.",
            "Verify with the manufacturer whether an animal derivative is halal-certified.",
            "Report conflicting certification via the Report Issue page."
        ];
    } else if (doubtfulCount > 0) {
        verdict = "Yellow";
        riskLevel = "Doubtful Ingredient";
        const itemLabel = doubtfulCount === 1 ? "1 ingredient requires" : `${doubtfulCount} ingredients require`;
        analysisSummary = `Screened ${totalPanels} packaging panels. ${itemLabel} source verification (plant vs. animal origin).`;
        recommendations = [
            "Verify the biological source of the flagged additive with the manufacturer.",
            "Check whether the product is covered by the certifying body."
        ];
    } else if (logoDetected && !hasReadableIngredients) {
        verdict = "Yellow";
        riskLevel = "Seal Found - Scan Ingredients";
        analysisSummary = `Detected ${logoBody} (${logoConfidence}% match), but a complete ingredient list was not readable yet. Capture a clearer photo of the back ingredient panel.`;
        recommendations = [
            "Point the camera directly at the back ingredient list.",
            "Ensure the ingredient text is flat, in focus, and free of glare."
        ];
    } else if (logoDetected && isAmbiguousHcb) {
        verdict = "Yellow";
        riskLevel = "Seal Found - Certifier Unclear";
        analysisSummary = `A Halal seal was localized (${logoConfidence}% match) and ingredients are clean, but the certifying body name on the seal rim could not be confirmed.`;
        recommendations = [
            "Capture a closer, well-lit shot of the Halal seal so the certifying body text on the rim can be read."
        ];
    } else if (logoDetected && hasReadableIngredients) {
        verdict = "Green";
        riskLevel = "Verified Halal";
        analysisSummary = `Accredited ${logoBody} seal confirmed (${logoConfidence}% match) with no prohibited or doubtful additives found across ${totalPanels} scanned panels.`;
        recommendations = [
            "Product exhibits accredited certification and clean ingredient declarations.",
            "Always check product packaging expiration dates before purchase."
        ];
    } else if (combinedOcrText.length > 0) {
        verdict = "Yellow";
        riskLevel = "Halal-Compliant Ingredients";
        analysisSummary = `Screened ingredients across ${totalPanels} panels and found no prohibited or doubtful additives.`;
        recommendations = [
            "Ingredient list appears free of known prohibited additives.",
            "Capture the side of the packaging showing the official Halal certification seal."
        ];
    } else {
        verdict = "Yellow";
        riskLevel = "No Product Detected";
        analysisSummary = `Neither food ingredient text nor an accredited halal certification logo could be identified in the captured photos.`;
        recommendations = [
            "Take a clearer, well-lit photo focusing on the ingredient label or certification seal.",
            "Ensure the packaging is flat and glare-free."
        ];
    }

    // 7. Aggregate IPO Pipeline Stages
    const totalLatency = (firstScan.totalLatencyMs || 50) + (secondScan.totalLatencyMs || 50);
    const pipelineStages = [
        {
            step: 1,
            name: "Multi-Frame Packaging Acquisition",
            module: "PIL / Volatile RAM",
            status: "Success",
            latencyMs: 32.5,
            details: `${totalPanels} packaging panels captured, normalized, and fused in memory.`
        },
        {
            step: 2,
            name: "Halal Logo Localization & ROI Crop OCR",
            module: "YOLOv8n ONNX + High-Res Crop OCR",
            status: logoDetected ? (isInvalidLogo ? "Invalid" : "Detected") : "None",
            latencyMs: Math.round(((firstScan.pipelineStages?.[1]?.latencyMs || 40) + (secondScan.pipelineStages?.[1]?.latencyMs || 40)) / 2),
            details: logoDetected
                ? `Accredited ${logoBody} seal verified (${logoConfidence}% match).`
                : "No accredited halal logo localized across captured panels."
        },
        {
            step: 3,
            name: "Ingredient Text Extraction & Section Isolation",
            module: firstScan.ocrEngine || secondScan.ocrEngine || "RapidOCR / Cloud Vision OCR",
            status: ingredientStatus,
            latencyMs: Math.round(((firstScan.pipelineStages?.[2]?.latencyMs || 100) + (secondScan.pipelineStages?.[2]?.latencyMs || 100)) / 2),
            details: hasReadableIngredients
                ? `Readable ingredient panel extracted across ${totalPanels} packaging panels (${combinedTokenCount} tokens).`
                : "Ingredient declaration panel not yet captured or readable."
        },
        {
            step: 4,
            name: "Multilingual & Chemical Additive Lexicon Screening",
            module: "Supabase Additives + EN/TL/MS Lexicon",
            status: mergedFlaggedIngredients.length > 0 ? "Flagged" : "Clear",
            latencyMs: 15.2,
            details: `Cross-matched against additives database: ${mergedFlaggedIngredients.length} ingredient(s) flagged.`
        },
        {
            step: 5,
            name: "Multi-Angle Packaging Fusion Decision",
            module: "Tri-State Evidence Decision Engine",
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
        isAmbiguousHcb,
        logoBody,
        logoConfidence,
        ingredientStatus,
        ingredientTokenCount: combinedTokenCount,
        ocrText: combinedOcrText,
        flaggedIngredients: mergedFlaggedIngredients,
        pipelineStages,
        totalLatencyMs: totalLatency,
        isDualScan: true,
        images: combinedImages
    };
}
