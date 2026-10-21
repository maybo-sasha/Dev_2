/* ============================================================
   Design system: what each page says.

   ds.js is the machinery (routing, the stage and the x-ray).
   This file is only the words and the wiring for each component:
   how to mount it, which of its parts to name, and the short
   scripted demonstration that plays on the live thing.

   A component entry:
     id, name, group
     lead      one sentence, shown under the title
     mount()   returns the live instance; its .el goes on the stage
     parts     [{ label, sel, note }]   sel is looked up inside .el
     steps     [{ say, at, run, hold }] the demonstration
                 say   the caption while this step plays
                 at    selector the pointer travels to first
                 run   (instance, tools) => void | Promise
                 hold  ms to stay on the step (default 1500)
     reset     (instance) => void       put it back when the demo ends
     expose    (instance) => void       open it far enough for the x-ray to
                                        show the parts that only exist then
     tokens    custom properties it draws on, shown with live values
     use       { do: [..], dont: [..] }
     keys      [[key, what it does]]
     glyph     inner SVG for its card on the index (48 x 48 box)
   ============================================================ */

import { createSelection } from '../../selection/selection.js';
import { createTypingInput } from '../../typing-input/typing-input.js';
import { createMultiSelect } from '../../multi-select/multi-select.js';
import { createActivationPanel } from '../../activation-button/activation-button.js';
import { createGooeyMenu } from '../../gooey-menu/gooey-menu.js';
import { createCommandBar } from '../../command-bar/command-bar.js';
import { createMorphNav } from '../../morph-nav/morph-nav.js';
import { createGooeyTabs } from '../../gooey-tabs/gooey-tabs.js';
import { createFileVault } from '../../file-vault/file-vault.js';
import { createButtonPanel } from '../../button/button.js';
import { createChipPanel } from '../../chip/chip.js';
import { createSliderPanel } from '../../slider/slider.js';
import { createProgressPanel } from '../../progress/progress.js';
import { createTooltipPanel } from '../../tooltip/tooltip.js';
import { createDialogPanel } from '../../dialog/dialog.js';

/* ── the four rules, from _system/system.css ─────────────── */
export const RULES = [
  {
    id: 'mono',
    title: 'Paper, carbon, a signal',
    text: 'Pale paper and carbon ink do the everyday work. Vermilion marks a primary action. Semantic green belongs to completion. Every colour has a job.',
  },
  {
    id: 'fill',
    title: 'State reads as fill',
    text: 'Resting is an outline on paper. Active is solid ink with paper on top. You can tell what is on without reading a single label.',
  },
  {
    id: 'ease',
    title: 'One ease for travel',
    text: 'Everything that moves from one place to another uses the same curve. Springs are kept for the things that should feel physical under your finger.',
  },
  {
    id: 'shape',
    title: 'Precise frames. Soft controls.',
    text: 'Corners step 4, 8, 12 and 18. Actions have one open, rounded corner; choices are compact tags. Circles belong to knobs and physical controls.',
  },
];

/* ── what every token is for ─────────────────────────────── */
export const TOKENS = {
  '--ui-bg': 'The canvas a component sits on',
  '--ui-bg-sunk': 'Wells, tracks and inset areas',
  '--ui-surface': 'Raised cards above the canvas',
  '--ui-fg': 'Primary ink and every filled shape',
  '--ui-on-fg': 'Content sitting on filled ink',
  '--ui-text': 'Body copy',
  '--ui-text-2': 'Secondary copy',
  '--ui-mute': 'Labels, placeholders and hints',
  '--ui-ok': 'Semantic green: completion',
  '--ui-accent': 'Vermilion: primary actions and the graphic signal',
  '--ui-on-accent': 'White content on the accent',
  '--ui-focus': 'High-contrast keyboard focus',
  '--ui-r-action': 'Signature action: one softer corner',
  '--ui-line': 'A visible border',
  '--ui-line-soft': 'A divider',
  '--ui-fill': 'Chip and hover wash',
  '--ui-fill-strong': 'A stronger wash',
  '--ui-shadow-sm': 'Resting on the surface',
  '--ui-shadow-md': 'Lifted, like a knob or a toolbar',
  '--ui-shadow-lg': 'Floating, like a panel or a dialog',
  '--ui-r-sm': 'Small holders: tips, keys, tags',
  '--ui-r-md': 'Fields and rows',
  '--ui-r-lg': 'Cards and panels',
  '--ui-r-xl': 'Large surfaces and dialogs',
  '--ui-r-full': 'Knobs, switches and circular icon controls',
  '--ui-e': 'Travel. The one curve',
  '--ui-e-in': 'Leaving, gathering speed',
  '--ui-spring': 'Physical things, with a little overshoot',
  '--ui-t-fast': 'Feedback under the finger',
  '--ui-t': 'A state changing',
  '--ui-t-slow': 'A shape changing size',
  '--ui-breath': 'One breath',
  '--ui-breath-slow': 'One slow breath',
  '--ui-fs-cap': 'Uppercase eyebrows',
  '--ui-fs-xs': 'Hints and captions',
  '--ui-fs-sm': 'Controls and labels',
  '--ui-fs-md': 'Body and inputs',
};

export const FOUNDATIONS = [
  { id: 'color', name: 'Color', lead: 'Pale paper and carbon ink. Vermilion for action, green for completion.' },
  { id: 'type', name: 'Type', lead: 'One family, four sizes, and a label style.' },
  { id: 'shape', name: 'Shape', lead: 'Five radii, and a rule for which one a thing gets.' },
  { id: 'motion', name: 'Motion', lead: 'One curve for travel, a spring for touch, three speeds.' },
  { id: 'breathing', name: 'Breathing', lead: 'The system moves a little before you touch it.' },
];

