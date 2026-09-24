import os
import time
from collections import defaultdict
from threading import Lock

from app.routes import admin, analyze, health, issue_reports, products, registry, scan_history, summaries
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

app = FastAPI(title="HalalVerify API", version="0.1.0")


# ---------------------------------------------------------------------------
# In-Memory Thread-Safe Sliding-Window Rate Limiter
# ---------------------------------------------------------------------------
class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, general_rpm: int = 60, heavy_rpm: int = 15):
        super().__init__(app)
        self.general_rpm = general_rpm
        self.heavy_rpm = heavy_rpm
        self.lock = Lock()
        self.general_history = defaultdict(list)
        self.heavy_history = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Exempt health check and CORS preflight
        if request.method == "OPTIONS" or request.url.path in ["/health", "/"]:
            return await call_next(request)

        forwarded = request.headers.get("x-forwarded-for")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
        now = time.time()
        is_heavy = request.url.path.startswith("/analyze/")

        with self.lock:
            history = self.heavy_history if is_heavy else self.general_history
            limit = self.heavy_rpm if is_heavy else self.general_rpm

            window = [t for t in history[client_ip] if now - t < 60]
            if len(window) >= limit:
                retry_after = int(60 - (now - window[0])) + 1
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please wait a moment before retrying."},
                    headers={"Retry-After": str(max(1, retry_after))},
                )
            window.append(now)
            history[client_ip] = window

            # Clean up inactive IP history if tracked cache grows large
            if len(history) > 1000:
                for ip in list(history.keys()):
                    history[ip] = [t for t in history[ip] if now - t < 60]
                    if not history[ip]:
                        del history[ip]

        return await call_next(request)


# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        return response


# Apply defensive security middleware (outermost runs first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimiterMiddleware)

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

# Matches localhost, 127.0.0.1, Vercel deployments (*.vercel.app), and ngrok domains
CORS_ORIGIN_REGEX = r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app|https://.*\.hf\.space|https://.*\.ngrok-free\.(dev|app)|https://.*\.onrender\.com)$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
