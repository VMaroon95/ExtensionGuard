"""Core analysis engine for Chrome extension security auditing."""

import re
import json
from typing import Optional
from dataclasses import dataclass, field

import httpx
from bs4 import BeautifulSoup

from permissions_db import (
    PERMISSIONS, RISK_SCORES, Category, RiskLevel,
    get_grade, get_grade_description,
)


@dataclass
class PermissionDetail:
    name: str
    risk_level: str
    category: str
    description: str
    explanation: str


@dataclass
class AuditReport:
    extension_id: str
    name: str
    version: str
    description: str
    safety_grade: str
    grade_description: str
    total_risk_score: int
    permissions: list[PermissionDetail] = field(default_factory=list)
    categories: dict = field(default_factory=dict)
    summary: str = ""
    user_count: str = ""
    rating: str = ""
    error: Optional[str] = None


def extract_extension_id(input_str: str) -> str:
    """Extract extension ID from a Chrome Web Store URL or raw ID."""
    input_str = input_str.strip()
    # Match Chrome Web Store URL patterns
    match = re.search(r'chrome\.google\.com/webstore/detail/[^/]*/([a-z]{32})', input_str)
    if match:
        return match.group(1)
    match = re.search(r'chromewebstore\.google\.com/detail/[^/]*/([a-z]{32})', input_str)
    if match:
        return match.group(1)
    # Check if it's a raw 32-char lowercase ID
    if re.match(r'^[a-z]{32}$', input_str):
        return input_str
    raise ValueError(f"Invalid extension ID or URL: {input_str}")


async def fetch_extension_data(extension_id: str) -> dict:
    """Fetch extension data from Chrome Web Store."""
    url = f"https://chromewebstore.google.com/detail/{extension_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract name
    name = ""
    title_tag = soup.find("title")
    if title_tag:
        name = title_tag.text.replace(" - Chrome Web Store", "").strip()

    # Extract description from meta
    description = ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        description = meta_desc.get("content", "")

    # Try to extract permissions and other data from script tags
    permissions = []
    version = ""
    user_count = ""
    rating = ""

    for script in soup.find_all("script"):
        text = script.string or ""

        # Look for permissions in structured data
        perm_matches = re.findall(r'"([a-zA-Z_.<>/*:]+)"', text)
        for p in perm_matches:
            cleaned = p.strip()
            if cleaned in PERMISSIONS and cleaned not in permissions:
                permissions.append(cleaned)

        # Look for host permissions (URL patterns)
        url_patterns = re.findall(r'(https?://\*(?:/\*)*|<all_urls>|\*://\*/\*)', text)
        for p in url_patterns:
            if p not in permissions:
                permissions.append(p)

    # If we couldn't parse permissions from page, try the CRX API
    if not permissions:
        permissions = await _try_crx_info(extension_id)

    return {
        "name": name or f"Extension {extension_id}",
        "description": description,
        "version": version or "Unknown",
        "permissions": permissions,
        "user_count": user_count,
        "rating": rating,
    }


async def _try_crx_info(extension_id: str) -> list[str]:
    """Fallback: try to get extension info from alternative sources."""
    try:
        url = f"https://chrome.google.com/webstore/detail/{extension_id}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            text = resp.text
            permissions = []
            for perm in PERMISSIONS:
                if f'"{perm}"' in text:
                    permissions.append(perm)
            return permissions
    except Exception:
        return []


def analyze_permissions(permissions: list[str]) -> tuple[list[PermissionDetail], dict, int]:
    """Analyze a list of permissions and return details, categories, and risk score."""
    details = []
    categories = {cat.value: {"count": 0, "permissions": [], "max_risk": "minimal"} for cat in Category}
    total_score = 0

    risk_order = [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW, RiskLevel.MINIMAL]

    for perm in permissions:
        if perm in PERMISSIONS:
            risk, category, desc, explanation = PERMISSIONS[perm]
        else:
            # Unknown permission — treat as medium risk
            risk = RiskLevel.MEDIUM
            category = Category.BROWSER_CONTROL
            desc = f"Unknown permission: {perm}"
            explanation = f"This permission ({perm}) is not in our database. Review it manually."

        detail = PermissionDetail(
            name=perm,
            risk_level=risk.value,
            category=category.value,
            description=desc,
            explanation=explanation,
        )
        details.append(detail)

        score = RISK_SCORES[risk]
        total_score += score

        cat_data = categories[category.value]
        cat_data["count"] += 1
        cat_data["permissions"].append(perm)

        # Track max risk per category
        current_max = RiskLevel(cat_data["max_risk"])
        if risk_order.index(risk) < risk_order.index(current_max):
            cat_data["max_risk"] = risk.value

    # Sort by risk level (critical first)
    details.sort(key=lambda d: risk_order.index(RiskLevel(d.risk_level)))

    return details, categories, total_score


def generate_summary(grade: str, total_score: int, details: list[PermissionDetail]) -> str:
    """Generate a human-readable summary of the audit."""
    critical_count = sum(1 for d in details if d.risk_level == "critical")
    high_count = sum(1 for d in details if d.risk_level == "high")

    parts = []
    if grade in ("A", "B"):
        parts.append("This extension requests minimal permissions and appears safe for general use.")
    elif grade == "C":
        parts.append("This extension requests some permissions that warrant review.")
    elif grade == "D":
        parts.append("This extension requests several concerning permissions. Use with caution.")
    else:
        parts.append("⚠️ This extension requests extensive permissions that pose significant privacy and security risks.")

    if critical_count:
        parts.append(f"Found {critical_count} critical-risk permission{'s' if critical_count > 1 else ''}.")
    if high_count:
        parts.append(f"Found {high_count} high-risk permission{'s' if high_count > 1 else ''}.")

    if not details:
        parts = ["This extension requests no special permissions. It appears very safe."]

    return " ".join(parts)


async def audit_extension(input_str: str) -> AuditReport:
    """Full audit pipeline: parse ID → fetch data → analyze → report."""
    try:
        extension_id = extract_extension_id(input_str)
    except ValueError as e:
        return AuditReport(
            extension_id=input_str, name="", version="", description="",
            safety_grade="?", grade_description="", total_risk_score=0,
            error=str(e),
        )

    try:
        data = await fetch_extension_data(extension_id)
    except httpx.HTTPStatusError as e:
        return AuditReport(
            extension_id=extension_id, name="", version="", description="",
            safety_grade="?", grade_description="", total_risk_score=0,
            error=f"Could not fetch extension from Chrome Web Store (HTTP {e.response.status_code}). Check the ID and try again.",
        )
    except Exception as e:
        return AuditReport(
            extension_id=extension_id, name="", version="", description="",
            safety_grade="?", grade_description="", total_risk_score=0,
            error=f"Error fetching extension data: {str(e)}",
        )

    details, categories, total_score = analyze_permissions(data["permissions"])
    grade = get_grade(total_score)

    report = AuditReport(
        extension_id=extension_id,
        name=data["name"],
        version=data["version"],
        description=data["description"],
        safety_grade=grade,
        grade_description=get_grade_description(grade),
        total_risk_score=total_score,
        permissions=details,
        categories=categories,
        summary=generate_summary(grade, total_score, details),
        user_count=data.get("user_count", ""),
        rating=data.get("rating", ""),
    )
    return report
