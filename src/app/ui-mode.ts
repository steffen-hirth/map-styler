// Simple vs. expert mode. Simple shows templates and a few basics; expert adds
// the layer editor, properties panel, palette, global adjustments and inspector.

import { useSyncExternalStore } from 'react';
import { store, type Tab } from '../runtime/state/store';
import { storageKey } from '../stage';

export type UiMode = 'simple' | 'expert';

const STORAGE_KEY = storageKey('mode');
const listeners = new Set<() => void>();

export const SIMPLE_TABS: Tab[] = ['templates', 'palette', 'route', 'tooltips'];

function read(): UiMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'expert' ? 'expert' : 'simple';
  } catch {
    return 'simple';
  }
}

let mode: UiMode = typeof window === 'undefined' ? 'simple' : read();
if (typeof document !== 'undefined') document.documentElement.dataset.mode = mode;

export const getUiMode = () => mode;

export function setUiMode(next: UiMode) {
  if (next === mode) return;
  mode = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Preference is a convenience only.
  }
  document.documentElement.dataset.mode = next;
  if (next === 'simple') {
    const { tab } = store.getState();
    store.setUi({ selectedId: null, inspect: false, inspected: null, tab: SIMPLE_TABS.includes(tab) ? tab : 'templates' });
  }
  for (const listener of listeners) listener();
}

export function useUiMode(): UiMode {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getUiMode,
    () => 'simple',
  );
}
