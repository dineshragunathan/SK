'use strict';
/* ==========================================================
   art.js : every picture in the game is drawn here in code.
   Original chunky cartoon pixel art with bold outlines.
   ========================================================== */

const OUTLINE = '#22162b';

function mkCanvas(w, hh) {
  const c = document.createElement('canvas'); c.width = w; c.height = hh;
  const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = false;
  return [c, x];
}
function hexRgb(hx) { hx = hx.replace('#', ''); if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2]; const n = parseInt(hx, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(hx, amt) {
  const c = hexRgb(hx);
  const f = (v) => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return '#' + ((1 << 24) + (f(c[0]) << 16) + (f(c[1]) << 8) + f(c[2])).toString(16).slice(1);
}
function fr(ctx, x, y, w, hh, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, hh); }

/* Adds a 1px bold outline around every opaque pixel in the region (the cartoon look). */
function outlineRegion(ctx, x0, y0, w, hh, col) {
  const id = ctx.getImageData(x0, y0, w, hh), d = id.data, src = new Uint8ClampedArray(d);
  const rgb = hexRgb(col || OUTLINE);
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3] > 40) continue;
    let near = false;
    if (x > 0 && src[i - 1] > 40) near = true;
    else if (x < w - 1 && src[i + 7] > 40) near = true;
    else if (y > 0 && src[i - w * 4 + 3] > 40) near = true;
    else if (y < hh - 1 && src[i + w * 4 + 3] > 40) near = true;
    if (near) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; }
  }
  ctx.putImageData(id, x0, y0);
}
function circle(ctx, cx, cy, r, col) {
  ctx.fillStyle = col;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) ctx.fillRect(x, y, 1, 1);
    }
}
function ring(ctx, cx, cy, r, th, col) {
  ctx.fillStyle = col;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d <= r && d >= r - th) ctx.fillRect(x, y, 1, 1);
    }
}
function line(ctx, x0, y0, x1, y1, col) {
  ctx.fillStyle = col;
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
  for (let n = 0; n < 200; n++) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/* ---------------- 3x5 pixel font for signs ---------------- */
const FONT = {
  A: '.#.#.####.##.#', B: '##.#.###.#.###.', C: '.###..#..#...##', D: '##.#.##.##.###.', E: '####..##.#..###', F: '####..##.#..#..',
  G: '.###..#.##.#.##', H: '#.##.####.##.#', I: '###.#..#..#.###', J: '..#..#..##.#.#.', K: '#.##.###.#.##.#', L: '#..#..#..#..###',
  M: '#.#####.##.##.#', N: '##.#.##.##.##.#', O: '.#.#.##.##.#.#.', P: '##.#.###.#..#..', Q: '.#.#.##.###..##', R: '##.#.###.#.##.#',
  S: '.###...#...###.', T: '###.#..#..#..#.', U: '#.##.##.##.####', V: '#.##.##.##.#.#.', W: '#.##.#######.#', X: '#.##.#.#.#.##.#',
  Y: '#.##.#.#..#..#.', Z: '###..#.#.#..###', '0': '####.##.##.####', '1': '.#.##..#..#.###', '2': '##...#.#.#..###', '3': '##...#.#...###.',
  '4': '#.##.####..#..#', '5': '####..##...###.', '6': '.###..####.####', '7': '###..#.#..#..#.', '8': '####.#####.####', '9': '####.####..###.',
  '-': '......###......', '!': '.#..#..#.....#.', '%': '#.#..#.#.#..#.#', '.': '.............#.', ':': '....#.....#....', '?': '##...#.#.....#.',
  '+': '....#.###.#....', '*': '#.#.#.#.#......', "'": '.#..#..........', '/': '..#..#.#.#..#..', ' ': '...............'
};
// Fix glyphs that need exactly 15 chars (3x5). Pad / repair any shorthand above.
(function () {
  FONT.A = '.#.' + '#.#' + '###' + '#.#' + '#.#';
  FONT.H = '#.#' + '#.#' + '###' + '#.#' + '#.#';
  FONT.M = '#.#' + '###' + '###' + '#.#' + '#.#';
  FONT.W = '#.#' + '#.#' + '###' + '###' + '#.#';
  FONT.U = '#.#' + '#.#' + '#.#' + '#.#' + '###';
  FONT.V = '#.#' + '#.#' + '#.#' + '#.#' + '.#.';
  FONT.X = '#.#' + '#.#' + '.#.' + '#.#' + '#.#';
  FONT.Y = '#.#' + '#.#' + '.#.' + '.#.' + '.#.';
  FONT.K = '#.#' + '#.#' + '##.' + '#.#' + '#.#';
  FONT.N = '##.' + '#.#' + '#.#' + '#.#' + '#.#';
  FONT.O = '.#.' + '#.#' + '#.#' + '#.#' + '.#.';
  FONT.Q = '.#.' + '#.#' + '#.#' + '##.' + '.##';
  FONT.R = '##.' + '#.#' + '##.' + '#.#' + '#.#';
  FONT.D = '##.' + '#.#' + '#.#' + '#.#' + '##.';
  FONT.B = '##.' + '#.#' + '##.' + '#.#' + '##.';
  FONT.G = '.##' + '#..' + '#.#' + '#.#' + '.##';
  FONT.J = '..#' + '..#' + '..#' + '#.#' + '.#.';
  FONT.P = '##.' + '#.#' + '##.' + '#..' + '#..';
  FONT.E = '###' + '#..' + '##.' + '#..' + '###';
  FONT.F = '###' + '#..' + '##.' + '#..' + '#..';
  FONT.C = '.##' + '#..' + '#..' + '#..' + '.##';
  FONT.L = '#..' + '#..' + '#..' + '#..' + '###';
  FONT.I = '###' + '.#.' + '.#.' + '.#.' + '###';
  FONT.S = '.##' + '#..' + '.#.' + '..#' + '##.';
  FONT.T = '###' + '.#.' + '.#.' + '.#.' + '.#.';
  FONT.Z = '###' + '..#' + '.#.' + '#..' + '###';
  FONT['0'] = '###' + '#.#' + '#.#' + '#.#' + '###';
  FONT['1'] = '.#.' + '##.' + '.#.' + '.#.' + '###';
  FONT['2'] = '##.' + '..#' + '.#.' + '#..' + '###';
  FONT['3'] = '##.' + '..#' + '.#.' + '..#' + '##.';
  FONT['4'] = '#.#' + '#.#' + '###' + '..#' + '..#';
  FONT['5'] = '###' + '#..' + '##.' + '..#' + '##.';
  FONT['6'] = '.##' + '#..' + '###' + '#.#' + '###';
  FONT['7'] = '###' + '..#' + '.#.' + '.#.' + '.#.';
  FONT['8'] = '###' + '#.#' + '###' + '#.#' + '###';
  FONT['9'] = '###' + '#.#' + '###' + '..#' + '##.';
  FONT['!'] = '.#.' + '.#.' + '.#.' + '...' + '.#.';
  FONT['%'] = '#.#' + '..#' + '.#.' + '#..' + '#.#';
  FONT['-'] = '...' + '...' + '###' + '...' + '...';
  FONT['+'] = '...' + '.#.' + '###' + '.#.' + '...';
  FONT['.'] = '...' + '...' + '...' + '...' + '.#.';
  FONT[':'] = '...' + '.#.' + '...' + '.#.' + '...';
  FONT['?'] = '##.' + '..#' + '.#.' + '...' + '.#.';
  FONT['*'] = '#.#' + '.#.' + '#.#' + '...' + '...';
  FONT["'"] = '.#.' + '.#.' + '...' + '...' + '...';
  FONT['/'] = '..#' + '..#' + '.#.' + '#..' + '#..';
  FONT[' '] = '...............';
})();
function textW(s, sc) { sc = sc || 1; return s.length * 4 * sc - sc; }
function drawText(ctx, s, x, y, col, sc) {
  sc = sc || 1; s = String(s).toUpperCase(); ctx.fillStyle = col;
  for (let i = 0; i < s.length; i++) {
    const g = FONT[s[i]] || FONT[' '];
    for (let p = 0; p < 15; p++) if (g[p] === '#') ctx.fillRect(x + i * 4 * sc + (p % 3) * sc, y + Math.floor(p / 3) * sc, sc, sc);
  }
  return textW(s, sc);
}

/* ---------------- People (player + NPCs) ---------------- */
const PFW = 20, PFH = 27;     // person frame size
const PERSON_FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'jump', 'fall', 'climb0', 'climb1', 'ride', 'eat'];
const POSES = {
  idle0: { bob: 0, bx: 0, fx: 0, arms: 'down' }, idle1: { bob: 1, bx: 0, fx: 0, arms: 'down' },
  walk0: { bob: 0, bx: -1, fx: 1, arms: 'down', sb: 1, sf: -1 }, walk1: { bob: -1, bx: 0, fx: 0, arms: 'down' },
  walk2: { bob: 0, bx: 1, fx: -1, arms: 'down', sb: -1, sf: 1 }, walk3: { bob: -1, bx: 0, fx: 0, arms: 'down' },
  jump: { bob: -1, legs: 'jump', arms: 'up' }, fall: { bob: 0, legs: 'fall', arms: 'out' },
  climb0: { bob: 0, legs: 'climb0', arms: 'climb0' }, climb1: { bob: 0, legs: 'climb1', arms: 'climb1' },
  ride: { bob: 1, legs: 'ride', arms: 'ride' }, eat: { bob: 0, bx: 0, fx: 0, arms: 'eat' }
};

