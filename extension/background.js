// ============================================
// EXTENSIONGUARD v2.0 — BACKGROUND SERVICE WORKER
// 5 Security Modules | 100% Local Processing
// ============================================

// ---- DEFAULT SETTINGS ----
const DEFAULT_SETTINGS = {
  modules: {
    extensionMonitor: true,
    clipboardSanitizer: true,
    urlShield: true,
    ghostMonitor: true,
    aiPrivacyFilter: true
  },
  clipboardInterval: 60,
  notifications: 'all' // 'all' | 'critical' | 'silent'
};

const DEFAULT_STATS = {
  extensionMonitor: { monitored: 0, flagged: 0, lastScan: 0 },
  clipboardSanitizer: { clearCount: 0, lastCleared: 0, todayCount: 0, todayDate: '' },
  urlShield: { blocked: 0, flaggedUrls: [] },
  ghostMonitor: { detected: 0 },
  aiPrivacyFilter: { prevented: 0 }
};

// ---- SHARED UTILITIES ----

const notificationTimestamps = new Map();
const NOTIFICATION_COOLDOWN = 30000; // 30s dedup

function shouldNotify(key) {
  const now = Date.now();
  const last = notificationTimestamps.get(key) || 0;
  if (now - last < NOTIFICATION_COOLDOWN) return false;
  notificationTimestamps.set(key, now);
  return true;
}

async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

async function getStats() {
  const result = await chrome.storage.local.get('stats');
  return result.stats || { ...DEFAULT_STATS };
}

async function updateStats(module, updates) {
  const stats = await getStats();
  stats[module] = { ...stats[module], ...updates };
  await chrome.storage.local.set({ stats });
  broadcastUpdate();
}

async function addActivity(module, icon, description) {
  const result = await chrome.storage.local.get('activityLog');
  const log = result.activityLog || [];
  log.unshift({
    module,
    icon,
    description,
    timestamp: Date.now()
  });
  // Keep last 200 entries
  if (log.length > 200) log.length = 200;
  await chrome.storage.local.set({ activityLog: log });
  broadcastUpdate();
}

function broadcastUpdate() {
  chrome.runtime.sendMessage({ type: 'statsUpdated' }).catch(() => {});
}

async function fireNotification(id, title, message, priority = 'normal') {
  const settings = await getSettings();
  if (settings.notifications === 'silent') return;
  if (settings.notifications === 'critical' && priority !== 'critical') return;
  if (!shouldNotify(id)) return;

  chrome.notifications.create(id + '-' + Date.now(), {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: priority === 'critical' ? 2 : 1
  });
}

async function isModuleEnabled(moduleName) {
  const settings = await getSettings();
  return settings.modules[moduleName] !== false;
}

// ---- MODULE 1: EXTENSION MONITOR ----

const PERMISSION_EXPLAIN = {
  '<all_urls>': 'Access ALL websites you visit',
  'http://*/*': 'Access all HTTP websites',
  'https://*/*': 'Access all HTTPS websites',
  'file:///*': 'Access local files on your computer',
  'webRequest': 'Monitor all network requests',
  'webRequestBlocking': 'Block or modify network requests',
  'cookies': 'Read/modify cookies including login sessions',
  'history': 'Read your entire browsing history',
  'bookmarks': 'Read and modify bookmarks',
  'tabs': 'See all open tabs and their URLs',
  'activeTab': 'Access the current tab on click',
  'clipboardRead': 'Read your clipboard contents',
  'clipboardWrite': 'Write to your clipboard',
  'geolocation': 'Access your location',
  'management': 'Manage other extensions',
  'nativeMessaging': 'Communicate with programs on your computer',
  'proxy': 'Route your traffic through a proxy',
  'debugger': 'Full debugging access to browser',
  'scripting': 'Inject scripts into web pages',
  'browsingData': 'Delete your browsing data',
  'contentSettings': 'Change content settings (JS, cookies, etc.)',
  'downloads': 'Manage your downloads',
  'identity': 'Access your Google account identity',
  'privacy': 'Change browser privacy settings',
  'topSites': 'See your most visited sites',
};

