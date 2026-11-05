'use strict';

/* ================= Navigation: hub of independent features + theme ================= */
const THEME_KEY = 'bp-theme';

const FEATURES = [
  { id: 'pair', name: 'จับคู่', desc: 'จัดคู่ตามระดับและเงื่อนไข',
    icon: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15.5 14.2c3 0 5.5 1.6 5.5 4.3"/>' },
  { id: 'score', name: 'นับแต้ม', desc: 'สกอร์บอร์ดระหว่างเล่น',
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M6.5 12h2M15.5 12h2"/>' },
  { id: 'cost', name: 'ค่าสนาม', desc: 'หารค่าสนามและลูกแบด',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M10 7v10M10 7h3.2a2.3 2.3 0 010 4.6H10m0 0h3.8a2.7 2.7 0 010 5.4H10"/>' },
  { id: 'warmup', name: 'วอร์มอัพ', desc: 'ตัวจับเวลานำวอร์มอัพ',
    icon: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>' },
  { id: 'tips', name: 'เทคนิค', desc: 'จับไม้ ลูกตี ฟุตเวิร์ก',
    icon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>' },
];
/* (grid icon no longer used) */
const GRID_ICON = '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>';
const svgIcon = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const feat = id => FEATURES.find(f => f.id === id);

let currentFeature = 'pair';
let currentView = 'hub';

function showTab(view, fromPop = false) {
  if (view !== 'hub' && !feat(view)) view = 'hub';
  currentView = view;
  if (view !== 'hub') currentFeature = view;

  document.body.classList.toggle('is-hub', view === 'hub');
  setBarColor();
  document.getElementById('view-hub').classList.toggle('hidden', view !== 'hub');
  FEATURES.forEach(f => document.getElementById('view-' + f.id).classList.toggle('hidden', f.id !== view));
  document.body.dataset.tab = view;

  // header
  document.getElementById('btnHome').classList.toggle('hidden', view === 'hub');
  document.getElementById('pageTitle').textContent = view === 'hub' ? 'Badminton Pair' : feat(view).name;

  if (view !== 'hub' && !fromPop) history.pushState({ v: view }, '');
  window.scrollTo({ top: 0 });
  keepAwake(view === 'score');
  document.dispatchEvent(new CustomEvent('tabchange', { detail: view }));
}

/* launcher grid */
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
document.getElementById('hubGrid').innerHTML = FEATURES.map((f, i) =>
  `<button type="button" class="tile${i === 0 ? ' feat' : ''}" data-go="${f.id}">
     <span class="ico">${svgIcon(f.icon)}</span>
     <b>${f.name}</b><small>${f.desc}</small>
     <span class="go">${ARROW}</span>
   </button>`).join('');

document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (b) showTab(b.dataset.go);
});
document.getElementById('btnHome').addEventListener('click', () => {
  if (history.state && history.state.v) history.back(); else showTab('hub', true);
});
window.addEventListener('popstate', () => showTab('hub', true));

/* keep the screen on while scoring */
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && document.body.dataset.tab === 'score') keepAwake(true);
});

/* short beep (needs a user gesture first) */
let audioCtx = null;
function beep(freq = 880, ms = 160) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + ms / 1000);
    o.start(); o.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) { /* no audio */ }
}

/* ---------- theme ---------- */
function setBarColor() {
  const m = document.querySelector('meta[name="theme-color"]');
  if (!m) return;
  const dark = document.documentElement.dataset.theme === 'dark';
  m.content = document.body.classList.contains('is-hub') ? (dark ? '#04122b' : '#e6f2ff') : (dark ? '#050f20' : '#eaf4ff');
}
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  setBarColor();
}
document.querySelectorAll('.js-theme').forEach(b => b.addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(t);
  try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
}));
applyTheme(document.documentElement.dataset.theme || 'light');

/* ---------- start: always open on the function hub ---------- */
showTab('hub', true);

