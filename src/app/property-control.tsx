// Editing a single style property: typed literal controls, zoom stops and a
// raw expression editor with inline pickers for every color it contains.

import { Equal, Plus, RotateCcw, TrendingUp, X } from 'lucide-react';
import { useMemo } from 'react';
import { t } from '../i18n';
import { mapHolder } from '../runtime/map/map-holder';
import { store } from '../runtime/state/store';
import { FONTS, propLabel, type PropSpec } from '../runtime/style/spec';
import {
  collectColorPaths,
  readStops,
  setAt,
  shapeOf,
  stopValueNear,
  swatchColor,
  toZoomStops,
  writeStops,
  type Stop,
} from '../runtime/style/style-utils';
import type { Layer, PropKind } from '../runtime/style/types';
import { ColorControl } from '../ui/controls/color-control';
import {
  CodeTextarea,
  CommitInput,
  NumberInput,
  SegmentedControl,
  SelectControl,
  SliderControl,
  type OnValue,
} from '../ui/controls/controls';
import { cn } from '../ui/lib/utils';
import { Button, IconButton } from '../ui/primitives/button';
import { NativeSelect } from '../ui/primitives/input';
import { Switch } from '../ui/primitives/switch';

const JSON_SPEC: PropSpec = { type: 'json' };
const currentZoom = () => mapHolder.get()?.getZoom() ?? 12;

/** JSON with short arrays/objects kept on one line. */
export function prettyJSON(value: unknown, indent = ''): string {
  const flat = JSON.stringify(value);
  if (flat === undefined) return '';
  if (flat.length <= 60 || value === null || typeof value !== 'object') return flat;
  const next = indent + '  ';
  if (Array.isArray(value)) return '[\n' + value.map((v) => next + prettyJSON(v, next)).join(',\n') + '\n' + indent + ']';
  return (
    '{\n' +
    Object.entries(value)
      .map(([k, v]) => next + JSON.stringify(k) + ': ' + prettyJSON(v, next))
      .join(',\n') +
    '\n' +
    indent +
    '}'
  );
}

export function LayerSwatch({ layer, className }: { layer: Layer; className?: string }) {
  const color = swatchColor(layer);
  if (layer.type === 'symbol') {
    return (
      <span
        className={cn('flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-ink/[0.06] text-[10px] font-semibold', className)}
        style={{ color: color ?? undefined }}
      >
        T
      </span>
    );
  }
  return (
    <span className={cn('checkerboard relative size-4 shrink-0 overflow-hidden rounded-[4px] border border-ink/[0.12]', className)}>
      <span
        className={cn('absolute inset-0', layer.type === 'line' && 'inset-x-0 top-1/2 bottom-auto h-[3px] -translate-y-1/2')}
        style={{ background: color ?? 'transparent' }}
      />
    </span>
  );
}

