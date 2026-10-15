import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { t } from '../../i18n';
import { store, useAppState } from '../../runtime/state/store';
import { adjustStyleColors, applyHalo, applyLabelLanguage, removeItalic, scaleTextSize, type LabelLanguage } from '../../runtime/style/style-utils';
import type { Style } from '../../runtime/style/types';
import { ColorControl } from '../../ui/controls/color-control';
import { CommitInput, Field, SelectControl, SliderControl, SwitchControl } from '../../ui/controls/controls';
import { Button } from '../../ui/primitives/button';
import { PanelBody, PanelSection } from '../../ui/panel/panel';
import { DEFAULT_ADJUSTMENT, LABEL_LANGUAGES, type Adjustment } from '../app-schema';

function applyAdjustment(base: Style, a: Adjustment): Style {
  let style = base;
  if (a.hue || a.saturation || a.lightness || a.invert) style = adjustStyleColors(style, a);
  if (a.textScale !== 100) style = scaleTextSize(style, a.textScale / 100);
  return style;
}

export function GlobalPanel() {
  return (
    <PanelBody>
      <AdjustSection />
      <LabelsSection />
      <StyleInfoSection />
    </PanelBody>
  );
}

function AdjustSection() {
  const [params, setParams] = useState<Adjustment>(DEFAULT_ADJUSTMENT);
  const base = useRef<Style | null>(null);
  const committed = useAppState((s) => s.committed);
  const active = params !== DEFAULT_ADJUSTMENT;

  // Undo/redo or edits elsewhere end the preview session.
  useEffect(() => {
    if (base.current && committed !== base.current) {
      base.current = null;
      setParams(DEFAULT_ADJUSTMENT);
    }
  }, [committed]);

  // Leaving the tab keeps the previewed result.
  useEffect(
    () => () => {
      if (base.current) store.commit();
    },
    [],
  );

  const preview = (patch: Partial<Adjustment>) => {
    const next = { ...params, ...patch };
    setParams(next);
    if (!base.current) base.current = store.getState().style;
    const from = base.current;
    store.edit(() => applyAdjustment(from, next), true);
  };

  const apply = () => {
    if (!base.current) return;
    base.current = null;
    setParams(DEFAULT_ADJUSTMENT);
    store.commit();
    toast.success(t('Anpassung übernommen'));
  };

  const discard = () => {
    if (!base.current) return;
    base.current = null;
    setParams(DEFAULT_ADJUSTMENT);
    store.revert();
  };

  return (
    <PanelSection title={t('Farben & Schrift anpassen')} description={t('Wirkt auf alle Ebenen. Die Karte zeigt die Vorschau live, fest wird es erst mit „Übernehmen“.')}>
      <Field label={t('Farbton')}>
        <SliderControl value={params.hue} min={-180} max={180} step={1} unit="°" label={t('Farbton')} onChange={(hue) => preview({ hue })} />
      </Field>
      <Field label={t('Sättigung')}>
        <SliderControl value={params.saturation} min={-100} max={100} step={1} unit="%" label={t('Sättigung')} onChange={(saturation) => preview({ saturation })} />
      </Field>
      <Field label={t('Helligkeit')}>
        <SliderControl value={params.lightness} min={-100} max={100} step={1} unit="%" label={t('Helligkeit')} onChange={(lightness) => preview({ lightness })} />
      </Field>
      <SwitchControl label={t('Helligkeit umkehren (schneller Dark Mode)')} checked={params.invert} onChange={(invert) => preview({ invert })} />
      <Field label={t('Schriftgröße')}>
        <SliderControl value={params.textScale} min={50} max={200} step={5} unit="%" label={t('Schriftgröße')} onChange={(textScale) => preview({ textScale })} />
      </Field>
      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" disabled={!active} onClick={discard}>
          {t('Verwerfen')}
        </Button>
        <Button variant="primary" disabled={!active} onClick={apply}>
          {t('Übernehmen')}
        </Button>
      </div>
    </PanelSection>
  );
}

function LabelsSection() {
  const [language, setLanguage] = useState<LabelLanguage>('de');
  const [haloColor, setHaloColor] = useState('rgba(255, 255, 255, 0.9)');
  const [haloWidth, setHaloWidth] = useState(1.2);

  return (
    <PanelSection title={t('Beschriftungen')}>
      <Field label={t('Sprache der Ortsnamen')}>
        <div className="flex gap-1.5">
          <div className="min-w-0 flex-1">
            <SelectControl value={language} options={LABEL_LANGUAGES.map((o) => ({ ...o, label: t(o.label) }))} label={t('Sprache')} onChange={setLanguage} />
          </div>
          <Button
            onClick={() => {
              const { style, count } = applyLabelLanguage(store.getState().style, language);
              if (!count) return toast(t('Keine passenden Beschriftungen gefunden.'));
              store.edit(() => style);
              toast.success(t('{n} Beschriftungsebenen umgestellt', { n: count }));
            }}
          >
            {t('Anwenden')}
          </Button>
        </div>
      </Field>
      <Field label={t('Textumrandung (Halo) für alle Beschriftungen')}>
        <ColorControl value={haloColor} label={t('Halo-Farbe')} onChange={(v) => setHaloColor(v)} />
      </Field>
      <SliderControl value={haloWidth} min={0} max={5} step={0.1} label={t('Halo-Breite')} onChange={(v) => setHaloWidth(v)} />
      <Button className="self-end" onClick={() => store.edit((s) => applyHalo(s, haloColor, haloWidth))}>
        {t('Halo anwenden')}
      </Button>
      <Field label={t('Schriftschnitt')}>
        <Button
          className="self-start"
          onClick={() => {
            const { style, count } = removeItalic(store.getState().style);
            if (!count) return toast(t('Keine kursiven Beschriftungen gefunden.'));
            store.edit(() => style);
            toast.success(t('{n} Ebenen auf normale Schrift umgestellt', { n: count }));
          }}
        >
          {t('Kursive Schrift entfernen')}
        </Button>
      </Field>
    </PanelSection>
  );
}

function StyleInfoSection() {
  const name = useAppState((s) => s.style.name ?? '');
  const glyphs = useAppState((s) => s.style.glyphs);
  const sources = useAppState((s) => s.style.sources);
  return (
    <PanelSection title={t('Style')} defaultCollapsed>
      <Field label={t('Name')}>
        <CommitInput value={name} label={t('Style-Name')} onCommit={(value) => store.edit((s) => ({ ...s, name: value.trim() || undefined }))} />
      </Field>
      <Field label={t('Quellen')}>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[10px] text-subtle">
          {Object.entries(sources).map(([id, source]) => (
            <li key={id} className="truncate" title={JSON.stringify(source)}>
              <span className="font-mono text-muted">{id}</span> · {(source as { type?: string }).type}
            </li>
          ))}
        </ul>
      </Field>
      {glyphs ? (
        <Field label={t('Schriften (Glyphs)')}>
          <p className="truncate font-mono text-[10px] text-subtle" title={glyphs}>
            {glyphs}
          </p>
        </Field>
      ) : null}
    </PanelSection>
  );
}
