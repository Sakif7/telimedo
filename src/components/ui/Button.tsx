import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Icon as IconName } from '@/lib/icons';
import { Icon } from './Icon';
import s from './ui.module.css';

type Common = {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm';
  block?: boolean;
  /** Arrow in a dark circle: the one main call to action on a screen. */
  icon?: IconName;
  iconAt?: 'start' | 'end';
  /** A small trailing arrow (no circle) for every other onward link. */
  arrow?: 'right' | 'down';
  /** Follows a fine pointer a little (primary CTAs). */
  magnetic?: boolean;
  className?: string;
};

type AsLink = Common & { href: string; type?: never; placeholderNote?: string };
type AsButton = Common & { href?: never; type: 'submit' | 'button'; disabled?: boolean };

export function Button(props: AsLink | AsButton) {
  const { children, variant = 'primary', size, block, icon, iconAt = 'end', arrow, magnetic, className } = props;
  const cls = [s.btn, variant === 'ghost' ? s.btnGhost : s.btnPrimary, size === 'sm' ? s.btnSmall : '', block ? s.btnBlock : '', className ?? ''].filter(Boolean).join(' ');
  const ic = icon ? (
    <span className={variant === 'ghost' ? `${s.btnIcon} ${s.btnIconGhost}` : s.btnIcon}>
      <Icon name={icon} />
    </span>
  ) : null;
  const inner = (
    <>
      {iconAt === 'start' ? ic : null}
      <span>{children}</span>
      {iconAt === 'end' ? ic : null}
      {arrow ? (
        <span className={arrow === 'down' ? `${s.btnArrow} ${s.btnArrowDown}` : s.btnArrow}>
          <Icon name={arrow === 'down' ? 'arrowDown' : 'arrowRight'} />
        </span>
      ) : null}
    </>
  );
  const data = magnetic ? { 'data-magnetic': '' } : {};
  if (props.href != null) {
    const ph = props.placeholderNote ? { 'data-placeholder-link': '', title: props.placeholderNote } : {};
    if (props.href.startsWith('/'))
      return (
        <Link className={cls} href={props.href} {...data}>
          {inner}
        </Link>
      );
    return (
      <a className={cls} href={props.href} {...data} {...ph}>
        {inner}
      </a>
    );
  }
  return (
    <button className={cls} type={props.type} disabled={props.disabled} {...data}>
      {inner}
    </button>
  );
}
