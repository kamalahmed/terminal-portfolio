/* ==========================================================================
   MAIN
   ==========================================================================
   Boots every module. Loaded last (see the script order in index.html).

   Each module is initialised inside its own try/catch: if one of them throws
   — a missing element, a browser without some API — the rest of the page
   still works. A portfolio should never go blank because one widget failed.
   ========================================================================== */

(function () {
  'use strict';

  const TP = window.TP;

  /**
   * Run a module's init, logging rather than throwing on failure.
   * @param {string} name   label used in the console warning
   * @param {Function} fn   the init function
   */
  function boot(name, fn) {
    if (typeof fn !== 'function') return;
    try {
      fn();
    } catch (err) {
      // Warn, don't crash — the next module still gets its turn.
      console.warn(`[portfolio] ${name} failed to start:`, err);
    }
  }

  function start() {
    /* ---- Chrome and preferences ---- */
    boot('theme', TP.theme && TP.theme.init);
    boot('audio', TP.audio && TP.audio.init);
    boot('nav', TP.nav && TP.nav.init);

    /* ---- Hero ---- */
    boot('badge', TP.badge && TP.badge.init);
    boot('typed', TP.typed && TP.typed.init);

    /* ---- Content sections ---- */
    boot('activity', TP.activity && TP.activity.init);
    boot('projects', TP.projects && TP.projects.init);
    boot('terminal', TP.terminal && TP.terminal.init);
    boot('skills', TP.skills && TP.skills.init);
    boot('contact', TP.contact && TP.contact.init);

    /* ---- Games (optional) ---- */
    if (TP.config.features.games) {
      boot('snake', TP.snake && TP.snake.init);
      boot('typing', TP.typing && TP.typing.init);
      boot('memory', TP.memory && TP.memory.init);
      boot('sequence', TP.sequence && TP.sequence.init);
    } else {
      const playground = document.getElementById('playground');
      if (playground) playground.hidden = true;
    }

    /* ---- Scroll animations ----
       Runs last: sections are only tagged for reveal once their content has
       been generated, so nothing is measured at the wrong height. ---- */
    boot('reveal', TP.reveal && TP.reveal.init);

    // Content height changed a lot during boot; recompute scrollspy offsets.
    if (TP.nav && TP.nav.refresh) TP.nav.refresh();
  }

  // `defer` normally guarantees the DOM is parsed, but this also covers the
  // case where someone drops the script in without defer.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
