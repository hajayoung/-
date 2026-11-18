// 장면마다 1080x1920 PNG를 만들고, ffmpeg로 이어 붙여 MP4를 만들어요.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const EPS = require('./episodes.js');
const only = process.argv[2];

const C = { bg: '#F5EFE4', ink: '#1F1B16', mute: '#8A8073', accent: '#E2583A', soft: '#EADFCB', card: '#FFFFFF' };

const fontFace = ['Regular:400', 'SemiBold:600', 'Bold:700', 'ExtraBold:800', 'Black:900'].map(s => {
  const [n, w] = s.split(':');
  return `@font-face{font-family:P;font-weight:${w};src:url(file://${DIR}/fonts/Pretendard-${n}.otf)}`;
}).join('');

const fmt = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/\[([^\]]+)\]/g, '<em>$1</em>').replace(/\n/g, '<br>');

// ---- 도식 ----
function person(x, y, me, label) {
  const c = me ? C.accent : C.ink;
  return `<g><circle cx="${x}" cy="${y - 34}" r="26" fill="${c}"/>
    <path d="M${x - 42} ${y + 40} Q${x} ${y - 20} ${x + 42} ${y + 40} Z" fill="${c}"/>
    ${label ? `<text x="${x}" y="${y + 86}" text-anchor="middle" font-size="34" font-weight="800" fill="${C.accent}">${label}</text>` : ''}</g>`;
}
function arrow(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.accent}" stroke-width="7" stroke-linecap="round" marker-end="url(#ah)"/>`;
}
const defs = `<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="${C.accent}"/></marker></defs>`;

function ring(mode) {
  const cx = 380, cy = 250;
  const R = mode === 'open' ? 190 : 150;
  const angs = mode === 'open' ? [150, -90, -10] : [-150, -30, 90];
  const ppl = angs.map(a => [cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180)]);
  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.mute}" stroke-width="5" stroke-dasharray="${mode === 'closed' ? '0' : '14 14'}"/>`;
  s += ppl.map(([x, y]) => person(x, y)).join('');
  if (mode === 'closed') s += person(650, 470, true, '나');
  if (mode === 'gap') { s += person(cx + 175, cy + 140, true, '나'); s += arrow(650, 470, cx + 230, cy + 190); }
  if (mode === 'open') {
    const me = [cx + R * Math.cos(60 * Math.PI / 180), cy + R * Math.sin(60 * Math.PI / 180)];
    s += person(me[0], me[1], true, '나');
    ppl.forEach(([x, y]) => { const dx = me[0] - x, dy = me[1] - y, L = Math.hypot(dx, dy); s += arrow(x + dx / L * 70, y + dy / L * 70, x + dx / L * 150, y + dy / L * 150); });
  }
  return s;
}
function table(mode) {
  let s = `<rect x="110" y="200" width="540" height="130" rx="26" fill="${C.soft}" stroke="${C.ink}" stroke-width="5"/>`;
  const xs = [180, 300, 420, 540];
  const seat = (x, y, me) => `<circle cx="${x}" cy="${y}" r="36" fill="${me ? C.accent : C.ink}"/>`;
  if (mode !== 'mine') s += `<ellipse cx="240" cy="265" rx="200" ry="215" fill="${C.accent}" opacity="${mode === 'split' ? 0.14 : 0.08}"/>`;
  if (mode === 'split') s += `<ellipse cx="480" cy="265" rx="140" ry="215" fill="none" stroke="${C.mute}" stroke-width="5" stroke-dasharray="14 14"/>
     <text x="240" y="40" text-anchor="middle" font-size="34" font-weight="800" fill="${C.accent}">대화 1 (시끄러운 쪽)</text>
     <text x="560" y="40" text-anchor="middle" font-size="34" font-weight="800" fill="${C.mute}">대화 2</text>`;
  if (mode === 'mine') s += `<ellipse cx="480" cy="265" rx="160" ry="215" fill="${C.accent}" opacity="0.16"/>
     <text x="480" y="40" text-anchor="middle" font-size="36" font-weight="800" fill="${C.accent}">우리 대화</text>`;
  xs.forEach(x => { s += seat(x, 140); s += seat(x, 390, x === 540); });
  s += `<text x="540" y="480" text-anchor="middle" font-size="34" font-weight="800" fill="${C.accent}">나</text>`;
  if (mode === 'plain') s += arrow(480, 440, 360, 440);
  return s;
}
function dia(name) {
  const body = { ringClosed: ring('closed'), ringGap: ring('gap'), ringOpen: ring('open'),
    table: table('plain'), tableSplit: table('split'), tableMine: table('mine') }[name];
  return `<svg class="dia" viewBox="0 -10 760 540" width="760" height="540" font-family="P">${defs}${body}</svg>`;
}

