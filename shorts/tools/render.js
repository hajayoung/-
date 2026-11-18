// 움직이는 자막 쇼츠 렌더러
// 장면마다 CSS 애니메이션을 만들고, 1/30초씩 시간을 옮기며 캡처한 뒤 ffmpeg로 MP4를 만들어요.
// 사용: node render.js EP1   (인자 없으면 전체)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const FPS = 30;
const EPS = require('./episodes.js');
const only = process.argv[2];

const C = { bg: '#F5EFE4', ink: '#1F1B16', mute: '#8A8073', accent: '#E2583A', soft: '#EADFCB', card: '#FFFFFF' };

const fontFace = ['Regular:400', 'SemiBold:600', 'Bold:700', 'ExtraBold:800', 'Black:900'].map(s => {
  const [n, w] = s.split(':');
  return `@font-face{font-family:P;font-weight:${w};src:url(file://${DIR}/fonts/Pretendard-${n}.otf)}`;
}).join('');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// "[강조]" 표시를 단어 단위 span으로 쪼개고, 단어마다 순서대로 튀어 오르게 해요.
function kinetic(text, start, step) {
  const segs = [];
  text.split(/(\[[^\]]+\])/).forEach(p => {
    if (!p) return;
    const em = p.startsWith('[');
    segs.push({ t: em ? p.slice(1, -1) : p, em });
  });
  let i = 0, out = '';
  for (const sg of segs) {
    sg.t.split(/(\n| )/).forEach(tok => {
      if (tok === '\n') { out += '<br>'; return; }
      if (tok === ' ') { out += ' '; return; }
      if (!tok) return;
      const d = start + i * step; i++;
      out += sg.em
        ? `<span class="w em" style="animation-delay:${d}ms">${esc(tok)}<i class="hl" style="animation-delay:${d + 180}ms"></i></span>`
        : `<span class="w" style="animation-delay:${d}ms">${esc(tok)}</span>`;
    });
  }
  return { html: out, end: start + i * step + 380 };
}

// ---- 움직이는 도식 ----
const P = (x, y, me, label, cls = '', style = '') => {
  const c = me ? C.accent : C.ink;
  return `<g class="${cls}" style="${style}"><circle cx="${x}" cy="${y - 34}" r="26" fill="${c}"/>
    <path d="M${x - 42} ${y + 40} Q${x} ${y - 20} ${x + 42} ${y + 40} Z" fill="${c}"/>
    ${label ? `<text x="${x}" y="${y + 86}" text-anchor="middle" font-size="34" font-weight="800" fill="${C.accent}">${label}</text>` : ''}</g>`;
};
const A = (x1, y1, x2, y2, delay) => `<line class="draw" pathLength="100" style="animation-delay:${delay}ms" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.accent}" stroke-width="8" stroke-linecap="round" marker-end="url(#ah)"/>`;
const defs = `<defs><marker id="ah" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="${C.accent}"/></marker></defs>`;
const pt = (cx, cy, R, a) => [cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180)];

