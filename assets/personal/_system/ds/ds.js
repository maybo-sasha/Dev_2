/* ============================================================
   Design system: the machinery.

   One HTML page (design-system.html), many pages inside it. The
   address after the # says which one:
     #/                              home
     #/foundations                   the foundations
     #/foundations/color             one of them
     #/components                    the index
     #/components/slider             a component (its Overview tab)
     #/components/slider/specs       another of its tabs

   The pages are laid out the way Material's documentation is: a
   hero, article tabs, a column of content with
   "On this page" beside it, big cards. What they add is that
   nothing on them is a picture:
     · the hero      the right-hand panel holds the real component,
                     on a field of shapes that morph and follow you
     · the lesson    a scripted demonstration plays on a second live
                     copy, with a pointer and a caption per step
     · the x-ray     the anatomy is measured off that live element
                     and drawn over it, so it follows when it moves
     · the tokens    every value shown is read from the running CSS

   The words and per-component wiring are in ./content.js.
   ============================================================ */

import { COMPONENTS, FOUNDATIONS, GROUPS, RULES, TOKENS, POINTS, GROUP_ART, THUMBS } from './content.js';
import { createButton } from '../../button/button.js';
import { createChip } from '../../chip/chip.js';
import { createSlider } from '../../slider/slider.js';
import { createSwitch, createCheckbox } from '../../selection/selection.js';
import { createProgressRing } from '../../progress/progress.js';
import iconSprite from './icons.svg?raw';
import { pageExamples } from './examples.js';

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
document.body.insertAdjacentHTML('afterbegin', iconSprite.replace('<svg ', '<svg style="display:none!important" aria-hidden="true" '));
const icon = (name, className = '') => `<svg class="form-icon ${className}" viewBox="0 0 24 24" aria-hidden="true"><use href="#${name}"></use></svg>`;

/* ── things a page starts that have to stop when it leaves ── */
let cleanups = [];
const onLeave = (fn) => cleanups.push(fn);

/* ── live values are read from the current CSS tokens ── */
let bindings = [];
function bind(node, read) {
  const paint = (flash) => {
    const next = read();
    if (node.textContent === next) return;
    node.textContent = next;
    if (flash) {
      node.classList.remove('is-changed');
      void node.offsetWidth;
      node.classList.add('is-changed');
    }
  };
  paint(false);
  bindings.push(() => paint(true));
}
const rebinds = [];   // drawn things (curves, races) that need rebuilding, not just re-reading

/* ── one live copy of each component per place it is shown ──
   Several of them listen on the document, so making a fresh one on
   every visit would leave the old listeners behind. They are made
   once and handed back. */
const pool = new Map();
function live(c, slot) {
  const key = c.id + ':' + slot;
  if (!pool.has(key)) {
    let inst = null;
    try { inst = c.mount(); } catch (e) { console.warn('[ds] could not mount', c.id, e); }
    pool.set(key, inst && inst.el ? inst : null);
  }
  return pool.get(key);
}

/* ============================================================
   Samples: a small drawing of what a token is
   ============================================================ */
const bezier = (value) => {
  const m = /cubic-bezier\(([^)]+)\)/.exec(value);
  const n = m ? m[1].split(',').map(Number) : [0.25, 0.1, 0.25, 1];
  return n.length === 4 && n.every(isFinite) ? n : [0.25, 0.1, 0.25, 1];
};
function curvePath(b, w, h, pad) {
  const x = (v) => pad + v * (w - pad * 2);
  const y = (v) => h - pad - v * (h - pad * 2);
  return `M${x(0)} ${y(0)} C${x(b[0])} ${y(b[1])} ${x(b[2])} ${y(b[3])} ${x(1)} ${y(1)}`;
}
const seconds = (value) => (/ms$/.test(value) ? parseFloat(value) / 1000 : parseFloat(value)) || 0;

