# Form / Playground

A design language by Sasha Mayboroda: precise frames, expressive controls.

Material informs the organization: foundations, semantic tokens, component families,
anatomy, interaction states, usage guidance and accessibility. Form defines its own
typography, palette, geometry, navigation and presentation.

## Visual rules

- **Paper and carbon.** Pale paper `#f5f5f0`, white raised surfaces, carbon
  `#202a27`. The documentation uses one light frame with clear, fine rules.
- **A signal, with a purpose.** Vermilion `#ad4330` identifies primary actions and
  editorial markers. Use white text on the signal. Completion keeps its semantic green;
  selected controls retain a tick or a fill change so colour is never the only cue.
- **Character in type.** Space Grotesk for titles, body and controls. IBM Plex Mono
  for technical notation. Medium-weight, tightly spaced headlines; readable body
  copy with generous line height. System font fallbacks keep controls usable while
  web fonts load.
- **Shape has a role.** Radius scale: 4 / 8 / 12 / 18px. Primary buttons use
  `--ui-r-action`: 4 / 12 / 4 / 4px. Chips are compact 4px tags. Round knobs,
  switches and icon controls retain their physical character. Large article frames
  stay precise. All values live in shared tokens.
- **Structure through rules.** Fine dividers, indexed labels, an editorial rail and
  underlined article tabs. Component demos sit on paper inside the frame. Index
  pages use open lists and custom diagram icons built from measured strokes,
  open frames and a solid datum.
- **Motion through touch.** Preserve the shared travel curve, press feedback and
  purposeful morphs. The home page shows working controls as an interaction study.
  Honour the user's reduced-motion preference.

## Implementation

`system.css` owns shared component tokens. Individual component CSS owns shapes and
states. `ds/ds.css` owns documentation layout and its light shell. `ds/content.js`
documents components; `ds/ds.js` mounts live demos and routes pages.
`ds/examples.js` and `ds/examples.css` present three connected sample product
screens: overview, project detail and mobile focus.
Existing `m3-*` classes and `--md-*` shell aliases remain internal compatibility
names, not a dependency on Material or a public design vocabulary.

The documentation and Playground load the same component styles. Changes to shared
tokens apply in both places. Keep token descriptions and rendered components
synchronized when changing the language. `ds/icons.svg` holds the shared notation
icons used by navigation and the index pages.
