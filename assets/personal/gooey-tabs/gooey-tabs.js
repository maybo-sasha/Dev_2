/* ============================================================
   Gooey Tabs — a folder drawn as one outline, whose active tab is
   fused to the panel below it. Each year holds a small chart.

   Two departures from the component that inspired this:

     · it is a stroke, not a slab. The filter erodes a copy of the
       merged silhouette and subtracts it, leaving the outline —
       so the goo still happens, but to a line. The interior stays
       paper, which is what makes room for data.
     · the tabs carry figures rather than a file list, so switching
       compares something instead of just replacing text.

   Chart decisions follow the playground's own rules: one series so
   one ink and no legend (the figures name it), thin marks with
   rounded data-ends on the baseline, a recessive axis, and only the
   peak labelled outright — every other value waits for hover,
   because a number on every bar is noise rather than data.

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

/* experiments shipped per month */
const YEARS = [
  { value: '2024', data: [4, 6, 3, 8, 5, 9, 7, 11, 6, 9, 12, 8] },
  { value: '2023', data: [3, 4, 5, 4, 7, 6, 5, 8, 4, 6, 7, 5] },
  { value: '2022', data: [2, 3, 4, 3, 5, 4, 6, 5, 3, 4, 5, 6] },
  { value: '2021', data: [1, 2, 2, 3, 2, 4, 3, 5, 2, 3, 4, 3] },
];

/* ── the chart ───────────────────────────────────────────────
   A bar chart, because the job is magnitude across time. Drawn at a
   fixed viewBox and scaled by CSS, so the geometry below is in one
   coordinate space and never has to be recomputed on resize. */
const W = 320, H = 78, PAD_B = 12, GAP = 2;

function chart(data) {
  const n = data.length;
  const slot = W / n;
  /* Thin marks. Filling the slot turns a bar chart into a row of slabs —
     the ink stops reading as a measured quantity and starts reading as a
     block of colour. The bar is capped well under the slot and centred in
     it, so the gaps carry the rhythm. */
  const bw = Math.min(slot - GAP, 11);
  const max = Math.max(...data);
  const peak = data.indexOf(max);
  const plot = H - PAD_B;
  const r = Math.min(3, bw / 2);   // rounded data-end, never wider than the bar

  const cols = data.map((v, i) => {
    const h = Math.max((v / max) * (plot - 12), 2);
    const x = i * slot + (slot - bw) / 2;
    const y = plot - h;
    /* the bar is a path so only the top corners round — the end that
       sits on the baseline stays square and anchored to it */
    const d = `M${x} ${plot} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} L${x + bw - r} ${y} Q${x + bw} ${y} ${x + bw} ${y + r} L${x + bw} ${plot} Z`;
    return `
      <g class="gt__col">
        <title>${FULL[i]} — ${v} experiments</title>
        <path class="gt__bar" d="${d}"/>
        <text class="gt__val${i === peak ? ' is-peak' : ''}" x="${x + bw / 2}" y="${y - 4}">${v}</text>
        <rect class="gt__hit" x="${i * slot}" y="0" width="${slot}" height="${plot}"/>
      </g>`;
  }).join('');

  /* four ticks, not twelve — a label under every bar is clutter at
     this width and the shape already reads as a year */
  const ticks = [0, 3, 6, 9].map((i) => {
    const x = i * slot + slot / 2;
    return `<text class="gt__tick" x="${x}" y="${H - 2}" text-anchor="middle">${MONTHS[i]}</text>`;
  }).join('');

  return `
    <svg class="gt__chart" viewBox="0 0 ${W} ${H}" role="img"
         aria-label="Experiments shipped per month. Peak ${max} in ${FULL[peak]}.">
      ${cols}
      <line class="gt__axis" x1="0" y1="${plot + 0.5}" x2="${W}" y2="${plot + 0.5}"/>
      ${ticks}
    </svg>`;
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function viewHTML(y) {
  const total = y.data.reduce((a, b) => a + b, 0);
  const peak = Math.max(...y.data);
  const best = FULL[y.data.indexOf(peak)];
  return `
    <div class="gt__inner">
      <div class="gt__stats">
        <div class="gt__stat"><b>${total}</b><span>Shipped</span></div>
        <div class="gt__stat"><b>${peak}</b><span>Best · ${esc(best.slice(0, 3))}</span></div>
        <div class="gt__stat"><b>${median(y.data)}</b><span>Median</span></div>
      </div>
      ${chart(y.data)}
    </div>`;
}

let uid = 0;

export function createGooeyTabs({ tabs = YEARS, strength = 11, weight = 1.6 } = {}) {
  const id = `gooey-tabs-${++uid}`;
  const n = tabs.length;

  const root = el(`
  <div class="gt ui" data-cursor="dark" style="--gt-n:${n};--gt-goo:url(#${id})">
    <svg class="gt__def" aria-hidden="true" focusable="false">
      <defs>
        <filter id="${id}">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${strength}" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"/>
          <!-- erode a copy of the merged shape and subtract it: what is
               left is the outline. This is the whole difference between
               a gooey slab and a gooey stroke. -->
          <feMorphology in="goo" operator="erode" radius="${weight}" result="core"/>
          <feComposite in="goo" in2="core" operator="out"/>
        </filter>
      </defs>
    </svg>

    <div class="gt__wrap">
      <div class="gt__goo" aria-hidden="true">
        <div class="gt__tabsrow"><i class="gt__pill"></i></div>
        <div class="gt__body"></div>
      </div>

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