/* ---------- save the support QR as a branded 3:4 card ---------- */
async function renderQrCard() {
  try { await Promise.all([document.fonts.load('600 30px Prompt'), document.fonts.load('700 30px Prompt')]); } catch (e) {}
  const [logo, qr] = await Promise.all([loadImg('icons/icon-512.png'), loadImg('img/support-qr.jpg')]);
  const FONT = 'Prompt, system-ui, sans-serif', W = 1080, H = 1440, S = 2, R = 64;     // 3:4 portrait
  const cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
  const ctx = cv.getContext('2d'); ctx.scale(S, S); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  rr(ctx, 0, 0, W, H, R); ctx.clip();                                    // rounded outer shape, transparent corners

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#04122b'); bg.addColorStop(.55, '#0a3d9c'); bg.addColorStop(1, '#1a8cff');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W - 140, 120, 10, W - 140, 120, 620);
  glow.addColorStop(0, 'rgba(95,227,255,.40)'); glow.addColorStop(1, 'rgba(95,227,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // faint badminton court as the backdrop
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.085)'; ctx.lineWidth = 4;
  const cx = 90, cy = 90, cw = W - 180, ch = H - 180, mid = cy + ch / 2;
  ctx.strokeRect(cx, cy, cw, ch);
  ctx.beginPath();
  ctx.moveTo(cx + 46, cy); ctx.lineTo(cx + 46, cy + ch); ctx.moveTo(cx + cw - 46, cy); ctx.lineTo(cx + cw - 46, cy + ch);
  ctx.moveTo(cx, cy + 36); ctx.lineTo(cx + cw, cy + 36); ctx.moveTo(cx, cy + ch - 36); ctx.lineTo(cx + cw, cy + ch - 36);
  ctx.moveTo(cx, mid - 150); ctx.lineTo(cx + cw, mid - 150); ctx.moveTo(cx, mid + 150); ctx.lineTo(cx + cw, mid + 150);
  ctx.moveTo(cx + cw / 2, cy); ctx.lineTo(cx + cw / 2, mid - 150); ctx.moveTo(cx + cw / 2, mid + 150); ctx.lineTo(cx + cw / 2, cy + ch);
  ctx.stroke(); ctx.lineWidth = 8; ctx.setLineDash([16, 12]);
  ctx.beginPath(); ctx.moveTo(cx - 20, mid); ctx.lineTo(cx + cw + 20, mid); ctx.stroke();
  ctx.restore();

  // logo + wordmark
  const LS = 132, lx = (W - LS) / 2, ly = 78;
  ctx.save(); ctx.shadowColor = 'rgba(95,227,255,.75)'; ctx.shadowBlur = 40; ctx.fillStyle = '#0a3d9c'; rr(ctx, lx, ly, LS, LS, 32); ctx.fill(); ctx.restore();
  if (logo) { ctx.save(); rr(ctx, lx, ly, LS, LS, 32); ctx.clip(); ctx.drawImage(logo, lx, ly, LS, LS); ctx.restore(); }
  ctx.strokeStyle = 'rgba(190,235,255,.7)'; ctx.lineWidth = 3; rr(ctx, lx, ly, LS, LS, 32); ctx.stroke();
  ctx.font = `700 52px ${FONT}`; ctx.textAlign = 'left';
  const w1 = ctx.measureText('Badminton ').width, w2 = ctx.measureText('Pair').width, x0 = (W - w1 - w2) / 2;
  ctx.fillStyle = '#fff'; ctx.fillText('Badminton', x0, 262); ctx.fillStyle = '#7fe9ff'; ctx.fillText('Pair', x0 + w1, 262);
  ctx.textAlign = 'center';
  const ln = ctx.createLinearGradient(W / 2 - 90, 0, W / 2 + 90, 0); ln.addColorStop(0, 'rgba(95,227,255,0)'); ln.addColorStop(.5, '#5fe3ff'); ln.addColorStop(1, 'rgba(95,227,255,0)');
  ctx.fillStyle = ln; ctx.fillRect(W / 2 - 90, 308, 180, 5);

  // heading
  ctx.fillStyle = '#fff'; ctx.font = `700 70px ${FONT}`; ctx.fillText('สนับสนุนเว็บไซต์', W / 2, 392);
  ctx.fillStyle = '#bfe3ff'; ctx.font = `500 31px ${FONT}`;
  ctx.fillText('ถ้าเว็บนี้ช่วยให้ก๊วนสนุกขึ้น', W / 2, 470); ctx.fillText('สนับสนุนผู้พัฒนาได้ผ่าน QR นี้', W / 2, 514);

  // QR card
  const QW = 880, QH = qr ? Math.round(QW * qr.naturalHeight / qr.naturalWidth) : 530, qx = (W - QW) / 2, qy = 580, qr_r = QW * 0.082;
  ctx.save(); ctx.shadowColor = 'rgba(0,15,70,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#0a3d9c'; rr(ctx, qx, qy, QW, QH, qr_r); ctx.fill(); ctx.restore();
  if (qr) { ctx.save(); rr(ctx, qx, qy, QW, QH, qr_r); ctx.clip(); ctx.drawImage(qr, qx, qy, QW, QH); ctx.restore(); }

  // footer
  ctx.fillStyle = '#bfe3ff'; ctx.font = `500 29px ${FONT}`; ctx.fillText('สแกนผ่านแอปธนาคารเพื่อสนับสนุน ขอบคุณครับ', W / 2, qy + QH + 66);
  ctx.fillStyle = '#7fe9ff'; ctx.font = `600 38px ${FONT}`; ctx.fillText('badminton-pair.vercel.app', W / 2, H - 150);
  ctx.fillStyle = 'rgba(200,225,255,.7)'; ctx.font = `500 24px ${FONT}`; ctx.fillText('made with Badminton Pair', W / 2, H - 100);
  return cv;
}

let qrBlob = null, qrUrl = null;
async function getQrCard() {
  if (qrBlob) return qrBlob;
  const cv = await renderQrCard();
  qrBlob = await new Promise(r => cv.toBlob(r, 'image/png'));
  qrUrl = URL.createObjectURL(qrBlob);
  return qrBlob;
}

async function saveQr() {
  const btn = document.getElementById('btnQrSave'), old = btn.textContent;
  btn.disabled = true; btn.textContent = 'กำลังสร้างรูป…';
  try {
    const blob = await getQrCard();
    const file = new File([blob], 'badminton-pair-support-qr.png', { type: 'image/png' });
    // phones: system share sheet ("Save Image", Photos, LINE…)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'QR สนับสนุนเว็บไซต์' }); toast('บันทึกรูป QR สำเร็จ', 'ok'); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    // touch device without file sharing (in-app browsers): show the card to long-press and save
    if (window.matchMedia('(pointer: coarse)').matches) {
      document.querySelector('#qrViewer img').src = qrUrl;
      document.getElementById('qrViewer').classList.remove('hidden');
      return;
    }
    // desktop: normal download
    const a = document.createElement('a'); a.href = qrUrl; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    toast('บันทึกรูป QR สำเร็จ', 'ok');
  } catch (e) { toast('สร้างรูปไม่สำเร็จ', 'error'); console.error(e); }
  finally { btn.disabled = false; btn.textContent = old; }
}
document.getElementById('btnQrSave').addEventListener('click', saveQr);
document.getElementById('qrClose').addEventListener('click', () => document.getElementById('qrViewer').classList.add('hidden'));
document.getElementById('qrViewer').addEventListener('click', e => { if (e.target.id === 'qrViewer') e.currentTarget.classList.add('hidden'); });
