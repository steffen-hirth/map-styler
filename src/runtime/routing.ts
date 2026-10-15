// Routing along real paths via the public OSRM servers run by FOSSGIS
// (routing.openstreetmap.de, OpenStreetMap data, no key). Only the stop
// coordinates are sent. Train and plain lines are computed locally.

import { lineLengthKm, type Position, type RouteMode } from './style/route';

const OSRM: Partial<Record<RouteMode, string>> = {
  foot: 'https://routing.openstreetmap.de/routed-foot',
  bike: 'https://routing.openstreetmap.de/routed-bike',
  car: 'https://routing.openstreetmap.de/routed-car',
};

export type ComputedLine = { coordinates: Position[]; distanceKm: number; durationMin?: number };

export const usesRoutingService = (mode: RouteMode) => Boolean(OSRM[mode]);

const round = (p: Position): Position => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];

export function straightLine(stops: Position[]): ComputedLine {
  return { coordinates: stops.map(round), distanceKm: Math.round(lineLengthKm(stops) * 10) / 10 };
}

export async function computeLine(stops: Position[], mode: RouteMode, signal?: AbortSignal): Promise<ComputedLine> {
  const base = OSRM[mode];
  if (!base || stops.length < 2) return straightLine(stops);
  const path = stops.map((p) => `${p[0]},${p[1]}`).join(';');
  const res = await fetch(`${base}/route/v1/driving/${path}?overview=full&geometries=geojson`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const route = data?.routes?.[0];
  if (data?.code !== 'Ok' || !route) throw new Error(data?.message || data?.code || 'No route');
  return {
    coordinates: (route.geometry.coordinates as Position[]).map(round),
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMin: Math.round(route.duration / 60),
  };
}
