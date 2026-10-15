# Map Styler

A free style editor for vector maps based on **OpenFreeMap** and **OpenStreetMap**. Start from a ready-made template, fine-tune layers, colors, labels, routes and tooltips, and ship the result as a single `style.json` – for example straight from GitHub via jsDelivr.

Runs entirely in the browser. No account, no API key, no tracking. UI in English and German.

## Features

- **Templates** – nine ready-made map designs, each with matching tooltips and a styled sample route: Minimal (default), Dusk, Paper, Outdoor, Standard, Bright, Dataviz Light, Dataviz Dark and Blueprint. Everything stays editable afterwards.
- **Routes** – load a GPX or GeoJSON file or use the sample route. Set color, width, opacity, line style (solid, dashed, dotted), direction arrows, casing, start/finish/waypoint markers and their labels. The route is exported with the `style.json`.
- **Layer editor** – all layers grouped (water, roads, buildings, labels, POIs, routes …). Show/hide, reorder, duplicate, rename and delete.
- **Every property in detail** – a fitting control for each paint and layout property (color with opacity, sliders, selects, switches, fonts).
  - **Zoom stops** – vary any value by zoom level with a stop editor and curve.
  - **Expressions** – edit MapLibre expressions as JSON; every color inside gets its own picker.
  - Filter, zoom range and the raw JSON of each layer.
- **Palette** – every color of the style at a glance. Changing one replaces it everywhere, or only within one group.
- **Global adjustments** – hue, saturation and lightness for the whole map with live preview, a quick dark mode, text size, place name language (English, German, local) and a text halo for all labels.
- **Tooltip designer** – per-layer templates (`{name:en|name}`), hover or click. Style colors, font, spacing, radius, border, shadow and arrow. The preview uses real data from the map.
- **Inspector** – click the map to see which layers draw there and what data they carry.
- **Export** – download the `style.json` (including tooltip setup and route), copy an embed snippet with jsDelivr URLs, or download a self-contained HTML test page.
- **Undo/redo** (⌘Z / ⇧⌘Z) and autosave in the browser.

## Quick start

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

> Note: Vite cannot handle a `#` in the folder path (e.g. `Projects #1`). Keep the project in a folder without `#`.

| Command | Purpose |
| --- | --- |
| `npm run build` | Build the tooltip script into `cdn/`, type-check, build the app into `dist/` |
| `npm run build:cdn` | Build only the tooltip script into `cdn/` |
| `npm test` | Unit tests for color, style, route and translation logic |
| `npm run preview` | Preview the production build locally |

## Publish on GitHub Pages

1. Push the repository to GitHub.
2. Under **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
3. Every push to `main` builds and deploys the editor via `.github/workflows/pages.yml`.

## Serve styles from a CDN (jsDelivr)

jsDelivr serves files from public GitHub repositories through a free CDN. To use your style on any website:

1. Click **Export** in the editor and download the `style.json`.
2. Put the file in your repo, e.g. `styles/my-style.json`, then commit and push.
3. Ideally add a tag (`git tag v1.0.0 && git push --tags`) – branch URLs are cached for up to 12 hours.
4. Enter GitHub user, repository and tag in the export dialog and copy the embed code.

The URLs look like this:

```text
https://cdn.jsdelivr.net/gh/<user>/<repo>@v1.0.0/styles/my-style.json
https://cdn.jsdelivr.net/gh/<user>/<repo>@v1.0.0/cdn/mapstyler-tooltips.js
```

## Tooltip runtime

Tooltips need a small script (`cdn/mapstyler-tooltips.js`, about 5 KB, no dependencies besides MapLibre). The configuration lives in the `style.json` under `metadata["mapstyler:tooltips"]`, so one call is enough:

```html
<script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
<script src="https://cdn.jsdelivr.net/gh/<user>/<repo>@v1.0.0/cdn/mapstyler-tooltips.js"></script>
<script>
  const map = new maplibregl.Map({ container: 'map', style: '…/my-style.json' });
  MapStylerTooltips.attach(map);
</script>
```

API:

| Function | Description |
| --- | --- |
| `MapStylerTooltips.attach(map, options?)` | Attaches tooltips to a map. `options.config` overrides the config from the style. Returns a handle. |
| `handle.update(config)` | Change the configuration at runtime |
| `handle.setEnabled(bool)` | Turn tooltips on or off |
| `handle.destroy()` | Remove everything again |
| `MapStylerTooltips.renderTemplate(template, props)` | Render a template with feature properties |

For bundlers there is also `cdn/mapstyler-tooltips.mjs` as an ES module.

### Template syntax

| Syntax | Meaning |
| --- | --- |
| `{name}` | Value of the `name` property |
| `{name:en\|name}` | First value present: `name:en`, otherwise `name` |
| `{name\|'Unnamed'}` | Fixed text if no value is present |
| new line | New line in the tooltip; lines without values are dropped |
| `<strong>`, `<em>`, `<span style="…">` | Simple HTML is allowed. Values are escaped, scripts and links removed. |

### Configuration in the style.json

```json
"metadata": {
  "mapstyler:tooltips": {
    "trigger": "hover",
    "style": {
      "background": "#ffffff", "color": "#1f2328", "fontFamily": "system-ui, sans-serif",
      "fontSize": 13, "lineHeight": 1.4, "padding": 10, "radius": 8,
      "borderColor": "rgba(0, 0, 0, 0.08)", "borderWidth": 1, "shadow": "soft",
      "maxWidth": 260, "tip": true
    },
    "layers": {
      "poi_r1": { "enabled": true, "template": "<strong>{name:en|name}</strong>\n{class}" }
    }
  }
}
```

Routes are stored as a GeoJSON source `mapstyler-route` with the layers `route-casing`, `route-line`, `route-arrows`, `route-points` and `route-labels`; the route settings live in `metadata["mapstyler:route"]`.

## Project structure

```text
src/
  app/                    Product: schema, composition, panels, toolbar, export
    app-schema.ts         Base styles, defaults, option lists
    app-composition.tsx   Map + floating panels + toolbar
    templates.ts          Ready-made templates
    panels/               Templates, layers, properties, colors, routes, tooltips, global, inspector
  runtime/                Logic without UI
    state/store.ts        Style state, undo/redo, autosave
    style/                Colors, property spec, transforms, recoloring, routes (+ tests)
    map/                  MapLibre canvas and fast property sync
    tooltips/             Tooltip runtime (also built into cdn/)
    export/               Embed code, jsDelivr URLs, HTML test page
  ui/                     Building blocks: primitives, controls, panel
  i18n.ts                 English/German UI strings
cdn/                      Built tooltip script for jsDelivr (committed)
```

Stack: Vite, React, TypeScript, Tailwind CSS, Base UI, MapLibre GL JS.

## Privacy

The editor only stores data locally in your browser (`localStorage`): the current style, the map view, the export settings and the UI language. There are no analytics, no cookies and no backend. External requests only go to the map sources (e.g. OpenFreeMap) and, for embed code, to unpkg and jsDelivr.

## Data and attribution

- Map data: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)
- Vector tiles and base styles: [OpenFreeMap](https://openfreemap.org), based on [OpenMapTiles](https://openmaptiles.org)
- Rendering: [MapLibre GL JS](https://maplibre.org) (BSD-3-Clause)

The base styles include the attribution and MapLibre shows it automatically. Please keep it visible in embedded maps.

## License

[MIT](LICENSE)
