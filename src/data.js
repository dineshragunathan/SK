'use strict';
/* ==========================================================
   data.js : town layout, people, shops, items and all the
   financial literacy content (missions, obstacles, events).
   ========================================================== */

/* ---------- Buildings ----------
   links[k] connects floor k to floor k+1: ['sr', col] stairs rising right,
   ['sl', col] stairs rising left, ['lad', col] ladder. */
const BUILDINGS = [
  { id: 'school', name: 'School Campus', sign: 'SCHOOL', x: 3, w: 34, floors: 3, wall: '#f0b44c', trim: '#b5651d', roof: '#8a3b2a', backs: ['#fff1cf', '#e7f3ff', '#f4e9ff'], links: [['sr', 6], ['sl', 33]], roofLad: 14, ext: 2, topic: 'Needs vs Wants' },
  { id: 'bank', name: 'MoneyWise Bank', sign: 'BANK', x: 49, w: 24, floors: 4, wall: '#5aa7de', trim: '#2a5d8a', roof: '#24425e', backs: ['#eaf6ff', '#f2fbf0', '#fff6e6', '#efeaff'], links: [['sr', 52], ['lad', 66], ['sl', 69]], roofLad: 55, ext: 73, topic: 'Saving and Emergency Funds' },
  { id: 'food', name: 'Food Market', sign: 'FOOD MARKET', x: 85, w: 36, floors: 2, wall: '#8fd16a', trim: '#3f8a2a', roof: '#3a5a2a', backs: ['#fff7e0', '#f0fff0'], links: [['sr', 88]], roofLad: 112, ext: 84, awning: ['#e8423a', '#ffffff'], topic: 'Essential Spending' },
  { id: 'life', name: 'Lifestyle Store', sign: 'LIFESTYLE', x: 135, w: 28, floors: 3, wall: '#f28bb3', trim: '#a83a6a', roof: '#5a2a44', backs: ['#fff0f6', '#eef6ff', '#fff9e8'], links: [['sr', 138], ['sl', 159]], roofLad: 141, ext: 134, awning: ['#a83a6a', '#ffe0ec'], topic: 'Smart Shopping' },
  { id: 'ent', name: 'Entertainment Centre', sign: 'FUN ZONE', x: 175, w: 34, floors: 3, wall: '#a77bf0', trim: '#5a36a8', roof: '#3a2266', backs: ['#2b2350', '#352a5e', '#fbefff'], links: [['sr', 178], ['sl', 205]], roofLad: 190, ext: 209, topic: 'Entertainment Budgeting' },
  { id: 'opp', name: 'Opportunity Centre', sign: 'OPPORTUNITY', x: 221, w: 26, floors: 4, wall: '#ffb347', trim: '#b86a10', roof: '#6a3a10', backs: ['#fff4e2', '#eef9ff', '#f3ffe9', '#fff0f0'], links: [['sr', 224], ['sl', 243], ['sr', 224]], roofLad: 242, ext: 220, topic: 'Fraud Awareness' },
  { id: 'edu', name: 'Education Centre', sign: 'EDUCATION', x: 259, w: 30, floors: 4, wall: '#4fc3b8', trim: '#1f7a72', roof: '#1f4a45', backs: ['#f0fffb', '#fffbe9', '#eef1ff', '#1f2a4a'], links: [['sr', 262], ['sl', 285], ['sr', 262]], roofLad: 284, ext: 289, topic: 'Future Planning' },
  { id: 'trans', name: 'Transport Hub', sign: 'TRANSPORT HUB', x: 301, w: 40, floors: 2, wall: '#9aa7b8', trim: '#45526a', roof: '#2f3a4c', backs: ['#eef2f7', '#fff7ea'], links: [['sl', 337]], roofLad: 305, ext: 341, topic: 'Transport Costs' }
];
const BRIDGES = [{ row: 25, c0: 163, c1: 174 }, { row: 20, c0: 247, c1: 258 }];
const TREES = [39, 172, 252, 298, 346, 357];
const BILLBOARDS = [{ c: 77, ad: ['MEGA SALE', '90% OFF*'] }, { c: 212, ad: ['TOPPER', 'DRINK!'] }];
const BUS_STOPS = [{ id: 'A', name: 'Stop A: School and Bank', c: 43 }, { id: 'B', name: 'Stop B: Town Centre', c: 168 }, { id: 'C', name: 'Stop C: Transport Hub', c: 295 }];
const BENCHES = [46, 216, 349];
const UNDERGROUND = { c0: 117, c1: 139, ladders: [123, 132] };
const HILL = [[360, 362, 38], [363, 365, 36], [366, 370, 34], [371, 374, 36], [375, 376, 38]];

/* ---------- Looks ---------- */
const PLAYER_BASE = { skin: '#c68a54', hair: '#1e1410', hairStyle: 'spiky' };
const OUTFITS = {
  uniform: { name: 'School Uniform', look: { kind: 'uniform', top: '#f7f7f2', pants: '#33407a', shoes: '#2a2a2a' }, desc: 'Smart and free. You already own it.' },
  casual: { name: 'Tee and Jeans', look: { kind: 'casual', top: '#ff8a3d', top2: '#ffd1a8', pants: '#3f73c4', shoes: '#f2f2f2' } },
  sports: { name: 'Sports Kit', look: { kind: 'sports', top: '#27c26c', top2: '#1a8f4f', pants: '#1f2d56', shoes: '#e8423a', shorts: true } },
  rain: { name: 'Raincoat', look: { kind: 'rain', top: '#ffd23f', top2: '#c99a00', pants: '#33407a', shoes: '#2f6bd1', hairStyle: 'hood' } },
  kurta: { name: 'Festive Kurta', look: { kind: 'kurta', top: '#b8326a', pants: '#f4f0e6', shoes: '#8a5a2b' } },
  hoodie: { name: 'ZYNK Brand Hoodie', look: { kind: 'hoodie', top: '#2a2a33', pants: '#7d7f8c', shoes: '#ffffff' } },
  cape: { name: 'MoneyWise Cape', look: { kind: 'cape', top: '#3a7bd5', pants: '#2a2f45', shoes: '#ffd23f' } }
};

