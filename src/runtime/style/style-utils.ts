// Pure helpers for reading and transforming style values. Every function that
// changes a style returns a new object and leaves untouched layers shared, so
// history snapshots and React memoization stay cheap.

import { adjustColor, colorKey, formatColor, looksLikeColor, mapColorsDeep, parseColor, walkColors, type ColorAdjustment } from './color';
import { groupOf, NUMBER_SPEC, SWATCH_PROP, type GroupId, type PropSpec } from './spec';
import type { Layer, PropKind, Style } from './types';

const EXPR_OPS = new Set([
  'literal', 'get', 'has', 'step', 'match', 'case', 'coalesce', 'interpolate', 'concat', 'format',
  'to-string', 'zoom', 'let', 'var', 'image', 'number-format', 'upcase', 'downcase',
]);

export type Shape = 'unset' | 'literal' | 'stops' | 'expr';
export type Path = Array<string | number>;

export function isLiteral(value: unknown, spec: PropSpec): boolean {
  switch (spec.type) {
    case 'color':
      return typeof value === 'string' && parseColor(value) !== null;
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'enum':
      return typeof value === 'string' && spec.values.includes(value);
    case 'string':
      return typeof value === 'string';
    case 'array':
      return Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'number');
    case 'font':
      return Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string') && !EXPR_OPS.has(value[0]);
    default:
      return false;
  }
}

export type Stop = { z: number; v: unknown };
export type StopsModel =
  | { kind: 'legacy'; base: number; extra: Record<string, unknown>; stops: Stop[] }
  | { kind: 'expr'; base: number; curve: unknown[] | null; stops: Stop[] };

/** Recognize zoom-only legacy functions and ["interpolate", …, ["zoom"], …] expressions. */
export function readStops(value: unknown, spec: PropSpec): StopsModel | null {
  let model: StopsModel | null = null;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const fn = value as Record<string, unknown>;
    if (!Array.isArray(fn.stops) || fn.property !== undefined) return null;
    if (fn.type === 'categorical' || fn.type === 'identity') return null;
    const stops = fn.stops as unknown[];
    if (!stops.every((s) => Array.isArray(s) && typeof s[0] === 'number')) return null;
    const { stops: _stops, base, ...extra } = fn;
    model = {
      kind: 'legacy',
      base: typeof base === 'number' ? base : 1,
      extra,
      stops: (stops as [number, unknown][]).map(([z, v]) => ({ z, v })),
    };
  } else if (
    Array.isArray(value) &&
    value[0] === 'interpolate' &&
    Array.isArray(value[2]) &&
    value[2][0] === 'zoom' &&
    value.length >= 5
  ) {
    const interp = value[1];
    let base = 1;
    let curve: unknown[] | null = null;
    if (Array.isArray(interp) && interp[0] === 'exponential' && typeof interp[1] === 'number') base = interp[1];
    else if (!(Array.isArray(interp) && interp[0] === 'linear')) curve = interp as unknown[];
    const stops: Stop[] = [];
    for (let i = 3; i < value.length; i += 2) stops.push({ z: value[i] as number, v: value[i + 1] });
    model = { kind: 'expr', base, curve, stops };
  } else {
    return null;
  }
  return model.stops.every((s) => typeof s.z === 'number' && isLiteral(s.v, spec)) ? model : null;
}

export function writeStops(model: StopsModel): unknown {
  const stops = [...model.stops].sort((a, b) => a.z - b.z);
  if (model.kind === 'legacy') {
    const out: Record<string, unknown> = { ...model.extra, stops: stops.map((s) => [s.z, s.v]) };
    if (model.base !== 1) out.base = model.base;
    return out;
  }
  const interp = model.curve ?? (model.base === 1 ? ['linear'] : ['exponential', model.base]);
  return ['interpolate', interp, ['zoom'], ...stops.flatMap((s) => [s.z, s.v])];
}

export function shapeOf(value: unknown, spec: PropSpec): Shape {
  if (value === undefined) return 'unset';
  if (isLiteral(value, spec)) return 'literal';
  if (spec.type !== 'json' && readStops(value, spec)) return 'stops';
  return 'expr';
}

/** Turn a fixed value into a two-stop zoom ramp around the current zoom. */
export function toZoomStops(value: unknown, zoom: number): unknown {
  const z0 = Math.max(0, Math.floor(zoom) - 2);
  const z1 = Math.min(24, z0 + 4);
  return ['interpolate', ['linear'], ['zoom'], z0, value, z1, value];
}

