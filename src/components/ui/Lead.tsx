import type { Lead as LeadData } from '@/content/site';
import { CALL_DOCTOR_SVG } from '@/lib/call-art';
import s from './ui.module.css';

// The doctor from the video call, cropped to the face (own gradient id: the call renders the same art).
const DOCTOR_FACE = CALL_DOCTOR_SVG.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replaceAll('roomG', 'roomThumbG');

/** Leading element of a glass card: a live-video thumbnail, the Rx mark, initials or a time. */
export function Lead({ lead, small = false }: { lead: LeadData; small?: boolean }) {
  const sm = small ? ` ${s.leadSmall}` : '';
  switch (lead.kind) {
    case 'video':
      return (
        <span className={s.leadThumb + sm}>
          <svg viewBox="165 96 150 150" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: DOCTOR_FACE }} />
        </span>
      );
    case 'rx':
      return <span className={s.leadRx + sm}>Rx</span>;
    case 'initials':
      return <span className="av">{lead.text}</span>;
    case 'time':
      return (
        <span className={s.leadTime}>
          <small>{lead.day}</small>
          {lead.time}
        </span>
      );
  }
}
