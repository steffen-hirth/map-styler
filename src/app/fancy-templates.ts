// Templates that go beyond recoloring: translucent 3D glass buildings with sky
// and light, and a terminal-style ASCII look built from character patterns.

import { groupOf } from '../runtime/style/spec';
import { setLayerProp } from '../runtime/style/style-utils';
import type { Layer, Style } from '../runtime/style/types';
import { patternImageId, type PatternChar } from '../runtime/tooltips/pin-icons';
import type { Template } from './templates';

const INTER = '"Inter Variable", "Inter", system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const SCHLOSSPLATZ: [number, number] = [9.1795, 48.7784];

const hide = (layer: Layer) => setLayerProp(layer, 'layout', 'visibility', 'none');

/** Map every non-overlay layer; route layers keep their own styling. */
const eachLayer = (style: Style, fn: (layer: Layer) => Layer): Style => ({
  ...style,
  layers: style.layers.map((layer) => (groupOf(layer) === 'overlay' ? layer : fn(layer))),
});

const pick = (bag: Record<string, unknown> | undefined, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => bag?.[k] !== undefined).map((k) => [k, bag![k]]));

type GlassOptions = {
  low: string;
  high: string;
  opacity: number;
  ground: string;
  light: Record<string, unknown>;
  sky: Record<string, unknown>;
};

/** Translucent extrusions shaded by height, flat footprints underneath, plus sky and light. */
function glass({ low, high, opacity, ground, light, sky }: GlassOptions) {
  return (style: Style): Style => ({
    ...eachLayer(style, (layer) => {
      if (layer.type === 'fill-extrusion') {
        return {
          ...layer,
          minzoom: 13,
          paint: {
            ...layer.paint,
            'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, low, 90, high],
            'fill-extrusion-opacity': opacity,
            'fill-extrusion-vertical-gradient': true,
          },
        };
      }
      if (layer.type === 'fill' && groupOf(layer) === 'buildings') {
        return { ...layer, paint: { 'fill-color': ground, 'fill-outline-color': ground } };
      }
      // Road shields would break the calm 3D look.
      if (layer.type === 'symbol' && /ref/.test(JSON.stringify(layer.layout?.['text-field'] ?? ''))) return hide(layer);
      return layer;
    }),
    light,
    sky,
  });
}

/** Streets as softly glowing cyan traces inside milky glass channels. */
function circuitRoads(style: Style): Style {
  return eachLayer(style, (layer) => {
    const group = groupOf(layer);
    if (layer.type !== 'line' || (group !== 'roads' && group !== 'transit')) return layer;
    const keep = pick(layer.paint, ['line-width', 'line-offset', 'line-gap-width']);
    if (/casing/.test(layer.id)) {
      return { ...layer, paint: { ...keep, 'line-color': 'rgba(255, 255, 255, 0.8)', 'line-blur': 1.5 } };
    }
    return {
      ...layer,
      paint: { ...keep, 'line-color': group === 'transit' ? '#9fdcf2' : '#43c6f5', 'line-opacity': 0.85, 'line-blur': 0.4 },
    };
  });
}

const ASCII = { bg: '#0a0f0a', fg: '#33ff66', dim: '#1f7a3a', water: '#2ad4c0', accent: '#ffb000' };

/** Terminal look: character patterns for areas, dashed green lines, uppercase labels. */
function ascii(style: Style): Style {
  const { bg, fg, dim, water } = ASCII;
  const pattern = (char: PatternChar, color: string) => ({ 'fill-pattern': patternImageId(char, color, bg), 'fill-opacity': 1 });
  return eachLayer(style, (layer) => {
    const group = groupOf(layer);
    switch (layer.type) {
      case 'background':
        return { ...layer, paint: { 'background-color': bg } };
      case 'fill-extrusion':
        return hide(layer);
      case 'fill': {
        const paint =
          group === 'water' ? pattern('tilde', water) : group === 'buildings' ? pattern('hash', fg) : group === 'landuse' ? pattern('dot', dim) : { 'fill-color': bg };
        return { ...layer, paint };
      }
      case 'line': {
        if (/casing/.test(layer.id)) return hide(layer);
        const color = group === 'water' ? water : group === 'roads' ? fg : dim;
        const dash = group === 'roads' ? [2, 1.2] : group === 'boundaries' ? [1, 2] : group === 'transit' ? [1, 1] : undefined;
        return {
          ...layer,
          paint: {
            ...pick(layer.paint, ['line-width', 'line-offset', 'line-gap-width']),
            'line-color': color,
            'line-opacity': group === 'roads' ? 0.9 : 0.7,
            ...(dash ? { 'line-dasharray': dash } : {}),
          },
        };
      }
      case 'symbol': {
        if (group === 'poi') return hide(layer);
        return {
          ...layer,
          layout: { ...layer.layout, 'text-transform': 'uppercase', 'text-letter-spacing': 0.12, 'text-font': ['Noto Sans Regular'] },
          paint: { 'text-color': fg, 'text-halo-color': bg, 'text-halo-width': 2, 'icon-opacity': 0 },
        };
      }
      case 'circle':
        return { ...layer, paint: { ...layer.paint, 'circle-color': fg } };
      default:
        return layer;
    }
  });
}