function drawPerson(c, ox, oy, frame, L) {
  const P = (X, Y, W, H, col) => { c.fillStyle = col; c.fillRect(ox + X, oy + Y, W, H); };
  const ps = POSES[frame] || POSES.idle0;
  const b = ps.bob || 0;
  const skin = L.skin || '#d9a066', sk2 = shade(skin, -0.2);
  const top = L.top || '#eee', top2 = L.top2 || shade(top, -0.25), pants = L.pants || '#334', shoes = L.shoes || '#222';
  const longTop = ['rain', 'kurta', 'coat', 'saree'].indexOf(L.kind) >= 0;
  const sleeve = L.kind === 'coat' ? '#f2f2f2' : top;

  // cape / hood behind the body
  if (L.kind === 'cape') { P(2, 12 + b, 4, 9, '#d93a3a'); P(1, 17 + b, 3, 5, '#d93a3a'); P(3, 13 + b, 1, 7, '#a82a2a'); }
  if (L.kind === 'hoodie') P(3, 10 + b, 3, 4, top);
  if (L.hairStyle === 'long' || L.hairStyle === 'pony') { /* drawn with head */ }

  // ---- legs ----
  const legC = L.shorts ? skin : pants;
  const lg = ps.legs;
  if (lg === 'ride') {
    P(7, 18, 6, 2, pants); P(11, 20, 2, 3, legC); P(11, 23, 4, 2, shoes);
  } else if (lg === 'jump') {
    P(6, 18, 3, 5, legC); P(5, 23, 4, 2, shoes);
    P(10, 18, 3, 3, legC); P(11, 21, 4, 2, shoes);
    if (L.shorts) { P(6, 18, 3, 2, pants); P(10, 18, 3, 2, pants); }
  } else if (lg === 'fall') {
    P(5, 18, 3, 5, legC); P(4, 23, 4, 2, shoes);
    P(10, 18, 3, 5, legC); P(10, 23, 4, 2, shoes);
    if (L.shorts) { P(5, 18, 3, 2, pants); P(10, 18, 3, 2, pants); }
  } else if (lg === 'climb0' || lg === 'climb1') {
    const up = lg === 'climb0';
    P(6, 18, 3, up ? 3 : 5, legC); P(6, up ? 21 : 23, 4, 2, shoes);
    P(9, 18, 3, up ? 5 : 3, legC); P(9, up ? 23 : 21, 4, 2, shoes);
  } else {
    const bx = ps.bx || 0, fx = ps.fx || 0;
    P(6 + bx, 18, 3, 5, legC); P(6 + bx, 23, 4, 2, shoes);
    P(9 + fx, 18, 3, 5, legC); P(9 + fx, 23, 4, 2, shoes);
    if (L.shorts) { P(6 + bx, 18, 3, 2, pants); P(9 + fx, 18, 3, 2, pants); P(6 + bx, 22, 3, 1, '#fff'); P(9 + fx, 22, 3, 1, '#fff'); }
  }

  // ---- back arm ----
  const ar = ps.arms;
  const backArm = () => {
    if (ar === 'up') { P(4, 9 + b, 2, 3, skin); P(4, 12 + b, 2, 2, sleeve); }
    else if (ar === 'out') { P(3, 11 + b, 2, 2, skin); P(4, 12 + b, 2, 2, sleeve); }
    else if (ar === 'climb0') { P(4, 7 + b, 2, 3, skin); P(4, 10 + b, 2, 4, sleeve); }
    else if (ar === 'climb1') { P(4, 10 + b, 2, 3, skin); P(4, 12 + b, 2, 3, sleeve); }
    else { P(4, 12 + b, 2, 2, sleeve); P(4 + (ps.sb || 0), 14 + b, 2, 3, skin); }
  };
  backArm();

  // ---- torso ----
  const tH = longTop ? 9 : 6;
  P(6, 12 + b, 6, tH, top);
  if (longTop) P(5, 18 + b, 8, 3, top);
  switch (L.kind) {
    case 'uniform': P(8, 12 + b, 3, 1, '#d8d8e8'); P(9, 13 + b, 1, 4, '#2b5cb8'); P(6, 17 + b, 6, 1, pants); break;
    case 'casual': P(6, 15 + b, 6, 1, top2); break;
    case 'sports': P(8, 13 + b, 2, 3, '#ffffff'); P(6, 12 + b, 6, 1, top2); break;
    case 'rain': P(9, 13 + b, 1, 1, top2); P(9, 16 + b, 1, 1, top2); P(9, 19 + b, 1, 1, top2); break;
    case 'kurta': P(8, 12 + b, 3, 1, '#f6c445'); P(9, 13 + b, 1, 3, '#f6c445'); P(5, 20 + b, 8, 1, '#f6c445'); break;
    case 'hoodie': P(8, 14 + b, 3, 2, '#39ff88'); P(7, 16 + b, 5, 1, shade(top, 0.15)); break;
    case 'cape': P(8, 13 + b, 2, 2, '#ffd23f'); P(6, 17 + b, 6, 1, '#ffd23f'); break;
    case 'apron': P(7, 13 + b, 5, 5, '#ffffff'); P(7, 13 + b, 5, 1, '#e8e8e8'); break;
    case 'tie': P(6, 12 + b, 2, 6, top2); P(10, 12 + b, 2, 6, top2); P(9, 12 + b, 1, 5, '#d63a3a'); break;
    case 'coat': P(8, 12 + b, 2, 5, top2); P(6, 12 + b, 1, 9, '#e2e2e2'); break;
    case 'saree': P(6, 12 + b, 2, 9, top2); P(8, 14 + b, 2, 2, top2); P(10, 16 + b, 2, 2, top2); break;
    case 'vest': P(6, 12 + b, 2, 6, top2); P(10, 12 + b, 2, 6, top2); break;
    default: break;
  }

  // ---- front arm ----
  if (ar === 'up') { P(12, 9 + b, 2, 3, skin); P(12, 12 + b, 2, 2, sleeve); }
  else if (ar === 'out') { P(13, 11 + b, 2, 2, skin); P(12, 12 + b, 2, 2, sleeve); }
  else if (ar === 'climb0') { P(12, 10 + b, 2, 3, skin); P(12, 12 + b, 2, 3, sleeve); }
  else if (ar === 'climb1') { P(12, 7 + b, 2, 3, skin); P(12, 10 + b, 2, 4, sleeve); }
  else if (ar === 'ride') { P(12, 13 + b, 3, 2, sleeve); P(15, 13 + b, 2, 2, skin); }
  else if (ar === 'eat') { P(12, 12 + b, 2, 2, sleeve); P(12, 10 + b, 2, 2, skin); P(13, 9 + b, 3, 2, '#ffd23f'); }
  else { P(12, 12 + b, 2, 2, sleeve); P(12 + (ps.sf || 0), 14 + b, 2, 3, skin); }

  // ---- head ----
  const hair = L.hair || '#2a1a14';
  if (L.hairStyle === 'long') P(3, 4 + b, 3, 9, hair);
  if (L.hairStyle === 'pony') P(1, 5 + b, 3, 6, hair);
  if (L.hairStyle === 'bun') { P(1, 2 + b, 4, 4, hair); }
  P(5, 3 + b, 8, 9, skin); P(4, 4 + b, 10, 7, skin);
  P(4, 8 + b, 1, 3, sk2); P(6, 7 + b, 1, 2, sk2);
  P(8, 6 + b, 2, 3, '#ffffff'); P(11, 6 + b, 2, 3, '#ffffff');
  P(9, 7 + b, 1, 2, L.eye || '#1d1d2b'); P(12, 7 + b, 1, 2, L.eye || '#1d1d2b');
  P(13, 9 + b, 1, 1, '#f08a8a');
  P(10, 10 + b, 2, 1, '#7a2e2e');
  if (L.beard) { P(8, 10 + b, 6, 2, hair); P(10, 10 + b, 2, 1, '#7a2e2e'); }
  if (L.glasses) { P(7, 6 + b, 7, 1, '#2a2a2a'); P(10, 6 + b, 1, 2, '#2a2a2a'); }

  const hs = L.helmet ? 'helmet' : L.hairStyle;
  switch (hs) {
    case 'spiky': P(4, 2 + b, 10, 3, hair); P(4, 5 + b, 2, 3, hair); P(6, 1 + b, 2, 1, hair); P(9, 0 + b, 2, 2, hair); P(12, 1 + b, 2, 1, hair); P(10, 5 + b, 3, 1, hair); break;
    case 'short': case 'long': case 'pony': case 'bun':
      P(4, 2 + b, 10, 3, hair); P(4, 5 + b, 2, 3, hair); P(5, 1 + b, 8, 1, hair); P(11, 5 + b, 2, 1, hair); break;
    case 'bald': P(4, 5 + b, 2, 3, hair); P(7, 3 + b, 3, 1, shade(skin, 0.25)); break;
    case 'cap': P(4, 2 + b, 10, 3, top2); P(13, 4 + b, 3, 1, top2); P(4, 5 + b, 2, 2, hair); break;
    case 'chef': P(5, 0 + b, 8, 3, '#ffffff'); P(4, 2 + b, 10, 2, '#ffffff'); P(4, 4 + b, 10, 1, '#dddddd'); P(4, 5 + b, 2, 2, hair); break;
    case 'hood': P(3, 1 + b, 12, 4, top); P(3, 4 + b, 2, 8, top); P(13, 4 + b, 1, 4, top); break;
    case 'helmet': P(5, 0 + b, 8, 1, '#e8423a'); P(4, 1 + b, 10, 4, '#e8423a'); P(4, 2 + b, 10, 1, '#ff7a6a'); P(11, 4 + b, 4, 1, '#9fe3ff'); P(5, 5 + b, 1, 4, '#3a3a3a'); break;
    default: P(4, 2 + b, 10, 3, hair); break;
  }
  if (L.kind === 'hoodie' && !L.helmet) { /* hood down behind neck already */ }
}