export function PropertyRow({ layer, kind, name, spec }: { layer: Layer; kind: PropKind; name: string; spec?: PropSpec }) {
  const s = spec ?? JSON_SPEC;
  const value = layer[kind]?.[name];
  const shape = shapeOf(value, s);
  const set: OnValue<unknown> = (v, live) => store.setProp(layer.id, kind, name, v, live);
  const zoomable = shape === 'literal' && (s.type === 'number' || s.type === 'color');

  const actions = (
    <>
      {zoomable ? (
        <IconButton size="sm" label={t('Nach Zoomstufe variieren')} onClick={() => set(toZoomStops(value, currentZoom()), false)}>
          <TrendingUp />
        </IconButton>
      ) : null}
      {shape === 'stops' ? (
        <IconButton size="sm" label={t('Fester Wert statt Zoomstufen')} onClick={() => set(stopValueNear(readStops(value, s)!, currentZoom()), false)}>
          <Equal />
        </IconButton>
      ) : null}
      {shape !== 'unset' ? (
        <IconButton size="sm" label={t('Auf Standard zurücksetzen')} onClick={() => set(undefined, false)}>
          <RotateCcw />
        </IconButton>
      ) : null}
    </>
  );

  let control;
  if (shape === 'stops') control = <StopsEditor value={value} spec={s} onChange={set} />;
  else if (shape === 'expr' || s.type === 'json') control = <ExpressionEditor value={value} onChange={set} allowString={s.type === 'string' || s.type === 'json'} />;
  else control = <LiteralControl spec={s} value={shape === 'unset' ? s.default : value} onChange={set} label={propLabel(name)} />;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', shape === 'unset' && 'opacity-55 transition-opacity focus-within:opacity-100 hover:opacity-100')}>
      <div className="flex h-5 items-center justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-1.5" title={name}>
          <span className="truncate text-2xs text-muted">{propLabel(name)}</span>
          {shape === 'stops' ? <span className="rounded bg-accent/15 px-1 text-[10px] text-accent">{t('Zoom')}</span> : null}
          {shape === 'expr' && s.type !== 'json' ? <span className="rounded bg-inspect/20 px-1 text-[10px] text-inspect">{t('Ausdruck')}</span> : null}
        </span>
        <span className="flex shrink-0 items-center gap-0.5">{actions}</span>
      </div>
      {control}
    </div>
  );
}

