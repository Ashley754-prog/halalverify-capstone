import os

from app.routes import admin, analyze, health, issue_reports, products, registry, scan_history, summaries
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HalalVerify API", version="0.1.0")

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

# Regex matches localhost, 127.0.0.1, any Vercel deployment (*.vercel.app), and Render domains
CORS_ORIGIN_REGEX = r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app|https://.*\.onrender\.com)$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(products.router)
app.include_router(registry.router)
app.include_router(summaries.router)
app.include_router(issue_reports.router)
app.include_router(scan_history.router)
app.include_router(admin.router)
