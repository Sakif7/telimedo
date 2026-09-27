'use client';

import { useRef } from 'react';
import { site } from '@/content/site';
import { useRuntimeRegistration } from '@/hooks/use-runtime';
import s from './Studio.module.css';

/** The small label that follows the cursor while it is over the buddy. */
export function SayHi() {
  const el = useRef<HTMLDivElement>(null);
  useRuntimeRegistration('sayHi', () => el.current);
  return (
    <div className={s.sayHi} aria-hidden="true" ref={el}>
      {site.sayHi}
    </div>
  );
}
