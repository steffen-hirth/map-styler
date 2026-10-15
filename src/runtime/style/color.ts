// Color parsing, formatting and adjustment for MapLibre style values.

export type Rgba = { r: number; g: number; b: number; a: number };

const NAMED: Record<string, [number, number, number]> = {
  black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], green: [0, 128, 0],
  blue: [0, 0, 255], yellow: [255, 255, 0], orange: [255, 165, 0], gray: [128, 128, 128],
  grey: [128, 128, 128], silver: [192, 192, 192], purple: [128, 0, 128], navy: [0, 0, 128],
  teal: [0, 128, 128], maroon: [128, 0, 0], olive: [128, 128, 0], lime: [0, 255, 0],
  aqua: [0, 255, 255], cyan: [0, 255, 255], fuchsia: [255, 0, 255], magenta: [255, 0, 255],
  brown: [165, 42, 42], pink: [255, 192, 203], beige: [245, 245, 220], tan: [210, 180, 140],
  ivory: [255, 255, 240], khaki: [240, 230, 140], lightgray: [211, 211, 211],
  lightgrey: [211, 211, 211], darkgray: [169, 169, 169], darkgrey: [169, 169, 169],
  whitesmoke: [245, 245, 245], gainsboro: [220, 220, 220], lightblue: [173, 216, 230],
  skyblue: [135, 206, 235], steelblue: [70, 130, 180],
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (v: number, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

function parseAlpha(part: string): number {
  return part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part);
}

export function parseColor(input: unknown): Rgba | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const named = NAMED[s];
  if (named) return { r: named[0], g: named[1], b: named[2], a: 1 };

  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? round(n(6) / 255) : 1 };
  }

  m = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(s);
  if (!m) return null;
  const parts = m[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const a = parts[3] !== undefined ? parseAlpha(parts[3]) : 1;

  if (m[1].startsWith('rgb')) {
    const channel = (p: string) => (p.endsWith('%') ? parseFloat(p) * 2.55 : parseFloat(p));
    const [r, g, b] = parts.slice(0, 3).map(channel);
    if ([r, g, b, a].some(Number.isNaN)) return null;
    return {
      r: clamp(Math.round(r), 0, 255),
      g: clamp(Math.round(g), 0, 255),
      b: clamp(Math.round(b), 0, 255),
      a: clamp(a, 0, 1),
    };
  }

  const hue = parseFloat(parts[0]);
  const sat = parseFloat(parts[1]) / 100;
  const light = parseFloat(parts[2]) / 100;
  if ([hue, sat, light, a].some(Number.isNaN)) return null;
  return { ...hslToRgb(((hue % 360) + 360) % 360, clamp(sat, 0, 1), clamp(light, 0, 1)), a: clamp(a, 0, 1) };
}

/** True for strings written in an explicit color syntax (no named colors). */
export function looksLikeColor(value: unknown): value is string {
  return typeof value === 'string' && /^\s*(#[0-9a-f]{3,8}\s*$|rgba?\(|hsla?\()/i.test(value);
}

export function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}

export function formatColor(c: Rgba): string {
  const a = round(c.a ?? 1);
  if (a >= 1) return toHex(c);
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`;
}

/** Normalized representation used to compare colors written in different syntaxes. */
export function colorKey(value: unknown): string | null {
  const c = parseColor(value);
  return c ? formatColor(c) : null;
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

export function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(channel(hk + 1 / 3) * 255),
    g: Math.round(channel(hk) * 255),
    b: Math.round(channel(hk - 1 / 3) * 255),
  };
}

export type ColorAdjustment = { hue?: number; saturation?: number; lightness?: number; invert?: boolean };

/**
 * Shift hue (degrees), saturation and lightness (-100..100, relative to the
 * remaining headroom) and optionally invert lightness.
 */
export function adjustColor(c: Rgba, { hue = 0, saturation = 0, lightness = 0, invert = false }: ColorAdjustment): Rgba {
  let { h, s, l } = rgbToHsl(c.r, c.g, c.b);
  if (invert) l = 1 - l;
  h = (((h + hue) % 360) + 360) % 360;
  s = saturation >= 0 ? s + (1 - s) * (saturation / 100) : s * (1 + saturation / 100);
  l = lightness >= 0 ? l + (1 - l) * (lightness / 100) : l * (1 + lightness / 100);
  return { ...hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1)), a: c.a };
}

/**
 * Map every color string inside a style value (literal, legacy function or
 * expression). Named colors are only accepted where a plain color is expected,
 * so match labels like "green" inside expressions stay untouched.
 */
export function mapColorsDeep(value: unknown, fn: (color: string) => string, named = true): unknown {
  if (typeof value === 'string') {
    const isColor = named ? parseColor(value) : looksLikeColor(value) && parseColor(value);
    return isColor ? fn(value) : value;
  }
  if (Array.isArray(value)) return value.map((v) => mapColorsDeep(v, fn, false));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (key === 'stops' && Array.isArray(v)) {
        out[key] = v.map((stop) => (Array.isArray(stop) ? [stop[0], mapColorsDeep(stop[1], fn, true)] : stop));
      } else {
        out[key] = mapColorsDeep(v, fn, true);
      }
    }
    return out;
  }
  return value;
}

export function walkColors(value: unknown, fn: (color: string) => void): void {
  mapColorsDeep(value, (s) => {
    fn(s);
    return s;
  });
}
