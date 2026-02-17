document.addEventListener('DOMContentLoaded', async () => {
  // ---- TAB NAVIGATION ----
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      // Load tab-specific data
      if (tab.dataset.tab === 'extensions') loadExtensions();
      if (tab.dataset.tab === 'activity') loadActivity();
    });
  });

  // ---- HELPERS ----
  function timeAgo(ts) {
    if (!ts || ts === 0) return 'never';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function gradeColor(grade) {
    switch (grade) {
      case 'A': return '#2ea043';
      case 'B': return '#3fb950';
      case 'C': return '#d29922';
      case 'D': return '#f85149';
      case 'F': return '#ff1a1a';
      default: return '#8b949e';
    }
  }

  // ---- PERMISSION EXPLANATIONS ----
  const PERM_EXPLAIN = {
    '<all_urls>': 'Can access ALL websites you visit',
    'http://*/*': 'Can access all HTTP websites',
    'https://*/*': 'Can access all HTTPS websites',
    'webRequest': 'Can intercept and monitor all network requests',
    'webRequestBlocking': 'Can block or modify network requests',
    'debugger': 'Full debugging access to browser internals',
    'proxy': 'Can route your traffic through a proxy',
    'tabs': 'Can see all your open tabs and their URLs',
    'history': 'Can read your entire browsing history',
    'cookies': 'Can read/modify cookies including login sessions',
    'bookmarks': 'Can read and modify your bookmarks',
    'downloads': 'Can manage your downloads',
    'clipboardRead': 'Can read your clipboard contents',
    'privacy': 'Can change browser privacy settings',
    'browsingData': 'Can delete your browsing data',
    'activeTab': 'Can access the current tab when you click the extension',
    'storage': 'Can store data locally',
    'contextMenus': 'Can add items to right-click menus',
    'identity': 'Can access your Google account identity',
    'webNavigation': 'Can monitor page navigation events',
    'scripting': 'Can inject scripts into web pages',
    'alarms': 'Can schedule background tasks',
    'idle': 'Can detect when you\'re idle',
    'notifications': 'Can show notifications',
    'management': 'Can manage other extensions',
    'topSites': 'Can see your most visited sites',
    'geolocation': 'Can access your location',
    'declarativeNetRequest': 'Can set rules to modify network requests'
  };

  function getPermExplanation(perm) {
    return PERM_EXPLAIN[perm] || `Permission: ${perm}`;
  }

  function getPermRiskClass(perm) {
    const CRITICAL = ['<all_urls>', 'http://*/*', 'https://*/*', 'webRequest', 'webRequestBlocking', 'debugger', 'proxy'];
    const HIGH = ['tabs', 'history', 'cookies', 'bookmarks', 'downloads', 'clipboardRead', 'privacy', 'browsingData'];
    const MEDIUM = ['activeTab', 'storage', 'contextMenus', 'identity', 'webNavigation', 'scripting'];
    if (CRITICAL.includes(perm)) return 'critical';
    if (HIGH.includes(perm)) return 'high';
    if (MEDIUM.includes(perm)) return 'medium';
    return 'low';
  }

  // ---- LOAD DASHBOARD ----
  async function loadDashboard() {
    const { stats, settings } = await chrome.storage.local.get(['stats', 'settings']);
    const s = stats || {};
    const extMon = s.extensionMonitor || {};
    const clip = s.clipboardSanitizer || {};
    const url = s.urlShield || {};
    const ghost = s.ghostMonitor || {};
    const ai = s.aiPrivacyFilter || {};

    document.getElementById('stat-monitored').textContent = extMon.monitored || 0;
    document.getElementById('stat-flagged').textContent = extMon.flagged || 0;
    document.getElementById('stat-clipboard').textContent = clip.todayCount || 0;
    document.getElementById('stat-urls').textContent = url.blocked || 0;
    document.getElementById('stat-ghost').textContent = ghost.detected || 0;
    document.getElementById('stat-pii').textContent = ai.prevented || 0;

    const lastScan = extMon.lastScan || 0;
    document.getElementById('lastScan').textContent = `Last scanned: ${timeAgo(lastScan)}`;

    // Status
    const statusEl = document.getElementById('status');
    const flagged = extMon.flagged || 0;
    if (flagged > 0) {
      statusEl.textContent = `⚠️ ${flagged} Issue${flagged > 1 ? 's' : ''} Found`;
      statusEl.className = 'status danger';
    } else if (lastScan > 0) {
      statusEl.textContent = 'Protected ✓';
      statusEl.className = 'status safe';
    } else {
      statusEl.textContent = 'Scanning...';
      statusEl.className = 'status pending';
    }

    // Module toggles
    const cfg = settings || {};
    const modules = cfg.modules || {};
    document.querySelectorAll('[data-module]').forEach(toggle => {
      const mod = toggle.dataset.module;
      toggle.checked = modules[mod] !== false;
    });

    // Notification level
    if (cfg.notifications) {
      document.getElementById('notifLevel').value = cfg.notifications;
    }
    if (cfg.clipboardInterval) {
      document.getElementById('clipboardTimer').value = cfg.clipboardInterval;
    }
  }

  // ---- LOAD EXTENSIONS LIST ----
  async function loadExtensions() {
    const { extensionData } = await chrome.storage.local.get('extensionData');
    const listEl = document.getElementById('extensionList');
    const exts = Object.values(extensionData || {});
    exts.sort((a, b) => {
      const order = { F: 0, D: 1, C: 2, B: 3, A: 4 };
      return (order[a.grade] || 5) - (order[b.grade] || 5);
    });

    let safe = 0, warn = 0, danger = 0;
    for (const e of exts) {
      if (['A', 'B'].includes(e.grade)) safe++;
      else if (e.grade === 'C') warn++;
      else danger++;
    }

    document.getElementById('totalCount').textContent = exts.length;
    document.getElementById('safeCount').textContent = safe;
    document.getElementById('warnCount').textContent = warn;
    document.getElementById('dangerCount').textContent = danger;

    if (exts.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No extensions scanned yet.<br>Click "Scan All Now" on the Dashboard.</div>';
      return;
    }

    listEl.innerHTML = '';
    for (const ext of exts) {
      const allPerms = [...(ext.permissions || []), ...(ext.hostPermissions || [])];

      const item = document.createElement('div');
      item.className = 'ext-item';

      const header = document.createElement('div');
      header.className = 'ext-header';
      header.innerHTML = `
        <span class="grade-badge" style="background:${gradeColor(ext.grade)}">${ext.grade}</span>
        <span class="ext-name" title="${ext.name}">${ext.name}</span>
        <span class="ext-meta">${allPerms.length} perms</span>
      `;

      const details = document.createElement('div');
      details.className = 'ext-details';

      if (allPerms.length === 0) {
        details.innerHTML = '<div class="perm-safe">✅ No special permissions — this extension is safe</div>';
      } else {
        for (const p of allPerms) {
          const riskClass = getPermRiskClass(p);
          const explain = getPermExplanation(p);
          details.innerHTML += `
            <div class="perm-row">
              <span class="perm-risk ${riskClass}">${riskClass.toUpperCase()}</span>
              <div class="perm-info">
                <div class="perm-name">${p}</div>
                <div class="perm-explain">${explain}</div>
              </div>
            </div>
          `;
        }
      }

      header.addEventListener('click', () => details.classList.toggle('open'));
      item.appendChild(header);
      item.appendChild(details);
      listEl.appendChild(item);
    }
  }

  // ---- LOAD ACTIVITY FEED ----
  async function loadActivity() {
    const feed = document.getElementById('activityFeed');
    const log = await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'getActivityLog' }, resolve);
    });

    if (!log || log.length === 0) {
      feed.innerHTML = '<div class="empty-state">No activity yet.<br>ExtensionGuard is monitoring silently.</div>';
      return;
    }

    feed.innerHTML = '';
    for (const entry of log.slice(0, 50)) {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <span class="activity-icon">${entry.icon}</span>
        <div class="activity-info">
          <div class="activity-desc">${entry.description}</div>
          <div class="activity-time">${timeAgo(entry.timestamp)}</div>
        </div>
      `;
      feed.appendChild(item);
    }
  }

  // ---- SCAN BUTTON ----
  const scanBtn = document.getElementById('scanBtn');
  scanBtn.addEventListener('click', () => {
    scanBtn.textContent = '⏳ Scanning...';
    scanBtn.disabled = true;
    chrome.runtime.sendMessage({ type: 'scanAll' }, () => {
      setTimeout(async () => {
        scanBtn.textContent = '🔍 Scan All Now';
        scanBtn.disabled = false;
        await loadDashboard();
        loadExtensions();
      }, 500);
    });
  });

  // ---- MODULE TOGGLES ----
  document.querySelectorAll('[data-module]').forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const { settings } = await chrome.storage.local.get('settings');
      const cfg = settings || { modules: {}, notifications: 'all', clipboardInterval: 60 };
      cfg.modules[toggle.dataset.module] = toggle.checked;
      chrome.runtime.sendMessage({ type: 'updateSettings', settings: cfg });
    });
  });

  // ---- SETTINGS ----
  document.getElementById('notifLevel').addEventListener('change', async (e) => {
    const { settings } = await chrome.storage.local.get('settings');
    const cfg = settings || { modules: {}, notifications: 'all', clipboardInterval: 60 };
    cfg.notifications = e.target.value;
    chrome.runtime.sendMessage({ type: 'updateSettings', settings: cfg });
  });

  document.getElementById('clipboardTimer').addEventListener('change', async (e) => {
    const { settings } = await chrome.storage.local.get('settings');
    const cfg = settings || { modules: {}, notifications: 'all', clipboardInterval: 60 };
    cfg.clipboardInterval = parseInt(e.target.value);
    chrome.runtime.sendMessage({ type: 'updateSettings', settings: cfg });
  });

  document.getElementById('exportBtn').addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'exportLog' }, (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extensionguard-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear all activity history and stats?')) {
      chrome.runtime.sendMessage({ type: 'clearHistory' }, () => loadDashboard());
    }
  });

  document.getElementById('reportLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/VMaroon95/ExtensionGuard/issues/new' });
  });

  document.getElementById('githubLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/VMaroon95/ExtensionGuard' });
  });

  // ---- LISTEN FOR LIVE UPDATES ----
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'statsUpdated') {
      loadDashboard();
    }
  });

  // ---- INITIAL LOAD ----
  await loadDashboard();
});
