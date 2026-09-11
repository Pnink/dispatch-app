// The Nink Saga — full game client.
// State lives in `state`, persisted to disk via the ninkSaga preload bridge.

let state = null;
let battle = null;
let toastTimer = null;
let shopActiveFamily = 'headband';
let pendingSlot = null; // slot currently open in the equip picker

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

const DAILY_SIMPLE_QUEST_COUNT = 6;

function getDailySimpleQuests(dateStr) {
  const rand = seededRandom(dateStr + '|simple');
  const pool = [...NINK_DATA.simpleQuests];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAILY_SIMPLE_QUEST_COUNT);
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
  const equipped = {};
  EQUIPMENT_SLOTS.forEach((slot) => (equipped[slot] = null));
  return {
    xp: 0,
    ryo: 0,
    stats: { business: 0, body: 0, brand: 0, mind: 0 },
    questsCompletedTotal: 0,
    streak: { current: 0, best: 0, lastCoreCompleteDate: null },
    daily: { date: todayStr(), completedIds: [] },
    story: { clearedChapters: [], beatsCleared: {}, hokageAchieved: false },
    achievementsUnlocked: [],
    inventory: [],
    equipped,
    hair: { style: 'Spiky', color: '#1c1410' },
    freeClaims: 0,
    starterGranted: false,
    world: { location: 'leaf', travelDestination: null, travelArrivalTs: null },
    wheel: { lastSpinDate: null, totalSpins: 0, itemsWon: [], mythicsWon: [], lastResult: null },
    jutsu: { forbiddenWon: [] },
  };
}

