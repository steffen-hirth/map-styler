// Editing model for routes: an ordered list of stops (start, waypoints, end)
// that the line is routed through, plus free pins. Pure functions; the line
// geometry itself comes from the routing step.

import { isPinType, type PinType } from '../tooltips/pin-icons';
import { durationLabel, pinTypeLabel, stopKindLabel, type Feature, type FeatureCollection, type Position, type RouteMode } from './route';

export type StopKind = 'start' | 'waypoint' | 'end';

export type RoutePoint = {
  id: string;
  kind: StopKind | 'pin';
  type: PinType;
  name: string;
  description?: string;
  url?: string;
  coordinates: Position;
};

export type RouteLine = {
  coordinates: Position[];
  name?: string;
  distanceKm?: number;
  durationMin?: number;
  mode?: RouteMode;
};

export const isStop = (p: RoutePoint) => p.kind !== 'pin';

let counter = 0;
export const newPointId = () => `p${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Read points and line from route data; ids are derived from order when missing. */
export function readRoute(fc: FeatureCollection | null): { points: RoutePoint[]; line: RouteLine | null } {
  const points: RoutePoint[] = [];
  let line: RouteLine | null = null;
  for (const [index, f] of (fc?.features ?? []).entries()) {
    const p = f.properties ?? {};
    if (f.geometry.type === 'Point') {
      const kind = p.kind === 'start' || p.kind === 'end' || p.kind === 'pin' ? p.kind : 'waypoint';
      points.push({
        id: typeof p.id === 'string' ? p.id : `f${index}`,
        kind,
        type: isPinType(p.type) ? p.type : 'pin',
        name: typeof p.name === 'string' ? p.name : '',
        description: typeof p.description === 'string' ? p.description : undefined,
        url: typeof p.url === 'string' ? p.url : undefined,
        coordinates: f.geometry.coordinates as Position,
      });
    } else if (!line && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')) {
      const coords = f.geometry.type === 'LineString' ? (f.geometry.coordinates as Position[]) : (f.geometry.coordinates as Position[][]).flat();
      line = {
        coordinates: coords,
        name: typeof p.name === 'string' ? p.name : undefined,
        distanceKm: typeof p.distance_km === 'number' ? p.distance_km : undefined,
        durationMin: typeof p.duration_min === 'number' ? p.duration_min : undefined,
        mode: typeof p.mode === 'string' ? (p.mode as RouteMode) : undefined,
      };
    }
  }
  return { points, line };
}

/** Stops first (in order) with start/waypoint/end assigned by position, then pins. */
export function normalizePoints(points: RoutePoint[]): RoutePoint[] {
  const stops = points.filter(isStop);
  const pins = points.filter((p) => !isStop(p));
  const kinds = stops.map((_, i): StopKind => (i === 0 ? 'start' : i === stops.length - 1 ? 'end' : 'waypoint'));
  return [...stops.map((p, i) => ({ ...p, kind: kinds[i] })), ...pins];
}

export function writeRoute(points: RoutePoint[], line: RouteLine | null): FeatureCollection {
  const features: Feature[] = [];
  const normalized = normalizePoints(points);
  if (line && line.coordinates.length >= 2) {
    const mode = line.mode ?? 'line';
    features.push({
      type: 'Feature',
      properties: {
        name: line.name ?? '',
        mode,
        ...(line.distanceKm !== undefined ? { distance_km: line.distanceKm } : {}),
        ...(line.durationMin !== undefined ? { duration_min: line.durationMin } : {}),
        duration_label: durationLabel(line.durationMin, mode),
      },
      geometry: { type: 'LineString', coordinates: line.coordinates },
    });
  }
  for (const p of normalized) {
    features.push({
      type: 'Feature',
      properties: {
        id: p.id,
        kind: p.kind,
        type: p.type,
        name: p.name,
        label: p.kind === 'pin' ? pinTypeLabel(p.type) : stopKindLabel(p.kind),
        ...(p.description ? { description: p.description } : {}),
        ...(p.url ? { url: p.url } : {}),
      },
      geometry: { type: 'Point', coordinates: p.coordinates },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function addStop(points: RoutePoint[], coordinates: Position, name: string): RoutePoint[] {
  const stops = points.filter(isStop);
  const pins = points.filter((p) => !isStop(p));
  return normalizePoints([...stops, { id: newPointId(), kind: 'end', type: 'pin', name, coordinates }, ...pins]);
}

export function addPin(points: RoutePoint[], coordinates: Position, type: PinType, name: string): RoutePoint[] {
  return [...points, { id: newPointId(), kind: 'pin', type, name, coordinates }];
}

export function updatePoint(points: RoutePoint[], id: string, patch: Partial<Omit<RoutePoint, 'id'>>): RoutePoint[] {
  return normalizePoints(points.map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

export function removePoint(points: RoutePoint[], id: string): RoutePoint[] {
  return normalizePoints(points.filter((p) => p.id !== id));
}

/** Move a stop up (-1) or down (+1) in the route order. */
export function moveStop(points: RoutePoint[], id: string, delta: -1 | 1): RoutePoint[] {
  const stops = points.filter(isStop);
  const pins = points.filter((p) => !isStop(p));
  const from = stops.findIndex((p) => p.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= stops.length) return points;
  const next = stops.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return normalizePoints([...next, ...pins]);
}

export const stopCoordinates = (points: RoutePoint[]) => points.filter(isStop).map((p) => p.coordinates);