export const GROUPS = ['Actions', 'Selection', 'Text input', 'Navigation', 'Feedback', 'Containment'];

/* ── small helpers the demonstrations share ──────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// type into a real input one character at a time, firing the events a keyboard would
async function typeInto(input, text, tools, gap = 85) {
  for (const ch of text) {
    if (!tools.alive()) return;
    input.value += ch;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(gap);
  }
}
function clearInput(input) {
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
// a pointer press at the middle of an element, for components that listen for pointerdown
function pressAt(target) {
  const r = target.getBoundingClientRect();
  target.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true,
    clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0,
  }));
}
// show the squash a real press would give a button, then click it
async function tap(button) {
  button.classList.add('is-press');
  await sleep(150);
  button.classList.remove('is-press');
  button.click();
}
// move a slider to a value over time, so the knob has speed to stretch with
async function glide(slider, to, ms, tools) {
  const from = slider.value;
  const start = performance.now();
  return new Promise((done) => {
    const step = (now) => {
      if (!tools.alive()) { done(); return; }
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      slider.value = Math.round(from + (to - from) * e);
      if (t < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}

export const COMPONENTS = [
  /* ───────────────────────── Actions ───────────────────────── */
  {
    id: 'button',
    name: 'Button',
    group: 'Actions',
    lead: 'A clear next step. Vermilion emphasis and one softer corner make the primary action unmistakable.',
    mount: () => createButtonPanel(),
    parts: [
      { label: 'Container', sel: '.btn--filled', note: 'Vermilion with one softer corner: the signature primary action.' },
      { label: 'Label', sel: '.btn--filled .btn__label', note: 'Says what happens, in a verb.' },
      { label: 'Direction', sel: '.btn__go', note: 'Optional. Leans the way the action goes.' },
      { label: 'Outline', sel: '.btn--outline', note: 'The same action with less weight.' },
      { label: 'Icon button', sel: '.btn--icon', note: 'A circle, because it is only pressed.' },
    ],
    steps: [
      { say: 'Three weights. Vermilion for the primary action, outline for a secondary action, ghost for the quietest.', hold: 2200 },
      { say: 'Under the finger it squashes, wider than it is tall, and lets go on a spring.', at: '.btn--filled', run: (c) => tap(c.filled), hold: 1500 },
      { say: 'Outline is the same action with less weight.', at: '.btn--outline', run: (c) => tap(c.outline), hold: 1400 },
      { say: 'Ghost is nothing at all until you are near it.', at: '.btn--ghost', run: (c) => tap(c.ghost), hold: 1400 },
    ],
    tokens: ['--ui-accent', '--ui-on-accent', '--ui-focus', '--ui-line', '--ui-fill', '--ui-r-action', '--ui-spring', '--ui-t', '--ui-breath'],
    use: {
      do: ['Give a screen one filled button. It is the thing you want pressed.', 'Start the label with a verb: Save, Delete, Continue.'],
      dont: ['Put two filled buttons side by side. Neither reads as the main one.', 'Use an icon button for an action that needs explaining. Give it a label.'],
    },
    keys: [['Tab', 'Move to the button'], ['Enter or Space', 'Press it']],
    glyph: '<rect x="6" y="16" width="36" height="16" rx="8" fill="currentColor"/><path d="M17 24h11m-3-3.500 3.500 3.500-3.500 3.500" stroke="var(--ui-on-fg)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    id: 'activation-button',
    name: 'Activation Button',
    group: 'Actions',
    lead: 'One pill runs the whole job, from idle to working to done, without ever moving.',
    mount: () => createActivationPanel(),
    parts: [
      { label: 'Pill', sel: '.ab-btn', note: 'Never changes place. Only its face changes.' },
      { label: 'Badge', sel: '.ab-btn__badge', note: 'Arrow, then spinner, then tick. One disc.' },
      { label: 'Label', sel: '.ab-btn__label', note: 'Rolls to the next word like a split flap.' },
    ],
    steps: [
      { say: 'Idle. An arrow in a badge and a word.', hold: 1600 },
      { say: 'Pressed. The badge collapses into a spinner. The pill stays exactly where it is.', at: '.ab-btn', run: (c) => c.button.activate(), hold: 2300 },
      { say: 'Done. The face turns green. Completion is the one thing in the system that gets a colour.', hold: 2200 },
      { say: 'Then it rolls back, ready to go again.', run: (c) => c.button.reset(), hold: 1600 },
    ],
    reset: (c) => { if (c.button.state !== 'idle') c.button.reset(); },
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-ok', '--ui-r-full', '--ui-e', '--ui-spring', '--ui-breath'],
    use: {
      do: ['Use it when the wait is short and the result belongs to this button.', 'Let it show the result itself. No separate toast is needed.'],
      dont: ['Use it for work that takes minutes. Show Progress and let people leave.', 'Move or resize it between states. Staying put is the point.'],
    },
    keys: [['Tab', 'Move to the button'], ['Enter or Space', 'Start the job']],
    glyph: '<rect x="5" y="15" width="38" height="18" rx="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="24" r="6" fill="currentColor"/><path d="M12.500 24l2 2 3.500-4" stroke="var(--ui-bg)" stroke-width="1.800" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 24h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  },
  {
    id: 'gooey-menu',
    name: 'Gooey Menu',
    group: 'Actions',
    lead: 'Six actions peel out of one button like liquid, and seal back into it.',
    mount: () => createGooeyMenu(),
    parts: [
      { label: 'Toggle', sel: '.gm__toggle', note: 'Opens and closes the menu. The plus turns.' },
      { label: 'Core', sel: '.gm__core', note: 'The body everything leaves from and returns to.' },
      { label: 'Action', sel: '.gm__icons .gm__arm:nth-child(1) .gm__item', note: 'One of six, placed evenly around the core.' },
    ],
    steps: [
      { say: 'Closed, it is one button.', hold: 1500 },
      { say: 'Open. Each action stays joined to the core until it is far enough away to stand alone.', at: '.gm__toggle', run: (c) => c.open(), hold: 2600 },
      { say: 'Closing, they melt back into the one shape.', at: '.gm__toggle', run: (c) => c.close(), hold: 1800 },
    ],
    reset: (c) => c.close(),
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-r-full', '--ui-e', '--ui-breath-slow'],
    expose: (c) => c.open(),
    use: {
      do: ['Use it for a handful of actions that belong to one object.', 'Keep it to six or fewer. Past that the ring gets crowded.'],
      dont: ['Hide the main action of a screen inside it.', 'Use it where a row of buttons would fit. Revealing costs a press.'],
    },
    keys: [['Enter or Space', 'Open and close'], ['Arrow keys', 'Move between actions'], ['Esc', 'Close']],
    glyph: '<circle cx="24" cy="24" r="8" fill="currentColor"/><circle cx="24" cy="8" r="4" fill="currentColor"/><circle cx="38" cy="16" r="4" fill="currentColor"/><circle cx="38" cy="32" r="4" fill="currentColor"/><circle cx="24" cy="40" r="4" fill="currentColor"/><circle cx="10" cy="32" r="4" fill="currentColor"/><circle cx="10" cy="16" r="4" fill="currentColor"/>',
  },

  /* ───────────────────────── Selection ─────────────────────── */
  {
    id: 'selection',
    name: 'Selection Controls',
    group: 'Selection',
    lead: 'Checkbox, radio and switch built as soft bodies. The switch stretches across instead of jumping.',
    mount: () => createSelection(),
    parts: [
      { label: 'Box', sel: '.sl-check__box', note: 'Fills with ink when checked, then pops.' },
      { label: 'Ring', sel: '.sl-radio__ring', note: 'One of a set. The hole opens to show the choice.' },
      { label: 'Track', sel: '.sl-switch__track', note: 'Fills as the knob crosses it.' },
      { label: 'Knob', sel: '.sl-switch__knob', note: 'Stretches toward the far side before it settles.' },
    ],
    steps: [
      { say: 'At rest, every control is an outline on paper.', hold: 1800 },
      { say: 'Checked. The box fills with ink and the tick draws itself.', at: '.sl-check__box', run: (c) => c.el.querySelector('.sl-check input').click(), hold: 1700 },
      { say: 'A radio hole closes in one and opens in the other.', at: '.sl-radio:nth-child(2) .sl-radio__ring', run: (c) => c.el.querySelectorAll('.sl-radio input')[1].click(), hold: 1700 },
      { say: 'The switch knob stretches across the track. It never jumps.', at: '.sl-switch__track', run: (c) => c.el.querySelector('.sl-switch input').click(), hold: 2000 },
    ],
    reset: (c) => {
      const box = c.el.querySelector('.sl-check input');
      const sw = c.el.querySelector('.sl-switch input');
      if (box.checked) box.click();
      if (sw.checked) sw.click();
      c.el.querySelectorAll('.sl-radio input')[0].click();
    },
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-line', '--ui-r-full', '--ui-spring', '--ui-t'],
    use: {
      do: ['Use a switch for something that takes effect at once.', 'Use checkboxes when any number can be chosen, radios when exactly one can.'],
      dont: ['Use a switch inside a form that still needs a Save button.', 'Use a single radio. One choice is a checkbox.'],
    },
    keys: [['Tab', 'Move to a control'], ['Space', 'Toggle a checkbox or switch'], ['Arrow keys', 'Move within a radio group']],
    glyph: '<rect x="5" y="17" width="14" height="14" rx="4" fill="currentColor"/><path d="M8.500 24l2.500 2.500 4.500-5" stroke="var(--ui-bg)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="24" y="17" width="20" height="14" rx="7" fill="currentColor"/><circle cx="37" cy="24" r="4.500" fill="var(--ui-bg)"/>',
  },
  {
    id: 'chip',
    name: 'Chip',
    group: 'Selection',
    lead: 'A choice you can turn on and off. It grows to hold its own tick.',
    mount: () => createChipPanel(),
    parts: [
      { label: 'Container', sel: '.chip[aria-pressed="false"]', note: 'An outline while it is off.' },
      { label: 'Chosen', sel: '.chip[aria-pressed="true"]', note: 'Solid ink while it is on.' },
      { label: 'Tick', sel: '.chip[aria-pressed="true"] .chip__tick', note: 'Has no width until the chip is chosen.' },
      { label: 'Label', sel: '.chip[aria-pressed="true"] .chip__label', note: 'One or two words.' },
    ],
    steps: [
      { say: 'Off is an outline. On is ink. You read the set without reading the words.', hold: 2000 },
      { say: 'Chosen. The chip widens to make room for its tick, so the same body holds the new state.', at: '.chip:nth-child(1)', run: (c) => tap(c.chips[0]), hold: 1900 },
      { say: 'Any number can be on at once.', at: '.chip:nth-child(4)', run: (c) => tap(c.chips[3]), hold: 1500 },
      { say: 'Press again and it lets go.', at: '.chip:nth-child(1)', run: (c) => tap(c.chips[0]), hold: 1500 },
    ],
    reset: (c) => { c.chips.forEach((chip, i) => { if ((chip.getAttribute('aria-pressed') === 'true') !== (i === 1)) chip.click(); }); },
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-line', '--ui-r-full', '--ui-e', '--ui-spring'],
    use: {
      do: ['Use chips to filter something already on the screen.', 'Keep labels to one or two words.'],
      dont: ['Use a chip to start an action. That is a button.', 'Wrap more than two rows of them. Reach for Multi Select.'],
    },
    keys: [['Tab', 'Move to a chip'], ['Enter or Space', 'Turn it on or off']],
    glyph: '<rect x="4" y="16" width="24" height="16" rx="8" fill="currentColor"/><path d="M10 24l2.500 2.500 4.500-5" stroke="var(--ui-bg)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="31" y="17" width="13" height="14" rx="7" fill="none" stroke="currentColor" stroke-width="2"/>',
  },
  {
    id: 'slider',
    name: 'Slider',
    group: 'Selection',
    lead: 'One value along a line. The knob stretches the way it is dragged.',
    mount: () => createSliderPanel(),
    parts: [
      { label: 'Track', sel: '.sld__track', note: 'The whole range.' },
      { label: 'Fill', sel: '.sld__fill', note: 'Ink from the start up to the value.' },
      { label: 'Knob', sel: '.sld__knob', note: 'Stretches with speed and settles at rest.' },
      { label: 'Stops', sel: '.sld__stops', note: 'Only on a stepped slider.' },
    ],
    steps: [
      { say: 'At rest, a knob on a line.', hold: 1500 },
      { say: 'Held, the value rises out of the knob. It is the same body, not a tip pinned above it.', at: '.sld__knob', run: (c) => c.a.hold(true), hold: 1500 },
      { say: 'Dragged, the knob stretches the way it is going, and more the faster it goes.', run: (c, t) => glide(c.a, 94, 700, t), hold: 900 },
      { say: 'It settles the moment it stops.', run: async (c, t) => { await glide(c.a, 28, 900, t); c.a.hold(false); }, hold: 1300 },
      { say: 'A stepped slider shows its stops and names them.', at: '[data-f="b"] .sld__knob', run: async (c, t) => { c.b.hold(true); await glide(c.b, 4, 600, t); await sleep(500); c.b.hold(false); }, hold: 1400 },
    ],
    reset: (c) => { c.a.hold(false); c.b.hold(false); c.a.value = 62; c.b.value = 2; },
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-surface', '--ui-shadow-md', '--ui-r-full', '--ui-r-sm', '--ui-spring', '--ui-breath'],
    use: {
      do: ['Use it when the rough position matters more than the exact number.', 'Show the value while it is being moved.'],
      dont: ['Use it for a precise figure. A field is faster and kinder.', 'Use it for two or three options. Use chips.'],
    },
    keys: [['Tab', 'Move to the slider'], ['Arrow keys', 'One step'], ['Page Up or Page Down', 'A larger step'], ['Home or End', 'Either end']],
    glyph: '<path d="M6 24h36" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.250"/><path d="M6 24h20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="27" cy="24" r="7" fill="var(--ui-surface)" stroke="currentColor" stroke-width="2"/>',
  },
  {
    id: 'multi-select',
    name: 'Multi Select',
    group: 'Selection',
    lead: 'Pick a row and it travels up into the field, then unfolds into a chip.',
    mount: () => createMultiSelect(),
    parts: [
      { label: 'Field', sel: '.msel__field', note: 'Holds what has been chosen.' },
      { label: 'Count', sel: '.msel__count', note: 'How many are chosen.' },
      { label: 'Panel', sel: '.msel__panel', note: 'The options that are left.' },
      { label: 'Option', sel: '.msel__opt', note: 'Leaves the list once it is chosen.' },
    ],
    steps: [
      { say: 'Closed, the field shows what has been chosen so far.', hold: 1500 },
      { say: 'Open. The list is what is left to choose.', at: '.msel__field', run: (c) => c.open(), hold: 1500 },
      { say: 'Pick one. It inks over, squeezes to a dot, flies up and unfolds into a chip.', at: '.msel__opt', run: (c) => { const o = c.el.querySelector('.msel__opt'); if (o) pressAt(o); }, hold: 2400 },
      { say: 'The choice left the list, because it now lives in the field.', hold: 1700 },
      { say: 'Closing leaves the chips where they are.', run: (c) => c.close(), hold: 1300 },
    ],
    reset: (c) => { c.close(); c.el.querySelectorAll('.msel__chip-x').forEach((x) => x.click()); },
    expose: (c) => c.open(),
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-surface', '--ui-line', '--ui-r-md', '--ui-r-full', '--ui-shadow-lg', '--ui-e'],
    use: {
      do: ['Use it when the list is too long to show as chips.', 'Let chosen items leave the list. Showing them twice is noise.'],
      dont: ['Use it for one choice. That is a select.', 'Use it for fewer than five options. Show them all as chips.'],
    },
    keys: [['Enter or Space', 'Open the list'], ['Arrow keys', 'Move between options'], ['Enter', 'Choose the option'], ['Backspace', 'Remove the last chip'], ['Esc', 'Close']],
    glyph: '<rect x="4" y="8" width="40" height="14" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="8" y="12" width="13" height="6" rx="3" fill="currentColor"/><rect x="4" y="26" width="40" height="15" rx="5" fill="currentColor" opacity="0.140"/><path d="M10 31h20M10 36h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  },

  /* ───────────────────────── Text input ────────────────────── */
  {
    id: 'input',
    name: 'Input',
    group: 'Text input',
    lead: 'Letters land with a bit of weight, and the caret stretches into your selection.',
    mount: () => createTypingInput({ label: 'Say something', placeholder: 'Type here…' }),
    parts: [
      { label: 'Label', sel: '.ti__label', note: 'Says what goes in the field.' },
      { label: 'Field', sel: '.ti__field', note: 'A real input sits on top, invisible.' },
      { label: 'Caret', sel: '.ti__caret', note: 'One body. It widens to become the selection.' },
      { label: 'Count', sel: '.ti__count', note: 'How many characters so far.' },
    ],
    steps: [
      { say: 'Empty. The caret waits.', at: '.ti__field', run: (c) => { clearInput(c.el.querySelector('.ti__input')); }, hold: 1200 },
      { say: 'Each new letter lands with a little weight. Only new letters move.', run: (c, t) => typeInto(c.el.querySelector('.ti__input'), 'Built to feel alive', t), hold: 1000 },
      { say: 'The letters already there stay still. Moving them again would look like a fault.', hold: 2000 },
    ],
    reset: (c) => clearInput(c.el.querySelector('.ti__input')),
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-surface', '--ui-line', '--ui-mute', '--ui-r-md', '--ui-fs-md', '--ui-spring'],
    use: {
      do: ['Always give it a label that stays visible.', 'Say what went wrong under the field, in plain words.'],
      dont: ['Use the placeholder as the label. It disappears as soon as you type.', 'Animate what is already typed. Only what is new.'],
    },
    keys: [['Tab', 'Move to the field'], ['Shift and Arrow keys', 'Select, and the caret widens']],
    glyph: '<rect x="4" y="14" width="40" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 24h9" stroke="currentColor" stroke-width="2.500" stroke-linecap="round"/><path d="M25 19v10" stroke="currentColor" stroke-width="2.500" stroke-linecap="round"/>',
  },
  {
    id: 'command-bar',
    name: 'Command Bar',
    group: 'Text input',
    lead: 'A search that runs things. The pill widens into the palette rather than being replaced by one.',
    mount: () => createCommandBar(),
    parts: [
      { label: 'Shell', sel: '.cbar__shell', note: 'The pill, and later the whole palette.' },
      { label: 'Input', sel: '.cbar__input', note: 'Type to filter.' },
      { label: 'Shortcut', sel: '.cbar__keys', note: 'The keys that open it.' },
      { label: 'Command', sel: '.cbar__cmd', note: 'One thing it can do.' },
    ],
    steps: [
      { say: 'Closed, it is a pill with a shortcut on it.', hold: 1500 },
      { say: 'Open. The same pill widens into the palette.', at: '.cbar__shell', run: (c) => c.open(), hold: 1800 },
      { say: 'Typing narrows the list as you go.', run: (c, t) => typeInto(c.el.querySelector('.cbar__input'), 'the', t, 150), hold: 1700 },
      { say: 'Closing takes it back to the pill.', run: (c) => { clearInput(c.el.querySelector('.cbar__input')); c.close(); }, hold: 1400 },
    ],
    reset: (c) => { clearInput(c.el.querySelector('.cbar__input')); c.close(); },
    expose: (c) => c.open(),
    tokens: ['--ui-fg', '--ui-surface', '--ui-line', '--ui-fill', '--ui-r-lg', '--ui-r-full', '--ui-shadow-lg', '--ui-e'],
    use: {
      do: ['Use it as a fast path for people who already know the product.', 'Show the shortcut on the pill, so it can be learned.'],
      dont: ['Make it the only way to reach something.', 'Take the shortcut over for the whole page. Only while it has the pointer or focus.'],
    },
    keys: [['Ctrl K or Cmd K', 'Open'], ['Arrow keys', 'Move between commands'], ['Enter', 'Run the command'], ['Esc', 'Close']],
    glyph: '<rect x="4" y="15" width="40" height="18" rx="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="24" r="3.500" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.500 26.500l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="31" y="20" width="9" height="8" rx="2.500" fill="currentColor"/>',
  },

  /* ───────────────────────── Navigation ────────────────────── */
  {
    id: 'morph-nav',
    name: 'Morph Nav',
    group: 'Navigation',
    lead: 'One shape, never two. The bar stretches down into the panel and the marker slides along with you.',
    mount: () => createMorphNav(),
    parts: [
      { label: 'Body', sel: '.mn__body', note: 'The bar and the panel are this one element.' },
      { label: 'Tab', sel: '.mn__tab', note: 'A section. Hovering is enough to read it.' },
      { label: 'Marker', sel: '.mn__pill', note: 'One shape that travels between tabs.' },
    ],
    steps: [
      { say: 'At rest, a bar with one marker.', hold: 1500 },
      { say: 'The panel is not a second element. It is the same body, taller.', at: '.mn__tab:nth-child(1)', run: (c) => c.select(0), hold: 2100 },
      { say: 'The marker is one shape that slides. The body changes width to fit what it holds.', at: '.mn__tab:nth-child(3)', run: (c) => c.select(2), hold: 2200 },
      { say: 'Leaving returns it to exactly the shape it started in.', run: (c) => c.close(), hold: 1500 },
    ],
    reset: (c) => c.close(),
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-surface', '--ui-line-soft', '--ui-r-xl', '--ui-shadow-lg', '--ui-e', '--ui-t-slow'],
    expose: (c) => c.select(0),
    use: {
      do: ['Use it for a few top level sections, each with a short list under it.', 'Let hover open it. A section should be readable without committing to it.'],
      dont: ['Use it as a tab strip. Switching views is a click, and Gooey Tabs does that.', 'Put more than five sections in it.'],
    },
    keys: [['Tab', 'Move into the bar'], ['Arrow keys', 'Move between sections'], ['Esc', 'Close the panel']],
    glyph: '<rect x="5" y="9" width="38" height="30" rx="9" fill="none" stroke="currentColor" stroke-width="2"/><rect x="9" y="13" width="13" height="8" rx="4" fill="currentColor"/><path d="M27 17h4M35 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11 28h20M11 33h13" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.450"/>',
  },
  {
    id: 'gooey-tabs',
    name: 'Gooey Tabs',
    group: 'Navigation',
    lead: 'Tab and panel are fused into one surface, so switching stretches the join instead of cutting it.',
    mount: () => createGooeyTabs(),
    parts: [
      { label: 'Tab', sel: '.gt__tab', note: 'Joined to the panel while it is active.' },
      { label: 'Panel', sel: '.gt__panel', note: 'What the active tab shows.' },
      { label: 'View', sel: '.gt__view', note: 'Each tab answers a different question, so each has its own form.' },
    ],
    steps: [
      { say: 'The active tab and the panel under it are one surface.', hold: 1900 },
      { say: 'Switching stretches the join across. It is never cut and redrawn.', at: '.gt__tab:nth-child(2)', run: (c) => c.select(1), hold: 2200 },
      { say: 'Each tab answers a different question, so each one carries a different chart.', at: '.gt__tab:nth-child(3)', run: (c) => c.select(2), hold: 2200 },
      { say: 'Back to the first.', at: '.gt__tab:nth-child(1)', run: (c) => c.select(0), hold: 1500 },
    ],
    reset: (c) => c.select(0),
    tokens: ['--ui-fg', '--ui-surface', '--ui-line', '--ui-mute', '--ui-r-lg', '--ui-shadow-md', '--ui-e'],
    use: {
      do: ['Use it to switch between views of the same thing.', 'Keep it to four or five tabs with short labels.'],
      dont: ['Use tabs to move between unrelated pages. That is navigation.', 'Put a number on every mark in a chart. Label the peak and let the rest wait for hover.'],
    },
    keys: [['Tab', 'Move to the tabs'], ['Arrow keys', 'Switch tab'], ['Home or End', 'First or last tab']],
    glyph: '<path d="M5 39V20a5 5 0 0 1 5-5h5V11a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v4h10a5 5 0 0 1 5 5v19z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 33v-6M19 33v-10M26 33v-4M33 33v-8" stroke="currentColor" stroke-width="2.500" stroke-linecap="round"/>',
  },

  /* ───────────────────────── Feedback ──────────────────────── */
  {
    id: 'progress',
    name: 'Progress',
    group: 'Feedback',
    lead: 'How far along, or simply that something is happening.',
    mount: () => createProgressPanel(),
    parts: [
      { label: 'Track', sel: '.prg:not(.prg--loop)', note: 'The whole job.' },
      { label: 'Fill', sel: '.prg:not(.prg--loop) .prg__fill', note: 'How much of it is done.' },
      { label: 'Ring', sel: '.prg-ring', note: 'The same value, where there is no room for a bar.' },
      { label: 'Loop', sel: '.prg--loop', note: 'For when nobody knows how long it will take.' },
    ],
    steps: [
      { say: 'Work arrives in uneven steps, so the fill eases from one to the next.', at: '.pp__foot .btn', run: (c) => c.run(), hold: 3600 },
      { say: 'Done. The fill turns green and a tick takes the place of the number.', hold: 2300 },
      { say: 'When the length is unknown there is no fake percentage. One body travels and stretches.', at: '.prg--loop', hold: 2600 },
    ],
    reset: (c) => c.set(0.42),
    tokens: ['--ui-fg', '--ui-ok', '--ui-r-full', '--ui-e', '--ui-e-in', '--ui-t-slow'],
    use: {
      do: ['Show a bar when you know how much is left.', 'Say what is happening next to it: Uploading, Saving.'],
      dont: ['Invent a percentage. Use the loop when you do not know.', 'Use green for anything but done. It is the only colour, and that is its job.'],
    },
    keys: [['None', 'It is read out as a progress bar with its value']],
    glyph: '<path d="M6 30h36" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.250"/><path d="M6 30h22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M6 18h36" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.250"/><path d="M16 18h12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    group: 'Feedback',
    lead: 'A name for something that only shows a picture. One tip serves the whole row.',
    mount: () => createTooltipPanel(),
    parts: [
      { label: 'Trigger', sel: '[data-tip]', note: 'Anything that shows an icon and no words.' },
      { label: 'Tip', sel: '.tip', note: 'One per group. It moves, it is not swapped.' },
    ],
    steps: [
      { say: 'It grows up out of the thing you are pointing at.', at: '[data-tip]:nth-child(1)', run: (c) => c.show(0), hold: 1800 },
      { say: 'Move along and the same tip slides with you.', at: '[data-tip]:nth-child(2)', run: (c) => c.show(1), hold: 1500 },
      { say: 'It changes what it says. It is never two tips.', at: '[data-tip]:nth-child(3)', run: (c) => c.show(2), hold: 1700 },
      { say: 'Leave, and it goes.', run: (c) => c.hide(), hold: 1200 },
    ],
    reset: (c) => c.hide(),
    expose: (c) => c.show(1),
    tokens: ['--ui-fg', '--ui-on-fg', '--ui-r-sm', '--ui-fs-xs', '--ui-spring', '--ui-e'],
    use: {
      do: ['Use it to name an icon button.', 'Keep it to a few words. It is a name, not a paragraph.'],
      dont: ['Put anything in it that people must read to carry on.', 'Put a link or a button inside it. It goes away when you move.'],
    },
    keys: [['Tab', 'Focus the trigger, which shows the tip'], ['Esc', 'Hide it']],
    glyph: '<rect x="9" y="8" width="30" height="15" rx="5" fill="currentColor"/><path d="M20 23l4 5 4-5z" fill="currentColor"/><circle cx="24" cy="37" r="5" fill="none" stroke="currentColor" stroke-width="2"/>',
  },
  {
    id: 'dialog',
    name: 'Dialog',
    group: 'Feedback',
    lead: 'A question that has to be answered. The button you pressed becomes it.',
    mount: () => createDialogPanel(),
    parts: [
      { label: 'Trigger', sel: '.dlg-trigger', note: 'The button the dialog grows out of.' },
      { label: 'Surface', sel: '.dlg', note: 'Starts as the trigger, ends as the panel.' },
      { label: 'Title', sel: '.dlg__title', note: 'The question, in one line.' },
      { label: 'Actions', sel: '.dlg__actions', note: 'Two at most. The safe one on the left.' },
    ],
    steps: [
      { say: 'It starts as a button.', hold: 1400 },
      { say: 'Pressed, the button becomes the dialog. The surface begins in its shape, in its place.', at: '.dlg-trigger', run: (c) => c.dialog.open(), hold: 2600 },
      { say: 'The words wait until the surface is nearly its full size.', hold: 1600 },
      { say: 'Closing folds it back into the button it came from.', at: '.dlg__actions .btn--ghost', run: (c) => c.dialog.close('cancel'), hold: 1700 },
    ],
    reset: (c) => { if (c.dialog.isOpen) c.dialog.close('dismiss'); },
    expose: (c) => c.dialog.open(),
    tokens: ['--ui-surface', '--ui-fg', '--ui-text-2', '--ui-r-xl', '--ui-shadow-lg', '--ui-e', '--ui-t-slow'],
    use: {
      do: ['Use it when carrying on without an answer would do harm.', 'Name the buttons after what they do: Delete, Keep it.'],
      dont: ['Use it to say something worked. That is not a question.', 'Open one from another one.'],
    },
    keys: [['Tab', 'Move between the two actions. Focus stays inside'], ['Enter', 'Take the focused action'], ['Esc', 'Close without deciding']],
    glyph: '<rect x="7" y="10" width="34" height="28" rx="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 18h14M13 23h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="26" y="28" width="11" height="6" rx="3" fill="currentColor"/>',
  },

  /* ───────────────────────── Containment ───────────────────── */
  {
    id: 'file-vault',
    name: 'File Vault',
    group: 'Containment',
    lead: 'A folder that opens. The drawer slides out with the files inside.',
    mount: () => createFileVault({ title: 'Campaign Briefs', subtitle: 'Client & Internal Notes', unit: 'Files' }),
    parts: [
      { label: 'Folder', sel: '.fvault__folder', note: 'The whole thing is the button.' },
      { label: 'Count', sel: '.fvault__count-front', note: 'How much is inside, before you open it.' },
      { label: 'Drawer', sel: '.fvault__panel', note: 'Slides out of the folder with the files.' },
    ],
    steps: [
      { say: 'Closed, it tells you what it holds and how much.', hold: 1700 },
      { say: 'Open. The drawer slides out of the folder with the files inside.', at: '.fvault__folder', run: (c) => c.open(), hold: 2800 },
      { say: 'Closing pushes the drawer back in.', run: (c) => c.close(), hold: 1700 },
    ],
    reset: (c) => c.close(),
    tokens: ['--ui-fg', '--ui-surface', '--ui-line', '--ui-mute', '--ui-r-lg', '--ui-r-xl', '--ui-shadow-lg', '--ui-e'],
    expose: (c) => c.open(),
    use: {
      do: ['Use it to tuck a set of files behind one object.', 'Show the count on the closed folder, so people know what they will find.'],
      dont: ['Use it for a single file. Show the file.', 'Nest one folder inside another.'],
    },
    keys: [['Enter or Space', 'Open the folder'], ['Type', 'Filter the files'], ['Esc', 'Close']],
    glyph: '<path d="M5 15a4 4 0 0 1 4-4h9l4 5h17a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 26h17M12 31h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  },
];

/* ============================================================
   For the pages' new layout: the points each overview opens with,
   the picture each card shows, and the colours of each hero.
   ============================================================ */

import { createButton as mkButton } from '../../button/button.js';
import { createChip as mkChip } from '../../chip/chip.js';
import { createSlider as mkSlider } from '../../slider/slider.js';
import { createSwitch as mkSwitch, createCheckbox as mkCheckbox } from '../../selection/selection.js';
import { createProgress as mkProgress, createProgressRing as mkRing } from '../../progress/progress.js';

/* three or four things to know before anything else */
export const POINTS = {
  button: ['Three weights: filled, outline and ghost', 'Emphasis is how much ink a button carries', 'It squashes under the finger and lets go on a spring', 'One filled button to a screen'],
  'activation-button': ['One pill carries the whole job: idle, working, done', 'It never moves or resizes between states', 'Done is the one place the system uses a colour', 'Best for work that finishes in a few seconds'],
  'gooey-menu': ['Up to six actions inside one button', 'Each action stays joined until it is far enough away', 'Closing melts them back into the one shape', 'For actions that belong to a single object'],
  selection: ['Checkbox, radio and switch share one soft body', 'The switch knob stretches across, it never jumps', 'Native inputs underneath, so keyboard and screen readers just work', 'A switch takes effect at once, a checkbox waits for Save'],
  chip: ['Off is an outline, on is solid ink', 'The chip grows to hold its own tick', 'Any number can be on at once', 'For filtering what is already on the screen'],
  slider: ['The knob stretches in the direction it is dragged', 'The value rises out of the knob while it is held', 'A native range input underneath', 'For rough positions, not exact figures'],
  'multi-select': ['A chosen row travels up into the field and becomes a chip', 'Chosen options leave the list', 'Clearing a chip puts it back where it was', 'For lists too long to show as chips'],
  input: ['New letters land with a little weight', 'Letters already typed stay still', 'The caret is one body that widens into the selection', 'A real input sits on top, so everything native still works'],
  'command-bar': ['The pill widens into the palette, it is not replaced by one', 'Typing narrows the list as you go', 'The shortcut only listens while it has the pointer or focus', 'A fast path, never the only path'],
  'morph-nav': ['The bar and the panel are one element', 'One marker slides between sections', 'Hover opens it, so a section can be read without committing', 'Leaving returns it to the shape it started in'],
  'gooey-tabs': ['The active tab is fused to its panel', 'Switching stretches the join across', 'Each tab carries the chart its question needs', 'Four or five tabs, short labels'],
  progress: ['A bar and a ring for a known length', 'A travelling body for an unknown one', 'Done turns green, the only colour in the system', 'Say what is happening next to it'],
  tooltip: ['One tip serves a whole row of triggers', 'It grows out of the thing you point at', 'Moving along slides the same tip across', 'A name, not a paragraph'],
  dialog: ['The button you pressed becomes the dialog', 'Closing folds it back into that button', 'Focus moves in and stays in until it is answered', 'Two actions at most'],
  'file-vault': ['The whole folder is the button', 'The drawer slides out with the files inside', 'The count is shown before you open it', 'For tucking a set of files behind one object'],
};

/* the tile colour and shapes behind each family's live component */
export const GROUP_ART = {
  Actions:     { bg: 'var(--x-violet)', a: 'var(--x-signal)', b: 'var(--x-ink)' },
  Selection:   { bg: 'var(--x-signal)', a: 'var(--x-violet)', b: 'var(--x-sky)' },
  'Text input': { bg: 'var(--x-sky)',   a: 'var(--x-blue)',   b: 'var(--x-yellow)' },
  Navigation:  { bg: 'var(--x-orange)', a: 'var(--x-yellow)', b: 'var(--x-olive)' },
  Feedback:    { bg: 'var(--x-pink)',   a: 'var(--x-violet)', b: 'var(--x-yellow)' },
  Containment: { bg: 'var(--x-yellow)', a: 'var(--x-orange)', b: 'var(--x-green)' },
};

/* What a card shows. Where the component has small parts, the card shows the
   real ones, and `play` runs them once when the pointer arrives. The rest
   show their drawing (the glyph), which ds.js falls back to. */
const wrap = (...nodes) => {
  const box = document.createElement('div');
  box.className = 'm3-thumb';
  box.append(...nodes);
  return box;
};
const later = (fn, ms) => setTimeout(fn, ms);

export const THUMBS = {
  button: () => {
    const main = mkButton({ label: 'Continue', variant: 'filled', size: 'lg', go: true });
    const side = mkButton({ icon: 'plus', variant: 'outline', title: 'Add' });
    return { el: wrap(main, side), play: () => { main.classList.add('is-press'); later(() => main.classList.remove('is-press'), 180); } };
  },
  chip: () => {
    const a = mkChip({ label: 'Motion', selected: true });
    const b = mkChip({ label: '3D' });
    const c = mkChip({ label: 'Systems' });
    return { el: wrap(a, b, c), play: () => { b.click(); later(() => b.click(), 1300); } };
  },
  slider: () => {
    const s = mkSlider({ value: 58, label: 'Example' });
    let busy = false;
    return {
      el: wrap(s.el),
      play: () => {
        if (busy) return;
        busy = true;
        s.hold(true);
        const from = s.value, start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / 1100);
          s.value = Math.round(from + Math.sin(t * Math.PI) * 34);
          if (t < 1) requestAnimationFrame(step); else { s.hold(false); busy = false; }
        };
        requestAnimationFrame(step);
      },
    };
  },
  selection: () => {
    const box = mkCheckbox({ checked: true });
    const sw = mkSwitch({});
    return { el: wrap(box, sw), play: () => { const i = sw.querySelector('input'); i.click(); later(() => i.click(), 1400); } };
  },
  progress: () => {
    const ring = mkRing({ value: 0.62 });
    const bar = mkProgress({ value: 0.62 });
    const set = (v) => { ring.set(v); bar.set(v); };
    return { el: wrap(ring.el, bar.el), play: () => { set(1); later(() => set(0.62), 1700); } };
  },
};
