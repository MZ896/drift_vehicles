import * as THREE from 'three';

const game = document.querySelector('#game');
const menu = document.querySelector('#menu');
const hud = document.querySelector('#hud');
const startButton = document.querySelector('#startButton');
const speedReadout = document.querySelector('#speed');
const speedBar = document.querySelector('#speedBar');
const districtName = document.querySelector('#districtName');
const toast = document.querySelector('#toast');
const customizer = document.querySelector('#customizer');
const closeCustomizer = document.querySelector('#closeCustomizer');
const finishBuild = document.querySelector('#finishBuild');
const controls = {
  type: document.querySelector('#carType'), shape: document.querySelector('#bodyShape'),
  paint: document.querySelector('#paintColor'), accent: document.querySelector('#accentColor'),
  finish: document.querySelector('#paintFinish'), wheels: document.querySelector('#wheelStyle'),
  kit: document.querySelector('#bodyKit'), height: document.querySelector('#rideHeight'),
};

const WORLD = 820;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaeb8bd);
scene.fog = new THREE.Fog(0xaeb8bd, 155, 470);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 760);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
game.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe0ecf3, 0x354031, 2.3));
const sun = new THREE.DirectionalLight(0xffedc7, 3.3);
sun.position.set(-100, 145, -85);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -105; sun.shadow.camera.right = 105;
sun.shadow.camera.top = 105; sun.shadow.camera.bottom = -105;
scene.add(sun); scene.add(sun.target);

