import { Popover } from '@base-ui/react/popover';
import { useEffect, useRef, useState } from 'react';
import { RgbaColorPicker } from 'react-colorful';
import { t } from '../../i18n';
import { formatColor, parseColor } from '../../runtime/style/color';
import { CommitInput, type OnValue } from './controls';

/**
 * Swatch with popover picker (live while dragging, committed when the popover
 * closes), a free-text field for any CSS color syntax and an opacity readout.
 */
export function ColorControl({ value, onChange, label }: { value: string | undefined; onChange: OnValue<string>; label?: string }) {
  const [current, setCurrent] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setCurrent(value ?? '');
  }, [value]);

  const parsed = parseColor(current) ?? { r: 0, g: 0, b: 0, a: 1 };
  const display = current || formatColor(parsed);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next && dirty.current) {
            dirty.current = false;
            onChange(current, false);
          }
        }}
      >
        <Popover.Trigger
          aria-label={label ? t('{label} wählen', { label }) : t('Farbe wählen')}
          className="checkerboard relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-ink/[0.12] outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <span className="absolute inset-0" style={{ background: display }} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={12} className="z-50">
            <Popover.Popup className="color-popover rounded-xl border border-ink/[0.1] bg-popover/95 p-2.5 shadow-[0_16px_40px_-12px_rgba(40,32,48,0.35)] backdrop-blur-2xl outline-none">
              <RgbaColorPicker
                color={parsed}
                onChange={(c) => {
                  const next = formatColor(c);
                  dirty.current = true;
                  setCurrent(next);
                  onChange(next, true);
                }}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <CommitInput
        value={display}
        mono
        label={label}
        className="flex-1"
        onCommit={(raw) => {
          const text = raw.trim();
          if (!parseColor(text)) return false;
          setCurrent(text);
          onChange(text, false);
        }}
      />
      <span className="w-8 shrink-0 text-right text-2xs tabular-nums text-subtle">{Math.round(parsed.a * 100)}%</span>
    </div>
  );
}
