'use strict';
/* ==========================================================
   scene.js : the Phaser scene and the game controller (G)
   ========================================================== */

const G = {
  running: false, busy: false, scene: null, player: null, obstacles: [], coinSprites: [], bottles: [], npcs: [],
  camX: 300, camY: 520, inv: 0, eatT: 0, hudT: 0, saveT: 0, animT: 0, faceDir: 1, lastBuilding: null, attractX: 200, attractDir: 1,

  /* ---------- game lifecycle ---------- */
  newGame(len) {
    S.fresh({ len: len });
    S.d.px = 16 * T; S.d.py = GY * T - 22;
    this.setupFromState();
    this.running = true;
    UI.updateHud(true);
    Panels.intro();
    S.d.pendingMsg = { at: 1.55 };
    S.save();
  },
  continueGame() {
    if (!S.load()) { this.newGame('standard'); return; }
    this.setupFromState();
    this.running = true;
    UI.updateHud(true);
    UI.toast('Welcome back! Day ' + S.day() + '.');
  },
  toTitle() { this.running = false; this.player = null; this.scene.playerSprite.setVisible(false); this.scene.kachi.setVisible(false); UI.setTimer(null); UI.showPrompt(null); Panels.title(); },
  endGame() {
    if (S.d.ended) return;
    S.d.ended = true; this.running = false; UI.closeAll(); UI.setTimer(null); UI.showPrompt(null);
    SFX.play('badge');
    Panels.report(true);
    S.save();
  },
  setupFromState() {
    const sc = this.scene, d = S.d;
    SFX.on = d.sound !== false;
    this.player = { x: d.px, y: d.py, w: 10, h: 22, vx: 0, vy: 0, grounded: false, onSlope: false, climbing: false };
    this.camX = d.px; this.camY = d.py;
    sc.playerSprite.setVisible(true); sc.kachi.setVisible(true);
    sc.kachi.x = d.px; sc.kachi.y = d.py - 30;
    this.coinSprites.forEach((cs) => cs.setVisible(!d.coinsTaken[cs.cid]));
    this.obstacles.forEach((o, i) => { const gone = d.obstacleGone[i]; o.alive = !(gone && gone > d.time); o.sprite.setVisible(o.alive); });
    sc.wallet.setVisible(!d.wallet);
    this.bottles.forEach((b) => b.destroy()); this.bottles = [];
    if (d.gigActive && d.gigActive.id === 'recycle') this.spawnBottles(5 - d.gigActive.got);
    this.setOutfit(d.outfit, true);
    this.refreshVehicle();
    this.inv = 1;
  },

  /* ---------- player helpers ---------- */
  ensurePlayerTex(outfit, helmet) {
    const key = 'pl_' + outfit + (helmet ? '_h' : '');
    if (!this.scene.textures.exists(key)) {
      const look = Object.assign({}, PLAYER_BASE, OUTFITS[outfit].look, { helmet: helmet });
      addSheet(this.scene, key, personSheet(look), PERSON_FRAMES, PFW, PFH);
    }
    return key;
  },
  setOutfit(id, silent) {
    S.d.outfit = id;
    this.playerTexKey = null;
    if (!silent) { UI.toast('Now wearing: ' + OUTFITS[id].name); SFX.play('open'); }
    UI.updateHud(true);
  },
  playerEat() { this.eatT = 0.7; },
  giveVehicle(type, rented) {
    S.d.vehicle = { type: type, rented: rented, neon: false, x: 298 * T, y: GY * T, riding: false, due: 0, rentDay: S.day() };
    this.refreshVehicle();
    UI.toast('Your ' + (rented ? 'rented ' : '') + VEHICLES[type].name + ' is parked outside the Transport Hub (left door).');
    UI.kachiTip('Press V to ride your ' + VEHICLES[type].name + '. If it is parked far away, press V on street level and I will fetch it. Press V again to park.', 'ride');
  },
  refreshVehicle() {
    const sc = this.scene, v = S.d && S.d.vehicle;
    if (!v) { sc.vehSprite.setVisible(false); return; }
    sc.vehSprite.setTexture('veh_' + v.type + (v.neon ? '_n' : ''));
    sc.vehSprite.setVisible(true);
    sc.vehSprite.setOrigin(0.5, (VEH_SIZE[v.type][1] - 1) / VEH_SIZE[v.type][1]);
    sc.vehSprite.setDepth(v.type === 'ev' ? 12 : 9);
    if (!v.riding) sc.vehSprite.setPosition(v.x, v.y);
  },
  busTravel(stop) {
    const v = S.d.vehicle, p = this.player;
    if (v && v.riding) { v.riding = false; v.x = p.x + p.w / 2; v.y = p.y + p.h; this.refreshVehicle(); UI.toast('Your ' + VEHICLES[v.type].name + ' stays parked at this stop.'); }
    this.busy = true;
    UI.fade(() => {
      p.x = stop.c * T + 30; p.y = GY * T - p.h; p.vx = p.vy = 0; p.climbing = false; p.onSlope = false;
      S.d.time += 0.03; this.camX = p.x; this.camY = p.y; this.busy = false;
      UI.toast('Arrived at ' + stop.name);
    });
  },
  spawnBottles(n) {
    n = n || 5;
    const sc = this.scene;
    const cands = [[12, GY], [47, GY], [79, GY], [130, GY], [171, GY], [218, GY], [256, GY], [299, GY], [362, 38], [368, 34], [128, 44]];
    BUILDINGS.forEach((b) => cands.push([b.x + Math.round(b.w / 2), b.roofRow]));
    shuffle(cands).slice(0, n).forEach(([c, r]) => {
      const s = sc.add.image(c * T + 8, r * T - 7, 'thing_bottle').setDepth(6);
      this.bottles.push(s);
    });
  },

  /* ---------- interactions ---------- */
  interact(n) {
    const d = S.d;
    switch (n.kind) {
      case 'shop': Panels.shop(n.shop, n); break;
      case 'mission':
        if (n.id === 'maya' && S.missionDone('transport')) { UI.say({ who: n.name, portrait: npcPortrait(n), text: 'Need anything for your ride?', buttons: [{ l: 'Garage and shop', cls: 'primary', act: () => Panels.garage() }, { l: 'Practise the mission', act: () => Panels.mission('transport') }] }); break; }
        Panels.mission(n.mission); break;
      case 'bank':
        if (n.obj === 'atm') { if (!S.missionDone('saving')) UI.toast('You need a savings account first. Talk to Banker Bela.', 'bad'); else Panels.bank(false); }
        else if (!S.missionDone('saving')) Panels.mission('saving');
        else UI.say({ who: n.name, portrait: npcPortrait(n), text: 'How can I help today?', buttons: [{ l: 'Deposit or withdraw', cls: 'primary', act: () => Panels.bank(true) }, { l: 'Practise the saving mission', act: () => Panels.mission('saving') }, { l: 'Bye' }] });
        break;
      case 'principal': Panels.principal(); break;
      case 'nurse': Panels.nurse(); break;
      case 'board': Panels.board(); break;
      case 'wardrobe': Panels.wardrobe(); break;
      case 'library': Panels.library(); break;
      case 'telescope': Panels.telescope(n); break;
      case 'bench': Panels.bench(n); break;
      case 'side': Panels.side(n); break;
      case 'gigs': Panels.gigs(); break;
      case 'kiosk': Panels.kiosk(); break;
      case 'buscounter': Panels.busCounter(); break;
      case 'showroom': Panels.showroom(); break;
      case 'busstop': Panels.busStop(n.stop); break;
      default: break;
    }
    void d;
  },
  promptFor(n) {
    switch (n.kind) {
      case 'mission': return 'Talk to ' + n.name + (S.missionDone(n.mission) ? '' : '  (Mission!)');
      case 'shop': return 'Shop: ' + n.name;
      case 'bank': return n.obj === 'atm' ? 'Use the ATM' : 'Talk to ' + n.name;
      case 'busstop': return 'Catch the bus';
      case 'bench': return 'Sit and rest';
      case 'telescope': return 'Look out';
      case 'wardrobe': return 'Changing room';
      case 'board': return 'Read the notice board';
      default: return 'Talk to ' + n.name;
    }
  },

  /* ---------- daily events ---------- */
  onNewDay(day) {
    const d = S.d;
    if (day > TOTAL_DAYS) { this.endGame(); return; }
    SFX.play('day');
    const out = S.newDay(day);
    this.refreshVehicle();
    UI.toast('Good morning! Day ' + day + ' of ' + TOTAL_DAYS + '.', 'day');
    out.forEach((t) => UI.toast(t));
    // schedule an event and a message for later today
    let ev = null;
    if (day === 4) ev = 'trip';
    else if (day === 18) ev = 'festival';
    else if (day > 1 && Math.random() < 0.55) {
      d.eventsSeen = d.eventsSeen || {};
      const pool = EVENTS.filter((e) => {
        if (e.id === 'trip' || e.id === 'festival') return false;
        if (e.needVehicle) { const v = d.vehicle; if (!v || e.needVehicle.split('|').indexOf(v.type) < 0) return false; }
        if (e.needMission && !S.missionDone(e.needMission)) return false;
        if ((d.eventsSeen[e.id] || 0) >= 2) return false;
        return true;
      });
      if (pool.length) ev = pick(pool).id;
    }
    if (ev) d.pendingEvent = { id: ev, at: day + rnd(0.15, 0.6) };
    if (Math.random() < 0.4 || day === 2) d.pendingMsg = { at: day + rnd(0.1, 0.7) };
    if (day === 3 && !S.missionDone('saving')) UI.kachiTip('Have you visited the Bank yet? Saving first is the number one money habit!');
    S.save();
  },
  deliverMessage() {
    const d = S.d;
    d.msgSeen = d.msgSeen || 0;
    const pool = MESSAGES.filter((m, i) => !(d.msgUsed || {})[i]);
    const list = pool.length ? pool : MESSAGES;
    const m = d.msgSeen === 0 ? MESSAGES[0] : pick(list);
    const idx = MESSAGES.indexOf(m);
    d.msgUsed = d.msgUsed || {}; d.msgUsed[idx] = 1; d.msgSeen++;
    d.inbox.push(Object.assign({ day: S.day() }, m));
    SFX.play('open');
    UI.toast('New phone message! Press Q to read it.', 'msg');
    UI.kachiTip('Messages can be real or scams. Open your phone (Q), read carefully, then report scams or mark safe ones.', 'msg');
  }
};

