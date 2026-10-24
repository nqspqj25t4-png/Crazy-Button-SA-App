import * as THREE from 'three';
import { RoomEnvironment } from '/landing/vendor/jsm/RoomEnvironment.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.body.classList.add('reduced');

/* ---------- nav + reveals ---------- */
const nav = document.getElementById('nav');
const onNav = () => nav.classList.toggle('solid', window.scrollY > 40);
onNav(); window.addEventListener('scroll', onNav, { passive: true });

// Reveal on scroll with IntersectionObserver + CSS transitions (independent of the WebGL frame rate)
const rvs = [...document.querySelectorAll('.rv')];
if (reduced || !('IntersectionObserver' in window)) {
  rvs.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  rvs.forEach((el, i) => { if (el.closest('.hero')) el.style.transitionDelay = (0.1 + i * 0.1) + 's'; io.observe(el); });
  setTimeout(() => rvs.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }), 2500);
}

/* ---------- 3D button ---------- */
const stage = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('fallback').style.display = 'block';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 8);

const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xF2B33D, 0.8); rim.position.set(-5, -2, -3); scene.add(rim);

const button = new THREE.Group();

/* The Crazy Button logo itself in 3D, with no disc behind it. Each colour of the
   logo is traced to vector shapes (logo-shapes.json) and extruded into glossy
   enamel. It fades between the two official logos: full colour and black & white. */
const COLOUR = { blue: 0x283A8C, green: 0x0A7F50, gold: 0xF7B212, red: 0xE1352F, black: 0x0E0E0E };
const MONO = 0x111111;
const BONE = 0xEDE8DF;
const mats = {};
const DEPTH = 0.075;
fetch('/landing/img/logo-shapes.json').then((r) => r.json()).then((data) => {
  const logo = new THREE.Group();
  data.layers.forEach((L) => {
    const shapes = L.shapes.map((sh) => {
      const s = new THREE.Shape(sh.o.map(([x, y]) => new THREE.Vector2(x, y)));
      sh.h.forEach((h) => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
      return s;
    });
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.0035, bevelSegments: 3, curveSegments: 6 });
    geo.translate(0, 0, -DEPTH / 2);
    const m = new THREE.MeshPhysicalMaterial({ color: COLOUR[L.name], roughness: 0.26, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 });
    mats[L.name] = m;
    logo.add(new THREE.Mesh(geo, m));
  });
  logo.position.y = 0.03;
  button.add(logo);
}).catch(() => { document.getElementById('fallback').style.display = 'block'; });
scene.add(button);

// hold each logo, then cross-fade colour <-> black & white
let vi = 0, fadeT = 0;
const HOLD = reduced ? 9 : 3.4, FADE = 1.2;
const tmp = new THREE.Color(), mono = new THREE.Color(MONO);
let darkness = 0;   // 0 on light sections, 1 on the dark ones (set by the choreography)
const cLight = new THREE.Color(), cDark = new THREE.Color(), mLight = new THREE.Color(MONO), mDark = new THREE.Color(BONE);
function cycle(dt) {
  fadeT += dt;
  let f = Math.min(1, Math.max(0, (fadeT - HOLD) / FADE));
  if (fadeT >= HOLD + FADE) { vi = 1 - vi; fadeT = 0; f = 0; }
  const toMono = vi === 0 ? f : 1 - f;                           // 0 = colour logo, 1 = black & white logo
  for (const n in mats) {
    cLight.setHex(COLOUR[n]); cDark.setHex(n === 'black' ? BONE : COLOUR[n]);
    const base = cLight.lerp(cDark, darkness);
    const mono = tmp.copy(mLight).lerp(mDark, darkness);
    mats[n].color.copy(base).lerp(mono, toMono);
  }
}
window.__cbVariant = () => vi;

/* ---------- choreography ----------
   Every section has an empty "slot" in its layout (.slot[data-slot]) where the logo
   belongs. The logo rides inside the slot of the section on screen and flies to the
   next slot as you scroll, so it always sits in free space and never covers text.
   One full turn between slots, facing the viewer whenever it is parked. */
