/* ==========================================================================
   UTILS
   ==========================================================================
   Small shared helpers. Loaded before every other module.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.utils = (function () {
  'use strict';

  /* ---- DOM selection ---------------------------------------------------- */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /**
   * Create an element.
   *
   *   el('div', { class: 'card', onClick: fn }, 'text', childNode)
   *
   * Attribute handling:
   *   class      -> className
   *   html       -> innerHTML (only ever called with our own markup)
   *   dataset    -> object of data-* values
   *   on<Event>  -> addEventListener, e.g. onClick, onPointerdown
   *   anything else -> setAttribute (skipped when null/undefined)
   */
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    const a = attrs || {};

    for (const key in a) {
      const val = a[key];
      if (val == null) continue;

      if (key === 'class') {
        node.className = val;
      } else if (key === 'html') {
        node.innerHTML = val;
      } else if (key === 'dataset') {
        for (const d in val) node.dataset[d] = val[d];
      } else if (key.startsWith('on') && typeof val === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), val);
      } else {
        node.setAttribute(key, val);
      }
    }

    children.flat().forEach(child => {
      if (child == null || child === false) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });

    return node;
  }

  /** Escape text before it goes anywhere near innerHTML. */
  const esc = str => String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  /** Read a live CSS custom property value (used by the canvas games). */
  const cssVar = name =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /** True when the visitor has asked their OS to reduce motion. */
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** True on touch-primary devices — used to swap hints and skip hover logic. */
  const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

  /* ---- Project helpers -------------------------------------------------- */

  /** Colour for a language dot, falling back to a neutral tone. */
  const langColor = lang => (window.TP.LANG_COLOR || {})[lang] || 'var(--dim2)';

  /** Star label, or '' when a project has no stars or hasn't loaded yet. */
  const starLabel = p => (typeof p.stars === 'number' && p.stars > 0) ? '★ ' + p.stars : '';

  /** Glyph shown beside a project in terminal listings. */
  const glyph = p => p.type === 'app' ? '◈' : p.type === 'plugin' ? '⧉' : '≡';

  /* ---- Storage ----------------------------------------------------------
     localStorage throws in Safari private mode and when cookies are blocked,
     so every access is guarded. Failing to persist a preference should never
     break the page.
     ---------------------------------------------------------------------- */
  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
    }
  };

  /** Same guarding, for the short-lived API response cache. */
  const session = {
    get(key) {
      try { return sessionStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { sessionStorage.setItem(key, value); return true; } catch (e) { return false; }
    }
  };

  /**
   * Fetch JSON with a timeout, returning null instead of throwing.
   * Every network call in this project is decorative — the page must render
   * completely even with no connection at all.
   */
  async function fetchJSON(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Trailing debounce — used for resize handlers. */
  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** Clamp a number into a range. */
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /**
   * Deterministic pseudo-random generator (a linear congruential generator).
   * Given the same seed it always produces the same sequence, so decorative
   * details like the badge barcode look identical on every page load.
   */
  function seeded(seed) {
    let s = seed;
    return function next() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  return {
    $, $$, el, esc, cssVar,
    prefersReducedMotion, isTouch,
    langColor, starLabel, glyph,
    store, session, fetchJSON, debounce, clamp, seeded
  };
})();
