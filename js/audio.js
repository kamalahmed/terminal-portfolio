/* ==========================================================================
   AUDIO
   ==========================================================================
   Tiny synthesised sound effects for the games, built with the Web Audio API.
   No audio files are loaded — every sound is an oscillator generated on the
   fly, which keeps the whole site dependency-free.

   Muted by default. Browsers block audio until the visitor interacts with the
   page anyway, so the context is created lazily on first sound.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.audio = (function () {
  'use strict';

  const { $, store } = window.TP.utils;
  const KEY = window.TP.config.storage.mute;

  // Default to muted: unexpected sound on a portfolio is hostile.
  let muted = store.get(KEY) !== '0';
  let ctx = null;

  function context() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    // Browsers suspend the context until a user gesture occurs.
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /**
   * Play a single tone.
   * @param {number} freq    starting frequency in Hz
   * @param {number} dur     duration in seconds
   * @param {string} type    oscillator waveform
   * @param {number} vol     peak gain (0–1)
   * @param {number} slideTo optional frequency to glide toward
   */
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = context();
    if (!c) return;

    try {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);

      // Exponential fade to near-silence avoids an audible click at the end.
      gain.gain.setValueAtTime(vol || 0.12, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur + 0.03);
    } catch (e) {
      /* Audio is never essential — fail silently. */
    }
  }

  function setMuted(value) {
    muted = value;
    store.set(KEY, value ? '1' : '0');
    syncLabel();
  }

  function toggle() { setMuted(!muted); }

  function syncLabel() {
    const btn = $('#muteBtn');
    if (!btn) return;
    btn.textContent = muted ? '♪ off' : '♪ on';
    btn.setAttribute('aria-label', muted ? 'Turn sound effects on' : 'Turn sound effects off');
  }

  function init() {
    syncLabel();
    const btn = $('#muteBtn');
    if (btn) btn.addEventListener('click', toggle);
  }

  return {
    init,
    toggle,
    setMuted,
    isMuted: () => muted,

    /* ---- Named effects used by the games ---- */
    key:     () => tone(200 + Math.random() * 50, 0.05, 'square', 0.045),
    eat:     () => tone(520, 0.10, 'square', 0.13, 900),
    over:    () => tone(300, 0.45, 'sawtooth', 0.14, 70),
    wrong:   () => tone(170, 0.40, 'sawtooth', 0.14, 60),
    press:   () => tone(330, 0.06, 'sine', 0.09),
    flip:    () => tone(640, 0.09, 'triangle', 0.10, 900),
    start:   () => tone(440, 0.09, 'square', 0.10, 680),
    win:     () => [523, 659, 784, 1046].forEach((f, i) =>
                     setTimeout(() => tone(f, 0.15, 'triangle', 0.12), i * 95)),
    correct: () => [440, 660].forEach((f, i) =>
                     setTimeout(() => tone(f, 0.13, 'triangle', 0.12), i * 95)),
    /* One distinct pitch per sequence-game tile. */
    seq:     i => tone([329.6, 415.3, 523.3, 659.3][i] || 440, 0.34, 'sine', 0.13)
  };
})();
