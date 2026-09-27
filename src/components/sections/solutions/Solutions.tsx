'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { site } from '@/content/site';
import { countUp } from '@/lib/count-up';
import { SELECT_TAB_EVENT } from '@/lib/events';
import { Button } from '@/components/ui/Button';
import { Placeholder } from '@/components/ui/Placeholder';
import { Rich } from '@/components/ui/Rich';
import { Section, SectionTitle } from '@/components/ui/Section';
import s from './Solutions.module.css';

const copy = site.solutions;
type TabId = (typeof copy.tabs)[number]['id'];

/** Solutions: who Telimedo is for, as ARIA tabs with a sliding pill (arrow keys move). */
export function Solutions() {
  const [selected, setSelected] = useState<TabId>('clinics');
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement>>>({});
  const panelRefs = useRef<Partial<Record<TabId, HTMLDivElement>>>({});
  const replay = useRef(false);

  const movePill = useCallback(() => {
    const sel = tabRefs.current[selected], pill = pillRef.current;
    if (!sel || !pill) return;
    pill.style.width = sel.offsetWidth + 'px';
    pill.style.transform = `translate(${sel.offsetLeft}px, ${sel.offsetTop}px)`;
    pill.style.height = sel.offsetHeight + 'px';
    listRef.current?.setAttribute('data-pill', '');
  }, [selected]);

  useLayoutEffect(() => {
    movePill();
    if (!replay.current) return;
    replay.current = false;
    const panel = panelRefs.current[selected];
    if (!panel) return;
    // replay the entrance on the newly shown panel, then count its figures up
    panel.classList.remove(s.enter);
    void panel.offsetWidth;
    panel.classList.add(s.enter);
    countUp(panel);
  }, [selected, movePill]);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(movePill);
    };
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(movePill);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [movePill]);

  const select = useCallback((id: TabId, focus = false) => {
    replay.current = true;
    setSelected(id);
    if (focus) tabRefs.current[id]?.focus();
  }, []);

  useEffect(() => {
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (copy.tabs.some((t) => t.id === id)) select(id as TabId);
    };
    window.addEventListener(SELECT_TAB_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_TAB_EVENT, onSelect);
  }, [select]);

  return (
    <Section id="solutions" className={s.solutions}>
      <div className="section-head">
        <SectionTitle id="solutions-title" text={copy.title} />
      </div>
      <div className={s.tabs} role="tablist" aria-label={copy.tabsLabel} ref={listRef}>
        <span className={s.pill} aria-hidden="true" ref={pillRef} />
        {copy.tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-label={t.label}
            aria-controls={`panel-${t.id}`}
            aria-selected={selected === t.id}
            tabIndex={selected === t.id ? 0 : -1}
            ref={(el) => {
              if (el) tabRefs.current[t.id] = el;
            }}
            onClick={() => select(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const n = copy.tabs.length;
                select(copy.tabs[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id, true);
              }
            }}
          >
            <span className={s.long}>{t.label}</span>
            <span className={s.short}>{t.short}</span>
          </button>
        ))}
      </div>
      {copy.tabs.map((t) => (
        <div
          key={t.id}
          className={s.panel}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={selected !== t.id}
          ref={(el) => {
            if (el) panelRefs.current[t.id] = el;
          }}
        >
          <div className={s.panelCopy}>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
            <p className={s.more}>
              <Rich text={t.more} />
            </p>
            <Button href={t.cta.href} variant={t.cta.kind} arrow="right">
              {t.cta.label}
            </Button>
          </div>
          <div className={s.metrics} aria-label={t.metricsLabel}>
            {'metrics' in t
              ? t.metrics.map((m) => (
                  <div key={m.label} className={s.metric}>
                    <Placeholder as="b" value={m.value} data-count="" />
                    <span>
                      {m.label}
                      <small>{m.note}</small>
                    </span>
                  </div>
                ))
              : t.points.map((p) => (
                  <div key={p.label} className={`${s.metric} ${s.point}`}>
                    <b>{p.label}</b>
                    <span>{p.note}</span>
                  </div>
                ))}
          </div>
        </div>
      ))}
    </Section>
  );
}
