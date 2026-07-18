/* ==========================================================================
   NAVIGATION
   ==========================================================================
   Three jobs:

     1. Keep --nav-h in sync with the real height of the sticky bar, so
        anchored sections never scroll underneath it.
     2. Highlight the nav link for whichever section you're currently looking
        at (scrollspy).
     3. Run the mobile hamburger menu.

   Smooth scrolling itself is pure CSS (`scroll-behavior: smooth` in
   02-base.css) — no JS needed, and it automatically respects the visitor's
   reduced-motion setting.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.nav = (function () {
  'use strict';

  const { $, $$, debounce } = window.TP.utils;

  /* Must match the nav breakpoint in css/06-responsive.css. */
  const MOBILE_NAV_MAX = 900;

  let links = [];      // nav <a> elements that point at a section
  let sections = [];   // the matching section elements, in document order
  let current = null;  // currently highlighted link
  let ticking = false; // rAF guard for the scroll handler

  /* ==========================================================================
     NAV HEIGHT
     ==========================================================================
     The bar's height changes with viewport width (padding shrinks on mobile),
     so we measure it rather than hardcoding. --nav-h feeds `scroll-margin-top`
     on every section and `scroll-padding-top` on <html>.
     ========================================================================== */
  function measure() {
    const bar = $('#site-nav');
    if (!bar) return;
    const h = Math.round(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }

  /* ==========================================================================
     SCROLLSPY
     ==========================================================================
     Deliberately a scroll handler rather than an IntersectionObserver.

     IntersectionObserver sounds like the right tool, but it reports how much
     of an element is visible — and these sections have wildly different
     heights (~/playground is several screens tall, ~/activity is one). Any
     ratio-based rule ends up favouring whichever section happens to be
     shortest, which is exactly the bug this replaces.

     Instead: the active section is simply the last one whose top edge has
     passed under the nav bar. That matches what a reader perceives as "the
     section I am in", regardless of section height.

     The work is throttled with requestAnimationFrame, so it costs one cheap
     read per painted frame at most.
     ========================================================================== */
  function updateActive() {
    ticking = false;
    if (!sections.length) return;

    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10
    ) || 62;

    // A little below the nav, so a section counts as "current" just before
    // its heading reaches the bar rather than exactly on it.
    const line = window.scrollY + navH + 24;

    let active = null;

    // Bottom of the page: the final section can be too short to ever cross
    // the line, so always claim it when we've hit the end of the document.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    if (atBottom) {
      active = sections[sections.length - 1];
    } else {
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= line) active = sections[i];
        else break;
      }
    }

    const link = active ? links.find(l => l.hash === '#' + active.id) : null;
    if (link === current) return;

    if (current) {
      current.classList.remove('is-active');
      current.removeAttribute('aria-current');
    }
    if (link) {
      link.classList.add('is-active');
      // "location" is the correct token for "the section currently in view".
      link.setAttribute('aria-current', 'location');
    }
    current = link || null;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActive);
  }

  /* ==========================================================================
     MOBILE MENU
     ==========================================================================
     Closes on: link tap, Escape, outside click, and any resize back to
     desktop. Focus returns to the toggle when closed with Escape so keyboard
     users don't get stranded.
     ========================================================================== */
  function initMenu() {
    const toggle = $('#navToggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    function open() {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      menu.classList.add('is-open');
    }

    function close(returnFocus) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      menu.classList.remove('is-open');
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => (isOpen() ? close() : open()));

    // Tapping a link navigates and closes the panel.
    menu.addEventListener('click', e => {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) close(true);
    });

    // Click anywhere outside the nav closes it.
    document.addEventListener('click', e => {
      if (!isOpen()) return;
      if (!e.target.closest('#site-nav')) close();
    });

    // Returning to desktop width must clear the open state, otherwise the
    // panel's `display:flex` would linger once the media query stops applying.
    // Keep MOBILE_NAV_MAX in sync with the nav breakpoint in
    // css/06-responsive.css.
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > MOBILE_NAV_MAX && isOpen()) close();
    }, 150));
  }

  /* ==========================================================================
     INIT
     ========================================================================== */
  function init() {
    links = $$('.nav-links a').filter(a => a.hash && a.hash.length > 1);

    sections = links
      .map(a => document.getElementById(a.hash.slice(1)))
      .filter(Boolean)
      // offsetTop order, so the "last one past the line" rule is reliable
      // even if the markup order ever changes.
      .sort((a, b) => a.offsetTop - b.offsetTop);

    measure();
    initMenu();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', debounce(() => {
      measure();
      updateActive();
    }, 150));

    // Fonts load after first paint and shift every offsetTop, so recompute
    // once they're ready.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { measure(); updateActive(); });
    }

    updateActive();
  }

  return { init, refresh: updateActive };
})();
