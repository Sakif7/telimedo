'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { site } from '@/content/site';
import { Icon } from '@/components/ui/Icon';
import s from './Product.module.css';

/** The slot the demo picks once the card has scrolled in (Tuesday 29, 10:00). */
const DEMO_PICK = { day: 1, slot: 1 };
const DEMO_AFTER_MS = 1300;

/** Online booking: pick a slot and see the confirmation patients get. When the card first
    scrolls into view, the slots fill in and one gets picked, unless the visitor got there first. */
export function BookingVignette() {
  const b = site.product.booking;
  const [picked, setPicked] = useState<{ day: string; t: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.__buddyCalm || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        const d = b.days[DEMO_PICK.day];
        timer = window.setTimeout(() => setPicked((p) => p ?? { day: d.day, t: d.slots[DEMO_PICK.slot].t }), DEMO_AFTER_MS);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [b.days]);

  return (
    <div className={s.vig} ref={root}>
      <div className={s.bar}>
        <span className="av">{b.doctor.initials}</span>
        <span className={s.who}>
          <b>{b.doctor.name}</b>
          <small>{b.doctor.meta}</small>
        </span>
        <span className={s.softPill}>{b.doctor.length}</span>
      </div>
      <div className={s.slots}>
        {b.days.map((d, di) => (
          <div key={d.day} className={s.day}>
            <p className={s.d}>
              {d.short}
              <b>{d.date}</b>
            </p>
            {d.slots.map((sl, si) => (
              <button
                key={sl.t}
                type="button"
                style={{ '--k': di * 3 + si } as CSSProperties}
                disabled={'taken' in sl && sl.taken}
                aria-pressed={picked ? picked.day === d.day && picked.t === sl.t : undefined}
                onClick={() => setPicked({ day: d.day, t: sl.t })}
              >
                {sl.t}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className={picked ? `${s.booked} ${s.ok}` : s.booked} aria-live="polite">
        <Icon name="calendarCheck" />
        <span>{picked ? b.booked(picked.day, picked.t) : b.prompt}</span>
      </p>
    </div>
  );
}

function WaitRow({ row, index }: { row: (typeof site.product.waiting.rows)[number]; index: number }) {
  const w = site.product.waiting;
  const [secs, setSecs] = useState<number | null>(null);
  const timer = useRef(0);
  useEffect(() => () => clearInterval(timer.current), []);
  const admit = () => {
    setSecs(0);
    timer.current = window.setInterval(() => {
      setSecs((v) => {
        const next = (v ?? 0) + 1;
        if (next >= 59) clearInterval(timer.current);
        return next;
      });
    }, 1000);
  };
  const inVisit = secs != null;
  return (
    <div className={inVisit ? `${s.waitRow} ${s.in}` : s.waitRow} style={{ '--k': index } as CSSProperties}>
      <span className="av">{row.initials}</span>
      <span className={s.who}>
        <b>{row.name}</b>
        <small>{inVisit ? w.inVisit(secs) : row.status}</small>
      </span>
      {'admit' in row && row.admit ? (
        inVisit ? (
          <span className={s.liveChip}>{w.live}</span>
        ) : (
          <button type="button" className={s.chipBtn} onClick={admit}>
            {w.admit}
          </button>
        )
      ) : (
        <span className={s.time}>{'time' in row ? row.time : null}</span>
      )}
    </div>
  );
}

/** Waiting room: clinicians see who is ready and let them in. */
export function WaitingRoomVignette() {
  return (
    <div className={s.vig}>
      <div className={s.wait}>
        {site.product.waiting.rows.map((r, i) => (
          <WaitRow key={r.name} row={r} index={i} />
        ))}
      </div>
    </div>
  );
}
