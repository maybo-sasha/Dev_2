/* ============================================================
   Gooey Tabs — a folder whose active tab is fused to the panel
   below it, dressed like Morph Nav: paper surface, soft shadow,
   hairline stroke. Two filtered layers over identical geometry —
   one merged and filled, one merged and eroded to leave the
   outline — so the goo happens to both in step.

   Each tab answers a different question, so each carries a
   different form. That is the rule, not variety for its own sake:

     2024  how much, month by month      → bars
     2023  how it accumulated            → line + area
     2022  which kinds, ranked           → lollipop
     2021  one number worth stating      → hero + sparkline

   Shared rules, since every form here is a single series: one ink
   and no legend (the figures name it), thin marks, rounded
   data-ends anchored to the baseline, a recessive axis, a surface
   ring on any marker that overlaps a line, and only the peak
   labelled outright — every other value waits for hover, because a
   number on every mark is noise rather than data.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/gooey-tabs/gooey-tabs.css">
     <div data-gooey-tabs></div>
     <script type="module" src="./assets/personal/gooey-tabs/gooey-tabs.js"></script>
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const W = 320, H = 76, PAD_B = 12;

/* ── magnitude, month by month ─────────────────────────────── */
function bars(data) {
  const n = data.length, slot = W / n;
  /* Thin marks. Filling the slot turns a bar chart into a row of slabs —
     the ink stops reading as a measured quantity. Capped well under the
     slot and centred, so the gaps carry the rhythm. */
  const bw = Math.min(slot - 2, 11);
  const max = Math.max(...data), peak = data.indexOf(max);
  const plot = H - PAD_B, r = Math.min(3, bw / 2);

  const cols = data.map((v, i) => {
    const h = Math.max((v / max) * (plot - 12), 2);
    const x = i * slot + (slot - bw) / 2, y = plot - h;
    /* a path, so only the top corners round — the end on the baseline
       stays square and anchored to it */
    const d = `M${x} ${plot} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} L${x + bw - r} ${y} Q${x + bw} ${y} ${x + bw} ${y + r} L${x + bw} ${plot} Z`;
    return `<g class="gt__col"><title>${FULL[i]} — ${v}</title>
      <path class="gt__bar" d="${d}"/>
      <text class="gt__val${i === peak ? ' is-peak' : ''}" x="${x + bw / 2}" y="${y - 4}">${v}</text>
      <rect class="gt__hit" x="${i * slot}" y="0" width="${slot}" height="${plot}"/></g>`;
  }).join('');

  const ticks = [0, 3, 6, 9].map((i) =>
    `<text class="gt__tick" x="${i * slot + slot / 2}" y="${H - 2}" text-anchor="middle">${MONTHS[i]}</text>`).join('');

  return `<svg class="gt__chart" viewBox="0 0 ${W} ${H}" role="img"
    aria-label="Experiments per month. Peak ${max} in ${FULL[peak]}.">
    ${cols}<line class="gt__axis" x1="0" y1="${plot + 0.5}" x2="${W}" y2="${plot + 0.5}"/>${ticks}</svg>`;
}

