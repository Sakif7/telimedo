import type { ReactNode } from 'react';
import { SplitWords } from './SplitWords';

type SectionProps = { id: string; className?: string; wrapClassName?: string; children: ReactNode };

/** A page section: the shared vertical rhythm (.section) around the centred column (.wrap).
    Its heading carries the id `${id}-title`, which labels the section. */
export function Section({ id, className, wrapClassName, children }: SectionProps) {
  return (
    <section className={className ? `section ${className}` : 'section'} id={id} aria-labelledby={`${id}-title`}>
      <div className={wrapClassName ? `wrap ${wrapClassName}` : 'wrap'}>{children}</div>
    </section>
  );
}

/** A section heading whose words rise in the first time it scrolls into view (data-split, see page-fx). */
export function SectionTitle({ id, text }: { id: string; text: string }) {
  return (
    <h2 id={id} data-split="">
      <SplitWords text={text} />
    </h2>
  );
}
