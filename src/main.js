'use strict';
/* ==========================================================
   main.js : boot. Scales the 1366x768 stage to the window,
   starts Phaser and shows the title screen.
   ========================================================== */
(function () {
  function fit() {
    const r = document.getElementById('root');
    const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    r.style.transform = 'scale(' + s + ')';
    r.style.left = Math.round((window.innerWidth - VIEW_W * s) / 2) + 'px';
    r.style.top = Math.round((window.innerHeight - VIEW_H * s) / 2) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();
  Input.init();
  UI.init();
  const uiRoot = document.getElementById('ui');
  uiRoot.classList.add('titlemode');
  let lastRunning = null;
  setInterval(function () { if (G.running !== lastRunning) { lastRunning = G.running; uiRoot.classList.toggle('titlemode', !G.running); } }, 150);
  window.__onSceneReady = function () {
    const l = document.getElementById('loading'); if (l) l.remove();
    Panels.title();
  };
  const cfg = {
    type: Phaser.AUTO, parent: 'game', width: VIEW_W, height: VIEW_H, pixelArt: true, roundPixels: true, antialias: false,
    backgroundColor: '#7cc8f0', banner: false, scene: [MainScene],
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    audio: { noAudio: true }, scale: { mode: Phaser.Scale.NONE }, fps: { target: 60, smoothStep: false }
  };
  try { window.__game = new Phaser.Game(cfg); }
  catch (e) {
    const l = document.getElementById('loading');
    if (l) l.textContent = 'Sorry, this browser could not start the game: ' + e.message;
  }
})();
