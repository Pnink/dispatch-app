// The Nink Saga — game data, transcribed from the design reference doc.
// Ranks, quests, story chapters, and skills. Numbers are the source of truth;
// keep them in sync with the design doc if it changes.

const NINK_DATA = {
  ranks: [
    { tier: 0, name: 'Low Academy Student', xp: 0 },
    { tier: 1, name: 'Academy Student', xp: 7000 },
    { tier: 2, name: 'High Academy Student', xp: 58000 },
    { tier: 3, name: 'Low Genin', xp: 197000 },
    { tier: 4, name: 'Genin', xp: 466000 },
    { tier: 5, name: 'High Genin', xp: 911000 },
    { tier: 6, name: 'Low Chūnin', xp: 1574000 },
    { tier: 7, name: 'Chūnin', xp: 2500000 },
    { tier: 8, name: 'High Chūnin', xp: 3732000 },
    { tier: 9, name: 'Low Jōnin', xp: 5313000 },
    { tier: 10, name: 'Jōnin', xp: 7289000 },
    { tier: 11, name: 'High Jōnin', xp: 9698000 },
    { tier: 12, name: 'Low Kage', xp: 12595000 },
    { tier: 13, name: 'Kage', xp: 16009000 },
    { tier: 14, name: 'High Kage', xp: 20000000 },
  ],

  // Always shown, all 4 every day.
  coreQuests: [
    { id: 'core-1', title: 'Put in one focused hour on your business', stat: 'business', xp: 500, ryo: 12 },
    { id: 'core-2', title: 'Train — soccer practice, touches, or a fitness session', stat: 'body', xp: 500, ryo: 12 },
    { id: 'core-3', title: 'Create or post one piece of Nink content', stat: 'brand', xp: 500, ryo: 12 },
    { id: 'core-4', title: 'Learn one new business, investing, or crypto term and use it in a sentence', stat: 'mind', xp: 300, ryo: 8 },
  ],

  // Rotating pool of 16 — 3 shown per day, seeded by date, no Ryō.
  simpleQuests: [
    { id: 'simple-1', title: 'No mindless phone scrolling today — catch yourself and put it down', stat: 'mind', xp: 60 },
    { id: 'simple-2', title: 'Stay productive through the whole day, no dead stretches', stat: 'business', xp: 60 },
    { id: 'simple-3', title: 'Eat healthy today — no junk, no skipped meals', stat: 'body', xp: 60 },
    { id: 'simple-4', title: 'Get 8 hours of sleep last night', stat: 'body', xp: 80 },
    { id: 'simple-5', title: 'Go for a run', stat: 'body', xp: 100 },
    { id: 'simple-6', title: 'Study or review for a test — stay ahead in school', stat: 'mind', xp: 70 },
    { id: 'simple-7', title: 'Drink enough water today', stat: 'body', xp: 50 },
    { id: 'simple-8', title: 'Stretch or do some mobility work', stat: 'body', xp: 50 },
    { id: 'simple-9', title: 'Read for 15 minutes', stat: 'mind', xp: 50 },
    { id: 'simple-10', title: 'Make your bed and start the day with a small win', stat: 'business', xp: 60 },
    { id: 'simple-11', title: "Knock out one annoying chore or errand you've been putting off", stat: 'business', xp: 60 },
    { id: 'simple-12', title: 'Save or jot down one content idea for later, even a bad one', stat: 'brand', xp: 50 },
    { id: 'simple-13', title: 'Put in a second hour of focused business work, beyond your usual block', stat: 'business', xp: 120 },
    { id: 'simple-14', title: 'Do a longer session today — go past your normal stopping point', stat: 'body', xp: 110 },
    { id: 'simple-15', title: 'Spend 30 extra minutes learning something useful, beyond the basics', stat: 'mind', xp: 90 },
    { id: 'simple-16', title: 'Reach out to one potential customer or contact today', stat: 'business', xp: 100 },
  ],

  // Rare pool of 8 — ~1 in 5 days, seeded, shown 5th with fire styling.
  hardQuests: [
    { id: 'hard-1', title: 'Put in 3 full focused hours on your business today, no distractions', stat: 'business', xp: 1400, ryo: 60 },
    { id: 'hard-2', title: 'Reach out to 5 potential customers or contacts today', stat: 'business', xp: 1200, ryo: 55 },
    { id: 'hard-3', title: 'Do a full extra workout session beyond your normal one', stat: 'body', xp: 1300, ryo: 55 },
    { id: 'hard-4', title: 'No phone for the first 2 hours and last 2 hours of your day', stat: 'mind', xp: 1100, ryo: 50 },
    { id: 'hard-5', title: 'Read 30+ pages of a book, start to finish in one sitting', stat: 'mind', xp: 1000, ryo: 45 },
    { id: 'hard-6', title: "Ship something today — publish, launch, or send whatever you've been sitting on", stat: 'brand', xp: 1250, ryo: 55 },
    { id: 'hard-7', title: 'Track every dollar you spend today, no exceptions', stat: 'business', xp: 1000, ryo: 45 },
    { id: 'hard-8', title: "Have a real, honest conversation with someone about where you're headed", stat: 'body', xp: 1150, ryo: 50 },
  ],

  // 7 skills — permanently unlocked once the linked chapter is CLEARED.
  skills: [
    { id: 'skill-clone', name: 'Multi-Shadow Clone Jutsu', unlocksAfterChapter: 1, multiplier: 2, usesPerBattle: 2 },
    { id: 'skill-toad', name: 'Toad Summoning', unlocksAfterChapter: 4, multiplier: 2.5, usesPerBattle: 2 },
    { id: 'skill-rasengan', name: 'Rasengan', unlocksAfterChapter: 6, multiplier: 3, usesPerBattle: 2 },
    { id: 'skill-rasenshuriken', name: 'Wind Style: Rasenshuriken', unlocksAfterChapter: 10, multiplier: 4, usesPerBattle: 1 },
    { id: 'skill-sage', name: 'Sage Mode', unlocksAfterChapter: 12, multiplier: 3.5, usesPerBattle: 2 },
    { id: 'skill-kurama', name: 'Nine-Tails Chakra Mode', unlocksAfterChapter: 14, multiplier: 4.5, usesPerBattle: 2 },
    { id: 'skill-sixpaths', name: 'Six Paths Sage Mode', unlocksAfterChapter: 18, multiplier: 6, usesPerBattle: 1 },
  ],

  // 20 story chapters. beatXp/beatRyo apply per beat (150 XP + 10 Ryō each, per spec).
  beatXp: 150,
  beatRyo: 10,
  chapters: [
    {
      num: 1, title: 'The Academy Graduation', boss: 'Mizuki', bossHp: 300, bossDmg: 12, unlockTier: 0,
      xp: 2000, ryo: 80, mapLocation: 'leaf',
      blurb: 'Tricked by Mizuki into stealing the Sacred Scroll, you learn the Multi-Shadow Clone Jutsu and defend Iruka Sensei.',
      beats: [
        'Chase Tora the cat across the Konoha rooftops one more time.',
        'Dodge Konohamaru’s surprise ambush in the village square.',
        'Iruka pulls you aside after the exam — Mizuki has a "proposition."',
      ],
    },
    {
      num: 2, title: 'The Land of Waves', boss: 'Haku', bossHp: 500, bossDmg: 18, unlockTier: 1,
      xp: 3000, ryo: 110, mapLocation: 'waves',
      blurb: 'Team 7 escorts Tazuna past the Demon Brothers, Zabuza, and his masked apprentice Haku on the mist-covered bridge.',
      beats: [
        'Take on the escort mission and bring the traveler, Tazuna, with you out of the Land of Fire.',
        'Fight off the Demon Brothers’ ambush on the road.',
        'Complete tree-climbing training to sharpen your chakra control before the bridge.',
      ],
    },
    {
      num: 3, title: 'The Chūnin Selection Exams', boss: 'Orochimaru (disguised)', bossHp: 700, bossDmg: 22, unlockTier: 2,
      xp: 4200, ryo: 140, mapLocation: 'forest',
      blurb: 'The Forest of Death, a curse mark from Orochimaru, and brutal 1v1 preliminaries thin the crowded roster.',
      beats: [
        'Pass the written test without getting caught cheating.',
        'Survive the Forest of Death and secure the missing scroll.',
        'Watch Rock Lee fall to Gaara’s sand in the preliminaries — you’re up next.',
      ],
    },
    {
      num: 4, title: 'The One-Month Training Interval', boss: 'Trial Toad', bossHp: 650, bossDmg: 20, unlockTier: 3,
      xp: 4000, ryo: 130, mapLocation: 'myoboku',
      blurb: 'Jiraiya unseals your chakra and pushes you off a cliff — sink or summon Gamabunta.',
      beats: [
        'Grind through Ebisu’s brutal timed obstacle course.',
        'Keep Jiraiya out of trouble — and away from the hot springs — in town.',
        'Get thrown off a cliff. Literally.',
      ],
    },
    {
      num: 5, title: 'Destruction of the Leaf', boss: 'One-Tailed Shukaku', bossHp: 1100, bossDmg: 30, unlockTier: 4,
      xp: 6000, ryo: 180, mapLocation: 'leaf',
      blurb: 'The finals erupt into a full invasion. The Third Hokage falls sealing away Orochimaru; you face Shukaku outside the walls.',
      beats: [
        'Beat Neji by tunneling straight through his "Absolute Defense."',
        'Guide civilians through the burning streets to safety.',
        'The invasion hits — the Third Hokage buys the village time with his life.',
      ],
    },
    {
      num: 6, title: 'The Search for Tsunade', boss: 'Kabuto Yakushi', bossHp: 1050, bossDmg: 28, unlockTier: 5,
      xp: 5800, ryo: 170, mapLocation: 'tanzaku',
      blurb: 'Akatsuki ambush the group, Sasuke is tortured by Itachi’s genjutsu, and Kabuto stands between you and Tsunade.',
      beats: [
        'Track Tsunade through the gambling dens of Tanzaku Town.',
        'Survive Itachi and Kisame’s ambush at the teahouse.',
        'Bet Tsunade you can master the Rasengan in one week.',
      ],
    },
    {
      num: 7, title: 'Sasuke Retrieval Mission', boss: 'Sasuke (Curse Mark)', bossHp: 1300, bossDmg: 34, unlockTier: 6,
      xp: 7000, ryo: 200, mapLocation: 'valley',
      blurb: 'Sasuke defects with the Sound Four. The chase ends at the Valley of the End in a clash you narrowly lose.',
      beats: [
        'Watch Shikamaru’s retrieval team fall one by one to the Sound Four.',
        'Rock Lee and the Sand siblings arrive just in time to even the odds.',
        'Catch up to Sasuke alone at the Valley of the End.',
      ],
    },
    {
      num: 8, title: 'The Kazekage Rescue Mission', boss: 'Sasori of the Red Sand', bossHp: 1500, bossDmg: 38, unlockTier: 7,
      xp: 8000, ryo: 220, mapLocation: 'sand',
      blurb: 'Akatsuki kidnap Gaara. Sasori’s puppet army stands between the team and getting him back alive.',
      beats: [
        'Race to the Hidden Sand Village alongside Team Guy.',
        'Chiyo and Sakura hold the line against Sasori’s puppet army.',
        'Track the trail to the hidden cave where Gaara is held.',
      ],
    },
    {
      num: 9, title: 'Long-Awaited Reunion', boss: 'Orochimaru', bossHp: 1450, bossDmg: 36, unlockTier: 7,
      xp: 7800, ryo: 210, mapLocation: 'tenchi',
      blurb: 'A new Team 7 finds Orochimaru’s hideout — and Sasuke, colder and far stronger than before.',
      beats: [
        'Meet the new Team 7 — Sai and Captain Yamato included.',
        'A routine informant meeting turns into an ambush.',
        'Push into Orochimaru’s underground hideout after him.',
      ],
    },
    {
      num: 10, title: 'Immortal Akatsuki', boss: 'Kakuzu', bossHp: 1700, bossDmg: 42, unlockTier: 8,
      xp: 9000, ryo: 240, mapLocation: 'leaf',
      blurb: 'Hidan and Kakuzu kill Asuma. You arrive with your new Wind Style: Rasenshuriken to end it.',
      beats: [
        'Train to fold wind-nature chakra into your Rasengan.',
        'Team 10 intercepts Hidan and Kakuzu — it goes badly.',
        'Arrive on the battlefield to save what’s left of the team.',
      ],
    },
    {
      num: 11, title: 'The Master’s Prophecy and Revenge', boss: 'Itachi Uchiha', bossHp: 1900, bossDmg: 46, unlockTier: 9,
      xp: 9500, ryo: 260, mapLocation: 'rain',
      gearTip: 'Come geared up — a rare weapon or better makes this winnable.',
      blurb: 'Jiraiya falls to Pain in the Hidden Rain. Sasuke finally catches Itachi in a battle of illusions and flame.',
      beats: [
        'Sasuke kills a weakened Orochimaru and sets out alone.',
        'Jiraiya infiltrates the Hidden Rain looking for Pain.',
        'Sasuke finally corners Itachi.',
      ],
    },
    {
      num: 12, title: 'Pain’s Assault on Konoha', boss: 'Pain (Deva Path)', bossHp: 2300, bossDmg: 52, unlockTier: 10,
      xp: 11000, ryo: 300, mapLocation: 'leaf',
      gearTip: 'Pain hits hard — stack HP gear or this one stings.',
      blurb: 'Pain flattens the village. You fight the Six Paths, break down, and pull it back together with words instead of violence.',
      beats: [
        'Master Sage Mode at Mount Myōboku.',
        'Watch Pain level the village searching for you.',
        'Hinata steps between you and the Deva Path.',
      ],
    },
    {
      num: 13, title: 'The Five Kage Summit', boss: 'Danzo Shimura', bossHp: 2150, bossDmg: 50, unlockTier: 10,
      xp: 10500, ryo: 290, mapLocation: 'iron',
      gearTip: 'A shield-heavy accessory or gloves setup helps a lot here.',
      blurb: 'Sasuke crashes the summit and kills Danzo. Tobi declares the Fourth Shinobi World War.',
      beats: [
        'The Five Kage gather in the snowbound Land of Iron.',
        'Sasuke crashes the summit, hunting his brother’s killer.',
        'Danzo makes a run for it.',
      ],
    },
    {
      num: 14, title: 'War Preparations', boss: 'Inner Kurama', bossHp: 2100, bossDmg: 48, unlockTier: 11,
      xp: 10200, ryo: 280, mapLocation: 'turtle',
      gearTip: 'Kurama doesn’t go easy — epic-tier gear or better recommended.',
      blurb: 'On the Isolated Island, you face your own hatred at the Waterfall of Truth, then Kurama itself.',
      beats: [
        'Head to the Isolated Island with Killer Bee for safekeeping.',
        'Face down your own hatred at the Waterfall of Truth.',
        'Go inward to confront the Nine-Tails directly.',
      ],
    },
    {
      num: 15, title: 'The Fourth Shinobi World War: Confrontation', boss: 'Edo Tensei Vanguard', bossHp: 2600, bossDmg: 56, unlockTier: 11,
      xp: 12000, ryo: 320, mapLocation: 'turtle',
      gearTip: 'This one’s a slog by design — bring your best weapon.',
      blurb: '100,000 White Zetsu clones and Kabuto’s reanimated army hit every front at once.',
      beats: [
        'The war opens on every front simultaneously.',
        'Sense out disguised White Zetsu hiding among the ranks.',
        'Itachi breaks free of Kabuto’s control mid-battle.',
      ],
    },
    {
      num: 16, title: 'Resurrection of the Ultimate Villain', boss: 'Madara Uchiha', bossHp: 3200, bossDmg: 65, unlockTier: 12,
      xp: 14000, ryo: 380, mapLocation: 'iron',
      gearTip: 'Legendary-tier gear or a strong summon is the difference here.',
      blurb: 'The real Madara Uchiha drops meteors on the battlefield and shatters the Five Kage.',
      beats: [
        'Meteors fall across the battlefield, wiping out a division.',
        'Kakashi realizes Tobi’s space matches his own Kamui.',
        'The mask finally shatters — Obito is revealed.',
      ],
    },
    {
      num: 17, title: 'The Ultimate Dream', boss: 'Kaguya Otsutsuki', bossHp: 3700, bossDmg: 75, unlockTier: 13,
      xp: 16000, ryo: 420, mapLocation: 'ryuchi',
      gearTip: 'One of the hardest fights in the game — full legendary loadout recommended.',
      blurb: 'The Ten-Tails rises, Kaguya Otsutsuki is revived, and Team 7 fights across shifting, impossible dimensions.',
      beats: [
        'Team 7 reunites, backed by the reanimated Hokage.',
        'The Ten-Tails falls — but Madara isn’t finished.',
        'Might Guy opens all Eight Gates to buy the world time.',
      ],
    },
    {
      num: 18, title: 'The Final Showdown', boss: 'Sasuke Uchiha', bossHp: 4200, bossDmg: 80, unlockTier: 13,
      xp: 18000, ryo: 460, mapLocation: 'valley',
      gearTip: 'The hardest fight in the game. Come in at full strength.',
      blurb: 'One last fight at the Valley of the End — everything both of you have, until there’s nothing left to throw.',
      beats: [
        'The world is saved. Sasuke reveals what he actually plans to do with it.',
        'You meet him one more time, alone, at the Valley of the End.',
      ],
    },
    {
      num: 19, title: 'The Moon Crisis & The Wedding', boss: 'Toneri Otsutsuki', bossHp: 3400, bossDmg: 70, unlockTier: 14,
      xp: 15000, ryo: 400, mapLocation: 'leaf',
      gearTip: 'Almost there — keep your gear sharp for this last real fight.',
      blurb: 'Toneri Otsutsuki threatens to drop the moon on the Earth. One punch ends it, and a wedding follows.',
      beats: [
        'Toneri kidnaps Hanabi and threatens to pull the moon down.',
        'The team makes the trip off-world to stop him.',
        'You finally tell Hinata how you feel.',
      ],
    },
    {
      num: 20, title: 'The Seventh Hokage', boss: null, bossHp: 0, bossDmg: 0, unlockTier: 13,
      xp: 25000, ryo: 1000, mapLocation: 'leaf', capstone: true,
      blurb: 'Years pass. The village is rebuilt, the war is history, and the day finally comes for Nink to be named Hokage.',
      beats: [
        'Years pass. Kakashi steps down as Hokage.',
        'Your daughter accidentally knocks you out cold the morning of the ceremony.',
        'Konohamaru covers for you at the podium while you come to.',
      ],
    },
  ],

  achievements: [
    { id: 'streak-7', category: 'Streaks', label: '7-day streak', check: (s) => s.streak.best >= 7 },
    { id: 'streak-14', category: 'Streaks', label: '14-day streak', check: (s) => s.streak.best >= 14 },
    { id: 'streak-30', category: 'Streaks', label: '30-day streak', check: (s) => s.streak.best >= 30 },
    { id: 'streak-60', category: 'Streaks', label: '60-day streak', check: (s) => s.streak.best >= 60 },
    { id: 'streak-100', category: 'Streaks', label: '100-day streak', check: (s) => s.streak.best >= 100 },
    { id: 'streak-180', category: 'Streaks', label: '180-day streak', check: (s) => s.streak.best >= 180 },
    { id: 'streak-365', category: 'Streaks', label: '365-day streak', check: (s) => s.streak.best >= 365 },
    { id: 'quests-10', category: 'Quests Completed', label: '10 quests completed', check: (s) => s.questsCompletedTotal >= 10 },
    { id: 'quests-50', category: 'Quests Completed', label: '50 quests completed', check: (s) => s.questsCompletedTotal >= 50 },
    { id: 'quests-100', category: 'Quests Completed', label: '100 quests completed', check: (s) => s.questsCompletedTotal >= 100 },
    { id: 'quests-250', category: 'Quests Completed', label: '250 quests completed', check: (s) => s.questsCompletedTotal >= 250 },
    { id: 'quests-500', category: 'Quests Completed', label: '500 quests completed', check: (s) => s.questsCompletedTotal >= 500 },
    { id: 'quests-1000', category: 'Quests Completed', label: '1,000 quests completed', check: (s) => s.questsCompletedTotal >= 1000 },
    { id: 'rank-genin', category: 'Rank Tiers', label: 'Reach Low Genin', check: (s) => s.xp >= 197000 },
    { id: 'rank-chunin', category: 'Rank Tiers', label: 'Reach Low Chūnin', check: (s) => s.xp >= 1574000 },
    { id: 'rank-jonin', category: 'Rank Tiers', label: 'Reach Low Jōnin', check: (s) => s.xp >= 5313000 },
    { id: 'rank-kage', category: 'Rank Tiers', label: 'Reach Low Kage', check: (s) => s.xp >= 12595000 },
    { id: 'rank-highkage', category: 'Rank Tiers', label: 'Reach High Kage', check: (s) => s.xp >= 20000000 },
    { id: 'story-1', category: 'Story', label: 'Clear the Academy Graduation', check: (s) => s.story.clearedChapters.includes(1) },
    { id: 'story-15', category: 'Story', label: 'Clear the War Confrontation', check: (s) => s.story.clearedChapters.includes(15) },
    { id: 'story-hokage', category: 'Story', label: 'Become Hokage', check: (s) => s.story.hokageAchieved },
  ],
};
