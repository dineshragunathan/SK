'use strict';
/* ==========================================================
   world.js : tile grid, world painting, platformer physics
   ========================================================== */

const TT = { E: 0, G: 1, W: 2, S: 3, R: 4, P: 5, L: 6, SR: 7, SL: 8, B: 9 };

const World = {
  grid: null, hidden: null, coins: [],

  idx(c, r) { return r * MAP_W + c; },
  set(c, r, t) { if (c >= 0 && c < MAP_W && r >= 0 && r < MAP_H) this.grid[r * MAP_W + c] = t; },
  tile(c, r) {
    if (c < 0 || c >= MAP_W) return TT.W;
    if (r < 0) return TT.E;
    if (r >= MAP_H) return TT.G;
    return this.grid[r * MAP_W + c];
  },
  solid(t) { return t === TT.G || t === TT.W || t === TT.S || t === TT.R || t === TT.B; },
  isLadder(c, r) { return this.tile(c, r) === TT.L; },
  isLadderTop(c, r) { return this.tile(c, r) === TT.L && this.tile(c, r - 1) !== TT.L; },
  isSlope(t) { return t === TT.SR || t === TT.SL; },

  build() {
    this.grid = new Uint8Array(MAP_W * MAP_H);
    this.hidden = new Set();
    for (let r = GY; r < MAP_H; r++) for (let c = 0; c < MAP_W; c++) this.set(c, r, TT.G);
    // underground passage
    for (let c = UNDERGROUND.c0 + 1; c < UNDERGROUND.c1; c++) for (let r = 41; r <= 43; r++) this.set(c, r, TT.E);
    UNDERGROUND.ladders.forEach((c) => { for (let r = 40; r <= 43; r++) this.set(c, r, TT.L); });
    // park hill
    HILL.forEach(([c0, c1, top]) => { for (let c = c0; c <= c1; c++) for (let r = top; r < GY; r++) this.set(c, r, TT.B); });
    // buildings
    BUILDINGS.forEach((b, i) => {
      b.idx = i; b.roofRow = GY - FH * b.floors;
      for (let r = b.roofRow + 1; r < GY; r++) { this.set(b.x, r, TT.W); this.set(b.x + b.w - 1, r, TT.W); }
      for (let r = GY - 3; r < GY; r++) { this.set(b.x, r, TT.E); this.set(b.x + b.w - 1, r, TT.E); }
      for (let c = b.x; c < b.x + b.w; c++) this.set(c, b.roofRow, TT.R);
      for (let k = 1; k < b.floors; k++) for (let c = b.x + 1; c < b.x + b.w - 1; c++) this.set(c, GY - FH * k, TT.S);
      b.links.forEach((lk, k) => {
        const R = GY - FH * k, type = lk[0], c = lk[1];
        if (type === 'lad') { for (let r = R - 5; r <= R - 1; r++) this.set(c, r, TT.L); }
        else {
          const d = type === 'sr' ? 1 : -1;
          for (let i = 0; i < 4; i++) this.set(c + d * i, R - 5, TT.E);
          for (let i = 0; i < 5; i++) this.set(c + d * i, R - 1 - i, d > 0 ? TT.SR : TT.SL);
        }
      });
      for (let r = b.roofRow; r <= b.roofRow + 4; r++) this.set(b.roofLad, r, TT.L);
      for (let r = b.roofRow; r < GY; r++) this.set(b.ext, r, TT.L);
    });
    BRIDGES.forEach((br) => { for (let c = br.c0; c <= br.c1; c++) this.set(c, br.row, TT.P); });
    TREES.forEach((t) => {
      for (let c = t - 2; c <= t + 1; c++) { this.set(c, 37, TT.P); this.hidden.add(this.idx(c, 37)); }
      for (let c = t - 1; c <= t; c++) { this.set(c, 34, TT.P); this.hidden.add(this.idx(c, 34)); }
    });
    BILLBOARDS.forEach((bb) => { for (let c = bb.c; c <= bb.c + 5; c++) this.set(c, 36, TT.P); for (let r = 36; r < GY; r++) this.set(bb.c - 1, r, TT.L); });
    BUS_STOPS.forEach((s) => { for (let c = s.c - 1; c <= s.c + 1; c++) this.set(c, 37, TT.P); });
    this.placeCoins();
  },

  /* MoneyWise coins scattered for exploration */
  placeCoins() {
    const list = [];
    const add = (c, r) => { if (this.tile(c, r) === TT.E && list.length < 90) list.push({ id: 'c' + c + '_' + r, x: c * T + 8, y: r * T + 8 }); };
    BUILDINGS.forEach((b) => {
      for (let i = 1; i <= 3; i++) add(b.x + Math.round(b.w * i / 4), b.roofRow - 1);
      for (let k = 1; k < b.floors; k++) { const R = GY - FH * k; add(b.x + (k % 2 ? b.w - 3 : 2), R - 1); add(b.x + Math.round(b.w / 2) + (k % 2 ? 3 : -3), R - 3); }
    });
    BRIDGES.forEach((br) => { add(br.c0 + 3, br.row - 2); add(br.c1 - 3, br.row - 2); add(Math.round((br.c0 + br.c1) / 2), br.row - 1); });
    TREES.forEach((t) => { add(t - 1, 33); add(t, 32); });
    BILLBOARDS.forEach((bb) => { add(bb.c + 1, 35); add(bb.c + 4, 35); });
    BUS_STOPS.forEach((s) => add(s.c, 36));
    for (let c = UNDERGROUND.c0 + 3; c < UNDERGROUND.c1 - 1; c += 4) add(c, 43);
    add(367, 33); add(369, 33); add(368, 31); add(362, 37); add(373, 35); add(5, GY - 1); add(378, 39);
    this.coins = list;
  },

  /* ---------- Painting the whole town onto one big canvas ---------- */
  paint() {
    const [cv, x] = mkCanvas(WORLD_W, WORLD_H);
    this.paintUnderground(x);
    BUILDINGS.forEach((b) => this.paintInterior(x, b));
    this.paintOutdoor(x);
    for (let r = 0; r < MAP_H; r++) for (let c = 0; c < MAP_W; c++) this.paintTile(x, c, r);
    this.paintSignsAfter(x);
    return cv;
  },

  paintTile(x, c, r) {
    const t = this.tile(c, r); if (t === TT.E) return;
    const px = c * T, py = r * T;
    const b = this.buildingAtCol(c);
    if (t === TT.G) {
      const above = this.tile(c, r - 1);
      const open = !this.solid(above) && above !== TT.B;
      const park = c >= 342 || c < 3;
      if (r === 44 && c > UNDERGROUND.c0 && c < UNDERGROUND.c1) {
        fr(x, px, py, T, T, '#4a3f5c'); fr(x, px, py, T, 3, '#8a7aa8'); fr(x, px + (c % 2) * 8, py + 6, 8, 1, '#3a3050'); return;
      }
      fr(x, px, py, T, T, '#a87545');
      const hsh = (c * 73 + r * 151) % 97;
      if (hsh % 3 === 0) fr(x, px + (hsh % 11), py + 3 + (hsh % 9), 2, 2, '#8f5f36');
      if (hsh % 4 === 1) fr(x, px + ((hsh * 7) % 13), py + ((hsh * 5) % 12), 3, 2, '#bd8a58');
      if (hsh % 7 === 2) fr(x, px + 6, py + 12, 1, 1, '#6b4423');
      if (open && r === GY) {
        if (park) { fr(x, px, py, T, 5, '#5fbf3f'); fr(x, px, py + 5, T, 2, '#3e8a2f'); fr(x, px + (c % 3) * 4 + 1, py - 2, 1, 2, '#5fbf3f'); fr(x, px, py, T, 1, '#8ee07a'); }
        else { fr(x, px, py, T, 6, '#b9b4c7'); fr(x, px, py, T, 1, '#e4e0ee'); fr(x, px + 15, py, 1, 6, '#8e8aa0'); fr(x, px, py + 6, T, 2, '#6e6a80'); }
      }
      if (r === 40 && this.tile(c, 41) === TT.E) { fr(x, px, py + 13, T, 3, '#3a2e48'); }
      return;
    }
    if (t === TT.B) {
      fr(x, px, py, T, T, '#a87545');
      const hb = (c * 73 + r * 151) % 97;
      if (hb % 3 === 0) fr(x, px + (hb % 11), py + 4 + (hb % 9), 2, 2, '#8f5f36');
      if (!this.solid(this.tile(c, r - 1)) && this.tile(c, r - 1) !== TT.B) { fr(x, px, py, T, 5, '#5fbf3f'); fr(x, px, py, T, 1, '#8ee07a'); fr(x, px, py + 5, T, 2, '#3e8a2f'); }
      return;
    }
    if (t === TT.W) {
      const base = b ? shade(b.trim, 0.1) : '#8a6a5a';
      fr(x, px, py, T, T, base);
      const off = (r % 2) * 4;
      for (let yy = 0; yy < T; yy += 4) fr(x, px, py + yy, T, 1, shade(base, -0.25));
      for (let yy = 0; yy < T; yy += 8) { fr(x, px + off, py + yy + 1, 1, 3, shade(base, -0.25)); fr(x, px + off + 8, py + yy + 5, 1, 3, shade(base, -0.25)); }
      fr(x, px + 1, py, 1, T, shade(base, 0.2));
      return;
    }
    if (t === TT.S) {
      const base = b ? shade(b.trim, 0.25) : '#b07a4a';
      fr(x, px, py, T, T, base); fr(x, px, py, T, 3, shade(base, 0.35)); fr(x, px, py + 3, T, 1, shade(base, -0.3));
      fr(x, px + ((c * 5) % 12), py + 8, 1, 8, shade(base, -0.2)); fr(x, px, py + 15, T, 1, shade(base, -0.4));
      return;
    }
    if (t === TT.R) {
      const base = b ? b.roof : '#444';
      fr(x, px, py, T, T, base); fr(x, px, py, T, 3, shade(base, 0.35)); fr(x, px, py + 3, T, 1, shade(base, -0.3));
      fr(x, px + (c % 2) * 8, py + 9, 6, 1, shade(base, -0.25));
      return;
    }
    if (t === TT.P) {
      if (this.hidden.has(this.idx(c, r))) return;
      fr(x, px, py, T, 5, '#c98a4a'); fr(x, px, py, T, 1, '#e8b070'); fr(x, px, py + 5, T, 1, '#6b4423');
      fr(x, px + 7, py + 1, 1, 4, '#8a5a2b');
      if (c % 3 === 0) { fr(x, px + 2, py + 6, 2, 4, '#8a5a2b'); }
      return;
    }
    if (t === TT.L) {
      const metal = !!b || r >= 40;
      const rail = metal ? '#8d99ae' : '#8a5a2b', rung = metal ? '#c9d2e3' : '#c98a4a';
      fr(x, px + 2, py, 2, T, rail); fr(x, px + 12, py, 2, T, rail);
      for (let yy = 2; yy < T; yy += 5) fr(x, px + 2, py + yy, 12, 2, rung);
      fr(x, px + 1, py, 1, T, '#3a3a4a'); fr(x, px + 14, py, 1, T, '#3a3a4a');
      return;
    }
    if (t === TT.SR || t === TT.SL) {
      const base = b ? shade(b.trim, 0.3) : '#b07a4a';
      for (let s = 0; s < 4; s++) {
        const sx = t === TT.SR ? s * 4 : 12 - s * 4;
        const top = 12 - s * 4;
        fr(x, px + sx, py + top, 4, 16 - top, base);
        fr(x, px + sx, py + top, 4, 1, shade(base, 0.4));
      }
      // stringer underneath
      for (let s = 0; s < 16; s++) { const sy = t === TT.SR ? 15 - s : s; fr(x, px + s, py + sy, 1, 2, shade(base, -0.35)); }
      return;
    }
  },

  buildingAtCol(c) { for (let i = 0; i < BUILDINGS.length; i++) { const b = BUILDINGS[i]; if (c >= b.x && c < b.x + b.w) return b; } return null; },
  buildingAtPx(px, py) {
    const c = Math.floor(px / T), r = Math.floor(py / T);
    for (let i = 0; i < BUILDINGS.length; i++) { const b = BUILDINGS[i]; if (c >= b.x && c < b.x + b.w && r > b.roofRow && r < GY) return b; }
    return null;
  },

  paintUnderground(x) {
    const x0 = (UNDERGROUND.c0 + 1) * T, x1 = UNDERGROUND.c1 * T, y0 = 41 * T, y1 = 44 * T;
    fr(x, x0, y0, x1 - x0, y1 - y0, '#2b2340');
    for (let yy = y0; yy < y1; yy += 8) for (let xx = x0 + ((yy / 8) % 2) * 8; xx < x1; xx += 16) fr(x, xx, yy, 15, 7, '#332a4c');
    for (let xx = x0 + 24; xx < x1; xx += 64) { fr(x, xx, y0 + 2, 6, 3, '#fff6a0'); fr(x, xx - 2, y0 + 5, 10, 2, '#ffd23f55'); }
    const sx = 124 * T, sy = 41 * T + 4;
    fr(x, sx, sy, 128, 14, '#1a1428'); fr(x, sx, sy, 128, 1, '#ff3d7f'); fr(x, sx, sy + 13, 128, 1, '#ff3d7f');
    drawText(x, 'DISCOUNT DEN', sx + 20, sy + 4, '#ff3d7f', 2);
    drawText(x, '99% OFF!!', 133 * T + 8, 42 * T + 6, '#ffd23f', 1);
    drawText(x, 'TODAY ONLY', 119 * T, 42 * T + 6, '#7df9ff', 1);
    // counter
    fr(x, 126 * T, 43 * T + 4, 64, 12, '#5a3a2a'); fr(x, 126 * T, 43 * T + 4, 64, 2, '#8a5a3a');
  },

  paintInterior(x, b) {
    for (let k = 0; k < b.floors; k++) {
      const R = GY - FH * k, top = (R - 4) * T, x0 = (b.x + 1) * T, x1 = (b.x + b.w - 1) * T, hh = 4 * T;
      const back = b.backs[k] || '#f4f4f4';
      fr(x, x0, top, x1 - x0, hh, back);
      fr(x, x0, top, x1 - x0, 3, shade(back, -0.15));
      fr(x, x0, top + hh - 12, x1 - x0, 12, shade(back, -0.1));
      fr(x, x0, top + hh - 12, x1 - x0, 1, shade(back, -0.3));
      for (let wx = x0 + 40; wx < x1 - 40; wx += 96) {
        fr(x, wx, top + 12, 24, 22, b.trim); fr(x, wx + 2, top + 14, 20, 18, '#9fdcff');
        fr(x, wx + 2, top + 26, 20, 6, '#c8ecff'); fr(x, wx + 11, top + 14, 2, 18, b.trim); fr(x, wx + 2, top + 22, 20, 2, b.trim);
      }
      this.paintDecor(x, b, k, top, x0, x1);
    }
  },

  /* Interior furniture: purely visual, sits behind characters */
  paintDecor(x, b, k, top, x0, x1) {
    const fy = top + 64; // floor line (feet)
    const counter = (c, w, col, col2) => { const px = c * T - (w * T) / 2 + 8; fr(x, px, fy - 18, w * T, 18, col); fr(x, px, fy - 18, w * T, 3, col2 || shade(col, 0.3)); fr(x, px + 2, fy - 12, w * T - 4, 1, shade(col, -0.3)); };
    const shelf = (c, w, cols) => { const px = c * T; for (let s = 0; s < 3; s++) { fr(x, px, fy - 52 + s * 14, w * T, 2, '#8a5a2b'); for (let i = 0; i < w * 3; i++) fr(x, px + 2 + i * 5, fy - 58 + s * 14, 3, 6, cols[(i + s) % cols.length]); } };
    const poster = (c, lines, bg, fg) => { const px = c * T; const w = Math.max(...lines.map((l) => textW(l, 1))) + 8; fr(x, px - 1, top + 9, w + 2, lines.length * 7 + 7, OUTLINE); fr(x, px, top + 10, w, lines.length * 7 + 5, bg); lines.forEach((l, i) => drawText(x, l, px + 4, top + 13 + i * 7, fg, 1)); };
    const plant = (c) => { const px = c * T + 4; fr(x, px, fy - 8, 8, 8, '#b5651d'); circle(x, px + 4, fy - 14, 6, '#4caf50'); circle(x, px + 2, fy - 18, 4, '#5fbf3f'); };
    const board = (c, w, txt) => { const px = c * T; fr(x, px, top + 10, w * T, 28, '#6b4423'); fr(x, px + 2, top + 12, w * T - 4, 24, '#2f5a3a'); drawText(x, txt, px + 6, top + 16, '#ffffff', 1); };
    const clock = (c) => { circle(x, c * T + 8, top + 18, 6, '#ffffff'); ring(x, c * T + 8, top + 18, 6, 1, OUTLINE); fr(x, c * T + 8, top + 14, 1, 4, OUTLINE); fr(x, c * T + 8, top + 18, 3, 1, OUTLINE); };
    const id = b.id + k;
    switch (id) {
      case 'school0': counter(30, 4, '#c0392b'); shelf(28, 3, ['#f4f1e6', '#f7e05a', '#ffe14d']); board(13, 3, 'NOTICES'); poster(22, ['SCHOOL', 'CANTEEN'], '#fff', '#c0392b'); plant(4); clock(18); break;
      case 'school1': board(16, 9, 'TODAY: NEEDS VS WANTS'); for (let i = 0; i < 4; i++) { fr(x, (13 + i * 4) * T, fy - 12, 20, 3, '#b07a4a'); fr(x, (13 + i * 4) * T + 2, fy - 9, 2, 9, '#6b4423'); fr(x, (13 + i * 4) * T + 16, fy - 9, 2, 9, '#6b4423'); } plant(26); break;
      case 'school2': fr(x, 5 * T, fy - 12, 40, 6, '#ffffff'); fr(x, 5 * T, fy - 6, 40, 6, '#6ac0e0'); poster(10, ['NURSE', 'EAT WELL'], '#e8f7ff', '#e8423a'); for (let i = 0; i < 3; i++) { fr(x, (17 + i * 3) * T, fy - 26, 22, 16, '#2a2a33'); fr(x, (17 + i * 3) * T + 2, fy - 24, 18, 11, '#7df9ff'); fr(x, (17 + i * 3) * T + 6, fy - 10, 10, 10, '#8d99ae'); } break;
      case 'bank0': counter(63, 5, '#2a5d8a'); fr(x, 62 * T, fy - 40, 48, 18, '#cfe8ff88'); poster(56, ['SAVE FIRST', 'SPEND LATER'], '#fff', '#2a5d8a'); fr(x, 69 * T - 2, fy - 34, 20, 34, '#45526a'); fr(x, 69 * T + 1, fy - 30, 14, 9, '#7df9ff'); fr(x, 69 * T + 3, fy - 18, 10, 6, '#c9d2e3'); drawText(x, 'ATM', 69 * T + 3, fy - 41, '#2a5d8a', 1); plant(58); clock(66); break;
      case 'bank1': counter(61, 3, '#3a4a6a'); poster(57, ['EMERGENCY', 'FUND DESK'], '#fff6e6', '#c0392b'); poster(68, ['RAINY DAY', 'READY?'], '#eaf6ff', '#2a5d8a'); break;
      case 'bank2': poster(51, ['NEVER', 'SHARE OTP'], '#fff', '#e03030'); poster(58, ['NO PIN', 'ON CALLS'], '#fff', '#e03030'); poster(62, ['CHECK', 'LINKS'], '#fff', '#e03030'); break;
      case 'bank3': fr(x, 58 * T, fy - 46, 64, 46, '#8d99ae'); ring(x, 60 * T, fy - 23, 14, 3, '#c9d2e3'); fr(x, 58 * T + 4, fy - 42, 56, 2, '#c9d2e3'); drawText(x, 'VAULT', 57 * T + 2, fy - 54, '#45526a', 1); break;
      case 'food0': counter(98, 5, '#c0392b', '#ffd23f'); counter(110, 5, '#3f8a2a', '#8fd16a'); shelf(105, 2, ['#e8423a', '#ffe14d', '#4caf50']); shelf(115, 3, ['#4caf50', '#ff8a3d', '#f4f4f4', '#ffe14d']); poster(95, ['ANNAPOORNA'], '#fff7e0', '#c0392b'); poster(108, ['FRESH MART'], '#f0fff0', '#3f8a2a'); break;
      case 'food1': counter(104, 4, '#b07a4a'); shelf(96, 4, ['#e8a840', '#f7e05a', '#4caf50']); poster(110, ['UNIT PRICE', 'MATTERS'], '#fff', '#3f8a2a'); plant(117); break;
      case 'life0': for (let i = 0; i < 3; i++) { const px = (143 + i * 4) * T; fr(x, px, fy - 40, 40, 2, '#8d99ae'); ['#ff8a3d', '#27c26c', '#ffd23f', '#b8326a', '#2a2a33'].forEach((cc, j) => fr(x, px + 2 + j * 8, fy - 38, 6, 16, cc)); } fr(x, 156 * T, fy - 50, 30, 50, '#a83a6a'); fr(x, 156 * T + 3, fy - 48, 24, 48, '#ffe0ec'); poster(158, ['MIRROR'], '#e7f3ff', '#2a5d8a'); counter(150, 3, '#a83a6a'); break;
      case 'life1': counter(150, 4, '#2a2a33', '#7df9ff'); shelf(144, 3, ['#7df9ff', '#ff86b8', '#c9d2e3']); poster(154, ['NEW!', 'V9 PRO'], '#2a2a33', '#7df9ff'); break;
      case 'life2': poster(139, ['WAS 2999', 'NOW 1499'], '#fff', '#e03030'); poster(151, ['READ THE', 'FINE PRINT'], '#fff9e8', '#a83a6a'); plant(137); break;
      case 'ent0': for (let i = 0; i < 4; i++) { const px = (180 + i * 4) * T; fr(x, px, fy - 40, 24, 40, ['#3a86ff', '#e84a8a', '#27c26c', '#ffb703'][i]); fr(x, px + 3, fy - 36, 18, 12, '#1a1428'); fr(x, px + 5, fy - 32, 6, 4, '#7df9ff'); fr(x, px + 8, fy - 20, 8, 3, '#ffffff'); } counter(192, 4, '#5a36a8', '#ffd23f'); poster(199, ['ARCADE'], '#2b2350', '#ffd23f'); break;
      case 'ent1': fr(x, 196 * T, top + 6, 140, 40, '#1a1428'); fr(x, 196 * T + 4, top + 10, 132, 32, '#f4f4f4'); drawText(x, 'NOW SHOWING', 196 * T + 30, top + 22, '#5a36a8', 1); counter(192, 3, '#d93a3a', '#ffd23f'); break;
      case 'ent2': poster(178, ['PLAN YOUR', 'FUN!'], '#fff', '#5a36a8'); fr(x, 196 * T, fy - 34, 30, 34, '#2a2a33'); fr(x, 196 * T + 3, fy - 31, 24, 16, '#e03030'); drawText(x, 'STREAM', 196 * T + 3, fy - 12, '#ffffff', 1); counter(184, 3, '#a77bf0'); break;
      case 'opp0': fr(x, 233 * T, top + 8, 80, 40, '#6b4423'); fr(x, 233 * T + 3, top + 11, 74, 34, '#d9b98a'); for (let i = 0; i < 6; i++) fr(x, 233 * T + 6 + (i % 3) * 24, top + 14 + Math.floor(i / 3) * 15, 18, 11, i === 5 ? '#ff5a5a' : '#ffffff'); drawText(x, 'GIGS', 233 * T + 4, top + 2, '#b86a10', 1); counter(236, 3, '#b86a10'); break;
      case 'opp1': poster(230, ['URGENT', 'PRIZE', 'FEAR'], '#fff', '#e03030'); board(237, 4, 'SCAM RADAR'); break;
      case 'opp2': poster(230, ['CAREERS', 'START HERE'], '#f3ffe9', '#3f8a2a'); plant(236); break;
      case 'opp3': poster(232, ['SKILLS', 'PAY BACK'], '#fff', '#b86a10'); break;
      case 'edu0': for (let i = 0; i < 4; i++) shelf(268 + i * 4, 3, ['#e8423a', '#3a86ff', '#ffb703', '#27c26c', '#a77bf0']); counter(276, 3, '#1f7a72'); break;
      case 'edu1': board(268, 6, 'COURSES'); counter(274, 3, '#1f7a72'); plant(286); break;
      case 'edu2': board(262, 8, 'SMART GOALS'); counter(272, 3, '#4a6ad8'); break;
      case 'edu3': for (let i = 0; i < 18; i++) fr(x, (268 + (i * 7) % 18) * T + (i * 5) % 16, top + 6 + (i * 11) % 30, 1, 1, '#ffffff'); fr(x, 275 * T, fy - 26, 26, 6, '#c9d2e3'); fr(x, 276 * T, fy - 20, 3, 20, '#8d99ae'); break;
      case 'trans0': counter(312, 4, '#45526a', '#ffd23f'); poster(308, ['BUS PASS', '10 DAYS'], '#fff', '#45526a'); fr(x, 321 * T, fy - 6, 100, 6, '#cfd6e0'); poster(320, ['SHOWROOM'], '#2f3a4c', '#ffd23f'); break;
      case 'trans1': fr(x, 324 * T, fy - 30, 18, 30, '#27c26c'); fr(x, 324 * T + 4, fy - 26, 10, 8, '#c9ffd8'); drawText(x, 'EV', 324 * T + 5, fy - 14, '#ffffff', 1); counter(318, 3, '#3a7bd5'); shelf(310, 3, ['#8d99ae', '#ffd23f', '#e8423a']); break;
      default: break;
    }
  },

  paintOutdoor(x) {
    const gy = GY * T;
    // lamp posts
    for (let c = 10; c < MAP_W; c += 23) {
      if (this.buildingAtCol(c) || this.tile(c, GY - 1) !== TT.E) continue;
      fr(x, c * T + 7, gy - 50, 2, 50, '#3a3a4a'); fr(x, c * T + 3, gy - 54, 10, 4, '#3a3a4a'); fr(x, c * T + 4, gy - 50, 8, 3, '#fff6a0');
    }
    // trees
    TREES.forEach((t) => {
      const px = t * T;
      fr(x, px - 3, 37 * T, 6, gy - 37 * T, '#7a4a20'); fr(x, px - 3, 37 * T, 2, gy - 37 * T, '#9a6a3a');
      circle(x, px - 14, 37 * T + 2, 13, '#3e9a3f'); circle(x, px + 14, 37 * T + 2, 13, '#3e9a3f'); circle(x, px, 34 * T + 6, 16, '#4caf50');
      circle(x, px - 4, 34 * T, 10, '#5fbf3f'); circle(x, px - 6, 34 * T - 3, 4, '#8ee07a');
      fr(x, px - 26, 37 * T, 52, 3, '#4caf50'); fr(x, px - 14, 34 * T, 28, 3, '#5fbf3f');
      circle(x, px + 8, 36 * T, 2, '#e8423a'); circle(x, px - 10, 38 * T, 2, '#e8423a');
    });
    // bus stops
    BUS_STOPS.forEach((s) => {
      const px = s.c * T;
      fr(x, px - 15, 37 * T + 5, 2, gy - 37 * T - 5, '#45526a'); fr(x, px + 29, 37 * T + 5, 2, gy - 37 * T - 5, '#45526a');
      fr(x, px - 14, 37 * T + 8, 44, 24, '#cfe8ff66');
      fr(x, px - 6, gy - 10, 28, 3, '#8a5a2b');
      fr(x, px + 34, gy - 42, 2, 42, '#45526a'); circle(x, px + 35, gy - 46, 7, '#3a86ff'); drawText(x, 'BUS', px + 30, gy - 48, '#ffffff', 1);
      drawText(x, s.id, px + 4, 37 * T + 14, '#45526a', 2);
    });
    // billboards
    BILLBOARDS.forEach((bb) => {
      const px = bb.c * T;
      fr(x, px + 10, 36 * T + 5, 3, gy - 36 * T - 5, '#45526a'); fr(x, px + 82, 36 * T + 5, 3, gy - 36 * T - 5, '#45526a');
      fr(x, px - 2, 36 * T - 44, 100, 42, OUTLINE); fr(x, px, 36 * T - 42, 96, 38, '#ffd23f'); fr(x, px, 36 * T - 42, 96, 4, '#e03030');
      drawText(x, bb.ad[0], px + 6, 36 * T - 34, '#e03030', 2); drawText(x, bb.ad[1], px + 6, 36 * T - 20, '#3a86ff', 2);
    });
    // benches
    BENCHES.forEach((c) => { const px = c * T - 8; fr(x, px, gy - 10, 32, 3, '#8a5a2b'); fr(x, px, gy - 16, 32, 3, '#a8703a'); fr(x, px + 2, gy - 7, 2, 7, '#45526a'); fr(x, px + 28, gy - 7, 2, 7, '#45526a'); });
    // Kachi's coin kiosk
    { const px = 128 * T - 24; fr(x, px, gy - 30, 64, 30, '#3a2a6a'); fr(x, px - 4, gy - 44, 72, 14, '#ffd23f'); for (let i = 0; i < 9; i++) fr(x, px - 4 + i * 8, gy - 44, 4, 14, '#e0a800'); fr(x, px + 4, gy - 24, 56, 6, '#ffd23f'); drawText(x, 'COINS', px + 13, gy - 40, '#3a2a6a', 1); }
    // fountain in the park
    { const px = 353 * T + 8; fr(x, px - 30, gy - 10, 60, 10, '#9aa7b8'); fr(x, px - 26, gy - 12, 52, 4, '#7df9ff'); fr(x, px - 3, gy - 30, 6, 20, '#9aa7b8'); fr(x, px - 10, gy - 32, 20, 4, '#9aa7b8'); fr(x, px - 1, gy - 42, 2, 10, '#bff6ff'); }
    // flowers and fence in the park
    for (let c = 342; c < MAP_W; c += 2) { if (this.tile(c, GY - 1) !== TT.E) continue; fr(x, c * T + 3, gy - 4, 1, 4, '#3e8a2f'); fr(x, c * T + 2, gy - 6, 3, 2, ['#e8423a', '#ffd23f', '#f28bb3', '#ffffff'][c % 4]); }
    // lookout on hill
    { const px = 368 * T + 8, py = 34 * T; fr(x, px - 2, py - 18, 4, 18, '#45526a'); fr(x, px - 6, py - 22, 14, 6, '#8d99ae'); drawText(x, 'LOOKOUT', 365 * T, 30 * T, '#3a2a6a', 1); }
    // welcome sign at the start
    { const px = 1 * T; fr(x, px + 6, gy - 30, 3, 30, '#6b4423'); }
    // street direction signs
    [[46, 'BANK >'], [82, 'FOOD >'], [132, 'SHOPS >'], [218, 'JOBS >'], [256, 'LEARN >'], [299, 'BUS >']].forEach(([c, s]) => {
      const px = c * T; fr(x, px + 7, gy - 28, 2, 28, '#45526a'); const w = textW(s, 1) + 6; fr(x, px - w / 2 + 8, gy - 34, w, 9, '#27c26c'); drawText(x, s, px - w / 2 + 11, gy - 32, '#ffffff', 1);
    });
  },

  paintSignsAfter(x) {
    // floor labels inside buildings (shown when the facade fades out)
    BUILDINGS.forEach((b) => {
      for (let k = 0; k < b.floors; k++) {
        const label = (k === 0 ? 'G' : k + 'F');
        const px = (b.x + 2) * T, py = (GY - FH * k - 4) * T + 4;
        fr(x, px - 1, py - 1, textW(label, 1) + 6, 9, OUTLINE); fr(x, px, py, textW(label, 1) + 4, 7, b.trim); drawText(x, label, px + 2, py + 1, '#ffffff', 1);
      }
    });
  },

  /* Facade drawn in front of each building, fades when you walk in */
  paintFacade(b) {
    const W = b.w * T, H = (GY - b.roofRow) * T;
    const [cv, x] = mkCanvas(W, H);
    const wall = b.wall, dk = shade(wall, -0.25);
    fr(x, 0, 0, W, H, wall);
    fr(x, 0, 0, W, T, b.roof); fr(x, 0, 0, W, 3, shade(b.roof, 0.35)); fr(x, 0, T - 2, W, 2, shade(b.roof, -0.3));
    for (let i = 4; i < W - 8; i += 24) fr(x, i, 5, 10, 6, shade(b.roof, 0.15));
    fr(x, 0, T, 4, H - T, dk); fr(x, W - 4, T, 4, H - T, dk);
    for (let k = 1; k < b.floors; k++) { const y = (GY - FH * k - b.roofRow) * T; fr(x, 0, y, W, 6, b.trim); fr(x, 0, y, W, 1, shade(b.trim, 0.3)); }
    // windows
    for (let k = 0; k < b.floors; k++) {
      const y0 = (GY - FH * k - b.roofRow) * T - 4 * T;
      for (let wx = 3 * T; wx < W - 4 * T; wx += 5 * T) {
        if (k === 0 && (wx < 4 * T || wx > W - 6 * T)) continue;
        if (k === 0 && Math.abs(wx + T - W / 2) < 3 * T) continue;
        fr(x, wx - 2, y0 + 12, 36, 32, b.trim); fr(x, wx, y0 + 14, 32, 28, '#8fd3f4');
        fr(x, wx, y0 + 14, 32, 10, '#bfe9ff'); fr(x, wx + 15, y0 + 14, 2, 28, b.trim); fr(x, wx, y0 + 27, 32, 2, b.trim);
        fr(x, wx + 3, y0 + 16, 3, 6, '#ffffff');
        fr(x, wx - 4, y0 + 44, 40, 4, shade(b.trim, 0.2));
      }
    }
    // doors at both ends of the ground floor
    const gy0 = (GY - b.roofRow) * T;
    [0, W - 2 * T].forEach((dx) => {
      fr(x, dx, gy0 - 3 * T - 6, 2 * T, 3 * T + 6, b.trim);
      fr(x, dx + 4, gy0 - 3 * T, 2 * T - 8, 3 * T, '#3a2a20');
      fr(x, dx + 6, gy0 - 3 * T + 2, 2 * T - 12, 3 * T - 2, '#ffe9a8');
      fr(x, dx + 6, gy0 - 3 * T + 2, 2 * T - 12, 8, '#fff6d0');
    });
    // awning
    if (b.awning) {
      const ay = gy0 - 4 * T + 2;
      for (let i = 0; i < W; i += 8) fr(x, i, ay, 8, 10, b.awning[(i / 8) % 2]);
      for (let i = 0; i < W; i += 8) fr(x, i + 1, ay + 10, 6, 2, b.awning[(i / 8) % 2]);
      fr(x, 0, ay, W, 1, OUTLINE);
    }
    // sign board
    const sc = b.sign.length > 9 ? 2 : 3;
    const tw = textW(b.sign, sc);
    const sy = (b.floors > 1 ? (GY - FH * (b.floors - 1) - b.roofRow) * T - 4 * T + 2 : T + 4);
    const sx = Math.round(W / 2 - tw / 2);
    fr(x, sx - 8, sy, tw + 16, 5 * sc + 10, OUTLINE); fr(x, sx - 6, sy + 2, tw + 12, 5 * sc + 6, '#fff6e0');
    drawText(x, b.sign, sx, sy + 5, b.trim, sc);
    // ground floor name plaque over the middle
    const plq = b.topic.toUpperCase();
    const pw = textW(plq, 1);
    if (pw < W - 6 * T) { fr(x, W / 2 - pw / 2 - 4, gy0 - 3 * T - 2, pw + 8, 10, b.trim); drawText(x, plq, W / 2 - pw / 2, gy0 - 3 * T, '#ffffff', 1); }
    // little rooftop details
    fr(x, W - 30, 3, 14, 10, '#c9d2e3');
    outlineRegion(x, 0, 0, W, H);
    return cv;
  }
};

