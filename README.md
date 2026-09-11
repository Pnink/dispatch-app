# The Nink Saga

An always-on-top desktop RPG: real-world goals (business, training, brand, learning) are tracked as daily quests that earn XP and Ryō, driving a 15-tier rank ladder, a full equipment and shop economy, and a 20-chapter Naruto-inspired Story Mode with turn-based battles. Daily quests are the engine — the game itself (gear, your character, the map, the wheel) is the thing you open and play.

All data — ranks, quests, the 156-item catalog, 20 chapters, skills, the World Map, and all 28 characters — is transcribed from the game's design reference doc.

## Setup

```bash
npm install
npm start
```

Progress is saved automatically to a local JSON file in the app's user data directory — no account or network access required.

## Use

- Press **Ctrl+Shift+Space** (or **Cmd+Shift+Space** on macOS) to show/hide the window from anywhere, or click the tray/menu bar icon.
- **Daily Quests**: 4 core quests every day, 3 rotating simple quests (same 3 all day, changing tomorrow, seeded by date), and occasionally a 5th "hard challenge" quest. Completing one earns XP, Ryō, and stat progress, and builds your daily streak.
- **Story Mode**: 20 chapters, each rank-gated and unlocked in order. Click through each chapter's story beats, then fight the chapter boss — tap Attack, or spend limited-use skill charges unlocked by clearing earlier chapters — to clear it and unlock the next. Chapter 20 is a capstone "Become Hokage" once all others are cleared and you've reached Kage rank.
- **Character**: your avatar, built live from whatever you have equipped across all 10 gear slots (headband, headwear, expression, top, bottom, footwear, gloves, weapon, accessory, summon), plus free hair customization (6 styles × 6 colors).
- **Shop**: browse the full item catalog by family (headbands, hats, tops, bottoms, footwear, gloves, kunai, shuriken, other weapons, accessories, summons), gated by rank tier and — for village-exclusive gear — by where you currently are on the map. Every rank-up earns a free item claim.
- **World Map**: travel between the 6 villages in real elapsed time (it keeps counting even with the app closed) to unlock village-exclusive shop items, plus 10 flavor-only landmarks with lore.
- **Daily Draw**: one wheel spin per day — mostly Ryō/XP, a rare shop-item jackpot on Mon/Wed/Fri, and an even rarer Mythic-artifact slot on the 1st/8th/15th/22nd of the month.
- **People**: all 28 story characters, unlocking as you reach their chapter and evolving through their story stages as you clear later chapters.
- **Achievements**: streaks, quests completed, rank milestones, life-goal arcs, gear collection, currency/wheel, and story milestones — all update automatically.

### Scope notes

Combat follows the design doc's formula literally (`weaponDamage + assistDamage`, doubled on crit; boss retaliation reduced by your shield) using your actually-equipped gear — there's no scripted difficulty curve standing in for it. Early chapters are winnable on the starter kit alone; the harder late-game fights are meant to need real gear investment and skill charges, same as the source design.

The avatar is a clean stylized "block ninja" built from simple shapes and tinted by your gear's color fields — it reflects every equip slot and expression, but it's not hand-illustrated game art (the design doc itself notes the 2D version's look isn't meant to be preserved 1:1 anyway).

Closing the window just hides it — quit via the tray menu's "Quit" item.
