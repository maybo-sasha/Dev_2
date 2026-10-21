# 28 Days game — brief and completion audit

Status: the user has confirmed this implementation file as the working brief, together
with the attached visual/UI reference. No separate document is required to proceed.
This is not a completion report. Resolve unspecified mechanics through implementation
judgment while preserving the historical exploration premise.

## Requested outcome

Create the game from scratch according to the user's concept document and attached
UI/visual reference. Preserve the later requests to use the supplied opening video,
character concepts, environment concepts, and higher-quality first-person hands.
The existing interactive memorial is source material, not proof that the requested
game has been delivered.

## Inputs inspected

- UI reference: `C:/Users/maybo/.codex/attachments/65da9350-ef03-40dc-ad74-a8611e2ff2c7/image-1.png`.
- Visual sheets in `assets/28-days`: faceless civilians, soldiers and K9s, two
  sepia environment sheets. A weapons/vehicles sheet is also present and still
  needs visual inspection before using it.
- Existing implementation: `28-days.html`, `main.js`, `story.js`, `style.css`,
  and the procedural models in `gl/`.
- The attachment directory contains only the reference PNG. No game concept
  document was found among the workspace Markdown, PDF, or Word files searched.

## Visible reference requirements and current evidence

| Reference element | Existing evidence | Remaining verification or work |
| --- | --- | --- |
| Faceted sepia Warsaw environment | Procedural tenements, streets, reference-based architectural details | Match framing, density, skyline, gate composition, and lighting against the brief |
| Faceless residents, soldiers, and dogs | Shared character generators and animated guard dogs | Verify all required roles, interactions, and animation states from the concept document |
| Upper-left chapter number, title, date, description | Story chapters and transient text panels | Persistent chapter HUD matching the reference is not implemented |
| Objective list with active/completed markers | Existing movement follows a chapter-based route | Objective system, triggers, and completion rules are unspecified and not implemented |
| Upper-right Map / Journal / Archive / Settings | Small chapter map, photograph panels, sound/language controls | Four functioning panels with their required contents are not implemented |
| Right-side historical image card and photo action | Photograph overlays and source captions exist | Match the persistent card behavior and layout; verify required records |
| Lower-left circular minimap with route and player heading | Existing small map is positioned at the upper right | Reference placement, route display, heading, and navigation behavior need implementation |
| Bottom chapter timeline with current milestone | Chapters exist in story data | Visible timeline, navigation rules, and locked/completed states need implementation |
| Objective distance indicator | No corresponding HUD element identified | Requires actual objective/world coordinates; do not fabricate distances |
| Opening video | Supplied clip integrated into the project cover | Confirm intended entry flow against the written concept |
| Detailed player hands | Mirrored five-finger meshes and shader-driven grip blending | Verify in all final gameplay states, including climbing and holding props |

## Decisions that require the concept document

- Player role, camera mode, and whether this is guided exploration or free movement.
- Complete chapter sequence and the actions required in each chapter.
- Dialogue, inventory, collection, combat, failure, and ending rules, if any.
- Journal/archive contents and how entries are discovered.
- Saving, checkpoints, platform/device support, and accessibility requirements.

The UI reference alone does not establish these mechanics. Its depicted dates,
badges, and historical statements are not authoritative historical evidence.

## Acceptance evidence required

1. Map every requirement in the supplied concept document to implementation and
   runtime evidence before claiming completion.
2. Compare the rendered game with the attached UI and visual references at the
   intended desktop and mobile sizes.
3. Play through every required chapter and objective; verify all navigation,
   interaction, progression, and persistence paths that the document specifies.
4. Check rendering, character/hand animation, collision, input, and audio in the
   actual game, rather than relying only on isolated model previews.
5. Run the production build and inspect its working output. Existing build and
   geometry checks establish technical validity only; they do not prove the
   full game matches the missing concept document.
