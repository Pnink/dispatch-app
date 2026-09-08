// The Nink Saga — Progress Tracker & Task Completer
// State lives in `state`, persisted to disk via the ninkSaga preload bridge.

let state = null;
let battle = null;
let toastTimer = null;

// ---------- date + seeded RNG helpers ----------

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return todayStr(dt);
}

// xmur3 string hash -> seed generator
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRandom(seedStr) {
  const seed = xmur3(seedStr)();
  return mulberry32(seed);
}

function getDailySimpleQuests(dateStr) {
  const rand = seededRandom(dateStr + '|simple');
  const pool = [...NINK_DATA.simpleQuests];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

function getDailyHardQuest(dateStr) {
  const rand = seededRandom(dateStr + '|hard');
  if (rand() >= 0.2) return null;
  const idx = Math.floor(rand() * NINK_DATA.hardQuests.length);
  return NINK_DATA.hardQuests[idx];
}

function findQuestById(id) {
  return (
    NINK_DATA.coreQuests.find((q) => q.id === id) ||
    NINK_DATA.simpleQuests.find((q) => q.id === id) ||
    NINK_DATA.hardQuests.find((q) => q.id === id)
  );
}

function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

// ---------- state ----------

function defaultState() {
  return {
    xp: 0,
    ryo: 0,
    stats: { business: 0, body: 0, brand: 0, mind: 0 },
    questsCompletedTotal: 0,
    streak: { current: 0, best: 0, lastCoreCompleteDate: null },
    daily: { date: todayStr(), completedIds: [] },
    story: { clearedChapters: [], beatsCleared: {}, hokageAchieved: false },
    achievementsUnlocked: [],
  };
}

function normalizeState(loaded) {
  const base = defaultState();
  if (!loaded) return base;
  return {
    xp: loaded.xp ?? base.xp,
    ryo: loaded.ryo ?? base.ryo,
    stats: { ...base.stats, ...(loaded.stats || {}) },
    questsCompletedTotal: loaded.questsCompletedTotal ?? 0,
    streak: { ...base.streak, ...(loaded.streak || {}) },
    daily: { ...base.daily, ...(loaded.daily || {}) },
    story: {
      clearedChapters: loaded.story?.clearedChapters || [],
      beatsCleared: loaded.story?.beatsCleared || {},
      hokageAchieved: loaded.story?.hokageAchieved || false,
    },
    achievementsUnlocked: loaded.achievementsUnlocked || [],
  };
}

function persist() {
  window.ninkSaga.saveState(state);
}

function ensureDailyReset() {
  const today = todayStr();
  if (state.daily.date !== today) {
    state.daily = { date: today, completedIds: [] };
    persist();
    return true;
  }
  return false;
}

function currentRank(xp) {
  let rank = NINK_DATA.ranks[0];
  for (const r of NINK_DATA.ranks) {
    if (xp >= r.xp) rank = r;
    else break;
  }
  return rank;
}

// ---------- toast ----------

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2600);
}

// ---------- header + stats ----------

function renderHeader() {
  const rank = currentRank(state.xp);
  const next = NINK_DATA.ranks[rank.tier + 1];
  document.getElementById('rank-name').textContent = `${rank.name} (Tier ${rank.tier})`;
  const fill = document.getElementById('xp-bar-fill');
  const label = document.getElementById('xp-label');
  if (next) {
    const span = next.xp - rank.xp;
    const progress = span > 0 ? Math.min(1, (state.xp - rank.xp) / span) : 1;
    fill.style.width = progress * 100 + '%';
    label.textContent = `${fmt(state.xp)} / ${fmt(next.xp)} XP`;
  } else {
    fill.style.width = '100%';
    label.textContent = `${fmt(state.xp)} XP — Max Rank`;
  }
  document.getElementById('ryo-amount').textContent = fmt(state.ryo);
  document.getElementById('streak-amount').textContent = state.streak.current;
}

