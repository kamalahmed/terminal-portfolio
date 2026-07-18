# Images

Every file here is a **placeholder**. They're real, committed assets so the
site never renders with broken images — but they're generated graphics, not
screenshots. Swap them for the real thing whenever you have it.

## What's here

| File | Used by | Size | Notes |
|---|---|---|---|
| `avatar.svg` | ID badge in the hero | 200×200 | Square. Rendered as a circle. |
| `favicon.svg` | Browser tab | 64×64 | |
| `og-cover.png` | Social sharing previews | 1200×630 | **Must be PNG or JPG** — most social platforms won't render SVG. |
| `og-cover.svg` | Source for the PNG above | 1200×630 | Edit this, then re-export the PNG. |
| `projects/<id>.svg` | Cards in `~/apps` | 640×400 | One per project. |
| `projects/placeholder.svg` | Fallback | 640×400 | Shown automatically if a project's image is missing or fails to load. |

## Replacing an image

### Your photo

Drop your headshot in as `avatar.jpg`, then point the badge at it in
`index.html`:

```html
<img class="badge-avatar" src="images/avatar.jpg" ... />
```

Square crop, at least 200×200. It's displayed as a circle, so keep your face
centred.

### A project screenshot

Save it as `projects/<project-id>.png` — the id is the `id` field from
`js/data.js` — then update that project's `image` value:

```js
{
  id: 'invoicer',
  image: 'images/projects/invoicer.png',   // was: .../invoicer.svg
  ...
}
```

**Recommended: 1280×800** (a 16:10 browser window). Cards display at 16:10 and
crop to fill, so anything at that ratio lands cleanly. Keep files under ~300 KB
— they're lazy-loaded, but a portfolio shouldn't ship megabytes of PNGs.

### The social card

Edit `og-cover.svg`, then export a 1200×630 PNG over `og-cover.png`. Any tool
works — a browser screenshot at that exact viewport size is the simplest.

Then check it renders correctly with:
- <https://cards-dev.twitter.com/validator>
- <https://www.opengraph.xyz/>

Note that both platforms cache aggressively; a changed image can take a while
to show up.

## Why SVG placeholders?

They're a few KB each, they're sharp at any resolution, they're readable as
plain text in a diff, and they're generated from the same colour tokens as the
site — so they look intentional rather than like missing assets.