function html(ep, b, i, n) {
  const chat = b.chat ? `<div class="chat">${b.chat.map(m => `<div class="b ${m.s}${m.think ? ' think' : ''}">${fmt(m.t)}</div>`).join('')}</div>` : '';
  const list = b.list ? `<ol class="list">${b.list.map(t => `<li>${fmt(t)}</li>`).join('')}</ol>` : '';
  return `<!doctype html><meta charset="utf-8"><style>${fontFace}
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1920px;background:${C.bg};color:${C.ink};font-family:P;overflow:hidden;position:relative}
  .bar{position:absolute;top:120px;left:90px;right:90px;height:10px;border-radius:5px;background:${C.soft}}
  .bar i{display:block;height:100%;border-radius:5px;background:${C.accent};width:${((i + 1) / n * 100).toFixed(1)}%}
  .top{position:absolute;top:160px;left:90px;font-size:36px;font-weight:700;color:${C.mute}}
  .wrap{position:absolute;top:260px;bottom:420px;left:90px;right:90px;display:flex;flex-direction:column;justify-content:center;gap:52px}
  .kicker{font-size:44px;font-weight:700;color:${C.mute}}
  .num{width:108px;height:108px;border-radius:54px;background:${C.accent};color:#fff;font-size:64px;font-weight:900;display:flex;align-items:center;justify-content:center}
  .big{font-size:${Math.min(b.cta ? 104 : 100, Math.floor(880 / Math.max(...b.big.replace(/\[|\]/g, '').split('\n').map(l => l.length))))}px;font-weight:900;line-height:1.28;letter-spacing:-2px;word-break:keep-all}
  .big em{font-style:normal;color:${C.accent}}
  .sub{font-size:46px;font-weight:600;color:${C.mute};line-height:1.4;word-break:keep-all}
  .dia{align-self:center}
  .chat{display:flex;flex-direction:column;gap:26px}
  .b{max-width:80%;padding:30px 40px;border-radius:44px;font-size:48px;font-weight:700;line-height:1.3;background:${C.card};box-shadow:0 6px 0 ${C.soft}}
  .b.L{align-self:flex-start;border-bottom-left-radius:10px}
  .b.R{align-self:flex-end;background:${C.ink};color:#fff;border-bottom-right-radius:10px}
  .b.think{background:transparent;box-shadow:none;border:5px dashed ${C.mute};color:${C.mute}}
  .list{list-style:none;counter-reset:k;display:flex;flex-direction:column;gap:22px}
  .list li{counter-increment:k;background:${C.card};border-radius:28px;padding:28px 36px;font-size:50px;font-weight:800;box-shadow:0 6px 0 ${C.soft}}
  .list li::before{content:counter(k);color:${C.accent};margin-right:26px;font-weight:900}
  .pin{display:inline-block;background:${C.accent};color:#fff;font-size:44px;font-weight:800;padding:18px 34px;border-radius:999px;align-self:flex-start}
  .handle{position:absolute;bottom:330px;left:90px;font-size:38px;font-weight:800;color:${C.ink};opacity:.55}
  </style><body>
  <div class="bar"><i></i></div><div class="top">${ep.series}</div>
  <div class="wrap${b.cta ? ' cta' : ''}">
    ${b.kicker ? `<div class="kicker">${fmt(b.kicker)}</div>` : ''}
    ${b.num ? `<div class="num">${b.num}</div>` : ''}
    ${b.cta ? `<div class="pin">저장 · 공유</div>` : ''}
    <div class="big">${fmt(b.big)}</div>
    ${b.dia ? dia(b.dia) : ''}${chat}${list}
    ${b.sub ? `<div class="sub">${fmt(b.sub)}</div>` : ''}
  </div><div class="handle">두잉영</div></body>`;
}

// 글자 수로 장면 길이 계산 (한국어 초당 약 8자)
function dur(b) {
  if (b.dur) return b.dur;
  const txt = [b.big, b.sub, b.kicker, ...(b.chat || []).map(m => m.t)].filter(Boolean).join('').replace(/[\[\]\s]/g, '');
  return Math.min(4.2, Math.max(2.0, 0.9 + txt.length * 0.075));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const ep of EPS) {
    if (only && ep.id !== only) continue;
    const fdir = path.join(DIR, 'frames', ep.id);
    fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir, { recursive: true });
    const list = [];
    for (let i = 0; i < ep.beats.length; i++) {
      const f = path.join(fdir, `${String(i).padStart(2, '0')}.png`);
      await page.setContent(html(ep, ep.beats[i], i, ep.beats.length), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: f });
      list.push([f, dur(ep.beats[i])]);
    }
    // 장면 사이 0.25초 크로스페이드
    const args = ['-y'];
    list.forEach(([f, d]) => args.push('-loop', '1', '-t', String(d + 0.25), '-i', f));
    let fc = '', last = '[0:v]', off = 0;
    for (let i = 1; i < list.length; i++) {
      off += list[i - 1][1];
      fc += `${last}[${i}:v]xfade=transition=fade:duration=0.25:offset=${off.toFixed(2)}[v${i}];`;
      last = `[v${i}]`;
    }
    const total = list.reduce((a, [, d]) => a + d, 0) + 0.25;
    fc += `${last}format=yuv420p,fps=30[out]`;
    const out = path.join(DIR, 'out', `두잉영_${ep.id}.mp4`);
    execFileSync('ffmpeg', [...args, '-f', 'lavfi', '-t', total.toFixed(2), '-i', 'anullsrc=r=44100:cl=stereo',
      '-filter_complex', fc, '-map', '[out]', '-map', `${list.length}:a`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      '-c:a', 'aac', '-shortest', '-movflags', '+faststart', out], { stdio: 'ignore' });
    console.log(ep.id, total.toFixed(1) + 's', out);
  }
  await browser.close();
})();
