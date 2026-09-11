// The Nink Saga — 3D character viewer (Character tab) and 3D world map
// (World Map tab), both built from Three.js primitives in the game's
// existing "block ninja" style. Both are drag-to-rotate: this isn't hand-
// modeled game art, it's real 3D geometry tinted by the same item colors
// the flat UI already uses, wired up to spin under a finger/mouse drag.
//
// Depends on `window.THREE` being set (three-bootstrap.js on desktop, a
// CDN UMD build on the mobile build) and on globals defined in app.js
// (state, equippedItem, seededRandom, openLore) and world.js (VILLAGES,
// LANDMARKS). Safe to load before or after app.js — nothing here runs
// until a tab is actually opened, well after every script has loaded.

let avatar3D = null;
let map3D = null;

function makeDragRotate(canvas, group, opts = {}) {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idleSpin = opts.idleSpin !== false;
  let idleTimer = null;

  function resumeIdleSoon() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleSpin = opts.idleSpin !== false;
    }, 1800);
  }

  function down(e) {
    dragging = true;
    idleSpin = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    group.rotation.y += dx * 0.012;
    if (opts.allowTilt) {
      group.rotation.x = Math.max(-0.35, Math.min(0.35, group.rotation.x + dy * 0.008));
    }
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = 'grab';
    resumeIdleSoon();
  }

  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);

  return {
    tickIdle() {
      if (idleSpin && !dragging) group.rotation.y += 0.0035;
    },
  };
}

// ---------- character viewer ----------

