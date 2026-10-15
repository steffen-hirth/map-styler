// Route overlay: a GeoJSON source plus line, arrow, point, pin and label
// layers. The settings live in style.metadata so the panel can regenerate the
// layers; the layers themselves are ordinary style layers and stay editable.

import { t, tr } from '../../i18n';
import { isPinType, pinImageExpression, type PinType } from '../tooltips/pin-icons';
import { colorKey, parseColor, toHex } from './color';
import { setLayerProp } from './style-utils';
import type { Layer, Style } from './types';

export const ROUTE_SOURCE = 'mapstyler-route';
export const ROUTE_KEY = 'mapstyler:route';
export const ROUTE_LAYER_IDS = ['route-casing', 'route-line', 'route-arrows', 'route-points', 'route-pins', 'route-labels'] as const;

export type RouteDash = 'solid' | 'dashed' | 'dotted';
export const ROUTE_MODES = ['foot', 'bike', 'car', 'train', 'line'] as const;
export type RouteMode = (typeof ROUTE_MODES)[number];

export type RouteConfig = {
  mode: RouteMode;
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
  pinColor: string;
  pinStyle: 'icon' | 'dot';
  labels: boolean;
  labelColor: string;
  labelHalo: string;
};

export const DEFAULT_ROUTE: RouteConfig = {
  mode: 'foot',
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
  pinColor: '#5e4b6e',
  pinStyle: 'icon',
  labels: true,
  labelColor: '#1d1e22',
  labelHalo: 'rgba(255, 255, 255, 0.9)',
};

export type Position = [number, number];
type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString'; coordinates: Position[] }
  | { type: 'MultiLineString'; coordinates: Position[][] }
  | { type: string; coordinates: unknown };
export type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Geometry };
export type FeatureCollection = { type: 'FeatureCollection'; features: Feature[] };

export function pinTypeLabel(type: PinType): string {
  const labels: Record<PinType, [string, string]> = {
    pin: ['Ort', 'Place'],
    star: ['Highlight', 'Highlight'],
    cafe: ['Café', 'Café'],
    food: ['Essen', 'Food'],
    parking: ['Parken', 'Parking'],
    view: ['Aussicht', 'Viewpoint'],
    train: ['Bahnhof', 'Station'],
    info: ['Info', 'Info'],
    shop: ['Laden', 'Shop'],
    home: ['Zuhause', 'Home'],
    photo: ['Fotospot', 'Photo spot'],
    hotel: ['Unterkunft', 'Stay'],
  };
  return tr(...labels[type]);
}

export function stopKindLabel(kind: string): string {
  if (kind === 'start') return 'Start';
  if (kind === 'end') return tr('Ziel', 'Finish');
  return tr('Zwischenstopp', 'Stop');
}

const MODE_PHRASE: Record<RouteMode, [string, string]> = {
  foot: ['zu Fuß', 'on foot'],
  bike: ['mit dem Rad', 'by bike'],
  car: ['mit dem Auto', 'by car'],
  train: ['mit dem Zug', 'by train'],
  line: ['Luftlinie', 'straight line'],
};

/** "ca. 1 h 28 min zu Fuß" – empty when there is no duration. */
export function durationLabel(minutes: number | undefined, mode: RouteMode): string {
  if (!minutes) return mode === 'line' || mode === 'train' ? tr(...MODE_PHRASE[mode]) : '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const time = h ? `${h} h ${m ? `${m} min` : ''}`.trim() : `${m} min`;
  return `${tr('ca.', 'about')} ${time} ${tr(...MODE_PHRASE[mode])}`;
}

const formatKm = (km: number) => tr(String(km).replace('.', ','), String(km));

