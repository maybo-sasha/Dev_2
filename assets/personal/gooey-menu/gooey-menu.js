/* ============================================================
   Gooey Menu — six actions swinging out of a centre button, the
   shapes melting apart as they separate.

   A faithful port of the gooey radial menu on ui.unlumen.com:
   same six actions and angles, same 320px stage, same 56/48px
   discs, same 100px travel, and the same filter —
     feGaussianBlur → feColorMatrix (alpha 19 / -9) → feComposite atop
   at strength 14. All of its Framer Motion timing is expressed as
   CSS transitions, so there is no runtime dependency.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/gooey-menu/gooey-menu.css">
     <div data-gooey-menu></div>
     <script type="module" src="./assets/personal/gooey-menu/gooey-menu.js"></script>
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* lucide equivalents of the icons the original uses */
const ICONS = {
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  comment: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  list: '<path d="M11 12H3M16 6H3M16 18H3M18 9v6M21 12h-6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
};

/* clockwise from the upper left — angle is where the arm settles */
const ACTIONS = [
  { label: 'Favorite', icon: 'heart', angle: -150 },
  { label: 'Share', icon: 'share', angle: -90 },
  { label: 'Comment', icon: 'comment', angle: -30 },
  { label: 'Save', icon: 'bookmark', angle: 30 },
  { label: 'Notify', icon: 'bell', angle: 90 },
  { label: 'Add to list', icon: 'list', angle: 150 },
];

const svg = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

let uid = 0;

export function createGooeyMenu({ actions = ACTIONS, strength = 14, open = false } = {}) {
  const id = `gooey-menu-${++uid}`;
  const n = actions.length;

  const vars = (a, i) => `--a:${a.angle}deg;--i:${i}`;

  const root = el(`
  <div class="gm ui" data-cursor="dark" style="--gm-n:${n};--gm-goo:url(#${id})">
    <svg class="gm__def" aria-hidden="true" focusable="false">
      <defs>
        <filter id="${id}">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${strength}" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"/>
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
      </defs>
    </svg>

    <div class="gm__stage">
      <div class="gm__blobs">
        ${actions.map((a, i) => `<div class="gm__arm" style="${vars(a, i)}"><i class="gm__blob"></i></div>`).join('')}
        <i class="gm__core"></i>
      </div>

      <div class="gm__icons">
        ${actions
          .map(
            (a, i) => `
        <div class="gm__arm" style="${vars(a, i)}">
          <div class="gm__hold" style="${vars(a, i)}">
            <button class="gm__item" type="button" data-i="${i}" aria-label="${esc(a.label)}" tabindex="-1">
              <span class="gm__spin" style="${vars(a, i)}">${svg(ICONS[a.icon])}</span>
            </button>
          </div>
        </div>`
          )
          .join('')}
      </div>

      <button class="gm__toggle" type="button" aria-expanded="false" aria-label="Open menu">
        <span class="gm__plus">${svg(ICONS.close)}</span>
      </button>
    </div>

    <p class="gm__cap">Press the button — <b>gooey SVG filter</b></p>
  </div>`);

  const toggle = root.querySelector('.gm__toggle');
  const items = [...root.querySelectorAll('.gm__item')];
  let isOpen = false;

  function setOpen(next) {
    if (isOpen === next) return;
    isOpen = next;
    root.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    /* closed items are inert: no pointer, no tab stop */
    items.forEach((b) => b.setAttribute('tabindex', isOpen ? '0' : '-1'));
  }

  toggle.addEventListener('click', () => setOpen(!isOpen));
  /* picking an action closes the menu, as in the original */
  items.forEach((b) => b.addEventListener('click', () => setOpen(false)));

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setOpen(false);
      toggle.focus();
    }
  });

  if (open) requestAnimationFrame(() => setOpen(true));

  return { el: root, open: () => setOpen(true), close: () => setOpen(false), get isOpen() { return isOpen; } };
}

document.querySelectorAll('[data-gooey-menu]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createGooeyMenu({ strength: Number(host.dataset.strength) || 14 }).el);
});
