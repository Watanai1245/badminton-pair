'use strict';

/* ================= Tabs + shared helpers ================= */
const TAB_KEY = 'bp-tab-v1';
const TABS = ['pair', 'score', 'warmup', 'tips'];

function showTab(name, remember = true) {
  if (!TABS.includes(name)) name = 'pair';
  TABS.forEach(t => document.getElementById('view-' + t).classList.toggle('hidden', t !== name));
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  document.body.dataset.tab = name;
  if (remember) { try { localStorage.setItem(TAB_KEY, name); } catch (e) { /* ignore */ } }
  window.scrollTo({ top: 0 });
  keepAwake(name === 'score');
  document.dispatchEvent(new CustomEvent('tabchange', { detail: name }));
}

/* keep the screen on while scoring or running a warm-up */
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

document.getElementById('tabbar').addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab);
});

let startTab = 'pair';
try { startTab = localStorage.getItem(TAB_KEY) || 'pair'; } catch (e) { /* ignore */ }
showTab(startTab, false);
