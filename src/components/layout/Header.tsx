'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/content/site';
import { Button } from '@/components/ui/Button';
import s from './Header.module.css';

const nav = site.nav;

/** Floating glass header: scrolled state, active-section dot, phone menu (Escape closes it). */
export function Header({ wordmark }: { wordmark: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(en.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    document.querySelectorAll('main > section[id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const cls = [s.header, scrolled ? s.scrolled : '', open ? s.menuOpen : ''].filter(Boolean).join(' ');
  return (
    <header className={cls} data-interactive="">
      <div className={s.bar}>
        <a className={s.brand} href="#top" aria-label={site.a11y.home} dangerouslySetInnerHTML={{ __html: wordmark }} />
        <nav className={s.nav} aria-label={site.a11y.mainNav}>
          {nav.links.map((l) => (
            <a key={l.href} href={l.href} className={active && l.href === '#' + active ? s.on : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className={s.actions}>
          <a className={s.quiet} href={nav.signIn.href} data-placeholder-link="" title={nav.signIn.placeholder?.note}>
            {nav.signIn.label}
          </a>
          <Button href={nav.demo.href} variant="primary" size="sm" className={s.demoBtn}>
            {nav.demo.label}
          </Button>
          <button
            className={s.menuBtn}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? site.a11y.closeMenu : site.a11y.openMenu}
            ref={menuBtn}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <nav
        className={open ? `${s.mobileNav} ${s.open}` : s.mobileNav}
        id="mobile-nav"
        aria-label={site.a11y.mainNav}
        onClick={(e) => {
          if ((e.target as Element).closest('a')) setOpen(false);
        }}
      >
        {nav.links.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
        <a href={nav.signIn.href} data-placeholder-link="" title={nav.signIn.placeholder?.note}>
          {nav.signIn.label}
        </a>
        <Button href={nav.demo.href} variant="primary" className={s.mobileBtn}>
          {nav.demo.label}
        </Button>
      </nav>
    </header>
  );
}
