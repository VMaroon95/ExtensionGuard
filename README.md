# 🛡️ ExtensionGuard

**Install. Forget. Stay Safe.**

> 287 Chrome extensions were caught spying on **37 million users**. ExtensionGuard watches your back.

---

## The Problem

Browser extensions have nearly unlimited access to your data — passwords, browsing history, cookies, keystrokes. Most users install extensions without understanding what permissions they're granting. Malicious extensions have compromised millions of users.

## How It Works

1. **Add to Chrome** — One click install, zero configuration
2. **Silent Monitoring** — Automatically scans every extension you install or enable
3. **Instant Alerts** — Desktop notifications when a risky extension is detected

## Features

- ⚡ **Real-time monitoring** — Scans extensions the moment they're installed
- 🔒 **100% private** — All analysis happens locally, zero data leaves your browser
- 🔔 **Smart alerts** — Notifications for dangerous extensions with plain English explanations
- 📊 **Dashboard** — See all extensions graded A–F with full permission breakdowns
- 🔄 **Daily re-scans** — Catches extensions that silently update their permissions
- 🎯 **Zero config** — Install and forget

## Permission Risk Methodology

| Level | Score | Permissions |
|-------|-------|-------------|
| 🔴 Critical | 10 pts | `<all_urls>`, `http://*/*`, `https://*/*`, `webRequest`, `webRequestBlocking`, `debugger`, `proxy` |
| 🟠 High | 7 pts | `tabs`, `history`, `cookies`, `bookmarks`, `downloads`, `clipboardRead`, `privacy`, `browsingData` |
| 🟡 Medium | 4 pts | `activeTab`, `storage`, `contextMenus`, `identity`, `webNavigation`, `scripting` |
| 🟢 Low | 1 pt | `alarms`, `idle`, `power`, `fontSettings`, `notifications` |

### Grading Scale

| Grade | Score Range | Meaning |
|-------|------------|---------|
| **A** | 0–5 | Safe |
| **B** | 6–15 | Low risk |
| **C** | 16–30 | Moderate risk — notification sent |
| **D** | 31–50 | High risk — persistent notification |
| **F** | 51+ | Dangerous — persistent notification |

## Installation

### Developer Mode (Now)

1. Clone this repo: `git clone https://github.com/VMaroon95/ExtensionGuard.git`
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `extension/` folder
5. Done! ExtensionGuard is now monitoring your browser

### Chrome Web Store

Coming soon.

## Architecture

```
extension/
├── manifest.json      # Manifest V3 configuration
├── background.js      # Service worker — event listeners, risk analysis, notifications
├── popup.html         # Dashboard UI
├── popup.css          # Dark theme styles
├── popup.js           # Dashboard logic
└── icons/             # Shield icons (16, 48, 128px)
```

- **background.js** — Listens to `chrome.management.onInstalled` and `onEnabled` events, performs permission risk analysis, fires notifications, and stores results
- **popup.js** — Reads scan results from `chrome.storage.local` and renders the dashboard

## Privacy

**Zero data leaves your browser. Ever.**

- No servers, no analytics, no tracking
- All permission analysis runs locally in the service worker
- Scan results stored only in `chrome.storage.local`
- No network requests made by ExtensionGuard
- See [PRIVACY.md](PRIVACY.md) for full policy

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript (no dependencies)
- Chrome Management API
- Chrome Storage API
- Chrome Notifications API
- Chrome Alarms API

## Roadmap

- [ ] 📧 Weekly email digest of extension safety reports
- [ ] 🦊 Firefox port (WebExtensions API)
- [ ] 👥 Team dashboard for enterprise
- [ ] 🌐 Extension reputation API integration
- [ ] 📱 Extension update changelog tracking
- [ ] ⚙️ Custom risk thresholds

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE)

---

Built by [Varun Meda](https://github.com/VMaroon95) · © 2026
