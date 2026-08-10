/* ============================================================
   Smart Select — a searchable multi-select. Type to filter,
   ↑/↓ to move, Enter to pick, Backspace to peel the last chip,
   and anything unmatched can be created on the spot.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/smart-select/smart-select.css">
     <div data-smart-select data-accent="#F97316"></div>
     <script type="module" src="./assets/personal/smart-select/smart-select.js"></script>
   ============================================================ */

const OPTIONS = [
  { group: 'Craft', name: 'Design systems', hint: 'Tokens, components, docs', c1: '#FFB27A', c2: '#F2762B' },
  { group: 'Craft', name: 'Motion design', hint: 'Timing, easing, choreography', c1: '#FF9BC4', c2: '#EC3F80' },
  { group: 'Craft', name: 'Prototyping', hint: 'Clickable and coded', c1: '#FFD37A', c2: '#F0A81E' },
  { group: 'Craft', name: 'Game UI', hint: 'HUDs, meta screens, juice', c1: '#B69BFF', c2: '#7A4BF0' },
  { group: 'Tools', name: 'Figma', hint: 'Variables, auto layout', c1: '#7FE3FF', c2: '#1F86D8' },
  { group: 'Tools', name: 'Blender', hint: 'Modelling and lighting', c1: '#FFB27A', c2: '#E2452B' },
  { group: 'Tools', name: 'After Effects', hint: 'Compositing and edit', c1: '#9F8BFF', c2: '#5B3BE0' },
  { group: 'Code', name: 'HTML & CSS', hint: 'Layout, animation', c1: '#86F2C8', c2: '#12B981' },
  { group: 'Code', name: 'JavaScript', hint: 'Vanilla and framework', c1: '#FFD37A', c2: '#D98A0E' },
  { group: 'Code', name: 'Three.js', hint: 'Shaders and scenes', c1: '#7FE3FF', c2: '#2A5BE0' },
];

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function highlight(text, q) {
  if (!q) return esc(text);
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}

const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

let uid = 0;

