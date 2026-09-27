import s from './ui.module.css';

/** "HIPAA" or "GDPR" set in DM Mono inside a hairline badge: compliance marks are type, not icons. */
export function ComplianceBadge({ children, className }: { children: string; className?: string }) {
  return <span className={className ? `${s.badge} ${className}` : s.badge}>{children}</span>;
}
