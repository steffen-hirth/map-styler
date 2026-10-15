// Templates that go beyond recoloring: translucent 3D glass buildings with sky
// and light, and a terminal-style ASCII look built from character patterns.

import { groupOf } from '../runtime/style/spec';
import { setLayerProp } from '../runtime/style/style-utils';
import { GLASS_KEY, type GlassConfig } from '../runtime/glass';
import type { Layer, Style } from '../runtime/style/types';
import { boxImageId, patternImageId, type PatternChar } from '../runtime/tooltips/pin-icons';
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
  /** Soft glowing outline of the footprints, visible through the glass. */
  edge: string;
  /** Settings for the WebGL glass renderer in the tooltip script. */
  fx: Partial<GlassConfig>;
  light: Record<string, unknown>;
  sky: Record<string, unknown>;
};

const HEIGHT = ['coalesce', ['get', 'render_height'], 0];

/**
 * Glass buildings: clear, height-shaded extrusions that let the streets shine
 * through, plus a glowing footprint outline.
 */
function glass({ low, high, opacity, ground, edge, fx, light, sky }: GlassOptions) {
  return (style: Style): Style => {
    const layers: Layer[] = [];
    let extrusion: string | null = null;
    for (const layer of style.layers) {
      if (groupOf(layer) === 'overlay') {
        layers.push(layer);
        continue;
      }
      if (layer.type === 'fill-extrusion') {
        extrusion ??= layer.id;
        // Footprint glow first, so it is seen through the glass.
        layers.push({
          id: `${layer.id}-glass-edge`,
          type: 'line',
          source: layer.source,
          'source-layer': layer['source-layer'],
          minzoom: 14,
          layout: { 'line-join': 'round' },
          paint: { 'line-color': edge, 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 18, 3], 'line-blur': 1, 'line-opacity': 0.9 },
        });
        layers.push({
          ...layer,
          minzoom: 13,
          paint: {
            ...layer.paint,
            'fill-extrusion-color': ['interpolate', ['linear'], HEIGHT, 0, low, 90, high],
            'fill-extrusion-opacity': opacity,
            'fill-extrusion-vertical-gradient': true,
          },
        });
        continue;
      }
      if (layer.type === 'fill' && groupOf(layer) === 'buildings') {
        layers.push({ ...layer, paint: { 'fill-color': ground, 'fill-outline-color': ground } });
        continue;
      }
      // Road shields would break the calm 3D look.
      if (layer.type === 'symbol' && /ref/.test(JSON.stringify(layer.layout?.['text-field'] ?? ''))) {
        layers.push(hide(layer));
        continue;
      }
      layers.push(layer);
    }
    // With the tooltip script, the extrusion is rendered as refracting glass;
    // without it the translucent extrusion above is the fallback.
    const metadata = extrusion ? { ...style.metadata, [GLASS_KEY]: { ...fx, layer: extrusion } } : style.metadata;
    return { ...style, layers, light, sky, metadata };
  };
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


// Illustration, typography and play-mat looks ---------------------------------

/** 3 motorway/trunk/primary, 2 secondary/tertiary, 1 streets, 0 service/paths. */
function roadRank(id: string): number {
  if (/motorway|trunk|primary/.test(id)) return 3;
  if (/secondary|tertiary/.test(id)) return 2;
  if (/service|track|path|pedestrian/.test(id)) return 0;
  return 1;
}

const widthByRank = (rank: number, low: number[], high: number[]) => ['interpolate', ['exponential', 1.4], ['zoom'], 12, low[rank], 18, high[rank]];

const isStreetName = (layer: Layer) => layer.id.startsWith('highway-name');
const isShield = (layer: Layer) => /ref/.test(JSON.stringify(layer.layout?.['text-field'] ?? ''));

const IL = { paper: '#dcdbd5', stripe: '#e8574a', ink: '#23243a', water: '#ccd2d5' };