const mat = (color, roughness = .82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const materials = {
  asphalt: mat(0x252b2f, .96), oldAsphalt: mat(0x34383a, 1), sidewalk: mat(0x747b7c, .96),
  grass: mat(0x526f46, 1), dryGrass: mat(0x8b874e, 1), sand: mat(0xa78b59, 1), dirt: mat(0x705a3e, 1),
  concrete: mat(0x909394, 1), water: mat(0x315c69, .35, .1), yellow: new THREE.MeshBasicMaterial({ color: 0xe8c33f }),
  white: new THREE.MeshBasicMaterial({ color: 0xe7e1d2 }), dark: mat(0x20262b), trunk: mat(0x513923),
  pine: mat(0x294b36), leaf: mat(0x45683e),
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const colliders = [];

function box(x, y, z, w, h, d, material, cast = true) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = cast; mesh.receiveShadow = true; scene.add(mesh);
  return mesh;
}
function collider(x, z, w, d, padding = 0) { colliders.push({ minX: x - w / 2 - padding, maxX: x + w / 2 + padding, minZ: z - d / 2 - padding, maxZ: z + d / 2 + padding }); }
function solidBox(x, y, z, w, h, d, material, padding = .2) { const mesh = box(x, y, z, w, h, d, material); collider(x, z, w, d, padding); return mesh; }

box(0, -.35, 0, WORLD, .7, WORLD, materials.grass, false);
box(0, -.08, 255, WORLD, .18, 305, materials.dryGrass, false);
box(235, -.02, -245, 350, .12, 275, materials.sand, false);
box(-285, -.03, -255, 245, .14, 300, materials.concrete, false);
box(-397, .05, -255, 18, .2, 300, materials.water, false);
collider(-397, -255, 18, 300, .3);

function addRoad(x, z, length, vertical, width = 14, worn = false) {
  box(x, .025, z, vertical ? width : length, .05, vertical ? length : width, worn ? materials.oldAsphalt : materials.asphalt, false);
  const start = (vertical ? z : x) - length / 2 + 5, end = (vertical ? z : x) + length / 2 - 5;
  for (let p = start; p < end; p += 9) box(vertical ? x : p, .065, vertical ? p : z, vertical ? .18 : 3.8, .012, vertical ? 3.8 : .18, materials.yellow, false);
  box(vertical ? x - width / 2 + .65 : x, .068, vertical ? z : z - width / 2 + .65, vertical ? .12 : length, .012, vertical ? length : .12, materials.white, false);
  box(vertical ? x + width / 2 - .65 : x, .068, vertical ? z : z + width / 2 - .65, vertical ? .12 : length, .012, vertical ? length : .12, materials.white, false);
}
function addCrosswalk(x, z, verticalRoad) { for (let i = -4; i <= 4; i += 2) box(x + (verticalRoad ? i : 0), .08, z + (verticalRoad ? 0 : i), verticalRoad ? .75 : 6.5, .012, verticalRoad ? 6.5 : .75, materials.white, false); }

for (let i = -4; i <= 4; i++) { addRoad(i * 38, 0, 330, true); addRoad(0, i * 38, 330, false); }
addRoad(0, 0, 790, true, 18); addRoad(0, 0, 790, false, 18);
addRoad(0, 260, 790, false, 16, true); addRoad(245, -250, 320, true, 15, true);
addRoad(-285, -250, 300, true, 16); addRoad(-285, -250, 225, false, 16);
addRoad(-20, -152, 530, false, 16, true);
addRoad(-210, 0, 330, true, 14, true); addRoad(210, 0, 330, true, 14, true);
addRoad(0, 330, 220, false, 13, true); addRoad(-110, 295, 70, true, 13, true); addRoad(110, 295, 70, true, 13, true);
for (let i = -3; i <= 3; i++) addCrosswalk(i * 38, 0, true);

const buildingColors = [0x9a6d58, 0xb1a083, 0x69808d, 0x887a73, 0xb9ae8d, 0x707982, 0x7f665b];
const windowDark = mat(0x253842, .2, .15), windowLit = new THREE.MeshBasicMaterial({ color: 0xf5c86b });
function addBuilding(x, z, w, d, h, seed = 0) {
  solidBox(x, h / 2 + .7, z, w, h, d, mat(buildingColors[Math.abs(seed) % buildingColors.length]), .35);
  box(x, h + 1.05, z, w * .36, .7, d * .32, materials.dark); box(x, h + 1.65, z, .12, 1.3, .12, materials.dark);
  const rows = Math.min(7, Math.max(2, Math.floor(h / 4)));
  for (let r = 0; r < rows; r++) for (const side of [-1, 1]) {
    const wm = (r + seed + side) % 3 ? windowDark : windowLit;
    const front = box(x, 3.1 + r * 3.3, z + side * (d / 2 + .012), w * .58, .65, .025, wm, false); front.rotation.y = side < 0 ? Math.PI : 0;
    box(x + side * (w / 2 + .012), 3.1 + r * 3.3, z, .025, .65, d * .52, wm, false);
  }
  box(x, 2.15, z - d / 2 - .08, w * .68, .24, .95, mat(seed % 2 ? 0x823e35 : 0x315d64));
  box(x, 1.3, z - d / 2 - .12, 1.25, 2.5, .08, windowDark, false);
}
function lamp(x, z, rotation = 0) {
  box(x, 2.7, z, .18, 5.4, .18, materials.dark);
  collider(x, z, .35, .35, .15);
  const arm = box(x + Math.cos(rotation) * .65, 5.22, z + Math.sin(rotation) * .65, 1.3, .12, .12, materials.dark); arm.rotation.y = -rotation;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffdc82 })); glow.position.set(x + Math.cos(rotation) * 1.25, 5.08, z + Math.sin(rotation) * 1.25); scene.add(glow);
}
function tree(x, z, pine = false, scale = 1) {
  solidBox(x, 1.45 * scale, z, .65 * scale, 2.9 * scale, .65 * scale, materials.trunk, .25);
  if (pine) for (let i = 0; i < 3; i++) { const crown = new THREE.Mesh(new THREE.ConeGeometry((2.15 - i * .35) * scale, 3.5 * scale, 7), materials.pine); crown.position.set(x, (3.3 + i * 1.4) * scale, z); crown.castShadow = true; scene.add(crown); }
  else { const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.25 * scale, 0), materials.leaf); crown.position.set(x, 4.1 * scale, z); crown.castShadow = true; scene.add(crown); }
}
function rock(x, z, scale = 1) { const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), mat(0x777266)); mesh.position.set(x, scale * .62, z); mesh.scale.y = .65; mesh.rotation.set(.2, x * .03, .1); mesh.castShadow = true; scene.add(mesh); collider(x, z, scale * 1.45, scale * 1.3, .15); }
function hill(x, z, radius, height, color = 0x65704b) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 9, 3), mat(color, 1));
  mesh.position.set(x, height / 2 - .1, z); mesh.rotation.y = x * .013; mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  collider(x, z, radius * 1.8, radius * 1.8, .4);
}
function bench(x, z, rot = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); const seat = new THREE.Mesh(boxGeo, mat(0x69472b)); seat.scale.set(2.4, .18, .65); seat.position.y = .72; g.add(seat); for (const lx of [-.9, .9]) { const leg = new THREE.Mesh(boxGeo, materials.dark); leg.scale.set(.12, .7, .55); leg.position.set(lx, .36, 0); g.add(leg); } collider(x, z, rot ? .8 : 2.5, rot ? 2.5 : .8, .1); }

