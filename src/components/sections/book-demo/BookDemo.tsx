'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { requestDemo } from '@/app/actions';
import { site } from '@/content/site';
import { useRuntime, useRuntimeRegistration } from '@/hooks/use-runtime';
import { GlSlot, Poster, StudioBackdrop } from '@/components/studio/StudioParts';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Rich } from '@/components/ui/Rich';
import s from './BookDemo.module.css';

const copy = site.demo;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Book a demo: the third studio window, with the request form beside the buddy. */
export function BookDemo() {
  const card = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const runtime = useRuntime();
  const [invalid, setInvalid] = useState({ name: false, email: false });
  const [done, setDone] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  useRuntimeRegistration('cta', () =>
    card.current && slot.current && stage.current ? { card: card.current, slot: slot.current, stage: stage.current, poster: poster.current } : null,
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = nameRef.current!.value.trim(), email = emailRef.current!.value.trim();
    const okEmail = EMAIL.test(email);
    setInvalid({ name: !name, email: !okEmail });
    if (!name) return nameRef.current!.focus();
    if (!okEmail) return emailRef.current!.focus();
    const data = new FormData(e.currentTarget);
    setFailed(false);
    startTransition(async () => {
      try {
        const res = await requestDemo(data);
        if (!res.ok) {
          setInvalid({ name: res.field === 'name', email: res.field === 'email' });
          (res.field === 'name' ? nameRef : emailRef).current?.focus();
          return;
        }
        setDone(copy.doneFor(name.split(/\s+/)[0], email));
        runtime?.sayHi();
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <section className={s.cta} id="demo" aria-labelledby="demo-title">
      <div className={s.card} data-studio="cta" ref={card}>
        <StudioBackdrop className={s.bg} rings />
        <GlSlot ref={slot} fill />
        <div className={s.grid}>
          <div className={s.copy}>
            <h2 id="demo-title">{copy.title}</h2>
            <p className="lede">{copy.lede}</p>
            <form className={done ? `${s.form} ${s.sent}` : s.form} noValidate onSubmit={onSubmit} aria-busy={pending || undefined}>
              <div className={s.field}>
                <label htmlFor="f-name">{copy.fields.name.label}</label>
                <input
                  id="f-name"
                  name="name"
                  autoComplete="name"
                  required
                  aria-describedby="f-name-err"
                  aria-invalid={invalid.name || undefined}
                  ref={nameRef}
                  onInput={() => setInvalid((v) => ({ ...v, name: false }))}
                />
                <span className={s.err} id="f-name-err" hidden={!invalid.name}>
                  {copy.fields.name.error}
                </span>
              </div>
              <div className={s.field}>
                <label htmlFor="f-email">{copy.fields.email.label}</label>
                <input
                  id="f-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-describedby="f-email-err"
                  aria-invalid={invalid.email || undefined}
                  ref={emailRef}
                  onInput={() => setInvalid((v) => ({ ...v, email: false }))}
                />
                <span className={s.err} id="f-email-err" hidden={!invalid.email}>
                  {copy.fields.email.error}
                </span>
              </div>
              <div className={s.field}>
                <label htmlFor="f-org">{copy.fields.org.label}</label>
                <input id="f-org" name="org" autoComplete="organization" />
              </div>
              <div className={s.field}>
                <label htmlFor="f-size">{copy.fields.size.label}</label>
                <select id="f-size" name="size">
                  {copy.fields.size.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="primary" block icon="arrowRight" className={s.submit}>
                {copy.submit}
              </Button>
              <p className={s.done} role="status">
                <Icon name="checkCircle" />
                <span>{done ?? copy.done}</span>
              </p>
              {failed ? (
                <p className={`${s.err} ${s.failed}`} role="alert">
                  {copy.failed}
                </p>
              ) : null}
              <p className={s.note}>
                <Rich text={copy.note} />
              </p>
            </form>
          </div>
          <div className={s.stage} aria-hidden="true" data-part="stage" ref={stage}>
            <Poster ref={poster} fit />
          </div>
        </div>
      </div>
    </section>
  );
}
