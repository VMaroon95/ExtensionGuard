// ============================================
// MODULE 6: DEEP SCAN — FORENSIC EXTENSION AUDITOR
// Behavioral analysis beyond permissions
// ============================================

(() => {
  // Secret/credential patterns to detect in page context
  const SECRET_PATTERNS = [
    { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g },
    { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{48}/g },
    { name: 'Slack Token', pattern: /xox[bpas]-[a-zA-Z0-9\-]+/g },
    { name: 'Generic API Key', pattern: /(?:api[_-]?key|apikey|api_secret)\s*[:=]\s*['"]?([a-zA-Z0-9\-_]{20,})['"]?/gi },
    { name: 'Bearer Token', pattern: /bearer\s+[a-zA-Z0-9\-._~+\/]+=*/gi },
    { name: 'Private Key', pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g },
    { name: 'Connection String', pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+/gi },
  ];

  // Detect if any extension is injecting external scripts
  function detectExternalScriptInjection() {
    const scripts = document.querySelectorAll('script[src]');
    const suspicious = [];

    scripts.forEach(script => {
      const src = script.src;
      // Flag scripts from unusual/dynamic domains
      if (src && !src.startsWith(window.location.origin)) {
        const url = new URL(src);
        const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.buzz'];
        const hasSuspiciousTLD = suspiciousTLDs.some(tld => url.hostname.endsWith(tld));
        const hasIPAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname);
        const hasBase64Path = /[A-Za-z0-9+\/]{40,}={0,2}/.test(url.pathname);

        if (hasSuspiciousTLD || hasIPAddress || hasBase64Path) {
          suspicious.push({
            src,
            reason: hasSuspiciousTLD ? 'Suspicious TLD' :
                    hasIPAddress ? 'IP-based host' : 'Obfuscated path',
          });
        }
      }
    });

    return suspicious;
  }

  // Detect data exfiltration patterns (image pixel beacons, hidden iframes)
  function detectExfiltration() {
    const findings = [];

    // 1x1 tracking pixels
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      if ((img.width <= 1 && img.height <= 1) || 
          (img.naturalWidth <= 1 && img.naturalHeight <= 1)) {
        if (img.src && !img.src.startsWith('data:')) {
          findings.push({
            type: 'tracking_pixel',
            element: 'img',
            src: img.src,
          });
        }
      }
    });

    // Hidden iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const style = window.getComputedStyle(iframe);
      const isHidden = style.display === 'none' ||
                       style.visibility === 'hidden' ||
                       (parseInt(style.width) <= 1 && parseInt(style.height) <= 1) ||
                       parseFloat(style.opacity) === 0;

      if (isHidden && iframe.src && !iframe.src.startsWith('about:')) {
        findings.push({
          type: 'hidden_iframe',
          element: 'iframe',
          src: iframe.src,
        });
      }
    });

    return findings;
  }

  // Scan visible page content for exposed secrets
  function detectExposedSecrets() {
    const text = document.body?.innerText || '';
    const findings = [];

    for (const { name, pattern } of SECRET_PATTERNS) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches) {
        findings.push({
          type: 'exposed_secret',
          secretType: name,
          count: matches.length,
          // Only include redacted preview
          preview: matches[0].substring(0, 8) + '***REDACTED***',
        });
      }
    }

    return findings;
  }

  // Listen for deep scan request from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'deepScan') {
      const results = {
        url: window.location.href,
        timestamp: Date.now(),
        externalScripts: detectExternalScriptInjection(),
        exfiltration: detectExfiltration(),
        exposedSecrets: detectExposedSecrets(),
      };

      results.totalFindings = results.externalScripts.length +
                               results.exfiltration.length +
                               results.exposedSecrets.length;

      sendResponse(results);
    }
  });
})();