/* Turn a canvas sheet into a Phaser texture with named frames */
function addSheet(scene, key, canvas, names, fw, fh) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, canvas);
  names.forEach((n, i) => tex.add(n, 0, i * fw, 0, fw, fh));
  return tex;
}

class MainScene extends Phaser.Scene {
  constructor() { super('main'); }

  create() {
    G.scene = this;
    World.build();
    // ---- world chunks ----
    const big = World.paint();
    const CW = 512;
    for (let i = 0; i * CW < WORLD_W; i++) {
      const w = Math.min(CW, WORLD_W - i * CW);
      const [cv, cx] = mkCanvas(w, WORLD_H);
      cx.drawImage(big, i * CW, 0, w, WORLD_H, 0, 0, w, WORLD_H);
      this.textures.addCanvas('chunk' + i, cv);
      this.add.image(i * CW, 0, 'chunk' + i).setOrigin(0, 0).setDepth(0);
    }
    // ---- backgrounds (parallax) ----
    this.textures.addCanvas('sky', skyCanvas('#4fb3ea', '#bdeeff'));
    this.textures.addCanvas('clouds', cloudsCanvas());
    this.textures.addCanvas('hills', hillsCanvas('#8fd36a', '#4f9a3a', 1.3, 30, 98));
    this.textures.addCanvas('town', townSilCanvas());
    const vw = VIEW_W / ZOOM + 6, vh = VIEW_H / ZOOM + 6;
    this.sky = this.add.image(VIEW_W / 2, VIEW_H / 2, 'sky').setScrollFactor(0).setDisplaySize(vw, vh).setDepth(-10);
    this.clouds = this.add.tileSprite(VIEW_W / 2, VIEW_H / 2, vw, 90, 'clouds').setScrollFactor(0).setDepth(-9);
    this.hills = this.add.tileSprite(VIEW_W / 2, VIEW_H / 2, vw, 420, 'hills').setScrollFactor(0).setOrigin(0.5, 122 / 420).setDepth(-8);
    this.town = this.add.tileSprite(VIEW_W / 2, VIEW_H / 2, vw, 420, 'town').setScrollFactor(0).setOrigin(0.5, 122 / 420).setDepth(-7);
    // ---- facades ----
    BUILDINGS.forEach((b) => {
      this.textures.addCanvas('fac_' + b.id, World.paintFacade(b));
      b.facade = this.add.image(b.x * T, b.roofRow * T, 'fac_' + b.id).setOrigin(0, 0).setDepth(20);
    });
    // ---- sprite sheets ----
    Object.keys(CREATURE_DRAW).forEach((t) => addSheet(this, 'cr_' + t, creatureSheet(t), ['0', '1'], CR, CR));
    addSheet(this, 'kachi', kachiSheet(), ['0', '1'], 18, 18);
    addSheet(this, 'coin', coinSheet(), ['0', '1', '2', '3'], 10, 10);
    ['bottle', 'wallet', 'parcel', 'star', 'arrow'].forEach((k) => this.textures.addCanvas('thing_' + k, smallThing(k)));
    Object.keys(VEHICLES).forEach((k) => { this.textures.addCanvas('veh_' + k, vehicleCanvas(k, false)); this.textures.addCanvas('veh_' + k + '_n', vehicleCanvas(k, true)); });
    // ---- NPCs ----
    NPCS.forEach((n) => {
      n.x = n.c * T + 8; n.y = n.row * T;
      if (!n.look) return;
      addSheet(this, 'npc_' + n.id, personSheet(n.look, ['idle0', 'idle1']), ['idle0', 'idle1'], PFW, PFH);
      n.sprite = this.add.sprite(n.x, n.y, 'npc_' + n.id, 'idle0').setOrigin(0.5, 26 / 27).setDepth(6);
      n.sprite.flipX = n.c > (World.buildingAtCol(n.c) ? World.buildingAtCol(n.c).x + World.buildingAtCol(n.c).w / 2 : 9999);
      n.phase = Math.random() * 2;
      if (n.kind === 'mission') { n.mark = this.add.image(n.x, n.y - 34, 'thing_arrow').setDepth(7); }
    });
    // ---- coins ----
    World.coins.forEach((c) => { const s = this.add.sprite(c.x, c.y, 'coin', '0').setDepth(5); s.cid = c.id; s.px = c.x; s.py = c.y; G.coinSprites.push(s); });
    // ---- obstacles ----
    SPAWNS.forEach((sp) => {
      const s = this.add.sprite(sp.c0 * T + 8, sp.row * T, 'cr_' + sp.t, '0').setOrigin(0.5, 17 / 18).setDepth(7);
      G.obstacles.push({ type: sp.t, row: sp.row, c0: sp.c0, c1: sp.c1, x: rnd(sp.c0, sp.c1) * T + 8, y: sp.row * T, dir: Math.random() < 0.5 ? -1 : 1, speed: rnd(20, 32), t: Math.random() * 6, sprite: s, alive: true });
    });
    // ---- special items ----
    this.wallet = this.add.image(252 * T + 8, 20 * T - 6, 'thing_wallet').setDepth(6);
    this.vehSprite = this.add.image(0, 0, 'veh_bicycle').setVisible(false).setDepth(9);
    this.playerSprite = this.add.sprite(0, 0, G.ensurePlayerTex('uniform', false), 'idle0').setOrigin(0.5, 26 / 27).setDepth(10).setVisible(false);
    this.kachi = this.add.sprite(0, 0, 'kachi', '0').setDepth(11).setVisible(false);
    this.parcel = this.add.image(0, 0, 'thing_parcel').setDepth(11).setVisible(false);
    // ---- camera ----
    const cam = this.cameras.main;
    cam.setZoom(ZOOM); cam.setBounds(0, 0, WORLD_W, WORLD_H); cam.roundPixels = true;
    cam.centerOn(G.camX, G.camY);
    if (window.__onSceneReady) window.__onSceneReady();
  }

