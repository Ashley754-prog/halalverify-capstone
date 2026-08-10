from app.routes import analyze, health, issue_reports, registry, scan_history, summaries
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HalalVerify API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(registry.router)
app.include_router(summaries.router)
app.include_router(issue_reports.router)
app.include_router(scan_history.router)
