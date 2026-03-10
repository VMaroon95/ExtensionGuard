# 🛡️ ExtensionGuard

> **Part of the [meda-claw](https://github.com/VMaroon95/meda-claw) Governance Stack** — Install the full suite via `pip install meda-claw`

**Your browser's silent bodyguard. 6 security modules. 100% local. Zero data leaves your device.**

> 287 Chrome extensions were caught spying on **37 million users**. Clipboard attacks are rising. Phishing URLs use invisible Unicode tricks. AI chatbots are leaking API keys. ExtensionGuard fights all of it.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen.svg)]()
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-purple.svg)]()

---

## 🚀 Install. Forget. Stay Protected.

| Step | What Happens |
|------|-------------|
| **1. Add to Chrome** | One click install |
| **2. Forget about it** | ExtensionGuard runs silently in the background |
| **3. Stay safe** | Get instant alerts when something's wrong |

---

## 🔐 5 Security Modules

### 🔍 Module 1: Extension Monitor
Watches every extension you install. Flags risky permissions instantly and detects **Permission Creep** — when extensions silently gain new permissions through updates.

- Real-time monitoring via `chrome.management` API
- A–F safety grading based on permission risk analysis
- **Permission Creep alerts** — catches extensions that sneak in dangerous permissions after updates
- 60+ permissions mapped across 4 risk tiers (Critical / High / Medium / Low)
- Daily automated re-scans of all installed extensions

### 📋 Module 2: Clipboard Sanitizer
Your clipboard holds passwords, credit cards, and sensitive data. This module auto-wipes it after 60 seconds of inactivity and blocks unauthorized background paste attempts.

- Automatic clipboard clearing on configurable timer (30s / 60s / 120s)
- Blocks stealth clipboard access from background scripts
- Activity logging for your dashboard
- Toggle on/off anytime

### 🔗 Module 3: Visual URL Shield
Catches phishing attacks that use look-alike characters. That "google.com" might actually be "gооgle.com" using Cyrillic characters.

- **Punycode detection** — flags `xn--` encoded domains
- **Homograph analysis** — detects Cyrillic/Latin character swaps (а↔a, е↔e, о↔o, etc.)
- **Look-alike patterns** — catches 0↔O, 1↔l, rn↔m substitutions
- **Known phishing patterns** — g00gle, amaz0n, paypa1
- Visual warning banner injected on suspicious pages
- One-click "Go back to safety" protection

### 👻 Module 4: Ghost Script Monitor
Detects invisible overlay attacks (clickjacking/UI redressing). Malicious pages layer invisible elements over legitimate buttons to hijack your clicks.

- **MutationObserver** watches for dynamically injected elements
- **Detection criteria:** opacity < 0.1, z-index > 9999, covering significant area
- Checks for invisible iframes overlaying interactive elements
- Visual red outline on detected ghost elements
- Real-time alerts with element details
- Uses `requestIdleCallback` for zero performance impact

### 🤖 Module 5: AI Privacy Filter
Scans text fields on AI platforms (ChatGPT, Claude, Gemini, Copilot, etc.) and warns you before you accidentally submit sensitive data.

- **PII Detection:** SSN, credit cards (with Luhn validation), phone numbers, email addresses
- **Secret Detection:** API keys (AWS, OpenAI, GitHub, Stripe, Google, Slack), private keys, JWT tokens
- **Password Detection:** common password= and pwd= patterns
- **Supported platforms:** ChatGPT, Claude, Gemini, Copilot, Perplexity, Poe, HuggingFace, and more
- Inline warning near the text field — warns but never blocks (you have final say)
- Debounced scanning (300ms) for zero performance impact
- **Never stores or transmits the actual sensitive data** — only logs the detection type

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              BACKGROUND SERVICE WORKER       │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │Extension │ │Clipboard │ │  URL Shield  │  │
│  │ Monitor  │ │Sanitizer │ │  (tab check) │  │
│  └──────────┘ └──────────┘ └─────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │    Notification & Storage Manager      │  │
│  └────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────┘
               │ chrome.runtime messaging
┌──────────────▼───────────────────────────────┐
│            CONTENT SCRIPTS (per tab)         │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │  Ghost   │ │AI Privacy│ │ URL Shield  │  │
│  │ Monitor  │ │  Filter  │ │  (banners)  │  │
│  └──────────┘ └──────────┘ └─────────────┘  │
└──────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│              POPUP DASHBOARD                 │
│  Module status • Activity feed • Settings   │
│  Privacy & Transparency                      │
└──────────────────────────────────────────────┘
```

All processing happens **locally in your browser**. There is no server component.

---

## 📊 Permission Risk Methodology

| Risk Tier | Score | Permissions |
|-----------|-------|-------------|
| 🔴 Critical | 10 | `<all_urls>`, `http://*/*`, `https://*/*`, `webRequest`, `webRequestBlocking`, `debugger`, `proxy` |
| 🟠 High | 7 | `tabs`, `history`, `cookies`, `bookmarks`, `downloads`, `clipboardRead`, `privacy`, `browsingData` |
| 🟡 Medium | 4 | `activeTab`, `storage`, `contextMenus`, `identity`, `webNavigation`, `scripting` |
| 🟢 Low | 1 | `alarms`, `idle`, `power`, `fontSettings`, `notifications` |

**Grading Scale:** A (0–5) • B (6–15) • C (16–30) • D (31–50) • F (51+)

---

## 📦 Installation

### Chrome Web Store
*Coming soon*

### Developer Mode (try it now)
1. Clone this repo: `git clone https://github.com/VMaroon95/ExtensionGuard.git`
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `extension/` folder
6. ExtensionGuard is now protecting you ✅

---

## 🔒 Privacy & Transparency

- **100% local processing** — all analysis runs on your device
- **Zero data transmission** — nothing is ever sent to any server
- **No telemetry** — we don't track you, period
- **No accounts** — no sign-up, no login, no cloud
- **Open source** — every line of code is auditable on GitHub
- **Free forever** — built for the world's safety

See our full [Privacy Policy](PRIVACY.md) for details.

---

## 🗺️ Roadmap

- [ ] Chrome Web Store listing
- [ ] Email digest alerts (opt-in)
- [ ] Firefox port
- [ ] Safari port
- [ ] Enterprise team dashboard
- [ ] Community threat intelligence feed
- [ ] Extension reputation database
- [ ] Auto-disable dangerous extensions (with user consent)

---

## 🛠️ Tech Stack

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** — no frameworks, no dependencies, lightweight
- **Chrome APIs:** Management, Notifications, Storage, Alarms, Tabs, Scripting, DeclarativeNetRequest
- **Content Scripts:** MutationObserver, getBoundingClientRect, Regex-based PII detection

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

---

## 📄 License

MIT License — Copyright © 2026 Varun Meda

Built with ❤️ for a safer internet.