  update(time, delta) {
    const now = performance.now();
    const raw = this._last ? now - this._last : 16.7; this._last = now;
    const dt = Math.min(raw, 100) / 1000; void delta;
    G.animT += dt;
    const cam = this.cameras.main;
    // idle animations for NPCs and coins (always)
    const f2 = Math.floor(G.animT * 2) % 2;
    NPCS.forEach((n) => { if (n.sprite) { n.sprite.setFrame(Math.floor(G.animT * 1.6 + n.phase) % 2 ? 'idle1' : 'idle0'); } if (n.mark) { n.mark.setVisible(G.running && !S.missionDone(n.mission)); n.mark.y = n.y - 36 + Math.sin(G.animT * 4) * 2; } });
    const cf = String(Math.floor(G.animT * 8) % 4);
    G.coinSprites.forEach((c) => { if (c.visible) c.setFrame(cf); });

    if (!G.running) {
      // title attract mode: drift across town
      G.attractX += G.attractDir * dt * 60;
      if (G.attractX > WORLD_W - 300) G.attractDir = -1; if (G.attractX < 250) G.attractDir = 1;
      cam.centerOn(G.attractX, 520);
      this.updateParallax(cam);
      this.updateObstacles(dt, false);
      return;
    }
    const d = S.d, p = G.player;
    if (UI.modal() || G.busy) { this.syncPlayer(dt, true); this.updateParallax(cam); UI.updateHud(); Input.clear(); UI.showPrompt(null); return; }

    d.sessionSec += dt;
    G.inv = Math.max(0, G.inv - dt);
    const v = d.vehicle, riding = !!(v && v.riding);
    const V = riding ? VEHICLES[v.type] : null;

    // ---------- input to physics ----------
    let mx = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0);
    const lad = Phys.nearLadder(p), base = riding ? null : Phys.stairBase(p);
    const upHeld = Input.held('up'), downHeld = Input.held('down');
    let stair = false;
    if (!riding && p.onSlope) { if (upHeld && !mx) mx = p.slopeDir; if (downHeld && !mx) mx = -p.slopeDir; }
    if (base && upHeld) { if (!mx) mx = base.dir; stair = mx === base.dir; }
    const upJump = Input.hit('up') && (riding || (!lad.body && !base && !p.onSlope && !p.climbing));
    let speed = 95 * (riding ? V.speed * (v.due ? 0.6 : 1) : 1) * (d.health < 30 ? 0.75 : 1);
    const ctl = {
      mx: mx, speed: speed, up: !riding && upHeld, down: !riding && downHeld, downHit: !riding && Input.hit('down'), dropHit: Input.hit('down'),
      jumpHit: Input.hit('jump') || upJump, canClimb: !riding, stair: stair, jumpMul: riding ? V.jump : 1,
      onBump: () => SFX.play('bump')
    };
    // fixed sub-steps keep physics stable on slow school computers
    const nSteps = Math.max(1, Math.min(6, Math.ceil(dt / (1 / 60) - 0.01)));
    let jumped = false;
    for (let si = 0; si < nSteps; si++) {
      Phys.step(p, dt / nSteps, ctl);
      if (p.jumped) jumped = true;
      ctl.jumpHit = false; ctl.downHit = false; ctl.dropHit = false;
    }
    if (jumped) SFX.play('jump');
    if (mx) G.faceDir = mx;

