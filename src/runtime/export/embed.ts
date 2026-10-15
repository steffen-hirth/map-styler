// Export helpers: jsDelivr URLs for GitHub-hosted styles, embed snippet and a
// self-contained HTML test page.

import runtimeSource from '../../../cdn/mapstyler-tooltips.js?raw';
import { MAPLIBRE_VERSION } from '../../app/app-schema';
import type { Style } from '../style/types';
import type { View } from '../state/store';

export type CdnTarget = {
  user: string;
  repo: string;
  ref: string;
  stylePath: string;
  scriptPath: string;
};

export const DEFAULT_CDN_TARGET: CdnTarget = {
  user: '',
  repo: '',
  ref: 'main',
  stylePath: 'styles/map-style.json',
  scriptPath: 'cdn/mapstyler-tooltips.js',
};

const clean = (path: string) => path.trim().replace(/^\/+/, '');

export function jsDelivrUrl(target: CdnTarget, path: string): string {
  const ref = target.ref.trim() || 'main';
  return `https://cdn.jsdelivr.net/gh/${target.user.trim()}/${target.repo.trim()}@${ref}/${clean(path)}`;
}

export function isCdnReady(target: CdnTarget): boolean {
  return Boolean(target.user.trim() && target.repo.trim());
}

const maplibreCss = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
const maplibreJs = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;

export function embedSnippet(styleUrl: string, scriptUrl: string, view: View): string {
  return `<link rel="stylesheet" href="${maplibreCss}">
<script src="${maplibreJs}"></script>
<script src="${scriptUrl}"></script>

<div id="map" style="width: 100%; height: 480px"></div>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: '${styleUrl}',
    center: [${view.center[0]}, ${view.center[1]}],
    zoom: ${view.zoom},
    pitch: ${view.pitch ?? 0},
    bearing: ${view.bearing ?? 0}
  });
  map.addControl(new maplibregl.NavigationControl());
  MapStylerTooltips.attach(map);
</script>`;
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** One-file test page: style and tooltip runtime are inlined, only MapLibre comes from a CDN. */
export function standaloneHtml(style: Style, view: View): string {
  const styleJson = JSON.stringify(style).replace(/</g, '\\u003c');
  const runtime = runtimeSource.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(style.name || 'Map')}</title>
<link rel="stylesheet" href="${maplibreCss}">
<script src="${maplibreJs}"></script>
<style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
<div id="map"></div>
<script>${runtime}</script>
<script>
const map = new maplibregl.Map({
  container: 'map',
  style: ${styleJson},
  center: [${view.center[0]}, ${view.center[1]}],
  zoom: ${view.zoom},
  pitch: ${view.pitch ?? 0},
  bearing: ${view.bearing ?? 0}
});
map.addControl(new maplibregl.NavigationControl());
MapStylerTooltips.attach(map);
</script>
</body>
</html>
`;
}

export function styleFileName(style: Style): string {
  const slug =
    String(style.name || 'map-style')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'map-style';
  return `${slug}.json`;
}

export function downloadText(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
