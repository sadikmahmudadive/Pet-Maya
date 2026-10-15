# Maya Halo — scroll-driven product site

A cinematic scroll page for the Maya Halo GPS collar. **Every pixel is drawn live in the browser**
with [three.js](https://threejs.org) (MIT, vendored in `vendor/`), so there are no video credits,
API keys, downloaded models or image files to license. The stills below the film are rendered from
the same 3D scene.

## Run it

```bash
cd scroll-site
python -m http.server 4199      # any static server works
# open http://localhost:4199
```

No build step. It is plain HTML + ES modules, so it also deploys as-is to any static host
(Firebase Hosting, Vercel, GitHub Pages).

## How it works

| File | What it does |
|---|---|
| `src/halo.js` | Builds the collar procedurally (23 parts) and maps scroll progress `0..1` to everything: explosion → assembly, halo ignition, 360° turntable, radar pulses and gateway links, final push-in. Deterministic, so scrubbing backwards replays the same frames. |
| `src/main.js` | Scroll → progress with eased smoothing, caption timing, reveal-on-scroll, nav, `?shot=` still mode. |
| `index.html`, `styles.css` | Captions (`data-in / data-hold / data-out` are scroll fractions), the brand page and footer. |
| `tools/` | Test and capture scripts (below). |

Chapter map (scroll fraction): `0–.26` parts fly together · `.31–.40` halo ignites · `.50–.69` turntable ·
`.66–.90` radar and LoRa links · `.93–1` finale. Edit the `KEYS` array in `halo.js` for the camera path.

## Fallbacks

* No WebGL → a still image and the full brand page.
* `prefers-reduced-motion` → idle animation off; scrolling still scrubs the film.
* Phones → portrait framing, captions at the bottom, pixel ratio capped at 1.5.

## Re-render the stills

```bash
python -m http.server 4199 &
node tools/capture-stills.mjs      # writes img/*.png from the 3D scene (needs Playwright)
python tools/to_webp.py            # converts them to WebP
```

Add or tweak a still in the `SHOTS` table in `src/main.js`.

## Checks (Playwright, from the repo root's `node_modules`)

```bash
node tools/smoke.mjs               # scroll through the film, screenshot, report console errors
node tools/sections.mjs --w=390 --h=844   # the brand page below the film
node tools/fallback.mjs            # no-WebGL and reduced-motion behaviour
```

Set `PW_CHANNEL=msedge` (or `chrome`) to use an installed browser.

## Content notes

Specs and claims come from `firmware/` (433 MHz LoRa, NEO-6M GPS, AES-128-CCM, reporting intervals,
range and battery *estimates*). The page is a concept render of the product, not a photograph.
