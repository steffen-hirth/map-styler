import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  Bike,
  Camera,
  Car,
  Coffee,
  Crosshair,
  Footprints,
  House,
  Info,
  Loader2,
  MapPin,
  MapPinPlus,
  Mountain,
  Route,
  ShoppingBag,
  Spline,
  SquareParking,
  Star,
  TrainFront,
  Trash2,
  Upload,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { t } from '../../i18n';
import { usesRoutingService } from '../../runtime/routing';
import { store, useAppState } from '../../runtime/state/store';
import {
  applyRoute,
  hasRoute,
  parseRouteFile,
  pinTypeLabel,
  removeRoute,
  routeConfigOf,
  routeDataOf,
  sampleRoute,
  type RouteConfig,
  type RouteDash,
  type RouteMode,
} from '../../runtime/style/route';
import { isStop, moveStop, readRoute, removePoint, updatePoint, writeRoute, type RoutePoint } from '../../runtime/style/route-edit';
import { KEY as TOOLTIP_KEY, normalize as normalizeTooltips } from '../../runtime/tooltips';
import { PIN_TYPES, type PinType } from '../../runtime/tooltips/pin-icons';
import { ColorControl } from '../../ui/controls/color-control';
import { CommitInput, Field, SegmentedControl, SliderControl, SwitchControl } from '../../ui/controls/controls';
import { cn } from '../../ui/lib/utils';
import { Button, IconButton } from '../../ui/primitives/button';
import { NativeSelect } from '../../ui/primitives/input';
import { EmptyState, PanelBody, PanelSection } from '../../ui/panel/panel';
import { fitPoints, renameRoute, setRouteMode, setRoutePoints, useRouteMapTools, useRoutingStatus } from '../route-tools';
import { withRouteTooltips } from '../templates';

export const PIN_ICONS: Record<PinType, LucideIcon> = {
  pin: MapPin,
  star: Star,
  cafe: Coffee,
  food: Utensils,
  parking: SquareParking,
  view: Mountain,
  train: TrainFront,
  info: Info,
  shop: ShoppingBag,
  home: House,
  photo: Camera,
  hotel: BedDouble,
};

const MODES: Array<{ value: RouteMode; label: string; icon: LucideIcon }> = [
  { value: 'foot', label: 'Zu Fuß', icon: Footprints },
  { value: 'bike', label: 'Fahrrad', icon: Bike },
  { value: 'car', label: 'Auto', icon: Car },
  { value: 'train', label: 'Zug', icon: TrainFront },
  { value: 'line', label: 'Luftlinie', icon: Spline },
];

const MODE_HINTS: Record<RouteMode, string> = {
  foot: 'Folgt Fußwegen und Straßen (OpenStreetMap, Routing von FOSSGIS).',
  bike: 'Folgt Radwegen und Straßen (OpenStreetMap, Routing von FOSSGIS).',
  car: 'Folgt Straßen für Autos (OpenStreetMap, Routing von FOSSGIS).',
  train: 'Stopps rasten am nächsten Bahnhof ein. Die Strecke dazwischen ist vereinfacht.',
  line: 'Direkte Linie zwischen den Stopps, ohne Routing.',
};

const DASH_OPTIONS: Array<{ value: RouteDash; label: string }> = [
  { value: 'solid', label: 'Linie' },
  { value: 'dashed', label: 'Strich' },
  { value: 'dotted', label: 'Gepunktet' },
];

function startEmptyRoute() {
  store.edit((s) => withRouteTooltips(applyRoute(s, routeConfigOf(s), writeRoute([], null))));
}

