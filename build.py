#!/usr/bin/env python3
"""Bundle Shaka-Kachi into one self-contained offline HTML file."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
ORDER = ['core.js', 'art.js', 'data.js', 'world.js', 'state.js', 'ui.js', 'panels.js', 'scene.js', 'main.js']

phaser = open(os.path.join(HERE, 'node_modules/phaser/dist/phaser.min.js'), encoding='utf-8').read()
css = open(os.path.join(SRC, 'style.css'), encoding='utf-8').read()
game = '\n'.join('/* ---- %s ---- */\n' % f + open(os.path.join(SRC, f), encoding='utf-8').read() for f in ORDER)
game = game.replace('</script', '<\\/script')
phaser = phaser.replace('</script', '<\\/script')

html = f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shaka-Kachi: MoneyWise Mission</title>
<style>
{css}
</style>
</head>
<body>
<div id="root">
  <div id="game"></div>
  <div id="night"></div>
  <div id="vignette"></div>
  <div id="ui">
    <div id="hud"></div>
    <div id="prompt"></div>
    <div id="tip"></div>
    <div id="toasts"></div>
    <div id="gigtimer"></div>
    <div id="panels"></div>
    <div id="fade"></div>
  </div>
</div>
<div id="print"></div>
<div id="loading">Loading Shaka Town...</div>
<script>
{phaser}
</script>
<script>
{game}
</script>
</body>
</html>
'''
out = os.path.join(HERE, 'dist', 'ShakaKachi-MoneyWise.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print('built', out, round(len(html.encode('utf-8')) / 1024), 'KB')

# Artifact page: same game, Phaser from a pinned CDN, no document skeleton.
body = html.split('<body>',1)[1].rsplit('</body>',1)[0]
body = body.replace('<script>\n' + phaser + '\n</script>', '<script src="https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js"></script>')
art = '<title>Shaka-Kachi: MoneyWise Mission</title>\n<style>\n' + css + '\n</style>\n' + body
open(os.path.join(HERE, 'dist', 'artifact.html'), 'w', encoding='utf-8').write(art)
print('artifact', round(len(art.encode('utf-8'))/1024), 'KB')
