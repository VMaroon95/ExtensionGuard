// ExtensionGuard v2 — Background Service Worker

const PERMISSION_RISK = {
  // CRITICAL (10 points)
  '<all_urls>': 10, 'http://*/*': 10, 'https://*/*': 10,
  'webRequest': 10, 'webRequestBlocking': 10, 'debugger': 10, 'proxy': 10,
  // HIGH (7 points)
  'tabs': 7, 'history': 7, 'cookies': 7, 'bookmarks': 7,
  'downloads': 7, 'clipboardRead': 7, 'privacy': 7, 'browsingData': 7,
  // MEDIUM (4 points)
  'activeTab': 4, 'storage': 4, 'contextMenus': 4, 'identity': 4,
  'webNavigation': 4, 'scripting': 4,
  // LOW (1 point)
  'alarms': 1, 'idle': 1, 'power': 1, 'fontSettings': 1, 'notifications': 1
};

const PERMISSIONS_EXPLAINED = {
  '<all_urls>': 'Can access and modify ALL websites you visit',
  'http://*/*': 'Can access and modify all HTTP websites',
  'https://*/*': 'Can access and modify all HTTPS websites',
  'webRequest': 'Can intercept and observe all network requests',
  'webRequestBlocking': 'Can block or modify network requests before they complete',
  'debugger': 'Can attach a debugger to any tab — full control over page content',
  'proxy': 'Can route your traffic through any proxy server',
  'tabs': 'Can see every tab you have open, including URLs and titles',
  'history': 'Can read and delete your entire browsing history',
  'cookies': 'Can read and modify cookies on websites, including login sessions',
  'bookmarks': 'Can read, create, and delete all your bookmarks',
  'downloads': 'Can manage downloads and access downloaded files',
  'clipboardRead': 'Can read the contents of your clipboard',
  'privacy': 'Can change browser privacy settings',
  'browsingData': 'Can delete browsing data like history, cookies, and cache',
  'activeTab': 'Can access the currently active tab when you click the extension',
  'storage': 'Can store data locally in the browser',
  'contextMenus': 'Can add items to your right-click menu',
  'identity': 'Can access your browser sign-in identity',
  'webNavigation': 'Can monitor when you navigate between pages',
  'scripting': 'Can inject and run scripts on web pages',
  'alarms': 'Can schedule periodic background tasks',
  'idle': 'Can detect when you are idle',
  'power': 'Can manage system power settings',
  'fontSettings': 'Can access font settings',
  'notifications': 'Can show desktop notifications'
};

function getRiskLevel(permission) {
  const score = PERMISSION_RISK[permission] || 0;
  if (score >= 10) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  if (score >= 1) return 'low';
  return 'none';
}

function calculateGrade(score) {
  if (score <= 5) return 'A';
  if (score <= 15) return 'B';
  if (score <= 30) return 'C';
  if (score <= 50) return 'D';
  return 'F';
}

function analyzeExtension(extInfo) {
  const permissions = [
    ...(extInfo.permissions || []),
    ...(extInfo.hostPermissions || [])
  ];

  let totalScore = 0;
  const permissionDetails = [];

  for (const perm of permissions) {
    const score = PERMISSION_RISK[perm] || 0;
    totalScore += score;
    permissionDetails.push({
      permission: perm,
      score,
      level: getRiskLevel(perm),
      explanation: PERMISSIONS_EXPLAINED[perm] || `Requests "${perm}" permission`
    });
  }

  permissionDetails.sort((a, b) => b.score - a.score);

  const grade = calculateGrade(totalScore);

  return {
    id: extInfo.id,
    name: extInfo.name,
    version: extInfo.version,
    enabled: extInfo.enabled,
    type: extInfo.type,
    totalScore,
    grade,
    permissions: permissionDetails,
    permissionCount: permissions.length,
    scannedAt: Date.now()
  };
}

async function scanExtension(extInfo) {
  if (extInfo.id === chrome.runtime.id) return null; // skip self
  if (extInfo.type === 'theme') return null;

  const result = analyzeExtension(extInfo);
  return result;
}

async function scanAllExtensions() {
  const extensions = await chrome.management.getAll();
  const results = {};

  for (const ext of extensions) {
    const result = await scanExtension(ext);
    if (result) results[ext.id] = result;
  }

  await chrome.storage.local.set({
    scanResults: results,
    lastScanTime: Date.now()
  });

  return results;
}

async function handleExtensionEvent(extInfo) {
  const result = await scanExtension(extInfo);
  if (!result) return;

  const { scanResults = {} } = await chrome.storage.local.get('scanResults');
  const oldResult = scanResults[extInfo.id];
  scanResults[extInfo.id] = result;
  await chrome.storage.local.set({ scanResults, lastScanTime: Date.now() });

  const { notificationsEnabled = true } = await chrome.storage.local.get('notificationsEnabled');
  if (!notificationsEnabled) return;

  const shouldAlert = ['C', 'D', 'F'].includes(result.grade);
  const gotWorse = oldResult && result.totalScore > oldResult.totalScore;

  if (shouldAlert || gotWorse) {
    const topPerms = result.permissions
      .filter(p => p.score >= 7)
      .slice(0, 3)
      .map(p => `⚠️ ${p.explanation}`)
      .join('\n');

    const gradeEmoji = { C: '⚠️', D: '🚨', F: '🔴' }[result.grade] || '⚠️';

    chrome.notifications.create(`eg-${extInfo.id}-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `${gradeEmoji} ExtensionGuard Alert — Grade ${result.grade}`,
      message: `"${result.name}" has risky permissions:\n${topPerms || 'Multiple medium-risk permissions detected'}`,
      priority: result.grade === 'F' ? 2 : result.grade === 'D' ? 2 : 1,
      requireInteraction: ['D', 'F'].includes(result.grade)
    });
  }
}

// Event listeners
chrome.management.onInstalled.addListener(handleExtensionEvent);
chrome.management.onEnabled.addListener(handleExtensionEvent);

// Daily re-scan alarm
chrome.alarms.create('dailyScan', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyScan') {
    const oldResults = (await chrome.storage.local.get('scanResults')).scanResults || {};
    const newResults = await scanAllExtensions();

    const { notificationsEnabled = true } = await chrome.storage.local.get('notificationsEnabled');
    if (!notificationsEnabled) return;

    for (const [id, newResult] of Object.entries(newResults)) {
      const old = oldResults[id];
      if (old && newResult.totalScore > old.totalScore && ['C', 'D', 'F'].includes(newResult.grade)) {
        chrome.notifications.create(`eg-rescan-${id}-${Date.now()}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: `🔄 ExtensionGuard — "${newResult.name}" risk increased`,
          message: `Grade changed: ${old.grade} → ${newResult.grade}. Review recommended.`,
          priority: 2,
          requireInteraction: ['D', 'F'].includes(newResult.grade)
        });
      }
    }
  }
});

// Initial scan on install
chrome.runtime.onInstalled.addListener(() => {
  scanAllExtensions();
});

// Message handler for popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'scanAll') {
    scanAllExtensions().then(results => sendResponse({ results }));
    return true;
  }
  if (msg.action === 'getPermissionsExplained') {
    sendResponse({ PERMISSIONS_EXPLAINED });
    return true;
  }
});