export function RoutePanel({ simple = false }: { simple?: boolean }) {
  const style = useAppState((s) => s.style);
  const tool = useAppState((s) => s.mapTool);
  const pinType = useAppState((s) => s.pinType);
  const routing = useRoutingStatus();
  const fileRef = useRef<HTMLInputElement>(null);
  const present = hasRoute(style);
  const cfg = useMemo(() => routeConfigOf(style), [style]);
  const { points, line } = useMemo(() => readRoute(routeDataOf(style)), [style]);
  const stops = points.filter(isStop);
  const pins = points.filter((p) => !isStop(p));

  useRouteMapTools(present);
  // Leaving the panel ends any active tool.
  useEffect(() => () => store.setUi({ mapTool: null }), []);

  const set = <K extends keyof RouteConfig>(key: K) => (value: RouteConfig[K], live = false) =>
    store.edit((s) => applyRoute(s, { ...routeConfigOf(s), [key]: value }), live);
  const toggleTool = (next: 'stop' | 'pin') => store.setUi({ mapTool: tool === next ? null : next });

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
            const data = parseRouteFile(text, file.name);
            store.edit((s) => withRouteTooltips(applyRoute(s, routeConfigOf(s), data)));
            const imported = readRoute(data);
            fitPoints(imported.points, imported.line);
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
          {t('Zeichne eine Route direkt auf der Karte, nimm die Beispielroute oder lade eine GPX- oder GeoJSON-Datei.')}
        </EmptyState>
        <div className="flex flex-col items-center gap-1.5 pb-8">
          <Button
            variant="primary"
            onClick={() => {
              startEmptyRoute();
              store.setUi({ mapTool: 'stop' });
            }}
          >
            <MapPinPlus /> {t('Route zeichnen')}
          </Button>
          <div className="flex gap-1.5">
            <Button
              onClick={() => {
                const data = sampleRoute();
                store.edit((s) => withRouteTooltips(applyRoute(s, routeConfigOf(s), data)));
                const sample = readRoute(data);
                fitPoints(sample.points, sample.line);
              }}
            >
              <Route /> {t('Beispielroute')}
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload /> {t('Importieren')}
            </Button>
          </div>
        </div>
        {importInput}
      </PanelBody>
    );
  }

  return (
    <PanelBody>
      <PanelSection title={t('Route planen')} collapsible={false}>
        <Field label={t('Unterwegs')}>
          <SegmentedControl
            value={cfg.mode}
            options={MODES.map((m) => ({ value: m.value, label: <m.icon />, title: t(m.label) }))}
            onChange={(mode) => setRouteMode(mode)}
          />
          <p className="m-0 text-[10px] leading-relaxed text-subtle">
            <span className="font-medium text-muted">{t(MODES.find((m) => m.value === cfg.mode)!.label)}</span> · {t(MODE_HINTS[cfg.mode])}
          </p>
        </Field>

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <Button className="flex-1" active={tool === 'stop'} variant={tool === 'stop' ? 'primary' : 'secondary'} onClick={() => toggleTool('stop')}>
              <MapPinPlus /> {t('Stopp setzen')}
            </Button>
            <Button className="flex-1" active={tool === 'pin'} variant={tool === 'pin' ? 'primary' : 'secondary'} onClick={() => toggleTool('pin')}>
              <MapPin /> {t('Pin setzen')}
            </Button>
          </div>
          {tool === 'pin' ? <PinTypePicker value={pinType} onChange={(type) => store.setUi({ pinType: type })} /> : null}
          {tool ? (
            <p className="m-0 rounded-md bg-accent/10 px-2.5 py-2 text-[11px] leading-relaxed text-accent">
              {tool === 'stop' ? t('Klicke in die Karte, um Stopps anzuhängen.') : t('Klicke in die Karte, um den Pin zu setzen.')}{' '}
              {t('Esc beendet. Punkte lassen sich auf der Karte ziehen.')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 rounded-lg bg-well p-2.5 ring-1 ring-ink/[0.05] ring-inset">
          <CommitInput
            value={line?.name ?? ''}
            placeholder={t('Name der Route')}
            label={t('Name der Route')}
            className="h-7 border-transparent bg-transparent px-1 font-medium hover:border-ink/[0.1]"
            onCommit={(name) => renameRoute(name.trim())}
          />
          <p className="m-0 flex items-center gap-1.5 px-1 text-[11px] text-muted">
            {routing === 'busy' ? (
              <>
                <Loader2 className="size-3 animate-spin" /> {t('Berechne Route …')}
              </>
            ) : stops.length < 2 ? (
              t('Setze mindestens zwei Stopps.')
            ) : (
              [line?.distanceKm !== undefined ? `${line.distanceKm.toLocaleString()} km` : null, line?.durationMin ? durationText(line.durationMin) : null]
                .filter(Boolean)
                .join(' · ')
            )}
          </p>
        </div>

        {stops.length ? (
          <PointList title={t('Stopps')}>
            {stops.map((p, i) => (
              <StopRow key={p.id} point={p} index={i} count={stops.length} points={points} />
            ))}
          </PointList>
        ) : null}

        {pins.length ? (
          <PointList title={t('Pins')}>
            {pins.map((p) => (
              <PinRow key={p.id} point={p} points={points} />
            ))}
          </PointList>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload /> {t('GPX / GeoJSON')}
          </Button>
          <Button size="sm" onClick={() => fitPoints(points, line)}>
            <Crosshair /> {t('Zur Route')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hover:text-destructive"
            onClick={() => {
              store.setUi({ mapTool: null });
              store.edit((s) => {
                const next = removeRoute(s);
                const tooltips = normalizeTooltips(next.metadata?.[TOOLTIP_KEY]);
                delete tooltips.layers['route-line'];
                delete tooltips.layers['route-points'];
                return { ...next, metadata: { ...(next.metadata ?? {}), [TOOLTIP_KEY]: tooltips } };
              });
            }}
          >
            <Trash2 /> {t('Entfernen')}
          </Button>
        </div>
        {importInput}
      </PanelSection>

      {simple ? (
        <PanelSection title={t('Aussehen')}>
          <Field label={t('Linienfarbe')}>
            <ColorControl value={cfg.color} label={t('Linienfarbe')} onChange={set('color')} />
          </Field>
          <Field label={t('Breite')}>
            <SliderControl value={cfg.width} min={1} max={14} step={0.5} unit="px" label={t('Linienbreite')} onChange={set('width')} />
          </Field>
          <Field label={t('Stil')}>
            <SegmentedControl value={cfg.dash} options={DASH_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(v) => set('dash')(v)} />
          </Field>
          <Field label={t('Pin-Farbe')}>
            <ColorControl value={cfg.pinColor} label={t('Pin-Farbe')} onChange={set('pinColor')} />
          </Field>
        </PanelSection>
      ) : (
        <>
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

          <PanelSection title={t('Stopps')}>
            <Field label={t('Füllung')}>
              <ColorControl value={cfg.pointColor} label={t('Punktfarbe')} onChange={set('pointColor')} />
            </Field>
            <Field label={t('Rand')}>
              <ColorControl value={cfg.pointStroke} label={t('Punktrand')} onChange={set('pointStroke')} />
            </Field>
            <Field label={t('Größe')}>
              <SliderControl value={cfg.pointRadius} min={2} max={14} step={0.5} unit="px" label={t('Punktgröße')} onChange={set('pointRadius')} />
            </Field>
          </PanelSection>

          <PanelSection title={t('Pins & Beschriftung')}>
            <Field label={t('Pin-Farbe')}>
              <ColorControl value={cfg.pinColor} label={t('Pin-Farbe')} onChange={set('pinColor')} />
            </Field>
            <Field label={t('Pin-Darstellung')}>
              <SegmentedControl
                value={cfg.pinStyle}
                options={[
                  { value: 'icon', label: t('Mit Icon') },
                  { value: 'dot', label: t('Punkt') },
                ]}
                onChange={(v) => set('pinStyle')(v)}
              />
            </Field>
            <SwitchControl label={t('Namen anzeigen')} checked={cfg.labels} onChange={(v) => set('labels')(v)} />
            <Field label={t('Textfarbe')}>
              <ColorControl value={cfg.labelColor} label={t('Textfarbe')} onChange={set('labelColor')} />
            </Field>
            <Field label={t('Textumrandung')}>
              <ColorControl value={cfg.labelHalo} label={t('Textumrandung')} onChange={set('labelHalo')} />
            </Field>
          </PanelSection>
        </>
      )}
    </PanelBody>
  );
}

function durationText(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

function PointList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xs text-muted">{title}</span>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">{children}</ul>
    </div>
  );
}

function StopRow({ point, index, count, points }: { point: RoutePoint; index: number; count: number; points: RoutePoint[] }) {
  const badge = point.kind === 'start' ? 'S' : point.kind === 'end' ? t('Z') : String(index);
  return (
    <li className="group flex items-center gap-1.5">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
          point.kind === 'waypoint' ? 'bg-well text-muted ring-1 ring-ink/[0.08]' : 'bg-primary text-white',
        )}
        title={point.kind}
      >
        {badge}
      </span>
      <CommitInput
        value={point.name}
        label={t('Name')}
        className="h-7"
        onCommit={(name) => void setRoutePoints(updatePoint(points, point.id, { name }), { recompute: false })}
      />
      <div className="flex shrink-0 opacity-60 group-hover:opacity-100">
        <IconButton size="sm" label={t('Nach oben')} disabled={index === 0} onClick={() => void setRoutePoints(moveStop(points, point.id, -1))}>
          <ArrowUp />
        </IconButton>
        <IconButton size="sm" label={t('Nach unten')} disabled={index === count - 1} onClick={() => void setRoutePoints(moveStop(points, point.id, 1))}>
          <ArrowDown />
        </IconButton>
        <IconButton size="sm" label={t('Entfernen')} className="hover:text-destructive" onClick={() => void setRoutePoints(removePoint(points, point.id))}>
          <X />
        </IconButton>
      </div>
    </li>
  );
}

function PinRow({ point, points }: { point: RoutePoint; points: RoutePoint[] }) {
  const Icon = PIN_ICONS[point.type];
  const update = (patch: Partial<RoutePoint>) => void setRoutePoints(updatePoint(points, point.id, patch), { recompute: false });
  return (
    <li className="flex flex-col gap-1 rounded-lg p-1.5 ring-1 ring-ink/[0.06] ring-inset">
      <div className="flex items-center gap-1.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white [&_svg]:size-3.5">
          <Icon />
        </span>
        <CommitInput value={point.name} label={t('Name')} className="h-7" onCommit={(name) => update({ name })} />
        <IconButton size="sm" label={t('Entfernen')} className="hover:text-destructive" onClick={() => void setRoutePoints(removePoint(points, point.id), { recompute: false })}>
          <X />
        </IconButton>
      </div>
      <div className="flex gap-1.5 pl-[30px]">
        <NativeSelect className="w-[112px] shrink-0" value={point.type} aria-label={t('Pin-Typ')} onChange={(e) => update({ type: e.target.value as PinType })}>
          {PIN_TYPES.map((type) => (
            <option key={type} value={type}>
              {pinTypeLabel(type)}
            </option>
          ))}
        </NativeSelect>
        <CommitInput value={point.url ?? ''} placeholder={t('URL (optional)')} label="URL" mono onCommit={(url) => update({ url: url.trim() || undefined })} />
      </div>
    </li>
  );
}

function PinTypePicker({ value, onChange }: { value: PinType; onChange: (type: PinType) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1" role="radiogroup" aria-label={t('Pin-Typ')}>
      {PIN_TYPES.map((type) => {
        const Icon = PIN_ICONS[type];
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            title={pinTypeLabel(type)}
            onClick={() => onChange(type)}
            className={cn(
              'flex h-8 items-center justify-center rounded-md text-muted ring-1 ring-ink/[0.08] transition-colors ring-inset hover:text-foreground [&_svg]:size-4',
              active && 'bg-primary text-white ring-primary hover:text-white',
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

export { usesRoutingService };
