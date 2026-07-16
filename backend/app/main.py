from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="HalalVerify API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    imageBase64: str
    mode: str = "label"


def label_result() -> dict:
    return {
        "logoDetected": True,
        "logoConfidence": 0.94,
        "logoBody": "Islamic Da'wah Council of the Philippines (IDCP)",
        "ingredientsFound": ["Water", "Sugar", "Soybeans", "Wheat", "Gelatin (E441)", "Sodium Benzoate"],
        "flaggedIngredients": [
            {
                "ingredient": "Gelatin (E441)",
                "status": "Doubtful",
                "reason": "Animal-derived binder. Source not verified on packaging.",
            }
        ],
        "verdict": "Yellow",
        "analysisSummary": "Accredited logo detected (IDCP), but ingredients contain E441 (Gelatin) with unverified origins. Advisory status: Yellow.",
    }


def certificate_result() -> dict:
    return {
        "certifyingBody": "Halal Development Institute of the Philippines (HDIP)",
        "establishmentName": "Zamboanga Halal Food Haven",
        "certificateNumber": "HDIP-2026-90412",
        "expirationDate": "2027-04-12",
        "isExpired": False,
        "layoutConfidence": 0.89,
        "structuralZones": ["Header Zone", "Entity Identity", "Validity Block", "Authority Signature Seal"],
        "status": "Valid",
        "authenticationNote": "Passed layout structural segmentation. Certificate matches authorized HDIP formatting structures.",
    }


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "HalalVerify API"}


@app.post("/analyze/label")
def analyze_label(request: AnalyzeRequest) -> dict:
    return label_result()


@app.post("/analyze/certificate")
def analyze_certificate(request: AnalyzeRequest) -> dict:
    return certificate_result()


@app.get("/registry/additives")
def additives() -> dict:
    return {
        "items": [
            {"code": "E120", "name": "Carmine / Cochineal", "status": "Haram", "source": "Insects (derived from crushed female cochineal beetles)."},
            {"code": "E441", "name": "Gelatin", "status": "Doubtful", "source": "Often pork/non-halal bovine bone collagen unless explicitly certified."},
        ]
    }


@app.get("/registry/establishments")
def establishments() -> dict:
    return {
        "items": [
            {"id": "ZC-489-001", "name": "Al-Barka Halal Kitchen", "type": "Eatery", "address": "Canelar, Zamboanga City", "status": "Verified", "certNo": "HAL-2026-0089", "expiry": "2027-02-15"},
            {"id": "ZC-489-003", "name": "Sulu Sunset Grill", "type": "Restaurant", "address": "Paseo del Mar, Zamboanga City", "status": "Expired", "certNo": "HAL-2024-0011", "expiry": "2025-12-30"},
        ]
    }
