import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, MousePointerClick, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { sampleFields, useMapValue } from '../../runtime/map/map-holder';
import { store, useAppState } from '../../runtime/state/store';
import { t } from '../../i18n';
import { groupLabel, groupOf, PROPS, type PropSpec } from '../../runtime/style/spec';
import { isVisible } from '../../runtime/style/style-utils';
import type { Layer, PropKind } from '../../runtime/style/types';
import { KEY as TOOLTIP_KEY, normalize as normalizeTooltips } from '../../runtime/tooltips';
import { CodeTextarea, CommitInput, SliderControl, SwitchControl } from '../../ui/controls/controls';
import { cn } from '../../ui/lib/utils';
import { Button, IconButton } from '../../ui/primitives/button';
import { Textarea } from '../../ui/primitives/input';
import { EmptyState, Panel, PanelBody, PanelHeader, PanelSection } from '../../ui/panel/panel';
import { defaultTemplate } from '../app-schema';
import { LayerSwatch, prettyJSON, PropertyRow } from '../property-control';

export function PropertiesPanel({ className }: { className?: string }) {
  const layer = useAppState((s) => (s.selectedId ? (s.style.layers.find((l) => l.id === s.selectedId) ?? null) : null));

  if (!layer) {
    return (
      <Panel className={className}>
        <PanelHeader title={t('Eigenschaften')} />
        <EmptyState icon={<MousePointerClick />} title={t('Keine Ebene ausgewählt')}>
          {t('Wähle links eine Ebene oder klick mit dem Inspektor direkt auf die Karte.')}
        </EmptyState>
      </Panel>
    );
  }

  const specs = PROPS[layer.type] ?? { paint: {}, layout: {} };
  return (
    <Panel className={className}>
      <LayerHeader layer={layer} />
      <PanelBody key={layer.id}>
        <PanelSection title={t('Darstellung')}>
          <PropGroup layer={layer} kind="paint" specs={specs.paint} />
        </PanelSection>
        {Object.keys(specs.layout).length || layer.layout ? (
          <PanelSection title={t('Layout')}>
            <PropGroup layer={layer} kind="layout" specs={specs.layout} />
          </PanelSection>
        ) : null}
        {layer.type !== 'background' ? <TooltipSection layer={layer} /> : null}
        <PanelSection title={t('Zoombereich')} defaultCollapsed>
          <ZoomRange layer={layer} />
        </PanelSection>
        {layer.type !== 'background' ? (
          <PanelSection title={t('Filter')} defaultCollapsed description={t('MapLibre-Filterausdruck, z. B. ["==", ["get", "class"], "park"].')}>
            <FilterEditor layer={layer} />
          </PanelSection>
        ) : null}
        <PanelSection title={t('JSON der Ebene')} defaultCollapsed>
          <RawLayerEditor layer={layer} />
        </PanelSection>
      </PanelBody>
    </Panel>
  );
}