    // While riding you drive along the main road in front of the buildings
    const inBraw = World.buildingAtPx(p.x + p.w / 2, p.y + p.h - 4);
    let inB = (v && v.riding) ? null : inBraw;
    if (inB !== G.lastBuilding) {
      G.lastBuilding = inB;
      if (inB) UI.kachiTip('Welcome to the ' + inB.name + '! Topic here: ' + inB.topic + '. Explore every floor using stairs and ladders.', 'in_' + inB.id);
    }

    // ---------- vehicle mount / dismount / call ----------
    if (Input.hit('vehicle')) {
      const feetNow = p.y + p.h, onStreet = p.grounded && !p.climbing && Math.abs(feetNow - GY * T) < 1;
      if (!v) UI.toast('You do not have a vehicle. Visit the Transport Hub showroom, or take the bus.');
      else if (v.riding) { v.riding = false; v.x = p.x + p.w / 2; v.y = feetNow; G.refreshVehicle(); SFX.play('click'); inB = inBraw; }
      else {
        const near = Math.abs(v.x - (p.x + p.w / 2)) < 26 && Math.abs(v.y - feetNow) < 14;
        if ((near && !p.climbing) || onStreet) {
          if (!near) { v.x = p.x + p.w / 2; v.y = feetNow; d.time += 0.02; UI.toast('Kachi fetched your ' + VEHICLES[v.type].name + ' for you.'); }
          v.riding = true; inB = null; SFX.play('open');
          UI.kachiTip('You are on the main road now. Drive anywhere along the street, right through the town. Press V to park, then walk inside.', 'road');
          if (v.type !== 'ev' && !S.has('helmet')) UI.kachiTip('Riding without a helmet is unsafe and can get you fined. Mechanic Maya sells helmets.', 'helmet');
        } else UI.toast('Go down to street level, then press V to call your ' + VEHICLES[v.type].name + '.');
      }
    }

