import * as THREE from 'three';
import { RoomEnvironment } from '/landing/vendor/jsm/RoomEnvironment.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.body.classList.add('reduced');

/* ---------- nav + reveals ---------- */
const nav = document.getElementById('nav');
const onNav = () => nav.classList.toggle('solid', window.scrollY > 40);
onNav(); window.addEventListener('scroll', onNav, { passive: true });

// Reveal on scroll with IntersectionObserver + CSS transitions (independent of the WebGL frame rate)
const rvs = [...document.querySelectorAll('.rv, .night')];
if (reduced || !('IntersectionObserver' in window)) {
  rvs.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  rvs.forEach((el) => io.observe(el));
  setTimeout(() => rvs.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }), 2500);
}



/* ---------- the world: land on the painted street, explore it, step inside ---------- */
const world = document.getElementById('world');
if (world) {
  const img = world.querySelector('.scene img');
  const pct = document.getElementById('pct');
  let shown = 0, target = 0, landed = false;
  const tick = () => {
    shown += (target - shown) * 0.12;
    if (pct) pct.textContent = Math.min(100, Math.round(shown)) + '%';
    if (!landed && shown > 99.4) land(); else if (!landed) requestAnimationFrame(tick);
  };
  function land() {
    landed = true; if (pct) pct.textContent = '100%';
    world.classList.add('landed');
  }
  if (reduced) { target = shown = 100; land(); }
  else {
    target = 35; requestAnimationFrame(tick);
    const done = () => { target = 100; };
    if (img.complete) setTimeout(done, 300); else { img.addEventListener('load', done); img.addEventListener('error', done); }
    setTimeout(done, 4000);
  }
  // scrolling pushes the camera through the shop door, into the dark of the shop
  const step = () => {
    if (reduced) return;
    const r = world.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    const c = (v) => Math.min(1, Math.max(0, v));
    // 0-0.4 walk up to the door, 0.3-0.5 the interior fades in, 0.5-0.85 look around inside, 0.85-1 lights down
    world.style.setProperty('--zoom', (1 + Math.pow(c(p / 0.5), 1.8) * 5).toFixed(3));
    world.style.setProperty('--inside', c((p - 0.3) / 0.2).toFixed(3));
    world.style.setProperty('--inzoom', (1.18 - c((p - 0.3) / 0.55) * 0.18).toFixed(3));
    world.style.setProperty('--dusk', c((p - 0.85) / 0.15).toFixed(3));
    world.style.setProperty('--ui', c(1 - p * 6).toFixed(3));
  };
  addEventListener('scroll', step, { passive: true }); addEventListener('resize', step); step();
}


/* ---------- hero: the logo pushes in between "Wear loud." and "Walk proud." ----------
   As the hero scrolls up, the two lines start pressed together in the middle, tipped back in 3D.
   The logo arrives, squeezes itself in between them and shoves them apart: the top line tips up
   and away, the bottom line tips down, the four words spread, and everything settles. */
