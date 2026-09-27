import type { Metadata } from 'next';
import { site } from '@/content/site';
import { RuntimeProvider } from '@/components/providers/RuntimeProvider';
import { PageStudio } from '@/components/studio/PageStudio';
import { SayHi } from '@/components/studio/SayHi';
import { Button } from '@/components/ui/Button';
import { brand } from '@/lib/brand';
import s from './not-found.module.css';

export const metadata: Metadata = { title: site.notFound.metaTitle, robots: { index: false } };

/** 404: the buddy listening for a page that isn't there, and the way back home. */
export default function NotFound() {
  return (
    <RuntimeProvider brand={brand.raw}>
      <main id="main" className={s.main}>
        <PageStudio shot="listen" act="Anim_Confused" labelledBy="nf-title">
          <h1 id="nf-title" className={s.title}>
            {site.notFound.title}
          </h1>
          <p className="lede">{site.notFound.body}</p>
          <Button href="/" variant="primary" icon="arrowRight">
            {site.notFound.home}
          </Button>
        </PageStudio>
      </main>
      <SayHi />
    </RuntimeProvider>
  );
}
