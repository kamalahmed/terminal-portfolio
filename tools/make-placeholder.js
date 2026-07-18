#!/usr/bin/env node
/* ==========================================================================
   PLACEHOLDER GENERATOR
   ==========================================================================
   Creates terminal-styled SVG placeholder cards for projects that don't have
   a real screenshot yet.

   You usually DON'T need this. If a project in js/data.js has no `image`
   field, the site draws a CSS placeholder automatically — theme-aware,
   responsive, and zero files. Reach for this script when you want an actual
   image FILE: a README banner, a social preview, or something to hand to
   someone outside the site.

   No dependencies. Node 18+ (uses built-in fetch).

   ------------------------------------------------------------------------
   USAGE
   ------------------------------------------------------------------------
   From a GitHub repo — pulls name, description, language and stars:

     node tools/make-placeholder.js kamalahmed/invoicer
     node tools/make-placeholder.js https://github.com/kamalahmed/invoicer

   Manually, for private work or non-GitHub projects:

     node tools/make-placeholder.js --id acme --name "Acme App" \
       --language PHP --stack "WordPress,REST" \
       --tagline "Internal ops dashboard."

   Every project in js/data.js that has no image file yet:

     node tools/make-placeholder.js --all

   ------------------------------------------------------------------------
   OPTIONS
   ------------------------------------------------------------------------
     --id <slug>        Output filename (default: repo name or slugified name)
     --name <text>      Display name shown large on the card
     --language <lang>  Drives the accent dot colour
     --stack <a,b,c>    Up to three short tech tags
     --tagline <text>   Optional line under the name
     --theme <t>        dark (default) | light
     --out <dir>        Output directory (default: images/projects)
     --width <px>       Default 640
     --height <px>      Default 400  (16:10 matches the card aspect ratio)
     --force            Overwrite an existing file
     --quiet            Only print the output path
     --help             Show this text

   ------------------------------------------------------------------------
   AFTER GENERATING
   ------------------------------------------------------------------------
   Point the project at the new file in js/data.js:

     image: 'images/projects/<id>.svg'

   Remove that line again and the CSS placeholder takes over.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

/* ==========================================================================
   THEME
   ==========================================================================
   These mirror css/01-variables.css. If you restyle the site, update the
   matching values here so generated files stay consistent.

   (This duplication is exactly why the in-page CSS placeholder is preferred —
   it reads the real variables and can never drift.)
   ========================================================================== */
const THEMES = {
  dark: {
    panel:  '#0e1412',
    panel2: '#0b100f',
    line:   '#1b2b23',
    ink:    '#f4f8f6',
    muted:  '#9fb0a7',
    dim:    '#6b7b73',
    green:  '#5ee6a0'
  },
  light: {
    panel:  '#ffffff',
    panel2: '#f2f5f2',
    line:   '#d3ded7',
    ink:    '#0e1a14',
    muted:  '#586962',
    dim:    '#78867e',
    green:  '#0e8f52'
  }
};

/* Language accent colours — keep in sync with LANG_COLOR in js/data.js. */
const LANG_COLOR = {
  TypeScript: '#3178c6',
  JavaScript: '#c9a227',
  PHP:        '#7481c9',
  Go:         '#00ADD8',
  Python:     '#3572A5',
  Ruby:       '#701516',
  Rust:       '#dea584',
  Java:       '#b07219',
  'C++':      '#f34b7d',
  CSS:        '#563d7c',
  HTML:       '#e34c26',
  Vue:        '#41b883',
  Shell:      '#89e051'
};

const FONT = 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/* ==========================================================================
   HELPERS
   ========================================================================== */

/** Escape text for safe inclusion in SVG markup. */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[c]));

/** "My Cool App" -> "my-cool-app" */
const slugify = s => String(s)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * Truncate to a character budget, adding an ellipsis.
 * SVG has no text wrapping, so long strings must be cut to fit.
 */
function truncate(text, max) {
  const s = String(text || '');
  return s.length <= max ? s : s.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

/**
 * Pick a font size that keeps `text` inside `maxWidth`.
 * JetBrains Mono glyphs are ~0.6em wide, which is accurate enough here.
 */
function fitFontSize(text, maxWidth, startSize, minSize) {
  const CHAR_RATIO = 0.6;
  let size = startSize;
  while (size > minSize && String(text).length * size * CHAR_RATIO > maxWidth) size--;
  return size;
}

/** Minimal argv parser: --key value, --flag, and one bare positional. */
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) { out._.push(arg); continue; }

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;            // boolean flag
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/* ==========================================================================
   SVG TEMPLATE
   ==========================================================================
   Mirrors the CSS placeholder: window chrome, a prompt line, the project
   name, a language dot, and stack tags.
   ========================================================================== */
