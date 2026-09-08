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

  const box = (w, h, d, color) =>
    new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 }));
  const sphere = (r, color) => new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));

  const skin = '#e0b28c';
  const parts = {};

  parts.head = sphere(0.42, skin);
  parts.head.position.set(0, 1.85, 0);
  group.add(parts.head);

  parts.torso = box(0.78, 1.0, 0.42, '#3a3f4a');
  parts.torso.position.set(0, 1.15, 0);
  group.add(parts.torso);

  parts.armL = box(0.24, 0.85, 0.24, '#3a3f4a');
  parts.armL.position.set(-0.55, 1.15, 0);
  group.add(parts.armL);
  parts.armR = box(0.24, 0.85, 0.24, '#3a3f4a');
  parts.armR.position.set(0.55, 1.15, 0);
  group.add(parts.armR);

  parts.handL = sphere(0.15, skin);
  parts.handL.position.set(-0.55, 0.62, 0);
  group.add(parts.handL);
  parts.handR = sphere(0.15, skin);
  parts.handR.position.set(0.55, 0.62, 0);
  group.add(parts.handR);

  parts.legL = box(0.26, 0.95, 0.28, '#2a2f3a');
  parts.legL.position.set(-0.22, 0.15, 0);
  group.add(parts.legL);
  parts.legR = box(0.26, 0.95, 0.28, '#2a2f3a');
  parts.legR.position.set(0.22, 0.15, 0);
  group.add(parts.legR);

  parts.footL = box(0.3, 0.16, 0.5, '#3a2f28');
  parts.footL.position.set(-0.22, -0.36, 0.08);
  group.add(parts.footL);
  parts.footR = box(0.3, 0.16, 0.5, '#3a2f28');
  parts.footR.position.set(0.22, -0.36, 0.08);
  group.add(parts.footR);

  parts.headband = box(0.86, 0.14, 0.46, '#2f5fa8');
  parts.headband.position.set(0, 1.92, 0);
  group.add(parts.headband);

  parts.hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 16), new THREE.MeshStandardMaterial({ color: '#c9a24b', roughness: 0.7 }));
  parts.hat.position.set(0, 2.45, 0);
  group.add(parts.hat);

  parts.weapon = box(0.08, 0.7, 0.08, '#9aa0a8');
  parts.weapon.position.set(0.62, 0.75, 0.15);
  parts.weapon.rotation.z = 0.4;
  group.add(parts.weapon);

  parts.accessory = sphere(0.14, '#4f8fd1');
  parts.accessory.position.set(0.5, 0.65, 0.15);
  group.add(parts.accessory);

  parts.summon = sphere(0.18, '#5fb85f');
  parts.summon.position.set(0.68, 1.55, -0.1);
  group.add(parts.summon);

  parts.hair = box(0.5, 0.22, 0.5, '#1c1410');
  parts.hair.position.set(0, 2.12, -0.05);
  group.add(parts.hair);

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

  setColor(p.torso, topItem ? topItem.color : '#3a3f4a');
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
  if (headbandItem) setColor(p.headband, headbandItem.color);

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

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xfff2d9, 1.0);
  sun.position.set(-10, 20, 10);
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 1, 48),
    new THREE.MeshStandardMaterial({ color: '#3f5a3f', roughness: 0.9 })
  );
  world.add(disc);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(15, 0.35, 12, 48), new THREE.MeshStandardMaterial({ color: '#8a6f3a', roughness: 0.8 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.5;
  world.add(rim);

  const markers = {};

  function addMarker(id, kind, x, z, color, scale) {
    const geo = kind === 'village' ? new THREE.ConeGeometry(0.7 * scale, 1.4 * scale, 8) : new THREE.ConeGeometry(0.35, 0.7, 6);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    mesh.position.set(x, 0.5 + (kind === 'village' ? 0.7 * scale : 0.35), z);
    mesh.userData = { id, kind };
    world.add(mesh);
    markers[id] = mesh;
  }

  // Leaf at the center (home turf); the other 5 villages spread evenly
  // around it, radius scaled by days-of-travel from Leaf.
  const others = VILLAGES.filter((v) => v.id !== 'leaf');
  addMarker('leaf', 'village', 0, 0, '#dba64c', 1.3);
  others.forEach((v, i) => {
    const angle = (i / others.length) * Math.PI * 2;
    const radius = 2 + v.daysFromLeaf * 2.2;
    addMarker(v.id, 'village', Math.cos(angle) * radius, Math.sin(angle) * radius, '#4f8fd1', 1);
  });

  // Landmarks scattered at a seeded angle/radius so placement is stable
  // across sessions without needing real geographic coordinates.
  LANDMARKS.forEach((l) => {
    const rand = seededRandom('landmark|' + l.id);
    const angle = rand() * Math.PI * 2;
    const radius = 4 + rand() * 9;
    addMarker(l.id, 'landmark', Math.cos(angle) * radius, Math.sin(angle) * radius, '#a06cd5', 1);
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

  function tick() {
    requestAnimationFrame(tick);
    drag.tickIdle();
    renderer.render(scene, camera);
  }
  tick();
}

function syncWorldMap3D() {
  if (!map3D) return;
  Object.entries(map3D.markers).forEach(([id, mesh]) => {
    if (mesh.userData.kind !== 'village') return;
    const isCurrent = id === state.world.location;
    mesh.material.color.set(isCurrent ? '#dba64c' : '#4f8fd1');
    mesh.scale.setScalar(isCurrent ? 1.3 : 1);
  });
}
