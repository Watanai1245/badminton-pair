'use strict';

/* ================= Court cost splitter (standalone) =================
   - each court is booked for 0.5, 1, 2, 3 … hours (no 1.5 / 2.5); all courts start together
   - a person plays 0.5, 1, 2, 3 … hours, up to the longest court
   - time is split into 30-minute blocks; each block's court fee is shared only by
     the people who played in that block (people who play less arrived late)
   - shuttles are shared by person-time played
   - all per-person figures are rounded UP to whole baht */
(() => {
  const KEY = 'bp-cost-v6';
  const $c = s => document.querySelector(s);
  const E = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 8);
  const BLOCK = 0.5;

  const cs = {
    price: 0, shuttles: 0, shPrice: 0, mode: 'counts',
    courts: [{ id: uid(), hours: 2 }],
    att: {},            // names mode: playerId -> [played block 1, block 2, ...]
    by: {},             // counts mode: "0.5" | "1" | "2" … -> how many people played that long
    seeded: false,
  };
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d) Object.assign(cs, d);
  } catch (e) { /* ignore */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(cs)); } catch (e) { /* ignore */ } };

  const num = v => { const n = parseFloat(v); return isFinite(n) && n > 0 ? n : 0; };
  const up = n => Math.ceil(n - 1e-9);
  const baht = n => '฿' + n.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  const approx = n => '≈ ฿' + up(n).toLocaleString('th-TH');
  const dur = d => (d === 0.5 ? 'ครึ่ง ชม.' : `${d} ชม.`);
  const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);

  /* allowed durations: half an hour first, then whole hours */
  const stepsUpTo = max => [0.5, ...range(1, Math.floor(max) + 1)];
  const COURT_STEPS = stepsUpTo(12);

  /* names mode reads the player list from the pairing feature (shared `state.players`) */
  const roster = () => (typeof state !== 'undefined' ? state.players : []);
  const ppl = () => roster().map(p => ({ id: p.id, name: p.name, h: cs.att[p.id] || [] }));

  /* ---------- timeline ---------- */
  const maxH = () => Math.max(0.5, ...cs.courts.map(c => c.hours));
  const blockCount = () => Math.round(maxH() / BLOCK);
  const halfCols = () => cs.courts.some(c => c.hours % 1 !== 0);           // a half-hour court needs 30-min columns
  const groups = () => {
    const n = blockCount(), g = halfCols() ? 1 : 2, out = [];
    for (let i = 0; i < n; i += g) out.push({ a: i, b: Math.min(n, i + g) });
    return out;
  };
  const gLabel = g => (halfCols() ? `${g.a * BLOCK}–${g.b * BLOCK}` : String(g.a / 2 + 1));
  const gTitle = g => (halfCols() ? `ชม. ${gLabel(g)}` : `ชั่วโมงที่ ${gLabel(g)}`);

  function sync() {
    const n = blockCount();
    const ids = new Set(roster().map(p => p.id));
    Object.keys(cs.att).forEach(id => { if (!ids.has(id)) delete cs.att[id]; });
    roster().forEach(p => { const h = cs.att[p.id] || []; cs.att[p.id] = range(0, n).map(i => (i < h.length ? h[i] : true)); });
    if (!cs.seeded) { cs.by[String(maxH())] = roster().length || 8; cs.seeded = true; }   // first time: everyone plays the full time
  }
  const durations = () => stepsUpTo(maxH()).filter(d => d <= maxH());
  const people = d => cs.by[String(d)] || 0;
  /* blocks (0-based) a person who plays d hours is on court: the last 2d blocks (arrived late) */
  const blocksFor = d => range(blockCount() - Math.round(d / BLOCK), blockCount());

  function compute() {
    sync();
    const n = blockCount();
    const courtBlock = range(0, n).map(i => cs.courts.reduce((a, c) => a + (c.hours > i * BLOCK ? BLOCK : 0), 0) * cs.price);
    let count;
    if (cs.mode === 'names') count = range(0, n).map(i => ppl().filter(p => p.h[i]).length);
    else count = range(0, n).map(i => durations().reduce((a, d) => a + (blocksFor(d).includes(i) ? people(d) : 0), 0));
    const perHead = courtBlock.map((c, i) => (count[i] ? c / count[i] : 0));
    const shuttleTotal = cs.shuttles * cs.shPrice;
    const personTime = count.reduce((a, k) => a + k * BLOCK, 0);
    const unit = personTime ? shuttleTotal / personTime : 0;               // shuttle cost per person-hour
    const costFor = blocks => blocks.reduce((a, i) => a + perHead[i] + unit * BLOCK, 0);
    const courtTotal = courtBlock.reduce((a, b) => a + b, 0);
    const idle = courtBlock.reduce((a, c, i) => a + (count[i] ? 0 : c), 0);
    return { n, courtBlock, count, perHead, shuttleTotal, unit, costFor, courtTotal, idle };
  }

  /* ---------- courts ---------- */
  function renderCourts() {
    $c('#cCourtList').innerHTML = cs.courts.map((c, i) => `<div class="crt">
        <b>คอร์ด ${i + 1}</b>
        <div class="stepper sm">
          <button type="button" data-h="${i}" data-d="-1" aria-label="ลดเวลาจอง">−</button>
          <output>${dur(c.hours)}</output>
          <button type="button" data-h="${i}" data-d="1" aria-label="เพิ่มเวลาจอง">+</button>
        </div>
        ${cs.courts.length > 1 ? `<button type="button" class="del" data-rm="${i}" aria-label="ลบคอร์ด">×</button>` : '<span></span>'}
      </div>`).join('');
  }

  /* ---------- who plays ---------- */
  function renderWho() {
    sync();
    document.querySelectorAll('#cMode button').forEach(b => b.classList.toggle('on', b.dataset.m === cs.mode));
    const box = $c('#cWho');
    if (cs.mode === 'counts') {
      const rows = durations().reverse().map(d => `<div class="crow"><span>เล่น ${dur(d)}</span>
          <div class="stepper sm"><button type="button" data-c="${d}" data-d="-1" aria-label="ลด">−</button>
          <output>${people(d)}</output><button type="button" data-c="${d}" data-d="1" aria-label="เพิ่ม">+</button></div><small>คน</small></div>`).join('');
      box.innerHTML = `<div class="countlist">${rows}</div>
        <p class="hint">เล่นได้ขั้นต่ำครึ่งชั่วโมง จากนั้นเพิ่มทีละชั่วโมง สูงสุด ${dur(maxH())} ตามคอร์ดที่จองนานที่สุด คนที่เล่นไม่ครบนับว่ามาทีหลัง</p>`;
      return;
    }
    const list = ppl(), gs = groups();
    if (!list.length) {
      box.innerHTML = `<p class="hint">ยังไม่มีรายชื่อ ผู้เล่นจะมาจากหน้าจับคู่</p>
        <button type="button" class="outline gap" data-go="pair">ไปเพิ่มผู้เล่น</button>`;
      return;
    }
    box.innerHTML = `<div class="grid" style="--cols:${gs.length}">
        <div class="gh">ชื่อ · ${halfCols() ? 'ช่วง (ชม.)' : 'ชั่วโมงที่'}</div>${gs.map(g => `<div class="gh">${gLabel(g)}</div>`).join('')}
        ${list.map(p => `<div class="gn">${E(p.name)}</div>${gs.map((g, i) => {
          const on = p.h.slice(g.a, g.b).every(Boolean);
          return `<button type="button" class="cell ${on ? 'on' : ''}" data-p="${p.id}" data-g="${i}" aria-label="${E(p.name)} ${gTitle(g)}"></button>`;
        }).join('')}`).join('')}
      </div>
      <p class="hint">รายชื่อนี้มาจากหน้าจับคู่ (${list.length} คน) แตะช่องเพื่อเลือกช่วงที่เล่น ช่องเข้ม = เล่น</p>
      <button type="button" class="link" data-go="pair">จัดการรายชื่อผู้เล่น</button>`;
  }

  /* ---------- result ---------- */
  function groupsByHours(r) {            // one price per play-time that actually has people, longest first
    return durations().reverse().filter(d => people(d) > 0)
      .map(d => ({ d, people: people(d), cost: up(r.costFor(blocksFor(d))) }));
  }

  function summaryText(r) {
    const lines = ['ค่าสนาม (ประมาณ ปัดขึ้นเป็นบาทเต็ม)', `สนาม ${baht(r.courtTotal)} + ลูก ${baht(r.shuttleTotal)} = ${baht(r.courtTotal + r.shuttleTotal)}`];
    if (cs.mode === 'names') ppl().forEach(p => { const idx = p.h.map((v, i) => (v ? i : -1)).filter(i => i >= 0); lines.push(`${p.name} (${idx.length ? dur(idx.length * BLOCK) : 'ไม่ได้เล่น'}): ${approx(r.costFor(idx))}`); });
    else groupsByHours(r).forEach(g => lines.push(`เล่น ${dur(g.d)}: ≈ ฿${g.cost.toLocaleString('th-TH')} ต่อคน`));
    return lines.join('\n');
  }

  function renderResult() {
    const r = compute(), gs = groups();
    const total = r.courtTotal + r.shuttleTotal;
    let html = `<div class="kv"><span>ค่าสนามรวม</span><b>${baht(r.courtTotal)}</b></div>
      <div class="kv"><span>ค่าลูกรวม</span><b>${baht(r.shuttleTotal)}</b></div>
      <div class="kv total"><span>รวมทั้งหมด</span><b>${baht(total)}</b></div>
      <h3 class="sub">ที่ต้องจ่ายต่อคน</h3>`;

    if (cs.mode === 'names') {
      let sum = 0;
      const rows = ppl().map(p => {
        const idx = p.h.map((v, i) => (v ? i : -1)).filter(i => i >= 0), c = idx.length ? up(r.costFor(idx)) : 0;
        sum += c;
        const played = idx.length * BLOCK;                         // total time on court
        const t = played ? dur(played) : 'ไม่ได้เล่น';
        return `<div class="kv person"><span>${E(p.name)} <small>${t}</small></span><b>≈ ฿${c.toLocaleString('th-TH')}</b></div>`;
      }).join('');
      html += rows || '<p class="hint">ยังไม่มีรายชื่อ</p>';
      if (ppl().length) html += `<div class="kv total"><span>เก็บได้รวม</span><b>≈ ฿${sum.toLocaleString('th-TH')}</b></div>`;
    } else {
      const list = groupsByHours(r);
      html += list.map(g =>
        `<div class="kv person"><span>เล่น ${dur(g.d)} <small>${g.people} คน</small></span><b>≈ ฿${g.cost.toLocaleString('th-TH')}</b></div>`).join('');
      html += `<div class="kv total"><span>เก็บได้รวม</span><b>≈ ฿${list.reduce((a, g) => a + g.cost * g.people, 0).toLocaleString('th-TH')}</b></div>`;
    }
    if (r.idle > 0) html += `<p class="warn">มีช่วงที่ไม่มีผู้เล่น ค่าสนาม ${baht(r.idle)} ไม่ถูกเฉลี่ยให้ใคร</p>`;
    $c('#cResult').innerHTML = html;
    persist();
  }

  /* ---------- events ---------- */
  const redraw = () => { renderCourts(); renderWho(); renderResult(); };

  $c('#cPrice').addEventListener('input', e => { cs.price = num(e.target.value); renderResult(); });
  $c('#cShuttles').addEventListener('input', e => { cs.shuttles = num(e.target.value); renderResult(); });
  $c('#cShPrice').addEventListener('input', e => { cs.shPrice = num(e.target.value); renderResult(); });

  $c('#cCourtList').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]'), stp = e.target.closest('button[data-h]');
    if (stp) {
      const c = cs.courts[+stp.dataset.h];
      const i = COURT_STEPS.indexOf(c.hours) + +stp.dataset.d;
      c.hours = COURT_STEPS[Math.min(COURT_STEPS.length - 1, Math.max(0, i))];
      stp.parentElement.querySelector('output').textContent = dur(c.hours);
      renderWho(); renderResult();
    }
    if (rm) { cs.courts.splice(+rm.dataset.rm, 1); redraw(); }
  });
  $c('#cAddCourt').addEventListener('click', () => {
    const last = cs.courts[cs.courts.length - 1];
    cs.courts.push({ id: uid(), hours: last ? last.hours : 1 }); redraw();
  });

  $c('#cMode').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cs.mode = b.dataset.m; renderWho(); renderResult(); } });

  $c('#cWho').addEventListener('click', e => {
    const cell = e.target.closest('.cell'), cnt = e.target.closest('[data-c]');
    if (cell) {
      const h = cs.att[cell.dataset.p], g = groups()[+cell.dataset.g];
      const on = !h.slice(g.a, g.b).every(Boolean);
      for (let i = g.a; i < g.b; i++) h[i] = on;
      cell.classList.toggle('on', on);
    }
    if (cnt) {
      const key = String(+cnt.dataset.c), v = Math.max(0, people(+cnt.dataset.c) + +cnt.dataset.d);
      cs.by[key] = v; cnt.parentElement.querySelector('output').textContent = v;
    }
    if (cell || cnt) renderResult();
  });
  $c('#cCopy').addEventListener('click', async () => {
    const text = summaryText(compute());
    try { await navigator.clipboard.writeText(text); toast('คัดลอกสำเร็จ', 'ok'); } catch (e) { prompt('คัดลอกข้อความนี้', text); }
  });

  /* ---------- init ---------- */
  $c('#cPrice').value = cs.price || ''; $c('#cShuttles').value = cs.shuttles || ''; $c('#cShPrice').value = cs.shPrice || '';
  document.addEventListener('tabchange', e => { if (e.detail === 'cost') { renderWho(); renderResult(); } });
  redraw();
})();
