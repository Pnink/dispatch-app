// The Nink Saga — People / Characters tab (section 11), 28 characters.
// Each becomes visible once the player reaches `unlockChapter`. `stages` is the
// chronological status-stage list; `after` on stage i>0 is the chapter number
// that must be CLEARED for that stage to show (stage 0 has no `after` — it's
// the default once the character is visible). The doc gives status text
// verbatim but not exact per-stage chapter gates beyond a few examples
// (e.g. "Sasuke's status changes 4 times") — gates below are placed at the
// story beat that doc's chapter blurbs/beats describe that turn happening.

const PEOPLE = [
  { id: 'iruka', name: 'Iruka Sensei', unlockChapter: 1, stages: [
    { text: 'Your Academy instructor — proud of you despite the failed exam.' },
  ] },
  { id: 'mizuki', name: 'Mizuki', unlockChapter: 1, stages: [
    { text: 'A rogue instructor working with Orochimaru.' },
    { text: 'Defeated and exposed as a traitor.', after: 1 },
  ] },
  { id: 'konohamaru', name: 'Konohamaru Sarutobi', unlockChapter: 1, stages: [
    { text: 'The Third Hokage’s grandson — desperate to be seen as more than that.' },
    { text: 'Covers for you at the podium — a real Leaf ninja now.', after: 20 },
  ] },
  { id: 'kakashi', name: 'Kakashi Hatake', unlockChapter: 1, stages: [
    { text: 'Your jōnin sensei — perpetually late, sharingan hidden under his headband.' },
    { text: 'The Sixth Hokage, about to step down.', after: 20 },
  ] },
  { id: 'sasuke', name: 'Sasuke Uchiha', unlockChapter: 1, stages: [
    { text: 'Teammate and rival — cold, driven, chasing his brother’s shadow.' },
    { text: 'Defected to Orochimaru, chasing power.', after: 7 },
    { text: 'Declared himself the world’s enemy.', after: 16 },
    { text: 'Walking back from the edge — reconciled, scarred, changed.', after: 18 },
  ] },
  { id: 'sakura', name: 'Sakura Haruno', unlockChapter: 1, stages: [
    { text: 'Teammate — still finding her footing.' },
    { text: 'A capable medical ninja in her own right.', after: 6 },
  ] },
  { id: 'tazuna', name: 'Tazuna', unlockChapter: 2, stages: [
    { text: 'The bridge builder you were hired to protect — stubborn, grateful.' },
  ] },
  { id: 'zabuza', name: 'Zabuza Momochi', unlockChapter: 2, stages: [
    { text: 'The Demon of the Hidden Mist — a rogue swordsman blocking the bridge.' },
    { text: 'Fell turning on his corrupt employer — buried beside Haku.', after: 2 },
  ] },
  { id: 'haku', name: 'Haku', unlockChapter: 2, stages: [
    { text: 'Zabuza’s masked apprentice — deadly, gentler than he lets on.' },
    { text: 'Gave his life for Zabuza — remembered on the bridge.', after: 2 },
  ] },
  { id: 'orochimaru', name: 'Orochimaru', unlockChapter: 3, stages: [
    { text: 'A rogue Sannin testing Chūnin Exam candidates for his own ends.' },
    { text: 'Struck down by his own student, Sasuke.', after: 11 },
  ] },
  { id: 'gaara', name: 'Gaara of the Sand', unlockChapter: 3, stages: [
    { text: 'The Sand’s Jinchūriki — isolated, dangerous, defined by a beast he never chose.' },
    { text: 'Changed by defeat — starting to understand what strength is for.', after: 5 },
    { text: 'The Kazekage — the Sand’s own, saved and returned home.', after: 8 },
  ] },
  { id: 'rocklee', name: 'Rock Lee', unlockChapter: 3, stages: [
    { text: 'A taijutsu specialist who can’t use ninjutsu or genjutsu — makes up for it in guts.' },
  ] },
  { id: 'neji', name: 'Neji Hyuga', unlockChapter: 3, stages: [
    { text: 'A Hyūga genius, boxed in by his clan’s caged-bird fate.' },
    { text: 'Gave his life shielding you on the battlefield.', after: 15 },
  ] },
  { id: 'hiruzen', name: 'Hiruzen Sarutobi', unlockChapter: 3, stages: [
    { text: 'The Third Hokage — kind, but carrying the village’s hardest decisions.' },
    { text: 'Died sealing away Orochimaru’s arms to save the village.', after: 5 },
  ] },
  { id: 'jiraiya', name: 'Jiraiya of the Sannin', unlockChapter: 4, stages: [
    { text: 'The Toad Sage — your teacher, a legendary pervert, secretly brilliant.' },
    { text: 'Died uncovering the truth about Pain — his final message saved the village.', after: 11 },
  ] },
  { id: 'tsunade', name: 'Tsunade', unlockChapter: 6, stages: [
    { text: 'A legendary Sannin and medic — reluctant to become Fifth Hokage.' },
    { text: 'The Fifth Hokage — sharp-tongued, fiercely protective of the Leaf.', after: 6 },
  ] },
  { id: 'kabuto', name: 'Kabuto Yakushi', unlockChapter: 6, stages: [
    { text: 'A spy posing as a medic — Orochimaru’s right hand.' },
    { text: 'Freed from his own reanimation jutsu — walking away from the war.', after: 15 },
  ] },
  { id: 'sasori', name: 'Sasori', unlockChapter: 8, stages: [
    { text: 'An Akatsuki puppeteer — once of the Sand, now a defector with a poisoned army.' },
  ] },
  { id: 'chiyo', name: 'Chiyo', unlockChapter: 8, stages: [
    { text: 'A Sand elder — gave her life reviving Gaara.' },
  ] },
  { id: 'itachi', name: 'Itachi Uchiha', unlockChapter: 11, stages: [
    { text: 'Sasuke’s older brother — branded a mass murderer, hiding a truth only he carried.' },
    { text: 'Died protecting the village’s secret, and Sasuke, to the very end.', after: 11 },
  ] },
  { id: 'hinata', name: 'Hinata Hyuga', unlockChapter: 12, stages: [
    { text: 'A quiet, steady presence — braver than she gives herself credit for.' },
    { text: 'Stood between you and Pain without hesitation.', after: 12 },
    { text: 'Your wife.', after: 19 },
  ] },
  { id: 'nagato', name: 'Nagato (Pain)', unlockChapter: 12, stages: [
    { text: 'The Akatsuki’s leader — a broken student of Jiraiya’s, chasing peace through pain.' },
    { text: 'Gave his life to undo the damage he caused Konoha.', after: 12 },
  ] },
  { id: 'danzo', name: 'Danzo Shimura', unlockChapter: 13, stages: [
    { text: 'The Leaf’s shadow — ambitious, ruthless, self-appointed Hokage.' },
  ] },
  { id: 'obito', name: 'Obito Uchiha', unlockChapter: 16, stages: [
    { text: 'The masked man behind the Akatsuki’s true plan — presumed dead for decades.' },
    { text: 'Broke free of Madara’s plan — died helping end it.', after: 17 },
  ] },
  { id: 'madara', name: 'Madara Uchiha', unlockChapter: 16, stages: [
    { text: 'The legendary Uchiha founder, reanimated in his prime — the war’s true architect.' },
  ] },
  { id: 'guy', name: 'Might Guy', unlockChapter: 17, stages: [
    { text: 'Kakashi’s eternal rival — opened all Eight Gates to hold the line.' },
  ] },
  { id: 'kaguya', name: 'Kaguya Otsutsuki', unlockChapter: 17, stages: [
    { text: 'The primordial ancestor of chakra itself — sealed away once, rising again.' },
  ] },
  { id: 'toneri', name: 'Toneri Otsutsuki', unlockChapter: 19, stages: [
    { text: 'A descendant of Kaguya, isolated on the moon, convinced he’s protecting the world.' },
  ] },
];
