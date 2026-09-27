import type { Metadata } from 'next';
import { site } from '@/content/site';
import { RuntimeProvider } from '@/components/providers/RuntimeProvider';
import { PageStudio } from '@/components/studio/PageStudio';
import { SayHi } from '@/components/studio/SayHi';
import { Button } from '@/components/ui/Button';
import { brand } from '@/lib/brand';
import s from './UnderConstruction.module.css';

/* The pages behind the nav. Each will hold the detailed version of its home
   section; until then its route renders this, with the buddy busy on his tablet
   and a way to the short version. Give a page its real content by replacing its
   route file and removing its entry from site.pages.list. */

export type PageSlug = keyof typeof site.pages.list;

const copy = site.pages.underConstruction;

/** Not indexed until the page has its real content. */
export function underConstructionMetadata(slug: PageSlug): Metadata {
  const p = site.pages.list[slug];
  return { title: p.title, description: p.description, alternates: { canonical: `/${slug}` }, robots: { index: false } };
}

export function UnderConstruction({ slug }: { slug: PageSlug }) {
  const p = site.pages.list[slug];
  return (
    <RuntimeProvider brand={brand.raw}>
      <main id="main" className={s.main}>
        <PageStudio shot="care" labelledBy="page-title">
          <h1 id="page-title" className={s.title}>
            {p.title}
          </h1>
          <p className="lede">{copy.body}</p>
          <div className={s.actions}>
            <Button href={p.section} variant="primary" icon="arrowRight">
              {copy.back}
            </Button>
            <Button href={site.nav.demo.href} variant="ghost" arrow="right">
              {copy.demo}
            </Button>
          </div>
        </PageStudio>
      </main>
      <SayHi />
    </RuntimeProvider>
  );
}
