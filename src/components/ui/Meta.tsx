import { Fragment } from 'react';
import s from './ui.module.css';

/** A mono meta line such as "Riverside Pharmacy · 10:42". Each part stays whole and
    CSS draws the dots, so when the line wraps no line starts or ends with a dot. */
export function Meta({ text }: { text: string }) {
  return (
    <small className={s.meta}>
      <span className={s.metaParts}>
        {text.split(' · ').map((part, i) => (
          <Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span className={s.metaPart}>{part}</span>
          </Fragment>
        ))}
      </span>
    </small>
  );
}
