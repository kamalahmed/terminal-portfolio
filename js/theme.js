/* ==========================================================================
   THEME
   ==========================================================================
   Dark/light toggle. Flips `data-theme` on <html>; all colour values resolve
   from there (see css/01-variables.css), so nothing else needs to change.

   The switch is animated with the View Transitions API: a circular wipe that
   expands from the button. Browsers without support just swap instantly, and
   so does anyone who has "reduce motion" enabled.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.theme = (function () {
  'use strict';

  const { $, store, prefersReducedMotion } = window.TP.utils;
  const KEY = window.TP.config.storage.theme;

  /**
   * Apply the saved theme, defaulting to dark.
   *
   * Deliberately NOT following prefers-color-scheme: this design is dark-first
   * (the terminal aesthetic, the meta theme-color, the accent palette all
   * assume it), so a visitor on a light-mode OS should still get the intended
   * look until they choose otherwise. Their choice is then remembered.
   */
  function init() {
    document.documentElement.dataset.theme = store.get(KEY) || 'dark';

    syncLabel();

    const btn = $('#themeBtn');
    if (btn) btn.addEventListener('click', toggle);
  }

  function apply() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    store.set(KEY, next);
    syncLabel();
  }

  function toggle() {
    // No View Transitions support, or the visitor prefers less motion: swap now.
    if (!document.startViewTransition || prefersReducedMotion()) {
      apply();
      return;
    }

    // Expand the wipe from the centre of the toggle button.
    const btn = $('#themeBtn');
    const rect = btn
      ? btn.getBoundingClientRect()
      : { left: window.innerWidth - 40, top: 30, width: 0, height: 0 };

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Radius needed to cover the furthest corner of the viewport.
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(apply);

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 560,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    }).catch(() => { /* transition cancelled — the theme still applied */ });
  }

  /** Button shows the theme you'd switch TO, not the one you're in. */
  function syncLabel() {
    const btn = $('#themeBtn');
    if (!btn) return;
    const isLight = document.documentElement.dataset.theme === 'light';
    btn.textContent = isLight ? '☾ dark' : '☀ light';
    btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  }

  return { init, toggle };
})();