    // ---------- interactions ----------
    const cx = p.x + p.w / 2, feet = p.y + p.h;
    let near = null, best = 99;
    const drivingNow = !!(v && v.riding);
    NPCS.forEach((n) => { if (drivingNow && World.buildingAtPx(n.x, n.y - 4)) return; const dx = Math.abs(cx - n.x); if (dx < 20 && Math.abs(feet - n.y) < 12 && dx < best) { best = dx; near = n; } });
    const wv = cam.worldView;
    if (near && !p.climbing) {
      UI.showPrompt(G.promptFor(near), (near.x - wv.x) * ZOOM, (near.y - 34 - wv.y) * ZOOM);
      if (Input.hit('interact')) { p.vx = 0; G.interact(near); }
    } else if (v && !v.riding && Math.abs(v.x - cx) < 26 && Math.abs(v.y - feet) < 14) {
      UI.showPrompt('Press V to ride your ' + VEHICLES[v.type].name, (v.x - wv.x) * ZOOM, (v.y - 30 - wv.y) * ZOOM);
    } else UI.showPrompt(null);

    // ---------- pick-ups ----------
    G.coinSprites.forEach((c) => {
      if (!c.visible) return;
      if (Math.abs(c.px - cx) < 10 && Math.abs(c.py - (p.y + p.h / 2)) < 16) {
        c.setVisible(false); d.coinsTaken[c.cid] = 1; d.coins++; d.coinsEarned++; d.stats.coinsPicked++; SFX.play('coin'); S.checkBadges();
        if (d.stats.coinsPicked === 1) UI.kachiTip('MoneyWise coins! Swap them for Budget Shields and more at my Coin Kiosk, between the Food Market and the Lifestyle Store.');
      }
    });
    if (this.wallet.visible && Math.abs(this.wallet.x - cx) < 12 && Math.abs(this.wallet.y - (p.y + p.h / 2)) < 16) { this.wallet.setVisible(false); SFX.play('coin'); Panels.wallet(); }
    G.bottles = G.bottles.filter((b) => {
      if (Math.abs(b.x - cx) < 12 && Math.abs(b.y - (p.y + p.h / 2)) < 18) {
        b.destroy(); SFX.play('coin'); if (d.gigActive && d.gigActive.id === 'recycle') { d.gigActive.got++; UI.toast('Bottle ' + d.gigActive.got + ' of 5'); }
        return false;
      }
      return true;
    });