/** Compact trip summary for tooltips, e.g. "37 min · 7,7 km"; the mode is shown as an icon. */
export function tripLabel(distanceKm: number | undefined, minutes: number | undefined): string {
  const h = minutes ? Math.floor(minutes / 60) : 0;
  const m = minutes ? minutes % 60 : 0;
  const time = minutes ? (h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`) : '';
  return [time, distanceKm !== undefined ? `${formatKm(distanceKm)} km` : ''].filter(Boolean).join(' · ');
}

// Walking route via OSRM (FOSSGIS), simplified to ~100 points.
const SAMPLE_LINE: Position[] = [
  [9.18111, 48.78425], [9.18045, 48.78356], [9.18193, 48.78292], [9.18183, 48.78275], [9.18209, 48.78265], [9.18116, 48.78157],
  [9.18037, 48.78078], [9.18038, 48.78065], [9.18033, 48.78059], [9.18026, 48.78058], [9.17933, 48.7796], [9.17932, 48.77945],
  [9.17917, 48.77941], [9.17458, 48.77453], [9.17457, 48.77439], [9.17442, 48.77436], [9.17405, 48.77394], [9.174, 48.77386],
  [9.17486, 48.77331], [9.17453, 48.77245], [9.17413, 48.7717], [9.17298, 48.77063], [9.17285, 48.77071], [9.17203, 48.76968],
  [9.17196, 48.76955], [9.17207, 48.76951], [9.17112, 48.76832], [9.17099, 48.76836], [9.1687, 48.76546], [9.16878, 48.76541],
  [9.16833, 48.76485], [9.16794, 48.76479], [9.16731, 48.76439], [9.1673, 48.76429], [9.16556, 48.76399], [9.16528, 48.76442],
  [9.16533, 48.76446], [9.16525, 48.76444], [9.1652, 48.76453], [9.16495, 48.76448], [9.16478, 48.76486], [9.16483, 48.76487],
  [9.1648, 48.76494], [9.16485, 48.765], [9.16475, 48.76542], [9.16373, 48.76555], [9.16315, 48.76577], [9.16102, 48.7675],
  [9.16042, 48.76737], [9.16031, 48.7674], [9.1601, 48.76782], [9.16003, 48.7678], [9.15969, 48.76827], [9.15789, 48.76807],
  [9.1544, 48.77298], [9.15392, 48.77371], [9.15391, 48.77379], [9.15255, 48.77404], [9.14643, 48.77404], [9.14525, 48.77451],
  [9.14514, 48.77452], [9.14506, 48.77444], [9.14491, 48.77451], [9.14471, 48.77444], [9.14463, 48.77452], [9.14451, 48.77449],
  [9.14431, 48.77459], [9.14417, 48.77455], [9.14414, 48.7746], [9.1433, 48.77461], [9.14105, 48.77452], [9.14016, 48.7746],
  [9.13996, 48.77466], [9.13993, 48.77462], [9.13968, 48.7747], [9.13965, 48.77462], [9.13903, 48.77473], [9.13891, 48.7745],
  [9.13641, 48.77412], [9.13583, 48.77412], [9.1352, 48.77374], [9.1351, 48.77376], [9.1347, 48.77342], [9.13433, 48.77327],
  [9.1341, 48.77323], [9.13373, 48.77334], [9.1334, 48.77316], [9.13332, 48.77322], [9.13312, 48.77312], [9.13299, 48.77313],
  [9.13293, 48.7729], [9.13322, 48.77254], [9.13322, 48.77234], [9.13274, 48.77235], [9.13233, 48.77141], [9.13135, 48.77061],
  [9.13107, 48.77003], [9.13026, 48.76958], [9.13025, 48.76951],
];

const point = (id: string, coordinates: Position, name: string, kind: string, label: string, type: PinType = 'pin'): Feature => ({
  type: 'Feature',
  properties: { id, name, kind, type, label },
  geometry: { type: 'Point', coordinates },
});

/** Sample walk through Stuttgart, labelled in the current UI language. */
export function sampleRoute(): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: tr('Stadtwanderung zum Birkenkopf', 'City walk to Birkenkopf'),
          mode: 'foot',
          distance_km: 6.7,
          duration_min: 88,
          duration_label: durationLabel(88, 'foot'),
          trip_label: tripLabel(6.7, 88),
        },
        geometry: { type: 'LineString', coordinates: SAMPLE_LINE },
      },
      point('s1', [9.18111, 48.78425], tr('Hauptbahnhof', 'Central Station'), 'start', 'Start'),
      point('s2', [9.16755, 48.76454], 'Marienplatz', 'waypoint', stopKindLabel('waypoint')),
      point('s3', [9.16268, 48.76614], 'Karlshöhe', 'waypoint', tr('Aussichtspunkt', 'Viewpoint')),
      point('s4', [9.13025, 48.76951], 'Birkenkopf', 'end', stopKindLabel('end')),
      point('p1', [9.16642, 48.76386], tr('Café am Marienplatz', 'Café at Marienplatz'), 'pin', pinTypeLabel('cafe'), 'cafe'),
    ],
  };
}

function haversineKm(a: Position, b: Position): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function lineLengthKm(coords: Position[]): number {
  let km = 0;
  for (let i = 1; i < coords.length; i++) km += haversineKm(coords[i - 1], coords[i]);
  return km;
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
      const km = parts.reduce((sum, part) => sum + lineLengthKm(part), 0);
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

export function asCollection(json: unknown): FeatureCollection {
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
  const waypoints = [...doc.querySelectorAll('wpt')].map((el, i) =>
    point(`w${i}`, coord(el), el.querySelector('name')?.textContent?.trim() || t('Wegpunkt'), 'pin', t('Wegpunkt')),
  );
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name }, geometry: { type: 'LineString', coordinates: track } },
      point('s1', track[0], 'Start', 'start', 'Start'),
      point('s2', track[track.length - 1], stopKindLabel('end'), 'end', stopKindLabel('end')),
      ...waypoints,
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
const IS_PIN = ['==', ['get', 'kind'], 'pin'];
const DASHES: Record<RouteDash, number[] | undefined> = { solid: undefined, dashed: [2, 1.6], dotted: [0.1, 2] };

const zoomWidth = (w: number) => ['interpolate', ['linear'], ['zoom'], 10, Math.round(w * 0.6 * 10) / 10, 16, Math.round(w * 1.4 * 10) / 10];
const hex = (color: string) => toHex(parseColor(color) ?? { r: 94, g: 75, b: 110 });

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

  // Route stops (and pins when drawn as dots) as circles.
  const points: Layer = {
    id: 'route-points',
    type: 'circle',
    source: ROUTE_SOURCE,
    filter: cfg.pinStyle === 'dot' ? POINT_FILTER : ['all', POINT_FILTER, ['!', IS_PIN]],
    paint: {
      'circle-color': ['match', ['get', 'kind'], 'pin', cfg.pinColor, cfg.pointColor],
      'circle-radius': ['match', ['get', 'kind'], 'waypoint', Math.round(cfg.pointRadius * 0.7 * 10) / 10, cfg.pointRadius],
      'circle-stroke-color': ['match', ['get', 'kind'], 'end', cfg.color, 'pin', '#ffffff', cfg.pointStroke],
      'circle-stroke-width': Math.max(1.5, cfg.pointRadius / 3),
    },
  };

  const pins: Layer = {
    id: 'route-pins',
    type: 'symbol',
    source: ROUTE_SOURCE,
    filter: ['all', POINT_FILTER, IS_PIN],
    layout: {
      'icon-image': pinImageExpression(hex(cfg.pinColor)),
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      ...(cfg.pinStyle === 'icon' ? {} : { visibility: 'none' }),
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
      'text-offset': ['case', IS_PIN, ['literal', [0, 1.3]], ['literal', [0, 1]]],
      'text-optional': true,
      ...(cfg.labels ? {} : { visibility: 'none' }),
    },
    paint: { 'text-color': cfg.labelColor, 'text-halo-color': cfg.labelHalo, 'text-halo-width': 1.5 },
  };

  return { lines: [casing, line, arrows], points: [points, pins, labels] };
}

export function normalizeRoute(input: unknown): RouteConfig {
  const cfg = { ...DEFAULT_ROUTE };
  if (input && typeof input === 'object') {
    for (const key of Object.keys(DEFAULT_ROUTE) as Array<keyof RouteConfig>) {
      const value = (input as Record<string, unknown>)[key];
      if (value != null && typeof value === typeof DEFAULT_ROUTE[key]) (cfg as Record<string, unknown>)[key] = value;
    }
    // Older configs have no pin color: follow the route color.
    if ((input as Record<string, unknown>).pinColor === undefined && colorKey(cfg.color)) cfg.pinColor = cfg.color;
  }
  if (!(ROUTE_MODES as readonly string[]).includes(cfg.mode)) cfg.mode = DEFAULT_ROUTE.mode;
  if (cfg.pinStyle !== 'dot') cfg.pinStyle = 'icon';
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

export { isPinType };