function renderSVG(project, opts) {
  const C = THEMES[opts.theme] || THEMES.dark;
  const W = opts.width;
  const H = opts.height;

  const accent = LANG_COLOR[project.language] || C.green;
  const pad = Math.round(W * 0.0625);      // 40px at 640 wide
  const barH = Math.round(H * 0.115);      // 46px at 400 tall
  const inner = W - pad * 2;

  /* ---- Title bar ---- */
  const bar =
    `<rect x="0" y="0" width="${W}" height="${barH}" fill="${C.panel2}"/>
     <line x1="0" y1="${barH}" x2="${W}" y2="${barH}" stroke="${C.line}"/>
     <circle cx="${pad * 0.65}" cy="${barH / 2}" r="5.5" fill="#ff5f56"/>
     <circle cx="${pad * 0.65 + 19}" cy="${barH / 2}" r="5.5" fill="#ffbd2e"/>
     <circle cx="${pad * 0.65 + 38}" cy="${barH / 2}" r="5.5" fill="#27c93f"/>
     <text x="${pad * 0.65 + 60}" y="${barH / 2 + 4.5}" font-family="${FONT}"
       font-size="12.5" fill="${C.dim}">~/${esc(truncate(project.id, 42))}</text>`;

  /* ---- Stack tags, laid out left to right ---- */
  let tags = '';
  let tagX = pad;
  const tagY = Math.round(H * 0.75);
  (project.stack || []).slice(0, 3).forEach(tag => {
    const label = truncate(tag, 16);
    const tw = label.length * 8.4 + 22;
    if (tagX + tw > W - pad) return;       // out of room — skip the rest
    tags +=
      `<rect x="${tagX}" y="${tagY}" width="${Math.round(tw)}" height="27" rx="5"
         fill="none" stroke="${C.line}"/>
       <text x="${tagX + 11}" y="${tagY + 18}" font-family="${FONT}"
         font-size="12" fill="${C.muted}">${esc(label)}</text>`;
    tagX += tw + 9;
  });

  /* ---- Optional tagline, only when there's vertical room ---- */
  const tagline = project.tagline
    ? `<text x="${pad}" y="${Math.round(H * 0.665)}" font-family="${FONT}"
         font-size="13" fill="${C.muted}">${esc(truncate(project.tagline, Math.floor(inner / 7.8)))}</text>`
    : '';

  /* ---- Name, shrunk to fit ---- */
  const nameSize = fitFontSize(project.name, inner, Math.round(H * 0.095), 18);

  /* ---- Star count, top right ---- */
  const stars = (typeof project.stars === 'number' && project.stars > 0)
    ? `<text x="${W - pad}" y="${Math.round(H * 0.33)}" text-anchor="end"
         font-family="${FONT}" font-size="13" fill="#f0c17a">★ ${project.stars}</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
     viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(project.name)}">
  <defs>
    <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="${C.green}" opacity="0.07"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="${C.panel}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  ${bar}

  <text x="${pad}" y="${Math.round(H * 0.33)}" font-family="${FONT}"
    font-size="15" fill="${C.green}">$ open ${esc(truncate(project.id, 34))}</text>
  ${stars}

  <text x="${pad}" y="${Math.round(H * 0.49)}" font-family="${FONT}"
    font-size="${nameSize}" font-weight="700" fill="${C.ink}">${esc(project.name)}</text>

  <circle cx="${pad + 6}" cy="${Math.round(H * 0.593)}" r="5" fill="${accent}"/>
  <text x="${pad + 20}" y="${Math.round(H * 0.608)}" font-family="${FONT}"
    font-size="14" fill="${accent}">${esc(project.language || 'Code')}</text>

  ${tagline}
  ${tags}

  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${C.line}"/>
</svg>
`;
}

/* ==========================================================================
   GITHUB
   ========================================================================== */

/** Accepts "owner/repo" or a full github.com URL. */
function parseRepoSlug(input) {
  const cleaned = String(input)
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
  const parts = cleaned.split('/');
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  return { owner: parts[0], repo: parts[1] };
}