/* ---------- People ---------- (row = tile row their feet stand on) */
const NPCS = [
  { id: 'ravi', name: 'Canteen Uncle Ravi', c: 30, row: 40, kind: 'shop', shop: 'canteen', look: { skin: '#9a6338', hair: '#3a2a20', hairStyle: 'bald', top: '#ffffff', pants: '#5a5a6a', kind: 'apron', beard: true } },
  { id: 'meera', name: 'Principal Meera', c: 20, row: 40, kind: 'principal', look: { skin: '#b97a4c', hair: '#2a1a14', hairStyle: 'bun', top: '#2f8f83', top2: '#f6c445', pants: '#2f8f83', kind: 'saree', glasses: true } },
  { id: 'board', name: 'Notice Board', c: 14, row: 40, kind: 'board', obj: 'board' },
  { id: 'tara', name: 'Teacher Tara', c: 22, row: 35, kind: 'mission', mission: 'needs', look: { skin: '#c98c5a', hair: '#1a1010', hairStyle: 'long', top: '#e85d75', top2: '#ffd1dc', pants: '#3a3a5a', kind: 'casual' } },
  { id: 'nila', name: 'School Nurse Nila', c: 8, row: 30, kind: 'nurse', look: { skin: '#a8714a', hair: '#1a1010', hairStyle: 'bun', top: '#f2f2f2', top2: '#6ac0e0', pants: '#f2f2f2', kind: 'coat' } },
  { id: 'bela', name: 'Banker Bela', c: 63, row: 40, kind: 'bank', mission: 'saving', look: { skin: '#d9a066', hair: '#5a2a14', hairStyle: 'pony', top: '#ffffff', top2: '#2a5d8a', pants: '#2a3a5a', kind: 'tie' } },
  { id: 'atm', name: 'ATM', c: 69, row: 40, kind: 'bank', obj: 'atm' },
  { id: 'iyer', name: 'Mr Iyer (Emergency Desk)', c: 61, row: 35, kind: 'mission', mission: 'emergency', look: { skin: '#8a5530', hair: '#d8d8d8', hairStyle: 'short', top: '#f7f7f2', top2: '#3a4a6a', pants: '#3a4a6a', kind: 'vest', glasses: true } },
  { id: 'sam', name: 'Security Guard Sam', c: 57, row: 30, kind: 'side', side: 'guard', look: { skin: '#7a4a2a', hair: '#1a1010', hairStyle: 'cap', top: '#3a4a7a', top2: '#2a2f55', pants: '#2a2f55', kind: 'plain' } },
  { id: 'lakshmi', name: 'Amma Lakshmi (Annapoorna Meals)', c: 98, row: 40, kind: 'shop', shop: 'annapoorna', look: { skin: '#a8714a', hair: '#3a2a2a', hairStyle: 'bun', top: '#e8a83a', top2: '#c0392b', pants: '#c0392b', kind: 'saree' } },
  { id: 'farid', name: 'Farid (Fresh Mart)', c: 110, row: 40, kind: 'shop', shop: 'freshmart', look: { skin: '#c68a54', hair: '#2a1a14', hairStyle: 'short', top: '#4caf50', pants: '#5a4a3a', kind: 'apron', beard: true } },
  { id: 'kumar', name: 'Chef Kumar', c: 104, row: 35, kind: 'mission', mission: 'essential', look: { skin: '#9a6338', hair: '#2a1a14', hairStyle: 'chef', top: '#ffffff', pants: '#333344', kind: 'apron' } },
  { id: 'gita', name: 'Gardener Gita', c: 100, row: 30, kind: 'side', side: 'garden', look: { skin: '#b97a4c', hair: '#2a1a14', hairStyle: 'pony', top: '#7bc96f', top2: '#3f8a2a', pants: '#6b4423', kind: 'vest' } },
  { id: 'shreya', name: 'Shreya (Clothing)', c: 150, row: 40, kind: 'shop', shop: 'clothes', look: { skin: '#d9a066', hair: '#2a1a14', hairStyle: 'long', top: '#f28bb3', top2: '#ffffff', pants: '#3a3a5a', kind: 'casual' } },
  { id: 'fitting', name: 'Changing Room', c: 157, row: 40, kind: 'wardrobe', obj: 'curtain' },
  { id: 'gopi', name: 'Gadget Guru Gopi', c: 150, row: 35, kind: 'shop', shop: 'gadgets', look: { skin: '#c68a54', hair: '#4a3020', hairStyle: 'spiky', top: '#2a2a33', top2: '#7df9ff', pants: '#3a3a4a', kind: 'hoodie', glasses: true } },
  { id: 'sana', name: 'Stylist Sana', c: 147, row: 30, kind: 'mission', mission: 'smart', look: { skin: '#a8714a', hair: '#7a2a5a', hairStyle: 'long', top: '#a83a6a', top2: '#ffd1dc', pants: '#2a2a3a', kind: 'kurta' } },
  { id: 'arjun', name: 'Arcade Arjun', c: 192, row: 40, kind: 'shop', shop: 'arcade', look: { skin: '#c68a54', hair: '#1a1010', hairStyle: 'cap', top: '#ff5a3d', top2: '#2a2a33', pants: '#2a2a33', kind: 'plain' } },
  { id: 'tina', name: 'Ticket Tina (Cine Star)', c: 192, row: 35, kind: 'shop', shop: 'cinema', look: { skin: '#d9a066', hair: '#1a1010', hairStyle: 'bun', top: '#d93a3a', top2: '#ffd23f', pants: '#2a2a3a', kind: 'vest' } },
  { id: 'rocky', name: 'Manager Rocky', c: 184, row: 30, kind: 'mission', mission: 'fun', look: { skin: '#8a5530', hair: '#1a1010', hairStyle: 'spiky', top: '#a77bf0', top2: '#3a2266', pants: '#2a2a3a', kind: 'tie' } },
  { id: 'funkiosk', name: 'Concert and Streaming Kiosk', c: 197, row: 30, kind: 'shop', shop: 'funkiosk', obj: 'kiosk' },
  { id: 'kavya', name: 'Ms Kavya (Gigs Board)', c: 236, row: 40, kind: 'gigs', look: { skin: '#b97a4c', hair: '#2a1a14', hairStyle: 'pony', top: '#ffb347', top2: '#b86a10', pants: '#3a3a5a', kind: 'vest' } },
  { id: 'dev', name: 'Coach Dev', c: 234, row: 35, kind: 'mission', mission: 'fraud', look: { skin: '#9a6338', hair: '#1a1010', hairStyle: 'short', top: '#2f8f83', top2: '#ffffff', pants: '#1f2d56', kind: 'sports', shorts: false } },
  { id: 'leela', name: 'Librarian Leela', c: 276, row: 40, kind: 'library', look: { skin: '#c98c5a', hair: '#9a9a9a', hairStyle: 'bun', top: '#4fc3b8', top2: '#1f7a72', pants: '#3a3a5a', kind: 'saree', glasses: true } },
  { id: 'bose', name: 'Mr Bose (Courses)', c: 274, row: 35, kind: 'shop', shop: 'courses', look: { skin: '#d9a066', hair: '#3a2a20', hairStyle: 'short', top: '#ffffff', top2: '#1f7a72', pants: '#3a3a4a', kind: 'tie', glasses: true } },
  { id: 'prakash', name: 'Professor Prakash', c: 272, row: 30, kind: 'mission', mission: 'future', look: { skin: '#8a5530', hair: '#e0e0e0', hairStyle: 'bald', top: '#f2f2f2', top2: '#4a6ad8', pants: '#3a3a4a', kind: 'coat', beard: true, glasses: true } },
  { id: 'scope', name: 'Telescope', c: 276, row: 25, kind: 'telescope', obj: 'telescope' },
  { id: 'babu', name: 'Babu (Bus Counter)', c: 312, row: 40, kind: 'buscounter', look: { skin: '#9a6338', hair: '#1a1010', hairStyle: 'cap', top: '#45526a', top2: '#2a3242', pants: '#2a3242', kind: 'vest' } },
  { id: 'vijay', name: 'Vijay (Vehicle Showroom)', c: 324, row: 40, kind: 'showroom', look: { skin: '#c68a54', hair: '#1a1010', hairStyle: 'short', top: '#ffffff', top2: '#2a2a3a', pants: '#2a2a3a', kind: 'tie' } },
  { id: 'maya', name: 'Mechanic Maya', c: 318, row: 35, kind: 'mission', mission: 'transport', look: { skin: '#a8714a', hair: '#2a1a14', hairStyle: 'pony', top: '#3a7bd5', top2: '#ffd23f', pants: '#3a7bd5', kind: 'plain' } },
  { id: 'koko', name: "Koko (Kachi's Coin Kiosk)", c: 128, row: 40, kind: 'kiosk', look: { skin: '#d9a066', hair: '#ffd23f', hairStyle: 'spiky', top: '#ffd23f', top2: '#e0a800', pants: '#3a2a6a', kind: 'vest' } },
  { id: 'dinesh', name: 'Dinesh (Discount Den)', c: 128, row: 44, kind: 'shop', shop: 'den', look: { skin: '#b97a4c', hair: '#1a1010', hairStyle: 'short', top: '#ffd23f', top2: '#e03030', pants: '#2a2a2a', kind: 'vest', glasses: true } },
  { id: 'gopal', name: 'Grandpa Gopal', c: 352, row: 40, kind: 'side', side: 'piggy', look: { skin: '#9a6338', hair: '#eeeeee', hairStyle: 'bald', top: '#f2e6c8', top2: '#b08a4a', pants: '#f2e6c8', kind: 'kurta', beard: true, glasses: true } },
  { id: 'asha', name: 'Mrs Asha', c: 215, row: 40, kind: 'side', side: 'wallet', look: { skin: '#c98c5a', hair: '#3a2020', hairStyle: 'bun', top: '#6a5acd', top2: '#ffd23f', pants: '#6a5acd', kind: 'saree' } },
  { id: 'hilltop', name: 'Lookout Point', c: 368, row: 34, kind: 'telescope', obj: 'telescope' }
];
BENCHES.forEach((c, i) => NPCS.push({ id: 'bench' + i, name: 'Bench', c: c, row: 40, kind: 'bench', obj: 'bench' }));
BUS_STOPS.forEach((s) => NPCS.push({ id: 'bus' + s.id, name: s.name, c: s.c, row: 40, kind: 'busstop', obj: 'busstop', stop: s.id }));

