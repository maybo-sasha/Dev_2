/* ============================================================
   Button. Filled, outline, ghost, and the round icon button.

   A real <button>, so focus, Enter and Space are the browser's job.
   All of the motion is CSS (see button.css): the breath near the
   pointer and the squash under it.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/button/button.css">
     <div data-button></div>
     <script type="module" src="./assets/personal/button/button.js"></script>
   Or one at a time:
     import { createButton } from './button.js';
     host.appendChild(createButton({ label: 'Save', variant: 'filled' }));
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const I = {
  arrow: '<path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  heart: '<path d="M12 19.5S4.5 15 4.5 9.6a3.9 3.9 0 0 1 7.5-1.5 3.9 3.9 0 0 1 7.5 1.5c0 5.400-7.5 9.9-7.5 9.9z"/>',
  share: '<path d="M12 15V4.5M8 8l4-4 4 4"/><path d="M5.5 12.500v6h13v-6"/>',
  more: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
};
export const icon = (name, cls = '') => `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ''}</svg>`;

/* variant: filled | outline | ghost.  size: sm | md | lg.
   Pass `icon` alone (no label) for the round icon button; it then
   needs `title`, which becomes its accessible name. */
export function createButton({
  label = '',
  variant = 'filled',
  size = 'md',
  icon: glyph = '',
  go = false,
  title = '',
  disabled = false,
} = {}) {
  const iconOnly = glyph && !label;
  const cls = ['btn', `btn--${variant}`];
  if (size !== 'md') cls.push(`btn--${size}`);
  if (iconOnly) cls.push('btn--icon');
  return el(`
    <button type="button" class="${cls.join(' ')}"${disabled ? ' disabled' : ''}${iconOnly ? ` aria-label="${esc(title || glyph)}"` : ''}>
      ${glyph ? icon(glyph) : ''}
      ${label ? `<span class="btn__label">${esc(label)}</span>` : ''}
      ${go ? icon('arrow', 'btn__go') : ''}
    </button>`);
}

export function createButtonPanel() {
  const root = el(`
  <div class="bt ui" data-cursor="dark">
    <div class="bt__inner">
      <header class="bt__head">
        <p class="ui-eyebrow">Button</p>
        <p class="bt__sub">Filled · Outline · Ghost · Icon</p>
      </header>
      <div class="bt__row" data-row="main"></div>
      <div class="bt__row" data-row="icons"></div>
      <p class="bt__count">Pressed <b>0</b> times</p>
    </div>
  </div>`);

  const main = root.querySelector('[data-row="main"]');
  const icons = root.querySelector('[data-row="icons"]');
  const filled = createButton({ label: 'Continue', variant: 'filled', size: 'lg', go: true });
  const outline = createButton({ label: 'Save draft', variant: 'outline', size: 'lg' });
  const ghost = createButton({ label: 'Cancel', variant: 'ghost', size: 'lg' });
  main.append(filled, outline, ghost);
  icons.append(
    createButton({ icon: 'plus', variant: 'filled', title: 'Add' }),
    createButton({ icon: 'heart', variant: 'outline', title: 'Like' }),
    createButton({ icon: 'share', variant: 'ghost', title: 'Share' }),
    createButton({ label: 'Disabled', variant: 'filled', disabled: true }),
  );

  let n = 0;
  const count = root.querySelector('.bt__count b');
  root.addEventListener('click', (e) => {
    if (!e.target.closest('.btn')) return;
    count.textContent = String(++n);
  });

  return { el: root, filled, outline, ghost };
}

document.querySelectorAll('[data-button]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createButtonPanel().el);
});
