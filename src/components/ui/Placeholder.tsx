import type { ElementType } from 'react';
import type { Placeholder as Ph } from '@/content/site';

/** Content still waiting for real data from the owner: dotted coral underline
    (.ph) with a note saying what to replace. Never remove the marking until the
    value is real. */
export function Placeholder({ value, as: Tag = 'span', className, ...rest }: { value: Ph; as?: ElementType; className?: string; [data: `data-${string}`]: string | undefined }) {
  const cls = ['ph', value.soft ? 'soft' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <Tag className={cls} title={value.note} {...rest}>
      {value.text}
    </Tag>
  );
}
