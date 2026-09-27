import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/content/site';
import { Poster, StudioBackdrop } from '@/components/studio/StudioParts';
import { Button } from '@/components/ui/Button';
import { brand } from '@/lib/brand';
import s from './not-found.module.css';

export const metadata: Metadata = { title: site.notFound.title, robots: { index: false } };

/** 404: a quiet studio with the buddy still, and the way back home. */
export default function NotFound() {
  return (
    <main id="main" className={s.page}>
      <section className={s.card} aria-labelledby="nf-title">
        <StudioBackdrop className={s.bg} />
        <div className={s.copy}>
          <Link className={s.brand} href="/" aria-label={site.a11y.home} dangerouslySetInnerHTML={{ __html: brand.wordmark }} />
          <h1 id="nf-title">{site.notFound.title}</h1>
          <p className="lede">{site.notFound.body}</p>
          <Button href="/" variant="primary" icon="arrowRight">
            {site.notFound.home}
          </Button>
        </div>
        <div className={s.stage} aria-hidden="true">
          <Poster fit />
        </div>
      </section>
    </main>
  );
}