function renderStats() {
  document.querySelectorAll('.stat-pill').forEach((pill) => {
    const stat = pill.dataset.stat;
    const value = state.stats[stat] || 0;
    const pct = Math.min(100, (value / 3000) * 100);
    pill.querySelector('.stat-bar-fill').style.width = pct + '%';
    pill.title = `${fmt(value)} XP`;
  });
}

// ---------- quests ----------

function questCardHTML(q, completed, extraClass = '') {
  return `
    <div class="quest-card ${extraClass} ${completed ? 'done' : ''}" data-quest-id="${q.id}">
      <div class="quest-check ${completed ? 'checked' : ''}">${completed ? '✓' : ''}</div>
      <div class="quest-info">
        <div class="quest-title">${q.title}</div>
        <div class="quest-meta"><span class="stat-tag">${q.stat}</span></div>
      </div>
      <div class="quest-reward">+${q.xp} XP${q.ryo ? ` · +${q.ryo} ₽` : ''}</div>
    </div>`;
}

function renderQuests() {
  ensureDailyReset();
  const today = state.daily.date;
  const simple = getDailySimpleQuests(today);
  const hard = getDailyHardQuest(today);

  document.getElementById('core-quest-list').innerHTML = NINK_DATA.coreQuests
    .map((q) => questCardHTML(q, state.daily.completedIds.includes(q.id)))
    .join('');

  document.getElementById('simple-quest-list').innerHTML = simple
    .map((q) => questCardHTML(q, state.daily.completedIds.includes(q.id)))
    .join('');

  const hardSection = document.getElementById('hard-quest-section');
  if (hard) {
    hardSection.hidden = false;
    document.getElementById('hard-quest-list').innerHTML = questCardHTML(
      hard,
      state.daily.completedIds.includes(hard.id),
      'hard'
    );
  } else {
    hardSection.hidden = true;
  }
}

function completeQuest(quest) {
  if (state.daily.completedIds.includes(quest.id)) return;
  state.xp += quest.xp;
  if (quest.ryo) state.ryo += quest.ryo;
  state.stats[quest.stat] = (state.stats[quest.stat] || 0) + quest.xp;
  state.daily.completedIds.push(quest.id);
  state.questsCompletedTotal += 1;
  checkCoreStreak();
  persist();
  renderHeader();
  renderStats();
  renderQuests();
  checkAchievements();
  toast(`+${quest.xp} XP${quest.ryo ? ' · +' + quest.ryo + ' ₽' : ''}`);
}

function checkCoreStreak() {
  const allCoreDone = NINK_DATA.coreQuests.every((q) => state.daily.completedIds.includes(q.id));
  if (allCoreDone && state.streak.lastCoreCompleteDate !== state.daily.date) {
    const yesterday = addDays(state.daily.date, -1);
    state.streak.current = state.streak.lastCoreCompleteDate === yesterday ? state.streak.current + 1 : 1;
    state.streak.lastCoreCompleteDate = state.daily.date;
    state.streak.best = Math.max(state.streak.best, state.streak.current);
    toast(`🔥 ${state.streak.current}-day streak!`);
  }
}

// ---------- story mode ----------

