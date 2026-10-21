/* ============================================================
   Chip. Filter chips: press to choose, press again to let go.

   Each chip is a real <button aria-pressed>, so the state is
   announced and Enter / Space toggle it. The growth and the drawn
   tick are CSS, driven off aria-pressed.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/chip/chip.css">
     <div data-chip></div>
     <script type="module" src="./assets/personal/chip/chip.js"></script>
   Or one at a time:
     import { createChip } from './chip.js';
     host.appendChild(createChip({ label: 'Motion', selected: true }));
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createChip({ label = 'Chip', selected = false } = {}) {
  const chip = el(`
    <button type="button" class="chip" aria-pressed="${selected ? 'true' : 'false'}">
      <svg class="chip__tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.6 8.4l3.4 3.4 7.4-7.6"/></svg>
      <span class="chip__label">${esc(label)}</span>
    </button>`);
  chip.addEventListener('click', () => {
    chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    chip.dispatchEvent(new CustomEvent('chipchange', { bubbles: true }));
  });
  return chip;
}

const OPTIONS = ['Interface', 'Motion', '3D', 'Game UI', 'Systems', 'Prototyping'];

export function createChipPanel({ options = OPTIONS, selected = ['Motion'] } = {}) {
  const root = el(`
  <div class="cp ui" data-cursor="dark">
    <div class="cp__inner">
      <header class="cp__head">
        <p class="ui-eyebrow">Chip</p>
        <p class="cp__sub">Filter · choose any</p>
      </header>
      <div class="cp__row" role="group" aria-label="Filters"></div>
      <p class="cp__read" aria-live="polite"></p>
    </div>
  </div>`);

  const row = root.querySelector('.cp__row');
  const read = root.querySelector('.cp__read');
  const chips = options.map((label) => createChip({ label, selected: selected.includes(label) }));
  row.append(...chips);

  const value = () => chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.textContent.trim());
  const paint = () => {
    const v = value();
    read.innerHTML = v.length ? `Showing <b>${v.map(esc).join(', ')}</b>` : 'Showing everything';
  };
  root.addEventListener('chipchange', paint);
  paint();

  return { el: root, chips, value };
}

document.querySelectorAll('[data-chip]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createChipPanel().el);
});
