/* ==========================================================================
   ~/work TERMINAL
   ==========================================================================
   The interactive project browser.

   HOW TO ADD A COMMAND
   --------------------
   Add an entry to the COMMANDS array below. Each has:
     match(input)  -> true if this command should handle the typed string
     run(input)    -> an entry object describing what to print
   Then add a line to HELP_TEXT so people can discover it.

   Output entries are one of:
     { kind: 'text',   text }        plain pre-formatted output
     { kind: 'list',   filter }      a table of projects
     { kind: 'detail', id }          one expanded project
   ========================================================================== */

window.TP = window.TP || {};

window.TP.terminal = (function () {
  'use strict';

  const { $, el, esc, langColor, starLabel, glyph } = window.TP.utils;

  /* Scrollback. Each item is { cmd, kind, ... }. */
  let history = [];

  /* Command history for the up/down arrow keys. */
  let recent = [];
  let recentIndex = -1;

  const HELP_TEXT =
    'Available commands:\n' +
    '  ls            list all projects\n' +
    '  ls apps       filter apps\n' +
    '  ls plugins    filter WordPress plugins\n' +
    '  ls oss        filter open-source / tools\n' +
    '  open <name>   open a project  (e.g. open invoicer)\n' +
    '  whoami        about me\n' +
    '  coffee        refuel\n' +
    '  clear         clear the screen\n\n' +
    'Tip: ↑ / ↓ walk through your command history.';

  const COFFEE_ART =
    '      ( (\n' +
    '       ) )\n' +
    '    ........\n' +
    '    |      |]   brewing... clean code needs caffeine.\n' +
    '    \\      /\n' +
    "     '----'";

  const WHOAMI =
    'Kamal Ahmed · Full-stack Software Engineer\n' +
    'Dubai, UAE · 12+ years · open to work since 2014';

  /* ==========================================================================
     COMMANDS
     ========================================================================== */
  const COMMANDS = [
    {
      match: c => c === 'clear',
      run: () => { history = []; return null; }
    },
    {
      match: c => c === 'help' || c === '?',
      run: () => ({ kind: 'text', text: HELP_TEXT })
    },
    {
      match: c => c === 'whoami',
      run: () => ({ kind: 'text', text: WHOAMI })
    },
    {
      match: c => c === 'coffee',
      run: () => ({ kind: 'text', text: COFFEE_ART })
    },
    {
      match: c => c.startsWith('sudo'),
      run: () => ({
        kind: 'text',
        text: 'kamal is not in the sudoers file. This incident will be reported. ' +
              "(relax — it's a portfolio)"
      })
    },
    {
      match: c => c === 'ls' || c === 'ls ~/projects',
      run: () => ({ kind: 'list', filter: 'all' })
    },
    {
      match: c => c === 'ls apps',
      run: () => ({ kind: 'list', filter: 'app' })
    },
    {
      match: c => c === 'ls plugins',
      run: () => ({ kind: 'list', filter: 'plugin' })
    },
    {
      match: c => c === 'ls oss',
      run: () => ({ kind: 'list', filter: 'oss' })
    },
    {
      match: c => c.startsWith('open ') || c.startsWith('cat '),
      run: (raw) => {
        const query = raw.replace(/^(open|cat)\s+/i, '')
                         .replace(/\.md$/i, '')
                         .toLowerCase()
                         .trim();

        const projects = window.TP.projects.all();
        const hit =
          projects.find(p => p.id === query) ||
          projects.find(p => p.name.toLowerCase() === query) ||
          projects.find(p => p.name.toLowerCase().includes(query));

        return hit
          ? { kind: 'detail', id: hit.id }
          : { kind: 'text', text: `open: '${query}' not found. Try 'ls'.` };
      }
    }
  ];

  /* ==========================================================================
     RUN
     ========================================================================== */
  function run(rawInput) {
    const cmd = (rawInput || '').trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();

    // Remember for arrow-key recall (skip consecutive duplicates).
    if (recent[recent.length - 1] !== cmd) recent.push(cmd);
    recentIndex = recent.length;

    const handler = COMMANDS.find(c => c.match(lower));

    if (!handler) {
      history.push({
        cmd,
        kind: 'text',
        text: `zsh: command not found: ${cmd}\nType 'help' for commands.`
      });
      return render();
    }

    const result = handler.run(lower === cmd ? cmd : cmd);
    if (result) history.push(Object.assign({ cmd }, result));
    render();
  }

  /* ==========================================================================
     RENDER
     ========================================================================== */
  function render() {
    const out = $('#termOut');
    if (!out) return;

    out.innerHTML = '';
    history.forEach(entry => out.append(buildEntry(entry)));

    // Keep the newest output in view.
    out.scrollTop = out.scrollHeight;
  }

  function buildEntry(entry) {
    const cell = el('div', { class: 'term-entry' });

    // Echo the command back, styled like a real prompt.
    cell.append(el('div', {
      class: 'term-echo',
      html: '<span class="u">kamal@dev</span> <span class="p">~/projects</span> $ ' +
            '<span class="c">' + esc(entry.cmd) + '</span>'
    }));

    if (entry.kind === 'list') {
      cell.append(buildList(entry.filter));
    } else if (entry.kind === 'detail') {
      cell.append(buildDetail(entry.id));
    } else {
      cell.append(el('pre', { class: 'term-text' }, entry.text));
    }

    return cell;
  }

  function buildList(kind) {
    const projects = window.TP.projects.filter(kind);
    const wrap = document.createDocumentFragment();

    wrap.append(el('div', { class: 'term-meta' },
      `total ${projects.length} · ${kind === 'all' ? 'all projects' : kind}`));

    projects.forEach(p => {
      const stars = starLabel(p);

      // A <button> rather than a <div>: keyboard focusable and announced as
      // interactive, which a click-handled div is not.
      wrap.append(el('button', {
        class: 'term-row',
        type: 'button',
        onClick: () => run('open ' + p.id)
      },
        el('span', { class: 'term-row-glyph' }, glyph(p)),
        el('span', {},
          el('span', { class: 'term-row-name' }, p.name),
          el('span', { class: 'term-row-desc' }, ' — ' + p.tagline)
        ),
        el('span', { class: 'term-row-meta' },
          el('span', { style: 'color:' + langColor(p.language) }, '● ' + p.language),
          stars ? el('span', { style: 'color:var(--amber)' }, stars) : null
        )
      ));
    });

    return wrap;
  }

  function buildDetail(id) {
    const p = window.TP.projects.all().find(x => x.id === id);
    if (!p) return el('pre', { class: 'term-text' }, 'open: project not found.');

    const links = el('div', { class: 'term-detail-links' });

    if (p.live) {
      links.append(el('a', {
        class: 'btn btn-primary btn-sm', href: p.live, target: '_blank', rel: 'noopener'
      }, 'visit live ↗'));
    }
    if (p.repo) {
      links.append(el('a', {
        class: 'btn btn-ghost btn-sm', href: p.repo, target: '_blank', rel: 'noopener'
      }, 'view source'));
    }
    if (!p.live && !p.repo) {
      links.append(el('span', { class: 'term-meta' }, '// private project — no public link'));
    }

    const stars = starLabel(p);

    return el('div', { class: 'term-detail' },
      el('div', { class: 'term-detail-head' },
        el('span', { class: 'term-detail-title' }, '# ' + p.name),
        el('span', { style: 'color:' + langColor(p.language) + ';font-size:12px' },
          '● ' + p.language),
        stars ? el('span', { style: 'color:var(--amber);font-size:12px' }, stars) : null
      ),
      el('p', { class: 'term-detail-desc' }, p.tagline),
      links
    );
  }

  /* ==========================================================================
     INIT
     ========================================================================== */
  function init() {
    const form = $('#termForm');
    const input = $('#termInput');
    const chips = $('#termChips');

    if (form && input) {
      // A real <form> means Enter submits natively and mobile keyboards show
      // a "go" key instead of a newline key.
      form.addEventListener('submit', e => {
        e.preventDefault();
        run(input.value);
        input.value = '';
      });

      // Up/down walk back through previously typed commands.
      input.addEventListener('keydown', e => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        if (!recent.length) return;
        e.preventDefault();

        if (e.key === 'ArrowUp') recentIndex = Math.max(0, recentIndex - 1);
        else recentIndex = Math.min(recent.length, recentIndex + 1);

        input.value = recent[recentIndex] || '';
        // Put the caret at the end rather than wherever it was.
        requestAnimationFrame(() => {
          input.setSelectionRange(input.value.length, input.value.length);
        });
      });
    }

    if (chips) {
      chips.addEventListener('click', e => {
        const btn = e.target.closest('[data-cmd]');
        if (btn) run(btn.dataset.cmd);
      });
    }

    // Open with a directory listing, the way you'd start in a real shell.
    run('ls');
  }

  return { init, run, rerender: render };
})();
