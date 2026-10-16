'use client';

// <StyledMap>: a Map Styler map for React, Next.js and Sanity frontends.
// MapLibre is loaded in the browser only, so the component is safe to render
// on the server (it outputs an empty container there). Import the MapLibre
// stylesheet once in your app: import 'maplibre-gl/dist/maplibre-gl.css'.

import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { Pin, PinsHandle } from '../runtime/pins';
import type { TooltipHandle } from '../runtime/tooltips';
import { pinsToGeoJSON, type PinFields, type PinInput } from './normalize';

export type StyledMapProps = {
  /** Style URL or a style.json object (e.g. exported from the editor). */
  mapStyle: string | object;
  /** Documents with a position: { lat, lng }, a Sanity geopoint under "location", … */
  pins?: PinInput[];
  /** Field names, when they differ from the defaults. */
  fields?: PinFields;
  /** Show only pins of this category. */
  filter?: string | null;
  /** Fly to this pin and open its tooltip. */
  selectedId?: string | null;
  onSelect?: (pin: Pin) => void;
  /** Tooltip template for pins, e.g. "<strong>{name}</strong>\n{address}". */
  template?: string;
  colors?: Record<string, string>;
  palette?: string[];
  cluster?: boolean;
  clusterColor?: string;
  /** Zoom to the pins on first load (default true when there are pins). */
  fit?: boolean;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  /** Called once the map exists, e.g. to add controls. */
  onLoad?: (map: MapLibreMap) => void;
  className?: string;
  style?: CSSProperties;
  /** Accessible name of the map region. */
  label?: string;
};

export function StyledMap({
  mapStyle,
  pins,
  fields,
  filter = null,
  selectedId = null,
  onSelect,
  template,
  colors,
  palette,
  cluster,
  clusterColor,
  fit,
  center,
  zoom,
  pitch,
  bearing,
  onLoad,
  className,
  style,
  label = 'Map',
}: StyledMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pinsRef = useRef<PinsHandle | null>(null);
  // Latest callbacks without re-creating the map.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  const data = useMemo(() => pinsToGeoJSON(pins, fields), [pins, fields]);
  const latest = useRef({ data, filter, selectedId });
  latest.current = { data, filter, selectedId };

  // Create the map once; later prop changes are applied by the effects below.
  useEffect(() => {
    let cancelled = false;
    let tooltips: TooltipHandle | null = null;
    (async () => {
      const [{ default: maplibregl }, { attach }] = await Promise.all([import('maplibre-gl'), import('../runtime/tooltips')]);
      if (cancelled || !container.current) return;
      const map = new maplibregl.Map({
        container: container.current,
        style: mapStyle as string | StyleSpecification,
        center: center ?? [0, 20],
        zoom: zoom ?? 1.5,
        pitch: pitch ?? 0,
        bearing: bearing ?? 0,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      tooltips = attach(map, { maplibregl });
      const hasPins = latest.current.data.features.length > 0;
      pinsRef.current = tooltips.pins({
        from: false,
        filters: false,
        filterList: false,
        data: latest.current.data,
        template,
        colors,
        palette,
        cluster,
        clusterColor,
        fit: fit ?? (hasPins && !center),
        onSelect: (pin) => onSelectRef.current?.(pin),
      });
      if (latest.current.filter) pinsRef.current.setFilter(latest.current.filter);
      // Selected before the map existed: runs once the pins are loaded.
      if (latest.current.selectedId) pinsRef.current.focus(latest.current.selectedId);
      onLoadRef.current?.(map);
    })();
    return () => {
      cancelled = true;
      tooltips?.destroy();
      mapRef.current?.remove();
      mapRef.current = null;
      pinsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Style changes swap the style; pins re-add themselves on "styledata".
  const firstStyle = useRef(true);
  useEffect(() => {
    if (firstStyle.current) {
      firstStyle.current = false;
      return;
    }
    mapRef.current?.setStyle(mapStyle as string | StyleSpecification);
  }, [mapStyle]);

  useEffect(() => {
    void pinsRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    pinsRef.current?.setFilter(filter);
  }, [filter]);

  useEffect(() => {
    if (selectedId) pinsRef.current?.focus(selectedId);
  }, [selectedId]);

  return <div ref={container} role="region" aria-label={label} className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }} />;
}
