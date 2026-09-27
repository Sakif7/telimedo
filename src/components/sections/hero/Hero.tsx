import { site } from '@/content/site';
import { Button } from '@/components/ui/Button';
import { ComplianceBadge } from '@/components/ui/ComplianceBadge';
import { Rich } from '@/components/ui/Rich';
import { HeroPulse } from './HeroPulse';
import { HeroStudio } from './HeroStudio';
import s from './Hero.module.css';

const copy = site.hero;

/* Hero: the first studio window. The copy renders on the server; HeroStudio
   (client) owns the canvas slot, the stage box, the poster and the chips. */
export function Hero() {
  return (
    <section className={s.hero} id="top" aria-labelledby="hero-title">
      <HeroStudio>
        <h1 id="hero-title">
          <span className={s.line}>
            <span>{copy.title.line1}</span>
          </span>{' '}
          <span className={s.line}>
            <span>
              {copy.title.line2}{' '}
              <span className={s.pulseWord}>
                {copy.title.pulseWord}
                <HeroPulse className={s.pulse} />
              </span>
            </span>
          </span>
        </h1>
        <p className="lede">{copy.lede}</p>
        <div className={s.actions}>
          <Button href={copy.primary.href} variant="primary" icon="arrowRight" magnetic>
            {copy.primary.label}
          </Button>
          <Button href={copy.secondary.href} variant="ghost" arrow="down">
            {copy.secondary.label}
          </Button>
        </div>
        <ul className={s.trust} aria-label={copy.trustLabel}>
          {copy.trust.map((t) => (
            <li key={t.badge}>
              <ComplianceBadge className={s.badge}>{t.badge}</ComplianceBadge>
              {t.label}
            </li>
          ))}
          <li className={s.trustCount}>
            <Rich text={copy.trustCount} />
          </li>
        </ul>
      </HeroStudio>
    </section>
  );
}
