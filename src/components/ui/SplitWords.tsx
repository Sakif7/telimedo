import { Fragment } from 'react';

/** Splits text into words for the rise-in (.w > .wi, with --i as the stagger
    index). Done at render time so React never has to reconcile a DOM that a
    script rewrote. Mirrors v1's splitWords(): whitespace collapses to one space. */
export function SplitWords({ text, start = 0 }: { text: string; start?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : null}
          <span className="w">
            <span className="wi" style={{ '--i': start + i } as React.CSSProperties}>
              {w}
            </span>
          </span>
        </Fragment>
      ))}
    </>
  );
}
