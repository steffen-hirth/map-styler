// Pins from a CMS: reads locations from HTML elements (e.g. a Webflow
// collection list with custom attributes) or GeoJSON, shows them as clustered
// pins with tooltips, filters them by category and keeps list and map in sync.
//
//   <div data-map-pin data-lat="48.7784" data-lng="9.1800" data-name="Café Kiez"
//        data-category="Café" data-type="cafe" data-url="https://…">…</div>
//   <button data-map-filter="Café">Cafés</button> <button data-map-filter="">Alle</button>

import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import { isPinType, PIN_IMAGE_PREFIX, type PinType } from '../tooltips/pin-icons';

export const PINS_SOURCE = 'msx-pins';
export const PINS_LAYER = 'msx-pins';
const CLUSTER_LAYER = 'msx-pins-clusters';
const COUNT_LAYER = 'msx-pins-count';

/** Calm, distinguishable colors handed out to categories in order of appearance. */
export const DEFAULT_PALETTE = ['#4f46e5', '#e0604f', '#0f9d76', '#d97706', '#0284c7', '#c026d3', '#65a30d', '#475569'];

export type Pin = {
  id: string;
  lng: number;
  lat: number;
  name: string;
  category: string;
  type: PinType;
  /** Explicit color from the data, if any (#rrggbb). */
  color: string | null;
  /** Everything else, available to tooltip templates as {field}. */
  props: Record<string, string>;
};

// Parsing (pure, no DOM) ---------------------------------------------------------

/** "48,7784" or "48.7784" → 48.7784. */
export function parseNumber(value: string | undefined | null): number | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  const normalized = /^-?\d+,\d+$/.test(text) ? text.replace(',', '.') : text;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** "48.7784, 9.18" / "48.7784 9.18" / "48,7784; 9,18" → [lat, lng]. */
export function parseCoordinates(value: string | undefined | null): [number, number] | null {
  if (!value) return null;
  const text = String(value).trim();
  let parts: string[];
  if (text.includes(';')) parts = text.split(';');
  else if (/\d\.\d/.test(text) || !/\d,\d/.test(text)) parts = text.split(/[\s,]+/);
  else parts = text.split(/\s+/);
  const nums = parts.map(parseNumber).filter((n): n is number => n !== null);
  return nums.length === 2 ? [nums[0], nums[1]] : null;
}

const validLatLng = (lat: number, lng: number) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const normalizeColor = (value: string | undefined): string | null => {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec((value ?? '').trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return `#${hex.toLowerCase()}`;
};

const RESERVED = new Set(['map-pin', 'lat', 'lng', 'lon', 'latitude', 'longitude', 'coordinates', 'latlng', 'type', 'color', 'category', 'name', 'id']);

/**
 * One pin from data attributes (keys without the "data-" prefix). Returns null
 * when the coordinates are missing or out of range.
 */
export function parsePin(attrs: Record<string, string | undefined>, index: number): Pin | null {
  const pair = parseCoordinates(attrs.coordinates ?? attrs.latlng);
  const lat = pair?.[0] ?? parseNumber(attrs.lat ?? attrs.latitude);
  const lng = pair?.[1] ?? parseNumber(attrs.lng ?? attrs.lon ?? attrs.longitude);
  if (lat == null || lng == null || !validLatLng(lat, lng)) return null;
  const props: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || RESERVED.has(key) || key.startsWith('map-')) continue;
    props[key.replace(/-/g, '_')] = value;
  }
  const type = (attrs.type ?? '').trim().toLowerCase();
  return {
    id: (attrs.id ?? '').trim() || `pin-${index}`,
    lat,
    lng,
    name: (attrs.name ?? '').trim(),
    category: (attrs.category ?? '').trim(),
    type: isPinType(type) ? type : 'pin',
    color: normalizeColor(attrs.color),
    props,
  };
}

type PointFeature = { type: 'Feature'; id?: string | number; geometry: { type: string; coordinates: unknown }; properties?: Record<string, unknown> | null };
export type FeatureCollection = { type: 'FeatureCollection'; features: PointFeature[] };