/* ==========================================================
   Physics: a small, predictable platformer engine.
   Entity: {x, y, w, h, vx, vy, grounded, onSlope, climbing, dropT, coyote}
   ========================================================== */
const GRAV = 950, MAXFALL = 430, JUMPV = -338, CLIMB = 72;
const Phys = {
  slopeSurface(c, r, px) {
    const t = World.tile(c, r);
    const lx = clamp(px - c * T, 0, T);
    if (t === TT.SR) return r * T + (T - lx);
    if (t === TT.SL) return r * T + lx;
    return null;
  },
  /* Returns the stair base near the entity's feet, {dir} where dir is the uphill direction. */
  stairBase(e) {
    const cx = e.x + e.w / 2, feet = e.y + e.h, col = Math.floor(cx / T), r = Math.floor((feet - 1) / T);
    for (let dc = -1; dc <= 1; dc++) {
      const c = col + dc, t = World.tile(c, r);
      if ((r + 1) * T !== Math.round(feet)) continue;
      if (t === TT.SR && Math.abs(cx - c * T) < 12 && World.tile(c - 1, r) !== TT.SR) return { dir: 1 };
      if (t === TT.SL && Math.abs(cx - (c + 1) * T) < 12 && World.tile(c + 1, r) !== TT.SL) return { dir: -1 };
    }
    return null;
  },
  nearLadder(e) {
    const cx = e.x + e.w / 2, col = Math.floor(cx / T);
    const body = World.isLadder(col, Math.floor((e.y + e.h * 0.5) / T)) || World.isLadder(col, Math.floor((e.y + e.h - 2) / T));
    const below = e.grounded && World.isLadder(col, Math.floor((e.y + e.h + 2) / T)) && !World.isLadder(col, Math.floor((e.y + e.h - 2) / T));
    return { body: body && Math.abs(cx - (col * T + 8)) < 8, below: below && Math.abs(cx - (col * T + 8)) < 8, col: col };
  },
  onOneWay(e) {
    const feet = e.y + e.h, r = Math.floor(feet / T);
    if (Math.abs(r * T - feet) > 0.6) return false;
    let any = false;
    for (let c = Math.floor((e.x + 1) / T); c <= Math.floor((e.x + e.w - 1) / T); c++) {
      const t = World.tile(c, r);
      if (World.solid(t)) return false;
      if (t === TT.P) any = true;
    }
    return any;
  },

  step(e, dt, k) {
    const wasGrounded = e.grounded;
    e.dropT = Math.max(0, (e.dropT || 0) - dt);
    e.coyote = Math.max(0, (e.coyote || 0) - dt);
    e.jumped = false;

    // ---------- ladders ----------
    if (!e.climbing && k.canClimb) {
      const lad = this.nearLadder(e);
      if (k.up && lad.body) { e.climbing = true; e.onSlope = false; }
      else if (k.downHit && lad.below) { e.climbing = true; e.onSlope = false; e.y += 3; }
      if (e.climbing) { e.x = lad.col * T + 8 - e.w / 2; e.vx = 0; e.vy = 0; }
    }
    if (e.climbing) {
      const col = Math.floor((e.x + e.w / 2) / T);
      e.vx = 0;
      e.vy = (k.down ? CLIMB : 0) - (k.up ? CLIMB : 0);
      if (k.jumpHit) { e.climbing = false; e.vy = JUMPV * 0.75 * (k.jumpMul || 1); e.vx = k.mx * k.speed; e.jumped = true; return; }
      e.y += e.vy * dt;
      let feet = e.y + e.h;
      if (e.vy < 0 && !World.isLadder(col, Math.floor((feet - 1) / T))) {
        const r = Math.floor((feet - 1) / T) + 1; e.y = r * T - e.h; e.climbing = false; e.grounded = true; e.vy = 0; return;
      }
      if (e.vy > 0) {
        const r = Math.floor(feet / T);
        if (World.solid(World.tile(col, r)) && feet >= r * T) { e.y = r * T - e.h; e.climbing = false; e.grounded = true; e.vy = 0; return; }
      }
      if (!World.isLadder(col, Math.floor((e.y + e.h * 0.5) / T)) && !World.isLadder(col, Math.floor((feet - 1) / T))) e.climbing = false;
      if (e.climbing && k.mx !== 0 && e.vy === 0 && wasGrounded) e.climbing = false;
      if (e.climbing) { e.grounded = false; return; }
    }

    // ---------- horizontal ----------
    const target = k.mx * k.speed;
    if (k.mx !== 0) {
      const acc = (wasGrounded ? 1150 : 760) * (e.vx !== 0 && Math.sign(target) !== Math.sign(e.vx) ? 2 : 1);
      e.vx = approach(e.vx, target, acc * dt);
    } else e.vx = approach(e.vx, 0, (wasGrounded ? 1400 : 320) * dt);

    if (k.jumpHit && (wasGrounded || e.coyote > 0)) {
      e.vy = JUMPV * (k.jumpMul || 1); e.grounded = false; e.onSlope = false; e.coyote = 0; e.jumped = true;
    } else if (k.dropHit && wasGrounded && this.onOneWay(e)) {
      e.dropT = 0.25; e.y += 2; e.grounded = false;
    }

    const dx = e.vx * dt;
    e.x += dx;
    const inset = (wasGrounded || e.onSlope) ? 6 : 1;
    const top = e.y + 1, bot = e.y + e.h - inset;
    if (dx > 0) {
      const c = Math.floor((e.x + e.w) / T);
      for (let r = Math.floor(top / T); r <= Math.floor(bot / T); r++) if (World.solid(World.tile(c, r))) { e.x = c * T - e.w - 0.01; e.vx = 0; break; }
    } else if (dx < 0) {
      const c = Math.floor(e.x / T);
      for (let r = Math.floor(top / T); r <= Math.floor(bot / T); r++) if (World.solid(World.tile(c, r))) { e.x = (c + 1) * T + 0.01; e.vx = 0; break; }
    }
    e.x = clamp(e.x, 0, WORLD_W - e.w);

    // ---------- vertical ----------
    const prevBottom = e.y + e.h;
    e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
    if (e.onSlope && !e.jumped) e.vy = Math.max(e.vy, 0);
    e.y += e.vy * dt;
    e.grounded = false;
    let landedTile = false;
    if (e.vy >= 0) {
      const bottom = e.y + e.h;
      const c0 = Math.floor((e.x + 1) / T), c1 = Math.floor((e.x + e.w - 1) / T);
      for (let r = Math.floor((prevBottom - 6) / T); r <= Math.floor(bottom / T) && !landedTile; r++) {
        const tt = r * T;
        if (tt > bottom || tt < prevBottom - 6.01) continue;
        for (let c = c0; c <= c1; c++) {
          const t = World.tile(c, r);
          const solid = World.solid(t);
          const oneway = (t === TT.P || World.isLadderTop(c, r)) && tt >= prevBottom - 0.6 && e.dropT <= 0;
          if (solid || oneway) { e.y = tt - e.h; e.vy = 0; e.grounded = true; landedTile = true; break; }
        }
      }
    } else {
      const r = Math.floor(e.y / T);
      for (let c = Math.floor((e.x + 1) / T); c <= Math.floor((e.x + e.w - 1) / T); c++) {
        if (World.solid(World.tile(c, r))) { e.y = (r + 1) * T; e.vy = 0; if (k.onBump) k.onBump(); break; }
      }
    }

    // ---------- stairs (slopes) ----------
    const cx = e.x + e.w / 2, col = Math.floor(cx / T), bottom = e.y + e.h;
    let best = null;
    const rb = Math.floor((bottom - 1) / T);
    for (let r = rb - 1; r <= rb + 1; r++) {
      const t = World.tile(col, r);
      if (t === TT.SR || t === TT.SL) { const s = this.slopeSurface(col, r, cx); if (best === null || Math.abs(s - bottom) < Math.abs(best.s - bottom)) best = { s: s, t: t }; }
    }
    if (best && !e.jumped) {
      const pen = bottom - best.s;
      const uphill = best.t === TT.SR ? 1 : -1;
      let engage = false;
      if (e.onSlope && pen >= -10 && pen <= 12) engage = true;
      else if (!wasGrounded && e.vy >= 0 && pen >= 0 && prevBottom <= best.s + 3) engage = true;
      else if (wasGrounded && k.stair && pen >= 0 && pen <= 14 && Math.sign(k.mx) === uphill) engage = true;
      else if (wasGrounded && !landedTile && pen < 0 && pen >= -8) engage = true;
      if (landedTile && best.s > e.y + e.h) engage = false;
      if (engage) { e.y = best.s - e.h; e.vy = 0; e.grounded = true; e.onSlope = true; e.slopeDir = uphill; }
      else e.onSlope = false;
    } else e.onSlope = false;

    if (wasGrounded && !e.grounded && !e.jumped) e.coyote = 0.08;
  }
};