export const FANCY_TEMPLATES: Template[] = [
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    description: 'Silbriges Glas, Straßen als leuchtende Cyan-Bahnen, Tooltips mit Unschärfe.',
    base: 'liberty',
    preview: { colors: ['#f3f6f9', '#dfe9f1', '#c9e7f6', '#7fd9ff'], route: '#0a5bd8' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#e8edf1', '#f3f5f8'],
        landuse: ['#e3e9ee', '#edf1f4'],
        water: ['#cfdde8', '#dfe8ef'],
        boundaries: ['#c3cdd6', '#d4dce3'],
        other: ['#e6ebef', '#eff2f5'],
      },
      labels: { text: '#5a6b7a', halo: 'rgba(255, 255, 255, 0.95)', haloWidth: 1.4 },
      hide: ['poi'],
    },
    extras: (style) =>
      circuitRoads(
        glass({
          low: '#ffffff',
          high: '#bfe9ff',
          opacity: 0.45,
          ground: '#e4edf3',
          light: { anchor: 'viewport', color: '#ffffff', intensity: 0.5, position: [1.4, 200, 35] },
          sky: {
            'sky-color': '#e3eef6',
            'horizon-color': '#f7fafc',
            'fog-color': '#f1f5f8',
            'sky-horizon-blend': 0.7,
            'horizon-fog-blend': 0.9,
            'fog-ground-blend': 0.7,
            'atmosphere-blend': 0,
          },
        })(style),
      ),
    view: { center: SCHLOSSPLATZ, zoom: 15.8, pitch: 58, bearing: -18 },
    tooltip: {
      background: 'rgba(255, 255, 255, 0.34)',
      color: '#0f2533',
      borderColor: 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      radius: 18,
      padding: 14,
      shadow: 'strong',
      blur: 18,
      tip: false,
      fontFamily: INTER,
    },
    route: {
      color: '#0a5bd8',
      width: 4,
      casingColor: 'rgba(10, 91, 216, 0.22)',
      casingWidth: 5,
      arrows: false,
      pointColor: '#ffffff',
      pointStroke: '#0a5bd8',
      pinColor: '#0a5bd8',
      labelColor: '#0f2533',
      labelHalo: 'rgba(255, 255, 255, 0.95)',
    },
  },
  {
    id: 'glass',
    name: 'Glas',
    description: 'Helle Stadt mit Gebäuden aus Glas, 3D geneigt mit Himmel.',
    base: 'liberty',
    preview: { colors: ['#eef2f6', '#cfe3f3', '#9cc9f5', '#ffffff'], route: '#2d6fd2' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#e6ebf0', '#eef2f6'],
        landuse: ['#dfe6ea', '#e9eef1'],
        water: ['#b4d0e6', '#cadeee'],
        roads: ['#d3dbe3', '#ffffff', 0.86, 0.97],
        transit: ['#cfd7df', '#dde4ea'],
        boundaries: ['#b9c4cf', '#ccd5de'],
        other: ['#e3e9ee', '#ecf0f4'],
      },
      labels: { text: '#4a5562', halo: 'rgba(255, 255, 255, 0.95)', haloWidth: 1.4 },
      hide: ['poi'],
    },
    extras: glass({
      low: '#eef7ff',
      high: '#8fc2f2',
      opacity: 0.62,
      ground: '#dbe5ee',
      light: { anchor: 'viewport', color: '#ffffff', intensity: 0.45, position: [1.3, 210, 40] },
      sky: {
        'sky-color': '#cfe6fb',
        'horizon-color': '#f1f6fb',
        'fog-color': '#eef3f8',
        'sky-horizon-blend': 0.6,
        'horizon-fog-blend': 0.8,
        'fog-ground-blend': 0.6,
        'atmosphere-blend': 0,
      },
    }),
    view: { center: SCHLOSSPLATZ, zoom: 15.6, pitch: 62, bearing: -28 },
    tooltip: {
      background: 'rgba(255, 255, 255, 0.86)',
      color: '#1f2b38',
      borderColor: 'rgba(143, 194, 242, 0.6)',
      radius: 14,
      shadow: 'strong',
      fontFamily: INTER,
    },
    route: { color: '#2d6fd2', width: 4, casingColor: '#ffffff', arrows: false, pointColor: '#ffffff', pointStroke: '#2d6fd2', pinColor: '#2d6fd2' },
  },
  {
    id: 'glass-night',
    name: 'Glas Nacht',
    description: 'Dunkle Stadt, leuchtende Glasgebäude, warme Route.',
    base: 'liberty',
    preview: { colors: ['#0b1220', '#0f3b52', '#070b14', '#4fd8ff'], route: '#ffb547' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#070b14', '#0b1220'],
        landuse: ['#0a101b', '#101826'],
        water: ['#050a14', '#08101e'],
        roads: ['#16202f', '#2a3a52', 0.86, 0.97],
        transit: ['#18202c', '#232d3d'],
        boundaries: ['#2a3550', '#3d4a66'],
        other: ['#0a101b', '#0e1522'],
      },
      labels: { text: '#9fb4cc', halo: '#070b14', haloWidth: 1.4 },
      hide: ['poi'],
    },
    extras: glass({
      low: '#0f3b52',
      high: '#4fd8ff',
      opacity: 0.72,
      ground: '#0e1a2a',
      light: { anchor: 'viewport', color: '#9fe8ff', intensity: 0.6, position: [1.3, 210, 40] },
      sky: {
        'sky-color': '#05070d',
        'horizon-color': '#13324a',
        'fog-color': '#0b1220',
        'sky-horizon-blend': 0.7,
        'horizon-fog-blend': 0.8,
        'fog-ground-blend': 0.5,
        'atmosphere-blend': 0,
      },
    }),
    view: { center: SCHLOSSPLATZ, zoom: 15.6, pitch: 65, bearing: 22 },
    tooltip: {
      background: 'rgba(10, 16, 28, 0.88)',
      color: '#e6f6ff',
      borderColor: 'rgba(79, 216, 255, 0.35)',
      radius: 12,
      shadow: 'strong',
      fontFamily: INTER,
    },
    route: {
      color: '#ffb547',
      width: 4,
      casingColor: '#070b14',
      arrows: false,
      pointColor: '#070b14',
      pointStroke: '#ffb547',
      pinColor: '#ffb547',
      labelColor: '#ffe1b0',
      labelHalo: '#070b14',
    },
  },
  {
    id: 'ascii',
    name: 'ASCII',
    description: 'Terminal-Optik aus Zeichen: # Gebäude, ~ Wasser, · Grün.',
    base: 'liberty',
    preview: { colors: ['#0a0f0a', '#0f2414', '#0a0f0a', '#1f7a3a'], route: ASCII.accent },
    extras: ascii,
    view: { zoom: 15, pitch: 0, bearing: 0 },
    tooltip: {
      background: ASCII.bg,
      color: ASCII.fg,
      fontFamily: MONO,
      fontSize: 12,
      radius: 0,
      borderColor: ASCII.fg,
      borderWidth: 1,
      shadow: 'none',
      tip: false,
    },
    route: {
      color: ASCII.accent,
      width: 3,
      dash: 'dashed',
      casingWidth: 0,
      arrows: false,
      pointColor: ASCII.bg,
      pointStroke: ASCII.accent,
      pinColor: ASCII.accent,
      pinStyle: 'dot',
      labelColor: ASCII.accent,
      labelHalo: ASCII.bg,
    },
    routeTooltips: {
      line: '&gt; {name}\n<i class="msx-icon-{mode}"></i>{trip_label}',
      points: '&gt; {name}\n<span style="opacity:.7">{label}</span>',
    },
  },
];
