/* ============================================================
   Progress. A bar, a ring, and a loop for when nobody knows.

   Both determinate forms take a value from 0 to 1 and announce it
   through role="progressbar". Reaching 1 marks them done, which is
   the one place the system spends its colour (see progress.css).

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/progress/progress.css">
     <div data-progress></div>
     <script type="module" src="./assets/personal/progress/progress.js"></script>
   Or one at a time:
     import { createProgress, createProgressRing } from './progress.js';
     const p = createProgress({ label: 'Uploading' });
     host.appendChild(p.el);   p.set(0.4);
   ============================================================ */

import { createButton } from '../button/button.js';

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function wire(root, extra) {
  const set = (v) => {
    v = clamp01(v);
    root.style.setProperty('--prg-p', v.toFixed(4));
    root.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    root.classList.toggle('is-done', v >= 1);
    if (extra) extra(v);
  };
  return set;
}

export function createProgress({ value = 0, label = 'Progress', loop = false } = {}) {
  const root = el(`
    <div class="prg${loop ? ' prg--loop' : ''}" role="progressbar" aria-label="${esc(label)}"${loop ? '' : ' aria-valuemin="0" aria-valuemax="100"'}>
      <div class="prg__fill"></div>
    </div>`);
  const set = loop ? () => {} : wire(root);
  set(value);
  return { el: root, set };
}

export function createProgressRing({ value = 0, label = 'Progress' } = {}) {
  const root = el(`
    <div class="prg-ring" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100">
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <circle class="prg-ring__track" cx="42" cy="42" r="36"/>
        <circle class="prg-ring__fill" cx="42" cy="42" r="36" pathLength="1"/>
      </svg>
      <span class="prg-ring__num">0</span>
      <span class="prg-ring__tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.6l4.3 4.300 8.700-9.600"/></svg></span>
    </div>`);
  const num = root.querySelector('.prg-ring__num');
  const set = wire(root, (v) => { num.textContent = String(Math.round(v * 100)); });
  set(value);
  return { el: root, set };
}

export function createProgressPanel() {
  const root = el(`
  <div class="pp ui" data-cursor="dark">
    <div class="pp__inner">
      <header class="pp__head">
        <p class="ui-eyebrow">Progress</p>
        <p class="pp__sub">Bar · Ring · Loop</p>
      </header>
      <div class="pp__main">
        <div class="pp__bars">
          <div class="pp__field" data-f="bar"><p class="pp__label">Uploading <b>0%</b></p></div>
          <div class="pp__field" data-f="loop"><p class="pp__label">Waiting for the server</p></div>
        </div>
      </div>
      <div class="pp__foot"></div>
    </div>
  </div>`);

  const bar = createProgress({ label: 'Uploading' });
  const ring = createProgressRing({ label: 'Uploading' });
  const loop = createProgress({ label: 'Waiting', loop: true });
  root.querySelector('[data-f="bar"]').appendChild(bar.el);
  root.querySelector('[data-f="loop"]').appendChild(loop.el);
  root.querySelector('.pp__main').appendChild(ring.el);
  const read = root.querySelector('[data-f="bar"] b');

  const go = createButton({ label: 'Run it', variant: 'outline', size: 'sm' });
  root.querySelector('.pp__foot').appendChild(go);

  // A stand-in job: uneven steps, the way real work arrives.
  let timer = 0;
  const show = (v) => {
    bar.set(v);
    ring.set(v);
    read.textContent = v >= 1 ? 'Done' : Math.round(v * 100) + '%';
  };
  function run() {
    clearTimeout(timer);
    let v = 0;
    show(0);
    go.disabled = true;
    const tick = () => {
      v = Math.min(1, v + 0.06 + Math.random() * 0.2);
      show(v);
      if (v < 1) { timer = setTimeout(tick, 320 + Math.random() * 280); return; }
      timer = setTimeout(() => { go.disabled = false; }, 600);
    };
    timer = setTimeout(tick, 350);
  }
  go.addEventListener('click', run);
  show(0.42);

  return { el: root, run, set: show };
}

document.querySelectorAll('[data-progress]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createProgressPanel().el);
});
