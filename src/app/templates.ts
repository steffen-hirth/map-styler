// Ready-made map templates, in the spirit of hosted map styles: a base style,
// a color recipe, label language, tooltip design and a styled sample route.
// After loading, everything stays editable like any other style.

import { getLang, t } from '../i18n';
import { fetchStyle } from '../runtime/state/store';
import { applyRecipe, type Recipe } from '../runtime/style/recolor';
import { applyRoute, DEFAULT_ROUTE, sampleRoute, type RouteConfig } from '../runtime/style/route';
import { applyLabelLanguage, removeItalic, type LabelLanguage } from '../runtime/style/style-utils';
import type { Style } from '../runtime/style/types';
import { KEY as TOOLTIP_KEY, normalize as normalizeTooltips, type TooltipStyle, type TooltipTrigger } from '../runtime/tooltips';
import { BASE_STYLES, withDefaultTooltips } from './app-schema';
import { FANCY_TEMPLATES } from './fancy-templates';

export const TEMPLATE_KEY = 'mapstyler:template';

export const routeLineTemplate = () => '<strong>{name}</strong>\n<i class="msx-icon-{mode}"></i>{trip_label}';
const ROUTE_POINT_TEMPLATE = '<strong>{name}</strong>\n<span style="opacity:.7">{label}</span>';

export type Template = {
  id: string;
  name: string;
  description: string;
  base: 'liberty' | 'bright' | 'positron';
  /** Thumbnail: three background tones, a glow color and the route color. */
  preview: { colors: [string, string, string, string]; route: string };
  recipe?: Recipe;
  language?: LabelLanguage;
  trigger?: TooltipTrigger;
  tooltip?: Partial<TooltipStyle>;
  route?: Partial<RouteConfig>;
  /** Tooltip templates for the route layers, if the defaults do not fit. */
  routeTooltips?: { line?: string; points?: string };
  /** Camera to move to when the template is loaded (e.g. tilted for 3D). */
  view?: { center?: [number, number]; zoom?: number; pitch?: number; bearing?: number };
  /** Final touches that a color recipe cannot express (3D, sky, patterns …). */
  extras?: (style: Style) => Style;
};

const INTER = '"Inter Variable", "Inter", system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

