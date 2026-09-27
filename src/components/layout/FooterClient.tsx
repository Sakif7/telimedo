'use client';

import { useSyncExternalStore } from 'react';
import { site } from '@/content/site';

const noSubscribe = () => () => {};
const currentYear = () => new Date().getFullYear();

/** © line: the build year on the server and during hydration, the current year after. */
export function FooterRights({ initialYear }: { initialYear: number }) {
  const year = useSyncExternalStore(noSubscribe, currentYear, () => initialYear);
  return <span>{site.footer.rights(year)}</span>;
}
