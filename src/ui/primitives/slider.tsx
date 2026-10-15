import { Slider as BaseSlider } from '@base-ui/react/slider';
import { cn } from '../lib/utils';

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  onValueCommitted?: (value: number) => void;
  label?: string;
  className?: string;
};

export function Slider({ value, min, max, step, onValueChange, onValueCommitted, label, className }: SliderProps) {
  const clamped = Math.min(max, Math.max(min, value));
  return (
    <BaseSlider.Root
      value={clamped}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange(v)}
      onValueCommitted={(v) => onValueCommitted?.(v)}
      className={cn('min-w-0 flex-1', className)}
    >
      <BaseSlider.Control className="flex h-7 w-full touch-none items-center">
        <BaseSlider.Track className="relative h-1.5 w-full rounded-full bg-ink/[0.08]">
          <BaseSlider.Indicator className="rounded-full bg-primary" />
          <BaseSlider.Thumb
            aria-label={label}
            className="size-4 rounded-full border-[3px] border-white bg-primary shadow-[0_0_0_1px_rgba(31,35,40,0.12),0_2px_6px_rgba(31,35,40,0.25)] outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
