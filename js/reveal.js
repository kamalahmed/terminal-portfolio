/* ==========================================================================
   SCROLL REVEAL
   ==========================================================================
   Fades sections in as they scroll into view.

   Elements are tagged with [data-reveal] here in JS rather than in the HTML,
   which matters: if this script never runs, the markup carries no hiding
   styles at all and everything is simply visible. Content is never dependent
   on JavaScript succeeding.

   Turn the whole effect off with `features.reveal: false` in js/config.js.
   Visitors with "reduce motion" enabled skip it automatically.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.reveal = (function () {
  'use strict';

  const { $$, prefersReducedMotion } = window.TP.utils;

  /* Selectors that get the fade-in. Add your own here. */
  const TARGETS = [
    '.section > .sec-h',
    '.section > .win',
    '.section > .card-grid',
    '.section > .contact-grid',
    '.section > .play-grid',
    '.strip-section > .strip'
  ];

  function init() {
    const enabled = window.TP.config.features.reveal;
    const nodes = $$(TARGETS.join(','));
    if (!nodes.length) return;

    // Disabled, motion-sensitive, or no observer support: show everything at
    // once. Never leave content stuck at opacity 0.
    if (!enabled || prefersReducedMotion() || !('IntersectionObserver' in window)) {
      return;
    }

    nodes.forEach(node => node.setAttribute('data-reveal', ''));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        // One-shot: elements don't re-hide when scrolled back past.
        observer.unobserve(entry.target);
      });
    }, {
      // Trigger slightly before the element's edge enters the viewport, so
      // the animation is already settling by the time it's properly in view.
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.05
    });

    nodes.forEach(node => observer.observe(node));

    // Anything already on screen at load (the hero area) should not animate —
    // reveal it immediately so the page doesn't flash empty.
    requestAnimationFrame(() => {
      nodes.forEach(node => {
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          node.classList.add('is-visible');
          observer.unobserve(node);
        }
      });
    });
  }

  return { init };
})();
