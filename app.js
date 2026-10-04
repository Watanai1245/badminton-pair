'use strict';

/* ================= State ================= */
const STORE_KEY = 'badminton-pair-v1';

const RULES = [
  { key: 'noFF', title: 'ห้ามจับ หญิง + หญิง เป็นคู่กัน', desc: 'ผู้หญิงสองคนจะไม่ถูกจับเป็นทีมเดียวกัน', def: false },
  { key: 'noMM', title: 'ห้ามจับ ชาย + ชาย เป็นคู่กัน', desc: 'ผู้ชายสองคนจะไม่ถูกจับเป็นทีมเดียวกัน', def: false },
  { key: 'preferMixed', title: 'เน้นคู่ผสม (ชาย + หญิง)', desc: 'พยายามจับชายคู่หญิงให้มากที่สุดเท่าที่ทำได้', def: false },
  { key: 'noRepeatPartner', title: 'ไม่จับคู่ซ้ำจนกว่าจะวนครบทุกคน', desc: 'หลีกเลี่ยงการได้คู่เดิมจนกว่าจะได้คู่กับคนอื่นครบ', def: true },
  { key: 'avoidRepeatOpp', title: 'หลีกเลี่ยงเจอคู่แข่งซ้ำ', desc: 'ให้ได้เจอคู่แข่งหลากหลายขึ้น', def: true },
  { key: 'fairRest', title: 'ผลัดกันพักอย่างยุติธรรม', desc: 'คนที่เล่นน้อยกว่าหรือพักมานานกว่าจะได้เล่นก่อน', def: true },
];

const state = {
  courts: 2,
  hours: 2,
  minutes: 20,
  players: [],
  rules: Object.fromEntries(RULES.map(r => [r.key, r.def])),
  schedule: null,
  current: 0,
};

function save() {
  try {
    const { courts, hours, minutes, players, rules } = state;
    localStorage.setItem(STORE_KEY, JSON.stringify({ courts, hours, minutes, players, rules }));
  } catch (e) { /* private mode etc. */ }
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!d) return;
    Object.assign(state, {
      courts: d.courts || 2, hours: d.hours || 2, minutes: d.minutes || 20,
      players: Array.isArray(d.players) ? d.players : [],
      rules: { ...state.rules, ...(d.rules || {}) },
    });
  } catch (e) { /* ignore */ }
}

/* ================= Helpers ================= */
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2000);
}
const roundCount = () => Math.max(1, Math.floor((state.hours * 60) / state.minutes));
const fmtTime = m => {
  const h = Math.floor(m / 60), mm = m % 60;
  return `${h}:${String(mm).padStart(2, '0')}`;
};
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ================= Pairing engine ================= */
const HARD = 10000;

