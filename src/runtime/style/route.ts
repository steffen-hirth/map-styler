// Route overlay: a GeoJSON source plus line, arrow, point and label layers.
// The settings live in style.metadata so the panel can regenerate the layers;
// the layers themselves are ordinary style layers and stay fully editable.

import { t, tr } from '../../i18n';
import { setLayerProp } from './style-utils';
import type { Layer, Style } from './types';

export const ROUTE_SOURCE = 'mapstyler-route';
export const ROUTE_KEY = 'mapstyler:route';
export const ROUTE_LAYER_IDS = ['route-casing', 'route-line', 'route-arrows', 'route-points', 'route-labels'] as const;

export type RouteDash = 'solid' | 'dashed' | 'dotted';

export type RouteConfig = {
  color: string;
  width: number;
  opacity: number;
  casingColor: string;
  casingWidth: number;
  dash: RouteDash;
  arrows: boolean;
  pointColor: string;
  pointStroke: string;
  pointRadius: number;
  labels: boolean;
  labelColor: string;
  labelHalo: string;
};

export const DEFAULT_ROUTE: RouteConfig = {
  color: '#5e4b6e',
  width: 4,
  opacity: 1,
  casingColor: '#ffffff',
  casingWidth: 2,
  dash: 'solid',
  arrows: true,
  pointColor: '#ffffff',
  pointStroke: '#5e4b6e',
  pointRadius: 6,
  labels: true,
  labelColor: '#1d1e22',
  labelHalo: 'rgba(255, 255, 255, 0.9)',
};

type Position = [number, number];
type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString'; coordinates: Position[] }
  | { type: 'MultiLineString'; coordinates: Position[][] }
  | { type: string; coordinates: unknown };
export type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Geometry };
export type FeatureCollection = { type: 'FeatureCollection'; features: Feature[] };

const LINE_COORDS: Position[] = [
  [9.1817, 48.7841], [9.1806, 48.7812], [9.1797, 48.7787], [9.1772, 48.776], [9.1745, 48.7731],
  [9.1712, 48.7702], [9.1688, 48.7672], [9.1676, 48.7645], [9.1652, 48.7651], [9.1628, 48.7662],
  [9.159, 48.7671], [9.1548, 48.7684], [9.1505, 48.769], [9.1462, 48.7698], [9.142, 48.7701],
  [9.1378, 48.7699], [9.134, 48.7696], [9.1305, 48.7695],
];

const point = (coordinates: Position, name: string, kind: string, label: string): Feature => ({
  type: 'Feature',
  properties: { name, kind, label },
  geometry: { type: 'Point', coordinates },
});

/** Sample hike through Stuttgart, labelled in the current UI language. */
export function sampleRoute(): FeatureCollection {
  return withStats({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: tr('Stadtwanderung zum Birkenkopf', 'City hike to Birkenkopf'), ascent_m: 260 },
        geometry: { type: 'LineString', coordinates: LINE_COORDS },
      },
      point(LINE_COORDS[0], tr('Hauptbahnhof', 'Central Station'), 'start', 'Start'),
      point(LINE_COORDS[7], 'Marienplatz', 'waypoint', tr('Zwischenstopp', 'Stop')),
      point(LINE_COORDS[9], 'Karlshöhe', 'waypoint', tr('Aussichtspunkt', 'Viewpoint')),
      point(LINE_COORDS[LINE_COORDS.length - 1], 'Birkenkopf', 'end', tr('Ziel', 'Finish')),
    ],
  });
}

function haversineKm(a: Position, b: Position): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function lines(geometry: Geometry): Position[][] {
  if (geometry.type === 'LineString') return [geometry.coordinates as Position[]];
  if (geometry.type === 'MultiLineString') return geometry.coordinates as Position[][];
  return [];
}

/** Adds distance_km to line features that do not have it yet. */
export function withStats(fc: FeatureCollection): FeatureCollection {
  return {
    ...fc,
    features: fc.features.map((f) => {
      const parts = lines(f.geometry);
      if (!parts.length || f.properties.distance_km !== undefined) return f;
      let km = 0;
      for (const part of parts) for (let i = 1; i < part.length; i++) km += haversineKm(part[i - 1], part[i]);
      return { ...f, properties: { ...f.properties, distance_km: Math.round(km * 10) / 10 } };
    }),
  };
}

