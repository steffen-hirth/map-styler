// Composite controls: fields, commit-on-blur inputs, slider + number pairs and
// segmented choices. All value controls report (value, live) so drags can
// preview without flooding the undo history.

import NumberFlow from '@number-flow/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getLang } from '../../i18n';
import { Input, inputSurface, NativeSelect, Textarea } from '../primitives/input';
import { Slider } from '../primitives/slider';
import { Switch } from '../primitives/switch';
import { SlidingPill } from '../lib/sliding-pill';
import { cn } from '../lib/utils';

export type OnValue<T> = (value: T, live: boolean) => void;

export function Field({
  label,
  title,
  actions,
  inline = false,
  className,
  children,
}: {
  label: ReactNode;
  title?: string;
  actions?: ReactNode;
  inline?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (inline) {
    return (
      <div className={cn('grid grid-cols-[92px_minmax(0,1fr)] items-center gap-2', className)}>
        <span className="truncate text-2xs text-muted" title={title}>
          {label}
        </span>
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="min-w-0 flex-1">{children}</div>
          {actions}
        </div>
      </div>
    );
  }
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex h-5 items-center justify-between gap-2">
        <span className="truncate text-2xs text-muted" title={title}>
          {label}
        </span>
        {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

/** Text input that keeps a local draft and commits on blur or Enter. */
export function CommitInput({
  value,
  onCommit,
  placeholder,
  mono,
  className,
  label,
}: {
  value: string;
  /** Return false to mark the draft invalid. */
  onCommit: (value: string) => boolean | void;
  placeholder?: string;
  mono?: boolean;
  className?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDraft(value);
      setInvalid(false);
    }
  }, [value]);

  const commit = () => {
    if (draft === value) return setInvalid(false);
    setInvalid(onCommit(draft) === false);
  };

  return (
    <Input
      value={draft}
      placeholder={placeholder}
      aria-label={label}
      aria-invalid={invalid || undefined}
      spellCheck={false}
      className={cn(mono && 'font-mono text-[11px]', className)}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setDraft(value);
          setInvalid(false);
        }
      }}
    />
  );
}

export function NumberInput({
  value,
  onCommit,
  step = 1,
  className,
  label,
}: {
  value: number;
  onCommit: (value: number) => void;
  step?: number;
  className?: string;
  label?: string;
}) {
  return (
    <CommitInput
      value={formatNumber(value)}
      label={label}
      className={cn('text-right tabular-nums', className)}
      onCommit={(raw) => {
        const n = parseFloat(raw.replace(',', '.'));
        if (Number.isNaN(n)) return false;
        onCommit(step >= 1 ? n : Math.round(n / step) * step);
      }}
    />
  );
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '';
  return String(Math.round(n * 1000) / 1000);
}

export function SliderControl({
  value,
  min,
  max,
  step,
  onChange,
  unit,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: OnValue<number>;
  unit?: string;
  label?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Slider
        value={local}
        min={min}
        max={max}
        step={step}
        label={label}
        onValueChange={(v) => {
          setLocal(v);
          onChange(v, true);
        }}
        onValueCommitted={(v) => onChange(v, false)}
      />
      <AnimatedNumberField value={local} step={step} unit={unit} label={label} onCommit={(v) => onChange(v, false)} />
    </div>
  );
}

const decimalsFor = (step: number) => (step >= 1 ? 0 : Math.min(3, String(step).split('.')[1]?.length ?? 2));

/**
 * Value readout whose digits roll to the new number; click to type a value.
 */
export function AnimatedNumberField({
  value,
  step = 1,
  unit,
  label,
  onCommit,
}: {
  value: number;
  step?: number;
  unit?: string;
  label?: string;
  onCommit: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const decimals = decimalsFor(step);

  if (editing) {
    const finish = (raw: string) => {
      setEditing(false);
      const n = parseFloat(raw.replace(',', '.'));
      if (!Number.isNaN(n) && n !== value) onCommit(decimals ? Math.round(n / step) * step : n);
    };
    return (
      <Input
        autoFocus
        defaultValue={formatNumber(value)}
        aria-label={label}
        className="w-[64px] shrink-0 text-right tabular-nums"
        onFocus={(e) => e.target.select()}
        onBlur={(e) => finish(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setEditing(true)}
      className={cn(inputSurface, 'flex h-8 w-[64px] shrink-0 cursor-text items-center justify-end gap-0.5 px-2 tabular-nums')}
    >
      <NumberFlow
        value={value}
        locales={getLang() === 'de' ? 'de-DE' : 'en-US'}
        format={{ minimumFractionDigits: 0, maximumFractionDigits: decimals }}
      />
      {unit ? <span className="text-2xs text-subtle">{unit}</span> : null}
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn('relative flex h-8 w-full rounded-lg bg-well p-0.5 ring-1 ring-ink/[0.05] ring-inset', className)}>
      <SlidingPill activeKey={value} />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          data-active={option.value === value}
          aria-checked={option.value === value}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative flex min-w-0 flex-1 items-center justify-center gap-1 truncate rounded-md px-1.5 text-2xs font-medium text-muted transition-colors duration-200 hover:text-foreground [&_svg]:size-3.5',
            option.value === value && 'text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SelectControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <NativeSelect value={value} aria-label={label} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  );
}

export function SwitchControl({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex h-7 cursor-pointer items-center justify-between gap-2 text-xs">
      <span className="text-2xs text-muted">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </label>
  );
}

/** Code editor that commits on blur; shows the parse error returned by onCommit. */
export function CodeTextarea({
  value,
  onCommit,
  rows,
  placeholder,
  label,
}: {
  value: string;
  onCommit: (text: string) => string | null | void;
  rows?: number;
  placeholder?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) {
      setDraft(value);
      setError(null);
    }
  }, [value]);
  const lines = draft.split('\n').length;
  return (
    <div className="flex flex-col gap-1">
      <Textarea
        value={draft}
        rows={rows ?? Math.min(14, Math.max(2, lines))}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        onFocus={() => (focused.current = true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          focused.current = false;
          if (draft === value) return;
          setError(onCommit(draft) || null);
        }}
      />
      {error ? <p className="text-2xs text-destructive">{error}</p> : null}
    </div>
  );
}
