// Product definition: base styles, defaults and option lists the panels render.

import { getLang } from '../i18n';
import { KEY as TOOLTIP_KEY, normalize as normalizeTooltips, type TooltipShadow } from '../runtime/tooltips';
import type { LabelLanguage } from '../runtime/style/style-utils';
import type { Style } from '../runtime/style/types';

export const APP_NAME = 'Map Styler';

/** Keep in sync with the maplibre-gl pin in package.json (used in embed snippets). */
export const MAPLIBRE_VERSION = '5.24.0';

export const STORAGE_KEY = 'mapstyler:project:v1';
export const EXPORT_PREFS_KEY = 'mapstyler:export:v1';

export type BaseStyle = { id: string; label: string; url: string };

export const BASE_STYLES: BaseStyle[] = [
  { id: 'liberty', label: 'OpenFreeMap Liberty', url: 'https://tiles.openfreemap.org/styles/liberty' },
  { id: 'bright', label: 'OpenFreeMap Bright', url: 'https://tiles.openfreemap.org/styles/bright' },
  { id: 'positron', label: 'OpenFreeMap Positron', url: 'https://tiles.openfreemap.org/styles/positron' },
];

export const DEFAULT_VIEW = { center: [9.1829, 48.7758] as [number, number], zoom: 12.5 };

/** Default tooltip template; prefers names in the current UI language. */
export const defaultTemplate = () => `<strong>{name:${getLang()}|name}</strong>\n<span style="opacity:.7">{subclass|class}</span>`;

export const SAMPLE_PROPS: Record<string, unknown> = {
  name: 'Gasthaus Krone',
  'name:de': 'Gasthaus Krone',
  class: 'restaurant',
  subclass: 'restaurant',
  ele: 512,
};

export const LABEL_LANGUAGES: Array<{ value: LabelLanguage; label: string }> = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'Englisch' },
  { value: 'local', label: 'Lokal' },
];

export const TOOLTIP_FONTS = [
  { value: 'system-ui, -apple-system, "Segoe UI", sans-serif', label: 'System' },
  { value: '"Inter Variable", "Inter", system-ui, sans-serif', label: 'Inter' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: 'ui-monospace, "SF Mono", Menlo, monospace', label: 'Mono' },
];

export const TOOLTIP_SHADOWS: Array<{ value: TooltipShadow; label: string }> = [
  { value: 'none', label: 'Keiner' },
  { value: 'soft', label: 'Weich' },
  { value: 'strong', label: 'Stark' },
];

export const DEFAULT_ADJUSTMENT = { hue: 0, saturation: 0, lightness: 0, invert: false, textScale: 100 };
export type Adjustment = typeof DEFAULT_ADJUSTMENT;

/** Fresh OpenFreeMap styles start with tooltips on POI symbols so the feature is visible right away. */
export function withDefaultTooltips(style: Style): Style {
  const cfg = normalizeTooltips(style.metadata?.[TOOLTIP_KEY]);
  for (const layer of style.layers) {
    if (layer.type === 'symbol' && layer['source-layer'] === 'poi' && !cfg.layers[layer.id]) {
      cfg.layers[layer.id] = { enabled: true, template: defaultTemplate() };
    }
  }
  return { ...style, metadata: { ...(style.metadata ?? {}), [TOOLTIP_KEY]: cfg } };
}
