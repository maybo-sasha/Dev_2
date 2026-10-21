/* ============================================================
   Slider. A range input with a soft-body knob.

   The control is a native <input type="range">, so the pointer,
   the arrow keys and the screen reader all get the real thing.
   This file only mirrors its value into two CSS variables and
   works out how hard the knob is being dragged, which is what
   stretches it (see slider.css).

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/slider/slider.css">
     <div data-slider></div>
     <script type="module" src="./assets/personal/slider/slider.js"></script>
   Or one at a time:
     import { createSlider } from './slider.js';
     const s = createSlider({ min: 0, max: 100, value: 40, label: 'Volume' });
     host.appendChild(s.el);   s.onChange = (v) => { ... };
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createSlider({
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  label = 'Value',
  stops = false,
  format = (v) => String(v),
} = {}) {
  const root = el(`
    <div class="sld">
      <input class="sld__input" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${esc(label)}">
      <div class="sld__track">
        <div class="sld__fill"></div>
        ${stops ? '<div class="sld__stops"></div>' : ''}
        <div class="sld__knob"></div>
        <span class="sld__val"></span>
      </div>
    </div>`);

  const input = root.querySelector('.sld__input');
  const val = root.querySelector('.sld__val');

  if (stops) {
    const host = root.querySelector('.sld__stops');
    const n = Math.round((max - min) / step);
    for (let i = 0; i <= n; i++) {
      const dot = document.createElement('i');
      dot.style.left = (i / n) * 100 + '%';
      host.appendChild(dot);
    }
  }

  const api = { el: root, input, onChange: null };

  // How hard it is being dragged: the change since the last frame,
  // eased back to rest, so the knob stretches on the move and
  // settles the moment it stops.
  let stretch = 0;
  let target = 0;
  let lastP = null;
  let raf = 0;
  const settle = () => {
    stretch += (target - stretch) * 0.3;
    target *= 0.7;
    if (stretch < 0.004 && target < 0.004) { stretch = 0; raf = 0; root.style.setProperty('--sld-stretch', '0'); return; }
    root.style.setProperty('--sld-stretch', stretch.toFixed(3));
    raf = requestAnimationFrame(settle);
  };

  const paint = (moved) => {
    const v = Number(input.value);
    const p = (v - min) / (max - min || 1);
    root.style.setProperty('--sld-p', p.toFixed(4));
    val.textContent = format(v);
    if (moved && lastP !== null) {
      target = Math.min(1, target + Math.abs(p - lastP) * 9);
      if (!raf) raf = requestAnimationFrame(settle);
    }
    lastP = p;
  };

  input.addEventListener('input', () => {
    paint(true);
    if (api.onChange) api.onChange(Number(input.value));
  });
  const hold = (on) => root.classList.toggle('is-held', on);
  input.addEventListener('pointerdown', () => hold(true));
  window.addEventListener('pointerup', () => hold(false));
  window.addEventListener('pointercancel', () => hold(false));

  Object.defineProperty(api, 'value', {
    get: () => Number(input.value),
    set: (v) => { input.value = v; paint(true); if (api.onChange) api.onChange(Number(input.value)); },
  });
  api.hold = hold;

  paint(false);
  return api;
}

export function createSliderPanel() {
  const root = el(`
  <div class="sp ui" data-cursor="dark">
    <div class="sp__inner">
      <header class="sp__head">
        <p class="ui-eyebrow">Slider</p>
        <p class="sp__sub">Continuous · Stepped</p>
      </header>
      <div class="sp__field" data-f="a"><p class="sp__label">Brightness <b></b></p></div>
      <div class="sp__field" data-f="b"><p class="sp__label">Quality <b></b></p></div>
    </div>
  </div>`);

  const a = createSlider({ value: 62, label: 'Brightness', format: (v) => v + '%' });
  const names = ['Draft', 'Low', 'Medium', 'High', 'Max'];
  const b = createSlider({ min: 0, max: 4, step: 1, value: 2, label: 'Quality', stops: true, format: (v) => names[v] });

  const fa = root.querySelector('[data-f="a"]');
  const fb = root.querySelector('[data-f="b"]');
  fa.appendChild(a.el);
  fb.appendChild(b.el);
  const ra = fa.querySelector('b');
  const rb = fb.querySelector('b');
  const show = () => { ra.textContent = a.value + '%'; rb.textContent = names[b.value]; };
  a.onChange = show;
  b.onChange = show;
  show();

  return { el: root, a, b };
}

document.querySelectorAll('[data-slider]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createSliderPanel().el);
});
