'use client';

import { useSyncExternalStore } from 'react';
import { site } from '@/content/site';

type Theme = 'light' | 'dark';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

/** The theme on screen: the visitor's choice if they made one, otherwise the device setting. */
function currentTheme(): Theme {
  const chosen = document.documentElement.getAttribute('data-theme');
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return darkQuery().matches ? 'dark' : 'light';
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mq = darkQuery();
  mq.addEventListener('change', onChange);
  return () => {
    mo.disconnect();
    mq.removeEventListener('change', onChange);
  };
}

/** Light/dark switch. The choice is stored and applied before first paint by the layout's boot script. */
export function ThemeToggle({ className }: { className?: string }) {
  // unknown on the server, so the pressed state only appears after hydration
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);
  const toggle = () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // storage can be blocked; the switch still works for this visit
    }
  };
  return (
    <button type="button" className={className} aria-label={site.a11y.darkTheme} aria-pressed={theme ? theme === 'dark' : undefined} data-theme-now={theme ?? undefined} onClick={toggle}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7.25" />
        <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" />
      </svg>
    </button>
  );
}