const hero = document.querySelector('.hero');
window.__heroQ = 1;
if (hero) {
  const l1 = hero.querySelector('.l1'), l2 = hero.querySelector('.l2');
  const words = [...hero.querySelectorAll('.big i')];
  let c1 = 0, c2 = 0;
  const measure = () => {
    const mid = hero.clientHeight / 2;
    c1 = mid - (l1.offsetTop + l1.offsetHeight) + 2;
    c2 = mid - l2.offsetTop - 2;
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = () => {
    let q = 1;
    if (!reduced) {
      const r = hero.getBoundingClientRect();
      q = Math.min(1, Math.max(0, (innerHeight * 0.92 - r.top) / (innerHeight * 0.78)));
    }
    const e = ease(q), o = 1 - e;
    const g = 0.18 + 0.82 * e;              // how big the logo is as it pushes in; the gap between the lines matches it
    window.__heroQ = q; window.__heroG = g;
    const gap = 1 - g;
    l1.style.transform = `translateY(${(c1 * gap).toFixed(1)}px) rotateX(${(-55 * o).toFixed(1)}deg) scale(${(1 - 0.1 * o).toFixed(3)})`;
    l2.style.transform = `translateY(${(c2 * gap).toFixed(1)}px) rotateX(${(55 * o).toFixed(1)}deg) scale(${(1 - 0.1 * o).toFixed(3)})`;
    // the four words pressed tight, then pushed out to their places
    words.forEach((w, i) => {
      const dir = i % 2 === 0 ? 1 : -1;               // left words move in from the left, right words from the right
      w.style.transform = `translateX(${(dir * 0.18 * o).toFixed(3)}em) rotateY(${(dir * 28 * o).toFixed(1)}deg)`;
    });
  };
  measure(); step();
  addEventListener('resize', () => { measure(); step(); });
  addEventListener('scroll', step, { passive: true });
  document.fonts && document.fonts.ready.then(() => { measure(); step(); });
}

/* ---------- showcase: one frame, three distances ---------- */
const show = document.querySelector('.show');
function showStage() {
  if (!show) return;
  const r = show.getBoundingClientRect();
  const p = -r.top / Math.max(1, r.height - innerHeight);       // 0..1 through the pinned run
  const s = p < 0.3 ? '1' : p < 0.62 ? '2' : '3';
  if (show.dataset.s !== s) show.dataset.s = s;
}
window.addEventListener('scroll', showStage, { passive: true }); showStage();

/* ---------- where you headed: pick a destination, get the look ---------- */
const LOOKS = [
  { name: 'Kwa Mashu Nights', img: 'look1', items: [['Kwa Mashu To The World Bomber', 3199], ['Braam Nights Wide-Leg Track Pants', 2249], ['Umlazi Nights Bucket Hat', 1449], ['Kwa Mashu To The World Patch', 349]] },
  { name: 'Weekend Hustle', img: 'look2', items: [['Craziest Threads On The Block Tee', 1449], ['Spaza Bucket Hat', 1449], ['CBSA Drawstring Bag', 1249], ['Luggage Cover — White', 1599], ['SA Flag Barcode Patch', 349]] },
  { name: 'Thrift Flex', img: 'look3', items: [['Yizwa Ke Manje Cardigan', 3049], ['Mama Said Tee', 1699], ['Kwa Mashu Daylife Bucket Hat', 1399], ['Izinto Zothando Patch', 349]] },
  { name: 'Craziest On The Block', img: 'look4', items: [['Craziest Threads Varsity Jacket', 3599], ['Umlazi Unit Hoodie', 2449], ['Crazy Button Bucket Hat', 1299], ['Luggage Cover — Black', 1599]] },
];
const rand = (n) => 'R' + n.toLocaleString('en-ZA').replace(/\s/g, ',');
const boards = [...document.querySelectorAll('.board')];
function showLook(i, user) {
  const L = LOOKS[i];
  boards.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  const img = document.getElementById('lookimg');
  img.src = `/landing/img/${L.img}.webp`; img.alt = `${L.name} look`;
  img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
  document.getElementById('lookname').textContent = L.name;
  document.getElementById('lookitems').innerHTML = L.items.map(([t, p]) => `<li><span>${t}</span><span>${rand(p)}</span></li>`).join('');
  document.getElementById('looktotal').textContent = rand(L.items.reduce((n, [, p]) => n + p, 0));
  if (user && window.cbTrack) window.cbTrack('select_content', { content_type: 'where_headed', item_id: L.name });
}
if (boards.length) { boards.forEach((b) => b.addEventListener('click', () => showLook(+b.dataset.look, true))); showLook(0, false); }

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
   logo is traced to vector shapes (logo-shapes.json) and extruded into a solid body.
   The front and back carry the real logo artwork, so the small lettering (EST, PREMIUM,
   2011, BRAND) stays pin-sharp. It fades between the two official logos: full colour
   and black & white, with a bone-white version on dark sections. */
const COLOUR = { blue: 0x283A8C, green: 0x0A7F50, gold: 0xF7B212, red: 0xE1352F, black: 0x0E0E0E };
const MONO = 0x111111;
const BONE = 0xEDE8DF;
const SIDE = 0.55;                 // the extruded sides sit darker than the faces, so edges read
const mats = {};
const DEPTH = 0.075, BEVEL = 0.012;
const LOGO_H = 2 * 1401 / 1497;    // logo height in world units (width is 2)

const texLoader = new THREE.TextureLoader();
const faceTex = ['face-c', 'face-cd', 'face-m', 'face-md'].map((n) => {
  const t = texLoader.load(`/landing/img/${n}.webp?v=2`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
});
// one material blends the four artworks: colour/mono x light/dark
const faceMat = new THREE.ShaderMaterial({
  uniforms: { t0: { value: faceTex[0] }, t1: { value: faceTex[1] }, t2: { value: faceTex[2] }, t3: { value: faceTex[3] }, w: { value: new THREE.Vector4(1, 0, 0, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D t0, t1, t2, t3; uniform vec4 w; varying vec2 vUv;
    void main(){
      vec4 a = texture2D(t0, vUv) * w.x + texture2D(t1, vUv) * w.y + texture2D(t2, vUv) * w.z + texture2D(t3, vUv) * w.w;
      if (a.a < 0.02) discard;
      gl_FragColor = vec4(a.rgb / max(a.a, 0.0001) * min(a.a * 1.15, 1.0), min(a.a * 1.15, 1.0));
      #include <colorspace_fragment>
    }`,
  transparent: true,
  toneMapped: false,
});

fetch('/landing/img/logo-shapes.json').then((r) => r.json()).then((data) => {
  const logo = new THREE.Group();
  data.layers.forEach((L) => {
    const shapes = L.shapes.map((sh) => {
      const s = new THREE.Shape(sh.o.map(([x, y]) => new THREE.Vector2(x, y)));
      sh.h.forEach((h) => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
      return s;
    });
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: 0.0035, bevelSegments: 3, curveSegments: 6 });
    geo.translate(0, 0, -DEPTH / 2);
    const m = new THREE.MeshPhysicalMaterial({ color: COLOUR[L.name], roughness: 0.32, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.1 });
    mats[L.name] = m;
    logo.add(new THREE.Mesh(geo, m));
  });
  // the artwork faces, just proud of the body front and back
  const plane = new THREE.PlaneGeometry(2, LOGO_H);
  const z = DEPTH / 2 + BEVEL + 0.002;
  const front = new THREE.Mesh(plane, faceMat); front.position.z = z;
  const back = new THREE.Mesh(plane, faceMat); back.position.z = -z; back.rotation.y = Math.PI;
  front.renderOrder = back.renderOrder = 2;
  logo.add(front, back);
  logo.position.y = 0.03;
  button.add(logo);
}).catch(() => { document.getElementById('fallback').style.display = 'block'; });
scene.add(button);

// hold each logo, then cross-fade colour <-> black & white
let vi = 0, fadeT = 0;
const HOLD = reduced ? 9 : 3.4, FADE = 1.2;
const tmp = new THREE.Color();
let darkness = 0;   // 0 on light sections, 1 on the dark ones (set by the choreography)
const cLight = new THREE.Color(), cDark = new THREE.Color(), mLight = new THREE.Color(MONO), mDark = new THREE.Color(BONE);
function cycle(dt) {
  fadeT += dt;
  let f = Math.min(1, Math.max(0, (fadeT - HOLD) / FADE));
  if (fadeT >= HOLD + FADE) { vi = 1 - vi; fadeT = 0; f = 0; }
  const toMono = vi === 0 ? f : 1 - f;                           // 0 = colour logo, 1 = black & white logo
  const d = darkness;
  faceMat.uniforms.w.value.set((1 - toMono) * (1 - d), (1 - toMono) * d, toMono * (1 - d), toMono * d);
  for (const n in mats) {
    cLight.setHex(COLOUR[n]); cDark.setHex(n === 'black' ? BONE : COLOUR[n]);
    const base = cLight.lerp(cDark, d);
    const mono = tmp.copy(mLight).lerp(mDark, d);
    mats[n].color.copy(base).lerp(mono, toMono).multiplyScalar(SIDE);
  }
}
window.__cbVariant = () => vi;

/* ---------- choreography ----------
   Every section has an empty "slot" in its layout (.slot[data-slot]) where the logo
   belongs. The logo rides inside the slot of the section on screen and flies to the
   next slot as you scroll, so it always sits in free space and never covers text.
   One full turn between slots, facing the viewer whenever it is parked. */
const TAU = Math.PI * 2;
const ROT = Array.from({ length: 12 }, (_, k) => ({ rx: 0, ry: k * TAU }));   // facing the viewer when parked; one full turn between sections
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
const DARK = slots.map((el) => (el.closest('[data-dark]') ? 1 : 0));
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
  // squeezing in between the hero lines: squashed tall-to-wide, then it springs back
  const hq = window.__heroQ ?? 1;
  const sq = hq > 0 && hq < 1 && slots[0] && cur.d > 0.5 ? Math.sin(Math.PI * hq) : 0;
  const hg = hq < 1 ? (window.__heroG ?? 1) : 1;
  button.scale.set(scale * hg * (1 + 0.16 * sq), scale * hg * (1 - 0.22 * sq), scale * hg);
  const bob = reduced ? 0 : Math.sin(t * 1.1) * 0.035 * scale;
  button.position.set((cur.cx / W - 0.5) * 2 * halfW, -(cur.cy / H - 0.5) * 2 * halfH + bob, 0);
  // face the camera squarely wherever the logo sits on screen (no perspective tilt),
  // then add the spin between sections and a gentle side-to-side sway
  const idle = reduced ? 0 : Math.sin(t * 0.6) * 0.07;   // even sway, centred on straight-ahead
  button.rotation.set(0, 0, 0);
  button.lookAt(camera.position);
  button.rotateY(cur.ry + idle);
  button.rotateX(cur.rx + 0.9 * (1 - hq) * (sq > 0 ? 1 : 0));   // tips forward as it pushes in

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cbReady = true;
