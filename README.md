# Shaka-Kachi: MoneyWise Mission

A 2D platform adventure for Class 10 financial literacy. Players start with ₹12,000 of virtual credits and have 30 in-game days to explore a town, complete nine money missions, keep their Hunger, Health and Joy up, and finish the month with savings.

## Playing it

Double-click `ShakaKachi-MoneyWise.html`. It opens in any modern browser (Chrome, Edge or Firefox) and needs no internet connection, installation or admin rights. Everything, including the Phaser 4 engine and all the art, is inside that one file. Press F11 for full screen; the stage is designed for 1366 x 768 and scales to fit any screen.

Progress saves automatically in the browser each game day, so a student can close the tab and choose Continue later on the same computer.

A standard session lasts about 30 to 35 minutes (each game day is 48 seconds of play, and the clock pauses whenever a menu is open). Short (about 20 minutes) and Long (about 45 minutes) options are on the New Game screen.

## Controls

Arrow keys or A/D to walk, Space to jump, Up and Down for ladders and stairs, E to talk or shop, V to ride or park a vehicle (on the street, V also calls a parked vehicle to you), I for the bag (eating), C for clothes, M for the map, P for the financial profile, Q for the phone, H or Esc to pause, N to mute. All menus work with the arrow keys and Enter.

## What is in the town

| Building | Mission topic | Other things to do |
| --- | --- | --- |
| School Campus | Needs vs Wants | Canteen, free nurse check-up, notice board side quest, finish the month early |
| MoneyWise Bank | Saving, then Emergency Fund | Deposits and withdrawals, ATM, fraud safety quiz |
| Food Market | Essential Spending (weekly shop) | Two food stalls with different prices, rooftop garden quiz |
| Lifestyle Store | Fake discounts and tricky price tags | Clothes, gadgets, changing room |
| Entertainment Centre | Entertainment budgeting and subscriptions | Arcade, cinema, concerts, streaming subscription |
| Opportunity Centre | Fraud awareness | Gigs board (real gigs and fake job scams) |
| Education Centre | Future planning and SMART goals | Library card, courses, observatory |
| Transport Hub | True cost of vehicles | Bus passes, buy, sell or rent vehicles, garage. Vehicles drive the whole main road, past every building |

There is also an underground Discount Den full of fake discounts, a park with a lookout hill, rooftops linked by bridges, three bus stops, and Kachi's Coin Kiosk where MoneyWise coins become Budget Shields, hint tokens and a cape.

Financial obstacles (Grabbit the impulse buy, Tagster the fake discount, Phishy the scam, Crowdy the peer pressure, Loopy the subscription trap, Splurge the overspender, Hypey the misleading advert and Upgrado the unnecessary upgrade) roam the town in place of enemies. Players can jump over them or touch one to face a short decision. The game has no violence and no weapons.

At the end, a Report Card scores missions, savings, money lost to traps, the needs vs wants balance, health and joy, coins and badges, and gives personal advice.

## Changing the game

The readable source is in `src/`. Most teaching content (missions, quiz questions, obstacle scenarios, life events, phone messages, prices) lives in `src/data.js` and can be edited without touching any other file. To rebuild the single HTML file:

```
npm install phaser@4.2.1
python3 build.py
```

The output goes to `dist/ShakaKachi-MoneyWise.html`.

| File | What it holds |
| --- | --- |
| `core.js` | Constants, keyboard input, synthesised sound effects |
| `art.js` | All pixel art, drawn in code (characters, creatures, vehicles, icons, backgrounds) |
| `data.js` | Town layout, people, shops, items and all lesson content |
| `world.js` | Tile map, town painting and platformer physics |
| `state.js` | Money, wellbeing, daily costs, scoring and saving |
| `ui.js`, `panels.js` | HUD and every menu, shop, mission and report screen |
| `scene.js` | The Phaser scene and main game loop |

## A Windows executable

The HTML file already runs offline on Windows. If a school needs a `.exe`, the same file can be wrapped with a tool such as Electron or Neutralinojs by pointing its window at `ShakaKachi-MoneyWise.html`.
