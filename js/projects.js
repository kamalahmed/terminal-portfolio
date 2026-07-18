/* ==========================================================================
   PROJECTS
   ==========================================================================
   Owns the project list and the ~/apps card grid.

   Other modules read the live list through `window.TP.projects.all()` rather
   than touching data.js directly, so everyone sees the same GitHub-enriched
   copy once the API responds.

   To change which projects appear, edit js/data.js — not this file.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.projects = (function () {
  'use strict';

  const { $, el, langColor, starLabel, fetchJSON, session } = window.TP.utils;

  /* Working copy. Starts as the static data, gets enriched with live stars
     and languages from the GitHub API. */
  let list = (window.TP.PROJECTS || []).map(p => Object.assign({}, p));

  const all = () => list;

  /** Filter used by the terminal's `ls` commands and the card grid. */
  function filter(kind) {
    if (kind === 'app') return list.filter(p => p.type === 'app');
    if (kind === 'plugin') return list.filter(p => p.type === 'plugin');
    if (kind === 'oss') return list.filter(p => p.type === 'oss' || p.type === 'tool');
    return list;
  }

  /* ==========================================================================
     CARD GRID
     ========================================================================== */
  function renderCards() {
    const grid = $('#featuredGrid');
    if (!grid) return;

    grid.innerHTML = '';

    filter('all').filter(p => p.featured).forEach(project => {
      grid.append(buildCard(project));
    });
  }

  /**
   * The card's visual: a real screenshot when the project has one, otherwise
   * a CSS placeholder.
   *
   * The placeholder is built from DOM rather than loaded as an image file so
   * that it follows the light/dark theme and scales with the card. See the
   * CSS PLACEHOLDER block in css/05-sections.css for the reasoning.
   */
  function buildVisual(p) {
    if (!p.image) return buildPlaceholder(p);

    /* Explicit width/height give the browser the aspect ratio up front, so
       nothing jumps around as images load. */
    const shot = el('img', {
      class: 'project-shot',
      src: p.image,
      alt: p.name + ' screenshot',
      width: 640,
      height: 400,
      loading: 'lazy',
      decoding: 'async'
    });

    // If the file is missing or fails to load, swap in the CSS placeholder
    // rather than leaving a broken-image icon in the card.
    shot.addEventListener('error', () => {
      shot.replaceWith(buildPlaceholder(p));
    }, { once: true });

    return shot;
  }

  /** Terminal-styled stand-in shown when a project has no screenshot. */
  function buildPlaceholder(p) {
    const tags = el('div', { class: 'project-ph-tags' });
    (p.stack || []).slice(0, 3).forEach(t => tags.append(el('span', { class: 'tag' }, t)));

    return el('div', {
      class: 'project-ph',
      // Tint the language line with the project's language colour.
      style: '--ph-accent:' + langColor(p.language),
      // Purely decorative — the real project details sit below it in the card.
      'aria-hidden': 'true'
    },
      el('div', { class: 'project-ph-bar' },
        el('span', { class: 'dot dot-red' }),
        el('span', { class: 'dot dot-amber' }),
        el('span', { class: 'dot dot-green' }),
        el('span', { class: 'project-ph-path' }, '~/' + p.id)
      ),
      el('div', { class: 'project-ph-body' },
        el('p', { class: 'project-ph-cmd' }, '$ open ' + p.id),
        el('p', { class: 'project-ph-name' }, p.name),
        el('p', { class: 'project-ph-lang' }, '● ' + p.language),
        tags
      )
    );
  }

  function buildCard(p) {
    const visual = buildVisual(p);

    /* ---- Stack tags ---- */
    const stack = el('div', { class: 'project-stack' });
    (p.stack || []).forEach(tag => stack.append(el('span', { class: 'tag' }, tag)));

    /* ---- Buttons ----
       "visit" only when there's a live URL; "source" only when the code is
       public (repo: null hides it). */
    const links = el('div', { class: 'project-links' });

    if (p.live) {
      links.append(el('a', {
        class: 'btn btn-primary btn-sm',
        href: p.live,
        target: '_blank',
        rel: 'noopener',
        'aria-label': 'Visit ' + p.name
      }, 'visit ↗'));
    }
    if (p.repo) {
      links.append(el('a', {
        class: 'btn btn-ghost btn-sm',
        href: p.repo,
        target: '_blank',
        rel: 'noopener',
        'aria-label': p.name + ' source code'
      }, 'source'));
    }

    const stars = starLabel(p);

    return el('article', { class: 'card card-hover project-card' },
      visual,
      el('div', { class: 'project-body' },
        el('div', { class: 'project-head' },
          el('h3', { class: 'project-name' }, p.name),
          el('span', {
            class: 'project-lang',
            style: 'color:' + langColor(p.language)
          }, '● ' + p.language),
          stars ? el('span', { class: 'project-stars' }, stars) : null
        ),
        el('p', { class: 'project-tagline' }, p.tagline),
        stack,
        links
      )
    );
  }

  /* ==========================================================================
     LIVE GITHUB DATA
     ==========================================================================
     Fills in real star counts and languages. Matching is by `id` first, then
     by lowercased name — which is why data.js tells you to make `id` match
     the repo name exactly.
     ========================================================================== */
  async function loadLive() {
    const cfg = window.TP.config;
    if (!cfg.LIVE_GITHUB) return;

    const cacheKey = 'tp-repos-' + cfg.GITHUB_USER;
    let repos = null;

    const cached = session.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.at < cfg.CACHE_MINUTES * 60000) repos = parsed.repos;
      } catch (e) { /* corrupt cache — refetch */ }
    }

    if (!repos) {
      const url = 'https://api.github.com/users/' +
        encodeURIComponent(cfg.GITHUB_USER) + '/repos?per_page=100&sort=updated';
      const raw = await fetchJSON(url);
      if (!Array.isArray(raw)) return;   // offline or rate-limited: keep static data

      repos = raw.map(r => ({
        name: r.name,
        stars: r.stargazers_count,
        language: r.language,
        url: r.html_url
      }));
      session.set(cacheKey, JSON.stringify({ at: Date.now(), repos }));
    }

    const byName = {};
    repos.forEach(r => { byName[r.name.toLowerCase()] = r; });

    list = list.map(p => {
      const match = byName[p.id.toLowerCase()] || byName[p.name.toLowerCase()];
      if (!match) return p;
      return Object.assign({}, p, {
        stars: match.stars,
        language: match.language || p.language,
        // Never overwrite an intentional `repo: null`.
        repo: p.repo === null ? null : (match.url || p.repo)
      });
    });

    renderCards();
    if (window.TP.terminal) window.TP.terminal.rerender();
    if (window.TP.activity) window.TP.activity.applyRepoCount(repos.length);
  }

  function init() {
    renderCards();
    loadLive();
  }

  return { init, all, filter, renderCards };
})();
