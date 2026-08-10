/* ============================================================
   Multi Select — a chip multi-select where the choice travels.

   Pick a row and it inks over from wherever you pressed, squeezes
   down to a dot, flies up into the field and unfolds into a chip.
   Chosen options leave the list; clearing a chip puts them back in
   their original place.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/multi-select/multi-select.css">
     <div data-multi-select data-accent="#A06BF0"></div>
     <script type="module" src="./assets/personal/multi-select/multi-select.js"></script>
   ============================================================ */

const OPTIONS = ['Figma', 'Sketch', 'Photoshop', 'After Effects', 'Framer'];

/* timings — the whole pick reads as one gesture, ~0.9s end to end */
const T = { press: 230, squeeze: 190, fly: 360, unfold: 240 };

const GAP = 14; /* .msel__card margin-top, added back into the panel height */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* points down when closed, and the open state rotates it up */
const CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let uid = 0;

export function createMultiSelect({
  accent = '#A06BF0',
  options = OPTIONS,
  label = 'Tools',
  placeholder = 'Add tools',
  theme = 'light',
} = {}) {
  const id = `msel-${++uid}`;

  const root = el(`
  <div class="msel${theme === 'dark' ? ' msel--dark' : ''}" style="--ms-accent:${accent}">
    <div class="msel__aura"></div>
    <div class="msel__wrap">
      <div class="msel__caption"><span>${esc(label)}</span><span><b class="msel__count">0</b> selected</span></div>

      <div class="msel__field" role="combobox" tabindex="0"
           aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-list" aria-label="${esc(placeholder)}">
        <div class="msel__inner">
          <span class="msel__ph">${esc(placeholder)}</span>
        </div>
        <span class="msel__caret">${CHEVRON}</span>
      </div>

      <div class="msel__panel">
        <div class="msel__card">
          <div class="msel__list" id="${id}-list" role="listbox" aria-multiselectable="true"></div>
          <p class="msel__empty" hidden>Every tool is in.</p>
        </div>
      </div>
    </div>
  </div>`);

  const stage   = root;
  const field   = root.querySelector('.msel__field');
  const inner   = root.querySelector('.msel__inner');
  const ph      = root.querySelector('.msel__ph');
  const panel   = root.querySelector('.msel__panel');
  const card    = root.querySelector('.msel__card');
  const list    = root.querySelector('.msel__list');
  const empty   = root.querySelector('.msel__empty');
  const countEl = root.querySelector('.msel__count');

  let open = false;
  let busy = false;      /* a pick is mid-flight */
  let active = -1;       /* highlighted row, index into items */

  /* ── Model ─────────────────────────────────────────────── */
  const items = options.map((name, i) => {
    const row = el(`
      <div class="msel__opt" role="option" id="${id}-o${i}" aria-selected="false">
        <span class="msel__wash"></span>
        <span class="msel__opt-label">${esc(name)}</span>
      </div>`);
    list.appendChild(row);
    return { name, el: row, chip: null, chosen: false };
  });

  /* ── Height plumbing ───────────────────────────────────── */
  /* The field and the panel both animate their height, so every
     reflow — a chip wrapping, a row leaving — is a transition
     rather than a jump. A ResizeObserver on the natural-height
     content keeps the animated wrapper in step. */
  const syncField = () => { field.style.height = `${inner.offsetHeight}px`; };
  const syncPanel = () => { panel.style.height = open ? `${card.offsetHeight + GAP}px` : '0px'; };

  new ResizeObserver(syncField).observe(inner);
  new ResizeObserver(syncPanel).observe(card);

  /* first paint: size both without animating in from zero */
  const boot = () => {
    const prev = [field.style.transition, panel.style.transition];
    field.style.transition = panel.style.transition = 'none';
    syncField();
    syncPanel();
    void field.offsetHeight;
    field.style.transition = prev[0];
    panel.style.transition = prev[1];
  };

  /* ── Open / close ──────────────────────────────────────── */
  function setOpen(v) {
    if (open === v) return;
    open = v;
    root.classList.toggle('is-open', open);
    field.setAttribute('aria-expanded', String(open));
    if (!open) setActive(-1);
    syncPanel();
  }

  function setActive(i) {
    active = i;
    items.forEach((it, n) => it.el.classList.toggle('is-active', n === i && !it.chosen));
    const cur = i > -1 && items[i] && !items[i].chosen ? items[i].el.id : '';
    if (cur) field.setAttribute('aria-activedescendant', cur);
    else field.removeAttribute('aria-activedescendant');
  }

  const live = () => items.filter((it) => !it.chosen);

  function refresh() {
    const n = items.length - live().length;
    countEl.textContent = String(n);
    empty.hidden = live().length > 0;
  }

  /* ── Picking ───────────────────────────────────────────── */
  function pick(item, ev) {
    if (busy || item.chosen) return;
    busy = true;
    item.chosen = true;
    item.el.setAttribute('aria-selected', 'true');
    setActive(-1);
    item.el.classList.add('is-active');

    if (reduced()) {
      item.el.remove();
      addChip(item, null);
      busy = false;
      refresh();
      return;
    }

    const row = item.el;
    const rect = row.getBoundingClientRect();
    const px = ev ? ev.clientX - rect.left : rect.width * 0.28;
    const py = ev ? ev.clientY - rect.top : rect.height / 2;

    /* radius that still covers the far corner, plus the overspill
       past the card edge that gives the press its rounded cap */
    const r = Math.hypot(Math.max(px, rect.width - px), Math.max(py, rect.height - py)) + 18;

    const ink = el('<span class="msel__ink"></span>');
    ink.style.left = `${px - r}px`;
    ink.style.top = `${py - r}px`;
    ink.style.width = ink.style.height = `${r * 2}px`;
    ink.style.transition = `transform ${T.press}ms cubic-bezier(.22,.7,.3,1)`;
    row.appendChild(ink);
    void ink.offsetWidth;
    ink.style.transform = 'scale(1)';

    /* press → squeeze the ink down into a 22px dot at the pointer */
    setTimeout(() => {
      ink.style.transition = `transform ${T.squeeze}ms cubic-bezier(.5,0,.35,1)`;
      ink.style.transform = `scale(${11 / r})`;
      row.classList.remove('is-active');
      row.querySelector('.msel__opt-label').style.opacity = '0';
    }, T.press);

    /* dot detaches, row folds away, chip slot opens up */
    setTimeout(() => {
      const rr = row.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const x0 = rr.left + px - sr.left;
      const y0 = rr.top + py - sr.top;

      ink.remove();
      row.classList.add('is-leaving');
      /* the chip may be cleared before the fold-away finishes — only
         pull the row out if it is still spoken for */
      setTimeout(() => { if (item.chosen) row.remove(); }, 400);

      const chip = addChip(item, 'landing');
      busy = false;
      refresh();

      const dot = el('<span class="msel__dot"></span>');
      dot.style.left = `${x0}px`;
      dot.style.top = `${y0}px`;
      stage.appendChild(dot);

      /* Hand-tweened rather than a CSS transition: the chip's slot is
         still widening underneath, so the target moves. Re-reading it
         every frame keeps the dot locked onto where it will land. */
      const start = performance.now();
      const flight = (now) => {
        const p = Math.min(1, (now - start) / T.fly);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const cr = chip.getBoundingClientRect();
        const s2 = stage.getBoundingClientRect();
        const dx = cr.left + cr.width / 2 - s2.left - x0;
        const dy = cr.top + cr.height / 2 - s2.top - y0;
        dot.style.transform = `translate(${dx * e}px, ${dy * e}px) scale(${1 + 0.5 * e})`;
        dot.style.opacity = p < 0.72 ? '1' : String(1 - (p - 0.72) / 0.28);
        if (p < 1) requestAnimationFrame(flight);
        else {
          dot.remove();
          chip.classList.remove('is-landing');
          setTimeout(() => chip.classList.remove('is-ghost'), T.unfold);
        }
      };
      requestAnimationFrame(flight);
    }, T.press + T.squeeze);
  }

  /* ── Chips ─────────────────────────────────────────────── */
  function addChip(item, mode) {
    const chip = el(`
      <span class="msel__chip is-ghost${mode === 'landing' ? ' is-landing' : ''}">
        <span class="msel__chip-label">${esc(item.name)}</span>
        <button class="msel__chip-x" type="button" aria-label="Remove ${esc(item.name)}">${X}</button>
      </span>`);
    /* start with no width so the slot widens under the incoming dot
       instead of snapping open and shoving the other chips sideways */
    if (mode === 'landing') chip.style.minWidth = '0px';
    inner.insertBefore(chip, ph);
    item.chip = chip;

    chip.querySelector('.msel__chip-x').addEventListener('click', (e) => {
      e.stopPropagation();
      drop(item);
    });

    requestAnimationFrame(() => {
      if (mode === 'landing') chip.style.minWidth = '';
      else chip.classList.remove('is-ghost');
    });
    return chip;
  }

  /* clearing a chip returns the option to its original slot */
  function drop(item) {
    if (!item.chosen) return;
    item.chosen = false;
    item.el.setAttribute('aria-selected', 'false');

    const chip = item.chip;
    item.chip = null;
    chip.classList.add('is-ghost');
    chip.style.minWidth = '0px';
    setTimeout(() => chip.classList.add('is-landing'), 150);
    setTimeout(() => { chip.remove(); }, 430);

    const after = items.slice(items.indexOf(item) + 1).find((i) => !i.chosen && i.el.parentNode);
    list.insertBefore(item.el, after ? after.el : null);
    item.el.classList.remove('is-leaving');
    item.el.querySelector('.msel__opt-label').style.opacity = '';
    item.el.classList.add('is-entering');
    requestAnimationFrame(() => requestAnimationFrame(() => item.el.classList.remove('is-entering')));

    refresh();
  }

  /* ── Input ─────────────────────────────────────────────── */
  field.addEventListener('click', () => setOpen(!open));

  list.addEventListener('pointerover', (e) => {
    const row = e.target.closest('.msel__opt');
    if (!row || busy) return;
    setActive(items.findIndex((it) => it.el === row));
  });
  list.addEventListener('pointerleave', () => { if (!busy) setActive(-1); });

  /* on pointerdown, not click — the ink should answer the press itself */
  list.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    const row = e.target.closest('.msel__opt');
    if (!row) return;
    e.preventDefault();
    const item = items.find((it) => it.el === row);
    if (item) pick(item, e);
  });

  field.addEventListener('keydown', (e) => {
    const pool = live();

    if (e.key === 'Escape') { setOpen(false); return; }

    if (e.key === 'Backspace') {
      const last = [...items].reverse().find((it) => it.chosen);
      if (last) { e.preventDefault(); drop(last); }
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); }
      if (!pool.length) return;
      const cur = pool.findIndex((it) => items.indexOf(it) === active);
      const next = e.key === 'ArrowDown'
        ? (cur + 1) % pool.length
        : (cur <= 0 ? pool.length : cur) - 1;
      setActive(items.indexOf(pool[next]));
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      if (active > -1 && items[active] && !items[active].chosen) pick(items[active], null);
      else setOpen(false);
    }
  });

  /* clicking away closes — but only for clicks outside this component */
  document.addEventListener('pointerdown', (e) => {
    if (open && !root.contains(e.target)) setOpen(false);
  });

  boot();
  refresh();

  return {
    el: root,
    open: () => setOpen(true),
    close: () => setOpen(false),
    value: () => items.filter((it) => it.chosen).map((it) => it.name),
  };
}

document.querySelectorAll('[data-multi-select]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createMultiSelect({
    accent: host.dataset.accent || '#A06BF0',
    theme: host.dataset.theme || 'light',
  }).el);
});