/* ---------- Items ---------- */
const ITEMS = {
  // food (goes in your bag; eat to fill hunger)
  idli: { name: 'Idli Sambar', type: 'food', h: 30, hp: 4, tag: 'need', icon: { s: 'plate', c1: '#f4f1e6', c2: '#e0a03a' }, desc: 'Steamed, light and filling.' },
  lemonrice: { name: 'Lemon Rice', type: 'food', h: 32, hp: 3, tag: 'need', icon: { s: 'plate', c1: '#f7e05a', c2: '#cfa800' }, desc: 'Tangy and cheap.' },
  banana: { name: 'Banana', type: 'food', h: 8, hp: 2, tag: 'need', icon: { s: 'banana', c1: '#ffe14d', c2: '#c9a800' }, desc: 'Quick healthy snack.' },
  buttermilk: { name: 'Buttermilk', type: 'food', h: 6, hp: 3, tag: 'need', icon: { s: 'drink', c1: '#f4f7f2', c2: '#88aadd' }, desc: 'Cool and refreshing.' },
  thali: { name: 'Veg Thali', type: 'food', h: 60, hp: 8, tag: 'need', icon: { s: 'meal' }, desc: 'A full balanced meal.' },
  dosa: { name: 'Masala Dosa', type: 'food', h: 38, hp: 4, tag: 'need', icon: { s: 'plate', c1: '#e8a840', c2: '#c47a1a' }, desc: 'Crispy and filling.' },
  biryani: { name: 'Chicken Biryani', type: 'food', h: 65, hp: 4, joy: 4, tag: 'want', icon: { s: 'bowl', c1: '#f0a030', c2: '#7a4a20' }, desc: 'Big, tasty, pricey.' },
  samosa: { name: 'Samosa (2)', type: 'food', h: 18, hp: -2, joy: 3, tag: 'want', icon: { s: 'plate', c1: '#d99a3a', c2: '#a86a1a' }, desc: 'Fried treat. Not great every day.' },
  cola: { name: 'Fizzy Cola', type: 'food', h: 6, hp: -4, joy: 4, tag: 'want', icon: { s: 'drink', c1: '#5a2a1a', c2: '#e03030' }, desc: 'Sugary. Little hunger value.' },
  apple: { name: 'Apple', type: 'food', h: 10, hp: 4, tag: 'need', icon: { s: 'fruit', c1: '#e8423a' }, desc: 'Crunchy and healthy.' },
  milk: { name: 'Milk (500 ml)', type: 'food', h: 12, hp: 4, tag: 'need', icon: { s: 'bottle', c1: '#f4f4f4', c2: '#4a8ad8' }, desc: 'Good for growing bones.' },
  sandwich: { name: 'Egg Sandwich', type: 'food', h: 30, hp: 4, tag: 'need', icon: { s: 'sandwich', c1: '#ffe680', c2: '#4caf50' }, desc: 'Protein packed.' },
  chips: { name: 'Party Chips', type: 'food', h: 12, hp: -3, joy: 3, tag: 'want', icon: { s: 'packet', c1: '#ff5a3d', c2: '#ffd23f' }, desc: 'Mostly air and salt.' },
  choco: { name: 'Choco Bar', type: 'food', h: 10, hp: -2, joy: 6, tag: 'want', icon: { s: 'bar', c1: '#d93a8a' }, desc: 'A sweet treat.' },
  fruitbowl: { name: 'Fruit Bowl', type: 'food', h: 28, hp: 7, tag: 'need', icon: { s: 'bowl', c1: '#ff8a3d', c2: '#4caf50' }, desc: 'Fresh seasonal fruit.' },
  popcorn: { name: 'Cinema Popcorn', type: 'food', h: 15, hp: -1, joy: 6, tag: 'want', icon: { s: 'popcorn' }, desc: 'Costs a lot more inside the cinema.' },
  homemeal: { name: 'Home-cooked Meal', type: 'food', h: 40, hp: 6, tag: 'need', icon: { s: 'meal' }, desc: 'Made from your weekly groceries.' },
  laddoo: { name: "Grandpa's Laddoo", type: 'food', h: 20, hp: 1, joy: 6, tag: 'need', icon: { s: 'laddoo', c1: '#ffa53d' }, desc: 'Made with love.' },
  mint: { name: 'Mint Lemon Juice', type: 'food', h: 10, hp: 5, tag: 'need', icon: { s: 'drink', c1: '#8ee07a', c2: '#4caf50' }, desc: 'Fresh from the rooftop garden.' },
  // fun (used straight away)
  arcade: { name: 'Arcade (5 plays)', type: 'fun', joy: 15, tag: 'want', cat: 'entertainment', icon: { s: 'ticket', c1: '#ff5a3d' }, desc: 'Quick fun.' },
  movie: { name: 'Movie Ticket', type: 'fun', joy: 25, tag: 'want', cat: 'entertainment', icon: { s: 'ticket', c1: '#d93a3a' }, desc: 'Two hours of story.' },
  bowling: { name: 'Bowling Game', type: 'fun', joy: 28, tag: 'want', cat: 'entertainment', icon: { s: 'ticket', c1: '#3a86ff' }, desc: 'Great with friends.' },
  combo: { name: 'Movie + Popcorn Combo', type: 'fun', joy: 28, h: 15, tag: 'want', cat: 'entertainment', icon: { s: 'popcorn' }, desc: 'Bundle that looks cheaper than it is.' },
  concert: { name: 'Concert Ticket', type: 'fun', joy: 45, tag: 'want', cat: 'entertainment', icon: { s: 'ticket', c1: '#a77bf0' }, desc: 'Amazing, but very pricey.' },
  streammax: { name: 'StreamMax (weekly)', type: 'sub', weekly: 149, joyDaily: 3, tag: 'want', cat: 'subscriptions', icon: { s: 'app', c1: '#e03030', c2: '#8a1a1a' }, desc: 'Auto-renews every 7 days until you cancel.' },
  // clothes
  out_casual: { name: 'Tee and Jeans', type: 'outfit', outfit: 'casual', joy: 6, tag: 'need', cat: 'clothes', icon: { s: 'shirt', c1: '#ff8a3d', c2: '#ffd1a8' }, desc: 'Everyday wear. Useful.' },
  out_sports: { name: 'Sports Kit', type: 'outfit', outfit: 'sports', joy: 5, tag: 'need', cat: 'clothes', icon: { s: 'shirt', c1: '#27c26c', c2: '#ffffff' }, desc: 'You get hungry 10% slower while wearing it (fitter you!).' },
  out_rain: { name: 'Raincoat', type: 'outfit', outfit: 'rain', joy: 2, tag: 'need', cat: 'clothes', icon: { s: 'shirt', c1: '#ffd23f', c2: '#c99a00' }, desc: 'Protects your health on rainy days.' },
  out_kurta: { name: 'Festive Kurta', type: 'outfit', outfit: 'kurta', joy: 12, tag: 'want', cat: 'clothes', icon: { s: 'shirt', c1: '#b8326a', c2: '#f6c445' }, desc: 'Lovely for festivals.' },
  out_hoodie: { name: 'ZYNK Brand Hoodie', type: 'outfit', outfit: 'hoodie', joy: 15, tag: 'want', cat: 'clothes', icon: { s: 'shirt', c1: '#2a2a33', c2: '#39ff88' }, desc: 'You pay extra for the logo.' },
  // gadgets and useful things
  bottle: { name: 'Steel Water Bottle', type: 'gadget', tag: 'need', cat: 'gadgets', icon: { s: 'bottle', c1: '#9aa7b8', c2: '#45526a' }, desc: 'Stay hydrated: hunger drops 10% slower.' },
  backpack: { name: 'Big Backpack', type: 'gadget', tag: 'need', cat: 'gadgets', icon: { s: 'backpack', c1: '#3a86ff' }, desc: 'Carry 20 items instead of 12.' },
  calculator: { name: 'Calculator', type: 'gadget', tag: 'need', cat: 'gadgets', icon: { s: 'calc' }, desc: 'One free hint in every mission.' },
  torch: { name: 'Torch', type: 'gadget', tag: 'need', cat: 'gadgets', icon: { s: 'torch', c1: '#ffb703' }, desc: 'See clearly at night.' },
  pricescope: { name: 'PriceScope App', type: 'gadget', tag: 'need', cat: 'gadgets', icon: { s: 'app', c1: '#2ec4b6', c2: '#1f8f86' }, desc: 'Shows best value, unit prices and real prices of fake discounts.' },
  glitter: { name: 'Glitter Phone Cover', type: 'gadget', joy: 4, tag: 'want', cat: 'gadgets', icon: { s: 'phone', c1: '#ff86b8' }, desc: 'Sparkly. Does nothing else.' },
  headset: { name: 'Thunder X Gaming Headset', type: 'gadget', joy: 10, tag: 'want', cat: 'gadgets', icon: { s: 'headset', c1: '#e03030', c2: '#2a2a33' }, desc: 'Your old earphones still work.' },
  watch: { name: 'SmartWatch v9', type: 'gadget', joy: 8, tag: 'want', cat: 'gadgets', icon: { s: 'watch', c1: '#c9d2e3', c2: '#2a2a33' }, desc: 'Only slightly better than v8.' },
  earbuds: { name: 'Wireless Earbuds', type: 'gadget', joy: 8, tag: 'want', cat: 'gadgets', icon: { s: 'headset', c1: '#ffffff', c2: '#9aa7b8' }, desc: 'Discount Den special.' },
  sunglasses: { name: 'Designer-ish Sunglasses', type: 'gadget', joy: 5, tag: 'want', cat: 'gadgets', icon: { s: 'phone', c1: '#2a2a33' }, desc: 'Discount Den special.' },
  smartband: { name: 'Fitness Band', type: 'gadget', joy: 6, tag: 'want', cat: 'gadgets', icon: { s: 'watch', c1: '#27c26c', c2: '#1a8f4f' }, desc: 'Discount Den special.' },
  mystery: { name: 'Mystery Box', type: 'mystery', tag: 'want', cat: 'gadgets', icon: { s: 'gift', c1: '#a77bf0', c2: '#5a36a8' }, desc: 'Could be anything. Usually junk.' },
  keychain: { name: 'Glittery Keychain', type: 'junk', tag: 'want', cat: 'gadgets', icon: { s: 'coin' }, desc: 'An impulse buy.' },
  helmet: { name: 'Safety Helmet', type: 'gadget', tag: 'need', cat: 'transport', icon: { s: 'helmet', c1: '#e8423a' }, desc: 'Required by law on bicycles and scooters.' },
  neon: { name: 'Neon Turbo Kit', type: 'upgrade', tag: 'want', cat: 'transport', icon: { s: 'kit' }, desc: '"More speed!" (It only adds lights.)' },
  // education
  libcard: { name: 'Library Card', type: 'course', tag: 'need', cat: 'education', icon: { s: 'card', c1: '#4fc3b8', c2: '#1f7a72' }, desc: 'Borrow books for free fun every day.' },
  workshop: { name: 'Budgeting Workshop', type: 'course', tag: 'need', cat: 'education', icon: { s: 'book', c1: '#ffb347', c2: '#b86a10' }, desc: 'Get the PriceScope app and 5 MoneyWise coins.' },
  coding: { name: 'Coding Club (month)', type: 'course', tag: 'need', cat: 'education', icon: { s: 'book', c1: '#3a86ff', c2: '#1f4aa8' }, desc: 'Unlocks the well paid Web Helper gig.' },
  examprep: { name: 'Exam Prep Guide', type: 'course', tag: 'need', cat: 'education', icon: { s: 'book', c1: '#e8423a', c2: '#8a1a1a' }, desc: 'Boosts your Future Readiness and gives 10 coins.' },
  // coin kiosk
  shield: { name: 'Budget Shield', type: 'coinitem', icon: { s: 'shield', c1: '#3a86ff' }, desc: 'Blocks the loss from one bad obstacle choice.' },
  hint: { name: 'Hint Token', type: 'coinitem', icon: { s: 'calc' }, desc: 'Removes one wrong answer in a mission quiz.' },
  capeItem: { name: 'MoneyWise Cape', type: 'coinitem', icon: { s: 'cape' }, desc: 'A cape for true money heroes.' },
  joypass: { name: 'Park Fun Pass', type: 'coinitem', icon: { s: 'ticket', c1: '#27c26c' }, desc: '+25 Joy, no money needed.' }
};

