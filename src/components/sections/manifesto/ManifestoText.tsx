'use client';

import { useRef } from 'react';
import { useRuntimeRegistration } from '@/hooks/use-runtime';
import { SplitWords } from '@/components/ui/SplitWords';

/** The manifesto statement, split into words the runtime inks in as you scroll (--k per word). */
export function ManifestoText({ className, text }: { className: string; text: string }) {
  const el = useRef<HTMLParagraphElement>(null);
  useRuntimeRegistration('manifesto', () => (el.current ? { text: el.current, words: Array.from(el.current.querySelectorAll<HTMLElement>('.wi')) } : null));
  return (
    <p className={className} ref={el}>
      <SplitWords text={text} />
    </p>
  );
}
