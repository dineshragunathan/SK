'use strict';
/* ==========================================================
   panels.js : every menu, shop, mission and report screen
   ========================================================== */

function npcById(id) { return NPCS.filter((n) => n.id === id)[0]; }
function npcPortrait(n) { return n && n.look ? ART.portrait('npc_' + n.id, n.look) : null; }
function daysLeft() { return Math.max(1, TOTAL_DAYS - S.day() + 1); }
function itemOwned(id) {
  const it = ITEMS[id];
  if (it.type === 'outfit') return S.d.outfits.indexOf(it.outfit) >= 0;
  if (it.type === 'gadget' || it.type === 'course') return S.has(id);
  if (it.type === 'sub') return S.d.subs.some((s) => s.name === it.name.replace(' (weekly)', ''));
  if (it.type === 'upgrade') return !!(S.d.vehicle && S.d.vehicle.neon);
  return false;
}

const Panels = {

  /* ================= Title and start ================= */
  title() {
    const save = S.hasSave();
    const p = UI.open({
      title: '', cls: 'title', closable: false,
      build: (b) => {
        b.appendChild(h('div', { class: 'logo' },
          h('img', { class: 'logo-kachi', src: ART.kachi() }),
          h('div', { class: 'logo-main' }, 'Shaka-Kachi'),
          h('div', { class: 'logo-sub' }, 'MoneyWise Mission')));
        b.appendChild(h('div', { class: 'tagline' }, 'A financial literacy platform adventure for Class 10. You have ₹12,000 and 30 days. Spend smart, save smarter!'));
        const col = h('div', { class: 'menu' });
        if (save) col.appendChild(UI.btn('Continue (Day ' + Math.floor(save.time) + ', ' + money(save.cash) + ' cash)', () => { p.close(); G.continueGame(); }, 'primary big'));
        col.appendChild(UI.btn('New Game', () => Panels.newGame(p), (save ? '' : 'primary ') + 'big'));
        col.appendChild(UI.btn('How to Play', () => Panels.help(), 'big'));
        col.appendChild(UI.btn('Full screen (best on 1366 x 768)', () => Panels.fullscreen(), 'big'));
        b.appendChild(col);
        b.appendChild(h('div', { class: 'credits' }, 'Keyboard only. Works offline. Original art and code. Arrow keys and Enter to choose.'));
      }
    });
    return p;
  },
  newGame(titlePanel) {
    UI.open({
      title: 'Start a New Month', cls: 'small',
      build: (b, p) => {
        b.appendChild(h('p', null, 'How long should the session be? Each in-game day passes in real time while you play (menus pause the clock).'));
        const opts = [['short', 'Short (about 20 minutes)'], ['standard', 'Standard (about 30 to 35 minutes)'], ['long', 'Long (about 45 minutes)']];
        opts.forEach(([k, l]) => b.appendChild(UI.btn(l, () => { p.close(); titlePanel.close(); S.clearSave(); G.newGame(k); }, k === 'standard' ? 'primary wide' : 'wide')));
      }
    });
  },
  intro() {
    const pages = [
      "Hi! I'm Kachi, your flying coin buddy. And you're Shaka, a Class 10 student with a big month ahead!",
      "You have ₹12,000 to last 30 days. You need food to stay healthy, a bit of fun to stay happy, and savings for the future.",
      "Explore the town: School, Bank, Food Market, Lifestyle Store, Fun Zone, Opportunity Centre, Education Centre and Transport Hub. Each has a money mission inside!",
      "Watch out for financial obstacles like Grabbit the impulse buy and Phishy the scam. Jump over them, or touch one to face it and earn coins if you choose wisely.",
      "Controls: Arrow keys or A/D to move. Space to jump. Up/Down on ladders and stairs. E to talk or shop. I for your bag (eat!), C for clothes, M for the map, P for your profile, Q for your phone. Your first mission is upstairs with Teacher Tara. Good luck!"
    ];
    let i = 0;
    const next = () => {
      if (i >= pages.length) { S.d.tutorial = false; UI.kachiTip('Walk LEFT to the bottom of the stairs, then hold \u2191 to climb up to Teacher Tara on the 1st floor.'); return; }
      const t = pages[i++];
      UI.kachiSay(t, [{ l: i < pages.length ? 'Next' : "Let's go!", cls: 'primary', act: next }], { title: 'Welcome to Shaka Town', closable: false });
    };
    next();
  },
  fullscreen() {
    try {
      const de = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) { const r = (de.requestFullscreen || de.webkitRequestFullscreen).call(de); if (r && r.catch) r.catch(() => UI.toast('Full screen is not available here. Try F11.')); }
      else { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    } catch (e) { UI.toast('Press F11 for full screen.'); }
  },
  help() {
    UI.open({
      title: 'How to Play', cls: 'wide', hotkey: 'h',
      build: (b) => {
        b.appendChild(h('div', { class: 'cols2' },
          h('div', null,
            h('h3', null, 'Controls'),
            h('table', { class: 'keys' }, [['← →  or  A D', 'Walk'], ['Space / Z / ↑', 'Jump'], ['↑ ↓  or  W S', 'Climb ladders, take stairs'], ['↓ then Space', 'Drop through wooden planks'], ['E or Enter', 'Talk, shop, use'], ['V', 'Ride or park your vehicle (on the street it is fetched to you)'], ['I or F', 'Bag (eat food)'], ['C', 'Change clothes'], ['M', 'Town map'], ['P', 'Financial profile'], ['Q', 'Phone: messages, subscriptions, banking'], ['H or Esc', 'Pause and help'], ['N', 'Sound on or off']].map(([k, v]) => h('tr', null, h('td', null, h('b', null, k)), h('td', null, v))))),
          h('div', null,
            h('h3', null, 'Your goal'),
            h('p', null, 'Make ₹12,000 last 30 days while keeping your Hunger, Health and Joy up. Complete the 9 money missions, collect MoneyWise coins and badges, and finish with savings.'),
            h('h3', null, 'Hunger, Health and Joy'),
            h('p', null, 'Hunger drops over time. Buy food and eat it from your bag. If Hunger stays very low, Health falls and you may faint (that costs money!). Joy comes from fun, new clothes and free things like benches, the library and the lookout.'),
            h('h3', null, 'Financial obstacles'),
            h('p', null, 'Creatures like Grabbit, Tagster and Phishy roam the town. Jump over them, or touch one to face its challenge. Wise choices earn coins. Budget Shields protect you from one bad choice.'),
            h('h3', null, 'Score'),
            h('p', null, 'At the end you get a MoneyWise Report Card scoring missions, savings, avoided losses, needs vs wants balance, wellbeing, coins and badges.'))));
      }
    });
  },
  pause() {
    UI.open({
      title: 'Paused', cls: 'small', hotkey: 'h',
      build: (b, p) => {
        b.appendChild(h('div', { class: 'objbox', html: UI.objective() }));
        b.appendChild(h('p', { class: 'muted' }, 'Session time: ' + Math.floor(S.d.sessionSec / 60) + ' min. Your progress saves automatically each day.'));
        b.appendChild(UI.btn('Resume', () => p.close(), 'primary wide'));
        b.appendChild(UI.btn('How to Play', () => Panels.help(), 'wide'));
        b.appendChild(UI.btn('Sound: ' + (SFX.on ? 'On' : 'Off'), () => { SFX.on = S.d.sound = !SFX.on; p.refresh(); }, 'wide'));
        b.appendChild(UI.btn('Full screen on/off', () => Panels.fullscreen(), 'wide'));
        b.appendChild(UI.btn('Report card so far', () => Panels.report(false), 'wide'));
        b.appendChild(UI.btn('Save and quit to title', () => { S.save(); UI.closeAll(); G.toTitle(); }, 'wide'));
      }
    });
  },

  /* ================= Shops ================= */
  shop(shopId, npc) {
    const sh = SHOPS[shopId];
    const others = {};
    for (const sid in SHOPS) if (sid !== shopId) SHOPS[sid].items.forEach(([id, pr]) => { (others[id] = others[id] || []).push(SHOPS[sid].title + ' ' + money(S.price(id, pr))); });
    UI.open({
      title: sh.title, cls: 'shop', icon: npcPortrait(npc),
      build: (b, p) => {
        const scope = S.has('pricescope');
        b.appendChild(h('div', { class: 'shopinfo' }, h('span', null, 'Cash: ', h('b', null, money(S.d.cash))), h('span', null, 'Bag: ' + S.bagCount() + '/' + S.bagCap()),
          scope ? h('span', { class: 'scope' }, 'PriceScope ON') : h('span', { class: 'muted' }, 'The PriceScope app reveals best value'),
          S.d.inflationUntil >= S.day() ? h('span', { class: 'warn' }, 'Food prices +15% (inflation)') : null));
        if (sh.note) b.appendChild(h('div', { class: 'note' }, sh.note));
        if (shopId === 'canteen' && S.d.cash < 50 && S.d.freeMealDay !== S.day()) {
          b.appendChild(UI.btn('Free midday meal (once a day when you are short of money)', () => { S.d.freeMealDay = S.day(); S.d.hunger = clamp(S.d.hunger + 45, 0, 100); SFX.play('eat'); UI.toast('A warm free meal. Hunger +45'); p.refresh(); }, 'primary wide'));
        }
        let bestId = null, bestV = 0;
        sh.items.forEach(([id, pr]) => { const it = ITEMS[id]; if (it.type === 'food' && it.hp >= 0) { const v = it.h / S.price(id, pr); if (v > bestV) { bestV = v; bestId = id; } } });
        const list = h('div', { class: 'list' });
        sh.items.forEach(([id, base]) => {
          const it = ITEMS[id], pr = S.price(id, base), owned = itemOwned(id);
          const eff = [];
          if (it.type === 'food') { eff.push('Hunger +' + it.h); if (it.hp) eff.push('Health ' + (it.hp > 0 ? '+' : '') + it.hp); if (it.joy) eff.push('Joy +' + it.joy); }
          if (it.type === 'fun') { eff.push('Joy +' + it.joy); if (it.h) eff.push('Hunger +' + it.h); }
          if (it.type === 'sub') eff.push(money(it.weekly) + ' every week (' + money(it.weekly * 52) + ' a year)');
          if (it.type === 'outfit' && it.joy) eff.push('Joy +' + it.joy + ' when bought');
          let extra = null;
          if (scope && it.type === 'food') extra = h('div', { class: 'scopeline' }, 'Value: ' + (it.h / pr * 10).toFixed(1) + ' hunger per ₹10' + (others[id] ? '  |  Also: ' + others[id].join(', ') : ''));
          if (sh.fake && sh.fake[id]) {
            const f = sh.fake[id];
            extra = h('div', { class: 'scopeline' }, h('s', null, 'Was ' + money(f[0])), ' NOW ' + money(pr) + '!!  ',
              scope ? (f[1] === 0 ? h('b', { class: 'bad' }, 'PriceScope: random junk, real value about ₹50') : f[1] < pr ? h('b', { class: 'bad' }, 'PriceScope: FAKE discount. Usual price elsewhere ' + money(f[1])) : h('b', { class: 'good' }, 'PriceScope: genuine deal (usual ' + money(f[1]) + '). Still a want!')) : h('span', { class: 'muted' }, '(Is that "was" price real?)'));
          }
          let action;
          if (owned) action = h('div', { class: 'btn small disabled' }, 'Owned');
          else if (it.type === 'upgrade' && !(S.d.vehicle && !S.d.vehicle.rented)) action = h('div', { class: 'btn small disabled' }, 'Needs a vehicle');
          else action = UI.btn('Buy', () => Panels.buy(id, pr, p), 'small' + (S.d.cash < pr ? ' poor' : ''));
          list.appendChild(h('div', { class: 'row' }, UI.itemIcon(id),
            h('div', { class: 'rinfo' }, h('div', { class: 'rname' }, it.name, ' ', UI.tagChip(it.tag), scope && id === bestId ? h('span', { class: 'best' }, 'BEST VALUE') : null),
              h('div', { class: 'rdesc' }, it.desc), eff.length ? h('div', { class: 'reff' }, eff.join('   ')) : null, extra),
            h('div', { class: 'rprice' }, money(pr)), action));
        });
        b.appendChild(list);
      }
    });
  },
  buy(id, price, panel) {
    const it = ITEMS[id];
    if (!S.canPay(price)) { SFX.play('error'); UI.toast('Not enough cash! Check your savings at the bank, or earn at the Opportunity Centre.', 'bad'); return; }
    if (it.type === 'food' && S.bagCount() >= S.bagCap()) { SFX.play('error'); UI.toast('Your bag is full (' + S.bagCap() + ' items). Eat something first!', 'bad'); return; }
    const go = () => { Panels.applyPurchase(id, price); if (panel) panel.refresh(); UI.updateHud(true); };
    if (price >= 1000 || (price >= 300 && price > S.d.cash * 0.2)) Panels.think(it, price, go); else go();
  },
  think(it, price, go) {
    const share = Math.round(price / Math.max(1, S.d.cash) * 100);
    const after = S.d.cash - price, perDay = Math.round(after / daysLeft());
    UI.say({
      title: 'Pause and Think', who: 'Kachi', portrait: ART.kachi(), cls: 'think',
      html: '<b>' + it.name + '</b> costs <b>' + money(price) + '</b>, that is <b>' + share + '%</b> of your cash.<br>' +
        (S.d.needsUnlocked ? 'It is a <b>' + (it.tag === 'need' ? 'NEED' : 'WANT') + '</b>.<br>' : 'Is it a need or a want?<br>') +
        'After buying, you would have ' + money(after) + ' cash for ' + daysLeft() + ' days, about <b>' + money(perDay) + ' a day</b>.<br><i>Will you still want it next week?</i>',
      buttons: [{ l: 'Not now', cls: 'primary', act: () => { UI.toast('Good thinking. Money kept!'); } }, { l: 'Buy it', act: go }]
    });
  },
  applyPurchase(id, price) {
    const it = ITEMS[id];
    const cat = it.cat || (it.type === 'food' ? 'food' : 'other');
    S.pay(price, cat, it.name, it.tag || 'want');
    SFX.play('buy');
    const d = S.d;
    switch (it.type) {
      case 'food': S.addBag(id); UI.toast(it.name + ' added to your bag. Press I to eat.'); UI.kachiTip('Press I (or F) any time to open your bag and eat.', 'eat'); break;
      case 'fun': d.joy = clamp(d.joy + it.joy, 0, 100); if (it.h) d.hunger = clamp(d.hunger + it.h, 0, 100); d.time += 0.04; UI.toast('You enjoyed ' + it.name + '! Joy +' + it.joy); break;
      case 'sub': d.subs.push({ name: it.name.replace(' (weekly)', ''), weekly: it.weekly, start: S.day(), joyDaily: it.joyDaily }); UI.toast('Subscribed to ' + it.name + '. First week paid.'); UI.kachiTip('Subscriptions renew every 7 days until YOU cancel. Manage them on your phone (Q).', 'sub'); break;
      case 'outfit':
        d.outfits.push(it.outfit); d.joy = clamp(d.joy + (it.joy || 0), 0, 100);
        UI.say({ title: 'New clothes!', text: 'You bought the ' + it.name + '. Wear it now?', portrait: ART.portrait('player_' + it.outfit, Object.assign({}, PLAYER_BASE, OUTFITS[it.outfit].look)), buttons: [{ l: 'Wear it', cls: 'primary', act: () => G.setOutfit(it.outfit) }, { l: 'Later' }] });
        break;
      case 'gadget': d.owned[id] = 1; if (it.joy) d.joy = clamp(d.joy + it.joy, 0, 100); UI.toast('You got the ' + it.name + '!'); if (it.joy && it.tag === 'want') UI.kachiTip('That new-thing happy feeling fades fast. Was it worth ' + money(price) + '?'); break;
      case 'mystery': {
        const r = Math.random();
        if (r < 0.7) { S.addBag('keychain'); UI.toast('Mystery Box: a glittery keychain. Worth about ₹30...', 'bad'); }
        else if (r < 0.95) { S.addBag('choco'); UI.toast('Mystery Box: a choco bar. Worth ₹60.', 'bad'); }
        else { d.owned.earbuds = 1; UI.toast('Mystery Box: earbuds! Lucky, but that is rare.'); }
        UI.kachiTip('Mystery boxes are designed so you usually get less than you paid. That is how they make money.');
        break;
      }
      case 'course':
        d.owned[id] = 1;
        if (id === 'workshop') { d.owned.pricescope = 1; S.addCoins(5, 'workshop'); UI.toast('Workshop done! You got the PriceScope app.'); }
        else if (id === 'examprep') S.addCoins(10, 'study');
        else if (id === 'coding') UI.toast('Coding Club joined! The Web Helper gig is unlocked.');
        else if (id === 'libcard') UI.toast('Library card ready. Talk to Leela to borrow books for free.');
        break;
      case 'upgrade': if (d.vehicle) { d.vehicle.neon = true; G.refreshVehicle(); d.joy = clamp(d.joy + 3, 0, 100); UI.toast('Neon lights fitted. Speed: exactly the same.'); } break;
      default: break;
    }
  },

  /* ================= Bag ================= */
  bag() {
    UI.open({
      title: 'Your Bag', cls: 'bag', hotkey: 'i',
      build: (b, p) => {
        const d = S.d;
        b.appendChild(h('div', { class: 'shopinfo' }, h('span', null, 'Hunger ', h('b', null, Math.round(d.hunger))), h('span', null, 'Health ', h('b', null, Math.round(d.health))), h('span', null, 'Joy ', h('b', null, Math.round(d.joy))), h('span', null, 'Items ' + S.bagCount() + '/' + S.bagCap())));
        const list = h('div', { class: 'grid' });
        const ids = Object.keys(d.bag).filter((k) => d.bag[k] > 0);
        if (!ids.length) list.appendChild(h('p', { class: 'muted' }, 'Your bag is empty. Buy food at the School Canteen or the Food Market.'));
        ids.forEach((id) => {
          const it = ITEMS[id];
          const eff = it.type === 'food' ? ('Hunger +' + it.h + (it.hp ? '  Health ' + (it.hp > 0 ? '+' : '') + it.hp : '') + (it.joy ? '  Joy +' + it.joy : '')) : 'Not much use...';
          list.appendChild(h('div', { class: 'card' }, UI.itemIcon(id), h('div', { class: 'cname' }, it.name + '  x' + d.bag[id]), h('div', { class: 'reff' }, eff),
            it.type === 'food' ? UI.btn('Eat', () => { Panels.eat(id); p.refresh(); }, 'small primary') : null));
        });
        b.appendChild(list);
        const g = Object.keys(d.owned).filter((k) => d.owned[k] && ITEMS[k]);
        if (g.length) {
          b.appendChild(h('h3', null, 'Things you own'));
          b.appendChild(h('div', { class: 'owned' }, g.map((id) => h('div', { class: 'ochip', title: ITEMS[id].desc }, UI.itemIcon(id), ITEMS[id].name))));
        }
      }
    });
  },
  eat(id) {
    const it = ITEMS[id], d = S.d;
    if (d.hunger >= 97) { UI.toast('You are full! Save it for later.'); return; }
    d.bag[id]--; if (d.bag[id] <= 0) delete d.bag[id];
    d.hunger = clamp(d.hunger + it.h, 0, 100);
    d.health = clamp(d.health + (it.hp || 0), 0, 100);
    d.joy = clamp(d.joy + (it.joy || 0), 0, 100);
    SFX.play('eat'); G.playerEat();
    UI.toast('Ate ' + it.name + '. Hunger +' + it.h + (it.hp < 0 ? '. Junk food lowers health!' : ''));
    if (it.hp < 0) UI.kachiTip('Junk food is a want. It fills you less and lowers health. Cheap healthy food is better value!', 'junk');
    UI.updateHud(true);
  },

  /* ================= Wardrobe ================= */
  wardrobe() {
    UI.open({
      title: 'Wardrobe', cls: 'wardrobe', hotkey: 'c',
      build: (b, p) => {
        b.appendChild(h('p', { class: 'muted' }, 'Change your look any time. New clothes are sold at the Lifestyle Store (ground floor). The Cape is at Kachi\'s Coin Kiosk.'));
        const g = h('div', { class: 'grid' });
        Object.keys(OUTFITS).forEach((oid) => {
          const O = OUTFITS[oid], own = S.d.outfits.indexOf(oid) >= 0, wearing = S.d.outfit === oid;
          const priceInfo = SHOPS.clothes.items.filter((x) => ITEMS[x[0]].outfit === oid)[0];
          g.appendChild(h('div', { class: 'card outfit' + (wearing ? ' wearing' : '') + (own ? '' : ' locked') },
            h('img', { class: 'bigport', src: ART.portrait('player_' + oid, Object.assign({}, PLAYER_BASE, O.look)) }),
            h('div', { class: 'cname' }, O.name),
            wearing ? h('div', { class: 'btn small disabled' }, 'Wearing') : own ? UI.btn('Wear', () => { G.setOutfit(oid); p.refresh(); }, 'small primary') :
              h('div', { class: 'muted small' }, oid === 'cape' ? '40 coins at the Coin Kiosk' : priceInfo ? money(priceInfo[1]) + ' at Lifestyle Store' : '')));
        });
        b.appendChild(g);
      }
    });
  },

  /* ================= Map ================= */
  map() {
    UI.open({
      title: 'Town Map', cls: 'map', hotkey: 'm',
      build: (b) => {
        const SC = 3;
        const [cv, x] = mkCanvas(MAP_W * SC, MAP_H * SC);
        fr(x, 0, 0, cv.width, cv.height, '#bfe9ff');
        for (let r = 0; r < MAP_H; r++) for (let c = 0; c < MAP_W; c++) {
          const t = World.tile(c, r); if (t === TT.E) continue;
          const bd = World.buildingAtCol(c);
          let col = '#a87545';
          if (t === TT.G && r === GY && World.tile(c, r - 1) !== TT.B) col = c >= 342 ? '#5fbf3f' : '#9a96aa';
          if (t === TT.B) col = '#5fbf3f';
          if (t === TT.W || t === TT.R) col = bd ? bd.trim : '#777';
          if (t === TT.S) col = bd ? shade(bd.wall, -0.1) : '#999';
          if (t === TT.P) col = '#c98a4a';
          if (t === TT.L) col = '#ffd23f';
          if (t === TT.SR || t === TT.SL) col = '#ffffff';
          fr(x, c * SC, r * SC, SC, SC, col);
        }
        BUILDINGS.forEach((bd) => { x.globalAlpha = 0.25; fr(x, (bd.x + 1) * SC, (bd.roofRow + 1) * SC, (bd.w - 2) * SC, (GY - bd.roofRow - 1) * SC, bd.wall); x.globalAlpha = 1; });
        // markers
        const mark = (px, py, col, s) => { fr(x, px - s - 1, py - s - 1, s * 2 + 2, s * 2 + 2, OUTLINE); fr(x, px - s, py - s, s * 2, s * 2, col); };
        BUS_STOPS.forEach((s) => mark(s.c * SC + 1, (GY - 2) * SC, '#3a86ff', 3));
        MISSION_ORDER.forEach((m) => { const n = npcById(MISSIONS[m].npc); mark(n.c * SC + 1, (n.row - 1) * SC, S.missionDone(m) ? '#27c26c' : '#ffd23f', 3); });
        if (S.d.vehicle && !S.d.vehicle.riding) mark(S.d.vehicle.x / T * SC, (S.d.vehicle.y / T - 1) * SC, '#2ec4b6', 3);
        const pl = G.player;
        if (pl) mark((pl.x + pl.w / 2) / T * SC, (pl.y + 6) / T * SC, '#e8423a', 4);
        const wrap = h('div', { class: 'mapwrap' }, cv);
        BUILDINGS.forEach((bd) => wrap.appendChild(h('div', { class: 'maplabel', style: 'left:' + ((bd.x + bd.w / 2) * SC) + 'px;top:' + ((bd.roofRow - 3) * SC) + 'px' }, bd.name)));
        wrap.appendChild(h('div', { class: 'maplabel park', style: 'left:' + (362 * SC) + 'px;top:' + (24 * SC) + 'px' }, 'Park and Lookout'));
        wrap.appendChild(h('div', { class: 'maplabel ug', style: 'left:' + (128 * SC) + 'px;top:' + (46 * SC) + 'px' }, 'Underground: Discount Den'));
        b.appendChild(wrap);
        b.appendChild(h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#e8423a' }), 'You'), h('span', null, h('i', { style: 'background:#ffd23f' }), 'Mission to do'), h('span', null, h('i', { style: 'background:#27c26c' }), 'Mission done'), h('span', null, h('i', { style: 'background:#3a86ff' }), 'Bus stop'), h('span', null, h('i', { style: 'background:#2ec4b6' }), 'Your parked vehicle'), h('span', null, h('i', { style: 'background:#ffd23f;border-radius:0' }), 'Ladder')));
        const cards = h('div', { class: 'bcards' });
        BUILDINGS.forEach((bd) => {
          const ms = MISSION_ORDER.filter((m) => { const n = npcById(MISSIONS[m].npc); return n.c >= bd.x && n.c < bd.x + bd.w; });
          const inside = NPCS.filter((n) => n.c >= bd.x && n.c < bd.x + bd.w && n.row > bd.roofRow && n.look).map((n) => n.name.split('(')[0].trim());
          cards.appendChild(h('div', { class: 'bcard', style: 'border-color:' + bd.trim },
            h('b', { style: 'color:' + bd.trim }, bd.name), h('div', { class: 'small' }, bd.floors + ' floors. ' + inside.join(', ')),
            ms.map((m) => h('div', { class: 'small ' + (S.missionDone(m) ? 'good' : 'bad') }, (S.missionDone(m) ? 'Done: ' : 'Mission: ') + MISSIONS[m].name))));
        });
        b.appendChild(cards);
      }
    });
  },

  /* ================= Profile ================= */
  profile(tab) {
    tab = tab || 0;
    UI.open({
      title: 'Financial Profile', cls: 'profile', hotkey: 'p',
      build: (b, p) => {
        const d = S.d;
        b.appendChild(UI.tabs(['Overview', 'Spending', 'Missions', 'Badges'], tab, (i) => { tab = i; p.refresh(); }));
        const body = h('div', { class: 'tabbody' }); b.appendChild(body);
        const sc = S.score(), gr = S.grade(sc.total);
        if (tab === 0) {
          const v = d.vehicle && !d.vehicle.rented ? S.vehicleValue() : 0;
          body.appendChild(h('div', { class: 'cols2' },
            h('div', null,
              h('table', { class: 'money-table' },
                [['Cash in hand', d.cash], ['Savings account', d.savings], ['Emergency fund', d.emergency], ['Goal fund' + (d.goalName ? ' (' + d.goalName + ')' : ''), d.goal], ['Vehicle resale value', v]].map(([k, val]) => h('tr', null, h('td', null, k), h('td', null, money(val)))),
                h('tr', { class: 'total' }, h('td', null, 'Total worth'), h('td', null, money(S.wealth() + v)))),
              h('p', { class: 'muted' }, 'Started with ' + money(START_CASH) + '. Earned ' + money(d.stats.earned) + ' from gigs and gifts, ' + money(d.stats.interest) + ' interest.'),
              h('div', { class: 'statgrid' },
                h('div', null, h('b', null, d.stats.resisted), 'obstacles outsmarted'), h('div', null, h('b', null, d.stats.lost), 'obstacles lost to'),
                h('div', null, h('b', null, d.stats.msgRight), 'messages judged right'), h('div', null, h('b', null, d.stats.gigs), 'gigs done'),
                h('div', null, h('b', null, d.coinsEarned), 'coins earned'), h('div', null, h('b', null, d.subs.length), 'active subscriptions'))),
            h('div', null,
              h('div', { class: 'scorebox' }, h('div', { class: 'grade g' + gr[0] }, gr[0]), h('div', null, h('div', { class: 'big' }, sc.total + ' / 1000'), h('div', null, 'MoneyWise Score: ' + gr[1]))),
              Object.keys(sc.parts).map((k) => { const [a, m] = sc.parts[k]; return h('div', { class: 'pbar' }, h('span', null, k), h('div', { class: 'pt' }, h('div', { class: 'pf', style: 'width:' + Math.round(a / m * 100) + '%' })), h('span', null, a + '/' + m)); }))));
        } else if (tab === 1) {
          const sp = S.spentBy(), nw = sp.needs + sp.wants;
          body.appendChild(h('h3', null, 'Needs vs Wants'));
          body.appendChild(h('div', { class: 'split' }, h('div', { class: 'need', style: 'width:' + (nw ? Math.round(sp.needs / nw * 100) : 50) + '%' }, 'Needs ' + money(sp.needs)), h('div', { class: 'want', style: 'width:' + (nw ? Math.round(sp.wants / nw * 100) : 50) + '%' }, 'Wants ' + money(sp.wants))));
          body.appendChild(h('p', { class: 'muted' }, nw ? 'Wants are ' + pct(sp.wants, nw) + '% of your spending. Aim for 40% or less.' : 'No spending yet.'));
          if (sp.losses) body.appendChild(h('p', { class: 'bad' }, 'Lost to scams and traps: ' + money(sp.losses)));
          const cats = Object.keys(sp.cats).sort((a, c) => sp.cats[c] - sp.cats[a]);
          const mx = cats.length ? sp.cats[cats[0]] : 1;
          body.appendChild(h('h3', null, 'Spending by category'));
          cats.forEach((c) => body.appendChild(h('div', { class: 'pbar' }, h('span', null, c.charAt(0).toUpperCase() + c.slice(1)), h('div', { class: 'pt' }, h('div', { class: 'pf cat', style: 'width:' + Math.round(sp.cats[c] / mx * 100) + '%' })), h('span', null, money(sp.cats[c])))));
          body.appendChild(h('h3', null, 'Recent transactions'));
          const recent = d.log.slice(-10).reverse();
          body.appendChild(h('table', { class: 'tx' }, recent.map((e) => h('tr', null, h('td', null, 'Day ' + e.d), h('td', null, e.label), h('td', { class: e.amt < 0 ? 'bad' : 'good' }, (e.amt > 0 ? '+' : '') + money(e.amt)), h('td', { class: 'muted' }, e.tag)))));
        } else if (tab === 2) {
          MISSION_ORDER.forEach((m, i) => {
            const M = MISSIONS[m], r = d.missions[m], n = npcById(M.npc);
            body.appendChild(h('div', { class: 'mrow' + (r ? ' done' : '') }, h('img', { class: 'icon', src: npcPortrait(n) }),
              h('div', { class: 'rinfo' }, h('b', null, (i + 1) + '. ' + M.name), h('div', { class: 'small' }, n.name + ', ' + M.where)),
              h('div', { class: 'stars' }, r ? '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) : 'To do')));
          });
        } else {
          const g = h('div', { class: 'grid badges' });
          Object.keys(BADGES).forEach((k) => { const B = BADGES[k], got = d.badges[k]; g.appendChild(h('div', { class: 'card badge' + (got ? '' : ' locked') }, h('img', { class: 'icon', src: ART.icon({ s: 'badge', c1: got ? B.c : '#999999', c2: got ? shade(B.c, -0.3) : '#666666' }) }), h('b', null, B.name), h('div', { class: 'small' }, B.desc))); });
          body.appendChild(g);
        }
      }
    });
  },

  /* ================= Phone ================= */
  phone(tab) {
    tab = tab || 0;
    let sel = null;
    UI.open({
      title: 'Phone', cls: 'phone', hotkey: 'q',
      build: (b, p) => {
        const d = S.d;
        b.appendChild(UI.tabs(['Messages', 'Subscriptions', 'Banking', 'PriceScope'], tab, (i) => { tab = i; sel = null; p.refresh(); }));
        const body = h('div', { class: 'tabbody' }); b.appendChild(body);
        if (tab === 0) {
          const msgs = d.inbox.slice().reverse();
          if (!msgs.length) body.appendChild(h('p', { class: 'muted' }, 'No messages yet.'));
          if (sel) {
            const m = sel;
            body.appendChild(h('div', { class: 'msgview' }, h('div', { class: 'from' }, 'From: ' + m.from), h('div', { class: 'mtext' }, m.text)));
            if (!m.done) {
              body.appendChild(h('div', { class: 'btnrow' },
                UI.btn('Report and delete (scam)', () => Panels.judgeMsg(m, true, p), 'primary', '1'),
                UI.btn('Looks safe, follow it', () => Panels.judgeMsg(m, false, p), '', '2'),
                UI.btn('Back', () => { sel = null; p.refresh(); }, '', '3')));
            } else {
              body.appendChild(h('div', { class: 'fb ' + (m.right ? 'good' : 'bad') }, (m.right ? 'Correct! ' : 'Oops. ') + m.ex));
              body.appendChild(UI.btn('Back', () => { sel = null; p.refresh(); }, 'primary'));
            }
          } else {
            msgs.forEach((m) => body.appendChild(h('div', { class: 'msg' + (m.done ? ' read' : ''), act: () => { sel = m; p.refresh(); } }, h('b', null, m.from), h('span', null, m.text.slice(0, 70) + (m.text.length > 70 ? '...' : '')), m.done ? h('em', null, m.right ? 'sorted' : 'oops') : h('em', { class: 'new' }, 'NEW'))));
          }
        } else if (tab === 1) {
          if (!d.subs.length) body.appendChild(h('p', { class: 'muted' }, 'No active subscriptions. Nice!'));
          d.subs.forEach((s) => body.appendChild(h('div', { class: 'row' }, UI.itemIcon('streammax'), h('div', { class: 'rinfo' }, h('b', null, s.name), h('div', { class: 'small' }, money(s.weekly) + ' every 7 days. That is ' + money(s.weekly * 52) + ' a year! Next charge on Day ' + (s.start + 7 * (Math.floor((S.day() - s.start) / 7) + 1)) + '.')), UI.btn('Cancel', () => { d.subs.splice(d.subs.indexOf(s), 1); UI.toast(s.name + ' cancelled. Money saved!'); SFX.play('good'); p.refresh(); }, 'small primary'))));
          body.appendChild(h('p', { class: 'muted' }, 'Tip: check your subscriptions every week and cancel the ones you do not use.'));
        } else if (tab === 2) {
          if (!S.missionDone('saving')) body.appendChild(h('p', { class: 'muted' }, 'Mobile banking unlocks after Banker Bela\'s mission at the MoneyWise Bank.'));
          else Panels.bankBody(body, p, true);
        } else {
          if (!S.has('pricescope')) body.appendChild(h('p', { class: 'muted' }, 'Get the PriceScope app at Gadgets and Gear (Lifestyle Store 1F), the Budgeting Workshop, or by finishing Stylist Sana\'s mission.'));
          else {
            const rows = [];
            for (const sid in SHOPS) SHOPS[sid].items.forEach(([id, pr]) => { const it = ITEMS[id]; if (it.type === 'food') rows.push([it.name, SHOPS[sid].title, S.price(id, pr), it.h / S.price(id, pr) * 10, it.hp]); });
            rows.sort((a, c) => c[3] - a[3]);
            body.appendChild(h('p', { class: 'muted' }, 'All food in town, best value first (hunger per ₹10):'));
            body.appendChild(h('table', { class: 'tx' }, h('tr', null, ['Food', 'Where', 'Price', 'Value', 'Health'].map((x) => h('th', null, x))), rows.map((r) => h('tr', null, h('td', null, r[0]), h('td', null, r[1]), h('td', null, money(r[2])), h('td', null, r[3].toFixed(1)), h('td', { class: r[4] < 0 ? 'bad' : 'good' }, (r[4] > 0 ? '+' : '') + r[4])))));
          }
        }
      }
    });
  },
  judgeMsg(m, saidScam, p) {
    const d = S.d;
    m.done = true;
    if (m.scam) {
      if (saidScam) { m.right = true; d.stats.msgRight++; S.addCoins(2, 'scam spotted'); SFX.play('good'); }
      else {
        m.right = false; d.stats.msgWrong++; SFX.play('bad');
        if (d.shields > 0) { d.shields--; UI.toast('Your Budget Shield blocked the loss!'); }
        else { const lost = S.lose(m.loss || 500, 'scams', 'Scam: ' + m.from); d.stats.lost++; UI.toast('Scammed! You lost ' + money(lost), 'bad'); }
      }
    } else {
      if (!saidScam) { m.right = true; d.stats.msgRight++; S.addCoins(1, 'safe message'); SFX.play('good'); }
      else { m.right = false; d.stats.msgWrong++; UI.toast('That one was genuine. No harm done, but read carefully!'); }
    }
    S.checkBadges();
    p.refresh(); UI.updateHud(true);
  },

  /* ================= Bank ================= */
  bank(full) {
    UI.open({
      title: full ? 'MoneyWise Bank' : 'ATM', cls: 'bank', icon: full ? npcPortrait(npcById('bela')) : null,
      build: (b, p) => Panels.bankBody(b, p, full)
    });
  },
  bankBody(b, p, full) {
    const d = S.d;
    const accts = [['savings', 'Savings (2% bonus every 5 days)']];
    if (full) { if (S.missionDone('emergency') || d.emergency > 0) accts.push(['emergency', 'Emergency fund']); if (d.goalName) accts.push(['goal', 'Goal fund: ' + d.goalName + ' (target ' + money(d.goalTarget) + ')']); }
    b.appendChild(h('table', { class: 'money-table' }, h('tr', null, h('td', null, 'Cash in hand'), h('td', null, money(d.cash))), accts.map(([k, l]) => h('tr', null, h('td', null, l), h('td', null, money(d[k]))))));
    if (full && !S.missionDone('emergency')) b.appendChild(h('p', { class: 'muted' }, 'Mr Iyer upstairs (1F) can help you set up an emergency fund.'));
    accts.forEach(([k, l]) => {
      let amt = 0;
      const pick = UI.amountPicker({ max: Math.max(d.cash, d[k]), value: 0, onChange: (v) => { amt = v; } });
      b.appendChild(h('div', { class: 'acct' }, h('b', null, l.split(' (')[0]), pick,
        UI.btn('Deposit', () => { if (amt <= 0 || amt > d.cash) { SFX.play('error'); UI.toast('Choose an amount up to your cash.', 'bad'); return; } S.move('cash', k, amt); SFX.play('buy'); UI.toast(money(amt) + ' moved to ' + l.split(' (')[0] + '.'); p.refresh(); UI.updateHud(true); }, 'small primary'),
        UI.btn('Withdraw', () => {
          if (amt <= 0 || amt > d[k]) { SFX.play('error'); UI.toast('Not that much in this account.', 'bad'); return; }
          const doIt = () => { S.move(k, 'cash', amt); UI.toast(money(amt) + ' withdrawn to cash.'); p.refresh(); UI.updateHud(true); };
          if (k === 'emergency') UI.say({ title: 'Emergency check', who: 'Kachi', portrait: ART.kachi(), text: 'Is this a real emergency? (Health, safety, essential repairs.) If not, leave this money where it is!', buttons: [{ l: 'Yes, it is an emergency', act: doIt }, { l: 'No, keep it safe', cls: 'primary' }] });
          else if (k === 'goal') UI.say({ title: 'Goal check', who: 'Kachi', portrait: ART.kachi(), text: 'Taking money from your goal fund pushes your dream further away. Sure?', buttons: [{ l: 'Withdraw anyway', act: doIt }, { l: 'Keep saving', cls: 'primary' }] });
          else doIt();
        }, 'small')));
    });
  },

  /* ================= Transport ================= */
  busStop(stopId) {
    const d = S.d;
    UI.open({
      title: 'Bus Stop ' + stopId, cls: 'small',
      build: (b, p) => {
        const pass = d.busPassUntil >= S.day();
        b.appendChild(h('p', null, pass ? 'Your bus pass is valid until the end of Day ' + d.busPassUntil + '. Rides are free.' : 'Single ticket: ' + money(BUS_FARE) + ' per ride. A 10-day pass costs ' + money(BUS_PASS) + ' at the Transport Hub bus counter.'));
        BUS_STOPS.forEach((s) => {
          if (s.id === stopId) return;
          b.appendChild(UI.btn('Ride to ' + s.name + (pass ? ' (pass)' : ' (' + money(BUS_FARE) + ')'), () => {
            if (!pass && !S.pay(BUS_FARE, 'transport', 'Bus ticket', 'need')) { SFX.play('error'); UI.toast('Not enough cash for a ticket.', 'bad'); return; }
            p.close(); G.busTravel(s);
          }, 'wide'));
        });
      }
    });
  },
  busCounter() {
    const d = S.d;
    UI.say({
      title: 'Bus Counter', who: 'Babu', portrait: npcPortrait(npcById('babu')),
      text: 'Buses run between Stop A (School), Stop B (Town Centre) and Stop C (here). A ticket is ' + money(BUS_FARE) + ' per ride. A 10-day pass is ' + money(BUS_PASS) + '. If you ride more than 12 times in 10 days, the pass saves money!' + (d.busPassUntil >= S.day() ? ' Your pass is valid until Day ' + d.busPassUntil + '.' : ''),
      buttons: [{ l: 'Buy 10-day pass (' + money(BUS_PASS) + ')', cls: 'primary', act: () => { if (!S.pay(BUS_PASS, 'transport', 'Bus pass (10 days)', 'need')) { SFX.play('error'); UI.toast('Not enough cash.', 'bad'); return; } d.busPassUntil = Math.max(d.busPassUntil, S.day() - 1) + BUS_PASS_DAYS; SFX.play('buy'); UI.toast('Bus pass valid until Day ' + d.busPassUntil); } }, { l: 'Not now' }]
    });
  },
  showroom() {
    const d = S.d;
    UI.open({
      title: 'Vehicle Showroom', cls: 'shop', icon: npcPortrait(npcById('vijay')),
      build: (b, p) => {
        b.appendChild(h('div', { class: 'shopinfo' }, h('span', null, 'Cash: ', h('b', null, money(d.cash))), h('span', { class: 'muted' }, 'Running costs are charged every morning.')));
        const v = d.vehicle;
        if (v) {
          const V = VEHICLES[v.type];
          b.appendChild(h('div', { class: 'note' }, v.rented ? 'You are renting a bicycle today. It goes back tonight.' : 'You own a ' + V.name + '. Running cost ' + money(V.daily) + ' a day.' + (v.due ? ' Unpaid service: ' + money(v.due) + ' (pay Mechanic Maya upstairs).' : '')));
          if (!v.rented) b.appendChild(UI.btn('Sell your ' + V.name + ' for ' + money(S.vehicleValue()) + ' (60% of the price)', () => {
            UI.say({ title: 'Sell?', text: 'Vehicles lose value the moment you buy them (depreciation). You paid ' + money(V.price) + ' and get back ' + money(S.vehicleValue()) + '. Sell?', buttons: [{ l: 'Sell', act: () => { S.earn(S.vehicleValue(), 'Sold ' + V.name, false); d.vehicle = null; G.refreshVehicle(); SFX.play('buy'); p.refresh(); } }, { l: 'Keep it', cls: 'primary' }] });
          }, 'wide'));
        }
        const list = h('div', { class: 'list' });
        Object.keys(VEHICLES).forEach((k) => {
          const V = VEHICLES[k];
          list.appendChild(h('div', { class: 'row' }, h('img', { class: 'icon', src: ART.icon(V.icon) }),
            h('div', { class: 'rinfo' }, h('div', { class: 'rname' }, V.name, ' ', UI.tagChip('want')), h('div', { class: 'rdesc' }, V.desc), h('div', { class: 'reff' }, 'Speed x' + V.speed + '   Running ' + money(V.daily) + '/day   30-day total ' + money(V.price + V.daily * 30))),
            h('div', { class: 'rprice' }, money(V.price)),
            v ? h('div', { class: 'btn small disabled' }, 'One at a time') : UI.btn('Buy', () => {
              if (!S.canPay(V.price)) { SFX.play('error'); UI.toast('Not enough cash.', 'bad'); return; }
              Panels.think({ name: V.name, tag: 'want' }, V.price, () => { S.pay(V.price, 'transport', 'Bought ' + V.name, 'want'); G.giveVehicle(k, false); SFX.play('buy'); p.refresh(); });
            }, 'small')));
        });
        list.appendChild(h('div', { class: 'row' }, h('img', { class: 'icon', src: ART.icon({ s: 'bike', c1: '#ffb703' }) }),
          h('div', { class: 'rinfo' }, h('div', { class: 'rname' }, 'Rent a bicycle for today'), h('div', { class: 'rdesc' }, 'No running costs. Returned automatically tonight. Great for a busy day of gigs.')),
          h('div', { class: 'rprice' }, money(RENT_BIKE)),
          v ? h('div', { class: 'btn small disabled' }, 'Have one') : UI.btn('Rent', () => { if (!S.pay(RENT_BIKE, 'transport', 'Bicycle rental', 'need')) { SFX.play('error'); UI.toast('Not enough cash.', 'bad'); return; } G.giveVehicle('bicycle', true); SFX.play('buy'); p.refresh(); }, 'small')));
        b.appendChild(list);
        if (!S.has('helmet')) b.appendChild(h('p', { class: 'warn' }, 'Bicycles and scooters need a helmet by law. Mechanic Maya (1F) sells them. Traffic checks happen!'));
      }
    });
  },
  garage() {
    const d = S.d, v = d.vehicle;
    if (v && v.due) {
      UI.say({ who: 'Mechanic Maya', portrait: npcPortrait(npcById('maya')), text: 'Your ' + VEHICLES[v.type].name + ' has ' + money(v.due) + ' of unpaid running costs, so it is running slow. Pay now?', buttons: [{ l: 'Pay ' + money(v.due), cls: 'primary', act: () => { if (!S.pay(v.due, 'transport', 'Vehicle service', 'need')) { SFX.play('error'); UI.toast('Not enough cash.', 'bad'); return; } v.due = 0; UI.toast('Serviced! Full speed again.'); Panels.shop('maya', npcById('maya')); } }, { l: 'Shop', act: () => Panels.shop('maya', npcById('maya')) }] });
    } else Panels.shop('maya', npcById('maya'));
  },

  /* ================= Coin kiosk ================= */
  kiosk() {
    const goods = [['shield', 6], ['hint', 3], ['capeItem', 40], ['joypass', 8]];
    UI.open({
      title: "Kachi's Coin Kiosk", cls: 'shop', icon: ART.kachi(),
      build: (b, p) => {
        const d = S.d;
        b.appendChild(h('div', { class: 'shopinfo' }, h('span', null, 'MoneyWise coins: ', h('b', null, d.coins)), h('span', null, 'Shields: ' + d.shields), h('span', null, 'Hints: ' + d.hints)));
        b.appendChild(h('div', { class: 'note' }, 'Coins are earned by learning: missions, wise choices, sorting messages and exploring. They can never be bought with money.'));
        const list = h('div', { class: 'list' });
        goods.forEach(([id, cost]) => {
          const it = ITEMS[id];
          const owned = id === 'capeItem' && d.outfits.indexOf('cape') >= 0;
          list.appendChild(h('div', { class: 'row' }, UI.itemIcon(id), h('div', { class: 'rinfo' }, h('div', { class: 'rname' }, it.name), h('div', { class: 'rdesc' }, it.desc)), h('div', { class: 'rprice coins' }, cost + ' coins'),
            owned ? h('div', { class: 'btn small disabled' }, 'Owned') : UI.btn('Swap', () => {
              if (d.coins < cost) { SFX.play('error'); UI.toast('Not enough coins yet. Keep learning!', 'bad'); return; }
              d.coins -= cost; SFX.play('buy');
              if (id === 'shield') d.shields++;
              if (id === 'hint') d.hints++;
              if (id === 'capeItem') { d.outfits.push('cape'); G.setOutfit('cape'); }
              if (id === 'joypass') d.joy = clamp(d.joy + 25, 0, 100);
              UI.toast('Got: ' + it.name); p.refresh(); UI.updateHud(true);
            }, 'small')));
        });
        b.appendChild(list);
      }
    });
  },

  /* ================= Gigs ================= */
  gigs() {
    const d = S.d, g = d.gigActive;
    if (g && g.id === 'recycle' && g.got >= 5) {
      d.gigActive = null; S.earn(250, 'Recycling Run gig'); d.stats.gigs++; S.addCoins(3, 'gig'); SFX.play('good'); S.checkBadges();
      UI.say({ who: 'Ms Kavya', portrait: npcPortrait(npcById('kavya')), text: 'Brilliant, all 5 bottles! Here is ₹250. Earning money through effort feels good, right?' });
      return;
    }
    UI.open({
      title: 'Gigs Board', cls: 'shop', icon: npcPortrait(npcById('kavya')),
      build: (b, p) => {
        b.appendChild(h('div', { class: 'note' }, 'Earn money with small jobs. Each real gig can be done once a day. Remember: real jobs PAY you, they never ask you to pay.'));
        if (g) b.appendChild(h('p', { class: 'warn' }, 'You already have a gig running: ' + GIGS.filter((x) => x.id === g.id)[0].name));
        const list = h('div', { class: 'list' });
        GIGS.forEach((gg) => {
          const done = d.gigsToday[gg.id] || (gg.fake && d['fake_' + gg.id]);
          const locked = gg.needs && !S.has(gg.needs);
          list.appendChild(h('div', { class: 'row' + (gg.fake ? ' fakegig' : '') }, h('img', { class: 'icon', src: ART.icon({ s: gg.fake ? 'coin' : 'card', c1: gg.fake ? '#ff5a5a' : '#ffb347' }) }),
            h('div', { class: 'rinfo' }, h('div', { class: 'rname' }, gg.name), h('div', { class: 'rdesc' }, gg.desc)), h('div', { class: 'rprice' }, money(gg.pay)),
            done ? h('div', { class: 'btn small disabled' }, 'Done') : locked ? h('div', { class: 'btn small disabled' }, 'Locked') : g ? h('div', { class: 'btn small disabled' }, 'Busy') :
              UI.btn(gg.fake ? 'Apply' : 'Start', () => { p.close(); Panels.startGig(gg); }, 'small')));
        });
        b.appendChild(list);
      }
    });
  },
  startGig(gg) {
    const d = S.d;
    if (gg.fake) {
      d['fake_' + gg.id] = 1;
      UI.say({
        title: gg.name, who: 'Recruiter', text: 'Great choice! Just pay the ' + money(gg.fee) + ' registration fee and you start earning ' + money(gg.pay) + ' tomorrow!',
        buttons: [{ l: 'Pay ' + money(gg.fee), act: () => { const lost = S.lose(gg.fee, 'scams', 'Fake job fee'); d.stats.lost++; SFX.play('bad'); UI.kachiSay('Oh no. You lost ' + money(lost) + '. That "job" was a scam. Real employers never ask you to pay to work. Report job posts that ask for fees!'); } },
          { l: 'Wait... real jobs never ask for fees!', cls: 'primary', act: () => { S.addCoins(4, 'spotted a job scam'); d.stats.resisted++; SFX.play('good'); UI.kachiSay('Exactly! Paying to get a job is a classic scam. You kept your money safe.'); } }]
      });
      return;
    }
    d.gigsToday[gg.id] = 1;
    if (gg.id === 'tutor' || gg.id === 'web') {
      const qs = gg.id === 'tutor' ? Panels.mathQs() : [
        { t: 'quiz', q: 'A shop website gets 200 visitors a day and 5% buy something. How many buyers a day?', opts: ['5', '10', '40'], a: 1, ex: '5% of 200 = 10.' },
        { t: 'quiz', q: 'The shop wants customers to trust its site. What should it show?', opts: ['Fake countdown timers', 'Clear prices, real reviews and a contact number', 'Pop-ups everywhere'], a: 1, ex: 'Honesty builds trust and repeat customers.' }];
      Panels.runSteps({
        title: gg.name, who: gg.id === 'tutor' ? 'Junior Student' : 'Shop Owner', portrait: npcPortrait(npcById('kavya')), steps: qs,
        onDone: (stars, pc) => {
          const ok = pc >= 0.6;
          if (ok) { S.earn(gg.pay, gg.name + ' gig'); d.stats.gigs++; S.addCoins(3, 'gig'); S.checkBadges(); return ['Earned ' + money(gg.pay)]; }
          return ['Not quite enough correct to get paid this time. Try again tomorrow!'];
        }
      });
    } else if (gg.id === 'delivery') {
      d.gigActive = { id: 'delivery', t: 75 };
      UI.kachiSay('Take this parcel to Librarian Leela at the Education Centre, ground floor. You have 75 seconds. GO!', [{ l: 'Go!', cls: 'primary' }]);
    } else if (gg.id === 'recycle') {
      d.gigActive = { id: 'recycle', got: 0 };
      G.spawnBottles();
      UI.kachiSay('Five bottles are lying around town (look on the streets and rooftops). Collect them all and come back to Ms Kavya today.', [{ l: 'On it!', cls: 'primary' }]);
    }
  },
  mathQs() {
    const qs = [];
    const a = rint(3, 9) * 50, n = rint(3, 6);
    qs.push({ t: 'quiz', q: 'Notebooks cost ₹' + a + ' for a pack. How much for ' + n + ' packs?', opts: shuffle([a * n, a * n + 50, a * (n - 1)]).map((v) => '₹' + v), a: -1, ans: '₹' + (a * n), ex: a + ' x ' + n + ' = ' + (a * n) + '.' });
    const p = [10, 20, 25, 50][rint(0, 3)], base = rint(2, 9) * 100;
    qs.push({ t: 'quiz', q: 'A ₹' + base + ' bag has ' + p + '% off. What is the sale price?', opts: shuffle([base - base * p / 100, base - p, base * p / 100]).map((v) => '₹' + v), a: -1, ans: '₹' + (base - base * p / 100), ex: p + '% of ' + base + ' is ' + (base * p / 100) + ', so the price is ' + (base - base * p / 100) + '.' });
    const s = rint(2, 6) * 25, w = rint(4, 10);
    qs.push({ t: 'quiz', q: 'Saving ₹' + s + ' a week for ' + w + ' weeks gives...', opts: shuffle([s * w, s + w, s * w + s]).map((v) => '₹' + v), a: -1, ans: '₹' + (s * w), ex: s + ' x ' + w + ' = ' + (s * w) + '.' });
    qs.forEach((q) => { q.a = q.opts.indexOf(q.ans); });
    return qs;
  },

  /* ================= People and places ================= */
  library() {
    const d = S.d;
    if (d.gigActive && d.gigActive.id === 'delivery') {
      d.gigActive = null; UI.setTimer(null); S.earn(300, 'Delivery Dash gig'); d.stats.gigs++; S.addCoins(3, 'gig'); SFX.play('good'); S.checkBadges();
      UI.say({ who: 'Librarian Leela', portrait: npcPortrait(npcById('leela')), text: 'My parcel, right on time! Here is your ₹300. Thank you!' });
      return;
    }
    const can = S.has('libcard') && d.libDay !== S.day();
    UI.say({
      who: 'Librarian Leela', portrait: npcPortrait(npcById('leela')),
      text: S.has('libcard') ? 'Welcome back! Borrowing books is FREE fun. One visit a day.' : 'A library card costs just ₹50 and lets you borrow books for free, every day. That is the cheapest fun in town!',
      buttons: S.has('libcard') ? [{ l: can ? 'Borrow a book (+8 Joy, free)' : 'Already borrowed today', disabled: !can, cls: 'primary', act: () => { if (!can) return; d.libDay = S.day(); d.joy = clamp(d.joy + 8, 0, 100); SFX.play('good'); UI.toast('A great story! Joy +8 for ₹0.'); } }, { l: 'Bye' }]
        : [{ l: 'Get a library card (₹50)', cls: 'primary', act: () => { if (!S.pay(50, 'education', 'Library card', 'need')) { SFX.play('error'); UI.toast('Not enough cash.', 'bad'); return; } d.owned.libcard = 1; SFX.play('buy'); UI.toast('Library card ready!'); } }, { l: 'Maybe later' }]
    });
  },
  nurse() {
    const d = S.d, can = d.nurseDay !== S.day();
    UI.say({
      who: 'School Nurse Nila', portrait: npcPortrait(npcById('nila')),
      text: 'Health is a need, not a want! Eat proper meals, not just snacks. ' + (can ? 'I can give you a free check-up today.' : 'You have had your check-up today. Eat well!'),
      buttons: [{ l: can ? 'Free check-up (+20 Health)' : 'OK', cls: 'primary', act: () => { if (!can) return; d.nurseDay = S.day(); d.health = clamp(d.health + 20, 0, 100); SFX.play('good'); UI.toast('Health +20'); } }]
    });
  },
  principal() {
    const canEnd = S.day() >= 15;
    UI.say({
      who: 'Principal Meera', portrait: npcPortrait(npcById('meera')),
      text: 'Hello Shaka! The month runs until Day ' + TOTAL_DAYS + '. ' + (canEnd ? 'If you have done all you want to, you can hand in your Report Card early.' : 'Come back after Day 15 if you want to finish early.') + ' Remember: missions are spread across every building in town.',
      buttons: [{ l: 'See my report so far', act: () => Panels.report(false) }, { l: 'Finish the month now', disabled: !canEnd, act: () => { if (canEnd) UI.say({ title: 'Finish now?', text: 'This ends your month and shows your final Report Card.', buttons: [{ l: 'Yes, finish', act: () => G.endGame() }, { l: 'Keep playing', cls: 'primary' }] }); } }, { l: 'Bye', cls: 'primary' }]
    });
  },
  board() {
    const d = S.d;
    const lines = ['SCHOOL TRIP to the science museum: ₹400, coming up this month. Plan ahead!', 'Exam timetable is out. Study hard!', 'Free check-ups with Nurse Nila, 2nd floor.', 'Hungry and short of money? The canteen offers a free midday meal.'];
    const diaryOpen = S.day() >= 6 && !d.sides.diary;
    UI.open({
      title: 'Notice Board', cls: 'small',
      build: (b, p) => {
        lines.forEach((l) => b.appendChild(h('div', { class: 'notice' }, l)));
        if (diaryOpen) b.appendChild(UI.btn('Side quest: Budget Diary', () => { p.close(); Panels.diary(); }, 'primary wide'));
        else if (!d.sides.diary) b.appendChild(h('p', { class: 'muted' }, 'The Budget Diary side quest opens on Day 6, once you have some spending to look back on.'));
      }
    });
  },
  diary() {
    const sp = S.spentBy(), nw = sp.needs + sp.wants, share = nw ? sp.wants / nw : 0;
    const steps = [
      { t: 'say', text: 'Time to look back! So far you spent ' + money(sp.needs) + ' on needs and ' + money(sp.wants) + ' on wants. Wants are ' + Math.round(share * 100) + '% of your spending.' },
      { t: 'quiz', q: 'Looking at your diary, what is the most useful next step?', opts: ['Ignore it, it is in the past', 'Spot patterns and set a weekly limit for wants', 'Spend faster before prices rise'], a: 1, ex: 'Tracking spending shows patterns. A limit turns a pattern into a plan.' }
    ];
    Panels.runSteps({
      title: 'Budget Diary', who: 'Notice Board', portrait: ART.kachi(), steps: steps,
      onDone: () => { S.d.sides.diary = 1; const out = []; S.addCoins(6, 'diary'); out.push('+6 coins'); if (share <= 0.4) { S.addCoins(6, 'balanced spending'); out.push('+6 bonus coins for keeping wants at 40% or less!'); } return out; }
    });
  },
  bench(n) {
    const d = S.d;
    if (d.benchT > S.d.time) { UI.toast('You rested here a moment ago.'); return; }
    d.benchT = S.d.time + 0.25; d.joy = clamp(d.joy + 5, 0, 100); d.health = clamp(d.health + 2, 0, 100); d.time += 0.03;
    SFX.play('good'); UI.toast('You sit and watch the town go by. Joy +5 (free!)');
  },
  telescope(n) {
    const d = S.d, key = n.id === 'hilltop' ? 'hillDay' : 'scopeDay';
    if (d[key] === S.day()) { UI.toast('Beautiful view. Come back tomorrow.'); return; }
    d[key] = S.day(); d.joy = clamp(d.joy + 7, 0, 100); SFX.play('good');
    UI.kachiSay('From up here the whole town looks small. Big goals look closer when you can see the path. Joy +7, for free!');
  },
  side(n) {
    const d = S.d, key = n.side;
    if (key === 'wallet') return Panels.asha();
    if (d.sides[key]) { UI.say({ who: n.name, portrait: npcPortrait(n), text: pick(TIPS) }); return; }
    const sd = SIDES[key];
    Panels.runSteps({
      title: sd.title, who: n.name, portrait: npcPortrait(n), steps: sd.steps,
      onDone: (stars) => { d.sides[key] = stars; const out = []; S.addCoins(sd.coins, sd.title); out.push('+' + sd.coins + ' coins'); if (sd.item) { S.addBag(sd.item); out.push(ITEMS[sd.item].name + ' added to your bag'); } return out; }
    });
  },
  asha() {
    const d = S.d, n = npcById('asha');
    if (d.wallet === 1) {
      d.wallet = 2; S.earn(150, 'Reward from Mrs Asha'); S.addCoins(8, 'honesty'); d.joy = clamp(d.joy + 10, 0, 100); S.award('honest'); SFX.play('good');
      UI.say({ who: n.name, portrait: npcPortrait(n), text: 'My wallet! It has my bus pass and my grocery money for the week. Thank you so much, here is ₹150 as a thank you.' });
    } else UI.say({ who: n.name, portrait: npcPortrait(n), text: d.wallet >= 2 ? 'Thank you again, dear!' : 'I lost my wallet somewhere up high, on the bridge between two tall buildings. If only someone could find it...' });
  },
  wallet() {
    const d = S.d;
    UI.say({
      title: 'A Lost Wallet', who: 'Kachi', portrait: ART.kachi(), text: 'You found a wallet with ₹500 and an ID card: Mrs Asha. What will you do?',
      buttons: [{ l: 'Return it to Mrs Asha', cls: 'primary', act: () => { d.wallet = 1; UI.toast('Find Mrs Asha near the Fun Zone.'); } },
        { l: 'Keep the money', act: () => { d.wallet = 3; d.kept = 1; S.earn(500, 'Kept a lost wallet', false); d.joy = clamp(d.joy - 20, 0, 100); UI.kachiSay('You kept it... Mrs Asha needed that for groceries. Money taken from others never feels good. Joy -20.'); } }]
    });
  },

  /* ================= Obstacles, events, fainting ================= */
  encounter(type, onEnd) {
    const O = OBSTACLES[type], sc = pick(ENCOUNTERS[type]), opts = shuffle(sc.opts);
    let answered = false;
    UI.open({
      title: O.label + ': ' + O.name, cls: 'encounter', closable: false,
      build: (b, p) => {
        b.appendChild(h('div', { class: 'enc-top' }, h('img', { class: 'creature', src: ART.creature(type) }), h('div', { class: 'bubble' }, '"' + O.line + '"')));
        b.appendChild(h('div', { class: 'scenario' }, sc.text));
        const area = h('div', { class: 'btnrow col' });
        opts.forEach((o, i) => area.appendChild(UI.btn(o.l, () => {
          if (answered) return; answered = true;
          area.innerHTML = '';
          const d = S.d; let msg;
          if (o.good) { d.stats.resisted++; S.addCoins(3, 'wise choice'); SFX.play('good'); msg = h('div', { class: 'fb good' }, h('b', null, 'Wise choice! ' + O.name + ' fizzles away. '), sc.fb); }
          else {
            d.stats.lost++; SFX.play('bad');
            if (d.shields > 0) { d.shields--; msg = h('div', { class: 'fb bad' }, h('b', null, 'Your Budget Shield blocked the loss! '), sc.fb); }
            else {
              const parts = [];
              if (o.cost) { const l = S.lose(o.cost, 'losses', O.label + ': ' + O.name); parts.push('You spent ' + money(l) + '.'); }
              if (o.item) S.addBag(o.item);
              if (o.sub) { d.subs.push({ name: o.sub.name, weekly: o.sub.weekly, start: S.day() }); parts.push(o.sub.name + ' will charge ' + money(o.sub.weekly) + ' every week until you cancel it on your phone.'); }
              if (o.joy) d.joy = clamp(d.joy + o.joy, 0, 100);
              msg = h('div', { class: 'fb bad' }, h('b', null, O.name + ' got you. '), parts.join(' ') + ' ', sc.fb);
            }
          }
          area.appendChild(msg);
          area.appendChild(UI.btn('Continue', () => { p.close(); if (onEnd) onEnd(!!o.good); }, 'primary'));
          UI.focusFirst(); S.checkBadges(); UI.updateHud(true);
        }, '', String(i + 1))));
        b.appendChild(area);
      }
    });
  },
  event(ev) {
    const d = S.d;
    if (ev.rain) {
      const dry = d.outfit === 'rain' || (d.vehicle && d.vehicle.riding && d.vehicle.type === 'ev');
      if (!dry) d.health = clamp(d.health - 12, 0, 100);
      UI.say({ title: ev.title, who: 'Kachi', portrait: ART.kachi(), text: ev.text + (dry ? ' But you stayed dry! Useful purchases pay off.' : ' Health -12. A raincoat (Lifestyle Store) would protect you.') });
      return;
    }
    if (ev.helmetCheck) {
      if (!S.has('helmet')) { const l = S.lose(300, 'fees', 'Fine: no helmet'); UI.say({ title: ev.title, who: 'Traffic Officer', text: 'No helmet? That is a ' + money(l) + ' fine. Safety gear is a NEED for riders. Mechanic Maya sells helmets.' }); }
      else { S.addCoins(2, 'safe rider'); UI.say({ title: ev.title, who: 'Traffic Officer', text: 'Helmet on, well done! Safe and legal.' }); }
      return;
    }
    UI.open({
      title: ev.title, cls: 'event', closable: false,
      build: (b, p) => {
        b.appendChild(h('div', { class: 'say' }, h('img', { class: 'portrait', src: ART.kachi() }), h('div', { class: 'saytext' }, h('div', { class: 'txt' }, ev.text))));
        const area = h('div', { class: 'btnrow col' });
        const choices = ev.choices.slice();
        const opts = [];
        choices.forEach((c) => {
          opts.push({ c: c, fromEm: false });
          if (c.pay && ev.emergency && d.emergency >= c.pay) opts.push({ c: c, fromEm: true });
        });
        opts.forEach((o, i) => {
          const c = o.c;
          const poor = c.pay && !o.fromEm && d.cash < c.pay;
          const label = o.fromEm ? 'Pay ' + money(c.pay) + ' from your Emergency Fund' : c.l + (poor ? ' (not enough cash)' : '');
          area.appendChild(UI.btn(label, () => {
            if (poor) return;
            let fb = c.fb || '';
            if (c.pay) { if (o.fromEm) { d.emergency -= c.pay; S.record(-c.pay, c.cat, ev.title + ' (emergency fund)', 'need'); fb = 'Paid from your emergency fund. This is exactly what it is for! Refill it when you can.'; S.addCoins(2, 'emergency fund used well'); } else S.pay(c.pay, c.cat, ev.title, c.tag); }
            if (c.cash) S.earn(c.cash, ev.title, !!c.income);
            if (c.savings) { d.savings += c.savings; S.record(c.savings, 'income', ev.title + ' (to savings)', 'income'); d.stats.earned += c.savings; }
            if (c.joy) d.joy = clamp(d.joy + c.joy, 0, 100);
            if (c.hp) d.health = clamp(d.health + c.hp, 0, 100);
            if (c.coins) S.addCoins(c.coins, ev.title);
            if (c.inflation) d.inflationUntil = S.day() + c.inflation - 1;
            if (c.festival) { const j = d.outfit === 'kurta' ? 22 : 10; d.joy = clamp(d.joy + j, 0, 100); fb = d.outfit === 'kurta' ? 'You looked amazing in your Festive Kurta! Joy +22.' : 'What a celebration! Joy +10. (Wearing a Festive Kurta would add more.)'; }
            area.innerHTML = '';
            if (fb) area.appendChild(h('div', { class: 'fb' }, fb));
            area.appendChild(UI.btn('Continue', () => p.close(), 'primary'));
            UI.focusFirst(); UI.updateHud(true);
          }, poor ? 'disabled' : (o.fromEm ? 'primary' : ''), String(i + 1)));
        });
        b.appendChild(area);
      }
    });
  },
  faint() {
    const d = S.d;
    d.stats.fainted++;
    let cost = 500, from = 'cash';
    if (d.emergency >= cost) { d.emergency -= cost; from = 'emergency fund'; S.record(-cost, 'health', 'Medical care after fainting (emergency fund)', 'need'); }
    else { cost = Math.min(cost, d.cash); d.cash -= cost; S.record(-cost, 'health', 'Medical care after fainting', 'need'); }
    d.health = 60; d.hunger = Math.max(d.hunger, 55); d.time += 0.4;
    UI.say({ title: 'You fainted!', who: 'School Nurse Nila', portrait: npcPortrait(npcById('nila')), text: 'You collapsed from hunger and were brought to the school nurse. Treatment cost ' + money(cost) + ' (paid from your ' + from + ') and you lost half a day. Food is a NEED: always budget for it first!', closable: false, buttons: [{ l: 'I will eat properly', cls: 'primary' }] });
  },

  /* ================= Mission runner ================= */
  mission(id) {
    const M = MISSIONS[id], n = npcById(M.npc), done = S.missionDone(id);
    const start = () => Panels.runSteps({
      title: 'Mission: ' + M.name, who: n.name, portrait: npcPortrait(n), steps: M.steps, after: done ? null : M.after,
      onDone: (stars) => Panels.finishMission(id, stars)
    });
    if (done) UI.say({ who: n.name, portrait: npcPortrait(n), text: 'You have already completed "' + M.name + '" (' + '★'.repeat(S.d.missions[id].stars) + '). Want to practise again? (No new rewards, but you can improve your stars.)', buttons: [{ l: 'Practise again', act: start }, { l: 'Not now', cls: 'primary' }] });
    else start();
  },
  finishMission(id, stars) {
    const M = MISSIONS[id], d = S.d, out = [];
    const prev = d.missions[id];
    if (prev) { if (stars > prev.stars) { prev.stars = stars; out.push('New best: ' + stars + ' stars!'); } else out.push('Practice complete.'); return out; }
    d.missions[id] = { stars: stars, day: S.day() };
    S.addCoins(M.coins, 'mission'); out.push('+' + M.coins + ' MoneyWise coins');
    if (M.cash) { S.earn(M.cash, 'Class prize', true); out.push('+' + money(M.cash) + ' class prize'); }
    if (M.shields) { d.shields += M.shields; out.push('+' + M.shields + ' Budget Shield'); }
    S.award(M.badge); out.push('Badge: ' + BADGES[M.badge].name);
    if (id === 'needs') d.needsUnlocked = true;
    if (id === 'smart') d.owned.pricescope = 1;
    if (id === 'fun') d.joy = clamp(d.joy + 25, 0, 100);
    if (id === 'transport') d.owned.helmet = 1;
    if (S.missionsDone() === MISSION_ORDER.length) out.push('ALL 9 MISSIONS COMPLETE! You are a true MoneyWise hero.');
    S.save();
    return out;
  },
  runSteps(o) {
    let i = 0, score = 0, total = 0, hintFree = S.has('calculator') ? 1 : 0, cleanup = null;
    const steps = o.steps;
    const p = UI.open({
      title: o.title, cls: 'mission', closable: true,
      onKey: (k) => (p.stepKey ? p.stepKey(k) : false),
      onClose: () => { if (cleanup) cleanup(); },
      build: (b) => { render(b); }
    });
    function next() { if (cleanup) { cleanup(); cleanup = null; } p.stepKey = null; i++; p.body.innerHTML = ''; render(p.body); UI.focusFirst(); }
    function frame(b, content) {
      const dots = h('div', { class: 'dots' }, steps.map((s, k) => h('i', { class: k < i ? 'done' : k === i ? 'on' : '' })));
      b.appendChild(dots);
      b.appendChild(h('div', { class: 'mframe' }, h('div', { class: 'mleft' }, o.portrait ? h('img', { class: 'portrait big', src: o.portrait }) : null, h('div', { class: 'who' }, o.who || '')), h('div', { class: 'mright' }, content)));
    }
    function render(b) {
      if (i >= steps.length) return finish(b);
      const st = steps[i];
      const c = h('div', { class: 'step' });
      if (st.t === 'say') {
        c.appendChild(h('div', { class: 'speech' }, st.text));
        c.appendChild(UI.btn('Next', next, 'primary'));
      } else if (st.t === 'quiz') {
        total++;
        c.appendChild(h('div', { class: 'q' }, st.q));
        const opts = h('div', { class: 'opts' });
        const fbBox = h('div');
        const btns = st.opts.map((op, k) => UI.btn(op, () => {
          btns.forEach((x) => x.classList.add('disabled'));
          btns[st.a].classList.add('right');
          if (k === st.a) { score++; SFX.play('good'); fbBox.appendChild(h('div', { class: 'fb good' }, h('b', null, 'Correct! '), st.ex)); }
          else { btns[k].classList.add('wrong'); SFX.play('bad'); fbBox.appendChild(h('div', { class: 'fb bad' }, h('b', null, 'Not quite. '), st.ex)); }
          if (hintBtn) hintBtn.remove();
          fbBox.appendChild(UI.btn('Next', next, 'primary'));
          UI.focusFirst();
        }, 'opt', String(k + 1)));
        btns.forEach((x) => opts.appendChild(x));
        c.appendChild(opts);
        let hintBtn = null;
        if (st.opts.length > 2 && (hintFree > 0 || S.d.hints > 0)) {
          hintBtn = UI.btn('Use a hint (' + (hintFree > 0 ? 'free calculator hint' : S.d.hints + ' left') + ')', () => {
            if (hintFree > 0) hintFree--; else S.d.hints--;
            const wrong = st.opts.map((_, k) => k).filter((k) => k !== st.a && !btns[k].classList.contains('disabled'));
            if (wrong.length) btns[wrong[0]].classList.add('disabled');
            hintBtn.remove(); UI.focusFirst();
          }, 'small hint');
          c.appendChild(hintBtn);
        }
        c.appendChild(fbBox);
      } else if (st.t === 'sorter') {
        total++;
        const items = shuffle(st.items);
        let k = 0, right = 0, tl = st.time, over = false;
        const timer = h('div', { class: 'timer' }, h('div', { class: 'tfill' }));
        const card = h('div', { class: 'sortcard' });
        const res = h('div', { class: 'sortres' }, 'Correct: 0');
        const answer = (isNeed) => {
          if (over) return;
          const it = items[k];
          const ok = (it[1] === 1) === isNeed;
          if (ok) { right++; SFX.play('coin'); card.classList.add('ok'); } else { SFX.play('error'); card.classList.add('no'); }
          res.textContent = 'Correct: ' + right + ' / ' + (k + 1) + (ok ? '' : '   (' + it[0] + ' is a ' + (it[1] ? 'NEED' : 'WANT') + ')');
          k++;
          setTimeout(() => { card.classList.remove('ok', 'no'); show(); }, 160);
        };
        const show = () => { if (over) return; if (k >= items.length) return end(); card.textContent = items[k][0]; };
        const end = () => {
          if (over) return; over = true; clearInterval(iv);
          const frac = right / items.length; score += frac;
          card.textContent = 'Done! ' + right + ' of ' + items.length + ' correct.';
          btnRow.innerHTML = ''; btnRow.appendChild(UI.btn('Next', next, 'primary')); UI.focusFirst();
        };
        const btnRow = h('div', { class: 'btnrow' }, UI.btn('← NEED', () => answer(true), 'need big'), UI.btn('WANT →', () => answer(false), 'want big'));
        c.appendChild(h('div', { class: 'q' }, st.text)); c.appendChild(timer); c.appendChild(card); c.appendChild(btnRow); c.appendChild(res);
        const iv = setInterval(() => { tl -= 0.1; timer.firstChild.style.width = Math.max(0, tl / st.time * 100) + '%'; if (tl <= 0) end(); }, 100);
        cleanup = () => clearInterval(iv);
        p.stepKey = (key) => { if (over) return false; if (key === 'arrowleft' || key === 'a') { answer(true); return true; } if (key === 'arrowright' || key === 'd') { answer(false); return true; } return false; };
        show();
      } else if (st.t === 'deposit') {
        const d = S.d, acct = st.acct;
        const already = d[acct] >= st.min;
        const minNow = already ? 0 : Math.min(st.min, d.cash);
        let amt = Math.min(Math.max(st.rec, minNow), d.cash);
        c.appendChild(h('div', { class: 'speech' }, st.text));
        c.appendChild(h('p', null, 'Cash: ' + money(d.cash) + '.  In this account: ' + money(d[acct]) + '.  Suggested: ' + money(st.rec) + '.'));
        const go = UI.btn('', () => {
          if (amt < minNow) { SFX.play('error'); UI.toast('Put in at least ' + money(minNow), 'bad'); return; }
          if (amt > 0) { S.move('cash', acct, amt); SFX.play('buy'); UI.toast(money(amt) + ' deposited.'); UI.updateHud(true); }
          next();
        }, 'primary');
        const upd = (v) => { amt = v; go.lastChild.textContent = amt > 0 ? 'Deposit ' + money(amt) : 'Continue without depositing'; go.classList.toggle('disabled', amt < minNow); };
        const pick = UI.amountPicker({ max: d.cash, value: amt, onChange: upd });
        c.appendChild(pick); c.appendChild(go); upd(amt);
      } else if (st.t === 'shoplist') {
        total++;
        const chosen = st.list.map(() => -1);
        const tot = h('div', { class: 'total' });
        const submit = UI.btn('Buy these groceries', () => {
          if (chosen.indexOf(-1) >= 0) { UI.toast('Choose one option on every line.', 'bad'); return; }
          const sum = chosen.reduce((a, v, r) => a + st.list[r].opts[v][1], 0);
          const best = chosen.filter((v, r) => st.list[r].opts[v][3] === 1).length;
          const within = sum <= st.budget;
          score += (best / st.list.length) * 0.7 + (within ? 0.3 : 0);
          c.innerHTML = '';
          c.appendChild(h('div', { class: 'fb ' + (within ? 'good' : 'bad') }, within ? 'Total ' + money(sum) + ', within your ₹' + st.budget + ' budget!' : 'Total ' + money(sum) + ', over budget by ' + money(sum - st.budget) + '.'));
          c.appendChild(h('div', { class: 'fb' }, 'Best value picks: ' + best + ' of ' + st.list.length + '. ' + (best === st.list.length ? 'Perfect shopping!' : 'Tip: compare the price per kg or litre. Local and seasonal is usually cheaper and fresher.')));
          const pay = Math.min(sum, S.d.cash);
          if (pay > 0) S.pay(pay, 'food', 'Weekly groceries', 'need');
          S.addBag('homemeal', 4);
          c.appendChild(h('p', null, 'You paid ' + money(pay) + ' and got 4 Home-cooked Meals in your bag (Hunger +40 each).'));
          c.appendChild(UI.btn('Next', next, 'primary')); UI.focusFirst(); UI.updateHud(true);
        }, 'primary');
        const refresh = () => { const sum = chosen.reduce((a, v, r) => a + (v >= 0 ? st.list[r].opts[v][1] : 0), 0); tot.textContent = 'Total: ' + money(sum) + ' of ' + money(st.budget); tot.className = 'total ' + (sum > st.budget ? 'bad' : 'good'); };
        st.list.forEach((line, r) => {
          const row = h('div', { class: 'slrow' }, h('b', null, line.name));
          const bs = line.opts.map((op, v) => UI.btn(op[0] + ' ' + money(op[1]) + '  (' + op[2] + ')', () => { chosen[r] = v; bs.forEach((x) => x.classList.remove('sel')); bs[v].classList.add('sel'); refresh(); }, 'small'));
          bs.forEach((x) => row.appendChild(x));
          c.appendChild(row);
        });
        c.appendChild(tot); c.appendChild(submit); refresh();
      } else if (st.t === 'funplan') {
        total++;
        const on = st.opts.map(() => false);
        const tot = h('div', { class: 'total' });
        c.appendChild(h('div', { class: 'speech' }, st.text));
        const refresh = () => { let cost = 0, pts = 0; on.forEach((v, k) => { if (v) { cost += st.opts[k][1]; pts += st.opts[k][2]; } }); tot.textContent = 'Spent ' + money(cost) + ' of ' + money(st.budget) + '   |   Fun points ' + pts + ' (need ' + st.target + ')'; tot.className = 'total ' + (cost > st.budget ? 'bad' : pts >= st.target ? 'good' : ''); return [cost, pts]; };
        const grid = h('div', { class: 'fungrid' });
        st.opts.forEach((op, k) => { const bt = UI.btn(op[0] + '  ' + (op[1] ? money(op[1]) : 'FREE') + '  +' + op[2] + ' fun', () => { on[k] = !on[k]; bt.classList.toggle('sel', on[k]); refresh(); }, 'small'); grid.appendChild(bt); });
        c.appendChild(grid); c.appendChild(tot);
        c.appendChild(UI.btn('Lock in my plan', () => {
          const [cost, pts] = refresh();
          const ok = cost <= st.budget && pts >= st.target;
          score += ok ? 1 : (cost <= st.budget ? 0.5 : 0.2);
          c.innerHTML = '';
          c.appendChild(h('div', { class: 'fb ' + (ok ? 'good' : 'bad') }, ok ? 'Great plan! ' + pts + ' fun points for ' + money(cost) + '.' : cost > st.budget ? 'Over budget! Fun has to fit inside the plan.' : 'Within budget, but only ' + pts + ' points. Free activities could have added more!'));
          c.appendChild(h('div', { class: 'fb' }, 'Notice: the park picnic and library day are FREE. Cheap or free fun often gives the most joy per rupee. The concert alone would blow the whole budget.'));
          c.appendChild(UI.btn('Next', next, 'primary')); UI.focusFirst();
        }, 'primary'));
        refresh();
      } else if (st.t === 'inbox') {
        let k = 0, right = 0;
        total++;
        const box = h('div');
        const show = () => {
          box.innerHTML = '';
          if (k >= st.msgs.length) { score += right / st.msgs.length; box.appendChild(h('div', { class: 'fb good' }, 'You judged ' + right + ' of ' + st.msgs.length + ' messages correctly.')); box.appendChild(UI.btn('Next', next, 'primary')); UI.focusFirst(); return; }
          const m = st.msgs[k];
          box.appendChild(h('div', { class: 'msgview' }, h('div', { class: 'from' }, 'Message ' + (k + 1) + ' of ' + st.msgs.length + '  |  From: ' + m.from), h('div', { class: 'mtext' }, m.text)));
          const row = h('div', { class: 'btnrow' });
          const judge = (sc) => { const ok = (m.scam === 1) === sc; if (ok) { right++; SFX.play('good'); } else SFX.play('bad'); row.innerHTML = ''; row.appendChild(h('div', { class: 'fb ' + (ok ? 'good' : 'bad') }, h('b', null, (m.scam ? 'SCAM. ' : 'SAFE. ')), m.ex)); row.appendChild(UI.btn('Next message', () => { k++; show(); }, 'primary')); UI.focusFirst(); };
          row.appendChild(UI.btn('Scam!', () => judge(true), 'want', '1')); row.appendChild(UI.btn('Safe', () => judge(false), 'need', '2'));
          box.appendChild(row); UI.focusFirst();
        };
        c.appendChild(box); show();
      } else if (st.t === 'goal') {
        c.appendChild(h('div', { class: 'speech' }, 'Pick a goal you would really like to reach:'));
        st.goals.forEach((g) => c.appendChild(UI.btn(g[0] + ': ' + money(g[1]) + ' in ' + g[2] + ' months', () => {
          S.d.goalName = g[0]; S.d.goalTarget = g[1];
          const ans = Math.round(g[1] / g[2]);
          const opts = shuffle([ans, Math.round(ans / 2), ans * 2]);
          steps.splice(i + 1, 0, { t: 'quiz', q: 'To save ' + money(g[1]) + ' in ' + g[2] + ' months, how much do you need to save each month?', opts: opts.map((v) => money(v)), a: opts.indexOf(ans), ex: money(g[1]) + ' / ' + g[2] + ' = ' + money(ans) + ' a month. Breaking a big goal into monthly steps makes it doable!' });
          next();
        }, 'wide')));
      } else if (st.t === 'table') {
        c.appendChild(h('h3', null, st.title));
        c.appendChild(h('table', { class: 'tx cmp' }, h('tr', null, st.cols.map((x) => h('th', null, x))), st.rows.map((r) => h('tr', null, r.map((x) => h('td', null, x))))));
        c.appendChild(UI.btn('Next', next, 'primary'));
      }
      frame(b, c);
    }
    function finish(b) {
      const pc = total ? score / total : 1;
      const stars = pc >= 0.9 ? 3 : pc >= 0.6 ? 2 : 1;
      const rewards = o.onDone ? (o.onDone(stars, pc) || []) : [];
      SFX.play('badge');
      b.appendChild(h('div', { class: 'finish' },
        h('div', { class: 'bigstars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
        h('div', { class: 'big' }, total ? 'Score: ' + Math.round(pc * 100) + '%' : 'Complete!'),
        h('ul', null, rewards.map((r) => h('li', null, r))),
        o.after ? h('p', { class: 'after' }, o.after) : null,
        UI.btn('Done', () => p.close(), 'primary')));
      UI.updateHud(true);
    }
  },

  /* ================= Report card ================= */
  report(final) {
    const d = S.d, sc = S.score(), gr = S.grade(sc.total), sp = sc.sp;
    const tips = [];
    if (sc.wantShare > 0.45) tips.push('Wants took ' + Math.round(sc.wantShare * 100) + '% of your spending. Try the 24-hour rule before buying wants.');
    if (d.savings + d.emergency + d.goal < 2000) tips.push('Your savings ended low. Pay yourself first: move money to savings at the start, not the end.');
    if (sp.losses > 500) tips.push('You lost ' + money(sp.losses) + ' to traps and scams. Pause when something feels urgent or too good to be true.');
    if (d.stats.fainted) tips.push('You fainted ' + d.stats.fainted + ' time(s). Food is a need: budget for it first.');
    if (d.subs.length) tips.push('You still have ' + d.subs.length + ' subscription(s) running. Check and cancel what you do not use.');
    if (S.missionsDone() < 9) tips.push('You finished ' + S.missionsDone() + ' of 9 missions. Every building has something to teach!');
    if (d.vehicle && !d.vehicle.rented) tips.push('Your vehicle cost ' + money(VEHICLES[d.vehicle.type].daily) + ' every day. Was it worth it compared to the bus pass?');
    if (!tips.length) tips.push('Brilliant month! You balanced needs, wants and savings like a pro.');
    if (final) { if (d.health >= 70 && !d.stats.fainted) S.award('healthy'); if (S.wealth() + S.vehicleValue() >= 6000) S.award('boss'); }
    UI.open({
      title: final ? 'Month Complete! Your MoneyWise Report Card' : 'Report Card So Far (Day ' + S.day() + ')', cls: 'report', closable: !final,
      build: (b) => {
        b.appendChild(h('div', { class: 'cols2' },
          h('div', null,
            h('div', { class: 'scorebox' }, h('div', { class: 'grade g' + gr[0] }, gr[0]), h('div', null, h('div', { class: 'big' }, sc.total + ' / 1000'), h('div', null, gr[1]))),
            Object.keys(sc.parts).map((k) => { const [a, m] = sc.parts[k]; return h('div', { class: 'pbar' }, h('span', null, k), h('div', { class: 'pt' }, h('div', { class: 'pf', style: 'width:' + Math.round(a / m * 100) + '%' })), h('span', null, a + '/' + m)); }),
            h('h3', null, 'Badges (' + Object.keys(d.badges).length + ')'),
            h('div', { class: 'owned' }, Object.keys(d.badges).map((k) => h('img', { class: 'icon', title: BADGES[k].name, src: ART.icon({ s: 'badge', c1: BADGES[k].c, c2: shade(BADGES[k].c, -0.3) }) })))),
          h('div', null,
            h('table', { class: 'money-table' },
              [['Started with', START_CASH], ['Cash now', d.cash], ['Savings', d.savings], ['Emergency fund', d.emergency], ['Goal fund', d.goal], ['Spent on needs', sp.needs], ['Spent on wants', sp.wants], ['Lost to traps and scams', sp.losses], ['Earned (gigs, gifts, interest)', d.stats.earned + d.stats.interest]].map(([k, v]) => h('tr', null, h('td', null, k), h('td', null, money(v))))),
            h('p', null, 'Missions: ' + S.missionsDone() + '/9.  Obstacles outsmarted: ' + d.stats.resisted + '.  Messages judged right: ' + d.stats.msgRight + '.  Gigs: ' + d.stats.gigs + '.'),
            h('h3', null, 'Kachi\'s advice for next month'),
            h('ul', null, tips.map((t) => h('li', null, t))))));
        const row = h('div', { class: 'btnrow' });
        if (window.self === window.top) row.appendChild(UI.btn('Print report', () => Panels.print(sc, gr, tips), ''));
        if (final) row.appendChild(UI.btn('Play again', () => { S.clearSave(); location.reload(); }, 'primary'));
        b.appendChild(row);
      }
    });
  },
  print(sc, gr, tips) {
    const d = S.d, el = document.getElementById('print');
    el.innerHTML = '';
    el.appendChild(h('h1', null, 'Shaka-Kachi: MoneyWise Mission. Report Card'));
    el.appendChild(h('p', null, 'Day ' + Math.min(S.day(), TOTAL_DAYS) + ' of ' + TOTAL_DAYS + '. Grade ' + gr[0] + ' (' + gr[1] + '), score ' + sc.total + ' / 1000.'));
    el.appendChild(h('table', null, Object.keys(sc.parts).map((k) => h('tr', null, h('td', null, k), h('td', null, sc.parts[k][0] + ' / ' + sc.parts[k][1])))));
    el.appendChild(h('p', null, 'Cash ' + money(d.cash) + ', savings ' + money(d.savings) + ', emergency fund ' + money(d.emergency) + ', goal fund ' + money(d.goal) + '. Missions ' + S.missionsDone() + '/9. Badges: ' + Object.keys(d.badges).map((k) => BADGES[k].name).join(', ') + '.'));
    el.appendChild(h('ul', null, tips.map((t) => h('li', null, t))));
    window.print();
  }
};