function chapterCardHTML(ch, rank) {
  const cleared = state.story.clearedChapters.includes(ch.num);
  const prevCleared = ch.num === 1 || state.story.clearedChapters.includes(ch.num - 1);
  const rankOk = rank.tier >= ch.unlockTier;
  const available = prevCleared && rankOk;
  const beatsClearedArr = state.story.beatsCleared[ch.num] || [];

  let bodyHtml;
  if (available || cleared) {
    const beatsHtml = ch.beats
      .map((beat, i) => {
        const done = cleared || i < beatsClearedArr.length;
        const isNext = !cleared && i === beatsClearedArr.length;
        return `<div class="beat-row ${done ? 'cleared' : ''}">
          <button class="beat-btn" data-chapter="${ch.num}" data-beat-index="${i}" ${isNext ? '' : 'disabled'}>${
            done ? '✓' : isNext ? 'Go' : '—'
          }</button>
          <span>${beat}</span>
        </div>`;
      })
      .join('');

    const allBeatsDone = cleared || beatsClearedArr.length >= ch.beats.length;
    let actionHtml = '';
    if (!cleared && ch.capstone) {
      const allPrevCleared = NINK_DATA.chapters
        .filter((c) => c.num < 20)
        .every((c) => state.story.clearedChapters.includes(c.num));
      const ready = allBeatsDone && allPrevCleared && rank.tier >= 13;
      actionHtml = `<div class="chapter-actions"><button class="action-btn" data-capstone="${ch.num}" ${
        ready ? '' : 'disabled'
      }>Become Hokage</button></div>`;
    } else if (!cleared && allBeatsDone) {
      actionHtml = `<div class="chapter-actions"><button class="action-btn" data-fight="${ch.num}">Fight ${ch.boss}</button></div>`;
    }

    bodyHtml = `
      <p class="chapter-blurb">${ch.blurb}</p>
      ${ch.gearTip ? `<div class="gear-tip">⚠ ${ch.gearTip}</div>` : ''}
      <div class="beat-list">${beatsHtml}</div>
      ${actionHtml}
    `;
  } else {
    const lockNote = !prevCleared
      ? `Clear Chapter ${ch.num - 1} first.`
      : `Reach ${NINK_DATA.ranks[ch.unlockTier].name} (Tier ${ch.unlockTier}) to unlock.`;
    bodyHtml = `<p class="chapter-lock-note">${lockNote}</p>`;
  }

  return `<div class="chapter-card ${cleared ? 'cleared' : ''} ${!available && !cleared ? 'locked' : ''}">
    <div class="chapter-head">
      <div class="chapter-title"><span class="chapter-num">#${ch.num}</span>${ch.title}</div>
      <div class="chapter-reward">${ch.capstone ? '' : `+${fmt(ch.xp)} XP · +${fmt(ch.ryo)} ₽`}</div>
    </div>
    ${bodyHtml}
  </div>`;
}

function renderStory() {
  const rank = currentRank(state.xp);
  const markerEl = document.getElementById('story-marker-line');
  const currentChapter = NINK_DATA.chapters.find((c) => !state.story.clearedChapters.includes(c.num));
  if (currentChapter) {
    markerEl.innerHTML = `📖 Story marker: <span class="marker">${currentChapter.mapLocation}</span> — Chapter ${currentChapter.num}: ${currentChapter.title}`;
  } else {
    markerEl.textContent = '📖 The saga is complete. You are Hokage.';
  }
  document.getElementById('chapter-list').innerHTML = NINK_DATA.chapters
    .map((ch) => chapterCardHTML(ch, rank))
    .join('');
}

function completeBeat(chapterNum, beatIndex) {
  if (!state.story.beatsCleared[chapterNum]) state.story.beatsCleared[chapterNum] = [];
  const arr = state.story.beatsCleared[chapterNum];
  if (beatIndex !== arr.length) return;
  arr.push(beatIndex);
  state.xp += NINK_DATA.beatXp;
  state.ryo += NINK_DATA.beatRyo;
  persist();
  toast(`+${NINK_DATA.beatXp} XP · +${NINK_DATA.beatRyo} ₽`);
  renderHeader();
  renderStats();
  renderStory();
  checkAchievements();
}

function becomeHokage(ch) {
  state.xp += ch.xp;
  state.ryo += ch.ryo;
  state.story.clearedChapters.push(ch.num);
  state.story.hokageAchieved = true;
  persist();
  toast(`You are Hokage! +${fmt(ch.xp)} XP · +${fmt(ch.ryo)} ₽`);
  renderHeader();
  renderStats();
  renderStory();
  checkAchievements();
}

