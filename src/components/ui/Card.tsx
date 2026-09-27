import type { ComponentPropsWithoutRef, ElementType } from 'react';
import s from './ui.module.css';

type CardProps<T extends ElementType> = { as?: T; className?: string } & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>;

/** The shared card surface: radius, surface colour and hairline. Sections add padding and layout. */
export function Card<T extends ElementType = 'div'>({ as, className, ...rest }: CardProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return <Tag className={className ? `${s.card} ${className}` : s.card} {...rest} />;
}
