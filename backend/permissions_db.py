"""Comprehensive database of Chrome extension permissions with risk levels and descriptions."""

from enum import Enum
from typing import Dict, Tuple


class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"


class Category(str, Enum):
    DATA_ACCESS = "Data Access"
    BROWSER_CONTROL = "Browser Control"
    NETWORK_ACCESS = "Network Access"
    SYSTEM_ACCESS = "System Access"


# (risk_level, category, short_description, plain_english)
PERMISSIONS: Dict[str, Tuple[RiskLevel, Category, str, str]] = {
    # ── CRITICAL ──────────────────────────────────────────────
    "<all_urls>": (
        RiskLevel.CRITICAL, Category.DATA_ACCESS,
        "Access to all websites",
        "This extension can read and modify every website you visit, including banking sites, email, and social media."
    ),
    "http://*/*": (
        RiskLevel.CRITICAL, Category.DATA_ACCESS,
        "Access to all HTTP websites",
        "Can read and change content on every unencrypted website you visit."
    ),
    "https://*/*": (
        RiskLevel.CRITICAL, Category.DATA_ACCESS,
        "Access to all HTTPS websites",
        "Can read and change content on every secure website you visit, including banking and email."
    ),
    "*://*/*": (
        RiskLevel.CRITICAL, Category.DATA_ACCESS,
        "Access to all websites",
        "Can read and modify every single website you visit — total web access."
    ),
    "debugger": (
        RiskLevel.CRITICAL, Category.SYSTEM_ACCESS,
        "Chrome debugger access",
        "Can use Chrome's debugger to inspect and modify any page, intercept network traffic, and read passwords."
    ),
    "nativeMessaging": (
        RiskLevel.CRITICAL, Category.SYSTEM_ACCESS,
        "Native application communication",
        "Can communicate with programs installed on your computer, potentially running code outside the browser."
    ),
    "proxy": (
        RiskLevel.CRITICAL, Category.NETWORK_ACCESS,
        "Proxy settings control",
        "Can route all your internet traffic through any server it chooses — could intercept everything you do online."
    ),
    "vpnProvider": (
        RiskLevel.CRITICAL, Category.NETWORK_ACCESS,
        "VPN configuration",
        "Can create a VPN connection and route all your network traffic through it."
    ),
    "webRequestBlocking": (
        RiskLevel.CRITICAL, Category.NETWORK_ACCESS,
        "Block and modify web requests",
        "Can intercept, block, or modify any network request your browser makes before it's sent."
    ),
    "clipboardRead": (
        RiskLevel.CRITICAL, Category.DATA_ACCESS,
        "Read clipboard",
        "Can read whatever you've copied — passwords, credit card numbers, private messages."
    ),
    "content_security_policy": (
        RiskLevel.CRITICAL, Category.BROWSER_CONTROL,
        "Override content security policy",
        "Can weaken website security protections, potentially allowing injection attacks."
    ),

    # ── HIGH ──────────────────────────────────────────────────
    "webRequest": (
        RiskLevel.HIGH, Category.NETWORK_ACCESS,
        "Monitor web requests",
        "Can observe all network requests your browser makes, seeing which sites you visit and data you send."
    ),
    "cookies": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Read and modify cookies",
        "Can access your login sessions on any website — could potentially impersonate you."
    ),
    "history": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Access browsing history",
        "Can read your complete browsing history — every site you've ever visited."
    ),
    "bookmarks": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Access bookmarks",
        "Can read, create, and delete all your bookmarks."
    ),
    "tabs": (
        RiskLevel.HIGH, Category.BROWSER_CONTROL,
        "Access browser tabs",
        "Can see every tab you have open, including URLs and page titles."
    ),
    "webNavigation": (
        RiskLevel.HIGH, Category.BROWSER_CONTROL,
        "Monitor navigation events",
        "Can track every page navigation in real time — knows exactly where you go."
    ),
    "management": (
        RiskLevel.HIGH, Category.BROWSER_CONTROL,
        "Manage other extensions",
        "Can enable, disable, or uninstall your other extensions."
    ),
    "privacy": (
        RiskLevel.HIGH, Category.BROWSER_CONTROL,
        "Control privacy settings",
        "Can change your browser's privacy settings, potentially weakening protections."
    ),
    "downloads": (
        RiskLevel.HIGH, Category.SYSTEM_ACCESS,
        "Manage downloads",
        "Can initiate downloads and access your download history."
    ),
    "downloads.open": (
        RiskLevel.HIGH, Category.SYSTEM_ACCESS,
        "Open downloaded files",
        "Can automatically open downloaded files — potential malware vector."
    ),
    "geolocation": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Access your location",
        "Can determine your physical location."
    ),
    "clipboardWrite": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Write to clipboard",
        "Can modify your clipboard contents — could replace copied crypto addresses or account numbers."
    ),
    "contentSettings": (
        RiskLevel.HIGH, Category.BROWSER_CONTROL,
        "Change content settings",
        "Can modify settings for cookies, JavaScript, plugins, and other content on websites."
    ),
    "declarativeNetRequest": (
        RiskLevel.HIGH, Category.NETWORK_ACCESS,
        "Modify network requests (declarative)",
        "Can block or redirect network requests using predefined rules."
    ),
    "declarativeNetRequestWithHostAccess": (
        RiskLevel.HIGH, Category.NETWORK_ACCESS,
        "Modify network requests with host access",
        "Can modify network requests and access host-specific data."
    ),
    "pageCapture": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Capture page content",
        "Can save complete copies of any webpage you visit, including sensitive content."
    ),
    "tabCapture": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Capture tab media",
        "Can record audio and video from your browser tabs."
    ),
    "desktopCapture": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Capture screen content",
        "Can take screenshots or record your entire screen."
    ),
    "sessions": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Access recently closed tabs/sessions",
        "Can query and restore recently closed tabs and browsing sessions."
    ),
    "topSites": (
        RiskLevel.HIGH, Category.DATA_ACCESS,
        "Access most visited sites",
        "Can see your most frequently visited websites."
    ),

    # ── MEDIUM ────────────────────────────────────────────────
    "activeTab": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Access active tab on click",
        "Can access the current tab only when you click the extension — more limited than full tab access."
    ),
    "alarms": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Schedule tasks",
        "Can schedule code to run at specific times or intervals."
    ),
    "background": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Run in background",
        "Can run continuously in the background even when you're not using it."
    ),
    "browsingData": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Clear browsing data",
        "Can delete your browsing history, cookies, cache, and other data."
    ),
    "certificateProvider": (
        RiskLevel.MEDIUM, Category.NETWORK_ACCESS,
        "Provide certificates",
        "Can provide TLS certificates for authentication."
    ),
    "enterprise.deviceAttributes": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Read device attributes",
        "Can read attributes of your device in an enterprise environment."
    ),
    "fileBrowserHandler": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Handle file browser events",
        "Can extend Chrome OS file browser functionality."
    ),
    "fileSystemProvider": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Provide file systems",
        "Can create virtual file systems accessible by Chrome OS."
    ),
    "identity": (
        RiskLevel.MEDIUM, Category.DATA_ACCESS,
        "Access user identity",
        "Can get your Google account email and basic profile info."
    ),
    "identity.email": (
        RiskLevel.MEDIUM, Category.DATA_ACCESS,
        "Access user email",
        "Can see your Google account email address."
    ),
    "notifications": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Show notifications",
        "Can display desktop notifications — could be used for phishing or spam."
    ),
    "platformKeys": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Access platform keys",
        "Can access cryptographic keys managed by the platform."
    ),
    "scripting": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Execute scripts in pages",
        "Can inject and run JavaScript code in web pages."
    ),
    "search": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Trigger searches",
        "Can initiate searches using your default search engine."
    ),
    "signedInDevices": (
        RiskLevel.MEDIUM, Category.DATA_ACCESS,
        "Access signed-in devices",
        "Can see a list of devices signed into your Google account."
    ),
    "storage": (
        RiskLevel.MEDIUM, Category.DATA_ACCESS,
        "Store data locally",
        "Can store data on your computer. Generally safe but used for tracking sometimes."
    ),
    "system.cpu": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Read CPU info",
        "Can read information about your CPU — used for fingerprinting."
    ),
    "system.memory": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Read memory info",
        "Can read your system's memory information."
    ),
    "system.storage": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Read storage info",
        "Can read information about your storage devices."
    ),
    "ttsEngine": (
        RiskLevel.MEDIUM, Category.BROWSER_CONTROL,
        "Text-to-speech engine",
        "Can implement a text-to-speech engine."
    ),
    "unlimitedStorage": (
        RiskLevel.MEDIUM, Category.SYSTEM_ACCESS,
        "Unlimited local storage",
        "Can store unlimited data on your computer."
    ),
    "webAuthenticationProxy": (
        RiskLevel.MEDIUM, Category.NETWORK_ACCESS,
        "Web authentication proxy",
        "Can intercept web authentication requests."
    ),

    # ── LOW ───────────────────────────────────────────────────
    "contextMenus": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Add context menu items",
        "Can add options to your right-click menu. Generally harmless."
    ),
    "commands": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Keyboard shortcuts",
        "Can register keyboard shortcuts. Low risk."
    ),
    "dns": (
        RiskLevel.LOW, Category.NETWORK_ACCESS,
        "DNS resolution",
        "Can resolve domain names. Limited risk."
    ),
    "fontSettings": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Manage font settings",
        "Can change browser font settings."
    ),
    "gcm": (
        RiskLevel.LOW, Category.NETWORK_ACCESS,
        "Google Cloud Messaging",
        "Can use Google's push messaging service."
    ),
    "idle": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Detect idle state",
        "Can detect when you're away from the computer."
    ),
    "loginState": (
        RiskLevel.LOW, Category.DATA_ACCESS,
        "Read login state",
        "Can check if the browser session is logged in."
    ),
    "offscreen": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Create offscreen documents",
        "Can create offscreen documents for background processing."
    ),
    "permissions": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Manage own permissions",
        "Can request additional permissions at runtime."
    ),
    "power": (
        RiskLevel.LOW, Category.SYSTEM_ACCESS,
        "Manage power settings",
        "Can prevent the system from sleeping."
    ),
    "runtime": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Extension runtime access",
        "Basic extension lifecycle management."
    ),
    "sidePanel": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Side panel access",
        "Can display content in Chrome's side panel."
    ),
    "system.display": (
        RiskLevel.LOW, Category.SYSTEM_ACCESS,
        "Read display info",
        "Can read information about connected displays."
    ),
    "tabGroups": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Manage tab groups",
        "Can create and manage tab groups."
    ),
    "tts": (
        RiskLevel.LOW, Category.BROWSER_CONTROL,
        "Text-to-speech",
        "Can convert text to speech. Low risk."
    ),

    # ── MINIMAL ───────────────────────────────────────────────
    "action": (
        RiskLevel.MINIMAL, Category.BROWSER_CONTROL,
        "Extension toolbar action",
        "Controls the extension's toolbar button. Completely safe."
    ),
    "chrome_settings_overrides": (
        RiskLevel.MINIMAL, Category.BROWSER_CONTROL,
        "Override Chrome settings",
        "Can change your homepage or search engine."
    ),
    "declarativeContent": (
        RiskLevel.MINIMAL, Category.BROWSER_CONTROL,
        "Show action conditionally",
        "Can show the extension icon based on page content. Safe."
    ),
    "i18n": (
        RiskLevel.MINIMAL, Category.BROWSER_CONTROL,
        "Internationalization",
        "Multi-language support. Completely harmless."
    ),
    "omnibox": (
        RiskLevel.MINIMAL, Category.BROWSER_CONTROL,
        "Address bar keyword",
        "Adds a keyword trigger in the address bar. Safe."
    ),
    "theme": (
        RiskLevel.MINIMAL, Category.BROWSER_CONTROL,
        "Browser theme",
        "Can change browser appearance. Harmless."
    ),
}

# Risk score weights
RISK_SCORES = {
    RiskLevel.CRITICAL: 25,
    RiskLevel.HIGH: 15,
    RiskLevel.MEDIUM: 8,
    RiskLevel.LOW: 3,
    RiskLevel.MINIMAL: 1,
}

# Grade thresholds (total score → letter grade)
GRADE_THRESHOLDS = [
    (0, "A"),
    (10, "B"),
    (25, "C"),
    (50, "D"),
    (80, "E"),
    (999999, "F"),
]


def get_grade(score: int) -> str:
    for threshold, grade in GRADE_THRESHOLDS:
        if score <= threshold:
            return grade
    return "F"


def get_grade_description(grade: str) -> str:
    descriptions = {
        "A": "Excellent — Minimal permissions, very low risk",
        "B": "Good — Few permissions, low risk",
        "C": "Moderate — Some concerning permissions, review recommended",
        "D": "Concerning — Multiple high-risk permissions, use with caution",
        "E": "Dangerous — Extensive access to your data and browser",
        "F": "Critical Risk — Maximum access, extreme caution advised",
    }
    return descriptions.get(grade, "Unknown")
