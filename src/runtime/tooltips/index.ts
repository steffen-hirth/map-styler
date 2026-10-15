// Framework-free tooltip runtime for MapLibre maps. The configuration lives in
// style.metadata["mapstyler:tooltips"], so a single style.json carries both the
// map design and its tooltips. Built separately into cdn/ for embedding.

import type { MapGeoJSONFeature, MapLayerMouseEvent, Map as MapLibreMap, MapMouseEvent, Popup, PopupOptions } from 'maplibre-gl';

export const KEY = 'mapstyler:tooltips';

export type TooltipTrigger = 'hover' | 'click';
export type TooltipShadow = 'none' | 'soft' | 'strong';

export type TooltipStyle = {
  background: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  padding: number;
  radius: number;
  borderColor: string;
  borderWidth: number;
  shadow: TooltipShadow;
  maxWidth: number;
  tip: boolean;
};

export type TooltipLayer = { enabled: boolean; template: string };

export type TooltipConfig = {
  trigger: TooltipTrigger;
  style: TooltipStyle;
  layers: Record<string, TooltipLayer>;
};

export const DEFAULT_STYLE: TooltipStyle = {
  background: '#ffffff',
  color: '#1f2328',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSize: 13,
  lineHeight: 1.4,
  padding: 10,
  radius: 8,
  borderColor: 'rgba(0, 0, 0, 0.08)',
  borderWidth: 1,
  shadow: 'soft',
  maxWidth: 260,
  tip: true,
};

const SHADOWS: Record<TooltipShadow, string> = {
  none: 'none',
  soft: '0 4px 14px rgba(0, 0, 0, 0.12)',
  strong: '0 10px 30px rgba(0, 0, 0, 0.3)',
};

export function normalize(input: unknown): TooltipConfig {
  const cfg = (input && typeof input === 'object' ? input : {}) as Partial<TooltipConfig>;
  const style = { ...DEFAULT_STYLE } as Record<string, unknown>;
  if (cfg.style && typeof cfg.style === 'object') {
    for (const key of Object.keys(DEFAULT_STYLE)) {
      const value = (cfg.style as Record<string, unknown>)[key];
      if (value != null && typeof value === typeof DEFAULT_STYLE[key as keyof TooltipStyle]) style[key] = value;
    }
  }
  const layers: Record<string, TooltipLayer> = {};
  if (cfg.layers && typeof cfg.layers === 'object') {
    for (const [id, layer] of Object.entries(cfg.layers)) {
      const l = (layer ?? {}) as Partial<TooltipLayer>;
      layers[id] = { enabled: l.enabled !== false, template: typeof l.template === 'string' ? l.template : '' };
    }
  }
  return { trigger: cfg.trigger === 'click' ? 'click' : 'hover', style: style as TooltipStyle, layers };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value: unknown) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

function lookup(expr: string, props: Record<string, unknown>): string {
  for (const raw of expr.split('|')) {
    const key = raw.trim();
    if (!key) continue;
    const quote = key[0];
    if ((quote === "'" || quote === '"') && key.length >= 2 && key.endsWith(quote)) return key.slice(1, -1);
    const value = props[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return '';
}

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'SMALL', 'SPAN', 'DIV', 'P', 'BR', 'UL', 'OL', 'LI', 'HR', 'SUB', 'SUP']);
const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'SVG', 'MATH']);

function cleanNode(node: Node): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 1) {
      const el = child as Element;
      if (DROPPED_TAGS.has(el.tagName)) {
        el.remove();
        continue;
      }
      cleanNode(el);
      if (!ALLOWED_TAGS.has(el.tagName)) {
        el.replaceWith(...el.childNodes);
        continue;
      }
      for (const attr of [...el.attributes]) {
        const keep = attr.name === 'class' || (attr.name === 'style' && !/url\s*\(|expression|javascript:/i.test(attr.value));
        if (!keep) el.removeAttribute(attr.name);
      }
    } else if (child.nodeType !== 3) {
      child.remove();
    }
  }
}

/** Keep only simple formatting markup from templates. */
export function sanitize(html: string): string {
  if (typeof document === 'undefined') return html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  cleanNode(tpl.content);
  return tpl.innerHTML;
}

/**
 * Render a template: {field}, alternatives {name:de|name}, literal fallbacks
 * {name|'Ohne Namen'}. Each line becomes a row; rows whose placeholders are all
 * empty are dropped. Values are escaped, markup is sanitized.
 */
export function renderTemplate(template: string, props: Record<string, unknown> = {}): string {
  const rows: string[] = [];
  for (const line of String(template || '').split(/\r?\n/)) {
    let hasPlaceholder = false;
    let allEmpty = true;
    const html = line.replace(/\{([^{}]+)\}/g, (_, expr: string) => {
      hasPlaceholder = true;
      const value = lookup(expr, props);
      if (value !== '') allEmpty = false;
      return escapeHtml(value);
    });
    if (hasPlaceholder && allEmpty) continue;
    if (html.trim()) rows.push(html);
  }
  return sanitize(rows.join('<br>'));
}

const cssValue = (value: unknown) => String(value).replace(/[{}<>;]/g, '');

