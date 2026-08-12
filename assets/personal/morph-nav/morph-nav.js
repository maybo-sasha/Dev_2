/* ============================================================
   Morph Nav — one container that changes shape.

   Inspired by the morphing navigation pattern on ui.unlumen.com,
   rebuilt from behaviour rather than ported: a single body that
   grows downward, one marker that travels between slots, and
   content that enters from the side you are heading.

   Hover drives it, not clicks — a navigation bar is not a tab
   strip, and a section should be readable without committing to
   it. Gooey Tabs next door already owns click-to-switch.

   The thesis this playground runs on is that a component should
   read as one organism, so the rules here are strict:
     · the panel is not a second element — it is the same body,
       taller
     · the marker is one shape moved, never one-per-tab shown
       and hidden
     · sweeping across the bar never shuts and reopens; the body
       stays open and only changes shape
     · leaving returns it to exactly the shape it started in

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/morph-nav/morph-nav.css">
     <div data-morph-nav></div>
     <script type="module" src="./assets/personal/morph-nav/morph-nav.js"></script>
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const I = {
  spark: '<path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/>',
  layers: '<path d="M12 3.5 3.5 8l8.5 4.5L20.5 8z"/><path d="M3.5 12.5 12 17l8.5-4.5"/>',
  page: '<path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z"/><path d="M13.5 3.5v5h5"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l2.9 1.8"/>',
  send: '<path d="M20.5 3.5 3.5 10.2l6.9 2.8 2.8 6.9z"/><path d="M20.5 3.5 10.4 13"/>',
  at: '<circle cx="12" cy="12" r="3.6"/><path d="M15.6 12v1.6a2.6 2.6 0 0 0 5.2 0V12a8.8 8.8 0 1 0-3.5 7"/>',
};
const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

const SECTIONS = [
  {
    label: 'Work',
    rows: [
      { icon: 'layers', name: 'Case studies', hint: 'Six shipped products' },
      { icon: 'spark', name: 'Playground', hint: 'Interface experiments' },
    ],
  },
  {
    label: 'Studio',
    rows: [
      { icon: 'page', name: 'How I work', hint: 'Process, in short' },
      { icon: 'clock', name: 'Availability', hint: 'Booking from March' },
    ],
  },
  {
    label: 'Writing',
    rows: [
      { icon: 'page', name: 'Motion as meaning', hint: 'On micro-animation' },
      { icon: 'layers', name: 'One organism', hint: 'Continuity in UI' },
    ],
  },
  {
    label: 'Contact',
    rows: [
      { icon: 'send', name: 'Send a brief', hint: 'Usually a day to reply' },
      { icon: 'at', name: 'Elsewhere', hint: 'Read.cv · Are.na' },
    ],
  },
];

let uid = 0;

export function createMorphNav({ sections = SECTIONS } = {}) {
  const id = `mn-${++uid}`;
  const n = sections.length;

  const viewHTML = (s) => s.rows
    .map((r) => `<div class="mn__row"><i>${svg(r.icon)}</i><span><b>${esc(r.name)}</b><small>${esc(r.hint)}</small></span></div>`)
    .join('');

  const root = el(`
  <div class="mn ui" data-cursor="dark" style="--mn-n:${n}">
    <div class="mn__body">
      <div class="mn__bar" role="tablist" aria-label="Sections">
        <i class="mn__pill" aria-hidden="true"></i>
        ${sections
          .map(
            (s, i) => `
        <button class="mn__tab" type="button" role="tab" data-i="${i}"
                id="${id}-t${i}" aria-controls="${id}-p" aria-selected="false">${esc(s.label)}</button>`
          )
          .join('')}
      </div>
      <div class="mn__panel" id="${id}-p" role="tabpanel">
        <div class="mn__view">${viewHTML(sections[0])}</div>
      </div>
    </div>
    <p class="ui-hint">Hover a section — the bar <b>becomes</b> the panel</p>
  </div>`);

  const body = root.querySelector('.mn__body');
  const panel = root.querySelector('.mn__panel');
  const view = root.querySelector('.mn__view');
  const tabs = [...root.querySelectorAll('.mn__tab')];

  let open = -1;
  let swap = null;

  /* the panel has to be measured, not guessed — rows differ in count */
  const measure = () => view.offsetHeight;

  function paint() {
    tabs.forEach((t, i) => t.setAttribute('aria-selected', String(i === open)));
    root.classList.toggle('is-open', open >= 0);
    root.classList.toggle('is-first', open === 0);
    root.classList.toggle('is-last', open === n - 1);
    panel.style.height = open >= 0 ? `${measure()}px` : '0px';
  }

  function select(i) {
    if (i === open) return;   // already showing it — hovering across must not toggle

    const from = open;
    root.style.setProperty('--mn-dir', String(i > from || from < 0 ? 1 : -1));
    root.style.setProperty('--mn-i', String(i));
    open = i;

    if (from < 0) { view.innerHTML = viewHTML(sections[i]); paint(); return; }

    clearTimeout(swap);
    view.classList.add('is-out');
    swap = setTimeout(() => {
      view.classList.remove('is-out');
      view.classList.add('is-in');
      view.innerHTML = viewHTML(sections[i]);
      /* commit the entering pose with a reflow and release in the same
         task — waiting on rAF strands it invisible whenever frames are
         throttled, e.g. an off-screen tile or a background tab */
      void view.offsetWidth;
      view.classList.remove('is-in');
      paint();
    }, 160);

    paint();
  }

  const shut = () => { if (open >= 0) { open = -1; paint(); } };

  /* Hover drives it, because a navigation bar is not a tab strip — you
     should be able to read a section without committing to it. Crossing
     between tabs while open never closes: the body stays open and only
     morphs, so the organism is not destroyed and rebuilt mid-sweep. */
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let leaveTimer = 0;

  if (canHover) {
    tabs.forEach((t, i) => t.addEventListener('pointerenter', () => {
      clearTimeout(leaveTimer);
      select(i);
    }));
    /* the panel is inside the body, so moving down into it never leaves.
       The grace period only covers the gap crossed on the way out. */
    body.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
    body.addEventListener('pointerleave', () => {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(shut, 160);
    });
  }

  /* touch and pen have no hover, so there tapping toggles instead */
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    if (canHover) return;
    if (i === open) shut(); else select(i);
  }));

  /* keyboard reaches it the same way: focus opens, arrows move, Esc shuts */
  tabs.forEach((t, i) => t.addEventListener('focus', () => { clearTimeout(leaveTimer); select(i); }));

  root.querySelector('.mn__bar').addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = ((open < 0 ? 0 : open) + step + n) % n;
    select(next);
    tabs[next].focus();
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open >= 0) { e.preventDefault(); shut(); }
  });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) shut();
  });

  new ResizeObserver(() => { if (open >= 0) panel.style.height = `${measure()}px`; }).observe(view);
  root.style.setProperty('--mn-i', '0');

  return { el: root, select, close: () => { open = -1; paint(); }, get value() { return open < 0 ? null : sections[open].label; } };
}

document.querySelectorAll('[data-morph-nav]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createMorphNav().el);
});