for (let gx = -4; gx < 4; gx++) for (let gz = -4; gz < 4; gz++) {
  const cx = gx * 38 + 19, cz = gz * 38 + 19; box(cx, .36, cz, 22.5, .72, 22.5, materials.sidewalk, false);
  const seed = Math.abs(gx * 37 + gz * 19);
  if (seed % 11 === 0) { box(cx, .74, cz, 20, .05, 20, materials.grass, false); tree(cx - 5, cz - 4, false, .85); tree(cx + 5, cz + 4, false, .9); bench(cx, cz - 6); }
  else if (seed % 3) { addBuilding(cx - 5.4, cz, 8.7, 17, 12 + seed % 24, seed); addBuilding(cx + 5.4, cz, 8.7, 17, 16 + (seed * 3) % 30, seed + 2); }
  else addBuilding(cx, cz, 17, 17, 15 + seed % 31, seed);
  // The sidewalk begins 7.75m from each block center; keep the pole and lamp arm behind the curb.
  if ((gx + gz) % 2 === 0) lamp(cx - 10.2, cz - 10.2, Math.PI / 4);
}

function house(x, z, color, rot = 0) {
  solidBox(x, 2.2, z, 10, 4.4, 8, mat(color), .3);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 3.1, 4), mat(0x543b34)); roof.position.set(x, 5.9, z); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
  box(x, 2.15, z + (rot ? 4.02 : -4.02), 1.35, 2.7, .08, materials.dark, false);
  box(x - 3, 2.6, z + (rot ? 4.04 : -4.04), 1.4, 1.15, .06, windowLit, false);
}
for (let row = -3; row <= 3; row++) addRoad(0, row * 38, 420, false, 12, true);
for (const side of [-1, 1]) for (let row = -3; row <= 3; row++) {
  const x = side * 210, z = row * 38;
  house(x + side * 16, z - 11, row % 2 ? 0x8caa94 : 0xb69b78, side < 0); house(x + side * 16, z + 11, row % 2 ? 0xc1b08c : 0x889bac, side < 0);
  tree(x + side * 6, z - 15, false, .7); tree(x + side * 8, z + 15, false, .72); solidBox(x + side * 9, .7, z - 4, .22, 1.4, .22, materials.dark, .12);
}

