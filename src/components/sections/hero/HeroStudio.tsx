'use client';

import { useRef, type ReactNode } from 'react';
import { site } from '@/content/site';
import { useRuntimeRegistration } from '@/hooks/use-runtime';
import { SpeechBubble } from '@/components/studio/SpeechBubble';
import { GlSlot, Poster, StudioBackdrop } from '@/components/studio/StudioParts';
import s from './Hero.module.css';

const says = site.hero.says;

/** The hero studio card. Copy sits at z 2 inside the grid, outside the buddy's box; the buddy
    peeks in on load, then talks from a bubble beside his head. */
export function HeroStudio({ children }: { children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const copyCol = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);

  useRuntimeRegistration('hero', () =>
    card.current && slot.current && stage.current
      ? { card: card.current, slot: slot.current, stage: stage.current, poster: poster.current, avoid: copyCol.current, chips: bubble.current ? [bubble.current] : [] }
      : null,
  );

  return (
    <div className={s.card} data-studio="hero" ref={card}>
      <StudioBackdrop className={s.bg} rings />
      <GlSlot ref={slot} fill />
      <div className={s.grid}>
        <div className={s.copy} ref={copyCol}>
          {children}
        </div>
        <div className={s.stage} aria-hidden="true" data-part="stage" ref={stage}>
          <Poster ref={poster} fit intro />
        </div>
      </div>
      <SpeechBubble ref={bubble} lines={says.lines} at={says.at} off={says.off} />
    </div>
  );
}
