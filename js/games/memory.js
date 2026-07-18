/* ==========================================================================
   GAME — MEMORY MATRIX
   ==========================================================================
   A set of tiles lights up briefly; reproduce the pattern from memory. Each
   level adds one more tile.

   Phases: idle → show → play → (next level | over)
   ========================================================================== */

window.TP = window.TP || {};

window.TP.memory = (function () {
  'use strict';

  const { $, el } = window.TP.utils;

  const SIZE = 25;        // 5x5 grid
  const MAX_TILES = 12;   // difficulty ceiling
  const BASE_SHOW_MS = 1300;
  const PER_LEVEL_MS = 120;

  const HINTS = {
    idle: 'recall the highlighted cells from memory',
    show: 'memorize the lit tiles…',
    play: 'now click every tile you saw',
    over: 'not quite — the misses are amber'
  };

  function init() {
    const mount = $('#gameMemory');
    if (!mount) return;

    const audio = window.TP.audio;

    let phase = 'idle';
    let level = 1;
    let target = [];
    let found = [];
    let timer;

    /* ---- Chrome ---- */
    const levelEl = el('span', { class: 'game-score' });
    const win = window.TP.gameShell.create('kamal@dev: ~/playground — memcache', levelEl);

    const hint = el('p', { class: 'game-hint' });
    const grid = el('div', { class: 'mem-grid' });

    const cells = [];
    for (let i = 0; i < SIZE; i++) {
      const cell = el('button', {
        class: 'mem-cell',
        type: 'button',
        'aria-label': 'Tile ' + (i + 1),
        onClick: () => click(i)
      });
      cells.push(cell);
      grid.append(cell);
    }

    const ov = window.TP.gameShell.overlay(start);

    win.append(el('div', { class: 'game-body' }, hint, grid, ov.root));
    mount.append(win);

    /* ---- Rules ---- */

    /** Pick n distinct random tile indices. */
    function pick(n) {
      const chosen = [];
      while (chosen.length < n) {
        const r = Math.floor(Math.random() * SIZE);
        if (!chosen.includes(r)) chosen.push(r);
      }
      return chosen;
    }

    function start() {
      audio.start();
      round(1);
    }

    function round(lv) {
      level = lv;
      target = pick(Math.min(lv + 2, MAX_TILES));
      found = [];
      phase = 'show';
      paint();

      // Higher levels get slightly longer to memorise.
      clearTimeout(timer);
      timer = setTimeout(() => {
        phase = 'play';
        paint();
      }, BASE_SHOW_MS + lv * PER_LEVEL_MS);
    }

    function click(i) {
      if (phase !== 'play') return;
      audio.press();

      if (!target.includes(i)) {
        phase = 'over';
        audio.wrong();
        paint();
        return;
      }

      if (found.includes(i)) return;   // ignore repeat clicks on the same tile
      found.push(i);
      audio.flip();

      if (found.length === target.length) {
        paint();
        clearTimeout(timer);
        timer = setTimeout(() => round(level + 1), 650);
      } else {
        paint();
      }
    }

    /* ---- Render ---- */
    function paint() {
      levelEl.textContent = 'level ' + level;

      hint.textContent = HINTS[phase];
      hint.classList.toggle('is-error', phase === 'over');

      cells.forEach((cell, i) => {
        const inTarget = target.includes(i);
        const wasFound = found.includes(i);

        // During 'show' reveal the answer; during 'play' only what's found;
        // on 'over' show which ones were missed in amber.
        const lit =
          (phase === 'show' && inTarget) ||
          (phase === 'play' && wasFound) ||
          (phase === 'over' && inTarget && wasFound);

        const missed = phase === 'over' && inTarget && !wasFound;

        cell.classList.toggle('is-lit', lit);
        cell.classList.toggle('is-miss', missed);
        cell.classList.toggle('is-playable', phase === 'play');
        cell.disabled = phase !== 'play';
      });

      if (phase === 'idle' || phase === 'over') {
        ov.show(
          phase === 'over' ? 'cache miss' : '$ ./memcache',
          phase === 'over'
            ? `you reached level ${level}. memory is a muscle — train it again?`
            : 'watch the tiles light up, then reproduce the pattern. it grows each level.',
          phase === 'over' ? 'retry ↵' : 'start ↵'
        );
      } else {
        ov.hide();
      }
    }

    paint();
  }

  return { init };
})();