/** Print illustration: red hatched blocks, paper streets, spaced ink capitals. */
function illustration(style: Style): Style {
  return eachLayer(style, (layer) => {
    const group = groupOf(layer);
    if (layer.type === 'background') return { ...layer, paint: { 'background-pattern': patternImageId('stripe', IL.stripe, IL.paper) } };
    if (layer.type === 'fill-extrusion') return hide(layer);
    if (layer.type === 'fill') return group === 'water' ? { ...layer, paint: { 'fill-color': IL.water } } : hide(layer);
    if (layer.type === 'line') {
      if (/casing|hatching/.test(layer.id) || group === 'boundaries') return hide(layer);
      if (group === 'water') return { ...layer, paint: { 'line-color': IL.water, 'line-width': pick(layer.paint, ['line-width'])['line-width'] ?? 2 } };
      if (group === 'transit') return { ...layer, paint: { 'line-color': IL.ink, 'line-width': 1.6 } };
      const rank = roadRank(layer.id);
      return { ...layer, paint: { 'line-color': IL.paper, 'line-width': widthByRank(rank, [0.5, 1.2, 2, 3], [4, 12, 18, 24]) } };
    }
    if (layer.type === 'symbol') {
      if (group === 'poi' || isShield(layer)) return hide(layer);
      return {
        ...layer,
        layout: { ...layer.layout, 'text-transform': 'uppercase', 'text-letter-spacing': 0.14, 'text-font': ['Noto Sans Bold'] },
        paint: { 'text-color': IL.ink, 'text-halo-color': IL.paper, 'text-halo-width': 1, 'icon-opacity': 0 },
      };
    }
    return layer;
  });
}

const TY = { bg: '#1d1d1d', sand: '#d6bf86', water: '#2a2a2a' };

/** Street-name poster: sand streets on black, names set in sand boxes, big for big roads. */
function typography(style: Style): Style {
  const size = ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], 26, ['secondary', 'tertiary'], 19, 13];
  return eachLayer(style, (layer) => {
    const group = groupOf(layer);
    if (layer.type === 'background') return { ...layer, paint: { 'background-color': TY.bg } };
    if (layer.type === 'fill-extrusion') return hide(layer);
    if (layer.type === 'fill') return group === 'water' ? { ...layer, paint: { 'fill-color': TY.water } } : hide(layer);
    if (layer.type === 'line') {
      if (/casing|hatching/.test(layer.id) || group === 'boundaries' || group === 'transit') return hide(layer);
      if (group === 'water') return { ...layer, paint: { 'line-color': TY.water, 'line-width': 2 } };
      const rank = roadRank(layer.id);
      return { ...layer, paint: { 'line-color': TY.sand, 'line-width': widthByRank(rank, [0.3, 0.7, 1, 1.6], [1.5, 3, 5, 7]) } };
    }
    if (layer.type === 'symbol') {
      if (group === 'poi' || isShield(layer)) return hide(layer);
      if (isStreetName(layer)) {
        return {
          ...layer,
          layout: {
            ...layer.layout,
            'text-font': ['Noto Sans Bold'],
            'text-transform': 'uppercase',
            'text-size': ['interpolate', ['linear'], ['zoom'], 14, ['*', size, 0.55], 18, ['*', size, 1.25]],
            'text-letter-spacing': 0.02,
            'text-rotation-alignment': 'map',
            'text-max-angle': 25,
            'text-padding': 6,
            'symbol-spacing': 420,
            'icon-image': boxImageId(TY.sand),
            'icon-text-fit': 'both',
            'icon-text-fit-padding': [1, 5, 1, 5],
            'icon-rotation-alignment': 'map',
          },
          paint: { 'text-color': TY.bg, 'text-halo-width': 0, 'icon-opacity': 1 },
        };
      }
      return {
        ...layer,
        layout: { ...layer.layout, 'text-transform': 'uppercase', 'text-font': ['Noto Sans Bold'] },
        paint: { 'text-color': TY.sand, 'text-halo-color': TY.bg, 'text-halo-width': 2 },
      };
    }
    return layer;
  });
}