export function stopValueNear(model: StopsModel, zoom: number): unknown {
  let best = model.stops[0];
  for (const stop of model.stops) if (Math.abs(stop.z - zoom) < Math.abs(best.z - zoom)) best = stop;
  return best.v;
}

export function getAt(root: unknown, path: Path): unknown {
  return path.reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string | number, unknown>)[key]), root);
}

export function setAt(root: unknown, path: Path, value: unknown): unknown {
  if (!path.length) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = root.slice();
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy;
  }
  const obj = { ...(root as Record<string, unknown>) };
  obj[head as string] = setAt(obj[head as string], rest, value);
  return obj;
}

export type ColorPath = { path: Path; color: string; label: string };

function formatLabel(v: unknown): string {
  if (Array.isArray(v) && v.every((x) => typeof x !== 'object')) return v.join(', ');
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function contextLabel(parent: unknown[] | null, index: number): string {
  if (!parent) return '';
  const op = parent[0];
  const prev = parent[index - 1];
  const isLast = index === parent.length - 1;
  let label = '';
  if (op === 'interpolate' || op === 'interpolate-hcl' || op === 'interpolate-lab') {
    const byZoom = Array.isArray(parent[2]) && parent[2][0] === 'zoom';
    label = typeof prev === 'number' ? (byZoom ? `z ${prev}` : `bei ${prev}`) : '';
  } else if (op === 'match') label = isLast ? 'sonst' : formatLabel(prev);
  else if (op === 'case') label = isLast ? 'sonst' : 'Fall';
  else if (op === 'step') label = index === 2 ? 'Start' : typeof prev === 'number' ? `ab ${prev}` : '';
  else if (op === 'coalesce') label = 'Fallback';
  return label.length > 28 ? label.slice(0, 27) + '…' : label;
}

/** All color literals inside a value, with a short hint where they sit. */
export function collectColorPaths(value: unknown): ColorPath[] {
  const out: ColorPath[] = [];
  const visit = (v: unknown, path: Path, named: boolean, parent: unknown[] | null, index: number) => {
    if (typeof v === 'string') {
      if (named ? parseColor(v) : looksLikeColor(v) && parseColor(v)) out.push({ path, color: v, label: contextLabel(parent, index) });
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((item, i) => visit(item, [...path, i], false, v, i));
      return;
    }
    if (v && typeof v === 'object') {
      for (const [key, item] of Object.entries(v)) {
        if (key === 'stops' && Array.isArray(item)) {
          item.forEach((stop, i) => {
            if (Array.isArray(stop) && typeof stop[1] === 'string' && parseColor(stop[1])) {
              out.push({ path: [...path, key, i, 1], color: stop[1], label: `z ${stop[0]}` });
            }
          });
        } else {
          visit(item, [...path, key], true, null, 0);
        }
      }
    }
  };
  visit(value, [], true, null, 0);
  return out;
}

export function firstColor(value: unknown): string | null {
  let found: string | null = null;
  walkColors(value, (s) => {
    if (!found) found = s;
  });
  return found;
}

export function swatchColor(layer: Layer): string | null {
  const prop = SWATCH_PROP[layer.type];
  return prop ? firstColor(layer.paint?.[prop]) : null;
}

export function setLayerProp(layer: Layer, kind: PropKind, name: string, value: unknown): Layer {
  const bag = { ...(layer[kind] ?? {}) };
  if (value === undefined) delete bag[name];
  else bag[name] = value;
  const next: Layer = { ...layer };
  if (Object.keys(bag).length) next[kind] = bag;
  else delete next[kind];
  return next;
}

export function isVisible(layer: Layer): boolean {
  return layer.layout?.visibility !== 'none';
}

export function uniqueLayerId(style: Style, base: string): string {
  const ids = new Set(style.layers.map((l) => l.id));
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** Map color strings in every paint color property; unchanged layers keep their identity. */
export function mapPaintColors(style: Style, fn: (color: string) => string, filter?: (layer: Layer) => boolean): Style {
  let changedAny = false;
  const layers = style.layers.map((layer) => {
    if (!layer.paint || (filter && !filter(layer))) return layer;
    let changed = false;
    const paint = { ...layer.paint };
    for (const [key, value] of Object.entries(paint)) {
      if (!key.includes('color')) continue;
      let touched = false;
      const next = mapColorsDeep(value, (s) => {
        const out = fn(s);
        if (out !== s) touched = true;
        return out;
      });
      if (touched) {
        paint[key] = next;
        changed = true;
      }
    }
    if (!changed) return layer;
    changedAny = true;
    return { ...layer, paint };
  });
  return changedAny ? { ...style, layers } : style;
}

export function adjustStyleColors(style: Style, adjustment: ColorAdjustment): Style {
  return mapPaintColors(style, (s) => {
    const c = parseColor(s);
    return c ? formatColor(adjustColor(c, adjustment)) : s;
  });
}

const roundTo = (v: number) => Math.round(v * 100) / 100;

function scaleNumberValue(value: unknown, factor: number): unknown {
  if (typeof value === 'number') return roundTo(value * factor);
  const model = readStops(value, NUMBER_SPEC);
  if (!model) return value;
  return writeStops({ ...model, stops: model.stops.map((s) => ({ ...s, v: roundTo((s.v as number) * factor) })) });
}

const hasText = (layer: Layer) => layer.type === 'symbol' && layer.layout?.['text-field'] !== undefined;

export function scaleTextSize(style: Style, factor: number): Style {
  if (factor === 1) return style;
  return {
    ...style,
    layers: style.layers.map((layer) =>
      hasText(layer)
        ? { ...layer, layout: { ...layer.layout, 'text-size': scaleNumberValue(layer.layout?.['text-size'] ?? 16, factor) } }
        : layer,
    ),
  };
}

export type LabelLanguage = 'local' | 'de' | 'en';

const LANGUAGE_FIELDS: Record<LabelLanguage, unknown> = {
  local: ['get', 'name'],
  de: ['coalesce', ['get', 'name:de'], ['get', 'name_de'], ['get', 'name']],
  en: ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
};

/** Replace name-based label fields; road refs and house numbers stay as they are. */
export function applyLabelLanguage(style: Style, language: LabelLanguage): { style: Style; count: number } {
  let count = 0;
  const layers = style.layers.map((layer) => {
    if (!hasText(layer)) return layer;
    const json = JSON.stringify(layer.layout?.['text-field']);
    if (!/name/.test(json) || /ref|housenumber/.test(json)) return layer;
    count++;
    return { ...layer, layout: { ...layer.layout, 'text-field': LANGUAGE_FIELDS[language] } };
  });
  return { style: count ? { ...style, layers } : style, count };
}

export function applyHalo(style: Style, color: string, width: number): Style {
  return {
    ...style,
    layers: style.layers.map((layer) =>
      hasText(layer) ? { ...layer, paint: { ...layer.paint, 'text-halo-color': color, 'text-halo-width': width } } : layer,
    ),
  };
}

export type ColorRef = { layerId: string; prop: string };
export type PaletteEntry = {
  key: string;
  color: string;
  count: number;
  refs: ColorRef[];
  layerIds: string[];
  groups: GroupId[];
};

export function collectPalette(style: Style, group?: GroupId | ''): PaletteEntry[] {
  const entries = new Map<string, PaletteEntry & { refKeys: Set<string> }>();
  for (const layer of style.layers) {
    if (group && groupOf(layer) !== group) continue;
    for (const [prop, value] of Object.entries(layer.paint ?? {})) {
      if (!prop.includes('color')) continue;
      walkColors(value, (s) => {
        const key = colorKey(s);
        if (!key) return;
        let entry = entries.get(key);
        if (!entry) {
          entry = { key, color: key, count: 0, refs: [], layerIds: [], groups: [], refKeys: new Set() };
          entries.set(key, entry);
        }
        entry.count++;
        const refKey = `${layer.id}\u0000${prop}`;
        if (!entry.refKeys.has(refKey)) {
          entry.refKeys.add(refKey);
          entry.refs.push({ layerId: layer.id, prop });
        }
        if (!entry.layerIds.includes(layer.id)) entry.layerIds.push(layer.id);
        const g = groupOf(layer);
        if (!entry.groups.includes(g)) entry.groups.push(g);
      });
    }
  }
  return [...entries.values()]
    .map(({ refKeys: _refKeys, ...entry }) => entry)
    .sort((a, b) => b.layerIds.length - a.layerIds.length || b.count - a.count);
}

/** Replace one color (compared by normalized key) inside the given layer properties. */
export function replaceColor(style: Style, refs: ColorRef[], fromKey: string, to: string): Style {
  const byLayer = new Map<string, string[]>();
  for (const ref of refs) byLayer.set(ref.layerId, [...(byLayer.get(ref.layerId) ?? []), ref.prop]);
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const props = byLayer.get(layer.id);
      if (!props || !layer.paint) return layer;
      const paint = { ...layer.paint };
      for (const prop of props) {
        if (paint[prop] === undefined) continue;
        paint[prop] = mapColorsDeep(paint[prop], (s) => (colorKey(s) === fromKey ? to : s));
      }
      return { ...layer, paint };
    }),
  };
}
