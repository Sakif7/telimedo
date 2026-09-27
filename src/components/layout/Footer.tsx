import Link from 'next/link';
import { site } from '@/content/site';
import { Placeholder } from '@/components/ui/Placeholder';
import { FooterRights } from './FooterClient';
import s from './Footer.module.css';

const copy = site.footer;

/** Footer: link columns, then the wordmark set full width with its pulse lines cut out. */
export function Footer({ wordmarkMono, year }: { wordmarkMono: string; year: number }) {
  return (
    <footer className={s.footer} data-moment="footer">
      <div className="wrap">
        <div className={s.foot}>
          <div className={s.about}>
            <p className={s.line}>{copy.line}</p>
            <p className={s.contact}>
              {copy.contact.map((c) => (
                <Placeholder key={c.text} value={c} />
              ))}
            </p>
          </div>
          {copy.columns.map((col) => (
            <div key={col.title}>
              <h2 className={s.h}>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.placeholder ? (
                      <a href={l.href} data-placeholder-link="" title={l.placeholder.note}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={s.mark} aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmarkMono }} />
        <div className={s.base}>
          <FooterRights initialYear={year} />
          <span className="readout">{copy.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
