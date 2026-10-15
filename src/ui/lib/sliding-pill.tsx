// Shared "pill" that glides behind the active option of segmented controls and
// tabs. Each option marks itself with data-active; the pill measures it and
// moves there with a spring-like transition (none on first paint).

import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from './utils';

type Box = { left: number; top: number; width: number; height: number };

export function SlidingPill({ activeKey, className }: { activeKey: string; className?: string }) {
  const self = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [animate, setAnimate] = useState(false);
  const first = useRef(true);

  useLayoutEffect(() => {
    // The pill's own parent is the control; its ref is set before this effect runs.
    const root = self.current?.parentElement;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector<HTMLElement>('[data-active="true"]');
      if (!el) return setBox(null);
      setBox({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    };
    measure();
    // Tabs change width when the active one shows its label, so keep following.
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll('[data-active]').forEach((el) => observer.observe(el));
    if (first.current) {
      first.current = false;
      requestAnimationFrame(() => setAnimate(true));
    }
    return () => observer.disconnect();
  }, [activeKey]);

  return (
    <span
      ref={self}
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-0 left-0 rounded-md bg-popover shadow-[0_1px_2px_rgba(31,35,40,0.08),0_0_0_1px_rgba(31,35,40,0.06)]',
        animate && 'transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
        className,
      )}
      style={box ? { width: box.width, height: box.height, transform: `translate(${box.left}px, ${box.top}px)` } : { display: 'none' }}
    />
  );
}
