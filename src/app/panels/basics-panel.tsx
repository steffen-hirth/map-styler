// Simple-mode color panel: one color per map area instead of individual layers.

import { useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { store, useAppState } from '../../runtime/state/store';
import { parseColor, rgbToHsl } from '../../runtime/style/color';
import { applyRecipe, groupColor, recolorGroupTo } from '../../runtime/style/recolor';
import { applyRoute, hasRoute, routeConfigOf } from '../../runtime/style/route';
import { groupOf, type GroupId } from '../../runtime/style/spec';
import { applyLabelLanguage, isVisible, setLayerProp, type LabelLanguage } from '../../runtime/style/style-utils';
import type { Style } from '../../runtime/style/types';
import { ColorControl } from '../../ui/controls/color-control';
import { Field, SelectControl, SwitchControl } from '../../ui/controls/controls';
import { PanelBody, PanelSection } from '../../ui/panel/panel';
import { LABEL_LANGUAGES } from '../app-schema';

const AREAS: Array<{ groups: GroupId[]; label: string }> = [
  { groups: ['background', 'other'], label: 'Hintergrund' },
  { groups: ['landuse'], label: 'Flächen & Natur' },
  { groups: ['water'], label: 'Wasser' },
  { groups: ['roads'], label: 'Straßen' },
  { groups: ['buildings'], label: 'Gebäude' },
];

const TEXT_GROUPS: GroupId[] = ['labels', 'poi'];

/** Live color edits always start from the style before the edit, so ramps never compound. */
function usePreviewEdit() {
  const base = useRef<Style | null>(null);
  return (apply: (style: Style) => Style, live: boolean) => {
    if (!base.current) base.current = store.getState().style;
    const from = base.current;
    store.edit(() => apply(from), live);
    if (!live) base.current = null;
  };
}

function labelColor(style: Style): string | null {
  for (const layer of style.layers) {
    if (layer.type !== 'symbol' || !TEXT_GROUPS.includes(groupOf(layer))) continue;
    const value = layer.paint?.['text-color'];
    if (typeof value === 'string' && parseColor(value)) return value;
  }
  return null;
}

const haloFor = (text: string) => {
  const c = parseColor(text);
  return c && rgbToHsl(c.r, c.g, c.b).l < 0.5 ? 'rgba(255, 255, 255, 0.92)' : 'rgba(20, 22, 26, 0.85)';
};

export function BasicsPanel() {
  const committed = useAppState((s) => s.committed);
  const edit = usePreviewEdit();
  const [language, setLanguage] = useState<LabelLanguage>('de');

  const colors = useMemo(() => AREAS.map((area) => groupColor(committed, area.groups[0])), [committed]);
  const text = useMemo(() => labelColor(committed), [committed]);
  const labelsShown = committed.layers.some((l) => groupOf(l) === 'labels' && isVisible(l));
  const route = hasRoute(committed) ? routeConfigOf(committed) : null;

  return (
    <PanelBody>
      <PanelSection title={t('Kartenfarben')} description={t('Eine Farbe pro Bereich; hellere und dunklere Töne darin passen sich an.')}>
        {AREAS.map((area, i) =>
          colors[i] ? (
            <Field key={area.label} label={t(area.label)}>
              <ColorControl
                value={colors[i]!}
                label={t(area.label)}
                onChange={(color, live) => edit((s) => area.groups.reduce((acc, g) => recolorGroupTo(acc, g, color), s), live)}
              />
            </Field>
          ) : null,
        )}
        {text ? (
          <Field label={t('Beschriftung')}>
            <ColorControl
              value={text}
              label={t('Beschriftung')}
              onChange={(color, live) => edit((s) => applyRecipe(s, { labels: { text: color, halo: haloFor(color) } }), live)}
            />
          </Field>
        ) : null}
      </PanelSection>

      {route ? (
        <PanelSection title={t('Akzent')} description={t('Färbt Route, Stopps und Pins in einem Zug.')}>
          <Field label={t('Akzentfarbe')}>
            <ColorControl
              value={route.color}
              label={t('Akzentfarbe')}
              onChange={(color, live) =>
                edit((s) => {
                  const cfg = routeConfigOf(s);
                  return applyRoute(s, { ...cfg, color, pointStroke: color, pinColor: color });
                }, live)
              }
            />
          </Field>
        </PanelSection>
      ) : null}

      <PanelSection title={t('Beschriftungen')}>
        <SwitchControl
          label={t('Beschriftungen anzeigen')}
          checked={labelsShown}
          onChange={(show) =>
            store.edit((s) => ({
              ...s,
              layers: s.layers.map((l) => (TEXT_GROUPS.includes(groupOf(l)) ? setLayerProp(l, 'layout', 'visibility', show ? undefined : 'none') : l)),
            }))
          }
        />
        <Field label={t('Sprache der Ortsnamen')}>
          <SelectControl
            value={language}
            options={LABEL_LANGUAGES.map((o) => ({ ...o, label: t(o.label) }))}
            label={t('Sprache')}
            onChange={(next) => {
              setLanguage(next);
              store.edit((s) => applyLabelLanguage(s, next).style);
            }}
          />
        </Field>
      </PanelSection>
    </PanelBody>
  );
}
