// ============================================
// VISUAL URL SHIELD — Content Script Component
// ExtensionGuard Module 3 | Content Script
// ============================================

(function() {
  'use strict';

  let warningBanner = null;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== 'urlWarning') return;

    if (warningBanner) {
      warningBanner.remove();
      warningBanner = null;
    }

    const issues = message.issues || [];
    const issueText = issues.map(i => i.detail).join(' | ');

    const banner = document.createElement('div');
    banner.className = 'eg-warning-banner';
    banner.innerHTML = `
      <div class="eg-warning-banner-content">
        <div class="eg-warning-banner-icon">🔗</div>
        <div class="eg-warning-banner-text">
          <strong>⚠️ Warning: This URL contains suspicious characters that may be impersonating a legitimate website.</strong>
          <span class="eg-warning-banner-detail">${escapeHtml(issueText)}</span>
        </div>
        <div class="eg-warning-banner-actions">
          <button class="eg-dismiss-btn eg-btn-back" id="eg-url-goback">Go back to safety</button>
          <button class="eg-dismiss-btn eg-btn-proceed" id="eg-url-proceed">Proceed anyway</button>
        </div>
      </div>
    `;

    document.body.prepend(banner);
    document.body.style.marginTop = '60px';
    warningBanner = banner;

    const goBackBtn = document.getElementById('eg-url-goback');
    const proceedBtn = document.getElementById('eg-url-proceed');

    if (goBackBtn) {
      goBackBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        banner.remove();
        document.body.style.marginTop = '';
        warningBanner = null;

        // Store exception
        chrome.runtime.sendMessage({
          type: 'addUrlException',
          url: location.href
        }).catch(() => {});
      });
    }

    sendResponse({ success: true });
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
