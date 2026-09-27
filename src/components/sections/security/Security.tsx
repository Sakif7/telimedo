import type { CSSProperties } from 'react';
import { site } from '@/content/site';
import { ComplianceBadge } from '@/components/ui/ComplianceBadge';
import { Lead } from '@/components/ui/Lead';
import { Rich } from '@/components/ui/Rich';
import { Section, SectionTitle } from '@/components/ui/Section';
import s from './Security.module.css';

const copy = site.security;
const record = copy.record;
const tone = { safe: s.safe, rx: s.rx, plain: '' } as const;

/** Security and compliance: the claims (HIPAA and GDPR only) beside the visit's record, shown as
    a screen from the app. The safeguards appear on the rows where they happen; the note under it
    carries the rest (encryption, access, consent, hosting, the BAA). */
export function Security() {
  return (
    <Section id="security" className={s.band}>
      <div className={s.top}>
        <div className={s.head}>
          <SectionTitle id="security-title" text={copy.title} />
          <p className={s.intro}>{copy.intro}</p>
          <ul className={s.badges}>
            {copy.badges.map((b) => (
              <li key={b.badge}>
                <span className={s.claim}>
                  <ComplianceBadge className={s.badge}>{b.badge}</ComplianceBadge>
                  {b.label}
                </span>
                <small>{b.note}</small>
              </li>
            ))}
          </ul>
        </div>
        <div className={s.side}>
          <figure className={s.record} data-reveal="">
            <figcaption className={s.recordHead}>
              <b>
                {record.title} <span>{record.id}</span>
              </b>
              <small>{record.meta}</small>
              <span className={s.sample}>{record.sample}</span>
            </figcaption>
            <ol className={s.rows}>
              {record.rows.map((r, i) => (
                <li key={r.time} className={s.row} style={{ '--i': i } as CSSProperties}>
                  <Lead lead={r.lead} small />
                  <span className={s.what}>
                    <b>{r.action}</b>
                    <small>{r.who}</small>
                  </span>
                  <span className={tone[r.tone] ? `${s.tag} ${tone[r.tone]}` : s.tag}>{r.tag}</span>
                  <time>{r.time}</time>
                </li>
              ))}
            </ol>
          </figure>
          <p className={s.note}>
            <Rich text={copy.note} />
          </p>
        </div>
      </div>
    </Section>
  );
}
