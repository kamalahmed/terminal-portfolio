/* ==========================================================================
   GAME — TYPING TEST
   ==========================================================================
   Type the quote exactly. Characters turn green when correct and red when
   not; WPM and accuracy update live.

   The visible text is styled spans; keystrokes are captured by a transparent
   input stretched over the whole area, so mobile keyboards open on tap.

   EDIT: add or change quotes in the QUOTES array below.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.typing = (function () {
  'use strict';

  const { $, el } = window.TP.utils;

  const QUOTES = [
    { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', by: 'Harold Abelson' },
    { text: 'First, solve the problem. Then, write the code that another human can actually understand.', by: 'John Johnson' },
    { text: 'Talk is cheap. Show me the code — because simplicity is the soul of efficiency.', by: 'Linus Torvalds' },
    { text: 'Make it work, make it right, make it fast — in that order, every single time.', by: 'Kent Beck' }
  ];

  function init() {
    const mount = $('#gameTyping');
    if (!mount) return;

    const audio = window.TP.audio;

    let index = 0;
    let typed = '';
    let startTime = 0;
    let complete = false;
    let celebrated = false;

    /* ---- Chrome ---- */
    const statEl = el('span', { class: 'game-score' });
    const win = window.TP.gameShell.create('kamal@dev: ~/playground — typespeed', statEl);

    const line = el('div', { class: 'type-line' });
    const author = el('p', { class: 'type-author' });

    const input = el('input', {
      class: 'type-input',
      type: 'text',
      spellcheck: 'false',
      autocomplete: 'off',
      autocapitalize: 'off',
      autocorrect: 'off',
      'aria-label': 'Type the quote shown'
    });

    const area = el('div', {
      class: 'type-area',
      onClick: () => input.focus()
    }, line, author, input);

    const foot = el('p', { class: 'type-foot' });
    const result = el('div', { class: 'type-result', hidden: 'hidden' });

    win.append(el('div', { class: 'game-body' },
      el('p', { class: 'game-hint' }, '$ cat quote.txt · type it exactly to beat the clock'),
      area,
      result,
      foot
    ));
    mount.append(win);

    /* ---- Input ---- */
    input.addEventListener('input', () => {
      const target = QUOTES[index].text;

      // Never accept more characters than the quote has.
      typed = input.value.slice(0, target.length);

      // Clock starts on the first real keystroke, not on focus.
      if (!startTime && typed.length) startTime = performance.now();

      complete = typed === target;
      audio.key();

      if (complete && !celebrated) {
        celebrated = true;
        audio.win();
      }

      render();
    });

    /* ---- Stats ---- */
    function stats() {
      const target = QUOTES[index].text;

      let correct = 0;
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === target[i]) correct++;
      }
      const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;

      // Standard WPM: one "word" is five characters.
      let wpm = 0;
      if (startTime) {
        const minutes = (performance.now() - startTime) / 60000;
        wpm = Math.round((typed.length / 5) / Math.max(minutes, 1e-4));
        if (!isFinite(wpm) || wpm < 0) wpm = 0;
      }

      return { accuracy, wpm: Math.min(wpm, 400) };
    }

    /* ---- Render ----
       Characters are grouped into words so lines wrap at spaces rather than
       breaking mid-word. */
    function render() {
      const target = QUOTES[index].text;

      line.innerHTML = '';
      let word = el('span', { class: 'type-word' });

      for (let i = 0; i < target.length; i++) {
        const char = target[i];
        const isTyped = i < typed.length;

        let cls = 'type-char';
        if (isTyped) cls += typed[i] === char ? ' ok' : ' bad';
        if (i === typed.length && !complete) cls += ' cur';

        // Non-breaking space keeps spacing visible inside the styled spans.
        word.append(el('span', { class: cls }, char === ' ' ? ' ' : char));

        if (char === ' ') {
          line.append(word);
          word = el('span', { class: 'type-word' });
        }
      }
      if (word.childNodes.length) line.append(word);

      author.textContent = '— ' + QUOTES[index].by;

      const s = stats();
      statEl.textContent = `${s.wpm} wpm · ${s.accuracy}% acc`;

      if (complete) {
        result.hidden = false;
        result.innerHTML =
          '<span class="win">✓ clean run</span>' +
          `<span><b>${s.wpm}</b> wpm</span>` +
          `<span><b>${s.accuracy}</b>% accuracy</span>`;
        result.append(el('button', {
          class: 'btn btn-primary btn-sm',
          type: 'button',
          onClick: next
        }, 'next quote ↵'));
        foot.hidden = true;
      } else {
        result.hidden = true;
        foot.hidden = false;
        foot.textContent = `${typed.length}/${target.length} chars — click the text and start typing`;
      }
    }

    function next() {
      index = (index + 1) % QUOTES.length;
      typed = '';
      startTime = 0;
      complete = false;
      celebrated = false;
      input.value = '';
      input.focus();
      render();
    }

    render();
  }

  return { init };
})();