function initAvatar3D() {
  if (avatar3D || !window.THREE) return;
  const THREE = window.THREE;
  const wrap = document.getElementById('avatar-svg-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const width = 220;
  const height = 300;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 1.15, 6.2);
  camera.lookAt(0, 0.95, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  wrap.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff2d9, 1.1);
  key.position.set(-3, 5, 4);
  scene.add(key);
  const rimLight = new THREE.DirectionalLight(0x4f8fd1, 0.35);
  rimLight.position.set(3, 2, -4);
  scene.add(rimLight);

  const group = new THREE.Group();
  scene.add(group);

  const box = (w, h, d, color, opts = {}) =>
    new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.75, metalness: opts.metalness ?? 0.05 })
    );
  const sphere = (r, color, opts = {}) =>
    new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 16),
      new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.7, metalness: opts.metalness ?? 0.05 })
    );

  const skin = '#e0b28c';
  const cloth = '#1c2128';
  const parts = {};

  // A tapered torso — wider chest, narrower waist — reads far less like a
  // plain block than a single uniform box, while staying in the game's
  // existing primitive-built style.
  parts.head = sphere(0.4, skin);
  parts.head.position.set(0, 1.82, 0);
  group.add(parts.head);

  parts.collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.31, 0.15, 14),
    new THREE.MeshStandardMaterial({ color: cloth, roughness: 0.85 })
  );
  parts.collar.position.set(0, 1.56, 0);
  group.add(parts.collar);

  parts.chest = box(0.72, 0.55, 0.4, '#3a3f4a');
  parts.chest.position.set(0, 1.33, 0);
  group.add(parts.chest);

  parts.waist = box(0.56, 0.4, 0.36, '#3a3f4a');
  parts.waist.position.set(0, 0.9, 0);
  group.add(parts.waist);

  parts.sash = box(0.62, 0.12, 0.44, '#6b2f2f', { roughness: 0.85 });
  parts.sash.position.set(0, 1.08, 0);
  group.add(parts.sash);

  parts.armL = box(0.22, 0.8, 0.22, '#3a3f4a');
  parts.armL.position.set(-0.53, 1.3, 0);
  group.add(parts.armL);
  parts.armR = box(0.22, 0.8, 0.22, '#3a3f4a');
  parts.armR.position.set(0.53, 1.3, 0);
  group.add(parts.armR);

  parts.handL = sphere(0.14, skin);
  parts.handL.position.set(-0.53, 0.8, 0);
  group.add(parts.handL);
  parts.handR = sphere(0.14, skin);
  parts.handR.position.set(0.53, 0.8, 0);
  group.add(parts.handR);

  parts.legL = box(0.24, 0.85, 0.26, '#2a2f3a');
  parts.legL.position.set(-0.2, 0.27, 0);
  group.add(parts.legL);
  parts.legR = box(0.24, 0.85, 0.26, '#2a2f3a');
  parts.legR.position.set(0.2, 0.27, 0);
  group.add(parts.legR);

  // A kunai holster pouch strapped to the thigh — a small, static, classic
  // ninja detail independent of equipped gear.
  parts.holster = box(0.16, 0.22, 0.1, '#2a2118', { roughness: 0.85 });
  parts.holster.position.set(0.24, 0.42, 0.16);
  parts.holster.rotation.z = -0.15;
  group.add(parts.holster);

  parts.footL = box(0.28, 0.16, 0.5, '#3a2f28');
  parts.footL.position.set(-0.2, -0.24, 0.08);
  group.add(parts.footL);
  parts.footR = box(0.28, 0.16, 0.5, '#3a2f28');
  parts.footR.position.set(0.2, -0.24, 0.08);
  group.add(parts.footR);

  parts.headband = box(0.82, 0.14, 0.44, '#2f5fa8');
  parts.headband.position.set(0, 1.89, 0);
  group.add(parts.headband);

  parts.headbandPlate = box(0.22, 0.16, 0.05, '#c7ccd1', { roughness: 0.3, metalness: 0.6 });
  parts.headbandPlate.position.set(0, 1.89, 0.22);
  group.add(parts.headbandPlate);

  // Trailing headband tails down the back of the neck.
  parts.headbandTailL = box(0.1, 0.4, 0.03, '#2f5fa8');
  parts.headbandTailL.position.set(-0.12, 1.6, -0.24);
  parts.headbandTailL.rotation.x = 0.15;
  group.add(parts.headbandTailL);
  parts.headbandTailR = box(0.1, 0.45, 0.03, '#2f5fa8');
  parts.headbandTailR.position.set(0.1, 1.57, -0.25);
  parts.headbandTailR.rotation.x = 0.2;
  group.add(parts.headbandTailR);

  parts.hat = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.48, 16), new THREE.MeshStandardMaterial({ color: '#c9a24b', roughness: 0.7 }));
  parts.hat.position.set(0, 2.4, 0);
  group.add(parts.hat);

  parts.weapon = box(0.07, 0.68, 0.07, '#9aa0a8', { roughness: 0.25, metalness: 0.65 });
  parts.weapon.position.set(0.6, 0.9, 0.15);
  parts.weapon.rotation.z = 0.4;
  group.add(parts.weapon);

  parts.accessory = sphere(0.14, '#4f8fd1');
  parts.accessory.position.set(0.48, 0.82, 0.15);
  group.add(parts.accessory);

  parts.summon = sphere(0.18, '#5fb85f');
  parts.summon.position.set(0.66, 1.7, -0.1);
  group.add(parts.summon);

  parts.hair = box(0.48, 0.2, 0.48, '#1c1410');
  parts.hair.position.set(0, 2.08, -0.05);
  group.add(parts.hair);

  // A soft ground shadow for visual weight — fixed under the character
  // rather than spinning with it.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -0.32, 0);
  scene.add(shadow);

  const drag = makeDragRotate(renderer.domElement, group, { idleSpin: true });

  avatar3D = { renderer, scene, camera, group, parts, drag };

  function tick() {
    requestAnimationFrame(tick);
    drag.tickIdle();
    renderer.render(scene, camera);
  }
  tick();
}

