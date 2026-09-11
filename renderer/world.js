// The Nink Saga — World Map (section 8) and Daily Draw wheel (section 7) data.

const VILLAGES = [
  { id: 'leaf', name: 'Konohagakure', daysFromLeaf: 0, terrain: 'home turf, forested valleys' },
  { id: 'rain', name: 'Amegakure', daysFromLeaf: 1, terrain: 'a soggy trek through rain-soaked forest' },
  { id: 'sand', name: 'Sunagakure', daysFromLeaf: 2, terrain: 'a long crossing through open desert' },
  { id: 'stone', name: 'Iwagakure', daysFromLeaf: 3, terrain: 'a hard climb through rocky highlands' },
  { id: 'mist', name: 'Kirigakure', daysFromLeaf: 4, terrain: 'a foggy sea crossing by boat' },
  { id: 'cloud', name: 'Kumogakure', daysFromLeaf: 5, terrain: 'a brutal climb through storm-wracked mountains' },
];

const LANDMARKS = [
  { id: 'valley', name: 'Valley of the End', lore: 'A canyon carved clean by two colliding jutsu, waterfall roaring between two colossal statues.' },
  { id: 'forest', name: 'Forest of Death', lore: 'A fenced-off jungle outside Leaf, thick with oversized wildlife and worse smells.' },
  { id: 'waves', name: 'Land of Waves', lore: 'A small fishing nation linked to the mainland by one long, hard-won bridge.' },
  { id: 'tenchi', name: 'Tenchi Bridge', lore: 'A river crossing on the road between Leaf and the western mountains.' },
  { id: 'myoboku', name: 'Mount Myōboku', lore: 'A hidden sanctuary in the highlands, said to be home to a nation of toads.' },
  { id: 'ryuchi', name: 'Ryūchi Cave', lore: 'A deep cavern in the northern mountains, home to something old and scaled.' },
  { id: 'turtle', name: 'Turtle Island', lore: 'A small island off the northeast coast, shaped a little too much like a turtle.' },
  { id: 'iron', name: 'Land of Iron', lore: 'A snowbound nation of samurai, fiercely neutral in shinobi affairs.' },
  { id: 'waterfall', name: 'Hidden Waterfall Village', lore: 'A minor village tucked behind a waterfall between Leaf and Stone.' },
  { id: 'tanzaku', name: 'Tanzaku Town', lore: 'A hot-springs town on the road south of Leaf, popular with gamblers.' },
];

function travelDaysBetween(fromId, toId) {
  if (fromId === toId) return 0;
  const from = VILLAGES.find((v) => v.id === fromId);
  const to = VILLAGES.find((v) => v.id === toId);
  if (fromId === 'leaf') return to.daysFromLeaf;
  if (toId === 'leaf') return from.daysFromLeaf;
  return from.daysFromLeaf + to.daysFromLeaf; // routed through Leaf as a hub
}

// 7.1 Base pool — 20 Ryō values (10-420) and 10 XP values (200-3,000).
// Smaller amounts weighted far more likely: geometric decay by pool position.
const WHEEL_RYO_VALUES = [10, 20, 30, 45, 60, 80, 100, 120, 150, 180, 210, 240, 270, 300, 330, 360, 385, 400, 410, 420];
const WHEEL_XP_VALUES = [200, 350, 500, 700, 900, 1200, 1500, 1900, 2400, 3000];

// 7.2 Bonus item slot — Mon/Wed/Fri, 5% chance, rarity-weighted pick.
const WHEEL_BONUS_DAYS = [1, 3, 5]; // Date#getDay(): 0=Sun..6=Sat
const WHEEL_BONUS_CHANCE = 0.05;
const WHEEL_BONUS_RARITY_WEIGHTS = { common: 40, uncommon: 25, rare: 15, epic: 12, legendary: 8 };

// 7.3 Mythic slot — 1st/8th/15th/22nd of the month, 1% combined chance.
const WHEEL_MYTHIC_DAYS = [1, 8, 15, 22];
const WHEEL_MYTHIC_CHANCE = 0.01;

// 7.4 Forbidden Jutsu slot — 5th/12th/19th/26th of the month, 0.5% combined
// chance. Rarer than the mythic-item slot; grants one of the 3 wheel-only
// Forbidden Jutsu (see jutsu.js, category: 'forbidden').
const WHEEL_FORBIDDEN_DAYS = [5, 12, 19, 26];
const WHEEL_FORBIDDEN_CHANCE = 0.005;
