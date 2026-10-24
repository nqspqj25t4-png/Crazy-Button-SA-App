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
const holeR = 0.12, holeD = 0.33;
const holes = [[0, holeD], [holeD, 0], [0, -holeD], [-holeD, 0]];

// body: disc with four real holes
const shape = new THREE.Shape();
shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
holes.forEach(([x, y]) => { const h = new THREE.Path(); h.absarc(x, y, holeR, 0, Math.PI * 2, true); shape.holes.push(h); });
const depth = 0.16;
const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.07, bevelSegments: 10, curveSegments: 112 });
bodyGeo.translate(0, 0, -depth / 2);
const blue = new THREE.MeshPhysicalMaterial({ color: 0x22378f, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.3, sheenColor: new THREE.Color(0x9FC3D9) });
button.add(new THREE.Mesh(bodyGeo, blue));

// raised lip front and back
const lipGeo = new THREE.TorusGeometry(0.84, 0.075, 28, 180);
[0.155, -0.155].forEach((z) => { const m = new THREE.Mesh(lipGeo, blue); m.position.z = z; button.add(m); });

// red edge band (from the logo's red ring)
const band = new THREE.Mesh(new THREE.CylinderGeometry(1.088, 1.088, 0.075, 160, 1, true),
  new THREE.MeshPhysicalMaterial({ color: 0xC8322B, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide }));
band.rotation.x = Math.PI / 2; button.add(band);

// stitched thread through the holes: gold and green crossing, like a sewn-on button
function stitch(a, b, color) {
  const [ax, ay] = a, [bx, by] = b;
  const pts = [
    new THREE.Vector3(ax, ay, -0.12), new THREE.Vector3(ax, ay, 0.17),
    new THREE.Vector3(ax * 0.55, ay * 0.55, 0.255), new THREE.Vector3(0, 0, 0.275),
    new THREE.Vector3(bx * 0.55, by * 0.55, 0.255), new THREE.Vector3(bx, by, 0.17), new THREE.Vector3(bx, by, -0.12),
  ];
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.042, 14, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0 });
  // twisted-thread look: two slightly offset strands
  const g = new THREE.Group();
  const s1 = new THREE.Mesh(geo, mat); s1.position.x += 0.012; g.add(s1);
  const s2 = new THREE.Mesh(geo, mat); s2.position.x -= 0.012; s2.position.y += 0.01; g.add(s2);
  return g;
}
button.add(stitch(holes[0], holes[2], 0xF2B33D));
const s2 = stitch(holes[3], holes[1], 0x0F5A36); s2.position.z = 0.02; button.add(s2);

scene.add(button);

/* ---------- choreography ---------- */
// x,y in fractions of the half-viewport; s = size; rx/ry/rz in radians
const TAU = Math.PI * 2;  // a full turn between stops, always facing the viewer at each stop
const DESK = [
  { x: 0.48, y: -0.02, s: 1.0, rx: -0.38, ry: -0.55, rz: 0.12 },        // hero
  { x: -0.46, y: 0.0, s: 0.92, rx: 0.22, ry: TAU + 0.5, rz: -0.2 },     // story
  { x: 0.80, y: 0.66, s: 0.30, rx: -0.2, ry: 2 * TAU - 0.45, rz: 0.3 }, // fresh
  { x: 0.56, y: 0.0, s: 0.80, rx: -0.25, ry: 3 * TAU + 0.45, rz: 0.15 },// streets
  { x: 0.76, y: 0.60, s: 0.34, rx: 0.3, ry: 4 * TAU - 0.4, rz: -0.3 },  // drops
  { x: -0.80, y: 0.66, s: 0.28, rx: -0.2, ry: 5 * TAU + 0.4, rz: 0.2 }, // looks
  { x: 0.0, y: 0.40, s: 0.46, rx: -0.12, ry: 6 * TAU, rz: 0 },          // final
];
const MOBILE = [
  { x: 0.0, y: 0.40, s: 0.70, rx: -0.35, ry: -0.5, rz: 0.1 },
  { x: 0.98, y: 0.80, s: 0.26, rx: 0.22, ry: TAU + 0.5, rz: -0.2 },
  { x: 0.98, y: 0.80, s: 0.26, rx: -0.2, ry: 2 * TAU - 0.45, rz: 0.3 },
  { x: 0.98, y: 0.80, s: 0.26, rx: -0.25, ry: 3 * TAU + 0.45, rz: 0.15 },
  { x: 0.98, y: 0.80, s: 0.26, rx: 0.3, ry: 4 * TAU - 0.4, rz: -0.3 },
  { x: 0.98, y: 0.80, s: 0.26, rx: -0.2, ry: 5 * TAU + 0.4, rz: 0.2 },
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
  const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5);   // frame-rate independent easing
  for (const p in goal) cur[p] += (goal[p] - cur[p]) * k;

  const unit = Math.min(halfH, halfW * (mobile ? 0.95 : 0.62));
  const radius = cur.s * unit * 0.62;
  button.scale.setScalar(radius);
  button.position.set(cur.x * halfW, cur.y * halfH + (reduced ? 0 : Math.sin(t * 1.1) * 0.06 * radius), 0);
  const idle = reduced ? 0 : Math.sin(t * 0.5) * 0.35;
  button.rotation.set(cur.rx + mouse.y * 0.25, cur.ry + idle + mouse.x * 0.35, cur.rz);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cbReady = true;
