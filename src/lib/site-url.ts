import { site } from '@/content/site';

/** Public origin of the site. The production domain is still a placeholder
    (content/site.ts, meta.siteUrl); set NEXT_PUBLIC_SITE_URL to override it. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || site.meta.siteUrl.text).replace(/\/$/, '');
