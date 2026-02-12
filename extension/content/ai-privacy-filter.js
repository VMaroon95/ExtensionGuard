// ============================================
// AI PRIVACY FILTER — PII & API Key Scanner
// ExtensionGuard Module 5 | Content Script
// ============================================

(function() {
  'use strict';

  const AI_DOMAINS = [
    'chat.openai.com', 'chatgpt.com', 'claude.ai', 'gemini.google.com',
    'bard.google.com', 'copilot.microsoft.com', 'perplexity.ai',
    'poe.com', 'huggingface.co', 'you.com', 'pi.ai'
  ];

  // Only activate on AI domains
  const hostname = location.hostname;
  const isAIDomain = AI_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  if (!isAIDomain) return;

  const PII_PATTERNS = [
    { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    { name: 'Credit Card', regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, validate: luhnCheck },
    { name: 'Email', regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/g },
    { name: 'Phone', regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
    { name: 'AWS Key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: 'OpenAI Key', regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
    { name: 'GitHub Token', regex: /\b(?:ghp|gho|ghs|ghr)_[A-Za-z0-9]{36,}\b/g },
    { name: 'Stripe Key', regex: /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,}\b/g },
    { name: 'Google API Key', regex: /\bAIza[A-Za-z0-9\-_]{35}\b/g },
    { name: 'Slack Token', regex: /\bxox[bpras]-[A-Za-z0-9\-]{10,}\b/g },
    { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g },
    { name: 'JWT Token', regex: /\beyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/=]+\b/g },
    { name: 'Private IP', regex: /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g },
    { name: 'Password', regex: /(?:password|passwd|pwd|secret)\s*[=:]\s*\S+/gi }
  ];

  function luhnCheck(num) {
    const digits = num.replace(/[\s-]/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function scanText(text) {
    const detections = [];
    for (const pattern of PII_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        if (pattern.validate && !pattern.validate(match[0])) continue;
        detections.push({
          piiType: pattern.name,
          index: match.index,
          length: match[0].length
        });
      }
    }
    return detections;
  }

  let debounceTimer = null;
  let activeTooltip = null;
  const alertedFields = new WeakMap();

  function removeTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  function showTooltip(el, detections) {
    removeTooltip();

    const types = [...new Set(detections.map(d => d.piiType))].join(', ');
    const tooltip = document.createElement('div');
    tooltip.className = 'eg-pii-tooltip';
    tooltip.textContent = `⚠️ Sensitive data detected: ${types}. Remove before sending?`;

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    // Position near the element
    const rect = el.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.top = Math.max(0, rect.top - 40) + 'px';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.zIndex = '2147483646';

    // Auto-dismiss after 5 seconds
    setTimeout(removeTooltip, 5000);
  }

  function handleInput(e) {
    const el = e.target;
    if (!el) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const text = el.value || el.textContent || el.innerText || '';
      if (!text || text.length < 5) return;

      const detections = scanText(text);
      if (detections.length === 0) {
        el.classList.remove('eg-pii-highlight');
        removeTooltip();
        return;
      }

      // Avoid re-alerting for the same types on the same field
      const prevTypes = alertedFields.get(el) || new Set();
      const newTypes = detections.filter(d => !prevTypes.has(d.piiType));

      if (newTypes.length > 0) {
        el.classList.add('eg-pii-highlight');

        requestAnimationFrame(() => {
          showTooltip(el, detections);
        });

        // Report to background (only new types)
        for (const det of newTypes) {
          chrome.runtime.sendMessage({
            module: 'ai-privacy',
            type: 'detection',
            details: {
              piiType: det.piiType,
              domain: hostname,
              timestamp: Date.now()
            }
          }).catch(() => {});

          prevTypes.add(det.piiType);
        }
        alertedFields.set(el, prevTypes);
      }
    }, 300);
  }

  function attachListeners(el) {
    if (el.dataset.egPrivacyMonitored) return;
    el.dataset.egPrivacyMonitored = 'true';
    el.addEventListener('input', handleInput, { passive: true });
  }

  function scanForInputs() {
    const selectors = 'textarea, input[type="text"], input:not([type]), [contenteditable="true"], [role="textbox"]';
    const elements = document.querySelectorAll(selectors);
    for (const el of elements) {
      attachListeners(el);
    }
  }

  // Initial scan
  scanForInputs();

  // Watch for dynamically added inputs (SPAs)
  const observer = new MutationObserver(() => {
    scanForInputs();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Cleanup
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
    removeTooltip();
  });
})();
