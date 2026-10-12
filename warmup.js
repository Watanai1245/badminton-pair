'use strict';

/* ================= Warm-up / cool-down tab ================= */
(() => {
  // q = included in the quick (~5 min) routine
  const WARM = [
    { e: '🏃', n: 'วิ่งเหยาะ / เดินเร็ว รอบคอร์ด', s: 60, q: true, d: 'วิ่งช้าๆ ให้หัวใจเต้นเร็วขึ้นและร่างกายอุ่น หายใจสม่ำเสมอ' },
    { e: '🔄', n: 'หมุนข้อเท้า ข้อเข่า สะโพก', s: 40, q: true, d: 'หมุนข้างละ 5–6 รอบ ค่อยๆ เพิ่มวง ช่วยลดโอกาสข้อเท้าพลิก' },
    { e: '💪', n: 'หมุนไหล่ และวงแขนใหญ่', s: 40, q: true, d: 'หมุนแขนเป็นวงใหญ่ไปหน้า-หลัง สลับทิศ ไหล่คือจุดที่ใช้หนักที่สุดตอนตี' },
    { e: '🖐️', n: 'หมุนข้อมือ และกำ-แบมือ', s: 30, d: 'หมุนข้อมือทั้งสองข้าง กำแบมือเร็วๆ เตรียมข้อมือสำหรับตวัดไม้' },
    { e: '🤸', n: 'Jumping Jack', s: 40, q: true, d: 'กระโดดแยกขา-แขนเหนือหัว จังหวะสม่ำเสมอ เพิ่มอัตราการเต้นหัวใจ' },
    { e: '🦵', n: 'Lunge เดินก้าวยาว สลับขา', s: 40, d: 'ก้าวยาวไปข้างหน้า ย่อให้เข่าหน้าไม่เลยปลายเท้า หลังตรง ท่านี้เหมือนการเอื้อมตีหน้าเน็ต' },
    { e: '↔️', n: 'Side Shuffle ก้าวข้างซ้าย-ขวา', s: 40, q: true, d: 'ย่อเข่า ก้าวข้างเร็วๆ โดยไม่ไขว้เท้า ฝึกการเคลื่อนที่ในคอร์ด' },
    { e: '🌀', n: 'บิดลำตัว หมุนเอว', s: 30, d: 'เท้ากว้างเท่าไหล่ บิดลำตัวซ้าย-ขวาพร้อมแกว่งแขน ใช้เตรียมแรงจากลำตัวสำหรับตีลูก' },
    { e: '🏸', n: 'ตีเงา (Shadow swing)', s: 45, q: true, d: 'แกว่งไม้เปล่า ทั้งโฟร์แฮนด์ แบ็กแฮนด์ และท่าตีลูกสูง เริ่มเบาแล้วเพิ่มความเร็ว' },
    { e: '👣', n: 'ฟุตเวิร์ก 6 มุม', s: 60, d: 'ยืนกลางคอร์ด ก้าวไปมุมหน้า-กลาง-หลังทั้งสองฝั่ง แล้วกลับกลางทุกครั้ง' },
    { e: '🏸', n: 'ตีเคลียร์เบาๆ กับเพื่อน', s: 120, d: 'ตีลูกสูงไปหลังคอร์ดด้วยแรงประมาณ 50–60% ยังไม่ต้องสแมช ให้ไหล่ค่อยๆ อุ่น' },
  ];
  const COOL = [
    { e: '🌬️', n: 'เดินช้าๆ หายใจลึก', s: 60, q: true, d: 'ให้หัวใจเต้นช้าลง หายใจเข้าลึก ออกยาว' },
    { e: '🦵', n: 'ยืดน่อง (ซ้าย-ขวา)', s: 60, q: true, d: 'ก้าวขาไปหลัง ส้นเท้าติดพื้น โน้มตัวไปหน้า ค้างข้างละ 30 วินาที' },
    { e: '🦵', n: 'ยืดต้นขาด้านหน้า', s: 60, q: true, d: 'ยืนขาเดียว ดึงข้อเท้าไปชิดก้น ค้างข้างละ 30 วินาที ประคองกำแพงได้' },
    { e: '🧘', n: 'ยืดต้นขาด้านหลัง', s: 60, d: 'นั่งเหยียดขาข้างเดียว โน้มตัวไปปลายเท้าช้าๆ ข้างละ 30 วินาที' },
    { e: '💪', n: 'ยืดไหล่ (ดึงแขนข้ามอก)', s: 60, q: true, d: 'ดึงแขนข้ามอกด้วยแขนอีกข้าง ค้างข้างละ 30 วินาที โดยเฉพาะแขนข้างที่ตี' },
    { e: '💪', n: 'ยืดหลังแขน (ไตรเซ็ป)', s: 40, d: 'ยกแขนเหนือหัว งอศอกให้มือไปหลังคอ ใช้มืออีกข้างกดศอกเบาๆ ข้างละ 20 วินาที' },
    { e: '🖐️', n: 'ยืดข้อมือ', s: 40, q: true, d: 'เหยียดแขนตรง ใช้มืออีกข้างกดมือขึ้นและลง ค้างอย่างละ 10 วินาที' },
  ];

  const $w = s => document.querySelector(s);
  let kind = 'warm', len = 'q';
  const fmt = s => s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} นาที` : `${s} วิ`;
  const items = () => (kind === 'warm' ? WARM : COOL).filter(x => len === 'f' || x.q);

  function renderList() {
    document.querySelectorAll('#wuKind button').forEach(b => b.classList.toggle('on', b.dataset.k === kind));
    document.querySelectorAll('#wuLen button').forEach(b => b.classList.toggle('on', b.dataset.l === len));
    const list = items(), total = list.reduce((a, x) => a + x.s, 0);
    $w('#wuSummary').textContent = `${list.length} ท่า • รวมประมาณ ${Math.round(total / 60)} นาที`;
    $w('#wuStart').textContent = kind === 'warm' ? '▶ เริ่มวอร์มอัพ' : '▶ เริ่มคูลดาวน์';
    $w('#wuList').innerHTML = list.map((x, i) => `<div class="ex">
        <span class="em">${x.e}</span>
        <div class="tx"><b>${i + 1}. ${x.n}</b><small>${x.d}</small></div>
        <span class="dur">${fmt(x.s)}</span></div>`).join('');
  }

  $w('#wuKind').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { kind = b.dataset.k; renderList(); } });
  $w('#wuLen').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { len = b.dataset.l; renderList(); } });

  /* ---------- guided player ---------- */
  const C = 2 * Math.PI * 54;
  let seq = [], idx = 0, left = 0, paused = false, timer = null;
  const ring = $w('#plRing');
  ring.style.strokeDasharray = C;

  function show() {
    const x = seq[idx];
    $w('#plStep').textContent = `ท่าที่ ${idx + 1} / ${seq.length}`;
    $w('#plEmoji').textContent = x.e; $w('#plName').textContent = x.n; $w('#plDesc').textContent = x.d;
    $w('#plNext').textContent = seq[idx + 1] ? `ถัดไป: ${seq[idx + 1].n}` : 'ท่าสุดท้ายแล้ว!';
    left = x.s; tick(true);
  }
  function tick(initial) {
    const x = seq[idx];
    $w('#plTime').textContent = left;
    ring.style.strokeDashoffset = C * (1 - left / x.s);
    if (!initial && left <= 3 && left > 0) beep(660, 90);
  }
  function loop() {
    if (paused) return;
    left--;
    if (left <= 0) { next(); return; }
    tick();
  }
  function next() {
    if (idx >= seq.length - 1) return finish();
    idx++; beep(988, 220); if (navigator.vibrate) navigator.vibrate(120); show();
  }
  function finish() {
    clearInterval(timer);
    beep(988, 200); setTimeout(() => beep(1318, 300), 220);
    $w('#plEmoji').textContent = '🎉'; $w('#plName').textContent = kind === 'warm' ? 'วอร์มอัพเสร็จแล้ว!' : 'คูลดาวน์เสร็จแล้ว!';
    $w('#plDesc').textContent = kind === 'warm' ? 'ร่างกายพร้อมแล้ว ลงคอร์ดได้เลย 🏸' : 'ดื่มน้ำและพักผ่อนให้เพียงพอ แล้วเจอกันครั้งหน้า';
    $w('#plNext').textContent = ''; $w('#plTime').textContent = '✓'; ring.style.strokeDashoffset = 0;
    $w('#plStep').textContent = 'เสร็จสิ้น';
  }
  function close() { clearInterval(timer); $w('#wuPlayer').classList.add('hidden'); keepAwake(false); }

  $w('#wuStart').addEventListener('click', () => {
    seq = items(); idx = 0; paused = false;
    $w('#plPause').textContent = '⏸';
    $w('#wuPlayer').classList.remove('hidden');
    beep(880, 80);                       // unlock audio on this tap
    keepAwake(true);
    show(); clearInterval(timer); timer = setInterval(loop, 1000);
  });
  $w('#plPause').addEventListener('click', () => { paused = !paused; $w('#plPause').textContent = paused ? '▶' : '⏸'; });
  $w('#plSkip').addEventListener('click', next);
  $w('#plPrev').addEventListener('click', () => { if (idx > 0) { idx--; show(); } else show(); });
  $w('#plClose').addEventListener('click', close);

  renderList();
})();
