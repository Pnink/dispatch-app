// The Nink Saga — full item catalog (140 shop/wheel items) + expressions (16),
// transcribed from the design reference doc's section 5 tables and 4.7.
// Equip slot for a given item = ITEM_SLOT_BY_FAMILY[item.family].

const ITEM_SLOT_BY_FAMILY = {
  headband: 'headband',
  hat: 'hat',
  top: 'top',
  bottom: 'bottom',
  footwear: 'footwear',
  gloves: 'gloves',
  kunai: 'weapon',
  shuriken: 'weapon',
  otherWeapon: 'weapon',
  accessory: 'accessory',
  summon: 'summon',
};

const RARITY_COLORS = {
  common: '#9aa0a8',
  uncommon: '#5fb88a',
  rare: '#4f8fd1',
  epic: '#a06cd5',
  legendary: '#dba64c',
  mythic: '#c199e8',
};

const ITEMS = [
  // 5.1 Headbands (6) — hp
  { id: 'headband-1', name: 'Leaf Village Headband', family: 'headband', rarity: 'common', cost: 80, unlockTier: 0, village: null, stat: { type: 'hp', value: 8 }, color: '#2f5fa8' },
  { id: 'headband-2', name: 'Sand Village Headband', family: 'headband', rarity: 'uncommon', cost: 200, unlockTier: 3, village: 'sand', stat: { type: 'hp', value: 18 }, color: '#c9a24b' },
  { id: 'headband-3', name: 'Mist Village Headband', family: 'headband', rarity: 'uncommon', cost: 220, unlockTier: 4, village: 'mist', stat: { type: 'hp', value: 18 }, color: '#5a7a8c' },
  { id: 'headband-4', name: 'Hidden Cloud Headband', family: 'headband', rarity: 'uncommon', cost: 230, unlockTier: 5, village: 'cloud', stat: { type: 'hp', value: 18 }, color: '#7a5fa0' },
  { id: 'headband-5', name: 'Hidden Stone Headband', family: 'headband', rarity: 'uncommon', cost: 230, unlockTier: 3, village: 'stone', stat: { type: 'hp', value: 18 }, color: '#8a8478' },
  { id: 'headband-6', name: 'Hidden Rain Headband', family: 'headband', rarity: 'uncommon', cost: 210, unlockTier: 4, village: 'rain', stat: { type: 'hp', value: 18 }, color: '#4f6f8c' },

  // 5.2 Hats (7) — hp
  { id: 'hat-1', name: "Traveler's Straw Hat", family: 'hat', rarity: 'common', cost: 50, unlockTier: 0, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#c9a24b' },
  { id: 'hat-2', name: 'Academy Cap', family: 'hat', rarity: 'common', cost: 55, unlockTier: 1, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#3f5a3f' },
  { id: 'hat-3', name: 'Sand Desert Hood', family: 'hat', rarity: 'common', cost: 65, unlockTier: 2, village: 'sand', stat: { type: 'hp', value: 15 }, color: '#c9a24b' },
  { id: 'hat-4', name: 'Leaf Field Cap', family: 'hat', rarity: 'uncommon', cost: 200, unlockTier: 3, village: 'leaf', stat: { type: 'hp', value: 35 }, color: '#3f6b3a' },
  { id: 'hat-5', name: "Stone Miner's Helm", family: 'hat', rarity: 'rare', cost: 645, unlockTier: 7, village: 'stone', stat: { type: 'hp', value: 65 }, color: '#6b6f75' },
  { id: 'hat-6', name: 'Rain Wide-Brim Hat', family: 'hat', rarity: 'rare', cost: 635, unlockTier: 8, village: 'rain', stat: { type: 'hp', value: 65 }, color: '#4f6f8c' },
  { id: 'hat-7', name: "Kage's Ceremonial Hat", family: 'hat', rarity: 'legendary', cost: 3400, unlockTier: 12, village: 'leaf', stat: { type: 'hp', value: 220 }, color: '#dba64c' },

  // 5.4 Tops (42) — hp
  { id: 'top-1', name: 'Flak Jacket', family: 'top', rarity: 'uncommon', cost: 250, unlockTier: 5, village: null, stat: { type: 'hp', value: 35 }, color: '#5a6b4a' },
  { id: 'top-2', name: 'Black Flak Jacket', family: 'top', rarity: 'uncommon', cost: 240, unlockTier: 3, village: null, stat: { type: 'hp', value: 35 }, color: '#2b2f36' },
  { id: 'top-3', name: 'Sage Cloak', family: 'top', rarity: 'rare', cost: 700, unlockTier: 6, village: null, stat: { type: 'hp', value: 65 }, color: '#5fb88a' },
  { id: 'top-4', name: 'Violet Sage Cloak', family: 'top', rarity: 'rare', cost: 720, unlockTier: 7, village: null, stat: { type: 'hp', value: 65 }, color: '#6b4f8c' },
  { id: 'top-5', name: 'Nine-Tails Chakra Cloak', family: 'top', rarity: 'rare', cost: 850, unlockTier: 8, village: null, stat: { type: 'hp', value: 65 }, color: '#c0563f' },
  { id: 'top-6', name: 'ANBU Mask & Cloak', family: 'top', rarity: 'epic', cost: 1200, unlockTier: 9, village: null, stat: { type: 'hp', value: 120 }, color: '#2e2f33' },
  { id: 'top-7', name: 'Red Cloud Ninja Cloak', family: 'top', rarity: 'epic', cost: 1400, unlockTier: 10, village: null, stat: { type: 'hp', value: 120 }, color: '#8c2f2f' },
  { id: 'top-8', name: 'Hokage Robe & Hat', family: 'top', rarity: 'legendary', cost: 3000, unlockTier: 12, village: null, stat: { type: 'hp', value: 220 }, color: '#8c2f2f' },
  { id: 'top-9', name: 'Six Paths Chakra Cloak', family: 'top', rarity: 'legendary', cost: 4000, unlockTier: 13, village: null, stat: { type: 'hp', value: 220 }, color: '#dba64c' },
  { id: 'top-10', name: 'Academy Student Uniform', family: 'top', rarity: 'common', cost: 70, unlockTier: 2, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#3f5a3f' },
  { id: 'top-11', name: 'Training Weight Suit', family: 'top', rarity: 'common', cost: 100, unlockTier: 0, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#6b6f75' },
  { id: 'top-12', name: 'Leaf Chūnin Vest', family: 'top', rarity: 'uncommon', cost: 230, unlockTier: 5, village: 'leaf', stat: { type: 'hp', value: 35 }, color: '#3f6b3a' },
  { id: 'top-13', name: 'Traditional Leaf Kimono', family: 'top', rarity: 'rare', cost: 680, unlockTier: 8, village: 'leaf', stat: { type: 'hp', value: 65 }, color: '#8c3f4a' },
  { id: 'top-14', name: 'Leaf Jōnin Cloak', family: 'top', rarity: 'rare', cost: 760, unlockTier: 6, village: 'leaf', stat: { type: 'hp', value: 65 }, color: '#2f5f4a' },
  { id: 'top-15', name: 'Black Ops Undercoat', family: 'top', rarity: 'epic', cost: 1350, unlockTier: 11, village: 'leaf', stat: { type: 'hp', value: 120 }, color: '#1c1f24' },
  { id: 'top-16', name: 'Desert Camouflage Cloak', family: 'top', rarity: 'rare', cost: 700, unlockTier: 8, village: 'sand', stat: { type: 'hp', value: 65 }, color: '#c9a24b' },
  { id: 'top-17', name: 'Kirigakure Mist Cloak', family: 'top', rarity: 'rare', cost: 750, unlockTier: 8, village: 'mist', stat: { type: 'hp', value: 65 }, color: '#5a7a8c' },
  { id: 'top-18', name: 'Lightning Armor Plating', family: 'top', rarity: 'epic', cost: 1400, unlockTier: 11, village: 'cloud', stat: { type: 'hp', value: 120 }, color: '#7a5fa0' },
  { id: 'top-19', name: 'Storm Cloak', family: 'top', rarity: 'legendary', cost: 3800, unlockTier: 13, village: 'cloud', stat: { type: 'hp', value: 220 }, color: '#7a5fa0' },
  { id: 'top-20', name: 'Iwagakure Cloak', family: 'top', rarity: 'epic', cost: 1420, unlockTier: 10, village: 'stone', stat: { type: 'hp', value: 120 }, color: '#8a8478' },
  { id: 'top-21', name: 'Rain Cloak', family: 'top', rarity: 'rare', cost: 710, unlockTier: 6, village: 'rain', stat: { type: 'hp', value: 65 }, color: '#4f6f8c' },
  { id: 'top-22', name: 'Rain Poncho', family: 'top', rarity: 'common', cost: 65, unlockTier: 0, village: 'rain', stat: { type: 'hp', value: 15 }, color: '#4f6f8c' },
  { id: 'top-23', name: 'Camouflage Net Cloak', family: 'top', rarity: 'uncommon', cost: 210, unlockTier: 3, village: 'leaf', stat: { type: 'hp', value: 35 }, color: '#5a6b4a' },
  { id: 'top-24', name: 'Tailed-Beast Chakra Shroud', family: 'top', rarity: 'mythic', cost: null, wheelOnly: true, unlockTier: 14, village: null, stat: { type: 'hp', value: 400 }, color: '#e2793d' },
  { id: 'top-25', name: 'Leaf Genin Uniform', family: 'top', rarity: 'common', cost: 60, unlockTier: 0, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#2f5f4a' },
  { id: 'top-26', name: 'Padded Training Gi', family: 'top', rarity: 'common', cost: 75, unlockTier: 1, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#5a6b4a' },
  { id: 'top-27', name: 'Sand Desert Wrap', family: 'top', rarity: 'common', cost: 70, unlockTier: 2, village: 'sand', stat: { type: 'hp', value: 15 }, color: '#c9a24b' },
  { id: 'top-28', name: 'Leaf Special Jōnin Coat', family: 'top', rarity: 'rare', cost: 690, unlockTier: 6, village: 'leaf', stat: { type: 'hp', value: 65 }, color: '#1f4a3a' },
  { id: 'top-29', name: 'Suna Battle Robes', family: 'top', rarity: 'rare', cost: 700, unlockTier: 7, village: 'sand', stat: { type: 'hp', value: 65 }, color: '#c9844b' },
  { id: 'top-30', name: 'Mist Swordsman Coat', family: 'top', rarity: 'rare', cost: 710, unlockTier: 8, village: 'mist', stat: { type: 'hp', value: 65 }, color: '#5a7a8c' },
  { id: 'top-31', name: 'Cloud Battle Armor', family: 'top', rarity: 'rare', cost: 720, unlockTier: 6, village: 'cloud', stat: { type: 'hp', value: 65 }, color: '#7a5fa0' },
  { id: 'top-32', name: 'Iwa Combat Gear', family: 'top', rarity: 'rare', cost: 715, unlockTier: 7, village: 'stone', stat: { type: 'hp', value: 65 }, color: '#6b6f75' },
  { id: 'top-33', name: 'Ame Trench Coat', family: 'top', rarity: 'rare', cost: 705, unlockTier: 8, village: 'rain', stat: { type: 'hp', value: 65 }, color: '#4f6f8c' },
  { id: 'top-34', name: 'Shadow Ops Garb', family: 'top', rarity: 'epic', cost: 1370, unlockTier: 9, village: 'leaf', stat: { type: 'hp', value: 120 }, color: '#1c1f24' },
  { id: 'top-35', name: 'Sand Ninja Gourd Harness', family: 'top', rarity: 'epic', cost: 1440, unlockTier: 10, village: 'sand', stat: { type: 'hp', value: 120 }, color: '#8a6f4f' },
  { id: 'top-36', name: 'Hunter-nin Mask & Cloak', family: 'top', rarity: 'epic', cost: 1460, unlockTier: 11, village: 'mist', stat: { type: 'hp', value: 120 }, color: '#2a2f38' },
  { id: 'top-37', name: 'Raiton Storm Coat', family: 'top', rarity: 'epic', cost: 1480, unlockTier: 9, village: 'cloud', stat: { type: 'hp', value: 120 }, color: '#a06cd5' },
  { id: 'top-38', name: 'Stone Golem Plate Armor', family: 'top', rarity: 'epic', cost: 1500, unlockTier: 10, village: 'stone', stat: { type: 'hp', value: 120 }, color: '#5a5f68' },
  { id: 'top-39', name: 'Rain Gas Mask Cloak', family: 'top', rarity: 'epic', cost: 1420, unlockTier: 11, village: 'rain', stat: { type: 'hp', value: 120 }, color: '#3a4a52' },
  { id: 'top-40', name: 'Ceremonial Leaf Robe', family: 'top', rarity: 'legendary', cost: 3200, unlockTier: 12, village: 'leaf', stat: { type: 'hp', value: 220 }, color: '#8c3f4a' },
  { id: 'top-41', name: 'Mist Ceremonial Robes', family: 'top', rarity: 'legendary', cost: 3600, unlockTier: 13, village: 'mist', stat: { type: 'hp', value: 220 }, color: '#4f6f8c' },
  { id: 'top-42', name: 'Tactical Ninja Vest', family: 'top', rarity: 'common', cost: 0, unlockTier: 0, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#5a6b4a' },

  // 5.5 Bottoms (8) — hp
  { id: 'bottom-1', name: 'Standard Ninja Pants', family: 'bottom', rarity: 'common', cost: 0, unlockTier: 0, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#2f3a52' },
  { id: 'bottom-2', name: 'Academy Shorts', family: 'bottom', rarity: 'common', cost: 55, unlockTier: 1, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#3f5a3f' },
  { id: 'bottom-3', name: 'Sand Desert Trousers', family: 'bottom', rarity: 'common', cost: 65, unlockTier: 2, village: 'sand', stat: { type: 'hp', value: 15 }, color: '#c9a24b' },
  { id: 'bottom-4', name: 'Leaf Combat Pants', family: 'bottom', rarity: 'uncommon', cost: 200, unlockTier: 3, village: 'leaf', stat: { type: 'hp', value: 35 }, color: '#3f6b3a' },
  { id: 'bottom-5', name: 'Mist Wetsuit Leggings', family: 'bottom', rarity: 'uncommon', cost: 215, unlockTier: 5, village: 'mist', stat: { type: 'hp', value: 35 }, color: '#5a7a8c' },
  { id: 'bottom-6', name: 'Cloud Storm Pants', family: 'bottom', rarity: 'rare', cost: 650, unlockTier: 6, village: 'cloud', stat: { type: 'hp', value: 65 }, color: '#7a5fa0' },
  { id: 'bottom-7', name: 'Stone Reinforced Trousers', family: 'bottom', rarity: 'rare', cost: 660, unlockTier: 7, village: 'stone', stat: { type: 'hp', value: 65 }, color: '#6b6f75' },
  { id: 'bottom-8', name: 'Six Paths Hakama', family: 'bottom', rarity: 'legendary', cost: 3300, unlockTier: 12, village: 'leaf', stat: { type: 'hp', value: 220 }, color: '#dba64c' },

  // 5.6 Footwear (8) — hp
  { id: 'footwear-1', name: 'Basic Ninja Sandals', family: 'footwear', rarity: 'common', cost: 0, unlockTier: 0, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#3a2f28' },
  { id: 'footwear-2', name: 'Academy Sandals', family: 'footwear', rarity: 'common', cost: 50, unlockTier: 1, village: 'leaf', stat: { type: 'hp', value: 15 }, color: '#5a4632' },
  { id: 'footwear-3', name: 'Sand Desert Boots', family: 'footwear', rarity: 'common', cost: 60, unlockTier: 2, village: 'sand', stat: { type: 'hp', value: 15 }, color: '#c9a24b' },
  { id: 'footwear-4', name: 'Leaf Combat Boots', family: 'footwear', rarity: 'uncommon', cost: 190, unlockTier: 3, village: 'leaf', stat: { type: 'hp', value: 35 }, color: '#3f6b3a' },
  { id: 'footwear-5', name: 'Mist Diving Boots', family: 'footwear', rarity: 'uncommon', cost: 205, unlockTier: 5, village: 'mist', stat: { type: 'hp', value: 35 }, color: '#5a7a8c' },
  { id: 'footwear-6', name: 'Cloud Storm Treads', family: 'footwear', rarity: 'rare', cost: 640, unlockTier: 6, village: 'cloud', stat: { type: 'hp', value: 65 }, color: '#7a5fa0' },
  { id: 'footwear-7', name: 'Flying Swallow Sandals', family: 'footwear', rarity: 'epic', cost: 1400, unlockTier: 9, village: 'leaf', stat: { type: 'hp', value: 120 }, color: '#dba64c' },
  { id: 'footwear-8', name: 'Six Paths Sandals', family: 'footwear', rarity: 'legendary', cost: 3250, unlockTier: 12, village: 'leaf', stat: { type: 'hp', value: 220 }, color: '#dba64c' },

  // 5.7 Gloves (7) — shield
  { id: 'gloves-1', name: 'Hand Wraps', family: 'gloves', rarity: 'common', cost: 45, unlockTier: 0, village: 'leaf', stat: { type: 'shield', value: 3 }, color: '#c9b98a' },
  { id: 'gloves-2', name: 'Academy Gloves', family: 'gloves', rarity: 'common', cost: 55, unlockTier: 1, village: 'leaf', stat: { type: 'shield', value: 3 }, color: '#5a6b4a' },
  { id: 'gloves-3', name: 'Sand Fingerless Gloves', family: 'gloves', rarity: 'common', cost: 65, unlockTier: 2, village: 'sand', stat: { type: 'shield', value: 3 }, color: '#c9a24b' },
  { id: 'gloves-4', name: 'Leaf Combat Gloves', family: 'gloves', rarity: 'uncommon', cost: 195, unlockTier: 3, village: 'leaf', stat: { type: 'shield', value: 6 }, color: '#3f6b3a' },
  { id: 'gloves-5', name: 'Cloud Storm Gloves', family: 'gloves', rarity: 'rare', cost: 630, unlockTier: 6, village: 'cloud', stat: { type: 'shield', value: 12 }, color: '#7a5fa0' },
  { id: 'gloves-6', name: 'Chakra-Conductive Gloves', family: 'gloves', rarity: 'epic', cost: 1380, unlockTier: 9, village: 'leaf', stat: { type: 'shield', value: 20 }, color: '#a06cd5' },
  { id: 'gloves-7', name: 'Six Paths Gloves', family: 'gloves', rarity: 'legendary', cost: 3150, unlockTier: 12, village: 'leaf', stat: { type: 'shield', value: 35 }, color: '#dba64c' },

  // 5.8 Kunai (5) — damage
  { id: 'kunai-1', name: 'Kunai Set', family: 'kunai', rarity: 'common', cost: 60, unlockTier: 1, village: null, stat: { type: 'damage', value: 10 }, color: '#9aa0a8' },
  { id: 'kunai-2', name: 'Silver Kunai', family: 'kunai', rarity: 'uncommon', cost: 150, unlockTier: 4, village: null, stat: { type: 'damage', value: 18 }, color: '#c7ccd1' },
  { id: 'kunai-3', name: 'Crimson-Edge Kunai', family: 'kunai', rarity: 'rare', cost: 550, unlockTier: 7, village: null, stat: { type: 'damage', value: 30 }, color: '#b23a3a' },
  { id: 'kunai-4', name: 'Leaf-Forged Kunai', family: 'kunai', rarity: 'common', cost: 70, unlockTier: 2, village: 'leaf', stat: { type: 'damage', value: 10 }, color: '#9aa0a8' },
  { id: 'kunai-5', name: 'Explosive-Tag Kunai', family: 'kunai', rarity: 'epic', cost: 1300, unlockTier: 10, village: 'leaf', stat: { type: 'damage', value: 50 }, color: '#d9843a' },

  // 5.9 Shuriken (4) — damage
  { id: 'shuriken-1', name: 'Shuriken Pouch', family: 'shuriken', rarity: 'common', cost: 60, unlockTier: 2, village: null, stat: { type: 'damage', value: 10 }, color: '#b8bcc2' },
  { id: 'shuriken-2', name: 'Wind-Style Shuriken', family: 'shuriken', rarity: 'uncommon', cost: 160, unlockTier: 5, village: null, stat: { type: 'damage', value: 18 }, color: '#7fd6c2' },
  { id: 'shuriken-3', name: 'Flame-Etched Shuriken', family: 'shuriken', rarity: 'rare', cost: 580, unlockTier: 8, village: null, stat: { type: 'damage', value: 30 }, color: '#e2793d' },
  { id: 'shuriken-4', name: 'Giant Windmill Shuriken', family: 'shuriken', rarity: 'rare', cost: 650, unlockTier: 8, village: 'leaf', stat: { type: 'damage', value: 30 }, color: '#9aa0a8' },

  // 5.10 Other Weapons (23) — damage
  { id: 'otherweapon-1', name: 'Explosive Tag Set', family: 'otherWeapon', rarity: 'uncommon', cost: 180, unlockTier: 3, village: null, stat: { type: 'damage', value: 18 }, color: '#d9843a' },
  { id: 'otherweapon-2', name: 'Chakra Blade', family: 'otherWeapon', rarity: 'rare', cost: 600, unlockTier: 6, village: null, stat: { type: 'damage', value: 30 }, color: '#4f8fd1' },
  { id: 'otherweapon-3', name: 'Senbon Needle Set', family: 'otherWeapon', rarity: 'common', cost: 55, unlockTier: 0, village: 'leaf', stat: { type: 'damage', value: 10 }, color: '#c7ccd1' },
  { id: 'otherweapon-4', name: 'Bo Staff', family: 'otherWeapon', rarity: 'common', cost: 90, unlockTier: 1, village: 'leaf', stat: { type: 'damage', value: 10 }, color: '#8a6f4f' },
  { id: 'otherweapon-5', name: 'Tantō Blade', family: 'otherWeapon', rarity: 'uncommon', cost: 170, unlockTier: 5, village: 'leaf', stat: { type: 'damage', value: 18 }, color: '#7c8a99' },
  { id: 'otherweapon-6', name: 'War Fan', family: 'otherWeapon', rarity: 'uncommon', cost: 190, unlockTier: 3, village: 'leaf', stat: { type: 'damage', value: 18 }, color: '#c9844b' },
  { id: 'otherweapon-7', name: 'Poison-Tipped Darts', family: 'otherWeapon', rarity: 'uncommon', cost: 150, unlockTier: 4, village: 'leaf', stat: { type: 'damage', value: 18 }, color: '#5a8f5a' },
  { id: 'otherweapon-8', name: 'Twin Ninjatō Blades', family: 'otherWeapon', rarity: 'rare', cost: 700, unlockTier: 6, village: 'leaf', stat: { type: 'damage', value: 30 }, color: '#4f6f8c' },
  { id: 'otherweapon-9', name: 'Chakra-Infused Nunchaku', family: 'otherWeapon', rarity: 'rare', cost: 620, unlockTier: 7, village: 'leaf', stat: { type: 'damage', value: 30 }, color: '#d1a34f' },
  { id: 'otherweapon-10', name: 'Puppet Ninja Toolkit', family: 'otherWeapon', rarity: 'rare', cost: 720, unlockTier: 6, village: 'sand', stat: { type: 'damage', value: 30 }, color: '#8a6f4f' },
  { id: 'otherweapon-11', name: 'Silent Killing Blade', family: 'otherWeapon', rarity: 'rare', cost: 730, unlockTier: 7, village: 'mist', stat: { type: 'damage', value: 30 }, color: '#5a7a8c' },
  { id: 'otherweapon-12', name: 'Raiton Gauntlets', family: 'otherWeapon', rarity: 'epic', cost: 1450, unlockTier: 9, village: 'cloud', stat: { type: 'damage', value: 50 }, color: '#a06cd5' },
  { id: 'otherweapon-13', name: 'Stone-Forged War Hammer', family: 'otherWeapon', rarity: 'rare', cost: 740, unlockTier: 7, village: 'stone', stat: { type: 'damage', value: 30 }, color: '#6b6f75' },
  { id: 'otherweapon-14', name: 'Amegakure Umbrella Blade', family: 'otherWeapon', rarity: 'rare', cost: 690, unlockTier: 8, village: 'rain', stat: { type: 'damage', value: 30 }, color: '#4f6f8c' },
  { id: 'otherweapon-15', name: 'Smoke Bomb Pouch', family: 'otherWeapon', rarity: 'common', cost: 75, unlockTier: 1, village: 'leaf', stat: { type: 'damage', value: 10 }, color: '#8a8478' },
  { id: 'otherweapon-16', name: 'Twin Daggers', family: 'otherWeapon', rarity: 'common', cost: 85, unlockTier: 2, village: 'leaf', stat: { type: 'damage', value: 10 }, color: '#9aa0a8' },
  { id: 'otherweapon-17', name: 'Grappling Hook Wire', family: 'otherWeapon', rarity: 'uncommon', cost: 195, unlockTier: 4, village: 'leaf', stat: { type: 'damage', value: 18 }, color: '#8a8478' },
  { id: 'otherweapon-18', name: 'Explosive Clay Satchel', family: 'otherWeapon', rarity: 'rare', cost: 670, unlockTier: 7, village: 'stone', stat: { type: 'damage', value: 30 }, color: '#c9844b' },
  { id: 'otherweapon-19', name: 'War Drum', family: 'otherWeapon', rarity: 'rare', cost: 610, unlockTier: 8, village: 'leaf', stat: { type: 'damage', value: 30 }, color: '#8a4f3a' },
  { id: 'otherweapon-20', name: 'Lightning Rod Spear', family: 'otherWeapon', rarity: 'rare', cost: 730, unlockTier: 8, village: 'cloud', stat: { type: 'damage', value: 30 }, color: '#a06cd5' },
  { id: 'otherweapon-21', name: 'Boulder Gauntlets', family: 'otherWeapon', rarity: 'epic', cost: 1460, unlockTier: 9, village: 'stone', stat: { type: 'damage', value: 50 }, color: '#8a8478' },
  { id: 'otherweapon-22', name: 'Puppet Chakra Strings', family: 'otherWeapon', rarity: 'epic', cost: 1580, unlockTier: 11, village: 'sand', stat: { type: 'damage', value: 50 }, color: '#c7ccd1' },
  { id: 'otherweapon-23', name: 'Thousand-Fold Iron Fan', family: 'otherWeapon', rarity: 'mythic', cost: null, wheelOnly: true, unlockTier: 14, village: null, stat: { type: 'damage', value: 160 }, color: '#dba64c' },

  // 5.11 Accessories (23) — shield
  { id: 'accessory-1', name: 'Standard Ninja Sandals', family: 'accessory', rarity: 'common', cost: 50, unlockTier: 0, village: null, stat: { type: 'shield', value: 3 }, color: '#8a6f4f' },
  { id: 'accessory-2', name: 'Chakra Training Weights', family: 'accessory', rarity: 'common', cost: 90, unlockTier: 1, village: null, stat: { type: 'shield', value: 3 }, color: '#6b6f75' },
  { id: 'accessory-3', name: 'Blank Summoning Scroll', family: 'accessory', rarity: 'uncommon', cost: 300, unlockTier: 4, village: null, stat: { type: 'shield', value: 6 }, color: '#c9b98a' },
  { id: 'accessory-4', name: 'Advanced Eye Technique Lenses', family: 'accessory', rarity: 'rare', cost: 500, unlockTier: 6, village: null, stat: { type: 'shield', value: 12 }, color: '#7a3fd1' },
  { id: 'accessory-5', name: 'Ultimate Eye Technique Lenses', family: 'accessory', rarity: 'epic', cost: 1600, unlockTier: 11, village: null, stat: { type: 'shield', value: 20 }, color: '#a06cd5' },
  { id: 'accessory-6', name: 'Legendary Sannin Plaque', family: 'accessory', rarity: 'legendary', cost: 5000, unlockTier: 14, village: null, stat: { type: 'shield', value: 35 }, color: '#dba64c' },
  { id: 'accessory-7', name: 'Chakra Nature Paper', family: 'accessory', rarity: 'common', cost: 50, unlockTier: 1, village: 'leaf', stat: { type: 'shield', value: 3 }, color: '#e3ddc9' },
  { id: 'accessory-8', name: 'Medical Ninja Pouch', family: 'accessory', rarity: 'uncommon', cost: 210, unlockTier: 3, village: 'leaf', stat: { type: 'shield', value: 6 }, color: '#5fb88a' },
  { id: 'accessory-9', name: 'Tracking Goggles', family: 'accessory', rarity: 'uncommon', cost: 240, unlockTier: 4, village: 'leaf', stat: { type: 'shield', value: 6 }, color: '#4f8fd1' },
  { id: 'accessory-10', name: 'Anti-Genjutsu Charm', family: 'accessory', rarity: 'rare', cost: 560, unlockTier: 7, village: 'leaf', stat: { type: 'shield', value: 12 }, color: '#a06cd5' },
  { id: 'accessory-11', name: 'Toad Oil Vial', family: 'accessory', rarity: 'rare', cost: 520, unlockTier: 8, village: 'leaf', stat: { type: 'shield', value: 12 }, color: '#5fb85f' },
  { id: 'accessory-12', name: 'Medical Chakra Seal', family: 'accessory', rarity: 'epic', cost: 1450, unlockTier: 9, village: 'leaf', stat: { type: 'shield', value: 20 }, color: '#dba64c' },
  { id: 'accessory-13', name: 'Sage Mode Talisman', family: 'accessory', rarity: 'legendary', cost: 4200, unlockTier: 12, village: 'leaf', stat: { type: 'shield', value: 35 }, color: '#dba64c' },
  { id: 'accessory-14', name: 'Wind Scroll', family: 'accessory', rarity: 'epic', cost: 1500, unlockTier: 9, village: 'sand', stat: { type: 'shield', value: 20 }, color: '#e3ddc9' },
  { id: 'accessory-15', name: 'Water Style Scroll', family: 'accessory', rarity: 'epic', cost: 1520, unlockTier: 10, village: 'mist', stat: { type: 'shield', value: 20 }, color: '#4f8fd1' },
  { id: 'accessory-16', name: 'Doton Earth Shield', family: 'accessory', rarity: 'rare', cost: 700, unlockTier: 6, village: 'stone', stat: { type: 'shield', value: 12 }, color: '#8a8478' },
  { id: 'accessory-17', name: 'Waterproof Scroll Case', family: 'accessory', rarity: 'uncommon', cost: 220, unlockTier: 5, village: 'rain', stat: { type: 'shield', value: 6 }, color: '#4f6f8c' },
  { id: 'accessory-18', name: 'Storage Seal Tag', family: 'accessory', rarity: 'uncommon', cost: 230, unlockTier: 5, village: 'leaf', stat: { type: 'shield', value: 6 }, color: '#c9844b' },
  { id: 'accessory-19', name: 'Ink Brush & Scroll', family: 'accessory', rarity: 'rare', cost: 640, unlockTier: 6, village: 'leaf', stat: { type: 'shield', value: 12 }, color: '#2a2f38' },
  { id: 'accessory-20', name: 'Chakra Suppression Cuffs', family: 'accessory', rarity: 'epic', cost: 1380, unlockTier: 9, village: 'leaf', stat: { type: 'shield', value: 20 }, color: '#5a5f68' },
  { id: 'accessory-21', name: 'Ice Mirror Shard', family: 'accessory', rarity: 'epic', cost: 1520, unlockTier: 10, village: 'mist', stat: { type: 'shield', value: 20 }, color: '#a8d8e8' },
  { id: 'accessory-22', name: 'Soul-Sealing Vase', family: 'accessory', rarity: 'mythic', cost: null, wheelOnly: true, unlockTier: 14, village: null, stat: { type: 'shield', value: 60 }, color: '#a83fd1' },
  { id: 'accessory-23', name: "Reaper's Contract Scroll", family: 'accessory', rarity: 'mythic', cost: null, wheelOnly: true, unlockTier: 14, village: null, stat: { type: 'shield', value: 60 }, color: '#5a2f8c' },

  // 5.12 Summons (7) — assist
  { id: 'summon-1', name: 'Toad Summoning Contract', family: 'summon', rarity: 'rare', cost: 750, unlockTier: 7, village: null, stat: { type: 'assist', value: 15 }, color: '#5fb85f' },
  { id: 'summon-2', name: 'Fox Summoning Contract', family: 'summon', rarity: 'epic', cost: 1500, unlockTier: 9, village: null, stat: { type: 'assist', value: 25 }, color: '#d9843a' },
  { id: 'summon-3', name: 'Slug Summoning Contract', family: 'summon', rarity: 'rare', cost: 780, unlockTier: 6, village: 'leaf', stat: { type: 'assist', value: 15 }, color: '#a0d1a0' },
  { id: 'summon-4', name: 'Ninja Hound Summoning Contract', family: 'summon', rarity: 'rare', cost: 700, unlockTier: 7, village: 'leaf', stat: { type: 'assist', value: 15 }, color: '#8a6f4f' },
  { id: 'summon-5', name: 'Monkey Summoning Contract', family: 'summon', rarity: 'epic', cost: 1550, unlockTier: 10, village: 'leaf', stat: { type: 'assist', value: 25 }, color: '#7a5a3a' },
  { id: 'summon-6', name: 'Serpent Summoning Contract', family: 'summon', rarity: 'epic', cost: 1600, unlockTier: 11, village: 'leaf', stat: { type: 'assist', value: 25 }, color: '#5a8f5a' },
  { id: 'summon-7', name: 'Hundred Puppets Battle Scroll', family: 'summon', rarity: 'mythic', cost: null, wheelOnly: true, unlockTier: 14, village: null, stat: { type: 'assist', value: 80 }, color: '#c7ccd1' },
];

// 4.7 Facial Expressions (16) — free, unlock by rank only. +2% crit chance each (flat).
const EXPRESSIONS = [
  { id: 'expr-1', name: 'Neutral Look', unlockTier: 0, note: 'neutral' },
  { id: 'expr-2', name: 'Determined Glare', unlockTier: 1, note: 'determined' },
  { id: 'expr-3', name: 'Confident Smirk', unlockTier: 1, note: 'smirk' },
  { id: 'expr-4', name: 'Bright Grin', unlockTier: 2, note: 'grin' },
  { id: 'expr-5', name: 'Fierce Scowl', unlockTier: 2, note: 'scowl' },
  { id: 'expr-6', name: 'Sly Smirk', unlockTier: 3, note: 'sly' },
  { id: 'expr-7', name: 'Battle-Ready Focus', unlockTier: 3, note: 'focus' },
  { id: 'expr-8', name: 'Six Paths Calm', unlockTier: 4, note: 'calm' },
  { id: 'expr-9', name: 'Big Laugh', unlockTier: 4, note: 'laugh' },
  { id: 'expr-10', name: 'Shocked', unlockTier: 5, note: 'shocked' },
  { id: 'expr-11', name: 'Content Smile', unlockTier: 5, note: 'content' },
  { id: 'expr-12', name: 'Smug Grin', unlockTier: 6, note: 'smug' },
  { id: 'expr-13', name: 'Nervous', unlockTier: 6, note: 'nervous' },
  { id: 'expr-14', name: 'Sad', unlockTier: 7, note: 'sad' },
  { id: 'expr-15', name: 'Battle Roar', unlockTier: 7, note: 'roar' },
  { id: 'expr-16', name: 'Wink', unlockTier: 8, note: 'wink' },
];
const EXPRESSION_CRIT_BONUS = 0.02;

// 4.6 Hair — free, cosmetic only.
const HAIR_STYLES = ['Spiky', 'Short', 'Messy', 'Ponytail', 'Buzzcut', 'Long'];
const HAIR_COLORS = [
  { name: 'Black', hex: '#1c1410' },
  { name: 'Brown', hex: '#4a3524' },
  { name: 'Auburn/Red', hex: '#8c3f2f' },
  { name: 'Blonde', hex: '#c9a24b' },
  { name: 'Blue', hex: '#3a5a8c' },
  { name: 'White/Silver', hex: '#d8d4c8' },
];

// 4.5 Starter Kit — auto-granted & equipped on a new game, free regardless of listed cost.
const STARTER_KIT_ITEM_IDS = ['top-42', 'bottom-1', 'footwear-1', 'headband-1', 'kunai-2', 'accessory-9'];
const STARTER_EXPRESSION_ID = 'expr-1';

// 10 equipment slots, in the doc's order.
const EQUIPMENT_SLOTS = ['headband', 'hat', 'expression', 'top', 'bottom', 'footwear', 'gloves', 'weapon', 'accessory', 'summon'];

const SLOT_LABELS = {
  headband: 'Headband',
  hat: 'Headwear',
  expression: 'Expression',
  top: 'Top',
  bottom: 'Bottom',
  footwear: 'Footwear',
  gloves: 'Gloves',
  weapon: 'Weapon',
  accessory: 'Accessory',
  summon: 'Summon',
};

// Shop family tiles (section 6) — grouping for browsing, independent of equip slot.
const SHOP_FAMILIES = [
  { family: 'headband', label: 'Headbands' },
  { family: 'hat', label: 'Hats' },
  { family: 'top', label: 'Tops' },
  { family: 'bottom', label: 'Bottoms' },
  { family: 'footwear', label: 'Footwear' },
  { family: 'gloves', label: 'Gloves' },
  { family: 'kunai', label: 'Kunai' },
  { family: 'shuriken', label: 'Shuriken' },
  { family: 'otherWeapon', label: 'Other Weapons' },
  { family: 'accessory', label: 'Accessories' },
  { family: 'summon', label: 'Summons' },
];

// 7.4 The 5 Mythic Artifacts (wheel-only).
const MYTHIC_ITEM_IDS = ['otherweapon-23', 'accessory-22', 'top-24', 'accessory-23', 'summon-7'];