function syncAvatar3D() {
  if (!avatar3D) return;
  const p = avatar3D.parts;
  const topItem = equippedItem('top');
  const bottomItem = equippedItem('bottom');
  const footwearItem = equippedItem('footwear');
  const glovesItem = equippedItem('gloves');
  const headbandItem = equippedItem('headband');
  const hatItem = equippedItem('hat');
  const weaponItem = equippedItem('weapon');
  const accessoryItem = equippedItem('accessory');
  const summonItem = equippedItem('summon');
  const skin = '#e0b28c';

  const setColor = (mesh, hex) => mesh.material.color.set(hex);

  setColor(p.chest, topItem ? topItem.color : '#3a3f4a');
  setColor(p.waist, topItem ? topItem.color : '#3a3f4a');
  setColor(p.armL, topItem ? topItem.color : '#3a3f4a');
  setColor(p.armR, topItem ? topItem.color : '#3a3f4a');
  setColor(p.legL, bottomItem ? bottomItem.color : '#2a2f3a');
  setColor(p.legR, bottomItem ? bottomItem.color : '#2a2f3a');
  setColor(p.footL, footwearItem ? footwearItem.color : '#3a2f28');
  setColor(p.footR, footwearItem ? footwearItem.color : '#3a2f28');
  setColor(p.handL, glovesItem ? glovesItem.color : skin);
  setColor(p.handR, glovesItem ? glovesItem.color : skin);
  setColor(p.hair, state.hair.color);

  p.headband.visible = !!headbandItem;
  p.headbandPlate.visible = !!headbandItem;
  p.headbandTailL.visible = !!headbandItem;
  p.headbandTailR.visible = !!headbandItem;
  if (headbandItem) {
    setColor(p.headband, headbandItem.color);
    setColor(p.headbandTailL, headbandItem.color);
    setColor(p.headbandTailR, headbandItem.color);
  }

  p.hat.visible = !!hatItem;
  if (hatItem) setColor(p.hat, hatItem.color);

  p.weapon.visible = !!weaponItem;
  if (weaponItem) setColor(p.weapon, weaponItem.color);

  p.accessory.visible = !!accessoryItem;
  if (accessoryItem) setColor(p.accessory, accessoryItem.color);

  p.summon.visible = !!summonItem;
  if (summonItem) setColor(p.summon, summonItem.color);
}

// ---------- world map ----------

function highlightCard(card) {
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('flash-highlight');
  setTimeout(() => card.classList.remove('flash-highlight'), 1200);
}

// Muted terrain tones per village's biome (matches the doc's terrain
// descriptions), used to paint the ground; brighter marker tones so pins
// stay visible against ground of a similar hue.
const REGION_GROUND_COLORS = {
  leaf: '#3f6b3a',
  rain: '#2f5a52',
  sand: '#c9a24b',
  stone: '#8a7a5f',
  mist: '#4f6f82',
  cloud: '#6b5f8c',
};
const REGION_MARKER_COLORS = {
  leaf: '#5fd15f',
  rain: '#4fd1c9',
  sand: '#f0c060',
  stone: '#c9b89a',
  mist: '#7fc9f0',
  cloud: '#c9a0f0',
};
const LANDMARK_MARKER_COLORS = {
  valley: '#e2703f',
  forest: '#3a6b3a',
  waves: '#4f8fd1',
  tenchi: '#c9a06c',
  myoboku: '#6fbf6f',
  ryuchi: '#8a5fc9',
  turtle: '#3fd1c0',
  iron: '#e6eaf0',
  waterfall: '#5fd1e8',
  tanzaku: '#e88ac0',
};
const MOUNTAIN_VILLAGE_IDS = ['stone', 'cloud'];
const SEA_VILLAGE_ID = 'mist';

function computeVillagePositions() {
  const positions = { leaf: { x: 0, z: 0 } };
  const others = VILLAGES.filter((v) => v.id !== 'leaf');
  others.forEach((v, i) => {
    const angle = (i / others.length) * Math.PI * 2;
    const radius = 2 + v.daysFromLeaf * 2.2;
    positions[v.id] = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
  });
  return positions;
}

function terrainColorAt(THREE, x, z, positions) {
  let totalW = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  const c = new THREE.Color();
  Object.entries(positions).forEach(([id, pos]) => {
    const d2 = Math.max(0.6, (x - pos.x) ** 2 + (z - pos.z) ** 2);
    const w = 1 / (d2 * d2);
    c.set(REGION_GROUND_COLORS[id]);
    r += c.r * w;
    g += c.g * w;
    b += c.b * w;
    totalW += w;
  });
  return new THREE.Color(r / totalW, g / totalW, b / totalW);
}

