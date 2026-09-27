'use client';

import { useRef, type ReactNode } from 'react';
import { site } from '@/content/site';
import { useRuntimeRegistration } from '@/hooks/use-runtime';
import { GlSlot, Poster, StudioBackdrop, studioClasses as st } from '@/components/studio/StudioParts';
import { Lead } from '@/components/ui/Lead';
import { Meta } from '@/components/ui/Meta';
import s from './Hero.module.css';

const copy = site.hero;

/** The hero studio card. Copy sits at z 2 inside the grid, outside the buddy's box. */
export function HeroStudio({ children }: { children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const copyCol = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement[]>([]);

  useRuntimeRegistration('hero', () =>
    card.current && slot.current && stage.current
      ? { card: card.current, slot: slot.current, stage: stage.current, poster: poster.current, avoid: copyCol.current, chips: chips.current.filter(Boolean) }
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
          <Poster ref={poster} fit />
        </div>
      </div>
      {copy.chips.map((c, i) => (
        <div
          key={c.title}
          className={st.chip}
          data-at={c.at}
          data-off={c.off}
          data-align={c.align === 'right' ? 'right' : undefined}
          data-interactive=""
          aria-hidden="true"
          ref={(el) => {
            if (el) chips.current[i] = el;
          }}
        >
          <Lead lead={c.lead} />
          <span className={st.chipT}>
            <b>
              {c.title}
              {c.ready ? (
                <>
                  {' '}
                  <i className={st.ready} />
                </>
              ) : null}
            </b>
            <Meta text={c.meta} />
          </span>
        </div>
      ))}
      <div className={s.foot} aria-hidden="true">
        <span className={s.scrollCue}>
          <i />
        </span>
        <span className="readout">{copy.scrollCue}</span>
      </div>
    </div>
  );
}
