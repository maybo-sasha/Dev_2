/* ============================================================
   Tooltip. One tip that serves a whole group of triggers.

   createTooltipGroup(scope) watches every [data-tip] inside scope.
   Hover or focus shows the tip above that element; moving to the
   next one slides the same tip across instead of swapping two.
   Each trigger gets aria-describedby for as long as it is shown,
   and Escape puts it away.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/tooltip/tooltip.css">
     <div data-tooltip></div>
     <script type="module" src="./assets/personal/tooltip/tooltip.js"></script>
   Or on your own markup:
     import { createTooltipGroup } from './tooltip.js';
     createTooltipGroup(toolbar);   // children carry data-tip="Label"
   ============================================================ */

import { createButton } from '../button/button.js';

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

let uid = 0;

/* `scope` has to be a positioned element: the tip is placed inside it. */
export function createTooltipGroup(scope) {
  const id = `tip-${++uid}`;
  const tip = el(`<div class="tip" role="tooltip" id="${id}"><span class="tip__text"></span></div>`);
  const text = tip.querySelector('.tip__text');
  scope.appendChild(tip);

  let current = null;
  let hideTimer = 0;

  function show(target) {
    clearTimeout(hideTimer);
    if (current && current !== target) current.removeAttribute('aria-describedby');
    const wasOn = tip.classList.contains('is-on');
    const s = scope.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    text.textContent = target.dataset.tip;
    tip.style.setProperty('--tip-x', (r.left + r.width / 2 - s.left) + 'px');
    tip.style.setProperty('--tip-y', (r.top - s.top - 10) + 'px');
    tip.classList.toggle('is-moving', wasOn);
    tip.classList.add('is-on');
    target.setAttribute('aria-describedby', id);
    current = target;
  }

  function hide() {
    clearTimeout(hideTimer);
    // a short grace, so crossing the gap between two triggers does not blink
    hideTimer = setTimeout(() => {
      tip.classList.remove('is-on', 'is-moving');
      if (current) current.removeAttribute('aria-describedby');
      current = null;
    }, 90);
  }

  const trigger = (e) => e.target.closest && e.target.closest('[data-tip]');
  scope.addEventListener('pointerover', (e) => { const t = trigger(e); if (t) show(t); });
  scope.addEventListener('pointerout', (e) => { if (trigger(e)) hide(); });
  scope.addEventListener('focusin', (e) => { const t = trigger(e); if (t) show(t); });
  scope.addEventListener('focusout', (e) => { if (trigger(e)) hide(); });
  scope.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

  return { el: tip, show, hide };
}

const TOOLS = [
  { icon: 'plus', tip: 'Add a layer' },
  { icon: 'heart', tip: 'Save to favourites' },
  { icon: 'share', tip: 'Share' },
  { icon: 'more', tip: 'More' },
];

export function createTooltipPanel({ tools = TOOLS } = {}) {
  const root = el(`
  <div class="tp ui" data-cursor="dark">
    <div class="tp__inner">
      <header class="tp__head">
        <p class="ui-eyebrow">Tooltip</p>
        <p class="tp__sub">Hover or focus a button</p>
      </header>
      <div class="tp__bar" role="toolbar" aria-label="Tools"></div>
    </div>
  </div>`);

  const bar = root.querySelector('.tp__bar');
  const buttons = tools.map((t) => {
    const b = createButton({ icon: t.icon, variant: 'ghost', title: t.tip });
    b.dataset.tip = t.tip;
    return b;
  });
  bar.append(...buttons);
  const group = createTooltipGroup(root);

  return { el: root, buttons, show: (i) => group.show(buttons[i]), hide: group.hide };
}

document.querySelectorAll('[data-tooltip]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createTooltipPanel().el);
});
