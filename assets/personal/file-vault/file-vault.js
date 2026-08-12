/* ============================================================
   File Vault — a glossy folder that opens into a searchable file list.

   Standalone component: vanilla JS, no libraries, no build step.
   All motion lives in file-vault.css, so it works on a plain HTML page.

   Usage:
     <link rel="stylesheet" href="./assets/personal/file-vault/file-vault.css">
     <div data-file-vault></div>
     <script type="module" src="./assets/personal/file-vault/file-vault.js"></script>

   Every [data-file-vault] element on the page is filled automatically.
   Optional attributes:
     data-accent="#4DA6FF"   accent colour for highlights and the count
   Or mount it yourself:
     import { createFileVault } from './file-vault.js';
     host.appendChild(createFileVault({ accent: '#FF6B35' }).el);
   ============================================================ */

const FILES = [
  { name: 'Pitch_Deck.pptx', kind: 'PPTX', bytes: 8.4e6, when: 'Edited 2h ago', c1: '#FF8E8E', c2: '#F2295B', glyph: 'deck' },
  { name: 'Hero_Shot.png', kind: 'PNG', bytes: 3.1e6, when: 'Added yesterday', c1: '#FFCC7A', c2: '#FF8A3D', glyph: 'image' },
  { name: 'Launch_Cut.mp4', kind: 'MP4', bytes: 128e6, when: 'Edited 3d ago', c1: '#7FB2FF', c2: '#3B5BFF', glyph: 'video' },
  { name: 'Brand_Guide.pdf', kind: 'PDF', bytes: 12.6e6, when: 'Shared with 4', c1: '#C89BFF', c2: '#7A3DFF', glyph: 'doc' },
  { name: 'Metrics_Q3.xlsx', kind: 'XLSX', bytes: 0.64e6, when: 'Edited 5m ago', c1: '#86F2C8', c2: '#12B981', glyph: 'sheet' },
];

const GLYPHS = {
  deck: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8.5 20h7"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4.5L12 16l3.5-3.5L20 17"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 9.2l4.8 2.8-4.8 2.8z"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  sheet: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
};

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const fmtSize = (b) => {
  if (b < 1e6) return Math.round(b / 1e3) + ' KB';
  return (b >= 100e6 ? Math.round(b / 1e6) : (b / 1e6).toFixed(1)) + ' MB';
};

// Wrap the matched slice of a filename so the hit is readable at a glance.
function highlight(name, q) {
  if (!q) return esc(name);
  const i = name.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(name);
  return esc(name.slice(0, i)) + '<mark>' + esc(name.slice(i, i + q.length)) + '</mark>' + esc(name.slice(i + q.length));
}

let uid = 0;

