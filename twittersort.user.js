// ==UserScript==
// @name         TwitterSort — Sort Replies by Likes
// @namespace    https://github.com/YOUR_USERNAME/twittersort
// @version      3.1
// @description  Automatically sorts Twitter/X replies by Likes instead of Relevant
// @author       YOUR_USERNAME
// @homepageURL  https://github.com/YOUR_USERNAME/twittersort
// @supportURL   https://github.com/YOUR_USERNAME/twittersort/issues
// @updateURL    https://raw.githubusercontent.com/YOUR_USERNAME/twittersort/main/twittersort.user.js
// @downloadURL  https://raw.githubusercontent.com/YOUR_USERNAME/twittersort/main/twittersort.user.js
// @match        https://twitter.com/*
// @match        https://x.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = false;
  const log = (...a) => DEBUG && console.log('[TwitterSort]', ...a);

  const STATUS_PATH = /^\/[^/]+\/status\/\d+/;

  const hasParam = (search) =>
    new URLSearchParams(search).get('sort_replies') === 'likes';

  function withParam(urlStr) {
    try {
      const u = new URL(urlStr, location.origin);
      if (u.origin !== location.origin) return null;
      if (!STATUS_PATH.test(u.pathname)) return null;
      if (u.searchParams.get('sort_replies') === 'likes') return null;
      u.searchParams.set('sort_replies', 'likes');
      return u.toString();
    } catch (e) {
      return null;
    }
  }

  // ── 1) Hard loads: fix URL before the app boots (no reload) ───
  const fixedNow = withParam(location.href);
  if (fixedNow) {
    history.replaceState(history.state, '', fixedNow);
    log('added param before app boot:', fixedNow);
  }

  // ── 2) In-app navigation: rewrite tweet links at click time ───
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      const fixedHref = withParam(a.href);
      if (fixedHref) {
        a.href = fixedHref;
        log('rewrote link before navigation:', fixedHref);
      }
    },
    true
  );

  // ── Back-button fix ───────────────────────────────────────────
  // The dropdown fallback makes X push a NEW history entry with the
  // param, leaving a paramless duplicate underneath. When "back" lands
  // on that duplicate (same status path we were just on, param gone),
  // skip past it with another history.back().
  let trackedPath = location.pathname;
  let suppressFallbackUntil = 0;
  let consecutiveSkips = 0;

  window.addEventListener('popstate', () => {
    const cameFrom = trackedPath;
    suppressFallbackUntil = Date.now() + 1200;

    const landedOnDuplicate =
      STATUS_PATH.test(location.pathname) &&
      location.pathname === cameFrom &&
      !hasParam(location.search);

    if (landedOnDuplicate && consecutiveSkips < 5) {
      consecutiveSkips++;
      log('back landed on duplicate history entry, skipping past it');
      trackedPath = location.pathname;
      history.back();
      return;
    }

    consecutiveSkips = 0;
    trackedPath = location.pathname;
  });

  // ── 3) Fallback: dropdown clicker ─────────────────────────────
  let busy = false;

  function findSortButton() {
    const candidates = document.querySelectorAll(
      '[aria-haspopup="menu"], [role="button"]'
    );
    for (const el of candidates) {
      if (el.textContent.trim() === 'Relevant') return el;
    }
    return null;
  }

  function waitFor(fn, timeout = 2000, interval = 50) {
    return new Promise((resolve) => {
      const start = Date.now();
      const iv = setInterval(() => {
        const r = fn();
        if (r || Date.now() - start > timeout) {
          clearInterval(iv);
          resolve(r || null);
        }
      }, interval);
    });
  }

  setInterval(async () => {
    // keep "where were we" fresh for the popstate handler
    if (location.pathname !== trackedPath && Date.now() > suppressFallbackUntil) {
      trackedPath = location.pathname;
    }

    if (busy) return;
    if (Date.now() < suppressFallbackUntil) return;
    if (!STATUS_PATH.test(location.pathname)) return;

    const btn = findSortButton();
    if (!btn) return;

    busy = true;
    log('fallback: page loaded as Relevant, switching via dropdown');
    btn.click();

    const menu = await waitFor(() => document.querySelector('[role="menu"]'));
    if (menu) {
      const items = [...menu.querySelectorAll('[role="menuitem"]')];
      let target = items.find((it) => /\blikes\b/i.test(it.textContent));
      if (!target && items.length >= 3) target = items[items.length - 1];
      if (target) {
        target.click();
        log('fallback: clicked Likes');
      } else {
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );
      }
    }

    setTimeout(() => { busy = false; }, 1500);
  }, 300);

  log('loaded');
})();