const SHOPS = {
  canteen: { title: 'School Canteen', items: [['idli', 35], ['lemonrice', 40], ['banana', 10], ['buttermilk', 15]], note: 'Cheap, healthy school food. Broke? Ask for the free midday meal.' },
  annapoorna: { title: 'Annapoorna Meals', items: [['thali', 110], ['dosa', 60], ['biryani', 150], ['samosa', 30], ['cola', 40]] },
  freshmart: { title: 'Fresh Mart', items: [['banana', 8], ['apple', 25], ['milk', 28], ['sandwich', 55], ['fruitbowl', 70], ['chips', 50], ['choco', 60]] },
  arcade: { title: 'Arcade and Snacks', items: [['arcade', 120], ['popcorn', 180], ['cola', 60], ['chips', 80]] },
  cinema: { title: 'Cine Star', items: [['movie', 220], ['bowling', 300], ['combo', 350]] },
  funkiosk: { title: 'Concerts and Streaming', items: [['concert', 1500], ['streammax', 149]] },
  clothes: { title: 'Lifestyle Clothing', items: [['out_casual', 650], ['out_sports', 850], ['out_rain', 420], ['out_kurta', 1400], ['out_hoodie', 3200]] },
  gadgets: { title: 'Gadgets and Gear', items: [['bottle', 180], ['backpack', 500], ['calculator', 200], ['torch', 150], ['pricescope', 199], ['glitter', 799], ['headset', 4500], ['watch', 6000]] },
  courses: { title: 'Courses and Workshops', items: [['workshop', 300], ['coding', 1200], ['examprep', 350]] },
  den: { title: 'Discount Den (underground)', items: [['earbuds', 1999], ['sunglasses', 899], ['smartband', 1499], ['mystery', 299]], fake: { earbuds: [4999, 1499], sunglasses: [2999, 599], smartband: [3999, 1599], mystery: [999, 0] }, note: 'HUGE DISCOUNTS!!! TODAY ONLY!!! (says the sign, every day)' },
  maya: { title: "Maya's Garage", items: [['helmet', 350], ['neon', 1800]] }
};

const VEHICLES = {
  bicycle: { name: 'Bicycle', price: 3200, daily: 10, speed: 1.55, jump: 0.92, hunger: 1.2, icon: { s: 'bike', c1: '#e8423a' }, desc: 'Cheap to run. Pedalling makes you a bit hungrier.' },
  scooter: { name: 'E-Scooter', price: 6500, daily: 30, speed: 1.9, jump: 0.85, hunger: 1, icon: { s: 'scooter', c1: '#2ec4b6' }, desc: 'Fast. Needs charging and servicing every day.' },
  ev: { name: 'Zippy Mini EV', price: 11000, daily: 55, speed: 2.2, jump: 0.7, hunger: 1, icon: { s: 'car', c1: '#ffb703' }, desc: 'Fastest and comfy. Charging plus insurance adds up.' }
};
const BUS_FARE = 25, BUS_PASS = 300, BUS_PASS_DAYS = 10, RENT_BIKE = 70, RESALE = 0.6;

/* ---------- Badges ---------- */
const BADGES = {
  needs: { name: 'Needs Navigator', desc: 'Finished the Needs vs Wants mission.', c: '#f0b44c' },
  saving: { name: 'Super Saver', desc: 'Opened a savings account.', c: '#5aa7de' },
  emergency: { name: 'Safety Net', desc: 'Built an emergency fund.', c: '#2a5d8a' },
  essential: { name: 'Smart Shopper', desc: 'Mastered essential spending.', c: '#8fd16a' },
  smart: { name: 'Deal Detective', desc: 'Saw through fake discounts.', c: '#f28bb3' },
  fun: { name: 'Fun Planner', desc: 'Planned an entertainment budget.', c: '#a77bf0' },
  fraud: { name: 'Scam Spotter', desc: 'Trained your scam radar.', c: '#ffb347' },
  future: { name: 'Future Ready', desc: 'Set a SMART goal.', c: '#4fc3b8' },
  transport: { name: 'Wheels Wise', desc: 'Worked out the true cost of transport.', c: '#9aa7b8' },
  coins40: { name: 'Coin Collector', desc: 'Earned 40 MoneyWise coins.', c: '#ffd23f' },
  resist10: { name: 'Obstacle Buster', desc: 'Outsmarted 10 financial obstacles.', c: '#e84a8a' },
  inbox5: { name: 'Inbox Guardian', desc: 'Sorted 5 phone messages correctly.', c: '#2ec4b6' },
  gigs5: { name: 'Hard Worker', desc: 'Completed 5 gigs.', c: '#b86a10' },
  roofs: { name: 'Rooftop Explorer', desc: 'Stood on all 8 rooftops.', c: '#8a3b2a' },
  honest: { name: 'Honest Hero', desc: 'Returned a lost wallet.', c: '#6a5acd' },
  healthy: { name: 'Healthy Hero', desc: 'Finished the month healthy without fainting.', c: '#e8423a' },
  boss: { name: 'Budget Boss', desc: 'Finished with at least ₹6,000 saved or in hand.', c: '#27c26c' }
};

