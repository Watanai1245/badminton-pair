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

  /* ---- confetti burst ---- */
  function celebrate() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 120]);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90';
    const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const colors = ['#22c55e', '#4ade80', '#facc15', '#ffffff', '#38bdf8', '#f472b6', '#fb923c'];
    const ps = [];
    const burst = (x, y, n, power) => { for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * power;
      ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * .5, r: 3 + Math.random() * 4, c: colors[i % colors.length],
        rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1, shape: i % 3 });
    } };
    burst(W * .5, H * .38, 90, 9);
    setTimeout(() => burst(W * .2, H * .45, 60, 8), 220);
    setTimeout(() => burst(W * .8, H * .45, 60, 8), 380);
    setTimeout(() => burst(W * .5, H * .3, 70, 10), 700);
    const t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => {
        p.vy += .22; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .0075;
        if (p.life <= 0) return;
        ctx.globalAlpha = Math.min(1, p.life * 1.6); ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.shape === 0) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.6, 0, 7); ctx.fill(); }
        ctx.restore();
      });
      if (now - t0 < 3600) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }
  let shownWin = winner();            // don't celebrate a game that was already over on load

  function render() {
    const w = winner();
    if (w !== -1 && shownWin === -1) celebrate();
    shownWin = w;
    sides.forEach((el, k) => {
      const inp = el.querySelector('.tname');
      if (document.activeElement !== inp) inp.value = sb.names[k];
      el.querySelector('.pts').textContent = sb.score[k];
      el.classList.toggle('serving', sb.server === k);
      el.classList.toggle('won', w === k);
      el.classList.toggle('lost', w !== -1 && w !== k);
      el.querySelector('.pts').disabled = w !== -1;
      el.querySelector('.minus').disabled = sb.score[k] === 0;
    });
    document.querySelectorAll('#sbTarget button').forEach(b => b.classList.toggle('on', +b.dataset.t === sb.target));

    const sv = sb.server, side = sb.score[sv] % 2 === 0 ? 'ขวา' : 'ซ้าย';
    const [a, b] = sb.score, t = sb.target, cap = t + 9;
    let info = w === -1 ? `${sb.names[sv]} เสิร์ฟจากช่อง <b>${side}</b> (แต้มคู่ = ขวา, คี่ = ซ้าย)` : '';
    if (w === -1 && t === 21 && Math.max(a, b) === 11) info += '<br>ถึง 11 แต้มแล้ว พักช่วงเกมได้ 60 วินาที';
    $s('#sbInfo').innerHTML = info;

    // drama: deuce / game point / sudden-death point
    const wins = k => sb.score[k] + 1 >= cap || (sb.score[k] + 1 >= t && sb.score[k] + 1 - sb.score[1 - k] >= 2);
    let kind = '', title = '', sub = '';
    if (w === -1) {
      if (a === b && a === cap - 1) { kind = 'golden'; title = 'แต้มทอง'; sub = `${a}-${b} ใครได้แต้มต่อไปชนะเกมทันที`; }
      else if (a === b && a >= t - 1) { kind = 'deuce'; title = 'DEUCE'; sub = 'เสมอ ต้องนำ 2 แต้มถึงจะชนะ'; }
      else if (wins(0) !== wins(1)) { const k = wins(0) ? 0 : 1; kind = 'point'; title = 'GAME POINT'; sub = `${sb.names[k]} ได้แต้มต่อไปชนะเกม`; }
    }
    const box = $s('#sbAlert');
    box.className = 'alert' + (kind ? ' ' + kind : ' hidden');
    $s('#sbAlertTitle').textContent = title; $s('#sbAlertSub').textContent = sub;
    $s('#sb').classList.toggle('hot', kind === 'deuce' || kind === 'golden');
    sides.forEach((el, k) => el.classList.toggle('mp', kind === 'point' && wins(k)));

    $s('#sbWin').classList.toggle('hidden', w === -1);
    if (w !== -1) { $s('#sbWinTxt').textContent = `${sb.names[w]} ชนะ!`; $s('#sbWinSub').textContent = `เกมที่ ${sb.games.length + 1} · ${a} – ${b}`; }
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

  render();
})();
