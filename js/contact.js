/* ==========================================================================
   ~/contact
   ==========================================================================
   Submits the contact form to Web3Forms and renders the terminal-style
   confirmation.

   PROGRESSIVE ENHANCEMENT
   -----------------------
   The <form> in index.html has a real `action` and `method`. With JavaScript
   disabled it still submits — the browser just navigates to the Web3Forms
   thank-you page instead of staying put. Everything below is an upgrade on
   top of behaviour that already works.

   HONESTY NOTE
   ------------
   The success report is only rendered after the API actually confirms
   delivery. Failures are shown as failures, with the real reason where the
   API gives one.

   SETUP: put your own key in js/config.js → WEB3FORMS_KEY
   ========================================================================== */

window.TP = window.TP || {};

window.TP.contact = (function () {
  'use strict';

  const { $, el, esc } = window.TP.utils;

  /* Rendered when the key hasn't been configured, so a fork doesn't silently
     post messages into someone else's inbox. */
  const NO_KEY_MESSAGE =
    'Form not configured yet — set WEB3FORMS_KEY in js/config.js. ' +
    'In the meantime, email works.';

  /** Build the "what I can help with" checklist from data.js. */
  function renderServices() {
    const list = $('#serviceList');
    if (!list) return;

    list.innerHTML = '';
    (window.TP.SERVICES || []).forEach(text => {
      list.append(el('li', { class: 'service-item' }, el('span', {}, text)));
    });
  }

  function showError(message) {
    const box = $('#formError');
    if (!box) return;
    box.textContent = '! ' + message;
    box.hidden = false;
  }

  function clearError() {
    const box = $('#formError');
    if (box) box.hidden = true;
  }

  /**
   * Replace the form with a terminal-style delivery report.
   * Only called after the API confirms the message was actually sent.
   */
  function showSuccess(name) {
    const body = $('#contactBody');
    if (!body) return;

    body.innerHTML =
      '<p class="accent-green contact-cmd">$ ./send-message --from "' + esc(name) + '"</p>' +
      '<div class="form-sent">' +
        '<div><span class="arrow">›</span> packaging message............. <span class="ok">done</span></div>' +
        '<div><span class="arrow">›</span> delivering to kamal@dev........ <span class="ok">✓ 200 OK</span></div>' +
        '<p class="form-sent-final">Thanks, ' + esc(name) + '! Your message is in my inbox. Talk soon.</p>' +
      '</div>';

    // Move focus so screen readers announce the outcome rather than leaving
    // the user on a button that no longer exists.
    body.setAttribute('tabindex', '-1');
    body.focus({ preventScroll: true });
  }

  async function handleSubmit(e) {
    const form = e.target;
    const cfg = window.TP.config;
    const key = cfg.WEB3FORMS_KEY;

    // No key configured: block the submit rather than posting nowhere useful.
    if (!key || key.indexOf('YOUR') === 0) {
      e.preventDefault();
      showError(NO_KEY_MESSAGE);
      return;
    }

    // Let the browser's own validation run first. If it fails, fall through
    // to the native error bubbles.
    if (!form.checkValidity()) return;

    // From here we handle it ourselves.
    e.preventDefault();
    clearError();

    const button = $('#formSubmit');
    const originalLabel = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'sending…';
    }

    // Serialise the form, including the hidden access_key and honeypot.
    const payload = Object.fromEntries(new FormData(form).entries());
    const name = (payload.name || 'friend').trim();

    try {
      const res = await fetch(cfg.WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        showSuccess(name);
        return;
      }

      // Surface the API's own reason when it gives one.
      showError((data && data.message) || `Delivery failed (HTTP ${res.status}). Please email me instead.`);

    } catch (err) {
      // Network-level failure: offline, DNS, blocked by an extension.
      showError('Could not reach the mail service — check your connection, or email me directly.');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  }

  function init() {
    renderServices();

    const form = $('#contactForm');
    if (!form) return;

    // Inject the key from config so it lives in exactly one place.
    const keyField = $('#formAccessKey');
    if (keyField) keyField.value = window.TP.config.WEB3FORMS_KEY || '';

    form.addEventListener('submit', handleSubmit);

    // Clear a stale error as soon as the visitor starts fixing it.
    form.addEventListener('input', clearError);
  }

  return { init };
})();
