import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'default';

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5 [&_svg]:shrink-0';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white shadow-[0_1px_2px_rgba(31,35,40,0.2)] hover:bg-primary/85',
  secondary: 'bg-popover text-foreground shadow-[0_0_0_1px_rgba(31,35,40,0.1),0_1px_2px_rgba(31,35,40,0.05)] hover:bg-well data-[active=true]:bg-well',
  ghost: 'text-muted hover:bg-ink/[0.06] hover:text-foreground data-[active=true]:bg-ink/[0.08] data-[active=true]:text-foreground',
  danger: 'bg-destructive/15 text-destructive hover:bg-destructive/25',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-2xs',
  default: 'h-8 px-3 text-xs',
};

export type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size; active?: boolean };

export function Button({ variant = 'secondary', size = 'default', active, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-active={active ? 'true' : undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export type IconButtonProps = Omit<ButtonProps, 'size'> & { label: string; size?: 'sm' | 'default' };

/** Square icon button; `label` doubles as tooltip and accessible name. */
export function IconButton({ label, variant = 'ghost', size = 'default', className, ...props }: IconButtonProps) {
  return (
    <Button
      variant={variant}
      aria-label={label}
      title={label}
      className={cn('px-0', size === 'sm' ? 'size-7' : 'size-8', className)}
      {...props}
    />
  );
}
