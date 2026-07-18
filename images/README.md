# Images

## TL;DR

**A new project needs no image at all.** Leave `image` out of its entry in
`js/data.js` and the card draws a CSS placeholder that matches the site's
theme automatically.

Only add a file when you have a real screenshot, or when you need an image you
can use *outside* the page.

---

## Recommended sizes

| What | Size | Format | Notes |
|---|---|---|---|
| Project screenshot | **1280×800** | PNG or JPG | 16:10 — the card's exact aspect ratio. Cropped to fill, so keep the subject centred. |
| Your photo | **400×400** | JPG | Square. Displayed as a 68px circle, so 400px is plenty. |
| Social / OG card | **1200×630** | PNG or JPG | Must not be SVG — most platforms won't render it. |
| Favicon | 64×64 | SVG | |

Keep screenshots under ~300 KB. They're lazy-loaded, but a portfolio shouldn't
ship megabytes of PNGs. [Squoosh](https://squoosh.app) is a good free
compressor — JPG at quality 80 is usually indistinguishable and a fraction of
the size.

---

## Current files

| File | Used by |
|---|---|
| `id-pic.jpeg` | The ID badge in the hero |
| `avatar.svg` | Fallback portrait, if you'd rather not use a photo |
| `favicon.svg` | Browser tab |
| `og-cover.png` | Social sharing previews |
| `og-cover.svg` | Editable source for the PNG above |
| `projects/*.png` | Real project screenshots |

---

## Adding a project screenshot

1. Save it as `projects/<project-id>.png` — the id is the `id` field from
   `js/data.js`.
2. Point the project at it:

```js
{
  id: 'invoicer',
  image: 'images/projects/invoicer.png',
  ...
}
```

Remove that line again and the CSS placeholder comes back. If the file is ever
missing or fails to load, the card falls back to the placeholder rather than
showing a broken image.

---

## Generating placeholder image files

You normally don't need this — the CSS placeholder covers the site itself.
Use the generator when you want an actual **file**: a README banner, a social
preview, or a card to share somewhere the site's CSS doesn't reach.

```bash
# From a GitHub repo — pulls name, description, language, stars and topics
node tools/make-placeholder.js kamalahmed/invoicer
node tools/make-placeholder.js https://github.com/kamalahmed/invoicer

# Manually, for private or non-GitHub projects
node tools/make-placeholder.js \
  --id acme-ops \
  --name "Acme Ops" \
  --language PHP \
  --stack "WordPress,REST,Redis" \
  --tagline "Internal operations dashboard."

# Every project in data.js that has no image yet
node tools/make-placeholder.js --all

# Light-theme version
node tools/make-placeholder.js kamalahmed/invoicer --theme light

# All options
node tools/make-placeholder.js --help
```

Output lands in `images/projects/<id>.svg` at 640×400. No dependencies, Node
18+.

Useful flags: `--theme dark|light`, `--out <dir>`, `--width` / `--height`,
`--force` to overwrite, `--quiet` to print only the path.

The generated SVGs are 2–4 KB each — lighter than any screenshot, sharp at any
size, and readable as plain text in a diff.

---

## CSS placeholder vs. image file

Both draw the same terminal-card design. They differ in what they can do:

| | CSS placeholder | Generated SVG file |
|---|---|---|
| Follows dark/light theme | **Yes**, automatically | No — colours are baked in at generation |
| Scales with the card | **Yes**, via container queries | Scales as an image, fixed proportions |
| Extra file | None | ~3 KB per project |
| Extra request | None | One per card |
| Work to add a project | **None** | Run the script, add the path |
| Usable outside the page | No | **Yes** — README, social, anywhere |

**Use the CSS placeholder** (i.e. just omit `image`) for anything on the site.
This is why the repo ships with no project SVGs: an exported file can't follow
the theme, so light mode showed dark cards.

**Generate a file** when the image has to live somewhere the site's stylesheet
doesn't — a README, a social preview, a slide.

**Use a real screenshot** whenever you have one. A placeholder is a stand-in;
an actual picture of the product is always more persuasive.

---

## Regenerating the social card

`og-cover.png` is a rasterised copy of `og-cover.svg`. To update it, edit the
SVG, then export a 1200×630 PNG. Any method works — the simplest is a browser
screenshot at exactly that viewport size.

Check the result renders correctly before relying on it:

- <https://www.opengraph.xyz/>
- <https://cards-dev.twitter.com/validator>

Both cache aggressively, so a changed image can take a while to appear.
