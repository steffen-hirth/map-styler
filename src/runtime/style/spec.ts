// Editable style properties per layer type, layer grouping and labels.

import { t } from '../../i18n';

export type PropSpec =
  | { type: 'number'; min: number; max: number; step: number; default?: number }
  | { type: 'color'; default?: string }
  | { type: 'enum'; values: string[]; default?: string }
  | { type: 'boolean'; default?: boolean }
  | { type: 'string'; default?: string }
  | { type: 'array'; default?: number[] }
  | { type: 'font'; default?: string[] }
  | { type: 'json'; default?: unknown };

export const FONTS = ['Noto Sans Regular', 'Noto Sans Bold', 'Noto Sans Italic'];

const num = (min: number, max: number, step: number, def?: number): PropSpec => ({ type: 'number', min, max, step, default: def });
const color = (def?: string): PropSpec => ({ type: 'color', default: def });
const oneOf = (values: string[], def?: string): PropSpec => ({ type: 'enum', values, default: def });
const bool = (def: boolean): PropSpec => ({ type: 'boolean', default: def });
const str = (def = ''): PropSpec => ({ type: 'string', default: def });
const nums = (def?: number[]): PropSpec => ({ type: 'array', default: def });
const json = (def?: unknown): PropSpec => ({ type: 'json', default: def });
const font: PropSpec = { type: 'font', default: ['Noto Sans Regular'] };

export const NUMBER_SPEC: PropSpec = num(-Infinity, Infinity, 0.1);