function generateSchedule(players, courts, rounds, rules) {
  const n = players.length;
  const perRound = Math.min(courts, Math.floor(n / 4));
  const games = {}, lastPlayed = {}, partner = {}, opp = {};
  players.forEach(p => { games[p.id] = 0; lastPlayed[p.id] = -1; partner[p.id] = {}; opp[p.id] = {}; });
  const pc = (a, b) => partner[a.id][b.id] || 0;
  const oc = (a, b) => opp[a.id][b.id] || 0;
  const warnings = new Set();

  function teamCost(a, b) {
    let c = 0;
    const ff = a.g === 'F' && b.g === 'F', mm = a.g === 'M' && b.g === 'M';
    if (rules.noFF && ff) c += HARD;
    if (rules.noMM && mm) c += HARD;
    if (rules.preferMixed && (ff || mm)) c += 40;
    const k = pc(a, b);
    c += rules.noRepeatPartner ? k * k * 200 + k * 50 : k * 4;
    return c;
  }
  function matchCost(t1, t2) {
    let c = teamCost(t1[0], t1[1]) + teamCost(t2[0], t2[1]);
    for (const x of t1) for (const y of t2) c += oc(x, y) * (rules.avoidRepeatOpp ? 12 : 2);
    return c;
  }
  // 3 ways to split 4 players into 2 teams
  function bestSplit(four) {
    const [a, b, c, d] = four;
    const opts = [[[a, b], [c, d]], [[a, c], [b, d]], [[a, d], [b, c]]];
    let best = null, bc = Infinity;
    for (const o of opts) {
      const cost = matchCost(o[0], o[1]) + Math.random() * 0.5;
      if (cost < bc) { bc = cost; best = o; }
    }
    return { teams: best, cost: bc };
  }

  const out = [];
  for (let r = 0; r < rounds; r++) {
    // choose who plays
    let order;
    if (rules.fairRest) {
      order = shuffle(players).sort((x, y) =>
        games[x.id] - games[y.id] || lastPlayed[x.id] - lastPlayed[y.id]);
    } else {
      order = shuffle(players);
    }
    const playing = order.slice(0, perRound * 4);
    const bench = order.slice(perRound * 4);

    // search for best arrangement of playing players
    let best = null, bestCost = Infinity;
    const tries = 250 + perRound * 120;
    for (let t = 0; t < tries; t++) {
      const sh = shuffle(playing);
      let total = 0; const matches = [];
      for (let i = 0; i < perRound; i++) {
        const { teams, cost } = bestSplit(sh.slice(i * 4, i * 4 + 4));
        total += cost; matches.push(teams);
      }
      if (total < bestCost) { bestCost = total; best = matches; }
    }

    const matches = best.map((tm, i) => ({ court: i + 1, a: tm[0], b: tm[1] }));
    matches.forEach(m => {
      [m.a, m.b].forEach(team => {
        const [p, q] = team;
        if (rules.noFF && p.g === 'F' && q.g === 'F') warnings.add('ไม่สามารถเลี่ยงคู่ หญิง+หญิง ได้ในบางรอบ (จำนวนผู้เล่นไม่พอ)');
        if (rules.noMM && p.g === 'M' && q.g === 'M') warnings.add('ไม่สามารถเลี่ยงคู่ ชาย+ชาย ได้ในบางรอบ (จำนวนผู้เล่นไม่พอ)');
        partner[p.id][q.id] = pc(p, q) + 1; partner[q.id][p.id] = pc(q, p) + 1;
      });
      for (const x of m.a) for (const y of m.b) {
        opp[x.id][y.id] = oc(x, y) + 1; opp[y.id][x.id] = oc(y, x) + 1;
      }
      [...m.a, ...m.b].forEach(p => { games[p.id]++; lastPlayed[p.id] = r; });
    });
    out.push({ matches, bench });
  }

  if (rules.noRepeatPartner) {
    const dup = players.some(p => Object.values(partner[p.id]).some(v => v > 1));
    if (dup) warnings.add('มีบางคู่ที่ต้องจับซ้ำ เพราะจำนวนรอบมากกว่าจำนวนคู่ที่เป็นไปได้');
  }
  return { rounds: out, games, warnings: [...warnings] };
}

