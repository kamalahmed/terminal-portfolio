/* ==========================================================================
   GAME SHELL
   ==========================================================================
   Shared chrome for the four ~/playground games: the fake terminal window,
   its title bar, and the start / game-over overlay.

   Keeping this in one place means each game file only contains its own rules.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.gameShell = (function () {
  'use strict';

  const { el } = window.TP.utils;

  /**
   * Build a game window.
   * @param {string} title      text shown in the title bar
   * @param {Node}   [scoreEl]  optional right-aligned score element
   * @returns {HTMLElement} the .win element
   */
  function create(title, scoreEl) {
    const bar = el('div', { class: 'winbar' },
      el('span', { class: 'dots', 'aria-hidden': 'true' },
        el('span', { class: 'dot dot-red' }),
        el('span', { class: 'dot dot-amber' }),
        el('span', { class: 'dot dot-green' })
      ),
      el('span', { class: 'winbar-title' }, title)
    );

    if (scoreEl) bar.append(scoreEl);

    return el('div', { class: 'win game' }, bar);
  }

  /**
   * Build the overlay shown before starting and after losing.
   * @param {Function} onStart click handler for the action button
   * @returns {{root, title, sub, button, show, hide}}
   */
  function overlay(onStart, extraClass) {
    const title = el('p', { class: 'game-ov-title' });
    const sub = el('p', { class: 'game-ov-sub' });
    const button = el('button', { class: 'btn btn-primary', type: 'button', onClick: onStart });

    const root = el('div', {
      class: 'game-ov' + (extraClass ? ' ' + extraClass : '')
    }, title, sub, button);

    return {
      root, title, sub, button,
      /** @param {string} t heading  @param {string} s body  @param {string} b button label */
      show(t, s, b) {
        title.textContent = t;
        sub.textContent = s;
        button.textContent = b;
        root.hidden = false;
      },
      hide() { root.hidden = true; }
    };
  }

  return { create, overlay };
})();