for (let i = 0; i < 70; i++) { const a = i * 2.399, radius = 55 + (i % 8) * 13; const x = Math.cos(a) * radius, z = 255 + Math.sin(a) * radius; if (Math.abs(x) > 11 && Math.abs(z - 260) > 10) tree(x, z, true, .7 + (i % 4) * .1); }
for (let i = 0; i < 14; i++) rock(-90 + i * 15, 330 + Math.sin(i) * 18, .7 + i % 3 * .35);
hill(-235, 330, 42, 38); hill(235, 345, 50, 47); hill(-330, 340, 55, 52, 0x596344); hill(335, 330, 38, 34, 0x6b724e);
solidBox(82, 3.2, 316, 15, 6.4, 12, mat(0x715136), .4); box(82, 7.4, 316, 17, 2.1, 14, mat(0x3e3028));
box(-62, .12, 290, 35, .15, 24, materials.dirt, false);
for (let i = 0; i < 5; i++) { const log = box(-73 + i * 5, .65, 291 + (i % 2) * 6, 3.5, .65, .65, materials.trunk); log.rotation.y = .2 * i; collider(log.position.x, log.position.z, 3.8, .9); }

function cactus(x, z, s = 1) { solidBox(x, 1.65 * s, z, .55 * s, 3.3 * s, .55 * s, mat(0x3d6d48), .25); box(x + .55 * s, 1.7 * s, z, .8 * s, .35 * s, .38 * s, mat(0x3d6d48)); box(x + .85 * s, 2.2 * s, z, .3 * s, 1.1 * s, .38 * s, mat(0x3d6d48)); }
for (let i = 0; i < 34; i++) { const x = 95 + (i * 47 % 275), z = -175 - (i * 71 % 190); if (Math.abs(x - 245) > 12) (i % 3 ? rock(x, z, .65 + i % 4 * .2) : cactus(x, z, .8 + i % 3 * .2)); }
hill(125, -345, 30, 20, 0x9a7749); hill(355, -340, 38, 25, 0x927047); hill(370, -190, 25, 17, 0xa27e4d);
solidBox(310, 4, -230, 38, 8, 25, mat(0x9b8067), .5); box(310, 5, -242.55, 14, 5.4, .1, materials.dark, false); box(310, 8.45, -230, 42, .8, 28, mat(0x594b40));
for (let x = 185; x <= 290; x += 26) { solidBox(x, .65, -205, .18, 1.3, .18, materials.dark, .08); solidBox(x, 1.28, -205, 25, .12, .12, materials.dark, .08); }

for (let i = 0; i < 4; i++) { const z = -330 + i * 55; solidBox(-325, 6, z, 45, 12, 31, mat(i % 2 ? 0x64717a : 0x7d7165), .45); for (let d = -1; d <= 1; d++) box(-325 + d * 11, 4.4, z + 15.55, 8.5, 7, .12, materials.dark, false); }
const containerColors = [0xa54d3d, 0x2f6671, 0xa27a32, 0x52643d];
for (let i = 0; i < 18; i++) { const x = -250 + (i % 3) * 15, z = -365 + Math.floor(i / 3) * 20, y = i % 4 === 0 ? 3.8 : 1.4; solidBox(x, y, z, 12, 2.7, 5.2, mat(containerColors[i % 4]), .15); }
for (let i = 0; i < 9; i++) solidBox(-374, .65, -375 + i * 35, 2.6, 1.3, 12, materials.concrete, .1);

// Sunset Customs: an open drive-in bay reached from the south highway.
addRoad(42, -235, 84, false, 13, true);
box(61, .14, -235, 40, .22, 24, mat(0x464b4d), false);
solidBox(61, 4.3, -246.5, 40, 8.6, 1, mat(0x2d343b), .15);
solidBox(61, 4.3, -223.5, 40, 8.6, 1, mat(0x2d343b), .15);
solidBox(80.5, 4.3, -235, 1, 8.6, 24, mat(0x2d343b), .15);
box(61, 8.45, -235, 40, .7, 24, mat(0x181e24));
box(41.2, 7.15, -235, .7, 2.7, 24, mat(0xe1ad20));
box(58, .18, -235, 24, .05, 8, mat(0xd1b741), false);
for (const z of [-243.5, -226.5]) for (let x = 46; x < 78; x += 4) box(x, .2, z, 2.1, .06, .25, materials.yellow, false);
for (const z of [-242, -228]) { solidBox(72, 1.2, z, 1.6, 2.4, 1.6, mat(0x222a31), .1); box(72, 2.5, z, .9, .2, .9, windowLit, false); }
const shopSign = box(40.75, 8.1, -235, .35, 2.6, 13, new THREE.MeshStandardMaterial({ color: 0x171b20, emissive: 0x694c00, emissiveIntensity: .8 }));
const shopBeacon = new THREE.PointLight(0xffc433, 34, 24, 2); shopBeacon.position.set(51, 6, -235); scene.add(shopBeacon);
const shopZone = { minX: 51, maxX: 75, minZ: -243, maxZ: -227 };