const PERMISSION_RISK = {
  '<all_urls>': 'CRITICAL',
  'http://*/*': 'CRITICAL',
  'https://*/*': 'CRITICAL',
  'file:///*': 'CRITICAL',
  'webRequest': 'HIGH',
  'webRequestBlocking': 'CRITICAL',
  'cookies': 'HIGH',
  'history': 'HIGH',
  'bookmarks': 'MEDIUM',
  'tabs': 'MEDIUM',
  'activeTab': 'LOW',
  'storage': 'LOW',
  'alarms': 'LOW',
  'notifications': 'LOW',
  'clipboardRead': 'HIGH',
  'clipboardWrite': 'MEDIUM',
  'geolocation': 'HIGH',
  'management': 'HIGH',
  'nativeMessaging': 'CRITICAL',
  'proxy': 'CRITICAL',
  'debugger': 'CRITICAL',
  'declarativeNetRequest': 'MEDIUM',
  'scripting': 'HIGH',
  'topSites': 'MEDIUM',
  'browsingData': 'HIGH',
  'contentSettings': 'HIGH',
  'downloads': 'MEDIUM',
  'identity': 'HIGH',
  'privacy': 'HIGH',
  'system.cpu': 'LOW',
  'system.memory': 'LOW',
  'system.storage': 'LOW',
  'tts': 'LOW',
  'unlimitedStorage': 'LOW',
  'webNavigation': 'MEDIUM',
  'pageCapture': 'HIGH',
  'tabCapture': 'HIGH',
  'desktopCapture': 'CRITICAL'
};

function calculateGrade(permissions, hostPermissions) {
  const allPerms = [...(permissions || []), ...(hostPermissions || [])];
  let score = 100;

  for (const perm of allPerms) {
    const risk = PERMISSION_RISK[perm];
    if (risk === 'CRITICAL') score -= 30;
    else if (risk === 'HIGH') score -= 15;
    else if (risk === 'MEDIUM') score -= 8;
    else if (risk === 'LOW') score -= 3;
    else score -= 5; // unknown permission
  }

  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 55) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function getRiskLevel(grade) {
  if (grade === 'A') return 'Safe';
  if (grade === 'B') return 'Low Risk';
  if (grade === 'C') return 'Moderate Risk';
  if (grade === 'D') return 'High Risk';
  return 'Dangerous';
}

async function scanExtension(ext) {
  if (ext.id === chrome.runtime.id) return null;

  const permissions = ext.permissions || [];
  const hostPermissions = ext.hostPermissions || [];
  const grade = calculateGrade(permissions, hostPermissions);
  const riskLevel = getRiskLevel(grade);

  const extData = {
    id: ext.id,
    name: ext.name,
    version: ext.version,
    enabled: ext.enabled,
    permissions,
    hostPermissions,
    grade,
    riskLevel,
    scannedAt: Date.now()
  };

  // Store extension data
  const result = await chrome.storage.local.get('extensionData');
  const data = result.extensionData || {};
  const oldData = data[ext.id];
  data[ext.id] = extData;
  await chrome.storage.local.set({ extensionData: data });

  return { extData, oldData };
}

async function checkPermissionCreep(ext, oldData, newData) {
  if (!oldData) return;

  const oldPerms = new Set([...(oldData.permissions || []), ...(oldData.hostPermissions || [])]);
  const newPerms = [...(newData.permissions || []), ...(newData.hostPermissions || [])];

  const addedPerms = newPerms.filter(p => !oldPerms.has(p));
  if (addedPerms.length === 0) return;

  const hasHighRisk = addedPerms.some(p => {
    const risk = PERMISSION_RISK[p];
    return risk === 'HIGH' || risk === 'CRITICAL';
  });

  if (hasHighRisk) {
    const permNames = addedPerms.join(', ');
    await fireNotification(
      'perm-creep-' + ext.id,
      '⚠️ Permission Creep Alert',
      `Extension "${ext.name}" just gained new permissions after an update: ${permNames}`,
      'critical'
    );
    await addActivity('extensionMonitor', '⚠️', `Permission creep: "${ext.name}" gained ${permNames}`);
  }
}

async function scanAllExtensions() {
  if (!await isModuleEnabled('extensionMonitor')) return;

  const extensions = await chrome.management.getAll();
  let flagged = 0;

  for (const ext of extensions) {
    const result = await scanExtension(ext);
    if (result && (result.extData.grade === 'D' || result.extData.grade === 'F')) {
      flagged++;
    }
  }

  await updateStats('extensionMonitor', {
    monitored: extensions.length - 1, // exclude self
    flagged,
    lastScan: Date.now()
  });
}