    // ---------- obstacles ----------
    this.updateObstacles(dt, true);

    // ---------- time, hunger, health, joy ----------
    d.time += dt / S.dayLen();
    let hungerMul = 1;
    if (S.has('bottle')) hungerMul *= 0.9;
    if (d.outfit === 'sports') hungerMul *= 0.9;
    if (riding && V.hunger) hungerMul *= V.hunger;
    d.hunger = clamp(d.hunger - 28 / S.dayLen() * dt * hungerMul, 0, 100);
    d.joy = clamp(d.joy - 12 / S.dayLen() * dt, 0, 100);
    if (d.hunger < 15) d.health = clamp(d.health - 50 / S.dayLen() * dt, 0, 100);
    else if (d.hunger > 50) d.health = clamp(d.health + 8 / S.dayLen() * dt, 0, 100);
    if (d.hunger < 30) UI.kachiTip('Your tummy is rumbling! Press I to eat from your bag, or buy food at the School Canteen or Food Market.', 'hungry' + S.day());
    if (d.health < 35) UI.kachiTip('Your health is low! Eat proper meals (not junk), or visit Nurse Nila on the School 2nd floor.', 'sick' + S.day());
    if (d.joy < 20) UI.kachiTip('Your Joy is low. Free fun helps: sit on a bench, borrow library books, or visit the lookout in the park.', 'joy' + S.day());
    if (d.cash < 800 && d.cash > 0) UI.kachiTip('Cash is running low. You can withdraw savings at the bank, sell a vehicle, or earn at the Opportunity Centre gigs board.', 'lowcash' + Math.floor(S.day() / 3));
    if (d.health <= 0) {
      const nurse = npcById('nila');
      p.x = nurse.x + 16; p.y = nurse.y - p.h; p.vx = p.vy = 0; p.climbing = false;
      if (v && v.riding) { v.riding = false; v.x = 30 * T; v.y = GY * T; G.refreshVehicle(); }
      Panels.faint();
    }
    if (d.lastDay === undefined) d.lastDay = S.day();
    while (G.running && d.lastDay < S.day()) { d.lastDay++; G.onNewDay(d.lastDay); }
    if (!G.running) return;
    if (d.pendingEvent && d.time >= d.pendingEvent.at && !UI.modal()) {
      const ev = EVENTS.filter((e) => e.id === d.pendingEvent.id)[0]; d.pendingEvent = null;
      if (ev) { d.eventsSeen = d.eventsSeen || {}; d.eventsSeen[ev.id] = (d.eventsSeen[ev.id] || 0) + 1; Panels.event(ev); }
    }
    if (d.pendingMsg && d.time >= d.pendingMsg.at) { d.pendingMsg = null; G.deliverMessage(); }