const CORE_TEMPLATES: Template[] = [
  {
    id: 'baral-sand',
    name: 'Baral Sand',
    description: 'Helles Grau ohne Beschriftung, Punkte und Akzente in Sand.',
    base: 'liberty',
    preview: { colors: ['#f4f4f4', '#ebebeb', '#dedede', '#d9cbb0'], route: '#a68b5b' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#f1f1f1', '#f4f4f4'],
        landuse: ['#e3e3e3', '#ebebeb'],
        water: ['#dcdcdc', '#e3e3e3'],
        // Main roads (yellow/orange in the base) turn grey, side streets stay white.
        roads: ['#d9d9d9', '#ffffff', 0.86, 0.97],
        transit: ['#d4d4d4', '#e0e0e0'],
        buildings: ['#e6e6e6', '#ebebeb'],
        other: ['#ececec', '#f1f1f1'],
      },
      hide: ['labels', 'poi', 'boundaries'],
    },
    tooltip: {
      background: '#ffffff',
      color: '#1a1a1a',
      fontFamily: INTER,
      fontSize: 13,
      lineHeight: 1.55,
      padding: 14,
      radius: 8,
      borderWidth: 0,
      shadow: 'soft',
      tip: false,
      maxWidth: 300,
    },
    route: {
      color: '#a68b5b',
      width: 3,
      casingColor: '#ffffff',
      casingWidth: 1,
      arrows: false,
      pointColor: '#a68b5b',
      pointStroke: '#ffffff',
      pointRadius: 8,
      labels: false,
    },
    routeTooltips: {
      points: '<strong>{name}</strong>\n{label}\n<span style="color:#a68b5b">{url|website}</span>',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Helles Grau, weiße Straßen – nichts lenkt von deiner Route ab.',
    base: 'liberty',
    preview: { colors: ['#ececed', '#e4e4e6', '#dce1e6', '#d9d6de'], route: '#5b4a6e' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#e3e3e5', '#ececed'],
        water: ['#cdd3d9', '#dce1e6'],
        landuse: ['#dfdfe1', '#e9e9ea'],
        roads: ['#d2d2d5', '#ffffff'],
        transit: ['#cfcfd2', '#dedee0'],
        buildings: ['#d6d6d9', '#dedee1'],
        boundaries: ['#bdbdc2', '#d0d0d4'],
        other: ['#e0e0e2', '#eaeaeb'],
      },
      labels: { text: '#5b5d64', halo: 'rgba(255, 255, 255, 0.95)', haloWidth: 1.4 },
      hide: ['poi'],
    },
    tooltip: {
      background: '#ffffff',
      color: '#1f2328',
      radius: 10,
      borderColor: 'rgba(31, 35, 40, 0.08)',
      shadow: 'soft',
      fontFamily: INTER,
    },
    route: {
      color: '#5b4a6e',
      width: 3.5,
      casingColor: '#ffffff',
      casingWidth: 1,
      arrows: false,
      pointColor: '#ffffff',
      pointStroke: '#5b4a6e',
      labelColor: '#1f2328',
      labelHalo: 'rgba(255, 255, 255, 0.95)',
    },
  },
  {
    id: 'dusk',
    name: 'Dämmerung',
    description: 'Dunkel und ruhig, mit warmem Pfirsich-Akzent.',
    base: 'positron',
    preview: { colors: ['#4b4a5c', '#6e6178', '#1c1f24', '#c08a72'], route: '#e3a083' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#141619', '#1f2228'],
        water: ['#16202e', '#1b2433'],
        landuse: ['#191c20', '#262a2f'],
        roads: ['#2c2a33', '#5a4f63'],
        transit: ['#2a2c35', '#4d566a'],
        buildings: ['#1d2025', '#2b2e35'],
        boundaries: ['#4b5560', '#8a7f92'],
        other: ['#1a1d21', '#2a2d33'],
      },
      labels: { text: '#e9e3d8', halo: 'rgba(20, 22, 26, 0.85)', haloWidth: 1.4 },
    },
    tooltip: {
      background: 'rgba(28, 31, 36, 0.94)',
      color: '#f2efe8',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      radius: 10,
      shadow: 'strong',
      fontFamily: INTER,
    },
    route: {
      color: '#e3a083',
      casingColor: '#1c1f24',
      pointColor: '#1c1f24',
      pointStroke: '#e3a083',
      labelColor: '#f2efe8',
      labelHalo: 'rgba(20, 22, 26, 0.9)',
    },
  },
  {
    id: 'paper',
    name: 'Papier',
    description: 'Warmes Papier, gedämpfte Töne, ruhige Tooltips.',
    base: 'positron',
    preview: { colors: ['#f3efe8', '#e7e3d6', '#c9d3dc', '#c08a72'], route: '#6e5770' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#d9d2c6', '#f3efe8'],
        water: ['#8fa3b8', '#bfccd8'],
        landuse: ['#c9c7b3', '#e7e3d6'],
        roads: ['#cfc6b8', '#fffdf9'],
        transit: ['#b7aea4', '#d8d0c6'],
        buildings: ['#d8d0c4', '#e6dfd4'],
        boundaries: ['#9d8fa6', '#c1b6c6'],
      },
      labels: { text: '#3b3542', halo: 'rgba(243, 239, 232, 0.95)', haloWidth: 1.2 },
    },
    tooltip: {
      background: '#fbf9f6',
      color: '#2a2730',
      fontFamily: INTER,
      radius: 4,
      borderColor: 'rgba(59, 53, 66, 0.15)',
      shadow: 'soft',
    },
    route: {
      color: '#6e5770',
      casingColor: '#f3efe8',
      pointStroke: '#6e5770',
      labelColor: '#3b3542',
      labelHalo: 'rgba(243, 239, 232, 0.95)',
    },
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    description: 'Kräftiges Grün, klares Wasser, gestrichelte Tour.',
    base: 'liberty',
    preview: { colors: ['#e6eed6', '#9fc28c', '#a7c8e4', '#f2c94c'], route: '#d6452f' },
    language: 'de',
    recipe: {
      ramps: {
        landuse: ['#4f7a43', '#e6eed6'],
        water: ['#3f76a8', '#a7c8e4'],
      },
    },
    tooltip: { radius: 12, fontFamily: INTER, borderColor: 'rgba(0, 0, 0, 0.06)' },
    route: { color: '#d6452f', dash: 'dashed', casingColor: '#ffffff', pointStroke: '#d6452f' },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'OpenFreeMap Liberty, unverändert. Guter Ausgangspunkt.',
    base: 'liberty',
    preview: { colors: ['#f8f4f0', '#fbe08f', '#a0c8f0', '#e9ac77'], route: '#2f6fed' },
    language: 'de',
    route: { color: '#2f6fed', pointStroke: '#2f6fed' },
  },
  {
    id: 'bright',
    name: 'Klar',
    description: 'OpenFreeMap Bright: hell, kontrastreich, viele Details.',
    base: 'bright',
    preview: { colors: ['#f8f4f0', '#ffcc88', '#a0c8f0', '#e9ac77'], route: '#e5484d' },
    language: 'de',
    route: { color: '#e5484d', pointStroke: '#e5484d' },
  },
  {
    id: 'dataviz-light',
    name: 'Dataviz Hell',
    description: 'Neutrales Grau ohne POIs – Bühne für eigene Daten.',
    base: 'positron',
    preview: { colors: ['#f6f6f6', '#e3e3e3', '#d4d4d4', '#b9b0c2'], route: '#5e4b6e' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#e9e9e9', '#f6f6f6'],
        water: ['#cfd6dc', '#dde3e8'],
        landuse: ['#e3e3e3', '#efefef'],
        roads: ['#d4d4d4', '#ffffff'],
        transit: ['#d0d0d0', '#e6e6e6'],
        buildings: ['#e2e2e2', '#e8e8e8'],
        boundaries: ['#b5b5b5', '#cccccc'],
      },
      labels: { text: '#6b6b6b', halo: '#f6f6f6', haloWidth: 1.2 },
      hide: ['poi'],
    },
    tooltip: {
      background: '#1d1e22',
      color: '#ffffff',
      borderWidth: 0,
      radius: 6,
      fontSize: 12,
      padding: 8,
      fontFamily: INTER,
    },
    route: { color: '#5e4b6e', arrows: false, casingWidth: 1.5, pointStroke: '#5e4b6e' },
  },
  {
    id: 'dataviz-dark',
    name: 'Dataviz Dunkel',
    description: 'Tiefes Anthrazit, leise Beschriftung, leuchtende Daten.',
    base: 'positron',
    preview: { colors: ['#1e1f23', '#26272c', '#18202a', '#3f6f68'], route: '#9fd2c4' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#17181b', '#1e1f23'],
        water: ['#141a22', '#18202a'],
        landuse: ['#1a1b1e', '#212226'],
        roads: ['#26272c', '#34363c'],
        transit: ['#26272c', '#2f3136'],
        buildings: ['#1f2024', '#25262b'],
        boundaries: ['#3d3f46', '#55575f'],
        other: ['#1a1b1e', '#222327'],
      },
      labels: { text: '#8d8f97', halo: '#17181b', haloWidth: 1.2 },
      hide: ['poi'],
    },
    tooltip: {
      background: '#26272c',
      color: '#eeeef0',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      radius: 6,
      fontSize: 12,
      padding: 8,
      fontFamily: INTER,
    },
    route: {
      color: '#9fd2c4',
      casingColor: '#17181b',
      arrows: false,
      pointColor: '#17181b',
      pointStroke: '#9fd2c4',
      labelColor: '#d9dadf',
      labelHalo: '#17181b',
    },
  },
  {
    id: 'blueprint',
    name: 'Blaupause',
    description: 'Technischer Plan in Blau mit gepunkteter Route.',
    base: 'positron',
    preview: { colors: ['#16365c', '#1a3d66', '#0b2140', '#6f9ccc'], route: '#ffffff' },
    language: 'de',
    recipe: {
      ramps: {
        background: ['#0f2a4a', '#16365c'],
        water: ['#0b2140', '#0e2748'],
        landuse: ['#133357', '#1a3d66'],
        roads: ['#2f5f93', '#6f9ccc'],
        transit: ['#2b5786', '#4f7fb3'],
        buildings: ['#1a3f6b', '#21497a'],
        boundaries: ['#8fb3dc', '#b9d2ef'],
        other: ['#123156', '#1a3d66'],
      },
      labels: { text: '#dbe8f7', halo: '#0f2a4a', haloWidth: 1.2 },
    },
    tooltip: {
      background: '#0f2a4a',
      color: '#dbe8f7',
      fontFamily: MONO,
      fontSize: 12,
      radius: 0,
      borderColor: 'rgba(219, 232, 247, 0.45)',
      shadow: 'none',
      tip: false,
    },
    route: {
      color: '#ffffff',
      width: 3,
      dash: 'dotted',
      casingWidth: 0,
      arrows: false,
      pointColor: '#0f2a4a',
      pointStroke: '#ffffff',
      labelColor: '#dbe8f7',
      labelHalo: '#0f2a4a',
    },
  },
];

