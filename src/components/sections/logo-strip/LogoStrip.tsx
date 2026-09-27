import { site } from '@/content/site';
import { Rich } from '@/components/ui/Rich';
import s from './LogoStrip.module.css';

const copy = site.logos;

function Track({ clone = false }: { clone?: boolean }) {
  return (
    <ul className={s.track} aria-hidden={clone ? true : undefined}>
      {copy.items.map((name) => (
        <li key={name} className={s.name}>
          {name}
        </li>
      ))}
    </ul>
  );
}

/** Customer names. Placeholders: made-up clinics set as plain text until real
    logos exist (never glyphs dressed up as logos). The row is rendered twice so the marquee can loop. */
export function LogoStrip() {
  return (
    <section className={s.logos} id="customers" aria-labelledby="logos-title">
      <div className={`wrap ${s.inner}`}>
        <p className={s.label} id="logos-title">
          <Rich text={copy.label} />
        </p>
        <div className={s.marquee}>
          <Track />
          <Track clone />
        </div>
      </div>
    </section>
  );
}
