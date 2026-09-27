import { site } from '@/content/site';
import { ComplianceBadge } from '@/components/ui/ComplianceBadge';
import { Rich } from '@/components/ui/Rich';
import { Section, SectionTitle } from '@/components/ui/Section';
import s from './Security.module.css';

const copy = site.security;

/** Record IDs such as Rx-8812 stay on one line (browsers may break after a hyphen). */
function keepIds(text: string) {
  return text.split(/\b([A-Z][a-z]?-\d+)\b/).map((part, i) => (i % 2 ? <span key={i} className={s.id}>{part}</span> : part));
}

/** Security and compliance: the claims (HIPAA and GDPR only), the audit log as
    the picture, and a data sheet of how patient data is handled. */
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
        <div className={s.audit} data-reveal="">
          <p className={s.auditHead}>
            <span>
              <i />
              {copy.audit.title}
            </span>
            <span>{copy.audit.meta}</span>
          </p>
          <ol>
            {copy.audit.rows.map((r) => (
              <li key={r.time}>
                <time>{r.time}</time>
                <span>
                  <b>{r.who}</b>
                  {keepIds(r.what)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <dl className={`spec ${s.sheet}`} aria-label={copy.sheetLabel} data-reveal="">
        {copy.sheet.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <Rich text={row.value} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
