// Route editing on the map: adding stops and pins by click, dragging points,
// and recomputing the line through the routing service.

import type { Map as MapLibreMap, MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl';
import { useEffect, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { t } from '../i18n';
import { mapHolder, useMapInstance } from '../runtime/map/map-holder';
import { computeLine, straightLine, usesRoutingService } from '../runtime/routing';
import { store } from '../runtime/state/store';
import { applyRoute, pinTypeLabel, routeConfigOf, routeDataOf, type Position, type RouteMode } from '../runtime/style/route';
import { addPin, addStop, isStop, readRoute, stopCoordinates, updatePoint, writeRoute, type RouteLine, type RoutePoint } from '../runtime/style/route-edit';
import type { Style } from '../runtime/style/types';
import { withRouteTooltips } from './templates';

// Routing status for the panel ----------------------------------------------

type Status = 'idle' | 'busy';
let status: Status = 'idle';
const listeners = new Set<() => void>();
function setStatus(next: Status) {
  status = next;
  for (const listener of listeners) listener();
}
export function useRoutingStatus(): Status {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
}

// Reading and writing -------------------------------------------------------

export function currentRoute(style: Style = store.getState().style) {
  return readRoute(routeDataOf(style));
}

function write(style: Style, points: RoutePoint[], line: RouteLine | null): Style {
  return withRouteTooltips(applyRoute(style, routeConfigOf(style), writeRoute(points, line)));
}

let controller: AbortController | null = null;

/**
 * Store new points. When the stops changed, the line is first drawn straight
 * (live) and then replaced by the routed geometry in one undo step.
 */
export async function setRoutePoints(points: RoutePoint[], options: { recompute?: boolean } = {}) {
  const { recompute = true } = options;
  const style = store.getState().style;
  const mode = routeConfigOf(style).mode;
  const previous = currentRoute(style).line;
  const name = previous?.name || t('Meine Route');
  const stops = stopCoordinates(points);

  if (!recompute) {
    store.edit((s) => write(s, points, previous));
    return;
  }

  const straight: RouteLine | null = stops.length >= 2 ? { ...straightLine(stops), name, mode } : null;
  const routed = stops.length >= 2 && usesRoutingService(mode);
  store.edit((s) => write(s, points, straight), routed);
  if (!routed) return;

  controller?.abort();
  const own = new AbortController();
  controller = own;
  setStatus('busy');
  try {
    const line = await computeLine(stops, mode, own.signal);
    if (controller !== own) return;
    store.edit((s) => write(s, currentRoute(s).points, { ...line, name, mode }));
  } catch (err) {
    if (own.signal.aborted) return;
    store.commit();
    toast.error(t('Route konnte nicht berechnet werden, sie wird als Luftlinie gezeigt. ({message})', { message: (err as Error).message }));
  } finally {
    if (controller === own) {
      controller = null;
      setStatus('idle');
    }
  }
}

export function setRouteMode(mode: RouteMode) {
  store.edit((s) => applyRoute(s, { ...routeConfigOf(s), mode }), true);
  void setRoutePoints(currentRoute().points);
}

export function renameRoute(name: string) {
  const { points, line } = currentRoute();
  store.edit((s) => write(s, points, line ? { ...line, name } : null));
}

// Map interaction -----------------------------------------------------------

const round = (p: Position): Position => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];

/** Nearest railway station within ~600 m, from the loaded vector tiles. */
function nearestStation(map: MapLibreMap, at: Position): { name: string; coordinates: Position } | null {
  let best: { name: string; coordinates: Position; d: number } | null = null;
  for (const source of Object.keys(map.getStyle().sources ?? {})) {
    let features: ReturnType<MapLibreMap['querySourceFeatures']> = [];
    try {
      features = map.querySourceFeatures(source, { sourceLayer: 'poi' });
    } catch {
      continue;
    }
    for (const f of features) {
      const p = f.properties ?? {};
      if (f.geometry.type !== 'Point' || !(p.class === 'railway' || p.subclass === 'station' || p.subclass === 'halt')) continue;
      const c = f.geometry.coordinates as Position;
      const d = Math.hypot((c[0] - at[0]) * Math.cos((at[1] * Math.PI) / 180), c[1] - at[1]);
      if (!best || d < best.d) best = { name: String(p['name:de'] ?? p.name ?? ''), coordinates: c, d };
    }
  }
  return best && best.d < 0.0055 ? { name: best.name, coordinates: round(best.coordinates) } : null;
}

const POINT_LAYERS = ['route-points', 'route-pins'];

/** Click-to-add and drag-to-move while the routes panel is open. */
export function useRouteMapTools(enabled: boolean) {
  const map = useMapInstance();

  useEffect(() => {
    if (!map || !enabled) return;

    const onClick = (e: MapMouseEvent) => {
      const { mapTool, pinType } = store.getState();
      if (!mapTool) return;
      const at = round([e.lngLat.lng, e.lngLat.lat]);
      const { points } = currentRoute();
      if (mapTool === 'pin') {
        void setRoutePoints(addPin(points, at, pinType, pinTypeLabel(pinType)), { recompute: false });
        return;
      }
      const station = routeConfigOf(store.getState().style).mode === 'train' ? nearestStation(map, at) : null;
      const count = points.filter(isStop).length + 1;
      void setRoutePoints(addStop(points, station?.coordinates ?? at, station?.name || t('Stopp {n}', { n: count })));
    };

    let dragging: { id: string; stop: boolean; moved: boolean } | null = null;
    const onEnter = () => {
      if (!store.getState().mapTool) map.getCanvas().style.cursor = 'grab';
    };
    const onLeave = () => {
      if (!store.getState().mapTool && !dragging) map.getCanvas().style.cursor = '';
    };
    const onDown = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id !== 'string' || store.getState().mapTool) return;
      e.preventDefault(); // keeps the map from panning
      const point = currentRoute().points.find((p) => p.id === id);
      dragging = { id, stop: point ? isStop(point) : false, moved: false };
      map.getCanvas().style.cursor = 'grabbing';
      map.on('mousemove', onMove);
      map.once('mouseup', onUp);
    };
    const onMove = (e: MapMouseEvent) => {
      if (!dragging) return;
      dragging.moved = true;
      const { points } = currentRoute();
      const moved = updatePoint(points, dragging.id, { coordinates: round([e.lngLat.lng, e.lngLat.lat]) });
      store.edit((s) => write(s, moved, currentRoute(s).line), true);
    };
    const onUp = () => {
      map.off('mousemove', onMove);
      map.getCanvas().style.cursor = '';
      const done = dragging;
      dragging = null;
      if (!done?.moved) return;
      if (done.stop) void setRoutePoints(currentRoute().points);
      else store.commit();
    };

    map.on('click', onClick);
    for (const layer of POINT_LAYERS) {
      map.on('mouseenter', layer, onEnter);
      map.on('mouseleave', layer, onLeave);
      map.on('mousedown', layer, onDown);
    }
    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMove);
      for (const layer of POINT_LAYERS) {
        map.off('mouseenter', layer, onEnter);
        map.off('mouseleave', layer, onLeave);
        map.off('mousedown', layer, onDown);
      }
    };
  }, [map, enabled]);
}

export function fitPoints(points: RoutePoint[], line: RouteLine | null) {
  const map = mapHolder.get();
  const coords = [...(line?.coordinates ?? []), ...points.map((p) => p.coordinates)];
  if (!map || !coords.length) return;
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  const wide = window.innerWidth >= 768;
  const right = document.documentElement.dataset.mode === 'expert' ? 370 : 40;
  map.fitBounds(
    [
      [Math.min(...xs), Math.min(...ys)],
      [Math.max(...xs), Math.max(...ys)],
    ],
    { padding: wide ? { top: 60, bottom: 90, left: 360, right } : 40, maxZoom: 15.5, duration: 800 },
  );
}