chrome.management.onInstalled.addListener(async (ext) => {
  if (!await isModuleEnabled('extensionMonitor')) return;

  const result = await scanExtension(ext);
  if (!result) return;

  const { extData, oldData } = result;

  if (oldData) {
    // This is an update
    await checkPermissionCreep(ext, oldData, extData);
    await addActivity('extensionMonitor', '🔄', `Extension updated: "${ext.name}" v${ext.version} (Grade: ${extData.grade})`);
  } else {
    // New install
    // Build a human-readable permission summary
    const allPerms = [...(extData.permissions || []), ...(extData.hostPermissions || [])];
    const dangerousPerms = allPerms.filter(p => PERMISSION_RISK[p] === 'CRITICAL' || PERMISSION_RISK[p] === 'HIGH');
    const permSummary = dangerousPerms.length > 0
      ? `\n⚠️ Risky permissions: ${dangerousPerms.slice(0, 3).map(p => PERMISSION_EXPLAIN[p] || p).join(', ')}${dangerousPerms.length > 3 ? ` +${dangerousPerms.length - 3} more` : ''}`
      : '';

    if (extData.grade === 'D' || extData.grade === 'F') {
      await fireNotification(
        'ext-risky-' + ext.id,
        `🚨 DANGER: "${ext.name}" — Grade ${extData.grade}`,
        `This extension is ${extData.riskLevel.toLowerCase()}. It has ${allPerms.length} permissions.${permSummary}\n\nConsider removing it from chrome://extensions`,
        'critical'
      );
    } else if (extData.grade === 'C') {
      await fireNotification(
        'ext-warn-' + ext.id,
        `⚠️ Warning: "${ext.name}" — Grade ${extData.grade}`,
        `Moderate risk. ${allPerms.length} permissions detected.${permSummary}`
      );
    } else {
      await fireNotification(
        'ext-install-' + ext.id,
        `✅ "${ext.name}" — Grade ${extData.grade}`,
        `Looks safe! ${allPerms.length} permissions, all low risk.`
      );
    }
    await addActivity('extensionMonitor', '🔍', `New extension: "${ext.name}" — Grade ${extData.grade}`);
  }

  await scanAllExtensions();
});

chrome.management.onEnabled.addListener(async (ext) => {
  if (!await isModuleEnabled('extensionMonitor')) return;

  const result = await scanExtension(ext);
  if (!result) return;

  await addActivity('extensionMonitor', '✅', `Extension enabled: "${ext.name}" — Grade ${result.extData.grade}`);
  await scanAllExtensions();
});

chrome.management.onUninstalled.addListener(async (id) => {
  if (!await isModuleEnabled('extensionMonitor')) return;

  const result = await chrome.storage.local.get('extensionData');
  const data = result.extensionData || {};
  const name = data[id]?.name || 'Unknown';
  delete data[id];
  await chrome.storage.local.set({ extensionData: data });

  await addActivity('extensionMonitor', '🗑️', `Extension removed: "${name}"`);
  await scanAllExtensions();
});

// ---- MODULE 2: CLIPBOARD SANITIZER ----

async function clearClipboard() {
  if (!await isModuleEnabled('clipboardSanitizer')) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || tab.url?.startsWith('chrome://')) return;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        navigator.clipboard.writeText('').catch(() => {});
      }
    });

    const stats = await getStats();
    const today = new Date().toDateString();
    const todayCount = stats.clipboardSanitizer.todayDate === today
      ? stats.clipboardSanitizer.todayCount + 1
      : 1;

    await updateStats('clipboardSanitizer', {
      clearCount: (stats.clipboardSanitizer.clearCount || 0) + 1,
      lastCleared: Date.now(),
      todayCount,
      todayDate: today
    });
  } catch (e) {
    // Tab might not be accessible, silently continue
  }
}

// ---- MODULE 3: VISUAL URL SHIELD ----

const CONFUSABLE_CHARS = {
  '\u0430': 'a', // Cyrillic а
  '\u0435': 'e', // Cyrillic е
  '\u043E': 'o', // Cyrillic о
  '\u0440': 'p', // Cyrillic р
  '\u0441': 'c', // Cyrillic с
  '\u0443': 'y', // Cyrillic у (looks like y)
  '\u0445': 'x', // Cyrillic х
  '\u04BB': 'h', // Cyrillic һ
  '\u0456': 'i', // Cyrillic і
  '\u0458': 'j', // Cyrillic ј
  '\u04CF': 'l', // Cyrillic ӏ
  '\u043D': 'n', // Cyrillic н (similar in some fonts)
  '\u0455': 's', // Cyrillic ѕ
  '\u0457': 'i', // Cyrillic ї
  '\u0491': 'r', // Cyrillic ґ
  '\u03B1': 'a', // Greek alpha
  '\u03BF': 'o', // Greek omicron
  '\u03B5': 'e', // Greek epsilon
  '\u0261': 'g', // Latin small script g
  '\u01C3': '!', // Latin letter retroflex click
};