function personSheet(look, frames) {
  frames = frames || PERSON_FRAMES;
  const [cv, cx] = mkCanvas(PFW * frames.length, PFH);
  frames.forEach((f, i) => {
    drawPerson(cx, i * PFW + 1, 1, f, look);
    outlineRegion(cx, i * PFW, 0, PFW, PFH);
  });
  return cv;
}

/* ---------------- Financial obstacle creatures ---------------- */
const CR = 18; // creature frame size
function eyes(P, x1, y, x2, dir, brow) {
  P(x1, y, 2, 2, '#fff'); P(x2, y, 2, 2, '#fff');
  P(x1 + (dir > 0 ? 1 : 0), y + 1, 1, 1, '#1d1d2b'); P(x2 + (dir > 0 ? 1 : 0), y + 1, 1, 1, '#1d1d2b');
  if (brow) { P(x1, y - 1, 2, 1, OUTLINE); P(x2, y - 1, 2, 1, OUTLINE); }
}
const CREATURE_DRAW = {
  impulse(P, f) { // Grabbit: greedy shopping bag
    const u = f ? -1 : 0;
    P(5, 2 + u, 1, 4, '#7a2050'); P(10, 2 + u, 1, 4, '#7a2050'); P(5, 2 + u, 6, 1, '#7a2050');
    P(3, 5 + u, 10, 10, '#e84a8a'); P(3, 5 + u, 10, 2, '#ff86b8');
    eyes(P, 5, 8 + u, 9, 1, true); P(6, 12 + u, 4, 1, '#5a1030');
    P(1, 8 + (f ? -2 : 0), 2, 3, '#e84a8a'); P(13, 8 + (f ? -2 : 0), 2, 3, '#e84a8a');
    P(4, 15, 2, 1, '#5a1030'); P(10, 15, 2, 1, '#5a1030');
  },
  fakeDiscount(P, f) { // Tagster: shifty price tag
    const u = f ? -1 : 0;
    P(0, 4 + u, 3, 1, '#b07a3c');
    P(4, 3 + u, 10, 11, '#ffd23f'); P(2, 5 + u, 2, 7, '#ffd23f'); P(1, 7 + u, 1, 3, '#ffd23f');
    P(3, 8 + u, 1, 1, '#b07a3c');
    eyes(P, 6, 5 + u, 10, 1, true);
    P(6, 10 + u, 1, 1, '#e03030'); P(8, 10 + u, 1, 3, '#e03030'); P(10, 12 + u, 1, 1, '#e03030'); P(7, 11 + u, 3, 1, '#e03030');
    P(6, 14, 1, 2, OUTLINE); P(11, 14, 1, 2, OUTLINE);
  },
  scam(P, f) { // Phishy: phone-fish
    const u = f ? 1 : 0;
    P(2, 4 + u, 11, 9, '#2ec4b6'); P(13, 5 + u, 2, 2, '#2ec4b6'); P(14, 3 + u, 2, 2, '#2ec4b6'); P(13, 9 + u, 2, 2, '#2ec4b6'); P(14, 11 + u, 2, 2, '#2ec4b6');
    P(4, 5 + u, 7, 4, '#c9fff8'); P(7, 5 + u, 1, 2, '#e03030'); P(7, 8 + u, 1, 1, '#e03030');
    eyes(P, 3, 10 + u, 8, -1, true);
    P(6, 13 + u, 3, 2, '#1f8f86');
  },
  peer(P, f) { // Crowdy: a cloud of pushy faces
    const u = f ? 1 : 0;
    P(1, 8 - u, 6, 6, '#b9a4ff'); P(5, 4, 7, 8, '#a78bfa'); P(10, 8 + u, 6, 6, '#b9a4ff');
    P(2, 10 - u, 1, 1, OUTLINE); P(4, 10 - u, 1, 1, OUTLINE); P(3, 12 - u, 2, 1, '#5b3fb0');
    eyes(P, 6, 6, 9, 1, true); P(7, 9, 3, 1, '#5b3fb0');
    P(12, 10 + u, 1, 1, OUTLINE); P(14, 10 + u, 1, 1, OUTLINE); P(12, 12 + u, 3, 1, '#5b3fb0');
  },
  subscription(P, f) { // Loopy: the auto-renew ring
    const cx = 8, cy = 8;
    for (let y = 1; y < 16; y++) for (let x = 1; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= 7 && d >= 3.2) P(x, y, 1, 1, '#ff9f1c');
    }
    P(13, f ? 2 : 11, 3, 3, '#fff3c4');
    eyes(P, 4, 3, 9, 1, true);
    P(3, 10, 2, 1, '#ffbf69'); P(11, 10, 2, 1, '#ffbf69');
  },
  overspend(P, f) { // Splurge: bulging wallet balloon
    const u = f ? -1 : 0;
    P(5, 0 + u, 3, 2, '#ffd23f'); P(9, 1 + u, 3, 2, '#ffd23f');
    P(3, 2 + u, 11, 9, '#ef476f'); P(3, 2 + u, 11, 3, '#c9304f'); P(12, 4 + u, 2, 2, '#ffd23f');
    eyes(P, 5, 6 + u, 9, 1, true); P(7, 9 + u, 3, 1, '#7a1530');
    P(8, 11 + u, 1, 4, '#555'); P(7, 15, 3, 1, '#555');
  },
  misleadingAd(P, f) { // Hypey: loud megaphone
    P(2, 6, 4, 5, '#3a86ff'); P(6, 4, 6, 9, '#3a86ff'); P(12, 2, 3, 13, '#6aa6ff'); P(4, 11, 2, 4, '#22333f');
    eyes(P, 6, 6, 9, 1, true); P(7, 10, 3, 1, '#123a7a');
    const o = f ? 1 : 0;
    P(16, 3 + o, 1, 2, '#fff'); P(16, 8, 1, 2, '#fff'); P(16, 12 - o, 1, 2, '#fff');
  },
  upgrade(P, f) { // Upgrado: smug shiny phone
    const u = f ? -1 : 0;
    P(4, 1 + u, 9, 14, '#c9d2e3'); P(5, 3 + u, 7, 9, '#1d2b4f');
    P(6, 6 + u, 2, 2, '#7df9ff'); P(9, 6 + u, 2, 2, '#7df9ff'); P(6, 5 + u, 2, 1, '#7df9ff'); P(9, 5 + u, 2, 1, '#7df9ff');
    P(7, 10 + u, 3, 1, '#7df9ff'); P(5, 12 + u, 7, 1, '#ffd23f');
    P(1, f ? 1 : 3, 1, 3, '#ffffff'); P(0, f ? 2 : 4, 3, 1, '#ffffff'); P(14, f ? 10 : 8, 2, 2, '#ffffff');
    P(6, 15, 1, 1, OUTLINE); P(10, 15, 1, 1, OUTLINE);
  }
};
function creatureSheet(type) {
  const [cv, cx] = mkCanvas(CR * 2, CR);
  for (let f = 0; f < 2; f++) {
    const P = (X, Y, W, H, col) => { cx.fillStyle = col; cx.fillRect(f * CR + 1 + X, 1 + Y, W, H); };
    CREATURE_DRAW[type](P, f);
    outlineRegion(cx, f * CR, 0, CR, CR);
  }
  return cv;
}