const OPACITY = num(0, 1, 0.01, 1);
const ANCHORS = ['center', 'left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
const ALIGN = ['map', 'viewport', 'auto'];

type SpecMap = Record<string, PropSpec>;

export const PROPS: Record<string, { paint: SpecMap; layout: SpecMap }> = {
  background: {
    paint: {
      'background-color': color('#000000'),
      'background-opacity': OPACITY,
      'background-pattern': str(),
    },
    layout: {},
  },
  fill: {
    paint: {
      'fill-color': color('#000000'),
      'fill-opacity': OPACITY,
      'fill-outline-color': color(),
      'fill-antialias': bool(true),
      'fill-pattern': str(),
      'fill-translate': nums([0, 0]),
    },
    layout: {},
  },
  line: {
    paint: {
      'line-color': color('#000000'),
      'line-width': num(0, 40, 0.1, 1),
      'line-opacity': OPACITY,
      'line-gap-width': num(0, 40, 0.1, 0),
      'line-offset': num(-20, 20, 0.1, 0),
      'line-blur': num(0, 20, 0.1, 0),
      'line-dasharray': nums(),
      'line-pattern': str(),
    },
    layout: {
      'line-cap': oneOf(['butt', 'round', 'square'], 'butt'),
      'line-join': oneOf(['bevel', 'round', 'miter'], 'miter'),
      'line-miter-limit': num(0, 10, 0.1, 2),
      'line-round-limit': num(0, 2, 0.01, 1.05),
    },
  },
  'fill-extrusion': {
    paint: {
      'fill-extrusion-color': color('#000000'),
      'fill-extrusion-opacity': OPACITY,
      'fill-extrusion-height': num(0, 500, 1, 0),
      'fill-extrusion-base': num(0, 500, 1, 0),
      'fill-extrusion-vertical-gradient': bool(true),
      'fill-extrusion-translate': nums([0, 0]),
    },
    layout: {},
  },
  circle: {
    paint: {
      'circle-color': color('#000000'),
      'circle-radius': num(0, 50, 0.5, 5),
      'circle-opacity': OPACITY,
      'circle-blur': num(0, 1, 0.01, 0),
      'circle-stroke-color': color('#000000'),
      'circle-stroke-width': num(0, 20, 0.5, 0),
      'circle-stroke-opacity': OPACITY,
      'circle-pitch-alignment': oneOf(['map', 'viewport'], 'viewport'),
    },
    layout: {},
  },
  symbol: {
    paint: {
      'text-color': color('#000000'),
      'text-opacity': OPACITY,
      'text-halo-color': color('rgba(0, 0, 0, 0)'),
      'text-halo-width': num(0, 10, 0.1, 0),
      'text-halo-blur': num(0, 10, 0.1, 0),
      'icon-color': color('#000000'),
      'icon-opacity': OPACITY,
      'icon-halo-color': color('rgba(0, 0, 0, 0)'),
      'icon-halo-width': num(0, 10, 0.1, 0),
    },
    layout: {
      'text-field': str(),
      'text-font': font,
      'text-size': num(1, 48, 0.5, 16),
      'text-transform': oneOf(['none', 'uppercase', 'lowercase'], 'none'),
      'text-letter-spacing': num(0, 1, 0.01, 0),
      'text-line-height': num(0.8, 3, 0.05, 1.2),
      'text-max-width': num(1, 30, 0.5, 10),
      'text-anchor': oneOf(ANCHORS, 'center'),
      'text-justify': oneOf(['auto', 'left', 'center', 'right'], 'center'),
      'text-offset': nums([0, 0]),
      'text-padding': num(0, 20, 0.5, 2),
      'text-rotation-alignment': oneOf(ALIGN, 'auto'),
      'text-allow-overlap': bool(false),
      'text-ignore-placement': bool(false),
      'text-optional': bool(false),
      'icon-image': str(),
      'icon-size': num(0, 5, 0.05, 1),
      'icon-anchor': oneOf(ANCHORS, 'center'),
      'icon-offset': nums([0, 0]),
      'icon-allow-overlap': bool(false),
      'icon-optional': bool(false),
      'symbol-placement': oneOf(['point', 'line', 'line-center'], 'point'),
      'symbol-spacing': num(1, 1000, 10, 250),
      'symbol-avoid-edges': bool(false),
      'symbol-sort-key': json(),
    },
  },
  raster: {
    paint: {
      'raster-opacity': OPACITY,
      'raster-hue-rotate': num(0, 360, 1, 0),
      'raster-saturation': num(-1, 1, 0.01, 0),
      'raster-contrast': num(-1, 1, 0.01, 0),
      'raster-brightness-min': num(0, 1, 0.01, 0),
      'raster-brightness-max': num(0, 1, 0.01, 1),
    },
    layout: {},
  },
  hillshade: {
    paint: {
      'hillshade-shadow-color': color('#000000'),
      'hillshade-highlight-color': color('#ffffff'),
      'hillshade-accent-color': color('#000000'),
      'hillshade-exaggeration': num(0, 1, 0.01, 0.5),
      'hillshade-illumination-direction': num(0, 359, 1, 335),
    },
    layout: {},
  },
  heatmap: {
    paint: {
      'heatmap-radius': num(1, 100, 1, 30),
      'heatmap-weight': num(0, 5, 0.1, 1),
      'heatmap-intensity': num(0, 5, 0.1, 1),
      'heatmap-opacity': OPACITY,
      'heatmap-color': json(),
    },
    layout: {},
  },
};

/** Main paint property used for the layer swatch. */
export const SWATCH_PROP: Record<string, string> = {
  background: 'background-color',
  fill: 'fill-color',
  line: 'line-color',
  'fill-extrusion': 'fill-extrusion-color',
  circle: 'circle-color',
  symbol: 'text-color',
  hillshade: 'hillshade-shadow-color',
};

export const GROUPS = [
  ['overlay', 'Routen & Overlays'],
  ['background', 'Hintergrund'],
  ['water', 'Wasser'],
  ['landuse', 'Landnutzung & Natur'],
  ['roads', 'Straßen & Wege'],
  ['transit', 'Bahn, Flug & Fähre'],
  ['buildings', 'Gebäude'],
  ['boundaries', 'Grenzen'],
  ['labels', 'Beschriftungen'],
  ['poi', 'POIs'],
  ['other', 'Sonstiges'],
] as const;

export type GroupId = (typeof GROUPS)[number][0];

const GROUP_LABEL = Object.fromEntries(GROUPS) as Record<GroupId, string>;

export const groupLabel = (id: GroupId) => t(GROUP_LABEL[id]);

/** Group layers by OpenMapTiles source layer; falls back to "other" for custom schemas. */
export function groupOf(layer: { id: string; type: string; source?: string; 'source-layer'?: string }): GroupId {
  if (layer.type === 'background') return 'background';
  if ((layer as { source?: string }).source?.startsWith('mapstyler-')) return 'overlay';
  const sl = layer['source-layer'] || '';
  if (layer.type === 'symbol') return sl === 'poi' || sl === 'aerodrome_label' ? 'poi' : 'labels';
  if (sl === 'water' || sl === 'waterway') return 'water';
  if (sl === 'landcover' || sl === 'landuse' || sl === 'park' || sl === 'mountain_peak') return 'landuse';
  if (sl === 'transportation') return /rail|transit|ferry|aeroway|cablecar|subway|tram/.test(layer.id) ? 'transit' : 'roads';
  if (sl === 'aeroway') return 'transit';
  if (sl === 'building') return 'buildings';
  if (sl === 'boundary') return 'boundaries';
  return 'other';
}

const PREFIXES: Array<[string, string]> = [
  ['fill-extrusion-', '3D'], ['background-', ''], ['fill-', ''], ['line-', ''], ['circle-', ''],
  ['text-', 'Text'], ['icon-', 'Icon'], ['symbol-', 'Symbol'], ['raster-', ''], ['hillshade-', ''], ['heatmap-', ''],
];

const WORDS: Record<string, string> = {
  color: 'Farbe', opacity: 'Deckkraft', width: 'Breite', 'gap-width': 'Lückenbreite', offset: 'Versatz',
  blur: 'Unschärfe', dasharray: 'Strichmuster', pattern: 'Muster', 'outline-color': 'Konturfarbe',
  antialias: 'Kantenglättung', translate: 'Verschiebung', cap: 'Linienende', join: 'Linienecken',
  'miter-limit': 'Gehrungsgrenze', 'round-limit': 'Rundungsgrenze', radius: 'Radius',
  'stroke-color': 'Randfarbe', 'stroke-width': 'Randbreite', 'stroke-opacity': 'Rand-Deckkraft',
  'pitch-alignment': 'Neigungsausrichtung', height: 'Höhe', base: 'Sockel', 'vertical-gradient': 'Vertikaler Verlauf',
  'halo-color': 'Halo-Farbe', 'halo-width': 'Halo-Breite', 'halo-blur': 'Halo-Unschärfe', field: 'Inhalt',
  font: 'Schrift', size: 'Größe', transform: 'Schreibweise', 'letter-spacing': 'Laufweite',
  'line-height': 'Zeilenhöhe', 'max-width': 'Max. Breite', anchor: 'Anker', justify: 'Ausrichtung',
  padding: 'Abstand', 'rotation-alignment': 'Drehausrichtung', 'allow-overlap': 'Überlappen erlauben',
  'ignore-placement': 'Platzierung ignorieren', optional: 'Optional', image: 'Bild', placement: 'Platzierung',
  spacing: 'Abstand', 'avoid-edges': 'Kachelränder meiden', 'sort-key': 'Sortierschlüssel',
  'hue-rotate': 'Farbton drehen', saturation: 'Sättigung', contrast: 'Kontrast',
  'brightness-min': 'Helligkeit min.', 'brightness-max': 'Helligkeit max.', 'shadow-color': 'Schattenfarbe',
  'highlight-color': 'Lichtfarbe', 'accent-color': 'Akzentfarbe', exaggeration: 'Überhöhung',
  'illumination-direction': 'Lichtrichtung', weight: 'Gewichtung', intensity: 'Intensität',
};

export function propLabel(name: string): string {
  for (const [prefix, group] of PREFIXES) {
    if (!name.startsWith(prefix)) continue;
    const rest = name.slice(prefix.length);
    const word = WORDS[rest] ? t(WORDS[rest]) : rest;
    return group ? `${group} · ${word}` : word;
  }
  return name;
}