// Keep highway lamps beyond the road shoulder and skip every crossroad/intersection.
const crossingRoadZ = [-330, -260, -250, -235, -152, -114, -76, -38, 0, 38, 76, 114, 152, 260, 330];
for (let p = -365; p <= 365; p += 28) {
  if (crossingRoadZ.every(z => Math.abs(p - z) > 13)) {
    lamp(-12.5, p, 0);
    lamp(12.5, p, Math.PI);
  }
}
for (let p = -360; p <= 360; p += 55) { solidBox(p, 1.35, 9.7, .18, 2.7, .18, materials.dark, .12); const sign = box(p, 2.4, 9.7, 2.3, .9, .12, mat(p % 2 ? 0x396596 : 0x8f3d32), false); sign.rotation.y = Math.PI / 2; }

const car = new THREE.Group();
const bodyMaterial = mat(0xe1ad20, .32, .12), accentMaterial = mat(0xf1c233, .28, .14);
const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, .75, 6.4), bodyMaterial); body.position.y = 1.05; body.castShadow = true; car.add(body);
const hood = new THREE.Mesh(new THREE.BoxGeometry(3, .35, 2), accentMaterial); hood.position.set(0, 1.48, -1.9); hood.castShadow = true; car.add(hood);
const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.15, 2.75), mat(0x26333c, .18, .2)); cabin.position.set(0, 1.85, .35); cabin.scale.set(.9, 1, 1); cabin.castShadow = true; car.add(cabin);
const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.25, .25, .32), mat(0x191c1f, .5, .3)); bumper.position.set(0, .75, -3.2); car.add(bumper);
const wheelGeo = new THREE.CylinderGeometry(.56, .56, .42, 12), wheelMat = mat(0x111214, .9), wheels = [];
for (const x of [-1.55, 1.55]) for (const z of [-2, 2]) { const wheel = new THREE.Mesh(wheelGeo, wheelMat); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .72, z); wheel.castShadow = true; wheels.push(wheel); car.add(wheel); }
for (const x of [-.9, .9]) { const light = new THREE.Mesh(new THREE.BoxGeometry(.55, .28, .08), new THREE.MeshBasicMaterial({ color: 0xffefb0 })); light.position.set(x, 1.18, -3.23); car.add(light); }
const wing = new THREE.Group();
for (const x of [-1.05, 1.05]) { const stand = new THREE.Mesh(boxGeo, materials.dark); stand.scale.set(.12, .65, .12); stand.position.set(x, 1.75, 2.55); wing.add(stand); }
const wingBlade = new THREE.Mesh(boxGeo, accentMaterial); wingBlade.scale.set(3.35, .16, .6); wingBlade.position.set(0, 2.05, 2.55); wing.add(wingBlade); wing.visible = false; car.add(wing);
const offroadBar = new THREE.Mesh(boxGeo, materials.dark); offroadBar.scale.set(3.65, .38, .35); offroadBar.position.set(0, 1, -3.45); offroadBar.visible = false; car.add(offroadBar);
car.position.set(0, 0, 18); scene.add(car);