async function fetchRepo(slug) {
  const url = `https://api.github.com/repos/${slug.owner}/${slug.repo}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'terminal-portfolio-placeholder-generator'
    }
  });

  if (res.status === 404) throw new Error(`Repo not found: ${slug.owner}/${slug.repo}`);
  if (res.status === 403) {
    throw new Error('GitHub rate limit reached (60/hour for anonymous requests). ' +
      'Wait a while, or pass the details manually with --name / --language / --stack.');
  }
  if (!res.ok) throw new Error(`GitHub returned HTTP ${res.status}`);

  const data = await res.json();

  return {
    id: data.name,
    name: data.name,
    language: data.language || 'Code',
    tagline: data.description || '',
    stars: data.stargazers_count,
    // topics make reasonable stack tags; fall back to the language.
    stack: (data.topics && data.topics.length)
      ? data.topics.slice(0, 3)
      : [data.language].filter(Boolean)
  };
}

/* ==========================================================================
   data.js  (for --all)
   ==========================================================================
   data.js is a browser file assigning to window.TP, so it can't simply be
   require()d. We evaluate it against a stub global instead — no parsing, and
   it stays correct if the file's shape changes.
   ========================================================================== */
function loadProjects(root) {
  const file = path.join(root, 'js', 'data.js');
  if (!fs.existsSync(file)) throw new Error('Could not find js/data.js — run this from the project root.');

  const source = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', source)(sandbox.window);

  const projects = sandbox.window.TP && sandbox.window.TP.PROJECTS;
  if (!Array.isArray(projects)) throw new Error('No PROJECTS array found in js/data.js');
  return projects;
}

/* ==========================================================================
   WRITE
   ========================================================================== */
function write(project, opts) {
  const dir = path.resolve(opts.out);
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, project.id + '.svg');

  if (fs.existsSync(file) && !opts.force) {
    return { file, skipped: true };
  }

  fs.writeFileSync(file, renderSVG(project, opts));
  return { file, skipped: false };
}

/* ==========================================================================
   MAIN
   ========================================================================== */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    // Print the usage block from this file's own header.
    const header = fs.readFileSync(__filename, 'utf8').split('USAGE')[1].split('*/')[0];
    console.log('\nUSAGE' + header);
    return;
  }

  const root = process.cwd();
  const opts = {
    theme:  args.theme || 'dark',
    out:    args.out || path.join('images', 'projects'),
    width:  parseInt(args.width, 10) || 640,
    height: parseInt(args.height, 10) || 400,
    force:  !!args.force,
    quiet:  !!args.quiet
  };

  if (!THEMES[opts.theme]) {
    throw new Error(`Unknown theme "${opts.theme}". Use dark or light.`);
  }

  const log = (...a) => { if (!opts.quiet) console.log(...a); };

  /* ---- Mode 1: --all, every project in data.js missing an image ---- */
  if (args.all) {
    const projects = loadProjects(root);
    let made = 0, skipped = 0;

    for (const p of projects) {
      // Projects with a real image already are left alone.
      if (p.image && fs.existsSync(path.join(root, p.image)) && !opts.force) {
        skipped++;
        continue;
      }

      const result = write({
        id: p.id,
        name: p.name,
        language: p.language,
        tagline: p.tagline,
        stack: p.stack,
        stars: p.stars
      }, opts);

      if (result.skipped) { skipped++; continue; }
      made++;
      log('  created  ' + path.relative(root, result.file));
    }

    log(`\n${made} created, ${skipped} skipped (already had an image).`);
    if (made) log('Point each project at its file in js/data.js:  image: \'images/projects/<id>.svg\'');
    return;
  }

  /* ---- Mode 2: a GitHub repo ---- */
  let project = null;
  const positional = args._[0];

  if (positional) {
    const slug = parseRepoSlug(positional);
    if (!slug) throw new Error(`Could not read "${positional}" as owner/repo or a GitHub URL.`);
    log(`Fetching ${slug.owner}/${slug.repo} from GitHub…`);
    project = await fetchRepo(slug);
  }

  /* ---- Mode 3: manual flags (also override anything fetched above) ---- */
  const manual = {
    id: args.id,
    name: args.name,
    language: args.language,
    tagline: args.tagline,
    stack: typeof args.stack === 'string'
      ? args.stack.split(',').map(s => s.trim()).filter(Boolean)
      : undefined,
    stars: args.stars ? parseInt(args.stars, 10) : undefined
  };

  if (!project) {
    if (!manual.name && !manual.id) {
      throw new Error(
        'Nothing to generate.\n\n' +
        '  From GitHub:  node tools/make-placeholder.js owner/repo\n' +
        '  Manually:     node tools/make-placeholder.js --name "My App" --language PHP\n' +
        '  Everything:   node tools/make-placeholder.js --all\n\n' +
        'Run with --help for all options.'
      );
    }
    project = {};
  }

  for (const key of Object.keys(manual)) {
    if (manual[key] !== undefined) project[key] = manual[key];
  }

  project.name = project.name || project.id;
  project.id = slugify(project.id || project.name);
  project.language = project.language || 'Code';

  const result = write(project, opts);

  if (result.skipped) {
    console.error(`\n${path.relative(root, result.file)} already exists. Pass --force to overwrite.`);
    process.exitCode = 1;
    return;
  }

  if (opts.quiet) {
    console.log(path.relative(root, result.file));
  } else {
    const rel = path.relative(root, result.file);
    log(`\nCreated ${rel}`);
    log('\nAdd it to js/data.js:');
    log(`  image: '${rel.split(path.sep).join('/')}'`);
  }
}

main().catch(err => {
  console.error('\n' + err.message + '\n');
  process.exit(1);
});
