'use strict';

/* ================= Scoreboard tab ================= */
(() => {
  const KEY = 'bp-score-v1';
  const $s = s => document.querySelector(s);
  const sb = {
    names: ['ทีม A', 'ทีม B'], target: 21, score: [0, 0], server: 0,
    stack: [], games: [], wins: [0, 0],
  };

  try { Object.assign(sb, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* ignore */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(sb)); } catch (e) { /* ignore */ } };

  // first to target with a 2-point lead, hard cap at target + 9 (21 -> 30)
  function winner() {
    const [a, b] = sb.score, t = sb.target;
    if (a >= t + 9 || b >= t + 9 || ((a >= t || b >= t) && Math.abs(a - b) >= 2)) return a > b ? 0 : 1;
    return -1;
  }

  const sides = [$s('#sbA'), $s('#sbB')];

  function render() {
    const w = winner();
    sides.forEach((el, k) => {
      const inp = el.querySelector('.tname');
      if (document.activeElement !== inp) inp.value = sb.names[k];
      el.querySelector('.pts').textContent = sb.score[k];
      el.classList.toggle('serving', sb.server === k);
      el.classList.toggle('won', w === k);
      el.querySelector('.pts').disabled = w !== -1;
      el.querySelector('.minus').disabled = sb.score[k] === 0;
    });
    document.querySelectorAll('#sbTarget button').forEach(b => b.classList.toggle('on', +b.dataset.t === sb.target));

    const sv = sb.server, side = sb.score[sv] % 2 === 0 ? 'ขวา' : 'ซ้าย';
    const [a, b] = sb.score;
    let info = w === -1 ? `🏸 ${sb.names[sv]} เสิร์ฟ จากช่อง <b>${side}</b> (แต้มคู่ = ขวา, แต้มคี่ = ซ้าย)` : '';
    if (w === -1 && sb.target === 21 && Math.max(a, b) === 11) info += '<br>⏱ ถึง 11 แต้มแล้ว — พักช่วงเกมได้ 60 วินาที';
    if (w === -1 && a === b && a >= sb.target - 1) info += '<br>⚖️ เสมอช่วงท้ายเกม — ต้องนำ 2 แต้มถึงจะชนะ';
    $s('#sbInfo').innerHTML = info;

    $s('#sbWin').classList.toggle('hidden', w === -1);
    if (w !== -1) $s('#sbWinTxt').textContent = `🏆 ${sb.names[w]} ชนะเกมที่ ${sb.games.length + 1} (${a}–${b})`;
    $s('#sbUndo').disabled = !sb.stack.length;

    $s('#sbTally').textContent = `${sb.wins[0]} - ${sb.wins[1]}`;
    $s('#sbHist').innerHTML = sb.games.length
      ? sb.games.map((g, i) => `<div class="hrow"><span>เกม ${i + 1}</span>
          <b class="${g[0] > g[1] ? 'w' : ''}">${g[0]}</b><span>–</span><b class="${g[1] > g[0] ? 'w' : ''}">${g[1]}</b></div>`).join('')
      : '<p class="hint">ยังไม่มีเกมที่จบ</p>';
    persist();
  }

  const snap = () => sb.stack.push({ score: sb.score.slice(), server: sb.server });

  function point(k, d) {
    if (winner() !== -1 && d > 0) return;
    if (d < 0 && sb.score[k] === 0) return;
    snap();
    sb.score[k] += d;
    if (d > 0) sb.server = k;           // rally point: whoever wins the rally serves next
    if (navigator.vibrate) navigator.vibrate(8);
    render();
  }

  sides.forEach((el, k) => {
    el.querySelector('.pts').addEventListener('click', () => point(k, 1));
    el.querySelector('.minus').addEventListener('click', () => point(k, -1));
    el.querySelector('.srv').addEventListener('click', () => {
      if (sb.score[0] + sb.score[1] === 0) { sb.server = k; render(); }
    });
    el.querySelector('.tname').addEventListener('input', e => { sb.names[k] = e.target.value || `ทีม ${k ? 'B' : 'A'}`; persist(); });
    el.querySelector('.tname').addEventListener('blur', render);
  });

  $s('#sbTarget').addEventListener('click', e => {
    const b = e.target.closest('button[data-t]'); if (!b) return;
    sb.target = +b.dataset.t; render();
  });

  $s('#sbUndo').addEventListener('click', () => {
    const s = sb.stack.pop(); if (!s) return;
    sb.score = s.score; sb.server = s.server; render();
  });

  $s('#sbSwap').addEventListener('click', () => {
    sb.names.reverse(); sb.score.reverse(); sb.wins.reverse(); sb.server = 1 - sb.server;
    sb.games = sb.games.map(g => [g[1], g[0]]); sb.stack = []; render();
  });

  $s('#sbNext').addEventListener('click', () => {
    const w = winner(); if (w === -1) return;
    sb.games.push(sb.score.slice()); sb.wins[w]++;
    sb.score = [0, 0]; sb.server = w; sb.stack = []; render();
  });

  $s('#sbReset').addEventListener('click', () => {
    if ((sb.score[0] + sb.score[1] || sb.games.length) && !confirm('เริ่มนับแต้มใหม่ทั้งหมด (ล้างผลทุกเกม)?')) return;
    Object.assign(sb, { score: [0, 0], server: 0, stack: [], games: [], wins: [0, 0] }); render();
  });

  /* pick names from the pairing schedule */
  function fillPick() {
    const sel = $s('#sbPick');
    sel.length = 1;
    if (typeof state === 'undefined' || !state.schedule) return;
    state.schedule.rounds.forEach((rd, ri) => rd.matches.forEach(m => {
      const o = document.createElement('option');
      o.value = `${ri}-${m.court}`;
      o.textContent = `รอบ ${ri + 1} คอร์ด ${m.court}: ${m.a[0].name}/${m.a[1].name} vs ${m.b[0].name}/${m.b[1].name}`;
      sel.appendChild(o);
    }));
  }
  $s('#sbPick').addEventListener('change', e => {
    if (!e.target.value) return;
    const [ri, court] = e.target.value.split('-').map(Number);
    const m = state.schedule.rounds[ri].matches.find(x => x.court === court);
    if (!m) return;
    if ((sb.score[0] + sb.score[1] || sb.games.length) && !confirm('โหลดแมตช์ใหม่จะล้างคะแนนปัจจุบัน ต้องการต่อไหม?')) { e.target.value = ''; return; }
    sb.names = [`${m.a[0].name}/${m.a[1].name}`, `${m.b[0].name}/${m.b[1].name}`];
    Object.assign(sb, { score: [0, 0], server: 0, stack: [], games: [], wins: [0, 0] });
    render();
  });
  document.addEventListener('tabchange', e => { if (e.detail === 'score') fillPick(); });

  render();
})();