/* Kachi, the flying coin buddy */
function kachiSheet() {
  const S = 18;
  const [cv, cx] = mkCanvas(S * 2, S);
  for (let f = 0; f < 2; f++) {
    const o = f * S + 1;
    fr(cx, o + 0, f ? 4 : 6, 3, 3, '#ffffff'); fr(cx, o + 13, f ? 4 : 6, 3, 3, '#ffffff');
    circle(cx, o + 8, 9, 6, '#e0a800'); circle(cx, o + 8, 9, 5, '#ffd23f');
    fr(cx, o + 5, 5, 2, 1, '#fff6b0');
    fr(cx, o + 6, 7, 1, 2, '#1d1d2b'); fr(cx, o + 10, 7, 1, 2, '#1d1d2b');
    fr(cx, o + 7, 11, 3, 1, '#9a5a00'); fr(cx, o + 5, 10, 1, 1, '#ff9a6a'); fr(cx, o + 11, 10, 1, 1, '#ff9a6a');
    outlineRegion(cx, f * S, 0, S, S);
  }
  return cv;
}
function coinSheet() {
  const S = 10, ws = [8, 6, 2, 6];
  const [cv, cx] = mkCanvas(S * 4, S);
  ws.forEach((w, f) => {
    const x0 = f * S + 1 + (8 - w) / 2;
    fr(cx, x0, 2, w, 6, '#e0a800'); fr(cx, x0 + (w > 2 ? 1 : 0), 1, Math.max(1, w - 2), 8, '#e0a800');
    if (w > 2) { fr(cx, x0 + 1, 2, w - 2, 6, '#ffd23f'); fr(cx, x0 + 1, 2, 1, 3, '#fff6b0'); if (w >= 6) fr(cx, x0 + w / 2 - 0.5, 3, 1, 4, '#c98a00'); }
    outlineRegion(cx, f * S, 0, S, S);
  });
  return cv;
}
function smallThing(kind) {
  const [cv, cx] = mkCanvas(14, 14);
  const P = (X, Y, W, H, col) => fr(cx, 1 + X, 1 + Y, W, H, col);
  if (kind === 'bottle') { P(5, 0, 2, 2, '#1f7a3a'); P(4, 2, 4, 9, '#3fbf6a'); P(5, 3, 1, 6, '#a6f0c0'); P(4, 6, 4, 2, '#ffffff'); }
  if (kind === 'wallet') { P(1, 3, 11, 7, '#8a5a2b'); P(1, 3, 11, 2, '#6d4520'); P(9, 5, 3, 2, '#ffd23f'); P(3, 7, 4, 1, '#c79a6a'); }
  if (kind === 'parcel') { P(1, 3, 11, 9, '#c98a4a'); P(1, 3, 11, 2, '#e0a86a'); P(6, 3, 1, 9, '#7a4a20'); P(3, 6, 3, 2, '#ffffff'); }
  if (kind === 'star') { P(5, 0, 2, 12, '#ffd23f'); P(0, 5, 12, 2, '#ffd23f'); P(3, 3, 6, 6, '#fff3a0'); }
  if (kind === 'arrow') { P(3, 0, 6, 6, '#ffd23f'); P(0, 6, 12, 2, '#ffd23f'); P(2, 8, 8, 2, '#ffd23f'); P(4, 10, 4, 2, '#ffd23f'); }
  outlineRegion(cx, 0, 0, 14, 14);
  return cv;
}

