/* ==========================================================================
   ID BADGE
   ==========================================================================
   The lanyard card in the hero swings like a pendulum and can be dragged.

   Physics: a damped spring rotation. Each frame the card is pulled back
   toward vertical (-STIFFNESS * angle) and slowed by friction
   (-DAMPING * velocity), producing a natural decaying swing.

   Also draws the decorative barcode, using a seeded generator so the pattern
   is identical on every load rather than flickering between refreshes.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.badge = (function () {
  'use strict';

  const { $, el, clamp, seeded, prefersReducedMotion } = window.TP.utils;

  /* ---- Tuning ------------------------------------------------------------
     STIFFNESS  higher = snaps back faster
     DAMPING    higher = settles sooner
     MAX_ANGLE  swing limit in radians (~72°) so it can't spin around
     IDLE_*     a slow breathing sway so it never looks frozen
     ---------------------------------------------------------------------- */
  const STIFFNESS = 32;
  const DAMPING = 4;
  const MAX_ANGLE = 1.25;
  const IDLE_AMPLITUDE = 0.02;
  const IDLE_PERIOD = 1100;

  let frameId = null;

  function drawBarcode() {
    const host = $('#badgeBarcode');
    if (!host) return;

    const rand = seeded(42);      // fixed seed = same barcode every time
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 34; i++) {
      const r = rand();
      const width = r < 0.5 ? 2 : r < 0.8 ? 3 : 4;
      // A few gaps, mostly light bars, occasional accent bar.
      const color = r < 0.28 ? 'transparent' : r < 0.85 ? 'var(--soft)' : 'var(--green)';
      fragment.append(el('span', {
        class: 'badge-bar',
        style: `width:${width}px;background:${color}`
      }));
    }

    host.append(fragment);
  }

  function initSwing() {
    const swing = $('#badgeSwing');
    if (!swing) return;

    // Reduced motion: leave the card hanging straight and skip the loop
    // entirely (no rAF running for something nobody wants to see move).
    if (prefersReducedMotion()) {
      swing.style.transform = 'rotate(0rad)';
      swing.style.cursor = 'default';
      return;
    }

    let angle = 0.38;      // start tilted so the swing is visible on load
    let velocity = 0;
    let dragging = false;
    let grabOffset = 0;
    let lastMoveTime = 0;
    let lastFrame = 0;

    /**
     * Angle from the pivot to the pointer, in radians. 0 = hanging straight
     * down, positive = swung clockwise.
     *
     * The pivot is measured from the PARENT, not from `swing` itself. `swing`
     * carries the rotation, and getBoundingClientRect() returns the
     * axis-aligned box of a *transformed* element — so its centre drifts as
     * the card swings. Using that as the pivot fed the rotation back into its
     * own input, which made the card fight the cursor and travel the wrong
     * way. The parent is never rotated, so its top-centre is the true and
     * stable transform-origin.
     */
    function pointerAngle(e) {
      const pivot = swing.parentElement.getBoundingClientRect();
      const originX = pivot.left + pivot.width / 2;
      const originY = pivot.top;

      const dx = e.clientX - originX;
      const dy = Math.max(e.clientY - originY, 1);   // guard divide-by-zero
      return Math.atan2(dx, dy);
    }

    swing.addEventListener('pointerdown', e => {
      dragging = true;
      swing.classList.add('is-dragging');
      grabOffset = pointerAngle(e) - angle;
      lastMoveTime = performance.now();
      // Route all subsequent pointer events here even if the cursor leaves
      // the element — this is what makes the drag survive fast movements.
      if (swing.setPointerCapture) {
        try { swing.setPointerCapture(e.pointerId); } catch (err) {}
      }
      e.preventDefault();
    });

    swing.addEventListener('pointermove', e => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max((now - lastMoveTime) / 1000, 1e-3);
      const target = clamp(pointerAngle(e) - grabOffset, -MAX_ANGLE, MAX_ANGLE);
      // Derive velocity from the drag so releasing mid-swing flings the card.
      velocity = (target - angle) / dt;
      angle = target;
      lastMoveTime = now;
    });

    function endDrag() {
      dragging = false;
      swing.classList.remove('is-dragging');
    }

    swing.addEventListener('pointerup', endDrag);
    swing.addEventListener('pointercancel', endDrag);

    function loop(now) {
      // Cap dt so a backgrounded tab doesn't resume with one huge unstable step.
      const dt = Math.min((now - (lastFrame || now)) / 1000, 0.033);
      lastFrame = now;

      if (!dragging) {
        const acceleration = -STIFFNESS * angle - DAMPING * velocity;
        velocity += acceleration * dt;
        angle += velocity * dt;
      }

      const idle = IDLE_AMPLITUDE * Math.sin(now / IDLE_PERIOD);
      swing.style.transform = `rotate(${(angle + idle).toFixed(4)}rad)`;

      frameId = requestAnimationFrame(loop);
    }

    frameId = requestAnimationFrame(loop);

    // Stop animating while the tab is hidden; resume cleanly when it returns.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = null;
      } else if (!frameId) {
        lastFrame = 0;
        frameId = requestAnimationFrame(loop);
      }
    });
  }

  function init() {
    drawBarcode();

    // No on-screen prompt to drag the badge: it swings from a fixed anchor
    // rather than moving freely, so advertising it oversells what it does.
    // The interaction still works for anyone who tries it.
    if (window.TP.config.features.badgeSwing) initSwing();
  }

  return { init };
})();
