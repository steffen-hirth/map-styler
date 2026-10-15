import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from '../lib/utils';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
};

export function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
  return (
    <BaseSwitch.Root
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value)}
      aria-label={label}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full bg-ink/[0.12] p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 data-[checked]:bg-primary',
        className,
      )}
    >
      <BaseSwitch.Thumb className="size-3 rounded-full bg-white shadow-sm transition-transform data-[checked]:translate-x-3" />
    </BaseSwitch.Root>
  );
}
