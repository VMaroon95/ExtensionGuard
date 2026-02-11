"""ExtensionGuard — Chrome Extension Security Auditor API."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dataclasses import asdict

from analyzer import audit_extension

app = FastAPI(
    title="ExtensionGuard API",
    description="Chrome Extension Security Auditor — scan any extension for privacy risks and excessive permissions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuditRequest(BaseModel):
    extension_id: str


@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "ExtensionGuard"}


@app.post("/api/audit")
async def audit_post(req: AuditRequest):
    report = await audit_extension(req.extension_id)
    result = asdict(report)
    if report.error:
        raise HTTPException(status_code=400, detail=result)
    return result


@app.get("/api/audit/{extension_id}")
async def audit_get(extension_id: str):
    report = await audit_extension(extension_id)
    result = asdict(report)
    if report.error:
        raise HTTPException(status_code=400, detail=result)
    return result


# Serve frontend
try:
    app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
except Exception:
    pass