function sample(name) {
  const box = el('<span class="ds-chip-sample"></span>');
  if (/^--ui-(bg|surface|fg|on-fg|text|mute|ok|line|fill|accent|on-accent|focus)/.test(name)) {
    box.style.backgroundImage = `linear-gradient(var(${name}), var(${name}))`;
  } else if (name.startsWith('--ui-shadow')) {
    box.style.background = 'var(--ui-bg-sunk)';
    box.innerHTML = `<i style="width:24px;height:16px;border-radius:5px;background:var(--ui-surface);box-shadow:var(${name})"></i>`;
  } else if (name === '--ui-r-action') {
    box.innerHTML = '<i style="width:30px;height:22px;background:var(--ui-accent);border-radius:var(--ui-r-action)"></i>';
  } else if (name.startsWith('--ui-r-')) {
    box.innerHTML = `<i style="width:100%;height:100%;background:var(--ui-fg);border-top-left-radius:var(${name});margin:8px 0 0 10px"></i>`;
  } else if (/^--ui-(e|e-in|spring)$/.test(name)) {
    const draw = () => {
      box.innerHTML = `<svg viewBox="0 0 44 30"><path d="${curvePath(bezier(cssVar(name)), 44, 30, 7)}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    };
    draw();
    rebinds.push(draw);
  } else if (/^--ui-(t|breath)/.test(name)) {
    const bar = el('<i class="bar"></i>');
    box.style.placeItems = 'center start';
    box.appendChild(bar);
    const draw = () => {
      const s = seconds(cssVar(name));
      const full = name.includes('breath') ? 4 : 1;
      bar.style.width = Math.max(3, Math.min(34, (s / full) * 34)) + 'px';
    };
    draw();
    rebinds.push(draw);
  } else if (name.startsWith('--ui-fs-')) {
    box.innerHTML = `<span style="font-size:min(var(${name}), 18px);font-weight:700;line-height:1">Aa</span>`;
  }
  return box;
}

function tokenTable(names) {
  const table = el(`
    <div class="m3-table" style="--cols: minmax(0, 1.25fr) minmax(0, 1.4fr) minmax(0, 1.15fr)">
      <div class="m3-tr m3-tr--head"><span>Token</span><span>What it is for</span><span>Value now</span></div>
    </div>`);
  names.forEach((name) => {
    const row = el(`
      <div class="m3-tr">
        <span class="m3-token"><span data-s></span><code>${esc(name)}</code></span>
        <span>${esc(TOKENS[name] || '')}</span>
        <span><span class="m3-val"></span></span>
      </div>`);
    row.querySelector('[data-s]').replaceWith(sample(name));
    bind(row.querySelector('.m3-val'), () => cssVar(name));
    table.appendChild(row);
  });
  return table;
}
const liveNote = () => el('<p class="m3-live"><i></i>Values read from the running system.</p>');

/* ============================================================
   Hero graphics: measured forms that respond to the pointer.
   ============================================================ */
const rnd = (a, b) => a + Math.random() * (b - a);

/* spec: [{ c, x, y, w, h, depth, round }]  (x y w h in % of the panel) */
function shapes(panel, spec) {
  const nodes = spec.map((s) => {
    const n = document.createElement('i');
    n.className = 'm3-shape';
    n.style.cssText = `--c:${s.c};left:${s.x}%;top:${s.y}%;width:${s.w}%;height:${s.h}%;--depth:${s.depth || 0}`;
    n.style.borderRadius = s.round ? '50%' : '2px 52px 2px 2px';
    panel.appendChild(n);
    return { n, s };
  });
  if (reduce) return { nodes, pop: () => {} };

  const move = (e) => {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    panel.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const rest = () => { panel.style.setProperty('--px', '0'); panel.style.setProperty('--py', '0'); };
  panel.addEventListener('pointermove', move);
  panel.addEventListener('pointerleave', rest);

  // Pressed, the colour blocks exchange positions in the composition.
  let popTimer = 0;
  const pop = () => {
    panel.classList.add('is-popped');
    const colors = nodes.map(({ s }) => s.c);
    colors.push(colors.shift());
    nodes.forEach(({ n, s }, i) => {
      s.c = colors[i];
      n.style.setProperty('--c', s.c);
      n.style.setProperty('--rot', i % 2 ? '-8deg' : '8deg');
      n.style.setProperty('--sc', '1.04');
    });
    clearTimeout(popTimer);
    popTimer = setTimeout(() => panel.classList.remove('is-popped'), 950);
  };

  onLeave(() => { clearTimeout(popTimer); });
  return { nodes, pop };
}

const hint = (text) => el(`<p class="m3-art__hint">${esc(text)}</p>`);

/* ============================================================
   Page furniture
   ============================================================ */
function hero({ title, lead, long, row, art }) {
  // a single long word would run out of its panel at full size
  if (long === undefined) long = title.split(" ").some((w) => w.length > 9);
  const node = el(`
    <header class="m3-hero">
      <div class="m3-hero__text">
        <h1 class="m3-display${long ? ' m3-display--long' : ''}">${esc(title)}</h1>
        <p class="m3-lead">${esc(lead)}</p>
        <div class="m3-hero__row"></div>
      </div>
      <div class="m3-hero__art"></div>
    </header>`);
  const rowEl = node.querySelector('.m3-hero__row');
  if (row && row.length) rowEl.append(...row); else rowEl.remove();
  art(node.querySelector('.m3-hero__art'));
  return node;
}

function tabs(base, names, current) {
  const i = Math.max(0, names.indexOf(current));
  const wrap = el(`
    <div class="m3-tabs-wrap">
      <nav class="m3-tabs" aria-label="Sections of this page" style="--n:${names.length};--i:${i}">
        <span class="m3-tabs__marker" aria-hidden="true"></span>
        ${names.map((n, k) => `<a class="m3-tab${k === i ? ' is-on' : ''}" href="${base}${k ? '/' + n : ''}"${k === i ? ' aria-current="page"' : ''}>${icon(n)}<span>${esc(n[0].toUpperCase() + n.slice(1))}</span></a>`).join('')}
      </nav>
    </div>`);
  // tuck the bar in once it has reached the top of the window
  const sentinel = el('<div style="height:1px;margin-bottom:-1px" aria-hidden="true"></div>');
  const io = new IntersectionObserver((e) => wrap.classList.toggle('is-stuck', !e[0].isIntersecting && e[0].boundingClientRect.top < 40), { rootMargin: '-9px 0px 0px 0px' });
  requestAnimationFrame(() => { wrap.before(sentinel); io.observe(sentinel); });
  onLeave(() => io.disconnect());
  return wrap;
}

/* "On this page": built from the headings that are actually there */
function toc(title, body) {
  const heads = [...body.querySelectorAll('.m3-h2')];
  const nav = el(`<nav class="m3-toc" aria-label="On this page"><p class="m3-toc__cap">On this page</p><p class="m3-toc__title">${esc(title)}</p></nav>`);
  if (heads.length < 2) return nav;
  const links = heads.map((h) => {
    if (!h.id) h.id = slug(h.textContent);
    const a = el(`<a href="#">${esc(h.textContent)}</a>`);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    nav.appendChild(a);
    return a;
  });
  // whichever heading last crossed the upper part of the window is where you are
  const mark = () => {
    let on = 0;
    heads.forEach((h, k) => { if (h.getBoundingClientRect().top < window.innerHeight * 0.38) on = k; });
    links.forEach((a, k) => a.classList.toggle('is-on', k === on));
  };
  window.addEventListener('scroll', mark, { passive: true });
  onLeave(() => window.removeEventListener('scroll', mark));
  requestAnimationFrame(mark);
  return nav;
}

/* a card: a tile of colour with the thing on it, then its name */
function card({ href, title, text, media, tile, play }) {
  const node = el(`
    <a class="m3-card" href="${href}">
      <span class="m3-card__media"${tile ? ` style="--tile:${tile}"` : ''}></span>
      <span class="m3-card__body">
        <span class="m3-card__title">${esc(title)}</span>
        <span class="m3-card__text">${esc(text)}</span>
      </span>
    </a>`);
  const slot = node.querySelector('.m3-card__media');
  if (typeof media === 'string') slot.innerHTML = media; else if (media) slot.appendChild(media);
  // what is on the tile is for looking at; the card is the link
  slot.setAttribute('aria-hidden', 'true');
  slot.querySelectorAll('button, input, a, [tabindex]').forEach((n) => { n.tabIndex = -1; });
  if (play) node.addEventListener('pointerenter', play);
  return node;
}
const glyph = (inner) => `<svg class="m3-glyph" viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;

/* `still` makes a plain card: its thumbnail does not play on hover. */
function componentCard(c, { still = false } = {}) {
  const make = THUMBS[c.id];
  const t = make ? make() : null;
  const node = card({
    href: `#/components/${c.id}`,
    title: c.name,
    text: c.lead,
    media: t ? t.el : glyph(c.glyph),
    play: t && !still ? t.play : null,
  });
  if (still) node.classList.add('m3-card--still');
  return node;
}

const foundationCard = (f, index) => el(`
  <a class="form-foundation-row" href="#/foundations/${f.id}">
    <span class="form-foundation-row__number">0${index + 1}</span>
    <span class="form-foundation-row__icon">${icon(f.id)}</span>
    <span class="form-foundation-row__name">${esc(f.name)}</span>
    <span class="form-foundation-row__description">${esc(f.lead)}</span>
    ${icon('arrow', 'form-foundation-row__arrow')}
  </a>`);

/* ============================================================
   The lesson: a live component with a pointer, captions and x-ray
   ============================================================ */
const PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.500 1.800v10.400a.6.6 0 0 0 .900.500l8.400-5.200a.6.6 0 0 0 0-1L4.400 1.300a.6.6 0 0 0-.900.500z"/></svg>';
const STOP = '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2.500" y="2.500" width="9" height="9" rx="2"/></svg>';

function buildLesson(c) {
  const stage = el(`
    <div class="m3-stage">
      <div class="m3-stage__frame" data-cursor="dark">
        <div class="ds-xray" aria-hidden="true"></div>
        <div class="ds-ghost" aria-hidden="true"></div>
      </div>
      <div class="m3-stage__bar">
        <button type="button" class="m3-chip" data-act="watch" aria-pressed="false">${PLAY}<span>Watch</span></button>
        <button type="button" class="m3-chip m3-chip--note" data-act="xray" aria-pressed="false">X-ray</button>
        <p class="m3-caption is-idle" aria-live="polite">It is live. Press anything, or watch.</p>
        <ol class="m3-dots" aria-hidden="true">${c.steps.map(() => '<li></li>').join('')}</ol>
      </div>
    </div>`);

  const frame = stage.querySelector('.m3-stage__frame');
  const xrayEl = stage.querySelector('.ds-xray');
  const ghost = stage.querySelector('.ds-ghost');
  const caption = stage.querySelector('.m3-caption');
  const dots = [...stage.querySelectorAll('.m3-dots li')];
  const watchBtn = stage.querySelector('[data-act="watch"]');
  const xrayBtn = stage.querySelector('[data-act="xray"]');

  const inst = live(c, 'lesson');
  if (!inst) {
    caption.textContent = 'This component could not start here.';
    return { el: stage, steps: () => {}, parts: () => {} };
  }
  frame.insertBefore(inst.el, frame.firstChild);
  const safely = (fn) => { try { return fn(); } catch (e) { console.warn('[ds]', c.id, e); } };

  /* ── the x-ray ─────────────────────────────────────────── */
  const marks = c.parts.map((p, i) => {
    const box = el('<div class="ds-xray__box"></div>');
    const n = el(`<div class="ds-xray__n">${i + 1}</div>`);
    xrayEl.append(box, n);
    return { part: p, box, n };
  });
  let xrayOn = false;      // toggled by the button
  let picked = -1;         // one part held up by the legend
  let xrayRaf = 0;

  function measure() {
    const f = frame.getBoundingClientRect();
    marks.forEach((m, i) => {
      const t = inst.el.querySelector(m.part.sel);
      let found = false;
      if (t) {
        const r = t.getBoundingClientRect();
        const cs = getComputedStyle(t);
        found = r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05 &&
                r.right > f.left && r.left < f.right && r.bottom > f.top && r.top < f.bottom;
        if (found) {
          const pad = 5;
          const x = Math.max(4, r.left - f.left - pad);
          const y = Math.max(4, r.top - f.top - pad);
          const w = Math.min(f.width - x - 4, r.width + pad * 2);
          const h = Math.min(f.height - y - 4, r.height + pad * 2);
          m.box.style.transform = `translate(${x}px, ${y}px)`;
          m.box.style.width = w + 'px';
          m.box.style.height = h + 'px';
          m.box.style.borderRadius = Math.min(parseFloat(cs.borderTopLeftRadius) + pad || 8, h / 2) + 'px';
          m.n.style.transform = `translate(${x}px, ${y}px)`;
        }
      }
      m.box.classList.toggle('is-found', found);
      m.n.classList.toggle('is-found', found);
      m.box.classList.toggle('is-pick', i === picked);
      m.n.classList.toggle('is-pick', i === picked);
    });
  }
  function xrayLoop() {
    measure();
    xrayRaf = (xrayOn || picked >= 0) ? requestAnimationFrame(xrayLoop) : 0;
  }

  // Some parts only exist while a component is open: a dialog's surface, a
  // tooltip's tip. So while the x-ray is up the component is opened far
  // enough to show them, and put back when the x-ray comes down.
  let exposed = false;
  let unexpose = 0;
  function expose(on) {
    clearTimeout(unexpose);
    if (!c.expose) return;
    if (on) {
      if (exposed) return;
      exposed = true;
      if (playing) stop('Opened up for the x-ray. Press Watch to see it move.');
      safely(() => c.expose(inst));
    } else if (exposed) {
      // a beat of patience, so sweeping down the list does not shut and reopen it
      unexpose = setTimeout(() => {
        if (xrayOn || picked >= 0) return;
        exposed = false;
        if (c.reset) safely(() => c.reset(inst));
      }, 260);
    }
  }
  function paintXray() {
    const on = xrayOn || picked >= 0;
    expose(on);
    xrayEl.classList.toggle('is-on', on);
    xrayEl.classList.toggle('has-pick', picked >= 0);
    xrayBtn.setAttribute('aria-pressed', String(xrayOn));
    if (on && !xrayRaf) xrayRaf = requestAnimationFrame(xrayLoop);
  }
  xrayBtn.addEventListener('click', () => { xrayOn = !xrayOn; paintXray(); });
  onLeave(() => { xrayOn = false; picked = -1; cancelAnimationFrame(xrayRaf); clearTimeout(unexpose); });

  /* ── the showing ───────────────────────────────────────── */
  let run = 0;             // bumping this cancels whatever is playing
  let playing = false;
  let stepRows = [];

  const setStep = (i) => {
    dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
    stepRows.forEach((r, k) => r.classList.toggle('is-now', k === i));
  };
  const say = (text, idle) => {
    caption.textContent = text;
    caption.classList.toggle('is-idle', !!idle);
  };
  const ghostOff = () => ghost.classList.remove('is-on');
  async function point(target) {
    const f = frame.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    ghost.style.setProperty('--gx', (r.left + r.width / 2 - f.left) + 'px');
    ghost.style.setProperty('--gy', (r.top + r.height / 2 - f.top) + 'px');
    ghost.classList.add('is-on');
    await sleep(reduce ? 0 : 660);
  }
  const press = () => {
    ghost.classList.remove('is-press');
    void ghost.offsetWidth;
    ghost.classList.add('is-press');
  };

  function setPlaying(on) {
    playing = on;
    watchBtn.setAttribute('aria-pressed', String(on));
    watchBtn.innerHTML = (on ? STOP : PLAY) + `<span>${on ? 'Stop' : 'Watch'}</span>`;
  }

  async function play() {
    const mine = ++run;
    const tools = { alive: () => mine === run };
    setPlaying(true);
    clearTimeout(unexpose);
    exposed = false;
    if (c.reset) safely(() => c.reset(inst));
    await sleep(380);
    for (let i = 0; i < c.steps.length; i++) {
      if (mine !== run) return;
      const s = c.steps[i];
      setStep(i);
      say(s.say);
      const target = s.at ? inst.el.querySelector(s.at) : null;
      if (target) await point(target); else if (!s.run) ghostOff();
      if (mine !== run) return;
      if (s.run) {
        if (target) press();
        try { await s.run(inst, tools); } catch (e) { console.warn('[ds]', c.id, e); }
      }
      await sleep(s.hold || 1500);
    }
    if (mine !== run) return;
    ghostOff();
    setStep(-1);
    setPlaying(false);
    say('That is the whole of it. It is yours now, so press anything.', true);
    await sleep(900);
    if (mine === run && c.reset) safely(() => c.reset(inst));
  }
  function stop(text) {
    run++;
    ghostOff();
    setStep(-1);
    setPlaying(false);
    if (text) say(text, true);
  }
  watchBtn.addEventListener('click', () => { if (playing) stop('Stopped. Press anything, or watch again.'); else play(); });

  // a real hand on the component ends the showing; the demo's own
  // presses are not trusted events, so they pass through here untouched
  const takeover = (e) => { if (e.isTrusted && playing) stop('Yours now. Press Watch to see it again.'); };
  frame.addEventListener('pointerdown', takeover, true);
  frame.addEventListener('keydown', takeover, true);
  onLeave(() => {
    run++;
    frame.removeEventListener('pointerdown', takeover, true);
    frame.removeEventListener('keydown', takeover, true);
    if (c.reset) safely(() => c.reset(inst));
  });

  // play once, the first time the stage is properly on screen
  if (!reduce) {
    let timer = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      timer = setTimeout(() => { if (!playing && run === 0) play(); }, 700);
    }, { threshold: 0.55 });
    io.observe(frame);
    onLeave(() => { io.disconnect(); clearTimeout(timer); });
  }

  return {
    el: stage,
    steps: (rows) => { stepRows = rows; },
    parts: (rows) => {
      rows.forEach((row, i) => {
        const on = () => { picked = i; paintXray(); };
        const off = () => { picked = -1; paintXray(); };
        row.addEventListener('pointerenter', on);
        row.addEventListener('pointerleave', off);
        row.addEventListener('focus', on);
        row.addEventListener('blur', off);
      });
    },
  };
}

/* ============================================================
   Pages
   ============================================================ */
const cta = (href, label, cls = '') => el(`<a class="m3-cta ${cls}" href="${href}">${esc(label)}</a>`);

function pageHome() {
  const view = el(`
    <article class="m3-view form-home">
      <header class="form-home-hero">
        <div class="form-home-hero__copy">
          <p class="form-kicker"><span class="form-kicker__line"></span> A design language for the curious</p>
          <h1>Every detail<br><em>has a reason.</em></h1>
          <p class="form-home-hero__lead">A language of precise frames, responsive controls and carefully placed signals. Clear in structure. Distinct in use.</p>
          <div class="form-home-hero__actions">
            <a class="form-action" href="#/components">Explore components ${icon('arrow')}</a>
            <a class="form-text-link" href="#/foundations">See the foundations ${icon('arrow')}</a>
          </div>
        </div>
        <div class="form-live-study" data-cursor="dark">
          <div class="form-live-study__top"><span>01 / INTERACTION STUDY</span><span class="form-live-study__status"><i></i> LIVE</span></div>
          <div class="form-live-study__content">
            <p>Make a choice.<br><strong>See it respond.</strong></p>
            <div class="form-live-study__controls" data-controls></div>
          </div>
          <div class="form-live-study__bottom"><span>Real components, ready to touch.</span><span>→</span></div>
        </div>
      </header>
      <section class="form-home-intro" aria-labelledby="form-home-intro-title">
        <p class="form-section-label">01 / THE IDEA</p>
        <div><h2 id="form-home-intro-title">A system with a point of view.</h2><p>Structure makes an interface easy to understand. Form adds the choices that make it memorable: a considered type scale, tactile controls and motion that explains what changed.</p></div>
      </section>
      <section class="form-home-paths" aria-labelledby="form-home-paths-title">
        <div class="form-section-heading"><p class="form-section-label">02 / START HERE</p><h2 id="form-home-paths-title">Explore the language.</h2></div>
        <div class="form-home-paths__list">
          <a href="#/foundations"><span class="form-home-paths__icon">${icon('foundations')}</span><span class="form-home-paths__copy"><strong>Foundations</strong><small>Color, type, shape and motion.</small></span><span class="form-home-paths__index">01</span>${icon('arrow', 'form-path-arrow')}</a>
          <a href="#/components"><span class="form-home-paths__icon">${icon('components')}</span><span class="form-home-paths__copy"><strong>Components</strong><small>Working controls and their anatomy.</small></span><span class="form-home-paths__index">02</span>${icon('arrow', 'form-path-arrow')}</a>
          <a href="#/examples"><span class="form-home-paths__icon">${icon('examples')}</span><span class="form-home-paths__copy"><strong>Examples</strong><small>Complete screens made from the language.</small></span><span class="form-home-paths__index">03</span>${icon('arrow', 'form-path-arrow')}</a>
          <a href="playground.html"><span class="form-home-paths__icon">${icon('playground')}</span><span class="form-home-paths__copy"><strong>Playground</strong><small>Experiments built from the same ideas.</small></span><span class="form-home-paths__index">04</span>${icon('arrow', 'form-path-arrow')}</a>
        </div>
      </section>
      <section class="form-home-rules" aria-labelledby="form-home-rules-title">
        <div class="form-section-heading"><p class="form-section-label">03 / PRINCIPLES</p><h2 id="form-home-rules-title">The rules behind the feeling.</h2></div>
        <div class="form-home-rules__list">${RULES.map((rule, index) => `<div><span>0${index + 1}</span><h3>${esc(rule.title)}</h3><p>${esc(rule.text)}</p></div>`).join('')}</div>
      </section>
    </article>`);
  const controls = view.querySelector('[data-controls]');
  const options = el('<div class="form-live-study__options"></div>');
  options.append(createChip({ label: 'Motion', selected: true }), createChip({ label: 'Shape' }));
  const explore = createButton({ label: 'Explore components', variant: 'filled' });
  explore.addEventListener('click', () => { location.hash = '#/components'; });
  controls.append(options, createSlider({ value: 64, label: 'Intensity' }).el, explore);
  return { el: view, title: 'Playground UI' };
}

function pageFoundations() {
  const view = el(`
    <article class="m3-view form-foundations">
      <header class="form-index-hero">
        <div><p class="form-kicker"><span class="form-kicker__line"></span> 01 / THE FOUNDATION</p><h1>Foundations<span class="form-heading-period">.</span></h1></div>
        <p>Five connected decisions give every component its character. Start with the essentials, then inspect the live values inside each page.</p>
      </header>
      <div class="form-foundations__note"><span>THE FIVE ELEMENTS</span><span>One language, many expressions.</span></div>
      <div class="form-foundations__list" data-list></div>
      <div class="form-foundations__next"><span>Ready to see them in use?</span><a href="#/components">Explore components ${icon('arrow')}</a></div>
    </article>`);
  FOUNDATIONS.forEach((foundation, index) => view.querySelector('[data-list]').appendChild(foundationCard(foundation, index)));
  return { el: view, title: 'Foundations' };
}
function pageComponents() {
  const view = el(`<article class="m3-view form-components">
    <header class="form-index-hero"><div><p class="form-kicker"><span class="form-kicker__line"></span> 02 / THE LIBRARY</p><h1>Components<span class="form-heading-period">.</span></h1></div><p>${COMPONENTS.length} working elements, designed to respond with purpose. Open one to explore its states, anatomy and use.</p></header>
    <div class="form-foundations__note"><span>THE COMPONENT LIBRARY</span><span>Open any element to interact.</span></div>
    <div class="form-components__body"></div>
  </article>`);
  const body = view.querySelector('.form-components__body');
  GROUPS.forEach((g) => {
    const items = COMPONENTS.filter((c) => c.group === g);
    if (!items.length) return;
    const group = el(`<section class="form-component-group"><h2>${esc(g)}</h2><div></div></section>`);
    items.forEach((c, index) => group.lastElementChild.appendChild(el(`
      <a class="form-component-row" href="#/components/${c.id}">
        <span class="form-component-row__index">${String(index + 1).padStart(2, '0')}</span>
        <span class="form-component-row__name">${esc(c.name)}</span>
        <span class="form-component-row__description">${esc(c.lead)}</span>
        ${icon('arrow')}
      </a>`)));
    body.appendChild(group);
  });
  return { el: view, title: 'Components' };
}

const COMPONENT_TABS = ['overview', 'specs', 'guidelines', 'accessibility'];

function pageComponent(c, tab) {
  if (!COMPONENT_TABS.includes(tab)) tab = 'overview';
  const i = COMPONENTS.indexOf(c);
  const next = COMPONENTS[(i + 1) % COMPONENTS.length];
  const prev = COMPONENTS[(i - 1 + COMPONENTS.length) % COMPONENTS.length];
  const art = GROUP_ART[c.group] || GROUP_ART.Actions;

  const view = el('<article class="m3-view"></article>');
  const chips = [el(`<span class="m3-chip">${esc(c.group)}</span>`)];

  view.appendChild(hero({
    title: c.name,
    lead: c.lead,
    row: chips,
    art: (panel) => {
      panel.style.setProperty('--art-bg', art.bg);
      shapes(panel, [
        { c: art.a, x: -18, y: 46, w: 62, h: 82, depth: 14 },
        { c: art.b, x: 66, y: -24, w: 54, h: 70, depth: 26 },
      ]);
      // the real component, on its paper, in the middle of the colour
      const device = el('<div class="m3-device" data-cursor="dark"></div>');
      const inst = live(c, 'hero');
      if (inst) device.appendChild(inst.el);
      panel.append(device, el('<p class="m3-art__live"><i></i>Live</p>'));
      onLeave(() => { if (inst && c.reset) { try { c.reset(inst); } catch (e) {} } });
    },
  }));

  view.appendChild(tabs(`#/components/${c.id}`, COMPONENT_TABS, tab));

  const body = el('<div class="m3-body"><div data-col></div></div>');
  const col = body.querySelector('[data-col]');
  view.appendChild(body);

  if (tab === 'overview') {
    col.innerHTML = `
      <section class="m3-sec">
        <ul class="m3-points">${(POINTS[c.id] || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      </section>
      <section class="m3-sec">
        <h2 class="m3-h2">How it moves</h2>
        <p class="m3-p">This is the real component, not a recording. Press Watch and it plays through, one step at a time, with each step lighting up below. Touch it and it is yours.</p>
        <div data-lesson></div>
        <div class="m3-two">
          <div>
            <h3 class="m3-two__cap">Steps</h3>
            <p class="m3-two__sub">In the order they play</p>
            <ol class="m3-legend" data-steps>
              ${c.steps.map((s, k) => `<li><span class="m3-legend__n">${k + 1}</span><p class="m3-legend__t">${esc(s.say)}</p></li>`).join('')}
            </ol>
          </div>
          <div>
            <h3 class="m3-two__cap">Anatomy</h3>
            <p class="m3-two__sub">Point at a part to find it on the live component</p>
            <ol class="m3-legend m3-legend--parts" data-parts>
              ${c.parts.map((p, k) => `<li tabindex="0"><span class="m3-legend__n">${k + 1}</span><p class="m3-legend__t"><b>${esc(p.label)}</b> <span>${esc(p.note)}</span></p></li>`).join('')}
            </ol>
          </div>
        </div>
      </section>
      <section class="m3-sec">
        <h2 class="m3-h2">Keep going</h2>
        <div class="m3-cards m3-cards--2" data-more></div>
      </section>`;
    const lesson = buildLesson(c);
    col.querySelector('[data-lesson]').replaceWith(lesson.el);
    lesson.steps([...col.querySelectorAll('[data-steps] li')]);
    lesson.parts([...col.querySelectorAll('[data-parts] li')]);
    const more = col.querySelector('[data-more]');
    more.append(componentCard(prev, { still: true }), componentCard(next, { still: true }));
  }

  if (tab === 'specs') {
    col.innerHTML = `
      <section class="m3-sec">
        <h2 class="m3-h2">Tokens</h2>
        <p class="m3-p">What ${esc(c.name)} draws on. None of these belong to it: they are the system's, so changing one changes every component that uses it.</p>
        <div data-tokens></div>
      </section>
      <section class="m3-sec">
        <h2 class="m3-h2">Parts</h2>
        <div class="m3-table" style="--cols: 64px minmax(0, 1fr) minmax(0, 2fr)">
          <div class="m3-tr m3-tr--head"><span>No.</span><span>Part</span><span>What it does</span></div>
          ${c.parts.map((p, k) => `<div class="m3-tr"><span>${k + 1}</span><span>${esc(p.label)}</span><span>${esc(p.note)}</span></div>`).join('')}
        </div>
      </section>`;
    col.querySelector('[data-tokens]').append(liveNote(), tokenTable(c.tokens));
  }

  if (tab === 'guidelines') {
    const tick = '<svg viewBox="0 0 20 20"><path d="M4 10.500l4 4 8-9"/></svg>';
    const cross = '<svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15"/></svg>';
    col.innerHTML = `
      <section class="m3-sec">
        <h2 class="m3-h2">Usage</h2>
        <div class="m3-use">
          ${c.use.do.map((t) => `<div class="m3-use__card m3-use__card--do"><div class="m3-use__fig">${esc(t)}</div><p class="m3-use__tag">${tick}Do</p></div>`).join('')}
          ${c.use.dont.map((t) => `<div class="m3-use__card m3-use__card--dont"><div class="m3-use__fig">${esc(t)}</div><p class="m3-use__tag">${cross}Don't</p></div>`).join('')}
        </div>
      </section>`;
  }

  if (tab === 'accessibility') {
    col.innerHTML = `
      <section class="m3-sec">
        <h2 class="m3-h2">Keyboard</h2>
        <p class="m3-p">Everything a pointer can do here, the keyboard can do too.</p>
        <div class="m3-table" style="--cols: minmax(0, 1fr) minmax(0, 2fr)">
          <div class="m3-tr m3-tr--head"><span>Key</span><span>What it does</span></div>
          ${c.keys.map(([k, what]) => `<div class="m3-tr"><span><span class="m3-kbd">${esc(k)}</span></span><span>${esc(what)}</span></div>`).join('')}
        </div>
      </section>
      <section class="m3-sec">
        <h2 class="m3-h2">Motion</h2>
        <p class="m3-p">If the device asks for reduced motion, the breathing and the travel stop and each state simply appears. Nothing depends on an animation to be understood.</p>
      </section>`;
  }

  body.appendChild(toc(c.name, col));
  return { el: view, title: c.name };
}

/* ── foundations ─────────────────────────────────────────── */
function swatches(names) {
  const grid = el('<div class="ds-swatches"></div>');
  names.forEach((name) => {
    const s = el(`
      <div class="ds-swatch">
        <div class="ds-swatch__chip" style="--sw: var(${name})"></div>
        <p class="ds-swatch__name">${esc(name)}</p>
        <p class="ds-swatch__role">${esc(TOKENS[name] || '')}</p>
        <p class="ds-swatch__val"></p>
      </div>`);
    bind(s.querySelector('.ds-swatch__val'), () => cssVar(name));
    grid.appendChild(s);
  });
  return grid;
}

function foundationPage(f, art, html, fill) {
  const view = el('<article class="m3-view"></article>');
  view.appendChild(hero({ title: f.name, lead: f.lead, art }));
  const body = el(`<div class="m3-body"><div data-col>${html}</div></div>`);
  const col = body.querySelector('[data-col]');
  view.appendChild(body);
  fill(col);
  body.appendChild(toc(f.name, col));
  return { el: view, title: f.name };
}

function pageColor(f) {
  return foundationPage(f, (panel) => {
    // ink on paper, quite literally, and the one colour as a single dot
    panel.style.setProperty('--art-bg', '#fcfcfd');
    const field = shapes(panel, [
      { c: 'var(--x-ink)', x: 6, y: 14, w: 60, h: 74, depth: 14 },
      { c: 'var(--x-sky)', x: 54, y: 42, w: 56, h: 72, depth: 28 },
      { c: 'var(--x-signal)', x: 68, y: 9, w: 18, h: 22, depth: 46, round: true },
    ]);
    panel.appendChild(hint('Press to re-form'));
    panel.addEventListener('click', field.pop);
  }, `
    <section class="m3-sec">
      <ul class="m3-points">
        <li>Pale paper and carbon ink form the base</li>
        <li>Lines and washes are ink at a low alpha, never a grey</li>
        <li>State is told by fill, not by colour</li>
        <li>Vermilion identifies primary actions; green confirms completion</li>
      </ul>
    </section>
    <section class="m3-sec"><h2 class="m3-h2">Surface</h2>
      <p class="m3-p">Three levels of paper. A component sits on the canvas, wells sink into it, and cards rise above it.</p><div data-s="surface"></div></section>
    <section class="m3-sec"><h2 class="m3-h2">Ink</h2>
      <p class="m3-p">One ink, at four strengths. The strongest is also the fill of every active shape.</p><div data-s="ink"></div></section>
    <section class="m3-sec"><h2 class="m3-h2">Lines and washes</h2>
      <p class="m3-p">Lines and washes use carbon ink at low opacity, so they sit naturally on paper and raised surfaces.</p><div data-s="line"></div></section>
    <section class="m3-sec"><h2 class="m3-h2">State reads as fill</h2>
      <p class="m3-p">Selection stays readable without colour: on and off differ in fill and a visible tick. Outline is off. Solid is on. Try them.</p>
      <div class="m3-fig m3-fig--pad" data-cursor="dark" data-demo="fill"></div></section>
    <section class="m3-sec"><h2 class="m3-h2">Colour with a purpose</h2>
      <p class="m3-p">Vermilion draws attention to the next action. Semantic green confirms completion. Neither replaces a label, a tick or a change of shape.</p>
      <div data-s="ok"></div>
      <div class="m3-fig m3-fig--pad" style="margin-top:8px" data-cursor="dark" data-demo="ok"></div></section>`,
  (col) => {
    const put = (key, node) => col.querySelector(`[data-s="${key}"]`).replaceWith(node);
    put('surface', swatches(['--ui-bg', '--ui-bg-sunk', '--ui-surface']));
    put('ink', swatches(['--ui-fg', '--ui-text', '--ui-text-2', '--ui-mute', '--ui-on-fg']));
    put('line', swatches(['--ui-line', '--ui-line-soft', '--ui-fill', '--ui-fill-strong']));
    put('ok', swatches(['--ui-accent', '--ui-on-accent', '--ui-focus', '--ui-ok']));
    col.querySelector('[data-demo="fill"]').append(
      createChip({ label: 'Off' }), createChip({ label: 'On', selected: true }),
      createSwitch({}), createSwitch({ checked: true }),
      createCheckbox({}), createCheckbox({ checked: true }),
    );
    const ring = createProgressRing({ value: 0.3 });
    const again = createButton({ label: 'Finish the job', variant: 'outline' });
    col.querySelector('[data-demo="ok"]').append(ring.el, again);
    let t1 = 0, t2 = 0;
    again.addEventListener('click', () => {
      clearTimeout(t1); clearTimeout(t2);
      ring.set(0.3);
      t1 = setTimeout(() => ring.set(0.72), 350);
      t2 = setTimeout(() => ring.set(1), 1100);
    });
    onLeave(() => { clearTimeout(t1); clearTimeout(t2); });
  });
}

function pageType(f) {
  const rows = [
    ['Display', null, 'A system that breathes', 'font-size:clamp(2rem,4.4vw,3.6rem);font-weight:500;letter-spacing:-0.05em;line-height:1', 'Page titles: medium weight, tight spacing.'],
    ['Body', '--ui-fs-md', 'Letters land with a bit of weight, and the caret stretches into your selection.', 'font-size:var(--ui-fs-md);line-height:1.6', 'Inputs and reading text.'],
    ['Control', '--ui-fs-sm', 'Save draft', 'font-size:var(--ui-fs-sm);font-weight:600', 'Buttons, chips, labels.'],
    ['Hint', '--ui-fs-xs', 'Press anything, or watch', 'font-size:var(--ui-fs-xs);color:var(--ui-text-2)', 'Captions and helper text.'],
    ['Eyebrow', '--ui-fs-cap', 'Selection controls', 'font-size:var(--ui-fs-cap);font-weight:700;letter-spacing:var(--ui-ls-cap);text-transform:uppercase;color:var(--ui-mute)', 'Titles a component. Uppercase, wide.'],
  ];
  return foundationPage(f, (panel) => {
    panel.style.setProperty('--art-bg', 'var(--x-yellow)');
    shapes(panel, [
      { c: 'var(--x-orange)', x: -16, y: 50, w: 60, h: 76, depth: 12 },
      { c: 'var(--x-pink)', x: 62, y: -20, w: 54, h: 66, depth: 22 },
    ]);
    // the letters are the variable font itself: the pointer is on its axes
    const big = el('<p class="m3-art__big" aria-hidden="true">Aa</p>');
    const read = el('<p class="m3-art__read">Weight 500 · Tracking -0.04em</p>');
    panel.append(big, read, hint('Move across for weight; move vertically for letter spacing'));
    if (!reduce) {
      const move = (e) => {
        const r = panel.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
        const wght = Math.round(300 + x * 400);
        const tracking = (-0.08 + y * 0.1).toFixed(3);
        
        big.style.setProperty('--wght', wght);
        big.style.letterSpacing = tracking + 'em';
        
        read.textContent = `Weight ${wght} · Tracking ${tracking}em`;
      };
      panel.addEventListener('pointermove', move);
    }
  }, `
    <section class="m3-sec">
      <ul class="m3-points">
        <li>Space Grotesk for the interface; monospace for notation</li>
        <li>Four sizes and a label style cover every control</li>
        <li>The components never load a font of their own</li>
      </ul>
    </section>
    <section class="m3-sec"><h2 class="m3-h2">The scale</h2>
      <p class="m3-p">Small on purpose. These are controls, not articles, so four sizes cover everything a component has to say.</p>
      <div class="ds-type">
        ${rows.map(([name, token, text, style, note], k) => `
          <div class="ds-type__row">
            <div class="ds-type__meta"><b>${esc(name)}</b>${token ? `${esc(token)}<br><span data-v="${k}"></span><br>` : ''}${esc(note)}</div>
            <p class="ds-type__sample" style="${style}">${esc(text)}</p>
          </div>`).join('')}
      </div></section>
    <section class="m3-sec"><h2 class="m3-h2">One family</h2>
      <p class="m3-p">The shared font token sets Space Grotesk, with Helvetica and Arial fallbacks. Documentation and Playground load the same face so each component keeps its identity wherever it appears.</p>
      <p class="m3-p">Space Grotesk gives headlines and controls their character; IBM Plex Mono handles notation. The same type scale runs through the pages and components.</p>
      <div data-tokens></div></section>`,
  (col) => {
    rows.forEach(([, token], k) => {
      const node = col.querySelector(`[data-v="${k}"]`);
      if (node && token) bind(node, () => cssVar(token));
    });
    col.querySelector('[data-tokens]').append(liveNote(), tokenTable(['--ui-fs-md', '--ui-fs-sm', '--ui-fs-xs', '--ui-fs-cap']));
  });
}

function pageShape(f) {
  const radii = ['--ui-r-sm', '--ui-r-md', '--ui-r-lg', '--ui-r-xl', '--ui-r-full'];
  return foundationPage(f, (panel) => {
    panel.style.setProperty('--art-bg', 'var(--x-signal)');
    // one shape that steps through the five radii, on press or on its own
    const body = el('<i class="m3-shape" style="--c:var(--x-sky);left:19%;top:14%;width:62%;height:72%;--depth:16;transition:border-radius 0.9s var(--ui-spring),transform 1.1s var(--ui-e)"></i>');
    const read = el('<p class="m3-art__read"></p>');
    panel.append(body, read, hint('Press to step to the next radius'));
    const stepsPx = () => radii.map((n) => (n === '--ui-r-full' ? '999px' : `calc(${cssVar(n) || '10px'} * 4)`));
    let k = 3;
    const show = () => { body.style.borderRadius = stepsPx()[k]; read.textContent = radii[k] + ' · ' + cssVar(radii[k]); };
    show();
    const next = () => { k = (k + 1) % radii.length; show(); };
    panel.addEventListener('click', next);
    const move = (e) => {
      const r = panel.getBoundingClientRect();
      panel.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      panel.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    };
    panel.addEventListener('pointermove', move);
    const timer = reduce ? 0 : setInterval(() => { if (!panel.matches(':hover')) next(); }, 2600);
    rebinds.push(show);
    onLeave(() => clearInterval(timer));
  }, `
    <section class="m3-sec">
      <ul class="m3-points">
        <li>Five corner radii: 4, 8, 12, 18 and full</li>
        <li>One softer corner distinguishes primary actions</li>
        <li>Rounded rectangles for anything that holds</li>
        <li>Shadows are ink, never black</li>
      </ul>
    </section>
    <section class="m3-sec"><h2 class="m3-h2">Five steps</h2>
      <p class="m3-p">These corner values scale the controls and containers throughout the system.</p>
      <div class="ds-radii">
        ${radii.map((name, k) => `
          <div class="ds-radius">
            <div class="ds-radius__box" style="border-radius:var(${name})"></div>
            <p class="ds-radius__name">${esc(name)}</p><p class="ds-radius__val" data-v="${k}"></p>
          </div>`).join('')}
      </div></section>
    <section class="m3-sec"><h2 class="m3-h2">A shape for every role</h2>
      <p class="m3-p">Actions carry one softer corner. Choices use compact rectangular tags. Knobs, switches and icon controls stay round, so their physical movement feels natural. Containers use the stepped radius scale.</p>
      <div class="m3-fig m3-fig--pad" data-cursor="dark" data-demo="shape"></div></section>
    <section class="m3-sec"><h2 class="m3-h2">Elevation</h2>
      <p class="m3-p">Three heights. The shadows are ink, so they stay the colour of the system.</p>
      <div class="m3-fig m3-fig--pad m3-fig--dots" data-cursor="dark">
        <div class="ds-elev">
          ${[['--ui-shadow-sm', 'Resting'], ['--ui-shadow-md', 'Lifted'], ['--ui-shadow-lg', 'Floating']].map(([name, label]) => `
            <div class="ds-elev__card" style="box-shadow:0 0 0 1px var(--ui-line-soft), var(${name})">
              <p class="n">${esc(name)}</p><p class="r">${esc(label)}. ${esc(TOKENS[name])}</p>
            </div>`).join('')}
        </div>
      </div></section>
    <section class="m3-sec"><h2 class="m3-h2">Tokens</h2><div data-tokens></div></section>`,
  (col) => {
    radii.forEach((name, k) => bind(col.querySelector(`[data-v="${k}"]`), () => cssVar(name)));
    col.querySelector('[data-demo="shape"]').append(
      createButton({ icon: 'plus', variant: 'filled', title: 'Add' }),
      createButton({ icon: 'heart', variant: 'outline', title: 'Like' }),
      createSwitch({ checked: true }),
      createChip({ label: 'Pressed', selected: true }),
      el('<div style="padding:16px 20px;border-radius:var(--ui-r-lg);background:var(--ui-surface);box-shadow:0 0 0 1px var(--ui-line-soft),var(--ui-shadow-md);font-size:13px;color:var(--ui-text-2);transition:border-radius var(--ui-t) var(--ui-e)">A card holds things</div>'),
    );
    col.querySelector('[data-tokens]').append(liveNote(), tokenTable([...radii, '--ui-shadow-sm', '--ui-shadow-md', '--ui-shadow-lg']));
  });
}

function pageMotion(f) {
  const curves = ['--ui-e', '--ui-e-in', '--ui-spring'];
  const speeds = ['--ui-t-fast', '--ui-t', '--ui-t-slow'];
  return foundationPage(f, (panel) => {
    panel.style.setProperty('--art-bg', '#2b1b63');
    // The curve, drawn large, and a ball riding it: the outer box crosses at
    // a steady pace while the inner one rises on the easing, so together
    // they trace exactly the line underneath.
    const stage = el(`
      <div style="position:absolute;inset:12% 10% 14%">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">
          <path data-line fill="none" stroke="var(--x-pink)" stroke-width="2.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>
        <div data-x style="position:absolute;left:0;top:0;bottom:0;width:0"><div data-y style="position:absolute;left:-17px;bottom:-17px;width:34px;height:34px;border-radius:50%;background:var(--x-signal)"></div></div>
      </div>`);
    const read = el('<p class="m3-art__read"></p>');
    panel.append(stage, read, hint('Press for the next curve'));
    const line = stage.querySelector('[data-line]');
    const bx = stage.querySelector('[data-x]');
    const by = stage.querySelector('[data-y]');
    let k = 0;
    let anims = [];
    const draw = () => {
      anims.forEach((a) => a.cancel());
      anims = [];
      const name = curves[k];
      const value = cssVar(name);
      const b = bezier(value);
      const top = Math.max(1, b[1], b[3]);
      const y = (v) => 100 - (v / top) * 100;
      line.setAttribute('d', `M0 ${y(0)} C${b[0] * 100} ${y(b[1])} ${b[2] * 100} ${y(b[3])} 100 ${y(1)}`);
      read.textContent = name + ' · ' + value;
      if (reduce || !bx.animate) return;
      const opts = { duration: 1900, iterations: Infinity, direction: 'alternate' };
      anims.push(bx.animate([{ left: '0%' }, { left: '100%', offset: 0.7 }, { left: '100%' }], opts));
      anims.push(by.animate([{ bottom: 'calc(0% - 17px)', easing: value }, { bottom: `calc(${(1 / top) * 100}% - 17px)`, offset: 0.7 }, { bottom: `calc(${(1 / top) * 100}% - 17px)` }], opts));
    };
    panel.addEventListener('click', () => { k = (k + 1) % curves.length; draw(); });
    rebinds.push(draw);
    onLeave(() => anims.forEach((a) => a.cancel()));
    requestAnimationFrame(draw);
  }, `
    <section class="m3-sec">
      <ul class="m3-points">
        <li>One curve for everything that travels</li>
        <li>A spring, kept for what sits under your finger</li>
        <li>Three speeds: feedback, a state changing, a shape changing</li>
        <li>Things change shape, they are never swapped</li>
      </ul>
    </section>
    <section class="m3-sec"><h2 class="m3-h2">Three curves</h2>
      <p class="m3-p">Travel leaves fast and arrives gently, so a thing is where you expect it almost at once and then settles. Each curve below is drawn from its token, and the ball under it is riding it.</p>
      <div class="ds-curves">
        ${curves.map((name, k) => `
          <div class="ds-curve">
            <svg viewBox="0 0 200 150" data-c="${k}"></svg>
            <div class="ds-curve__track"><div class="ds-curve__ball" data-b="${k}"></div></div>
            <p class="ds-curve__name">${esc(name)}</p>
            <p class="ds-curve__role">${esc(TOKENS[name])}</p>
            <p class="ds-curve__val" data-v="${k}"></p>
          </div>`).join('')}
      </div></section>
    <section class="m3-sec"><h2 class="m3-h2">Three speeds</h2>
      <p class="m3-p">Feedback is fastest because it answers a finger. A shape changing size is slowest because the eye has more to follow.</p>
      <div class="ds-speeds">
        ${speeds.map((name, k) => `
          <div class="ds-speed">
            <span class="ds-speed__name">${esc(name)}</span>
            <div class="ds-speed__lane"><div class="ds-speed__run" data-r="${k}"></div></div>
            <span class="ds-speed__val" data-sv="${k}"></span>
          </div>`).join('')}
      </div></section>
    <section class="m3-sec"><h2 class="m3-h2">Change shape, do not swap</h2>
      <p class="m3-p">The rule behind every component here. A menu is the button, opened. A panel is the bar, taller. A selection is the caret, wider. When one thing becomes another the eye can follow it, and nothing has to be explained.</p>
      <div data-tokens></div></section>`,
  (col) => {
    const animations = [];
    const draw = () => {
      animations.splice(0).forEach((a) => a.cancel());
      curves.forEach((name, k) => {
        const value = cssVar(name);
        const b = bezier(value);
        const svg = col.querySelector(`[data-c="${k}"]`);
        // A spring goes past 1 before it comes back, and its handles go further
        // still. The plot is scaled so the whole of it stays inside the card:
        // the square is progress 0 to 1, and anything above it is overshoot.
        const pad = 22;
        const top = Math.max(1, b[1], b[3]);
        const low = Math.min(0, b[1], b[3]);
        const x = (v) => pad + v * (200 - pad * 2);
        const y = (v) => 150 - pad - ((v - low) / (top - low)) * (150 - pad * 2);
        svg.innerHTML =
          `<path class="grid" d="M${x(0)} ${y(0)}H${x(1)}V${y(1)}H${x(0)}Z"/>` +
          `<path class="line" d="M${x(0)} ${y(0)} C${x(b[0])} ${y(b[1])} ${x(b[2])} ${y(b[3])} ${x(1)} ${y(1)}"/>` +
          `<circle class="dot" r="4.500" cx="${x(b[0])}" cy="${y(b[1])}"/>` +
          `<circle class="dot" r="4.500" cx="${x(b[2])}" cy="${y(b[3])}"/>`;
        const ball = col.querySelector(`[data-b="${k}"]`);
        if (!reduce && ball.animate) {
          animations.push(ball.animate(
            [{ left: '3px', easing: value }, { left: 'calc(100% - 23px)', offset: 0.62 }, { left: 'calc(100% - 23px)' }],
            { duration: 2200, iterations: Infinity, direction: 'alternate' }));
        }
      });
      speeds.forEach((name, k) => {
        const ms = seconds(cssVar(name)) * 1000;
        const runner = col.querySelector(`[data-r="${k}"]`);
        const total = 2400;
        if (!reduce && runner.animate) {
          animations.push(runner.animate(
            [{ left: '4px', easing: cssVar('--ui-e') }, { left: 'calc(100% - 36px)', offset: Math.min(0.9, ms / total) }, { left: 'calc(100% - 36px)' }],
            { duration: total, iterations: Infinity, direction: 'alternate' }));
        }
      });
    };
    curves.forEach((name, k) => bind(col.querySelector(`[data-v="${k}"]`), () => cssVar(name)));
    speeds.forEach((name, k) => bind(col.querySelector(`[data-sv="${k}"]`), () => cssVar(name)));
    rebinds.push(draw);
    onLeave(() => animations.forEach((a) => a.cancel()));
    requestAnimationFrame(draw);
    col.querySelector('[data-tokens]').append(liveNote(), tokenTable([...curves, ...speeds]));
  });
}

function pageBreathing(f) {
  return foundationPage(f, (panel) => {
    panel.style.setProperty('--art-bg', 'var(--x-violet)');
    const field = shapes(panel, [
      { c: 'var(--x-ink)', x: 20, y: 14, w: 60, h: 72, depth: 20 },
      { c: 'var(--x-signal)', x: 60, y: 58, w: 30, h: 36, depth: 40 },
      { c: 'var(--x-pink)', x: 8, y: 8, w: 18, h: 22, depth: 52, round: true },
    ]);
    panel.appendChild(hint('It is breathing. Press for a deep one.'));
    panel.addEventListener('click', field.pop);
  }, `
    <section class="m3-sec">
      <ul class="m3-points">
        <li>A shape reacts before it is touched</li>
        <li>Round bodies bend, pills swell: two ways to breathe</li>
        <li>A breath is slower than any interaction</li>
        <li>Nothing breathes in step with anything else</li>
      </ul>
    </section>
    <section class="m3-sec"><h2 class="m3-h2">Alive before it is touched</h2>
      <p class="m3-p">Near the pointer, a shape drifts out of round and swells very slightly, so it reads as noticing you and not as sitting inert, waiting for a click. Move across the field.</p>
      <div class="ds-field" aria-hidden="true">${'<i></i>'.repeat(27)}</div></section>
    <section class="m3-sec"><h2 class="m3-h2">Two ways to breathe</h2>
      <p class="m3-p">One does not fit every shape. Round and square bodies bend: only their corners move, so the breath never fights a press or a slide. Pills breathe by mass instead, because bending their corners would collapse the caps into an ellipse.</p>
      <div class="ds-breaths">
        <div class="ds-breath"><div class="ds-breath__pen" style="--tile:var(--x-signal)"><i class="round"></i></div><div class="ds-breath__body"><p class="ds-curve__name">ui-bend</p><p class="ds-curve__role">Circles and controlled corners give moving elements character.</p></div></div>
        <div class="ds-breath"><div class="ds-breath__pen" style="--tile:var(--x-sky)"><i class="square"></i></div><div class="ds-breath__body"><p class="ds-curve__name">ui-bend-soft</p><p class="ds-curve__role">Squircles: checkboxes, icon tiles. A wider drift, or it would not show at this size.</p></div></div>
        <div class="ds-breath"><div class="ds-breath__pen" style="--tile:var(--x-pink)"><i class="pill"></i></div><div class="ds-breath__body"><p class="ds-curve__name">ui-breathe</p><p class="ds-curve__role">Pills and bars. Under two percent, wider as it gets shorter.</p></div></div>
      </div></section>
    <section class="m3-sec"><h2 class="m3-h2">Slower than anything you do</h2>
      <p class="m3-p">A breath takes longer than any interaction in the system, and it is out of step with itself, so several things breathing at once never fall into a pulse. The pause control in the rail stops all movement when needed.</p>
      <div data-tokens></div></section>`,
  (col) => {
    const field = col.querySelector('.ds-field');
    const cells = [...field.children];
    cells.forEach((c, k) => { c.style.animationDelay = (-(k * 0.37) % 2.8) + 's'; });
    let raf = 0, px = 0, py = 0, inside = false;
    const paint = () => {
      raf = 0;
      const reach = Math.max(120, field.getBoundingClientRect().width * 0.24);
      cells.forEach((c) => {
        let near = 0;
        if (inside) {
          const r = c.getBoundingClientRect();
          near = Math.max(0, 1 - Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) / reach);
        }
        c.style.setProperty('--near', near.toFixed(3));
        c.classList.toggle('is-near', near > 0.12);
      });
    };
    field.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; inside = true; if (!raf) raf = requestAnimationFrame(paint); });
    field.addEventListener('pointerleave', () => { inside = false; if (!raf) raf = requestAnimationFrame(paint); });
    onLeave(() => cancelAnimationFrame(raf));
    col.querySelector('[data-tokens]').append(liveNote(), tokenTable(['--ui-breath', '--ui-breath-slow']));
  });
}

const FOUNDATION_PAGES = { color: pageColor, type: pageType, shape: pageShape, motion: pageMotion, breathing: pageBreathing };

/* ============================================================
   Shell: rail, drawer, routing
   ============================================================ */
const host = document.getElementById('ds-view');
const app = document.querySelector('.m3-app');
const railItems = [...document.querySelectorAll('.m3-rail__item[data-section]')];
document.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = icon(node.dataset.icon); });
const fly = document.getElementById('ds-fly');

const flyLink = (href, name) => `<a class="m3-fly__link" href="${href}"><span>${esc(name)}</span></a>`;
const FLY = {
  foundations: () => '<p class="m3-fly__title">Foundations</p>' + flyLink('#/foundations', 'Overview') + FOUNDATIONS.map((f) => flyLink(`#/foundations/${f.id}`, f.name)).join(''),
  components: () => '<p class="m3-fly__title">Components</p>' + flyLink('#/components', 'All components') +
    GROUPS.map((g) => {
      const items = COMPONENTS.filter((c) => c.group === g);
      return items.length ? `<p class="m3-fly__group">${esc(g)}</p>` + items.map((c) => flyLink(`#/components/${c.id}`, c.name)).join('') : '';
    }).join(''),
};

/* the drawer slides out of the rail while the pointer is on a section */
let flyTimer = 0;
let flyFor = '';
function openFly(section) {
  clearTimeout(flyTimer);
  if (!FLY[section]) { closeFly(); return; }
  if (flyFor !== section) { fly.innerHTML = FLY[section](); flyFor = section; markFly(); }
  fly.classList.add('is-open');
}
function closeFly(now) {
  clearTimeout(flyTimer);
  flyTimer = setTimeout(() => fly.classList.remove('is-open'), now ? 0 : 220);
}
function markFly() {
  const here = location.hash.split('/').slice(0, 3).join('/') || '#/';
  fly.querySelectorAll('.m3-fly__link').forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === here));
}
railItems.forEach((item) => {
  item.addEventListener('pointerenter', () => openFly(item.dataset.section));
  item.addEventListener('focus', () => openFly(item.dataset.section));
  item.addEventListener('pointerleave', () => closeFly());
  item.addEventListener('blur', () => closeFly());
});
fly.addEventListener('pointerenter', () => clearTimeout(flyTimer));
fly.addEventListener('pointerleave', () => closeFly());
fly.addEventListener('click', (e) => { if (e.target.closest('a')) closeFly(true); });
fly.addEventListener('focusin', () => clearTimeout(flyTimer));
fly.addEventListener('focusout', () => closeFly());

