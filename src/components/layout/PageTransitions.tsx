'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Moving to another page closes the screen like the buddy's camera iris and opens it on
    the new page (View Transitions API, styled in globals.css). Clicks with modifier keys,
    links to the same page, reduced motion and browsers without the API navigate as usual. */
export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const arrived = useRef<(() => void) | null>(null);

  // the new page has committed: let the transition capture it and open the iris
  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-placeholder-link')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (typeof document.startViewTransition !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // next/link skips a click that is already prevented; other handlers (the phone menu closing) still run
      e.preventDefault();
      const root = document.documentElement;
      root.dataset.transition = 'iris';
      const vt = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            arrived.current = resolve;
            router.push(url.pathname + url.search + url.hash);
            window.setTimeout(resolve, 4000); // never leave the screen shut
          }),
      );
      vt.finished.finally(() => {
        delete root.dataset.transition;
      });
    };
    // capture on window runs before next/link's own handler
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
