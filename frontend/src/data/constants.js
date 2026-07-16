export const SYSTEM_TITLE = "HalalVerify";
export const PROPONENTS = ["Cuento, Collen B.", "Mira, Kenneth Q.", "Villanueva, Ashley Nicole N."];
export const JURISDICTION = "Zamboanga City (Ordinance No. 489)";

export const E_NUMBERS_DATABASE = [
    { code: "E120", name: "Carmine / Cochineal", status: "Haram", source: "Insects (derived from crushed female cochineal beetles)." },
    { code: "E441", name: "Gelatin", status: "Doubtful", source: "Often pork/non-halal bovine bone collagen unless explicitly certified." },
    { code: "E542", name: "Edible Bone Phosphate", status: "Haram", source: "Animal bones (frequently non-halal origins)." },
    { code: "E904", name: "Shellac", status: "Doubtful", source: "Insect secretion, contested by some local regulatory groups." },
    { code: "E471", name: "Mono- and di-glycerides", status: "Doubtful", source: "Can be vegetable or animal-fat based. Requires source verification." },
    { code: "L-Cysteine", name: "E920", status: "Haram", source: "Often sourced from human hair or animal feathers." }
];

export const LOCAL_ESTABLISHMENTS = [
    { id: "ZC-489-001", name: "Al-Barka Halal Kitchen", type: "Eatery", address: "Canelar, Zamboanga City", status: "Verified", certNo: "HAL-2026-0089", expiry: "2027-02-15" },
    { id: "ZC-489-002", name: "Yakan Heritage Cafe", type: "Restaurant", address: "Upper Calarian, Zamboanga City", status: "Verified", certNo: "HAL-2026-0142", expiry: "2027-05-10" },
    { id: "ZC-489-003", name: "Sulu Sunset Grill", type: "Restaurant", address: "Paseo del Mar, Zamboanga City", status: "Expired", certNo: "HAL-2024-0011", expiry: "2025-12-30" },
    { id: "ZC-489-004", name: "Zambo Halal Mart", type: "Retailer", address: "Gov. Lim Avenue, Zamboanga City", status: "Verified", certNo: "HAL-2026-0033", expiry: "2027-08-22" }
];

export const SCAN_HISTORY = [
    { id: "SCN-001", user: "inspector@halalverify.com", mode: "label", product: "Ayamas Chicken Nuggets", verdict: "Green", logoDetected: true, confidence: 0.94, date: "2026-07-16T09:12:00", flaggedCount: 0 },
    { id: "SCN-002", user: "consumer@gmail.com", mode: "label", product: "Unknown Soy Sauce Brand", verdict: "Yellow", logoDetected: true, confidence: 0.78, date: "2026-07-16T08:45:00", flaggedCount: 1 },
    { id: "SCN-003", user: "inspector@halalverify.com", mode: "cert", product: "Sulu Sunset Grill Certificate", verdict: "Expired", logoDetected: false, confidence: 0.89, date: "2026-07-15T14:30:00", flaggedCount: 0 },
    { id: "SCN-004", user: "consumer@gmail.com", mode: "label", product: "Nestlé KitKat Bar", verdict: "Red", logoDetected: false, confidence: 0.91, date: "2026-07-15T11:00:00", flaggedCount: 2 },
    { id: "SCN-005", user: "admin@halalverify.com", mode: "cert", product: "Al-Barka Halal Kitchen Certificate", verdict: "Green", logoDetected: true, confidence: 0.97, date: "2026-07-14T16:20:00", flaggedCount: 0 },
    { id: "SCN-006", user: "consumer@gmail.com", mode: "label", product: "Local Vinegar (No Brand)", verdict: "Yellow", logoDetected: false, confidence: 0.62, date: "2026-07-14T09:55:00", flaggedCount: 1 },
];

export const MODEL_METRICS = {
    yolov8: {
        precision: 91.2,
        recall: 88.5,
        mAP50: 92.4,
        batches: [
            { batch: "Batch 1 (n=50)", precision: 87.1, recall: 83.2, mAP50: 88.0 },
            { batch: "Batch 2 (n=100)", precision: 89.4, recall: 86.7, mAP50: 90.2 },
            { batch: "Batch 3 (n=150)", precision: 91.0, recall: 88.1, mAP50: 92.1 },
            { batch: "Batch 4 (n=200)", precision: 91.2, recall: 88.5, mAP50: 92.4 },
        ]
    },
    easyocr: {
        cer: 4.3,
        accuracy: 95.7,
    },
    paddleocr: {
        layoutAccuracy: 89.1,
        fieldExtractionRate: 93.4,
    },
    sus: {
        score: 82.5,
        rating: "Excellent",
        respondents: 42,
    }
};