/* The documentation uses one light shell; the custom cursor stays dark on paper. */
app.dataset.cursor = 'dark';

function route() {
  const [a, b, c] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (a === 'foundations') {
    const f = FOUNDATIONS.find((x) => x.id === b);
    if (f) return { section: 'foundations', make: () => FOUNDATION_PAGES[f.id](f) };
    return { section: 'foundations', make: pageFoundations };
  }
  if (a === 'components') {
    const comp = COMPONENTS.find((x) => x.id === b);
    if (comp) return { section: 'components', make: () => pageComponent(comp, c) };
    return { section: 'components', make: pageComponents };
  }
  if (a === 'examples') return { section: 'examples', make: () => pageExamples(icon) };
  return { section: 'home', make: pageHome };
}

function paintChrome(r) {
  railItems.forEach((item) => {
    const on = item.dataset.section === r.section;
    item.classList.toggle('is-on', on);
    if (on) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  markFly();
}

let current = null;
let visit = 0;
let lastPage = '';
async function go() {
  const mine = ++visit;
  const r = route();
  paintChrome(r);

  // Moving between the tabs of one component keeps your place on the page:
  // only a different page starts again from the top.
  const pageKey = location.hash.split('/').slice(0, 3).join('/');
  const samePage = pageKey === lastPage;
  lastPage = pageKey;

  if (current && !samePage) {
    current.classList.add('is-leaving');
    await sleep(reduce ? 0 : 130);
    if (mine !== visit) return;   // another page was asked for while this one was leaving
  }
  cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) {} });
  bindings = [];
  rebinds.length = 0;

  const keepY = window.scrollY;
  const page = r.make();
  if (samePage) page.el.style.animation = 'none';
  host.replaceChildren(page.el);
  current = page.el;
  document.title = page.title === 'Playground UI' ? 'Form · Playground design language' : page.title + ' · Form';

  if (samePage) {
    // keep the tabs where they are: land with the bar at the top, not the hero
    const bar = page.el.querySelector('.m3-tabs-wrap');
    const barY = bar ? bar.getBoundingClientRect().top + window.scrollY - 8 : 0;
    window.scrollTo(0, keepY < barY ? keepY : barY);
  } else {
    window.scrollTo(0, 0);
  }
}

window.addEventListener('hashchange', go);
go();

// Keep the skip link local to the current article instead of changing the route.
document.querySelector('.form-skip')?.addEventListener('click', (event) => {
  event.preventDefault();
  const article = document.getElementById('ds-view');
  article.focus({ preventScroll: true });
  article.scrollIntoView({ block: 'start', behavior: 'instant' });
});
