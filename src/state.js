'use strict';
/* ==========================================================
   state.js : the player's money, wellbeing, progress, saving
   ========================================================== */

const SAVE_KEY = 'shakakachi_moneywise_v1';
const DAY_LEN = { short: 36, standard: 48, long: 66 };

const S = {
  d: null, // the current save data

  fresh(opts) {
    opts = opts || {};
    this.d = {
      v: 1, name: opts.name || 'Shaka', len: opts.len || 'standard', sound: true,
      time: 1.0, // game days elapsed (day number = floor)
      cash: START_CASH, savings: 0, emergency: 0, goal: 0, goalName: '', goalTarget: 0,
      coins: 0, coinsEarned: 0, shields: 1, hints: 0,
      hunger: 70, health: 100, joy: 70,
      outfit: 'uniform', outfits: ['uniform'],
      bag: { banana: 1 }, owned: {},
      vehicle: null, // {type, rented, neon, x, y, riding, due}
      busPassUntil: 0,
      subs: [], // {name, weekly, start, joyDaily}
      missions: {}, sides: {}, badges: {},
      log: [], // {d, amt, cat, label, tag}
      stats: { resisted: 0, lost: 0, lostAmt: 0, msgRight: 0, msgWrong: 0, gigs: 0, earned: 0, interest: 0, fainted: 0, roofs: {}, coinsPicked: 0 },
      coinsTaken: {}, obstacleGone: {}, inbox: [], msgSeen: 0,
      gigsToday: {}, gigActive: null, inflationUntil: 0, wallet: 0,
      lastEventDay: 1, lastMsgDay: 1, lastDay: 1, samples: [], tutorial: true, needsUnlocked: false,
      px: 20 * T, py: 35 * T - 22, freeMealDay: 0, nurseDay: 0, libDay: 0, scopeDay: 0, benchT: 0,
      kept: 0, ended: false, sessionSec: 0
    };
  },
  day() { return Math.floor(this.d.time); },
  dayLen() { return DAY_LEN[this.d.len] || 48; },
  hour() { const f = this.d.time - Math.floor(this.d.time); return 7 + f * 15; },
  clock() { const hh = this.hour(); const H = Math.floor(hh), M = Math.floor((hh - H) * 60 / 10) * 10; const ap = H >= 12 ? 'pm' : 'am'; const H12 = ((H + 11) % 12) + 1; return H12 + ':' + (M < 10 ? '0' : '') + M + ' ' + ap; },
  night() { const hh = this.hour(); return hh >= 19 ? clamp((hh - 19) / 2.5, 0, 1) : 0; },

  has(id) { return !!this.d.owned[id]; },
  bagCount() { let n = 0; for (const k in this.d.bag) n += this.d.bag[k]; return n; },
  bagCap() { return this.has('backpack') ? 20 : 12; },
  addBag(id, n) { this.d.bag[id] = (this.d.bag[id] || 0) + (n || 1); },

  missionDone(id) { return !!this.d.missions[id]; },
  missionsDone() { return MISSION_ORDER.filter((m) => this.d.missions[m]).length; },

  /* ---------- money ---------- */
  canPay(n) { return this.d.cash >= n; },
  record(amt, cat, label, tag) {
    this.d.log.push({ d: this.day(), amt: Math.round(amt), cat: cat, label: label, tag: tag });
    if (this.d.log.length > 400) this.d.log.shift();
  },
  pay(n, cat, label, tag) {
    n = Math.round(n);
    if (n <= 0) return true;
    if (this.d.cash < n) return false;
    this.d.cash -= n;
    this.record(-n, cat, label, tag);
    return true;
  },
  earn(n, label, isIncome) {
    n = Math.round(n);
    this.d.cash += n;
    this.record(n, 'income', label, 'income');
    if (isIncome !== false) this.d.stats.earned += n;
  },
  move(from, to, n) {
    n = Math.round(n);
    if (n <= 0 || this.d[from] < n) return false;
    this.d[from] -= n; this.d[to] += n;
    return true;
  },
  addCoins(n, why) {
    this.d.coins += n; this.d.coinsEarned += n;
    if (typeof UI !== 'undefined') UI.toast('+' + n + ' MoneyWise coin' + (n > 1 ? 's' : '') + (why ? ' (' + why + ')' : ''), 'coin');
    this.checkBadges();
  },
  lose(n, cat, label) {
    const amt = Math.min(n, this.d.cash);
    if (amt > 0) { this.d.cash -= amt; this.record(-amt, cat || 'losses', label, 'loss'); }
    this.d.stats.lostAmt += amt;
    return amt;
  },
  /* price with temporary inflation on food */
  price(id, base) {
    const it = ITEMS[id];
    if (it && it.type === 'food' && this.d.inflationUntil >= this.day()) return Math.round(base * 1.15);
    return base;
  },

  vehicleValue() { const v = this.d.vehicle; if (!v || v.rented) return 0; return Math.round(VEHICLES[v.type].price * RESALE); },
  wealth() { return this.d.cash + this.d.savings + this.d.emergency + this.d.goal; },
  spentBy() {
    const cats = {}; let needs = 0, wants = 0, losses = 0;
    this.d.log.forEach((e) => {
      if (e.amt >= 0) return;
      const a = -e.amt;
      cats[e.cat] = (cats[e.cat] || 0) + a;
      if (e.tag === 'need') needs += a; else if (e.tag === 'want') wants += a; else if (e.tag === 'loss') losses += a;
    });
    return { cats: cats, needs: needs, wants: wants, losses: losses };
  },

  /* ---------- MoneyWise score (0 to 1000) ---------- */
  score() {
    const d = this.d, sp = this.spentBy();
    let mission = 0;
    MISSION_ORDER.forEach((m) => { const r = d.missions[m]; if (r) mission += r.stars >= 3 ? 45 : r.stars === 2 ? 36 : 27; });
    const saved = d.savings + d.emergency + d.goal;
    const saving = Math.round(Math.min(1, saved / 3000) * 150);
    const waste = Math.round(100 - Math.min(100, sp.losses / 30));
    const nw = sp.needs + sp.wants;
    const share = nw > 0 ? sp.wants / nw : 0.3;
    const balance = Math.round(clamp((0.7 - share) / 0.4, 0, 1) * 100);
    const samples = d.samples.length ? d.samples : [{ h: d.health, j: d.joy }];
    const avgH = samples.reduce((a, s) => a + s.h, 0) / samples.length, avgJ = samples.reduce((a, s) => a + s.j, 0) / samples.length;
    const wellbeing = Math.round((avgH * 0.6 + avgJ * 0.4));
    const coins = Math.round(Math.min(1, d.coinsEarned / 80) * 60);
    const badges = Math.min(85, Object.keys(d.badges).length * 5);
    const total = mission + saving + waste + balance + wellbeing + coins + badges;
    return { total: total, parts: { 'Missions': [mission, 405], 'Savings built': [saving, 150], 'Avoided losses': [waste, 100], 'Needs vs wants balance': [balance, 100], 'Health and joy': [wellbeing, 100], 'MoneyWise coins': [coins, 60], 'Badges': [badges, 85] }, wantShare: share, sp: sp };
  },
  grade(total) {
    if (total >= 850) return ['S', 'MoneyWise Master'];
    if (total >= 700) return ['A', 'Smart Saver'];
    if (total >= 550) return ['B', 'Budget Builder'];
    if (total >= 400) return ['C', 'Learning Fast'];
    return ['D', 'Keep Practising'];
  },

  award(badge) {
    if (this.d.badges[badge]) return false;
    this.d.badges[badge] = this.day();
    if (typeof UI !== 'undefined') UI.badgePop(badge);
    return true;
  },
  checkBadges() {
    const d = this.d;
    if (d.coinsEarned >= 40) this.award('coins40');
    if (d.stats.resisted >= 10) this.award('resist10');
    if (d.stats.msgRight >= 5) this.award('inbox5');
    if (d.stats.gigs >= 5) this.award('gigs5');
    if (Object.keys(d.stats.roofs).length >= 8) this.award('roofs');
  },

  /* ---------- daily tick ---------- */
  newDay(day) {
    const d = this.d, out = [];
    d.samples.push({ h: d.health, j: d.joy });
    d.gigsToday = {};
    // vehicle running costs
    const v = d.vehicle;
    if (v) {
      if (v.rented) {
        if (v.rentDay < day) { out.push('Your rented bicycle was returned to the Transport Hub.'); d.vehicle = null; }
      } else {
        const cost = VEHICLES[v.type].daily;
        if (this.pay(cost, 'transport', VEHICLES[v.type].name + ' running cost', 'need')) out.push(VEHICLES[v.type].name + ' running cost: ' + money(cost));
        else { v.due = (v.due || 0) + cost; out.push('Could not pay ' + VEHICLES[v.type].name + ' running cost. It now needs servicing (slower) until you pay at the Transport Hub.'); }
      }
    }
    // subscriptions renew weekly
    d.subs.slice().forEach((s) => {
      if ((day - s.start) > 0 && (day - s.start) % 7 === 0) {
        if (this.pay(s.weekly, 'subscriptions', s.name + ' renewal', 'want')) out.push(s.name + ' auto-renewed: ' + money(s.weekly));
        else { d.subs.splice(d.subs.indexOf(s), 1); out.push(s.name + ' payment failed, so it was cancelled.'); }
      }
      if (s.joyDaily) d.joy = clamp(d.joy + s.joyDaily, 0, 100);
    });
    // savings bonus interest every 5 days
    if (day > 1 && (day - 1) % 5 === 0 && d.savings > 0) {
      const i = Math.round(d.savings * 0.02);
      if (i > 0) { d.savings += i; d.stats.interest += i; this.record(i, 'interest', 'Savings bonus interest', 'income'); out.push('Savings bonus interest: +' + money(i)); d.inbox.push({ from: 'MoneyWise Bank', text: money(i) + ' interest added to your savings. We never ask for your OTP or PIN.', scam: 0, ex: 'A genuine message.', day: day }); }
    }
    if (d.busPassUntil && d.busPassUntil === day) out.push('Your bus pass expires at the end of today.');
    return out;
  },

  save() {
    if (!this.d) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); } catch (e) { /* storage may be blocked */ }
  },
  load() {
    try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; const d = JSON.parse(s); if (!d || d.v !== 1 || d.ended) return false; this.d = d; return true; } catch (e) { return false; }
  },
  hasSave() {
    try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; const d = JSON.parse(s); return d && !d.ended ? d : null; } catch (e) { return null; }
  },
  clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
};
