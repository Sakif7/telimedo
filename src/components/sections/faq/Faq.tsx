import { site } from '@/content/site';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section, SectionTitle } from '@/components/ui/Section';
import { FaqList } from './FaqList';
import s from './Faq.module.css';

const copy = site.faq;

/** FAQ: the questions clinics ask, with a side card for booking a demo. */
export function Faq() {
  return (
    <Section id="faq" className={s.faq} wrapClassName={s.grid}>
      <div className={s.side}>
        <SectionTitle id="faq-title" text={copy.title} />
        <Card className={s.ask}>
          <p>
            <b>{copy.ask.title}</b>
            {copy.ask.body}
          </p>
          <Button href={copy.ask.cta.href} variant="ghost" arrow="right">
            {copy.ask.cta.label}
          </Button>
        </Card>
      </div>
      <FaqList />
    </Section>
  );
}
