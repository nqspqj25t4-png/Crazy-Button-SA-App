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




/* ---------- motion: Lenis smooth scroll + GSAP scroll timelines ----------
   Only transform and opacity move. With "reduce motion" switched on, none of this runs
   and every element simply sits in place. */
const G = window.gsap, ST = window.ScrollTrigger;
let lenis = null;
if (!reduced && G && ST) {
  G.registerPlugin(ST);
  if (window.Lenis && matchMedia('(pointer:fine)').matches) {          // touch screens keep their native scroll
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); const el = id.length > 1 && document.querySelector(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70, duration: 1.4 }); }
    }));
  }
  // headlines arrive word by word
  document.querySelectorAll('.split').forEach((h) => {
    const parts = [];
    [...h.childNodes].forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { parts.push(document.createTextNode(' ')); return; }
        const o = document.createElement('span'); o.className = 'w'; const i = document.createElement('span'); i.textContent = w; o.appendChild(i); parts.push(o);
      }); else parts.push(n);
    });
    h.replaceChildren(...parts);
    G.from(h.querySelectorAll('.w>span'), { yPercent: 115, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.07,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });
  // "how a button becomes drip": the three tiles start fanned like a hand of cards and come forward as you scroll
  const tiles = [...document.querySelectorAll('.grow .tile')];
  if (tiles.length && matchMedia('(min-width:761px)').matches) {
    tiles.forEach((t) => { t.classList.remove('rv'); t.style.transition = 'none'; });
    G.fromTo(tiles, { rotate: (i) => [-9, -2, 7][i], xPercent: (i) => [38, 0, -30][i], yPercent: (i) => [26, 14, 8][i], opacity: 0.35, transformOrigin: '50% 100%' },
      { rotate: 0, xPercent: 0, yPercent: 0, opacity: 1, ease: 'none', stagger: 0.06,
        scrollTrigger: { trigger: '.grow', start: 'top 85%', end: 'top 25%', scrub: 0.6 } });
  }
  // measure again once fonts, images and the painted street have settled, so pinned sections start in the right place
  const refresh = () => ST.refresh();
  addEventListener('load', refresh); document.fonts && document.fonts.ready.then(refresh); setTimeout(refresh, 1800);
  window.cbST = ST;
  // the rail slides in from the right the first time you reach it
  G.from('.hangers .hang', { xPercent: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.05,
    scrollTrigger: { trigger: '.rail-track', start: 'top 85%', once: true } });
}

/* ---------- the rail ----------
   On a laptop the pieces hang packed together and turned sideways, like a real rail; the one you point at, swipe to or
   arrow to swings round to face you and its neighbours make room. On a phone the rail is a plain sideways swipe.
   Either way the clothes lag a little behind the rail's movement and settle back. */