/* ---------------- Vehicles ---------------- */
const VEH_SIZE = { bicycle: [28, 18], scooter: [28, 20], ev: [36, 24] };
function vehicleCanvas(type, neon) {
  const sz = VEH_SIZE[type];
  const [cv, cx] = mkCanvas(sz[0], sz[1]);
  if (type === 'bicycle') {
    ring(cx, 7, 12, 5, 2, '#2a2a33'); ring(cx, 21, 12, 5, 2, '#2a2a33');
    fr(cx, 6, 11, 2, 2, '#999'); fr(cx, 20, 11, 2, 2, '#999');
    line(cx, 7, 12, 12, 6, '#e8423a'); line(cx, 12, 6, 14, 12, '#e8423a'); line(cx, 7, 12, 14, 12, '#e8423a');
    line(cx, 14, 12, 19, 6, '#e8423a'); line(cx, 12, 6, 19, 6, '#e8423a'); line(cx, 19, 6, 21, 12, '#e8423a'); line(cx, 19, 6, 19, 3, '#e8423a');
    fr(cx, 10, 4, 5, 2, '#2a2a33'); fr(cx, 18, 2, 4, 1, '#2a2a33');
  } else if (type === 'scooter') {
    circle(cx, 7, 15, 3.6, '#2a2a33'); circle(cx, 21, 15, 3.6, '#2a2a33'); fr(cx, 6, 14, 2, 2, '#aaa'); fr(cx, 20, 14, 2, 2, '#aaa');
    fr(cx, 4, 9, 10, 4, '#2ec4b6'); fr(cx, 8, 12, 12, 2, '#2ec4b6'); fr(cx, 18, 4, 3, 9, '#2ec4b6'); fr(cx, 16, 3, 6, 1, '#2a2a33');
    fr(cx, 4, 7, 8, 2, '#2a2a33'); fr(cx, 21, 5, 2, 2, '#fff6a0'); fr(cx, 5, 10, 7, 1, '#7ff0e6');
  } else {
    fr(cx, 2, 9, 32, 9, '#ffb703'); fr(cx, 1, 11, 34, 6, '#ffb703'); fr(cx, 7, 2, 20, 8, '#ffb703');
    cx.fillStyle = '#9fdcff'; cx.fillRect(9, 3, 16, 6); cx.fillStyle = '#d8f3ff'; cx.fillRect(10, 4, 3, 2); cx.fillRect(19, 4, 3, 2);
    fr(cx, 17, 3, 1, 6, '#ffb703');
    fr(cx, 2, 13, 32, 1, '#e08a00'); fr(cx, 33, 11, 2, 2, '#fff6a0'); fr(cx, 1, 11, 1, 2, '#e03030');
    circle(cx, 9, 18, 4.2, '#2a2a33'); circle(cx, 27, 18, 4.2, '#2a2a33'); fr(cx, 8, 17, 2, 2, '#bbb'); fr(cx, 26, 17, 2, 2, '#bbb');
    fr(cx, 20, 11, 4, 1, '#ffffff');
  }
  if (neon) { fr(cx, 3, sz[1] - 3, sz[0] - 6, 1, '#39ff88'); fr(cx, 5, sz[1] - 2, sz[0] - 10, 1, '#1fae5a'); }
  outlineRegion(cx, 0, 0, sz[0], sz[1]);
  return cv;
}