export function routeBounds(fc: FeatureCollection): [[number, number], [number, number]] | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = ([x, y]: Position) => {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  };
  for (const f of fc.features) {
    if (f.geometry.type === 'Point') add(f.geometry.coordinates as Position);
    for (const part of lines(f.geometry)) part.forEach(add);
  }
  return Number.isFinite(minX) ? [[minX, minY], [maxX, maxY]] : null;
}

function asCollection(json: unknown): FeatureCollection {
  const obj = json as { type?: string; features?: Feature[]; geometry?: Geometry };
  if (obj?.type === 'FeatureCollection' && Array.isArray(obj.features)) return obj as FeatureCollection;
  if (obj?.type === 'Feature') return { type: 'FeatureCollection', features: [obj as Feature] };
  if (obj && typeof obj.type === 'string' && 'coordinates' in obj) {
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: obj as Geometry }] };
  }
  throw new Error(t('Keine GeoJSON-Daten gefunden.'));
}

function parseGpx(text: string): FeatureCollection {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error(t('Die GPX-Datei ist nicht lesbar.'));
  const coord = (el: Element): Position => [Number(el.getAttribute('lon')), Number(el.getAttribute('lat'))];
  const name = doc.querySelector('trk > name, rte > name, metadata > name')?.textContent?.trim() || t('Route');
  const track = [...doc.querySelectorAll('trkpt, rtept')].map(coord).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (track.length < 2) throw new Error(t('Die GPX-Datei enthält keinen Track.'));
  const waypoints = [...doc.querySelectorAll('wpt')].map((el) =>
    point(coord(el), el.querySelector('name')?.textContent?.trim() || t('Wegpunkt'), 'waypoint', t('Wegpunkt')),
  );
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name }, geometry: { type: 'LineString', coordinates: track } },
      point(track[0], 'Start', 'start', 'Start'),
      ...waypoints,
      point(track[track.length - 1], t('Ziel'), 'end', t('Ziel')),
    ],
  };
}

/** Parse a GeoJSON or GPX file into a feature collection with stats. */
export function parseRouteFile(text: string, fileName = ''): FeatureCollection {
  const isGpx = /\.gpx$/i.test(fileName) || text.trimStart().startsWith('<');
  return withStats(isGpx ? parseGpx(text) : asCollection(JSON.parse(text)));
}

const LINE_FILTER = ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]];
const POINT_FILTER = ['==', ['geometry-type'], 'Point'];
const DASHES: Record<RouteDash, number[] | undefined> = { solid: undefined, dashed: [2, 1.6], dotted: [0.1, 2] };

const zoomWidth = (w: number) => ['interpolate', ['linear'], ['zoom'], 10, Math.round(w * 0.6 * 10) / 10, 16, Math.round(w * 1.4 * 10) / 10];

