// Single source of truth for the edited style plus UI selection, with undo/redo
// and local persistence. Styles are treated as immutable values.

import { useSyncExternalStore } from 'react';
import { DEFAULT_VIEW, STORAGE_KEY } from '../../app/app-schema';
import { t } from '../../i18n';
import { setLayerProp, uniqueLayerId } from '../style/style-utils';
import { isStyle, type Layer, type PropKind, type Style } from '../style/types';
import { KEY as TOOLTIP_KEY, normalize as normalizeTooltips, type TooltipConfig } from '../tooltips';

export type Tab = 'templates' | 'layers' | 'palette' | 'route' | 'global' | 'tooltips';

export type InspectedFeature = {
  layerId: string;
  sourceLayer?: string;
  properties: Record<string, unknown>;
};

export type View = { center: [number, number]; zoom: number };

export type AppState = {
  status: 'loading' | 'ready' | 'error';
  error?: string;
  /** Current style, including uncommitted live edits (slider drags etc.). */
  style: Style;
  /** Style at the last commit; stable during a drag. */
  committed: Style;
  selectedId: string | null;
  tab: Tab;
  inspect: boolean;
  inspected: InspectedFeature[] | null;
  exportOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

type UiPatch = Partial<Pick<AppState, 'selectedId' | 'tab' | 'inspect' | 'inspected' | 'exportOpen'>>;

const EMPTY_STYLE: Style = { version: 8, sources: {}, layers: [] };
const HISTORY_LIMIT = 200;

function readSaved(): { style: Style; view: View } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!isStyle(data?.style)) return null;
    return { style: data.style, view: data.view ?? DEFAULT_VIEW };
  } catch {
    return null;
  }
}

function prepare(style: Style): Style {
  return { ...style, metadata: { ...(style.metadata ?? {}), [TOOLTIP_KEY]: normalizeTooltips(style.metadata?.[TOOLTIP_KEY]) } };
}

/** Load a style JSON; relative sprite, glyph and source URLs are resolved against it. */
export async function fetchStyle(url: string): Promise<Style> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const style = await res.json();
  if (!isStyle(style)) throw new Error(t('Keine MapLibre-Style-Datei (version 8, sources, layers).'));
  const resolve = (value: unknown) =>
    typeof value === 'string' && !/^[a-z]+:\/\//i.test(value) && !value.startsWith('mapbox:') ? new URL(value, url).href : value;
  if (typeof style.sprite === 'string') style.sprite = resolve(style.sprite);
  if (style.glyphs) style.glyphs = String(resolve(style.glyphs)).replace(/%7B/g, '{').replace(/%7D/g, '}');
  for (const source of Object.values(style.sources) as Array<Record<string, unknown>>) {
    if (typeof source.url === 'string') source.url = resolve(source.url);
  }
  return style;
}

export function tooltipConfigOf(style: Style): TooltipConfig {
  return normalizeTooltips(style.metadata?.[TOOLTIP_KEY]);
}

class AppStore {
  private state: AppState = {
    status: 'loading',
    style: EMPTY_STYLE,
    committed: EMPTY_STYLE,
    selectedId: null,
    tab: 'templates',
    inspect: false,
    inspected: null,
    exportOpen: false,
    canUndo: false,
    canRedo: false,
  };
  private listeners = new Set<() => void>();
  private history: Style[] = [];
  private future: Style[] = [];
  private pending: Style | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  view: View = DEFAULT_VIEW;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = () => this.state;

