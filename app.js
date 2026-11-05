'use strict';

/* ================= State ================= */
const STORE_KEY = 'badminton-pair-v1';

const RULES = [
  { key: 'noFF', title: 'ห้ามจับ หญิง + หญิง เป็นคู่กัน', desc: 'ผู้หญิงสองคนจะไม่ถูกจับเป็นทีมเดียวกัน', def: false },
  { key: 'noMM', title: 'ห้ามจับ ชาย + ชาย เป็นคู่กัน', desc: 'ผู้ชายสองคนจะไม่ถูกจับเป็นทีมเดียวกัน', def: false },
  { key: 'preferMixed', title: 'เน้นคู่ผสม (ชาย + หญิง)', desc: 'พยายามจับชายคู่หญิงให้มากที่สุดเท่าที่ทำได้', def: false },
  { key: 'avoidRepeatOpp', title: 'หลีกเลี่ยงเจอคู่แข่งซ้ำ', desc: 'ให้ได้เจอคู่แข่งหลากหลายขึ้น', def: true },
  { key: 'fairRest', title: 'ผลัดกันพักอย่างยุติธรรม', desc: 'คนที่เล่นน้อยกว่าหรือพักมานานกว่าจะได้เล่นก่อน', def: true },
];

const LEVELS = ['', 'เริ่มต้น', 'ปานกลาง', 'เก่ง'];
const SKILL_MODES = [
  { key: 'random', title: 'สุ่มปกติ', desc: 'ไม่สนใจระดับฝีมือ' },
  { key: 'close', title: 'ระดับใกล้กัน', desc: 'จับคนระดับเดียวกัน ระดับไหนมีไม่ถึง 4 คนให้ยืมคนระดับปานกลางมาช่วย (ไม่จับเริ่มต้นกับเก่งด้วยกัน) และหยุดเมื่อแต่ละกลุ่มจับคู่กันครบ' },
  { key: 'balance', title: 'ถ่วงสมดุล', desc: 'จับเก่งคู่กับอ่อน ให้สองทีมสูสีกัน' },
];

const state = {
  skill: 'random',
  players: [],
  rules: Object.fromEntries(RULES.map(r => [r.key, r.def])),
  schedule: null,
  current: 0,
  view: 'setup',
};

