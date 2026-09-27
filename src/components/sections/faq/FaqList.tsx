'use client';

import { useState } from 'react';
import { site } from '@/content/site';
import { Rich } from '@/components/ui/Rich';
import s from './Faq.module.css';

/** Accordion: buttons carry aria-expanded and aria-controls; closed answers are inert. */
export function FaqList() {
  const [open, setOpen] = useState<boolean[]>(() => site.faq.items.map((_, i) => i === 0));
  return (
    <div className={s.list}>
      {site.faq.items.map((item, i) => {
        const id = `qa${i + 1}`;
        return (
          <div key={id} className={open[i] ? `${s.qa} ${s.open}` : s.qa}>
            <h3>
              <button
                type="button"
                aria-expanded={open[i]}
                aria-controls={id}
                id={`${id}-q`}
                onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))}
              >
                {item.q}
                <span className={s.ic} aria-hidden="true" />
              </button>
            </h3>
            <div className={s.a} id={id} role="region" aria-labelledby={`${id}-q`} inert={!open[i]}>
              <div>
                <p>
                  <Rich text={item.a} />
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