// ---------- battle ----------

// No shop/equipment in this tracker, so combat power scales off rank tier
// instead (standing in for the starter kit + shop gear the full game would
// have equipped by that point) plus whatever story skills are unlocked.
// Calibrated so each chapter is beatable at its own unlock tier using base
// attacks alone; skills exist to push through the harder late-game fights.
function openBattle(chapter) {
  const rank = currentRank(state.xp);
  const playerMaxHp = 160 + rank.tier * 70;
  const weaponDamage = 20 + rank.tier * 7;
  const shield = 5 + rank.tier * 2;
  const unlockedSkills = NINK_DATA.skills.filter((sk) => state.story.clearedChapters.includes(sk.unlocksAfterChapter));
  const skillUses = {};
  unlockedSkills.forEach((sk) => (skillUses[sk.id] = sk.usesPerBattle));

  battle = {
    chapter,
    playerHp: playerMaxHp,
    playerMaxHp,
    bossHp: chapter.bossHp,
    bossMaxHp: chapter.bossHp,
    weaponDamage,
    shield,
    critChance: 0.08,
    unlockedSkills,
    skillUses,
    over: false,
    won: false,
    log: [],
  };
  renderBattle();
  document.getElementById('battle-modal').hidden = false;
}

function battleLog(msg) {
  battle.log.unshift(msg);
}

function renderBattle() {
  document.getElementById('battle-boss-name').textContent = battle.chapter.title;
  document.getElementById('battle-boss-label').textContent = battle.chapter.boss;

  const playerPct = Math.max(0, (battle.playerHp / battle.playerMaxHp) * 100);
  const bossPct = Math.max(0, (battle.bossHp / battle.bossMaxHp) * 100);
  document.getElementById('player-hp-fill').style.width = playerPct + '%';
  document.getElementById('boss-hp-fill').style.width = bossPct + '%';
  document.getElementById('player-hp-text').textContent = `${Math.max(0, battle.playerHp)} / ${battle.playerMaxHp} HP`;
  document.getElementById('boss-hp-text').textContent = `${Math.max(0, battle.bossHp)} / ${battle.bossMaxHp} HP`;

  document.getElementById('battle-log').innerHTML = battle.log.map((l) => `<div>${l}</div>`).join('');

  document.getElementById('skill-buttons').innerHTML = battle.unlockedSkills
    .map((sk) => {
      const uses = battle.skillUses[sk.id];
      return `<button class="skill-btn" data-skill="${sk.id}" ${battle.over || uses <= 0 ? 'disabled' : ''}>${
        sk.name
      } ×${sk.multiplier} (${uses} left)</button>`;
    })
    .join('');

  document.getElementById('attack-btn').disabled = battle.over;
  document.getElementById('battle-close-btn').hidden = !battle.over;
}

function doAttack(multiplier, label) {
  if (!battle || battle.over) return;
  const crit = Math.random() < battle.critChance;
  const dmg = Math.round(battle.weaponDamage * multiplier * (crit ? 2 : 1));
  battle.bossHp -= dmg;
  battleLog(`${label}: ${dmg} dmg${crit ? ' (CRIT!)' : ''} to ${battle.chapter.boss}`);

  if (battle.bossHp <= 0) {
    battle.bossHp = 0;
    battle.over = true;
    battle.won = true;
    battleLog(`${battle.chapter.boss} defeated!`);
    onBattleWon();
    renderBattle();
    return;
  }

  const dmgTaken = Math.max(1, battle.chapter.bossDmg - battle.shield);
  battle.playerHp -= dmgTaken;
  battleLog(`${battle.chapter.boss} hits back for ${dmgTaken}`);
  if (battle.playerHp <= 0) {
    battle.playerHp = 0;
    battle.over = true;
    battle.won = false;
    battleLog('You were defeated. No losses — try again anytime.');
  }
  renderBattle();
}

