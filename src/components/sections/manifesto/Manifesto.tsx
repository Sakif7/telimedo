import { site } from '@/content/site';
import { Rich } from '@/components/ui/Rich';
import { ManifestoText } from './ManifestoText';
import s from './Manifesto.module.css';

const copy = site.manifesto;
const delays = ['0s', '.08s', '.16s'];

/** Why Telimedo: a statement that inks in as you read, then three facts set in type. */
export function Manifesto() {
  return (
    <section className={s.manifesto} id="why" aria-labelledby="mani-title">
      <div className="wrap">
        <h2 className="sr-only" id="mani-title">
          {copy.label}
        </h2>
        <ManifestoText className={s.text} text={copy.text} />
        <ul className={s.facts}>
          {copy.facts.map((f, i) => (
            <li key={f.label} data-reveal="" style={i ? ({ '--d': delays[i] } as React.CSSProperties) : undefined}>
              <b className={s.figure}>
                <Rich text={f.figure} />
              </b>
              <span className={s.label}>{f.label}</span>
              <span className={s.body}>{f.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
