// Address search for the location input. The default asks OpenStreetMap's
// Nominatim, which allows light interactive use (max. 1 request per second,
// with attribution). Projects with more traffic pass their own geocoder.

export type GeoResult = { label: string; lat: number; lng: number };
export type Geocoder = (query: string, signal: AbortSignal) => Promise<GeoResult[]>;

type NominatimHit = { display_name?: unknown; lat?: unknown; lon?: unknown };

/** Nominatim's jsonv2 search response → results; malformed hits are skipped. */
export function parseNominatim(json: unknown): GeoResult[] {
  if (!Array.isArray(json)) return [];
  const results: GeoResult[] = [];
  for (const hit of json as NominatimHit[]) {
    const lat = Number(hit?.lat);
    const lng = Number(hit?.lon);
    if (typeof hit?.display_name !== 'string' || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    results.push({ label: hit.display_name, lat, lng });
  }
  return results;
}

export function nominatim({ language, countries }: { language?: string; countries?: string[] } = {}): Geocoder {
  return async (query, signal) => {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '5' });
    if (language) params.set('accept-language', language);
    if (countries?.length) params.set('countrycodes', countries.join(','));
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    return parseNominatim(await res.json());
  };
}

/** "48.7784, 9.18" typed into the search box is taken as coordinates directly. */
export function coordinatesFromQuery(query: string): GeoResult | null {
  const m = /^\s*(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/.exec(query);
  if (!m) return null;
  const lat = Number(m[1].replace(',', '.'));
  const lng = Number(m[2].replace(',', '.'));
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { label: `${lat}, ${lng}`, lat, lng };
}