const TAU = Math.PI * 2;
const ROT = [
  { rx: -0.14, ry: -0.36 },          // hero
  { rx: 0.10, ry: TAU + 0.32 },      // story
  { rx: -0.08, ry: 2 * TAU - 0.30 }, // fresh
  { rx: -0.12, ry: 3 * TAU + 0.34 }, // streets
  { rx: 0.10, ry: 4 * TAU - 0.30 },  // drops
  { rx: -0.08, ry: 5 * TAU + 0.30 }, // looks
  { rx: -0.06, ry: 6 * TAU },        // final
];
const slots = [...document.querySelectorAll('.slot[data-slot]')].sort((a, b) => a.dataset.slot - b.dataset.slot);
const LOGO_ASPECT = 1497 / 1401;   // logo width / height
const smooth = (t) => t * t * (3 - 2 * t);

let W = 0, H = 0, halfH = 1, halfW = 1;
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  halfW = halfH * camera.aspect;
}
window.addEventListener('resize', resize);
resize();

// slot rectangle -> where the logo should be (screen centre + logo width in px)
const DARK = slots.map((el) => (el.closest('.drops, .final') ? 1 : 0));
function slotGoal(el, i) {
  const r = el.getBoundingClientRect();
  const w = Math.min(r.width, r.height * LOGO_ASPECT);
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w, d: DARK[i], rx: ROT[i].rx, ry: ROT[i].ry, on: r.width > 0 };
}
function goalNow() {
  const g = slots.map(slotGoal).filter((x) => x.on);   // slots hidden on this screen size are skipped
  const mid = H * 0.5;
  // last slot whose centre is at or above the middle of the screen
  let i = -1;
  for (let k = 0; k < g.length; k++) if (g[k].cy <= mid) i = k;
  if (i < 0) return { cx: g[0].cx, cy: g[0].cy, w: g[0].w, d: g[0].d, rx: g[0].rx, ry: g[0].ry };
  if (i >= g.length - 1) { const z = g[g.length - 1]; return { cx: z.cx, cy: z.cy, w: z.w, d: z.d, rx: z.rx, ry: z.ry }; }
  const a = g[i], b = g[i + 1];
  // Ride along with slot i, then sweep into slot i+1 over a short scroll distance just
  // before it reaches the middle of the screen; long gaps never mean a long crossing.
  const dist = Math.max(1, b.cy - a.cy);
  const r = b.cy - mid;                               // px until slot i+1 is centred
  const flyLen = Math.min(0.6 * dist, 0.55 * H);
  const endAt = Math.min(0.12 * dist, 0.1 * H);
  const t = smooth(Math.min(1, Math.max(0, (flyLen - r) / Math.max(1, flyLen - endAt))));
  const lift = Math.sin(t * Math.PI) * 0.18;                      // gentle arc while flying
  return {
    cx: a.cx + (b.cx - a.cx) * t,
    cy: a.cy + (b.cy - a.cy) * t,
    w: (a.w + (b.w - a.w) * t) * (1 - lift * 0.4),
    rx: a.rx + (b.rx - a.rx) * t,
    ry: a.ry + (b.ry - a.ry) * t,
    d: a.d + (b.d - a.d) * t,
  };
}

const cur = goalNow();
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => { mouse.x = e.clientX / W - 0.5; mouse.y = e.clientY / H - 0.5; }, { passive: true });

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  cycle(dt);
  const goal = goalNow();
  // quick follow so it stays glued to its slot while scrolling, but still glides
  const k = reduced ? 1 : 1 - Math.exp(-dt * 11);
  for (const p in goal) cur[p] += (goal[p] - cur[p]) * k;
  darkness = cur.d;

  // screen px -> world units (logo is 2 units wide at scale 1)
  const scale = (cur.w / W) * halfW;
  button.scale.setScalar(scale);
  const bob = reduced ? 0 : Math.sin(t * 1.1) * 0.035 * scale;
  button.position.set((cur.cx / W - 0.5) * 2 * halfW, -(cur.cy / H - 0.5) * 2 * halfH + bob, 0);
  const idle = reduced ? 0 : Math.sin(t * 0.5) * 0.16;
  button.rotation.set(cur.rx + mouse.y * 0.14, cur.ry + idle + mouse.x * 0.22, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cbReady = true;
