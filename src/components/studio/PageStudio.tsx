'use client';

import { useRef, type ReactNode } from 'react';
import type { ClipName } from '@/lib/buddy/clips';
import type { ShotName } from '@/lib/buddy/shots';
import { useRuntimeRegistration } from '@/hooks/use-runtime';
import { GlSlot, Poster, StudioBackdrop } from './StudioParts';
import s from './Studio.module.css';

/** The studio window on pages other than home: copy on the left, the buddy on the right in a
    pose that fits the page, looping `act` once he is in place. The runtime treats it as the
    page's first studio, intro included. */
export function PageStudio({ shot, act, labelledBy, children }: { shot: ShotName; act?: ClipName; labelledBy: string; children: ReactNode }) {
  const card = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const copyCol = useRef<HTMLDivElement>(null);

  useRuntimeRegistration('hero', () =>
    card.current && slot.current && stage.current
      ? { card: card.current, slot: slot.current, stage: stage.current, poster: poster.current, avoid: copyCol.current, chips: [], shot, act }
      : null,
  );

  return (
    <section className={s.page} aria-labelledby={labelledBy} data-studio="page" ref={card}>
      <StudioBackdrop className={s.pageBg} rings />
      <GlSlot ref={slot} fill />
      <div className={s.pageGrid}>
        <div className={s.pageCopy} ref={copyCol}>
          {children}
        </div>
        <div className={s.pageStage} aria-hidden="true" data-part="stage" ref={stage}>
          <Poster ref={poster} fit intro />
        </div>
      </div>
    </section>
  );
}
