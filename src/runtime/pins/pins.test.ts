import { describe, expect, it } from 'vitest';
import { categoryColors, matchesFilter, parseCoordinates, parseNumber, parsePin, pinsFromGeoJSON, toFeatureCollection } from './index';

describe('parseNumber', () => {
  it('reads dot and comma decimals', () => {
    expect(parseNumber('48.7784')).toBe(48.7784);
    expect(parseNumber('48,7784')).toBe(48.7784);
    expect(parseNumber(' -9.5 ')).toBe(-9.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });
});

describe('parseCoordinates', () => {
  it('reads common "lat, lng" spellings', () => {
    expect(parseCoordinates('48.7784, 9.18')).toEqual([48.7784, 9.18]);
    expect(parseCoordinates('48.7784,9.18')).toEqual([48.7784, 9.18]);
    expect(parseCoordinates('48.7784 9.18')).toEqual([48.7784, 9.18]);
    expect(parseCoordinates('48,7784; 9,18')).toEqual([48.7784, 9.18]);
    expect(parseCoordinates('48,7784 9,18')).toEqual([48.7784, 9.18]);
    expect(parseCoordinates('48.7784')).toBeNull();
  });
});

describe('parsePin', () => {
  it('builds a pin from data attributes', () => {
    const pin = parsePin({ 'map-pin': '', lat: '48.7784', lng: '9.18', name: ' Café Kiez ', category: 'Café', type: 'cafe', url: 'https://example.com', 'opening-hours': '8–18' }, 0);
    expect(pin).toMatchObject({ id: 'pin-0', lat: 48.7784, lng: 9.18, name: 'Café Kiez', category: 'Café', type: 'cafe', color: null });
    expect(pin?.props).toEqual({ url: 'https://example.com', opening_hours: '8–18' });
  });

  it('accepts a combined coordinates field and an explicit id and color', () => {
    const pin = parsePin({ coordinates: '48.1, 11.5', id: 'store-7', color: 'E06', type: 'unknown' }, 3);
    expect(pin).toMatchObject({ id: 'store-7', lat: 48.1, lng: 11.5, color: '#ee0066', type: 'pin' });
  });

  it('rejects missing or impossible coordinates', () => {
    expect(parsePin({ name: 'Nowhere' }, 0)).toBeNull();
    expect(parsePin({ lat: '120', lng: '9' }, 0)).toBeNull();
  });
});

describe('pinsFromGeoJSON', () => {
  it('reads point features and skips other geometries', () => {
    const pins = pinsFromGeoJSON({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', id: 12, geometry: { type: 'Point', coordinates: [9.18, 48.77] }, properties: { name: 'A', category: 'Shop' } },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      ],
    });
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ id: '12', lng: 9.18, lat: 48.77, name: 'A', category: 'Shop' });
  });
});

describe('colors and filters', () => {
  const pins = [parsePin({ lat: '1', lng: '1', category: 'Café' }, 0)!, parsePin({ lat: '2', lng: '2', category: 'Shop' }, 1)!, parsePin({ lat: '3', lng: '3', category: 'Café' }, 2)!];

  it('gives each category its own color, fixed colors win', () => {
    const colors = categoryColors(pins, ['#111111', '#222222'], { Shop: '#abcdef' });
    expect(colors).toEqual({ Shop: '#abcdef', Café: '#111111' });
  });

  it('filters by category, case-insensitive, empty filter shows all', () => {
    expect(pins.filter((p) => matchesFilter(p, 'café'))).toHaveLength(2);
    expect(pins.filter((p) => matchesFilter(p, null))).toHaveLength(3);
  });

  it('bakes type and color into the icon id', () => {
    const fc = toFeatureCollection([pins[0]], { Café: '#e0604f' });
    expect(fc.features[0].properties.icon).toBe('msx-pin-pin-e0604f');
    expect(fc.features[0].geometry.coordinates).toEqual([1, 1]);
  });
});