export function createFileVault({
  files = FILES,
  title = 'Campaign Briefs',
  subtitle = 'Client & Internal Notes',
  unit = 'Files',
  /* short form on purpose: the long one ("Tuesday, August 12") is wider
     than the pocket and gets clipped by the folder edge */
  date = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
} = {}) {
  const id = `fvault-panel-${++uid}`;
  const n = files.length;
  const maxBytes = Math.max(...files.map((f) => f.bytes));
  const mid = (n - 1) / 2;

  const cards = files
    .map(
      (f, i) => `
      <span class="fvault__card" style="--i:${i};--z:${n - Math.abs(i - mid)};--c1:${f.c1};--c2:${f.c2};--fan:${(i - mid).toFixed(2)}">
        <i class="fvault__card-face">
          <b class="fvault__card-name">${esc(f.name)}</b>
          <em class="fvault__card-tag">${f.kind} · ${fmtSize(f.bytes)}</em>
        </i>
      </span>`
    )
    .join('');

  const root = el(`
  <div class="fvault ui" data-cursor="dark">
    <i class="fvault__aura"></i>

    <div class="fvault__stage">
      <button class="fvault__folder" type="button" aria-expanded="false" aria-controls="${id}">
        <span class="fvault__stack">
          <span class="fvault__back"><i></i></span>
          ${cards}
          <span class="fvault__front">
            <i class="fvault__gloss"></i>
            <span class="fvault__date">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg>
              ${esc(date)}
            </span>
            <span class="fvault__meta">
              <b class="fvault__title">${esc(title)}</b>
              <span class="fvault__row">
                <em class="fvault__sub">${esc(subtitle)}</em>
                <em class="fvault__count-front">${n} ${esc(unit)}</em>
              </span>
            </span>
            <i class="fvault__grip"></i>
          </span>
        </span>
        <span class="fvault__hint"><i></i>Click the folder</span>
      </button>
    </div>

    <div class="fvault__panel" id="${id}" aria-hidden="true">
      <div class="fvault__head">
        <label class="fvault__search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
          <input type="text" class="fvault__input" placeholder="Search files…" aria-label="Search files" autocomplete="off" spellcheck="false" />
          <button class="fvault__clear" type="button" aria-label="Clear search" tabindex="-1">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>
          </button>
        </label>
        <span class="fvault__count"><b>${n}</b> files</span>
      </div>

      <ul class="fvault__list" role="list"></ul>

      <div class="fvault__empty"><b>Nothing here</b><small>No files match “<span></span>”</small></div>

      <div class="fvault__foot">
        <span class="fvault__total"></span>
        <button class="fvault__close" type="button">Close folder</button>
      </div>
    </div>
  </div>`);

  const folder = root.querySelector('.fvault__folder');
  const panel = root.querySelector('.fvault__panel');
  const list = root.querySelector('.fvault__list');
  const input = root.querySelector('.fvault__input');
  const clearBtn = root.querySelector('.fvault__clear');
  const countEl = root.querySelector('.fvault__count b');
  const emptyTerm = root.querySelector('.fvault__empty span');
  const totalEl = root.querySelector('.fvault__total');
  const cardEls = [...root.querySelectorAll('.fvault__card')];

  let open = false;
  let query = '';
  let selected = -1;

  const rows = files.map((f, i) => {
    const row = el(`
    <li class="fvault-file" style="--c1:${f.c1};--c2:${f.c2};--r:${i}">
      <button class="fvault-file__btn" type="button" aria-pressed="false">
        <span class="fvault-file__icon"><svg viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[f.glyph]}</svg></span>
        <span class="fvault-file__body">
          <b class="fvault-file__name">${esc(f.name)}</b>
          <small class="fvault-file__meta">${f.kind} · ${fmtSize(f.bytes)} · ${f.when}</small>
          <i class="fvault-file__bar"><b style="width:${Math.max(6, (f.bytes / maxBytes) * 100)}%"></b></i>
        </span>
        <span class="fvault-file__chev"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></span>
      </button>
    </li>`);
    row.querySelector('.fvault-file__btn').addEventListener('click', () => select(i));
    list.appendChild(row);
    return row;
  });

  function select(i) {
    selected = selected === i ? -1 : i;
    rows.forEach((row, k) => {
      const on = k === selected;
      row.classList.toggle('is-active', on);
      row.querySelector('.fvault-file__btn').setAttribute('aria-pressed', String(on));
    });
    cardEls.forEach((c, k) => c.classList.toggle('is-pop', k === selected));
  }

  function filter() {
    const q = query.trim();
    const visible = [];

    rows.forEach((row, i) => {
      const f = files[i];
      const hit = !q || (f.name + ' ' + f.kind).toLowerCase().includes(q.toLowerCase());
      if (hit) row.style.setProperty('--r', visible.push(i) - 1);
      row.classList.toggle('is-hidden', !hit);
      row.querySelector('.fvault-file__name').innerHTML = highlight(f.name, q);
      cardEls[i].classList.toggle('is-dim', !hit);
    });

    countEl.textContent = visible.length;
    emptyTerm.textContent = q;
    root.classList.toggle('is-empty', visible.length === 0);
    root.classList.toggle('is-searching', q.length > 0);

    const bytes = visible.reduce((sum, i) => sum + files[i].bytes, 0);
    totalEl.textContent = `${visible.length} of ${n} · ${fmtSize(bytes)}`;

    if (selected > -1 && !visible.includes(selected)) select(selected);
  }

  function setOpen(next) {
    if (open === next) return;
    open = next;
    root.classList.toggle('is-open', open);
    folder.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));

    if (open) {
      // Rows stagger in on the first open; after that filtering re-staggers fast.
      setTimeout(() => open && list.classList.add('is-live'), 900);
      setTimeout(() => open && input.focus({ preventScroll: true }), 700);
    } else {
      list.classList.remove('is-live');
      select(-1);
      input.value = '';
      query = '';
      filter();
    }
  }

  folder.addEventListener('click', () => setOpen(!open));
  root.querySelector('.fvault__close').addEventListener('click', () => setOpen(false));

  input.addEventListener('input', () => {
    query = input.value;
    filter();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (query) {
      input.value = '';
      query = '';
      filter();
    } else {
      setOpen(false);
      folder.focus();
    }
  });
  clearBtn.addEventListener('click', () => {
    input.value = '';
    query = '';
    filter();
    input.focus();
  });

  filter();

  return { el: root, open: () => setOpen(true), close: () => setOpen(false) };
}

// Auto-mount every placeholder on the page.
document.querySelectorAll('[data-file-vault]').forEach((host) => {
  if (host.firstElementChild) return;
  const d = host.dataset;
  host.appendChild(createFileVault({
    title: d.title || undefined,
    subtitle: d.subtitle || undefined,
    unit: d.unit || undefined,
    date: d.date || undefined,
  }).el);
});
