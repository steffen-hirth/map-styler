// The canvas of the tool: a full-bleed MapLibre map that mirrors the store.

import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { t } from '../../i18n';
import { toast } from 'sonner';
import { store, tooltipConfigOf, type InspectedFeature } from '../state/store';
import type { Style } from '../style/types';
import { attach } from '../tooltips';
import { applyFastSync } from './fast-sync';
import { mapHolder } from './map-holder';

const IGNORED_ERRORS = /Failed to fetch|AbortError|NetworkError|Load failed/i;

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const initial = store.getState().style;

    const map = new maplibregl.Map({
      container,
      style: structuredClone(initial) as StyleSpecification,
      center: store.view.center,
      zoom: store.view.zoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    mapHolder.set(map);

    const tooltips = attach(map, { config: tooltipConfigOf(initial), maplibregl });

    let synced: Style = initial;
    let fullSyncQueued = false;
    const fullSync = () => {
      if (fullSyncQueued) return;
      fullSyncQueued = true;
      requestAnimationFrame(() => {
        fullSyncQueued = false;
        map.setStyle(structuredClone(store.getState().style) as StyleSpecification, { diff: true });
      });
    };

    let inspecting = false;
    const unsubscribe = store.subscribe(() => {
      const { style, inspect } = store.getState();
      if (inspect !== inspecting) {
        inspecting = inspect;
        tooltips.setEnabled(!inspect);
        map.getCanvas().style.cursor = inspect ? 'crosshair' : '';
      }
      if (style === synced) return;
      const before = synced;
      synced = style;
      if (before.metadata !== style.metadata) tooltips.update(tooltipConfigOf(style));
      if (fullSyncQueued || !applyFastSync(map, before, style)) fullSync();
    });

    const onMoveEnd = () => {
      const c = map.getCenter();
      store.setView({ center: [Number(c.lng.toFixed(5)), Number(c.lat.toFixed(5))], zoom: Number(map.getZoom().toFixed(2)) });
    };

    const onClick = (e: maplibregl.MapMouseEvent) => {
      if (!store.getState().inspect) return;
      const pad = 5;
      const features = map.queryRenderedFeatures([
        [e.point.x - pad, e.point.y - pad],
        [e.point.x + pad, e.point.y + pad],
      ]);
      const seen = new Set<string>();
      const inspected: InspectedFeature[] = [];
      for (const f of features) {
        if (seen.has(f.layer.id)) continue;
        seen.add(f.layer.id);
        inspected.push({ layerId: f.layer.id, sourceLayer: f.sourceLayer, properties: { ...(f.properties ?? {}) } });
      }
      store.setUi({ inspected });
    };

    let lastError = '';
    const onError = (e: { error?: Error }) => {
      const message = e.error?.message ?? t('Unbekannter Kartenfehler');
      if (IGNORED_ERRORS.test(message) || message === lastError) return;
      lastError = message;
      toast.error(message);
      setTimeout(() => {
        if (lastError === message) lastError = '';
      }, 4000);
    };

    map.on('moveend', onMoveEnd);
    map.on('click', onClick);
    map.on('error', onError);

    return () => {
      unsubscribe();
      tooltips.destroy();
      mapHolder.set(null);
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-label={t('Kartenvorschau')} />;
}