/* ---------------- Item icons (for menus) ---------------- */
function iconCanvas(spec) {
  const [cv, cx] = mkCanvas(18, 18);
  const P = (X, Y, W, H, col) => fr(cx, 1 + X, 1 + Y, W, H, col);
  const a = spec.c1 || '#ffd23f', b = spec.c2 || shade(a, -0.3);
  switch (spec.s) {
    case 'plate': P(1, 9, 14, 4, '#ffffff'); P(2, 13, 12, 1, '#cfcfcf'); P(3, 6, 10, 4, a); P(5, 5, 6, 2, b); break;
    case 'bowl': P(2, 7, 12, 2, a); P(4, 5, 8, 2, a); P(1, 9, 14, 3, b); P(3, 12, 10, 2, b); P(6, 14, 4, 1, shade(b, -0.3)); break;
    case 'fruit': circle(cx, 9, 10, 5.5, a); P(7, 2, 1, 3, '#6b4423'); P(8, 2, 4, 2, '#4caf50'); P(5, 7, 2, 2, '#ffffffaa'); break;
    case 'banana': P(3, 10, 3, 2, a); P(5, 11, 6, 2, a); P(10, 9, 3, 3, a); P(12, 6, 2, 4, a); P(13, 4, 1, 2, '#6b4423'); P(5, 12, 6, 1, b); break;
    case 'drink': P(4, 4, 8, 11, '#ffffffcc'); P(5, 6, 6, 8, a); P(9, 0, 1, 6, b); P(4, 4, 8, 1, '#ffffff'); break;
    case 'bottle': P(6, 0, 4, 2, b); P(5, 2, 6, 3, a); P(4, 5, 8, 10, a); P(6, 7, 1, 6, '#ffffff88'); break;
    case 'packet': P(3, 1, 10, 14, a); P(3, 1, 10, 2, b); P(3, 13, 10, 2, b); P(5, 6, 6, 4, '#ffffff'); P(6, 7, 4, 2, b); break;
    case 'bar': P(2, 4, 12, 8, '#6b3a1f'); P(2, 4, 6, 8, a); P(3, 5, 4, 1, '#ffffff'); P(9, 6, 2, 2, '#4a2512'); P(12, 6, 1, 2, '#4a2512'); break;
    case 'sandwich': P(1, 11, 14, 3, '#e8c27a'); P(2, 9, 12, 2, a); P(3, 8, 10, 1, b); P(3, 5, 10, 3, '#e8c27a'); P(6, 3, 4, 2, '#e8c27a'); break;
    case 'popcorn': P(3, 7, 10, 8, '#ffffff'); P(4, 7, 2, 8, '#e03030'); P(8, 7, 2, 8, '#e03030'); P(12, 7, 1, 8, '#e03030'); P(3, 3, 10, 4, '#fff6b0'); P(5, 2, 3, 2, '#ffe680'); break;
    case 'shirt': P(2, 2, 12, 4, a); P(4, 2, 8, 13, a); P(0, 3, 3, 5, a); P(13, 3, 3, 5, a); P(6, 2, 4, 2, b); P(7, 6, 2, 6, b); break;
    case 'backpack': P(3, 3, 10, 12, a); P(5, 1, 6, 2, b); P(4, 8, 8, 5, b); P(6, 9, 4, 1, '#ffd23f'); break;
    case 'calc': P(3, 1, 10, 14, '#8d99ae'); P(4, 2, 8, 4, '#c9ffd8'); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P(4 + i * 3, 7 + j * 3, 2, 2, '#2b2d42'); break;
    case 'phone': P(4, 1, 8, 14, a); P(5, 2, 6, 10, '#1d2b4f'); P(6, 3, 2, 2, b); P(7, 13, 2, 1, '#ffffff'); break;
    case 'headset': ring(cx, 9, 9, 6, 2, a); P(2, 8, 3, 6, b); P(12, 8, 3, 6, b); break;
    case 'watch': P(6, 0, 4, 16, b); P(4, 4, 8, 8, a); P(5, 5, 6, 6, '#1d2b4f'); P(7, 6, 1, 3, '#7df9ff'); P(8, 8, 2, 1, '#7df9ff'); break;
    case 'torch': P(2, 6, 9, 5, a); P(11, 4, 3, 9, b); P(14, 5, 2, 7, '#fff6a0'); break;
    case 'ticket': P(1, 4, 14, 8, a); P(10, 4, 1, 8, b); P(3, 6, 5, 1, '#ffffff'); P(3, 8, 4, 1, '#ffffff'); P(12, 6, 2, 4, b); break;
    case 'book': P(2, 2, 12, 13, a); P(2, 2, 2, 13, b); P(5, 4, 7, 2, '#ffffff'); P(12, 3, 1, 11, '#fff6e0'); break;
    case 'shield': P(3, 1, 10, 8, a); P(4, 9, 8, 3, a); P(6, 12, 4, 2, a); P(7, 14, 2, 1, a); P(5, 6, 2, 2, '#ffffff'); P(7, 7, 1, 2, '#ffffff'); P(8, 5, 2, 2, '#ffffff'); P(10, 3, 1, 2, '#ffffff'); break;
    case 'coin': circle(cx, 9, 9, 7, '#e0a800'); circle(cx, 9, 9, 5.5, '#ffd23f'); P(7, 4, 2, 9, '#c98a00'); P(5, 5, 2, 2, '#fff6b0'); break;
    case 'heart': P(2, 3, 5, 6, a); P(9, 3, 5, 6, a); P(3, 8, 10, 3, a); P(5, 11, 6, 2, a); P(7, 13, 2, 1, a); P(4, 4, 2, 2, '#ffffff'); break;
    case 'card': P(1, 3, 14, 10, a); P(1, 5, 14, 2, b); P(3, 9, 6, 1, '#ffffff'); P(11, 9, 2, 2, '#ffd23f'); break;
    case 'helmet': P(3, 4, 10, 7, a); P(2, 7, 12, 4, a); P(4, 3, 8, 1, a); P(9, 7, 5, 2, '#9fe3ff'); P(4, 5, 3, 1, '#ffffff'); break;
    case 'kit': P(1, 11, 14, 2, '#39ff88'); P(3, 13, 10, 1, '#1fae5a'); P(4, 3, 2, 6, '#39ff88'); P(1, 5, 8, 2, '#39ff88'); P(11, 4, 2, 2, '#ffffff'); break;
    case 'app': P(2, 2, 12, 12, a); P(3, 3, 10, 10, b); ring(cx, 8, 8, 3.5, 1.5, '#ffffff'); P(10, 10, 3, 3, '#ffffff'); break;
    case 'laddoo': circle(cx, 6, 11, 4, a); circle(cx, 11, 11, 4, a); circle(cx, 9, 6, 4, a); P(8, 4, 2, 1, '#ffffff'); break;
    case 'leaf': P(4, 6, 8, 6, a); P(6, 4, 6, 2, a); P(3, 12, 2, 3, b); P(6, 8, 5, 1, b); break;
    case 'cape': P(4, 1, 8, 2, '#ffd23f'); P(3, 3, 10, 12, '#d93a3a'); P(2, 9, 12, 6, '#d93a3a'); P(7, 4, 2, 9, '#a82a2a'); break;
    case 'bike': ring(cx, 4, 11, 3.5, 1.5, '#2a2a33'); ring(cx, 13, 11, 3.5, 1.5, '#2a2a33'); line(cx, 5, 12, 9, 7, a); line(cx, 9, 7, 14, 12, a); line(cx, 9, 7, 12, 4, a); P(6, 5, 3, 1, '#2a2a33'); break;
    case 'scooter': circle(cx, 5, 13, 2.5, '#2a2a33'); circle(cx, 13, 13, 2.5, '#2a2a33'); P(2, 8, 8, 3, a); P(5, 10, 9, 2, a); P(12, 3, 2, 8, a); P(10, 2, 5, 1, '#2a2a33'); break;
    case 'car': P(1, 7, 15, 5, a); P(4, 3, 8, 5, a); P(5, 4, 6, 3, '#aeeaff'); circle(cx, 5, 13, 2.5, '#2a2a33'); circle(cx, 12, 13, 2.5, '#2a2a33'); break;
    case 'bus': P(1, 2, 15, 11, a); P(2, 4, 3, 3, '#aeeaff'); P(6, 4, 3, 3, '#aeeaff'); P(10, 4, 3, 3, '#aeeaff'); P(14, 4, 2, 6, '#aeeaff'); circle(cx, 5, 14, 2, '#2a2a33'); circle(cx, 12, 14, 2, '#2a2a33'); break;
    case 'badge': circle(cx, 9, 7, 6, a); circle(cx, 9, 7, 4, b); P(4, 11, 3, 5, '#e03030'); P(10, 11, 3, 5, '#2b5cb8'); P(8, 5, 2, 4, '#ffffff'); break;
    case 'gift': P(2, 6, 12, 9, a); P(1, 4, 14, 3, b); P(7, 4, 2, 11, '#ffd23f'); P(5, 2, 2, 2, '#ffd23f'); P(9, 2, 2, 2, '#ffd23f'); break;
    case 'meal': P(1, 9, 14, 4, '#ffffff'); P(2, 6, 4, 4, '#f4e1a0'); P(6, 6, 4, 4, '#e0a03a'); P(10, 6, 4, 4, '#4caf50'); P(2, 13, 12, 1, '#cfcfcf'); break;
    default: P(3, 3, 10, 10, a); break;
  }
  outlineRegion(cx, 0, 0, 18, 18);
  return cv;
}

