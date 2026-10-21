/* ============================================================
   Dialog. Opens out of the button that asked for it.

   createDialog({ scope, trigger, ... }) builds the surface inside
   `scope` (a positioned element; the dialog is centred in it) and
   opens when `trigger` is pressed. Opening measures the trigger and
   starts the surface there, so it reads as the button growing.

   While open it is a modal dialog: focus moves in and is kept in,
   Escape and the scrim close it, and focus goes back to the trigger.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/personal/dialog/dialog.css">
     <div data-dialog></div>
     <script type="module" src="./assets/personal/dialog/dialog.js"></script>
   ============================================================ */

import { createButton } from '../button/button.js';

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let uid = 0;

export function createDialog({
  scope,
  trigger,
  title = 'Are you sure?',
  body = '',
  confirm = 'Confirm',
  cancel = 'Cancel',
  onClose = null,
} = {}) {
  const id = `dlg-${++uid}`;
  const scrim = el('<div class="dlg-scrim"></div>');
  const dlg = el(`
    <div class="dlg" role="dialog" aria-modal="true" aria-labelledby="${id}-t" aria-describedby="${id}-b" tabindex="-1">
      <div class="dlg__in">
        <h3 class="dlg__title" id="${id}-t">${esc(title)}</h3>
        <p class="dlg__body" id="${id}-b">${esc(body)}</p>
        <div class="dlg__actions"></div>
      </div>
    </div>`);
  const no = createButton({ label: cancel, variant: 'ghost' });
  const yes = createButton({ label: confirm, variant: 'filled' });
  dlg.querySelector('.dlg__actions').append(no, yes);
  scope.append(scrim, dlg);
  trigger.classList.add('dlg-trigger');

  let open = false;
  let closeTimer = 0;

  // Where the trigger is, measured against where the dialog rests.
  function aim() {
    const s = scope.getBoundingClientRect();
    const t = trigger.getBoundingClientRect();
    const w = dlg.offsetWidth, h = dlg.offsetHeight;
    dlg.style.setProperty('--dlg-x', (t.left + t.width / 2 - (s.left + s.width / 2)) + 'px');
    dlg.style.setProperty('--dlg-y', (t.top + t.height / 2 - (s.top + s.height / 2)) + 'px');
    dlg.style.setProperty('--dlg-sx', (t.width / w).toFixed(4));
    dlg.style.setProperty('--dlg-sy', (t.height / h).toFixed(4));
  }

  function setOpen(next, result) {
    if (next === open) return;
    open = next;
    clearTimeout(closeTimer);
    if (open) {
      aim();
      dlg.classList.remove('is-closing');
      dlg.classList.add('is-from');
      void dlg.offsetWidth;                 // start from the button, then let go
      trigger.classList.add('is-away');
      dlg.classList.add('is-open');
      dlg.classList.remove('is-from');
      scrim.classList.add('is-open');
      yes.focus({ preventScroll: true });
    } else {
      aim();
      dlg.classList.add('is-closing', 'is-from');
      dlg.classList.remove('is-open');
      scrim.classList.remove('is-open');
      const ms = parseFloat(getComputedStyle(dlg).transitionDuration) * 1000 || 700;
      closeTimer = setTimeout(() => {
        dlg.classList.remove('is-closing', 'is-from');
        trigger.classList.remove('is-away');
        trigger.focus({ preventScroll: true });
      }, ms);
      if (onClose) onClose(result || 'dismiss');
    }
  }

  trigger.addEventListener('click', () => setOpen(true));
  scrim.addEventListener('click', () => setOpen(false, 'dismiss'));
  no.addEventListener('click', () => setOpen(false, 'cancel'));
  yes.addEventListener('click', () => setOpen(false, 'confirm'));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); setOpen(false, 'dismiss'); return; }
    if (e.key !== 'Tab') return;
    // two actions, so keeping focus inside is a swap
    e.preventDefault();
    (document.activeElement === yes ? no : yes).focus({ preventScroll: true });
  });

  return {
    el: dlg,
    open: () => setOpen(true),
    close: (result) => setOpen(false, result),
    get isOpen() { return open; },
  };
}

export function createDialogPanel() {
  const root = el(`
  <div class="dp ui" data-cursor="dark">
    <div class="dp__inner">
      <header class="dp__head">
        <p class="ui-eyebrow">Dialog</p>
        <p class="dp__sub">Grows out of its button</p>
      </header>
      <p class="dp__said" aria-live="polite">Nothing deleted yet.</p>
    </div>
  </div>`);

  const inner = root.querySelector('.dp__inner');
  const said = root.querySelector('.dp__said');
  const trigger = createButton({ label: 'Delete project', variant: 'filled', size: 'lg' });
  inner.insertBefore(trigger, said);

  const words = { confirm: 'Deleted. It is gone.', cancel: 'Kept. Nothing changed.', dismiss: 'Closed without deciding.' };
  const dialog = createDialog({
    scope: root,
    trigger,
    title: 'Delete this project?',
    body: 'Its files and history go with it. This cannot be undone.',
    confirm: 'Delete',
    cancel: 'Keep it',
    onClose: (r) => { said.textContent = words[r] || ''; },
  });

  return { el: root, trigger, dialog };
}

document.querySelectorAll('[data-dialog]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createDialogPanel().el);
});
