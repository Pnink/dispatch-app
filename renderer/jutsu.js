// The Nink Saga — Jutsu system. 21 jutsu across 4 unlock paths:
//   story    (7) — permanently unlocked once the linked chapter is CLEARED.
//   mentor   (7) — unlocked by meeting the right person in the People tab
//                  (any one of `unlock.persons` reached is enough).
//   rank     (4) — unlocked automatically on reaching a rank tier, no story tie.
//   forbidden(3) — ultra-rare, Daily Draw wheel-only grants (see world.js
//                  WHEEL_FORBIDDEN_DAYS/CHANCE and app.js applyWheelSlotResult).
//
// Each entry has at most one of:
//   `battle`  — usable as an action in combat. `kind` is one of:
//               'attack' (damage = baseDamage * multiplier, crit-eligible),
//               'heal'   (restores healPercent of max HP),
//               'debuff' (reduces the boss's damage for the rest of the fight),
//               'stun'   (skips the boss's next counter-attack, no damage dealt),
//               'nuke'   (huge attack that also costs the player HP),
//               'summon' (no direct damage; boosts all attack damage for the
//                         rest of the fight).
//               All battle kinds are limited by `usesPerBattle`.
//   `passive` — a permanent combat stat bonus, folded into computeCombatStats().
//               { stat: 'maxHp'|'weaponDamage'|'critChance'|'shield',
//                 mode: 'percent'|'flat', value }
//   `utility` — a non-combat effect. Currently only `{ effect: 'travelSpeed', value }`
//               (fractional reduction in travel time), applied in startTravel().

