'use strict';
/* ==========================================================
   Shaka-Kachi: MoneyWise Mission
   core.js : constants, helpers, keyboard input, sound
   ========================================================== */

const VIEW_W = 1366, VIEW_H = 768;
const T = 16;            // tile size in world pixels
const ZOOM = 3;          // camera zoom (integer for crisp pixels)
const GY = 40;           // ground surface row
const FH = 5;            // floor height in tiles (4 air rows + 1 slab)
const MAP_W = 380, MAP_H = 48;
const WORLD_W = MAP_W * T, WORLD_H = MAP_H * T;
const START_CASH = 12000;
const TOTAL_DAYS = 30;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function approach(v, t, d) { return v < t ? Math.min(v + d, t) : Math.max(v - d, t); }
function money(n) {
  n = Math.round(n || 0);
  const neg = n < 0; n = Math.abs(n);
  return (neg ? '-' : '') + '₹' + n.toLocaleString('en-IN');
}
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

/* Tiny DOM builder. props: class, style, html, act (keyboard/mouse activatable), on* listeners */
function h(tag, props) {
  const el = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'act') {
        el._act = v; el.classList.add('nav');
        el.addEventListener('click', function (e) { e.stopPropagation(); if (!el.classList.contains('disabled')) { SFX.play('click'); v(el); } });
        el.addEventListener('mouseenter', function () { if (UI && UI.setFocus) UI.setFocus(el, true); });
      }
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
  }
  for (let i = 2; i < arguments.length; i++) addKids(el, arguments[i]);
  return el;
}
function addKids(el, c) {
  if (c === null || c === undefined || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { addKids(el, x); }); return; }
  el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
}

/* ---------------- Keyboard input ---------------- */
const KEYMAP = {
  left: ['arrowleft', 'a'], right: ['arrowright', 'd'], up: ['arrowup', 'w'], down: ['arrowdown', 's'],
  jump: [' ', 'z', 'k'], interact: ['e', 'enter'], vehicle: ['v'], bag: ['i'], wardrobe: ['c'],
  map: ['m'], profile: ['p'], phone: ['q'], help: ['h'], pause: ['escape'], eat: ['f'], mute: ['n']
};
const Input = {
  down: {}, pressed: {},
  init() {
    window.addEventListener('keydown', (e) => {
      const k = (e.key || '').toLowerCase();
      SFX.unlock();
      if (typeof UI !== 'undefined' && UI.handleKey(k, e)) { e.preventDefault(); return; }
      if (!this.down[k]) this.pressed[k] = true;
      this.down[k] = true;
      if (k === ' ' || k.indexOf('arrow') === 0 || k === 'tab') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.down[(e.key || '').toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.down = {}; this.pressed = {}; });
  },
  held(a) { const ks = KEYMAP[a]; for (let i = 0; i < ks.length; i++) if (this.down[ks[i]]) return true; return false; },
  hit(a) { const ks = KEYMAP[a]; let r = false; for (let i = 0; i < ks.length; i++) if (this.pressed[ks[i]]) r = true; return r; },
  clear() { this.pressed = {}; },
  reset() { this.pressed = {}; this.down = {}; }
};

/* ---------------- Synth sound effects (no audio files needed) ---------------- */
const SFX_DEF = {
  jump: [{ f: 320, f2: 640, l: 0.11, w: 'square', v: 0.035 }],
  coin: [{ f: 988, l: 0.07, w: 'square', v: 0.04 }, { f: 1319, l: 0.16, d: 0.06, w: 'square', v: 0.04 }],
  buy: [{ f: 660, l: 0.08, w: 'triangle', v: 0.08 }, { f: 880, l: 0.12, d: 0.08, w: 'triangle', v: 0.08 }],
  error: [{ f: 200, f2: 120, l: 0.22, w: 'sawtooth', v: 0.04 }],
  good: [{ f: 523, l: 0.1, w: 'triangle', v: 0.09 }, { f: 659, l: 0.1, d: 0.1, w: 'triangle', v: 0.09 }, { f: 784, l: 0.2, d: 0.2, w: 'triangle', v: 0.09 }],
  bad: [{ f: 392, l: 0.15, w: 'triangle', v: 0.08 }, { f: 311, l: 0.25, d: 0.14, w: 'triangle', v: 0.08 }],
  click: [{ f: 1200, l: 0.03, w: 'square', v: 0.02 }],
  eat: [{ f: 300, f2: 200, l: 0.07, w: 'square', v: 0.04 }, { f: 300, f2: 200, l: 0.07, d: 0.1, w: 'square', v: 0.04 }],
  bump: [{ f: 140, f2: 90, l: 0.12, w: 'square', v: 0.05 }],
  open: [{ f: 440, f2: 660, l: 0.09, w: 'triangle', v: 0.06 }],
  day: [{ f: 523, l: 0.12, w: 'sine', v: 0.08 }, { f: 784, l: 0.3, d: 0.12, w: 'sine', v: 0.08 }],
  badge: [{ f: 523, l: 0.1, w: 'square', v: 0.05 }, { f: 659, l: 0.1, d: 0.1, w: 'square', v: 0.05 }, { f: 784, l: 0.1, d: 0.2, w: 'square', v: 0.05 }, { f: 1047, l: 0.3, d: 0.3, w: 'square', v: 0.05 }]
};
const SFX = {
  ctx: null, on: true,
  unlock() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(name) {
    if (!this.on || !this.ctx) return;
    const def = SFX_DEF[name]; if (!def) return;
    const t = this.ctx.currentTime;
    try {
      def.forEach((n) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        const st = t + (n.d || 0);
        o.type = n.w || 'square';
        o.frequency.setValueAtTime(n.f, st);
        if (n.f2) o.frequency.linearRampToValueAtTime(n.f2, st + n.l);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.setValueAtTime(n.v || 0.05, st);
        g.gain.exponentialRampToValueAtTime(0.0001, st + n.l);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(st); o.stop(st + n.l + 0.03);
      });
    } catch (e) { /* ignore */ }
  }
};
