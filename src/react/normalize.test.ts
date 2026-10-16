import { describe, expect, it } from 'vitest';
import { pinsFromGeoJSON } from '../runtime/pins';
import { pinsToGeoJSON } from './normalize';

describe('pinsToGeoJSON', () => {
  it('reads Sanity documents with a geopoint, slug and referenced category', () => {
    const fc = pinsToGeoJSON([
      {
        _id: 'store-1',
        _type: 'store',
        title: 'Café Kiez',
        slug: { _type: 'slug', current: 'cafe-kiez' },
        location: { _type: 'geopoint', lat: 48.7745, lng: 9.162, alt: 0 },
        category: { _id: 'cat-1', title: 'Café' },
        address: 'Hauptstraße 1',
      },
    ]);
    expect(fc.features).toHaveLength(1);
    const f = fc.features[0];
    expect(f.geometry.coordinates).toEqual([9.162, 48.7745]);
    // "title" stays available to templates next to the derived "name".
    expect(f.properties).toEqual({ id: 'store-1', name: 'Café Kiez', title: 'Café Kiez', slug: 'cafe-kiez', category: 'Café', address: 'Hauptstraße 1' });
  });

  it('reads flat lat/lng (also as strings with decimal commas)', () => {
    const fc = pinsToGeoJSON([{ id: 7, name: 'A', lat: '48,1', lng: 11.5 }]);
    expect(fc.features[0].geometry.coordinates).toEqual([11.5, 48.1]);
    expect(fc.features[0].properties?.id).toBe('7');
  });

  it('follows custom field names, including nested paths', () => {
    const fc = pinsToGeoJSON([{ headline: 'B', place: { coords: { latitude: 52.5, longitude: 13.4 } }, kind: 'Shop' }], {
      name: 'headline',
      location: 'place.coords',
      category: 'kind',
    });
    expect(fc.features[0].geometry.coordinates).toEqual([13.4, 52.5]);
    expect(fc.features[0].properties).toMatchObject({ name: 'B', category: 'Shop' });
  });

  it('skips items without a usable position', () => {
    expect(pinsToGeoJSON([{ title: 'no position' }, { lat: 91, lng: 0 }, null as never]).features).toHaveLength(0);
    expect(pinsToGeoJSON(undefined).features).toHaveLength(0);
  });

  it('produces data the pin runtime understands', () => {
    const pins = pinsFromGeoJSON(pinsToGeoJSON([{ _id: 'x', title: 'C', location: { lat: 1, lng: 2 }, category: 'Museum', type: 'info' }]));
    expect(pins[0]).toMatchObject({ id: 'x', name: 'C', lat: 1, lng: 2, category: 'Museum', type: 'info' });
  });
});
