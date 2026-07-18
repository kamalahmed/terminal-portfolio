/* ==========================================================================
   ~/activity
   ==========================================================================
   The GitHub contribution heatmap and the headline stats beside it.

   HONESTY NOTE
   ------------
   If the contribution API is unreachable, this renders a dimmed empty grid
   and says so. It does not generate plausible-looking fake activity — a
   portfolio that invents its own commit history is worse than one that
   admits the data didn't load.

   Set `LIVE_GITHUB: false` in js/config.js to skip the network entirely.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.activity = (function () {
  'use strict';

  const { $, el, fetchJSON, session, debounce } = window.TP.utils;

  const ROWS = 7;              // days per column, i.e. one column per week
  const DESKTOP_WEEKS = 40;
  const TABLET_WEEKS = 28;
  const MOBILE_WEEKS = 18;

  let levels = null;           // last fetched contribution levels (0–4)

  /** Fewer columns on small screens — 40 weeks of 4px squares is unreadable. */
  function weeksToShow() {
    const w = window.innerWidth;
    if (w <= 560) return MOBILE_WEEKS;
    if (w <= 900) return TABLET_WEEKS;
    return DESKTOP_WEEKS;
  }

  /**
   * Paint the grid.
   * @param {number[]|null} data contribution levels, or null when unavailable
   */
  function render(data) {
    const grid = $('#heat');
    const note = $('#heatNote');
    if (!grid) return;

    const weeks = weeksToShow();
    const cells = weeks * ROWS;

    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${weeks}, 1fr)`;

    const slice = data ? data.slice(-cells) : [];
    const unavailable = !data || !slice.length;

    for (let i = 0; i < cells; i++) {
      const level = unavailable ? 0 : (slice[i] || 0);
      grid.append(el('span', { class: 'heat-cell', dataset: { level: String(level) } }));
    }

    grid.classList.toggle('is-empty', unavailable);

    if (note) {
      note.hidden = !unavailable;
      note.textContent = unavailable ? '// contribution data unavailable' : '';
    }

    grid.setAttribute(
      'aria-label',
      unavailable
        ? 'GitHub contribution graph — data unavailable'
        : `GitHub contribution graph, last ${weeks} weeks`
    );
  }

  /** Fetch the contribution graph, with a short sessionStorage cache. */
  async function loadContributions() {
    const cfg = window.TP.config;
    if (!cfg.LIVE_GITHUB) return null;

    const cacheKey = 'tp-contrib-' + cfg.GITHUB_USER;
    const cached = session.get(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.at < cfg.CACHE_MINUTES * 60000) return parsed.levels;
      } catch (e) { /* corrupt cache — just refetch */ }
    }

    const url = cfg.CONTRIB_API + encodeURIComponent(cfg.GITHUB_USER) + '?y=last';
    const data = await fetchJSON(url);
    if (!data || !Array.isArray(data.contributions)) return null;

    const result = data.contributions.map(day => day.level || 0);
    session.set(cacheKey, JSON.stringify({ at: Date.now(), levels: result }));
    return result;
  }

  /** Update the public-repo counts once the GitHub repo list is known. */
  function applyRepoCount(count) {
    if (!count) return;
    const statEl = $('#statRepos');
    const badgeEl = $('#badgeRepos');
    if (statEl) statEl.textContent = String(count);
    if (badgeEl) badgeEl.textContent = count + ' public';
  }

  async function init() {
    // Draw the empty grid immediately so the section has its final height
    // before any network call resolves — no layout shift when data lands.
    render(null);

    levels = await loadContributions();
    render(levels);

    // Re-render on resize because the column count is width-dependent.
    window.addEventListener('resize', debounce(() => render(levels), 200));
  }

  return { init, applyRepoCount };
})();
