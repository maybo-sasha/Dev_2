/* ============================================================
   Command Bar — a ⌘K palette. Type to filter, ↑/↓ to move,
   Enter to run, Esc to close.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/command-bar/command-bar.css">
     <div data-command-bar data-accent="#A78BFA"></div>
     <script type="module" src="./assets/personal/command-bar/command-bar.js"></script>

   The ⌘K / Ctrl+K shortcut only fires while the pointer is over the
   component or focus is inside it, so it never hijacks the host page.
   ============================================================ */

const I = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6.5 9.8V20h11V9.8"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c1-3.7 3.9-5.6 7.2-5.6s6.2 1.9 7.2 5.6"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7.5l8 5.5 8-5.5"/>',
  spark: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/>',
  moon: '<path d="M20 13.4A8 8 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4z"/>',
  bolt: '<path d="M13.5 3L6 13.2h5L10.5 21 18 10.8h-5z"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  share: '<circle cx="7" cy="12" r="2.6"/><circle cx="17" cy="6.5" r="2.6"/><circle cx="17" cy="17.5" r="2.6"/><path d="M9.3 10.9l5.4-3M9.3 13.1l5.4 3"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
};

const COMMANDS = [
  { group: 'Navigation', label: 'Go to Work', sub: 'Selected projects', keys: 'G W', icon: 'home', c1: '#9F8BFF', c2: '#6C4BF5' },
  { group: 'Navigation', label: 'Go to About', sub: 'Bio, tools, contact', keys: 'G A', icon: 'user', c1: '#8BB8FF', c2: '#3B6BF5' },
  { group: 'Navigation', label: 'Open Playground', sub: '3D and motion experiments', keys: 'G P', icon: 'spark', c1: '#7FE3FF', c2: '#1FA3D8' },
  { group: 'Actions', label: 'Send an email', sub: 'Opens your mail client', keys: '⌘ E', icon: 'mail', c1: '#FFB27A', c2: '#F2762B' },
  { group: 'Actions', label: 'Copy page link', sub: 'Puts the URL on your clipboard', keys: '⌘ C', icon: 'share', c1: '#86F2C8', c2: '#12B981' },
  { group: 'Actions', label: 'Download résumé', sub: 'PDF · 2 pages', keys: '⌘ D', icon: 'file', c1: '#FF9BC4', c2: '#EC3F80' },
  { group: 'Preferences', label: 'Toggle dark mode', sub: 'Currently: dark', keys: '⌘ ⇧ D', icon: 'moon', c1: '#B69BFF', c2: '#7A4BF0' },
  { group: 'Preferences', label: 'Reduce motion', sub: 'Calmer transitions', keys: '⌘ ⇧ M', icon: 'bolt', c1: '#FFD37A', c2: '#F0A81E' },
  { group: 'Preferences', label: 'Clear recent', sub: 'Forget local history', keys: '⌘ ⌫', icon: 'trash', c1: '#FF8E8E', c2: '#E23B3B' },
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

const keycaps = (keys) => keys.split(' ').map((k) => `<kbd>${esc(k)}</kbd>`).join('');

let uid = 0;

export function createCommandBar({ commands = COMMANDS } = {}) {
  const id = `cbar-${++uid}`;
  const groups = [...new Set(commands.map((c) => c.group))];

  const rows = groups
    .map(
      (g) => `
      <li class="cbar__group" data-group="${esc(g)}">${esc(g)}</li>
      ${commands
        .map((c, i) => [c, i])
        .filter(([c]) => c.group === g)
        .map(
          ([c, i]) => `
      <li>
        <button class="cbar__cmd" type="button" data-cmd="${i}" style="--c1:${c.c1};--c2:${c.c2}">
          <span class="cbar__ico"><svg viewBox="0 0 24 24" aria-hidden="true">${I[c.icon]}</svg></span>
          <span class="cbar__body">
            <span class="cbar__label">${esc(c.label)}</span>
            <span class="cbar__sub">${esc(c.sub)}</span>
          </span>
          <span class="cbar__keys">${keycaps(c.keys)}</span>
        </button>
      </li>`
        )
        .join('')}`
    )
    .join('');

  const root = el(`
  <div class="cbar ui" data-cursor="dark">
    <i class="cbar__grid"></i>

    <div class="cbar__scrim"></div>

    <div class="cbar__shell" id="${id}" role="dialog" aria-modal="false" aria-label="Command palette">
      <div class="cbar__field">
        <svg viewBox="0 0 24 24" aria-hidden="true">${I.search}</svg>
        <input class="cbar__input" type="text" placeholder="Search commands…" aria-label="Search commands" autocomplete="off" spellcheck="false" />
        <span class="cbar__hint">
          <span class="cbar__call cbar__keys"><kbd>⌘</kbd><kbd>K</kbd></span>
          <span class="cbar__esc"><kbd>esc</kbd></span>
        </span>
      </div>
      <div class="cbar__panel">
        <div class="cbar__panelin">
          <ul class="cbar__list" role="listbox">
            ${rows}
            <li class="cbar__empty"><b>No command found</b><small>Try “copy”, “dark” or “email”</small></li>
          </ul>
          <div class="cbar__foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
            <span><kbd>↵</kbd> run</span>
            <span class="cbar__hits"><b>0</b> results</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cbar__toast">
      <i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i>
      <span class="cbar__toast-text"></span>
    </div>
  </div>`);

  const shell = root.querySelector('.cbar__shell');
  const panel = root.querySelector('.cbar__panel');
  const panelIn = root.querySelector('.cbar__panelin');
  const scrim = root.querySelector('.cbar__scrim');
  const input = root.querySelector('.cbar__input');
  const hits = root.querySelector('.cbar__hits b');
  const toastText = root.querySelector('.cbar__toast-text');
  const cmdEls = [...root.querySelectorAll('.cbar__cmd')];
  const groupEls = [...root.querySelectorAll('.cbar__group')];

  let open = false;
  let query = '';
  let current = 0;
  let visible = [];
  let toastTimer = null;

  function paint() {
    cmdEls.forEach((btn, i) => btn.classList.toggle('is-current', i === current));
    const cur = cmdEls[current];
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  function filter() {
    const q = query.trim();
    visible = [];

    cmdEls.forEach((btn, i) => {
      const c = commands[i];
      const hit = !q || (c.label + ' ' + c.sub + ' ' + c.group).toLowerCase().includes(q.toLowerCase());
      btn.parentElement.classList.toggle('is-hidden', !hit);
      btn.querySelector('.cbar__label').innerHTML = highlight(c.label, q);
      if (hit) visible.push(i);
    });

    // a group header only shows when it still has commands under it
    groupEls.forEach((g) => {
      const name = g.dataset.group;
      g.classList.toggle('is-hidden', !visible.some((i) => commands[i].group === name));
    });

    hits.textContent = visible.length;
    root.classList.toggle('is-empty', visible.length === 0);
    grow();   // fewer rows means a shorter body, not a scrollbar
    if (!visible.includes(current)) current = visible.length ? visible[0] : -1;
    paint();
  }

  function move(step) {
    if (!visible.length) return;
    const at = visible.indexOf(current);
    current = visible[(at + step + visible.length) % visible.length];
    paint();
  }

  function run(i) {
    const c = commands[i];
    if (!c) return;
    toastText.textContent = `${c.label} — ran`;
    root.classList.add('is-toasting');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => root.classList.remove('is-toasting'), 2200);
    setOpen(false);
  }

  function setOpen(next) {
    if (open === next) return;
    open = next;
    root.classList.toggle('is-open', open);
    input.setAttribute('placeholder', open ? 'Type a command…' : 'Search commands…');
    if (open) {
      input.focus({ preventScroll: true });
      grow();
    } else {
      panel.style.height = '0px';
      input.value = '';
      query = '';
      filter();
      input.blur();
    }
  }

  /* The panel is the shell, taller — so its height comes from measuring
     the content, and has to be re-measured whenever filtering changes how
     many rows there are. A fixed height would jump on every keystroke. */
  function grow() { if (open) panel.style.height = `${panelIn.offsetHeight}px`; }

  shell.addEventListener('click', () => setOpen(true));
  input.addEventListener('focus', () => setOpen(true));
  scrim.addEventListener('click', () => setOpen(false));
  cmdEls.forEach((btn, i) => {
    btn.addEventListener('click', () => run(i));
    btn.addEventListener('mouseenter', () => {
      current = i;
      paint();
    });
  });

  input.addEventListener('input', () => {
    query = input.value;
    filter();
  });

  root.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(current); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  });

  // ⌘K only while this component is hovered or focused — never steals the page's keys
  document.addEventListener('keydown', (e) => {
    const mine = root.matches(':hover') || root.contains(document.activeElement);
    if (!mine) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen(!open);
    }
  });

  filter();

  return { el: root, open: () => setOpen(true), close: () => setOpen(false) };
}

document.querySelectorAll('[data-command-bar]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createCommandBar().el);
});