function save() {
  try {
    const { players, rules, schedule, current, view, skill } = state;
    localStorage.setItem(STORE_KEY, JSON.stringify({ players, rules, schedule, current, view, skill }));
  } catch (e) { /* private mode etc. */ }
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!d) return;
    Object.assign(state, {
      players: Array.isArray(d.players) ? d.players.map(p => ({ ...p, lv: p.lv || 2 })) : [],
      skill: d.skill || 'random',
      rules: { ...state.rules, ...(d.rules || {}) },
      schedule: d.schedule && Array.isArray(d.schedule.rounds) ? d.schedule : null,
      current: d.current || 0, view: d.view || 'setup',
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
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ================= Pairing engine ================= */
const HARD = 10000;

/* Pairs everyone until every allowed partnership has happened at least once
   (a full cycle). All players who can fill a court play at once. */
const MAX_ROUNDS = 40;
const allowedPairs = (players, rules) => {
  const out = [];
  for (let i = 0; i < players.length; i++) for (let k = i + 1; k < players.length; k++) {
    const a = players[i], b = players[k];
    if (rules.noFF && a.g === 'F' && b.g === 'F') continue;
    if (rules.noMM && a.g === 'M' && b.g === 'M') continue;
    out.push([a, b]);
  }
  return out;
};

/* "similar level" grouping. Each level plays among itself. A level with fewer than 4 players
   borrows players from the ADJACENT middle level (beginner+medium or medium+advanced; beginner
   and advanced never share a match). We pick the split that lets the most players play, using
   as few borrowed players as possible. */
function levelGroups(players) {
  const L = [1, 2, 3].map(l => players.filter(p => p.lv === l));
  const mid = shuffle(L[1]);
  let best = null;
  for (let x = 0; x <= mid.length; x++) for (let y = 0; x + y <= mid.length; y++) {
    const m = mid.length - x - y;
    const gs = [
      { name: 'low', g: [...L[0], ...mid.slice(0, x)], mixed: L[0].length > 0 && x > 0 },
      { name: 'mid', g: mid.slice(x, x + m), mixed: false },
      { name: 'high', g: [...L[2], ...mid.slice(x + m)], mixed: L[2].length > 0 && y > 0 },
    ];
    const covered = gs.reduce((a, o) => a + (o.g.length >= 4 ? o.g.length : 0), 0);
    const borrowed = gs.reduce((a, o) => a + (o.mixed ? (o.name === 'low' ? x : y) : 0), 0);
    if (!best || covered > best.covered || (covered === best.covered && borrowed < best.borrowed)) best = { gs, covered, borrowed };
  }
  const groups = best.gs.map(o => o.g).filter(g => g.length);
  const notes = [];
  best.gs.forEach(o => {
    if (o.mixed && o.g.length >= 4) notes.push(`ระดับ${o.name === 'low' ? 'เริ่มต้น' : 'เก่ง'}มีไม่ถึง 4 คน จึงรวมกับระดับปานกลางที่ติดกัน`);
  });
  return { groups, notes };
}

function generateSchedule(players, rules, skill = 'random') {
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
    c += k * k * 200 + k * 50;                 // strongly prefer partners not yet used
    return c;
  }
  function matchCost(t1, t2) {
    let c = teamCost(t1[0], t1[1]) + teamCost(t2[0], t2[1]);
    for (const x of t1) for (const y of t2) c += oc(x, y) * (rules.avoidRepeatOpp ? 12 : 2);
    if (skill !== 'random') c += Math.abs(t1[0].lv + t1[1].lv - t2[0].lv - t2[1].lv) * 35;   // evenly matched teams
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
    if (skill === 'close') bc += (Math.max(...four.map(p => p.lv)) - Math.min(...four.map(p => p.lv))) * 70;  // similar level on one court
    return { teams: best, cost: bc };
  }
  const arrange = sh => {
    let total = 0; const matches = [];
    for (let i = 0; i < sh.length / 4; i++) {
      const { teams, cost } = bestSplit(sh.slice(i * 4, i * 4 + 4));
      total += cost; matches.push(teams);
    }
    return { total, matches };
  };

  /* "ระดับใกล้กัน": each level group is its own pool. Levels only mix when a level is too small,
     and a pool stops playing as soon as all of its own partnerships are done. */
  const lg = skill === 'close' ? levelGroups(players) : { groups: [players], notes: [] };
  lg.notes.forEach(t => warnings.add(t));
  const pools = lg.groups.map(g => ({ g, allowed: allowedPairs(g, rules), done: false }));
  pools.forEach(pl => {
    if (pl.g.length < 4) {
      pl.done = true;
      warnings.add(`มีผู้เล่นไม่พอจะจับคู่ (${pl.g.map(p => p.name).join(', ')})`);
    }
  });
  const poolCovered = pl => pl.allowed.every(([a, b]) => pc(a, b) > 0);

  const out = [];
  for (let r = 0; r < MAX_ROUNDS && pools.some(pl => !pl.done); r++) {
    const matches = [], bench = [];
    pools.filter(pl => !pl.done).forEach(pl => {
      const per = Math.floor(pl.g.length / 4);
      // choose who plays
      const order = rules.fairRest
        ? shuffle(pl.g).sort((x, y) => games[x.id] - games[y.id] || lastPlayed[x.id] - lastPlayed[y.id])
        : shuffle(pl.g);
      const playing = order.slice(0, per * 4);
      bench.push(...order.slice(per * 4));

      // search for the best arrangement of the players on court
      let best = null, bestCost = Infinity;
      const tries = 80 + per * 40;
      for (let t = 0; t < tries; t++) {
        let sh = shuffle(playing);
        if (skill === 'close' && t % 3 === 0) sh = sh.sort((x, y) => x.lv - y.lv + (Math.random() - .5));
        let cur = arrange(sh);
        for (let k = 0; k < 30; k++) {
          const i = rand(sh.length), j2 = rand(sh.length);
          if (i === j2) continue;
          [sh[i], sh[j2]] = [sh[j2], sh[i]];
          const nx = arrange(sh);
          if (nx.total <= cur.total) cur = nx; else [sh[i], sh[j2]] = [sh[j2], sh[i]];
        }
        if (cur.total < bestCost) { bestCost = cur.total; best = cur.matches; }
      }
      best.forEach(tm => matches.push({ court: matches.length + 1, a: tm[0], b: tm[1] }));
    });

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
    pools.forEach(pl => { if (!pl.done && poolCovered(pl)) pl.done = true; });
  }

  if (pools.some(pl => !pl.done)) warnings.add(`ยังจับคู่ไม่ครบทุกคู่ภายใน ${MAX_ROUNDS} รอบ`);
  return { rounds: out, games, warnings: [...warnings] };
}

/* minimum rounds needed for a full cycle (used for the hint on the setup page) */
function minRounds(players, rules, skill) {
  const groups = skill === 'close' ? levelGroups(players).groups : [players];
  return Math.max(0, ...groups.filter(g => g.length >= 4)
    .map(g => Math.ceil(allowedPairs(g, rules).length / (Math.floor(g.length / 4) * 2))));
}

/* ================= Setup UI ================= */
function renderSetup() {
  const n = state.players.length;
  const need = n >= 4 ? minRounds(state.players, state.rules, state.skill) : 0;
  $('#roundsHint').textContent = n < 4 ? 'ต้องมีผู้เล่นอย่างน้อย 4 คน'
    : need ? `ระบบจะจับคู่ต่อเนื่องจนทุกคนได้เป็นคู่กันครบ อย่างน้อย ${need} รอบ`
    : 'ยังไม่มีระดับไหนมีผู้เล่นถึง 4 คน';
  $('#playerCount').textContent = n;

  const ul = $('#playerList');
  ul.innerHTML = '';
  state.players.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot ${p.g}"></span>
      <span class="nm">${esc(p.name)}</span>
      <button class="icobtn ${p.g}" data-id="${p.id}" type="button" title="${p.g === 'M' ? 'ชาย' : 'หญิง'} (กดเพื่อสลับเพศ)" aria-label="${p.g === 'M' ? 'ชาย' : 'หญิง'} กดเพื่อสลับเพศ"><svg class="gi" viewBox="0 0 24 24">${GENDER_SVG[p.g]}</svg></button>
      <button class="icobtn" data-lv="${p.id}" type="button" title="ระดับ${LEVELS[p.lv]} (กดเพื่อเปลี่ยนระดับ)" aria-label="ระดับ${LEVELS[p.lv]} กดเพื่อเปลี่ยนระดับ">${BARS(lvOf(p))}</button>
      <button class="del" data-del="${p.id}" type="button" aria-label="ลบ">×</button>`;
    ul.appendChild(li);
  });
}

function renderSkill() {
  $('#skillSeg').innerHTML = SKILL_MODES.map(m =>
    `<button type="button" data-skill="${m.key}" class="${state.skill === m.key ? 'on' : ''}">${m.title}</button>`).join('');
  $('#skillHint').textContent = SKILL_MODES.find(m => m.key === state.skill).desc;
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

function addPlayer(name, g, lv = 2) {
  name = name.trim();
  if (!name) return false;
  if (state.players.some(p => p.name === name)) { toast('มีชื่อนี้อยู่แล้ว'); return false; }
  state.players.push({ id: uid(), name, g, lv });
  return true;
}

const LEVEL_SHORT = ['', 'Beginner', 'Medium', 'Advanced'];
/* one-line add form: name + gender icon + level icon + "+" */
const draft = { g: 'M', lv: 2 };
function renderDraft() {
  const g = $('#addG'), l = $('#addLv');
  g.className = `icobtn ${draft.g}`;
  g.setAttribute('aria-label', `เพศ${draft.g === 'M' ? 'ชาย' : 'หญิง'} กดเพื่อสลับ`);
  g.innerHTML = `<svg class="gi" viewBox="0 0 24 24">${GENDER_SVG[draft.g]}</svg><small>${draft.g === 'M' ? 'Male' : 'Female'}</small>`;
  l.setAttribute('aria-label', `ระดับ${LEVELS[draft.lv]} กดเพื่อเปลี่ยน`);
  l.title = `ระดับ${LEVELS[draft.lv]} (กดเพื่อเปลี่ยน)`;
  l.innerHTML = `${BARS(draft.lv)}<small>${LEVEL_SHORT[draft.lv]}</small>`;
}

function bindSetup() {
  $('#addG').addEventListener('click', () => { draft.g = draft.g === 'M' ? 'F' : 'M'; renderDraft(); });
  $('#addLv').addEventListener('click', () => { draft.lv = draft.lv % 3 + 1; renderDraft(); });
  renderDraft();
  $('#addForm').addEventListener('submit', e => {
    e.preventDefault();
    if (addPlayer($('#nameInput').value, draft.g, draft.lv)) {
      $('#nameInput').value = ''; save(); renderSetup();
    }
    $('#nameInput').focus();
  });

  $('#playerList').addEventListener('click', e => {
    const gb = e.target.closest('[data-id]'), lb = e.target.closest('[data-lv]'), del = e.target.closest('[data-del]');
    if (gb) { const p = state.players.find(x => x.id === gb.dataset.id); p.g = p.g === 'M' ? 'F' : 'M'; }
    if (lb) { const p = state.players.find(x => x.id === lb.dataset.lv); p.lv = p.lv % 3 + 1; }
    if (del) state.players = state.players.filter(x => x.id !== del.dataset.del);
    if (gb || lb || del) { save(); renderSetup(); }
  });

  $('#skillSeg').addEventListener('click', e => {
    const b = e.target.closest('button[data-skill]'); if (!b) return;
    state.skill = b.dataset.skill; save(); renderSkill();
  });

  $('#btnClear').addEventListener('click', () => {
    if (state.players.length && confirm('ล้างรายชื่อผู้เล่นทั้งหมด?')) { state.players = []; save(); renderSetup(); }
  });

  const dlg = $('#bulkDialog');
  $('#btnBulk').addEventListener('click', () => { $('#bulkText').value = ''; dlg.showModal(); });
  $('#bulkOk').addEventListener('click', () => {
    let added = 0;
    $('#bulkText').value.split(/\r?\n/).forEach(line => {
      const t = line.trim().split(/[\s,]+/).filter(Boolean); if (!t.length) return;
      let g = 'M', lv = 2;
      while (t.length > 1) {
        const w = t[t.length - 1];
        if (/^(ช|ชาย|m|male)$/i.test(w)) g = 'M';
        else if (/^(ญ|หญิง|f|female)$/i.test(w)) g = 'F';
        else if (/^(เก่ง|สูง|a)$/i.test(w)) lv = 3;
        else if (/^(กลาง|ปานกลาง|b)$/i.test(w)) lv = 2;
        else if (/^(เริ่มต้น|ใหม่|มือใหม่|c)$/i.test(w)) lv = 1;
        else break;
        t.pop();
      }
      if (addPlayer(t.join(' '), g, lv)) added++;
    });
    save(); renderSetup(); toast(`เพิ่ม ${added} คน`);
  });

  $('#btnGo').addEventListener('click', start);
  $('#btnBack').addEventListener('click', showSetup);
}

/* ================= Result UI ================= */
function showSetup() {
  state.view = 'setup'; save();
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
  if (!generate()) {
    err.textContent = 'ไม่มีระดับไหนที่มีผู้เล่นถึง 4 คน จึงจับคู่ไม่ได้ ลองเพิ่มผู้เล่นหรือเปลี่ยนโหมดจับคู่';
    err.classList.remove('hidden');
    err.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  err.classList.add('hidden');
  state.view = 'result';
  $('#setup').classList.add('hidden');
  $('#result').classList.remove('hidden');
  $('#btnBack').classList.remove('hidden');
  window.scrollTo({ top: 0 });
  showRound(0, true);
}

function generate() {
  const sched = generateSchedule(state.players, state.rules, state.skill);
  if (!sched.rounds.length) return false;          // e.g. "similar level" with fewer than 4 players per level
  state.schedule = sched;
  applySchedule();
  return true;
}

function applySchedule() {
  const w = $('#warnBox');
  if (state.schedule.warnings.length) {
    w.innerHTML = state.schedule.warnings.join('<br>'); w.classList.remove('hidden');
  } else w.classList.add('hidden');
  renderChips();
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


const GENDER_SVG = {
  M: '<circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/>',
  F: '<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>',
};
const lvOf = p => p.lv || 2;
const BARS = lv => `<span class="lv lv${lv}" title="${LEVELS[lv]}"><i></i><i></i><i></i></span>`;

function chipHTML(p) {
  return `<div class="pchip ${p.g}"><svg class="gi" viewBox="0 0 24 24" aria-label="${p.g === 'M' ? 'ชาย' : 'หญิง'}">${GENDER_SVG[p.g]}</svg>`
    + `<span class="pname">${esc(p.name)}</span>${BARS(lvOf(p))}</div>`;
}

let animTimers = [];
function showRound(i, animate) {
  const rounds = state.schedule.rounds;
  state.current = Math.min(rounds.length - 1, Math.max(0, i));
  const rd = rounds[state.current];
  animTimers.forEach(t => { clearTimeout(t); clearInterval(t); }); animTimers = [];

  $('#roundLabel').textContent = `รอบที่ ${state.current + 1} / ${rounds.length}`;
  $('#prevRound').disabled = state.current === 0;
  $('#nextRound').disabled = state.current === rounds.length - 1;
  document.querySelectorAll('#roundChips button').forEach((b, k) => {
    b.classList.toggle('on', k === state.current);
    if (k === state.current) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  });

  const box = $('#courts'); box.innerHTML = '';

  rd.matches.forEach((m, mi) => {
    const wrap = document.createElement('div');
    wrap.className = 'match';
    const team = t => `<div class="team">${chipHTML(t[0])}${chipHTML(t[1])}</div>`;
    wrap.innerHTML = `<div class="mlabel">คู่ที่ ${mi + 1}</div>
      <div class="vsrow">${team(m.a)}<span class="vsx">VS</span>${team(m.b)}</div>`;
    box.appendChild(wrap);
  });

  save();

}

const tag = p => `${p.name} (${p.g === 'M' ? 'ช' : 'ญ'} ${'★'.repeat(lvOf(p))})`;

function scheduleText() {
  const lines = ['Badminton Pair'];
  state.schedule.rounds.forEach((rd, i) => {
    lines.push(`\nรอบ ${i + 1}`);
    rd.matches.forEach(m =>
      lines.push(`${tag(m.a[0])} + ${tag(m.a[1])}  vs  ${tag(m.b[0])} + ${tag(m.b[1])}`));
  });
  return lines.join('\n');
}

function bindResult() {
  $('#prevRound').addEventListener('click', () => showRound(state.current - 1, true));
  $('#nextRound').addEventListener('click', () => showRound(state.current + 1, true));
  $('#btnReshuffle').addEventListener('click', () => { if (generate()) { showRound(0, true); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
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

const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

/* The shareable picture: a branded "web page" card with rounded corners (transparent outside),
   a court-line header, one card per round, and the support QR at the bottom. */
async function renderImage() {
  try { await Promise.all([document.fonts.load('600 26px Prompt'), document.fonts.load('700 26px Prompt')]); } catch (e) {}
  const [logo, qr] = await Promise.all([loadImg('icons/icon-512.png'), loadImg('img/support-qr.jpg')]);
  const FONT = 'Prompt, system-ui, sans-serif';
  const W = 1080, PAD = 40, CW = W - PAD * 2, R = 64;
  const COL = { m: '#2f6fdc', f: '#e0508a', g9: '#0b2a4a', g8: '#087abf', lime: '#bfe8ff', neon: '#5fe3ff' };
  const rounds = state.schedule.rounds;
  const HEAD = 330, ROW = 92, RH = 62, GAP = 22;
  const QW = 640, QH = qr ? Math.round(QW * qr.naturalHeight / qr.naturalWidth) : 0;
  const FOOT = qr ? 146 + QH + 130 : 150;

  const cardH = rounds.map(rd => 64 + rd.matches.length * ROW + 16);
  const H = HEAD + GAP + cardH.reduce((a, b) => a + b + GAP, 0) + FOOT + PAD;

  const cv = document.createElement('canvas');
  // 2x for sharpness, but stay well under iPhone's ~16.7M-pixel canvas limit on long schedules
  const S = Math.min(2, Math.sqrt(12e6 / (W * H)));
  cv.width = Math.round(W * S); cv.height = Math.round(H * S);
  const ctx = cv.getContext('2d'); ctx.scale(S, S);
  ctx.textBaseline = 'middle';

  // rounded outer shape: everything outside stays transparent
  rr(ctx, 0, 0, W, H, R); ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#eef5ff'); bg.addColorStop(1, '#dcebff');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  /* ---------- header ---------- */
  const hg = ctx.createLinearGradient(0, 0, W, HEAD);
  hg.addColorStop(0, '#04122b'); hg.addColorStop(.55, '#0a3d9c'); hg.addColorStop(1, '#1a8cff');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, HEAD);
  const glow = ctx.createRadialGradient(W - 120, 40, 10, W - 120, 40, 460);
  glow.addColorStop(0, 'rgba(95,227,255,.45)'); glow.addColorStop(1, 'rgba(95,227,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, HEAD);
  // court lines motif
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 3;
  const cx0 = 790, cy0 = 112, cw = 230, ch = 184, cm = cy0 + ch / 2;
  ctx.strokeRect(cx0, cy0, cw, ch);
  ctx.beginPath();
  ctx.moveTo(cx0 + 22, cy0); ctx.lineTo(cx0 + 22, cy0 + ch); ctx.moveTo(cx0 + cw - 22, cy0); ctx.lineTo(cx0 + cw - 22, cy0 + ch);
  ctx.moveTo(cx0, cy0 + 16); ctx.lineTo(cx0 + cw, cy0 + 16); ctx.moveTo(cx0, cy0 + ch - 16); ctx.lineTo(cx0 + cw, cy0 + ch - 16);
  ctx.moveTo(cx0, cm - 48); ctx.lineTo(cx0 + cw, cm - 48); ctx.moveTo(cx0, cm + 48); ctx.lineTo(cx0 + cw, cm + 48);
  ctx.moveTo(cx0 + cw / 2, cy0); ctx.lineTo(cx0 + cw / 2, cm - 48); ctx.moveTo(cx0 + cw / 2, cm + 48); ctx.lineTo(cx0 + cw / 2, cy0 + ch);
  ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(cx0 - 14, cm); ctx.lineTo(cx0 + cw + 14, cm); ctx.stroke();
  ctx.restore();
  // logo
  ctx.save(); ctx.shadowColor = 'rgba(95,227,255,.75)'; ctx.shadowBlur = 34;
  ctx.fillStyle = '#0a3d9c'; rr(ctx, PAD, 44, 150, 150, 36); ctx.fill(); ctx.restore();
  if (logo) { ctx.save(); rr(ctx, PAD, 44, 150, 150, 36); ctx.clip(); ctx.drawImage(logo, PAD, 44, 150, 150); ctx.restore(); }
  ctx.strokeStyle = 'rgba(190,235,255,.7)'; ctx.lineWidth = 3; rr(ctx, PAD, 44, 150, 150, 36); ctx.stroke();
  // title
  ctx.font = `700 66px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('Badminton', PAD + 180, 96);
  const tw = ctx.measureText('Badminton ').width; ctx.fillStyle = '#7fe9ff'; ctx.fillText('Pair', PAD + 180 + tw, 96);
  ctx.font = `500 27px ${FONT}`; ctx.fillStyle = '#bfe3ff'; ctx.fillText('ตารางจับคู่แบดมินตันประเภทคู่', PAD + 182, 154);
  // info chips
  const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  let chipX = PAD;
  [dateStr, `${state.players.length} คน`, `${rounds.length} รอบ`].forEach(t => {
    ctx.font = `600 25px ${FONT}`; const w = ctx.measureText(t).width + 44;
    ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(ctx, chipX, 238, w, 52, 26); ctx.fill();
    ctx.strokeStyle = 'rgba(190,235,255,.45)'; ctx.lineWidth = 2; rr(ctx, chipX, 238, w, 52, 26); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText(t, chipX + 22, 265); chipX += w + 14;
  });
  const edge = ctx.createLinearGradient(0, 0, W, 0); edge.addColorStop(0, COL.neon); edge.addColorStop(1, '#1a8cff');
  ctx.fillStyle = edge; ctx.fillRect(0, HEAD - 6, W, 6);

  /* ---------- rounds ---------- */
  let y = HEAD + GAP + 14;
  rounds.forEach((rd, i) => {
    const h = cardH[i];
    ctx.save(); ctx.shadowColor = 'rgba(10,80,190,.16)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#fff'; rr(ctx, PAD, y, CW, h, 26); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#cfe2f6'; ctx.lineWidth = 2; rr(ctx, PAD, y, CW, h, 26); ctx.stroke();
    // round header bar
    const rg = ctx.createLinearGradient(PAD, 0, PAD + CW, 0); rg.addColorStop(0, COL.g9); rg.addColorStop(1, '#0a5fd6');
    ctx.fillStyle = rg; rr(ctx, PAD, y, CW, 52, 26); ctx.fill(); ctx.fillRect(PAD, y + 26, CW, 26);
    ctx.fillStyle = COL.neon; ctx.beginPath(); ctx.arc(PAD + 28, y + 26, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 28px ${FONT}`; ctx.fillText(`รอบที่ ${i + 1}`, PAD + 48, y + 27);
    ctx.fillStyle = COL.lime; ctx.font = `500 22px ${FONT}`; ctx.textAlign = 'right';
    ctx.fillText(`${rd.matches.length} คู่`, PAD + CW - 26, y + 27); ctx.textAlign = 'left';

    let ry = y + 64;
    rd.matches.forEach(m => {
      ctx.fillStyle = COL.g9; ctx.font = `700 22px ${FONT}`; ctx.fillText(`คู่ที่ ${m.court}`, PAD + 20, ry + RH / 2 + 4);
      const bx = PAD + 130, bw = (CW - 130 - 20 - 70) / 2;
      const vx = bx + bw + 35;
      // net: dashed line between the two sides
      ctx.save(); ctx.strokeStyle = '#a9cbe8'; ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
      ctx.beginPath(); ctx.moveTo(vx, ry - 8); ctx.lineTo(vx, ry + RH + 8); ctx.stroke(); ctx.restore();
      [[m.a, bx], [m.b, bx + bw + 70]].forEach(([team, x]) => {
        ctx.fillStyle = '#eef5fb'; rr(ctx, x, ry, bw, RH, 16); ctx.fill();
        team.forEach((p, k) => {
          const cy = ry + 17 + k * 29;
          // gender icon (same shapes as the on-screen SVG)
          const s = 20 / 24, ix = x + 12, iy = cy - 10;
          ctx.strokeStyle = p.g === 'M' ? COL.m : COL.f; ctx.lineWidth = 2 * s * 1.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath();
          if (p.g === 'M') { ctx.arc(ix + 10 * s, iy + 14 * s, 5 * s, 0, 7); ctx.moveTo(ix + 14 * s, iy + 10 * s); ctx.lineTo(ix + 20 * s, iy + 4 * s); ctx.moveTo(ix + 15 * s, iy + 4 * s); ctx.lineTo(ix + 20 * s, iy + 4 * s); ctx.lineTo(ix + 20 * s, iy + 9 * s); }
          else { ctx.arc(ix + 12 * s, iy + 9 * s, 5 * s, 0, 7); ctx.moveTo(ix + 12 * s, iy + 14 * s); ctx.lineTo(ix + 12 * s, iy + 21 * s); ctx.moveTo(ix + 9 * s, iy + 18 * s); ctx.lineTo(ix + 15 * s, iy + 18 * s); }
          ctx.stroke();
          // level bars
          const lv = lvOf(p);
          for (let b = 0; b < 3; b++) {
            const bh = 8 + b * 5;
            ctx.fillStyle = b < lv ? COL.g8 : '#c9dff2';
            rr(ctx, x + bw - 38 + b * 8, cy + 9 - bh, 5, bh, 1.5); ctx.fill();
          }
          ctx.fillStyle = '#0f2238'; ctx.font = `600 25px ${FONT}`; ctx.fillText(fit(ctx, p.name, bw - 96), x + 40, cy + 1);
        });
      });
      const vg = ctx.createLinearGradient(vx - 24, 0, vx + 24, 0); vg.addColorStop(0, '#bfe8ff'); vg.addColorStop(1, '#7fd0ff');
      ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(vx, ry + RH / 2, 24, 0, 7); ctx.fill();
      ctx.strokeStyle = COL.g9; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = COL.g9; ctx.font = `800 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('VS', vx, ry + RH / 2 + 1); ctx.textAlign = 'left';
      ry += ROW;
    });
    y += h + GAP;
  });

  /* ---------- support footer ---------- */
  const fg = ctx.createLinearGradient(0, y, W, y + FOOT);
  fg.addColorStop(0, '#04122b'); fg.addColorStop(.6, '#0a3d9c'); fg.addColorStop(1, '#1a8cff');
  ctx.save(); ctx.shadowColor = 'rgba(10,80,190,.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
  ctx.fillStyle = fg; rr(ctx, PAD, y, CW, FOOT, 40); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(190,235,255,.4)'; ctx.lineWidth = 2; rr(ctx, PAD, y, CW, FOOT, 40); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.font = `700 36px ${FONT}`; ctx.fillText('สนับสนุนเว็บไซต์', W / 2, y + 56);
  ctx.fillStyle = '#bfe3ff'; ctx.font = `500 22px ${FONT}`;
  ctx.fillText('ถ้าเว็บนี้ช่วยให้ก๊วนสนุกขึ้น สนับสนุนผู้พัฒนาได้ผ่าน QR นี้', W / 2, y + 104);
  let ty = y + 146;
  if (qr) {
    const qx = (W - QW) / 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,20,80,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#0a3d9c'; rr(ctx, qx, ty, QW, QH, QW * 0.082); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, qx, ty, QW, QH, QW * 0.082); ctx.clip(); ctx.drawImage(qr, qx, ty, QW, QH); ctx.restore();
    ty += QH;
  }
  ctx.fillStyle = '#7fe9ff'; ctx.font = `600 26px ${FONT}`; ctx.fillText('badminton-pair.vercel.app', W / 2, ty + 48);
  ctx.fillStyle = 'rgba(200,225,255,.7)'; ctx.font = `500 20px ${FONT}`; ctx.fillText('made with Badminton Pair', W / 2, ty + 88);
  ctx.textAlign = 'left';
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
renderSkill();
bindSetup();
bindResult();
if (state.schedule && state.view === 'result') {
  applySchedule();
  $('#setup').classList.add('hidden');
  $('#result').classList.remove('hidden');
  $('#btnBack').classList.remove('hidden');
  showRound(state.current, false);
}

// no pinch zoom (iOS Safari ignores user-scalable=no)
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
  document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