const railTrack = document.querySelector('.rail-track'), railUl = document.querySelector('.hangers');
let railDragged = false;
if (railTrack && railUl) {
  const items = [...railUl.children].map((li) => ({ li, g: li.querySelector('.g'), gi: li.querySelector('.gi'), tag: li.querySelector('.tag'), x: null, a: 0, s: 0 }));
  const N = items.length;
  const bar = document.querySelector('.rail-bar i'), prev = document.querySelector('.rail-btn.prev'), next = document.querySelector('.rail-btn.next');
  const fanMQ = matchMedia('(min-width:761px) and (pointer:fine)');
  let fan = false, f = 0, ft = 0, raf = 0, W = 0, E = 0, Wr = 0, L = 0, LW = 0;
  // a warm light and a floor shadow travel with the piece that faces you
  const light = document.createElement('i'); light.className = 'rail-light'; light.setAttribute('aria-hidden', 'true'); railTrack.appendChild(light);
  const clampF = (v) => Math.max(0, Math.min(N - 1, v));
  const spring = (it, v) => {                // v: how far the piece moved this frame, in px
    if (reduced) return;
    const want = Math.max(-9, Math.min(9, -v * 0.32));
    it.s = (it.s + (want - it.a) * 0.07) * 0.86; it.a += it.s;
  };
  const settled = (it) => Math.abs(it.a) < 0.03 && Math.abs(it.s) < 0.03;

  /* --- laptop: the packed rail --- */
  const measure = () => {
    if (!fan) return;
    W = railUl.clientWidth; E = items[0].li.offsetWidth;
    Wr = Math.min(W, E * (N * 0.3 + 1.9)); L = (W - Wr) / 2;     // packed tight, not stretched to the walls
    const hgt = 20 + Math.max(...items.map((it) => it.li.offsetHeight));
    railUl.style.height = hgt + 'px';
    LW = E * 2.4; light.style.width = LW + 'px'; light.style.height = hgt + 'px'; light.style.top = railUl.offsetTop + 'px';
  };
  const anchor = (v) => L + E / 2 + (v / (N - 1)) * (Wr - E);           // where the focused piece's centre sits
  const layout = () => {
    const sig = 0.85, w = items.map((_, i) => Math.exp(-((i - f) ** 2) / (2 * sig * sig)));
    const S = w.reduce((a, b) => a + b, 0);
    const c = Math.max(E * 0.2, (Wr - E * S) / (N - S));
    const sw = w.map((k) => c + (E - c) * k), cx = [];
    let run = 0; sw.forEach((s) => { cx.push(run + s / 2); run += s; });
    const lo = Math.floor(f), hi = Math.min(N - 1, lo + 1), t = f - lo;
    const shift = anchor(f) - (cx[lo] + (cx[hi] - cx[lo]) * t);
    light.style.transform = `translate3d(${(railUl.offsetLeft + anchor(f) - LW / 2).toFixed(1)}px,0,0)`;
    items.forEach((it, i) => {
      const x = cx[i] + shift - E / 2, k = w[i], d = i - f;
      spring(it, it.x === null ? 0 : x - it.x); it.x = x;
      const turn = Math.max(-1, Math.min(1, d)) * (1 - k) * 58;
      it.li.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      it.li.style.zIndex = String(200 - Math.round(Math.abs(d) * 10));
      it.gi.style.transform = `perspective(1100px) rotateY(${(-turn).toFixed(2)}deg) scale(${(0.84 + 0.16 * k).toFixed(4)})`;
      it.g.style.rotate = it.a.toFixed(2) + 'deg';
      it.tag.style.opacity = Math.max(0, (k - 0.8) / 0.2).toFixed(3);
    });
  };
  const fanPaint = () => {
    const w = 1 / N;
    if (bar) { bar.style.width = (w * 100) + '%'; bar.style.left = ((f / (N - 1)) * (1 - w) * 100) + '%'; }
    if (prev) prev.disabled = ft <= 0.01;
    if (next) next.disabled = ft >= N - 1.01;
  };
  const fanTick = () => {
    raf = 0;
    f = reduced ? ft : f + (ft - f) * 0.13;
    if (Math.abs(ft - f) < 0.0008) f = ft;
    layout(); fanPaint();
    if (f !== ft || !items.every(settled)) raf = requestAnimationFrame(fanTick);
  };
  const focusTo = (v) => { ft = clampF(v); if (!raf) raf = requestAnimationFrame(fanTick); };
  const pointAt = (clientX) => {
    const r = railUl.getBoundingClientRect();
    focusTo(((clientX - r.left - L - E / 2) / Math.max(1, Wr - E)) * (N - 1));
  };
  let lastPX = null;
  railTrack.addEventListener('mousemove', (e) => {
    if (!fan) return;
    if (lastPX !== null && Math.abs(e.clientX - lastPX) < 3) return;   // a resting hand shouldn't undo a swipe
    lastPX = e.clientX; pointAt(e.clientX);
  });
  railTrack.addEventListener('mouseleave', () => { lastPX = null; });

  /* --- phone (and small windows): a plain sideways scroll --- */
  const max = () => Math.max(0, railTrack.scrollWidth - railTrack.clientWidth);
  const step = () => { const li = railUl.querySelector('li'); return li ? li.offsetWidth + (parseFloat(getComputedStyle(railUl).columnGap) || 0) : 240; };
  let target = null, lastX = railTrack.scrollLeft, ang = 0, spin = 0;
  const paint = () => {
    const m = max(), x = railTrack.scrollLeft, w = m > 0 ? railTrack.clientWidth / railTrack.scrollWidth : 1;
    if (bar) { bar.style.width = (w * 100) + '%'; bar.style.left = (m > 0 ? (x / m) * (1 - w) * 100 : 0) + '%'; }
    if (prev) prev.disabled = x <= 2;
    if (next) next.disabled = x >= m - 2;
  };
  const tick = () => {
    raf = 0;
    if (target !== null) {
      const d = target - railTrack.scrollLeft;
      if (Math.abs(d) < 0.6) { railTrack.scrollLeft = target; target = null; railTrack.style.scrollSnapType = ''; }
      else railTrack.scrollLeft += d * 0.12;
    }
    const x = railTrack.scrollLeft, v = x - lastX; lastX = x;
    if (!reduced) {
      const want = Math.max(-8, Math.min(8, -v * 0.3));
      spin = (spin + (want - ang) * 0.07) * 0.86; ang += spin;
      railUl.style.setProperty('--sway', ang.toFixed(2) + 'deg');
    }
    paint();
    if (target !== null || Math.abs(v) > 0.05 || Math.abs(ang) > 0.03 || Math.abs(spin) > 0.03) raf = requestAnimationFrame(tick);
    else { ang = spin = 0; railUl.style.setProperty('--sway', '0deg'); }
  };
  const wake = () => { if (!fan && !raf) raf = requestAnimationFrame(tick); };
  const glideTo = (x) => {
    target = Math.max(0, Math.min(max(), x));
    if (reduced) { railTrack.scrollLeft = target; target = null; } else railTrack.style.scrollSnapType = 'none';
    wake();
  };
  const glideBy = (d) => glideTo((target ?? railTrack.scrollLeft) + d);
  railTrack.addEventListener('scroll', wake, { passive: true });

  /* --- shared controls --- */
  const move = (n) => (fan ? focusTo(Math.round(ft) + n) : glideBy(step() * n * 2));
  if (prev) prev.addEventListener('click', () => move(-1));
  if (next) next.addEventListener('click', () => move(1));
  railTrack.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); fan ? focusTo(Math.round(ft) + k) : glideBy(step() * k); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); const end = e.key === 'End'; fan ? focusTo(end ? N - 1 : 0) : glideTo(end ? max() : 0); }
  });
  // a sideways trackpad swipe (or shift + wheel) belongs to the rail, momentum included, until the fingers rest;
  // up-and-down still scrolls the page
  let axis = null, idle = 0;
  railTrack.addEventListener('wheel', (e) => {
    const u = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? railTrack.clientWidth : 1;
    const dx = e.deltaX * u, dy = e.deltaY * u;
    clearTimeout(idle);
    idle = setTimeout(() => { axis = null; railTrack.style.scrollSnapType = ''; }, 180);
    if (axis !== 'x' && (e.shiftKey || (Math.abs(dx) > 1 && Math.abs(dx) > Math.abs(dy)))) axis = 'x';
    if (axis !== 'x') { axis = 'y'; return; }
    e.preventDefault(); e.stopPropagation();
    const d = e.shiftKey && !dx ? dy : dx;
    if (fan) { lastPX = null; focusTo(ft + d / 95); return; }
    target = null; railTrack.style.scrollSnapType = 'none';
    railTrack.scrollLeft += d * 1.4; wake();
  }, { passive: false });
  // grab and throw it with a mouse (scroll mode only)
  let down = null;
  railTrack.addEventListener('dragstart', (e) => e.preventDefault());
  railTrack.addEventListener('pointerdown', (e) => {
    if (fan || e.pointerType !== 'mouse' || e.button !== 0) return;
    down = { x: e.clientX, s: railTrack.scrollLeft, lx: e.clientX, lt: performance.now(), vx: 0 }; railDragged = false;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!railDragged && Math.abs(dx) > 6) { railDragged = true; target = null; railTrack.classList.add('drag'); railTrack.style.scrollSnapType = 'none'; }
    if (!railDragged) return;
    const t = performance.now();
    down.vx = 0.8 * ((e.clientX - down.lx) / Math.max(1, t - down.lt)) + 0.2 * down.vx; down.lx = e.clientX; down.lt = t;
    railTrack.scrollLeft = down.s - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    if (railDragged) {
      railTrack.classList.remove('drag');
      if (performance.now() - down.lt < 90) glideBy(-down.vx * 380); else railTrack.style.scrollSnapType = '';
      setTimeout(() => { railDragged = false; }, 0);
    }
    down = null;
  });

  const setMode = () => {
    fan = fanMQ.matches;
    railTrack.classList.toggle('fan', fan); light.hidden = !fan;
    cancelAnimationFrame(raf); raf = 0;
    items.forEach((it) => { it.x = null; it.a = it.s = 0; ['transform', 'zIndex'].forEach((p) => { it.li.style[p] = ''; }); it.gi.style.transform = ''; it.g.style.rotate = ''; it.tag.style.opacity = ''; });
    railUl.style.height = '';
    if (fan) { measure(); f = ft = Math.min(N - 1, 1); layout(); fanPaint(); } else paint();
  };
  // the close-up keeps the rail in step, so a piece flies back to the right place
  window.cbRailFocus = (i) => { if (fan) focusTo(i); else { const li = items[i].li; glideTo(li.offsetLeft - (railTrack.clientWidth - li.offsetWidth) / 2); } };
  fanMQ.addEventListener('change', setMode);
  addEventListener('resize', () => { if (fan) { measure(); layout(); fanPaint(); } else paint(); });
  railUl.querySelectorAll('img').forEach((im) => im.addEventListener('load', () => { if (fan) { measure(); layout(); } }));
  setMode();
}

