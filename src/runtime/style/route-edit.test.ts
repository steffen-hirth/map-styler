import { describe, expect, it } from 'vitest';
import { straightLine } from '../routing';
import { durationLabel, sampleRoute } from './route';
import { addPin, addStop, moveStop, readRoute, removePoint, updatePoint, writeRoute, type RoutePoint } from './route-edit';

const at = (x: number): [number, number] => [9 + x / 100, 48.7];

describe('route editing', () => {
  it('assigns start, waypoint and end by order', () => {
    let points: RoutePoint[] = [];
    points = addStop(points, at(1), 'A');
    expect(points.map((p) => p.kind)).toEqual(['start']);
    points = addStop(points, at(2), 'B');
    points = addStop(points, at(3), 'C');
    expect(points.map((p) => [p.name, p.kind])).toEqual([['A', 'start'], ['B', 'waypoint'], ['C', 'end']]);
  });

  it('keeps pins out of the stop order', () => {
    let points = addStop([], at(1), 'A');
    points = addPin(points, at(5), 'cafe', 'Café');
    points = addStop(points, at(2), 'B');
    expect(points.map((p) => p.kind)).toEqual(['start', 'end', 'pin']);
  });

  it('reorders and removes stops', () => {
    let points = addStop(addStop(addStop([], at(1), 'A'), at(2), 'B'), at(3), 'C');
    points = moveStop(points, points[2].id, -1);
    expect(points.map((p) => p.name)).toEqual(['A', 'C', 'B']);
    expect(points[2].kind).toBe('end');
    points = removePoint(points, points[0].id);
    expect(points.map((p) => [p.name, p.kind])).toEqual([['C', 'start'], ['B', 'end']]);
  });

  it('round-trips through GeoJSON', () => {
    const { points, line } = readRoute(sampleRoute());
    expect(points.filter((p) => p.kind === 'pin')).toHaveLength(1);
    expect(line?.distanceKm).toBe(6.7);
    const again = readRoute(writeRoute(points, line));
    expect(again.points.map((p) => p.id)).toEqual(points.map((p) => p.id));
    expect(again.line?.coordinates).toEqual(line?.coordinates);
  });

  it('remembers names the user typed', () => {
    const points = addStop([], at(1), 'Auto');
    const typed = updatePoint(points, points[0].id, { name: 'Mein Platz', autoName: false });
    const again = readRoute(writeRoute(typed, null)).points[0];
    expect(again).toMatchObject({ name: 'Mein Platz', autoName: false });
    expect(readRoute(writeRoute(points, null)).points[0].autoName).toBeUndefined();
  });

  it('builds straight lines with a distance', () => {
    const line = straightLine([at(0), at(10)]);
    expect(line.coordinates).toHaveLength(2);
    expect(line.distanceKm).toBeGreaterThan(7);
  });

  it('formats durations', () => {
    expect(durationLabel(88, 'foot')).toBe('about 1 h 28 min on foot');
    expect(durationLabel(undefined, 'car')).toBe('');
  });
});