const KID = { grass: '#5aa84a', meadow: '#4c9a3d', road: '#4b5563', edge: '#3b4350', water: '#4fa3e0', sand: '#e8a35a', path: '#c9a26b' };

/** Children's play mat: green land, grey roads with dashed centre lines, colourful houses. */
function playMat(style: Style): Style {
  const layers: Layer[] = [];
  for (const layer of style.layers) {
    const group = groupOf(layer);
    if (group === 'overlay') {
      layers.push(layer);
      continue;
    }
    if (layer.type === 'background') {
      layers.push({ ...layer, paint: { 'background-color': KID.grass } });
    } else if (layer.type === 'fill') {
      const color =
        group === 'water' ? KID.water : group === 'buildings' ? '#d9473f' : /sand|beach/.test(layer.id) ? KID.sand : /wood|park|grass|forest/.test(layer.id) ? KID.meadow : KID.grass;
      layers.push({ ...layer, paint: { 'fill-color': color, 'fill-opacity': 1 } });
    } else if (layer.type === 'fill-extrusion') {
      layers.push({
        ...layer,
        minzoom: 13,
        paint: {
          'fill-extrusion-color': ['match', ['%', ['round', ['coalesce', ['get', 'render_height'], 0]], 4], 0, '#e2504a', 1, '#f2c14e', 2, '#f08a4b', '#7cc4f0'],
          'fill-extrusion-height': ['max', ['coalesce', ['get', 'render_height'], 0], 5],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      });
    } else if (layer.type === 'line') {
      if (group === 'boundaries' || /hatching/.test(layer.id)) {
        layers.push(hide(layer));
        continue;
      }
      if (group === 'water') {
        layers.push({ ...layer, paint: { ...pick(layer.paint, ['line-width']), 'line-color': KID.water } });
        continue;
      }
      if (group !== 'roads') {
        layers.push(layer);
        continue;
      }
      const rank = roadRank(layer.id);
      const casing = /casing/.test(layer.id);
      const width = widthByRank(rank, casing ? [1, 2.4, 3.4, 4.8] : [0.6, 1.8, 2.8, 4], casing ? [6, 18, 26, 34] : [4, 15, 22, 30]);
      const color = rank === 0 ? KID.path : casing ? KID.edge : KID.road;
      layers.push({ ...layer, paint: { 'line-color': color, 'line-width': width } });
      // Dashed white centre line on real roads.
      if (!casing && rank >= 1) {
        layers.push({
          id: `${layer.id}-centerline`,
          type: 'line',
          source: layer.source,
          'source-layer': layer['source-layer'],
          ...(layer.filter ? { filter: layer.filter } : {}),
          minzoom: 14,
          layout: { 'line-cap': 'butt', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 18, 2.4], 'line-dasharray': [3, 3] },
        });
      }
    } else if (layer.type === 'symbol') {
      layers.push(
        isShield(layer)
          ? hide(layer)
          : { ...layer, layout: { ...layer.layout, 'text-font': ['Noto Sans Bold'] }, paint: { ...layer.paint, 'text-color': '#ffffff', 'text-halo-color': '#2d3748', 'text-halo-width': 1.8 } },
      );
    } else {
      layers.push(layer);
    }
  }
  return {
    ...style,
    layers,
    light: { anchor: 'viewport', color: '#ffffff', intensity: 0.35, position: [1.4, 210, 40] },
    sky: { 'sky-color': '#9fd4ff', 'horizon-color': '#dff1ff', 'fog-color': '#cfe9ff', 'sky-horizon-blend': 0.5, 'horizon-fog-blend': 0.8, 'fog-ground-blend': 0.6, 'atmosphere-blend': 0 },
  };
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
          low: '#dff4ff',
          high: '#8fdcff',
          opacity: 0.28,
          ground: '#e9f1f6',
          edge: '#1fb4f0',
          fx: { tint: '#dff4ff', tintStrength: 0.12, refraction: 16, blur: 1.5, rim: '#ffffff', rimStrength: 0.9, specular: 0.9 },
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
      low: '#f4faff',
      high: '#a9d2f6',
      opacity: 0.38,
      ground: '#e2ebf3',
      edge: '#8fc2f2',
      fx: { tint: '#cfe6fb', tintStrength: 0.22, refraction: 12, blur: 2.5, rim: '#ffffff', rimStrength: 0.7, specular: 0.6 },
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
      opacity: 0.45,
      ground: '#0c1726',
      edge: '#4fd8ff',
      fx: { tint: '#0f3b52', tintStrength: 0.2, refraction: 16, blur: 1.5, rim: '#4fd8ff', rimStrength: 0.9, specular: 0.5 },
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
  {
    id: 'illustration',
    name: 'Illustration',
    description: 'Wie gedruckt: rot schraffierte Blöcke, Papierstraßen, gesperrte Versalien.',
    base: 'liberty',
    preview: { colors: ['#dcdbd5', '#e8a39a', '#dcdbd5', '#e8574a'], route: '#23243a' },
    language: 'de',
    extras: illustration,
    view: { zoom: 15.5, pitch: 0, bearing: 0 },
    tooltip: { background: IL.ink, color: IL.paper, radius: 2, borderWidth: 0, shadow: 'none', tip: false, fontFamily: INTER, padding: 12 },
    route: {
      color: IL.ink,
      width: 3,
      casingColor: IL.paper,
      casingWidth: 1.5,
      arrows: false,
      pointColor: IL.ink,
      pointStroke: IL.paper,
      pinColor: IL.ink,
      labelColor: IL.ink,
      labelHalo: IL.paper,
    },
  },
  {
    id: 'typo',
    name: 'Typo',
    description: 'Poster aus Straßennamen: sandfarbene Schilder auf Schwarz.',
    base: 'liberty',
    preview: { colors: ['#1d1d1d', '#2a2a2a', '#1d1d1d', '#d6bf86'], route: '#e85d3f' },
    language: 'de',
    extras: typography,
    view: { zoom: 16, pitch: 0, bearing: 0 },
    tooltip: { background: TY.sand, color: TY.bg, radius: 0, borderWidth: 0, shadow: 'none', tip: true, fontFamily: INTER },
    route: {
      color: '#e85d3f',
      width: 4,
      casingColor: TY.bg,
      casingWidth: 1.5,
      arrows: false,
      pointColor: TY.bg,
      pointStroke: '#e85d3f',
      pinColor: '#e85d3f',
      labelColor: TY.sand,
      labelHalo: TY.bg,
    },
  },
  {
    id: 'playmat',
    name: 'Kinderspielteppich',
    description: 'Grüne Wiese, graue Straßen mit Mittellinie, bunte Häuschen.',
    base: 'liberty',
    preview: { colors: ['#5aa84a', '#4c9a3d', '#4b5563', '#f2c14e'], route: '#ff8a3d' },
    language: 'de',
    extras: playMat,
    view: { zoom: 16.2, pitch: 45, bearing: -15 },
    tooltip: { background: '#fffdf5', color: '#2d3748', radius: 16, borderColor: '#ff8a3d', borderWidth: 2, shadow: 'soft', fontFamily: INTER },
    route: {
      color: '#ff8a3d',
      width: 5,
      dash: 'dashed',
      casingColor: '#ffffff',
      casingWidth: 2,
      arrows: false,
      pointColor: '#ffffff',
      pointStroke: '#ff8a3d',
      pinColor: '#ff8a3d',
      labelColor: '#ffffff',
      labelHalo: '#2d3748',
    },
  },
];