/* ── change over time ──────────────────────────────────────── */
function trend(data) {
  const n = data.length, plot = H - PAD_B;
  const run = data.reduce((a, v) => (a.push((a.at(-1) || 0) + v), a), []);
  const max = run.at(-1);
  const x = (i) => (i / (n - 1)) * W;
  const y = (v) => plot - (v / max) * (plot - 14);

  const line = run.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${plot} L0 ${plot} Z`;

  const cols = run.map((v, i) => `<g class="gt__col"><title>${FULL[i]} — ${v} to date</title>
    <text class="gt__val" x="${x(i).toFixed(1)}" y="${(y(v) - 7).toFixed(1)}">${v}</text>
    <rect class="gt__hit" x="${(x(i) - W / n / 2).toFixed(1)}" y="0" width="${(W / n).toFixed(1)}" height="${plot}"/></g>`).join('');

  const ticks = [0, 3, 6, 9].map((i) =>
    `<text class="gt__tick" x="${x(i).toFixed(1)}" y="${H - 2}" text-anchor="middle">${MONTHS[i]}</text>`).join('');

  return `<svg class="gt__chart" viewBox="0 0 ${W} ${H}" role="img"
    aria-label="Cumulative experiments across the year, ending at ${max}.">
    <path class="gt__area" d="${area}"/>
    <path class="gt__line" d="${line}"/>
    <circle class="gt__dot gt__dot--ring" cx="${W}" cy="${y(max).toFixed(1)}" r="4"/>
    <text class="gt__val is-peak" x="${W - 8}" y="${(y(max) - 8).toFixed(1)}">${max}</text>
    ${cols}<line class="gt__axis" x1="0" y1="${plot + 0.5}" x2="${W}" y2="${plot + 0.5}"/>${ticks}</svg>`;
}

/* ── ranked categories ─────────────────────────────────────────
   A lollipop rather than bars: at this size the label column eats
   most of the width, and a thin stem with a dot carries the value
   without the ink of a full bar. */
function lolli(items) {
  const rows = items.length, step = (H - 8) / rows, x0 = 88;
  const max = Math.max(...items.map((i) => i.v));
  const peak = items.findIndex((i) => i.v === max);

  return `<svg class="gt__chart" viewBox="0 0 ${W} ${H}" role="img"
    aria-label="Experiments by kind. Most: ${esc(items[peak].k)}, ${max}.">
    ${items.map((it, i) => {
      const y = 8 + i * step + step / 2;
      const xv = x0 + (it.v / max) * (W - x0 - 22);
      return `<g class="gt__col"><title>${esc(it.k)} — ${it.v}</title>
        <text class="gt__lab" x="0" y="${(y + 2.6).toFixed(1)}">${esc(it.k)}</text>
        <line class="gt__stem" x1="${x0}" y1="${y.toFixed(1)}" x2="${xv.toFixed(1)}" y2="${y.toFixed(1)}"/>
        <circle class="gt__lolli" cx="${xv.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/>
        <text class="gt__val${i === peak ? ' is-peak' : ''}" x="${(xv + 12).toFixed(1)}" y="${(y + 3).toFixed(1)}">${it.v}</text>
        <rect class="gt__hit" x="0" y="${(8 + i * step).toFixed(1)}" width="${W}" height="${step.toFixed(1)}"/></g>`;
    }).join('')}
    <line class="gt__axis" x1="${x0}" y1="4" x2="${x0}" y2="${H - 4}"/></svg>`;
}

/* ── one number, with its shape underneath ─────────────────── */
function spark(data) {
  const n = data.length, h = 30;
  const max = Math.max(...data), min = Math.min(...data);
  const x = (i) => (i / (n - 1)) * W;
  const y = (v) => h - 3 - ((v - min) / (max - min || 1)) * (h - 8);
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return `<svg class="gt__chart" viewBox="0 0 ${W} ${h}" role="img" aria-label="Monthly shape across the year.">
    <path class="gt__spark" d="${d}"/>
    <circle class="gt__dot gt__dot--ring" cx="${W}" cy="${y(data.at(-1)).toFixed(1)}" r="3.5"/></svg>`;
}

/* ── data ──────────────────────────────────────────────────── */
const YEARS = [
  { value: '2024', form: 'bars',  label: 'Shipped per month',  data: [4, 6, 3, 8, 5, 9, 7, 11, 6, 9, 12, 8] },
  { value: '2023', form: 'trend', label: 'Cumulative, to date', data: [3, 4, 5, 4, 7, 6, 5, 8, 4, 6, 7, 5] },
  { value: '2022', form: 'lolli', label: 'By kind, ranked',
    items: [{ k: 'Interface', v: 18 }, { k: 'Motion', v: 13 }, { k: 'Type', v: 9 }, { k: 'Shader', v: 5 }] },
  { value: '2021', form: 'hero',  label: 'The year in one number', data: [1, 2, 2, 3, 2, 4, 3, 5, 2, 3, 4, 3],
    note: 'The first year of keeping any of it. Everything since is a variation on these thirty-four.' },
];

const median = (a) => {
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const stat = (b, s) => `<div class="gt__stat"><b>${b}</b><span>${esc(s)}</span></div>`;

function viewHTML(y) {
  const form = `<p class="gt__form">${esc(y.label)}</p>`;

  if (y.form === 'lolli') {
    const total = y.items.reduce((a, i) => a + i.v, 0);
    return `<div class="gt__inner">
      <div class="gt__stats">${stat(total, 'Shipped')}${stat(y.items.length, 'Kinds')}${stat(y.items[0].v, 'Most · ' + y.items[0].k)}</div>
      ${form}${lolli(y.items)}</div>`;
  }

  const total = y.data.reduce((a, b) => a + b, 0);
  const peak = Math.max(...y.data);
  const best = FULL[y.data.indexOf(peak)];

  if (y.form === 'hero') {
    return `<div class="gt__inner">
      <div class="gt__hero"><b>${total}</b><p>${esc(y.note)}</p></div>
      ${form}${spark(y.data)}</div>`;
  }

  return `<div class="gt__inner">
    <div class="gt__stats">${stat(total, 'Shipped')}${stat(peak, 'Best · ' + best.slice(0, 3))}${stat(median(y.data), 'Median')}</div>
    ${form}${y.form === 'trend' ? trend(y.data) : bars(y.data)}</div>`;
}

let uid = 0;

export function createGooeyTabs({ tabs = YEARS, strength = 11, weight = 1.4 } = {}) {
  const id = `gooey-tabs-${++uid}`;
  const n = tabs.length;

  /* the same shapes, rendered twice — once to be filled, once to be
     reduced to an outline */
  const shapes = '<div class="gt__tabsrow"><i class="gt__pill"></i></div><div class="gt__body"></div>';

  const root = el(`
  <div class="gt ui" data-cursor="dark" style="--gt-n:${n};--gt-fill:url(#${id}-f);--gt-line:url(#${id}-l)">
    <svg class="gt__def" aria-hidden="true" focusable="false">
      <defs>
        <filter id="${id}-f">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${strength}" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"/>
        </filter>
        <filter id="${id}-l">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${strength}" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"/>
          <!-- erode a copy of the merged shape and subtract it: what is
               left is the hairline around the merged silhouette -->
          <feMorphology in="goo" operator="erode" radius="${weight}" result="core"/>
          <feComposite in="goo" in2="core" operator="out"/>
        </filter>
      </defs>
    </svg>

    <div class="gt__wrap">
      <div class="gt__goo gt__goo--fill" aria-hidden="true">${shapes}</div>
      <div class="gt__goo gt__goo--line" aria-hidden="true">${shapes}</div>

      <div class="gt__top">
        <div class="gt__tabs" role="tablist" aria-label="Years">
          ${tabs.map((t, i) => `
          <button class="gt__tab" type="button" role="tab" data-i="${i}"
                  id="${id}-tab-${i}" aria-controls="${id}-panel"
                  aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}">${esc(t.value)}</button>`).join('')}
        </div>
        <div class="gt__panel" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-tab-0">
          <div class="gt__view">${viewHTML(tabs[0])}</div>
        </div>
      </div>
    </div>

    <p class="gt__cap">Switch years — the tab <b>pours</b> across</p>
  </div>`);

  const view = root.querySelector('.gt__view');
  const panel = root.querySelector('.gt__panel');
  const tabEls = [...root.querySelectorAll('.gt__tab')];
  let active = 0;
  let swapping = null;

  function select(i) {
    if (i === active || i < 0 || i >= n) return;
    active = i;

    root.style.setProperty('--gt-i', String(i));
    tabEls.forEach((b, k) => {
      b.setAttribute('aria-selected', String(k === i));
      b.setAttribute('tabindex', k === i ? '0' : '-1');
    });
    panel.setAttribute('aria-labelledby', `${id}-tab-${i}`);

    clearTimeout(swapping);
    view.classList.add('is-leaving');
    swapping = setTimeout(() => {
      view.classList.remove('is-leaving');
      view.classList.add('is-entering');
      view.innerHTML = viewHTML(tabs[i]);
      /* commit the entering pose with a reflow and release in the same
         task — waiting on rAF strands it invisible whenever frames are
         throttled, e.g. an off-screen tile or a background tab */
      void view.offsetWidth;
      view.classList.remove('is-entering');
    }, 200);
  }

  tabEls.forEach((b, i) => b.addEventListener('click', () => select(i)));

  root.querySelector('.gt__tabs').addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step) {
      e.preventDefault();
      const next = (active + step + n) % n;
      select(next);
      tabEls[next].focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : n - 1;
      select(next);
      tabEls[next].focus();
    }
  });

  root.style.setProperty('--gt-i', '0');

  return { el: root, select, get value() { return tabs[active].value; } };
}

document.querySelectorAll('[data-gooey-tabs]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createGooeyTabs({ strength: Number(host.dataset.strength) || 11 }).el);
});