function terrainHeightAt(x, z, positions) {
  const dist = Math.sqrt(x * x + z * z);
  let h = dist * 0.05; // gentle general rise from the home plateau outward
  MOUNTAIN_VILLAGE_IDS.forEach((id) => {
    const pos = positions[id];
    if (!pos) return;
    const d = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
    h += Math.max(0, 3.4 - d * 0.4);
  });
  const sea = positions[SEA_VILLAGE_ID];
  if (sea) {
    const d = Math.sqrt((x - sea.x) ** 2 + (z - sea.z) ** 2);
    h -= Math.max(0, 1.8 - d * 0.32);
  }
  return h;
}

function buildTerrainMesh(THREE, radius, positions) {
  const rings = 22;
  const segments = 48;
  const positionsArr = [];
  const colorsArr = [];
  const indices = [];

  function pushVertex(x, z) {
    const y = terrainHeightAt(x, z, positions);
    positionsArr.push(x, y, z);
    const c = terrainColorAt(THREE, x, z, positions);
    colorsArr.push(c.r, c.g, c.b);
  }

  pushVertex(0, 0);
  for (let r = 1; r <= rings; r++) {
    const rad = (r / rings) * radius;
    for (let s = 0; s < segments; s++) {
      const theta = (s / segments) * Math.PI * 2;
      pushVertex(Math.cos(theta) * rad, Math.sin(theta) * rad);
    }
  }

  for (let s = 0; s < segments; s++) {
    indices.push(0, 1 + s, 1 + ((s + 1) % segments));
  }
  for (let r = 1; r < rings; r++) {
    const ringStart = 1 + (r - 1) * segments;
    const nextStart = 1 + r * segments;
    for (let s = 0; s < segments; s++) {
      const a = ringStart + s;
      const b = ringStart + ((s + 1) % segments);
      const c = nextStart + s;
      const d = nextStart + ((s + 1) % segments);
      indices.push(a, b, d, a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positionsArr, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colorsArr, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02 });
  return new THREE.Mesh(geo, mat);
}

// Small scattered scenery per biome — trees in the forests, rocks in the
// mountains, scrub in the desert — so each region reads as its own place
// rather than a flat color swatch.
function scatterDecor(THREE, world, positions) {
  const rand = seededRandom('mapDecor');
  const specs = [
    { near: 'leaf', color: '#2f5f2f', shape: 'cone', count: 10, spread: 3.2 },
    { near: 'rain', color: '#26463f', shape: 'cone', count: 9, spread: 3 },
    { near: 'sand', color: '#8a6f2f', shape: 'cone', count: 7, spread: 3 },
    { near: 'stone', color: '#6b6355', shape: 'box', count: 9, spread: 3.4 },
    { near: 'cloud', color: '#7a6f95', shape: 'box', count: 8, spread: 3.4 },
  ];
  specs.forEach((spec) => {
    const pos = positions[spec.near];
    if (!pos) return;
    for (let i = 0; i < spec.count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = rand() * spec.spread + 0.9;
      const x = pos.x + Math.cos(angle) * dist;
      const z = pos.z + Math.sin(angle) * dist;
      const size = 0.2 + rand() * 0.3;
      const y = terrainHeightAt(x, z, positions);
      let mesh;
      if (spec.shape === 'cone') {
        mesh = new THREE.Mesh(
          new THREE.ConeGeometry(size * 0.5, size * 1.7, 6),
          new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.8 })
        );
        mesh.position.set(x, y + size * 0.85, z);
      } else {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(size, size * 0.75, size),
          new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.9 })
        );
        mesh.rotation.y = rand() * Math.PI;
        mesh.position.set(x, y + size * 0.37, z);
      }
      world.add(mesh);
    }
  });
}