/* ---------- Missions ---------- */
const MISSION_ORDER = ['needs', 'saving', 'emergency', 'essential', 'smart', 'fun', 'fraud', 'future', 'transport'];
const MISSIONS = {
  needs: {
    name: 'Needs vs Wants', npc: 'tara', where: 'School Campus, 1st floor', badge: 'needs', coins: 10, cash: 200,
    steps: [
      { t: 'say', text: "Hi Shaka! Before you spend a single rupee, you need one superpower: telling a NEED from a WANT. Needs keep you safe, healthy and learning. Wants make life more fun, but you can live without them." },
      { t: 'sorter', time: 40, text: 'Sort each card. Press LEFT for Need, RIGHT for Want.', items: [['School textbooks', 1], ['Latest phone model', 0], ['Nutritious lunch', 1], ['Designer sneakers', 0], ['Medicine when you are ill', 1], ['Movie premiere ticket', 0], ['Raincoat in the monsoon', 1], ['Gaming skin pack', 0], ['Bus fare to school', 1], ['A fifth hoodie', 0], ['Clean drinking water', 1], ['Limited edition stickers', 0]] },
      { t: 'quiz', q: 'Your friend says new headphones are a NEED because everyone has them. What is the best reply?', opts: ['True, it is a need', 'It is a want, my old ones still work', 'Buy two pairs, just in case'], a: 1, ex: 'Something is a need when you cannot live, stay safe or learn without it. Everyone having it does not make it a need.' },
      { t: 'quiz', q: 'When can buying a want be a smart choice?', opts: ['Whenever it is on sale', 'After needs are covered and savings are set aside, if it fits the budget', 'When a friend recommends it'], a: 1, ex: 'Wants are fine! Just pay for needs first, save, and then enjoy wants with what is left.' },
      { t: 'quiz', q: 'Which pair is one need and one want?', opts: ['Rice and dal', 'School shoes and a third pair of party shoes', 'Concert ticket and arcade game'], a: 1, ex: 'School shoes are a need. Extra party shoes are a want.' }
    ],
    after: 'Shops now label items as NEED or WANT to help you.'
  },
  saving: {
    name: 'Pay Yourself First', npc: 'bela', where: 'MoneyWise Bank, ground floor', badge: 'saving', coins: 12,
    steps: [
      { t: 'say', text: "Welcome to MoneyWise Bank! Saving means paying your future self first, before spending on anything else. Let's open your Savings Account." },
      { t: 'quiz', q: 'The 50-30-20 idea says: 50% needs, 30% wants, 20% savings. For ₹12,000, how much should you save?', opts: ['₹1,200', '₹2,400', '₹6,000'], a: 1, ex: '20% of 12,000 = 2,400. You can save more, but this is a great starting point.' },
      { t: 'deposit', acct: 'savings', min: 1000, rec: 2400, text: 'Move at least ₹1,000 from cash into your Savings Account. Savings earn a 2% bonus every 5 game days.' },
      { t: 'quiz', q: 'With ₹2,000 saved and a 2% bonus every 5 days, about how much do you earn after the first 5 days?', opts: ['₹4', '₹40', '₹400'], a: 1, ex: '2% of 2,000 = 40. Small, but it grows!' },
      { t: 'quiz', q: 'What does compound interest mean?', opts: ['Interest only on what you first put in', 'Earning interest on your interest too', 'The bank charging you a fee'], a: 1, ex: 'Your interest gets added to your savings, and next time you earn interest on the bigger amount. Time makes it snowball.' }
    ],
    after: 'Mobile banking is unlocked on your phone (Q). You can move money between cash and savings anywhere.'
  },
  emergency: {
    name: 'Rainy Day Fund', npc: 'iyer', where: 'MoneyWise Bank, 1st floor', badge: 'emergency', coins: 12, shields: 1,
    steps: [
      { t: 'say', text: "Life throws surprises. A cracked phone, a fever, a puncture. An emergency fund is money you keep aside ONLY for real surprises, so they don't wreck your plans." },
      { t: 'quiz', q: 'Which one is a real emergency?', opts: ['Limited edition sneakers have dropped', 'A medical bill after a fall', 'Concert tickets are selling fast'], a: 1, ex: 'Emergencies are unexpected and necessary. Sales and hype are never emergencies.' },
      { t: 'quiz', q: 'Where is the best place to keep an emergency fund?', opts: ['A separate account you can reach quickly', 'Spent on gold earrings', 'Lent to a friend'], a: 0, ex: 'Keep it separate so you are not tempted, but easy to reach when trouble comes.' },
      { t: 'deposit', acct: 'emergency', min: 1000, rec: 1500, text: 'Put at least ₹1,000 into your Emergency Fund. When a surprise cost pops up, you can pay from it.' },
      { t: 'quiz', q: 'You used your emergency fund for a repair. What next?', opts: ['Forget about it', 'Refill it bit by bit', 'Borrow from a loan app'], a: 1, ex: 'Refill it slowly so you are ready for the next surprise.' }
    ],
    after: 'When an emergency event happens you can now pay from your Emergency Fund.'
  },
  essential: {
    name: 'The Weekly Shop', npc: 'kumar', where: 'Food Market, 1st floor', badge: 'essential', coins: 10,
    steps: [
      { t: 'say', text: "Food is a need, but HOW you buy it matters. Here is a weekly shopping list. Choose one option for each line and stay within ₹450. Watch the price per kilo or litre, not just the sticker!" },
      {
        t: 'shoplist', budget: 450, list: [
          { name: 'Rice', opts: [['Loose rice, 1 kg', 48, '\u20B948 per kg', 1], ['Royal brand rice, 1 kg', 95, '\u20B995 per kg', 0], ['Tiny pack, 500 g', 30, '\u20B960 per kg', 0]] },
          { name: 'Dal', opts: [['Local dal, 500 g', 62, '\u20B9124 per kg', 1], ['Premium dal, 500 g', 110, '\u20B9220 per kg', 0]] },
          { name: 'Vegetables', opts: [['Seasonal mix', 70, 'Fresh and local', 1], ['Imported exotic veg', 210, 'Flown in from far away', 0]] },
          { name: 'Milk', opts: [['Pouch, 1 litre', 56, '\u20B956 per litre', 1], ['Tetra pack, 1 litre', 78, '\u20B978 per litre', 0]] },
          { name: 'Fruit', opts: [['Bananas, dozen', 50, 'About \u20B94 each', 1], ['3 kiwis', 120, '\u20B940 each', 0]] },
          { name: 'Snack', opts: [['Roasted chana', 30, 'Healthy and cheap', 1], ['Party chips', 99, 'Mostly air', 0], ['Skip the snack', 0, 'Saves money', 1]] }
        ]
      },
      { t: 'quiz', q: 'Why look at the unit price (per kg or per litre)?', opts: ['It is printed bigger', 'To compare value between different pack sizes', 'Shops make you'], a: 1, ex: 'A small pack can look cheaper but cost more per kilo.' },
      { t: 'quiz', q: 'Which is NOT essential spending?', opts: ['Groceries', 'School supplies', 'Weekly takeaway pizza'], a: 2, ex: 'Takeaway pizza is a want. Lovely sometimes, but not essential.' }
    ],
    after: 'Your groceries became Home-cooked Meals in your bag.'
  },
  smart: {
    name: 'Tricky Tags', npc: 'sana', where: 'Lifestyle Store, 2nd floor', badge: 'smart', coins: 10,
    steps: [
      { t: 'say', text: "Darling, price tags can play tricks! Big red signs, fake 'was' prices and countdown timers are all designed to make you buy NOW. Let's sharpen your eye." },
      { t: 'quiz', q: "A hoodie says 'MRP ₹2,999, NOW ₹1,499, 50% OFF!' Every other shop sells it for ₹1,399. Real deal?", opts: ['Yes, 50% off!', 'No, the discount is from a made-up high price', 'Buy two'], a: 1, ex: 'Compare with other shops. A discount from an inflated price is not a saving.' },
      { t: 'quiz', q: 'Jeans: Shop A is ₹900 with ₹100 off. Shop B is ₹850 with 10% off. Which is cheaper?', opts: ['Shop A (₹800)', 'Shop B (₹765)', 'Same price'], a: 1, ex: '10% of 850 is 85, so Shop B costs 765. Always do the maths.' },
      { t: 'quiz', q: "'Flat 70% OFF*' ... the tiny star says '*on min. purchase of ₹5,000'. What does it mean?", opts: ['Everything is 70% off', 'You must spend ₹5,000 to get it', 'Free delivery'], a: 1, ex: 'Read the fine print. It is often where the catch hides.' },
      { t: 'quiz', q: "A timer says 'Sale ends in 00:59!' What should you do?", opts: ['Panic and buy', 'Pause. Timers are designed to rush you', 'Buy extra for later'], a: 1, ex: 'If you would not buy it tomorrow at the same price, you do not need it today.' },
      { t: 'quiz', q: "'Buy 1 Get 1 Free' on ₹800 socks you only need one of. Best choice?", opts: ['Grab the deal', 'Only buy if one pair at ₹800 was already worth it to you', 'Buy 2, get 2'], a: 1, ex: 'A free extra you do not need is not a saving. You still spent ₹800.' }
    ],
    after: 'You received the PriceScope app. Shops now show best value and the real price behind fake discounts.'
  },
  fun: {
    name: 'Fun on a Budget', npc: 'rocky', where: 'Entertainment Centre, 2nd floor', badge: 'fun', coins: 10,
    steps: [
      { t: 'say', text: "Yo Shaka! Fun matters. Joy keeps you going. The trick is to PLAN your fun so it never eats your food money." },
      { t: 'funplan', budget: 800, target: 60, text: 'Plan two weeks of fun with ₹800. Get at least 60 fun points without going over. (Planning only, no real money is spent.)', opts: [['Arcade, 5 plays', 120, 15], ['Movie', 220, 25], ['Bowling with friends', 300, 28], ['Concert', 1500, 45], ['Park picnic with friends', 0, 15], ['Library comic day', 0, 10], ['StreamMax for 4 weeks', 596, 30], ['Popcorn combo', 350, 8]] },
      { t: 'quiz', q: "'Free 7-day trial, then ₹299 a week, auto-renews.' Best move?", opts: ['Sign up and forget', 'Set a reminder to cancel before it renews, or skip it', 'Share the password with everyone'], a: 1, ex: 'Free trials turn into payments if you forget. ₹299 a week is about ₹15,500 a year!' },
      { t: 'quiz', q: 'You have ₹1,800 left for two weeks of food. Is a ₹1,500 concert OK?', opts: ['Yes, you only live once', 'No, fun should never use up money for needs'], a: 1, ex: 'Fun comes from the wants part of your budget, never from your food or emergency money.' }
    ],
    after: 'Here is a free movie voucher, used straight away. Enjoy!'
  },
  fraud: {
    name: 'Scam Radar', npc: 'dev', where: 'Opportunity Centre, 1st floor', badge: 'fraud', coins: 12, shields: 1,
    steps: [
      { t: 'say', text: "Scammers use three tricks: URGENCY ('act now!'), PRIZES ('you won!') and FEAR ('your account is blocked!'). Let's train your scam radar." },
      {
        t: 'inbox', msgs: [
          { from: '+91 98xxx 21177', text: 'Dear customer, your account will be BLOCKED today. Share the OTP 4821 to verify KYC.', scam: 1, ex: 'Banks never ask for your OTP. Never share it with anyone.' },
          { from: 'MoneyWise Bank', text: '₹40 interest credited to your savings. We never ask for your OTP or PIN.', scam: 0, ex: 'An information message with no request for secrets is fine.' },
          { from: 'LuckyDraw2026', text: 'Congrats!! You won an iPhone. Pay ₹299 delivery to claim within 1 hour!', scam: 1, ex: 'You cannot win a contest you never entered. Paying to claim a prize is a classic scam.' },
          { from: 'School Office', text: 'Parent Teacher Meeting on Saturday, 10 am. Details on the notice board.', scam: 0, ex: 'A normal notice with no money or link request.' },
          { from: 'JobsFast', text: 'Earn ₹4,000/day liking videos! Registration fee only ₹999.', scam: 1, ex: 'Real jobs pay you. They never ask you to pay to join.' },
          { from: 'Unknown', text: "Hi it's Rahul, new number! Urgent, send ₹1,500 on UPI, will return tonight.", scam: 1, ex: 'Call your friend on their OLD number to check first.' }
        ]
      },
      { t: 'quiz', q: 'To RECEIVE money on UPI you need to...', opts: ['Enter your PIN', 'Do nothing. You never enter a PIN to receive money', 'Scan their QR code'], a: 1, ex: 'PINs and QR scans are for PAYING. Anyone asking you to scan or enter a PIN to receive money is a scammer.' },
      { t: 'quiz', q: "'Customer care' asks you to install a screen-sharing app to fix a refund. You...", opts: ['Install it', 'Hang up and call the official number yourself'], a: 1, ex: 'Screen-sharing apps let scammers see your OTPs and passwords.' }
    ],
    after: 'Your Scam Radar is on. Scam messages on your phone are now easier to judge.'
  },
  future: {
    name: 'Dream Big, Start Small', npc: 'prakash', where: 'Education Centre, 2nd floor', badge: 'future', coins: 12,
    steps: [
      { t: 'say', text: "Ah, young Shaka. Big dreams need small steps. Let us set a SMART goal: Specific, Measurable, Achievable, Relevant and Time-bound." },
      { t: 'goal', goals: [['A laptop for studies', 36000, 24], ['A good bicycle', 6000, 6], ['A coding course', 9000, 12], ['Saving towards college', 60000, 36]] },
      { t: 'quiz', q: 'Which of these is a SMART goal?', opts: ['Save some money someday', 'Save ₹500 a month for 12 months for a ₹6,000 course', 'Become rich'], a: 1, ex: 'It says how much, by when and for what.' },
      { t: 'quiz', q: 'Why does starting to save early help so much?', opts: ['Banks like young people', 'Time lets compound growth snowball', 'Prices never rise'], a: 1, ex: 'The earlier you start, the longer your money has to grow.' },
      { t: 'deposit', acct: 'goal', min: 0, rec: 500, text: 'Open your Goal Fund. Put in any amount now (even ₹0). You can add more later at the bank or on your phone.' },
      { t: 'quiz', q: 'Which of these is investing in your future?', opts: ['A skills course', 'A fifth pair of sneakers', 'Paid game skins'], a: 0, ex: 'Skills keep paying you back for years.' }
    ],
    after: 'Your Goal Fund is open. A scholarship quiz may appear later in the month.'
  },
  transport: {
    name: 'True Cost of Wheels', npc: 'maya', where: 'Transport Hub, 1st floor', badge: 'transport', coins: 10,
    steps: [
      { t: 'say', text: "Every vehicle costs more than its price tag. Charging, servicing, insurance, helmets. Let's compare the TOTAL cost for one month of two trips a day." },
      { t: 'table', title: '30 days, 2 trips a day', cols: ['Option', 'Upfront', 'Running', 'Month total', 'Sell back'], rows: [['Walking', '₹0', '₹0', '₹0', '-'], ['Bus tickets', '₹0', '60 x ₹25', '₹1,500', '-'], ['Bus passes', '3 x ₹300', '₹0', '₹900', '-'], ['Bicycle', '₹3,200', '30 x ₹10', '₹3,500', '60% back'], ['E-Scooter', '₹6,500', '30 x ₹30', '₹7,400', '60% back'], ['Mini EV', '₹11,000', '30 x ₹55', '₹12,650', '60% back']] },
      { t: 'quiz', q: 'If you will not use a vehicle after this month, what is cheapest for 2 trips a day (apart from walking)?', opts: ['Bus tickets', 'Bus passes', 'E-Scooter'], a: 1, ex: 'Passes cost ₹900 for the month, much less than ₹1,500 of tickets.' },
      { t: 'quiz', q: 'Why does a ₹6,500 scooter cost more than ₹6,500?', opts: ['It does not', 'Charging, servicing, insurance and a helmet add up', 'Tax on air'], a: 1, ex: 'Always add the running costs to the price tag.' },
      { t: 'quiz', q: "A ₹1,800 neon underglow kit 'makes you faster'. It is...", opts: ['A smart upgrade', 'An unnecessary upgrade', 'A safety need'], a: 1, ex: 'Lights look cool but add no speed. Upgrades should solve a real problem.' }
    ],
    after: 'Maya gave you a free safety helmet!'
  }
};

