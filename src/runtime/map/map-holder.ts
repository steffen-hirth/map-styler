// Shares the live MapLibre instance with panels that need to query it.

import type { Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Layer } from '../style/types';

let current: MapLibreMap | null = null;
const listeners = new Set<() => void>();

export const mapHolder = {
  get: () => current,
  set(map: MapLibreMap | null) {
    current = map;
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useMapInstance(): MapLibreMap | null {
  return useSyncExternalStore(mapHolder.subscribe, mapHolder.get);
}

/** Subscribe to a map event and recompute a value whenever it fires. */
export function useMapValue<T>(event: 'zoom' | 'idle' | 'move', read: (map: MapLibreMap) => T, fallback: T, deps: unknown[] = []): T {
  const map = useMapInstance();
  const [value, setValue] = useState<T>(() => (map ? read(map) : fallback));
  useEffect(() => {
    if (!map) return;
    const update = () => setValue(read(map));
    update();
    map.on(event, update);
    return () => {
      map.off(event, update);
    };
  }, [map, event, ...deps]);
  return value;
}

export function useMapZoom(): number {
  return useMapValue('zoom', (map) => map.getZoom(), 0);
}

function sourceFeatures(map: MapLibreMap, layer: Layer) {
  if (!layer.source || !map.getSource(layer.source)) return [];
  try {
    const params = layer['source-layer'] ? { sourceLayer: layer['source-layer'] } : undefined;
    return map.querySourceFeatures(layer.source, params).slice(0, 400);
  } catch {
    return [];
  }
}

/** Property keys (with an example value) found in currently loaded tiles of a layer's source. */
export function sampleFields(map: MapLibreMap, layer: Layer): Array<[string, unknown]> {
  const keys = new Map<string, unknown>();
  for (const feature of sourceFeatures(map, layer)) {
    for (const [key, value] of Object.entries(feature.properties ?? {})) if (!keys.has(key)) keys.set(key, value);
  }
  return [...keys.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function sampleFeatureProps(map: MapLibreMap, layer: Layer): Record<string, unknown> | null {
  const features = sourceFeatures(map, layer);
  const named = features.find((f) => f.properties?.name);
  return (named ?? features[0])?.properties ?? null;
}