export function routeLayers(cfg: RouteConfig): { lines: Layer[]; points: Layer[] } {
  const casing: Layer = {
    id: 'route-casing',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: LINE_FILTER,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': cfg.casingColor, 'line-width': zoomWidth(cfg.width + cfg.casingWidth * 2), 'line-opacity': cfg.opacity },
  };
  if (cfg.casingWidth <= 0) casing.layout = { ...casing.layout, visibility: 'none' };

  let line: Layer = {
    id: 'route-line',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: LINE_FILTER,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': cfg.color, 'line-width': zoomWidth(cfg.width), 'line-opacity': cfg.opacity },
  };
  if (DASHES[cfg.dash]) line = setLayerProp(line, 'paint', 'line-dasharray', DASHES[cfg.dash]);

  const arrows: Layer = {
    id: 'route-arrows',
    type: 'symbol',
    source: ROUTE_SOURCE,
    filter: LINE_FILTER,
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 90,
      'text-field': '›',
      'text-font': ['Noto Sans Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 10, 12, 16, 20],
      'text-keep-upright': false,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
      'text-rotation-alignment': 'map',
      ...(cfg.arrows ? {} : { visibility: 'none' }),
    },
    paint: { 'text-color': cfg.casingColor, 'text-opacity': cfg.opacity },
  };

  const points: Layer = {
    id: 'route-points',
    type: 'circle',
    source: ROUTE_SOURCE,
    filter: POINT_FILTER,
    paint: {
      'circle-color': cfg.pointColor,
      'circle-radius': ['match', ['get', 'kind'], 'waypoint', Math.round(cfg.pointRadius * 0.7 * 10) / 10, cfg.pointRadius],
      'circle-stroke-color': ['match', ['get', 'kind'], 'end', cfg.color, cfg.pointStroke],
      'circle-stroke-width': Math.max(1.5, cfg.pointRadius / 3),
    },
  };

  const labels: Layer = {
    id: 'route-labels',
    type: 'symbol',
    source: ROUTE_SOURCE,
    filter: POINT_FILTER,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'text-anchor': 'top',
      'text-offset': [0, 1],
      'text-optional': true,
      ...(cfg.labels ? {} : { visibility: 'none' }),
    },
    paint: { 'text-color': cfg.labelColor, 'text-halo-color': cfg.labelHalo, 'text-halo-width': 1.5 },
  };

  return { lines: [casing, line, arrows], points: [points, labels] };
}

export function normalizeRoute(input: unknown): RouteConfig {
  const cfg = { ...DEFAULT_ROUTE };
  if (input && typeof input === 'object') {
    for (const key of Object.keys(DEFAULT_ROUTE) as Array<keyof RouteConfig>) {
      const value = (input as Record<string, unknown>)[key];
      if (value != null && typeof value === typeof DEFAULT_ROUTE[key]) (cfg as Record<string, unknown>)[key] = value;
    }
  }
  return cfg;
}

export function hasRoute(style: Style): boolean {
  return Boolean(style.sources[ROUTE_SOURCE]);
}

export function routeConfigOf(style: Style): RouteConfig {
  return normalizeRoute(style.metadata?.[ROUTE_KEY]);
}

export function routeDataOf(style: Style): FeatureCollection | null {
  const source = style.sources[ROUTE_SOURCE] as { data?: unknown } | undefined;
  try {
    return source?.data && typeof source.data === 'object' ? asCollection(source.data) : null;
  } catch {
    return null;
  }
}

const isRouteLayer = (layer: Layer) => (ROUTE_LAYER_IDS as readonly string[]).includes(layer.id);

/**
 * Insert or update the route. Lines go below the first label layer, points and
 * their labels on top. Layer positions stay stable across updates so edits can
 * be synced to the map property by property.
 */
export function applyRoute(style: Style, cfg: RouteConfig, data?: FeatureCollection): Style {
  const routeData = data ?? routeDataOf(style) ?? sampleRoute();
  const { lines: lineLayers, points: pointLayers } = routeLayers(cfg);
  const base = style.layers.filter((l) => !isRouteLayer(l));
  const firstSymbol = base.findIndex((l) => l.type === 'symbol');
  const at = firstSymbol < 0 ? base.length : firstSymbol;
  const layers = [...base.slice(0, at), ...lineLayers, ...base.slice(at), ...pointLayers];
  const previous = style.sources[ROUTE_SOURCE] as { data?: unknown } | undefined;
  const source = previous && !data ? previous : { type: 'geojson', data: routeData };
  return {
    ...style,
    sources: { ...style.sources, [ROUTE_SOURCE]: source },
    layers,
    metadata: { ...(style.metadata ?? {}), [ROUTE_KEY]: cfg },
  };
}

export function removeRoute(style: Style): Style {
  const sources = { ...style.sources };
  delete sources[ROUTE_SOURCE];
  const metadata = { ...(style.metadata ?? {}) };
  delete metadata[ROUTE_KEY];
  return { ...style, sources, metadata, layers: style.layers.filter((l) => !isRouteLayer(l)) };
}
