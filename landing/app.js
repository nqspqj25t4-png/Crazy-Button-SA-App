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

/* The Crazy Button logo as an enamel badge. Three versions from the brand kit,
   cross-fading on a loop: full colour on white, black on white, white on black. */
const VARIANTS = [
  { img: '/landing/img/face-colour.png', bg: '#FBF9F4', body: 0xF4F1EA, band: 0xC8322B },
  { img: '/landing/img/face-black.png',  bg: '#FBF9F4', body: 0xF4F1EA, band: 0x121212 },
  { img: '/landing/img/face-white.png',  bg: '#121212', body: 0x1A1A1A, band: 0xF2B33D },
];
const loader = new THREE.ImageLoader();
function faceTexture(v) {
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = v.bg; g.beginPath(); g.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2); g.fill();
  // fine stitched ring inside the edge, like the logo's outer ring
  g.strokeStyle = v.bg === '#121212' ? 'rgba(237,232,223,.35)' : 'rgba(18,18,18,.18)';
  g.lineWidth = 6; g.setLineDash([18, 14]); g.beginPath(); g.arc(N / 2, N / 2, N * 0.47, 0, Math.PI * 2); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  loader.load(v.img, (im) => { g.setLineDash([]); g.drawImage(im, 0, 0, N, N); tex.needsUpdate = true; });
  return tex;
}
const faces = VARIANTS.map(faceTexture);

const depth = 0.16;
const disc = new THREE.Shape(); disc.absarc(0, 0, 1, 0, Math.PI * 2, false);
const bodyGeo = new THREE.ExtrudeGeometry(disc, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 10, curveSegments: 128 });
bodyGeo.translate(0, 0, -depth / 2);
const bodyMat = new THREE.MeshPhysicalMaterial({ color: VARIANTS[0].body, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
button.add(new THREE.Mesh(bodyGeo, bodyMat));

// thin coloured band around the edge
const bandMat = new THREE.MeshPhysicalMaterial({ color: VARIANTS[0].band, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
const band = new THREE.Mesh(new THREE.CylinderGeometry(1.068, 1.068, 0.07, 160, 1, true), bandMat);
band.rotation.x = Math.PI / 2; button.add(band);

// enamel faces, front and back: base layer + a cross-fade layer on top
const faceGeo = new THREE.CircleGeometry(0.985, 128);
const zFace = depth / 2 + 0.081;
function enamel(map, transparent) {
  return new THREE.MeshPhysicalMaterial({ map, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04, transparent, opacity: transparent ? 0 : 1, depthWrite: !transparent });
}
const sides = [1, -1].map((dir) => {
  const base = new THREE.Mesh(faceGeo, enamel(faces[0], false));
  const top = new THREE.Mesh(faceGeo, enamel(faces[1], true));
  base.position.z = dir * zFace; top.position.z = dir * (zFace + 0.002);
  if (dir < 0) { base.rotation.y = Math.PI; top.rotation.y = Math.PI; }
  button.add(base, top);
  return { base, top };
});

// raised lip around the face
const lipMat = bodyMat;
const lipGeo = new THREE.TorusGeometry(1.0, 0.045, 20, 180);
[1, -1].forEach((dir) => { const m = new THREE.Mesh(lipGeo, lipMat); m.position.z = dir * (zFace - 0.01); button.add(m); });

scene.add(button);

// colour cycle: hold each version, then cross-fade to the next
let vi = 0, fadeT = 0;
const HOLD = reduced ? 9 : 3.2, FADE = 1.1;
const cA = new THREE.Color(), cB = new THREE.Color();
function cycle(dt) {
  fadeT += dt;
  const next = (vi + 1) % VARIANTS.length;
  const f = Math.min(1, Math.max(0, (fadeT - HOLD) / FADE));
  sides.forEach(({ base, top }) => { base.material.map = faces[vi]; top.material.map = faces[next]; top.material.opacity = f; });
  bodyMat.color.copy(cA.setHex(VARIANTS[vi].body)).lerp(cB.setHex(VARIANTS[next].body), f);
  bandMat.color.copy(cA.setHex(VARIANTS[vi].band)).lerp(cB.setHex(VARIANTS[next].band), f);
  if (fadeT >= HOLD + FADE) {
    vi = next; fadeT = 0;
    sides.forEach(({ base, top }) => { base.material.map = faces[vi]; base.material.needsUpdate = true; top.material.opacity = 0; top.material.needsUpdate = true; });
  }
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