  private set(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  private flags() {
    return { canUndo: this.history.length > 0, canRedo: this.future.length > 0 };
  }

  /** Restore the last session, if any. */
  restore(): boolean {
    const saved = readSaved();
    if (!saved) return false;
    this.view = saved.view;
    this.load(saved.style);
    return true;
  }

  load(style: Style) {
    const prepared = prepare(style);
    this.history = [];
    this.future = [];
    this.pending = null;
    this.set({ status: 'ready', error: undefined, style: prepared, committed: prepared, selectedId: null, ...this.flags() });
    this.persist();
  }

  fail(message: string) {
    this.set({ status: 'error', error: message });
  }

  setUi(patch: UiPatch) {
    this.set(patch);
  }

  setView(view: View) {
    this.view = view;
    this.persist();
  }

  /** Apply a change. Live edits update the map but only land in history on commit(). */
  edit(fn: (style: Style) => Style, live = false) {
    if (!this.pending) this.pending = this.state.style;
    const next = fn(this.state.style);
    if (next !== this.state.style) this.set({ style: next });
    if (live) this.persist();
    else this.commit();
  }

  commit() {
    const before = this.pending;
    this.pending = null;
    if (before && before !== this.state.style) {
      this.history.push(before);
      if (this.history.length > HISTORY_LIMIT) this.history.shift();
      this.future = [];
    }
    if (this.state.committed !== this.state.style || before) {
      this.set({ committed: this.state.style, ...this.flags() });
    }
    this.persist();
  }

  /** Drop uncommitted live edits. */
  revert() {
    if (!this.pending) return;
    const before = this.pending;
    this.pending = null;
    this.set({ style: before, committed: before });
    this.persist();
  }

  undo() {
    this.commit();
    const prev = this.history.pop();
    if (!prev) return;
    this.future.push(this.state.style);
    this.applySnapshot(prev);
  }

  redo() {
    this.commit();
    const next = this.future.pop();
    if (!next) return;
    this.history.push(this.state.style);
    this.applySnapshot(next);
  }

  private applySnapshot(style: Style) {
    const { selectedId } = this.state;
    const keepSelection = selectedId && style.layers.some((l) => l.id === selectedId);
    this.set({ style, committed: style, selectedId: keepSelection ? selectedId : null, ...this.flags() });
    this.persist();
  }

  /** Swap in a whole new style (base style, import). Undoable. */
  replace(style: Style) {
    this.commit();
    this.history.push(this.state.style);
    this.future = [];
    const prepared = prepare(style);
    this.set({ status: 'ready', style: prepared, committed: prepared, selectedId: null, inspected: null, ...this.flags() });
    this.persist();
  }

  // Layer operations -------------------------------------------------------

  updateLayer(id: string, fn: (layer: Layer) => Layer, live = false) {
    this.edit((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? fn(l) : l)) }), live);
  }

  setProp(id: string, kind: PropKind, name: string, value: unknown, live = false) {
    this.updateLayer(id, (l) => setLayerProp(l, kind, name, value), live);
  }

  setVisibility(ids: string[], visible: boolean) {
    const set = new Set(ids);
    this.edit((s) => ({
      ...s,
      layers: s.layers.map((l) => (set.has(l.id) ? setLayerProp(l, 'layout', 'visibility', visible ? undefined : 'none') : l)),
    }));
  }

  renameLayer(id: string, nextId: string): boolean {
    if (!nextId || nextId === id) return false;
    if (this.state.style.layers.some((l) => l.id === nextId)) return false;
    this.edit((s) => {
      const tooltips = tooltipConfigOf(s);
      if (tooltips.layers[id]) {
        tooltips.layers[nextId] = tooltips.layers[id];
        delete tooltips.layers[id];
      }
      return {
        ...s,
        layers: s.layers.map((l) => (l.id === id ? { ...l, id: nextId } : l)),
        metadata: { ...(s.metadata ?? {}), [TOOLTIP_KEY]: tooltips },
      };
    });
    this.set({ selectedId: nextId });
    return true;
  }

  /** Move a layer in render order; +1 draws it later (on top). */
  moveLayer(id: string, delta: 1 | -1) {
    const layers = this.state.style.layers;
    const from = layers.findIndex((l) => l.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= layers.length) return;
    this.edit((s) => {
      const next = s.layers.slice();
      const [layer] = next.splice(from, 1);
      next.splice(to, 0, layer);
      return { ...s, layers: next };
    });
  }

  duplicateLayer(id: string) {
    const style = this.state.style;
    const index = style.layers.findIndex((l) => l.id === id);
    if (index < 0) return;
    const copy = { ...structuredClone(style.layers[index]), id: uniqueLayerId(style, `${id}-kopie`) };
    this.edit((s) => {
      const next = s.layers.slice();
      next.splice(index + 1, 0, copy);
      return { ...s, layers: next };
    });
    this.set({ selectedId: copy.id });
  }

  deleteLayer(id: string) {
    this.edit((s) => {
      const tooltips = tooltipConfigOf(s);
      delete tooltips.layers[id];
      return {
        ...s,
        layers: s.layers.filter((l) => l.id !== id),
        metadata: { ...(s.metadata ?? {}), [TOOLTIP_KEY]: tooltips },
      };
    });
    if (this.state.selectedId === id) this.set({ selectedId: null });
  }

  replaceLayer(id: string, layer: Layer) {
    this.edit((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? layer : l)) }));
    if (layer.id !== id) this.set({ selectedId: layer.id });
  }

  editTooltips(fn: (config: TooltipConfig) => TooltipConfig, live = false) {
    this.edit((s) => ({ ...s, metadata: { ...(s.metadata ?? {}), [TOOLTIP_KEY]: fn(tooltipConfigOf(s)) } }), live);
  }

  // Persistence ------------------------------------------------------------

  private persist() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      if (this.state.status !== 'ready') return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ style: this.state.style, view: this.view }));
      } catch {
        // Storage unavailable or full: editing keeps working, only the autosave is skipped.
      }
    }, 400);
  }
}

export const store = new AppStore();

export function useAppState<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}
