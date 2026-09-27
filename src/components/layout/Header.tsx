'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { site } from '@/content/site';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from './ThemeToggle';
import s from './Header.module.css';

const nav = site.nav;

/** Floating glass header: page links (the current page is marked), theme switch, phone menu (Escape closes it). */
export function Header({ wordmark }: { wordmark: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // the menu belongs to the page it was opened on, so it is closed on any other page (browser back included)
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenOn(null);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const current = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const cls = [s.header, scrolled ? s.scrolled : '', open ? s.menuOpen : ''].filter(Boolean).join(' ');
  return (
    <header className={cls} data-interactive="">
      <div className={s.bar}>
        <Link className={s.brand} href="/" aria-label={site.a11y.home} dangerouslySetInnerHTML={{ __html: wordmark }} />
        <nav className={s.nav} aria-label={site.a11y.mainNav}>
          {nav.links.map((l) => (
            <Link key={l.href} href={l.href} className={current(l.href) ? s.on : undefined} aria-current={current(l.href) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className={s.actions}>
          <ThemeToggle className={s.theme} />
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
            onClick={() => setOpen(!open)}
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
          <Link key={l.href} href={l.href} aria-current={current(l.href) ? 'page' : undefined}>
            {l.label}
          </Link>
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
