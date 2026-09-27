'use client';

import { useRef } from 'react';
import { site } from '@/content/site';
import { useRuntimeRegistration } from '@/hooks/use-runtime';
import { GlSlot, Poster, StudioBackdrop } from '@/components/studio/StudioParts';
import { Icon } from '@/components/ui/Icon';
import { Lead } from '@/components/ui/Lead';
import { Meta } from '@/components/ui/Meta';
import { Rich } from '@/components/ui/Rich';
import { SectionTitle } from '@/components/ui/Section';
import '@/components/product-mock/product-mock.css';
import { CALL_DOCTOR_SVG, CALL_SELF_SVG } from '@/lib/call-art';
import s from './Story.module.css';

/* How it works: one pinned studio that follows a visit (Listen, See, Care,
   Together). React renders every element once; the story controller moves them
   (see lib/story/controller.ts), so this component never re-renders after mount. */

const copy = site.story;

export function Story({ markSvg }: { markSvg: string }) {
  const track = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const studio = useRef<HTMLDivElement>(null);
  const glSlot = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const device = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const callWrap = useRef<HTMLDivElement>(null);
  const call = useRef<HTMLDivElement>(null);
  const timer = useRef<HTMLSpanElement>(null);
  const ecg = useRef<HTMLDivElement>(null);
  const ecgSvg = useRef<SVGSVGElement>(null);
  const ecgBase = useRef<SVGPathElement>(null);
  const ecgLive = useRef<SVGPathElement>(null);
  const ecgDot = useRef<HTMLElement>(null);
  const stepCount = useRef<HTMLSpanElement>(null);
  const ovListen = useRef<HTMLDivElement>(null);
  const ovCare = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const appDesk = useRef<HTMLDivElement>(null);
  const appCompact = useRef<HTMLDivElement>(null);
  const panels = useRef<HTMLElement[]>([]);
  const navBtns = useRef<HTMLButtonElement[]>([]);

  useRuntimeRegistration('story', () => {
    const req = [track, sticky, studio, glSlot, rail, head, device, hint, callWrap, call, ecg, ecgSvg, ecgBase, ecgLive, ecgDot, appDesk, appCompact];
    if (req.some((r) => !r.current)) return null;
    return {
      track: track.current!,
      sticky: sticky.current!,
      studio: studio.current!,
      glSlot: glSlot.current!,
      rail: rail.current!,
      head: head.current!,
      device: device.current!,
      hint: hint.current!,
      callWrap: callWrap.current!,
      call: call.current!,
      timer: timer.current,
      panels: panels.current.filter(Boolean),
      navBtns: navBtns.current.filter(Boolean),
      ecg: ecg.current!,
      ecgSvg: ecgSvg.current!,
      ecgBase: ecgBase.current!,
      ecgLive: ecgLive.current!,
      ecgDot: ecgDot.current!,
      stepCount: stepCount.current,
      ovListen: ovListen.current,
      ovCare: ovCare.current,
      poster: poster.current,
      appDesk: appDesk.current!,
      appCompact: appCompact.current!,
    };
  });

  return (
    <section className={s.story} id="how" aria-labelledby="how-title">
      <div className={`wrap ${s.head}`}>
        <SectionTitle id="how-title" text={copy.title} />
        <p className={s.sub}>{copy.sub}</p>
      </div>
      <div className={s.track} data-studio="story" ref={track}>
        <div className={s.sticky} data-step="0" ref={sticky}>
          <div className={s.rail} data-part="rail" ref={rail}>
            <div>
              <div className={s.readouts}>
                <span className="readout">{copy.readout}</span>
                <span className="readout" ref={stepCount}>
                  {copy.count(0)}
                </span>
              </div>
              <nav className={s.stepsNav} aria-label={copy.navLabel}>
                {copy.steps.map((st, i) => (
                  <button
                    key={st.n}
                    type="button"
                    ref={(el) => {
                      if (el) navBtns.current[i] = el;
                    }}
                  >
                    <span className={s.n}>{st.n}</span>
                    {st.label}
                  </button>
                ))}
              </nav>
              <div className={s.ecg} aria-hidden="true" ref={ecg}>
                <svg ref={ecgSvg}>
                  <path className={s.ecgBase} ref={ecgBase} />
                  <path className={s.ecgLive} ref={ecgLive} />
                </svg>
                <i className={s.ecgDot} ref={ecgDot} />
              </div>
            </div>
            <div className={s.stepPanels}>
              {copy.panels.map((p, i) => (
                <article
                  key={p.n}
                  className={i === 0 ? `${s.stepPanel} on` : s.stepPanel}
                  aria-hidden={i === 0 ? undefined : true}
                  ref={(el) => {
                    if (el) panels.current[i] = el;
                  }}
                >
                  <span className={s.stepBig} data-n={p.n} aria-hidden="true" />
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <dl className={`spec ${s.spec}`}>
                    {p.specs.map((d) => (
                      <div key={d.label}>
                        <dt>{d.label}</dt>
                        <dd>
                          <Rich text={d.value} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </div>

          <div className={s.dockHead} data-part="dock-head" ref={head}>
            <p className={s.kicker}>
              <span className={s.n}>{copy.together.n}</span>
              {copy.together.label}
            </p>
            <h3>{copy.together.title}</h3>
            <p>{copy.together.body}</p>
          </div>

          <div className={s.studio} data-part="studio" ref={studio}>
            <StudioBackdrop className={s.studioBg} />
            <GlSlot ref={glSlot} />
            <Poster ref={poster} className={s.storyPoster} />
            <div className={s.viewfinder} aria-hidden="true">
              <i className={`${s.vf} ${s.tl}`} />
              <i className={`${s.vf} ${s.tr}`} />
              <i className={`${s.vf} ${s.bl}`} />
              <i className={`${s.vf} ${s.br}`} />
              <span className={s.vfRec}>
                <b />
                {copy.viewfinder.rec}
              </span>
              <span className={s.vfMeta}>{copy.viewfinder.meta}</span>
            </div>
            <div className={s.ov} aria-hidden="true" data-interactive="" ref={ovListen}>
              <div className={s.ovCard}>
                <p className={s.ovTop}>
                  <Lead lead={{ kind: 'initials', text: copy.intake.initials }} />
                  <span>
                    <b>{copy.intake.title}</b>
                    <Meta text={copy.intake.meta} />
                  </span>
                </p>
                <p className={s.ovQuote}>{copy.intake.quote}</p>
                <p className={s.ovTags}>
                  {copy.intake.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                  <span className={s.ok}>
                    <Icon name="check" />
                    {copy.intake.ok}
                  </span>
                </p>
              </div>
            </div>
            <div className={s.ov} aria-hidden="true" data-interactive="" ref={ovCare}>
              {copy.careNotes.map((n) => (
                <div key={n.title} className={`${s.ovCard} ${s.note}`}>
                  <Lead lead={n.lead} small />
                  <span>
                    <b>{n.title}</b>
                    <Meta text={n.meta} />
                  </span>
                </div>
              ))}
            </div>
            <div className={s.callWrap} aria-hidden="true" data-part="call" ref={callWrap}>
              <div className={s.call} ref={call}>
                <div className={s.callTop}>
                  <span className={s.mk} dangerouslySetInnerHTML={{ __html: markSvg }} />
                  <span className={s.live}>
                    <i />
                    {copy.call.live}
                  </span>
                  <span className={s.callTitle}>{copy.call.title}</span>
                  <span className={s.callTimer} ref={timer}>
                    {copy.call.timer}
                  </span>
                  <span className={s.callDept}>
                    <Icon name="lock" />
                    {copy.call.room}
                  </span>
                </div>
                <div className={s.callMain}>
                  <svg viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: inner(CALL_DOCTOR_SVG) }} />
                  <span className={s.nameChip}>{copy.call.name}</span>
                  <div className={s.selfView}>
                    <svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: inner(CALL_SELF_SVG) }} />
                    <span>{copy.call.self}</span>
                  </div>
                  <p className={s.caption}>
                    <b>{copy.call.captionTag}</b>
                    {copy.call.caption}
                  </p>
                </div>
                <div className={s.callBar}>
                  <span className={s.cb}>
                    <Icon name="mic" />
                  </span>
                  <span className={s.cb}>
                    <Icon name="video" />
                  </span>
                  <span className={s.cb}>
                    <Icon name="captions" />
                  </span>
                  <span className={s.cb}>
                    <Icon name="message" />
                  </span>
                  <span className={`${s.cb} ${s.end}`}>
                    <Icon name="phoneOff" />
                  </span>
                </div>
              </div>
            </div>
            <div className={s.device} role="region" aria-label={copy.deviceLabel} data-interactive="" inert ref={device}>
              <div className={s.deviceScreen}>
                <div id="app-desk" className="tmd-app tmd-desk" ref={appDesk} />
                <div id="app-compact" className="tmd-app tmd-compact" ref={appCompact} />
              </div>
            </div>
            <p className={s.dockHint} ref={hint}>
              <span className={s.forDesk}>{copy.hint.desk}</span>
              <span className={s.forPhone}>{copy.hint.phone}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Inner markup of a v1 illustration (its <svg> wrapper is rendered by React). */
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