/* ---------- on the rail: nudge a garment, or take it down ---------- */
const RAIL = [{"id": "umlazi-unit-hoodie", "img": "hoodie", "title": "Umlazi Unit Hoodie", "col": "Core Range", "sub": "Olive fleece, gold embroidered CB", "desc": "Olive heavyweight hoodie with gold embroidered CB letters, Umlazi Unit stitching, flag-colour sleeve stripes and a leather cuff tab.", "price": 2449, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "craziest-threads-varsity", "img": "varsity", "title": "Craziest Threads Varsity Jacket", "col": "Core Range", "sub": "Black and gold varsity, chenille CB", "desc": "Black wool body, gold leather sleeves, chenille CB, shield and taxi patches.", "price": 3599, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "kwa-mashu-bomber", "img": "bomber", "title": "Kwa Mashu To The World Bomber", "col": "Zulu Future", "sub": "Quilted flag-colour sleeves", "desc": "Black bomber with quilted sleeves in the flag palette and a Kwa Mashu To The World chest patch.", "price": 3199, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "umlazi-ailwo-knit", "img": "buttonsdown", "title": "Umlazi Ailwo! Button Knit", "col": "Core Range", "sub": "Deep green knit, rows of buttons", "desc": "Deep green crew knit with rows of statement buttons and an Umlazi Ailwo! badge.", "price": 2749, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "yizwa-ke-manje-cardigan", "img": "cardigan", "title": "Yizwa Ke Manje Cardigan", "col": "Thrift Flex", "sub": "Ash grey, flag-stripe trim", "desc": "Ash grey cardigan, flag-stripe trim, gold Crazy Button badge and Yizwa ke manje in the lining.", "price": 3049, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "mama-said-tee", "img": "mamasaid", "title": "Mama Said Tee", "col": "Mama Said", "sub": "Wear something warm", "desc": "Cream oversized box-cut tee with a vintage gogo stamp print. Mama said wear something warm.", "price": 1699, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "button-ups-knit", "img": "buttonups", "title": "Button Ups Knit", "col": "Core Range", "sub": "Navy knit, red colour-block", "desc": "Navy knit with scattered buttons and a red colour-block panel.", "price": 2749, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "contract-c-shirt", "img": "contractc", "title": "Contract C Shirt", "col": "Core Range", "sub": "White, sleeve buttons", "desc": "White short-sleeve shirt with sleeve buttons and a Crazy Button SA chest print.", "price": 2049, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "taxi-rank-tee", "img": "taxi", "title": "Taxi Rank Chronicles Tee", "col": "Core Range", "sub": "Washed grey, Daily Route 1", "desc": "Washed grey tee with a taxi rank illustration and CBSA Daily Route 1.", "price": 1449, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}, {"id": "craziest-threads-tee", "img": "tee", "title": "Craziest Threads On The Block Tee", "col": "Core Range", "sub": "Black unisex, skyline back print", "desc": "Black unisex tee with a Jozi skyline and flag stripe back print.", "price": 1449, "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}];
const pick = document.getElementById('pick');
if (pick) {
  const pimg = document.getElementById('pick-img'), info = pick.querySelector('.pick-info');
  let from = null, last = null;
  const swing = (b) => { if (reduced) return; b.classList.remove('swing'); void b.offsetWidth; b.classList.add('swing'); };
  document.querySelectorAll('.hang').forEach((b) => {
    b.addEventListener('mouseenter', () => swing(b));
    b.querySelector('.g').addEventListener('animationend', () => b.classList.remove('swing'));
    b.addEventListener('click', () => { if (!railDragged) open(b); });
  });
  const buttons = [...document.querySelectorAll('.hang')];
  const hang = document.getElementById('pick-hang'), sw = hang.querySelector('.pick-swing'), wood = document.getElementById('pick-wood');
  const bar = hang.querySelector('.pick-bar'), tags = hang.querySelector('.pick-tags');
  let cur = 0, busy = false;
  const fill = (b) => {
    const P = RAIL[+b.dataset.i], src = b.querySelector('img');
    cur = +b.dataset.i;
    pimg.src = src.currentSrc || src.src; pimg.alt = P.title;
    const w = b.querySelector('.wood'); wood.innerHTML = w ? w.outerHTML : '';
    const price = 'R' + P.price.toLocaleString('en-ZA').replace(/\s/g, ',');
    document.getElementById('pick-col').textContent = P.col;
    document.getElementById('pick-name').textContent = P.title;
    document.getElementById('pick-sub').textContent = P.sub;
    document.getElementById('pick-desc').textContent = P.desc;
    document.getElementById('pick-price').textContent = price;
    document.getElementById('pick-tag-price').textContent = price;
    document.getElementById('pick-tag-size').textContent = P.sizes[0] + '–' + P.sizes[P.sizes.length - 1];
    const ul = document.getElementById('pick-sizes'); ul.innerHTML = '';
    P.sizes.forEach((z) => { const li = document.createElement('li'); li.textContent = z; ul.appendChild(li); });
    document.getElementById('pick-go').href = '/shop/product/' + P.id;
    if (window.cbRailFocus) window.cbRailFocus(cur);
    return P;
  };
  const ready = (fn) => { if (pimg.complete && pimg.naturalWidth) requestAnimationFrame(fn); else pimg.onload = () => requestAnimationFrame(fn); };
  // the piece settles on its hook like it was just hung up, then its tags swing in
  const settle = (dir) => {
    if (reduced || !G) return;
    G.fromTo(sw, { rotate: 7 * dir }, { rotate: 0, duration: 1.6, ease: 'elastic.out(1, 0.35)' });
    G.fromTo(tags, { opacity: 0, y: -14, rotate: -24 * dir }, { opacity: 1, y: 0, rotate: 0, duration: 1.1, delay: 0.25, ease: 'elastic.out(1, 0.4)' });
  };
  function open(b) {
    from = b; last = document.activeElement;
    const P = fill(b), src = b.querySelector('img');
    pick.hidden = false; lenis && lenis.stop(); document.body.style.overflow = 'hidden';
    if (window.cbTrack) window.cbTrack('select_item', { item_list_name: 'rail', item_id: P.id });
    ready(() => {
      // fly: start the big piece exactly where the hanging one is, then let it travel to the centre
      const a = src.getBoundingClientRect(), z = hang.getBoundingClientRect();
      b.classList.add('taken'); pick.classList.add('open');
      const s = Math.min(a.width / Math.max(1, z.width), a.height / Math.max(1, z.height));
      if (reduced || !G) { info.style.opacity = 1; info.style.transform = 'none'; }
      else {
        G.fromTo(hang, { x: a.left - z.left + (a.width - z.width * s) / 2, y: a.top - z.top, scale: s }, { x: 0, y: 0, scale: 1, duration: 0.75, ease: 'power3.inOut' });
        G.fromTo(bar, { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 0.6, delay: 0.45, ease: 'power3.out' });
        G.delayedCall(0.6, () => settle(1));
        G.fromTo(info, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.55, delay: 0.35, ease: 'power3.out' });
      }
      pick.querySelector('.pick-close').focus();
    });
  }
  // flip along the rail without putting the piece back
  function step(dir) {
    if (pick.hidden || busy) return;
    const nb = buttons[(cur + dir + buttons.length) % buttons.length];
    const swap = () => { from && from.classList.remove('taken'); from = nb; nb.classList.add('taken'); fill(nb); };
    if (reduced || !G) { swap(); return; }
    busy = true;
    G.to([hang, info], { x: -70 * dir, opacity: 0, duration: 0.26, ease: 'power2.in', onComplete: () => {
      swap();
      ready(() => {
        G.fromTo(hang, { x: 90 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', onComplete: () => { busy = false; } });
        G.fromTo(info, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, delay: 0.08, ease: 'power3.out' });
        settle(dir);
      });
    } });
  }
  pick.querySelector('.pick-nav.prev').addEventListener('click', () => step(-1));
  pick.querySelector('.pick-nav.next').addEventListener('click', () => step(1));
  function close() {
    if (pick.hidden) return;
    const done = () => { pick.hidden = true; pick.classList.remove('open'); from && from.classList.remove('taken'); document.body.style.overflow = ''; lenis && lenis.start(); last && last.focus(); if (from) swing(from); busy = false; };
    if (reduced || !G || !from) return done();
    const a = from.querySelector('img').getBoundingClientRect(), z = hang.getBoundingClientRect();
    const s = Math.min(a.width / z.width, a.height / z.height);
    G.to(info, { opacity: 0, x: 30, duration: 0.2 });
    G.to([bar, tags], { opacity: 0, duration: 0.2 });
    pick.classList.remove('open');
    G.to(hang, { x: '+=' + (a.left - z.left + (a.width - z.width * s) / 2), y: '+=' + (a.top - z.top), scale: s, duration: 0.5, ease: 'power3.inOut', onComplete: done });
  }
  pick.querySelector('.pick-close').addEventListener('click', close);
  pick.addEventListener('click', (e) => { if (e.target === pick) close(); });
  addEventListener('keydown', (e) => {
    if (pick.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
    if (e.key === 'Tab') {                    // keep focus inside the open piece
      const f = [...pick.querySelectorAll('button, a')]; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
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
  // Scrolling walks the camera up to the shop door and through it. The camera eases after the
  // scroll (so it glides instead of jumping), the street softens out of focus as you pass the door,
  // and the painted interior comes towards you before the lights go down.
  const c = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => t * t * (3 - 2 * t);
  let sp = 0, last = performance.now(), running = false;
  const scrollP = () => {
    const r = world.getBoundingClientRect();
    return c(-r.top / Math.max(1, r.height - innerHeight));
  };
  const paint = (p) => {
    const walk = ease(c(p / 0.44));
    world.style.setProperty('--zoom', (1 + walk * 2.5).toFixed(4));
    world.style.setProperty('--sblur', (c((p - 0.22) / 0.16) * 4).toFixed(2) + 'px');
    world.style.setProperty('--door', (Math.sin(Math.PI * c((p - 0.2) / 0.22)) * 0.92).toFixed(4));
    const inn = c((p - 0.3) / 0.12);
    world.style.setProperty('--inside', ease(inn).toFixed(4));
    const through = ease(c((p - 0.25) / 0.27));                      // coming through the doorway
    const look = c((p - 0.52) / 0.33);                                 // looking around inside
    world.style.setProperty('--inzoom', (1.3 - through * 0.3 + look * 0.04).toFixed(4));
    world.style.setProperty('--inx', (2.5 - look * 5).toFixed(2) + '%');
    world.style.setProperty('--inpos', (30 + ease(c((p - 0.4) / 0.45)) * 48).toFixed(1) + '%');   // phones: walk the eye from the door, past the jackets, to the counter prices
    world.style.setProperty('--dusk', ease(c((p - 0.8) / 0.2)).toFixed(4));
    world.style.setProperty('--ui', c(1 - p * 6).toFixed(3));
    world.style.setProperty('--capvis', p > 0.17 ? 'hidden' : 'visible');
  };
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const p = scrollP();
    sp += (p - sp) * (1 - Math.exp(-dt * 7));
    if (Math.abs(p - sp) < 0.0004) sp = p;
    paint(sp);
    if (sp !== p) requestAnimationFrame(loop); else running = false;
  };
  const kick = () => {
    if (reduced) return;
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  };
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick);
  sp = scrollP(); paint(sp);
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
    const r = hero.getBoundingClientRect();
    const half = hero.clientHeight / 2;
    const mid = Math.max(Math.min(half, (innerHeight - r.top) / 2), l1.offsetHeight + 8);   // centre of the visible part
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
    measure();
    const e = ease(q), o = 1 - e;
    const g = 0.18 + 0.82 * e;              // how big the logo is as it pushes in; the gap between the lines matches it
    window.__heroQ = q; window.__heroG = g;
    const gap = 1 - g;
    l1.style.transform = `perspective(1100px) translateY(${(c1 * gap).toFixed(1)}px) rotateX(${(-55 * o).toFixed(1)}deg) scale(${(1 - 0.1 * o).toFixed(3)})`;
    l2.style.transform = `perspective(1100px) translateY(${(c2 * gap).toFixed(1)}px) rotateX(${(55 * o).toFixed(1)}deg) scale(${(1 - 0.1 * o).toFixed(3)})`;
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
const ROT = Array.from({ length: 12 }, (_, k) => ({ rx: 0, ry: 0, rz: k * TAU }));   // facing the viewer when parked; one full turn between sections
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
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w, d: DARK[i], rx: ROT[i].rx, ry: ROT[i].ry, rz: ROT[i].rz, f: 0, on: r.width > 0 };
}
function goalNow() {
  const g = slots.map(slotGoal).filter((x) => x.on);   // slots hidden on this screen size are skipped
  const mid = H * 0.5;
  // last slot whose centre is at or above the middle of the screen
  let i = -1;
  for (let k = 0; k < g.length; k++) if (g[k].cy <= mid) i = k;
  if (i < 0) { const z = g[0]; return { cx: z.cx, cy: z.cy, w: z.w, d: z.d, rx: z.rx, ry: z.ry, rz: z.rz, f: 0 }; }
  if (i >= g.length - 1) { const z = g[g.length - 1]; return { cx: z.cx, cy: z.cy, w: z.w, d: z.d, rx: z.rx, ry: z.ry, rz: z.rz, f: 0 }; }
  const a = g[i], b = g[i + 1];
  // Ride along with slot i, then sweep into slot i+1 over a short scroll distance just
  // before it reaches the middle of the screen; long gaps never mean a long crossing.
  const dist = Math.max(1, b.cy - a.cy);
  const r = b.cy - mid;                               // px until slot i+1 is centred
  const flyLen = Math.min(0.6 * dist, 0.55 * H);
  const endAt = Math.min(0.12 * dist, 0.1 * H);
  const t = smooth(Math.min(1, Math.max(0, (flyLen - r) / Math.max(1, flyLen - endAt))));
  const f = Math.sin(t * Math.PI);                                   // 0 parked, 1 mid-flight
  return {
    cx: a.cx + (b.cx - a.cx) * t,
    cy: a.cy + (b.cy - a.cy) * t,
    w: (a.w + (b.w - a.w) * t) * (1 - 0.55 * f),                     // tucks small while it travels over content
    rx: a.rx + (b.rx - a.rx) * t,
    ry: a.ry + (b.ry - a.ry) * t,
    rz: a.rz + (b.rz - a.rz) * t,                                    // rolls one full turn, like a button
    d: a.d + (b.d - a.d) * t,
    f,
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
  button.rotation.set(0, 0, 0);   // parallel to the screen, so it is never skewed near the edges
  button.rotateY(cur.ry + idle + 0.45 * cur.f);                 // leans a little into the turn
  button.rotateX(cur.rx + 0.9 * (1 - hq) * (sq > 0 ? 1 : 0));   // tips forward as it pushes in
  button.rotateZ(-cur.rz);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cbReady = true;

/* ---------- fresh off the needle: the varsity comes up out of the dark under a light ---------- */
const freshFrame = document.querySelector('.show .frame');
if (freshFrame && show) {
  const lightUp = () => { freshFrame.classList.add('lit'); show.classList.add('lit'); };
  if (reduced || !('IntersectionObserver' in window)) lightUp();
  else { const fio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { lightUp(); fio.disconnect(); } }, { threshold: 0.35 }); fio.observe(freshFrame); }
}

/* ---------- six drops: each card tucks under the next one as it slides over ---------- */
const dropRows = [...document.querySelectorAll('.route .rows li')];
if (dropRows.length && matchMedia('(min-width:761px)').matches) {
  dropRows.forEach((li, k) => li.style.setProperty('--k', k));
  if (G && ST && !reduced) dropRows.slice(0, -1).forEach((li, k) => {
    ST.create({ trigger: dropRows[k + 1], start: 'top bottom', end: () => 'top top+=' + (104 + (k + 1) * 18), scrub: true,
      onUpdate: (st) => { li.style.scale = (1 - st.progress * 0.06).toFixed(4); li.style.filter = 'brightness(' + (1 - st.progress * 0.35).toFixed(3) + ')'; } });
  });
}

/* ---------- the ticker runs with your scroll: faster when you scroll fast, backwards when you scroll up ---------- */
const tickTrack = document.querySelector('.ticker-track');
if (tickTrack && !reduced && 'IntersectionObserver' in window) {
  let tx = 0, tv = 0, tdir = 1, tlast = scrollY, ton = false, tw = 0;
  const trun = () => {
    if (!ton) return;
    const y = scrollY, dy = y - tlast; tlast = y;
    if (dy) tdir = dy > 0 ? 1 : -1;
    tv += (Math.min(60, Math.abs(dy)) * 0.5 - tv) * 0.1;
    tw = tw || tickTrack.firstElementChild.offsetWidth;
    tx -= tdir * (0.7 + tv);
    if (tx <= -tw) tx += tw; if (tx > 0) tx -= tw;
    tickTrack.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)';
    requestAnimationFrame(trun);
  };
  new IntersectionObserver(([e]) => { const was = ton; ton = e.isIntersecting; if (ton && !was) { tlast = scrollY; requestAnimationFrame(trun); } }).observe(tickTrack);
  addEventListener('resize', () => { tw = 0; });
}

/* ---------- small touches for a mouse: buttons lean toward the pointer, a label rides along the rail ---------- */
if (!reduced && matchMedia('(pointer:fine)').matches) {
  const mags = [...document.querySelectorAll('.btn, .rail-btn, .pick-nav, .pick-close')].map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
  let mraf = 0;
  const mloop = () => {
    let moving = false;
    mags.forEach((m) => {
      m.x += (m.tx - m.x) * 0.18; m.y += (m.ty - m.y) * 0.18;
      if (Math.abs(m.tx - m.x) > 0.05 || Math.abs(m.ty - m.y) > 0.05) moving = true;
      m.el.style.translate = m.x.toFixed(2) + 'px ' + m.y.toFixed(2) + 'px';
    });
    mraf = moving ? requestAnimationFrame(mloop) : 0;
  };
  mags.forEach((m) => {
    m.el.addEventListener('mousemove', (e) => { const r = m.el.getBoundingClientRect(); m.tx = (e.clientX - r.left - r.width / 2) * 0.3; m.ty = (e.clientY - r.top - r.height / 2) * 0.3; if (!mraf) mraf = requestAnimationFrame(mloop); });
    m.el.addEventListener('mouseleave', () => { m.tx = m.ty = 0; if (!mraf) mraf = requestAnimationFrame(mloop); });
  });
  const track = document.querySelector('.rail-track');
  if (track) {
    const tag = document.createElement('div'); tag.className = 'cur-tag'; tag.setAttribute('aria-hidden', 'true'); tag.textContent = 'Take it down'; document.body.appendChild(tag);
    let cx = 0, cy = 0, gx = 0, gy = 0, craf = 0;
    const cloop = () => { cx += (gx - cx) * 0.22; cy += (gy - cy) * 0.22; tag.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; craf = Math.abs(gx - cx) + Math.abs(gy - cy) > 0.2 ? requestAnimationFrame(cloop) : 0; };
    track.addEventListener('mousemove', (e) => {
      const over = !!e.target.closest('.hang') && (!pick || pick.hidden);
      tag.classList.toggle('on', over);
      gx = e.clientX + 18; gy = e.clientY + 20;
      if (!tag.classList.contains('was')) { cx = gx; cy = gy; tag.classList.add('was'); }
      if (!craf) craf = requestAnimationFrame(cloop);
    });
    track.addEventListener('mouseleave', () => tag.classList.remove('on', 'was'));
    track.addEventListener('click', () => tag.classList.remove('on'));
  }
}

/* ---------- a gold wipe carries you into the shop ---------- */
if (!reduced) {
  const wipe = document.createElement('div'); wipe.className = 'wipe'; wipe.setAttribute('aria-hidden', 'true'); wipe.innerHTML = '<span>Crazy Button SA</span>'; document.body.appendChild(wipe);
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="/shop"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    e.preventDefault(); wipe.classList.add('go');
    try { sessionStorage.setItem('cb-wipe', '1'); } catch (err) { /* private mode */ }
    setTimeout(() => { location.href = a.href; }, 560);
  });
  addEventListener('pageshow', () => wipe.classList.remove('go'));
}