function LayerHeader({ layer }: { layer: Layer }) {
  const shown = isVisible(layer);
  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-ink/[0.06] px-3 pt-2.5 pb-3">
      <div className="flex items-center gap-2">
        <LayerSwatch layer={layer} />
        <CommitInput
          value={layer.id}
          label={t('Ebenen-ID')}
          className="h-7 border-transparent bg-transparent px-1 text-xs-plus font-medium hover:border-ink/[0.1]"
          onCommit={(next) => {
            const id = next.trim();
            if (id === layer.id) return;
            if (!store.renameLayer(layer.id, id)) {
              toast.error(id ? t('Die ID „{id}“ gibt es schon.', { id }) : t('Die ID darf nicht leer sein.'));
              return false;
            }
          }}
        />
        <IconButton label={t('Auswahl aufheben')} onClick={() => store.setUi({ selectedId: null })}>
          <X />
        </IconButton>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1 text-[10px]">
          <span className="rounded bg-ink/[0.08] px-1.5 py-0.5 font-medium">{layer.type}</span>
          {layer['source-layer'] ? <span className="truncate rounded bg-ink/[0.04] px-1.5 py-0.5 text-muted">{layer['source-layer']}</span> : null}
          <span className="truncate text-subtle">{groupLabel(groupOf(layer))}</span>
        </div>
        <div className="flex shrink-0 items-center">
          <IconButton size="sm" label={shown ? t('Ausblenden') : t('Einblenden')} onClick={() => store.setVisibility([layer.id], !shown)}>
            {shown ? <Eye /> : <EyeOff />}
          </IconButton>
          <IconButton size="sm" label={t('Eine Ebene höher')} onClick={() => store.moveLayer(layer.id, 1)}>
            <ArrowUp />
          </IconButton>
          <IconButton size="sm" label={t('Eine Ebene tiefer')} onClick={() => store.moveLayer(layer.id, -1)}>
            <ArrowDown />
          </IconButton>
          <IconButton size="sm" label={t('Duplizieren')} onClick={() => store.duplicateLayer(layer.id)}>
            <Copy />
          </IconButton>
          <IconButton
            size="sm"
            label={t('Löschen')}
            className="hover:text-destructive"
            onClick={() => {
              store.deleteLayer(layer.id);
              toast(t('„{id}“ gelöscht', { id: layer.id }), { action: { label: t('Rückgängig'), onClick: () => store.undo() } });
            }}
          >
            <Trash2 />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function PropGroup({ layer, kind, specs }: { layer: Layer; kind: PropKind; specs: Record<string, PropSpec> }) {
  const [showAll, setShowAll] = useState(false);
  const bag = layer[kind] ?? {};
  const names = [...new Set([...Object.keys(specs), ...Object.keys(bag)])].filter((n) => n !== 'visibility');
  const setNames = names.filter((n) => bag[n] !== undefined);
  const unsetNames = names.filter((n) => bag[n] === undefined);
  return (
    <>
      {setNames.map((name) => (
        <PropertyRow key={name} layer={layer} kind={kind} name={name} spec={specs[name]} />
      ))}
      {!setNames.length && !showAll ? <p className="text-2xs text-subtle">{t('Alles auf Standardwerten.')}</p> : null}
      {showAll ? unsetNames.map((name) => <PropertyRow key={name} layer={layer} kind={kind} name={name} spec={specs[name]} />) : null}
      {unsetNames.length ? (
        <Button size="sm" variant="ghost" className="self-start" onClick={() => setShowAll((v) => !v)}>
          {showAll ? t('Weniger anzeigen') : t('Weitere Eigenschaften ({n})', { n: unsetNames.length })}
        </Button>
      ) : null}
    </>
  );
}

function TooltipSection({ layer }: { layer: Layer }) {
  const meta = useAppState((s) => s.style.metadata?.[TOOLTIP_KEY]);
  const entry = useMemo(() => normalizeTooltips(meta).layers[layer.id], [meta, layer.id]);
  const fields = useMapValue('idle', (map) => sampleFields(map, layer), [] as Array<[string, unknown]>, [layer.id]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(entry?.template ?? '');

  useEffect(() => {
    if (document.activeElement !== ref.current) setDraft(entry?.template ?? '');
  }, [entry?.template]);

  const write = (patch: { enabled?: boolean; template?: string }, live = false) =>
    store.editTooltips(
      (c) => ({
        ...c,
        layers: {
          ...c.layers,
          [layer.id]: {
            enabled: patch.enabled ?? c.layers[layer.id]?.enabled ?? true,
            template: patch.template ?? c.layers[layer.id]?.template ?? defaultTemplate(),
          },
        },
      }),
      live,
    );

  const insert = (key: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}{${key}}${draft.slice(end)}`;
    setDraft(next);
    write({ template: next });
  };

  return (
    <PanelSection title={t('Tooltip')} defaultCollapsed={!entry}>
      <SwitchControl label={t('Tooltip für diese Ebene')} checked={Boolean(entry?.enabled)} onChange={(enabled) => write({ enabled })} />
      {entry ? (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-2xs text-muted">{t('Vorlage')}</span>
            <Textarea
              ref={ref}
              rows={3}
              value={draft}
              aria-label={t('Tooltip-Vorlage')}
              onChange={(e) => {
                setDraft(e.target.value);
                write({ template: e.target.value }, true);
              }}
              onBlur={() => store.commit()}
            />
            <p className="text-[10px] leading-relaxed text-subtle">
              {t('{feld} fügt einen Wert ein, {name:de|name} nimmt den ersten vorhandenen. Leere Zeilen fallen weg.')}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-2xs text-muted">{t('Felder in dieser Ansicht')}</span>
            {fields.length ? (
              <div className="flex flex-wrap gap-1">
                {fields.slice(0, 40).map(([key, example]) => (
                  <button
                    key={key}
                    type="button"
                    title={t('Beispiel: {value}', { value: String(example) })}
                    onClick={() => insert(key)}
                    className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted transition-colors hover:bg-accent/20 hover:text-foreground"
                  >
                    {key}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-subtle">{t('Zoom näher heran, damit Daten dieser Ebene geladen werden.')}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="self-start hover:text-destructive"
            onClick={() =>
              store.editTooltips((c) => {
                const layers = { ...c.layers };
                delete layers[layer.id];
                return { ...c, layers };
              })
            }
          >
            {t('Tooltip entfernen')}
          </Button>
        </>
      ) : null}
    </PanelSection>
  );
}

function ZoomRange({ layer }: { layer: Layer }) {
  const set = (key: 'minzoom' | 'maxzoom', value: number | undefined, live: boolean) =>
    store.updateLayer(
      layer.id,
      (l) => {
        const next = { ...l };
        if (value === undefined) delete next[key];
        else next[key] = value;
        return next;
      },
      live,
    );
  return (
    <>
      {(['minzoom', 'maxzoom'] as const).map((key) => (
        <div key={key} className={cn('flex flex-col gap-1.5', layer[key] === undefined && 'opacity-60 hover:opacity-100')}>
          <div className="flex h-5 items-center justify-between">
            <span className="text-2xs text-muted">{key === 'minzoom' ? t('Sichtbar ab Zoom') : t('Sichtbar bis Zoom')}</span>
            {layer[key] !== undefined ? (
              <Button size="sm" variant="ghost" onClick={() => set(key, undefined, false)}>
                {t('Zurücksetzen')}
              </Button>
            ) : null}
          </div>
          <SliderControl
            value={layer[key] ?? (key === 'minzoom' ? 0 : 24)}
            min={0}
            max={24}
            step={0.5}
            label={key}
            onChange={(v, live) => set(key, v, live)}
          />
        </div>
      ))}
    </>
  );
}

function FilterEditor({ layer }: { layer: Layer }) {
  return (
    <CodeTextarea
      value={layer.filter === undefined ? '' : prettyJSON(layer.filter)}
      placeholder={t('Kein Filter')}
      label={t('Filter')}
      onCommit={(text) => {
        const raw = text.trim();
        try {
          const filter = raw ? JSON.parse(raw) : undefined;
          store.updateLayer(layer.id, (l) => {
            const next = { ...l };
            if (filter === undefined) delete next.filter;
            else next.filter = filter;
            return next;
          });
          return null;
        } catch (err) {
          return t('Ungültiges JSON: {message}', { message: (err as Error).message });
        }
      }}
    />
  );
}

function RawLayerEditor({ layer }: { layer: Layer }) {
  return (
    <CodeTextarea
      value={prettyJSON(layer)}
      rows={12}
      label={t('JSON der Ebene')}
      onCommit={(text) => {
        let parsed: Layer;
        try {
          parsed = JSON.parse(text);
        } catch (err) {
          return t('Ungültiges JSON: {message}', { message: (err as Error).message });
        }
        if (!parsed || typeof parsed.id !== 'string' || typeof parsed.type !== 'string') return t('Eine Ebene braucht mindestens "id" und "type".');
        if (parsed.id !== layer.id && store.getState().style.layers.some((l) => l.id === parsed.id)) return t('Die ID „{id}“ gibt es schon.', { id: parsed.id });
        store.replaceLayer(layer.id, parsed);
        return null;
      }}
    />
  );
}
