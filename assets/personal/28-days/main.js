/* ============================================================
   28 Days of Retaliation.

   One long street, walked by scrolling. This file loads the
   photographs, builds the street, and then on every frame turns
   one number (how far you have walked) into a camera, an hour of
   the day, the fires that are burning, the words on the screen,
   and the sound.
   ============================================================ */

import * as THREE from 'three';
import { world, clamp, lerp, sstep } from './gl/common.js';
import { buildStreet } from './gl/street.js';
import { buildProps } from './gl/props.js';
import { Lights, FireSet, SmokeSet, Motes, Molotovs, ShockRing, Fireball } from './gl/fx.js';
import { buildMonument } from './gl/monument.js';
import { buildCombat } from './gl/combat.js';
import { logoPath, LOGO_ASPECT } from './gl/logo.js';
import { buildMap, buildMini } from './gl/map.js';
import { SHOTS } from './photos.js';
import { buildSewers, SEWER } from './gl/sewers.js';
import { buildRaid } from './gl/raid.js';
import { buildBody } from './gl/body.js';
import { buildIsrael } from './gl/israel.js';
import { buildZzw, buildPreparing, ZZW } from './gl/undergrounds.js';
import { buildClimbers } from './gl/climbers.js';
import { buildTroops } from './gl/troops.js';
import { crowd, KINDS } from './gl/figures.js';
import { washMaterial } from './gl/ink.js';
import { WITNESSES, ASK } from './witness.js';
import { QUALITY } from './gl/ink.js';
import { WALK_CLOCK } from './gl/walk.js';
import { buildPost } from './gl/post.js';
import { buildShadow } from './gl/shadow.js';
import { PLAN } from './gl/plan.js';
import { CHAPTERS, BEATS, CAM, MOODS, TRACKS, DAY_RANGE, PLATES, PHOTO_NOTES, PHOTOS, SLATES, at, chapterIndex } from './story.js';
import { Sound } from './audio.js';
import { buildHUD } from './hud.js';
import { HE, UI, wordPage, setLang } from './lang.js';
import { CAPTIONS_HE, PLACES_HE } from './story.he.js';

const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IMG = './assets/personal/28-days/img/';
const query = new URLSearchParams(location.search);
const coverFilm = $('#cover-film');
const filmToggle = $('#film-toggle');
let filmPaused = reduce;
function filmLabel() {
  filmToggle.textContent = coverFilm.paused
    ? (HE ? 'ניגון הסרטון' : 'Play video')
    : (HE ? 'השהיית הסרטון' : 'Pause video');
}
function syncCoverFilm() {
  if (root.classList.contains('at-cover') && !root.classList.contains('field-open') && !document.hidden && !filmPaused) {
    coverFilm.play().catch(() => { filmLabel(); });
  } else coverFilm.pause();
}
function filmLoaded() {
  coverFilm.classList.add('is-loaded');
  filmToggle.hidden = false;
  filmLabel();
  syncCoverFilm();
}
coverFilm.addEventListener('loadeddata', filmLoaded);
if (coverFilm.readyState >= 2) filmLoaded();
coverFilm.addEventListener('play', filmLabel);
coverFilm.addEventListener('pause', filmLabel);
coverFilm.addEventListener('error', () => {
  coverFilm.classList.remove('is-loaded');
  filmToggle.hidden = true;
});
filmToggle.addEventListener('click', () => {
  filmPaused = !coverFilm.paused;
  syncCoverFilm();
});
document.addEventListener('visibilitychange', syncCoverFilm);
document.addEventListener('days28-guide-open', syncCoverFilm);
document.addEventListener('days28-guide-close', syncCoverFilm);
let CREDITS = {};

/* ── the length of the walk ────────────────────────────────── */
const starts = [];
let total = 0;
CHAPTERS.forEach((c) => { starts.push(total); total += c.len; });
const LAST = CHAPTERS.length;
const toUnits = (g) => {
  const d = clamp(g) * total;
  let i = 0;
  while (i < LAST - 1 && d >= starts[i + 1]) i++;
  return i + clamp((d - starts[i]) / CHAPTERS[i].len);
};
const toProgress = (u) => {
  const i = Math.min(Math.floor(u), LAST - 1);
  return (starts[i] + (u - i) * CHAPTERS[i].len) / total;
};

/* ── curves ────────────────────────────────────────────────── */
/* A smooth path through keys that never overshoots them: the camera must not
   dip under a stair or swing past the top of a wall. */
function spline(keys) {
  const n = keys.length, dims = keys[0].length - 1;
  const xs = keys.map((k) => k[0]);
  const tan = [];
  for (let d = 1; d <= dims; d++) {
    const sec = [];
    for (let i = 0; i < n - 1; i++) sec.push((keys[i + 1][d] - keys[i][d]) / (xs[i + 1] - xs[i]));
    const m = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      if (i === 0) m[i] = sec[0];
      else if (i === n - 1) m[i] = sec[n - 2];
      else if (sec[i - 1] * sec[i] <= 0) m[i] = 0;
      else {
        const h0 = xs[i] - xs[i - 1], h1 = xs[i + 1] - xs[i];
        const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
        m[i] = (w1 + w2) / (w1 / sec[i - 1] + w2 / sec[i]);
      }
    }
    tan.push(m);
  }
  let i = 0;
  return (x, out) => {
    x = clamp(x, xs[0], xs[n - 1]);
    while (i < n - 2 && x > xs[i + 1]) i++;
    while (i > 0 && x < xs[i]) i--;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    for (let d = 0; d < dims; d++) {
      out[d] = h00 * keys[i][d + 1] + h10 * h * tan[d][i] + h01 * keys[i + 1][d + 1] + h11 * h * tan[d][i + 1];
    }
    return out;
  };
}

function track(keys, x) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (x <= keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], (x - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
  }
  return keys[keys.length - 1][1];
}

const mood = {};
function moodAt(u) {
  let i = 0;
  while (i < MOODS.length - 2 && u > MOODS[i + 1][0]) i++;
  const a = MOODS[i], b = MOODS[i + 1];
  const t = sstep(a[0], b[0], u);
  for (const k of Object.keys(a[1])) {
    const va = a[1][k], vb = b[1][k];
    if (Array.isArray(va)) {
      const o = mood[k] || (mood[k] = [0, 0, 0]);
      for (let j = 0; j < 3; j++) o[j] = lerp(va[j], vb[j], t);
    } else mood[k] = lerp(va, vb, t);
  }
  return mood;
}

/* ── the page around the picture ───────────────────────────── */
function buildPage() {
  wordPage();
  const story = $('#story');
  BEATS.forEach((b, i) => {
    const el = document.createElement('article');
    el.className = `beat beat--${b.side}${b.small ? ' beat--small' : ''}${b.quote ? ' beat--quote' : ''}${b.held ? ' beat--held' : ''}`;
    el.dataset.chapter = b.at[0];
    b.ci = chapterIndex(b.at[0]);
    let n = 0;
    const words = (t) => t.split(' ').map((w) => `<span class="w" style="--w:${n++}">${w}</span>`).join(' ');
    let html = `<p class="beat__kicker"><span>${words(b.kicker)}</span></p>`;
    if (b.title) html += `<h2 class="beat__title">${words(b.title)}</h2>`;
    if (b.quote) html += `<blockquote class="beat__quote">${words(b.quote)}</blockquote>`;
    html += b.body.map((p) => `<p class="beat__p">${words(p)}</p>`).join('');
    b.words = n;
    el.innerHTML = html;
    [...el.children].forEach((c, k) => c.style.setProperty('--i', k));
    story.appendChild(el);
    b.el = el;
    b.index = i;
  });

  const miniMap = $('#mini-map');
  CHAPTERS.forEach((c, i) => {
    if (i === 0) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mini__pin'; b.dataset.go = i;
    b.innerHTML = `<span>${c.label}${c.year ? `<i>${c.year}</i>` : ''}</span>`;
    miniMap.appendChild(b);
    c.stop = b;
  });

  /* the logo, drawn flat from the same outlines as the solid one */
  const d = logoPath();
  const hgt = 1 / LOGO_ASPECT;
  document.querySelectorAll('[data-logo]').forEach((el) => {
    el.innerHTML = `<svg viewBox="-0.5 ${(-hgt / 2).toFixed(4)} 1 ${(hgt * 0.86).toFixed(4)}" role="img" aria-label="28"><path d="${d}" fill="currentColor" fill-rule="evenodd"/></svg>`;
  });

  /* where each photograph came from, read from the file the download script wrote */
  const cr = $('#credit-list');
  [...$('#record').children].forEach((c, k) => c.style.setProperty('--i', k));
  fetch(`${IMG}credits.json`).then((r) => r.json()).then((credits) => {
    CREDITS = credits;
    for (const [id, what] of Object.entries(PHOTO_NOTES)) {
      const c = credits[id];
      if (!c) continue;
      const li = document.createElement('li');
      const by = c.author && !/unknown|nieznany/i.test(c.author) ? `${c.author}. ` : '';
      const a = document.createElement('a');
      a.href = c.page; a.target = '_blank'; a.rel = 'noopener'; a.textContent = UI.commons;
      const bdi = (t) => { const e = document.createElement('bdi'); e.textContent = t; return e; };
      li.append(`${what}. `, bdi(`${by}${c.license}.`), ' ', a);
      cr.appendChild(li);
    }
  }).catch(() => {});
}

const dayDate = (d) => UI.date(d);

