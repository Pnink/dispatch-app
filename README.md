# The Nink Saga — Progress Tracker

An always-on-top desktop companion for **The Nink Saga**, a life-gamification RPG: real-world goals (business, training, brand, learning) are tracked as daily quests that earn XP and Ryō, driving a 15-tier rank ladder and a 20-chapter Naruto-inspired Story Mode.

Data (ranks, quests, chapters, skills) is transcribed from the game's design reference doc. This is a standalone tracker/task-completer — it does not include the shop, equipment, world map travel, or Daily Draw wheel from the full game design; combat power in Story Mode battles scales with your rank tier and cleared-chapter skill unlocks instead of gear.

## Setup

```bash
npm install
npm start
```

Progress is saved automatically to a local JSON file in the app's user data directory — no account or network access required.

## Use

- Press **Ctrl+Shift+Space** (or **Cmd+Shift+Space** on macOS) to show/hide the window from anywhere.
- Or click the tray/menu bar icon.
- **Daily Quests**: 4 core quests every day, 3 rotating simple quests (same 3 all day, changing tomorrow), and occasionally a 5th "hard challenge" quest. Check one off to earn XP, Ryō, and stat progress.
- **Story Mode**: 20 chapters, each rank-gated and unlocked in order. Click through each chapter's story beats, then fight the chapter boss (tap Attack, or spend unlocked skill uses) to clear it and unlock the next.
- **Achievements**: streaks, total quests completed, rank milestones, and story milestones update automatically.

Closing the window just hides it — quit via the tray menu's "Quit" item.