export function tooltipCss(style: TooltipStyle, className: string): string {
  const sel = `.${className}`;
  const bg = cssValue(style.background);
  const tip = (anchors: string[], side: string) =>
    anchors.map((a) => `${sel}.maplibregl-popup-anchor-${a} .maplibregl-popup-tip`).join(',') + `{border-${side}-color:${bg};}`;
  return [
    `${sel} .maplibregl-popup-content{background:${bg};color:${cssValue(style.color)};font-family:${cssValue(style.fontFamily)};` +
      `font-size:${Number(style.fontSize)}px;line-height:${Number(style.lineHeight)};padding:${Number(style.padding)}px;` +
      `border-radius:${Number(style.radius)}px;border:${Number(style.borderWidth)}px solid ${cssValue(style.borderColor)};` +
      `box-shadow:${SHADOWS[style.shadow] ?? SHADOWS.soft};}`,
    `${sel} .maplibregl-popup-close-button{color:inherit;font-size:16px;padding:0 6px;}`,
    tip(['top', 'top-left', 'top-right'], 'bottom'),
    tip(['bottom', 'bottom-left', 'bottom-right'], 'top'),
    tip(['left'], 'right'),
    tip(['right'], 'left'),
    style.tip ? '' : `${sel} .maplibregl-popup-tip{display:none;}`,
  ].join('\n');
}

type PopupCtor = new (options?: PopupOptions) => Popup;

export type AttachOptions = {
  /** Config to use instead of reading style.metadata (the editor passes it live). */
  config?: unknown;
  /** MapLibre namespace when it is not available as window.maplibregl. */
  maplibregl?: { Popup: PopupCtor };
};

export type TooltipHandle = {
  className: string;
  update(config: unknown): void;
  setEnabled(enabled: boolean): void;
  destroy(): void;
};

let instances = 0;

export function attach(map: MapLibreMap, options: AttachOptions = {}): TooltipHandle {
  const lib = options.maplibregl ?? (globalThis as { maplibregl?: { Popup: PopupCtor } }).maplibregl;
  if (!lib?.Popup) throw new Error('MapStylerTooltips: maplibregl wurde nicht gefunden.');

  const className = `msx-tooltip-${++instances}`;
  const styleEl = document.createElement('style');
  styleEl.dataset.mapstyler = className;
  document.head.appendChild(styleEl);

  let cfg: TooltipConfig | null = null;
  let popup: Popup | null = null;
  let enabled = true;
  let lastKey = '';

  const activeLayers = () =>
    cfg ? Object.keys(cfg.layers).filter((id) => cfg!.layers[id].enabled && cfg!.layers[id].template && map.getLayer(id)) : [];

  const pick = (e: MapMouseEvent): MapGeoJSONFeature | null => {
    const layers = activeLayers();
    if (!layers.length) return null;
    return map.queryRenderedFeatures(e.point, { layers })[0] ?? null;
  };

  const hide = () => {
    lastKey = '';
    if (popup?.isOpen()) popup.remove();
  };

  const show = (feature: MapGeoJSONFeature, e: MapMouseEvent) => {
    if (!cfg || !popup) return;
    const html = renderTemplate(cfg.layers[feature.layer.id].template, feature.properties ?? {});
    if (!html) return hide();
    const point = feature.geometry.type === 'Point' ? (feature.geometry.coordinates as [number, number]) : null;
    const lngLat: [number, number] = point ?? [e.lngLat.lng, e.lngLat.lat];
    const key = `${feature.layer.id}|${feature.id ?? ''}|${html}|${point ? point.join(',') : lngLat.join(',')}`;
    if (key === lastKey && popup.isOpen()) return;
    lastKey = key;
    popup.setLngLat(lngLat).setHTML(html);
    if (!popup.isOpen()) popup.addTo(map);
  };

  const onMove = (e: MapMouseEvent) => {
    if (!enabled || !cfg) return;
    const feature = pick(e);
    map.getCanvas().style.cursor = feature ? 'pointer' : '';
    if (cfg.trigger !== 'hover') return;
    if (feature) show(feature, e);
    else hide();
  };

  const onClick = (e: MapMouseEvent) => {
    if (!enabled || !cfg || cfg.trigger !== 'click') return;
    const feature = pick(e);
    if (feature) show(feature, e);
    else hide();
  };

  const onLeave = () => {
    if (!enabled) return;
    map.getCanvas().style.cursor = '';
    if (cfg?.trigger === 'hover') hide();
  };

  const update = (next: unknown) => {
    cfg = normalize(next);
    styleEl.textContent = tooltipCss(cfg.style, className);
    popup?.remove();
    popup = new lib.Popup({
      className: `msx-tooltip ${className}`,
      closeButton: cfg.trigger === 'click',
      closeOnClick: false,
      maxWidth: `${cfg.style.maxWidth}px`,
      offset: 10,
      focusAfterOpen: false,
    });
    lastKey = '';
  };

  const readFromStyle = () => map.getStyle()?.metadata && (map.getStyle().metadata as Record<string, unknown>)[KEY];
  const onStyleLoad = () => update(readFromStyle());

  map.on('mousemove', onMove);
  map.on('click', onClick);
  map.on('mouseout', onLeave as (e: MapLayerMouseEvent) => void);

  if (options.config !== undefined) update(options.config);
  else {
    if (map.isStyleLoaded()) onStyleLoad();
    map.on('style.load', onStyleLoad);
  }

  return {
    className,
    update,
    setEnabled(value) {
      enabled = value;
      if (!enabled) hide();
    },
    destroy() {
      map.off('mousemove', onMove);
      map.off('click', onClick);
      map.off('mouseout', onLeave as (e: MapLayerMouseEvent) => void);
      map.off('style.load', onStyleLoad);
      popup?.remove();
      styleEl.remove();
    },
  };
}
