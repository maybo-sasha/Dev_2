/* ============================================================
   Selection Controls — soft-body checkbox, radio and switch.

   The controls are native inputs wrapped in a label, so state,
   keyboard and screen readers are the browser's job and every
   bit of motion runs off :checked in CSS. JS only adds the
   pop on the checkbox (so it can't fire on page load) and
   keeps the demo's readout in sync.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/selection/selection.css">
     <div data-selection data-accent="#2B55F5"></div>
     <script type="module" src="./assets/personal/selection/selection.js"></script>
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* "#2b55f5" → "43, 85, 245", so the CSS can build soft tints of
   the accent with plain rgba() instead of color-mix(). */
function toRgb(hex) {
  const m = String(hex).trim().replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) return '43, 85, 245';
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(', ');
}

let uid = 0;

const MARK = '<svg class="sl-check__mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.4l4.2 4.2L18 7.6"/></svg>';

// ── the three primitives, as markup ────────────────────────
const checkHTML = ({ label = '', checked = false, name = '', disabled = false } = {}) => `
  <label class="sl-check">
    <input type="checkbox"${name ? ` name="${esc(name)}"` : ''}${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}${label ? '' : ` aria-label="Checkbox"`}>
    <span class="sl-check__box">${MARK}</span>
    ${label ? `<span class="sl-check__text">${esc(label)}</span>` : ''}
  </label>`;

const radioHTML = ({ label = '', checked = false, name, value = '' } = {}) => `
  <label class="sl-radio">
    <input type="radio" name="${esc(name)}" value="${esc(value || label)}"${checked ? ' checked' : ''}${label ? '' : ` aria-label="Option"`}>
    <span class="sl-radio__ring"><span class="sl-radio__hole"></span></span>
    ${label ? `<span class="sl-radio__text">${esc(label)}</span>` : ''}
  </label>`;

const switchHTML = ({ label = '', checked = false, name = '', disabled = false } = {}) => `
  <label class="sl-switch">
    <input type="checkbox" role="switch"${name ? ` name="${esc(name)}"` : ''}${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}${label ? '' : ` aria-label="Switch"`}>
    <span class="sl-switch__track"><span class="sl-switch__knob"></span></span>
    ${label ? `<span class="sl-switch__text">${esc(label)}</span>` : ''}
  </label>`;

// ── public primitives: same options, but you get an element ──
export const createCheckbox = (opts) => el(checkHTML(opts));
export const createSwitch = (opts) => el(switchHTML(opts));
export function createRadioGroup({ name, label = '', options = [] } = {}) {
  const group = name || `sl-radio-${++uid}`;
  return el(`
    <div class="sl__stack" role="radiogroup"${label ? ` aria-label="${esc(label)}"` : ''}>
      ${options.map((o) => radioHTML({ ...o, name: group })).join('')}
    </div>`);
}

export function createSelection({ accent = '#2B55F5' } = {}) {
  const group = `sl-radio-${++uid}`;

  const root = el(`
  <div class="sl" data-cursor="dark" style="--sl-accent:${esc(accent)};--sl-accent-rgb:${toRgb(accent)}">
    <div class="sl__inner">

      <header class="sl__head">
        <p class="sl__eyebrow">Selection Controls</p>
        <p class="sl__sub">Checkbox · Radio · Switch</p>
      </header>

      <div class="sl__specimen">
        ${checkHTML({})}
        <div class="sl__pair" role="radiogroup" aria-label="Radio">
          ${radioHTML({ name: group, value: 'a', checked: true })}
          ${radioHTML({ name: group, value: 'b' })}
        </div>
        ${switchHTML({})}
      </div>

    </div>
  </div>`);

  const box = root.querySelector('.sl-check input');
  const toggle = root.querySelector('.sl-switch input');
  const radios = [...root.querySelectorAll('.sl-radio input')];

  const value = () => ({
    checkbox: box.checked,
    radio: (radios.find((r) => r.checked) || {}).value || '',
    switch: toggle.checked,
  });

  // The pop is a keyframe, so it has to be re-armed on every change —
  // dropping the class and reading offsetWidth restarts it mid-flight.
  root.addEventListener('change', (e) => {
    const check = e.target.closest('.sl-check');
    if (!check) return;
    check.classList.remove('is-pop');
    void check.offsetWidth;
    check.classList.add('is-pop');
  });
  root.addEventListener('animationend', (e) => {
    if (e.animationName === 'sl-pop') e.target.closest('.sl-check')?.classList.remove('is-pop');
  });

  return { el: root, value };
}

document.querySelectorAll('[data-selection]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createSelection({ accent: host.dataset.accent || '#2B55F5' }).el);
});
