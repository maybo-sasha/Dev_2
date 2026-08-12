/* ============================================================
   Gooey Tabs — the active tab is fused to the panel below it, and
   moving between tabs drags that fusion along.

   A port of the gooey tabs panel on ui.unlumen.com: the same four
   years and files, the same filter at strength 12, the same spring
   on the moving tab, and the same blurred cross-fade on the list
   (out upward, in from below, 0.2s ease-out).

   The original animates the tab with Framer's shared-layout
   (layoutId) between four slots. With fixed-width slots that is
   just one shape translated by its index, which is what this does.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/gooey-tabs/gooey-tabs.css">
     <div data-gooey-tabs></div>
     <script type="module" src="./assets/personal/gooey-tabs/gooey-tabs.js"></script>
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const YEARS = [
  { value: '2024', files: ['learning-to-meditate.md', 'spring-garden-plans.md', 'travel-wishlist.md', 'new-coding-projects.md'] },
  { value: '2023', files: ['year-in-review.md', 'marathon-training-log.md', 'recipe-collection.md', 'book-reflections.md'] },
  { value: '2022', files: ['moving-to-a-new-city.md', 'starting-a-blog.md', 'photography-basics.md', 'first-coding-project.md'] },
  { value: '2021', files: ['goals-and-aspirations.md', 'daily-gratitude.md', 'learning-to-cook.md', 'remote-work-journal.md'] },
];

let uid = 0;

export function createGooeyTabs({ tabs = YEARS, strength = 12 } = {}) {
  const id = `gooey-tabs-${++uid}`;
  const n = tabs.length;
  const listHTML = (t) => `<ul class="gt__list">${t.files.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`;

  const root = el(`
  <div class="gt ui" data-cursor="dark" style="--gt-n:${n};--gt-goo:url(#${id})">
    <svg class="gt__def" aria-hidden="true" focusable="false">
      <defs>
        <filter id="${id}">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${strength}" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"/>
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
      </defs>
    </svg>

    <div class="gt__wrap">
      <!-- filtered: the tab and the panel are one mass -->
      <div class="gt__goo" aria-hidden="true">
        <div class="gt__tabsrow"><i class="gt__pill"></i></div>
        <div class="gt__body"></div>
      </div>

      <!-- unfiltered: labels and the file list -->
      <div class="gt__top">
        <div class="gt__tabs" role="tablist" aria-label="Journal years">
          ${tabs
            .map(
              (t, i) => `
          <button class="gt__tab" type="button" role="tab" data-i="${i}"
                  id="${id}-tab-${i}" aria-controls="${id}-panel"
                  aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}">${esc(t.value)}</button>`
            )
            .join('')}
        </div>
        <div class="gt__panel" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-tab-0">
          <div class="gt__view">${listHTML(tabs[0])}</div>
        </div>
      </div>
    </div>

    <p class="gt__cap">Switch years — the tab <b>pours</b> across</p>
  </div>`);

  const pill = root.querySelector('.gt__pill');
  const view = root.querySelector('.gt__view');
  const panel = root.querySelector('.gt__panel');
  const tabEls = [...root.querySelectorAll('.gt__tab')];
  let active = 0;
  let swapping = null;

  function select(i) {
    if (i === active || i < 0 || i >= n) return;
    const prev = active;
    active = i;

    root.style.setProperty('--gt-i', String(i));
    tabEls.forEach((b, k) => {
      b.setAttribute('aria-selected', String(k === i));
      b.setAttribute('tabindex', k === i ? '0' : '-1');
    });
    panel.setAttribute('aria-labelledby', `${id}-tab-${i}`);

    /* out upward through blur, then in from below — the original's
       AnimatePresence popLayout, at the same 0.2s */
    clearTimeout(swapping);
    view.classList.add('is-leaving');
    swapping = setTimeout(() => {
      view.classList.remove('is-leaving');
      view.classList.add('is-entering');
      view.innerHTML = listHTML(tabs[i]);
      /* Commit the entering pose with a forced reflow, then release in the
         same task. Waiting on rAF instead would strand the list at opacity 0
         whenever frames are throttled — a background tab, or a tile that is
         still off-screen — and it would never come back. */
      void view.offsetWidth;
      view.classList.remove('is-entering');
    }, 200);

    return prev;
  }

  tabEls.forEach((b, i) => b.addEventListener('click', () => select(i)));

  root.querySelector('.gt__tabs').addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step) {
      e.preventDefault();
      const next = (active + step + n) % n;
      select(next);
      tabEls[next].focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : n - 1;
      select(next);
      tabEls[next].focus();
    }
  });

  root.style.setProperty('--gt-i', '0');

  return { el: root, select, get value() { return tabs[active].value; } };
}

document.querySelectorAll('[data-gooey-tabs]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createGooeyTabs({ strength: Number(host.dataset.strength) || 12 }).el);
});