export function LiteralControl({
  spec,
  value,
  onChange,
  label,
  compact = false,
}: {
  spec: PropSpec;
  value: unknown;
  onChange: OnValue<unknown>;
  label?: string;
  compact?: boolean;
}) {
  switch (spec.type) {
    case 'color':
      return <ColorControl value={typeof value === 'string' ? value : undefined} onChange={onChange} label={label} />;
    case 'number': {
      const n = typeof value === 'number' ? value : (spec.default ?? 0);
      if (compact) return <NumberInput value={n} step={spec.step} label={label} onCommit={(v) => onChange(v, false)} />;
      return <SliderControl value={n} min={spec.min} max={spec.max} step={spec.step} label={label} onChange={onChange} />;
    }
    case 'enum': {
      const current = typeof value === 'string' ? value : (spec.default ?? spec.values[0]);
      if (!compact && spec.values.length <= 3) {
        return <SegmentedControl value={current} options={spec.values.map((v) => ({ value: v, label: v }))} onChange={(v) => onChange(v, false)} />;
      }
      return <SelectControl value={current} label={label} options={spec.values.map((v) => ({ value: v, label: v }))} onChange={(v) => onChange(v, false)} />;
    }
    case 'boolean':
      return (
        <div className="flex h-7 items-center">
          <Switch checked={Boolean(value ?? spec.default)} onCheckedChange={(v) => onChange(v, false)} label={label} />
        </div>
      );
    case 'font': {
      const fonts = Array.isArray(value) ? (value as string[]) : (spec.default ?? FONTS.slice(0, 1));
      const options = [...new Set([...FONTS, ...fonts])];
      return (
        <NativeSelect value={fonts[0]} aria-label={label} onChange={(e) => onChange([e.target.value, ...fonts.slice(1)], false)}>
          {options.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </NativeSelect>
      );
    }
    case 'array':
      return (
        <CommitInput
          value={Array.isArray(value) ? value.join(', ') : ''}
          placeholder={t('z. B. 2, 1')}
          label={label}
          mono
          onCommit={(raw) => {
            const parts = raw.split(/[\s,;]+/).filter(Boolean).map(Number);
            if (!parts.length || parts.some(Number.isNaN)) return false;
            onChange(parts, false);
          }}
        />
      );
    case 'string':
      return <CommitInput value={typeof value === 'string' ? value : ''} label={label} mono onCommit={(raw) => onChange(raw, false)} />;
    default:
      return <ExpressionEditor value={value} onChange={onChange} allowString />;
  }
}

function StopsEditor({ value, spec, onChange }: { value: unknown; spec: PropSpec; onChange: OnValue<unknown> }) {
  const model = readStops(value, spec)!;
  const interpolates = spec.type === 'number' || spec.type === 'color';
  const write = (stops: Stop[], live = false, base = model.base) => onChange(writeStops({ ...model, base, stops }), live);
  const curves = [...new Set([1, 1.2, 1.5, 2, model.base])].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-ink/[0.025] p-2">
      <div className="grid grid-cols-[48px_minmax(0,1fr)_24px] gap-1.5 text-[10px] text-subtle">
        <span>{t('Zoom')}</span>
        <span>{t('Wert')}</span>
      </div>
      {model.stops.map((stop, i) => (
        <div key={i} className="grid grid-cols-[48px_minmax(0,1fr)_24px] items-center gap-1.5">
          <NumberInput
            value={stop.z}
            step={0.5}
            label={t('Zoomstufe')}
            onCommit={(z) => write(model.stops.map((s, j) => (j === i ? { ...s, z: Math.min(24, Math.max(0, z)) } : s)))}
          />
          <LiteralControl
            spec={spec}
            value={stop.v}
            compact
            onChange={(v, live) => write(model.stops.map((s, j) => (j === i ? { ...s, v } : s)), live)}
          />
          <IconButton size="sm" label={t('Stufe entfernen')} disabled={model.stops.length <= 1} onClick={() => write(model.stops.filter((_, j) => j !== i))}>
            <X />
          </IconButton>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            let z = Math.round(currentZoom() * 2) / 2;
            for (let guard = 0; model.stops.some((s) => s.z === z) && guard < 48; guard++) z = Math.min(24, z + 0.5);
            const nearest = stopValueNear(model, z);
            write([...model.stops, { z, v: structuredClone(nearest) }]);
          }}
        >
          <Plus /> {t('Stufe bei aktuellem Zoom')}
        </Button>
        {interpolates && model.kind === 'expr' && model.curve ? (
          <span className="text-[10px] text-subtle">{t('Kurve: individuell')}</span>
        ) : interpolates ? (
          <NativeSelect
            className="w-[92px]"
            aria-label={t('Verlauf')}
            value={String(model.base)}
            onChange={(e) => write(model.stops, false, Number(e.target.value))}
          >
            {curves.map((b) => (
              <option key={b} value={String(b)}>
                {b === 1 ? t('Linear') : `Expo ${b}`}
              </option>
            ))}
          </NativeSelect>
        ) : null}
      </div>
    </div>
  );
}

export function ExpressionEditor({ value, onChange, allowString = false }: { value: unknown; onChange: OnValue<unknown>; allowString?: boolean }) {
  const colors = useMemo(() => (value === undefined ? [] : collectColorPaths(value).slice(0, 40)), [value]);
  const text = value === undefined ? '' : typeof value === 'string' && allowString ? value : prettyJSON(value);
  return (
    <div className="flex flex-col gap-2">
      {colors.length ? (
        <div className="flex flex-col gap-1.5 rounded-lg bg-ink/[0.025] p-2">
          {colors.map((c) => (
            <div key={c.path.join('.')} className="grid grid-cols-[minmax(0,64px)_minmax(0,1fr)] items-center gap-2">
              <span className="truncate text-[10px] text-subtle" title={c.label ? t(c.label) : undefined}>
                {c.label ? t(c.label) : t('Farbe')}
              </span>
              <ColorControl value={c.color} onChange={(v, live) => onChange(setAt(value, c.path, v), live)} />
            </div>
          ))}
        </div>
      ) : null}
      <CodeTextarea
        value={text}
        placeholder={t('JSON-Ausdruck')}
        label={t('Ausdruck')}
        onCommit={(raw) => {
          const trimmed = raw.trim();
          if (!trimmed) {
            onChange(undefined, false);
            return null;
          }
          try {
            onChange(JSON.parse(trimmed), false);
            return null;
          } catch (err) {
            if (allowString) {
              onChange(trimmed, false);
              return null;
            }
            return t('Ungültiges JSON: {message}', { message: (err as Error).message });
          }
        }}
      />
    </div>
  );
}