const keys = new Set();
let playing = false, speed = 0, heading = 0, cameraYaw = 0, cameraPitch = .34, dragging = false, lastX = 0, lastY = 0;
addEventListener('keydown', e => { keys.add(e.code); if (['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.code));
renderer.domElement.addEventListener('pointerdown', e => { if (!playing) return; dragging = true; lastX = e.clientX; lastY = e.clientY; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e => { if (!dragging) return; cameraYaw -= (e.clientX - lastX) * .006; cameraPitch = THREE.MathUtils.clamp(cameraPitch + (e.clientY - lastY) * .004, .12, .75); lastX = e.clientX; lastY = e.clientY; });
renderer.domElement.addEventListener('pointerup', () => dragging = false);
startButton.addEventListener('click', () => { playing = true; menu.classList.add('hidden'); hud.classList.add('visible'); hud.setAttribute('aria-hidden', 'false'); toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); });

let customizing = false, shopCooldown = false;
const defaultBuild = { type: 'sport', shape: 'standard', paint: '#e1ad20', accent: '#f1c233', finish: 'gloss', wheels: 'street', kit: 'clean', height: '1' };
let carBuild = { ...defaultBuild };
try { carBuild = { ...defaultBuild, ...JSON.parse(localStorage.getItem('gtv-car-build') || '{}') }; } catch { carBuild = { ...defaultBuild }; }

function applyCarBuild() {
  const types = {
    sport: { width: 1, height: 1, length: 1, cabin: [.9, 1, 1] },
    muscle: { width: 1.13, height: 1.08, length: 1.04, cabin: [.92, .9, .82] },
    compact: { width: .9, height: 1.12, length: .82, cabin: [.88, 1.13, .82] },
    rally: { width: 1.03, height: 1.14, length: .96, cabin: [.92, 1.08, .92] },
  };
  const shapes = { standard: [1, 1, 1], wide: [1.16, .96, 1], low: [1.04, .82, 1.06], tall: [.98, 1.17, 1] };
  const type = types[carBuild.type], shape = shapes[carBuild.shape];
  body.scale.set(type.width * shape[0], type.height * shape[1], type.length * shape[2]);
  hood.scale.set(type.width * shape[0], type.height * shape[1], type.length * shape[2]);
  cabin.scale.set(type.cabin[0] * shape[0], type.cabin[1] * shape[1], type.cabin[2] * shape[2]);
  const rideOffset = [-.14, 0, .22][Number(carBuild.height)];
  body.position.y = 1.05 + rideOffset; hood.position.y = 1.48 + rideOffset; cabin.position.y = 1.85 + rideOffset; bumper.position.y = .75 + rideOffset;
  const wheelSettings = { street: [1, 1, .72], sport: [1.12, .78, .73], offroad: [1.32, 1.15, .82], lowrider: [.92, 1.38, .62] }[carBuild.wheels];
  for (const wheel of wheels) { wheel.scale.set(wheelSettings[0], wheelSettings[1], wheelSettings[0]); wheel.position.y = wheelSettings[2]; }
  bodyMaterial.color.set(carBuild.paint); accentMaterial.color.set(carBuild.accent);
  const finishes = { gloss: [.25, .12], metallic: [.2, .68], matte: [.92, .02], chrome: [.08, .95] }[carBuild.finish];
  for (const material of [bodyMaterial, accentMaterial]) { material.roughness = finishes[0]; material.metalness = finishes[1]; material.needsUpdate = true; }
  wing.visible = carBuild.kit === 'race'; offroadBar.visible = carBuild.kit === 'offroad';
  document.querySelector('#paintValue').textContent = carBuild.paint.toUpperCase(); document.querySelector('#accentValue').textContent = carBuild.accent.toUpperCase();
}
for (const [name, control] of Object.entries(controls)) {
  control.value = carBuild[name];
  control.addEventListener('input', () => { carBuild[name] = control.value; applyCarBuild(); localStorage.setItem('gtv-car-build', JSON.stringify(carBuild)); });
}
applyCarBuild();

function openShop() { customizing = true; speed = 0; keys.clear(); customizer.classList.add('open'); customizer.setAttribute('aria-hidden', 'false'); hud.classList.remove('visible'); }
function leaveShop() { customizing = false; shopCooldown = true; customizer.classList.remove('open'); customizer.setAttribute('aria-hidden', 'true'); hud.classList.add('visible'); localStorage.setItem('gtv-car-build', JSON.stringify(carBuild)); }
closeCustomizer.addEventListener('click', leaveShop); finishBuild.addEventListener('click', leaveShop);
addEventListener('keydown', e => { if (e.code === 'Escape' && customizing) leaveShop(); });

const CAR_RADIUS = 2.05;
function hitsCollider(x, z) {
  if (Math.abs(x) > WORLD / 2 - CAR_RADIUS || Math.abs(z) > WORLD / 2 - CAR_RADIUS) return true;
  for (const c of colliders) { const nearX = Math.max(c.minX, Math.min(x, c.maxX)), nearZ = Math.max(c.minZ, Math.min(z, c.maxZ)); if ((x - nearX) ** 2 + (z - nearZ) ** 2 < CAR_RADIUS ** 2) return true; }
  return false;
}
function getDistrict(x, z) {
  if (z > 175) return 'PINE RIDGE';
  if (z < -165 && x > 70) return 'DESERT FLATS';
  if (z < -165 && x < -150) return 'HARBOR INDUSTRIAL';
  if (Math.abs(x) > 165) return 'WESTBROOK SUBURBS';
  return 'DOWNTOWN';
}

const clock = new THREE.Clock(), targetCam = new THREE.Vector3();
function update(dt) {
  if (!playing) { heading += dt * .06; cameraYaw = Math.sin(clock.elapsedTime * .12) * .18; }
  else if (customizing) { speed = 0; cameraYaw += dt * .22; }
  else {
    const throttle = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0), braking = keys.has('ShiftLeft') || keys.has('ShiftRight');
    speed += throttle * (throttle * speed < 0 ? 24 : 14) * dt; speed *= Math.pow(braking ? .1 : .84, dt); if (!throttle) speed *= Math.pow(.55, dt); speed = THREE.MathUtils.clamp(speed, -10, 27);
    const steer = (keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0);
    if (Math.abs(speed) > .25) heading += steer * 1.45 * dt * THREE.MathUtils.clamp(Math.abs(speed) / 7, .25, 1) * Math.sign(speed);
    cameraYaw += ((keys.has('KeyQ') ? 1 : 0) - (keys.has('KeyE') ? 1 : 0)) * 1.45 * dt;
    const oldX = car.position.x, oldZ = car.position.z, nextX = oldX - Math.sin(heading) * speed * dt, nextZ = oldZ - Math.cos(heading) * speed * dt;
    if (!hitsCollider(nextX, oldZ)) car.position.x = nextX; else speed *= -.18;
    if (!hitsCollider(car.position.x, nextZ)) car.position.z = nextZ; else speed *= -.18;
    speedReadout.textContent = String(Math.round(Math.abs(speed) * 5.1)).padStart(2, '0'); speedBar.style.width = `${Math.min(100, Math.abs(speed) * 3.7)}%`; districtName.textContent = getDistrict(car.position.x, car.position.z);
    const insideShop = car.position.x > shopZone.minX && car.position.x < shopZone.maxX && car.position.z > shopZone.minZ && car.position.z < shopZone.maxZ;
    if (insideShop && !shopCooldown) openShop();
    if (!insideShop) shopCooldown = false;
  }
  car.rotation.y = heading;
  const orbit = heading + cameraYaw, distance = playing ? 10.5 : 13.5;
  targetCam.set(car.position.x + Math.sin(orbit) * distance, car.position.y + 3.2 + cameraPitch * 7, car.position.z + Math.cos(orbit) * distance);
  camera.position.lerp(targetCam, 1 - Math.pow(.001, dt)); camera.lookAt(car.position.x, car.position.y + 1.2, car.position.z);
  sun.position.set(car.position.x - 100, 145, car.position.z - 85); sun.target.position.copy(car.position);
}
function animate() { requestAnimationFrame(animate); update(Math.min(clock.getDelta(), .05)); renderer.render(scene, camera); }
animate();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
