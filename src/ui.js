'use strict';
/* ==========================================================
   ui.js : DOM interface layer (HUD, panels, keyboard menus)
   ========================================================== */

const UI = {
  stack: [], focusEl: null, title: null, hudCache: {}, tipQ: [], tipT: 0,

  init() {
    this.root = document.getElementById('ui');
    this.hud = document.getElementById('hud');
    this.panels = document.getElementById('panels');
    this.toasts = document.getElementById('toasts');
    this.prompt = document.getElementById('prompt');
    this.tip = document.getElementById('tip');
    this.night = document.getElementById('night');
    this.vignette = document.getElementById('vignette');
    this.fadeEl = document.getElementById('fade');
    this.timerEl = document.getElementById('gigtimer');
    this.buildHud();
  },

  modal() { return this.stack.length > 0; },
  top() { return this.stack[this.stack.length - 1]; },

  /* ---------- keyboard ---------- */
  handleKey(k, e) {
    const top = this.top();
    if (top) {
      if (e.repeat && (k === 'enter' || k === ' ' || k === 'e')) return true;
      if (top.onKey && top.onKey(k, top) === true) return true;
      if (k === 'arrowleft' || k === 'a') { this.moveFocus(-1, 0); return true; }
      if (k === 'arrowright' || k === 'd') { this.moveFocus(1, 0); return true; }
      if (k === 'arrowup' || k === 'w') { this.moveFocus(0, -1); return true; }
      if (k === 'arrowdown' || k === 's') { this.moveFocus(0, 1); return true; }
      if (k === 'tab') { this.moveFocus(e.shiftKey ? -1 : 1, 0, true); return true; }
      if (k === 'enter' || k === ' ' || k === 'e') { this.activate(); return true; }
      if (k === 'escape' || k === 'backspace' || (top.hotkey && k === top.hotkey)) { if (top.closable !== false) { SFX.play('click'); top.close(); } return true; }
      if (/^[1-9]$/.test(k)) { const items = this.navItems(); const el = items.filter((x) => x.dataset.num === k)[0]; if (el) { this.setFocus(el); this.activate(); } return true; }
      return true; // swallow everything else while a menu is open
    }
    if (typeof G === 'undefined' || !G.running || G.busy) return false;
    if (e.repeat) return false;
    switch (k) {
      case 'i': case 'f': Panels.bag(); return true;
      case 'c': Panels.wardrobe(); return true;
      case 'm': Panels.map(); return true;
      case 'p': Panels.profile(); return true;
      case 'q': Panels.phone(); return true;
      case 'h': case 'escape': Panels.pause(); return true;
      case 'n': S.d.sound = SFX.on = !SFX.on; this.toast('Sound ' + (SFX.on ? 'on' : 'off')); return true;
      default: return false;
    }
  },
  navItems() {
    const top = this.top(); if (!top) return [];
    return Array.prototype.slice.call(top.el.querySelectorAll('.nav')).filter((x) => !x.classList.contains('disabled') && x.offsetParent !== null);
  },
  setFocus(el, fromMouse) {
    if (this.focusEl) this.focusEl.classList.remove('focus');
    this.focusEl = el;
    if (el) { el.classList.add('focus'); if (!fromMouse && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
  },
  focusFirst() {
    const items = this.navItems().filter((x) => !x.classList.contains('pclose'));
    const pref = items.filter((x) => x.classList.contains('primary'))[0];
    this.setFocus(pref || items[0] || this.navItems()[0] || null);
  },
  moveFocus(dx, dy, linear) {
    const items = this.navItems(); if (!items.length) return;
    const cur = this.focusEl;
    if (!cur || items.indexOf(cur) < 0) { this.setFocus(items[0]); return; }
    if (linear) { const i = items.indexOf(cur); this.setFocus(items[(i + dx + items.length) % items.length]); return; }
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bs = 1e9;
    items.forEach((it) => {
      if (it === cur) return;
      const q = it.getBoundingClientRect(), qx = q.left + q.width / 2, qy = q.top + q.height / 2;
      const along = dx ? (qx - cx) * dx : (qy - cy) * dy;
      if (along <= 3) return;
      const across = dx ? Math.abs(qy - cy) : Math.abs(qx - cx);
      const s = along + across * 2.2;
      if (s < bs) { bs = s; best = it; }
    });
    if (!best) { const i = items.indexOf(cur); const n = dx + dy > 0 ? i + 1 : i - 1; if (n >= 0 && n < items.length) best = items[n]; }
    if (best) { this.setFocus(best); SFX.play('click'); }
  },
  activate() { const el = this.focusEl; if (el && el._act && !el.classList.contains('disabled')) { SFX.play('click'); el._act(el); } },

  /* ---------- panels ---------- */
  open(o) {
    const p = {
      closable: o.closable !== false, onKey: o.onKey, hotkey: o.hotkey,
      el: h('div', { class: 'panel ' + (o.cls || '') }),
      close: () => { const i = this.stack.indexOf(p); if (i < 0) return; this.stack.splice(i, 1); p.el.remove(); this.setFocus(null); if (o.onClose) o.onClose(p); if (this.top()) { this.top().el.classList.remove('under'); this.focusFirst(); } this.updateHud(true); },
      refresh: () => { p.body.innerHTML = ''; o.build(p.body, p); this.focusFirst(); }
    };
    if (this.top()) this.top().el.classList.add('under');
    this.tip.classList.remove('show'); this.tipT = 0;
    const head = h('div', { class: 'phead' },
      o.icon ? h('img', { class: 'picon', src: o.icon }) : null,
      h('div', { class: 'ptitle' }, o.title || ''),
      p.closable ? h('div', { class: 'pclose', act: () => p.close(), title: 'Close (Esc)' }, 'Esc ✕') : null);
    p.body = h('div', { class: 'pbody' });
    p.el.appendChild(head); p.el.appendChild(p.body);
    const wrap = h('div', { class: 'pwrap' }, p.el);
    p.wrap = wrap;
    const origRemove = p.el.remove.bind(p.el);
    p.el.remove = () => { origRemove(); wrap.remove(); };
    this.panels.appendChild(wrap);
    this.stack.push(p);
    Input.reset();
    SFX.play('open');
    o.build(p.body, p);
    this.focusFirst();
    return p;
  },
  closeAll() { while (this.stack.length) this.stack[this.stack.length - 1].close(); },

  /* Simple dialog: speaker portrait, text, buttons [{l, act, cls}] */
  say(o) {
    return this.open({
      title: o.title || o.who || '', cls: 'dialog ' + (o.cls || ''), closable: o.closable !== false, icon: o.icon,
      build: (b, p) => {
        const row = h('div', { class: 'say' });
        if (o.portrait) row.appendChild(h('img', { class: 'portrait', src: o.portrait }));
        const tx = h('div', { class: 'saytext' });
        if (o.who) tx.appendChild(h('div', { class: 'who' }, o.who));
        if (o.html) tx.appendChild(h('div', { class: 'txt', html: o.html })); else tx.appendChild(h('div', { class: 'txt' }, o.text || ''));
        if (o.extra) tx.appendChild(o.extra);
        row.appendChild(tx); b.appendChild(row);
        const btns = h('div', { class: 'btnrow' });
        (o.buttons || [{ l: 'OK', cls: 'primary' }]).forEach((bt, i) => {
          btns.appendChild(this.btn(bt.l, () => { if (bt.keep !== true) p.close(); if (bt.act) bt.act(p); }, (bt.cls || '') + (bt.disabled ? ' disabled' : ''), String(i + 1)));
        });
        b.appendChild(btns);
      }
    });
  },
  btn(label, act, cls, num) {
    const b = h('div', { class: 'btn ' + (cls || ''), act: act });
    if (num) { b.dataset.num = num; b.appendChild(h('span', { class: 'num' }, num)); }
    b.appendChild(h('span', null, label));
    return b;
  },
  kachiSay(text, buttons, opt) {
    return this.say(Object.assign({ who: 'Kachi', portrait: ART.kachi(), text: text, buttons: buttons, cls: 'kachi' }, opt || {}));
  },

  /* ---------- HUD ---------- */
  buildHud() {
    this.hud.innerHTML = '';
    const bar = (id, label, cls) => h('div', { class: 'bar ' + cls }, h('div', { class: 'blabel' }, label), h('div', { class: 'btrack' }, h('div', { class: 'bfill', id: id })), h('div', { class: 'bval', id: id + 'v' }, '0'));
    this.hud.appendChild(h('div', { class: 'hud-left' },
      h('img', { class: 'hud-face', id: 'hudface' }),
      h('div', { class: 'bars' }, bar('hb-hunger', 'Hunger', 'hunger'), bar('hb-health', 'Health', 'health'), bar('hb-joy', 'Joy', 'joy'))));
    this.hud.appendChild(h('div', { class: 'hud-mid' }, h('div', { class: 'day', id: 'hud-day' }, 'Day 1'), h('div', { class: 'clock', id: 'hud-clock' }, '7:00 am')));
    this.hud.appendChild(h('div', { class: 'hud-right' },
      h('div', { class: 'money cash' }, h('span', { class: 'ml' }, 'Cash'), h('span', { id: 'hud-cash' })),
      h('div', { class: 'money sav' }, h('span', { class: 'ml' }, 'Saved'), h('span', { id: 'hud-sav' })),
      h('div', { class: 'chips' }, h('span', { class: 'chip coin' }, h('img', { src: ART.icon({ s: 'coin' }) }), h('b', { id: 'hud-coins' })), h('span', { class: 'chip shield' }, h('img', { src: ART.icon({ s: 'shield', c1: '#3a86ff' }) }), h('b', { id: 'hud-shields' })), h('span', { class: 'chip phonechip', id: 'hud-msg' }, 'Q'))));
    this.hud.appendChild(h('div', { class: 'hud-obj', id: 'hud-obj' }));
    this.hud.appendChild(h('div', { class: 'hud-keys' },
      ['←→ Move', 'Space Jump', '↑↓ Climb', 'E Interact', 'I Bag', 'C Clothes', 'V Ride', 'M Map', 'P Profile', 'Q Phone', 'H Help'].map((s) => h('span', null, s))));
  },
  updateHud(force) {
    if (!S.d) return;
    const d = S.d, c = this.hudCache;
    const set = (id, v, fn) => { if (force || c[id] !== v) { c[id] = v; const el = document.getElementById(id); if (el) fn(el, v); } };
    const setBar = (id, v) => { set(id, Math.round(v), (el, val) => { el.style.width = val + '%'; document.getElementById(id + 'v').textContent = val; el.parentNode.parentNode.classList.toggle('low', val < 25); }); };
    setBar('hb-hunger', d.hunger); setBar('hb-health', d.health); setBar('hb-joy', d.joy);
    set('hud-day', S.day(), (el, v) => { el.textContent = 'Day ' + Math.min(v, TOTAL_DAYS) + ' of ' + TOTAL_DAYS; });
    set('hud-clock', S.clock(), (el, v) => { el.textContent = v; });
    set('hud-cash', d.cash, (el, v) => { el.textContent = money(v); });
    set('hud-sav', d.savings + d.emergency + d.goal, (el, v) => { el.textContent = money(v); });
    set('hud-coins', d.coins, (el, v) => { el.textContent = v; });
    set('hud-shields', d.shields, (el, v) => { el.textContent = v; });
    const unread = d.inbox.filter((m) => !m.done).length;
    set('hud-msg', unread, (el, v) => { el.textContent = v ? 'Q  ' + v + ' new' : 'Q Phone'; el.classList.toggle('alert', v > 0); });
    set('hud-obj', this.objective(), (el, v) => { el.innerHTML = v; });
    set('hudface', d.outfit, (el, v) => { el.src = ART.portrait('player_' + v, Object.assign({}, PLAYER_BASE, OUTFITS[v].look)); });
    // night & low health overlays
    let n = S.night() * 0.42;
    if (S.has('torch')) n *= 0.45;
    set('night', Math.round(n * 100), (el, v) => { el.style.opacity = v / 100; });
    set('vignette', Math.round(clamp((35 - d.health) / 35, 0, 1) * 100), (el, v) => { el.style.opacity = v / 100; });
  },
  objective() {
    const d = S.d;
    if (d.gigActive) {
      const g = d.gigActive;
      if (g.id === 'delivery') return '<b>Gig:</b> Deliver the parcel to Librarian Leela (Education Centre, ground floor)';
      if (g.id === 'recycle') return '<b>Gig:</b> Collect bottles: ' + g.got + ' / 5' + (g.got >= 5 ? '. Return to Ms Kavya!' : '');
    }
    if (d.wallet === 1) return '<b>Side quest:</b> Return the wallet to Mrs Asha (outside the Fun Zone)';
    for (let i = 0; i < MISSION_ORDER.length; i++) {
      const m = MISSION_ORDER[i];
      if (!d.missions[m]) { const M = MISSIONS[m]; const npc = NPCS.filter((n) => n.id === M.npc)[0]; return '<b>Mission ' + (i + 1) + '/9:</b> ' + M.name + ' → ' + npc.name + ', ' + M.where; }
    }
    return '<b>All missions done!</b> Keep your money healthy until Day ' + TOTAL_DAYS + ', or see Principal Meera.';
  },

  showPrompt(text, sx, sy) {
    if (!text) { if (this.prompt.style.display !== 'none') this.prompt.style.display = 'none'; return; }
    if (this.prompt._t !== text) { this.prompt.innerHTML = '<span class="key">E</span> ' + text; this.prompt._t = text; }
    this.prompt.style.display = 'block';
    this.prompt.style.left = Math.round(sx) + 'px'; this.prompt.style.top = Math.round(sy) + 'px';
  },

  toast(text, kind) {
    const el = h('div', { class: 'toast ' + (kind || '') }, text);
    this.toasts.appendChild(el);
    while (this.toasts.children.length > 5) this.toasts.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); }, 3000);
    setTimeout(() => { el.remove(); }, 3500);
  },
  kachiTip(text, key) {
    if (key) { S.d.tipsSeen = S.d.tipsSeen || {}; if (S.d.tipsSeen[key]) return; S.d.tipsSeen[key] = 1; }
    if (this.tipQ.indexOf(text) < 0) this.tipQ.push(text);
  },
  tickTip(dt) {
    if (this.tipT > 0) { this.tipT -= dt; if (this.tipT <= 0) this.tip.classList.remove('show'); return; }
    if (this.tipQ.length && !this.modal()) {
      const t = this.tipQ.shift();
      this.tip.innerHTML = ''; this.tip.appendChild(h('img', { src: ART.kachi() })); this.tip.appendChild(h('div', null, h('b', null, 'Kachi: '), t));
      this.tip.classList.add('show'); this.tipT = 5.5;
    }
  },
  badgePop(id) {
    const B = BADGES[id];
    SFX.play('badge');
    const el = h('div', { class: 'badgepop' }, h('img', { src: ART.icon({ s: 'badge', c1: B.c, c2: shade(B.c, -0.3) }) }), h('div', null, h('small', null, 'Badge earned!'), h('b', null, B.name), h('span', null, B.desc)));
    document.getElementById('ui').appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3800);
  },
  fade(cb) {
    this.fadeEl.classList.add('on');
    setTimeout(() => { if (cb) cb(); setTimeout(() => this.fadeEl.classList.remove('on'), 120); }, 380);
  },
  setTimer(text) {
    if (!text) { this.timerEl.style.display = 'none'; return; }
    this.timerEl.style.display = 'block'; this.timerEl.textContent = text;
  },

  /* ---------- reusable bits ---------- */
  itemIcon(id) { const it = ITEMS[id]; return h('img', { class: 'icon', src: ART.icon(it.icon) }); },
  tagChip(tag) { if (!tag || !S.d.needsUnlocked) return null; return h('span', { class: 'tag ' + tag }, tag === 'need' ? 'NEED' : 'WANT'); },
  tabs(names, cur, onPick) {
    return h('div', { class: 'tabs' }, names.map((n, i) => { const t = h('div', { class: 'tab' + (i === cur ? ' on' : ''), act: () => onPick(i) }, n); return t; }));
  },
  amountPicker(o) {
    // o: {max, min, value, step, onChange}
    let v = o.value || 0;
    const val = h('div', { class: 'amt' }, money(v));
    const upd = (nv) => { v = clamp(Math.round(nv), 0, Math.max(0, o.max)); val.textContent = money(v); if (o.onChange) o.onChange(v); };
    const wrap = h('div', { class: 'amtpick' },
      this.btn('-500', () => upd(v - 500), 'small'), this.btn('-100', () => upd(v - 100), 'small'), val,
      this.btn('+100', () => upd(v + 100), 'small'), this.btn('+500', () => upd(v + 500), 'small'), this.btn('Max', () => upd(o.max), 'small'));
    wrap.get = () => v; wrap.set = upd;
    return wrap;
  }
};
