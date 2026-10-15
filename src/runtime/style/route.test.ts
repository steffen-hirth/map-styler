import { describe, expect, it } from 'vitest';
import { applyRecipe, rampColor } from './recolor';
import { applyRoute, DEFAULT_ROUTE, parseRouteFile, removeRoute, routeBounds, ROUTE_SOURCE, sampleRoute } from './route';
import type { Style } from './types';

const base = (): Style => ({
  version: 8,
  sources: {},
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } },
    { id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#000000' } },
    { id: 'place', type: 'symbol', 'source-layer': 'place', layout: { 'text-field': ['get', 'name'] }, paint: { 'text-color': '#333333' } },
    { id: 'poi', type: 'symbol', 'source-layer': 'poi', layout: { 'text-field': ['get', 'name'] } },
  ],
});

describe('recolor', () => {
  it('maps lightness onto a ramp', () => {
    expect(rampColor('#ffffff', ['#000000', '#ff0000'])).toBe('#ff0000');
    expect(rampColor('#000000', ['#102030', '#ffffff'])).toBe('#102030');
    expect(rampColor('rgba(255, 255, 255, 0.5)', ['#000000', '#ff0000'])).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('stretches contrast within a lightness window', () => {
    // Yellow main road (l ≈ 0.77) falls below the window, white stays white.
    expect(rampColor('#ffcc88', ['#d6d6d6', '#ffffff', 0.85, 0.97])).toBe('#d6d6d6');
    expect(rampColor('#ffffff', ['#d6d6d6', '#ffffff', 0.85, 0.97])).toBe('#ffffff');
  });

  it('applies ramps, label colors and hidden groups', () => {
    const style = applyRecipe(base(), {
      ramps: { background: ['#111111', '#222222'], water: ['#0000ff', '#00ffff'] },
      labels: { text: '#eeeeee', halo: '#111111' },
      hide: ['poi'],
    });
    expect(style.layers[0].paint?.['background-color']).toBe('#222222');
    expect(style.layers[1].paint?.['fill-color']).toBe('#0000ff');
    expect(style.layers[2].paint).toMatchObject({ 'text-color': '#eeeeee', 'text-halo-color': '#111111' });
    expect(style.layers[3].layout?.visibility).toBe('none');
  });
});

describe('route overlay', () => {
  it('adds source and layers below labels, points on top', () => {
    const style = applyRoute(base(), DEFAULT_ROUTE);
    expect(style.sources[ROUTE_SOURCE]).toBeTruthy();
    expect(style.layers.map((l) => l.id)).toEqual([
      'background', 'water', 'route-casing', 'route-line', 'route-arrows', 'place', 'poi', 'route-points', 'route-labels',
    ]);
  });

  it('keeps layer positions and data when updating', () => {
    const first = applyRoute(base(), DEFAULT_ROUTE);
    const second = applyRoute(first, { ...DEFAULT_ROUTE, color: '#ff0000', dash: 'dashed' });
    expect(second.layers.map((l) => l.id)).toEqual(first.layers.map((l) => l.id));
    expect(second.sources[ROUTE_SOURCE]).toBe(first.sources[ROUTE_SOURCE]);
    const line = second.layers.find((l) => l.id === 'route-line')!;
    expect(line.paint).toMatchObject({ 'line-color': '#ff0000', 'line-dasharray': [2, 1.6] });
  });

  it('removes everything again', () => {
    const style = removeRoute(applyRoute(base(), DEFAULT_ROUTE));
    expect(style.layers.map((l) => l.id)).toEqual(['background', 'water', 'place', 'poi']);
    expect(style.sources[ROUTE_SOURCE]).toBeUndefined();
  });

  it('computes stats and bounds for the sample', () => {
    const line = sampleRoute().features[0];
    expect(line.properties.distance_km).toBeGreaterThan(5);
    expect(routeBounds(sampleRoute())?.[0][0]).toBeCloseTo(9.1305);
  });

  it('parses GeoJSON geometries', () => {
    const fc = parseRouteFile(JSON.stringify({ type: 'LineString', coordinates: [[9, 48], [9.01, 48]] }), 'r.geojson');
    expect(fc.features[0].properties.distance_km).toBeCloseTo(0.7, 1);
  });
});
