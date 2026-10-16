# Map Styler

A free style editor for vector maps based on **OpenFreeMap** and **OpenStreetMap**. Start from a ready-made template, fine-tune layers, colors, labels, routes and tooltips, and ship the result as a single `style.json` – for example straight from GitHub via jsDelivr.

<img width="1693" height="1075" alt="preview-styler" src="https://github.com/user-attachments/assets/32bde1a8-aa42-4786-a5e2-551a38f84bf1" />


Runs entirely in the browser. No account, no API key, no tracking. UI in English and German.

## Features

- **Simple and expert mode** – Simple shows templates, one color per map area, route planning and the tooltip basics. Expert adds every layer and property, the palette, global adjustments and the inspector.
- **Templates** – ten ready-made map designs, each with matching tooltips and a styled sample route: Baral Sand, Minimal (default), Dusk, Paper, Outdoor, Standard, Bright, Dataviz Light, Dataviz Dark and Blueprint. Everything stays editable afterwards.
- **Routes** – click stops onto the map and drag them around; the line follows real paths on foot, by bike or by car (OpenStreetMap routing by FOSSGIS). Train mode snaps stops to the nearest station, straight-line mode needs no routing at all. Distance and duration are calculated automatically. You can also load GPX or GeoJSON files. Style color, width, opacity, line style, arrows, casing, stops and labels. The route is exported with the `style.json`.
- **Pins** – twelve pin types (place, highlight, café, food, parking, viewpoint, station, info, shop, home, photo spot, stay) with icons, name and an optional URL that shows up in the tooltip.
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

Tooltips need a small script (`cdn/mapstyler-tooltips.js`, about 15 KB gzipped, no dependencies besides MapLibre). The configuration lives in the `style.json` under `metadata["mapstyler:tooltips"]`, so one call is enough:

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
| `{kind_en}`, `{kind_de}` | Readable feature type from `subclass`/`class`, e.g. "Bus stop" / "Bushaltestelle" |
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

### Pins from a CMS (Webflow, WordPress, any HTML)

Give the items of a CMS list a few custom attributes and let the script turn them into clustered, filterable pins with tooltips. In Webflow, bind the attribute values to collection fields.

```html
<div data-map-pin data-lat="48.7661" data-lng="9.1627" data-name="Karlshöhe" data-category="Viewpoint" data-type="view">…</div>
<button data-map-filter="">All</button> <button data-map-filter="Viewpoint">Viewpoints</button>

<script>
  const styler = MapStylerTooltips.attach(map);
  styler.pins({ colors: { Viewpoint: '#0f9d76' } });
</script>
```

| Attribute | Meaning |
| --- | --- |
| `data-map-pin` | marks an element as a pin |
| `data-lat`, `data-lng` or `data-coordinates="lat, lng"` | position (decimal comma works too) |
| `data-name`, `data-category`, `data-type`, `data-color`, `data-url` | name, filter group, pin icon (`cafe`, `shop`, `view`, …), color, link |
| any other `data-*` | available in the tooltip as `{field}` |

Clicking a list item flies to its pin and opens the tooltip; hovering a pin highlights the item (`is-active`). `pins({ data: 'places.geojson' })` reads GeoJSON instead. See `examples/cms-pins.html`.

### React, Next.js and Sanity

`src/react` contains `<StyledMap>`, a client component that loads MapLibre in the browser only (safe in Next.js server components). It takes documents straight from a CMS: `_id`, `title`, `slug.current`, Sanity `geopoint` fields under `location` and referenced categories (`{ title }`) are understood without mapping.

```tsx
'use client';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StyledMap } from 'map-styler/react';

// const places = await client.fetch(`*[_type == "place"]{ _id, title, location, category->{ title }, type }`)
<StyledMap
  mapStyle="/styles/liquid-glass.json"
  pins={places}
  filter={category}
  selectedId={selected}
  onSelect={(pin) => setSelected(pin.id)}
  template={'<strong>{name}</strong>\n{category}'}
/>
```

Other field names: `fields={{ location: 'address.geo', name: 'headline', category: 'kind' }}`. Build the package with `npm run build:react` (output in `dist-react/`). See `examples/react-pins.html`.

### Sanity Studio plugin

`src/sanity` adds map fields to Sanity Studio – without Google Maps or an API key.

```ts
// sanity.config.ts
import { mapStyler } from 'map-styler/sanity';

export default defineConfig({
  plugins: [
    mapStyler({
      styles: [{ title: 'Liquid Glass', value: 'https://cdn.example.com/styles/liquid-glass.json' }],
    }),
  ],
});
```

| Type | What it is |
| --- | --- |
| `mapLocation` | A `geopoint` with a MapLibre input: click or drag the pin, search an address or paste "lat, lng". Use it in your own documents (`{ name: 'location', type: 'mapLocation' }`); existing geopoint data keeps working. |
| `mapPin` | Name, location, category, icon, description, link. |
| `mapView` | Camera (center, zoom, tilt, rotation), set up on a live preview of the map. |
| `styledMap` | The "Map" document: style, pins, view and tooltip template. Render it with `<StyledMap>`. |

**Local test studio:** copy `studio/.env.example` to `studio/.env`, enter your project ID, add `http://localhost:3333` as a CORS origin (with credentials) in sanity.io/manage, then run `npm run studio`. It shows the "Map" document and a sample "Place" type with a `mapLocation` field. CLI telemetry is turned off via `DO_NOT_TRACK=1`.

Address search uses OpenStreetMap Nominatim by default (light interactive use only, search terms go to the OpenStreetMap Foundation). Pass `geocoder: false` to hide it or your own `geocoder: (query, signal) => Promise<{ label, lat, lng }[]>`. Build with `npm run build:sanity`; `examples/sanity-input.html` shows the input outside a Studio.

### Glass buildings

The same script can render a fill-extrusion layer as refracting glass (WebGL): it copies the map drawn so far into a texture and draws the buildings with refraction, frosting, a tint and bright rounded edges. Enable it in the style:

```json
"metadata": {
  "mapstyler:glass": {
    "layer": "building-3d", "tint": "#f2faff", "tintStrength": 0.32,
    "refraction": 30, "blur": 7, "bevel": 4,
    "rim": "#ffffff", "rimStrength": 0.9, "specular": 0.9
  }
}
```

The extrusion layer stays in the style as a fallback: without the script, maps show it as usual. Pass `{ glass: false }` to `attach` to turn the effect off. Mercator projection only.

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

The editor only stores data locally in your browser (`localStorage`): the current style, the map view, the export settings and the UI language. There are no analytics, no cookies and no backend. External requests only go to the map sources (e.g. OpenFreeMap), for embed code to unpkg and jsDelivr, and – only while you plan a route on foot, by bike or by car – the stop coordinates to the FOSSGIS routing server (routing.openstreetmap.de). Finished routes are stored in the style, so embedded maps never call the routing server.

## Data and attribution

- Map data: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)
- Vector tiles and base styles: [OpenFreeMap](https://openfreemap.org), based on [OpenMapTiles](https://openmaptiles.org)
- Routing: [OSRM](https://project-osrm.org) servers by [FOSSGIS](https://routing.openstreetmap.de) on OpenStreetMap data
- Rendering: [MapLibre GL JS](https://maplibre.org) (BSD-3-Clause)
- Pin icons: [Lucide](https://lucide.dev) (ISC)

The base styles include the attribution and MapLibre shows it automatically. Please keep it visible in embedded maps.

## License

[MIT](LICENSE)
