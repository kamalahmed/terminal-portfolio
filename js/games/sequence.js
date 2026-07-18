/* ==========================================================================
   GAME — SEQUENCE
   ==========================================================================
   Simon-style pattern recall. The board flashes a growing sequence; repeat it
   back. One extra step is added each round.

   Phases: idle → watch → input → (correct → watch | over)
   ========================================================================== */

window.TP = window.TP || {};

window.TP.sequence = (function () {
  'use strict';

  const { $, el } = window.TP.utils;

  /* Tile tints as raw "r,g,b" triplets — CSS composes them with alpha via the
     --tint custom property (see .seq-tile in 05-sections.css). */
  const TINTS = [
    '94,230,160',   // green
    '240,193,122',  // amber
    '127,211,255',  // blue
    '195,166,255'   // violet
  ];

  /* ---- Timing (ms) ---- */
  const FLASH_ON = 560;    // how long a tile stays lit during playback
  const FLASH_GAP = 340;   // dark pause between flashes
  const LEAD_IN = 800;     // pause before a sequence starts playing
  const BETWEEN = 1150;    // pause after a correct round
  const TAP_FLASH = 200;   // how long your own tap lights a tile

  function init() {
    const mount = $('#gameSequence');
    if (!mount) return;

    const audio = window.TP.audio;

    let phase = 'idle';
    let sequence = [];
    let step = 0;
    let active = -1;
    let round = 0;
    let best = 0;
    let timer, tapTimer;

    /* ---- Chrome ---- */
    const infoEl = el('span', { class: 'game-score' });
    const win = window.TP.gameShell.create('kamal@dev: ~/playground — sequence', infoEl);

    const hint = el('p', { class: 'game-hint' });
    const grid = el('div', { class: 'seq-grid' });

    const tiles = TINTS.map((tint, i) =>
      el('button', {
        class: 'seq-tile',
        type: 'button',
        style: '--tint:' + tint,
        'aria-label': 'Tile ' + (i + 1),
        onClick: () => click(i)
      })
    );
    tiles.forEach(t => grid.append(t));

    const ov = window.TP.gameShell.overlay(start);

    win.append(el('div', { class: 'game-body' }, hint, grid, ov.root));
    mount.append(win);

    /* ---- Rules ---- */
    const randomTile = () => Math.floor(Math.random() * TINTS.length);

    function clearTimers() {
      clearTimeout(timer);
      clearTimeout(tapTimer);
    }

    function start() {
      audio.start();
      clearTimers();
      sequence = [randomTile()];
      round = 1;
      step = 0;
      active = -1;
      phase = 'watch';
      paint();
      timer = setTimeout(playback, LEAD_IN);
    }

    /** Flash the sequence back to the player, then hand over control. */
    function playback() {
      clearTimers();
      let i = 0;
      phase = 'watch';
      active = -1;
      paint();

      (function flash() {
        if (i >= sequence.length) {
          phase = 'input';
          step = 0;
          active = -1;
          paint();
          return;
        }

        active = sequence[i];
        audio.seq(active);
        paint();

        timer = setTimeout(() => {
          active = -1;
          paint();
          i++;
          timer = setTimeout(flash, FLASH_GAP);
        }, FLASH_ON);
      })();
    }

    function click(tile) {
      if (phase !== 'input') return;

      // Light the tapped tile briefly for feedback.
      active = tile;
      audio.seq(tile);
      paint();
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { active = -1; paint(); }, TAP_FLASH);

      if (tile !== sequence[step]) {
        phase = 'over';
        best = Math.max(best, round);
        audio.wrong();
        paint();
        return;
      }

      step++;

      if (step === sequence.length) {
        round++;
        phase = 'correct';
        audio.correct();
        paint();
        sequence.push(randomTile());
        timer = setTimeout(playback, BETWEEN);
      } else {
        paint();
      }
    }

    /* ---- Render ---- */
    function paint() {
      infoEl.textContent = `round ${round} · best ${best}`;

      const hints = {
        idle: 'watch, then repeat the sequence',
        watch: '● watch the sequence…',
        input: `○ your turn — ${step}/${sequence.length}`,
        correct: '✓ nice — next round coming…',
        over: '✗ wrong tile!'
      };

      hint.textContent = hints[phase] || '';
      hint.classList.toggle('is-error', phase === 'over');
      hint.classList.toggle('is-watch', phase === 'watch');

      // Only clickable while it's actually the player's turn.
      grid.classList.toggle('is-locked', phase !== 'input');
      tiles.forEach((tile, i) => {
        tile.classList.toggle('is-on', active === i);
        tile.disabled = phase !== 'input';
      });

      if (phase === 'idle' || phase === 'over') {
        ov.show(
          phase === 'over' ? 'sequence broken' : '$ ./sequence',
          phase === 'over'
            ? `you held ${round - 1} steps in memory. run it back?`
            : 'the terminal flashes a growing pattern — watch it, then repeat it back. it waits for your turn.',
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
