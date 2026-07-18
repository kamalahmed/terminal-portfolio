/* ==========================================================================
   ~/skills
   ==========================================================================
   Builds the proficiency columns from SKILL_GROUPS in js/data.js, then
   animates each bar from 0 to its value the first time the section scrolls
   into view.

   Edit the skills themselves in js/data.js.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.skills = (function () {
  'use strict';

  const { $, $$, el, clamp, prefersReducedMotion } = window.TP.utils;

  function build() {
    const grid = $('#skillsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    (window.TP.SKILL_GROUPS || []).forEach(group => {
      const column = el('div', {},
        el('p', { class: 'skill-group-label' }, '[ ' + group.label + ' ]')
      );

      const list = el('div', { class: 'skill-list' });

      group.items.forEach(([name, pct]) => {
        const value = clamp(Number(pct) || 0, 0, 100);

        list.append(el('div', {
          class: 'skill-row',
          role: 'meter',
          'aria-valuenow': value,
          'aria-valuemin': '0',
          'aria-valuemax': '100',
          'aria-label': name + ' proficiency'
        },
          el('span', { class: 'skill-name' }, name),
          el('div', { class: 'skill-track' },
            el('div', { class: 'skill-bar', dataset: { pct: value } })
          ),
          el('span', { class: 'skill-pct' }, value + '%')
        ));
      });

      column.append(list);
      grid.append(column);
    });
  }

  /** Set every bar to its target width, triggering the CSS width transition. */
  function fill() {
    $$('.skill-bar').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }

  function init() {
    build();

    const section = $('#skills');
    if (!section) return;

    // No observer support, or reduced motion: show the final state at once.
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      fill();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        fill();
        observer.disconnect();   // one-shot — bars don't re-animate
      });
    }, { threshold: 0.25 });

    observer.observe(section);
  }

  return { init };
})();
