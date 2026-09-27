// Telimedo clinic workspace: a working mock of the product, used on the tablet and in the page.
// Mounted imperatively into the device (v1 ui/app.js, ported for parity). Sample data only.
import { iconSvg as icon, type Icon } from '@/lib/icons';

export type BrandSources = { wordmark: string; mark: string };
type Point = { d: Date; v: number };
type Tip = { show(clientX: number, clientY: number, value: string, label: string, color?: string): void; hide(): void };

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const fmt = (n: number) => n.toLocaleString('en-US');
const money = (n: number) => '$' + fmt(n);
const svgTag = (s: string) => s.replace('<svg ', '<svg aria-hidden="true" focusable="false" ');

/* ------------------------------------------------------------------ sample data (clearly demo data in a product mock) */
function series(n: number, seed: number): Point[] {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const out: Point[] = [];
  const end = new Date(2026, 8, 24);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i);
    const dow = d.getDay();
    const base = dow === 0 ? 4 : dow === 6 ? 7 : 11 + (dow === 1 ? 2 : 0);
    const trend = (n - i) / n * 3;
    out.push({ d, v: Math.round(base + trend + rnd() * 5 - 1) });
  }
  return out;
}
const RANGES = {
  '7D': { label: 'Last 7 days', appts: 81, apptsD: 9, comp: 80, compD: 3, newP: 21, newD: 11, rev: 6140, revD: 8, trend: series(7, 11), status: [65, 5, 7, 4] },
  '30D': { label: 'Last 30 days', appts: 328, apptsD: 12, comp: 78, compD: 6, newP: 86, newD: 18, rev: 24580, revD: 14, trend: series(30, 11), status: [256, 24, 32, 16] },
  '90D': { label: 'Last 90 days', appts: 934, apptsD: 21, comp: 77, compD: 4, newP: 241, newD: 26, rev: 70960, revD: 19, trend: series(90, 11), status: [719, 65, 94, 56] },
};
const STATUS = [
  { k: 'Completed', c: 'var(--a-good)' },
  { k: 'Pending', c: 'var(--a-warn)' },
  { k: 'Cancelled', c: 'var(--a-critical)' },
  { k: 'No-show', c: 'var(--a-neutral)' },
];
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const GROWTH = { newP: [52, 61, 58, 70, 77, 86], ret: [140, 151, 163, 170, 184, 197] };
const REVENUE = [14200, 16800, 17900, 19600, 21500, 24580];
const DOCTORS: [string, string, number, number, number][] = [
  ['Sarah Johnson', 'SJ', 98, 92, 8120],
  ['Amir Rahman', 'AR', 76, 85, 6340],
  ['Emily Davis', 'ED', 62, 78, 4980],
  ['Kenji Watanabe', 'KW', 54, 70, 3920],
];
const SERVICES: [string, number][] = [['General consultation', 112], ['Follow-up visit', 76], ['Prescription refill', 58], ['Mental health', 46], ['Lab results review', 28], ['Other', 18]];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p'];
const HEAT = [
  [5, 9, 11, 10, 6, 4, 7, 8, 9, 6],
  [6, 10, 12, 9, 5, 5, 8, 9, 10, 7],
  [5, 8, 10, 9, 6, 4, 6, 8, 8, 5],
  [7, 11, 12, 10, 6, 5, 7, 9, 11, 8],
  [6, 9, 10, 8, 5, 4, 6, 7, 6, 4],
  [3, 6, 8, 7, 4, 2, 2, 1, 1, 0],
  [1, 2, 3, 3, 2, 1, 1, 1, 0, 0],
];
const APPTS = {
  today: [
    ['09:00', 'Maya Chen', 'Sarah Johnson', 'video', 'Completed'],
    ['09:30', 'Omar Haddad', 'Amir Rahman', 'person', 'Completed'],
    ['10:15', 'Grace Okafor', 'Emily Davis', 'video', 'In progress'],
    ['10:30', 'Lucas Silva', 'Sarah Johnson', 'video', 'Waiting room'],
    ['11:00', 'Priya Nair', 'Kenji Watanabe', 'video', 'Confirmed'],
    ['11:45', 'Daniel Kim', 'Amir Rahman', 'person', 'Confirmed'],
    ['13:30', 'Sofia Rossi', 'Emily Davis', 'video', 'Confirmed'],
    ['14:15', 'Noah Williams', 'Sarah Johnson', 'video', 'Pending'],
  ],
  upcoming: [
    ['Fri 09:00', 'Aisha Bello', 'Emily Davis', 'video', 'Confirmed'],
    ['Fri 09:45', 'Tom Becker', 'Kenji Watanabe', 'person', 'Confirmed'],
    ['Fri 11:15', 'Lena Park', 'Sarah Johnson', 'video', 'Pending'],
    ['Mon 08:30', 'Carlos Mendes', 'Amir Rahman', 'video', 'Confirmed'],
    ['Mon 10:00', 'Hannah Lee', 'Emily Davis', 'video', 'Confirmed'],
    ['Mon 13:15', 'Yusuf Demir', 'Sarah Johnson', 'person', 'Pending'],
  ],
};