function ring(mode, t0) {
  const cx = 380, cy = 250;
  let s = '';
  if (mode === 'closed') {
    // 셋이 안쪽으로 모이면서 원이 닫혀요
    s += `<circle class="draw" pathLength="100" style="animation-delay:${t0 + 350}ms" cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${C.mute}" stroke-width="6"/>`;
    [-150, -30, 90].forEach((a, i) => { const [x, y] = pt(cx, cy, 150, a); const [ox, oy] = pt(0, 0, 70, a);
      s += P(x, y, false, '', 'move', `--dx:${ox}px;--dy:${oy}px;animation-delay:${t0 + i * 80}ms`); });
    s += P(650, 470, true, '나', 'pop', `animation-delay:${t0 + 500}ms`);
  }
  if (mode === 'gap') {
    s += `<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${C.mute}" stroke-width="6" stroke-dasharray="14 14"/>`;
    [-150, -30, 90].forEach(a => { const [x, y] = pt(cx, cy, 150, a); s += P(x, y); });
    // '나'가 바깥에서 틈으로 걸어 들어와요
    s += P(cx + 175, cy + 140, true, '나', 'move', `--dx:${650 - cx - 175}px;--dy:${470 - cy - 140}px;animation-delay:${t0 + 200}ms;animation-duration:700ms`);
  }
  if (mode === 'open') {
    s += `<circle class="grow" style="animation-delay:${t0}ms" cx="${cx}" cy="${cy}" r="190" fill="none" stroke="${C.mute}" stroke-width="6" stroke-dasharray="14 14"/>`;
    const me = pt(cx, cy, 190, 60);
    [150, -90, -10].forEach((a, i) => { const [x, y] = pt(cx, cy, 190, a);
      s += P(x, y);
      const dx = me[0] - x, dy = me[1] - y, L = Math.hypot(dx, dy);
      s += A(x + dx / L * 70, y + dy / L * 70, x + dx / L * 160, y + dy / L * 160, t0 + 400 + i * 150); });
    s += P(me[0], me[1], true, '나', 'pulse', `animation-delay:${t0 + 900}ms`);
  }
  return s;
}
function table(mode, t0) {
  let s = `<rect x="110" y="200" width="540" height="130" rx="26" fill="${C.soft}" stroke="${C.ink}" stroke-width="5"/>`;
  const xs = [180, 300, 420, 540];
  if (mode === 'split') {
    s += `<ellipse class="pop" style="animation-delay:${t0}ms" cx="240" cy="265" rx="200" ry="215" fill="${C.accent}" opacity="0.16"/>
      <ellipse class="pop" style="animation-delay:${t0 + 350}ms" cx="480" cy="265" rx="140" ry="215" fill="none" stroke="${C.mute}" stroke-width="5" stroke-dasharray="14 14"/>
      <text class="pop" style="animation-delay:${t0 + 150}ms" x="230" y="36" text-anchor="middle" font-size="34" font-weight="800" fill="${C.accent}">대화 1 (시끄러운 쪽)</text>
      <text class="pop" style="animation-delay:${t0 + 450}ms" x="560" y="36" text-anchor="middle" font-size="34" font-weight="800" fill="${C.mute}">대화 2</text>`;
  }
  if (mode === 'mine') {
    s += `<ellipse class="pop" style="animation-delay:${t0 + 200}ms" cx="480" cy="265" rx="160" ry="215" fill="${C.accent}" opacity="0.2"/>
      <text class="pop" style="animation-delay:${t0 + 400}ms" x="480" y="36" text-anchor="middle" font-size="36" font-weight="800" fill="${C.accent}">우리 대화</text>`;
  }
  xs.forEach((x, i) => {
    s += `<circle class="pop" style="animation-delay:${t0 + i * 60}ms" cx="${x}" cy="140" r="36" fill="${C.ink}"/>`;
    const me = x === 540;
    s += `<circle class="${me ? 'pulse' : 'pop'}" style="animation-delay:${t0 + 240 + i * 60}ms" cx="${x}" cy="390" r="36" fill="${me ? C.accent : C.ink}"/>`;
  });
  s += `<text x="540" y="480" text-anchor="middle" font-size="34" font-weight="800" fill="${C.accent}">나</text>`;
  return s;
}
function dia(name, t0) {
  const body = { ringClosed: () => ring('closed', t0), ringGap: () => ring('gap', t0), ringOpen: () => ring('open', t0),
    tableSplit: () => table('split', t0), tableMine: () => table('mine', t0) }[name]();
  return `<svg class="dia" viewBox="0 -10 760 540" width="760" height="540" font-family="P">${defs}${body}</svg>`;
}

function beatDur(b) {
  if (b.dur) return b.dur;
  const txt = [b.big, b.sub, b.kicker, ...(b.chat || []).map(m => m.t)].filter(Boolean).join('').replace(/[\[\]\s]/g, '');
  return Math.min(4.4, Math.max(2.2, 1.1 + txt.length * 0.075));
}

