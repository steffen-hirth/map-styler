// Turns plain objects (CMS documents, API results) into GeoJSON pins.
// Understands Sanity's shapes out of the box: _id, title, slug.current,
// geopoint fields ({ _type: 'geopoint', lat, lng }) and referenced
// categories ({ title }). Other fields become tooltip fields.

import type { FeatureCollection } from '../runtime/pins';

export type PinInput = Record<string, unknown>;

/** Which fields hold what, when they don't use the default names. */
export type PinFields = {
  id?: string;
  /** Field with { lat, lng } (e.g. a Sanity geopoint). Default: "location", then "geopoint". */
  location?: string;
  lat?: string;
  lng?: string;
  name?: string;
  category?: string;
  type?: string;
  color?: string;
  url?: string;
};

const get = (item: PinInput, path: string | undefined): unknown =>
  path ? path.split('.').reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), item) : undefined;

const first = (...values: unknown[]) => values.find((v) => v !== undefined && v !== null && v !== '');

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.trim().replace(/^(-?\d+),(\d+)$/, '$1.$2'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/** Text for a field that may be a string, a slug or a referenced document. */
const toText = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    const text = first(v.title, v.name, v.label, v.current);
    return typeof text === 'string' ? text : undefined;
  }
  return undefined;
};

function position(item: PinInput, fields: PinFields): [number, number] | null {
  const loc = first(get(item, fields.location ?? 'location'), fields.location ? undefined : get(item, 'geopoint'));
  if (loc && typeof loc === 'object') {
    const l = loc as Record<string, unknown>;
    const lat = toNumber(first(l.lat, l.latitude));
    const lng = toNumber(first(l.lng, l.lon, l.longitude));
    if (lat != null && lng != null) return [lng, lat];
  }
  const lat = toNumber(first(get(item, fields.lat ?? 'lat'), get(item, 'latitude')));
  const lng = toNumber(first(get(item, fields.lng ?? 'lng'), get(item, 'lon'), get(item, 'longitude')));
  return lat != null && lng != null ? [lng, lat] : null;
}

export function pinsToGeoJSON(items: PinInput[] | null | undefined, fields: PinFields = {}): FeatureCollection {
  const features: FeatureCollection['features'] = [];
  (items ?? []).forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const coords = position(item, fields);
    if (!coords || Math.abs(coords[1]) > 90 || Math.abs(coords[0]) > 180) return;

    const properties: Record<string, string> = {};
    // Plain fields first (without Sanity's internal "_" keys) …
    for (const [key, value] of Object.entries(item)) {
      if (key.startsWith('_')) continue;
      const text = toText(value);
      if (text !== undefined) properties[key] = text;
    }
    // … then the well-known ones, so they win.
    const id = toText(first(get(item, fields.id ?? 'id'), item._id)) ?? `pin-${index}`;
    const known: Record<string, unknown> = {
      id,
      name: first(get(item, fields.name ?? 'name'), item.title),
      category: get(item, fields.category ?? 'category'),
      type: get(item, fields.type ?? 'type'),
      color: get(item, fields.color ?? 'color'),
      url: first(get(item, fields.url ?? 'url'), get(item, 'website')),
    };
    for (const [key, value] of Object.entries(known)) {
      const text = toText(value);
      if (text !== undefined) properties[key] = text;
      else delete properties[key];
    }
    delete properties.location;
    delete properties.geopoint;

    features.push({ type: 'Feature', id, geometry: { type: 'Point', coordinates: coords }, properties });
  });
  return { type: 'FeatureCollection', features };
}