const LOOKALIKE_PATTERNS = [
  { pattern: /g[0o][0o]gle/i, target: 'google' },
  { pattern: /amaz[0o]n/i, target: 'amazon' },
  { pattern: /paypa[1l]/i, target: 'paypal' },
  { pattern: /app[1l]e/i, target: 'apple' },
  { pattern: /faceb[0o][0o]k/i, target: 'facebook' },
  { pattern: /micr[0o]s[0o]ft/i, target: 'microsoft' },
  { pattern: /netf[1l]ix/i, target: 'netflix' },
  { pattern: /tw[1i]tter/i, target: 'twitter' },
  { pattern: /1nstagram/i, target: 'instagram' },
  { pattern: /wa[1l]mart/i, target: 'walmart' },
  { pattern: /chases?[0o]n[1l]ine/i, target: 'chase' },
  { pattern: /we[1l]{2}sfarg[0o]/i, target: 'wellsfargo' },
  { pattern: /bank[0o]famerica/i, target: 'bankofamerica' },
];

function analyzeUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const issues = [];

    // Check punycode
    if (hostname.includes('xn--')) {
      issues.push({ type: 'punycode', detail: `Punycode domain detected: ${hostname}` });
    }

    // Check homograph characters
    const confusableFound = [];
    for (const char of hostname) {
      if (CONFUSABLE_CHARS[char]) {
        confusableFound.push({ char, looksLike: CONFUSABLE_CHARS[char], code: char.codePointAt(0).toString(16) });
      }
    }
    if (confusableFound.length > 0) {
      issues.push({
        type: 'homograph',
        detail: `Suspicious characters: ${confusableFound.map(c => `"${c.char}" (U+${c.code.toUpperCase()}) looks like "${c.looksLike}"`).join(', ')}`,
        chars: confusableFound
      });
    }

    // Check lookalike substitutions in hostname
    for (const { pattern, target } of LOOKALIKE_PATTERNS) {
      if (pattern.test(hostname) && !hostname.includes(target)) {
        issues.push({
          type: 'lookalike',
          detail: `Domain resembles "${target}" but uses character substitutions`
        });
      }
    }

    // Check for 0/O, 1/l, rn/m substitutions
    const domainPart = hostname.split('.')[0];
    if (/rn/.test(domainPart)) {
      // Check if removing 'rn' → 'm' produces a common domain word
      const withM = domainPart.replace(/rn/g, 'm');
      const commonWords = ['amazon', 'gmail', 'microsoft', 'samsung', 'walmart'];
      for (const word of commonWords) {
        if (withM.includes(word) && !domainPart.includes(word)) {
          issues.push({
            type: 'lookalike',
            detail: `"rn" may be impersonating "m" — could be mimicking "${word}"`
          });
        }
      }
    }

    return issues;
  } catch {
    return [];
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!await isModuleEnabled('urlShield')) return;
  if (changeInfo.status !== 'complete' || !tab.url) return;
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  const issues = analyzeUrl(tab.url);
  if (issues.length === 0) return;

  // Check if user has excepted this URL
  const exceptResult = await chrome.storage.local.get('urlExceptions');
  const exceptions = exceptResult.urlExceptions || [];
  if (exceptions.includes(tab.url)) return;

  const description = issues.map(i => i.detail).join('; ');

  await fireNotification(
    'url-shield-' + tabId,
    '🔗 Suspicious URL Detected',
    description,
    'critical'
  );

  // Send to content script
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'urlWarning',
      url: tab.url,
      issues
    });
  } catch {
    // Content script might not be loaded yet
  }

  const stats = await getStats();
  await updateStats('urlShield', {
    blocked: (stats.urlShield.blocked || 0) + 1,
    flaggedUrls: [...(stats.urlShield.flaggedUrls || []).slice(-49), { url: tab.url, issues, timestamp: Date.now() }]
  });

  await addActivity('urlShield', '🔗', `Suspicious URL: ${tab.url.substring(0, 60)}...`);
});

