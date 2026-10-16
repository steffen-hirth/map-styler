import { describe, expect, it } from 'vitest';
import { coordinatesFromQuery, parseNominatim } from './geocode';
import { mapStyler } from './plugin';
import { viewOf } from './view-input';

describe('parseNominatim', () => {
  it('turns search hits into results and skips broken ones', () => {
    const results = parseNominatim([
      { display_name: 'Karlshöhe, Stuttgart', lat: '48.7661', lon: '9.1627' },
      { display_name: 'broken', lat: 'x', lon: '9' },
      { lat: '1', lon: '2' },
    ]);
    expect(results).toEqual([{ label: 'Karlshöhe, Stuttgart', lat: 48.7661, lng: 9.1627 }]);
    expect(parseNominatim({ error: 'nope' })).toEqual([]);
  });
});

describe('coordinatesFromQuery', () => {
  it('accepts pasted "lat, lng" pairs', () => {
    expect(coordinatesFromQuery('48.7661, 9.1627')).toMatchObject({ lat: 48.7661, lng: 9.1627 });
    expect(coordinatesFromQuery('48,7661; 9,1627')).toMatchObject({ lat: 48.7661, lng: 9.1627 });
    expect(coordinatesFromQuery('Karlshöhe Stuttgart')).toBeNull();
    expect(coordinatesFromQuery('95, 9')).toBeNull();
  });
});

describe('viewOf', () => {
  it('rounds the camera so documents stay readable', () => {
    const map = { getCenter: () => ({ lat: 48.123456789, lng: 9.987654321 }), getZoom: () => 14.56789, getPitch: () => 44.44, getBearing: () => -12.345 };
    expect(viewOf(map as never)).toEqual({ lat: 48.123457, lng: 9.987654, zoom: 14.57, pitch: 44.4, bearing: -12.3 });
  });
});

describe('mapStyler plugin', () => {
  const typeNames = (plugin: ReturnType<typeof mapStyler>) => {
    const types = (plugin as unknown as { schema: { types: Array<{ name: string }> } }).schema.types;
    return types.map((t) => t.name);
  };

  it('registers the location, pin, view and map types', () => {
    expect(typeNames(mapStyler())).toEqual(['mapLocation', 'mapPin', 'mapView', 'styledMap']);
  });

  it('can leave out the Map document type', () => {
    expect(typeNames(mapStyler({ documentType: false }))).toEqual(['mapLocation', 'mapPin', 'mapView']);
  });
});
