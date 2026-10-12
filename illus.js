'use strict';

/* Inline SVG illustrations for the technique tab, keyed by card heading.
   Stylised diagrams (not to scale), drawn for this app. */
const ILLUS = (() => {
  const G9 = '#052e1f', G8 = '#0a6b46', LIME = '#d4ff3a', COURT = '#236a49';
  const svg = (vb, inner) =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Prompt, sans-serif" font-size="11">${inner}</svg>`;
  const defs = `<defs>
    <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${LIME}"/></marker>
    <marker id="ad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${G8}"/></marker></defs>`;
  const txt = (x, y, s, o = '') => `<text x="${x}" y="${y}" text-anchor="middle" ${o}>${s}</text>`;
  const dot = (x, y, c = LIME, r = 9, l = '') =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${G9}" stroke-width="2"/>` +
    (l ? txt(x, y + 4, l, `fill="${G9}" font-weight="700"`) : '');

  /* ---------- top-view court (220 x 240) ---------- */
  const courtLines = `<g fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2">
      <rect x="20" y="10" width="180" height="220"/><line x1="20" y1="120" x2="200" y2="120" stroke-width="4"/>
      <line x1="33" y1="10" x2="33" y2="230"/><line x1="187" y1="10" x2="187" y2="230"/>
      <line x1="20" y1="86" x2="200" y2="86"/><line x1="20" y1="154" x2="200" y2="154"/>
      <line x1="110" y1="10" x2="110" y2="86"/><line x1="110" y1="154" x2="110" y2="230"/>
      <line x1="20" y1="22" x2="200" y2="22"/><line x1="20" y1="218" x2="200" y2="218"/></g>`;
  const court = inner => svg('0 0 220 240', `${defs}<rect width="220" height="240" rx="14" fill="${COURT}"/>${courtLines}${inner}`);

  /* ---------- side view (300 x 150) ---------- */
  const fig = (x, dir) => `<g stroke="${G9}" stroke-width="3" stroke-linecap="round" fill="none">
      <circle cx="${x}" cy="80" r="7" fill="#fff"/><line x1="${x}" y1="87" x2="${x}" y2="108"/>
      <line x1="${x}" y1="108" x2="${x - 8}" y2="130"/><line x1="${x}" y1="108" x2="${x + 8}" y2="130"/>
      <line x1="${x}" y1="93" x2="${x + 15 * dir}" y2="76"/><line x1="${x + 15 * dir}" y1="76" x2="${x + 23 * dir}" y2="58" stroke-width="2"/>
      <ellipse cx="${x + 27 * dir}" cy="50" rx="6" ry="10" stroke-width="2"/></g>`;
  const side = (path, label, extra = '') => svg('0 0 300 150', `${defs}
      <rect width="300" height="150" rx="14" fill="#e6f2ea"/>
      <line x1="10" y1="130" x2="290" y2="130" stroke="${G8}" stroke-width="3"/>
      <rect x="148" y="92" width="4" height="38" fill="${G9}"/><rect x="145" y="90" width="10" height="4" rx="2" fill="#fff" stroke="${G9}"/>
      ${fig(40, 1)}${fig(262, -1)}${extra}
      <path d="${path}" fill="none" stroke="${G8}" stroke-width="3.5" stroke-dasharray="7 5" marker-end="url(#ad)"/>
      ${txt(150, 18, label, `fill="${G9}" font-size="13" font-weight="700"`)}
      ${txt(150, 146, 'เน็ต', `fill="${G8}" font-size="10"`)}`);

  /* ---------- grip: end view of the handle ---------- */
  const oct = (cx, cy, r) => {
    const p = [];
    for (let k = 0; k < 8; k++) { const a = (Math.PI / 4) * k + Math.PI / 8; p.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`); }
    return p.join(' ');
  };
  const handle = (cx, cy) => `<polygon points="${oct(cx, cy, 46)}" fill="#e9dcc3" stroke="${G9}" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="4" fill="${G9}"/>`;
  const grip = svg('0 0 300 150', `${defs}<rect width="300" height="150" rx="14" fill="#e6f2ea"/>
      ${txt(75, 18, 'โฟร์แฮนด์', `fill="${G9}" font-size="13" font-weight="700"`)}
      ${txt(225, 18, 'แบ็กแฮนด์', `fill="${G9}" font-size="13" font-weight="700"`)}
      ${handle(75, 78)}${handle(225, 78)}
      <!-- forehand: V between thumb and index on the upper bevel -->
      <path d="M45 52 L75 32 L105 52" fill="none" stroke="#e8508f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      ${txt(75, 28, 'ร่อง V', `fill="#e8508f" font-weight="700"`)}
      <!-- backhand: thumb flat on the broad face -->
      <rect x="259" y="56" width="10" height="44" rx="5" fill="#2f7de1"/>
      ${txt(285, 80, 'โป้ง', `fill="#2f7de1" font-weight="700" font-size="10"`)}
      ${txt(75, 140, 'มุมมองปลายด้ามไม้ (โดยประมาณ)', `fill="${G8}" font-size="9.5"`)}
      ${txt(225, 140, 'นิ้วโป้งแนบด้านกว้าง', `fill="${G8}" font-size="9.5"`)}`);

  /* ---------- ready position ---------- */
  const ready = svg('0 0 300 190', `${defs}<rect width="300" height="190" rx="14" fill="#e6f2ea"/>
      <line x1="10" y1="172" x2="290" y2="172" stroke="${G8}" stroke-width="3"/>
      <g stroke="${G9}" stroke-width="5" stroke-linecap="round" fill="none">
        <circle cx="130" cy="42" r="12" fill="#fff"/><line x1="130" y1="54" x2="134" y2="105"/>
        <polyline points="134,105 112,138 118,170"/><polyline points="134,105 158,136 164,170"/>
        <polyline points="131,68 160,88 188,70"/>
        <line x1="188" y1="70" x2="206" y2="32" stroke-width="3"/><ellipse cx="212" cy="18" rx="10" ry="16" transform="rotate(20 212 18)" stroke-width="3"/></g>
      ${txt(60, 138, 'เข่างอ', `fill="${G9}" font-weight="700"`)}<path d="M82 134 L108 136" stroke="${G8}" stroke-width="2" marker-end="url(#ad)"/>
      ${txt(236, 100, 'ไม้อยู่หน้าลำตัว', `fill="${G9}" font-weight="700"`)}<path d="M205 96 L192 82" stroke="${G8}" stroke-width="2" marker-end="url(#ad)"/>
      ${txt(220, 160, 'น้ำหนักที่ปลายเท้า', `fill="${G9}" font-weight="700"`)}<path d="M178 156 L168 168" stroke="${G8}" stroke-width="2" marker-end="url(#ad)"/>
      ${txt(90, 24, 'สายตามองลูก', `fill="${G9}" font-weight="700"`)}`);

  /* ---------- split step: timeline ---------- */
  const box = (x, c, t1, t2) => `<rect x="${x}" y="40" width="86" height="70" rx="12" fill="${c}"/>
      ${txt(x + 43, 66, t1, `fill="#fff" font-weight="700" font-size="13"`)}${txt(x + 43, 88, t2, `fill="#fff" font-size="10.5"`)}`;
  const split = svg('0 0 300 150', `${defs}<rect width="300" height="150" rx="14" fill="#e6f2ea"/>
      ${box(10, '#58705f', '1. คู่แข่งตี', 'ยืนท่าเตรียม')}${box(107, G8, '2. ย่อกระโดด', 'ลงพื้นพร้อมกัน')}${box(204, G9, '3. ออกตัว', 'ไปทางที่ลูกมา')}
      <path d="M98 75 L106 75" stroke="${G8}" stroke-width="3" marker-end="url(#ad)"/><path d="M195 75 L203 75" stroke="${G8}" stroke-width="3" marker-end="url(#ad)"/>
      ${txt(150, 22, 'Split step', `fill="${G9}" font-size="14" font-weight="700"`)}
      ${txt(150, 134, 'จังหวะลงพื้น = จังหวะที่คู่แข่งกระทบลูก', `fill="${G8}" font-size="11"`)}`);

  /* ---------- home position + footwork ---------- */
  const spots = [[48, 138], [172, 138], [40, 178], [180, 178], [48, 214], [172, 214]];
  const foot = court(`<rect x="20" y="10" width="180" height="110" fill="#000" opacity=".18"/>
      ${spots.map(([x, y]) => `<path d="M110 176 L${x + (110 - x) * .18} ${y + (176 - y) * .18}" stroke="${LIME}" stroke-width="2.5" marker-end="url(#ah)" stroke-dasharray="5 3"/>${dot(x, y, '#fff', 6)}`).join('')}
      ${dot(110, 176, LIME, 11, '🏠')}
      ${txt(110, 232, 'ออกไปตี แล้วกลับกลางคอร์ดทุกครั้ง', `fill="#fff" font-size="10"`)}`);

  /* ---------- serve ---------- */
  const serve = court(`<rect x="110" y="154" width="90" height="76" fill="${LIME}" opacity=".28"/>
      <rect x="20" y="10" width="90" height="76" fill="#fff" opacity=".22"/>
      ${dot(150, 178, LIME, 10, 'S')}${dot(66, 52, '#fff', 10, 'R')}
      <path d="M146 168 Q 70 120 70 62" fill="none" stroke="${LIME}" stroke-width="3" stroke-dasharray="7 4" marker-end="url(#ah)"/>
      ${txt(155, 205, 'ช่องเสิร์ฟ', `fill="#fff" font-size="10"`)}${txt(66, 30, 'ช่องรับ', `fill="#fff" font-size="10"`)}
      ${txt(110, 234, 'แต้มคู่ → ช่องขวา • แต้มคี่ → ช่องซ้าย', `fill="#fff" font-size="10"`)}`);

  /* ---------- doubles formations ---------- */
  const half = (x, ps, title, sub) => `<rect x="${x}" y="30" width="130" height="150" rx="6" fill="${COURT}"/>
      <g stroke="#fff" stroke-width="2" fill="none"><rect x="${x + 6}" y="36" width="118" height="138"/><line x1="${x}" y1="30" x2="${x + 130}" y2="30" stroke-width="5"/></g>
      ${ps.map(([px, py, l]) => dot(x + px, py, LIME, 11, l)).join('')}
      ${txt(x + 65, 198, title, `fill="${G9}" font-size="13" font-weight="700"`)}${txt(x + 65, 214, sub, `fill="${G8}" font-size="10.5"`)}`;
  const doubles = svg('0 0 300 224', `${defs}<rect width="300" height="224" rx="14" fill="#e6f2ea"/>
      ${half(10, [[65, 80, 'A'], [65, 142, 'B']], 'รุก: หน้า-หลัง', 'ได้ลูกสูง ให้กดลง')}
      ${half(160, [[36, 95, 'A'], [94, 95, 'B']], 'รับ: ซ้าย-ขวา', 'ดูแลครึ่งสนามคนละฝั่ง')}
      ${txt(150, 20, 'ตำแหน่งยืนฝั่งเรา (เน็ตอยู่ด้านบน)', `fill="${G9}" font-size="11"`)}`);

  const midGap = court(`${dot(60, 175, LIME, 10, 'A')}${dot(160, 175, LIME, 10, 'B')}
      <rect x="95" y="150" width="30" height="75" fill="#e8508f" opacity=".45"/>
      <path d="M110 60 L110 148" stroke="${LIME}" stroke-width="3" stroke-dasharray="6 4" marker-end="url(#ah)"/>
      ${dot(110, 40, '#fff', 10, '⚔')}
      ${txt(110, 232, 'ช่องกลางระหว่างสองคน = จุดอ่อน', `fill="#fff" font-size="10"`)}`);

  return {
    'จับแบบจับมือ (Forehand grip)': grip,
    'ท่าเตรียม (Ready position)': ready,
    'Split step': split,
    'กลับตำแหน่งกลางสนาม': foot,
    'เสิร์ฟสั้น (ประเภทคู่)': serve,
    'การนับแต้ม': serve,
    'เคลียร์ (Clear)': side('M62 72 Q170 -35 266 126', 'เคลียร์: สูงและลึกไปท้ายคอร์ด'),
    'ดรอป (Drop shot)': side('M60 72 Q118 32 172 127', 'ดรอป: ตกใกล้เน็ตฝั่งตรงข้าม'),
    'สแมช (Smash)': side('M62 34 L214 127', 'สแมช: ตีลงชัน เร็ว แรง'),
    'หยอดหน้าเน็ต (Net shot)': side('M138 100 Q152 84 168 127', 'หยอดเน็ต: เฉียดเน็ตแล้วตกชิดเน็ต'),
    'ไดรฟ์ (Drive) และการรับ': side('M68 70 L250 108', 'ไดรฟ์: ตีเร็ว ขนานพื้น ระดับเอว-อก'),
    'ตำแหน่งยืน': doubles,
    'การสื่อสาร': midGap,
  };
})();