    // roof visits
    if (p.grounded) BUILDINGS.forEach((b) => { if (Math.round(feet) === b.roofRow * T && cx > b.x * T && cx < (b.x + b.w) * T && !d.stats.roofs[b.id]) { d.stats.roofs[b.id] = 1; UI.toast('Rooftop reached: ' + b.name + ' (' + Object.keys(d.stats.roofs).length + '/8)'); S.checkBadges(); } });

    // delivery gig timer
    if (d.gigActive && d.gigActive.id === 'delivery') {
      d.gigActive.t -= dt;
      UI.setTimer('Delivery to Librarian Leela: ' + Math.max(0, Math.ceil(d.gigActive.t)) + 's');
      if (d.gigActive.t <= 0) { d.gigActive = null; UI.setTimer(null); SFX.play('bad'); UI.toast('Too late! Someone else delivered the parcel. Try again tomorrow, maybe with a bicycle or the bus.', 'bad'); }
    } else UI.setTimer(null);

    // ---------- tutorial hints ----------
    if (lad.body && !p.climbing) UI.kachiTip('Ladder! Hold ↑ to climb. At the top of a ladder, press ↓ to climb back down.', 'ladder');
    if (base) UI.kachiTip('Stairs! Hold ↑ to walk up them. Walk into the gap at the top to come back down.', 'stairs');
    if (p.grounded && Phys.onOneWay(p)) UI.kachiTip('You are on a wooden plank. Press \u2193 to drop down through it.', 'oneway');

    this.syncPlayer(dt, false);
    this.updateParallax(cam);

    // facades fade when you are inside
    BUILDINGS.forEach((b) => { const target = inB === b ? 0 : 1; b.facade.alpha = lerp(b.facade.alpha, target, Math.min(1, dt * 8)); });

