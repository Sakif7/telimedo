import { site } from '@/content/site';
import { Placeholder } from '@/components/ui/Placeholder';
import { FooterRights, TabLink } from './FooterClient';
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
                    {l.tab ? (
                      <TabLink href={l.href} tab={l.tab}>
                        {l.label}
                      </TabLink>
                    ) : l.placeholder ? (
                      <a href={l.href} data-placeholder-link="" title={l.placeholder.note}>
                        {l.label}
                      </a>
                    ) : (
                      <a href={l.href}>{l.label}</a>
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