/* ---------------- Parallax backgrounds ---------------- */
function skyCanvas(top, bottom) {
  const [cv, cx] = mkCanvas(4, 256);
  const g = cx.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, top); g.addColorStop(1, bottom);
  cx.fillStyle = g; cx.fillRect(0, 0, 4, 256);
  return cv;
}
function cloudsCanvas() {
  const W = 480, H = 90; const [cv, cx] = mkCanvas(W, H);
  const blob = (x, y, s) => {
    circle(cx, x, y, 9 * s, '#ffffff'); circle(cx, x + 11 * s, y - 5 * s, 11 * s, '#ffffff'); circle(cx, x + 24 * s, y, 9 * s, '#ffffff');
    fr(cx, x, y, 24 * s, 8 * s, '#ffffff'); fr(cx, x - 2, y + 6 * s, 28 * s, 2, '#d5eefc');
  };
  blob(30, 40, 1); blob(170, 25, 0.8); blob(300, 50, 1.2); blob(410, 30, 0.7);
  outlineRegion(cx, 0, 0, W, H, '#7fb6d6');
  return cv;
}
function hillsCanvas(col, dark, seed, amp, base) {
  const W = 480, H = 420; const [cv, cx] = mkCanvas(W, H);
  for (let x = 0; x < W; x++) {
    const y = base - amp * (0.55 * Math.sin((x / W) * Math.PI * 2 * 2 + seed) + 0.3 * Math.sin((x / W) * Math.PI * 2 * 5 + seed * 2) + 0.15 * Math.sin((x / W) * Math.PI * 2 * 9));
    fr(cx, x, Math.round(y), 1, H - Math.round(y), col);
    fr(cx, x, Math.round(y), 1, 2, shade(col, 0.2));
  }
  // little dotted bushes
  for (let i = 0; i < 26; i++) { const x = (i * 37 + seed * 13) % W; const y = base + 10 + ((i * 17) % 30); fr(cx, x, y, 3, 2, dark); }
  outlineRegion(cx, 0, 0, W, H, dark);
  return cv;
}
function townSilCanvas() {
  const W = 480, H = 420, HZ = 122; const [cv, cx] = mkCanvas(W, H);
  const col = '#6fb0c4', win = '#9fd2e0';
  const blds = [[10, 60, 34], [50, 40, 26], [80, 75, 30], [118, 50, 22], [150, 90, 36], [196, 55, 28], [232, 70, 24], [262, 45, 40], [310, 85, 26], [342, 60, 34], [384, 40, 24], [414, 72, 30], [450, 52, 26]];
  blds.forEach(([x, hh, w]) => {
    fr(cx, x, HZ - hh, w, hh, col);
    for (let yy = HZ - hh + 6; yy < HZ - 8; yy += 9) for (let xx = x + 4; xx < x + w - 4; xx += 7) fr(cx, xx, yy, 3, 4, win);
  });
  // tree line in front
  for (let x = -6; x < W + 6; x += 14) { circle(cx, x, HZ - 12 + ((x * 7) % 5), 10, '#3f9a52'); }
  fr(cx, 0, HZ - 10, W, H - HZ + 10, '#3f9a52');
  outlineRegion(cx, 0, 0, W, H, '#2a6b45');
  return cv;
}

