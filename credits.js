'use strict';
/* Image credits (all from Wikimedia Commons) — shown in the app and required by the CC BY-SA licences. */
const IMG = {
 "smash-seq": {
  "src": "img/smash-seq.gif",
  "title": "Smashsequence.gif",
  "author": "Asif Ahamed Jishan",
  "license": "CC BY-SA 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Smashsequence.gif"
 },
 "serve-double": {
  "src": "img/serve-double.png",
  "title": "Badminton Serve Double.png",
  "author": "ไม่ระบุผู้สร้าง",
  "license": "CC BY-SA 3.0",
  "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
  "page": "https://commons.wikimedia.org/wiki/File:Badminton_Serve_Double.png"
 },
 "split-step": {
  "src": "img/split-step.gif",
  "title": "Badminton-Umsprung.gif",
  "author": "David Bettencourt da Cruz",
  "license": "CC BY-SA 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Badminton-Umsprung.gif"
 },
 "home-t": {
  "src": "img/home-t.png",
  "title": "2006 09 04-Cruz-162x308-Das T.png",
  "author": "David Bettencourt da Cruz",
  "license": "CC BY-SA 3.0",
  "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
  "page": "https://commons.wikimedia.org/wiki/File:2006_09_04-Cruz-162x308-Das_T.png"
 },
 "footwork-v": {
  "src": "img/footwork-v.gif",
  "title": "Badminton-Footwork-V-Slow.gif",
  "author": "David Bettencourt da Cruz",
  "license": "CC BY-SA 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Badminton-Footwork-V-Slow.gif"
 },
 "doubles-defence-anim": {
  "src": "img/doubles-defence-anim.gif",
  "title": "2006-10-03 Cruz 162x308 Badminton Verteidigung im Doppel.gif",
  "author": "David Bettencourt da Cruz",
  "license": "CC BY-SA 3.0",
  "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
  "page": "https://commons.wikimedia.org/wiki/File:2006-10-03_Cruz_162x308_Badminton_Verteidigung_im_Doppel.gif"
 },
 "cdc-lunge": {
  "src": "img/cdc-lunge.gif",
  "title": "Lunge-CDC strength training for older adults.gif",
  "author": "Centers for Disease Control and Prevention (CDC)",
  "license": "Public domain",
  "licenseUrl": "",
  "page": "https://commons.wikimedia.org/wiki/File:Lunge-CDC_strength_training_for_older_adults.gif"
 },
 "cdc-hamstring": {
  "src": "img/cdc-hamstring.gif",
  "title": "Hamstring stretch-CDC strength training for older adults.gif",
  "author": "Centers for Disease Control and Prevention (CDC)",
  "license": "Public domain",
  "licenseUrl": "",
  "page": "https://commons.wikimedia.org/wiki/File:Hamstring_stretch-CDC_strength_training_for_older_adults.gif"
 },
 "cdc-quad": {
  "src": "img/cdc-quad.gif",
  "title": "Quad stretch-CDC strength training for older adults.gif",
  "author": "Centers for Disease Control and Prevention (CDC)",
  "license": "Public domain",
  "licenseUrl": "",
  "page": "https://commons.wikimedia.org/wiki/File:Quad_stretch-CDC_strength_training_for_older_adults.gif"
 },
 "cdc-chest": {
  "src": "img/cdc-chest.gif",
  "title": "Chest stretch-CDC strength training for older adults.gif",
  "author": "Centers for Disease Control and Prevention (CDC)",
  "license": "Public domain",
  "licenseUrl": "",
  "page": "https://commons.wikimedia.org/wiki/File:Chest_stretch-CDC_strength_training_for_older_adults.gif"
 }
};

const esc2 = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function creditsHTML(keys) {
  const items = keys.filter(k => IMG[k]).map(k => {
    const m = IMG[k], name = m.title.replace(/\.[a-z]+$/i, '').replace(/^\d{4}[ -]\d{2}[ -]\d{2}[ -]/, '');
    return `<li>${esc2(name)} · ${esc2(m.author)} · ${m.licenseUrl ? `<a href="${m.licenseUrl}" target="_blank" rel="noopener">${esc2(m.license)}</a>` : esc2(m.license)} · <a href="${m.page}" target="_blank" rel="noopener">Wikimedia Commons</a></li>`;
  });
  return items.length ? `<details class="credits"><summary>แหล่งที่มารูปภาพ</summary><ul>${items.join('')}</ul></details>` : '';
}
const linksHTML = (title, links) => (links && links.length
  ? `<div class="card morelinks"><h3>${title}</h3><ul>${links.map(l => `<li><a href="${l.u}" target="_blank" rel="noopener">${esc2(l.t)}</a></li>`).join('')}</ul><p class="hint">เว็บภายนอก ภาษาอังกฤษ</p></div>` : '');
