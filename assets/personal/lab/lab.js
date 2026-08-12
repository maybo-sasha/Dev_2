/* ============================================================
   Lab — one screen assembled entirely from the other components.

   Nothing here draws a control. Every part is imported from the
   component that owns it, which is the point: if the design system
   is real, a screen should be composable out of it without any of
   the pieces being reopened.

     Morph Nav          the navigation
     Typing Input       the title field
     Multi Select       techniques
     Selection Controls the option row — as primitives, not the
                        specimen: createSwitch / createCheckbox /
                        createRadioGroup are exported for exactly
                        this, and the specimen row is a display of
                        them rather than the thing itself
     Activation Button  publish
     Gooey Tabs         the activity panel
     File Vault         attachments
     Gooey Menu         the floating action menu
     Command Bar        ⌘K, overlaying the screen

   Standalone: vanilla JS, no libraries beyond the GSAP the
   Activation Button already requires.

   Usage:
     <link rel="stylesheet" href="./assets/personal/lab/lab.css">
     <div data-lab></div>
     <script type="module" src="./assets/personal/lab/lab.js"></script>
   ============================================================ */

import { createMorphNav } from '../morph-nav/morph-nav.js';
import { createTypingInput } from '../typing-input/typing-input.js';
import { createMultiSelect } from '../multi-select/multi-select.js';
import { createSwitch, createCheckbox, createRadioGroup } from '../selection/selection.js';
import { createActivationButton } from '../activation-button/activation-button.js';
import { createGooeyTabs } from '../gooey-tabs/gooey-tabs.js';
import { createFileVault } from '../file-vault/file-vault.js';
import { createGooeyMenu } from '../gooey-menu/gooey-menu.js';
import { createCommandBar } from '../command-bar/command-bar.js';

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

export function createLab() {
  const root = el(`
  <div class="lab ui" data-cursor="dark">
    <header class="lab__top">
      <p class="lab__brand"><b>Playground</b><span>Lab</span></p>
      <div class="lab__nav"></div>
      <button class="lab__k" type="button">Search <kbd>⌘</kbd><kbd>K</kbd></button>
    </header>

    <div class="lab__main">
      <div class="lab__col">
        <section class="lab__card lab__card--grow">
          <p class="lab__h"><b>New experiment</b><span>Draft</span></p>
          <div class="lab__title"></div>
          <div class="lab__tags"></div>
          <p class="lab__h"><b>Options</b></p>
          <div class="lab__opts"></div>
          <div class="lab__kind"></div>
          <div class="lab__foot">
            <p class="lab__note">Publishing adds it to the research index and the gallery below.</p>
            <div class="lab__go"></div>
          </div>
        </section>
      </div>

      <div class="lab__col">
        <section class="lab__card lab__card--flush">
          <div class="lab__tabs"></div>
        </section>
        <section class="lab__card lab__card--flush lab__card--grow">
          <div class="lab__files"></div>
        </section>
      </div>
    </div>

    <div class="lab__fab"></div>
    <div class="lab__cmd"></div>
  </div>`);

  const put = (sel, node) => { if (node) root.querySelector(sel).appendChild(node); };

  put('.lab__nav', createMorphNav().el);

  put('.lab__title', createTypingInput({
    label: 'Title',
    placeholder: 'What is it called?',
    value: 'Gooey selection controls',
  }).el);

  put('.lab__tags', createMultiSelect().el);

  /* the option row uses the exported primitives directly — the
     Selection Controls tile is a display of these, not the source */
  const opts = root.querySelector('.lab__opts');
  opts.append(
    createSwitch({ label: 'Show in research index', checked: true, name: 'index' }),
    createSwitch({ label: 'Allow comments', name: 'comments' }),
    createCheckbox({ label: 'Include source', checked: true, name: 'source' }),
  );

  put('.lab__kind', createRadioGroup({
    label: 'Visibility',
    name: 'lab-visibility',
    options: [
      { label: 'Public', checked: true },
      { label: 'Unlisted' },
      { label: 'Private' },
    ],
  }));

  const publish = createActivationButton({
    idleLabel: 'Publish',
    pendingLabel: 'Publishing',
    doneLabel: 'Published',
    size: 'lg',
    srLabel: 'Experiment',
  });
  if (publish) put('.lab__go', publish.el);

  put('.lab__tabs', createGooeyTabs({ strength: 10 }).el);

  const vault = createFileVault();
  if (vault) put('.lab__files', vault.el);

  put('.lab__fab', createGooeyMenu({ strength: 12 }).el);

  const bar = createCommandBar();
  put('.lab__cmd', bar.el);

  /* the header chip is just another way into the same palette — the
     component already owns ⌘K itself */
  const shell = bar.el.querySelector('.cbar__shell');
  root.querySelector('.lab__k').addEventListener('click', () => shell.click());

  return { el: root };
}

document.querySelectorAll('[data-lab]').forEach((host) => {
  if (host.firstElementChild) return;
  host.appendChild(createLab().el);
});