/* ── start ─────────────────────────────────────────────────── */
async function boot() {
  buildPage();

  let renderer;
  try {
    const canvas = $('#gl');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
  } catch (e) {
    /* no 3D: the story can still be read, with its photographs */
    root.classList.add('no-gl');
    BEATS.forEach((b) => b.el.classList.add('is-on'));
    $('#veil').remove();
    return;
  }
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.NoToneMapping;

  /* photographs and type */
  const bar = $('#veil-bar');
  const tex = {};
  let done = 0;
  const loader = new THREE.TextureLoader();
  const loads = PHOTOS.map((id) => new Promise((res, rej) => {
    loader.load(`${IMG}${id}.jpg`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      tex[id] = t;
      done++;
      bar.style.transform = `scaleX(${done / PHOTOS.length})`;
      res();
    }, undefined, rej);
  }));
  /* the monument of the last scene: the artist's painting, cut out of its parchment */
  loads.push(new Promise((res, rej) => loader.load(`${IMG}monument.webp`, (t) => {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 8;
    tex.monument = t;
    res();
  }, undefined, rej)));
  await Promise.all(loads);

  /* the world */
  const low = innerWidth < 800;
  QUALITY.pen = false;                                     // the figures are flat planes of colour, with no line round them
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.08, 620);
  const lights = new Lights();
  let combat;
  const street = buildStreet(scene, lights, (S) => { combat = buildCombat(scene, lights, S); });
  const props = buildProps(scene, lights, tex, street);
  const sewers = buildSewers(scene, lights);
  const raid = buildRaid(scene, street.sky);
  const body = buildBody(scene);
  const israel = buildIsrael(scene, street.sky);
  buildZzw(scene, lights);
  buildPreparing(scene);
  const climbers = buildClimbers(scene);
  const troops = buildTroops(scene, props.deported.material.uniforms.uGone);

  /* people you may ask: each stands in the walk, and a name stands by them */
  Object.assign(KINDS, { wOld: ['stand', 'manBare'], wFighter: ['stand', 'fighter'], wFighterW: ['look', 'fighterW'], wOfficer: ['point', 'officer'], wJester: ['raise', 'manBare'] });
  const whoTags = $('#who-tags');
  for (const w of WITNESSES) {
    w.u0 = at(w.chapter, w.from); w.u1 = at(w.chapter, w.to); w.on = false;
    if (Array.isArray(w.at)) {
      const [x, y, z] = w.at;
      const list = [{ kind: w.kind, x, y, z, ry: w.ry }];
      for (const c of w.with || []) list.push({ kind: c.kind, x: x + c.dx, y, z: z + c.dz, ry: w.ry + (c.dx - c.dz) * 0.4 });
      crowd(scene, list, washMaterial({ dress: w.dress }));
    }
    w.el = document.createElement('button');
    w.el.type = 'button'; w.el.className = 'who-tag' + (w.voice ? ' who-tag--voice' : '');
    w.el.setAttribute('aria-label', `${ASK.tag}: ${w.name}`);
    w.el.innerHTML = `<i aria-hidden="true">?</i><span>${w.name}</span>`;
    w.el.addEventListener('click', () => ask(w));
    whoTags.appendChild(w.el);
  }
  const who = { k: $('#who-k'), name: $('#who-name'), life: $('#who-life'), face: $('#who-face'), asks: $('#who-asks'), said: $('#who-said'), src: $('#who-src'), open: null, away: 0 };
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  const hearBtn = $('#who-hear');
  let voice = null;
  const findVoice = () => { voice = synth ? synth.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(HE ? 'he' : 'en')) || null : null; hearBtn.hidden = !voice; };
  if (synth) { findVoice(); synth.addEventListener?.('voiceschanged', findVoice); }
  const hush = () => { if (synth) synth.cancel(); who.saying = false; hearBtn.setAttribute('aria-pressed', 'false'); hearBtn.querySelector('span').textContent = ASK.hear; };
  function say(from, only) {
    if (!synth || !voice || !who.open) return;
    synth.cancel();
    const w = who.open, list = only ? [from] : w.asks.map((_, k) => k).slice(from);
    who.saying = true;
    hearBtn.setAttribute('aria-pressed', 'true'); hearBtn.querySelector('span').textContent = ASK.stop;
    list.forEach((k, n) => {
      const u8 = new SpeechSynthesisUtterance(w.asks[k][1]);
      u8.voice = voice; u8.lang = voice.lang; u8.rate = 0.92; u8.pitch = 0.95;
      u8.onstart = () => { if (who.open === w) answer(k, true); };
      if (n === list.length - 1) u8.onend = () => { if (who.open === w) hush(); };
      synth.speak(u8);
    });
  }
  hearBtn.querySelector('span').textContent = ASK.hear;
  hearBtn.addEventListener('click', () => { if (who.saying) hush(); else say(0, false); });
  function answer(i, spoken) {
    const a = who.open.asks[i];
    if (!spoken && who.saying) say(i, true);
    [...who.asks.children].forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    who.said.textContent = a[1];
    who.said.className = 'who__said ' + (a[2] ? 'is-quote' : 'is-told');
    /* say plainly which it is: their words, or the record's */
    who.src.innerHTML = (a[2] ? (a[3] === false ? a[2] : `<b>${ASK.own}</b> ${a[2]}`) : `<b>${ASK.record}</b> ${ASK.recordSrc}`) + (who.saying ? ` ${ASK.read}` : '');
  }
  function ask(w) {
    hush();
    if (shotOpen()) closeShot();
    who.open = w; who.away = 0;
    who.k.textContent = w.role; who.name.textContent = w.name; who.life.textContent = w.life;
    who.face.hidden = !w.face;
    if (w.face) { who.face.src = `${IMG}${w.id}.jpg`; who.face.alt = w.name; }
    who.asks.innerHTML = '';
    w.asks.forEach((a, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'who__ask'; b.textContent = a[0];
      b.addEventListener('click', () => answer(i));
      who.asks.appendChild(b);
    });
    answer(0);
    root.classList.add('is-asking');
  }
  function closeWho() { hush(); who.open = null; root.classList.remove('is-asking'); }
  $('#who-close').addEventListener('click', closeWho);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && who.open) closeWho(); });
  /* there is no cover in the scene any more: the opening is the film on the page. This stands in its place. */
  const book = { group: new THREE.Group(), burn: { value: 0 }, update() {} };
  const post = buildPost(renderer, scene, camera, { focus: !low });
  const shadow = buildShadow(renderer, scene);
  if (query.get('ao') === '0') post.shade.enabled = false;            // for comparing, while building
  book.group.userData.noShadow = true;

  /* the end of the walk: the monument, on the mound. It is the artist's painting of it, raised into a relief. */
  const monument = buildMonument(scene, tex.monument, { z: PLAN.mound.z + 0.25, foot: 1.6, height: 11.6 });
  const END_TIP = monument.top;                            // how high the flame reaches
  const sound = new Sound();
  let bornAt = performance.now() / 1000;                   // when the cover was first shown: the star is drawn from then

  /* the map of where they fought: a scene of its own, filmed by its own camera */
  const atlas = buildMap();
  const mini = buildMini(atlas);
  const miniRect = { x: 0, y: 0, w: 0, h: 0 }, miniHere = $('#mini-here');
  function placeMini() {
    const r = $('#mini-map').getBoundingClientRect();
    Object.assign(miniRect, { x: r.left, y: r.top, w: r.width, h: r.height });
    if (r.width < 8) return;
    const used = [];
    CHAPTERS.forEach((c) => {
      if (!c.stop) return;
      /* the chapters that are not a place in the ghetto stand at the corners: the map, and 1948 */
      const at2 = mini.place(c.id, r.width / r.height) || (c.id === 'map' ? [0.14, 0.2] : c.id === 'israel' ? [0.9, 0.84] : null);
      c.stop.classList.toggle('is-off', !at2);
      if (!at2) return;
      while (used.some((q) => Math.hypot(q[0] - at2[0], q[1] - at2[1]) < 0.045)) at2[0] += 0.05;
      used.push(at2);
      c.stop.style.left = `${(at2[0] * 100).toFixed(2)}%`; c.stop.style.top = `${(at2[1] * 100).toFixed(2)}%`;
    });
  }
  const mapLabels = $('#map-labels');
  for (const [id, pin] of Object.entries(atlas.pins)) {
    const el = document.createElement('p');
    el.className = `map-label map-label--${pin.place.org}`;
    el.innerHTML = `<i aria-hidden="true"></i><span>${(HE && PLACES_HE[id]) || pin.place.label}</span>`;
    mapLabels.appendChild(el);
    pin.el = el;
  }

  /* stairwells: holes in the ground */
  const b1 = PLAN.bunker1, b2 = PLAN.bunker2;
  world.uHoles.value[0].set(b1.x0, b1.stairBot, b1.x1, b1.stairTop);
  world.uHoles.value[1].set(b1.x0, b1.exitTop, b1.x1, b1.tunnelEnd);
  world.uHoles.value[2].set(b2.x0, b2.stairBot, b2.x1, b2.stairTop);
  world.uHoles.value[3].set(b2.x0, b2.exitTop, b2.x1, b2.roomEnd);

  /* ── fires ── */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const R = (() => { let s = 77; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const P = PLAN;

  const patches = combat.mila.fires;
  const fBattle = new FireSet(scene, lights, patches, { group: 'battle', light: 2.4 });
  for (let i = 0; i < patches.length; i++) fBattle.setLevel(i, 0);

  const sqItems = [];
  for (let i = 0; i < 7; i++) sqItems.push({ pos: V(P.square.half + 1 + R() * 5, 13 + R() * 6, P.square.z1 - 5 - i * 7.6), w: 5 + R() * 4, h: 6 + R() * 5 });
  for (const s of [-1, 1]) sqItems.push({ pos: V(s * 30, 16, P.square.z0 - 4), w: 7, h: 8 }, { pos: V(s * 22, 0, P.square.z0 + 6), w: 2.4, h: 3 });
  sqItems.push(...combat.square.fires);
  const fSquare = new FireSet(scene, lights, sqItems, { group: 'square', light: 1.6, lightEvery: 2 });

  const burnItems = [];
  for (let z = P.burn.z0 - 4; z > P.ruinZ + 6; z -= 6.5) {
    for (const s of [-1, 1]) {
      if (R() < 0.5) burnItems.push({ pos: V(s * (9.5 + R() * 3), 11 + R() * 8, z + R() * 4), w: 4 + R() * 4, h: 5 + R() * 6 });
      if (R() < 0.5) burnItems.push({ pos: V(s * (4.8 + R() * 2.6), 0, z + R() * 5), w: 1.3 + R() * 1.8, h: 1.4 + R() * 2.4 });
    }
  }
  const fBurn = new FireSet(scene, lights, burnItems, { group: 'burn', light: 1.35, lightEvery: 2 });

  const farItems = [];
  for (let i = 0; i < 18; i++) farItems.push({ pos: V((R() < 0.5 ? -1 : 1) * (95 + R() * 90), 2 + R() * 10, P.battle.z1 - R() * 330), w: 12 + R() * 14, h: 10 + R() * 14 });
  const fFar = new FireSet(scene, lights, farItems, {});
  const fBrush = new FireSet(scene, lights, combat.brush.fires, { group: 'brushFire', light: 1.4 });
  /* real fire behind the painted fire of the monument */
  const mz = PLAN.mound.z;
  const fEnd = new FireSet(scene, lights, [
    { pos: V(-2.0, 2.0, mz - 0.5), w: 2.6, h: 4.4 }, { pos: V(2.1, 2.0, mz - 0.6), w: 2.4, h: 3.8 }, { pos: V(0.2, 2.2, mz - 1.0), w: 3.4, h: 6.0 },
  ], { group: 'endFire', light: 1.8 });
  fEnd.amount = 0;
  const fJet = new FireSet(scene, lights, troops.jet, { group: 'burn', light: 1.3 });      // the flame thrower, in the burning streets

  const sy = P.synagogue;
  const synItems = [];
  for (let i = 0; i < 8; i++) synItems.push({ pos: V(sy.x - 14 + R() * 30, 1 + R() * 12, sy.z - 14 + R() * 28), w: 6 + R() * 6, h: 7 + R() * 9 });
  const fSyn = new FireSet(scene, lights, synItems, { group: 'syn', light: 1.4, lightEvery: 3 });

  const fCandle = new FireSet(scene, lights, props.ruins.flames.map((p) => ({ pos: p, w: 0.16, h: 0.34 })), { group: 'candle', light: 1.6, lightEvery: 3, calm: 1 });
  fCandle.amount = 1;
  for (let i = 0; i < 28; i++) fCandle.setLevel(i, 0);

  /* ── smoke ── */
  const sBattle = new SmokeSet(scene, patches.slice(0, 6).map((p) => ({ pos: p.pos.clone().setY(1.5), size: 2.6, rise: 16, n: 6 })), { glow: 0.5, seed: 1, speed: 0.07 });
  const sSquare = new SmokeSet(scene, sqItems.filter((_, i) => i % 2 === 0).map((p) => ({ pos: p.pos.clone().add(V(0, 4, 0)), size: 7, rise: 42, n: 6 })), { glow: 0.6, seed: 2, speed: 0.045 });
  const sBurn = new SmokeSet(scene, [
    ...burnItems.filter((p) => p.pos.y > 1 && R() < 0.6).map((p) => ({ pos: p.pos.clone().add(V(0, 5, 0)), size: 7.5, rise: 46, n: 4 })),
    ...burnItems.filter((p) => p.pos.y < 1).map((p) => ({ pos: p.pos.clone().setY(1.2), size: 2.4, rise: 9, n: 3 })),
  ], { glow: 0.9, seed: 3, speed: 0.05 });
  const sFar = new SmokeSet(scene, farItems.filter((_, i) => i % 2 === 0).map((p) => ({ pos: p.pos.clone().add(V(0, 8, 0)), size: 24, rise: 120, n: 5 })), { glow: 0.25, seed: 4, speed: 0.016, drift: [0.35, -0.12], opacity: 0.6 });
  const gasSpots = [];
  for (let i = 0; i < 9; i++) gasSpots.push({ pos: V(-12 + R() * 10, b2.floor + 0.3, b2.roomEnd + 2 + R() * 22), size: 2.3, rise: 2.4, n: 5 });
  const sGas = new SmokeSet(scene, gasSpots, { color: [0.2, 0.2, 0.17], seed: 5, speed: 0.07, drift: [0.4, 0.2], opacity: 0.55 });
  const dustSpots = [];
  for (let i = 0; i < 11; i++) dustSpots.push({ pos: V(sy.x - 16 + R() * 36, 2 + R() * 6, sy.z - 20 + R() * 40), size: 13, rise: 34, n: 5 });
  const sDust = new SmokeSet(scene, dustSpots, { color: [0.2, 0.185, 0.165], glow: 0.25, seed: 6, speed: 0.06, drift: [0.5, 0.1], opacity: 0.8 });

  /* ── things in the air ── */
  const embers = new Motes(scene, { count: low ? 700 : 1600, kind: 0, box: [40, 20, 40] });
  const ash = new Motes(scene, { count: low ? 900 : 2200, kind: 1, box: [46, 22, 46] });
  const feathers = new Motes(scene, { count: low ? 300 : 650, kind: 2, box: [40, 14, 40] });

  /* ── the fight ── */
  const throwers = combat.mila.throwers;
  const roofGuns = combat.square.fighters.marks.filter((f) => f.props && (f.props.mg || f.props.rifle || f.props.pistol));
  const molotovs = new Molotovs(scene, lights, {
    bottleGeo: props.bunkers.bottleGeo,
    from: throwers,
    targets: patches.map((p) => p.pos),
    fires: fBattle,
    onBreak: () => sound.shatter(),
  });

  /* ── a blast, as the walker feels it ──
     The flash, the blow through the ground, the ring of bent air, the dust that follows, the ears.
     It runs in its own time, whether the walk goes on or the world is held. */
  const ring = new ShockRing(scene);
  const blast = { t: -100, power: 0, at: new THREE.Vector3() };
  function boomAt(pos, power, reach) {
    blast.t = performance.now() / 1000; blast.power = power; blast.at.copy(pos);
    body.blast(power, !held);
    ring.fire(pos, reach, power);
    sound.blast(power);
  }
  /* the synagogue: charges at the foot of its walls */
  const synBalls = [[-10, -6], [9, 4], [-2, 12]].map(([dx, dz], i) => new Fireball(scene, { pos: V(P.synagogue.x + 22 + dx * 0.4, 5.5, P.synagogue.z + dz * 1.6), r: 8.5, seed: 4 + i }));
  for (const fb of synBalls) { fb.mesh.userData.free = true; fb.amount = 0; }

  /* ── only draw what is near ──
     The street is a kilometre long and the fog hides all but a stretch of it.
     Anything that sits wholly behind you, or far beyond the fog, is skipped. */
  const zoned = [];
  const bb = new THREE.Box3();
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh || o.isPoints || o.userData.free) return;
    if (o.geometry.attributes.aPos || o.material.depthTest === false) return;   // fire, smoke and sky place themselves
    let parent = o.parent, inBook = false;
    while (parent) { if (parent === book.group) inBook = true; parent = parent.parent; }
    if (inBook) return;
    if (o.isInstancedMesh) { o.computeBoundingBox(); bb.copy(o.boundingBox).applyMatrix4(o.matrixWorld); }
    else { o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); }
    if (bb.max.z - bb.min.z > 500) return;                                       // the street itself
    zoned.push({ o, near: bb.max.z, far: bb.min.z });
  });

  /* ── size ── */
  let dpr = Math.min(devicePixelRatio || 1, low ? 1.5 : 2);
  let scrollMax = 1;
  /* where on the screen the logo of the cover may stand, clear of the words of the page:
     beside the card where there is room, above it where there is not. In parts of the screen. */
  const coverFrame = { x0: 0.5, x1: 0.91, y0: 0.09, y1: 0.965, side: true };
  function frameCover() {
    const w = innerWidth, h = innerHeight;
    const card = $('.cover').getBoundingClientRect(), head = $('.top').getBoundingClientRect();
    const gap = Math.max(16, w * 0.028);
    const top = (head.bottom + 6) / h;
    const tall = h * 0.965 - head.bottom - 6;
    const room = w * 0.91 - (card.right + gap);
    /* the logo is about two thirds as wide as it is tall */
    if (room > tall * 0.673 * 0.72) Object.assign(coverFrame, { x0: (card.right + gap) / w, x1: 0.91, y0: top, y1: 0.965, side: true });
    else Object.assign(coverFrame, { x0: 0.05, x1: 0.95, y0: top, y1: (card.top - gap) / h, side: false });
  }
  function resize() {
    const w = innerWidth, h = innerHeight;
    frameCover();
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    post.size(w, h, dpr);
    camera.aspect = w / h;
    embers.uniforms.uScale.value = ash.uniforms.uScale.value = feathers.uniforms.uScale.value = h * dpr * 0.9;
    scrollMax = Math.max(1, document.documentElement.scrollHeight - h);
    placeMini();
  }
  $('#track').style.height = `${Math.round(total * 92)}vh`;
  addEventListener('resize', resize);
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(frameCover);

  /* ── moving ── */
  const posAt = spline(CAM.pos), lookAt = spline(CAM.look);
  const cp = [0, 0, 0], cl = [0, 0, 0];
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), prevPos = new THREE.Vector3();
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  });

  /* ── the record ──
     A photograph waits at the head of a chapter. The walk does not go past it until you step
     into it; then it grows to fill the screen and burns away from where you touched it, and
     the reconstruction is there behind it. */
  const rec = {
    el: $('#record'), title: $('#record-title'), meta: $('#record-meta'), text: $('#record-text'), src: $('#record-src'),
    go: $('#record-go'), hint: $('#record-hint'),
    i: -1, phase: 'none', t: 0, nudged: 0,
    origin: new THREE.Vector2(0.5, 0.5),
    from: new THREE.Vector4(0, 0, 1, 1), full: new THREE.Vector4(0, 0, 1, 1),
    done: PLATES.map(() => false),
    resume: null,
  };

  /* drag to look round. It stays where you leave it until you walk on. */
  const drag = { on: false, x: 0, y: 0, yaw: 0, pitch: 0, sy: 0, sp: 0 };
  addEventListener('pointerdown', (e) => {
    if (rec.phase !== 'none') return;
    if (e.target.closest && e.target.closest('a, button, dialog, .mini, .record, .who, .shot')) return;
    drag.on = true; drag.x = e.clientX; drag.y = e.clientY;
    root.classList.add('is-dragging');
  });
  addEventListener('pointermove', (e) => {
    if (!drag.on) return;
    drag.yaw = clamp(drag.yaw + (e.clientX - drag.x) * 0.0042, -3.0, 3.0);
    if (e.pointerType === 'mouse') drag.pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.003, -1.2, 0.7);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const drop = () => { drag.on = false; root.classList.remove('is-dragging'); };
  addEventListener('pointerup', drop);
  addEventListener('pointercancel', drop);

  let worldTime = 0, held = false, pulse = 0, lastMark = 0, filmClock = 0;
  let p = clamp(scrollY / scrollMax);
  let u = toUnits(p);
  let walked = 0, bob = 0, shake = 0, boomed = false, mineBoomed = false, lidOff = false, uPrev = u;
  let fadeOver = 0, fadeGoal = 0;
  /* the eye has weight: where the ground drops away under it, it falls, and it lands */
  const eyeAt = { x: 0, y: 0, z: 0, vy: 0, py: 0, air: 0, ok: false };
  const LADDERS = { wall: PLAN.ladder, shaft: { x: 0, z0: SEWER.shaftZ - 0.42, lean: 0, c0: SEWER.top + 0.1, top: -0.2 } };
  let bodyShow = 0, heading = null, bodyOK = true, shotOpen = () => false;
  let auto = false, glide = null, autoY = 0;

  const startAt = parseFloat(query.get('u'));
  if (!Number.isNaN(startAt)) { scrollTo(0, toProgress(startAt) * scrollMax); p = toProgress(startAt); }
  uPrev = toUnits(p);

  /* jump somewhere far: go dark, move, come back */
  function hop(to) {
    const head = PLATES.find((pk) => pk.at >= Math.floor(to) - 0.001 && pk.at < Math.floor(to) + 0.1);
    if (head && to > head.at) to = head.at;
    if (rec.i >= 0) closeRecord(false);
    PLATES.forEach((pk, i) => { rec.done[i] = pk.at < to - 0.01; });
    scrollTo(0, toProgress(to) * scrollMax);
    p = toProgress(to);
  }
  function jump(to) {
    fadeGoal = 1;
    setTimeout(() => { hop(to); fadeGoal = 0; }, 420);
  }
  /* glide: scroll at a steady pace to a place, unless the visitor takes over */
  function glideTo(to, seconds) {
    const from = scrollY, dest = toProgress(to) * scrollMax, t0 = performance.now();
    glide = { from, dest, t0, ms: seconds * 1000 };
  }
  const takeOver = () => { glide = null; if (auto) setAuto(false); };
  addEventListener('wheel', takeOver, { passive: true });
  addEventListener('touchstart', takeOver, { passive: true });
  /* W and S walk, A and D step to the side, the arrows (or Q and E) turn the head */
  const KEYS = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr', KeyQ: 'tl', KeyE: 'tr', ShiftLeft: 'fast', ShiftRight: 'fast' };
  const keys = { f: 0, b: 0, l: 0, r: 0, tl: 0, tr: 0, fast: 0, v: 0, y: 0, turn: 0, used: false };
  /* off the line of the walk: how far to his right the walker has stepped, and how far the place lets him */
  const roam = { x: 0, v: 0, rx: 1, rz: 0 };
  function sides(x, y, z) {
    if (bodyShow < 0.5) return [x, x];
    if (x > 40) return z > ZZW.room ? [67.4, 73.8] : z > ZZW.tunnel ? [70.25, 70.95] : [68.5, 72.7];
    if (y < -4.5) return [-0.3, 0.3];                                           // the sewer
    if (y < -1) {                                                               // a cellar: the room, or the way into it
      const one = z > -500, b = one ? PLAN.bunker1 : PLAN.bunker2;
      return z < b.stairBot && z > b.roomEnd ? (one ? [-11.2, -3.1] : [-12.2, -2.3]) : [-7.25, -5.75];
    }
    if (y < 1.55 || y > 2.4 || (z < -55.5 && z > -62.5)) return [x, x];          // on a stair, on the bridge, at the ladder
    if (z < PLAN.yard.z1 && z > PLAN.yard.z0) return [-6.8, 21];                 // the yard is open to the wagons
    if (z < PLAN.square.z1 && z > PLAN.square.z0) return [-34, 34];              // and the square is a square
    if (z < -1100) return [x - 5, x + 5];
    if (z < PLAN.ruinZ) return [-28, 28];                                        // nothing stands any more
    return [-6.8, 6.8];
  }
  const ka = [0, 0, 0], kb = [0, 0, 0];
  const letGo = () => { keys.f = keys.b = keys.l = keys.r = keys.tl = keys.tr = keys.fast = 0; };
  addEventListener('keydown', (e) => {
    if (root.classList.contains('field-open')) return;
    if (rec.phase === 'show' && (e.key === 'Enter' || e.key === ' ') && !e.target.closest('a, button, dialog')) { e.preventDefault(); stepIn(); return; }
    const k = KEYS[e.code];
    if (k && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest('dialog, input, textarea')) {
      if (k !== 'fast') { e.preventDefault(); if (k === 'f' || k === 'b') takeOver(); if (!keys.used) { keys.used = true; root.classList.add('has-walked'); } }
      keys[k] = 1;
      return;
    }
    if (['PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) takeOver();
    if (e.code === 'KeyM') setSound(sound.muted || !sound.ready);
  });
  addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (k) keys[k] = 0; });
  addEventListener('blur', letGo);
  document.addEventListener('visibilitychange', letGo);
  document.addEventListener('days28-guide-open', () => { takeOver(); letGo(); drop(); });

  /* ── controls ── */
  const walkBtn = $('#walk'), soundBtn = $('#sound');
  function setAuto(on) {
    auto = on;
    autoY = scrollY;
    walkBtn.setAttribute('aria-pressed', String(on));
    walkBtn.querySelector('span').textContent = on ? UI.walking : UI.walk;
  }
  async function setSound(on) {
    if (on) { await sound.start(); sound.mute(false); } else sound.mute(true);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.querySelector('span').textContent = on ? UI.soundOn : UI.soundOff;
  }
  walkBtn.querySelector('span').textContent = UI.walk;
  soundBtn.querySelector('span').textContent = UI.soundOff;
  $('#lang').addEventListener('click', () => setLang(UI.otherLang, u));
  walkBtn.addEventListener('click', () => { glide = null; setAuto(!auto); });
  soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));
  $('#enter-sound').addEventListener('click', () => { setSound(true); glideTo(at('wall', 0.13), 10); });
  $('#enter-quiet').addEventListener('click', () => { glideTo(at('wall', 0.13), 10); });
  document.addEventListener('click', (e) => {
    if (rec.phase === 'show') {
      if (e.target.closest('#record-go')) { stepIn(); return; }
      if (!e.target.closest('a, button, dialog, .record, .mini, .top')) { stepIn(e.clientX, e.clientY); return; }
    }
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); takeOver(); jump(parseFloat(go.dataset.go) + (go.dataset.go === '0' ? 0 : 0.05)); }
    if (e.target.closest('[data-sources]')) $('#sources').showModal();
    if (e.target.closest('[data-close]')) $('#sources').close();
  });

  /* ── one frame ── */
  const clock = new THREE.Clock();
  const col = new THREE.Color();
  const quat = new THREE.Quaternion(), eul = new THREE.Euler(0, 0, 0, 'YXZ');
  const tmp = new THREE.Vector3();
  const ui = { beat: new Set(), chapter: -1, day: -1, caption: '', cover: null, end: null, top: null, mode: '', bars: '', map: null };
  const hud = buildHUD();
  let focusD = 10;

  /* ── two fights on the first day ──
     The ŻOB fought at Zamenhofa and Miła, the ŻZW on Muranowski Square. The walk stops before them and
     asks whom to follow. After the one, it offers the other, or the way on. Walking for you, it shows
     both, in the order of the day. */
  const fight = { seen: { zob: false, zzw: false }, open: null, done: {}, map: false, fly: null, zoom: 1 };
  const GATES = [{ id: 'first', at: at('map', 0.9) }, { id: 'zob', at: at('april', 0.985) }, { id: 'zzw', at: at('flags', 0.985) }];
  const choiceEl = $('#choice'), choiceNote = $('#choice-note');
  const ways = [...choiceEl.querySelectorAll('.choice__way')].map((el) => ({ el, way: el.dataset.way, pin: atlas.pins[el.dataset.way === 'zob' ? 'crossing' : 'square'] }));
  function openChoice(g) {
    fight.open = g; fight.fly = null; fight.zoom = 1;
    const second = g.id !== 'first';
    choiceNote.textContent = second ? UI.choiceOther : UI.choiceNote;
    for (const w of ways) { w.el.classList.toggle('is-seen', fight.seen[w.way]); w.el.disabled = fight.seen[w.way]; }
    drag.yaw = drag.pitch = 0;
    const show = () => { fight.map = true; root.classList.add('is-choice'); ways.find((w) => !w.el.disabled)?.el.focus({ preventScroll: true }); };
    /* from the street, the map is brought up through the dark */
    if (second) { fadeGoal = 1; setTimeout(() => { atlas.snap(true); show(); fadeGoal = 0; }, 400); } else show();
  }
  /* the visitor has touched a place: the camera goes down to it, and the walk is there */
  function choose(way) {
    const g = fight.open;
    if (!g || fight.fly || fight.seen[way]) return;
    root.classList.remove('is-choice');
    fight.fly = way === 'zob' ? 'crossing' : 'square';
    /* where the chosen way is the next thing in the street, the walk simply goes on */
    const to = way === 'zob' ? (g.id !== 'first' ? at('april', 0) : null) : (g.id !== 'zob' ? at('flags', 0) : null);
    setTimeout(() => {
      fadeGoal = 1;
      setTimeout(() => {
        fight.open = null; fight.fly = null; fight.done[g.id] = true;
        drag.yaw = drag.pitch = 0;
        if (g.id !== 'first' || to !== null) fight.map = false;
        if (to !== null) hop(to);
        fadeGoal = 0;
      }, 420);
    }, reduce ? 0 : 1500);
  }
  choiceEl.addEventListener('click', (e) => { const w = e.target.closest('[data-way]'); if (w) choose(w.dataset.way); });
  addEventListener('wheel', (e) => { if (fight.open) fight.zoom = clamp(fight.zoom * Math.exp(e.deltaY * 0.0012), 0.5, 1.45); }, { passive: true });

  /* ── a photograph in the street, opened beside the picture ── */
  const shot = { img: $('#shot-img'), title: $('#shot-title'), meta: $('#shot-meta'), text: $('#shot-text'), src: $('#shot-src'), open: null, near: null };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const shotMeshes = props.plates.filter((pl) => tex[pl.id] && pl.mesh).map((pl) => { pl.mesh.userData.plate = pl; return pl.mesh; });
  function plateAt(x, y) {
    if (rec.i >= 0 || fight.open || fight.map || !bodyOK) return null;
    ndc.set((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2);
    ray.setFromCamera(ndc, camera);
    ray.far = 46;
    const hit = ray.intersectObjects(shotMeshes, false)[0];
    return hit ? hit.object.userData.plate : null;
  }
  function openShot(pl) {
    const info = SHOTS[pl.id];
    if (who.open) closeWho();
    shot.open = pl;
    shot.img.src = `${IMG}${pl.id}.jpg`; shot.img.alt = PHOTO_NOTES[pl.id] || '';
    shot.title.textContent = PHOTO_NOTES[pl.id] || '';
    shot.meta.textContent = info ? info[0] : '';
    shot.text.innerHTML = (info ? info[1] : [(HE && CAPTIONS_HE[pl.id]) || pl.caption]).map((t) => `<p>${t}</p>`).join('');
    shot.src.innerHTML = photoSource(pl.id);
    $('#shot').scrollTop = 0;
    root.classList.add('is-shot');
  }
  function closeShot() { shot.open = null; root.classList.remove('is-shot'); }
  shotOpen = () => !!shot.open;
  $('#shot-close').addEventListener('click', closeShot);
  $('#caption').addEventListener('click', () => { if (shot.near) openShot(shot.near); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && shot.open) closeShot(); });
  /* a touch that was not a drag */
  const tap = { x: 0, y: 0, t: 0 };
  addEventListener('pointerdown', (e) => { tap.x = e.clientX; tap.y = e.clientY; tap.t = performance.now(); });
  addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 6 || performance.now() - tap.t > 600) return;
    if (e.target.closest && e.target.closest('a, button, dialog, .mini, .record, .who, .shot, .choice')) return;
    const pl = plateAt(e.clientX, e.clientY);
    if (pl) openShot(pl); else if (shot.open) closeShot();
  });
  let hoverT = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || drag.on || performance.now() - hoverT < 90) return;
    hoverT = performance.now();
    root.classList.toggle('can-shot', !!plateAt(e.clientX, e.clientY));
  });

  /* ── the record: opened, read, stepped into ── */
  function photoSource(id) {
    const c = CREDITS[id];
    if (!c) return '';
    const by = /Konrad|Propaganda/i.test(c.author) ? UI.perpetrators
      : (c.author && !/unknown|nieznany/i.test(c.author) ? UI.by(`<bdi>${c.author}</bdi>`) : UI.unknown);
    return `${by} <bdi>${c.license}</bdi>. <a href="${c.page}" target="_blank" rel="noopener">${UI.commons}</a>`;
  }
  /* where the photograph sits while it is read: in the room the panel leaves, whole */
  function layoutRecord() {
    const pk = PLATES[rec.i];
    const img = tex[pk.id].image;
    const a = img.width / img.height;
    const W = innerWidth, H = innerHeight, small = W <= 760;
    const box = rec.el.getBoundingClientRect();
    const head = small ? 64 : 76;
    let L, R, T, B;
    if (small) { L = 14; R = W - 14; T = head; B = Math.max(T + 120, box.top - 14); }
    else { L = Math.max(24, W * 0.035); R = box.left - Math.max(28, W * 0.03); T = head; B = H - Math.max(36, H * 0.06); }
    let w = R - L, h = B - T;
    if (w / h > a) w = h * a; else h = w / a;
    const x0 = L + (R - L - w) / 2, y0 = T + (B - T - h) / 2;
    rec.from.set(x0 / W, 1 - (y0 + h) / H, (x0 + w) / W, 1 - y0 / H);
    /* and, once stepped into, the whole screen */
    const s = W / H;
    if (s > a) { const hh = s / a; rec.full.set(0, 0.5 - hh / 2, 1, 0.5 + hh / 2); }
    else { const ww = a / s; rec.full.set(0.5 - ww / 2, 0, 0.5 + ww / 2, 1); }
  }
  function openRecord(i) {
    const pk = PLATES[i];
    rec.i = i; rec.phase = 'show'; rec.t = performance.now(); rec.nudged = 0;
    rec.title.textContent = pk.title;
    rec.meta.textContent = pk.meta;
    rec.text.innerHTML = (pk.first ? `<p class="record__first">${UI.first}</p>` : '')
      + pk.text.map((t) => `<p>${t}</p>`).join('');
    rec.src.innerHTML = photoSource(pk.id);
    rec.hint.textContent = pk.first ? UI.hintFirst : UI.hint;
    rec.el.classList.toggle('is-auto', auto);
    rec.el.classList.remove('is-nudge');
    post.u.tPlate.value = tex[pk.id];
    post.u.uPlateSeed.value = i * 3.7 + 1.3;
    post.u.uPlate.value = 0;
    root.classList.add('is-record');
    layoutRecord();
    rec.el.scrollTop = 0;
    sound.type(26, 0.07);
  }
  function stepIn(x, y) {
    if (rec.phase !== 'show') return;
    rec.phase = 'step'; rec.t = performance.now();
    if (x === undefined) rec.origin.set((rec.from.x + rec.from.z) / 2, (rec.from.y + rec.from.w) / 2);
    else rec.origin.set(x / innerWidth, 1 - y / innerHeight);
    root.classList.remove('is-record');
    sound.ignite();
  }
  function closeRecord(done) {
    if (rec.i < 0) return;
    rec.done[rec.i] = done;
    rec.i = -1; rec.phase = 'none';
    root.classList.remove('is-record');
    if (done && rec.resume !== null) { glide = { from: scrollY, dest: rec.resume, t0: performance.now(), ms: 3000 }; }
    rec.resume = null;
  }
  function nudge() {
    if (performance.now() - rec.nudged < 1400) return;
    rec.nudged = performance.now();
    rec.el.classList.add('is-nudge');
    rec.hint.textContent = UI.nudge;
    setTimeout(() => rec.el.classList.remove('is-nudge'), 900);
  }
  addEventListener('resize', () => { if (rec.i >= 0) layoutRecord(); });

  /* ── where and when, typed in ── */
  const slate = { el: $('#slate'), wait: null, last: null, timer: 0, hide: 0 };
  function typeSlate(id) {
    slate.wait = null; slate.last = id;
    const text = SLATES[id];
    clearInterval(slate.timer); clearTimeout(slate.hide);
    slate.el.classList.remove('is-done');
    slate.el.textContent = '';
    slate.el.classList.add('is-on');
    let n = 0;
    slate.timer = setInterval(() => {
      n += 1;
      slate.el.textContent = text.slice(0, n);
      if (n >= text.length) {
        clearInterval(slate.timer);
        slate.el.classList.add('is-done');
        slate.hide = setTimeout(() => slate.el.classList.remove('is-on'), 3600);
      }
    }, reduce ? 1 : 34);
  }
  const modeEl = $('#mode'), modeT = $('#mode-text'), keysEl = $('#keys');
  const frames = { n: 0, ms: 0 };
  const dayEl = $('#day'), dayN = $('#day-n'), dayD = $('#day-d'), capEl = $('#caption'), capT = $('#caption-text');
  const still = query.has('still');
  const stillAt = parseFloat(query.get('t')) || 12.3;          // the second of the world's clock a still is taken at
  /* for looking closely while building: ?fov=12&yaw=20&pitch=5 (degrees) */
  const rad = (k) => (parseFloat(query.get(k)) || 0) * Math.PI / 180;
  const dbg = { on: query.has('yaw') || query.has('pitch'), yaw: rad('yaw'), pitch: rad('pitch'), fov: parseFloat(query.get('fov')) || 0, at: query.has('at') ? query.get('at').split(',').map(Number) : null, from: query.has('from') ? query.get('from').split(',').map(Number) : null };   // &at=x,y,z looks there; &from=x,y,z stands there

  function frame() {
    requestAnimationFrame(frame);
    const elapsed = clock.getDelta();
    // Hold the world while reading or writing in the guide.
    if (root.classList.contains('field-open')) return;
    const dt = Math.min(elapsed, 0.1);

    /* how far along */
    if (glide) {
      const k = clamp((performance.now() - glide.t0) / glide.ms);
      const e = k * k * (3 - 2 * k);
      scrollTo(0, lerp(glide.from, glide.dest, e));
      if (k >= 1) glide = null;
    } else if (auto) {
      /* kept as a fraction: at a high frame rate one frame moves less than a pixel */
      autoY = Math.min(scrollMax, autoY + (scrollMax / 300) * dt);
      scrollTo(0, autoY);
      if (autoY >= scrollMax - 1) setAuto(false);
    }
    {
      /* the walker goes the way he is looking: part of it along the walk, part of it to the side */
      const fwd = keys.f - keys.b, str = keys.r - keys.l, turned = bodyShow > 0.5 ? drag.sy : 0;
      const along = fwd * Math.cos(turned) + str * Math.sin(turned), aside = -fwd * Math.sin(turned) + str * Math.cos(turned);
      const free = bodyShow > 0.5 && !auto && !glide && rec.i < 0 && !fight.open;
      roam.v += ((free ? aside * (keys.fast ? 5.5 : 2.7) : 0) - roam.v) * (1 - Math.exp(-dt * 7));
      roam.x += roam.v * dt;
      if (auto || glide || bodyShow < 0.5) roam.x *= Math.exp(-dt * 1.6);
      let want = 0;
      if (Math.abs(along) > 0.08) {
        const ci = Math.min(Math.floor(u), LAST - 1), e = 0.006;
        posAt(Math.max(ci, u - e), ka); posAt(Math.min(ci + 1 - 0.0006, u + e), kb);
        const span = Math.min(ci + 1 - 0.0006, u + e) - Math.max(ci, u - e);
        const metres = Math.hypot(kb[0] - ka[0], kb[1] - ka[1], kb[2] - ka[2]) / Math.max(span, 1e-4);   // of street to one chapter
        /* where the walk stands still (the map, a held fight) the page still turns */
        const pace = clamp((keys.fast ? 7.5 : 3.3) / Math.max(metres, 1), 1 / 26, 1 / 7);
        want = along * pace * CHAPTERS[ci].len / total * scrollMax;
      }
      const was = Math.abs(keys.v) > 2;
      keys.v += (want - keys.v) * (1 - Math.exp(-dt * (want ? 2.6 : 4.2)));
      if (Math.abs(keys.v) > 2 && !glide && !auto && !$('#sources').open) {
        /* kept as a fraction: one frame may move less than a pixel */
        if (!was || Math.abs(keys.y - scrollY) > 4) keys.y = scrollY;
        keys.y = clamp(keys.y + keys.v * dt, 0, scrollMax);
        scrollTo(0, keys.y);
      } else if (!want) keys.v = 0;
      /* and turning the head */
      keys.turn += ((keys.tl - keys.tr) * 1.25 - keys.turn) * (1 - Math.exp(-dt * 5));
      if (Math.abs(keys.turn) > 0.002) drag.yaw = clamp(drag.yaw + keys.turn * dt, -3.0, 3.0);
    }
    let target = clamp(scrollY / scrollMax);
    if (rec.i >= 0) {
      const gate = toProgress(PLATES[rec.i].at);
      if (target > gate + 0.0002) {
        if (glide) { rec.resume = glide.dest; glide = null; }
        if (auto) autoY = Math.min(autoY, gate * scrollMax);
        keys.y = Math.min(keys.y, gate * scrollMax); keys.v = Math.min(keys.v, 0);
        if (scrollY > gate * scrollMax + 2) scrollTo(0, gate * scrollMax);
        target = gate;
        if (rec.phase === 'show' && performance.now() - rec.t > 900) nudge();
      }
    }
    if (fight.open) {
      const gate = toProgress(fight.open.at);
      if (target > gate + 0.0002) {
        glide = null;
        if (scrollY > gate * scrollMax + 2) scrollTo(0, gate * scrollMax);
        keys.y = Math.min(keys.y, gate * scrollMax); keys.v = Math.min(keys.v, 0);
        target = gate;
      }
    }
    p += (target - p) * (1 - Math.exp(-dt * (reduce ? 14 : 3.6)));
    if (Math.abs(target - p) < 1e-6) p = target;
    u = toUnits(p);
    const ch = Math.min(Math.floor(u), LAST - 1), lt = u - ch;

    /* the next photograph: open it as the walk reaches it. It is not shown before its own chapter
       has begun, and a walk that rushes past it in one frame is still stopped by it. */
    if (rec.i < 0) {
      for (let i = 0; i < PLATES.length; i++) {
        const pk = PLATES[i];
        const from = Math.max(pk.at - 0.07, Math.floor(pk.at + 1e-6));
        if (rec.done[i]) { if (u < pk.at - 0.25) rec.done[i] = false; continue; }
        /* reached by walking: inside its window now, or carried past it in one step that was still a walk and not a jump */
        const inside = u >= from && u <= pk.at + 0.03, crossed = uPrev < pk.at && u >= pk.at && u - uPrev < 0.4;
        if (inside || crossed) { openRecord(i); break; }
        if (u > pk.at + 0.03) rec.done[i] = true;
      }
    } else if (rec.phase === 'show' && u < Math.max(PLATES[rec.i].at - 0.12, Math.floor(PLATES[rec.i].at + 1e-6) - 0.02)) closeRecord(false);
    /* the two fights: stop and ask, where the way divides */
    if (!auto && rec.i < 0 && !fight.open && fadeGoal === 0) {
      for (const g of GATES) {
        if (fight.done[g.id]) { if (u < g.at - 0.3) fight.done[g.id] = false; continue; }
        if (!(uPrev < g.at && u >= g.at && u - uPrev < 0.4)) continue;
        const other = g.id === 'zob' ? 'zzw' : 'zob';
        if (g.id === 'first' ? !fight.seen.zob && !fight.seen.zzw : !fight.seen[other]) openChoice(g);
        else { fight.done[g.id] = true; if (g.id === 'zob') jump(at('brush', 0)); }       // both seen: on to the next day
        break;
      }
    }
    /* he looks at the band on his sleeve; and later, at what has taken its place */
    if (!drag.on && u - uPrev > 0 && u - uPrev < 0.2) {
      if (uPrev < at('wall', 0.1) && u >= at('wall', 0.1)) body.glance(0);
      if (uPrev < at('two', 0.5) && u >= at('two', 0.5)) body.glance(1);
    }
    if (u > at('april', 0.5) && u < at('flags', 0)) fight.seen.zob = true;
    if (u > at('flags', 0.5) && u < at('brush', 0)) fight.seen.zzw = true;
    uPrev = u;

    const m = moodAt(u);
    const T = (name) => track(TRACKS[name], u);

    /* time. In the two fights it stops, and you go on walking. */
    const frz = T('freeze');
    worldTime += dt * (1 - frz);
    const time = still ? stillAt : worldTime;
    if (frz > 0.5 !== held) {
      held = frz > 0.5;
      pulse = held ? 0.5 : 0.22;
      sound.shutter(held);
      root.classList.toggle('is-held', held);
    }
    pulse *= Math.exp(-dt * 5);

    /* the hour */
    world.uTime.value = time;
    WALK_CLOCK.value = time;
    world.uPx.value = 2 * Math.tan(camera.fov * Math.PI / 360) / innerHeight;
    world.uDpr.value = dpr;
    world.uSunDir.value.set(...m.sunDir).normalize();
    world.uSunCol.value.setRGB(...m.sun);
    world.uSkyCol.value.setRGB(...m.sky);
    world.uGndCol.value.setRGB(...m.gnd);
    world.uFogCol.value.setRGB(m.fog[0] * 1.04, m.fog[1] * 0.99, m.fog[2] * 0.9);       // the haze is warm, as old paper is
    world.uFogDen.value = m.den * 0.8;
    world.uLit.value = m.lit;
    world.uWet.value = m.wet;
    street.sky.uSkyTop.value.setRGB(...m.skyTop);
    street.sky.uGlow.value = m.glow;
    street.sky.uCloud.value = m.cloud;
    street.lampMat.uniforms.uEmis.value.set(1.7, 1.05, 0.45).multiplyScalar(m.lamps);

    /* a blast, in its own time */
    const bAge = performance.now() / 1000 - blast.t;
    const bOn = bAge < 7 && blast.power > 0;
    const bPow = bOn ? blast.power * (reduce ? 0.25 : 1) : 0;
    const bShake = bPow * 0.05 * Math.exp(-bAge * 1.7) * (0.4 + 0.6 * Math.min(1, bAge * 14));
    const bFlash = bPow * Math.exp(-bAge * 6.0) * 0.9;
    ring.update(bOn ? bAge : 99);
    /* the dust it raises reaches the walker a moment later, and takes its time to settle */
    world.uFogDen.value = m.den * 0.8 + bPow * 0.016 * sstep(0.2, 1.1, bAge) * Math.exp(-Math.max(0, bAge - 1.1) * 0.6);

    /* the camera */
    posAt(u, cp); lookAt(u, cl);
    body.tick(dt, reduce);
    {
      const cut = !eyeAt.ok || Math.hypot(cp[0] - eyeAt.x, cp[2] - eyeAt.z) > 4;
      const pv = cut ? 0 : (cp[1] - eyeAt.py) / Math.max(dt, 1e-3);
      if (cut || reduce || cp[1] >= eyeAt.y - 1e-4) { eyeAt.y = cp[1]; eyeAt.vy = clamp(pv, -2.5, 0); eyeAt.air = 0; } else {
        eyeAt.vy -= 9.8 * dt; eyeAt.y += eyeAt.vy * dt; eyeAt.air += dt;
        if (eyeAt.y <= cp[1]) {
          if (eyeAt.air > 0.22 && eyeAt.vy < -3.2 && bodyShow > 0.5) { body.land(-eyeAt.vy); sound.thud(clamp(-eyeAt.vy / 7)); shake += 0.004 * -eyeAt.vy; }
          eyeAt.y = cp[1]; eyeAt.vy = clamp(pv, -2.5, 0); eyeAt.air = 0;
        }
      }
      eyeAt.x = cp[0]; eyeAt.z = cp[2]; eyeAt.py = cp[1]; eyeAt.ok = true;
      /* the way he is walking */
      const e = 0.004, a0 = Math.max(ch, u - e), a1 = Math.min(ch + 1 - 0.0006, u + e);
      posAt(a0, ka); posAt(a1, kb);
      const hx = kb[0] - ka[0], hz = kb[2] - ka[2], hl = Math.hypot(hx, hz);
      heading = hl > 0.004 && hl < 5 ? Math.atan2(-hx, -hz) : null;
    }
    camPos.set(cp[0], eyeAt.y - (bodyShow > 0.01 ? body.dip : 0), cp[2]);
    camLook.set(cl[0], cl[1], cl[2]);
    {
      if (heading !== null) { roam.rx = Math.cos(heading); roam.rz = -Math.sin(heading); }
      const lim = sides(cp[0], cp[1], cp[2]);
      if (Math.abs(roam.rx) > 0.3) {
        const wx = clamp(cp[0] + roam.rx * roam.x, Math.min(lim[0], cp[0]), Math.max(lim[1], cp[0]));
        const nx = (wx - cp[0]) / roam.rx;
        if (nx !== roam.x) { roam.x = nx; roam.v = 0; }
      } else roam.x *= Math.exp(-dt * 3);
      // Check the destination as well as the path centre: diagonal steps can reach
      // a narrow street while the centre is still in an open square or courtyard.
      if (Math.abs(roam.x) > .001) {
        const allowed = t => {
          const x = cp[0] + roam.rx * roam.x * t, z = cp[2] + roam.rz * roam.x * t;
          const bounds = sides(cp[0], cp[1], z);
          return x >= Math.min(bounds[0], cp[0]) && x <= Math.max(bounds[1], cp[0]);
        };
        let safe = 0;
        for (let i = 1; i <= 16; i++) { if (!allowed(i / 16)) break; safe = i / 16; }
        if (safe < 1) { roam.x *= safe; roam.v = 0; }
      }
      camPos.x += roam.rx * roam.x; camPos.z += roam.rz * roam.x;
      camLook.x += roam.rx * roam.x; camLook.z += roam.rz * roam.x;
      world.uWalker.value.set(camPos.x, bodyShow > 0.5 ? camPos.y - body.EYE : -999, camPos.z);
    }
    /* a photograph on a wall draws the eye as you pass it */
    const lookZ = camLook.z - camPos.z;
    for (const pl of props.plates) {
      const dz = pl.pos.z - camPos.z;                    // negative: still ahead
      const r = pl.range || 13;
      if (dz < -r * 1.5 || dz > r * 0.5) continue;
      if (Math.abs(pl.pos.y - camPos.y) > 6.5 || Math.abs(pl.pos.x - camPos.x) > 26) continue;   // not one in another cellar
      if (lookZ > 2 && dz < 0) continue;                 // looking back the way we came
      const w = sstep(-r * 1.5, -r * 0.6, dz) * (1 - sstep(-r * 0.12, r * 0.4, dz));
      camLook.lerp(tmp.copy(pl.pos).setY(pl.pos.y - 0.8), w * (pl.range ? 0.35 : 0.62));
    }
    /* at the end, frame the logo for this screen: the tip of its flame a little under the head of the page */
    if (u > at('after', 0.75) && u < at('israel', 0)) {
      const halfV = Math.atan(Math.tan(m.fov * Math.PI / 360) * Math.pow(Math.max(1, 1.3 / camera.aspect), 0.55));
      const pitch = Math.atan2(END_TIP - camPos.y, camPos.z - monument.group.position.z) - Math.atan(0.78 * Math.tan(halfV));
      camLook.y = lerp(camLook.y, camPos.y + (camPos.z - camLook.z) * Math.tan(pitch), sstep(at('after', 0.75), at('after', 1), u));
    }
    const underCity = u >= at('sewers', 0) && u < at('raid', 0);
    bodyShow = (u >= at('map', 0) && u < at('april', 0)) ? 0 : T('hero');

    const moved = camPos.distanceTo(prevPos);
    if (moved < 4 && u > at('wall', 0.02)) {
      walked += moved;
      bob += moved;
      if (walked > 0.78) {
        walked = 0;
        /* in the sewer: water. Up the shaft: iron rungs. */
        if (lt > 0.001) { if (underCity && camPos.y > -5.2) sound.rung(); else sound.step(m.aMuffle > 0.5, underCity); }
      }
      if (!drag.on && !keys.tl && !keys.tr && !keys.f && !keys.b && !keys.l && !keys.r && moved > 0.004) { const k = Math.exp(-dt * 0.9); drag.yaw *= k; drag.pitch *= k; }
    }
    prevPos.copy(camPos);
    if (!reduce && u > at('wall', 0)) {
      camPos.y += Math.sin(bob * 4.1) * 0.022;
      camPos.x += Math.sin(bob * 2.05) * 0.012;
    }
    if (dbg.from) camPos.set(...dbg.from);
    if (dbg.at) camLook.set(...dbg.at);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
    const look = reduce ? 0.3 : 1;
    const calmCover = sstep(0.1, 0.9, u);
    eul.set(-pointer.sy * 0.11 * look * calmCover, -pointer.sx * 0.24 * look * calmCover, 0);
    if (!reduce) {
      const sh = (shake + m.aBattle * 0.0016 + m.haze * 0.0006) * (1 - frz) + bShake;
      eul.x += (Math.sin(time * 31.7) + Math.sin(time * 17.3)) * sh;
      eul.y += (Math.sin(time * 27.1) + Math.sin(time * 13.9)) * sh;
      eul.z = Math.sin(bob * 2.05) * 0.0035 + Math.sin(time * 23.3) * sh * 0.6;
    }
    const follow = 1 - Math.exp(-dt * 11);
    drag.sy += (drag.yaw - drag.sy) * follow; drag.sp += (drag.pitch - drag.sp) * follow;
    eul.y += drag.sy; eul.x += drag.sp;
    if (bodyShow > 0.01) { eul.y += body.lookYaw * bodyShow; eul.x = Math.max(eul.x + body.lookPitch * bodyShow, -1.35); }
    if (dbg.on) { eul.x += dbg.pitch; eul.y += dbg.yaw; }
    camera.quaternion.multiply(quat.setFromEuler(eul));
    shake *= Math.exp(-dt * 1.6);
    /* on a tall screen, open the lens so the cover and the street still fit */
    const tall = Math.max(1, 1.3 / camera.aspect);
    const widen = lerp(tall, Math.pow(tall, 0.55), sstep(0.3, 1.0, u));
    camera.fov = dbg.fov || 2 * Math.atan(Math.tan((m.fov + body.widen) * Math.PI / 360) * widen) * 180 / Math.PI;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    {
      /* the one you walk as: his hands and his feet, where the eye is */
      const inShaft = underCity && u > at('sewers', 0.8);
      const onWall = u > at('wall', 0.7) && u < at('wall', 0.905) && camPos.z > PLAN.wallZ - 0.1;
      const ladder = inShaft ? LADDERS.shaft : onWall ? LADDERS.wall : null;
      const ladderK = inShaft ? sstep(-5.4, -5.12, camPos.y) : onWall ? sstep(1.74, 2.02, camPos.y) : 0;
      const zf = camPos.z, b1z = PLAN.bunker1, b2z = PLAN.bunker2;
      const floor = underCity ? SEWER.floor : (zf < b1z.stairBot && zf > b1z.exitTop && cp[1] < -1) ? b1z.floor : (zf < b2z.stairBot && zf > b2z.exitTop && cp[1] < -1) ? b2z.floor : -1e9;
      tmp.set(camPos.x, eyeAt.y - body.dip, camPos.z);
      body.update({
        camera, eye: tmp, ground: Math.max(cp[1] - body.EYE, floor), heading,
        show: bodyShow, armed: T('rebel'), aim: frz * sstep(0.3, 0.8, bodyShow), moved: moved < 4 ? moved : 0, bob,
        falling: clamp(eyeAt.air / 0.12) * clamp((eyeAt.y - cp[1]) / 0.3), ladder, ladderK,
        wade: underCity ? 1 - ladderK : 0, time: performance.now() / 1000,
      }, dt);
    }

    /* the cover */
    const onCover = u < at('wall', 0.2);
    book.group.visible = onCover;
    if (onCover) {
      book.burn.value = T('bookBurn');
      book.update(still ? time : performance.now() / 1000 - bornAt, pointer.sx, pointer.sy, sstep(0.05, 0.45, u), camera, coverFrame, dt);
    }

    /* lights and fires */
    lights.set('book', onCover ? m.book * (1 + book.burn.value) : 0);
    lights.set('lamp', m.lamps);
    lights.set('bunker1', m.b1);
    const lampB2 = m.b2 * T('b2');
    lights.set('bunker2', lampB2);
    lights.set('battle', m.fBattle);
    lights.set('square', m.fSquare);
    lights.set('burn', m.fBurn);
    const synF = T('synFire');
    const synNear = u > at('raid', -0.1);
    lights.set('syn', synF * (synNear ? 1 : 0));
    lights.set('candle', 1);
    props.bunkers.lamp1.material.uniforms.uEmis.value.set(2.4, 1.3, 0.45).multiplyScalar(m.b1);
    props.bunkers.lamp2.material.uniforms.uEmis.value.set(2.4, 1.3, 0.45).multiplyScalar(lampB2 * (0.85 + 0.15 * Math.sin(time * 21)));
    /* under the city: the lamp ahead, and at the end of it the day */
    const lampK = underCity ? T('lamp') : 0, dayK = underCity ? T('daylight') : 0;
    sewers.group.visible = underCity;
    sewers.fighters.show(underCity);
    if (underCity) sewers.update(camPos.z, lampK, dayK, time);
    lights.set('sewer', lampK);
    lights.set('daylight', dayK);
    if (dayK > 0.02 && !lidOff) { lidOff = true; sound.scrape(); }
    if (u < at('sewers', 0.8)) lidOff = false;
    fBattle.amount = m.fBattle;
    fBrush.amount = m.fBrush;
    lights.set('brushFire', m.fBrush);
    fBattle.setLevel(0, T('car'));
    fSquare.amount = m.fSquare;
    fBurn.amount = m.fBurn;
    fJet.amount = m.fBurn;
    fFar.amount = m.fFar;
    fSyn.amount = synNear ? synF : 0;
    sBattle.amount = m.sBattle; sSquare.amount = m.sSquare; sBurn.amount = m.sBurn; sFar.amount = m.sFar;
    sGas.amount = T('gas');
    sDust.amount = T('dust');
    embers.amount = m.embers; ash.amount = m.ash; feathers.amount = m.feathers;
    const candles = T('candles');
    for (let i = 0; i < 28; i++) if (Math.abs(fCandle.level[i] - clamp(candles - i)) > 0.01) fCandle.setLevel(i, clamp(candles - i));

    /* the fights run until time stops, and pick up again when it lets go */
    const live = 1 - frz;
    const atMila = u > at('april', -0.05) && u < at('flags', 0.04), atSquare = u > at('flags', 0.04) && u < at('brush', 0);
    const atHeld = atMila ? combat.mila : atSquare ? combat.square : (u > at('brush', 0) && u < at('burning', 0)) ? combat.brush : null;
    molotovs.update(dt * live, atMila ? m.fBattle * live : 0);
    if (live > 0.5 && Math.random() < dt * 2.2) {
      const from = atMila ? throwers : (atSquare ? roofGuns : null);
      if (from && from.length) {
        const f = from[Math.floor(Math.random() * from.length)];
        const at = f.muzzle ? tmp.copy(f.muzzle) : tmp.set(f.x, (f.y || 0) + 1.5, f.z);
        lights.flash(at, col.setRGB(1, 0.85, 0.6).clone(), 5, 0.07);
      }
    }
    combat.mila.frozen.set(atMila ? frz : 0);
    combat.square.frozen.set(atSquare ? frz : 0);
    const atBrush = u > at('brush', 0) && u < at('burning', 0);
    const mine = T('mine');
    combat.brush.frozen.set(atBrush ? Math.max(frz, 0) * mine : 0);
    combat.brush.ball.amount = atBrush ? mine * (0.25 + 0.75 * frz) : 0;
    combat.brush.column.show(u > at('brush', -0.05) && u < at('burning', 0.05));
    /* the men the mine throws, and the fighters it shows, are there from the instant it goes */
    combat.brush.soldiers.show(atBrush && mine > 0.5 && frz > 0.02);
    combat.brush.fighters.show(atBrush && mine > 0.5);
    if (atBrush && mine > 0.5 && !mineBoomed) { mineBoomed = true; boomAt(tmp.set(...PLAN.brush.blast), 1, 46); }
    if (u < at('brush', 0.3)) mineBoomed = false;
    /* in the stillness a sound belongs to a place: walk up to a shot and you hear it */
    if (frz > 0.7 && !still && atHeld) {
      const marks = atHeld.frozen.marks;
      const nowS = performance.now() / 1000;
      for (const mk of marks) {
        const d = mk.pos.distanceTo(camPos);
        if (!mk.near && d < 6.5) {
          mk.near = true;
          if (nowS - lastMark > 0.3) {
            lastMark = nowS;
            tmp.copy(mk.pos).sub(camPos).applyQuaternion(quat.copy(camera.quaternion).invert());
            sound.heldSound(mk.kind, clamp(tmp.x / 4, -1, 1), clamp(1 - d / 8));
          }
        } else if (mk.near && d > 10) mk.near = false;
      }
    }

    /* people leaving, a building falling */
    props.deported.material.uniforms.uGone.value = T('gone');
    props.bunkers.waiting.material.uniforms.uGone.value = T('waiting');
    props.synagogue.mat.uniforms.uCollapse.value = T('collapse');
    const showLogo = T('endLogo');
    monument.show(u < at('israel', 0) ? showLogo : 0);
    monument.glow = T('endFire');
    fEnd.amount = 0;
    lights.set('endFire', u < at('israel', 0) ? T('endFire') : 0);
    /* it turns a little as the eye moves, and so shows that it has depth */
    if (showLogo > 0.001 && !reduce) monument.group.rotation.y = Math.sin(time * 0.2) * 0.04 + pointer.sx * 0.09;
    const flash = T('flash');
    if (flash > 0.5 && !boomed) { boomed = true; boomAt(tmp.set(P.synagogue.x + 20, 6, P.synagogue.z), 1.25, 130); }
    /* the charges, a moment of fire before the dust has it */
    const sAge = performance.now() / 1000 - blast.t;
    for (const fb of synBalls) fb.amount = boomed && u < at('lastday', 0.6) && sAge < 5 ? clamp(sAge * 9) * Math.exp(-sAge * 0.75) : 0;
    if (u < at('lastday', 0.25)) boomed = false;

    props.tram.position.x = ((time * 3.0 + 40) % 190) - 95;
    /* the boys coming over the wall with their sacks: each landing is heard */
    for (const th of climbers.update(time, u > at('wall', 0.12) && u < at('inside', 0.55))) {
      if (!still) sound.thud(0.55 * clamp(1 - Math.abs(th.z - camPos.z) / 34));
    }
    /* 1948: the hill above the sea, and the flag going up */
    const in48 = u > at('israel', 0) - 0.002;
    israel.show(in48);
    if (in48) israel.raise(T('flagUp'));
    /* the yard: the dogs, as long as there is anyone left for them to bark at */
    const inYard = u > at('bridge', 0.8) && u < at('two', 0.25);
    props.guards.group.visible = inYard;
    if (inYard) {
      for (const b of props.guards.update(time, !still && T('gone') < 0.6)) {
        const d = b.at.distanceTo(camPos);
        if (d > 70) continue;
        tmp.copy(b.at).sub(camPos).applyQuaternion(quat.copy(camera.quaternion).invert());
        sound.bark(clamp(tmp.x / 8, -1, 1), clamp((d - 5) / 45), b.loud);
      }
    }

    const shut = u < 0.235;                                  // the cover is whole: nothing behind it shows
    for (const zn of zoned) zn.o.visible = !zn.o.userData.hidden && !shut && zn.far < camPos.z + 70 && zn.near > camPos.z - 430;

    /* the map: while it is up, the film shows that scene instead of the street */
    const inMap = u >= at('map', 0) && u < at('april', 0);
    if (inMap && !fight.open && !fight.fly) fight.map = false;
    const mapShown = inMap || fight.map;
    bodyOK = !mapShown;
    let mapView = null;
    if (mapShown) {
      if (!inMap) {
        /* the map, away from its chapter: under its own lamp */
        world.uSunDir.value.set(-0.35, 0.82, 0.42).normalize();
        world.uSunCol.value.setRGB(0.62, 0.5, 0.36);
        world.uSkyCol.value.setRGB(0.07, 0.062, 0.055);
      }
      mapView = atlas.update(inMap ? u - at('map', 0) : 0.93, time, camera.aspect, { yaw: drag.sy, pitch: drag.sp, choose: !!fight.open && !fight.fly, to: fight.fly, seen: fight.seen, zoom: fight.zoom }, dt);
      post.view(atlas.scene, atlas.camera);
      /* the two places that can be chosen: each card stands by its own */
      if (fight.open) for (const w of ways) {
        tmp.copy(w.pin.top).project(atlas.camera);
        w.el.style.translate = `${((tmp.x + 1) / 2 * innerWidth).toFixed(1)}px ${((1 - tmp.y) / 2 * innerHeight).toFixed(1)}px`;
      }
      const W = innerWidth, H = innerHeight;
      for (const pin of Object.values(atlas.pins)) {
        tmp.copy(pin.top).project(atlas.camera);
        const on = inMap && pin.place.area === mapView.name && tmp.z < 1;
        pin.el.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px, ${((1 - tmp.y) / 2 * H).toFixed(1)}px)`;
        pin.el.classList.toggle('is-on', on && rec.i < 0);
      }
    } else post.view(scene, camera);
    if (inMap !== ui.map) { mapLabels.classList.toggle('is-on', inMap); ui.map = inMap; }
    if (mapShown !== ui.mapShown) { root.classList.toggle('is-map', mapShown); ui.mapShown = mapShown; }

    /* the names of those who can be asked, where they stand on the screen */
    for (const w of WITNESSES) {
      let on = false;
      if (u >= w.u0 && u <= w.u1 && rec.i < 0 && !fight.open && !inMap) {
        const guide = w.at === 'guide';
        if (guide) tmp.set(0.02, SEWER.floor + 1.92, camPos.z - 12.6); else tmp.set(w.at[0], w.at[1] + 1.98, w.at[2]);
        const near = guide ? tmp.z > SEWER.shaftZ + 1 : tmp.distanceTo(camPos) < 26;
        tmp.project(camera);
        if (near && tmp.z < 1 && Math.abs(tmp.x) < 0.94 && tmp.y > -0.7 && tmp.y < 0.82) {
          on = true;
          w.el.style.transform = `translate(${((tmp.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - tmp.y) / 2 * innerHeight).toFixed(1)}px)`;
        }
      }
      if (on !== w.on) { w.el.classList.toggle('is-on', on); w.on = on; }
    }
    /* walk away from someone, and the talk is over */
    if (who.open) { who.away = who.open.on ? 0 : who.away + dt; if (who.away > 2.5) closeWho(); }

    /* the night of the bombers. A flare coming down is the only sun there is: it lights the ruins, and their shadows turn */
    const overhead = u > at('raid', 0) - 0.001 && u < at('lastday', 0.08) ? T('bombers') : 0;
    for (const e of raid.update(time, overhead, camera, dt)) {
      if (still) break;
      const hear = e.kind === 'flak' ? () => sound.flak(e.pan, e.far) : e.kind === 'gun' ? () => sound.flakGun(e.pan) : () => sound.bomb(e.pan);
      setTimeout(hear, e.delay * 1000);
    }
    const fl = raid.flare;
    if (fl.amount > 0.01) {
      world.uSunDir.value.copy(fl.dir);
      world.uSunCol.value.setRGB(m.sun[0] + fl.col[0] * fl.amount * 0.4, m.sun[1] + fl.col[1] * fl.amount * 0.4, m.sun[2] + fl.col[2] * fl.amount * 0.4);
    }

    /* the sun, when there is one, throws shadows */
    const sunLum = (world.uSunCol.value.r + world.uSunCol.value.g + world.uSunCol.value.b) / 3;
    camera.getWorldDirection(tmp);
    if (!mapShown) shadow.update(camPos, tmp, world.uSunDir.value, clamp((sunLum - 0.04) / 0.14));

    lights.update(camera.position, time, dt);

    /* the print */
    fadeOver += (fadeGoal - fadeOver) * (1 - Math.exp(-dt * 9));
    const U = post.u;
    U.uTime.value = time;                 /* held: the grain stops too, and it is a photograph */
    U.uExposure.value = m.exposure;
    U.uGrain.value = m.grain;
    U.uVignette.value = m.vignette;
    U.uHaze.value = reduce ? 0 : m.haze;
    U.uWash.value = m.wash;
    U.uSepia.value = lerp(m.sepia, 0.97, frz);
    U.uSoft.value = m.soft;
    /* film that is running wanders a hair in the gate and breathes; a held frame does neither */
    filmClock += dt;
    if (filmClock > 1 / 12) {
      filmClock = 0;
      const k = reduce ? 0 : live;
      U.uWeave.value.set((Math.random() - 0.5) * 0.0012 * k, (Math.random() - 0.5) * 0.0016 * k);
      U.uFlicker.value = 1 + (Math.random() - 0.5) * 0.045 * k;
    }
    U.uFlash.value = Math.max(flash, pulse, T('white'), bFlash);
    /* the sun: seen in the sky, and throwing its shafts past whatever stands before it */
    street.sky.uSunShow.value = m.sunShow;
    tmp.copy(camPos).addScaledVector(world.uSunDir.value, 400).project(camera);
    U.uRays.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5, tmp.z < 1 && !reduce ? m.rays * (1 - sstep(1.0, 1.6, Math.max(Math.abs(tmp.x), Math.abs(tmp.y)))) : 0);
    if (bOn) {
      tmp.copy(blast.at).project(camera);
      U.uShock.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5, bAge * 0.95, tmp.z < 1 ? bPow * 0.04 * Math.exp(-bAge * 2.0) : 0);
      U.uChroma.value = bPow * Math.exp(-bAge * 2.6);
    } else { U.uShock.value.w = 0; U.uChroma.value = 0; }
    U.uFade.value = Math.max(T('fade'), fadeOver);

    /* the record, framed over the reconstruction, then burnt away */
    let recent = null;
    for (let i = 0; i < PLATES.length; i++) if (rec.done[i] && rec.i !== i && u >= PLATES[i].at && u < PLATES[i].at + 0.3) recent = PLATES[i];
    if (rec.i >= 0) {
      const k = (performance.now() - rec.t) / 1000;
      if (rec.phase === 'show') {
        const f = sstep(0, reduce ? 0.3 : 1.3, k);
        U.uPlateFade.value = f; U.uPlateDim.value = f; U.uPlate.value = 0; U.uPlateLine.value = 1;
        U.uPlateRect.value.copy(rec.from);
        if (auto && k > 9.4) stepIn();
      } else {
        const grow = reduce ? 1 : sstep(0, 1.0, k);
        U.uPlateRect.value.lerpVectors(rec.from, rec.full, grow);
        const b = reduce ? clamp(k / 0.8) : clamp((k - 0.55) / 2.6);
        U.uPlate.value = b;
        U.uPlateFade.value = 1;
        U.uPlateDim.value = 1 - sstep(0.15, 0.85, b);
        U.uPlateLine.value = 1 - grow;
        if (b >= 1) closeRecord(true);
      }
    } else { U.uPlateFade.value = 0; U.uPlate.value = 0; U.uPlateDim.value = 0; }
    U.uScratch.value = reduce ? 0 : 0.6 * live;
    /* the lens: focused where the walker is looking */
    const want = mapView ? mapView.camera.position.distanceTo(mapView.target) : (m.focus || camPos.distanceTo(camLook));
    focusD += (clamp(want, 1.2, 140) - focusD) * (1 - Math.exp(-dt * 3));
    post.dof.uniforms.uFocus.value = focusD;
    post.dof.uniforms.uAperture.value = reduce ? 0 : m.aperture;
    const lens = mapView ? mapView.camera : camera;
    post.shade.lens(lens);
    post.dof.uniforms.uNear.value = lens.near;
    post.dof.uniforms.uFar.value = lens.far;
    U.uStreak.value = 0.22 - 0.2 * m.book;
    U.uHalo.value = 0.2 - 0.06 * m.book;
    post.bloom.strength = m.bloom;
    post.motionFrame(lens, dt, reduce || mapView || rec.phase === 'show' || U.uFade.value > .02);
    post.composer.render(dt);
    /* the small map, laid over the finished picture */
    mini.render(renderer, miniRect, CHAPTERS[ch].id, lt, time, dt, !low && ui.top && rec.i < 0 && !mapShown && !shot.open && !ui.end);

    sound.set({ wind: m.aWind, fire: m.aFire, battle: m.aBattle, drone: m.aDrone, music: m.aMusic, muffle: m.aMuffle, crowd: m.aCrowd, sing: m.aSing, held: frz, drip: m.aDrip, planes: m.aPlanes * T('bombers'), hope: m.aHope });

    /* ── words ── */
    for (const b of BEATS) {
      const on = ch === b.ci && lt >= b.at[1] && lt <= b.at[2];
      if (on !== ui.beat.has(b.index)) {
        b.el.classList.toggle('is-on', on);
        if (on) { ui.beat.add(b.index); if (!still) sound.type(b.words); } else ui.beat.delete(b.index);
      }
    }
    if (ch !== ui.chapter) {
      hud.update(ch);
      if (ui.chapter > 0) CHAPTERS[ui.chapter].stop.classList.remove('is-here');
      if (ui.chapter >= 0 && ch > ui.chapter && ch > 1) sound.hit();          // a new place: the film marks the cut
      if (ch > 0) CHAPTERS[ch].stop.classList.add('is-here');
      ui.chapter = ch;
      root.dataset.chapter = CHAPTERS[ch].id;
      if (SLATES[CHAPTERS[ch].id] && CHAPTERS[ch].id !== slate.last) slate.wait = CHAPTERS[ch].id;
      miniHere.innerHTML = ch > 0 ? `${CHAPTERS[ch].label}${CHAPTERS[ch].year ? `<i>${CHAPTERS[ch].year}</i>` : ''}` : '';
    }
    root.style.setProperty('--walk', p.toFixed(4));
    const cover = u < at('cover', 0.16), top = u > at('cover', 0.5), end = u > at('israel', 0.905);
    if (cover !== ui.cover) {
      root.classList.toggle('at-cover', cover);
      ui.cover = cover;
      syncCoverFilm();
    }
    if (top !== ui.top) { root.classList.toggle('in-street', top); ui.top = top; }
    if (end !== ui.end) { root.classList.toggle('at-end', end); ui.end = end; }
    const bars = (top && rec.i < 0 && !reduce ? m.bars : 0).toFixed(2);
    if (bars !== ui.bars) { root.style.setProperty('--bars', bars); ui.bars = bars; }
    if (slate.wait && rec.i < 0 && !held) typeSlate(slate.wait);
    const hint = top && rec.i < 0 && !keys.used && !auto && u > 1.04 && u < 2;
    if (hint !== ui.keys) { keysEl.classList.toggle('is-on', hint); ui.keys = hint; }

    const showDay = u >= DAY_RANGE[0] && u < DAY_RANGE[1];
    const day = showDay ? Math.round(T('day')) : 0;
    if (day !== ui.day) {
      dayEl.classList.toggle('is-on', day > 0);
      if (day > 0) { dayN.textContent = String(day).padStart(2, '0'); dayD.textContent = dayDate(day); dayEl.style.setProperty('--day', (day / 28).toFixed(3)); }
      ui.day = day;
    }

    /* say which it is: the record, or what was built from it */
    const mode = rec.i >= 0 ? '' : (recent ? 'built' : '');
    if (mode !== ui.mode) {
      modeEl.classList.toggle('is-on', !!mode);
      if (mode) { modeEl.dataset.mode = mode; modeT.textContent = mode === 'record' ? UI.modeRecord : UI.modeBuilt; }
      ui.mode = mode;
    }

    let caption = '', near = null;
    if (rec.i < 0 && !mapShown) for (const pl of props.plates) {
      const r = pl.range ? pl.range * 0.6 : 10;
      if (Math.abs(pl.pos.z - camPos.z + (pl.range ? 0 : -3)) < r && Math.abs(pl.pos.y - camPos.y) < 6.5 && Math.abs(pl.pos.x - camPos.x) < 26) { caption = (HE && CAPTIONS_HE[pl.id]) || pl.caption; near = pl; }
    }
    shot.near = near && tex[near.id] ? near : null;
    /* walk on from a photograph, and it closes */
    if (shot.open && Math.abs(shot.open.pos.z - camPos.z) > (shot.open.range || 12) + 6) closeShot();
    if (caption !== ui.caption) {
      capEl.classList.toggle('is-on', !!caption);
      if (caption) capT.textContent = caption;
      ui.caption = caption;
    }

    /* a slow machine gets a smaller picture, not a slower walk */
    frames.n++; frames.ms += dt * 1000;
    if (frames.n === 90) {
      const avg = frames.ms / 90;
      if (avg > 27 && dpr > 0.8 && !still) { dpr = dpr > 1.55 ? 1.5 : (dpr > 1.05 ? 1 : 0.75); resize(); }
      frames.n = 0; frames.ms = 0;
    }
  }

  window.__days28 = { jump: (to) => { scrollTo(0, toProgress(to) * scrollMax); p = toProgress(to); }, get u() { return u; }, renderer, scene, camera, props, combat, toProgress, sound, world, shadow, atlas, post };

  frame();
  requestAnimationFrame(() => {
    root.classList.add('is-ready');
    bornAt = performance.now() / 1000;
    setTimeout(() => $('#veil')?.remove(), 1600);
  });
}

boot().catch((e) => {
  console.error(e);
  root.classList.add('no-gl');
  document.querySelectorAll('.beat').forEach((b) => b.classList.add('is-on'));
  $('#veil')?.remove();
});
