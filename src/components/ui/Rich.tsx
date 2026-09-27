import type { Placeholder as Ph, Rich as RichText, Segment } from '@/content/site';
import { Placeholder } from './Placeholder';

const isPh = (s: Segment): s is Ph => typeof s === 'object' && 'placeholder' in s;

/** Renders copy from content/site.ts: plain strings, bold runs and placeholders. */
export function Rich({ text }: { text: RichText }) {
  if (typeof text === 'string') return <>{text}</>;
  return (
    <>
      {text.map((s, i) =>
        typeof s === 'string' ? s : isPh(s) ? <Placeholder key={i} value={s} /> : <b key={i}>{s.b}</b>,
      )}
    </>
  );
}

/** Plain text of a rich string (for aria labels and word splitting). */
export function plain(text: RichText): string {
  if (typeof text === 'string') return text;
  return text.map((s) => (typeof s === 'string' ? s : isPh(s) ? s.text : s.b)).join('');
}