/* ---------- Financial obstacles ---------- */
const OBSTACLES = {
  impulse: { name: 'Grabbit', label: 'Impulse Purchase', line: 'Buy it NOW! Think later!', walk: true },
  fakeDiscount: { name: 'Tagster', label: 'Fake Discount', line: '90% OFF!* (*terms apply)', walk: true },
  scam: { name: 'Phishy', label: 'Scam Message', line: 'You WON! Just send your OTP...', walk: false },
  peer: { name: 'Crowdy', label: 'Peer Pressure', line: "Everyone's got one! Don't be boring!", walk: true },
  subscription: { name: 'Loopy', label: 'Subscription Trap', line: 'Free trial! (auto-renews forever)', walk: true },
  overspend: { name: 'Splurge', label: 'Overspending', line: 'Treat yourself... again!', walk: false },
  misleadingAd: { name: 'Hypey', label: 'Misleading Advert', line: 'Doctors HATE this snack!', walk: true },
  upgrade: { name: 'Upgrado', label: 'Unnecessary Upgrade', line: 'Your phone is SO old (6 months!)', walk: true }
};
const ENCOUNTERS = {
  impulse: [
    { text: 'A glittery keychain set at the checkout for ₹350. It was never on your list.', opts: [{ l: 'Grab it, it is cute!', cost: 350, item: 'keychain' }, { l: 'Skip it. It was not on my list', good: 1 }, { l: 'Buy two, one for a friend', cost: 700, item: 'keychain' }], fb: 'Shopping lists protect you. If it was not planned, wait 24 hours before buying.' },
    { text: "A 'trending' fidget gadget for ₹499 flashes at you while you buy lunch.", opts: [{ l: 'Wait 24 hours and see if I still want it', good: 1 }, { l: 'Buy now before it is gone', cost: 499, item: 'keychain' }], fb: 'Most impulse wants fade within a day. The 24-hour rule saves loads.' },
    { text: 'You are starving and pass a ₹250 dessert counter. Your planned meal costs ₹60.', opts: [{ l: 'Get the sundae, I deserve it', cost: 250, joy: 5 }, { l: 'Eat the planned meal first', good: 1 }], fb: 'Never shop hungry. Hunger turns wants into "needs".' }
  ],
  fakeDiscount: [
    { text: "'Was ₹1,999, NOW ₹999!' on a T-shirt that costs ₹899 in other shops.", opts: [{ l: 'Half price! Buy it', cost: 999 }, { l: 'Compare prices elsewhere first', good: 1 }], fb: 'A discount from a fake "was" price is not a saving. Compare first.' },
    { text: "'Flat 70% OFF*' ... (*on selected items, minimum purchase ₹3,000).", opts: [{ l: 'Read the fine print, then decide', good: 1 }, { l: 'Fill a basket to reach ₹3,000', cost: 900 }], fb: 'The tiny star usually hides the catch.' },
    { text: "'Buy 2 Get 1 Free' on ₹300 shampoo. You only need one bottle.", opts: [{ l: 'Buy 2, get 3!', cost: 300 }, { l: 'Buy just the one I need', good: 1 }], fb: 'Spending more to get something free you do not need is not saving.' }
  ],
  scam: [
    { text: "Message: 'Your MoneyWise account is suspended. Click bit.ly/mw-kyc and enter your PIN.'", opts: [{ l: 'Click and enter PIN quickly', cost: 1500 }, { l: 'Ignore, report, and contact the bank officially', good: 1 }], fb: 'Real banks never ask for your PIN or OTP by message or link.' },
    { text: "Caller: 'I am from the lottery office. You won ₹10 lakh! Pay ₹2,000 tax first.'", opts: [{ l: 'Pay the tax to get the prize', cost: 2000 }, { l: 'Hang up. Real prizes never ask for fees', good: 1 }], fb: 'If you did not enter, you did not win. Paying to claim is always a scam.' },
    { text: "A QR code poster: 'Scan to RECEIVE ₹500 cashback!'", opts: [{ l: 'Scan and enter PIN', cost: 500 }, { l: 'Walk away. Scanning is for paying, not receiving', good: 1 }], fb: 'You never scan a QR or enter a PIN to receive money.' }
  ],
  peer: [
    { text: "Friends: 'Everyone's getting the ₹1,200 concert merch! Don't be boring!'", opts: [{ l: "Fine, I'll buy it", cost: 1200, joy: 4 }, { l: "I'll pass, I've planned my money", good: 1 }], fb: 'Real friends respect your budget. Saying no is a skill.' },
    { text: 'The group wants a ₹900 dinner at a fancy cafe.', opts: [{ l: 'Suggest a cheaper plan or a picnic', good: 1 }, { l: 'Go along and pay', cost: 900, joy: 6 }], fb: 'Suggest a plan that fits your budget. Often others are relieved too!' },
    { text: "'Just dip into your savings, YOLO!'", opts: [{ l: 'Savings are for my goals', good: 1 }, { l: 'Withdraw ₹600 for fun', cost: 600, joy: 5 }], fb: 'Savings are for goals and emergencies, not for peer pressure.' }
  ],
  subscription: [
    { text: "'Free 7-day trial of GameVault!' Card needed. Auto-renews at ₹249 a week.", opts: [{ l: 'Sign up, I will remember to cancel', sub: { name: 'GameVault', weekly: 249 } }, { l: 'Skip it, I do not need it', good: 1 }], fb: 'Most people forget to cancel. That is exactly what companies count on.' },
    { text: "'MusicMax Premium only ₹99 for the first month!' (then ₹199 a week)", opts: [{ l: 'Cheap! Sign up', sub: { name: 'MusicMax', weekly: 199 } }, { l: 'Work out the yearly cost first', good: 1 }], fb: '₹199 a week is over ₹10,000 a year. Always check the real cost.' },
    { text: "Your 'free' photo filter app now wants ₹149 a week after the trial.", opts: [{ l: 'Uninstall and use the free camera', good: 1 }, { l: 'Keep paying', sub: { name: 'FilterPro', weekly: 149 } }], fb: 'Check your subscriptions often and cancel what you do not use.' }
  ],
  overspend: [
    { text: "You have spent a lot on snacks this week. 'One more treat won't hurt!' A ₹150 pastry.", opts: [{ l: 'Stick to my budget', good: 1 }, { l: 'Buy the pastry', cost: 150, joy: 2 }], fb: 'Small treats add up. Track your spending so you notice.' },
    { text: "'Upgrade your meal to LARGE for just ₹70 more!'", opts: [{ l: 'Regular is enough', good: 1 }, { l: 'Go large', cost: 70 }], fb: '"Just a bit more" offers are designed to grow your bill.' },
    { text: "Your fun budget is used up. 'Just borrow from next week's food money!'", opts: [{ l: 'Never borrow from needs', good: 1 }, { l: 'Borrow ₹400 for fun', cost: 400, joy: 6 }], fb: 'Needs money is sacred. Fun waits until next week.' }
  ],
  misleadingAd: [
    { text: "Billboard: 'This energy drink makes you a TOPPER! ₹180'", opts: [{ l: 'Buy it before exams', cost: 180 }, { l: 'Ads exaggerate. Sleep and study work better', good: 1 }], fb: 'No drink can make you top the class. Question big promises.' },
    { text: "'Doctors recommend!' face cream (tiny print: 'actor portrayal').", opts: [{ l: 'Check the claims and reviews first', good: 1 }, { l: 'Buy it for ₹450', cost: 450 }], fb: 'Look for the small print and real evidence.' },
    { text: "An influencer: 'I only wear SparkleGlow shoes! ₹2,800, link in bio.'", opts: [{ l: 'Influencers are often paid. Think first', good: 1 }, { l: 'Buy through the link', cost: 2800, joy: 5 }], fb: 'Sponsored posts are adverts in disguise.' }
  ],
  upgrade: [
    { text: "'Phone X12 to X13! Slightly brighter camera. Only ₹15,000 more!'", opts: [{ l: 'My phone works fine, keep it', good: 1 }, { l: 'Pay a ₹1,500 deposit to reserve one', cost: 1500 }], fb: 'If it still works, you do not need the new model.' },
    { text: "'Premium Bicycle Bell 2.0, now with LED! ₹600'", opts: [{ l: 'Buy it', cost: 600 }, { l: 'My bell rings just fine', good: 1 }], fb: 'Upgrades should fix a real problem.' },
    { text: "'Upgrade your school bag to PRO edition! Same size, shinier. ₹2,000'", opts: [{ l: 'No thanks', good: 1 }, { l: 'Upgrade', cost: 2000, joy: 3 }], fb: 'Shiny is not the same as useful.' }
  ]
};
const SPAWNS = [
  { t: 'impulse', row: 40, c0: 95, c1: 118 }, { t: 'misleadingAd', row: 40, c0: 74, c1: 83 }, { t: 'fakeDiscount', row: 40, c0: 143, c1: 160 },
  { t: 'peer', row: 40, c0: 38, c1: 47 }, { t: 'subscription', row: 40, c0: 184, c1: 206 },
  { t: 'overspend', row: 35, c0: 184, c1: 200 }, { t: 'upgrade', row: 40, c0: 315, c1: 331 }, { t: 'scam', row: 40, c0: 229, c1: 240 },
  { t: 'fakeDiscount', row: 44, c0: 131, c1: 138 }, { t: 'misleadingAd', row: 40, c0: 210, c1: 219 }, { t: 'upgrade', row: 35, c0: 144, c1: 154 }, { t: 'peer', row: 40, c0: 268, c1: 287 }, { t: 'impulse', row: 40, c0: 342, c1: 358 }, { t: 'overspend', row: 25, c0: 177, c1: 206 }, 
];