function onBattleWon() {
  const ch = battle.chapter;
  state.xp += ch.xp;
  state.ryo += ch.ryo;
  state.story.clearedChapters.push(ch.num);
  persist();
  toast(`Chapter cleared! +${fmt(ch.xp)} XP · +${fmt(ch.ryo)} ₽`);
  checkAchievements();
  renderHeader();
  renderStats();
}

function closeBattle() {
  document.getElementById('battle-modal').hidden = true;
  battle = null;
  renderStory();
}

// ---------- achievements ----------

function renderAchievements() {
  const el = document.getElementById('achievement-list');
  const categories = [...new Set(NINK_DATA.achievements.map((a) => a.category))];
  el.innerHTML = categories
    .map((cat) => {
      const group = NINK_DATA.achievements.filter((a) => a.category === cat);
      const badges = group
        .map((a) => {
          const unlocked = a.check(state);
          return `<div class="ach-badge ${unlocked ? 'unlocked' : ''}">${a.label}</div>`;
        })
        .join('');
      return `<div>
        <div class="ach-category-title">${cat}</div>
        <div class="ach-grid">${badges}</div>
      </div>`;
    })
    .join('');
}

function checkAchievements() {
  const newly = [];
  NINK_DATA.achievements.forEach((a) => {
    if (a.check(state) && !state.achievementsUnlocked.includes(a.id)) {
      state.achievementsUnlocked.push(a.id);
      newly.push(a.label);
    }
  });
  if (newly.length) {
    persist();
    toast(`🏆 ${newly.join(', ')}`);
  }
  renderAchievements();
}

// ---------- tabs ----------

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab));
  if (tab === 'quests') renderQuests();
  else if (tab === 'story') renderStory();
  else if (tab === 'achievements') renderAchievements();
}

// ---------- wiring ----------

function wireEvents() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('tab-quests').addEventListener('click', (e) => {
    const card = e.target.closest('.quest-card');
    if (!card) return;
    const quest = findQuestById(card.dataset.questId);
    if (quest) completeQuest(quest);
  });

  document.getElementById('tab-story').addEventListener('click', (e) => {
    const beatBtn = e.target.closest('.beat-btn');
    if (beatBtn && !beatBtn.disabled) {
      completeBeat(Number(beatBtn.dataset.chapter), Number(beatBtn.dataset.beatIndex));
      return;
    }
    const fightBtn = e.target.closest('[data-fight]');
    if (fightBtn) {
      const chapter = NINK_DATA.chapters.find((c) => c.num === Number(fightBtn.dataset.fight));
      if (chapter) openBattle(chapter);
      return;
    }
    const capstoneBtn = e.target.closest('[data-capstone]');
    if (capstoneBtn && !capstoneBtn.disabled) {
      const chapter = NINK_DATA.chapters.find((c) => c.num === Number(capstoneBtn.dataset.capstone));
      if (chapter) becomeHokage(chapter);
    }
  });

  document.getElementById('attack-btn').addEventListener('click', () => doAttack(1, 'Attack'));
  document.getElementById('battle-close-btn').addEventListener('click', closeBattle);
  document.getElementById('skill-buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('.skill-btn');
    if (!btn || btn.disabled || !battle) return;
    const skill = battle.unlockedSkills.find((s) => s.id === btn.dataset.skill);
    if (skill && battle.skillUses[skill.id] > 0) {
      battle.skillUses[skill.id] -= 1;
      doAttack(skill.multiplier, skill.name);
    }
  });

  setInterval(() => {
    if (ensureDailyReset()) {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      if (activeTab === 'quests') renderQuests();
    }
  }, 60000);
}

// ---------- init ----------

async function init() {
  const loaded = await window.ninkSaga.loadState();
  state = normalizeState(loaded);
  ensureDailyReset();
  renderHeader();
  renderStats();
  renderQuests();
  renderStory();
  renderAchievements();
  wireEvents();
}

init();
