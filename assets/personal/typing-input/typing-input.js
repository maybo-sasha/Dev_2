/* ============================================================
   Typing Input — characters arrive with weight, and the caret is
   one body that travels and stretches.

   Inspired by the animated input on ui.unlumen.com, built from
   behaviour rather than ported, against this playground's thesis:

     · a selection is not a different object from a caret — it is
       the same caret widened, pinned by both edges so it can
       stretch the way the switch knob does
     · only genuinely new characters animate. Re-animating the
       whole string on every keystroke is the swap this playground
       argues against, and it looks like a fault
     · the glyphs a selection covers invert rather than sitting
       under a tinted wash, which is the same "state reads as
       fill" rule the rest of the system follows

   A real <input> sits on top with transparent text and caret, so
   pointer selection, drag, IME and screen readers all behave
   natively. The mirror underneath is what you see.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/typing-input/typing-input.css">
     <div data-typing-input></div>
     <script type="module" src="./assets/personal/typing-input/typing-input.js"></script>
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let uid = 0;

export function createTypingInput({
  label = 'Say something',
  placeholder = 'Type here…',
  value = '',
  max = 64,
} = {}) {
  const id = `ti-${++uid}`;

  const root = el(`
  <div class="ti ui" data-cursor="dark">
    <div class="ti__card">
      <p class="ti__label"><label for="${id}">${esc(label)}</label></p>
      <div class="ti__field">
        <i class="ti__caret" aria-hidden="true"></i>
        <div class="ti__mirror" aria-hidden="true"><span class="ti__ph">${esc(placeholder)}</span></div>
        <input class="ti__input" id="${id}" type="text" maxlength="${max}"
               autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(value)}">
      </div>
      <div class="ti__foot">
        <span>Select some text — the caret <b>stretches</b> into it</span>
        <span class="ti__count"><b>0</b>/${max}</span>
      </div>
    </div>
  </div>`);

  const input = root.querySelector('.ti__input');
  const mirror = root.querySelector('.ti__mirror');
  const caret = root.querySelector('.ti__caret');
  const ph = root.querySelector('.ti__ph');
  const count = root.querySelector('.ti__count b');

  let prev = '';
  let typingTimer = 0;

  /* Rebuild the glyphs, marking only what is genuinely new. A common
     prefix/suffix diff keeps paste and mid-string insertion honest —
     length alone would re-land every character after the caret. */
  function render(next) {
    let a = 0;
    const min = Math.min(prev.length, next.length);
    while (a < min && prev[a] === next[a]) a++;
    let b = 0;
    while (b < min - a && prev[prev.length - 1 - b] === next[next.length - 1 - b]) b++;
    const from = a;
    const to = next.length - b;

    const chars = [...next].map((c, i) => {
      const isNew = i >= from && i < to;
      return `<span class="ti__ch${isNew ? ' is-new' : ''}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`;
    });
    mirror.innerHTML = chars.join('');
    mirror.appendChild(ph);
    prev = next;
  }

  /* The caret is positioned from the glyphs themselves, so it can never
     drift out of step with what is drawn. */
  function place() {
    const chs = [...mirror.querySelectorAll('.ti__ch')];
    const s = input.selectionStart ?? 0;
    const e = input.selectionEnd ?? s;
    const hasSel = e > s;

    const edge = (i) => {
      if (!chs.length) return 0;
      if (i <= 0) return chs[0].offsetLeft;
      const c = chs[Math.min(i, chs.length) - 1];
      return c.offsetLeft + c.offsetWidth;
    };

    const x = edge(s);
    caret.style.setProperty('--ti-x', `${x}px`);
    caret.style.width = hasSel ? `${Math.max(edge(e) - x, 2)}px` : 'var(--ti-caret)';

    chs.forEach((c, i) => c.classList.toggle('is-sel', hasSel && i >= s && i < e));
    root.classList.toggle('has-sel', hasSel);
  }

  function sync({ typed = false } = {}) {
    const v = input.value;
    if (v !== prev) render(v);
    root.classList.toggle('has-text', v.length > 0);
    count.textContent = String(v.length);
    if (typed) {
      root.classList.add('is-typing');
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => root.classList.remove('is-typing'), 420);
    }
    place();
  }

  /* the landing class is transient — once it has played there is no
     reason for the glyph to keep carrying an animation */
  mirror.addEventListener('animationend', (e) => {
    if (e.animationName === 'ti-land') e.target.classList.remove('is-new');
  });

  input.addEventListener('input', () => sync({ typed: true }));
  /* selectionchange is the only event that fires for every way a
     selection can move — arrows, shift-drag, double-click, select-all */
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === input) place();
  });
  input.addEventListener('focus', () => { root.classList.add('is-focus'); place(); });
  input.addEventListener('blur', () => { root.classList.remove('is-focus', 'has-sel'); });

  new ResizeObserver(() => place()).observe(mirror);

  if (value) { input.value = value; }
  sync();

  return {
    el: root,
    focus: () => input.focus(),
    get value() { return input.value; },
    set value(v) { input.value = v; sync(); },
  };
}

document.querySelectorAll('[data-typing-input]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createTypingInput({
    label: host.dataset.label || 'Say something',
    placeholder: host.dataset.placeholder || 'Type here…',
  }).el);
});