/* ---------- Phone messages ---------- */
const MESSAGES = [
  { from: '+91 90xxx 44120', text: 'URGENT: Your bank KYC expires today. Share the OTP you receive to avoid account block.', scam: 1, loss: 1200, ex: 'Banks never ask for OTPs. Delete and report.' },
  { from: 'MegaLucky', text: 'Congratulations! You won ₹25,000 in our lucky draw. Pay ₹499 processing fee to claim.', scam: 1, loss: 499, ex: 'Real prizes never charge a fee to claim.' },
  { from: 'QuickJobs', text: 'Work from home, earn ₹3,000/day liking videos. Join now for ₹999 only!', scam: 1, loss: 999, ex: 'Real jobs never ask you to pay to join.' },
  { from: 'IndiaPost-Help', text: 'Your parcel is on hold. Pay ₹25 customs at bit.ly/ip-fee within 2 hours.', scam: 1, loss: 800, ex: 'Fake delivery links steal card details. Check on the official app instead.' },
  { from: 'Unknown', text: "Hi, it's your cousin, new number. Phone broke. Need ₹2,000 urgently on UPI, please don't tell Mum.", scam: 1, loss: 2000, ex: 'Secrecy plus urgency is a red flag. Call the old number to check.' },
  { from: 'CryptoKing', text: 'Double your money in 24 hours! Send ₹1,000, get ₹2,000 tomorrow. Guaranteed!', scam: 1, loss: 1000, ex: 'Guaranteed doubling does not exist. It is a scam every time.' },
  { from: 'MoneyWise Bank', text: 'Reminder: We will NEVER ask for your PIN, OTP or password. Stay safe!', scam: 0, ex: 'A genuine safety reminder with no request.' },
  { from: 'School Office', text: 'Exam timetable is up on the School notice board, ground floor.', scam: 0, ex: 'A normal notice. Nothing is being asked of you.' },
  { from: 'Transport Hub', text: 'New: monthly bus routes now stop at the Town Centre too. Plan your trips!', scam: 0, ex: 'Information only. Safe.' },
  { from: 'Library', text: 'Free comic day at the Education Centre library this week. Bring your library card!', scam: 0, ex: 'A genuine community message.' }
];

