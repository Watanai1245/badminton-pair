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

  document.getElementById('view-hub').classList.toggle('hidden', view !== 'hub');
  FEATURES.forEach(f => document.getElementById('view-' + f.id).classList.toggle('hidden', f.id !== view));
  document.body.dataset.tab = view;

  // header
  document.getElementById('btnHome').classList.toggle('hidden', view === 'hub');
  document.getElementById('pageTitle').textContent = view === 'hub' ? 'Badminton Pair' : feat(view).name;
  document.getElementById('brandLogo').classList.toggle('hidden', view !== 'hub');

  if (view !== 'hub' && !fromPop) history.pushState({ v: view }, '');
  window.scrollTo({ top: 0 });
  keepAwake(view === 'score');
  document.dispatchEvent(new CustomEvent('tabchange', { detail: view }));
}

/* launcher grid */
document.getElementById('hubGrid').innerHTML = FEATURES.map(f =>
  `<button type="button" class="tile" data-go="${f.id}"><span class="ico">${svgIcon(f.icon)}</span><b>${f.name}</b><small>${f.desc}</small></button>`).join('');

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
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === 'dark' ? '#0f2a4a' : '#087abf';
}
document.getElementById('btnTheme').addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(t);
  try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
});
applyTheme(document.documentElement.dataset.theme || 'light');

/* ---------- start: always open on the function hub ---------- */
showTab('hub', true);