/* Data URL caches for DOM menus */
const ART = {
  iconCache: {}, portraitCache: {}, looks: {},
  icon(spec) {
    const key = spec.s + '|' + (spec.c1 || '') + '|' + (spec.c2 || '');
    if (!this.iconCache[key]) this.iconCache[key] = iconCanvas(spec).toDataURL();
    return this.iconCache[key];
  },
  portrait(lookKey, look) {
    if (!this.portraitCache[lookKey]) {
      const [cv, cx] = mkCanvas(PFW, PFH);
      drawPerson(cx, 1, 1, 'idle0', look); outlineRegion(cx, 0, 0, PFW, PFH);
      this.portraitCache[lookKey] = cv.toDataURL();
    }
    return this.portraitCache[lookKey];
  },
  creature(type) {
    const k = 'cr_' + type;
    if (!this.portraitCache[k]) { const cv = creatureSheet(type); const [c2, x2] = mkCanvas(CR, CR); x2.drawImage(cv, 0, 0); this.portraitCache[k] = c2.toDataURL(); }
    return this.portraitCache[k];
  },
  kachi() {
    if (!this.portraitCache.kachi) { const cv = kachiSheet(); const [c2, x2] = mkCanvas(18, 18); x2.drawImage(cv, 0, 0); this.portraitCache.kachi = c2.toDataURL(); }
    return this.portraitCache.kachi;
  }
};