/* ---------- Random life events ---------- */
// fx functions get (S) the State object and return feedback text.
const EVENTS = [
  {
    id: 'phone', title: 'Cracked Screen!', text: 'You dropped your phone and the screen cracked. A repair costs ₹700.', emergency: 700,
    choices: [{ l: 'Repair it (pay ₹700)', pay: 700, cat: 'health', tag: 'need', fb: 'Fixed. Surprises like this are why emergency funds exist.' }, { l: 'Live with the crack', joy: -10, fb: 'You saved money, but every swipe is annoying.' }]
  },
  {
    id: 'fever', title: 'Feeling Unwell', text: 'You woke up with a fever. The clinic visit and medicine cost ₹450.', emergency: 450,
    choices: [{ l: 'Visit the clinic (pay ₹450)', pay: 450, cat: 'health', tag: 'need', hp: 15, fb: 'You feel better already. Health is always a need.' }, { l: 'Tough it out', hp: -25, fb: 'Skipping care made you weaker. Health costs are needs, not wants.' }]
  },
  {
    id: 'bday', title: "Friend's Birthday", text: "It's your best friend Priya's birthday party this evening. What gift will you bring?",
    choices: [{ l: 'A handmade card and snacks (₹60)', pay: 60, cat: 'gifts', tag: 'want', joy: 8, fb: 'Priya loved the card. Thoughtful beats expensive.' }, { l: 'A nice book (₹300)', pay: 300, cat: 'gifts', tag: 'want', joy: 8, fb: 'A lovely gift within budget.' }, { l: 'Designer perfume (₹1,200)', pay: 1200, cat: 'gifts', tag: 'want', joy: 9, fb: 'Generous, but it hurt your budget. The card would have made her just as happy.' }]
  },
  {
    id: 'found', title: 'Found Money', text: 'You find a ₹200 note on the pavement outside the Food Market.',
    choices: [{ l: 'Hand it to the market office', coins: 5, joy: 6, honest: 1, fb: 'The owner came back for it and thanked you. +5 coins for honesty!' }, { l: 'Keep it', cash: 200, fb: 'You kept it. Someone may have needed that money for food today.' }]
  },
  {
    id: 'gift', title: 'Gift from Grandma', text: 'Grandma sends you ₹500 for doing well at school!',
    choices: [{ l: 'Put it straight into savings', savings: 500, coins: 3, fb: 'Smart! Unexpected money is perfect for saving.' }, { l: 'Keep it as cash', cash: 500, fb: 'Nice! Try to give it a job before it disappears.' }]
  },
  {
    id: 'rain', title: 'Monsoon Downpour', text: 'Heavy rain all day! Without a raincoat you get soaked and catch a chill.', rain: 1,
    choices: [{ l: 'OK', fb: '' }]
  },
  {
    id: 'inflation', title: 'Prices Going Up', text: 'Vegetable and grain prices have risen 15% for the next 3 days. This is inflation: the same money buys less.',
    choices: [{ l: 'Understood', inflation: 3, fb: 'Plan meals, buy basics and keep a little extra for price changes.' }]
  },
  {
    id: 'trip', title: 'School Trip', text: 'The class trip to the science museum costs ₹400. You knew it was coming in your school diary!',
    choices: [{ l: 'Pay for the trip (₹400)', pay: 400, cat: 'education', tag: 'need', joy: 18, fb: 'What a day! Planned expenses never feel like a shock.' }, { l: 'Skip it', joy: -12, fb: 'You missed out. Known costs are easier when you set money aside early.' }]
  },
  {
    id: 'data', title: 'Data Pack Ending', text: 'Your phone data pack runs out tomorrow. You need it for online homework.',
    choices: [{ l: 'Basic pack ₹149', pay: 149, cat: 'other', tag: 'need', fb: 'The basic pack covers homework fine.' }, { l: 'Unlimited premium ₹449', pay: 449, cat: 'other', tag: 'want', joy: 4, fb: 'More data than you can use is a want, not a need.' }]
  },
  {
    id: 'dogwalk', title: 'Neighbour Needs Help', text: "Your neighbour asks you to walk her dog this evening. She'll pay ₹150.",
    choices: [{ l: 'Sure!', cash: 150, income: 1, joy: 4, fb: 'Earned ₹150 and made a furry friend.' }, { l: 'No thanks', fb: 'Maybe next time.' }]
  },
  {
    id: 'puncture', title: 'Flat Tyre', text: 'Your bicycle has a puncture. Repair costs ₹80.', needVehicle: 'bicycle', emergency: 80,
    choices: [{ l: 'Fix it (₹80)', pay: 80, cat: 'transport', tag: 'need', fb: 'Back on the road. Small running costs add up over time.' }]
  },
  {
    id: 'battery', title: 'Battery Service', text: 'Your vehicle battery needs a service. Cost: ₹400.', needVehicle: 'scooter|ev', emergency: 400,
    choices: [{ l: 'Pay for the service (₹400)', pay: 400, cat: 'transport', tag: 'need', fb: 'Electric vehicles still need care. Budget for it.' }]
  },
  {
    id: 'traffic', title: 'Traffic Check', text: 'A traffic officer checks riders for helmets.', needVehicle: 'bicycle|scooter', helmetCheck: 1,
    choices: [{ l: 'OK', fb: '' }]
  },
  {
    id: 'scholar', title: 'Scholarship Quiz', text: "The Education Centre offers a ₹800 scholarship. Question: if you save ₹250 a month, how much do you have after a year?", needMission: 'future',
    choices: [{ l: '₹2,500', fb: 'Not quite. 250 x 12 = 3,000.' }, { l: '₹3,000', cash: 800, income: 1, coins: 5, fb: 'Correct! You won the ₹800 scholarship.' }, { l: '₹3,250', fb: 'Not quite. 250 x 12 = 3,000.' }]
  },
  {
    id: 'festival', title: 'Festival Week!', text: 'It is festival week! Friends are dressing up for the celebration.',
    choices: [{ l: 'Join in (+joy, more if wearing the Festive Kurta)', festival: 1, fb: '' }]
  }
];

/* ---------- Gigs at the Opportunity Centre ---------- */
const GIGS = [
  { id: 'tutor', name: 'Tutor Time', pay: 200, desc: 'Help a junior with maths. Answer 3 questions (2 correct to get paid).' },
  { id: 'delivery', name: 'Delivery Dash', pay: 300, desc: 'Take a parcel to Librarian Leela at the Education Centre within 75 seconds. A vehicle helps!' },
  { id: 'recycle', name: 'Recycling Run', pay: 250, desc: 'Collect 5 bottles left around town today and bring them back here.' },
  { id: 'web', name: 'Web Helper', pay: 600, desc: 'Fix a shop website. Needs the Coding Club course.', needs: 'coding' },
  { id: 'fake1', name: 'Easy Money From Home!!', pay: 5000, fake: 1, fee: 999, desc: 'Earn ₹5,000 a day! Just pay ₹999 registration first.' },
  { id: 'fake2', name: 'Money Doubler Agent', pay: 4000, fake: 1, fee: 1500, desc: 'Send ₹1,500 today, get ₹3,000 tomorrow, guaranteed!' }
];

/* ---------- Side quests ---------- */
const SIDES = {
  piggy: { title: "Grandpa's Piggy Bank", coins: 8, item: 'laddoo', steps: [
    { t: 'say', text: 'Come, sit! When I was your age I saved coins in a clay piggy bank. Let me test your maths, beta.' },
    { t: 'quiz', q: 'If you save ₹30 every day for 30 days, how much do you save?', opts: ['₹300', '₹900', '₹3,000'], a: 1, ex: '30 x 30 = 900. Small daily habits make big totals.' },
    { t: 'quiz', q: 'If you also skip three ₹60 cafe treats, how much MORE do you save?', opts: ['₹60', '₹180', '₹600'], a: 1, ex: '3 x 60 = 180. Every skipped impulse is money kept.' }] },
  guard: { title: "Sam's Safety Tips", coins: 6, steps: [
    { t: 'say', text: 'I guard the bank, but YOU guard your PIN. Quick quiz!' },
    { t: 'quiz', q: 'Someone behind you at the ATM is watching. You should...', opts: ['Cover the keypad while typing your PIN', 'Ask them to help'], a: 0, ex: 'Always shield your PIN.' },
    { t: 'quiz', q: 'Your ATM card is stuck and a stranger offers help. You...', opts: ['Tell them your PIN', 'Call the bank helpline printed on the machine'], a: 1, ex: 'Only use official help numbers.' },
    { t: 'quiz', q: 'A good PIN is...', opts: ['1234', 'Your birthday', 'A random number nobody could guess'], a: 2, ex: 'Avoid easy patterns and dates.' }] },
  garden: { title: 'Grow or Buy?', coins: 6, item: 'mint', steps: [
    { t: 'say', text: 'Welcome to my rooftop garden! A packet of mint seeds costs ₹40 and grows for months.' },
    { t: 'quiz', q: 'Buying mint costs ₹20 a week. Over 8 weeks, how much would growing it save?', opts: ['₹40', '₹120', '₹160'], a: 1, ex: 'Buying: 8 x 20 = 160. Growing: 40. Saving: 120.' }] },
  diary: { title: 'Budget Diary', coins: 6, steps: [] },
  wallet: { title: 'The Lost Wallet', coins: 8 }
};

const TIPS = [
  'Save first, spend what is left.',
  'Hungry? Eat before you shop. Hungry shoppers overspend.',
  'Wait 24 hours before buying any want over ₹500.',
  'Never share your OTP or PIN. Not even with "the bank".',
  'Compare unit prices, not just sticker prices.',
  'Free fun exists: parks, libraries and benches cost nothing.',
  'Check your subscriptions every week.',
  'An emergency fund turns a crisis into an inconvenience.',
  'Vehicles cost money every day, not just on the day you buy them.',
  'Small daily savings add up to big goals.'
];
