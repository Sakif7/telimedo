import { ICONS, type Icon as IconName } from '@/lib/icons';

/** Inline stroke icon (svg.i). Decorative: always aria-hidden. */
export function Icon({ name, className = 'i', style }: { name: IconName; className?: string; style?: React.CSSProperties }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" style={style} dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}
