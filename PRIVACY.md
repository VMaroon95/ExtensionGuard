# Privacy Policy — ExtensionGuard

**Last updated: February 2026**

## The Short Version

ExtensionGuard does **not** collect, transmit, or store any of your data on any server. Everything happens locally on your device. That's it. That's the policy.

## The Detailed Version

### What We Don't Do
- ❌ We don't collect your browsing data
- ❌ We don't track which websites you visit
- ❌ We don't store your extension list on any server
- ❌ We don't transmit any data to any server
- ❌ We don't use analytics or telemetry
- ❌ We don't require an account or login
- ❌ We don't use cookies or tracking pixels
- ❌ We don't sell, share, or monetize any data

### What We Do (Locally)
All of the following happens **entirely on your device** in Chrome's local storage:

| Module | What's Stored Locally | Why |
|--------|----------------------|-----|
| Extension Monitor | Extension IDs, permission lists, risk scores | To detect permission changes over time |
| Clipboard Sanitizer | Timestamp of last clipboard clear, clear count | To show stats on your dashboard |
| URL Shield | Flagged URLs | To show history and avoid repeat warnings on dismissed URLs |
| Ghost Script Monitor | Detection events (URL, element type, timestamp) | To show history on your dashboard |
| AI Privacy Filter | Detection type only (e.g., "SSN detected") | To show stats. **Never stores the actual sensitive data.** |

### Permissions Explained

| Permission | Why We Need It |
|-----------|----------------|
| `management` | To monitor when extensions are installed, updated, or enabled |
| `notifications` | To alert you about security threats |
| `storage` | To save your settings and activity history locally on your device |
| `alarms` | To schedule periodic security re-scans |
| `clipboardWrite` | To clear your clipboard (Clipboard Sanitizer module) |
| `tabs` | To check URLs for phishing (URL Shield module) |
| `scripting` | To run content scripts that detect ghost elements and scan for PII |
| `declarativeNetRequest` | To analyze network request patterns |
| `<all_urls>` (host permission) | Required for content scripts to run on any website for Ghost Script and AI Privacy protection |

### Your Control
- You can toggle any module on or off at any time
- You can clear all locally stored history from the settings panel
- You can export your activity log as JSON
- You can uninstall ExtensionGuard at any time — all local data is removed with it

### Open Source
ExtensionGuard is 100% open source under the MIT License. You can audit every line of code at:
https://github.com/VMaroon95/ExtensionGuard

### Contact
Questions about privacy? Open an issue on GitHub or email varunmeda01@gmail.com.

---

*ExtensionGuard is built for the world's safety. Free forever.*
