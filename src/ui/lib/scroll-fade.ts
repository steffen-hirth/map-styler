// Soft fade at the top/bottom edge of a scroll container, only where content is
// actually cut off. Sets data-fade-top / data-fade-bottom; the .scroll-fade
// class in styles.css turns them into an animated mask.

import { useCallback, useRef } from 'react';

export function useScrollFade<T extends HTMLElement>() {
  const cleanup = useRef<(() => void) | null>(null);

  return useCallback((el: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!el) return;
    el.classList.add('scroll-fade');
    const update = () => {
      const top = el.scrollTop > 1;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      el.toggleAttribute('data-fade-top', top);
      el.toggleAttribute('data-fade-bottom', bottom);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const mutations = new MutationObserver(update);
    mutations.observe(el, { childList: true, subtree: true });
    cleanup.current = () => {
      el.removeEventListener('scroll', update);
      resize.disconnect();
      mutations.disconnect();
    };
  }, []);
}