// Per-village/landmark weather particles — sandstorm over Sunagakure, rain
// over Amegakure, snow over the Land of Iron. Cheap THREE.Points systems
// (100-220 points each) updated with plain array math, no per-frame
// allocation, so they're safe to run continuously on mobile.
const WEATHER_KIND_STYLE = {
  sandstorm: { color: 0xd8b878, size: 0.14, opacity: 0.75, count: 140, radius: 3.2, height: 2.2 },
  rain: { color: 0x9fd0ea, size: 0.05, opacity: 0.55, count: 220, radius: 2.6, height: 6 },
  snow: { color: 0xffffff, size: 0.09, opacity: 0.85, count: 130, radius: 2.8, height: 4.5 },
};

function makeWeatherSystem(THREE, kind, centerX, centerZ, baseY) {
  const style = WEATHER_KIND_STYLE[kind];
  const positions = new Float32Array(style.count * 3);
  const speeds = new Float32Array(style.count);
  for (let i = 0; i < style.count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * style.radius;
    positions[i * 3] = centerX + Math.cos(a) * r;
    positions[i * 3 + 1] = baseY + Math.random() * style.height;
    positions[i * 3 + 2] = centerZ + Math.sin(a) * r;
    speeds[i] = 0.4 + Math.random() * 0.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: style.color,
    size: style.size,
    transparent: true,
    opacity: style.opacity,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.userData = { kind, centerX, centerZ, baseY, radius: style.radius, height: style.height, speeds };
  return points;
}

function updateWeatherSystem(points, dt) {
  const { kind, centerX, centerZ, baseY, radius, height, speeds } = points.userData;
  const pos = points.geometry.attributes.position.array;
  const t = performance.now() * 0.001;
  const count = speeds.length;
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    if (kind === 'rain') {
      pos[idx + 1] -= speeds[i] * 9 * dt;
      if (pos[idx + 1] < baseY) {
        pos[idx + 1] = baseY + height;
        pos[idx] = centerX + (Math.random() - 0.5) * radius * 2;
        pos[idx + 2] = centerZ + (Math.random() - 0.5) * radius * 2;
      }
    } else if (kind === 'snow') {
      pos[idx + 1] -= speeds[i] * 1.1 * dt;
      pos[idx] += Math.sin(t + i) * 0.004;
      if (pos[idx + 1] < baseY) {
        pos[idx + 1] = baseY + height;
        pos[idx] = centerX + (Math.random() - 0.5) * radius * 2;
        pos[idx + 2] = centerZ + (Math.random() - 0.5) * radius * 2;
      }
    } else if (kind === 'sandstorm') {
      pos[idx] += speeds[i] * 1.6 * dt;
      pos[idx + 1] += Math.sin(t * 2 + i) * 0.006;
      if (pos[idx] - centerX > radius) {
        pos[idx] = centerX - radius;
        pos[idx + 2] = centerZ + (Math.random() - 0.5) * radius * 2;
      }
    }
  }
  points.geometry.attributes.position.needsUpdate = true;
}