function normalizeState(loaded) {
  const base = defaultState();
  if (!loaded) return base;
  const equipped = { ...base.equipped, ...(loaded.equipped || {}) };
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
    inventory: loaded.inventory || [],
    equipped,
    hair: { ...base.hair, ...(loaded.hair || {}) },
    freeClaims: loaded.freeClaims ?? 0,
    starterGranted: loaded.starterGranted || false,
    world: { ...base.world, ...(loaded.world || {}) },
    wheel: { ...base.wheel, ...(loaded.wheel || {}) },
    jutsu: { ...base.jutsu, ...(loaded.jutsu || {}) },
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

// XP should always flow through here so rank-ups grant their free item claim
// (section 6: "every time the player ranks up, they earn 1 free item claim").
function gainXp(amount) {
  const before = currentRank(state.xp).tier;
  state.xp += amount;
  const after = currentRank(state.xp).tier;
  if (after > before) {
    const gained = after - before;
    state.freeClaims += gained;
    toast(`🎉 Rank up! ${currentRank(state.xp).name} — ${gained} free item claim${gained > 1 ? 's' : ''} earned!`);
  }
}

// 4.5 Starter Kit — auto-granted & equipped on a new game.
function grantStarterKitIfNeeded() {
  if (state.starterGranted) return;
  STARTER_KIT_ITEM_IDS.forEach((id) => {
    if (!state.inventory.includes(id)) state.inventory.push(id);
    const item = ITEMS.find((i) => i.id === id);
    const slot = ITEM_SLOT_BY_FAMILY[item.family];
    state.equipped[slot] = id;
  });
  state.equipped.expression = STARTER_EXPRESSION_ID;
  state.starterGranted = true;
  persist();
}

// ---------- jutsu (section 12) ----------

function isJutsuUnlocked(j) {
  if (j.unlock.type === 'chapter') return state.story.clearedChapters.includes(j.unlock.chapter);
  if (j.unlock.type === 'person') {
    return j.unlock.persons.some((pid) => {
      const p = PEOPLE.find((pp) => pp.id === pid);
      return p && isChapterReached(p.unlockChapter);
    });
  }
  if (j.unlock.type === 'rank') return currentRank(state.xp).tier >= j.unlock.tier;
  if (j.unlock.type === 'wheel') return state.jutsu.forbiddenWon.includes(j.id);
  return false;
}

function getUnlockedJutsu() {
  return JUTSU.filter(isJutsuUnlocked);
}

function jutsuUnlockText(j) {
  if (j.unlock.type === 'chapter') return `Clear Chapter ${j.unlock.chapter}`;
  if (j.unlock.type === 'person') {
    const names = j.unlock.persons.map((pid) => (PEOPLE.find((pp) => pp.id === pid) || {}).name || pid);
    return `Meet ${names.join(' or ')}`;
  }
  if (j.unlock.type === 'rank') return `Reach ${NINK_DATA.ranks[j.unlock.tier].name} (Tier ${j.unlock.tier})`;
  if (j.unlock.type === 'wheel') return 'Ultra-rare Daily Draw reward';
  return '';
}

// 4.4 Player combat stats, derived from currently equipped gear plus any
// unlocked passive jutsu (mentor-taught and rank-unlocked categories).
function computeCombatStats() {
  let maxHp = 100;
  let shield = 0;
  let weaponDamage = 5;
  let assistDamage = 0;
  let critChance = 0;
  EQUIPMENT_SLOTS.forEach((slot) => {
    const itemId = state.equipped[slot];
    if (!itemId) return;
    if (slot === 'expression') {
      critChance += EXPRESSION_CRIT_BONUS;
      return;
    }
    const item = ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    if (item.stat.type === 'hp') maxHp += item.stat.value;
    else if (item.stat.type === 'shield') shield += item.stat.value;
    else if (item.stat.type === 'damage') weaponDamage = item.stat.value;
    else if (item.stat.type === 'assist') assistDamage = item.stat.value;
  });

  let hpPercent = 0;
  let dmgPercent = 0;
  getUnlockedJutsu().forEach((j) => {
    if (!j.passive) return;
    const { stat, mode, value } = j.passive;
    if (stat === 'maxHp' && mode === 'percent') hpPercent += value;
    else if (stat === 'maxHp' && mode === 'flat') maxHp += value;
    else if (stat === 'weaponDamage' && mode === 'percent') dmgPercent += value;
    else if (stat === 'weaponDamage' && mode === 'flat') weaponDamage += value;
    else if (stat === 'shield' && mode === 'flat') shield += value;
    else if (stat === 'critChance') critChance += value;
  });
  maxHp = Math.round(maxHp * (1 + hpPercent));
  weaponDamage = Math.round(weaponDamage * (1 + dmgPercent));

  return { maxHp, shield, weaponDamage, assistDamage, critChance };
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

const STAT_ICONS = { business: '💼', body: '💪', brand: '📣', mind: '🧠' };

function questCardHTML(q, completed, extraClass = '') {
  return `
    <div class="quest-card ${extraClass} ${completed ? 'done' : ''}" data-quest-id="${q.id}">
      <div class="quest-check ${completed ? 'checked' : ''}">${completed ? '✓' : ''}</div>
      <div class="quest-stat-icon">${STAT_ICONS[q.stat] || '⭐'}</div>
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
  gainXp(quest.xp);
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

function isChapterReached(num) {
  return num === 1 || state.story.clearedChapters.includes(num - 1) || state.story.clearedChapters.includes(num);
}

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
      actionHtml = `<div class="chapter-actions"><button class="action-btn" data-fight="${ch.num}">⚔ Fight ${ch.boss}</button></div>`;
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
    bodyHtml = `<p class="chapter-lock-note">🔒 ${lockNote}</p>`;
  }

  return `<div class="chapter-card ${cleared ? 'cleared' : ''} ${!available && !cleared ? 'locked' : ''}">
    <div class="chapter-head">
      <div class="chapter-title"><span class="chapter-icon">${cleared ? '📖' : ch.capstone ? '👑' : '📜'}</span><span class="chapter-num">#${ch.num}</span>${ch.title}</div>
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
    const loc = VILLAGES.find((v) => v.id === currentChapter.mapLocation) || LANDMARKS.find((l) => l.id === currentChapter.mapLocation);
    markerEl.innerHTML = `📖 Story marker: <span class="marker">${loc ? loc.name : currentChapter.mapLocation}</span> — Chapter ${currentChapter.num}: ${currentChapter.title}`;
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
  gainXp(NINK_DATA.beatXp);
  state.ryo += NINK_DATA.beatRyo;
  persist();
  toast(`+${NINK_DATA.beatXp} XP · +${NINK_DATA.beatRyo} ₽`);
  renderHeader();
  renderStats();
  renderStory();
  checkAchievements();
}

function becomeHokage(ch) {
  gainXp(ch.xp);
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

// ---------- battle (section 10) ----------

function openBattle(chapter) {
  const stats = computeCombatStats();
  const activeJutsu = getUnlockedJutsu().filter((j) => j.battle);
  const jutsuUses = {};
  activeJutsu.forEach((j) => (jutsuUses[j.id] = j.battle.usesPerBattle));

  battle = {
    chapter,
    playerHp: stats.maxHp,
    playerMaxHp: stats.maxHp,
    bossHp: chapter.bossHp,
    bossMaxHp: chapter.bossHp,
    baseDamage: stats.weaponDamage + stats.assistDamage,
    shield: stats.shield,
    critChance: stats.critChance,
    bossDmgMultiplier: 1,
    summonBonus: 0,
    turnCount: 0,
    pendingSpecial: false,
    activeJutsu,
    jutsuUses,
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

function isBossEnraged() {
  return battle.bossHp > 0 && battle.bossHp / battle.bossMaxHp <= 0.25;
}

function renderBattle() {
  document.getElementById('battle-boss-name').textContent = battle.chapter.title;
  document.getElementById('battle-boss-label').textContent = battle.chapter.boss;

  const banner = document.getElementById('phase-banner');
  const enraged = isBossEnraged();
  banner.hidden = !enraged || battle.over;
  if (enraged) banner.textContent = `🔥 ${battle.chapter.boss} is ENRAGED — every attack hits harder!`;

  const playerPct = Math.max(0, (battle.playerHp / battle.playerMaxHp) * 100);
  const bossPct = Math.max(0, (battle.bossHp / battle.bossMaxHp) * 100);
  document.getElementById('player-hp-fill').style.width = playerPct + '%';
  document.getElementById('boss-hp-fill').style.width = bossPct + '%';
  document.getElementById('player-hp-text').textContent = `${Math.max(0, battle.playerHp)} / ${battle.playerMaxHp} HP`;
  document.getElementById('boss-hp-text').textContent = `${Math.max(0, battle.bossHp)} / ${battle.bossMaxHp} HP`;

  document.getElementById('battle-log').innerHTML = battle.log.map((l) => `<div>${l}</div>`).join('');

  const locked = battle.over || battle.pendingSpecial;
  document.getElementById('skill-buttons').innerHTML = battle.activeJutsu
    .map((j) => {
      const uses = battle.jutsuUses[j.id];
      return `<button class="skill-btn" data-skill="${j.id}" ${locked || uses <= 0 ? 'disabled' : ''}>${j.icon} ${
        j.name
      } (${uses} left)</button>`;
    })
    .join('');

  document.getElementById('attack-btn').disabled = locked;
  document.getElementById('battle-close-btn').hidden = !battle.over;
}

// 10.2 Boss attack patterns — normal counter-attacks most turns, a
// telegraphed special every few turns (dodgeable, see showDodgePrompt),
// and an enraged final phase below 25% HP where every hit lands harder.
const DODGE_TOTAL_MS = 1300;
const DODGE_PERFECT_WINDOW = [500, 800];
const DODGE_GOOD_WINDOW = [250, 1050];

function classifyDodge(elapsedMs) {
  if (elapsedMs >= DODGE_PERFECT_WINDOW[0] && elapsedMs <= DODGE_PERFECT_WINDOW[1]) return { tier: '✨ Perfect Dodge!', reduction: 1 };
  if (elapsedMs >= DODGE_GOOD_WINDOW[0] && elapsedMs <= DODGE_GOOD_WINDOW[1]) return { tier: 'Good Dodge', reduction: 0.5 };
  if (elapsedMs < DODGE_TOTAL_MS) return { tier: 'Late Dodge', reduction: 0.2 };
  return { tier: 'Missed!', reduction: 0 };
}

function showDodgePrompt(onResult) {
  const overlay = document.getElementById('dodge-overlay');
  const ring = document.getElementById('dodge-ring');
  const btn = document.getElementById('dodge-btn');
  const resultEl = document.getElementById('dodge-result');

  resultEl.textContent = '';
  overlay.hidden = false;
  ring.classList.remove('shrinking');
  void ring.offsetWidth; // force reflow so the shrink animation restarts cleanly
  ring.style.animationDuration = `${DODGE_TOTAL_MS}ms`;
  ring.classList.add('shrinking');

  const startTs = performance.now();
  let settled = false;
  let timeoutId;

  function finish(elapsedMs) {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutId);
    btn.removeEventListener('click', onTap);
    const { tier, reduction } = classifyDodge(elapsedMs);
    resultEl.textContent = tier;
    setTimeout(() => {
      overlay.hidden = true;
      ring.classList.remove('shrinking');
      onResult(reduction);
    }, 450);
  }

  function onTap() {
    finish(performance.now() - startTs);
  }

  btn.addEventListener('click', onTap);
  timeoutId = setTimeout(() => finish(DODGE_TOTAL_MS + 1), DODGE_TOTAL_MS + 50);
}

function applyBossDamage({ multiplier, enraged, reduction = 0, isSpecial }) {
  const enrageMult = enraged ? 1.5 : 1;
  let dmg = Math.round(battle.chapter.bossDmg * battle.bossDmgMultiplier * multiplier * enrageMult - battle.shield);
  dmg = Math.max(1, dmg);
  if (isSpecial && reduction > 0) dmg = Math.round(dmg * (1 - reduction));
  dmg = Math.max(0, dmg);
  battle.playerHp -= dmg;

  const tag = isSpecial ? `${battle.chapter.boss}'s telegraphed attack` : `${battle.chapter.boss} hits back`;
  const note = isSpecial && reduction >= 1 ? ' — fully dodged!' : isSpecial && reduction > 0 ? ' — partially dodged' : '';
  battleLog(`${tag} for ${dmg}${note}`);

  if (battle.playerHp <= 0) {
    battle.playerHp = 0;
    battle.over = true;
    battle.won = false;
    battleLog('You were defeated. No losses — try again anytime.');
  }
}

function resolveBossCounter() {
  battle.turnCount += 1;
  const enraged = isBossEnraged();
  const specialInterval = enraged ? 2 : 3;
  const isSpecial = battle.turnCount % specialInterval === 0;

  if (!isSpecial) {
    applyBossDamage({ multiplier: 1, enraged, isSpecial: false });
    renderBattle();
    return;
  }

  battle.pendingSpecial = true;
  renderBattle();
  showDodgePrompt((reduction) => {
    battle.pendingSpecial = false;
    applyBossDamage({ multiplier: 1.8, enraged, reduction, isSpecial: true });
    renderBattle();
  });
}

function doAttack(multiplier, label) {
  if (!battle || battle.over) return;
  const crit = Math.random() < battle.critChance;
  const effMultiplier = multiplier * (1 + battle.summonBonus);
  const dmg = Math.round(battle.baseDamage * effMultiplier * (crit ? 2 : 1));
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

  renderBattle();
  resolveBossCounter();
}

// Reaper Death Seal — a huge hit that also costs the player HP as recoil,
// applied every use instead of the boss's normal counter-attack.
function doNuke(j) {
  if (!battle || battle.over) return;
  const crit = Math.random() < battle.critChance;
  const effMultiplier = j.battle.multiplier * (1 + battle.summonBonus);
  const dmg = Math.round(battle.baseDamage * effMultiplier * (crit ? 2 : 1));
  battle.bossHp -= dmg;
  battleLog(`${j.name}: ${dmg} dmg${crit ? ' (CRIT!)' : ''} to ${battle.chapter.boss}`);

  const recoil = Math.max(1, Math.round(battle.playerHp * j.battle.selfDamagePercent));
  battle.playerHp -= recoil;
  battleLog(`${j.name} tears at your own life force — ${recoil} recoil damage`);

  if (battle.bossHp <= 0) {
    battle.bossHp = 0;
    battle.over = true;
    battle.won = true;
    battleLog(`${battle.chapter.boss} defeated!`);
    onBattleWon();
  } else if (battle.playerHp <= 0) {
    battle.playerHp = 0;
    battle.over = true;
    battle.won = false;
    battleLog('The recoil finishes you. No losses — try again anytime.');
  }
  renderBattle();
}

function doHeal(j) {
  if (!battle || battle.over) return;
  const healed = Math.min(battle.playerMaxHp - battle.playerHp, Math.round(battle.playerMaxHp * j.battle.healPercent));
  battle.playerHp += healed;
  battleLog(`${j.name}: healed ${healed} HP`);
  renderBattle();
  resolveBossCounter();
}

// Puppet Technique Insight — weakens the boss's damage for the rest of the fight.
function doDebuff(j) {
  if (!battle || battle.over) return;
  battle.bossDmgMultiplier *= 1 - j.battle.dmgReduction;
  battleLog(`${j.name}: ${battle.chapter.boss}'s attacks weakened`);
  renderBattle();
  resolveBossCounter();
}

// Shadow-Possession Tactics — skips the boss's counter-attack this turn.
function doStun(j) {
  if (!battle || battle.over) return;
  battleLog(`${j.name}: ${battle.chapter.boss} is frozen in place — no counter-attack!`);
  renderBattle();
}

// Summoning: Edo Tensei — boosts all attack damage for the rest of the fight.
function doSummon(j) {
  if (!battle || battle.over) return;
  battle.summonBonus += j.battle.bonusMultiplier;
  battleLog(`${j.name}: a reanimated ally joins the fight`);
  renderBattle();
  resolveBossCounter();
}

function useJutsu(jutsuId) {
  if (!battle || battle.over) return;
  const j = battle.activeJutsu.find((jj) => jj.id === jutsuId);
  if (!j || battle.jutsuUses[j.id] <= 0) return;
  battle.jutsuUses[j.id] -= 1;
  const kind = j.battle.kind;
  if (kind === 'attack') doAttack(j.battle.multiplier, j.name);
  else if (kind === 'nuke') doNuke(j);
  else if (kind === 'heal') doHeal(j);
  else if (kind === 'debuff') doDebuff(j);
  else if (kind === 'stun') doStun(j);
  else if (kind === 'summon') doSummon(j);
}

function onBattleWon() {
  const ch = battle.chapter;
  gainXp(ch.xp);
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

// ---------- avatar (section 13.3) ----------

const BROWS = {
  flat: '<line x1="62" y1="34" x2="72" y2="34" stroke="#2a2118" stroke-width="2.5"/><line x1="88" y1="34" x2="98" y2="34" stroke="#2a2118" stroke-width="2.5"/>',
  angry: '<line x1="62" y1="31" x2="72" y2="35" stroke="#2a2118" stroke-width="2.5"/><line x1="88" y1="35" x2="98" y2="31" stroke="#2a2118" stroke-width="2.5"/>',
  up: '<line x1="62" y1="30" x2="72" y2="32" stroke="#2a2118" stroke-width="2.5"/><line x1="88" y1="32" x2="98" y2="30" stroke="#2a2118" stroke-width="2.5"/>',
  worried: '<line x1="62" y1="35" x2="72" y2="31" stroke="#2a2118" stroke-width="2.5"/><line x1="88" y1="31" x2="98" y2="35" stroke="#2a2118" stroke-width="2.5"/>',
  asym: '<line x1="62" y1="34" x2="72" y2="34" stroke="#2a2118" stroke-width="2.5"/><line x1="88" y1="31" x2="98" y2="33" stroke="#2a2118" stroke-width="2.5"/>',
};

const EYES = {
  normal: '<circle cx="67" cy="40" r="2.6" fill="#2a2118"/><circle cx="93" cy="40" r="2.6" fill="#2a2118"/>',
  closed: '<line x1="63" y1="40" x2="71" y2="40" stroke="#2a2118" stroke-width="2"/><line x1="89" y1="40" x2="97" y2="40" stroke="#2a2118" stroke-width="2"/>',
  wide: '<circle cx="67" cy="39" r="3.6" fill="#2a2118"/><circle cx="93" cy="39" r="3.6" fill="#2a2118"/>',
  wink: '<line x1="63" y1="40" x2="71" y2="40" stroke="#2a2118" stroke-width="2"/><circle cx="93" cy="40" r="2.6" fill="#2a2118"/>',
};

const MOUTHS = {
  straight: '<line x1="72" y1="52" x2="88" y2="52" stroke="#2a2118" stroke-width="2"/>',
  smile: '<path d="M71 50 Q80 57 89 50" stroke="#2a2118" stroke-width="2" fill="none"/>',
  bigSmile: '<path d="M69 49 Q80 60 91 49 Z" fill="#3a2a1e" stroke="#2a2118" stroke-width="1.5"/><path d="M72 51 L88 51" stroke="#ece6d6" stroke-width="1.5"/>',
  frown: '<path d="M71 55 Q80 49 89 55" stroke="#2a2118" stroke-width="2" fill="none"/>',
  smirk: '<path d="M72 51 Q83 56 89 49" stroke="#2a2118" stroke-width="2" fill="none"/>',
  openOval: '<ellipse cx="80" cy="53" rx="7" ry="6" fill="#3a2a1e" stroke="#2a2118" stroke-width="1.5"/>',
  wavy: '<path d="M71 52 Q76 49 80 52 T89 52" stroke="#2a2118" stroke-width="2" fill="none"/>',
};

const EXPRESSION_FACE = {
  neutral: { brow: 'flat', eyes: 'normal', mouth: 'straight' },
  determined: { brow: 'angry', eyes: 'normal', mouth: 'straight' },
  smirk: { brow: 'flat', eyes: 'normal', mouth: 'smirk' },
  grin: { brow: 'up', eyes: 'normal', mouth: 'bigSmile' },
  scowl: { brow: 'angry', eyes: 'normal', mouth: 'frown' },
  sly: { brow: 'asym', eyes: 'normal', mouth: 'smirk' },
  focus: { brow: 'angry', eyes: 'normal', mouth: 'straight' },
  calm: { brow: 'flat', eyes: 'closed', mouth: 'straight' },
  laugh: { brow: 'up', eyes: 'closed', mouth: 'openOval' },
  shocked: { brow: 'up', eyes: 'wide', mouth: 'openOval' },
  content: { brow: 'flat', eyes: 'closed', mouth: 'smile' },
  smug: { brow: 'asym', eyes: 'normal', mouth: 'bigSmile' },
  nervous: { brow: 'worried', eyes: 'normal', mouth: 'wavy' },
  sad: { brow: 'worried', eyes: 'normal', mouth: 'frown' },
  roar: { brow: 'angry', eyes: 'wide', mouth: 'bigSmile' },
  wink: { brow: 'flat', eyes: 'wink', mouth: 'smirk' },
};

function hairShapeFront(style, color) {
  switch (style) {
    case 'Spiky':
      return `<path d="M56 26 L61 8 L67 24 L72 6 L78 22 L84 6 L90 24 L96 8 L101 26 Q80 14 56 26 Z" fill="${color}"/>`;
    case 'Messy':
      return `<path d="M55 28 Q62 8 72 18 Q80 4 88 18 Q98 8 105 28 Q90 12 80 20 Q70 12 55 28 Z" fill="${color}"/>`;
    case 'Buzzcut':
      return `<path d="M58 28 Q80 20 102 28 Q99 24 80 22 Q61 24 58 28 Z" fill="${color}"/>`;
    case 'Ponytail':
    case 'Long':
    case 'Short':
    default:
      return `<path d="M56 30 Q80 6 104 30 Q101 16 80 14 Q59 16 56 30 Z" fill="${color}"/>`;
  }
}

function hairShapeBack(style, color) {
  if (style === 'Ponytail') return `<path d="M100 24 Q118 30 112 58 Q108 46 98 40 Z" fill="${color}"/>`;
  if (style === 'Long')
    return `<path d="M58 30 Q52 70 58 100" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M102 30 Q108 70 102 100" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  return '';
}

function itemIconSVG(item) {
  const c = item.color;
  const shapes = {
    headband: `<rect x="4" y="11" width="20" height="6" rx="1" fill="${c}"/><rect x="11" y="10" width="6" height="8" fill="#2a2118"/>`,
    hat: `<path d="M4 20 Q14 4 24 20 Z" fill="${c}"/><rect x="2" y="19" width="24" height="3" rx="1" fill="${c}"/>`,
    top: `<path d="M8 6 L20 6 L24 12 L20 26 L8 26 L4 12 Z" fill="${c}"/>`,
    bottom: `<path d="M9 4 L19 4 L20 26 L15 26 L14 14 L13 26 L8 26 Z" fill="${c}"/>`,
    footwear: `<path d="M6 20 Q6 14 12 14 L20 14 Q24 14 24 20 L24 22 L6 22 Z" fill="${c}"/>`,
    gloves: `<path d="M9 4 L19 4 L19 14 Q19 22 14 22 Q9 22 9 14 Z" fill="${c}"/>`,
    kunai: `<path d="M14 2 L17 14 L14 18 L11 14 Z" fill="${c}"/><rect x="12.5" y="18" width="3" height="8" fill="#5a4632"/>`,
    shuriken: `<path d="M14 2 L17 11 L26 14 L17 17 L14 26 L11 17 L2 14 L11 11 Z" fill="${c}"/>`,
    otherWeapon: `<rect x="12" y="2" width="4" height="22" rx="1.5" fill="${c}"/><circle cx="14" cy="25" r="3" fill="${c}"/>`,
    accessory: `<path d="M14 3 L22 14 L14 25 L6 14 Z" fill="${c}"/>`,
    summon: `<circle cx="14" cy="14" r="11" fill="${c}"/><circle cx="14" cy="14" r="5" fill="#0c0f14" opacity="0.35"/>`,
  };
  const shape = shapes[item.family] || `<circle cx="14" cy="14" r="10" fill="${c}"/>`;
  return `<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">${shape}</svg>`;
}

function equippedItem(slot) {
  return ITEMS.find((i) => i.id === state.equipped[slot]) || null;
}

function buildAvatarSVG() {
  const topItem = equippedItem('top');
  const bottomItem = equippedItem('bottom');
  const footwearItem = equippedItem('footwear');
  const glovesItem = equippedItem('gloves');
  const headbandItem = equippedItem('headband');
  const hatItem = equippedItem('hat');
  const weaponItem = equippedItem('weapon');
  const accessoryItem = equippedItem('accessory');
  const summonItem = equippedItem('summon');
  const exprItem = EXPRESSIONS.find((e) => e.id === state.equipped.expression) || EXPRESSIONS[0];

  const skin = '#e0b28c';
  const topColor = topItem ? topItem.color : '#3a3f4a';
  const bottomColor = bottomItem ? bottomItem.color : '#2a2f3a';
  const footwearColor = footwearItem ? footwearItem.color : '#3a2f28';
  const glovesColor = glovesItem ? glovesItem.color : skin;
  const hairColor = state.hair.color;

  const face = EXPRESSION_FACE[exprItem.note] || EXPRESSION_FACE.neutral;

  return `<svg viewBox="0 0 160 240" width="200" height="300" xmlns="http://www.w3.org/2000/svg">
    ${summonItem ? `<circle cx="122" cy="58" r="9" fill="${summonItem.color}"/>` : ''}
    ${hairShapeBack(state.hair.style, hairColor)}
    <rect x="66" y="118" width="13" height="48" rx="4" fill="${bottomColor}"/>
    <rect x="81" y="118" width="13" height="48" rx="4" fill="${bottomColor}"/>
    <rect x="63" y="163" width="18" height="9" rx="3" fill="${footwearColor}"/>
    <rect x="79" y="163" width="18" height="9" rx="3" fill="${footwearColor}"/>
    <rect x="44" y="68" width="13" height="46" rx="6" fill="${topColor}"/>
    <rect x="103" y="68" width="13" height="46" rx="6" fill="${topColor}"/>
    <circle cx="50" cy="118" r="7" fill="${glovesColor}"/>
    <circle cx="109" cy="118" r="7" fill="${glovesColor}"/>
    ${weaponItem ? `<rect x="106" y="96" width="5" height="34" rx="2" fill="${weaponItem.color}" transform="rotate(25 109 113)"/>` : ''}
    <rect x="58" y="64" width="44" height="58" rx="10" fill="${topColor}"/>
    ${accessoryItem ? `<circle cx="96" cy="128" r="6" fill="${accessoryItem.color}"/>` : ''}
    <path d="M68 64 Q80 72 92 64" stroke="#1c2128" stroke-width="3" fill="none"/>
    <circle cx="80" cy="42" r="24" fill="${skin}"/>
    ${BROWS[face.brow]}
    ${EYES[face.eyes]}
    ${MOUTHS[face.mouth]}
    ${hairShapeFront(state.hair.style, hairColor)}
    ${headbandItem ? `<rect x="58" y="30" width="44" height="7" rx="2" fill="${headbandItem.color}"/><rect x="76" y="29" width="8" height="9" fill="#c7ccd1"/>` : ''}
    ${hatItem ? `<path d="M52 24 Q80 -2 108 24 Q106 14 80 12 Q54 14 52 24 Z" fill="${hatItem.color}"/><rect x="50" y="22" width="60" height="4" rx="2" fill="${hatItem.color}"/>` : ''}
  </svg>`;
}

// ---------- character tab ----------

// Three.js loads asynchronously (a module import on desktop, a CDN fetch
// on the mobile build) — poll for it rather than giving up after one
// check, since a slow mobile connection can take several seconds to pull
// down the ~2MB library.
function whenThreeReady(callback, attemptsLeft = 20, delayMs = 400) {
  if (window.THREE) {
    callback();
    return;
  }
  if (attemptsLeft <= 0) return;
  setTimeout(() => whenThreeReady(callback, attemptsLeft - 1, delayMs), delayMs);
}

function renderAvatar() {
  if (window.THREE) {
    initAvatar3D();
    syncAvatar3D();
    return;
  }
  // Show the flat fallback right away, then upgrade to the 3D model once
  // THREE finishes loading.
  document.getElementById('avatar-svg-wrap').innerHTML = buildAvatarSVG();
  whenThreeReady(() => {
    if (document.querySelector('.tab-btn.active').dataset.tab === 'character') {
      initAvatar3D();
      syncAvatar3D();
    }
  });
}

function renderCharacter() {
  renderAvatar();
  const stats = computeCombatStats();
  document.getElementById('combat-stats-line').innerHTML = `
    <span>❤ ${stats.maxHp} HP</span>
    <span>🛡 ${stats.shield} Shield</span>
    <span>⚔ ${stats.weaponDamage} Dmg</span>
    <span>🐾 ${stats.assistDamage} Assist</span>
    <span>✨ ${Math.round(stats.critChance * 100)}% Crit</span>
  `;
  document.getElementById('hair-style-row').innerHTML = HAIR_STYLES.map(
    (s) => `<button class="chip-btn ${state.hair.style === s ? 'active' : ''}" data-hair-style="${s}">${s}</button>`
  ).join('');
  document.getElementById('hair-color-row').innerHTML = HAIR_COLORS.map(
    (c) =>
      `<button class="color-chip ${state.hair.color === c.hex ? 'active' : ''}" style="background:${c.hex}" data-hair-color="${c.hex}" title="${c.name}"></button>`
  ).join('');

  document.getElementById('free-claims-note').textContent =
    state.freeClaims > 0 ? `🎁 ${state.freeClaims} free item claim${state.freeClaims > 1 ? 's' : ''} available — spend them in the Shop.` : '';

  document.getElementById('equipment-slots').innerHTML = EQUIPMENT_SLOTS.map((slot) => {
    let valueLabel = 'Empty';
    if (slot === 'expression') {
      const expr = EXPRESSIONS.find((e) => e.id === state.equipped.expression);
      valueLabel = expr ? expr.name : 'Empty';
    } else {
      const item = equippedItem(slot);
      valueLabel = item ? item.name : 'Empty';
    }
    return `<button class="equip-slot-card" data-slot="${slot}">
      <div class="equip-slot-label">${SLOT_LABELS[slot]}</div>
      <div class="equip-slot-value ${valueLabel === 'Empty' ? 'empty' : ''}">${valueLabel}</div>
    </button>`;
  }).join('');
}

function familiesForSlot(slot) {
  return Object.keys(ITEM_SLOT_BY_FAMILY).filter((f) => ITEM_SLOT_BY_FAMILY[f] === slot);
}

function openEquipPicker(slot) {
  pendingSlot = slot;
  document.getElementById('picker-title').textContent = `Equip: ${SLOT_LABELS[slot]}`;
  const rank = currentRank(state.xp);
  let rows;
  if (slot === 'expression') {
    rows = EXPRESSIONS.filter((e) => rank.tier >= e.unlockTier).map((e) => ({
      id: e.id,
      label: e.name,
      equipped: state.equipped.expression === e.id,
    }));
  } else {
    const families = familiesForSlot(slot);
    rows = state.inventory
      .map((id) => ITEMS.find((i) => i.id === id))
      .filter((it) => it && families.includes(it.family))
      .map((it) => ({ id: it.id, label: `${it.name} (${it.rarity})`, equipped: state.equipped[slot] === it.id }));
  }
  const listEl = document.getElementById('picker-list');
  const unequipRow = `<div class="picker-row-item" data-unequip="1"><span>— Unequip —</span></div>`;
  listEl.innerHTML =
    unequipRow +
    rows
      .map(
        (r) =>
          `<div class="picker-row-item ${r.equipped ? 'equipped' : ''}" data-equip-id="${r.id}"><span>${r.label}${
            r.equipped ? ' ✓' : ''
          }</span></div>`
      )
      .join('');
  if (!rows.length) listEl.innerHTML += `<p style="color:var(--dim);font-size:12px;">Nothing owned for this slot yet — check the Shop.</p>`;
  document.getElementById('picker-modal').hidden = false;
}

function closePicker() {
  document.getElementById('picker-modal').hidden = true;
  pendingSlot = null;
}

// ---------- shop (section 6) ----------

function renderShop() {
  document.getElementById('shop-family-tiles').innerHTML = SHOP_FAMILIES.map(
    (f) => `<button class="family-tile ${f.family === shopActiveFamily ? 'active' : ''}" data-family="${f.family}">${f.label}</button>`
  ).join('');
  const rank = currentRank(state.xp);
  const items = ITEMS.filter((it) => it.family === shopActiveFamily);
  document.getElementById('shop-item-grid').innerHTML = items.map((it) => shopItemCardHTML(it, rank)).join('');
}

function statLabel(item) {
  const v = item.stat.value;
  if (item.stat.type === 'hp') return `+${v} HP`;
  if (item.stat.type === 'shield') return `+${v} Shield`;
  if (item.stat.type === 'damage') return `${v} Dmg`;
  return `+${v} Assist`;
}

function shopItemCardHTML(item, rank) {
  const owned = state.inventory.includes(item.id);
  const unlocked = rank.tier >= item.unlockTier;
  const villageOk = !item.village || item.village === state.world.location;
  const canBuy = !owned && unlocked && villageOk && !item.wheelOnly && state.ryo >= (item.cost || 0);
  const canClaim = !owned && unlocked && villageOk && !item.wheelOnly && state.freeClaims > 0;
  let note = '';
  if (item.wheelOnly) note = 'Wheel-exclusive — never sold in the shop.';
  else if (!unlocked) note = `Unlocks at ${NINK_DATA.ranks[item.unlockTier].name} (Tier ${item.unlockTier}).`;
  else if (!villageOk) note = `Only sold in ${VILLAGES.find((v) => v.id === item.village).name}.`;

  return `<div class="item-card ${owned ? 'owned' : ''} ${!unlocked ? 'locked' : ''}" style="--rarity-color:${RARITY_COLORS[item.rarity]}">
    <div class="item-card-head">
      <div class="item-icon-wrap">${itemIconSVG(item)}</div>
      <div>
        <div class="item-card-name">${item.name}${owned ? ' ✓' : ''}</div>
        <div class="item-card-rarity">${item.rarity}</div>
      </div>
    </div>
    <div class="item-card-meta">
      <span>${statLabel(item)}</span>
      <span>${item.wheelOnly ? 'Wheel-only' : fmt(item.cost) + ' ₽'}</span>
    </div>
    ${note ? `<div class="item-card-note">${note}</div>` : ''}
    ${
      !owned && !item.wheelOnly
        ? `<div class="item-card-actions">
      <button class="action-btn" data-buy="${item.id}" ${canBuy ? '' : 'disabled'}>Buy</button>
      ${state.freeClaims > 0 ? `<button class="action-btn" data-claim="${item.id}" ${canClaim ? '' : 'disabled'}>Claim Free</button>` : ''}
    </div>`
        : ''
    }
  </div>`;
}

function grantItem(itemId) {
  if (!state.inventory.includes(itemId)) state.inventory.push(itemId);
  const item = ITEMS.find((i) => i.id === itemId);
  const slot = ITEM_SLOT_BY_FAMILY[item.family];
  if (slot && !state.equipped[slot]) state.equipped[slot] = itemId;
}

function buyItem(item) {
  const rank = currentRank(state.xp);
  if (state.inventory.includes(item.id) || item.wheelOnly) return;
  if (rank.tier < item.unlockTier) return;
  if (item.village && item.village !== state.world.location) return;
  if (state.ryo < item.cost) return;
  state.ryo -= item.cost;
  grantItem(item.id);
  toast(`Bought ${item.name}!`);
  persist();
  renderHeader();
  renderShop();
  checkAchievements();
}

function claimFreeItem(item) {
  const rank = currentRank(state.xp);
  if (state.inventory.includes(item.id) || item.wheelOnly) return;
  if (rank.tier < item.unlockTier) return;
  if (item.village && item.village !== state.world.location) return;
  if (state.freeClaims <= 0) return;
  state.freeClaims -= 1;
  grantItem(item.id);
  toast(`Claimed ${item.name} free!`);
  persist();
  renderHeader();
  renderShop();
  checkAchievements();
}

// ---------- world map (section 8) ----------

function formatDuration(ms) {
  if (ms <= 0) return 'arriving...';
  const totalMin = Math.ceil(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  const parts = [];
  if (d) parts.push(d + 'd');
  if (h) parts.push(h + 'h');
  if (!d) parts.push(m + 'm');
  return parts.join(' ');
}

function resolveTravelIfArrived() {
  if (state.world.travelDestination && Date.now() >= state.world.travelArrivalTs) {
    const arrivedName = VILLAGES.find((v) => v.id === state.world.travelDestination).name;
    state.world.location = state.world.travelDestination;
    state.world.travelDestination = null;
    state.world.travelArrivalTs = null;
    persist();
    toast(`🧭 Arrived at ${arrivedName}`);
  }
}

function renderWorldMap() {
  resolveTravelIfArrived();
  if (window.THREE) {
    initWorldMap3D();
    syncWorldMap3D();
  } else {
    whenThreeReady(() => {
      if (document.querySelector('.tab-btn.active').dataset.tab === 'map') {
        initWorldMap3D();
        syncWorldMap3D();
      }
    });
  }
  const loc = VILLAGES.find((v) => v.id === state.world.location);
  document.getElementById('map-location-line').textContent = `📍 Currently in ${loc.name}`;
  const banner = document.getElementById('travel-banner');
  if (state.world.travelDestination) {
    const dest = VILLAGES.find((v) => v.id === state.world.travelDestination);
    const remainingMs = state.world.travelArrivalTs - Date.now();
    banner.hidden = false;
    banner.textContent = `🧭 Traveling to ${dest.name} — arrives in ${formatDuration(remainingMs)}`;
  } else {
    banner.hidden = true;
  }
  document.getElementById('village-list').innerHTML = VILLAGES.map((v) => {
    const isCurrent = v.id === state.world.location;
    const traveling = !!state.world.travelDestination;
    const days = travelDaysBetween(state.world.location, v.id);
    return `<div class="village-card ${isCurrent ? 'current' : ''}">
      <div class="village-name">${isCurrent ? '🏯' : '🏠'} ${v.name}${isCurrent ? ' (here)' : ''}</div>
      <div class="village-meta">${v.terrain}</div>
      ${!isCurrent ? `<div class="village-meta">🚶 ${days} day${days === 1 ? '' : 's'} away</div>` : ''}
      ${!isCurrent ? `<div class="chapter-actions"><button class="action-btn" data-travel="${v.id}" ${traveling ? 'disabled' : ''}>Travel</button></div>` : ''}
    </div>`;
  }).join('');
  document.getElementById('landmark-list').innerHTML = LANDMARKS.map(
    (l) => `<div class="landmark-card" data-lore="${l.id}"><div class="landmark-name">📍 ${l.name}</div></div>`
  ).join('');
}

function travelSpeedBonus() {
  let bonus = 0;
  getUnlockedJutsu().forEach((j) => {
    if (j.utility && j.utility.effect === 'travelSpeed') bonus += j.utility.value;
  });
  return bonus;
}

function startTravel(destId) {
  if (state.world.travelDestination || destId === state.world.location) return;
  const days = travelDaysBetween(state.world.location, destId);
  const ms = days * 24 * 60 * 60 * 1000 * (1 - travelSpeedBonus());
  state.world.travelDestination = destId;
  state.world.travelArrivalTs = Date.now() + ms;
  persist();
  renderWorldMap();
  toast(`🧭 Traveling to ${VILLAGES.find((v) => v.id === destId).name} — ${days} day${days === 1 ? '' : 's'}`);
}

function openLore(landmarkId) {
  const l = LANDMARKS.find((x) => x.id === landmarkId);
  if (!l) return;
  document.getElementById('lore-title').textContent = l.name;
  document.getElementById('lore-text').textContent = l.lore;
  document.getElementById('lore-modal').hidden = false;
}

// ---------- daily draw wheel (section 7) ----------

const WHEEL_SLOT_COUNT = 12;
let wheelRotation = 0; // cosmetic only, not persisted

function buildWheelSlotsForDay(dateStr) {
  const rand = seededRandom(dateStr + '|wheelDisplay');
  const combined = [
    ...WHEEL_RYO_VALUES.map((v) => ({ type: 'ryo', amount: v })),
    ...WHEEL_XP_VALUES.map((v) => ({ type: 'xp', amount: v })),
  ];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  const slots = combined.slice(0, WHEEL_SLOT_COUNT);
  const now = new Date();
  if (WHEEL_BONUS_DAYS.includes(now.getDay())) slots[Math.floor(rand() * WHEEL_SLOT_COUNT)] = { type: 'bonus' };
  if (WHEEL_MYTHIC_DAYS.includes(now.getDate())) slots[Math.floor(rand() * WHEEL_SLOT_COUNT)] = { type: 'mythic' };
  if (WHEEL_FORBIDDEN_DAYS.includes(now.getDate())) slots[Math.floor(rand() * WHEEL_SLOT_COUNT)] = { type: 'forbidden' };
  return slots;
}

function slotLabel(slot) {
  if (slot.type === 'bonus') return '🎁';
  if (slot.type === 'mythic') return '✨';
  if (slot.type === 'forbidden') return '☠️';
  if (slot.type === 'ryo') return `₽${slot.amount}`;
  return `${slot.amount}xp`;
}

function slotFill(slot, index) {
  if (slot.type === 'bonus') return '#3a6b52';
  if (slot.type === 'mythic') return '#5a2f7a';
  if (slot.type === 'forbidden') return '#5a1414';
  if (slot.type === 'ryo') return index % 2 === 0 ? '#8a6f3a' : '#6f5a2f';
  return index % 2 === 0 ? '#2f4a6b' : '#375580';
}

function polarPoint(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 120 + radius * Math.sin(rad), y: 120 - radius * Math.cos(rad) };
}

function renderWheelSVG(slots) {
  const R = 108;
  const step = 360 / slots.length;
  let wedges = '';
  let labels = '';
  slots.forEach((slot, i) => {
    const start = i * step;
    const end = start + step;
    const p1 = polarPoint(start, R);
    const p2 = polarPoint(end, R);
    wedges += `<path d="M120,120 L${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${R},${R} 0 0,1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} Z" fill="${slotFill(slot, i)}" stroke="#0c0f14" stroke-width="1.5"/>`;
    const mid = start + step / 2;
    const lp = polarPoint(mid, R * 0.64);
    labels += `<text x="${lp.x.toFixed(2)}" y="${lp.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#ece6d6">${slotLabel(slot)}</text>`;
  });
  document.getElementById('wheel-svg').innerHTML = `
    <circle cx="120" cy="120" r="112" fill="none" stroke="#dba64c" stroke-width="3"/>
    <g id="wheel-rotor" style="transform-origin:120px 120px; transform:rotate(${wheelRotation}deg);">${wedges}${labels}</g>
    <circle cx="120" cy="120" r="15" fill="#151a23" stroke="#dba64c" stroke-width="2"/>
  `;
}

function renderWheel() {
  const today = todayStr();
  renderWheelSVG(buildWheelSlotsForDay(today));
  const spun = state.wheel.lastSpinDate === today;
  document.getElementById('spin-btn').disabled = spun;
  document.getElementById('wheel-status').textContent = spun
    ? 'Already spun today — come back tomorrow.'
    : `One spin per day · ${state.wheel.totalSpins} lifetime spins`;
  document.getElementById('wheel-result').textContent = state.wheel.lastResult ? state.wheel.lastResult.label : '';
}

function weightedPickItemId(pool, rarityWeights, rand) {
  const weighted = pool.map((it) => ({ it, w: rarityWeights[it.rarity] || 1 }));
  const total = weighted.reduce((a, x) => a + x.w, 0);
  let r = rand() * total;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) return x.it.id;
  }
  return weighted[weighted.length - 1].it.id;
}

// Which of the 12 rendered slots the spin lands on — the visual wheel and
// the actual reward are always the same thing. A mythic/bonus slot (when
// present that day) keeps its exact spec probability (1%/5%); everything
// else splits the remaining mass across the ryo/xp slots using the
// existing smaller-amounts-more-likely weighting.
function pickWinningSlotIndex(slots, rand) {
  const weights = new Array(slots.length).fill(0);
  let reserved = 0;
  slots.forEach((s, i) => {
    if (s.type === 'mythic') {
      weights[i] = WHEEL_MYTHIC_CHANCE;
      reserved += WHEEL_MYTHIC_CHANCE;
    } else if (s.type === 'forbidden') {
      weights[i] = WHEEL_FORBIDDEN_CHANCE;
      reserved += WHEEL_FORBIDDEN_CHANCE;
    } else if (s.type === 'bonus') {
      weights[i] = WHEEL_BONUS_CHANCE;
      reserved += WHEEL_BONUS_CHANCE;
    }
  });
  const normalIdx = slots.map((_, i) => i).filter((i) => slots[i].type === 'ryo' || slots[i].type === 'xp');
  const remaining = Math.max(0, 1 - reserved);
  const raw = normalIdx.map((i) => {
    const pool = slots[i].type === 'ryo' ? WHEEL_RYO_VALUES : WHEEL_XP_VALUES;
    const rank = pool.indexOf(slots[i].amount);
    return Math.pow(0.8, rank);
  });
  const rawTotal = raw.reduce((a, b) => a + b, 0) || 1;
  normalIdx.forEach((i, k) => {
    weights[i] = remaining * (raw[k] / rawTotal);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  let r = rand() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function applyWheelSlotResult(slot, rand) {
  if (slot.type === 'ryo') {
    state.ryo += slot.amount;
    state.wheel.lastResult = { label: `🎡 +${slot.amount} ₽` };
    toast(`🎡 Wheel: +${slot.amount} ₽`);
  } else if (slot.type === 'xp') {
    gainXp(slot.amount);
    state.wheel.lastResult = { label: `🎡 +${slot.amount} XP` };
    toast(`🎡 Wheel: +${slot.amount} XP`);
  } else if (slot.type === 'bonus') {
    const pool = ITEMS.filter((it) => !it.wheelOnly);
    const item = ITEMS.find((i) => i.id === weightedPickItemId(pool, WHEEL_BONUS_RARITY_WEIGHTS, rand));
    grantItem(item.id);
    state.wheel.itemsWon.push(item.id);
    state.wheel.lastResult = { label: `🎁 Won ${item.name}!` };
    toast(`🎡 Wheel jackpot: ${item.name}!`);
  } else if (slot.type === 'mythic') {
    const unowned = MYTHIC_ITEM_IDS.filter((id) => !state.inventory.includes(id));
    const pickFrom = unowned.length ? unowned : MYTHIC_ITEM_IDS;
    const item = ITEMS.find((i) => i.id === pickFrom[Math.floor(rand() * pickFrom.length)]);
    grantItem(item.id);
    state.wheel.mythicsWon.push(item.id);
    state.wheel.lastResult = { label: `✨ Mythic: ${item.name}!` };
    toast(`✨ MYTHIC: ${item.name}!!`);
  } else if (slot.type === 'forbidden') {
    const unowned = FORBIDDEN_JUTSU_IDS.filter((id) => !state.jutsu.forbiddenWon.includes(id));
    const pickFrom = unowned.length ? unowned : FORBIDDEN_JUTSU_IDS;
    const jutsuId = pickFrom[Math.floor(rand() * pickFrom.length)];
    const j = JUTSU.find((jj) => jj.id === jutsuId);
    if (!state.jutsu.forbiddenWon.includes(jutsuId)) state.jutsu.forbiddenWon.push(jutsuId);
    state.wheel.lastResult = { label: `☠️ Forbidden Jutsu: ${j.name}!` };
    toast(`☠️ FORBIDDEN JUTSU: ${j.name}!!`);
  }
  renderHeader();
  renderStats();
}

function spinWheel() {
  const today = todayStr();
  if (state.wheel.lastSpinDate === today) {
    toast('Already spun today — come back tomorrow.');
    return;
  }
  document.getElementById('spin-btn').disabled = true;

  const slots = buildWheelSlotsForDay(today);
  const rand = Math.random;
  const winningIndex = pickWinningSlotIndex(slots, rand);

  const step = 360 / slots.length;
  const targetAngle = winningIndex * step + step / 2;
  const targetMod = (360 - (targetAngle % 360) + 360) % 360;
  const currentMod = ((wheelRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta <= 0) delta += 360;
  wheelRotation += 6 * 360 + delta;

  const rotor = document.getElementById('wheel-rotor');
  if (rotor) {
    rotor.style.transition = 'transform 3.2s cubic-bezier(0.17, 0.67, 0.1, 1)';
    rotor.style.transform = `rotate(${wheelRotation}deg)`;
  }

  setTimeout(() => {
    applyWheelSlotResult(slots[winningIndex], rand);
    state.wheel.lastSpinDate = today;
    state.wheel.totalSpins += 1;
    persist();
    document.getElementById('wheel-status').textContent = 'Already spun today — come back tomorrow.';
    document.getElementById('wheel-result').textContent = state.wheel.lastResult.label;
    checkAchievements();
  }, 3300);
}

// ---------- people tab (section 11) ----------

function renderPeople() {
  document.getElementById('people-list').innerHTML = PEOPLE.map((p) => {
    const unlocked = isChapterReached(p.unlockChapter);
    if (!unlocked) {
      return `<div class="person-card locked"><div class="person-name">🌑 ???</div><div class="person-status">Reach Chapter ${p.unlockChapter} to meet them.</div></div>`;
    }
    let stageText = p.stages[0].text;
    let stageIdx = 0;
    for (let i = p.stages.length - 1; i >= 0; i--) {
      const st = p.stages[i];
      if (st.after == null || state.story.clearedChapters.includes(st.after)) {
        stageText = st.text;
        stageIdx = i;
        break;
      }
    }
    const isFinalStage = stageIdx === p.stages.length - 1;
    const icon = isFinalStage && /died|gave (his|her) life|fell|struck down/i.test(stageText) ? '🪦' : '🥷';
    return `<div class="person-card"><div class="person-name">${icon} ${p.name}</div><div class="person-status">${stageText}</div></div>`;
  }).join('');
}

// ---------- jutsu tab (section 12) ----------

function jutsuKindLabel(j) {
  if (j.battle) {
    const k = j.battle.kind;
    if (k === 'attack') return `Attack ×${j.battle.multiplier}`;
    if (k === 'heal') return `Heal ${Math.round(j.battle.healPercent * 100)}% HP`;
    if (k === 'debuff') return `Debuff −${Math.round(j.battle.dmgReduction * 100)}% boss dmg`;
    if (k === 'stun') return 'Stun — skip boss attack';
    if (k === 'nuke') return `Nuke ×${j.battle.multiplier} (costs HP)`;
    if (k === 'summon') return `Summon +${Math.round(j.battle.bonusMultiplier * 100)}% dmg`;
  }
  if (j.passive) {
    const { stat, mode, value } = j.passive;
    const pretty = { maxHp: 'Max HP', weaponDamage: 'Weapon Dmg', critChance: 'Crit Chance', shield: 'Shield' }[stat] || stat;
    return `Passive: +${mode === 'percent' ? Math.round(value * 100) + '%' : value} ${pretty}`;
  }
  if (j.utility && j.utility.effect === 'travelSpeed') return `Utility: −${Math.round(j.utility.value * 100)}% travel time`;
  return '';
}

function renderJutsu() {
  document.getElementById('jutsu-list').innerHTML = JUTSU_CATEGORY_ORDER.map((cat) => {
    const group = JUTSU.filter((j) => j.category === cat);
    const cards = group
      .map((j) => {
        const unlocked = isJutsuUnlocked(j);
        return `<div class="item-card jutsu-card ${unlocked ? '' : 'locked'}" style="--rarity-color:${JUTSU_CATEGORY_COLORS[cat]}">
          <div class="item-card-head">
            <div class="item-icon-wrap">${j.icon}</div>
            <div>
              <div class="item-card-name">${unlocked ? j.name : '???'}</div>
              <div class="item-card-rarity">${JUTSU_CATEGORY_LABELS[cat]}</div>
            </div>
          </div>
          <div class="item-card-meta"><span>${unlocked ? jutsuKindLabel(j) : '🔒 Locked'}</span></div>
          <div class="item-card-note">${unlocked ? j.desc : jutsuUnlockText(j)}</div>
        </div>`;
      })
      .join('');
    return `<div>
      <div class="ach-category-title">${JUTSU_CATEGORY_LABELS[cat]}</div>
      <div class="jutsu-grid">${cards}</div>
    </div>`;
  }).join('');
}

// ---------- achievements ----------

const ACHIEVEMENT_CATEGORY_ICONS = {
  Streaks: '🔥',
  'Quests Completed': '✅',
  'Rank Tiers': '⭐',
  Story: '📖',
  'Life-Goal Arcs': '🎯',
  Gear: '🎒',
  'Currency & Wheel': '💰',
};

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
        <div class="ach-category-title">${ACHIEVEMENT_CATEGORY_ICONS[cat] || '🏅'} ${cat}</div>
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
  else if (tab === 'character') renderCharacter();
  else if (tab === 'shop') renderShop();
  else if (tab === 'map') renderWorldMap();
  else if (tab === 'wheel') renderWheel();
  else if (tab === 'people') renderPeople();
  else if (tab === 'jutsu') renderJutsu();
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
    useJutsu(btn.dataset.skill);
  });

  document.getElementById('tab-character').addEventListener('click', (e) => {
    const slotBtn = e.target.closest('.equip-slot-card');
    if (slotBtn) {
      openEquipPicker(slotBtn.dataset.slot);
      return;
    }
    const styleBtn = e.target.closest('[data-hair-style]');
    if (styleBtn) {
      state.hair.style = styleBtn.dataset.hairStyle;
      persist();
      renderCharacter();
      return;
    }
    const colorBtn = e.target.closest('[data-hair-color]');
    if (colorBtn) {
      state.hair.color = colorBtn.dataset.hairColor;
      persist();
      renderCharacter();
    }
  });

  document.getElementById('picker-list').addEventListener('click', (e) => {
    if (!pendingSlot) return;
    const unequip = e.target.closest('[data-unequip]');
    if (unequip) {
      state.equipped[pendingSlot] = null;
      persist();
      closePicker();
      renderCharacter();
      return;
    }
    const row = e.target.closest('[data-equip-id]');
    if (row) {
      state.equipped[pendingSlot] = row.dataset.equipId;
      persist();
      closePicker();
      renderCharacter();
      checkAchievements();
    }
  });
  document.getElementById('picker-close-btn').addEventListener('click', closePicker);

  document.getElementById('tab-shop').addEventListener('click', (e) => {
    const familyBtn = e.target.closest('[data-family]');
    if (familyBtn) {
      shopActiveFamily = familyBtn.dataset.family;
      renderShop();
      return;
    }
    const buyBtn = e.target.closest('[data-buy]');
    if (buyBtn && !buyBtn.disabled) {
      const item = ITEMS.find((i) => i.id === buyBtn.dataset.buy);
      if (item) buyItem(item);
      return;
    }
    const claimBtn = e.target.closest('[data-claim]');
    if (claimBtn && !claimBtn.disabled) {
      const item = ITEMS.find((i) => i.id === claimBtn.dataset.claim);
      if (item) claimFreeItem(item);
    }
  });

  document.getElementById('tab-map').addEventListener('click', (e) => {
    const travelBtn = e.target.closest('[data-travel]');
    if (travelBtn && !travelBtn.disabled) {
      startTravel(travelBtn.dataset.travel);
      return;
    }
    const landmark = e.target.closest('[data-lore]');
    if (landmark) openLore(landmark.dataset.lore);
  });
  document.getElementById('lore-close-btn').addEventListener('click', () => {
    document.getElementById('lore-modal').hidden = true;
  });

  document.getElementById('spin-btn').addEventListener('click', spinWheel);

  setInterval(() => {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    if (ensureDailyReset() && activeTab === 'quests') renderQuests();
    if (activeTab === 'map') renderWorldMap();
    if (activeTab === 'wheel') renderWheel();
  }, 60000);

  // Belt-and-suspenders autosave — every state-changing action already
  // persists immediately, this just guards against anything that doesn't.
  setInterval(() => persist(), 30000);
}

// ---------- init ----------

async function init() {
  const loaded = await window.ninkSaga.loadState();
  state = normalizeState(loaded);
  grantStarterKitIfNeeded();
  ensureDailyReset();
  renderHeader();
  renderStats();
  renderQuests();
  renderStory();
  renderAchievements();
  wireEvents();
}

init();