const JUTSU = [
  // ---- Story-unlocked (7) — clearing the chapter teaches the jutsu ----
  { id: 'skill-clone', name: 'Multi-Shadow Clone Jutsu', icon: '👥', category: 'story',
    unlock: { type: 'chapter', chapter: 1 },
    battle: { kind: 'attack', multiplier: 2, usesPerBattle: 2 },
    desc: 'Flood the field with shadow clones to overwhelm the enemy.' },
  { id: 'skill-toad', name: 'Toad Summoning', icon: '🐸', category: 'story',
    unlock: { type: 'chapter', chapter: 4 },
    battle: { kind: 'attack', multiplier: 2.5, usesPerBattle: 2 },
    desc: 'Summon a toad ally to crush the enemy underfoot.' },
  { id: 'skill-rasengan', name: 'Rasengan', icon: '🌀', category: 'story',
    unlock: { type: 'chapter', chapter: 6 },
    battle: { kind: 'attack', multiplier: 3, usesPerBattle: 2 },
    desc: 'A spiraling orb of pure chakra, slammed in at point-blank range.' },
  { id: 'skill-rasenshuriken', name: 'Wind Style: Rasenshuriken', icon: '💠', category: 'story',
    unlock: { type: 'chapter', chapter: 10 },
    battle: { kind: 'attack', multiplier: 4, usesPerBattle: 1 },
    desc: 'Wind-nature chakra folded into the Rasengan — devastating, exhausting.' },
  { id: 'skill-sage', name: 'Sage Mode', icon: '🍃', category: 'story',
    unlock: { type: 'chapter', chapter: 12 },
    battle: { kind: 'attack', multiplier: 3.5, usesPerBattle: 2 },
    desc: 'Natural energy sharpens every strike.' },
  { id: 'skill-kurama', name: 'Nine-Tails Chakra Mode', icon: '🦊', category: 'story',
    unlock: { type: 'chapter', chapter: 14 },
    battle: { kind: 'attack', multiplier: 4.5, usesPerBattle: 2 },
    desc: "The Nine-Tails' chakra cloaks you in overwhelming power." },
  { id: 'skill-sixpaths', name: 'Six Paths Sage Mode', icon: '☯️', category: 'story',
    unlock: { type: 'chapter', chapter: 18 },
    battle: { kind: 'attack', multiplier: 6, usesPerBattle: 1 },
    desc: "The Sage of Six Paths' power, inherited at last." },

  // ---- Mentor-taught (7) — unlocked by meeting the person, no chapter clear needed ----
  { id: 'jutsu-chakra-control', name: 'Chakra Control Mastery', icon: '💠', category: 'mentor',
    unlock: { type: 'person', persons: ['kakashi'] },
    passive: { stat: 'maxHp', mode: 'percent', value: 0.10 },
    desc: 'Kakashi drills you on precise chakra control. +10% max HP in battle.' },
  { id: 'jutsu-water-walking', name: 'Water Walking', icon: '💧', category: 'mentor',
    unlock: { type: 'person', persons: ['kakashi'] },
    utility: { effect: 'travelSpeed', value: 0.25 },
    desc: 'Walk on water like solid ground. Travel between villages 25% faster.' },
  { id: 'jutsu-taijutsu-combo', name: 'Taijutsu Combo Training', icon: '👊', category: 'mentor',
    unlock: { type: 'person', persons: ['rocklee', 'guy'] },
    passive: { stat: 'weaponDamage', mode: 'percent', value: 0.15 },
    desc: 'Guy and Lee drill your fists and footwork raw. +15% weapon damage.' },
  { id: 'jutsu-medical', name: 'Medical Ninjutsu Basics', icon: '🩹', category: 'mentor',
    unlock: { type: 'person', persons: ['tsunade', 'sakura'] },
    battle: { kind: 'heal', healPercent: 0.3, usesPerBattle: 1 },
    desc: 'Mend your own wounds mid-battle. Heals 30% of max HP once per fight.' },
  { id: 'jutsu-puppet-insight', name: 'Puppet Technique Insight', icon: '🎭', category: 'mentor',
    unlock: { type: 'person', persons: ['sasori', 'chiyo'] },
    battle: { kind: 'debuff', dmgReduction: 0.3, usesPerBattle: 1 },
    desc: "Spot the strings. Weakens the boss's attacks by 30% for the rest of the fight." },
  { id: 'jutsu-byakugan', name: 'Byakugan Perception', icon: '👁️', category: 'mentor',
    unlock: { type: 'person', persons: ['neji', 'hinata'] },
    passive: { stat: 'critChance', mode: 'flat', value: 0.15 },
    desc: "See the enemy's every opening. +15% crit chance." },
  { id: 'jutsu-shadow-possession', name: 'Shadow-Possession Tactics', icon: '🌑', category: 'mentor',
    unlock: { type: 'person', persons: ['shikamaru'] },
    battle: { kind: 'stun', usesPerBattle: 1 },
    desc: 'Pin the boss in your shadow, freezing them — skip their next attack entirely.' },

  // ---- Rank-unlocked (4) — no story tie, just reaching the tier ----
  { id: 'jutsu-kunai-mastery', name: 'Kunai Mastery', icon: '🔪', category: 'rank',
    unlock: { type: 'rank', tier: 4 },
    passive: { stat: 'weaponDamage', mode: 'percent', value: 0.10 },
    desc: 'Years of drills sharpen your throw. +10% weapon damage.' },
  { id: 'jutsu-tactical-analysis', name: 'Tactical Analysis', icon: '🧠', category: 'rank',
    unlock: { type: 'rank', tier: 7 },
    passive: { stat: 'critChance', mode: 'flat', value: 0.10 },
    desc: 'Read the fight a step ahead. +10% crit chance.' },
  { id: 'jutsu-combat-mastery', name: 'Combat Mastery', icon: '🛡️', category: 'rank',
    unlock: { type: 'rank', tier: 10 },
    passive: { stat: 'shield', mode: 'flat', value: 15 },
    desc: 'Hard-earned battle instinct. +15 flat shield.' },
  { id: 'jutsu-kage-reserve', name: 'Kage Chakra Reserve', icon: '🔥', category: 'rank',
    unlock: { type: 'rank', tier: 13 },
    passive: { stat: 'maxHp', mode: 'percent', value: 0.25 },
    desc: 'A reserve of chakra fit for a Kage. +25% max HP.' },

  // ---- Forbidden Jutsu (3) — ultra-rare, Daily Draw wheel only ----
  { id: 'jutsu-reaper-seal', name: 'Reaper Death Seal', icon: '💀', category: 'forbidden',
    unlock: { type: 'wheel' },
    battle: { kind: 'nuke', multiplier: 10, selfDamagePercent: 0.4, usesPerBattle: 1 },
    desc: 'A forbidden technique that rips the boss from the world of the living — at a brutal personal cost.' },
  { id: 'jutsu-edo-tensei', name: 'Summoning: Edo Tensei', icon: '⚰️', category: 'forbidden',
    unlock: { type: 'wheel' },
    battle: { kind: 'summon', bonusMultiplier: 0.5, usesPerBattle: 1 },
    desc: 'Bring a reanimated ally into the fight. +50% damage on every attack for the rest of the battle.' },
  { id: 'jutsu-chibaku-tensei', name: 'Six Paths: Chibaku Tensei', icon: '🪐', category: 'forbidden',
    unlock: { type: 'wheel' },
    battle: { kind: 'attack', multiplier: 12, usesPerBattle: 1 },
    desc: 'Crush the battlefield beneath a gravitational sphere. Devastating, and exceptionally rare.' },
];

const FORBIDDEN_JUTSU_IDS = JUTSU.filter((j) => j.category === 'forbidden').map((j) => j.id);

const JUTSU_CATEGORY_ORDER = ['story', 'mentor', 'rank', 'forbidden'];
const JUTSU_CATEGORY_LABELS = { story: 'Story-Unlocked', mentor: 'Mentor-Taught', rank: 'Rank-Unlocked', forbidden: 'Forbidden Jutsu' };
const JUTSU_CATEGORY_COLORS = { story: '#dba64c', mentor: '#4f8fd1', rank: '#5fb88a', forbidden: '#c199e8' };
