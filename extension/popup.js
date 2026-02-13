document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('extensionList');
  const scanBtn = document.getElementById('scanBtn');
  const lastScanEl = document.getElementById('lastScan');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const notifToggle = document.getElementById('notifToggle');
  const totalEl = document.getElementById('totalCount');
  const safeEl = document.getElementById('safeCount');
  const warnEl = document.getElementById('warnCount');
  const dangerEl = document.getElementById('dangerCount');

  // Load settings
  const { notificationsEnabled = true } = await chrome.storage.local.get('notificationsEnabled');
  notifToggle.checked = notificationsEnabled;

  // Settings toggle
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
  });

  notifToggle.addEventListener('change', () => {
    chrome.storage.local.set({ notificationsEnabled: notifToggle.checked });
  });

  function timeAgo(ts) {
    if (!ts) return 'never';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  function renderResults(scanResults, lastScanTime) {
    const results = Object.values(scanResults || {});
    results.sort((a, b) => b.totalScore - a.totalScore);

    let safe = 0, warn = 0, danger = 0;
    for (const r of results) {
      if (['A', 'B'].includes(r.grade)) safe++;
      else if (r.grade === 'C') warn++;
      else danger++;
    }

    totalEl.textContent = results.length;
    safeEl.textContent = safe;
    warnEl.textContent = warn;
    dangerEl.textContent = danger;

    if (danger > 0) {
      document.getElementById('status').textContent = '⚠️ Issues Found';
      document.getElementById('status').style.color = '#f85149';
    } else {
      document.getElementById('status').textContent = 'Protected ✓';
      document.getElementById('status').style.color = '#2ea043';
    }

    lastScanEl.textContent = `Last scanned: ${timeAgo(lastScanTime)}`;

    if (results.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="emoji">✅</div>No extensions found to monitor</div>';
      return;
    }

    listEl.innerHTML = '';
    for (const ext of results) {
      const item = document.createElement('div');
      item.className = 'ext-item';

      const header = document.createElement('div');
      header.className = 'ext-header';
      header.innerHTML = `
        <span class="grade-badge grade-${ext.grade}">${ext.grade}</span>
        <span class="ext-name" title="${ext.name}">${ext.name}</span>
        <span class="ext-perms-count">${ext.permissionCount} perms</span>
      `;

      const details = document.createElement('div');
      details.className = 'ext-details';

      if (ext.permissions.length === 0) {
        details.innerHTML = '<div class="perm-item" style="border:none;color:#8b949e;">No special permissions requested</div>';
      } else {
        for (const p of ext.permissions) {
          const permEl = document.createElement('div');
          permEl.className = 'perm-item';
          permEl.innerHTML = `
            <span class="perm-level ${p.level}">${p.level}</span>
            <div class="perm-info">
              <div class="perm-name">${p.permission}</div>
              <div class="perm-explain">${p.explanation}</div>
            </div>
          `;
          details.appendChild(permEl);
        }
      }

      header.addEventListener('click', () => {
        details.classList.toggle('open');
      });

      item.appendChild(header);
      item.appendChild(details);
      listEl.appendChild(item);
    }
  }

  // Load existing results
  const data = await chrome.storage.local.get(['scanResults', 'lastScanTime']);
  renderResults(data.scanResults, data.lastScanTime);

  // Report a Problem link
  document.getElementById('reportLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/VMaroon95/ExtensionGuard/issues/new' });
  });

  // Scan button
  scanBtn.addEventListener('click', () => {
    scanBtn.classList.add('scanning');
    scanBtn.textContent = '⏳ Scanning...';
    chrome.runtime.sendMessage({ action: 'scanAll' }, (response) => {
      scanBtn.classList.remove('scanning');
      scanBtn.textContent = '🔍 Scan All Now';
      if (response && response.results) {
        renderResults(response.results, Date.now());
      }
    });
  });
});
