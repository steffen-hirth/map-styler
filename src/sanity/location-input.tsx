// Location input for Sanity Studio: a MapLibre map instead of Google Maps.
// Click or drag the pin, or search an address. Stores a regular Sanity
// geopoint ({ _type: 'geopoint', lat, lng }), so existing data keeps working.

import { Icon } from '@sanity/icons';
import { Box, Button, Card, Flex, Spinner, Stack, Text, TextInput } from '@sanity/ui';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { set, unset, type GeopointValue, type ObjectInputProps } from 'sanity';
import { coordinatesFromQuery, type GeoResult, type Geocoder } from './geocode';

export type LocationInputOptions = {
  /** Map style for the input (a calm style works best). */
  mapStyle: string;
  /** Address search; null hides the search field. */
  geocoder: Geocoder | null;
  /** Where the map starts when no location is set yet: [lng, lat]. */
  defaultCenter: [number, number];
  defaultZoom: number;
  markerColor: string;
};

type Geopoint = { _type?: 'geopoint'; lat?: number; lng?: number };

const round = (n: number) => Math.round(n * 1e6) / 1e6;

export function createLocationInput(options: LocationInputOptions): ComponentType<ObjectInputProps<GeopointValue>> {
  function LocationInput(props: ObjectInputProps<GeopointValue>) {
    const { onChange, readOnly } = props;
    const value = props.value as Geopoint | undefined;
    const hasValue = typeof value?.lat === 'number' && typeof value?.lng === 'number';

    const container = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const libRef = useRef<typeof import('maplibre-gl') | null>(null);
    const readOnlyRef = useRef(readOnly);
    readOnlyRef.current = readOnly;
    const [ready, setReady] = useState(false);

    const write = useCallback(
      (lat: number, lng: number) => onChange(set({ _type: 'geopoint', lat: round(lat), lng: round(lng) })),
      [onChange],
    );
    const writeRef = useRef(write);
    writeRef.current = write;

    // Map, created once.
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const [lib] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css' as string)]);
        if (cancelled || !container.current) return;
        libRef.current = lib;
        const start = hasValue ? ([value!.lng!, value!.lat!] as [number, number]) : options.defaultCenter;
        const map = new lib.Map({
          container: container.current,
          style: options.mapStyle,
          center: start,
          zoom: hasValue ? 15 : options.defaultZoom,
          attributionControl: { compact: true },
        });
        map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
        map.on('click', (e) => {
          if (!readOnlyRef.current) writeRef.current(e.lngLat.lat, e.lngLat.lng);
        });
        mapRef.current = map;
        setReady(true);
      })();
      return () => {
        cancelled = true;
        mapRef.current?.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Marker follows the value (also when it changes from elsewhere, e.g. another editor).
    useEffect(() => {
      const map = mapRef.current;
      const lib = libRef.current;
      if (!ready || !map || !lib) return;
      if (!hasValue) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }
      const lngLat: [number, number] = [value!.lng!, value!.lat!];
      if (!markerRef.current) {
        const marker = new lib.Marker({ color: options.markerColor, draggable: !readOnly }).setLngLat(lngLat).addTo(map);
        marker.on('dragend', () => {
          const p = marker.getLngLat();
          writeRef.current(p.lat, p.lng);
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat(lngLat);
        markerRef.current.setDraggable(!readOnly);
      }
      if (!map.getBounds().contains(lngLat)) map.easeTo({ center: lngLat, duration: 400 });
    }, [ready, hasValue, value?.lat, value?.lng, readOnly]);

    // Address search
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GeoResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const q = query.trim();
      setError(null);
      if (q.length < 3 || !options.geocoder) {
        setResults([]);
        return;
      }
      const direct = coordinatesFromQuery(q);
      if (direct) {
        setResults([direct]);
        return;
      }
      const controller = new AbortController();
      // Debounce keeps us well inside Nominatim's one-request-per-second rule.
      const timer = setTimeout(async () => {
        setSearching(true);
        try {
          setResults(await options.geocoder!(q, controller.signal));
        } catch (e) {
          if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      }, 600);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }, [query]);

    const pick = (result: GeoResult) => {
      write(result.lat, result.lng);
      mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: 16, duration: 700 });
      setQuery('');
      setResults([]);
    };

    return (
      <Stack gap={2}>
        {options.geocoder && !readOnly ? (
          <Stack gap={1}>
            <TextInput
              icon={<Icon symbol="search" />}
              iconRight={searching ? <Spinner muted /> : undefined}
              placeholder="Search an address or paste “lat, lng”"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) {
                  e.preventDefault();
                  pick(results[0]);
                }
              }}
            />
            {results.length ? (
              <Card radius={2} shadow={1} padding={1}>
                <Stack gap={1}>
                  {results.map((r) => (
                    <Button key={`${r.lat},${r.lng},${r.label}`} mode="bleed" justify="flex-start" text={r.label} onClick={() => pick(r)} />
                  ))}
                </Stack>
              </Card>
            ) : null}
            {error ? (
              <Text size={1} muted>
                {error}
              </Text>
            ) : null}
          </Stack>
        ) : null}

        <Card radius={2} border overflow="hidden" style={{ position: 'relative' }}>
          <div ref={container} style={{ height: 300, cursor: readOnly ? 'default' : 'crosshair' }} />
          {!ready ? (
            <Flex align="center" justify="center" style={{ position: 'absolute', inset: 0 }}>
              <Spinner muted />
            </Flex>
          ) : null}
        </Card>

        <Flex align="center" gap={2}>
          <Box flex={1}>
            <Text size={1} muted>
              {hasValue ? `${value!.lat}, ${value!.lng}` : readOnly ? 'No location' : 'Click the map to place the pin.'}
            </Text>
          </Box>
          {hasValue && !readOnly ? <Button mode="bleed" tone="critical" icon={<Icon symbol="trash" />} text="Remove" onClick={() => onChange(unset())} /> : null}
        </Flex>
        {options.geocoder ? (
          <Text size={0} muted>
            Search © OpenStreetMap contributors
          </Text>
        ) : null}
      </Stack>
    );
  }
  return LocationInput;
}
