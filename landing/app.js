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
function cycle(dt) {
  fadeT += dt;
  let f = Math.min(1, Math.max(0, (fadeT - HOLD) / FADE));
  if (fadeT >= HOLD + FADE) { vi = 1 - vi; fadeT = 0; f = 0; }
  const toMono = vi === 0 ? f : 1 - f;
  for (const n in mats) mats[n].color.copy(tmp.setHex(COLOUR[n])).lerp(mono, toMono);
}
window.__cbVariant = () => vi;

/* ---------- choreography ---------- */
// x,y in fractions of the half-viewport; s = size; rx/ry/rz in radians
const TAU = Math.PI * 2;  // a full turn between stops, always facing the viewer at each stop
const DESK = [
  { x: 0.48, y: -0.02, s: 1.0, rx: -0.16, ry: -0.38, rz: 0 },          // hero
  { x: -0.46, y: 0.0, s: 0.92, rx: 0.22, ry: TAU + 0.5, rz: 0 },     // story
  { x: 0.80, y: 0.66, s: 0.30, rx: -0.2, ry: 2 * TAU - 0.45, rz: 0 }, // fresh
  { x: 0.56, y: 0.0, s: 0.80, rx: -0.25, ry: 3 * TAU + 0.45, rz: 0 },// streets
  { x: 0.76, y: 0.60, s: 0.34, rx: 0.3, ry: 4 * TAU - 0.4, rz: 0 },  // drops
  { x: -0.80, y: 0.66, s: 0.28, rx: -0.2, ry: 5 * TAU + 0.4, rz: 0 }, // looks
  { x: 0.0, y: 0.40, s: 0.46, rx: -0.12, ry: 6 * TAU, rz: 0 },          // final
];
const MOBILE = [
  { x: 0.0, y: 0.40, s: 0.70, rx: -0.14, ry: -0.3, rz: 0 },
  { x: 0.98, y: 0.80, s: 0.26, rx: 0.22, ry: TAU + 0.5, rz: 0 },
  { x: 0.98, y: 0.80, s: 0.26, rx: -0.2, ry: 2 * TAU - 0.45, rz: 0 },
  { x: 0.98, y: 0.80, s: 0.26, rx: -0.25, ry: 3 * TAU + 0.45, rz: 0 },
  { x: 0.98, y: 0.80, s: 0.26, rx: 0.3, ry: 4 * TAU - 0.4, rz: 0 },
  { x: 0.98, y: 0.80, s: 0.26, rx: -0.2, ry: 5 * TAU + 0.4, rz: 0 },
  { x: 0.0, y: 0.36, s: 0.50, rx: -0.12, ry: 6 * TAU, rz: 0 },
];

const sections = [...document.querySelectorAll('[data-key]')];
let anchors = [];
function measure() {
  anchors = sections.map((el, i) => {
    if (i === 0) return 0;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    return Math.max(0, top + Math.min(r.height, window.innerHeight * 1.2) / 2 - window.innerHeight / 2);
  });
}
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function target(y, keys) {
  if (y <= anchors[0]) return keys[0];
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y < anchors[i + 1]) {
      const t = ease((y - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]));
      const a = keys[i], b = keys[i + 1], o = {};
      for (const k in a) o[k] = lerp(a[k], b[k], t);
      return o;
    }
  }
  return keys[keys.length - 1];
}

let W = 0, H = 0, halfH = 1, halfW = 1, mobile = false;
function resize() {
  W = window.innerWidth; H = window.innerHeight; mobile = W < 820;
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  halfW = halfH * camera.aspect;
  measure();
}
window.addEventListener('resize', resize);
window.addEventListener('load', measure);
resize();

const cur = { ...DESK[0] };
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => { mouse.x = e.clientX / W - 0.5; mouse.y = e.clientY / H - 0.5; }, { passive: true });

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.25);
  const t = clock.elapsedTime;
  const goal = target(window.scrollY, mobile ? MOBILE : DESK);
  cycle(dt);
  const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5);   // frame-rate independent easing
  for (const p in goal) cur[p] += (goal[p] - cur[p]) * k;

  const unit = Math.min(halfH, halfW * (mobile ? 0.95 : 0.62));
  const radius = cur.s * unit * 0.62;
  button.scale.setScalar(radius);
  button.position.set(cur.x * halfW, cur.y * halfH + (reduced ? 0 : Math.sin(t * 1.1) * 0.06 * radius), 0);
  const idle = reduced ? 0 : Math.sin(t * 0.5) * 0.22;
  button.rotation.set(cur.rx + mouse.y * 0.18, cur.ry + idle + mouse.x * 0.28, cur.rz);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cbReady = true;