/* ================= Setup UI ================= */
function renderSetup() {
  $('#courtsOut').textContent = state.courts;
  $('#hoursOut').textContent = state.hours;
  document.querySelectorAll('#minutesSeg button').forEach(b =>
    b.classList.toggle('on', +b.dataset.min === state.minutes));
  const n = state.players.length, per = Math.min(state.courts, Math.floor(n / 4));
  $('#roundsHint').textContent =
    `≈ ${roundCount()} รอบ` + (n >= 4 ? ` • เล่นพร้อมกัน ${per} คอร์ด (${per * 4} คน/รอบ)` : '');
  $('#playerCount').textContent = n;

  const ul = $('#playerList');
  ul.innerHTML = '';
  state.players.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot" style="background:var(--${p.g === 'M' ? 'male' : 'female'})"></span>
      <span class="nm">${esc(p.name)}</span>
      <button class="gbtn ${p.g}" data-id="${p.id}" type="button" title="กดเพื่อสลับเพศ">${p.g === 'M' ? '♂ ชาย' : '♀ หญิง'}</button>
      <button class="del" data-del="${p.id}" type="button" aria-label="ลบ">✕</button>`;
    ul.appendChild(li);
  });
}

function renderRules() {
  const box = $('#rules'); box.innerHTML = '';
  RULES.forEach(r => {
    const row = document.createElement('label');
    row.className = 'rule';
    row.innerHTML = `<span class="txt">${r.title}<small>${r.desc}</small></span>
      <span class="switch"><input type="checkbox" ${state.rules[r.key] ? 'checked' : ''}><i></i></span>`;
    row.querySelector('input').addEventListener('change', e => {
      state.rules[r.key] = e.target.checked;
      save();
    });
    box.appendChild(row);
  });
}

function addPlayer(name, g) {
  name = name.trim();
  if (!name) return false;
  if (state.players.some(p => p.name === name)) { toast('มีชื่อนี้อยู่แล้ว'); return false; }
  state.players.push({ id: uid(), name, g });
  return true;
}

function bindSetup() {
  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.step, d = +b.dataset.d;
    if (k === 'courts') state.courts = Math.min(10, Math.max(1, state.courts + d));
    else state.hours = Math.min(12, Math.max(0.5, state.hours + d));
    save(); renderSetup();
  }));
  document.querySelectorAll('#minutesSeg button').forEach(b => b.addEventListener('click', () => {
    state.minutes = +b.dataset.min; save(); renderSetup();
  }));

  $('#addForm').addEventListener('submit', e => {
    e.preventDefault();
    const g = new FormData(e.target).get('gender');
    if (addPlayer($('#nameInput').value, g)) {
      $('#nameInput').value = ''; save(); renderSetup();
    }
    $('#nameInput').focus();
  });

  $('#playerList').addEventListener('click', e => {
    const gb = e.target.closest('[data-id]'), del = e.target.closest('[data-del]');
    if (gb) { const p = state.players.find(x => x.id === gb.dataset.id); p.g = p.g === 'M' ? 'F' : 'M'; }
    if (del) state.players = state.players.filter(x => x.id !== del.dataset.del);
    if (gb || del) { save(); renderSetup(); }
  });

  $('#btnClear').addEventListener('click', () => {
    if (state.players.length && confirm('ล้างรายชื่อผู้เล่นทั้งหมด?')) { state.players = []; save(); renderSetup(); }
  });

  const dlg = $('#bulkDialog');
  $('#btnBulk').addEventListener('click', () => { $('#bulkText').value = ''; dlg.showModal(); });
  $('#bulkOk').addEventListener('click', () => {
    let added = 0;
    $('#bulkText').value.split(/\r?\n/).forEach(line => {
      line = line.trim(); if (!line) return;
      const m = line.match(/^(.*?)[\s,]+(ช|ญ|ชาย|หญิง|m|f|male|female)$/i);
      let name = line, g = 'M';
      if (m) { name = m[1]; g = /^(ญ|หญิง|f|female)$/i.test(m[2]) ? 'F' : 'M'; }
      if (addPlayer(name, g)) added++;
    });
    save(); renderSetup(); toast(`เพิ่ม ${added} คน`);
  });

  $('#btnGo').addEventListener('click', start);
  $('#btnBack').addEventListener('click', showSetup);
}

/* ================= Result UI ================= */
function showSetup() {
  $('#result').classList.add('hidden');
  $('#setup').classList.remove('hidden');
  $('#btnBack').classList.add('hidden');
  window.scrollTo({ top: 0 });
}

function start() {
  const err = $('#errorBox');
  if (state.players.length < 4) {
    err.textContent = 'ต้องมีผู้เล่นอย่างน้อย 4 คน';
    err.classList.remove('hidden');
    err.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  err.classList.add('hidden');
  generate();
  $('#setup').classList.add('hidden');
  $('#result').classList.remove('hidden');
  $('#btnBack').classList.remove('hidden');
  window.scrollTo({ top: 0 });
  showRound(0, true);
}

function generate() {
  state.schedule = generateSchedule(state.players, state.courts, roundCount(), state.rules);
  const w = $('#warnBox');
  if (state.schedule.warnings.length) {
    w.innerHTML = '⚠️ ' + state.schedule.warnings.join('<br>⚠️ '); w.classList.remove('hidden');
  } else w.classList.add('hidden');
  renderChips(); renderStats();
}

function renderChips() {
  const box = $('#roundChips'); box.innerHTML = '';
  state.schedule.rounds.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = i + 1;
    b.addEventListener('click', () => showRound(i, true));
    box.appendChild(b);
  });
}

function renderStats() {
  const { games } = state.schedule;
  const max = Math.max(1, ...Object.values(games));
  $('#stats').innerHTML = state.players.slice()
    .sort((a, b) => games[b.id] - games[a.id])
    .map(p => `<div class="stat"><span class="nm">${esc(p.name)}</span>
      <span class="bar"><i class="${p.g}" style="width:${(games[p.id] / max) * 100}%"></i></span>
      <span class="n">${games[p.id]}</span></div>`).join('');
}

const SLOT_POS = [
  // team A (top), team B (bottom)  — [x%, y%]
  [26, 22], [74, 22],
  [26, 78], [74, 78],
];

function chipHTML(p) {
  return `<div class="pchip ${p.g}"><span class="gdot"></span><span class="pname">${esc(p.name)}</span></div>`;
}

let animTimers = [];
function showRound(i, animate) {
  const rounds = state.schedule.rounds;
  state.current = Math.min(rounds.length - 1, Math.max(0, i));
  const rd = rounds[state.current];
  animTimers.forEach(t => { clearTimeout(t); clearInterval(t); }); animTimers = [];

  $('#roundLabel').textContent = `รอบที่ ${state.current + 1} / ${rounds.length}`;
  const start = state.current * state.minutes;
  $('#roundTime').textContent = `เวลา +${fmtTime(start)} – +${fmtTime(start + state.minutes)} ชม.`;
  $('#prevRound').disabled = state.current === 0;
  $('#nextRound').disabled = state.current === rounds.length - 1;
  document.querySelectorAll('#roundChips button').forEach((b, k) => {
    b.classList.toggle('on', k === state.current);
    if (k === state.current) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  });

  const box = $('#courts'); box.innerHTML = '';

  rd.matches.forEach((m, mi) => {
    const wrap = document.createElement('div');
    wrap.className = 'courtwrap';
    const plist = [...m.a, ...m.b];
    wrap.innerHTML = `
      <div class="courttitle">คอร์ด ${m.court} <small>${esc(m.a[0].name)}/${esc(m.a[1].name)} vs ${esc(m.b[0].name)}/${esc(m.b[1].name)}</small></div>
      <div class="court">
        <div class="ln outer"></div><div class="ln side-l"></div><div class="ln side-r"></div>
        <div class="ln sv-t"></div><div class="ln sv-b"></div><div class="ln mid-t"></div><div class="ln mid-b"></div>
        <span class="team-label a">ทีม A</span><span class="team-label b">ทีม B</span>
        <div class="net"></div>
        <span class="vs">VS</span>
      </div>`;
    const court = wrap.querySelector('.court');
    plist.forEach((p, k) => {
      const s = document.createElement('div');
      s.className = 'slot';
      s.style.left = SLOT_POS[k][0] + '%'; s.style.top = SLOT_POS[k][1] + '%';
      s.innerHTML = chipHTML(p);
      court.appendChild(s);
    });
    box.appendChild(wrap);

  });

  const bl = $('#benchList');
  bl.innerHTML = rd.bench.length
    ? rd.bench.map(p => `<span class="bchip ${p.g}">${esc(p.name)}</span>`).join('')
    : '<span class="bchip none">ทุกคนได้เล่น 🎉</span>';
}

function scheduleText() {
  const lines = [`Badminton Pair (${state.courts} คอร์ด)`];
  state.schedule.rounds.forEach((rd, i) => {
    lines.push(`\nรอบ ${i + 1}`);
    rd.matches.forEach(m =>
      lines.push(`คอร์ด ${m.court}: ${m.a[0].name}/${m.a[1].name}  vs  ${m.b[0].name}/${m.b[1].name}`));
    if (rd.bench.length) lines.push(`พัก: ${rd.bench.map(p => p.name).join(', ')}`);
  });
  return lines.join('\n');
}

function bindResult() {
  $('#prevRound').addEventListener('click', () => showRound(state.current - 1, true));
  $('#nextRound').addEventListener('click', () => showRound(state.current + 1, true));
  $('#btnReshuffle').addEventListener('click', () => { generate(); showRound(0, true); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#btnSave').addEventListener('click', saveImage);
  $('#btnShare').addEventListener('click', async () => {
    const text = scheduleText();
    try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว ✓'); }
    catch (e) { prompt('คัดลอกข้อความนี้', text); }
  });

  // swipe left/right to change rounds
  let sx = null;
  const res = $('#result');
  res.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  res.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 70) showRound(state.current + (dx < 0 ? 1 : -1), true);
  });
}


/* ================= Save as image ================= */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fit(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
  return text + '…';
}

async function renderImage() {
  try { await Promise.all([document.fonts.load('600 26px Prompt'), document.fonts.load('700 26px Prompt')]); } catch (e) {}
  const FONT = 'Prompt, system-ui, sans-serif';
  const W = 1080, PAD = 36, CW = W - PAD * 2, S = 2;
  const COL = { m: '#2f7de1', f: '#e8508f', g9: '#052e1f', g8: '#0a6b46', lime: '#d4ff3a' };
  const rounds = state.schedule.rounds;
  const HEAD = 190, ROW = 92, RH = 62, GAP = 22;

  // measure heights (bench list wraps)
  const mc = document.createElement('canvas').getContext('2d');
  mc.font = `500 24px ${FONT}`;
  const benchLines = rounds.map(rd => {
    if (!rd.bench.length) return [];
    const lines = []; let cur = '';
    rd.bench.forEach(p => {
      const t = (p.g === 'M' ? '♂ ' : '♀ ') + p.name;
      const next = cur ? cur + '   ' + t : t;
      if (mc.measureText('พัก:  ' + next).width > CW - 60 && cur) { lines.push(cur); cur = t; } else cur = next;
    });
    if (cur) lines.push(cur);
    return lines;
  });
  const cardH = rounds.map((rd, i) => 64 + rd.matches.length * ROW + (benchLines[i].length ? 16 + benchLines[i].length * 34 : 0) + 16);
  const H = HEAD + cardH.reduce((a, b) => a + b + GAP, 0) + 80;

  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const ctx = cv.getContext('2d'); ctx.scale(S, S);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#eaf4ee'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, HEAD);
  g.addColorStop(0, COL.g9); g.addColorStop(.7, COL.g8); g.addColorStop(1, '#12a366');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HEAD);
  ctx.fillStyle = COL.lime; ctx.fillRect(0, HEAD - 6, W, 6);
  ctx.fillStyle = '#fff'; ctx.font = `700 54px ${FONT}`; ctx.fillText('Badminton Pair', PAD, 72);
  ctx.font = `500 26px ${FONT}`; ctx.fillStyle = COL.lime;
  const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillText(`${dateStr}  •  ${state.courts} คอร์ด  •  ${state.players.length} คน  •  ${rounds.length} รอบ × ${state.minutes} นาที`, PAD, 126);

  let y = HEAD + GAP + 4;
  rounds.forEach((rd, i) => {
    const h = cardH[i];
    ctx.save(); ctx.shadowColor = 'rgba(5,46,31,.15)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#fff'; rr(ctx, PAD, y, CW, h, 24); ctx.fill(); ctx.restore();
    // round header
    ctx.fillStyle = COL.g8; rr(ctx, PAD, y, CW, 52, 24); ctx.fill();
    ctx.fillRect(PAD, y + 26, CW, 26);
    ctx.fillStyle = COL.lime; ctx.font = `700 28px ${FONT}`; ctx.fillText(`รอบที่ ${i + 1}`, PAD + 24, y + 27);
    const st = i * state.minutes;
    ctx.fillStyle = '#fff'; ctx.font = `500 22px ${FONT}`; ctx.textAlign = 'right';
    ctx.fillText(`+${fmtTime(st)} – +${fmtTime(st + state.minutes)} ชม.`, PAD + CW - 24, y + 27); ctx.textAlign = 'left';

    let ry = y + 64;
    rd.matches.forEach(m => {
      ctx.fillStyle = COL.g9; ctx.font = `700 22px ${FONT}`; ctx.fillText(`คอร์ด ${m.court}`, PAD + 20, ry + RH / 2 + 4);
      const bx = PAD + 130, bw = (CW - 130 - 20 - 70) / 2;
      [[m.a, bx], [m.b, bx + bw + 70]].forEach(([team, x]) => {
        ctx.fillStyle = '#eef6f1'; rr(ctx, x, ry, bw, RH, 16); ctx.fill();
        team.forEach((p, k) => {
          const cy = ry + 17 + k * 29;
          ctx.fillStyle = p.g === 'M' ? COL.m : COL.f; ctx.beginPath(); ctx.arc(x + 22, cy, 8, 0, 7); ctx.fill();
          ctx.fillStyle = '#0e2318'; ctx.font = `600 25px ${FONT}`; ctx.fillText(fit(ctx, p.name, bw - 56), x + 42, cy + 1);
        });
      });
      const vx = bx + bw + 35;
      ctx.fillStyle = COL.lime; ctx.beginPath(); ctx.arc(vx, ry + RH / 2, 24, 0, 7); ctx.fill();
      ctx.strokeStyle = COL.g9; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = COL.g9; ctx.font = `800 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('VS', vx, ry + RH / 2 + 1); ctx.textAlign = 'left';
      ry += ROW;
    });
    if (benchLines[i].length) {
      ry += 0;
      ctx.fillStyle = '#58705f'; ctx.font = `600 22px ${FONT}`; ctx.fillText('พัก:', PAD + 20, ry + 8);
      benchLines[i].forEach((ln, k) => {
        let x = PAD + 90;
        ln.split('   ').forEach(t => {
          ctx.font = `500 24px ${FONT}`;
          ctx.fillStyle = t.startsWith('♂') ? COL.m : COL.f;
          ctx.fillText(t, x, ry + 8 + k * 34); x += ctx.measureText(t).width + 26;
        });
      });
    }
    y += h + GAP;
  });
  ctx.fillStyle = '#58705f'; ctx.font = `500 20px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('● ชาย   ● หญิง  — made with Badminton Pair', W / 2, H - 36);
  return cv;
}

async function saveImage() {
  const btn = $('#btnSave'), old = btn.textContent;
  btn.disabled = true; btn.textContent = 'กำลังสร้างรูป…';
  try {
    const cv = await renderImage();
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    const file = new File([blob], 'badminton-pair.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Badminton Pair' }); }
      catch (e) { if (e.name !== 'AbortError') throw e; }
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'badminton-pair.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('บันทึกรูปแล้ว ✓');
    }
  } catch (e) { toast('สร้างรูปไม่สำเร็จ'); console.error(e); }
  btn.disabled = false; btn.textContent = old;
}

/* ================= Init ================= */
load();
renderSetup();
renderRules();
bindSetup();
bindResult();
