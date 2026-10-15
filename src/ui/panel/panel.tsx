// Floating panel surfaces in the style of creative tools: blurred glass,
// compact headers and collapsible sections separated by hairlines.

import { ChevronRight } from 'lucide-react';
import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
import { useScrollFade } from '../lib/scroll-fade';
import { SlidingPill } from '../lib/sliding-pill';
import { cn } from '../lib/utils';

export function Panel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-popover text-foreground shadow-[0_1px_2px_rgba(31,35,40,0.04),0_16px_40px_-16px_rgba(31,35,40,0.18)]',
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({ title, icon, children }: { title: ReactNode; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-2 pr-2 pl-4">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <p className="m-0 min-w-0 truncate text-xs-plus font-semibold tracking-[-0.01em]">{title}</p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-0.5">{children}</div> : null}
    </div>
  );
}

export function PanelBody({ className, ref, ...props }: ComponentProps<'div'>) {
  const fade = useScrollFade<HTMLDivElement>();
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      fade(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [fade, ref],
  );
  return <div ref={setRef} className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', className)} {...props} />;
}

export function PanelSection({
  title,
  description,
  action,
  collapsible = true,
  defaultCollapsed = false,
  className,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsible && collapsed;
  return (
    <section className={cn('border-t border-ink/[0.06] first:border-t-0', className)} data-collapsed={isCollapsed || undefined}>
      {title ? (
        <div className="flex h-11 items-center justify-between gap-2 pr-2 pl-4">
          {collapsible ? (
            <button
              type="button"
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed((c) => !c)}
              className="-ml-1 flex min-w-0 flex-1 items-center gap-1 rounded px-1 text-left text-xs font-medium text-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <ChevronRight className={cn('size-3 shrink-0 text-subtle transition-transform', !isCollapsed && 'rotate-90')} />
              <span className="truncate">{title}</span>
            </button>
          ) : (
            <span className="truncate text-xs font-medium">{title}</span>
          )}
          {action ? <div className="flex shrink-0 items-center gap-0.5">{action}</div> : null}
        </div>
      ) : null}
      {isCollapsed ? null : (
        <div className={cn('flex flex-col gap-3.5 px-4 pb-5', !title && 'pt-4')}>
          {description ? <p className="-mt-1 text-2xs leading-relaxed text-muted">{description}</p> : null}
          {children}
        </div>
      )}
    </section>
  );
}

export function PanelTabs<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T;
  items: Array<{ value: T; label: string; icon?: ReactNode }>;
  onChange: (value: T) => void;
}) {
  // With icons, only the active tab shows its label so many tabs fit.
  return (
    <div role="tablist" className="relative mx-3 mb-3 flex shrink-0 gap-0.5 rounded-lg bg-well p-0.5 ring-1 ring-ink/[0.05] ring-inset">
      <SlidingPill activeKey={value} />
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-active={active}
            aria-selected={active}
            aria-label={item.label}
            title={item.label}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-1.5 text-2xs font-medium text-muted outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/50 [&_svg]:size-4 [&_svg]:shrink-0',
              !item.icon && 'flex-1',
              active && 'text-foreground',
              item.icon && (active ? 'flex-1' : 'w-8 flex-none'),
            )}
          >
            {item.icon}
            {!item.icon || active ? <span className="truncate">{item.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon ? <div className="text-subtle [&_svg]:size-5">{icon}</div> : null}
      <p className="text-xs font-medium">{title}</p>
      {children ? <div className="text-2xs leading-relaxed text-muted">{children}</div> : null}
    </div>
  );
}
