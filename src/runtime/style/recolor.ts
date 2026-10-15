// Theme recoloring used by templates: every paint color of a layer group is
// mapped onto a two-color ramp by its lightness, so any base style can be
// turned into a coherent palette while keeping its internal contrast.

import { formatColor, hslToRgb, parseColor, rgbToHsl, walkColors, type Rgba } from './color';
import { groupOf, type GroupId } from './spec';
import { mapPaintColors, setLayerProp } from './style-utils';
import type { Style } from './types';

/**
 * [color for the darkest input, color for the lightest input] and an optional
 * lightness window [lo, hi]: inputs at or below lo get the dark color, at or
 * above hi the light one. A narrow window turns subtle differences (e.g. yellow
 * main roads vs. white side streets) into clear contrast.
 */
export type Ramp = [string, string] | [string, string, number, number];

export type LabelColors = { text: string; halo: string; haloWidth?: number };

export type Recipe = {
  ramps?: Partial<Record<GroupId, Ramp>>;
  /** Fixed text and halo colors for labels and POI names. */
  labels?: LabelColors;
  hide?: GroupId[];
};

const mix = (a: Rgba, b: Rgba, t: number): Rgba => ({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
  a: 1,
});

export function rampColor(input: string, ramp: Ramp): string {
  const c = parseColor(input);
  const dark = parseColor(ramp[0]);
  const light = parseColor(ramp[1]);
  if (!c || !dark || !light) return input;
  const [, , lo = 0, hi = 1] = ramp;
  const { l } = rgbToHsl(c.r, c.g, c.b);
  const t = hi > lo ? Math.min(1, Math.max(0, (l - lo) / (hi - lo))) : l;
  const out = mix(dark, light, t);
  return formatColor({ ...out, a: c.a });
}

const TEXT_GROUPS: GroupId[] = ['labels', 'poi'];

export function applyRecipe(style: Style, recipe: Recipe): Style {
  let next = style;
  for (const [group, ramp] of Object.entries(recipe.ramps ?? {}) as Array<[GroupId, Ramp]>) {
    // Text colors in label groups are handled by `labels`, if given.
    const skipText = recipe.labels && TEXT_GROUPS.includes(group);
    next = mapPaintColors(
      next,
      (s) => rampColor(s, ramp),
      (layer) => groupOf(layer) === group && !(skipText && layer.type === 'symbol'),
    );
  }

  if (recipe.labels) {
    const { text, halo, haloWidth } = recipe.labels;
    next = {
      ...next,
      layers: next.layers.map((layer) => {
        if (layer.type !== 'symbol' || !TEXT_GROUPS.includes(groupOf(layer)) || layer.layout?.['text-field'] === undefined) return layer;
        // Road shields draw their text on a sprite background; keep their contrast.
        if (/ref/.test(JSON.stringify(layer.layout['text-field']))) return layer;
        let l = setLayerProp(layer, 'paint', 'text-color', text);
        l = setLayerProp(l, 'paint', 'text-halo-color', halo);
        if (haloWidth !== undefined) l = setLayerProp(l, 'paint', 'text-halo-width', haloWidth);
        return l;
      }),
    };
  }

  if (recipe.hide?.length) {
    const hidden = new Set(recipe.hide);
    next = {
      ...next,
      layers: next.layers.map((layer) => (hidden.has(groupOf(layer)) ? setLayerProp(layer, 'layout', 'visibility', 'none') : layer)),
    };
  }
  return next;
}

/** Lightest opaque paint color of a group – the color a user would call "the" group color. */
export function groupColor(style: Style, group: GroupId): string | null {
  let best: { color: string; l: number } | null = null;
  for (const layer of style.layers) {
    if (groupOf(layer) !== group || layer.layout?.visibility === 'none') continue;
    for (const [key, value] of Object.entries(layer.paint ?? {})) {
      if (!key.includes('color')) continue;
      walkColors(value, (s) => {
        const c = parseColor(s);
        if (!c || c.a < 0.5) return;
        const { l } = rgbToHsl(c.r, c.g, c.b);
        if (!best || l > best.l) best = { color: formatColor(c), l };
      });
    }
  }
  return (best as { color: string } | null)?.color ?? null;
}

function lightnessRange(style: Style, group: GroupId): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const layer of style.layers) {
    if (groupOf(layer) !== group) continue;
    for (const [key, value] of Object.entries(layer.paint ?? {})) {
      if (!key.includes('color')) continue;
      walkColors(value, (s) => {
        const c = parseColor(s);
        if (!c) return;
        const { l } = rgbToHsl(c.r, c.g, c.b);
        min = Math.min(min, l);
        max = Math.max(max, l);
      });
    }
  }
  return Number.isFinite(min) ? [min, max] : null;
}

/**
 * Recolor a whole group so its lightest color becomes `color`; darker shades
 * (casings, outlines) keep their relative contrast below it.
 */
export function recolorGroupTo(style: Style, group: GroupId, color: string): Style {
  const range = lightnessRange(style, group);
  const target = parseColor(color);
  if (!range || !target) return style;
  const [lo, hi] = range;
  if (hi - lo < 0.02) return applyRecipe(style, { ramps: { [group]: [color, color] } });
  const { h, s, l } = rgbToHsl(target.r, target.g, target.b);
  const darker = formatColor({ ...hslToRgb(h, s, Math.max(0, l - (hi - lo))), a: 1 });
  return applyRecipe(style, { ramps: { [group]: [darker, color, lo, hi] } });
}