    G.hudT -= dt; if (G.hudT <= 0) { G.hudT = 0.15; UI.updateHud(); }
    UI.tickTip(dt);
    G.saveT += dt; if (G.saveT > 30) { G.saveT = 0; d.px = p.x; d.py = p.y; S.save(); }
    d.px = p.x; d.py = p.y;
    Input.clear();
  }

  updateObstacles(dt, live) {
    const p = G.player, d = S.d;
    G.obstacles.forEach((o, i) => {
      if (!o.alive) {
        if (live && d.time >= (d.obstacleGone[i] || 0)) { o.alive = true; o.sprite.setVisible(true); o.sprite.alpha = 1; o.sprite.setScale(1); }
        return;
      }
      o.t += dt;
      const walk = OBSTACLES[o.type].walk;
      o.x += o.dir * o.speed * dt * (walk ? 1 : 0.6);
      if (o.x < o.c0 * T + 8) { o.x = o.c0 * T + 8; o.dir = 1; }
      if (o.x > o.c1 * T + 8) { o.x = o.c1 * T + 8; o.dir = -1; }
      o.y = walk ? o.row * T : o.row * T - 12 + Math.sin(o.t * 2.5) * 4;
      o.sprite.setPosition(Math.round(o.x), Math.round(o.y));
      o.sprite.setFrame(Math.floor(o.t * 3) % 2 ? '1' : '0');
      o.sprite.flipX = o.dir < 0;
      if (!live || !p) return;
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2, oy = o.y - 8;
      const dist = Math.abs(cx - o.x);
      if (dist < 120 && Math.abs(cy - oy) < 40) UI.kachiTip('Look out! That is ' + OBSTACLES[o.type].name + ', a ' + OBSTACLES[o.type].label + ' obstacle. Jump over it with Space, or touch it to face its money challenge. Wise choices earn coins!', 'ob_' + o.type);
      if (G.inv <= 0 && dist < 11 && Math.abs(cy - oy) < 15 && !(S.d.vehicle && S.d.vehicle.riding && World.buildingAtPx(o.x, o.y - 4))) {
        G.inv = 2.5; p.vx = 0;
        const ob = o;
        Panels.encounter(o.type, () => {
          ob.alive = false; d.obstacleGone[i] = d.time + 3;
          this.tweens.add({ targets: ob.sprite, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 350, onComplete: () => { ob.sprite.setVisible(false); } });
          G.inv = 1.5;
        });
      }
    });
  }

  syncPlayer(dt, frozen) {
    const p = G.player, sp = this.playerSprite, d = S.d;
    if (!p) return;
    const v = d.vehicle, riding = !!(v && v.riding);
    const helmet = riding && v.type !== 'ev' && S.has('helmet');
    const key = G.ensurePlayerTex(d.outfit, helmet);
    if (sp.texture.key !== key) sp.setTexture(key, 'idle0');
    let fr2 = 'idle0';
    G.eatT = Math.max(0, G.eatT - dt);
    if (riding) fr2 = 'ride';
    else if (G.eatT > 0) fr2 = 'eat';
    else if (p.climbing) fr2 = Math.abs(p.vy) > 1 ? (Math.floor(G.animT * 8) % 2 ? 'climb0' : 'climb1') : 'climb0';
    else if (!p.grounded) fr2 = p.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(p.vx) > 8 && !frozen) fr2 = 'walk' + (Math.floor(G.animT * 10) % 4);
    else fr2 = Math.floor(G.animT * 1.5) % 2 ? 'idle1' : 'idle0';
    sp.setFrame(fr2);
    sp.flipX = G.faceDir < 0;
    const cx = Math.round(p.x + p.w / 2), feet = Math.round(p.y + p.h);
    // on the road you pass in front of the buildings, so draw above the facades
    sp.setVisible(!(riding && v.type === 'ev')); // inside the car only the car shows; bikes and scooters show the rider
    sp.setDepth(riding ? 25 : 10); this.kachi.setDepth(riding ? 27 : 11);
    if (v) this.vehSprite.setDepth(riding ? (v.type === 'ev' ? 26 : 24) : (v.type === 'ev' ? 12 : 9));
    if (riding) {
      const off = { bicycle: [-3, -7], scooter: [-4, -6], ev: [-2, 2] }[v.type];
      sp.setPosition(cx + off[0] * G.faceDir, feet + off[1]);
      this.vehSprite.setPosition(cx, feet + 1); this.vehSprite.flipX = G.faceDir < 0;
      v.x = cx; v.y = feet;
    } else sp.setPosition(cx, feet);
    sp.alpha = G.inv > 0 && !frozen ? (Math.floor(G.animT * 12) % 2 ? 0.5 : 1) : 1;
    // Kachi floats behind you
    const k = this.kachi;
    const tx = cx - G.faceDir * 16, ty = feet - 34 + Math.sin(G.animT * 3) * 3;
    k.x = lerp(k.x, tx, Math.min(1, dt * 4)); k.y = lerp(k.y, ty, Math.min(1, dt * 4));
    k.setFrame(Math.floor(G.animT * 6) % 2 ? '1' : '0');
    // carried parcel
    const del = d.gigActive && d.gigActive.id === 'delivery';
    this.parcel.setVisible(!!del); if (del) this.parcel.setPosition(cx, feet - 30);
    // camera
    G.camX = lerp(G.camX, cx + G.faceDir * 20, Math.min(1, dt * 5));
    const under = feet > GY * T + 8;
    const maxCY = (under ? WORLD_H : GY * T + 34) - VIEW_H / ZOOM / 2;
    G.camY = Math.min(lerp(G.camY, feet - 40, Math.min(1, dt * 6)), lerp(G.camYMax || maxCY, maxCY, Math.min(1, dt * 5)));
    G.camYMax = Math.min(lerp(G.camYMax || maxCY, maxCY, Math.min(1, dt * 5)), WORLD_H - VIEW_H / ZOOM / 2);
    this.cameras.main.centerOn(Math.round(G.camX), Math.round(G.camY));
  }

  updateParallax(cam) {
    const wv = cam.worldView, cx = wv.centerX, cy = wv.centerY;
    const groundY = VIEW_H / 2 + (GY * T - 592);
    this.hills.y = groundY + (592 - cy) * 0.22 - 10; this.hills.tilePositionX = cx * 0.15;
    this.town.y = groundY + (592 - cy) * 0.4; this.town.tilePositionX = cx * 0.35;
    this.clouds.y = VIEW_H / 2 - VIEW_H / ZOOM / 2 + 40 + (592 - cy) * 0.1; this.clouds.tilePositionX = cx * 0.05 + G.animT * 4;
  }
}
