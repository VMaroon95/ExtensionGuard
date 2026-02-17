// ============================================
// GHOST SCRIPT MONITOR — UI Redressing Detection
// ExtensionGuard Module 4 | Content Script
// ============================================

(function() {
  'use strict';

  const SCAN_DEBOUNCE = 500;
  const reported = new WeakSet();
  let bannerInjected = false;
  let observer = null;
  let scanTimeout = null;

  function isGhostElement(el) {
    if (reported.has(el)) return null;

    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    // Skip tiny elements (tracking pixels, spacers)
    if (rect.width < 100 || rect.height < 50) return null;

    // Skip elements that are part of ExtensionGuard
    if (el.classList.contains('eg-warning-banner') ||
        el.classList.contains('eg-ghost-warning') ||
        el.closest('.eg-warning-banner') ||
        el.closest('.eg-ghost-warning')) return null;

    const opacity = parseFloat(style.opacity);
    const zIndex = parseInt(style.zIndex, 10) || 0;
    const position = style.position;
    const pointerEvents = style.pointerEvents;

    const issues = [];

    // Check 1: Invisible or near-invisible
    if (opacity === 0 || opacity < 0.1) {
      issues.push(`opacity: ${opacity}`);
    }

    // Check 2: Extremely high z-index
    if (zIndex > 9999) {
      issues.push(`z-index: ${zIndex}`);
    }

    // Check 3: Position fixed/absolute with high z-index covering viewport
    if ((position === 'fixed' || position === 'absolute') && zIndex > 999) {
      const viewportCoverage = (rect.width * rect.height) / (window.innerWidth * window.innerHeight);
      if (viewportCoverage > 0.3) {
        issues.push(`covers ${Math.round(viewportCoverage * 100)}% of viewport`);
      }
    }

    // Check 4: Transparent clickjacking iframe
    if (el.tagName === 'IFRAME' && opacity < 0.2 && zIndex > 0) {
      issues.push('transparent iframe overlay');
    }

    // Check 5: pointer-events none on a covering element (used to pass clicks through)
    if (pointerEvents === 'none' && (position === 'fixed' || position === 'absolute') && zIndex > 100) {
      const viewportCoverage = (rect.width * rect.height) / (window.innerWidth * window.innerHeight);
      if (viewportCoverage > 0.2) {
        issues.push('pointer-events:none overlay');
      }
    }

    // Must have suspicious opacity/transparency AND positioning to be a ghost
    const hasVisibilityIssue = opacity < 0.1;
    const hasPositionIssue = zIndex > 999 || issues.some(i => i.includes('viewport') || i.includes('iframe') || i.includes('overlay'));

    if (issues.length >= 2 || (hasVisibilityIssue && hasPositionIssue)) {
      return {
        tag: el.tagName.toLowerCase(),
        classes: el.className?.toString().substring(0, 100) || '',
        id: el.id || '',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        zIndex,
        opacity,
        position,
        pointerEvents,
        issues,
        url: location.href
      };
    }

    return null;
  }

  function markGhostElement(el) {
    el.style.outline = '3px solid red';
    el.style.outlineOffset = '-3px';
    el.setAttribute('data-eg-ghost', 'detected');
  }

  function injectWarningBanner() {
    if (bannerInjected) return;
    bannerInjected = true;

    const banner = document.createElement('div');
    banner.className = 'eg-ghost-warning';
    banner.innerHTML = `
      <span class="eg-ghost-warning-text">⚠️ ExtensionGuard detected a hidden overlay on this page. This could be a clickjacking attempt.</span>
      <button class="eg-dismiss-btn" id="eg-ghost-dismiss">Dismiss</button>
    `;
    document.body.prepend(banner);

    const dismissBtn = document.getElementById('eg-ghost-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        banner.remove();
        bannerInjected = false;
      });
    }
  }

  function scanElement(el) {
    if (!(el instanceof HTMLElement)) return;

    const detection = isGhostElement(el);
    if (detection) {
      reported.add(el);
      markGhostElement(el);
      injectWarningBanner();

      chrome.runtime.sendMessage({
        module: 'ghost',
        type: 'detection',
        details: detection
      }).catch(() => {});
    }
  }

  function scanAllElements() {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      scanElement(el);
    }
  }

  function debouncedScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
      scanAllElements();
    }, SCAN_DEBOUNCE);
  }

  function init() {
    // Initial scan using requestIdleCallback for non-blocking
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => scanAllElements());
    } else {
      setTimeout(scanAllElements, 0);
    }

    // Watch for new elements
    observer = new MutationObserver((mutations) => {
      let hasNewNodes = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hasNewNodes = true;
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              scanElement(node);
              // Also scan children
              const children = node.querySelectorAll('*');
              for (const child of children) {
                scanElement(child);
              }
            }
          }
        }
      }
      if (hasNewNodes) {
        debouncedScan();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }
  });

  // Start
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
