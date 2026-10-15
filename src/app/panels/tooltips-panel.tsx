import { MessageSquareText, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { mapHolder, sampleFeatureProps } from '../../runtime/map/map-holder';
import { store, useAppState } from '../../runtime/state/store';
import { GROUPS, groupLabel, groupOf } from '../../runtime/style/spec';
import { KEY as TOOLTIP_KEY, normalize as normalizeTooltips, renderTemplate, tooltipCss, type TooltipStyle } from '../../runtime/tooltips';
import { ColorControl } from '../../ui/controls/color-control';
import { Field, SegmentedControl, SelectControl, SliderControl, SwitchControl } from '../../ui/controls/controls';
import { Button } from '../../ui/primitives/button';
import { NativeSelect } from '../../ui/primitives/input';
import { Switch } from '../../ui/primitives/switch';
import { PanelBody, PanelSection } from '../../ui/panel/panel';
import { defaultTemplate, SAMPLE_PROPS, TOOLTIP_FONTS, TOOLTIP_SHADOWS } from '../app-schema';
import { LayerSwatch } from '../property-control';

const PREVIEW_CLASS = 'msx-tooltip-preview';

/** In simple mode only the essentials: preview, trigger, colors, font, size, radius, shadow. */
export function TooltipsPanel({ simple = false }: { simple?: boolean }) {
  const meta = useAppState((s) => s.style.metadata?.[TOOLTIP_KEY]);
  const config = useMemo(() => normalizeTooltips(meta), [meta]);
  const style = config.style;
  const setStyle = <K extends keyof TooltipStyle>(key: K, value: TooltipStyle[K], live = false) =>
    store.editTooltips((c) => ({ ...c, style: { ...c.style, [key]: value } }), live);

  return (
    <PanelBody>
      <PanelSection title={t('Vorschau')} collapsible={false} className="sticky top-0 z-10 border-b border-ink/[0.06] bg-popover/95 backdrop-blur-xl">
        <TooltipPreview />
      </PanelSection>
      <PanelSection title={t('Verhalten')}>
        <Field label={t('Anzeigen bei')}>
          <SegmentedControl
            value={config.trigger}
            options={[
              { value: 'hover', label: 'Hover' },
              { value: 'click', label: t('Klick') },
            ]}
            onChange={(trigger) => store.editTooltips((c) => ({ ...c, trigger }))}
          />
        </Field>
      </PanelSection>
      <PanelSection title={t('Aussehen')}>
        <Field label={t('Hintergrund')}>
          <ColorControl value={style.background} label={t('Hintergrund')} onChange={(v, live) => setStyle('background', v, live)} />
        </Field>
        <Field label={t('Text')}>
          <ColorControl value={style.color} label={t('Textfarbe')} onChange={(v, live) => setStyle('color', v, live)} />
        </Field>
        <Field label={t('Schrift')}>
          <SelectControl
            value={TOOLTIP_FONTS.some((f) => f.value === style.fontFamily) ? style.fontFamily : TOOLTIP_FONTS[0].value}
            options={TOOLTIP_FONTS.map((f) => ({ ...f, label: t(f.label) }))}
            label={t('Schrift')}
            onChange={(v) => setStyle('fontFamily', v)}
          />
        </Field>
        <Field label={t('Schriftgröße')}>
          <SliderControl value={style.fontSize} min={9} max={24} step={1} unit="px" label={t('Schriftgröße')} onChange={(v, live) => setStyle('fontSize', v, live)} />
        </Field>
{simple ? null : (
          <>
        <Field label={t('Zeilenhöhe')}>
          <SliderControl value={style.lineHeight} min={1} max={2} step={0.05} label={t('Zeilenhöhe')} onChange={(v, live) => setStyle('lineHeight', v, live)} />
        </Field>
        <Field label={t('Innenabstand')}>
          <SliderControl value={style.padding} min={0} max={32} step={1} unit="px" label={t('Innenabstand')} onChange={(v, live) => setStyle('padding', v, live)} />
        </Field>
          </>
        )}
        <Field label={t('Glas-Unschärfe')}>
          <SliderControl value={style.blur} min={0} max={40} step={1} unit="px" label={t('Glas-Unschärfe')} onChange={(v, live) => setStyle('blur', v, live)} />
        </Field>
        <Field label={t('Eckenradius')}>
          <SliderControl value={style.radius} min={0} max={24} step={1} unit="px" label={t('Eckenradius')} onChange={(v, live) => setStyle('radius', v, live)} />
        </Field>
{simple ? null : (
          <>
        <Field label={t('Rahmen')}>
          <ColorControl value={style.borderColor} label={t('Rahmenfarbe')} onChange={(v, live) => setStyle('borderColor', v, live)} />
        </Field>
        <Field label={t('Rahmenbreite')}>
          <SliderControl value={style.borderWidth} min={0} max={4} step={0.5} unit="px" label={t('Rahmenbreite')} onChange={(v, live) => setStyle('borderWidth', v, live)} />
        </Field>
          </>
        )}
        <Field label={t('Schatten')}>
          <SegmentedControl value={style.shadow} options={TOOLTIP_SHADOWS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(v) => setStyle('shadow', v)} />
        </Field>
{simple ? null : (
          <>
        <Field label={t('Max. Breite')}>
          <SliderControl value={style.maxWidth} min={120} max={480} step={10} unit="px" label={t('Max. Breite')} onChange={(v, live) => setStyle('maxWidth', v, live)} />
        </Field>
        <SwitchControl label={t('Pfeil anzeigen')} checked={style.tip} onChange={(v) => setStyle('tip', v)} />
          </>
        )}
      </PanelSection>
      {simple ? null : <TooltipLayersSection />}
    </PanelBody>
  );
}

function TooltipPreview() {
  const meta = useAppState((s) => s.style.metadata?.[TOOLTIP_KEY]);
  const layers = useAppState((s) => s.style.layers);
  const config = useMemo(() => normalizeTooltips(meta), [meta]);
  const firstId = Object.keys(config.layers).find((id) => config.layers[id].enabled);
  const layer = layers.find((l) => l.id === firstId);
  const map = mapHolder.get();
  const props = (map && layer && sampleFeatureProps(map, layer)) || SAMPLE_PROPS;
  const html = renderTemplate(firstId ? config.layers[firstId].template : defaultTemplate(), props) || renderTemplate(defaultTemplate(), SAMPLE_PROPS);

  return (
    <div className="flex min-h-28 items-center justify-center rounded-lg bg-[repeating-linear-gradient(45deg,rgba(29,30,34,0.035)_0_8px,transparent_8px_16px)] px-3 py-5">
      <style>{tooltipCss(config.style, PREVIEW_CLASS)}</style>
      <div
        className={`maplibregl-popup maplibregl-popup-anchor-bottom tt-preview ${PREVIEW_CLASS}${config.trigger === 'click' ? ' msx-click' : ''}`}
        style={{ maxWidth: config.style.maxWidth }}
      >
        <div className="maplibregl-popup-tip" />
        <div className="maplibregl-popup-content">
          <div dangerouslySetInnerHTML={{ __html: html }} />
          {config.trigger === 'click' ? (
            <span className="maplibregl-popup-close-button grid place-items-center" aria-hidden>
              ×
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TooltipLayersSection() {
  const meta = useAppState((s) => s.style.metadata?.[TOOLTIP_KEY]);
  const layers = useAppState((s) => s.style.layers);
  const config = useMemo(() => normalizeTooltips(meta), [meta]);
  const ids = Object.keys(config.layers);
  const [pick, setPick] = useState('');
  const candidates = layers.filter((l) => l.type !== 'background' && !config.layers[l.id]);

  const add = () => {
    if (!pick) return;
    store.editTooltips((c) => ({ ...c, layers: { ...c.layers, [pick]: { enabled: true, template: defaultTemplate() } } }));
    store.setUi({ selectedId: pick });
    setPick('');
  };

  return (
    <PanelSection
      title={t('Ebenen mit Tooltip ({n})', { n: ids.length })}
      description={t('Die Vorlage bearbeitest du rechts in den Eigenschaften der Ebene.')}
    >
      {ids.length ? (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {ids.map((id) => {
            const layer = layers.find((l) => l.id === id);
            return (
              <li key={id} className="flex h-7 items-center gap-2 rounded-md pr-0.5 pl-1.5 hover:bg-ink/[0.04]">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs"
                  onClick={() => store.setUi({ selectedId: id })}
                  title={layer ? id : t('{id} (Ebene fehlt im Style)', { id })}
                >
                  {layer ? <LayerSwatch layer={layer} /> : <MessageSquareText className="size-4 text-destructive" />}
                  <span className={layer ? 'truncate' : 'truncate text-destructive line-through'}>{id}</span>
                </button>
                <Switch
                  checked={config.layers[id].enabled}
                  label={t('Tooltip für {id}', { id })}
                  onCheckedChange={(enabled) =>
                    store.editTooltips((c) => ({ ...c, layers: { ...c.layers, [id]: { ...c.layers[id], enabled } } }))
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-2xs text-subtle">{t('Noch keine Ebene hat einen Tooltip.')}</p>
      )}
      <div className="flex gap-1.5">
        <NativeSelect className="flex-1" value={pick} aria-label={t('Ebene für Tooltip')} onChange={(e) => setPick(e.target.value)}>
          <option value="">{t('Ebene wählen …')}</option>
          {GROUPS.map(([group]) => {
            const items = candidates.filter((l) => groupOf(l) === group);
            if (!items.length) return null;
            return (
              <optgroup key={group} label={groupLabel(group)}>
                {items.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </NativeSelect>
        <Button disabled={!pick} onClick={add}>
          <Plus /> {t('Hinzufügen')}
        </Button>
      </div>
    </PanelSection>
  );
}
