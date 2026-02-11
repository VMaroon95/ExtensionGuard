const API_BASE = window.location.origin;

const $ = (id) => document.getElementById(id);

function toggleHelper() {
    $('helperContent').classList.toggle('hidden');
}

async function runAudit() {
    const input = $('searchInput').value.trim();
    if (!input) return;

    const btn = $('scanBtn');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Scanning...';

    $('error').classList.add('hidden');
    $('results').classList.add('hidden');

    try {
        const resp = await fetch(`${API_BASE}/api/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extension_id: input }),
        });

        const data = resp.ok ? await resp.json() : (await resp.json()).detail;

        if (!resp.ok || data.error) {
            showError(data.error || 'Something went wrong. Check the extension ID and try again.');
            return;
        }

        renderResults(data);
    } catch (e) {
        showError('Could not connect to the API. Make sure the backend is running.');
    } finally {
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'Scan';
    }
}

function showError(msg) {
    $('error').textContent = msg;
    $('error').classList.remove('hidden');
}

function renderResults(data) {
    $('extName').textContent = data.name;
    $('extDesc').textContent = data.description || '';
    $('extId').textContent = data.extension_id;

    // Grade
    const badge = $('gradeBadge');
    badge.className = 'grade-badge grade-' + data.safety_grade;
    $('gradeLetter').textContent = data.safety_grade;
    $('gradeLabel').textContent = data.safety_grade === 'A' ? 'Safe' :
        data.safety_grade === 'B' ? 'Good' :
        data.safety_grade === 'C' ? 'Moderate' :
        data.safety_grade === 'D' ? 'Risky' :
        data.safety_grade === 'E' ? 'Dangerous' : 'Critical';

    $('summaryText').textContent = data.summary;
    $('riskScore').textContent = data.total_risk_score;

    // Categories
    const icons = {
        'Data Access': '🔍',
        'Browser Control': '🌐',
        'Network Access': '📡',
        'System Access': '💻'
    };

    const grid = $('categoriesGrid');
    grid.innerHTML = '';
    for (const [name, info] of Object.entries(data.categories)) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="cat-icon">${icons[name] || '📦'}</div>
            <div class="cat-name">${name}</div>
            <div class="cat-count">${info.count}</div>
            <div class="cat-risk risk-${info.max_risk}">${info.count ? info.max_risk : 'none'}</div>
        `;
        grid.appendChild(card);
    }

    // Permissions
    const list = $('permissionsList');
    list.innerHTML = '';
    const noPerms = $('noPermissions');

    if (data.permissions.length === 0) {
        noPerms.classList.remove('hidden');
        list.classList.add('hidden');
    } else {
        noPerms.classList.add('hidden');
        list.classList.remove('hidden');
        for (const p of data.permissions) {
            const item = document.createElement('div');
            item.className = 'perm-item';
            item.innerHTML = `
                <div class="perm-header">
                    <span class="perm-name">${p.name}</span>
                    <span class="risk-tag risk-${p.risk_level}">${p.risk_level}</span>
                </div>
                <div class="perm-desc">${p.description}</div>
                <div class="perm-explain">${p.explanation}</div>
            `;
            list.appendChild(item);
        }
    }

    $('results').classList.remove('hidden');
}

// Enter key support
$('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runAudit();
});