/** Pins from GeoJSON point features; properties become pin fields. */
export function pinsFromGeoJSON(data: FeatureCollection): Pin[] {
  const pins: Pin[] = [];
  data.features.forEach((f, i) => {
    if (f.geometry?.type !== 'Point' || !Array.isArray(f.geometry.coordinates)) return;
    const [lng, lat] = f.geometry.coordinates as number[];
    const attrs: Record<string, string> = {};
    for (const [key, value] of Object.entries(f.properties ?? {})) if (value != null) attrs[key] = String(value);
    attrs.lat = String(lat);
    attrs.lng = String(lng);
    if (f.id != null && attrs.id == null) attrs.id = String(f.id);
    const pin = parsePin(attrs, i);
    if (pin) pins.push(pin);
  });
  return pins;
}

/** Category → color, explicit colors win; new categories take the next palette color. */
export function categoryColors(pins: Pin[], palette = DEFAULT_PALETTE, fixed: Record<string, string> = {}): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const [key, value] of Object.entries(fixed)) {
    const c = normalizeColor(value);
    if (c) colors[key] = c;
  }
  let next = 0;
  for (const pin of pins) {
    if (colors[pin.category] != null) continue;
    colors[pin.category] = pin.color ?? palette[next++ % palette.length];
  }
  return colors;
}

/** Does a pin match the active filter? An empty filter matches everything. */
export const matchesFilter = (pin: Pin, filter: string | null) => !filter || pin.category.toLowerCase() === filter.toLowerCase();

export function toFeatureCollection(pins: Pin[], colors: Record<string, string>) {
  return {
    type: 'FeatureCollection' as const,
    features: pins.map((pin) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pin.lng, pin.lat] },
      properties: {
        ...pin.props,
        id: pin.id,
        name: pin.name,
        category: pin.category,
        type: pin.type,
        // Baked into the generated icon id: msx-pin-<type>-<rrggbb>.
        icon: `${PIN_IMAGE_PREFIX}${pin.type}-${(pin.color ?? colors[pin.category] ?? DEFAULT_PALETTE[0]).slice(1)}`,
      } as Record<string, unknown>,
    })),
  };
}

// DOM -------------------------------------------------------------------------

function attributesOf(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-')) attrs[attr.name.slice(5)] = attr.value;
  }
  // Webflow can bind CMS fields to text inside the item: <span data-map-field="name">.
  el.querySelectorAll('[data-map-field]').forEach((field) => {
    const key = field.getAttribute('data-map-field');
    if (key && attrs[key] == null) attrs[key] = (field.textContent ?? '').trim();
  });
  return attrs;
}

export function pinsFromElements(elements: Element[]): { pins: Pin[]; byId: Map<string, Element> } {
  const pins: Pin[] = [];
  const byId = new Map<string, Element>();
  elements.forEach((el, i) => {
    const pin = parsePin(attributesOf(el), i);
    if (!pin) return;
    pins.push(pin);
    byId.set(pin.id, el);
  });
  return { pins, byId };
}

// Map -------------------------------------------------------------------------

export type PinsOptions = {
  /** CSS selector (default "[data-map-pin]") or elements to read pins from; false to skip. */
  from?: string | Element[] | false;
  /** GeoJSON (object or URL) instead of / in addition to elements. */
  data?: string | FeatureCollection;
  /** Category → color. Missing categories get palette colors. */
  colors?: Record<string, string>;
  palette?: string[];
  /** Group nearby pins (default true). */
  cluster?: boolean;
  clusterColor?: string;
  /** Zoom to the pins once loaded (default true). */
  fit?: boolean;
  /** Filter buttons (default "[data-map-filter]"); the attribute value is the category. */
  filters?: string | false;
  /** Hide list items that don't match the filter (default true). */
  filterList?: boolean;
  /** Class put on the list item / filter button that is active (default "is-active"). */
  activeClass?: string;
  /** Called when a pin is clicked on the map. */
  onSelect?: (pin: Pin) => void;
};

export type PinsHandle = {
  pins(): Pin[];
  setFilter(category: string | null): void;
  focus(id: string): void;
  /** Replace the GeoJSON pins (e.g. new props in React) and redraw. */
  setData(data: string | FeatureCollection | undefined): Promise<void>;
  refresh(): Promise<void>;
  destroy(): void;
};

type Hooks = {
  /** Open the tooltip for a pin (the tooltip runtime renders the template). */
  show(properties: Record<string, unknown>, lngLat: [number, number]): void;
};

