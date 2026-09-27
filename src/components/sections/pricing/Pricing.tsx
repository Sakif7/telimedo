'use client';

import { useRef, useState } from 'react';
import { site } from '@/content/site';
import { clamp, easeOutCubic, lerp, prefersReducedMotion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Placeholder } from '@/components/ui/Placeholder';
import { Card } from '@/components/ui/Card';
import { Section, SectionTitle } from '@/components/ui/Section';
import s from './Pricing.module.css';

const copy = site.pricing;
const delays = [undefined, '.08s', '.16s'];
type Billing = 'm' | 'a';

/** Pricing: per clinician, monthly or annual. Prices count to the new value. */
export function Pricing() {
  const [billing, setBilling] = useState<Billing>('m');
  const priceEls = useRef<(HTMLElement | null)[]>([]);

  const change = (b: Billing) => {
    if (b === billing) return;
    setBilling(b);
    const reduce = prefersReducedMotion();
    copy.plans.forEach((plan, i) => {
      const el = priceEls.current[i];
      if (!el || !plan.price) return;
      const from = parseFloat((el.textContent ?? '').replace(/[^0-9.]/g, '')) || 0;
      const to = plan.price[b];
      const t0 = performance.now();
      const step = (now: number) => {
        const k = reduce ? 1 : clamp((now - t0) / 500);
        el.textContent = '$' + Math.round(lerp(from, to, easeOutCubic(k)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  return (
    <Section id="pricing" className={s.pricing}>
      <div className={s.head}>
        <div className="section-head">
          <SectionTitle id="pricing-title" text={copy.title} />
        </div>
        <div className={s.billing} data-on={billing} role="group" aria-label={copy.billingLabel}>
          <button type="button" aria-pressed={billing === 'm'} onClick={() => change('m')}>
            {copy.monthly}
          </button>
          <button type="button" aria-pressed={billing === 'a'} onClick={() => change('a')}>
            {copy.annual} <Placeholder value={copy.save} className={s.save} />
          </button>
        </div>
      </div>
      <div className={s.plans}>
        {copy.plans.map((plan, i) => (
          <Card
            as="article"
            key={plan.name}
            className={plan.tag ? `${s.plan} ${s.pop}` : s.plan}
            data-reveal=""
            style={delays[i] ? ({ '--d': delays[i] } as React.CSSProperties) : undefined}
          >
            {plan.tag ? <p className={s.tag}>{plan.tag}</p> : null}
            <h3>{plan.name}</h3>
            <p className={s.for}>{plan.for}</p>
            <p className={s.price}>
              {plan.price ? (
                <b
                  className="ph soft"
                  title={copy.priceNote}
                  ref={(el) => {
                    priceEls.current[i] = el;
                  }}
                >
                  {'$' + plan.price.m}
                </b>
              ) : (
                <b>{plan.custom?.label}</b>
              )}
              <span>{plan.price ? copy.per[billing] : plan.custom?.per}</span>
            </p>
            <Button href={plan.cta.href} variant={plan.cta.kind} block icon={plan.cta.kind === 'primary' ? 'arrowRight' : undefined}>
              {plan.cta.label}
            </Button>
            <ul className={s.features} aria-label={copy.featuresLabel(plan.name)}>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className={s.fine}>{copy.fine}</p>
    </Section>
  );
}