/* ------------------------------------------------------------------ small SVG helpers */
const niceStep = (v: number) => { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
const ticksFor = (max: number) => { const st = niceStep(max / 3); const out: number[] = []; for (let t = 0; t <= max + 1e-9; t += st) out.push(t); return out; };
const niceMax = (v: number) => { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
function colPath(x: number, y: number, w: number, h: number, r: number) {
  // column with a rounded data end (top) and a square base
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

/* ------------------------------------------------------------------ tooltip (one per app) */
function makeTip(root: HTMLElement): Tip {
  const tip = document.createElement('div');
  tip.className = 'tmd-tip';
  tip.setAttribute('role', 'status');
  root.appendChild(tip);
  const local = (clientX: number, clientY: number) => {
    const r = root.getBoundingClientRect();
    const k = root.offsetWidth / r.width;
    return [(clientX - r.left) * k, (clientY - r.top) * k];
  };
  return {
    show(clientX: number, clientY: number, value: string, label: string, color?: string) {
      tip.textContent = '';
      const b = document.createElement('b'); b.textContent = value;
      const s = document.createElement('span');
      if (color) { const i = document.createElement('i'); i.style.background = color; s.appendChild(i); }
      s.appendChild(document.createTextNode(label));
      tip.append(b, s);
      const [x, y] = local(clientX, clientY);
      const w = root.offsetWidth;
      tip.style.left = Math.min(Math.max(x, 80), w - 80) + 'px';
      tip.style.top = y + 'px';
      tip.classList.add('on');
    },
    hide() { tip.classList.remove('on'); },
  };
}
function bindHits(el: HTMLElement, tip: Tip) {
  el.querySelectorAll<SVGElement>('[data-v]').forEach((m) => {
    const show = (e: Event) => {
      const r = m.getBoundingClientRect();
      const pe = e as PointerEvent;
      const x = pe && pe.clientX != null && e.type !== 'focus' ? pe.clientX : r.left + r.width / 2;
      tip.show(x, r.top, m.dataset.v ?? '', m.dataset.l ?? '', m.dataset.c);
    };
    m.addEventListener('pointerenter', show);
    m.addEventListener('pointermove', show);
    m.addEventListener('pointerleave', () => tip.hide());
    m.addEventListener('focus', show);
    m.addEventListener('blur', () => tip.hide());
  });
}

/* ------------------------------------------------------------------ charts */
function trendChart(el: HTMLElement, pts: Point[], tip: Tip) {
  const W = 360, H = 176, L = 26, R = 30, T = 12, B = 22;
  const pw = W - L - R, ph = H - T - B;
  const max = niceMax(Math.max(...pts.map((p) => p.v)) * 1.1);
  const X = (i: number) => L + (pts.length === 1 ? pw / 2 : (i / (pts.length - 1)) * pw);
  const Y = (v: number) => T + ph - (v / max) * ph;
  const ticks = ticksFor(max);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const area = `${line}L${X(pts.length - 1).toFixed(1)},${T + ph}L${X(0).toFixed(1)},${T + ph}Z`;
  const step = Math.max(1, Math.round(pts.length / 4));
  const lab = pts.map((p, i) => ((pts.length - 1 - i) % step === 0 ? `<text x="${X(i).toFixed(1)}" y="${H - 5}" text-anchor="middle" font-size="10.5" fill="var(--a-muted)">${p.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>` : '')).join('');
  const last = pts[pts.length - 1];
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Appointments per day, ${pts.length} days, latest ${last.v}">
    ${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="${t ? 'var(--a-grid)' : 'var(--a-axis)'}" stroke-width="1"/><text x="${L - 8}" y="${Y(t) + 3.5}" text-anchor="end" font-size="10.5" fill="var(--a-muted)" class="num">${t}</text>`).join('')}
    <path d="${area}" fill="var(--a-s1-wash)"/>
    <path d="${line}" fill="none" stroke="var(--a-s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(pts.length - 1)}" cy="${Y(last.v)}" r="4.5" fill="var(--a-s1)" stroke="var(--a-surface)" stroke-width="2"/>
    <text x="${X(pts.length - 1) + 8}" y="${Y(last.v) + 4}" font-size="11" font-weight="700" fill="var(--a-ink)">${last.v}</text>
    ${lab}
    <g class="xh" opacity="0"><line x1="0" x2="0" y1="${T}" y2="${T + ph}" stroke="var(--a-ink-2)" stroke-width="1"/><circle r="4.5" fill="var(--a-s1)" stroke="var(--a-surface)" stroke-width="2"/></g>
    <rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent" class="ov"/>
  </svg>`;
  const svg = el.querySelector('svg')!, ov = el.querySelector('.ov')!, xh = el.querySelector('.xh')!;
  const move = (e: Event) => {
    const r = svg.getBoundingClientRect();
    const sx = (((e as PointerEvent).clientX - r.left) / r.width) * W;
    const i = Math.round(Math.min(Math.max((sx - L) / pw, 0), 1) * (pts.length - 1));
    const p = pts[i];
    xh.setAttribute('opacity', '1');
    xh.querySelector('line')!.setAttribute('x1', String(X(i))); xh.querySelector('line')!.setAttribute('x2', String(X(i)));
    xh.querySelector('circle')!.setAttribute('cx', String(X(i))); xh.querySelector('circle')!.setAttribute('cy', String(Y(p.v)));
    const cx = r.left + (X(i) / W) * r.width, cy = r.top + (Y(p.v) / H) * r.height;
    tip.show(cx, cy, `${p.v} visits`, p.d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), 'var(--a-s1)');
  };
  ov.addEventListener('pointermove', move);
  ov.addEventListener('pointerleave', () => { xh.setAttribute('opacity', '0'); tip.hide(); });
}

function donut(el: HTMLElement, counts: number[], tip: Tip) {
  const total = counts.reduce((a, b) => a + b, 0);
  const cx = 75, cy = 75, r = 58, sw = 18, gap = 2 / r; // 2px surface gap
  let a = 0;
  const segs = counts.map((n, i) => {
    const a0 = a, a1 = a + (n / total) * Math.PI * 2;
    a = a1;
    const pct = Math.round((n / total) * 100);
    return `<path d="${arc(cx, cy, r, a0 + gap / 2, a1 - gap / 2)}" fill="none" stroke="${STATUS[i].c}" stroke-width="${sw}" class="tmd-hit" tabindex="0" data-v="${fmt(n)} (${pct}%)" data-l="${STATUS[i].k}" data-c="${STATUS[i].c}"/>`;
  }).join('');
  el.innerHTML = `<div class="tmd-donut">
    <svg viewBox="0 0 150 150" role="img" aria-label="Appointment status: ${STATUS.map((s, i) => `${s.k} ${counts[i]}`).join(', ')}">
      ${segs}
      <text x="75" y="73" text-anchor="middle" font-size="24" font-weight="700" fill="var(--a-ink)">${fmt(total)}</text>
      <text x="75" y="91" text-anchor="middle" font-size="11" fill="var(--a-ink-2)">appointments</text>
    </svg>
    <ul class="tmd-status">${STATUS.map((s, i) => `<li><i style="background:${s.c}"></i>${s.k}<b class="num">${fmt(counts[i])}</b><em class="num">${Math.round((counts[i] / total) * 100)}%</em></li>`).join('')}</ul>
  </div>`;
  bindHits(el, tip);
}

function growth(el: HTMLElement, tip: Tip) {
  const W = 300, H = 170, L = 30, R = 6, T = 10, B = 22;
  const pw = W - L - R, ph = H - T - B;
  const max = niceMax(Math.max(...GROWTH.ret) * 1.05);
  const Y = (v: number) => T + ph - (v / max) * ph;
  const g = pw / MONTHS.length, bw = 11;
  let bars = '';
  MONTHS.forEach((m, i) => {
    const x0 = L + g * i + g / 2 - bw - 1;
    const hN = (GROWTH.newP[i] / max) * ph, hR = (GROWTH.ret[i] / max) * ph;
    bars += `<path d="${colPath(x0, T + ph - hN, bw, hN, 4)}" fill="var(--a-s2)" class="tmd-hit" tabindex="0" data-v="${GROWTH.newP[i]} new" data-l="${m} · new patients" data-c="var(--a-s2)"/>`;
    bars += `<path d="${colPath(x0 + bw + 2, T + ph - hR, bw, hR, 4)}" fill="var(--a-s1)" class="tmd-hit" tabindex="0" data-v="${GROWTH.ret[i]} returning" data-l="${m} · returning patients" data-c="var(--a-s1)"/>`;
    bars += `<text x="${L + g * i + g / 2}" y="${H - 5}" text-anchor="middle" font-size="10.5" fill="var(--a-muted)">${m}</text>`;
  });
  const ticks = ticksFor(max);
  el.innerHTML = `<div class="tmd-legend"><span><i style="background:var(--a-s2)"></i>New</span><span><i style="background:var(--a-s1)"></i>Returning</span></div>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Patients per month, new and returning">
    ${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="${t ? 'var(--a-grid)' : 'var(--a-axis)'}"/><text x="${L - 8}" y="${Y(t) + 3.5}" text-anchor="end" font-size="10.5" fill="var(--a-muted)">${t}</text>`).join('')}
    ${bars}
  </svg>`;
  bindHits(el, tip);
}

function revenue(el: HTMLElement, tip: Tip) {
  const W = 470, H = 186, L = 44, R = 10, T = 18, B = 22;
  const pw = W - L - R, ph = H - T - B;
  const max = 30000;
  const Y = (v: number) => T + ph - (v / max) * ph;
  const g = pw / MONTHS.length, bw = 24;
  const ticks = [0, 10000, 20000, 30000];
  let cols = '';
  REVENUE.forEach((v, i) => {
    const x = L + g * i + g / 2 - bw / 2, h = (v / max) * ph, cur = i === REVENUE.length - 1;
    cols += `<path d="${colPath(x, T + ph - h, bw, h, 4)}" fill="${cur ? 'var(--a-s1)' : 'var(--a-h3)'}" class="tmd-hit" tabindex="0" data-v="${money(v)}" data-l="${MONTHS[i]} revenue" data-c="var(--a-s1)"/>`;
    cols += `<text x="${L + g * i + g / 2}" y="${H - 5}" text-anchor="middle" font-size="10.5" fill="var(--a-muted)">${MONTHS[i]}</text>`;
    if (cur) cols += `<text x="${L + g * i + g / 2}" y="${T + ph - h - 7}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--a-ink)">$24.6k</text>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly revenue, April to September, latest ${money(REVENUE[5])}">
    ${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="${t ? 'var(--a-grid)' : 'var(--a-axis)'}"/><text x="${L - 8}" y="${Y(t) + 3.5}" text-anchor="end" font-size="10.5" fill="var(--a-muted)">${t ? '$' + t / 1000 + 'k' : '$0'}</text>`).join('')}
    ${cols}
  </svg>`;
  bindHits(el, tip);
}

function heatmap(el: HTMLElement, tip: Tip) {
  const W = 470, H = 176, L = 34, T = 4, B = 20;
  const cw = (W - L) / HOURS.length, ch = (H - T - B) / DAYS.length;
  const step = (v: number) => (v <= 0 ? 'var(--a-h1)' : v <= 3 ? 'var(--a-h1)' : v <= 6 ? 'var(--a-h2)' : v <= 8 ? 'var(--a-h3)' : v <= 10 ? 'var(--a-h4)' : 'var(--a-h5)');
  let cells = '';
  DAYS.forEach((d, r) => {
    cells += `<text x="${L - 8}" y="${T + ch * r + ch / 2 + 3.5}" text-anchor="end" font-size="10.5" fill="var(--a-muted)">${d}</text>`;
    HOURS.forEach((h, c) => {
      const v = HEAT[r][c];
      cells += `<rect x="${(L + cw * c + 1).toFixed(1)}" y="${(T + ch * r + 1).toFixed(1)}" width="${(cw - 2).toFixed(1)}" height="${(ch - 2).toFixed(1)}" rx="3" fill="${step(v)}" class="tmd-hit" tabindex="-1" data-v="${v} bookings" data-l="${d} ${h.replace('a', ' am').replace('p', ' pm')}"/>`;
    });
  });
  HOURS.forEach((h, c) => { if (c % 2 === 0) cells += `<text x="${L + cw * c + cw / 2}" y="${H - 5}" text-anchor="middle" font-size="10.5" fill="var(--a-muted)">${h}</text>`; });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bookings by weekday and hour; busiest weekday mornings 10 to 11 am">${cells}</svg>
  <div class="tmd-scale">Fewer ${['h1', 'h2', 'h3', 'h4', 'h5'].map((k) => `<i style="background:var(--a-${k})"></i>`).join('')} More</div>`;
  bindHits(el, tip);
}

/* ------------------------------------------------------------------ desktop workspace */
const NAV: ([string, string, Icon] | null)[] = [
  ['dashboard', 'Dashboard', 'dashboard'],
  ['appointments', 'Appointments', 'calendar'],
  null,
  ['doctors', 'Doctors', 'stethoscope'],
  ['patients', 'Patients', 'users'],
  ['services', 'Services', 'clipboard'],
  ['analytics', 'Analytics', 'pie'],
  ['finance', 'Financial report', 'receipt'],
  ['audit', 'Audit log', 'history'],
];

type Range = (typeof RANGES)[keyof typeof RANGES];
function kpiHTML(R: Range) {
  const tile = (ic: Icon, cls: string, lbl: string, val: string, d: number, unit = '%') => `<div class="tmd-card tmd-kpi"><span class="ico ${cls}">${icon(ic)}</span><span class="lbl">${lbl}</span><span class="val">${val}<span class="tmd-delta">${icon('arrowUp').replace('class="i"', 'class="i" style="width:13px;height:13px"')}${d}${unit}</span></span><span class="vs">vs previous period</span></div>`;
  return tile('calendarCheck', '', 'Total appointments', fmt(R.appts), R.apptsD)
    + tile('checkCircle', '', 'Completion rate', R.comp + '%', R.compD, ' pts')
    + tile('userPlus', 'coral', 'New patients', fmt(R.newP), R.newD)
    + tile('dollar', '', 'Revenue', money(R.rev), R.revD);
}

function badge(status: string) {
  const map: Record<string, string> = { 'Completed': 'ok', 'In progress': 'live', 'Waiting room': 'wait', 'Confirmed': '', 'Pending': 'wait' };
  return `<span class="tmd-badge ${map[status] || ''}"><i></i>${esc(status)}</span>`;
}
function apptRows(list: string[][]) {
  return list.map(([t, p, d, type, st]) => {
    const initials = p.split(' ').map((w) => w[0]).join('');
    const canJoin = type === 'video' && (st === 'In progress' || st === 'Waiting room');
    return `<tr><td class="num"><b>${esc(t)}</b></td><td><span class="tmd-doc"><span class="tmd-ava">${initials}</span>${esc(p)}</span></td><td>Dr. ${esc(d)}</td>
      <td>${type === 'video' ? `<span class="tmd-badge video">${icon('video').replace('class="i"', 'class="i" style="width:13px;height:13px"')}Video</span>` : '<span class="tmd-badge">In person</span>'}</td>
      <td>${badge(st)}</td>
      <td style="text-align:right">${canJoin ? `<button class="tmd-join" type="button">${icon('video')}Join</button>` : '<button class="tmd-join ghost" type="button">View</button>'}</td></tr>`;
  }).join('');
}

export function mountDesk(root: HTMLElement, { onDemo, brand }: { onDemo?: () => void; brand: BrandSources }) {
  root.classList.add('tmd-app', 'tmd-desk');
  root.dataset.theme = root.dataset.theme || 'light';
  root.innerHTML = `
  <aside class="tmd-side" aria-label="Workspace navigation">
    <div class="tmd-brand"><span class="word">${svgTag(brand.wordmark)}</span><span class="mark">${svgTag(brand.mark)}</span></div>
    <nav class="tmd-nav">${NAV.map((n) => (n ? `<button type="button" data-nav="${n[0]}"${n[0] === 'analytics' ? ' aria-current="page"' : ''}>${icon(n[2])}<span class="lbl">${n[1]}</span></button>` : '<hr>')).join('')}</nav>
    <div class="tmd-user"><span class="tmd-ava">RF</span><span class="who"><b>Riverside Clinic</b><span>Pro plan · Admin</span></span><button class="more" type="button" aria-label="Account menu">${icon('more')}</button></div>
  </aside>
  <section class="tmd-main">
    <header class="tmd-top">
      <button class="tmd-iconbtn" type="button" data-act="collapse" aria-label="Collapse sidebar">${icon('panel')}</button>
      <span class="tmd-crumb">Riverside Clinic / <b data-crumb>Analytics</b></span>
      <label class="tmd-search">${icon('search')}<input type="search" placeholder="Search patients, visits, doctors" aria-label="Search"><kbd>⌘K</kbd></label>
      <button class="tmd-iconbtn" type="button" aria-label="Notifications">${icon('bell')}<span class="dot"></span></button>
      <div class="tmd-theme" role="group" aria-label="Theme"><button type="button" data-theme-set="light" aria-pressed="true" aria-label="Light theme">${icon('sun')}</button><button type="button" data-theme-set="dark" aria-pressed="false" aria-label="Dark theme">${icon('moon')}</button></div>
    </header>
    <div class="tmd-scroll">
      <div class="tmd-view" data-view="analytics">
        <div class="tmd-head"><h2>Analytics</h2><span class="tmd-pill">519 active patients</span>
          <div class="tmd-filters"><div class="tmd-seg" role="group" aria-label="Period">${['7D', '30D', '90D'].map((k) => `<button type="button" data-range="${k}" aria-pressed="${k === '30D'}">${k}</button>`).join('')}</div>
          <button class="tmd-btn" type="button">${icon('mapPin')}All locations${icon('chevronDown')}</button><button class="tmd-btn" type="button">${icon('download')}Export</button></div></div>
        <div class="tmd-kpis" data-kpis></div>
        <div class="tmd-row r3">
          <div class="tmd-card chart"><div class="tmd-ch"><h3>Appointment trends</h3><span class="cap" data-cap>Last 30 days</span></div><div class="tmd-plot" data-chart="trend"></div></div>
          <div class="tmd-card chart"><div class="tmd-ch"><h3>Appointment status</h3><span class="cap" data-cap>Last 30 days</span></div><div class="tmd-plot" data-chart="status"></div></div>
          <div class="tmd-card chart"><div class="tmd-ch"><h3>Patient growth</h3><span class="cap">Last 6 months</span></div><div class="tmd-plot" data-chart="growth"></div></div>
        </div>
        <div class="tmd-row r2a">
          <div class="tmd-card chart"><div class="tmd-ch"><h3>Doctor performance</h3><span class="cap">This month</span></div>
            <table class="tmd-table"><thead><tr><th>#</th><th>Doctor</th><th>Visits</th><th>Utilization</th><th style="text-align:right">Revenue</th></tr></thead><tbody>
            ${DOCTORS.map((d, i) => `<tr><td class="num">${i + 1}</td><td><span class="tmd-doc"><span class="tmd-ava">${d[1]}</span>Dr. ${d[0]}</span></td><td class="num">${d[2]}</td><td><span class="tmd-meter"><span><i style="width:${d[3]}%"></i></span><b class="num">${d[3]}%</b></span></td><td class="num" style="text-align:right">${money(d[4])}</td></tr>`).join('')}
            </tbody></table></div>
          <div class="tmd-card chart"><div class="tmd-ch"><h3>Top services</h3><span class="cap">This month</span></div>
            <ul class="tmd-bars">${SERVICES.map(([n, v]) => `<li><span>${n}</span><span class="bar"><i style="width:${(v / 112) * 100}%"></i></span><b class="num">${v}</b></li>`).join('')}</ul></div>
        </div>
        <div class="tmd-row r2b">
          <div class="tmd-card chart"><div class="tmd-ch"><h3>Revenue</h3><span class="cap">Last 6 months</span></div><div class="tmd-plot" data-chart="revenue"></div></div>
          <div class="tmd-card chart"><div class="tmd-ch"><h3>Peak booking hours</h3><span class="cap">Last 30 days</span></div><div class="tmd-plot" data-chart="heat"></div></div>
        </div>
      </div>
      <div class="tmd-view" data-view="appointments" hidden>
        <div class="tmd-head"><h2>Appointments</h2><span class="tmd-pill">18 today</span><div class="tmd-filters"><button class="tmd-btn" type="button">${icon('mapPin')}All locations${icon('chevronDown')}</button><button class="tmd-btn primary" type="button">${icon('plus')}New appointment</button></div></div>
        <div class="tmd-card chart">
          <div class="tmd-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="today">Today</button><button type="button" role="tab" aria-selected="false" data-tab="upcoming">Upcoming</button></div>
          <table class="tmd-table"><thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th><th></th></tr></thead><tbody data-appts>${apptRows(APPTS.today)}</tbody></table>
        </div>
      </div>
    </div>
  </section>
  <div class="tmd-toast" role="status"><span data-toast-text></span><a href="#demo" data-demo>Book a demo</a></div>`;

  const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const tip = makeTip(root);
  const renderRange = (k: string) => {
    const R = RANGES[k as keyof typeof RANGES];
    q('[data-kpis]').innerHTML = kpiHTML(R);
    root.querySelectorAll('[data-cap]').forEach((c) => { c.textContent = R.label; });
    trendChart(q('[data-chart="trend"]'), R.trend, tip);
    donut(q('[data-chart="status"]'), R.status, tip);
    root.querySelectorAll<HTMLElement>('[data-range]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.range === k)));
  };
  renderRange('30D');
  growth(q('[data-chart="growth"]'), tip);
  revenue(q('[data-chart="revenue"]'), tip);
  heatmap(q('[data-chart="heat"]'), tip);

  let toastTimer = 0;
  const toast = (text: string) => {
    const t = q('.tmd-toast');
    q('[data-toast-text]').textContent = text;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => t.classList.remove('on'), 3600);
  };
  const views: Record<string, string> = { analytics: 'Analytics', appointments: 'Appointments' };
  const onClick = (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>('button, a');
    if (!b) return;
    if (b.dataset.range) renderRange(b.dataset.range);
    else if (b.dataset.nav) {
      const k = b.dataset.nav === 'dashboard' ? 'analytics' : b.dataset.nav;
      if (views[k]) {
        root.querySelectorAll('[data-nav]').forEach((n) => n.removeAttribute('aria-current'));
        b.setAttribute('aria-current', 'page');
        root.querySelectorAll<HTMLElement>('.tmd-view').forEach((v) => { v.hidden = v.dataset.view !== k; });
        q('[data-crumb]').textContent = views[k];
        q('.tmd-scroll').scrollTop = 0;
      } else {
        toast(`${(b.textContent ?? '').trim()} is part of the full workspace.`);
      }
    } else if (b.dataset.themeSet) {
      root.dataset.theme = b.dataset.themeSet;
      root.querySelectorAll('[data-theme-set]').forEach((t) => t.setAttribute('aria-pressed', String(t === b)));
    } else if (b.dataset.act === 'collapse') {
      root.classList.toggle('is-collapsed');
    } else if (b.dataset.tab) {
      root.querySelectorAll('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t === b)));
      q('[data-appts]').innerHTML = apptRows(APPTS[b.dataset.tab as keyof typeof APPTS]);
    } else if (b.matches('.tmd-join') || b.matches('.tmd-btn')) {
      const label = (b.textContent ?? '').trim();
      toast(label === 'Join' ? 'Joining opens the video visit for the clinician.' : `${label} opens in the full workspace.`);
    } else if (b.dataset.demo != null && onDemo) {
      e.preventDefault();
      onDemo();
    }
  };
  root.addEventListener('click', onClick);
  return {
    root,
    dispose() {
      root.removeEventListener('click', onClick);
      clearTimeout(toastTimer);
      root.innerHTML = '';
    },
  };
}

/* ------------------------------------------------------------------ compact portrait view */
export function mountCompact(root: HTMLElement, { brand }: { brand: BrandSources }) {
  root.classList.add('tmd-app', 'tmd-compact');
  root.dataset.theme = root.dataset.theme || 'light';
  const row = (t: string, p: string, type: string, st: string) => `<div class="tmd-c-row"><time class="num">${t}</time><span class="p"><b>${p}</b><span>${type === 'video' ? icon('video') + 'Video visit' : icon('building') + 'In person'}</span></span>${badge(st)}</div>`;
  root.innerHTML = `
    <div class="tmd-c-top"><span class="mark">${svgTag(brand.mark)}</span><span class="t"><b>Today</b><span>Riverside Clinic · Thu, Sep 24</span></span><span class="tmd-ava">SJ</span></div>
    <div class="tmd-c-body">
      <div class="tmd-c-kpis"><div><b class="num">18</b><span>visits today</span></div><div><b class="num">3</b><span>in waiting room</span></div><div><b class="num">92%</b><span>on time</span></div></div>
      <div class="tmd-next"><small>Up next · 10:30</small><span class="tmd-ava">LS</span><span class="p"><b>Lucas Silva</b><span>${icon('video')}Follow-up · Waiting room</span></span><button class="tmd-join" type="button">${icon('video')}Join</button></div>
      <div class="tmd-c-list"><h4>Schedule <span>See all</span></h4>
        ${row('10:15', 'Grace Okafor', 'video', 'In progress')}
        ${row('11:00', 'Priya Nair', 'video', 'Confirmed')}
        ${row('11:45', 'Daniel Kim', 'person', 'Confirmed')}
        ${row('13:30', 'Sofia Rossi', 'video', 'Confirmed')}
      </div>
    </div>
    <nav class="tmd-c-tabs" aria-label="App sections"><span class="on">${icon('home')}Today</span><span>${icon('calendar')}Schedule</span><span>${icon('users')}Patients</span><span>${icon('message')}Messages</span></nav>`;
  return {
    root,
    dispose() {
      root.innerHTML = '';
    },
  };
}
