'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { site } from '@/content/site';
import { SELECT_TAB_EVENT } from '@/lib/events';

const noSubscribe = () => () => {};
const currentYear = () => new Date().getFullYear();

/** © line: the build year on the server and during hydration, the current year after. */
export function FooterRights({ initialYear }: { initialYear: number }) {
  const year = useSyncExternalStore(noSubscribe, currentYear, () => initialYear);
  return <span>{site.footer.rights(year)}</span>;
}

/** A footer link that also selects a Solutions tab (the page scrolls to #solutions as usual). */
export function TabLink({ href, tab, children }: { href: string; tab: string; children: ReactNode }) {
  return (
    <a href={href} data-tab-link={tab} onClick={() => window.dispatchEvent(new CustomEvent(SELECT_TAB_EVENT, { detail: tab }))}>
      {children}
    </a>
  );
}
