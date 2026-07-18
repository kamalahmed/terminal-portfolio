/* ==========================================================================
   TYPED STRIP
   ==========================================================================
   The self-typing line in the terminal bar under the hero.

   Edit the strings in js/config.js → TYPED_LINES.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.typed = (function () {
  'use strict';

  const { $, prefersReducedMotion } = window.TP.utils;

  let timer = null;

  function init() {
    const node = $('#typed');
    if (!node) return;

    const cfg = window.TP.config;
    const lines = cfg.TYPED_LINES;
    if (!lines || !lines.length) return;

    // Reduced motion: show the first line statically instead of animating.
    if (prefersReducedMotion()) {
      node.textContent = lines[0];
      return;
    }

    let lineIndex = 0;
    let pos = 0;
    let erasing = false;

    function step() {
      const line = lines[lineIndex];

      if (!erasing) {
        pos++;
        if (pos > line.length) {
          // Fully typed — hold, then start erasing.
          erasing = true;
          node.textContent = line;
          timer = setTimeout(step, cfg.HOLD_MS);
          return;
        }
      } else {
        pos--;
        if (pos <= 0) {
          // Fully erased — advance to the next line.
          erasing = false;
          lineIndex = (lineIndex + 1) % lines.length;
          node.textContent = '';
          timer = setTimeout(step, 420);
          return;
        }
      }

      node.textContent = line.slice(0, pos);
      timer = setTimeout(step, erasing ? cfg.ERASE_SPEED : cfg.TYPE_SPEED);
    }

    timer = setTimeout(step, 500);

    // Don't keep typing into a tab nobody is looking at.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(timer);
      } else {
        clearTimeout(timer);
        timer = setTimeout(step, 400);
      }
    });
  }

  return { init };
})();
