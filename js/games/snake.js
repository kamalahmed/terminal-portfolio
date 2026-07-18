/* ==========================================================================
   GAME — SNAKE
   ==========================================================================
   Classic snake on a canvas. Arrow keys or WASD on desktop; an on-screen
   D-pad on touch devices.

   Tuning knobs are the constants at the top.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.snake = (function () {
  'use strict';

  const { $, el, cssVar } = window.TP.utils;

  /* ---- Board geometry. Canvas size is COLS*CELL x ROWS*CELL. ---- */
  const COLS = 24;
  const ROWS = 16;
  const CELL = 20;
  const TICK_MS = 155;   // lower = faster snake

  function init() {
    const mount = $('#gameSnake');
    if (!mount) return;

    const audio = window.TP.audio;

    let snake, direction, nextDirection, food, timer;
    let started = false, over = false, score = 0, best = 0;

    /* ---- Chrome ---- */
    const scoreEl = el('span', { class: 'game-score' });
    const win = window.TP.gameShell.create('kamal@dev: ~/playground — snake', scoreEl);

    const canvas = el('canvas', {
      class: 'snake-canvas',
      width: COLS * CELL,
      height: ROWS * CELL,
      'aria-label': 'Snake game board'
    });
    const ctx = canvas.getContext('2d');

    const ov = window.TP.gameShell.overlay(start, 'snake-ov');
    const body = el('div', { class: 'snake-body' }, canvas, ov.root);

    /* ---- Touch D-pad ---- */
    const dpad = el('div', { class: 'dpad' });
    const padBtn = (label, x, y) => el('button', {
      class: 'chip',
      type: 'button',
      'aria-label': label.name,
      onClick: () => setDirection(x, y)
    }, label.glyph);

    dpad.append(
      el('span'), padBtn({ glyph: '↑', name: 'Up' }, 0, -1), el('span'),
      padBtn({ glyph: '←', name: 'Left' }, -1, 0),
      padBtn({ glyph: '↓', name: 'Down' }, 0, 1),
      padBtn({ glyph: '→', name: 'Right' }, 1, 0)
    );

    win.append(
      body,
      el('div', { class: 'snake-foot' },
        el('span', { class: 'snake-foot-hint' }, 'arrow keys / WASD'),
        dpad
      )
    );
    mount.append(win);

    /* ---- Rules ---- */
    function reset() {
      snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      direction = { x: 1, y: 0 };
      nextDirection = { x: 1, y: 0 };
      placeFood();
    }

    /** Place food on any cell the snake isn't currently occupying. */
    function placeFood() {
      do {
        food = {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS)
        };
      } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
    }

    /**
     * Queue a direction change. Buffered until the next tick so you can't
     * turn twice within one step and double back into yourself.
     */
    function setDirection(x, y) {
      if (!started || over) return;
      if (direction.x === -x && direction.y === -y) return;   // no 180° turns
      nextDirection = { x, y };
    }

    function start() {
      audio.start();
      reset();
      started = true;
      over = false;
      score = 0;
      syncOverlay();
      clearInterval(timer);
      timer = setInterval(tick, TICK_MS);
      draw();
    }

    function tick() {
      direction = nextDirection;

      const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
      };

      const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
      const hitSelf = snake.some(seg => seg.x === head.x && seg.y === head.y);

      if (hitWall || hitSelf) {
        clearInterval(timer);
        over = true;
        started = false;
        best = Math.max(best, score);
        audio.over();
        syncOverlay();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score++;
        placeFood();
        audio.eat();
      } else {
        snake.pop();   // only grow when food was eaten
      }

      draw();
      syncScore();
    }

    /* ---- Drawing ----
       Colours are read from CSS variables each frame so the game follows the
       light/dark theme without any extra wiring. */
    function draw() {
      ctx.fillStyle = cssVar('--canvas');
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = cssVar('--amber');
      ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);

      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? cssVar('--green2') : cssVar('--green');
        // Tail fades out along the body.
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.4, 1 - i / snake.length);
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      });

      ctx.globalAlpha = 1;
    }

    function syncScore() {
      scoreEl.textContent = `score ${score} · best ${best}`;
    }

    function syncOverlay() {
      syncScore();

      if (started && !over) {
        ov.hide();
        return;
      }

      ov.show(
        over ? 'game over' : '$ ./snake',
        over
          ? `final score ${score} — the classics never crash. run it back?`
          : "eat the amber blocks, don't bite your own tail. arrow keys or WASD.",
        over ? 'restart ↵' : 'start ↵'
      );
    }

    /* ---- Keyboard ----
       Only intercepts arrows while a game is actually running, so the keys
       still scroll the page the rest of the time. */
    const KEYS = {
      ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
      ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
      ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
      ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
    };

    window.addEventListener('keydown', e => {
      const move = KEYS[e.key];
      if (!move || !started) return;
      e.preventDefault();
      setDirection(move[0], move[1]);
    });

    // Pause when the tab is hidden so the snake isn't dead on return.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && started) {
        clearInterval(timer);
      } else if (!document.hidden && started && !over) {
        clearInterval(timer);
        timer = setInterval(tick, TICK_MS);
      }
    });

    reset();
    draw();
    syncOverlay();
  }

  return { init };
})();
