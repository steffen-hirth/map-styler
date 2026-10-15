import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export const inputSurface =
  'w-full min-w-0 rounded-md border border-ink/[0.1] bg-popover text-xs text-foreground outline-none transition-colors placeholder:text-subtle hover:border-ink/[0.18] focus:border-accent/60 focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-destructive/70 disabled:opacity-50';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputSurface, 'h-8 px-2.5', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      spellCheck={false}
      className={cn(inputSurface, 'min-h-14 resize-y px-2 py-1.5 font-mono text-[11px] leading-relaxed', className)}
      {...props}
    />
  );
}

export function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <select className={cn(inputSurface, 'h-8 cursor-pointer appearance-none pr-7 pl-2.5')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted" />
    </div>
  );
}
