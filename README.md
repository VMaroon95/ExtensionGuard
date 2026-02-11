```
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🛡️  E X T E N S I O N G U A R D                    ║
    ║                                                       ║
    ║   Chrome Extension Security Auditor                   ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
```

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com)
[![GitHub stars](https://img.shields.io/github/stars/VMaroon95/ExtensionGuard?style=social)](https://github.com/VMaroon95/ExtensionGuard)

**Scan any Chrome extension for privacy risks, excessive permissions, and suspicious behavior. Get an instant safety grade from A to F.**

---

## 🤔 Why ExtensionGuard?

Browser extensions have deep access to your data — your browsing history, passwords, even your clipboard. Many users install extensions without understanding what they're granting access to.

ExtensionGuard analyzes any Chrome extension's permissions and gives you:

- **Safety grade (A–F)** — instant risk assessment
- **Permission breakdown** — every permission categorized and risk-rated
- **Plain English explanations** — what each permission actually means for your privacy
- **Category analysis** — Data Access, Browser Control, Network Access, System Access

## 📸 Screenshots

> _Coming soon — the UI features a clean dark theme with color-coded risk grades._

## 🚀 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/VMaroon95/ExtensionGuard.git
cd ExtensionGuard
docker-compose up
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

### Manual Setup

```bash
git clone https://github.com/VMaroon95/ExtensionGuard.git
cd ExtensionGuard/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open [http://localhost:8000](http://localhost:8000).

## 🔍 How It Works

1. **Input** — Paste a Chrome extension ID or Web Store URL
2. **Fetch** — ExtensionGuard retrieves the extension's metadata from the Chrome Web Store
3. **Analyze** — Each permission is mapped to our risk database of 60+ known permissions
4. **Score** — Permissions are weighted by severity (Critical: 25pts, High: 15pts, Medium: 8pts, Low: 3pts, Minimal: 1pt)
5. **Grade** — Total risk score maps to a letter grade:

| Score | Grade | Meaning |
|-------|-------|---------|
| 0–10 | **A** | Excellent — minimal risk |
| 11–25 | **B** | Good — low risk |
| 26–50 | **C** | Moderate — review recommended |
| 51–80 | **D** | Concerning — use with caution |
| 81–120 | **E** | Dangerous — extensive access |
| 120+ | **F** | Critical — extreme caution |

### Permission Categories

- 🔍 **Data Access** — Permissions that read your personal data (history, cookies, clipboard)
- 🌐 **Browser Control** — Permissions that control browser behavior (tabs, notifications, scripts)
- 📡 **Network Access** — Permissions that monitor or modify network traffic
- 💻 **System Access** — Permissions that interact with your operating system

## 📡 API Documentation

### `POST /api/audit`

```json
{
  "extension_id": "cjpalhdlnbpafiamejdnhcphjbkeiagm"
}
```

### `GET /api/audit/{extension_id}`

```
GET /api/audit/cjpalhdlnbpafiamejdnhcphjbkeiagm
```

### `GET /api/health`

Returns `{"status": "healthy"}`.

### Response Format

```json
{
  "extension_id": "cjpalhdlnbpafiamejdnhcphjbkeiagm",
  "name": "uBlock Origin",
  "safety_grade": "C",
  "grade_description": "Moderate — Some concerning permissions, review recommended",
  "total_risk_score": 38,
  "permissions": [
    {
      "name": "webRequest",
      "risk_level": "high",
      "category": "Network Access",
      "description": "Monitor web requests",
      "explanation": "Can observe all network requests your browser makes..."
    }
  ],
  "categories": { ... },
  "summary": "This extension requests some permissions that warrant review."
}
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT](LICENSE) © Varun Meda