export function createSmartSelect({ accent = '#F97316', options = OPTIONS, max = 6 } = {}) {
  const id = `ssel-${++uid}`;
  const items = options.map((o) => ({ ...o }));
  const groups = [...new Set(items.map((o) => o.group))];

  const root = el(`
  <div class="ssel" style="--ss-accent:${accent}">
    <div class="ssel__wrap">
      <div class="ssel__caption"><span>Skills · pick up to ${max}</span><span><b class="ssel__count">0</b> selected</span></div>

      <div class="ssel__field">
        <span class="ssel__chips"></span>
        <input class="ssel__input" type="text" placeholder="Search skills…" role="combobox"
               aria-expanded="false" aria-controls="${id}" aria-autocomplete="list" autocomplete="off" spellcheck="false" />
        <button class="ssel__caret" type="button" tabindex="-1" aria-label="Toggle list">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>
        </button>
      </div>

      <div class="ssel__menu" id="${id}" role="listbox" aria-multiselectable="true">
        <ul class="ssel__list">
          ${groups
            .map(
              (g) => `
          <li class="ssel__group" data-group="${esc(g)}">${esc(g)}</li>
          ${items
            .map((o, i) => [o, i])
            .filter(([o]) => o.group === g)
            .map(
              ([o, i]) => `
          <li>
            <button class="ssel__opt" type="button" role="option" aria-selected="false" data-i="${i}" style="--c1:${o.c1};--c2:${o.c2}">
              <span class="ssel__dot"></span>
              <span class="ssel__name" data-name>${esc(o.name)}<small>${esc(o.hint)}</small></span>
              <span class="ssel__check">${TICK}</span>
            </button>
          </li>`
            )
            .join('')}`
            )
            .join('')}
          <li>
            <button class="ssel__opt ssel__create" type="button">
              <span class="ssel__dot"></span>
              <span class="ssel__name">Create “<b class="ssel__term"></b>”<small>Add it as a new skill</small></span>
              <span class="ssel__check">${TICK}</span>
            </button>
          </li>
        </ul>
        <div class="ssel__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>↵</kbd> pick · <kbd>⌫</kbd> remove</span>
          <button class="ssel__clear" type="button">Clear all</button>
        </div>
      </div>
    </div>
  </div>`);

  const field = root.querySelector('.ssel__field');
  const chips = root.querySelector('.ssel__chips');
  const input = root.querySelector('.ssel__input');
  const caret = root.querySelector('.ssel__caret');
  const menu = root.querySelector('.ssel__menu');
  const list = root.querySelector('.ssel__list');
  const createBtn = root.querySelector('.ssel__create');
  const termEl = root.querySelector('.ssel__term');
  const countEl = root.querySelector('.ssel__count');

  let open = false;
  let query = '';
  let current = 0;
  let visible = [];
  const picked = new Set();

  const optEls = () => [...list.querySelectorAll('.ssel__opt:not(.ssel__create)')];
  const groupEls = () => [...list.querySelectorAll('.ssel__group')];

  function renderChips() {
    chips.innerHTML = [...picked]
      .map(
        (i) => `
      <span class="ssel__chip" style="--c1:${items[i].c1};--c2:${items[i].c2}">
        ${esc(items[i].name)}
        <button type="button" data-drop="${i}" aria-label="Remove ${esc(items[i].name)}">${X}</button>
      </span>`
      )
      .join('');
    countEl.textContent = picked.size;
    root.classList.toggle('has-picks', picked.size > 0);
    input.placeholder = picked.size ? 'Add another…' : 'Search skills…';
  }

  function paint() {
    const all = [...optEls(), createBtn];
    all.forEach((b) => b.classList.remove('is-current'));
    const cur = all.find((b) => Number(b.dataset.i) === current || (current === -1 && b === createBtn));
    if (cur) {
      cur.classList.add('is-current');
      cur.scrollIntoView({ block: 'nearest' });
    }
  }

  function filter() {
    const q = query.trim();
    visible = [];

    optEls().forEach((btn) => {
      const i = Number(btn.dataset.i);
      const o = items[i];
      const hit = !q || (o.name + ' ' + o.hint + ' ' + o.group).toLowerCase().includes(q.toLowerCase());
      btn.parentElement.classList.toggle('is-hidden', !hit);
      btn.querySelector('[data-name]').innerHTML = highlight(o.name, q) + `<small>${esc(o.hint)}</small>`;
      if (hit) visible.push(i);
    });

    groupEls().forEach((g) => {
      const name = g.dataset.group;
      g.classList.toggle('is-hidden', !visible.some((i) => items[i].group === name));
    });

    root.classList.toggle('is-empty', visible.length === 0 && q.length > 0);
    termEl.textContent = q;

    if (!visible.includes(current)) current = visible.length ? visible[0] : -1;
    paint();
  }

  function setOpen(next) {
    if (open === next) return;
    open = next;
    root.classList.toggle('is-open', open);
    input.setAttribute('aria-expanded', String(open));
    if (open) filter();
  }

  function toggle(i) {
    if (picked.has(i)) picked.delete(i);
    else {
      if (picked.size >= max) return;
      picked.add(i);
    }
    const btn = optEls().find((b) => Number(b.dataset.i) === i);
    if (btn) {
      btn.classList.toggle('is-picked', picked.has(i));
      btn.setAttribute('aria-selected', String(picked.has(i)));
    }
    renderChips();
  }

  function create() {
    const name = query.trim();
    if (!name) return;
    items.push({ group: 'Craft', name, hint: 'Added by you', c1: '#C8C8D8', c2: '#8A8AA0' });
    const i = items.length - 1;

    const li = el(`
      <li>
        <button class="ssel__opt is-picked" type="button" role="option" aria-selected="true" data-i="${i}" style="--c1:#C8C8D8;--c2:#8A8AA0">
          <span class="ssel__dot"></span>
          <span class="ssel__name" data-name>${esc(name)}<small>Added by you</small></span>
          <span class="ssel__check">${TICK}</span>
        </button>
      </li>`);
    li.querySelector('.ssel__opt').addEventListener('click', () => toggle(i));
    list.insertBefore(li, createBtn.parentElement);

    picked.add(i);
    renderChips();
    input.value = '';
    query = '';
    filter();
  }

  // ── wiring ───────────────────────────────────────────────
  field.addEventListener('click', (e) => {
    const drop = e.target.closest('[data-drop]');
    if (drop) { toggle(Number(drop.dataset.drop)); return; }
    if (e.target === caret || caret.contains(e.target)) { setOpen(!open); input.focus(); return; }
    setOpen(true);
    input.focus();
  });

  input.addEventListener('input', () => {
    query = input.value;
    setOpen(true);
    filter();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      const pool = visible.length ? visible : [-1];
      const at = pool.indexOf(current);
      current = pool[(at + (e.key === 'ArrowDown' ? 1 : -1) + pool.length) % pool.length];
      paint();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (current === -1) create();
      else toggle(current);
    } else if (e.key === 'Backspace' && !input.value && picked.size) {
      e.preventDefault();
      toggle([...picked].pop());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (query) { input.value = ''; query = ''; filter(); }
      else setOpen(false);
    }
  });

  optEls().forEach((btn) => {
    const i = Number(btn.dataset.i);
    btn.addEventListener('click', () => { toggle(i); input.focus(); });
    btn.addEventListener('mouseenter', () => { current = i; paint(); });
  });
  createBtn.addEventListener('click', create);
  createBtn.addEventListener('mouseenter', () => { current = -1; paint(); });

  root.querySelector('.ssel__clear').addEventListener('click', () => {
    picked.clear();
    optEls().forEach((b) => { b.classList.remove('is-picked'); b.setAttribute('aria-selected', 'false'); });
    renderChips();
    input.focus();
  });

  // clicking away closes, but only for clicks outside this component
  document.addEventListener('pointerdown', (e) => {
    if (open && !root.contains(e.target)) setOpen(false);
  });

  renderChips();
  filter();

  return { el: root, open: () => setOpen(true), close: () => setOpen(false), value: () => [...picked].map((i) => items[i].name) };
}

document.querySelectorAll('[data-smart-select]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createSmartSelect({ accent: host.dataset.accent || '#F97316' }).el);
});