function html(ep, b, i, n, D) {
  const ms = D * 1000;
  const hasImg = !!b.img;
  let t = 30;
  const kick = b.kicker ? `<div class="kicker rise" style="animation-delay:60ms">${esc(b.kicker)}</div>` : '';
  if (b.kicker) t += 200;
  const num = b.num ? `<div class="num spin" style="animation-delay:0ms">${b.num}</div>` : '';
  const pin = b.cta ? `<div class="pin bounce">${esc(b.pin || '구독 · 다음 편')}</div>` : '';
  const K = kinetic(b.big, t, 55); t = K.end;
  const lens = b.big.replace(/\[|\]/g, '').split('\n').map(l => l.length);
  const fs = Math.min(hasImg ? 92 : 104, Math.floor(900 / Math.max(...lens)));
  let extra = '';
  if (b.dia) { extra += dia(b.dia, 250); t = Math.max(t, 900); }
  if (b.chat) {
    extra += `<div class="chat">${b.chat.map((m, k) => `<div class="b ${m.s}${m.think ? ' think' : ''} bub" style="animation-delay:${t + k * 420}ms">${esc(m.t)}</div>`).join('')}</div>`;
    t += b.chat.length * 420;
  }
  if (b.list) {
    extra += `<ol class="list">${b.list.map((x, k) => `<li class="slide" style="animation-delay:${t + k * 260}ms"><b>${k + 1}</b>${esc(x)}</li>`).join('')}</ol>`;
    t += b.list.length * 260;
  }
  const sub = b.sub ? `<div class="sub rise" style="animation-delay:${t + 100}ms">${esc(b.sub).replace(/\n/g, '<br>')}</div>` : '';
  const pan = b.pan === 'left' ? '-40px' : b.pan === 'right' ? '40px' : '0px';
  const img = hasImg ? `<div class="imgwrap"><div class="${b.fx === 'punch' ? 'punchin' : ''}" style="width:100%;height:100%"><img class="kb" style="--pan:${pan};animation-duration:${ms}ms" src="file://${DIR}/images/${b.img}.png"></div></div><div class="fade"></div>` : '';
  const blobs = hasImg ? '' : `<div class="blob b1" style="animation-duration:${ms}ms"></div><div class="blob b2" style="animation-duration:${ms}ms"></div>`;
  const p0 = (i / n * 100).toFixed(2), p1 = ((i + 1) / n * 100).toFixed(2);

  return `<!doctype html><meta charset="utf-8"><style>${fontFace}
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1920px;background:${C.bg};color:${C.ink};font-family:P;overflow:hidden;position:relative}
  .blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.35;animation:drift linear both}
  .b1{width:620px;height:620px;background:${C.accent};left:-200px;top:300px;opacity:.16}
  .b2{width:520px;height:520px;background:#F2C14E;right:-180px;top:1100px;opacity:.2;animation-direction:reverse}
  @keyframes drift{from{transform:translate(0,0)}to{transform:translate(120px,-90px)}}
  .imgwrap{position:absolute;left:0;top:0;width:1080px;height:1440px;overflow:hidden}
  .kb{width:100%;height:100%;object-fit:cover;animation:kb linear both}
  @keyframes kb{from{transform:scale(1.04) translateX(0)}to{transform:scale(1.16) translateX(var(--pan))}}
  .punchin{animation:punch 520ms cubic-bezier(.2,.9,.2,1) both}
  @keyframes punch{from{transform:scale(1.3)}to{transform:none}}
  .fade{position:absolute;left:0;right:0;top:1100px;bottom:0;background:linear-gradient(to bottom,rgba(245,239,228,0),${C.bg} 300px)}
  .bar{position:absolute;top:110px;left:90px;right:90px;height:12px;border-radius:6px;background:rgba(31,27,22,.12);z-index:5}
  .bar i{display:block;height:100%;border-radius:6px;background:${C.accent};animation:prog ${ms}ms linear both}
  @keyframes prog{from{width:${p0}%}to{width:${p1}%}}
  .top{position:absolute;top:150px;left:90px;font-size:36px;font-weight:800;color:${C.ink};opacity:.6;z-index:5;
       ${hasImg ? 'background:rgba(245,239,228,.85);padding:6px 18px;border-radius:999px;left:76px;opacity:.9' : ''}}
  .stage{position:absolute;left:90px;right:170px;display:flex;flex-direction:column;gap:44px;z-index:4;
       ${hasImg ? 'bottom:380px;left:60px;right:150px;padding:40px 44px;border-radius:40px;background:rgba(245,239,228,.94);box-shadow:0 18px 50px rgba(31,27,22,.18)' : 'top:250px;bottom:420px;justify-content:center'};
       animation:enter 260ms cubic-bezier(.2,.9,.2,1) both}
  @keyframes enter{from{transform:translateX(90px);opacity:.2}to{transform:none;opacity:1}}
  .shake{animation:shake 420ms ease-in-out both;animation-delay:${K.end - 150}ms}
  @keyframes shake{0%,100%{transform:none}20%{transform:translateX(-18px) rotate(-1deg)}40%{transform:translateX(16px) rotate(1deg)}60%{transform:translateX(-10px)}80%{transform:translateX(6px)}}
  .kicker{font-size:40px;font-weight:800;color:${C.mute}}
  .imgk .kicker{align-self:flex-start;background:${C.ink};color:#fff;padding:12px 26px;border-radius:999px}
  .num{width:116px;height:116px;border-radius:58px;background:${C.accent};color:#fff;font-size:68px;font-weight:900;display:flex;align-items:center;justify-content:center}
  .big{font-size:${fs}px;font-weight:900;line-height:1.26;letter-spacing:-2px;word-break:keep-all}
  .w{display:inline-block;animation:pop 420ms cubic-bezier(.2,1.4,.4,1) both;position:relative}
  @keyframes pop{0%{opacity:0;transform:translateY(70px) scale(.8)}100%{opacity:1;transform:none}}
  .em{color:${C.accent}}
  .hl{position:absolute;left:-6px;right:-6px;bottom:.06em;height:.34em;background:${C.accent};opacity:.18;border-radius:6px;z-index:-1;transform-origin:left;animation:hl 320ms ease-out both}
  @keyframes hl{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  .sub{font-size:46px;font-weight:700;color:${C.mute};line-height:1.4;word-break:keep-all}
  .rise{animation:rise 400ms cubic-bezier(.2,.9,.2,1) both}
  @keyframes rise{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
  .spin{animation:spin 500ms cubic-bezier(.2,1.5,.4,1) both}
  @keyframes spin{from{transform:scale(0) rotate(-180deg)}to{transform:none}}
  .dia{align-self:center;overflow:visible}
  .draw{stroke-dasharray:100;animation:draw 600ms ease-out both}
  @keyframes draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
  .pop{transform-box:fill-box;transform-origin:center;animation:popin 450ms cubic-bezier(.2,1.5,.4,1) both}
  @keyframes popin{from{transform:scale(0);opacity:0}to{transform:none}}
  .move{animation:move 500ms cubic-bezier(.3,1.3,.5,1) both}
  @keyframes move{from{transform:translate(var(--dx),var(--dy))}to{transform:none}}
  .grow{transform-box:fill-box;transform-origin:center;animation:grow 600ms cubic-bezier(.2,1.3,.4,1) both}
  @keyframes grow{from{transform:scale(.75)}to{transform:none}}
  .pulse{transform-box:fill-box;transform-origin:center;animation:pulse 900ms ease-in-out 3 both}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
  .chat{display:flex;flex-direction:column;gap:24px}
  .b{max-width:82%;padding:28px 40px;border-radius:44px;font-size:48px;font-weight:700;line-height:1.3;background:${C.card};box-shadow:0 8px 0 ${C.soft}}
  .b.L{align-self:flex-start;border-bottom-left-radius:10px;transform-origin:left bottom}
  .b.R{align-self:flex-end;background:${C.ink};color:#fff;border-bottom-right-radius:10px;transform-origin:right bottom}
  .b.think{background:transparent;box-shadow:none;border:5px dashed ${C.mute};color:${C.mute}}
  .bub{animation:bub 380ms cubic-bezier(.2,1.5,.4,1) both}
  @keyframes bub{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}
  .list{list-style:none;display:flex;flex-direction:column;gap:20px}
  .list li{background:${C.card};border-radius:28px;padding:26px 34px;font-size:50px;font-weight:800;box-shadow:0 8px 0 ${C.soft}}
  .list b{color:${C.accent};margin-right:24px;font-weight:900}
  .slide{animation:slide 380ms cubic-bezier(.2,1.2,.4,1) both}
  @keyframes slide{from{transform:translateX(-120%);opacity:0}to{transform:none;opacity:1}}
  .pin{display:inline-block;background:${C.accent};color:#fff;font-size:46px;font-weight:900;padding:20px 38px;border-radius:999px;align-self:flex-start;animation:bounce 700ms ease-in-out infinite both}
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
  .handle{position:absolute;bottom:330px;left:90px;font-size:38px;font-weight:900;color:${C.ink};opacity:.5;z-index:4}
  </style><body>
  ${blobs}${img}
  <div class="bar"><i></i></div><div class="top">${ep.series}</div>
  <div class="stage ${hasImg ? 'imgk' : ''}"><div class="inner ${b.fx === 'shake' ? 'shake' : ''}" style="display:flex;flex-direction:column;gap:40px">
    ${kick}${num}${pin}<div class="big">${K.html}</div>${extra}${sub}
  </div></div></body>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const ep of EPS) {
    if (only && ep.id !== only) continue;
    const fdir = path.join(DIR, 'frames', ep.id);
    fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir, { recursive: true });
    let f = 0; const starts = [];
    for (let i = 0; i < ep.beats.length; i++) {
      const b = ep.beats[i], D = beatDur(b), N = Math.round(D * FPS);
      starts.push(f / FPS);
      const hf = path.join(DIR, 'frames', `_${ep.id}.html`);
      fs.writeFileSync(hf, html(ep, b, i, ep.beats.length, D));
      await page.goto('file://' + hf, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => document.getAnimations().forEach(a => a.pause()));
      for (let k = 0; k < N; k++) {
        await page.evaluate(ms => document.getAnimations().forEach(a => { a.currentTime = ms; }), k * 1000 / FPS);
        await page.screenshot({ path: path.join(fdir, `${String(f++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
      }
    }
    // 장면 전환마다 짧은 '톡' 효과음
    const pop = path.join(DIR, 'pop.wav');
    if (!fs.existsSync(pop)) execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=880:duration=0.07', '-af', 'afade=t=out:st=0.01:d=0.06,volume=0.35', pop], { stdio: 'ignore' });
    const total = f / FPS;
    const aIn = [], aF = [];
    starts.forEach((s, k) => { aIn.push('-i', pop); aF.push(`[${k + 1}:a]adelay=${Math.round(s * 1000)}|${Math.round(s * 1000)}[a${k}]`); });
    const mix = `${aF.join(';')};${starts.map((_, k) => `[a${k}]`).join('')}amix=inputs=${starts.length}:normalize=0,apad,atrim=0:${total.toFixed(2)}[aout]`;
    const out = path.join(DIR, 'out', `내향인대화법_${ep.id}.mp4`);
    execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(fdir, '%05d.jpg'), ...aIn,
      '-filter_complex', mix, '-map', '0:v', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-movflags', '+faststart', out], { stdio: 'ignore' });
    console.log(ep.id, total.toFixed(1) + 's', f, 'frames');
  }
  await browser.close();
})();
