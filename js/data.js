/* ==========================================================================
   DATA
   ==========================================================================
   The content of every repeating list on the page. Prose (your name, bio,
   headings) lives directly in index.html — only lists live here, so nothing
   is duplicated between the two files.

   Edit these arrays and refresh. No build step.
   ========================================================================== */

window.TP = window.TP || {};

/* ==========================================================================
   PROJECTS
   ==========================================================================
   HOW TO ADD A PROJECT
   --------------------
   Copy any object below and change the fields. It will appear automatically
   in the ~/work terminal, and also in the ~/apps card grid if you set
   `featured: true`.

   FIELDS
   ------
   id        Unique slug. IMPORTANT: if your GitHub repo has the same name,
             live star counts and languages are fetched automatically.
             Make this match the repo name exactly.
   name      Display name.
   tagline   One sentence. Keep it under ~90 characters so cards stay even.
   type      'app' | 'plugin' | 'oss' | 'tool'
             Drives the `ls apps` / `ls plugins` / `ls oss` filters and the
             glyph shown in terminal listings.
   language  Primary language. Coloured by LANG_COLOR below. Overwritten by
             the live GitHub value when available.
   stack     Array of short tech tags shown on the card.
   live      Public URL, or '' if there isn't one. Controls the "visit" button.
   repo      Source URL, or null to hide the "source" button entirely
             (use null for projects whose code isn't public).
   featured  true = also appears as a card in ~/apps.
   image     Card screenshot. See images/README.md for sizing.
   stars     Fallback star count shown before the live GitHub fetch lands.
   ========================================================================== */

window.TP.PROJECTS = [

  /* ---- Featured: shown as cards in ~/apps ---- */
  {
    id: 'deployward',
    name: 'Deployward',
    tagline: 'Zero-downtime deploy dashboard — ship releases with confidence.',
    type: 'app',
    language: 'PHP',
    stack: ['Next.js', 'Node', 'Postgres'],
    live: '',
    repo: 'https://github.com/kamalahmed/deployward',
    featured: true,
    image: 'images/projects/deployward.svg',
    stars: 1
  },
  {
    id: 'licensekit',
    name: 'LicenseKit',
    tagline: 'License key generation, activation & validation API for indie software.',
    type: 'app',
    language: 'PHP',
    stack: ['Node', 'Stripe', 'Edge'],
    live: '',
    repo: 'https://github.com/kamalahmed/licensekit',
    featured: true,
    image: 'images/projects/licensekit.svg',
    stars: 2
  },
  {
    id: 'itinerly',
    name: 'Itinerly',
    tagline: 'AI trip planner that turns a prompt into a day-by-day itinerary.',
    type: 'app',
    language: 'TypeScript',
    stack: ['Next.js', 'LLM', 'Maps'],
    live: '',
    repo: 'https://github.com/kamalahmed/itinerly',
    featured: true,
    image: 'images/projects/itinerly.svg',
    stars: 0
  },
  {
    id: 'invoicer',
    name: 'Invoicer',
    tagline: 'Fast, clean invoicing for freelancers — create, send & track.',
    type: 'app',
    language: 'TypeScript',
    stack: ['Next.js', 'React'],
    live: 'https://invoicer.kamalahmed.me/',
    repo: 'https://github.com/kamalahmed/invoicer',
    featured: true,
    image: 'images/projects/invoicer.svg',
    stars: 1
  },
  {
    id: 'ibrain',
    name: 'iBrain',
    tagline: 'AI second-brain — capture notes and ask your knowledge anything.',
    type: 'app',
    language: 'TypeScript',
    stack: ['Next.js', 'LLM', 'Vector DB'],
    live: 'https://ibrain.kamalahmed.me/',
    repo: 'https://github.com/kamalahmed/ibrain',
    featured: true,
    image: 'images/projects/ibrain.svg',
    stars: 1
  },

  /* ---- Terminal-only: listed in ~/work, no card ---- */
  {
    id: 'essential-addons-for-elementor-lite',
    name: 'Essential Addons for Elementor',
    tagline: 'Widely-used Elementor addon library — dozens of widgets, millions of installs.',
    type: 'plugin',
    language: 'PHP',
    stack: ['WordPress', 'Elementor'],
    live: 'https://wordpress.org/plugins/essential-addons-for-elementor-lite/',
    /* Maintained under the WPDeveloper organisation, not a personal repo,
       so the "source" button is hidden for this one. */
    repo: null,
    featured: false,
    image: 'images/projects/essential-addons.svg'
  },
  {
    id: 'embedpress',
    name: 'EmbedPress',
    tagline: 'Embed 150+ content sources into WordPress with a single URL.',
    type: 'plugin',
    language: 'PHP',
    stack: ['WordPress', 'Gutenberg'],
    live: 'https://wordpress.org/plugins/embedpress/',
    repo: null,
    featured: false,
    image: 'images/projects/embedpress.svg'
  },
  {
    id: 'image-placeholder-app',
    name: 'Image Placeholder APP',
    tagline: 'Generate placeholder images for your projects. You upload your image and get placeholders',
    type: 'plugin',
    language: 'Javascript',
    stack: ['JavaScript', 'HTML', 'CSS'],
    live: '',
    repo: 'https://github.com/kamalahmed/image-placeholder-app',
    featured: true,
    image: 'images/projects/image-placeholder-app.png',
    stars: 5
  },
  {
    id: 'whatsapp-ai',
    name: 'WhatsApp AI',
    tagline: 'Multi-model AI chat over WhatsApp, built on Next.js.',
    type: 'app',
    language: 'TypeScript',
    stack: ['Next.js', 'LLM'],
    live: '',
    repo: 'https://github.com/kamalahmed/whatsapp-ai',
    featured: false,
    image: 'images/projects/whatsapp-ai.svg',
    stars: 1
  },
  {
    id: 'divine-prayer',
    name: 'Divine Prayer',
    tagline: 'Chrome extension with prayer times, reminders & Qibla.',
    type: 'app',
    language: 'JavaScript',
    stack: ['Chrome', 'APIs'],
    live: '',
    repo: 'https://github.com/kamalahmed/divine-prayer',
    featured: false,
    image: 'images/projects/divine-prayer.svg',
    stars: 3
  },
  {
    id: 'code-screenshot',
    name: 'Code Screenshot',
    tagline: 'Turn source code into beautiful shareable images (Node.js).',
    type: 'tool',
    language: 'JavaScript',
    stack: ['Node'],
    live: '',
    repo: 'https://github.com/kamalahmed/code-screenshot',
    featured: false,
    image: 'images/projects/code-screenshot.svg',
    stars: 2
  },
  {
    id: 'list-of-places-in-bangladesh',
    name: 'list-of-places-in-bangladesh',
    tagline: 'Structured PHP dataset of divisions, districts & upazilas.',
    type: 'oss',
    language: 'PHP',
    stack: ['Dataset'],
    live: '',
    repo: 'https://github.com/kamalahmed/list-of-places-in-bangladesh',
    featured: false,
    image: 'images/projects/list-of-places-in-bangladesh.svg',
    stars: 28
  }
];

