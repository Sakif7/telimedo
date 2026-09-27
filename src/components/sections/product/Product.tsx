import type { CSSProperties, ReactNode } from 'react';
import { site } from '@/content/site';
import { SPARK_SVG_INNER } from '@/lib/call-art';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Section, SectionTitle } from '@/components/ui/Section';
import { BookingVignette, WaitingRoomVignette } from './ProductVignettes';
import s from './Product.module.css';

const copy = site.product;
// The chart stretches to its tile; the end marker is drawn in HTML so it stays round.
const SPARK_LINE = SPARK_SVG_INNER.replace(/<circle[^>]*class="end"[^>]*\/>/, '');

/** Stagger index for the one-time demo that plays after a card reveals. */
const k = (i: number) => ({ '--k': i }) as CSSProperties;

/** A feature: title, one sentence, and a small real piece of the product. When the card
    scrolls in it unmasks, then its vignette plays a short demo once (Product.module.css).
    `count` marks cards with figures that count up. */
function Tile({ cls, delay, title, body, moment, count, children }: { cls: string; delay?: string; title: string; body: string; moment?: string; count?: boolean; children: ReactNode }) {
  return (
    <Card
      as="article"
      className={`${s.tile} ${cls}`}
      data-reveal=""
      data-count-group={count ? '' : undefined}
      data-moment={moment}
      style={delay ? ({ '--d': delay } as CSSProperties) : undefined}
    >
      <div className={s.tileCopy}>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {children}
    </Card>
  );
}

/** Product: eight features in an editorial grid, each shown through the product itself. */
export function Product() {
  const { booking, waiting, rx, analytics, reminders, records, payments, team } = copy;
  return (
    <Section id="product">
      <div className={s.head}>
        <SectionTitle id="product-title" text={copy.title} />
        <p>{copy.intro}</p>
      </div>
      <div className={s.bento}>
        <Tile cls={s.tBook} title={booking.title} body={booking.body}>
          <BookingVignette />
        </Tile>

        <Tile cls={s.tWait} delay=".06s" title={waiting.title} body={waiting.body}>
          <WaitingRoomVignette />
        </Tile>

        <Tile cls={s.tStats} title={analytics.title} body={analytics.body} count>
          <div className={`${s.vig} ${s.spark}`}>
            <p className={s.sparkK}>
              <span>{analytics.label}</span>
              <b data-count="" data-count-delay="450">
                {analytics.value}
              </b>
              <em>
                <Icon name="arrowUp" />
                {analytics.delta}
              </em>
            </p>
            <div className={s.chart}>
              <svg viewBox="0 0 280 84" preserveAspectRatio="none" aria-label={analytics.chartLabel} dangerouslySetInnerHTML={{ __html: SPARK_LINE }} />
              <i className={s.sparkEnd} aria-hidden="true" />
            </div>
          </div>
        </Tile>

        <Tile cls={s.tRx} delay=".06s" title={rx.title} body={rx.body} moment="product2">
          <div className={s.vig}>
            <p className={s.rxTop}>
              <span className={s.rxMark}>{rx.mark}</span>
              <span>
                <b>{rx.drug}</b>
                <small>{rx.dose}</small>
              </span>
            </p>
            {rx.rows.map((r, i) => (
              <p key={r.label} className={s.rxRow} style={k(i)}>
                <span>{r.label}</span>
                <b className={r.good ? s.good : undefined}>
                  {r.good ? <Icon name="check" /> : null}
                  {r.value}
                </b>
              </p>
            ))}
            <p className={s.rxStatus}>
              <i />
              {rx.status}
            </p>
          </div>
        </Tile>

        <Tile cls={s.tRemind} title={reminders.title} body={reminders.body}>
          <div className={s.vig}>
            <p className={s.smsMeta}>{reminders.meta}</p>
            <p className={s.typing} aria-hidden="true">
              <i />
              <i />
              <i />
            </p>
            <p className={`${s.bubble} ${s.msg}`}>{reminders.text}</p>
            <p className={`${s.bubble} ${s.link}`}>
              <Icon name="link" />
              {reminders.link}
            </p>
          </div>
        </Tile>

        <Tile cls={s.tRecords} delay=".06s" title={records.title} body={records.body}>
          <div className={`${s.vig} ${s.timeline}`}>
            {records.items.map((it, i) => (
              <p key={it.title} style={k(i)}>
                <i />
                <span>
                  <b>{it.title}</b>
                  <small>{it.meta}</small>
                </span>
              </p>
            ))}
          </div>
        </Tile>

        <Tile cls={s.tPay} delay=".12s" title={payments.title} body={payments.body} count>
          <div className={`${s.vig} ${s.receipt}`}>
            {payments.rows.map((r, i) => (
              <p key={r.label} className={r.total ? s.total : undefined} style={k(i)}>
                <span>{r.label}</span>
                <b className={r.good ? s.good : undefined} data-count={r.total ? '' : undefined} data-count-delay={r.total ? '1050' : undefined}>
                  {r.good ? <Icon name="check" /> : null}
                  {r.value}
                </b>
              </p>
            ))}
          </div>
        </Tile>

        <Tile cls={s.tTeam} title={team.title} body={team.body}>
          <div className={`${s.vig} ${s.roles}`}>
            {team.people.map((p, i) => (
              <p key={p.name} style={k(i)}>
                <span className={p.coral ? 'av coral' : 'av'}>{p.initials}</span>
                <b>{p.name}</b>
                <span className={s.role}>{p.role}</span>
              </p>
            ))}
          </div>
        </Tile>
      </div>
    </Section>
  );
}