export function addPins(map: MapLibreMap, options: PinsOptions, hooks: Hooks): PinsHandle {
  const activeClass = options.activeClass ?? 'is-active';
  const filterSelector = options.filters === false ? null : (options.filters ?? '[data-map-filter]');
  const readsElements = options.from !== false && typeof document !== 'undefined';
  let all: Pin[] = [];
  let byId = new Map<string, Element>();
  let colors: Record<string, string> = {};
  let filter: string | null = null;
  let fitted = options.fit === false;
  let destroyed = false;
  let data = options.data;
  let loaded = false;
  // A focus requested before the pins are loaded runs once they are.
  let pendingFocus: string | null = null;

  const visible = () => all.filter((pin) => matchesFilter(pin, filter));
  const collection = () => toFeatureCollection(visible(), colors);

  const ensureLayers = () => {
    if (destroyed || !map.isStyleLoaded()) return;
    if (!map.getSource(PINS_SOURCE)) {
      map.addSource(PINS_SOURCE, {
        type: 'geojson',
        data: collection() as never,
        cluster: options.cluster !== false,
        clusterRadius: 44,
        clusterMaxZoom: 15,
      });
    }
    const clusterColor = options.clusterColor ?? '#1f2328';
    if (!map.getLayer(CLUSTER_LAYER)) {
      map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: PINS_SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': clusterColor,
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 50, 24],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
        },
      });
    }
    if (!map.getLayer(COUNT_LAYER)) {
      map.addLayer({
        id: COUNT_LAYER,
        type: 'symbol',
        source: PINS_SOURCE,
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-allow-overlap': true },
        paint: { 'text-color': '#ffffff' },
      });
    }
    if (!map.getLayer(PINS_LAYER)) {
      map.addLayer({
        id: PINS_LAYER,
        type: 'symbol',
        source: PINS_SOURCE,
        filter: ['!', ['has', 'point_count']],
        layout: { 'icon-image': ['get', 'icon'], 'icon-allow-overlap': true, 'icon-ignore-placement': true },
      });
    }
  };

  const fit = () => {
    if (fitted) return;
    const pins = visible();
    if (!pins.length) return;
    fitted = true;
    if (pins.length === 1) {
      map.jumpTo({ center: [pins[0].lng, pins[0].lat], zoom: Math.max(map.getZoom(), 14) });
      return;
    }
    const lngs = pins.map((p) => p.lng);
    const lats = pins.map((p) => p.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 56, maxZoom: 15, animate: false },
    );
  };

  const render = () => {
    ensureLayers();
    (map.getSource(PINS_SOURCE) as GeoJSONSource | undefined)?.setData(collection() as never);
    // List items and filter buttons follow the filter.
    if (options.filterList !== false) {
      for (const pin of all) {
        const el = byId.get(pin.id) as HTMLElement | undefined;
        if (el) el.style.display = matchesFilter(pin, filter) ? '' : 'none';
      }
    }
    if (filterSelector && typeof document !== 'undefined') {
      document.querySelectorAll<HTMLElement>(filterSelector).forEach((button) => {
        const value = (button.getAttribute('data-map-filter') ?? '').trim();
        const isAll = !value || value.toLowerCase() === 'all';
        const active = isAll ? filter === null : value.toLowerCase() === filter?.toLowerCase();
        button.classList.toggle(activeClass, active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
  };

  const load = async () => {
    let elementPins: Pin[] = [];
    byId = new Map();
    if (readsElements) {
      const source = options.from as string | Element[] | undefined;
      const elements = Array.isArray(source) ? source : Array.from(document.querySelectorAll(source ?? '[data-map-pin]'));
      const parsed = pinsFromElements(elements);
      elementPins = parsed.pins;
      byId = parsed.byId;
    }
    let dataPins: Pin[] = [];
    if (data) {
      const json = typeof data === 'string' ? ((await (await fetch(data)).json()) as FeatureCollection) : data;
      dataPins = pinsFromGeoJSON(json);
    }
    all = [...elementPins, ...dataPins];
    colors = categoryColors(all, options.palette, options.colors);
  };

  let highlighted: string | null = null;
  const highlight = (id: string | null) => {
    if (id === highlighted) return;
    if (highlighted) byId.get(highlighted)?.classList.remove(activeClass);
    highlighted = id;
    if (id) byId.get(id)?.classList.add(activeClass);
  };

  const focus = (id: string) => {
    if (!loaded) {
      pendingFocus = id;
      return;
    }
    const pin = all.find((p) => p.id === id);
    if (!pin) return;
    if (!matchesFilter(pin, filter)) {
      filter = null;
      render();
    }
    const props = toFeatureCollection([pin], colors).features[0].properties;
    map.once('moveend', () => hooks.show(props, [pin.lng, pin.lat]));
    map.easeTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), 16), duration: 600 });
    highlight(id);
  };

  // Map → list
  const onPinMove = (e: MapLayerMouseEvent) => highlight(String(e.features?.[0]?.properties?.id ?? '') || null);
  const onPinLeave = () => highlight(null);
  const onClusterClick = async (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    const clusterId = feature?.properties?.cluster_id;
    const source = map.getSource(PINS_SOURCE) as GeoJSONSource | undefined;
    if (clusterId == null || !source || feature?.geometry.type !== 'Point') return;
    const zoom = await source.getClusterExpansionZoom(clusterId);
    map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: zoom + 0.3, duration: 500 });
  };
  const onPinClick = (e: MapLayerMouseEvent) => {
    const id = String(e.features?.[0]?.properties?.id ?? '');
    const pin = all.find((p) => p.id === id);
    if (!pin) return;
    highlight(id);
    options.onSelect?.(pin);
  };
  const setPointer = () => (map.getCanvas().style.cursor = 'pointer');
  const clearPointer = () => (map.getCanvas().style.cursor = '');

  // List → map, and filter buttons
  const onDocumentClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target?.closest) return;
    if (filterSelector) {
      const button = target.closest(filterSelector);
      if (button) {
        const value = (button.getAttribute('data-map-filter') ?? '').trim();
        filter = value && value.toLowerCase() !== 'all' ? value : null;
        render();
        return;
      }
    }
    for (const [id, el] of byId) {
      // Links inside a list item keep working; the rest of the item focuses the pin.
      if (el.contains(target) && !target.closest('a[href]')) {
        focus(id);
        return;
      }
    }
  };

  const onStyleData = () => {
    if (!destroyed && !map.getSource(PINS_SOURCE)) render();
  };

  // CMS lists can change (pagination, "load more", client-side filters).
  let observer: MutationObserver | null = null;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;

  const refresh = async () => {
    await load();
    if (destroyed) return;
    render();
    fit();
    loaded = true;
    if (pendingFocus) {
      const id = pendingFocus;
      pendingFocus = null;
      focus(id);
    }
  };

  const start = () => {
    void refresh();
    map.on('styledata', onStyleData);
    map.on('mousemove', PINS_LAYER, onPinMove);
    map.on('mouseleave', PINS_LAYER, onPinLeave);
    map.on('click', CLUSTER_LAYER, onClusterClick);
    map.on('click', PINS_LAYER, onPinClick);
    map.on('mouseenter', CLUSTER_LAYER, setPointer);
    map.on('mouseleave', CLUSTER_LAYER, clearPointer);
    if (typeof document !== 'undefined') {
      document.addEventListener('click', onDocumentClick);
      if (readsElements && !Array.isArray(options.from)) {
        observer = new MutationObserver((records) => {
          // Only added/removed nodes matter; ignore our own style/class changes.
          if (!records.some((r) => r.type === 'childList' && !map.getContainer().contains(r.target))) return;
          clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => void refresh(), 150);
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  };

  if (map.isStyleLoaded()) start();
  else map.once('load', start);

  return {
    pins: () => all.slice(),
    setFilter(category) {
      filter = category || null;
      render();
    },
    focus,
    async setData(next) {
      data = next;
      await refresh();
    },
    refresh,
    destroy() {
      destroyed = true;
      clearTimeout(refreshTimer);
      observer?.disconnect();
      map.off('styledata', onStyleData);
      map.off('mousemove', PINS_LAYER, onPinMove);
      map.off('mouseleave', PINS_LAYER, onPinLeave);
      map.off('click', CLUSTER_LAYER, onClusterClick);
      map.off('click', PINS_LAYER, onPinClick);
      map.off('mouseenter', CLUSTER_LAYER, setPointer);
      map.off('mouseleave', CLUSTER_LAYER, clearPointer);
      if (typeof document !== 'undefined') document.removeEventListener('click', onDocumentClick);
      for (const id of [COUNT_LAYER, CLUSTER_LAYER, PINS_LAYER]) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(PINS_SOURCE)) map.removeSource(PINS_SOURCE);
    },
  };
}