function initWorldMap3D() {
  if (map3D || !window.THREE) return;
  const THREE = window.THREE;
  const wrap = document.getElementById('map-3d-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const width = wrap.clientWidth || 320;
  const height = 260;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);
  camera.position.set(0, 30, 26);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  wrap.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff2d9, 1.05);
  sun.position.set(-10, 20, 10);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9ecbe8, 0.3);
  fill.position.set(8, 10, -6);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  const positions = computeVillagePositions();
  world.add(buildTerrainMesh(THREE, 15, positions));
  scatterDecor(THREE, world, positions);

  const markers = {};

  function addMarker(id, kind, x, z, color, scale) {
    const groundY = terrainHeightAt(x, z, positions);
    const geo = kind === 'village' ? new THREE.ConeGeometry(0.7 * scale, 1.4 * scale, 8) : new THREE.ConeGeometry(0.35, 0.7, 6);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.45 }));
    mesh.position.set(x, groundY + 0.1 + (kind === 'village' ? 0.7 * scale : 0.35), z);
    mesh.userData = { id, kind };
    world.add(mesh);
    markers[id] = mesh;
  }

  // Leaf at the center (home turf); the other 5 villages spread evenly
  // around it, radius scaled by days-of-travel from Leaf.
  Object.entries(positions).forEach(([id, pos]) => {
    const scale = id === 'leaf' ? 1.3 : 1;
    addMarker(id, 'village', pos.x, pos.z, REGION_MARKER_COLORS[id], scale);
  });

  // Landmarks scattered at a seeded angle/radius so placement is stable
  // across sessions without needing real geographic coordinates — each
  // gets its own thematic color rather than one uniform marker tone.
  let ironPos = null;
  LANDMARKS.forEach((l) => {
    const rand = seededRandom('landmark|' + l.id);
    const angle = rand() * Math.PI * 2;
    const radius = 4 + rand() * 9;
    const lx = Math.cos(angle) * radius;
    const lz = Math.sin(angle) * radius;
    addMarker(l.id, 'landmark', lx, lz, LANDMARK_MARKER_COLORS[l.id] || '#a06cd5', 1);
    if (l.id === 'iron') ironPos = { x: lx, z: lz };
  });

  // Weather — sandstorm over Sunagakure, rain over Amegakure, snow over
  // the Land of Iron, each a small THREE.Points system anchored at that
  // location's terrain height.
  const weatherSystems = [];
  const weatherSpots = [
    { kind: 'sandstorm', pos: positions.sand },
    { kind: 'rain', pos: positions.rain },
    { kind: 'snow', pos: ironPos },
  ];
  weatherSpots.forEach(({ kind, pos }) => {
    if (!pos) return;
    const y = terrainHeightAt(pos.x, pos.z, positions);
    const system = makeWeatherSystem(THREE, kind, pos.x, pos.z, y);
    world.add(system);
    weatherSystems.push(system);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function handleTap(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(Object.values(markers));
    if (!hits.length) return;
    const { id, kind } = hits[0].object.userData;
    if (kind === 'village') {
      const travelBtn = document.querySelector(`[data-travel="${id}"]`);
      const card = travelBtn ? travelBtn.closest('.village-card') : document.querySelector('.village-card.current');
      highlightCard(card);
    } else {
      openLore(id);
    }
  }

  let downPos = null;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    if (moved < 6) handleTap(e.clientX, e.clientY);
    downPos = null;
  });

  const drag = makeDragRotate(renderer.domElement, world, { idleSpin: true });

  map3D = { renderer, scene, camera, world, markers, drag };

  // Day/night cycle — ambient + sun brightness and sun color drift with
  // real wall-clock time (full day at noon, darkest at midnight).
  const dayColor = new THREE.Color(0xfff2d9);
  const nightColor = new THREE.Color(0x4a5f8c);
  const tmpColor = new THREE.Color();
  function applyDayNight() {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const dayFactor = (Math.cos(((hour - 12) / 24) * Math.PI * 2) + 1) / 2;
    ambient.intensity = 0.22 + dayFactor * 0.43;
    sun.intensity = 0.15 + dayFactor * 0.9;
    fill.intensity = 0.15 + dayFactor * 0.15;
    tmpColor.copy(nightColor).lerp(dayColor, dayFactor);
    sun.color.copy(tmpColor);
  }

  let lastTs = performance.now();
  function tick() {
    requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    drag.tickIdle();
    weatherSystems.forEach((system) => updateWeatherSystem(system, dt));
    applyDayNight();
    renderer.render(scene, camera);
  }
  tick();
}

function syncWorldMap3D() {
  if (!map3D) return;
  Object.entries(map3D.markers).forEach(([id, mesh]) => {
    if (mesh.userData.kind !== 'village') return;
    const isCurrent = id === state.world.location;
    mesh.material.color.set(isCurrent ? '#dba64c' : REGION_MARKER_COLORS[id] || '#7fc9f0');
    mesh.scale.setScalar(isCurrent ? 1.3 : 1);
  });
}
