import { site } from '@/content/site';
import { Placeholder } from '@/components/ui/Placeholder';
import { Section, SectionTitle } from '@/components/ui/Section';
import s from './Results.module.css';

const copy = site.results;

/** Results, data first: the figures open the section, then what they mean and a
    customer in their own words (all placeholders until real). */
export function Results() {
  return (
    <Section id="proof">
      <div className={s.stats} data-count-group="">
        {copy.stats.map((st) => (
          <div key={st.label} className={s.stat}>
            <Placeholder as="b" value={st.value} data-count="" />
            <span>{st.label}</span>
          </div>
        ))}
      </div>
      <div className={s.split}>
        <SectionTitle id="proof-title" text={copy.title} />
        <figure className={s.quote} data-reveal="">
          <blockquote>
            <p>
              <Placeholder value={copy.quote.text} />
            </p>
          </blockquote>
          <figcaption>
            <span className="av">{copy.quote.initials}</span>
            <span>
              <Placeholder as="b" value={copy.quote.name} />
              <Placeholder as="small" value={copy.quote.role} />
            </span>
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
