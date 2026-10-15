import { Crosshair, Route, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { t } from '../../i18n';
import { store, useAppState } from '../../runtime/state/store';
import {
  applyRoute,
  hasRoute,
  parseRouteFile,
  removeRoute,
  routeBounds,
  routeConfigOf,
  routeDataOf,
  sampleRoute,
  type FeatureCollection,
  type RouteConfig,
  type RouteDash,
} from '../../runtime/style/route';
import { KEY as TOOLTIP_KEY, normalize as normalizeTooltips } from '../../runtime/tooltips';
import { ColorControl } from '../../ui/controls/color-control';
import { Field, SegmentedControl, SliderControl, SwitchControl } from '../../ui/controls/controls';
import { Button } from '../../ui/primitives/button';
import { EmptyState, PanelBody, PanelSection } from '../../ui/panel/panel';
import { withRouteTooltips } from '../templates';
import { fitToRoute } from './templates-panel';

const DASH_OPTIONS: Array<{ value: RouteDash; label: string }> = [
  { value: 'solid', label: 'Linie' },
  { value: 'dashed', label: 'Strich' },
  { value: 'dotted', label: 'Gepunktet' },
];

function setRouteData(fc: FeatureCollection) {
  store.edit((s) => withRouteTooltips(applyRoute(s, routeConfigOf(s), fc)));
  fitToRoute(routeBounds(fc));
}

export function RoutePanel() {
  const style = useAppState((s) => s.style);
  const fileRef = useRef<HTMLInputElement>(null);
  const present = hasRoute(style);
  const cfg = useMemo(() => routeConfigOf(style), [style]);
  const data = useMemo(() => (present ? routeDataOf(style) : null), [present, style]);

  const set = <K extends keyof RouteConfig>(key: K) => (value: RouteConfig[K], live = false) =>
    store.edit((s) => applyRoute(s, { ...routeConfigOf(s), [key]: value }), live);

  const importInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".gpx,.geojson,.json,application/geo+json,application/gpx+xml"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        file
          .text()
          .then((text) => {
            setRouteData(parseRouteFile(text, file.name));
            toast.success(t('„{name}“ geladen', { name: file.name }));
          })
          .catch((err: Error) => toast.error(t('Route konnte nicht gelesen werden: {message}', { message: err.message })));
      }}
    />
  );

  if (!present) {
    return (
      <PanelBody className="flex flex-col">
        <EmptyState icon={<Route />} title={t('Noch keine Route')}>
          {t('Füg eine Beispielroute hinzu oder lade eine eigene GPX- oder GeoJSON-Datei.')}
        </EmptyState>
        <div className="flex justify-center gap-1.5 pb-8">
          <Button onClick={() => setRouteData(sampleRoute())}>
            <Route /> {t('Beispielroute')}
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload /> {t('Importieren')}
          </Button>
        </div>
        {importInput}
      </PanelBody>
    );
  }

  const line = data?.features.find((f) => f.geometry.type !== 'Point');
  const points = data?.features.filter((f) => f.geometry.type === 'Point').length ?? 0;

  return (
    <PanelBody>
      <PanelSection title={t('Daten')} description={t('Die Route steckt mit in der style.json. Ihre Ebenen findest du auch unter Ebenen → Routen & Overlays.')}>
        <div className="rounded-lg bg-ink/[0.03] p-2.5">
          <p className="truncate text-xs font-medium">{String(line?.properties.name ?? t('Route'))}</p>
          <p className="text-[10px] text-subtle">
            {line?.properties.distance_km !== undefined ? `${line.properties.distance_km} km · ` : ''}
            {t('{n} Punkte', { n: points })}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload /> GPX / GeoJSON
          </Button>
          <Button size="sm" onClick={() => data && fitToRoute(routeBounds(data))}>
            <Crosshair /> {t('Zur Route')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hover:text-destructive"
            onClick={() =>
              store.edit((s) => {
                const next = removeRoute(s);
                const tooltips = normalizeTooltips(next.metadata?.[TOOLTIP_KEY]);
                delete tooltips.layers['route-line'];
                delete tooltips.layers['route-points'];
                return { ...next, metadata: { ...(next.metadata ?? {}), [TOOLTIP_KEY]: tooltips } };
              })
            }
          >
            <Trash2 /> {t('Entfernen')}
          </Button>
        </div>
        {importInput}
      </PanelSection>

      <PanelSection title={t('Linie')}>
        <Field label={t('Farbe')}>
          <ColorControl value={cfg.color} label={t('Linienfarbe')} onChange={set('color')} />
        </Field>
        <Field label={t('Breite')}>
          <SliderControl value={cfg.width} min={1} max={14} step={0.5} unit="px" label={t('Linienbreite')} onChange={set('width')} />
        </Field>
        <Field label={t('Deckkraft')}>
          <SliderControl value={cfg.opacity} min={0.1} max={1} step={0.05} label={t('Deckkraft')} onChange={set('opacity')} />
        </Field>
        <Field label={t('Stil')}>
          <SegmentedControl value={cfg.dash} options={DASH_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(v) => set('dash')(v)} />
        </Field>
        <SwitchControl label={t('Richtungspfeile')} checked={cfg.arrows} onChange={(v) => set('arrows')(v)} />
      </PanelSection>

      <PanelSection title={t('Umrandung')}>
        <Field label={t('Farbe')}>
          <ColorControl value={cfg.casingColor} label={t('Umrandungsfarbe')} onChange={set('casingColor')} />
        </Field>
        <Field label={t('Breite')}>
          <SliderControl value={cfg.casingWidth} min={0} max={6} step={0.5} unit="px" label={t('Umrandungsbreite')} onChange={set('casingWidth')} />
        </Field>
      </PanelSection>

      <PanelSection title={t('Punkte & Beschriftung')}>
        <Field label={t('Füllung')}>
          <ColorControl value={cfg.pointColor} label={t('Punktfarbe')} onChange={set('pointColor')} />
        </Field>
        <Field label={t('Rand')}>
          <ColorControl value={cfg.pointStroke} label={t('Punktrand')} onChange={set('pointStroke')} />
        </Field>
        <Field label={t('Größe')}>
          <SliderControl value={cfg.pointRadius} min={2} max={14} step={0.5} unit="px" label={t('Punktgröße')} onChange={set('pointRadius')} />
        </Field>
        <SwitchControl label={t('Namen anzeigen')} checked={cfg.labels} onChange={(v) => set('labels')(v)} />
        <Field label={t('Textfarbe')}>
          <ColorControl value={cfg.labelColor} label={t('Textfarbe')} onChange={set('labelColor')} />
        </Field>
        <Field label={t('Textumrandung')}>
          <ColorControl value={cfg.labelHalo} label={t('Textumrandung')} onChange={set('labelHalo')} />
        </Field>
      </PanelSection>
    </PanelBody>
  );
}
