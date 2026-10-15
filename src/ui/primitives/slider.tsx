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

// Thumb and fill glide to their target instead of jumping, which also smooths
// keyboard steps and value changes from the number field.
const GLIDE = 'duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]';

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
      <BaseSlider.Control className="flex h-8 w-full touch-none items-center px-2.5 select-none">
        <BaseSlider.Track className="relative h-2 w-full rounded-[10px] bg-[#ededef] shadow-[inset_0_1px_2px_rgba(45,45,45,0.25)]">
          <BaseSlider.Indicator className={cn('rounded-[10px] bg-[#2c2d2e] transition-[width,inset-inline-start]', GLIDE)} />
          <BaseSlider.Thumb
            aria-label={label}
            className={cn(
              'relative size-5 cursor-grab rounded-full bg-[#f5f5f5] outline-none active:cursor-grabbing',
              'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1),inset_0_2px_1px_#ffffff,inset_0_-1px_1px_rgba(0,0,0,0.18),0_1px_1px_rgba(32,35,45,0.27),0_2px_4px_rgba(32,35,45,0.2)]',
              'after:absolute after:inset-[4px] after:rounded-full after:bg-[#36383a] after:content-[""]',
              'transition-[inset-inline-start,box-shadow]',
              GLIDE,
              'focus-visible:ring-2 focus-visible:ring-accent/40',
            )}
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