const baseCache = new Map<string, Promise<Style>>();

function loadBase(id: Template['base']): Promise<Style> {
  const url = BASE_STYLES.find((b) => b.id === id)?.url;
  if (!url) return Promise.reject(new Error(`Unbekannter Basis-Style: ${id}`));
  let pending = baseCache.get(url);
  if (!pending) {
    pending = fetchStyle(url);
    pending.catch(() => baseCache.delete(url));
    baseCache.set(url, pending);
  }
  return pending.then((style) => structuredClone(style));
}

/** Tooltip entries for the route layers, unless already configured. */
export function withRouteTooltips(style: Style): Style {
  const cfg = normalizeTooltips(style.metadata?.[TOOLTIP_KEY]);
  cfg.layers['route-line'] ??= { enabled: true, template: routeLineTemplate() };
  cfg.layers['route-points'] ??= { enabled: true, template: ROUTE_POINT_TEMPLATE };
  return { ...style, metadata: { ...(style.metadata ?? {}), [TOOLTIP_KEY]: cfg } };
}

export async function buildTemplate(template: Template): Promise<Style> {
  let style = await loadBase(template.base);
  if (template.recipe) style = applyRecipe(style, template.recipe);
  // One upright typeface reads calmer than the italic water names of the base styles.
  style = removeItalic(style).style;
  // Map labels follow the UI language.
  if (template.language) style = applyLabelLanguage(style, getLang()).style;
  style = withDefaultTooltips({ ...style, name: t(template.name) });
  style = applyRoute(style, { ...DEFAULT_ROUTE, ...template.route }, sampleRoute());
  if (template.extras) style = template.extras(style);
  style = withRouteTooltips(style);
  const tooltipsBase = normalizeTooltips(style.metadata?.[TOOLTIP_KEY]);
  if (template.routeTooltips?.line) tooltipsBase.layers['route-line'] = { enabled: true, template: template.routeTooltips.line };
  if (template.routeTooltips?.points) tooltipsBase.layers['route-points'] = { enabled: true, template: template.routeTooltips.points };
  style = { ...style, metadata: { ...(style.metadata ?? {}), [TOOLTIP_KEY]: tooltipsBase } };

  const tooltips = normalizeTooltips(style.metadata?.[TOOLTIP_KEY]);
  tooltips.style = { ...tooltips.style, ...template.tooltip };
  if (template.trigger) tooltips.trigger = template.trigger;
  return { ...style, metadata: { ...(style.metadata ?? {}), [TOOLTIP_KEY]: tooltips, [TEMPLATE_KEY]: template.id } };
}

/** Baral Sand and Minimal first, then the 3D/ASCII looks, then the classics. */
export const TEMPLATES: Template[] = [...CORE_TEMPLATES.slice(0, 2), ...FANCY_TEMPLATES, ...CORE_TEMPLATES.slice(2)];