/* ==========================================================================
   SKILLS
   ==========================================================================
   Each group becomes a column in ~/skills. Each item is [name, percentage].
   Bars animate from 0 to the percentage when the section scrolls into view.
   ========================================================================== */
window.TP.SKILL_GROUPS = [
  {
    label: 'languages',
    items: [['PHP', 96], ['JavaScript', 93], ['TypeScript', 88], ['SQL', 82]]
  },
  {
    label: 'frameworks',
    items: [['WordPress', 97], ['React', 89], ['Next.js', 86], ['Node.js', 88]]
  },
  {
    label: 'practices',
    items: [['Clean architecture', 93], ['Automation', 91], ['AI prototyping', 85], ['CI / CD', 83]]
  },
  {
    label: 'tools',
    items: [['Git', 95], ['Elementor', 92], ['Gutenberg', 88], ['Docker', 80]]
  }
];

/* ==========================================================================
   SERVICES
   ==========================================================================
   The "what I can help with" checklist in the ~/contact sidebar.
   ========================================================================== */
window.TP.SERVICES = [
  'WordPress plugins & themes — from scratch or rescue',
  'Full-stack web apps — React / Next.js / Node',
  'Automations & third-party integrations',
  'AI prototyping & fast MVPs'
];

/* ==========================================================================
   LANGUAGE COLOURS
   ==========================================================================
   Roughly GitHub's own palette. Any language not listed falls back to a
   neutral grey. Add your own as needed.
   ========================================================================== */
window.TP.LANG_COLOR = {
  TypeScript: '#3178c6',
  JavaScript: '#c9a227',
  PHP:        '#7481c9',
  Go:         '#00ADD8',
  Python:     '#3572A5',
  CSS:        '#563d7c',
  HTML:       '#e34c26',
  Vue:        '#41b883',
  'C++':      '#f34b7d',
  JSON:       '#888888'
};
