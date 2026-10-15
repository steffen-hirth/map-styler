import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Layer, Style } from '../style/types';

const STRUCTURAL: Array<keyof Layer> = ['id', 'type', 'source', 'source-layer', 'minzoom', 'maxzoom'];

/**
 * Apply edits that only touch paint/layout properties directly via
 * setPaintProperty/setLayoutProperty. Returns false when the change needs a
 * full (diffed) setStyle instead.
 */
export function applyFastSync(map: MapLibreMap, before: Style, after: Style): boolean {
  if (before.layers.length !== after.layers.length) return false;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (key === 'layers' || key === 'metadata' || key === 'name') continue;
    if (before[key] !== after[key]) return false;
  }

  const ops: Array<() => void> = [];
  for (let i = 0; i < after.layers.length; i++) {
    const a = before.layers[i];
    const b = after.layers[i];
    if (a === b) continue;
    if (STRUCTURAL.some((key) => a[key] !== b[key])) return false;
    if (a.filter !== b.filter && JSON.stringify(a.filter) !== JSON.stringify(b.filter)) return false;
    if (!map.getLayer(b.id)) return false;

    for (const kind of ['paint', 'layout'] as const) {
      const pa = a[kind] ?? {};
      const pb = b[kind] ?? {};
      for (const key of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
        if (pa[key] === pb[key]) continue;
        const value = pb[key] === undefined ? null : structuredClone(pb[key]);
        ops.push(() =>
          kind === 'paint' ? map.setPaintProperty(b.id, key, value) : map.setLayoutProperty(b.id, key, value),
        );
      }
    }
  }
  for (const op of ops) op();
  return true;
}
