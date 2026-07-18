/* ==========================================================================
   CONFIG
   ==========================================================================
   Settings, keys, and feature switches. This is the first file to edit when
   you fork this portfolio for yourself.

   Everything in the project hangs off one global object, `window.TP`, so the
   page works when opened directly from disk (file://) with no build step and
   no module loader.
   ========================================================================== */

window.TP = window.TP || {};

window.TP.config = {

  /* ------------------------------------------------------------------------
     CONTACT FORM  —  https://web3forms.com
     ------------------------------------------------------------------------
     This is a PUBLIC access key and is safe to commit. It is a submit-only
     token: it cannot read your submissions, change your settings, or touch
     your account. Every static-site form service works this way, because the
     key has to reach the browser to be usable at all.

     >> IF YOU FORKED THIS REPO: replace the key below with your own, or the
        messages will be delivered to the original author's inbox.
        Get one free in ~30 seconds at https://web3forms.com — no signup,
        they email you the key.

     >> RECOMMENDED: in the Web3Forms dashboard, restrict the key to your own
        domain. A copied key is then useless anywhere else. Without that, the
        only real risk is someone burning your monthly submission quota.
     ---------------------------------------------------------------------- */
  WEB3FORMS_KEY: '244d240d-0bc4-40ff-b283-7520042ae603',
  WEB3FORMS_ENDPOINT: 'https://api.web3forms.com/submit',

  /* ------------------------------------------------------------------------
     GITHUB
     ------------------------------------------------------------------------
     Used to pull live star counts, languages, and the contribution heatmap.
     Set LIVE_GITHUB to false to skip both network calls entirely — the site
     then renders purely from js/data.js.
     ---------------------------------------------------------------------- */
  GITHUB_USER: 'kamalahmed',
  LIVE_GITHUB: true,

  /* Unauthenticated GitHub API allows 60 requests/hour per IP. Responses are
     cached in sessionStorage so a visitor clicking around doesn't re-fetch. */
  CACHE_MINUTES: 30,

  /* Third-party mirror of the GitHub contribution graph. GitHub itself has no
     public API for this. If it is down, the heatmap shows an honest empty
     state rather than invented data. */
  CONTRIB_API: 'https://github-contributions-api.jogruber.de/v4/',

  /* ------------------------------------------------------------------------
     TYPED STRIP  —  the rotating line under the hero
     ------------------------------------------------------------------------
     Add, remove, or reorder freely. They cycle forever.
     ---------------------------------------------------------------------- */
  TYPED_LINES: [
    'const kamal = { role: "Full-stack Engineer", ships: true };',
    'git commit -m "I think, then I build" && git push',
    'while (awake) { build(); learn(); ship(); }'
  ],

  /* Typing speed in milliseconds per character. */
  TYPE_SPEED: 52,
  ERASE_SPEED: 24,
  HOLD_MS: 1700,

  /* ------------------------------------------------------------------------
     FEATURE SWITCHES
     ------------------------------------------------------------------------
     Turn any of these off if you don't want that part of the site.
     ---------------------------------------------------------------------- */
  features: {
    sound: true,       /* game sound effects (off by default for visitors)   */
    games: true,       /* the entire ~/playground section                    */
    badgeSwing: true,  /* draggable pendulum ID card                         */
    reveal: true       /* fade-in-on-scroll animations                       */
  },

  /* localStorage keys. Namespaced so they don't collide with anything else
     on the same origin. */
  storage: {
    theme: 'tp-theme',
    mute: 'tp-mute'
  }
};