// ---- MODULE 4: GHOST SCRIPT MONITOR (background handler) ----
// ---- MODULE 5: AI PRIVACY FILTER (background handler) ----
// ---- MESSAGE ROUTER ----

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.module) {
    // Handle non-module messages
    if (message.type === 'getSettings') {
      getSettings().then(sendResponse);
      return true;
    }
    if (message.type === 'saveSettings') {
      chrome.storage.local.set({ settings: message.settings }).then(() => {
        // Update clipboard alarm based on new settings
        setupAlarms();
        sendResponse({ success: true });
      });
      return true;
    }
    if (message.type === 'getStats') {
      getStats().then(sendResponse);
      return true;
    }
    if (message.type === 'getActivityLog') {
      chrome.storage.local.get('activityLog').then(r => sendResponse(r.activityLog || []));
      return true;
    }
    if (message.type === 'getExtensionData') {
      chrome.storage.local.get('extensionData').then(r => sendResponse(r.extensionData || {}));
      return true;
    }
    if (message.type === 'scanAll') {
      scanAllExtensions().then(() => sendResponse({ success: true }));
      return true;
    }
    if (message.type === 'clearHistory') {
      chrome.storage.local.set({
        activityLog: [],
        stats: { ...DEFAULT_STATS }
      }).then(() => {
        broadcastUpdate();
        sendResponse({ success: true });
      });
      return true;
    }
    if (message.type === 'exportLog') {
      chrome.storage.local.get(['activityLog', 'stats', 'extensionData']).then(sendResponse);
      return true;
    }
    if (message.type === 'addUrlException') {
      chrome.storage.local.get('urlExceptions').then(r => {
        const exceptions = r.urlExceptions || [];
        exceptions.push(message.url);
        chrome.storage.local.set({ urlExceptions: exceptions }).then(() => sendResponse({ success: true }));
      });
      return true;
    }
    if (message.type === 'toggleModule') {
      getSettings().then(async settings => {
        settings.modules[message.moduleName] = message.enabled;
        await chrome.storage.local.set({ settings });
        setupAlarms();
        sendResponse({ success: true });
      });
      return true;
    }
    return false;
  }

  // Module-specific messages
  (async () => {
    if (message.module === 'ghost' && message.type === 'detection') {
      if (!await isModuleEnabled('ghostMonitor')) return;

      const stats = await getStats();
      await updateStats('ghostMonitor', {
        detected: (stats.ghostMonitor.detected || 0) + 1
      });

      await fireNotification(
        'ghost-' + (sender.tab?.id || 'unknown'),
        '👻 Hidden Overlay Detected',
        `A hidden element was found on ${message.details?.url || 'a page'}: ${message.details?.tag || 'unknown'} element with opacity ${message.details?.opacity}`,
        'critical'
      );

      await addActivity('ghostMonitor', '👻', `Hidden overlay on ${(message.details?.url || '').substring(0, 50)}: ${message.details?.tag} (z-index: ${message.details?.zIndex})`);
      sendResponse({ success: true });
    }

    if (message.module === 'ai-privacy' && message.type === 'detection') {
      if (!await isModuleEnabled('aiPrivacyFilter')) return;

      const stats = await getStats();
      await updateStats('aiPrivacyFilter', {
        prevented: (stats.aiPrivacyFilter.prevented || 0) + 1
      });

      await fireNotification(
        'ai-pii-' + message.details?.piiType,
        '🤖 Sensitive Data Warning',
        `${message.details?.piiType || 'PII'} detected on ${message.details?.domain || 'an AI platform'}. Remove before sending!`,
        'critical'
      );

      await addActivity('aiPrivacyFilter', '🤖', `${message.details?.piiType} detected on ${message.details?.domain}`);
      sendResponse({ success: true });
    }
  })();

  return true;
});

// ---- ALARMS ----

async function setupAlarms() {
  await chrome.alarms.clearAll();

  // Daily extension scan
  chrome.alarms.create('daily-scan', { periodInMinutes: 1440 });

  // Clipboard sanitizer
  const settings = await getSettings();
  if (settings.modules.clipboardSanitizer) {
    const interval = settings.clipboardInterval || 60;
    if (interval > 0) {
      chrome.alarms.create('clipboard-sanitizer', { periodInMinutes: interval / 60 });
    }
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-scan') {
    await scanAllExtensions();
    await addActivity('extensionMonitor', '🔍', 'Daily extension scan completed');
  }

  if (alarm.name === 'clipboard-sanitizer') {
    await clearClipboard();
  }
});

// ---- INITIALIZATION ----

chrome.runtime.onInstalled.addListener(async (details) => {
  // Initialize default settings if not present
  const result = await chrome.storage.local.get('settings');
  if (!result.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  const statsResult = await chrome.storage.local.get('stats');
  if (!statsResult.stats) {
    await chrome.storage.local.set({ stats: { ...DEFAULT_STATS } });
  }

  await setupAlarms();
  await scanAllExtensions();

  if (details.reason === 'install') {
    await addActivity('extensionMonitor', '🛡️', 'ExtensionGuard v2.0 installed — 5 security modules active');
  } else if (details.reason === 'update') {
    await addActivity('extensionMonitor', '🛡️', `ExtensionGuard updated to v2.0`);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarms();
  await scanAllExtensions();
});
