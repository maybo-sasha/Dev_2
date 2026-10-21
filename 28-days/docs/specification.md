# 28 DAYS — Master Production Specification

**Project:** Warsaw Ghetto Uprising interactive historical experience  
**Version:** 1.0 · 4 October 2026  
**Language:** English specification; localization-ready product  
**Deliverable:** Browser-based cinematic guided exploration, with an equivalent accessible reading experience  
**Audience:** The AI coding agent, creative director, 3D artist, narrative editor, historical researcher, audio team, and QA team

### Document navigation

- [Experience and scope](#2-experience-promise-and-scope)
- [Historical rules](#3-historical-editorial-contract)
- [Complete route](#4-complete-route-and-navigation)
- [All 21 scene cards](#5-scene-by-scene-implementation-cards)
- [Graphical direction](#6-graphical-direction)
- [UI and accessibility](#7-ui-system-and-accessibility)
- [Interaction and movement](#8-interaction-and-visitor-movement)
- [Technical architecture](#9-technical-architecture)
- [Narrative and data contracts](#10-narrative-engine-and-data-contracts)
- [State machine](#11-state-machine)
- [Evidence and archive](#12-evidence-archive-and-source-system)
- [Camera, lighting, effects, audio](#13-camera-lighting-post-processing-and-audio)
- [Blender pipeline](#14-blender-architecture-and-export-pipeline)
- [Assets and budgets](#15-asset-inventory-and-budgets)
- [Performance](#16-performance-targets-and-adaptive-quality)
- [Production](#17-production-pipeline-and-review-checkpoints)
- [QA and definition of done](#18-qa-and-definition-of-done)
- [Build plan](#19-step-by-step-build-plan)
- [Agent handoff and checklist](#20-coding-agent-completion-report-format)

## 1. Instructions to the building agent

Build the experience described here. Preserve its narrative, ethical boundaries, visual language, and chapter order. Make ordinary implementation decisions autonomously; record consequential deviations in a decision log. This specification is a production brief, not a claim that assets, historical clearances, recordings, or tested performance already exist.

Start with the foundation and one polished vertical slice. Use temporary geometry and explicitly marked editorial placeholders where production resources are missing. Do not silently replace historical research with generated facts or replace the visual ambition with a generic landing page. A functioning prototype is not the finished production.

The following requirements are mandatory:

1. The visitor is an observer moving through a reconstruction, never a named victim or fighter whose fate they control.
2. No shooting, aiming, kill counts, health bars, ammunition inventories, faction selection, leveling, loot, survival scores, boss fights, or alternative historical outcomes.
3. ŻOB and ŻZW are distinct organizations within one uprising. ŻZW receives a substantial mandatory chapter and continuity into the archive.
4. Civilian hiding, mutual support, documentation, and refusal to comply receive narrative attention alongside armed resistance.
5. Reconstruction, interpretation, testimony, and established historical claims remain visibly distinguishable.
6. Faceless, low-poly human figures and carefully authored Warsaw environments form the 3D language. The archive introduces documented people through actual records.
7. Movement is cinematic and guided; browsing, reading, pausing, skipping movement, and changing comfort settings are always possible.
8. Historical outcomes never depend on interaction speed, evidence completion, navigation skill, or the visitor's choices.
9. A complete non-WebGL story and archive must ship with the 3D experience.
10. High production value means composition, coherent art, sound, pacing, and polish—not maximal polygon counts or effects.

Do not contact institutions, buy assets, publish the website, or imply endorsement without the project owner's authorization. Build local, reviewable results first. Reference material under `sources/`, if supplied later, is read-only.

### Requirement language

- **MUST:** release requirement.
- **SHOULD:** intended default; deviations need a documented reason.
- **MAY:** optional enhancement after the complete core experience works.
- **Editorial proposal:** written for this production; not a historical quotation.
- **Research gate:** an item that requires source-level review before public presentation as history. It does not prevent coding with a clearly marked placeholder.

## 2. Experience promise and scope

28 DAYS asks how people subjected to enclosure, deprivation, deportation, and mass murder organized resistance. The visitor encounters places, people, documents, preparation, and the consequences of German destruction. They finish with people and evidence, not a score.

**Emotional progression:** Confinement → Life → Deportation → Realization → Organization → Preparation → Uprising → Destruction → Persistence → Memory.

**Repeated interaction rhythm:** Enter → Explore → Notice → Interact → Understand → Consult evidence → Continue.

The world communicates before the interface explains. A gate separates two adjacent streets. A familiar courtyard becomes crowded, then empty, then burned. A modest weapons table reveals scarcity. A secondary bunker exit reappears later to explain why preparation mattered.

### Proposed product targets

- Full guided route: approximately 55–75 minutes, excluding extended archive reading; validate actual pacing in user testing.
- Chapters: 21, numbered 00–20. Most last 2–4 minutes; the opening and final observation are shorter.
- Archive and chapter selection: accessible immediately; no arbitrary unlocking.
- Desktop/laptop: highest-fidelity target. Tablet/mobile: guided waypoints and adaptive rendering. Unsupported devices: full reading experience.
- Default release copy: English. Architecture must support Polish and Hebrew, including RTL interface layouts and preserved Polish names. Actual translation and voice recording are separate production tasks.
- No account required. Progress is stored locally. Analytics are optional, aggregate, and must not collect sensitive reflections or archive search text by default.
- Linear historical chronology; optional evidence and perspectives add depth and return to the same narrative spine.

### Title and calendar rule

The brand **28 DAYS** uses the 28 calendar dates from 19 April through 16 May 1943, counting both endpoints. UI may say “April 19–May 16, 1943” and explain inclusive counting in About. Do not state unqualified that armed resistance lasted exactly 28 elapsed days: USHMM describes it as twenty-seven days. May 16 is an official German endpoint, not the end of every act of hiding or resistance. [USHMM: Warsaw Ghetto Uprising](https://encyclopedia.ushmm.org/content/en/article/warsaw-ghetto-uprising)

The earlier chapters are context, not days in a 28-day timer. Chapters and calendar dates are different data fields. No invented event is required for each day.

## 3. Historical editorial contract

### 3.1 Baseline chronology

These concise anchors guide the story; the final script must attach individual claim records and source locators to all factual wording.

| Anchor | Approved scope for this brief | Reference |
|---|---|---|
| 1940 | Ghetto establishment was ordered in October; it was sealed in November. A scene showing sealed separation is labeled November. | [USHMM: Warsaw](https://encyclopedia.ushmm.org/content/en/article/warsaw) |
| 1941 | Overcrowding, deprivation, and community support establish the people and conditions preceding the uprising. | [USHMM: Warsaw](https://encyclopedia.ushmm.org/content/en/article/warsaw) |
| Summer 1942 | Mass deportations to Treblinka form the narrative rupture; German terminology such as “resettlement” must be explained as deception. | [USHMM: Warsaw](https://encyclopedia.ushmm.org/content/en/article/warsaw) |
| Organizations | ŻOB and ŻZW arose from different political backgrounds. Cooperation must not be rendered as a single unified command structure. | [USHMM: Warsaw Ghetto Uprising](https://encyclopedia.ushmm.org/content/en/article/warsaw-ghetto-uprising) |
| January 18, 1943 | The armed actions and civilian refusal became a turning point. Contemporary perceptions and the German operation's intended scope must be distinguished. | [Yad Vashem: January resistance](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/resistance.asp) |
| Preparation | Bunkers, hiding places, and preparations preceded the April uprising. | [Yad Vashem: Preparation](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/preparing_uprising.asp) |
| April 18–19 | April 18 is the night before the uprising. April 19 is Passover eve, not the morning after a Passover Seder held on April 18. | [Yad Vashem: Last Passover](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/last_passover.asp) |
| Muranowski and districts | ŻZW's presence is central; territory and organization cannot be treated as a simple exclusive district partition. | [Yad Vashem: Fighters](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/fighters.asp) |
| May 8 | The destruction of the Miła 18 command bunker requires careful wording about deaths and testimony. | [POLIN: Calendar, p. 9](https://polin.pl/system/files/attachments/Timeline%20of%20the%20events%20of%20the%20Warsaw%20Ghetto%20Uprising.pdf) |
| May 10 | A documented sewer evacuation provides the historical anchor; the navigable tunnel model is a labeled reconstruction. | [POLIN: Calendar, p. 9](https://polin.pl/system/files/attachments/Timeline%20of%20the%20events%20of%20the%20Warsaw%20Ghetto%20Uprising.pdf) |
| May 16 | Destruction of the Great Synagogue marked the German declaration of suppression. | [Yad Vashem: Liquidation](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/liquidation.asp) |
| Beyond the endpoint | Survivors and people hiding in the ruins remain part of the story. | [Yad Vashem: Life among the ruins](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/ruins.asp) |

Do not confuse the Warsaw Ghetto Uprising of 1943 with the Warsaw Uprising of 1944. Do not simplify changing knowledge of extermination into one universal moment of realization, or depict all residents as sharing one motive.

### 3.2 ŻOB / ŻZW attribution rules

Use the full names at first introduction:

- **ŻOB — Żydowska Organizacja Bojowa / Jewish Combat Organization.**
- **ŻZW — Żydowski Związek Wojskowy / Jewish Military Union.**

Preserve diacritics. Permit ASCII aliases in search without changing display spelling. Use a documented name-authority record for variants such as Anielewicz's given name.

**Attribution is per event, person, position, and date—not per whole environment.** A district may contain activity by different groups. Never label all Brushmakers activity exclusively ŻOB or all adjacent streets exclusively ŻZW. Yad Vashem describes ŻZW activity both around Muranowski and in the brush-workshop area. [Yad Vashem: Fighters](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/fighters.asp)

Required implementation rules:

1. Every organizational badge resolves to approved claim IDs. A badge is an assertion, not decoration.
2. Allowed values: `zob`, `zzw`, `multiple`, `civilian`, `unattributed`, with displayed explanations for mixed or incomplete evidence.
3. A generic reconstructed civilian never receives an organization badge merely because the scene is near an attributed location.
4. January receives the attribution supported by its sources. Do not invent ŻZW participation to equalize screen time.
5. Miła 18 remains a ŻOB-focused chapter. Do not imply that its command directed both organizations.
6. Muranowski is mandatory and visually substantial. Give it comparable cinematic care, evidence depth, and navigable perspectives to the principal ŻOB chapter.
7. ŻZW continuity appears in the network and epilogue. Do not invent a still-active ŻZW node after May 8 solely to show continuity; include reviewed survivor or aftermath records separately when appropriate.
8. Differences in surviving documentation must be explained without equating missing evidence with insignificance.
9. Numbers of fighters, weapons, casualties, and dates are source-dependent estimates. Do not combine counts from different sources into false precision or gameplay statistics. Omit counts unless they help the lesson and are reviewed.
10. Paweł Frenkel may enter the archive after identity and fate claims are reviewed. Do not invent his final dialogue, death location, death date, or action choreography.

### 3.3 Certainty, interpretation, and reconstruction

Maintain separate fields for **historical certainty**, **source type**, and **visual representation**. A later testimony is a source type, not automatically an unreliable claim. A stylized rendering can depict an established event; its geometry can still be approximate.

| User label | Meaning | Rendering policy |
|---|---|---|
| Supported by sources | Reviewed evidence supports the specific statement | May narrate plainly with citation |
| Sources differ | Material accounts conflict | Present positions and locators; no definitive staged resolution |
| Record incomplete | Information is insufficient | State what is missing; omit invented specifics |
| Interpretation | Editorial synthesis beyond direct documentation | Attribute the interpretation |
| Reconstruction | Spatial or dramatic arrangement created for explanation | Label at scene entry and in relevant detail cards |
| Approximate location | Geographic accuracy is limited | Use uncertainty area, not an exact point |

Muranowski flags, exact fighting sequences, some identities, weapon totals, and escape geometries are research gates. A flag tableau must not be enabled just because it is visually compelling. Provide a comparison card if approved sources disagree; use an unobtrusive non-literal viewpoint otherwise.

### 3.4 Dialogue, violence, and human dignity

- The draft lines in this document are editorial narration proposals, not quotations.
- Never place invented words in a named historical person's mouth. Generic dramatized dialogue, if used, is clearly disclosed and reviewed; narration is preferable for explanation.
- A quotation needs original wording, locator, translation provenance, and reproduction rights. No voice cloning of witnesses or historical individuals.
- Show coercion and destruction without gore, suicide reenactment, execution spectacle, or close-up anonymous death loops.
- German action remains named and contextualized. Faceless art must not obscure responsibility or make civilians and perpetrators interchangeable silhouettes.
- Human figures have differentiated clothing, ages, posture, gestures, and belongings without caricature, heroic uniforms invented for effect, or stereotyped features.
- Hiding is not a lesser form of resistance. No narrative blames victims for not resisting earlier or implies that moral worth depends on fighting.
- Avoid the earlier proposed closing “They could not win the battle” as a universal verdict. End with concrete people, choices, and records, allowing multiple meanings of resistance.

## 4. Complete route and navigation

```text
00 Opening / 28 DAYS
  → 01 The Wall · November 1940
  → 02 Inside · 1941
  → 03 The Great Deportation · Summer 1942
  → 04 The Realization · After the deportations
  → 05 Two Undergrounds · ŻOB + ŻZW
  → 06 Weapons & Contacts · 1942–early 1943
  → 07 January 18 · 1943
  → 08 Prepare · January–April 1943
  → 09 The Network · Before the uprising
  → 10 The Night Before · April 18, 1943
  → 11 Day 1 / The Uprising Begins · April 19
  → 12 Muranowski · ŻZW focus
  → 13 Fighting Districts · Attributed local perspectives
  → 14 Fire · Late April–May
  → 15 Beneath the Fire · Civilians underground
  → 16 Miła 18 · May 8
  → 17 Resistance Without a Center · After May 8
  → 18 The Sewers · May 10
  → 19 May 16 · Inclusive calendar Day 28
  → 20 They Did Not Disappear · Epilogue / Archive

Optional evidence, person, and map views → return to the current beat.
Chapter selection → deterministic entry checkpoint for selected chapter.
Reading mode → same narrative beats and sources without spatial controls.
```

The ŻOB, ŻZW, and civilian perspectives are parallel threads in the story, not selectable historical factions or three alternative endings. The default guided route includes all mandatory chapters. Chapter jumps remain available; show a concise contextual introduction when someone enters late.

### Global entry flow

1. Render a lightweight title/poster immediately; do not block it on 3D downloads.
2. Offer `Begin`, `Continue` when a valid save exists, `Chapters`, `Archive`, `Read the experience`, and a clearly labeled settings control.
3. Brief content note: persecution, deportation, mass murder, destruction, and non-graphic combat audio. Offer reduced intensity and reading mode on this screen.
4. On Begin, activate audio only through the user's gesture, load the opening/first scene, and show actual resource progress if necessary.
5. Offer a one-screen control introduction. It is dismissible and reachable later.
6. During entry, establish the chapter/date and reconstruction disclosure, then let the composition lead.
7. At chapter exit, provide a short takeaway, sources link, and Continue. No quiz or forced collectible sweep.

## 5. Scene-by-scene implementation cards

All scene timings below are proposed pacing, not historical durations. Every scene needs a static poster, narration transcript, chronological context, source list, named safe checkpoints, and a reading-mode equivalent. Evidence IDs below are production slots; they are not real archive accession numbers.

### 00 — Opening / 28 DAYS

**Intent:** Establish the endpoint and ask how resistance became possible. Target 45–75 seconds plus menu time.

- **Setting:** One carefully composed ruined street/viewpoint. Sparse ash, silhouettes, distant smoke. No introductory encyclopedia wall.
- **Flow:** Title → Begin → short observer framing → authored time transition → intact district contextualized in 1940 → Chapter 01.
- **Camera:** Slow optional push from a still shot. Use a matched-view fade to earlier geometry; rebuilding mesh animation is metaphor, explicitly identified as a visual transition.
- **UI:** Logo, subtitle “The Warsaw Ghetto Uprising,” accessible menu. Proposed line: “How did resistance take shape inside a place built to prevent it?”
- **Assets:** `street_shared`, `ruins_hero`, `opening_poster`, distant smoke/audio.
- **Completion:** Begin starts once; double clicks cannot spawn two worlds. Reduced motion uses a fade or still-image change. Returning to menu preserves progress.

### 01 — The Wall / November 1940

**Question:** How did a neighborhood become a place of confinement? Target 3 minutes.

- **Entry:** Camera follows behind a civilian group carrying belongings; observer has no avatar or identity.
- **Beat flow:** Join route → see wall → observe gate → reach a stopping point → look toward nearby Warsaw outside → gate closure → source card → Continue.
- **Prompts:** “Follow the group,” then “Look toward the other side.” Guided Continue offers the same sequence without walking.
- **Human layer:** Waiting, carrying, looking back. No escort mission; the family never fails because the visitor pauses.
- **Evidence slot:** `ev_wall_photo`, with date/location/creator provenance and comparison to the reconstructed composition.
- **Implementation:** Navigation corridor along shared street; trigger at viewpoint; group idles when visitor stops. Closure cannot trap visitor geometry. Gate sound precedes final stillness.
- **Exit proposal:** “The wall separated people from the city around them.” Further consequences are explained with evidence, not overloaded into this single sentence.
- **Acceptance:** Outside remains perceptibly near; barrier is emotionally clear. No unsupported exact gate location is presented as surveyed history.

### 02 — Inside / 1941

**Question:** What lives and community responses existed within confinement? Target 3 minutes.

- **Entry:** Reuse Chapter 01 street landmarks with crowded windows, queues, market activity, and courtyard routines.
- **Flow:** Familiar street → food queue → courtyard → shelter observation → community support → short exit.
- **Optional observations:** Food, shelter, and community each provide a 20–30 second narrated detail. Do not require all three to advance.
- **Evidence slots:** `ev_daily_life`, `ev_mutual_aid`; licensed photographs and reviewed contextual text.
- **Implementation:** Crowd density uses authored loops and low-cost instances for distant figures. Near characters use distinct idle actions. No collision-heavy crowd simulation.
- **Art/audio:** Clothing and mundane gestures supply individuality. Footsteps, low voices, utensils; avoid a bustling market treatment that trivializes deprivation.
- **Acceptance:** Visitor recognizes the same street and notices changed conditions. People are introduced as communities, not only future combatants.

### 03 — The Great Deportation / Summer 1942

**Question:** What did German “resettlement” conceal? Target 4 minutes.

- **Setting:** Umschlagplatz-inspired space and freight cars. Camera remains an observer; no first-person deportee simulation or rescue objective.
- **Flow:** Platform observation → examine an object left behind → contextual explanation → optional evidence → Warsaw–Treblinka map → historical takeaway.
- **Objects:** Suitcase, toy, photograph, paper. Each is either a documented artifact with provenance or a labeled illustrative prop. Do not invent owners or farewell letters.
- **Interaction:** Inspect in place or in a neutral object viewer. No collection animation, inventory, reward sound, or completion percentage.
- **Evidence slots:** `ev_deportation_record`, `ev_treblinka_route`. Modern schematic route must say “schematic,” not impersonate a period document.
- **Camera/audio:** Long negative space, restrained train sounds. No boarding animation with the visitor inside a sealed car.
- **Acceptance:** Treblinka is identified as a killing center; euphemisms are attributed to perpetrators and corrected in context. Skip offers the same meaning in a non-graphic text summary.

### 04 — The Realization / After summer 1942

**Question:** How did information change decisions? Target 3 minutes.

- **Setting:** Generic reconstructed basement table; do not claim a documented meeting happened in this invented room.
- **Flow:** Examine report from outside → information about Treblinka → absence of earlier deportees → connections shown → reflection → resistance organization.
- **Interaction:** Select evidence cards to reveal their relationship; no right-answer quiz, timed assembly, puzzle lock, or “truth unlocked” mechanic.
- **Prompt:** “Examine the reports.” `Continue with summary` supplies any unviewed core explanation.
- **Narration:** Explain that knowledge reached different people at different times; avoid one fictional speech representing every resident.
- **Evidence slots:** `ev_reports`, `ev_knowledge_context`. Source each document separately.
- **Implementation:** DOM/SVG document board with equivalent linear list for keyboard/screen readers. Table world is a quiet frame, not the only place to read.
- **Acceptance:** Visitor understands why organization changed without the interface implying that ignorance was culpable.

### 05 — Two Undergrounds / ŻOB + ŻZW

**Question:** Who organized armed resistance? Target 4 minutes.

- **Setting:** Two evidence stations in a generic interpretive interior, explicitly not a staged shared headquarters.
- **Flow:** Introduce both names → ŻOB station → ŻZW station → compare political origins and organization → shared resistance overview → Continue.
- **Interaction:** Explore either station first; both receive mandatory concise narration before exit. Deeper records are optional.
- **UI:** Equivalent typographic weight and card scale. No choose button, competition, weapon stats, or rivalry meter.
- **People:** Introduce Anielewicz and reviewed ŻZW identities through documented person cards. Generic figures are not silently assigned those identities.
- **Evidence slots:** `ev_zob_organization`, `ev_zzw_organization`.
- **Implementation:** Two independently sourced network diagrams converge in an interpretive summary, never into a fabricated chain of command.
- **Acceptance:** A first-time visitor can name both organizations and distinguish them; evidence gaps are understandable without diminishing ŻZW.

### 06 — Weapons & Contacts / 1942–early 1943

**Question:** How did people obtain scarce weapons and maintain contacts? Target 3 minutes.

- **Flow:** Observe courier receiving a package → accompany a short route → checkpoint pause → safe room → package opened → contextual evidence.
- **Observer rule:** Earlier “deliver the package” becomes “Follow the delivery.” The visitor triggers an explanatory demonstration, not a successful smuggling outcome dependent on stealth skill.
- **Interaction:** Inspect sealed package and revealed contents; prompt “Examine the supplies.” No equipping weapons.
- **Staging:** Generic courier route labeled illustrative unless route and participants are documented. The checkpoint is a scripted moment, not a suspicion system.
- **Evidence slots:** `ev_arms_contacts`, separate ŻOB/ŻZW claims where supported. Contact types must not be assumed identical for both groups.
- **Camera/audio:** Modest table composition, small-scale handling sounds. Scarcity is conveyed spatially without inventing an exact arsenal.
- **Acceptance:** Visitor learns logistical difficulty and asymmetry; no player failure, weapon pickup, or combat controls exist.

### 07 — January 18, 1943

**Question:** How did January's resistance change expectations? Target 3 minutes.

- **Flow:** Apartment observation point → column approaches → brief wait → scripted resistance → movement through interior passage → evidence and interpretation.
- **Prompts:** “Observe the street,” “Continue through the passage.” Visitor never initiates the historical attack by pressing Fire.
- **Attribution:** Source the specific action, not a generic balanced badge. Explain contemporary belief that the action was a final liquidation alongside later knowledge of its intended limited scope. [Yad Vashem: January resistance](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/resistance.asp)
- **Event treatment:** Distant non-graphic gunfire and confused movement, largely observed behind shutters. No bullet damage, enemy targeting, or kill animation loop.
- **Evidence slot:** `ev_january_action`; distinguish accounts that differ on exact chronology rather than inventing a minute-by-minute timeline.
- **Implementation:** Fixed cue sheet drives crowd and sound. Pause freezes it. Skip jumps to reviewed contextual summary and the next safe checkpoint.
- **Acceptance:** Ending conveys disruption and changed confidence without claiming that armed action alone definitively prevented an otherwise planned total deportation.

### 08 — Prepare / January–April 1943

**Question:** What did preparation mean for civilians and fighters? Target 4 minutes.

- **Setting:** An interpretive building cross-section with a shelter beneath; generic geometry explicitly labeled.
- **Flow:** Inspect ventilation → examine stored water/food → understand concealed entrance → reveal secondary exit → see civilians moving below → summary.
- **Interaction:** Toggle explanatory cutaways and inspect infrastructure. Optional demonstrate controls open vents or uncover a route for illustration; they do not “build a bunker” that history depends on.
- **UI:** Air, water, hidden entrance, second exit are explanatory headings. Viewed checks may appear in the private journal but are not success scores.
- **Evidence slot:** `ev_bunker_preparation`; short source commentary for each function.
- **Implementation:** Dedicated cutaway meshes; camera-safe clipping planes only for the view, not arbitrary deletion of the scene. Restore geometry when returning to normal view.
- **Acceptance:** Shelter is visibly for families as well as fighters. Secondary route has a stable ID reused in Chapter 15.

### 09 — The Network / Before the uprising

**Question:** How did resistance depend on many places and connections? Target 3 minutes.

- **Flow:** Streets → ŻOB layer → ŻZW layer → civilian shelters → contacts → routes → selected nodes and sources → combined overview.
- **Map:** Historically reviewed geographic base where licensed, otherwise an explicitly schematic diagram. Boundary/date changes are represented by temporal layers.
- **Interaction:** Reveal documented connections; do not let the visitor draw fictional supply routes or solve optimal strategy.
- **Attribution:** Unknown location or control uses dotted outline and plain “Record incomplete.” Never turn uncertainty into a definitive colored pin.
- **Evidence slot:** `ev_network_map`, plus node/edge claim IDs.
- **Implementation:** DOM/SVG map is primary, 3D tabletop optional. Provide a list representation with identical filters. No reliance on hover.
- **Acceptance:** Every link and exact position has evidence or a reconstruction label. All organization layers have text and shape distinctions as well as color.

### 10 — The Night Before / April 18, 1943

**Question:** What did anticipation and preparation look like? Target 3 minutes.

- **Flow:** Interior → observe messages passed → supplies divided → shelter entrance → return upstairs → lights dim → date transition.
- **Prompts:** “Follow the preparations,” “Look toward the shelter.” Visitor accompanies people; no consequential message-delivery quest.
- **Human layer:** Packing, waiting, religious preparation where reviewed. Generic scene must not invent a Seder on April 18.
- **Closing proposal:** “April 19. Passover eve.” This date card replaces the earlier draft “Tomorrow is Passover,” which can blur the evening calendar. [Yad Vashem: Last Passover](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/last_passover.asp)
- **Evidence slot:** `ev_april18_accounts`.
- **Light/audio:** Lantern pools and restrained voices; silence carries the transition. Do not require darkness so deep that navigation is inaccessible.
- **Acceptance:** No assumption that every resident knew the same details or acted in the same way.

### 11 — Day 1 / April 19, 1943

**Question:** How did the uprising begin? Target 4 minutes.

- **Entry:** Same street as Chapters 01–02, now conspicuously empty above ground.
- **Flow:** Enter upper-floor viewpoint → observe German entry → scripted resistance from offscreen and distant positions → short perspective change → resistance map → Continue.
- **Map reveal:** Approved ŻOB and ŻZW positions plus civilian shelters. Do not imply all presented nodes erupted simultaneously at the exact rendered second.
- **Visuals:** Smoke, brief restrained flashes, a readable reaction in movement. No projectile physics required, and no close-up combat participation.
- **Evidence slot:** `ev_april19_overview`.
- **Implementation:** Authored camera rail with interruptible transitions; hero effects precompiled before cue begins. Reduced intensity uses stills, softer transients, and factual narration.
- **Acceptance:** Emptiness makes civilian hiding legible; neither group is erased from the uprising overview.

### 12 — Muranowski / ŻZW focus

**Question:** What was ŻZW's role, and how is it documented? Target 4 minutes. This is a mandatory hero chapter.

- **Flow:** Street perspective → upper floor → overlooking roof position → evidence comparison → ŻZW people/aftermath link → Continue.
- **Prompts:** “Observe the square,” “Change perspective,” “Compare the accounts.” Never “Defend the square.”
- **Content:** Present reviewed activity and separate unknown choreography. Flags or named commanders in action remain disabled pending specific claim review.
- **Evidence panel:** “What the sources support,” “Where accounts differ,” “What remains unknown.” Differences are described substantively, with source dates and locators.
- **Evidence slots:** `ev_muranowski_activity`, `ev_muranowski_dispute`, `person_zzw_reviewed`.
- **Camera/art:** Three strong authored compositions; detailed silhouettes and distinctive roofs/courtyards. Equal production care does not require invented matching statistics.
- **Implementation:** Every perspective is reachable through keyboard/touch buttons. Missing disputed assets cannot make chapter progression impossible.
- **Acceptance:** ŻZW has narrative weight, evidence, people, and continuity; geographic dominance and precise duration are not asserted without support.

### 13 — Fighting Districts / Local perspectives

**Question:** How did resistance use buildings, passages, and local knowledge? Target 4 minutes.

- **Flow:** Building → observe position → inner passage → courtyard → second interior → interpreted escape route → evidence.
- **Attribution:** Specific sourced ŻOB perspectives may anchor this chapter, but a “Brushmakers = ŻOB only” rule is prohibited. Mixed evidence is shown locally.
- **Interaction:** Trace paths and compare above-ground/inside views. No flanking objectives or damage mechanics.
- **Evidence slots:** `ev_district_positions`, `ev_internal_passages`.
- **Implementation:** Reuse residential kit, with distinctive landmarks to avoid confusing corridors. Routes are authored and collision-tested; doorways transition to small scene modules where necessary.
- **Audio:** Distant, directional fighting; footfalls and passage acoustics communicate interiors.
- **Acceptance:** The visitor learns infrastructure rather than tactics they must perform to win. Historical street layouts and interpretive shortcuts are not conflated.

### 14 — Fire / Late April–May 1943

**Question:** How did systematic burning change the experience of resistance? Target 3 minutes.

- **Flow:** Recognize familiar street → observe burning/destruction → understand German method → follow a guided route toward shelter → evidence and descent.
- **Prompt:** “Continue toward the shelter.” No race against flames, oxygen bar, timed sprint, or simulated death.
- **Visual:** Authored damage states replace real-time structural destruction. Keep fire subordinate to the human meaning; no explosion montage.
- **Evidence slot:** `ev_systematic_burning`; identify the provenance of any perpetrator-produced photographs. [Yad Vashem: Fighters](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/fighters.asp)
- **Implementation:** Small emitter clusters, low overdraw smoke, baked charred geometry, interior-safe visual contrast.
- **Acceptance:** Camera continuity makes destruction understandable. Reduced intensity retains the causal explanation with still compositions.

### 15 — Beneath the Fire / Civilians underground

**Question:** What did hiding and maintaining a shelter mean? Target 4 minutes.

- **Flow:** Enter shelter → air/water context → hear above-ground destruction → observe blocked route → recall secondary exit from Chapter 08 → guided passage → summary.
- **UI:** Air, water, exit, silence appear as contextual explanations, never depleting meters or pressure to optimize people as resources.
- **Human layer:** Waiting, sharing, quiet movement; no visitor choice of who receives water or who lives.
- **Evidence slot:** `ev_bunker_accounts`. Use several reviewed perspectives instead of implying one universal bunker experience. [Yad Vashem: Bunkers](https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/bunkers.asp)
- **Implementation:** Chapter 08 route identity is reused. The blocked door is staging, with a guaranteed safe transition and navigation bypass.
- **Acceptance:** The callback explains preparedness. It does not imply that the visitor personally saved a historical family.

### 16 — Miła 18 / May 8, 1943 / ŻOB

**Question:** What happened to ŻOB's central leadership? Target 3 minutes.

- **Flow:** Exterior/context → interpretive command-space view → documented people/source → still observation → brief fade → reviewed account of the destruction and deaths.
- **Control rule:** Final visual sequence becomes observation-only; Pause, Settings, transcript, and Skip remain active. No “Last Stand” or “Survive.”
- **Representation:** Do not enact suicide, make the visitor witness private final actions, or claim exact final words. Interior layout is reconstructed unless supported.
- **Evidence slot:** `ev_mila18_accounts`; conflicting descriptions of circumstances are retained in the archive. Source wording must not be flattened into a single spectacular death scene.
- **Camera/audio:** Restrained, stable shot; suggest exterior pressure without sensory assault. Darkness transitions to readable text, not a blank trap.
- **Acceptance:** The chapter identifies the ŻOB loss and immediately leads toward continued resistance, rather than declaring the whole uprising ended here.

### 17 — Resistance Without a Center / After May 8

**Question:** How did resistance persist as connections broke apart? Target 3 minutes.

- **Flow:** Ruined passage → fragmented network → select surviving/unknown/lost connection → human aftermath records → onward to sewer evacuation.
- **Map semantics:** `active-at-date`, `lost-contact`, `destroyed`, `unknown` are historically reviewed statuses. An unknown node does not animate as active just for drama.
- **ŻZW continuity:** Link to documented ŻZW aftermath and people, explicitly dated where evidence permits. Do not invent participation in this particular May 10 evacuation.
- **Evidence slots:** `ev_late_resistance`, `ev_zzw_aftermath`.
- **Implementation:** Filter temporal graph at chapter date; reuse Chapter 09 geometry with changed statuses. “We do not know” is an acceptable record.
- **Acceptance:** Fragmentation is clear; the story avoids “Anielewicz dies → resistance ends.”

### 18 — The Sewers / May 10, 1943

**Question:** How did some fighters leave the destroyed ghetto? Target 4 minutes.

- **Anchor:** Use the documented May 10 evacuation for context. Exact tunnel layout, markings, walking order, and elapsed time are reconstruction unless separately verified.
- **Flow:** Group entry → remain within guided route → pause at junction → follow guide → ladder → exterior emergence → look toward smoke → source card.
- **Prompts:** “Stay with the group,” “Follow the guide,” “Continue to the exit.” Marks may assist navigation as interpretive aids; label them rather than fabricating period markings.
- **Controls:** No jump/climb skill test. Ladder ascent is a short interruptible transition or fade. No oxygen limit, drowning, group abandonment, or failure condition.
- **Evidence slot:** `ev_may10_evacuation`. Do not imply that escape meant safety or that all fighters escaped.
- **Camera/audio:** Stable camera, water/echo, very little score. Orientation aid and waypoint list remain available despite minimal in-world UI.
- **Acceptance:** Someone using keyboard-only or reduced motion completes the same narrative comfortably.

### 19 — May 16 / Inclusive calendar Day 28

**Question:** What did the German endpoint mean—and what continued? Target 1–2 minutes.

- **Flow:** Matched opening viewpoint → approximately ten seconds of optional quiet observation → date → German declaration contextualized → aftermath note → transition to archive.
- **Great Synagogue:** Explain its destruction using an approved source. Do not place it in the hero street's line of sight without verified geography; use an archival/schematic view if necessary.
- **Text proposal:** “The Germans declared the operation complete.” Then explain continued hiding and survival beyond this date in reviewed copy.
- **Evidence slots:** `ev_may16`, `ev_ruins_afterwards`.
- **Audio:** No triumphant antagonist crescendo. Silence and distant ambience; reduced intensity may use still imagery.
- **Acceptance:** May 16 is not a tidy “all people gone” ending. The brand calendar explanation is available without interrupting the moment.

### 20 — They Did Not Disappear / Epilogue and archive

**Question:** Who were the people, and what can their records tell us? Target 3–5 minutes, then open-ended reading.

- **Transition:** Stylized world fades into a DOM-based archive; real evidence replaces anonymous silhouettes.
- **Flow:** Introductory person records → ŻOB and ŻZW paths → civilian/courier/organizer perspectives → source and uncertainty disclosures → open archive.
- **Person card:** Name/variants, documented image if available, age only if verified, roles, dated affiliations, brief life/fate summary, claim-level sources, and uncertainty.
- **Missing image:** Neutral typographic card reading “No verified image available.” No synthetic portrait presented as documentary evidence.
- **Closing proposal:** “Remember the people. Examine the evidence. Continue learning.” Final wording needs editorial review.
- **Implementation:** Archive also works as a standalone route with canvas disposed. Filter states are shareable without including private user notes.
- **Acceptance:** Both organizations and civilians are easy to find; no medals, completion trophy, replay-to-win message, or historical ranking.

## 6. Graphical direction

### 6.1 Visual thesis

Build a restrained cinematic diorama at human scale: faceted, faceless figures inside a coherent, researched architectural world. Avoid toy-like proportions, cheerful miniature aesthetics, generic military-game styling, photoreal suffering, and monochrome gloom that erases visual structure.

Low-poly means deliberate silhouette, planes, and material economy. Hero walls need masonry scale, window rhythm, damage language, and architectural identity. Do not scatter random rubble over generic cubes and call it Warsaw. Produce reference boards before modeling: period streets, doors/windows, courtyards, rail infrastructure, civilian clothing, domestic objects, and underground spaces. Associate reference IDs and certainty with each hero location.

### 6.2 Palette and material direction

Proposed palette—not a claim about period color:

| Token | Hex | Use |
|---|---|---|
| `ink` | `#141719` | Interface ground and deep shadow |
| `paper` | `#EEE8DB` | Reading surfaces and primary text |
| `stone` | `#817C72` | Facades and quiet neutral forms |
| `brick` | `#735448` | Warm architectural accents |
| `ash` | `#ACA89D` | Ruin planes and atmospheric separation |
| `brass` | `#B59A62` | Sparse interactive emphasis |
| `coldSky` | `#78909A` | Cool exterior light balance |
| `fire` | `#C67B43` | Restrained fire emissive range |
| `zobMark` | `#A9C0C4` | Organization map annotation only |
| `zzwMark` | `#D0BB91` | Organization map annotation only |

Do not assume every combination meets contrast requirements. UI text sits on opaque or sufficiently backed surfaces, with measured contrast. Organization colors are quiet annotation tokens, never uniforms or opposing team colors; combine labels and distinct marker shapes.

Materials: mostly rough plaster, brick, wood, cloth, and dark metal; modest PBR response with authored vertex-color variation. Restrict shiny surfaces. Bake fine variation or lighting where appropriate. Archive media must not inherit sepia filters, AI colorization, film damage, or grading from the 3D view.

### 6.3 Characters and animation

- Adult body target: roughly 2,000–5,000 triangles at near LOD; child variants roughly 1,500–3,000. Distant figure meshes reduce substantially. These are budgets to profile, not promises.
- Faceless heads have no eyes, mouth, or exaggerated ethnic features. Hair/headwear and clothing variation provide individuality.
- Adult height/limb proportions remain grounded. No oversized heads or action-hero bodies.
- Build 6–8 reusable body/clothing silhouettes, with additional child and elderly posture variants. Skin/clothing choices require reference and sensitivity review.
- Shared animation vocabulary: walk, stand, wait, carry, sit, listen, hand over, inspect, descend, quiet gesture. Named figures need documented identity context, not magical uniqueness inferred from face geometry.
- Do not loop crying, collapse, or panic on anonymous people as ambience. Crowd motion must feel purposeful.
- Weapons remain environmental/historical objects; no visitor-held gun mesh.

### 6.4 Environmental continuity

One shared hero street carries four authored states: enclosure, inhabited, uprising, burned/ruined. Preserve recognizable door/window/courtyard landmarks. New damage is designed to maintain comparisons, not randomly procedural.

A second square module supports Muranowski; residential modules support fighting districts; one interpretive bunker supports preparation and civilian hiding. Miła is separately identified and not the generic bunker quietly renamed. Sewers form a small distinct corridor system.

Mood should progress through increasing spatial restriction and loss. Human-scale detail—bundles, shelves, windows, chairs, water containers—carries much of the production value.

## 7. UI system and accessibility

### 7.1 Information hierarchy

Default exploration layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ CHAPTER / TITLE / DATE              Map Journal Archive Menu   │
│                                                               │
│ One current prompt              WORLD                         │
│                                  Optional evidence drawer     │
│                                                               │
│                    Subtitles / sound captions                 │
│ Chapters ─────────── Timeline / current date ───────── Pause    │
└───────────────────────────────────────────────────────────────┘
```

Reserve space; do not cover the focal point with a card. At 1280px and above, evidence drawer approximately 360–440px wide. At smaller widths, use a modal/full-screen reading sheet and freeze scene progression. Mobile chapter heading collapses after entry but remains recoverable.

Typography proposal: a locally hosted, licensed editorial serif for titles and a highly legible sans serif for body/UI. Select families with all required language coverage; use documented fallbacks rather than broken diacritics. Body 16–18px, subtitle 18–22px desktop, headings responsive 28–56px. Text line length approximately 55–75 characters. No tiny uppercase paragraphs, faux typewriter body text, or ornamental illegibility.

Spacing tokens: 4, 8, 12, 16, 24, 32, 48, 64px. Controls at least 44px in their interactive dimension. Focus ring unmistakable against world and archive backgrounds. UI transitions normally 120–240ms and disabled/reduced for reduced-motion preference.

### 7.2 Required components

- Title menu and valid-save Continue control.
- Chapter/date block with attribution/reconstruction labels.
- Single current exploration prompt; optional expanded instruction.
- Chapter navigator, timeline, and context summary for direct entry.
- Map with layer filters, legend, dated records, uncertainty rendering, and equivalent list.
- Journal of chapter summaries and sources encountered; no collectible count.
- Evidence toast (“Source available”), evidence drawer, media detail viewer, comparison view.
- Archive index, person detail, source detail, claim provenance links.
- Subtitle/caption strip, transcript panel, audio/settings panel.
- Loading, retry, low-performance, unsupported-renderer, and save-recovery states.
- Pause/skip movement/skip sequence controls, reading mode, replay chapter.

### 7.3 UI by narrative state

| State | Visible UI | World behavior |
|---|---|---|
| Exploration | Chapter/date, prompt, navigation, subtle timeline | Movement allowed in authored region |
| Guided movement | Minimal heading, Pause, Skip movement | Camera follows authored route |
| Narration | Subtitles and transcript action | Optional walk or fixed view as beat declares |
| Evidence reading | Evidence sheet, source links, close | Narrative clock and movement paused |
| Map | Map/list controls and context | World paused; no hidden combat clock |
| Historical event | Subtitles, Pause, Skip, settings | Scripted cues; no player combat agency |
| Chapter end | Takeaway, source link, Continue | Stable composition |
| Archive | Full DOM reading interface | Renderer stopped/disposed when appropriate |

### 7.4 Accessibility requirements

- Keyboard can complete the entire route and inspect every evidence/person record.
- All spatial hotspots have a synchronized DOM/list counterpart. Canvas is supplementary; it is not the only semantic surface.
- Screen reader users can choose reading mode before any canvas loads. Heading order, labels, dates, and source relationships remain meaningful.
- WCAG 2.2 AA is the release target: contrast, reflow, keyboard, focus, captions, target sizes, reduced motion, and accessible errors. Formal conformance requires actual testing.
- Closed captions include significant sounds (“Distant gunfire,” “Gate closes”) without excessive ambient spam.
- Subtitles are on by default. No required information exists only in audio or color.
- Honor `prefers-reduced-motion`; provide independent camera comfort and reduced-intensity controls.
- Reduced motion uses still viewpoints/short fades, no head bob, no forced pans, no zoom pulses, and no shaking.
- At 200% text zoom and 320 CSS-pixel layout width, DOM reading remains usable without clipped controls.
- Dialogs trap focus, restore the invoking element, close on Escape, and prevent world key handling while open.
- External evidence links never discard progress. Clearly mark third-party destinations; preserve source context when returning.
- Touch uses explicit waypoints and look controls; no invisible hover targets, compulsory dual-thumb movement, or auto pointer lock.
- Localization uses logical CSS properties, correct `dir`, localized dates, and accessible font fallbacks. Historical Polish labels retain correct spelling in every locale.

## 8. Interaction and visitor movement

### 8.1 Allowed verbs

**Observe, move, follow, inspect, listen, compare, reveal, read, change perspective, pause, continue.** Each verb must answer a historical question. Interaction without educational or emotional purpose should be removed.

Default desktop controls: WASD/arrow keys move within a bounded region; drag to look, or use optional pointer lock after explicit gesture; E/Enter activates the currently focused hotspot; Escape releases pointer lock or closes overlay before opening pause. Provide a visible non-spatial “Places to examine” list. Guided mode offers `Next viewpoint` and `Look left/right` buttons and can replace free movement completely.

Mobile defaults to waypoint movement. Optional free-look drag is constrained to comfortable yaw/pitch. Do not ship a full FPS control scheme. The visitor cannot jump, sprint, crouch stealthily, push historical people, pick up weapons, or enter unscripted dangerous spaces.

### 8.2 Hotspot behavior

1. Hotspot enabled only by the active beat and scene state.
2. Picking uses a simplified proxy collider and maximum interaction distance, with line-of-sight rules where meaningful.
3. Hover/focus displays a restrained label; activation is explicit. No center crosshair resembling weapon aiming.
4. Selection opens interpretation/evidence or triggers a reversible demonstration.
5. Event is idempotent: repeated input never duplicates narration, journal entries, downloads, or progression.
6. Closing returns focus and scene position. Content remains accessible from journal/archive afterward.

### 8.3 Progression and recovery

Mandatory learning beats are short and completeable by narration or reading. Opening the external original source is never required. Optional evidence is never a gate.

No minimum dwell time is necessary to “prove” learning. After narration starts, Continue may remain visible with a concise summary if skipped. Skipping a scripted sequence marks it as skipped, provides factual text, and advances to the same historical state.

When visitor stalls, offer “Continue with guidance” after a configurable quiet interval; do not nag repeatedly. A pathfinding failure offers waypoint teleport/fade. A stuck visitor never gets “Game over.”

### 8.4 Camera modes

- `explore`: eye-height observer within collision/navigation region.
- `guided`: authored spline or ordered viewpoints with limited optional look.
- `inspect`: object/viewpoint composition, restrained rotation where useful.
- `event`: scripted observation with Pause/Skip.
- `map`: mostly DOM/SVG; optional tabletop camera.
- `still`: quiet chapter-ending composition.

Only the camera director writes the active camera transform. Mode changes interpolate from a stored transform or cut/fade; no competing controls and animation writers.

## 9. Technical architecture

### 9.1 Chosen baseline

Use **TypeScript + Vite + React for DOM UI**, with an imperative **Three.js WebGLRenderer** runtime behind one canvas. React manages menus, evidence, settings, accessibility, and archive routes; it does not receive per-frame scene transforms as state. Use a small typed store/reducer for narrative state and a schema validator such as Zod for authored content. The deterministic state-machine implementation may use XState if its added dependency is justified; a well-tested typed reducer is sufficient.

Use WebGL2 as the production rendering baseline. Capability-check at entry; unsupported or unstable rendering selects reading mode. WebGPU is optional later experimentation, not a release dependency. Pin all library/decoder/tool versions in the lockfile and record the tested Blender/exporter version. Do not specify “latest” in a reproducible build.

Use official loader contracts: GLTFLoader for glTF/GLB, KTX2Loader with renderer capability detection for compressed textures, and a consistently configured mesh-compression decoder if compressed meshes are shipped. These integration points are documented by Three.js. [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)

**Recommended default:** Meshopt geometry compression; KTX2/Basis textures. Draco may be substituted after measured size/decode comparison, not stacked on the same primitive without need. Self-host decoder binaries and WASM from pinned packages. Preserve required custom metadata through optimization and test it after export. A plain uncompressed miniature fixture should also exist for loader debugging.

The product can be statically hosted. No backend is required for narrative, archive, or local progress. Asset rights may require a controlled hosting arrangement later; decide that from actual licenses rather than assuming every archive image can be redistributed.

### 9.2 Module responsibilities

| Module | Responsibility | Must not own |
|---|---|---|
| `AppShell` | Routes, semantic UI, focus, reading mode | Camera transforms |
| `ExperienceRuntime` | Canvas, renderer, render loop, subsystem lifecycle | Historical copy |
| `SceneManager` | Load/activate/unload modules and scene variants | Decide narrative outcomes |
| `AssetManager` | Manifest, cached loads, reference counting, cancellation | Silently replace missing historical media |
| `NarrativeEngine` | Validated beats, event reduction, guards, checkpoints | Arbitrary evaluated scripts |
| `TimelineDirector` | Deterministic event cues and pause/seek | Independent wall-clock timeouts |
| `CameraDirector` | Camera modes, rails, look limits, comfort | UI route state |
| `NavigationController` | Allowed movement, collision, waypoint assist | Enemy AI or survival |
| `InteractionController` | Hotspot focus, picking, input routing | Direct mutation of historical claims |
| `CharacterDirector` | Authored paths and animation clips | Unbounded crowd simulation |
| `AudioDirector` | Buses, cue scheduling, ambience, captions | Auto-play before user gesture |
| `EvidenceRepository` | Claims, sources, provenance, rights | Invented accession IDs |
| `QualityManager` | Tier selection, frame sampling, adaptive resolution | Remove essential narrative information |
| `ProgressStore` | Local versioned checkpoints/settings | Raw object graphs or private archive analytics |
| `Diagnostics` | Dev overlay, resource/performance logs | Public-facing implementation clutter |

### 9.3 Folder and ownership structure

```text
28-days/
  package.json
  package-lock.json
  README.md
  docs/
    specification.md
    decisions.md
    historical-review.md
    performance-report.md
    rights-register.md
  src/
    app/                 # routes, providers, error boundaries
    ui/                  # semantic components and design tokens
    runtime/
      ExperienceRuntime.ts
      scenes/            # shared kit + scene adapters
      assets/            # manifest/loader/cache
      camera/
      navigation/
      interaction/
      characters/
      audio/
      rendering/
    narrative/
      schema.ts
      reducer.ts
      guards.ts
      checkpoints.ts
      timeline.ts
    evidence/
      schema.ts
      repository.ts
      search.ts
    persistence/
    localization/
  content/
    chapters/            # JSON: one file per chapter
    beats/               # optional separate large cue sequences
    claims/
    sources/
    people/
    locations/
    maps/
    locales/en/          # copy keys, subtitle cues, transcripts
  public/
    assets/manifest.json
    assets/models/
    assets/textures/
    assets/audio/
    assets/archive/      # only rights-cleared derivatives
    assets/posters/
    decoders/
  production/
    blender/             # authored .blend files; not web payload
    references/          # read-only imported reference material
    exports/             # raw intermediate GLB
    tools/               # export and validation tools
  tests/
    narrative/
    content/
    runtime/
    e2e/
  reports/               # QA captures, profiling, accessibility results
```

In this ChatGPT project mirror, create future implementation in a new `28-days/` directory. Do not overwrite synced sources. Use content hashes for shipped asset filenames and a stable logical-ID manifest so chapter data never needs hand-edited hashed paths.

### 9.4 Scene lifecycle and loading

1. Resolve chapter definition and all essential assets before activation. Display a poster/context while loading.
2. Load shared kit once; hold resource references. Load current scene bundle and low-priority next bundle subject to memory limits.
3. Validate named anchors/hotspots against model metadata. Missing essential anchor fails visibly in development and selects safe fallback in production.
4. Build a scene instance offscreen, apply date/state variants, register navigation and hotspots, and prepare materials/shaders.
5. Transition at an explicit camera-safe point. Do not expose half-loaded people or placeholder archive media as final history.
6. Activate one scene and one narrative session generation. Ignore events/results from earlier generations.
7. Stop old animation mixers, unregister input and listeners, disconnect scene audio, release asset references, and remove the old scene.
8. Dispose GPU geometry/material/texture/render-target resources only when the last reference is released. Shared assets must survive a chapter swap.

Keep a maximum of current world plus bounded prefetch; on low-memory devices prefetch poster/content only. Loading failures provide Retry and Continue in reading mode. A stale asynchronous load cannot resurrect an abandoned chapter.

### 9.5 Frame loop and timing

Maintain a monotonic logical scene clock. Advance only while narrative is running, tab visible, and no modal or explicit pause owns suspension. Clamp movement frame delta to avoid a background-tab teleport. Pause audio sources/cues coherently with the same logical time.

Render-loop order:

```text
read routed input
→ reduce queued narrative events
→ update logical timeline/cue state
→ update characters and navigation
→ update CameraDirector
→ update animation mixers and ambience
→ update hotspot focus/picking when necessary
→ render with active quality settings
→ sample diagnostics at bounded intervals
```

Do not repeatedly raycast every world mesh or trigger React rerenders every frame. Picking uses a small enabled-hotspot set; mouse-move work is throttled appropriately. Stop rendering when in standalone archive/reading routes or hidden tab. Settings changes should not reload the entire world.

### 9.6 Navigation and coordinate contract

- Units: meters. Scene coordinate contract: glTF/Three.js +Y up; use one documented local origin per module and one approved mapping to historical coordinates where known.
- Blender authors Z-up normally; exporter converts to glTF. Do not add a second manual rotation that accidentally reorients the world.
- Eye height default approximately 1.60m; walking speed approximately 1.2–1.6m/s as a comfort proposal. Guided rails may use slower movement.
- Use authored walkable polygons or baked navigation paths plus simplified static colliders. A lightweight capsule controller is adequate; no full rigid-body world needed.
- Camera near/far proposal: 0.1m / 120–180m depending on scene scale. Avoid excessive depth range and z-fighting.
- No physical interaction with crowds. Boundaries are spatially plausible and explained by route design, not invisible frustrating walls.
- Navigation data is generated from the same exported anchor set used by camera and hotspots, then validated in scene smoke tests.

## 10. Narrative engine and data contracts

### 10.1 Core model

Content is authored data, not a collection of hardcoded timers inside React components. Separate chapter chronology, beat order, representation labels, evidence, animation cues, and user progress.

The following TypeScript shapes are a normative starting contract. Implement runtime JSON validation with the same constraints; add explicit fields as production requires. Example IDs are internal project IDs, never institutional identifiers.

```ts
type ChapterId = string;
type BeatId = string;
type ClaimId = string;
type SourceId = string;
type LocalizedKey = string;
type Attribution = 'zob' | 'zzw' | 'multiple' | 'civilian' | 'unattributed';
type Certainty = 'supported' | 'disputed' | 'incomplete' | 'interpretation';
type ReviewStatus = 'draft' | 'needs-review' | 'approved' | 'rejected';

interface HistoricalDate {
  start?: string;          // YYYY, YYYY-MM, or YYYY-MM-DD per precision
  end?: string;
  precision: 'day' | 'month' | 'year' | 'range' | 'unspecified';
  labelKey: LocalizedKey;
}

type Guard =
  | { kind: 'always' }
  | { kind: 'fact'; key: string; value: boolean }
  | { kind: 'all'; guards: Guard[] }
  | { kind: 'any'; guards: Guard[] };

type Action =
  | { kind: 'setFact'; key: string; value: boolean }
  | { kind: 'setVariant'; targetId: string; variantId: string }
  | { kind: 'setCamera'; cameraId: string }
  | { kind: 'enableHotspots'; ids: string[] }
  | { kind: 'journal'; entryId: string }
  | { kind: 'offerEvidence'; evidenceId: string };

interface Transition {
  event: string;
  guard: Guard;
  to: BeatId;
  actions: Action[];
}

interface Beat {
  id: BeatId;
  mode: 'explore' | 'guided' | 'inspect' | 'event' | 'map' | 'still';
  promptKey?: LocalizedKey;
  narrationId?: string;
  cameraId: string;
  hotspotIds: string[];
  claimIds: ClaimId[];
  evidenceIds: string[];
  onEnter: Action[];
  transitions: Transition[];
  skip: { to: BeatId; summaryKey: LocalizedKey; actions: Action[] };
  checkpointId?: string;
  timelineId?: string;
}

interface Chapter {
  id: ChapterId;
  order: number;           // 0..20, independent of inclusive calendar day
  titleKey: LocalizedKey;
  date: HistoricalDate;
  questionKey: LocalizedKey;
  contextKey: LocalizedKey;
  sceneId: string;
  initialVariantId: string;
  initialBeatId: BeatId;
  beats: Beat[];
  nextChapterId?: ChapterId;
  claimIds: ClaimId[];
  reconstructionKey: LocalizedKey;
  posterAssetId: string;
  readingRoute: string;
  reviewStatus: ReviewStatus;
}

interface Source {
  id: SourceId;
  title: string;
  institution?: string;
  creator?: string;
  createdDate?: string;
  sourceType: 'document' | 'photo' | 'testimony' | 'map' | 'scholarship' | 'museum-article';
  url: string;
  accession?: string;      // actual institutional identifier, if verified
  accessedDate: string;
  perspective?: 'victim' | 'witness' | 'perpetrator' | 'researcher' | 'unknown';
  rights: { status: 'unknown' | 'link-only' | 'cleared'; credit: string; termsUrl?: string };
  reviewStatus: ReviewStatus;
}

interface Claim {
  id: ClaimId;
  textKey: LocalizedKey;
  certainty: Certainty;
  attribution: Attribution[];
  date?: HistoricalDate;
  locationIds: string[];
  evidence: {
    sourceId: SourceId;
    locator: string;       // page, section, image identifier, or timestamp
    relation: 'supports' | 'contradicts' | 'context';
  }[];
  uncertaintyKey?: LocalizedKey;
  review: { status: ReviewStatus; reviewer?: string; reviewedAt?: string; note?: string };
}

interface EvidenceItem {
  id: string;
  titleKey: LocalizedKey;
  descriptionKey: LocalizedKey;
  claimIds: ClaimId[];
  sourceIds: SourceId[];
  mediaAssetId?: string;
  representation: 'original' | 'derivative' | 'illustration' | 'reconstruction';
  altKey?: LocalizedKey;
  transcriptKey?: LocalizedKey;
  creditKey: LocalizedKey;
  date?: HistoricalDate;
}

interface Person {
  id: string;
  displayName: string;
  aliases: string[];
  roleKeys: LocalizedKey[];
  affiliationClaims: ClaimId[];
  biographyClaims: ClaimId[];
  fateClaims: ClaimId[];
  portraitEvidenceId?: string;
  reviewStatus: ReviewStatus;
}

interface LocationRecord {
  id: string;
  nameKey: LocalizedKey;
  temporalClaims: ClaimId[];
  geometry: { type: 'point' | 'area' | 'schematic'; coordinates: number[][] };
  accuracy: 'verified' | 'approximate' | 'unknown';
  coordinateSystem: string;
  mapSourceIds: SourceId[];
}
```

Store map edges as separately sourced dated records with relation types (`contact`, `movement`, `shelter`, `interpretive-link`) and certainty. An interpretive link may explain relationships but must not appear as a documented physical tunnel. Asset records have logical ID, content hash, MIME, bytes, variants, rights status, and dependencies.

### 10.2 Representative chapter data

This complete chapter-structure fixture demonstrates the contract, not release-ready historical content. Referenced assets, claims, and locale keys must exist before cross-reference validation can pass; the draft review flag is deliberate. The production chapter expands this minimal example into the scene card above.

```json
{
  "id": "ch01_wall",
  "order": 1,
  "titleKey": "wall.title",
  "date": {"start": "1940-11", "precision": "month", "labelKey": "date.nov1940"},
  "questionKey": "wall.question",
  "contextKey": "wall.context",
  "sceneId": "street_shared",
  "initialVariantId": "enclosure",
  "initialBeatId": "wall_arrival",
  "nextChapterId": "ch02_inside",
  "claimIds": ["cl_wall_sealed"],
  "reconstructionKey": "wall.reconstruction",
  "posterAssetId": "poster_wall",
  "readingRoute": "/read/ch01_wall",
  "reviewStatus": "draft",
  "beats": [
    {
      "id": "wall_arrival",
      "mode": "guided",
      "cameraId": "cam_wall_arrival",
      "hotspotIds": [],
      "claimIds": ["cl_wall_sealed"],
      "evidenceIds": [],
      "onEnter": [{"kind": "setCamera", "cameraId": "cam_wall_arrival"}],
      "transitions": [{"event": "VIEWPOINT_REACHED", "guard": {"kind": "always"}, "to": "wall_look_back", "actions": []}],
      "skip": {"to": "wall_look_back", "summaryKey": "wall.arrival.summary", "actions": []},
      "checkpointId": "cp_wall_arrival"
    },
    {
      "id": "wall_look_back",
      "mode": "explore",
      "cameraId": "cam_wall_gate",
      "hotspotIds": ["hotspot_outside_view"],
      "claimIds": ["cl_wall_sealed"],
      "evidenceIds": ["ev_wall_photo"],
      "onEnter": [],
      "transitions": [{"event": "CONTINUE", "guard": {"kind": "always"}, "to": "wall_close", "actions": []}],
      "skip": {"to": "wall_close", "summaryKey": "wall.separation.summary", "actions": []}
    },
    {
      "id": "wall_close",
      "mode": "still",
      "cameraId": "cam_wall_gate_closed",
      "hotspotIds": [],
      "claimIds": ["cl_wall_sealed"],
      "evidenceIds": ["ev_wall_photo"],
      "onEnter": [{"kind": "setVariant", "targetId": "gate", "variantId": "closed"}],
      "transitions": [{"event": "CONTINUE", "guard": {"kind": "always"}, "to": "$chapterEnd", "actions": []}],
      "skip": {"to": "$chapterEnd", "summaryKey": "wall.exit.summary", "actions": []},
      "checkpointId": "cp_wall_closed"
    }
  ]
}
```

Validate date-string shape against precision: `YYYY` for year, `YYYY-MM` for month, and a valid `YYYY-MM-DD` for day. Ranges use two compatible endpoints and a descriptive display label. Historical dates are civil dates; never convert them through a browser timezone or fabricate an indexing day. The reserved transition destination `$chapterEnd` is handled by the engine and excluded from ordinary beat-ID lookup. Skipping to it shows the authored summary before the chapter-end UI.

### 10.3 Runtime invariants

- Guards/actions are a fixed allowlist. No `eval`, executable JSON, or arbitrary URLs used as code.
- Events carry `sessionGeneration`, chapter ID, beat ID, event ID, and timestamp; obsolete or duplicate events are ignored.
- Transition selection is deterministic. Ambiguous transitions with overlapping guards are validation failures.
- Beat entry is applied once. A journal action uses a set keyed by entry ID.
- Sequence skipping applies the authored final variant/actions, not every intermediate sound/animation.
- Optional evidence never becomes a hidden dependency for chapter continuation.
- Reading and 3D modes share the same content IDs and source relationships, but reading mode never requires spatial events.
- Direct chapter entry builds a known baseline snapshot; it does not depend on visiting every preceding chapter.
- Backtracking and replay restore the chapter baseline, then approved local progress if resuming. Do not merge destructive variants from a later date into an earlier street.

### 10.4 Timeline/cue system

Each scripted sequence is a cue sheet referenced by `timelineId`. Cues specify logical time, duration, target, action, captions, and optional quality variants. Targets are named model anchors or runtime emitters. Cue categories: animation, camera, sound, material/visibility, narration, caption, and stable world-state change.

An event has a deterministic seed where random particle variation is useful. History is never randomized. On pause, freeze clock and mixer playback and pause supported audio. On seek or restore, reconstruct stable state from baseline plus stateful cues and restart eligible continuous loops at the matching offset. Do not replay transient gunshots on a restore. Audio end events cannot be the only progression trigger; silent mode must complete.

### 10.5 Progress persistence

```ts
interface SaveData {
  schemaVersion: number;
  contentVersion: string;
  chapterId: string;
  checkpointId: string;
  completedChapterIds: string[];
  visitedEvidenceIds: string[];
  settings: {
    locale: string;
    subtitles: boolean;
    reducedMotion: boolean;
    reducedIntensity: boolean;
    movementMode: 'guided' | 'explore';
    quality: 'auto' | 'low' | 'medium' | 'high';
    masterVolume: number;
  };
  updatedAt: string;
}
```

Save at safe beat boundaries and settings changes, not every frame. Never persist renderer handles or unvalidated camera positions. Validate local storage; if corrupt, offer Start new / Continue from last valid checkpoint rather than a crash. Migrate versions explicitly; if a checkpoint was removed, return to that chapter's entry with a clear notice. Storage-denied/private mode still works in memory.

## 11. State machine

Use two coordinated layers: app-level state and chapter-level beat state. Modals and visibility pause are independent suspension reasons, not a single fragile toggle. Playback resumes only when the suspension reason set is empty.

```text
APP
BOOT → MENU
MENU --Begin/Continue/Chapter selection--> LOADING
LOADING --ready--> EXPERIENCE
LOADING --recoverable error--> LOAD_ERROR
LOAD_ERROR --retry--> LOADING
LOAD_ERROR --read--> READING
EXPERIENCE --chapter complete--> CHAPTER_END
CHAPTER_END --continue--> LOADING (next chapter)
EXPERIENCE/CHAPTER_END --archive--> ARCHIVE
ARCHIVE --return--> saved experience location or MENU
ANY --read mode--> READING
ANY --render capability failure--> READING with explanation

CHAPTER SESSION
ENTER → ACTIVE_BEAT
ACTIVE_BEAT --valid event--> NEXT_BEAT
ACTIVE_BEAT --skip--> AUTHORED_SKIP_TARGET
ACTIVE_BEAT --last beat complete--> CHAPTER_END
ACTIVE_BEAT --open evidence/map/settings/pause--> SUSPENDED
SUSPENDED --all reasons cleared--> ACTIVE_BEAT
ACTIVE_BEAT --leave--> DISPOSED
```

| Event | Guard | Side effects |
|---|---|---|
| `BEGIN` | Menu; no active transition | Start audio permission path; load opening |
| `CHAPTER_SELECT` | Valid chapter ID | Cancel old generation; load baseline/context |
| `HOTSPOT_ACTIVATE` | Hotspot enabled in active beat | Open evidence or allowed demonstration |
| `OPEN_OVERLAY` | Known overlay ID | Add suspension reason; route focus; release pointer lock |
| `CLOSE_OVERLAY` | Overlay present | Remove its reason; restore focus; do not auto-lock pointer |
| `PAUSE` | Experience active | Suspend logical clock and audio; show pause UI |
| `VISIBILITY_HIDDEN` | Browser hidden | Add visibility suspension; stop rendering |
| `SKIP_SEQUENCE` | Authored skip exists | Apply end-state snapshot; show summary; checkpoint |
| `NARRATION_FINISHED` | Current beat/generation | Allow authored transition; never required for muted audio |
| `CONTINUE` | Authored transition exists | Apply idempotent actions; change beat/chapter |
| `WEBGL_CONTEXT_LOST` | Active renderer | Suspend; preserve checkpoint; attempt bounded recovery |
| `ASSET_ERROR` | Essential asset unresolved | Retry/reading fallback; no silent fabricated substitution |

Context recovery reloads from a safe checkpoint, not half of a cinematic. Two failed recovery attempts select reading mode with an optional manual retry. An invalid guard, missing beat, or impossible checkpoint is a build-time failure and a graceful production error, never an infinite spinner.

## 12. Evidence, archive, and source system

### 12.1 Relationship graph

`Scene/beat → claim → supporting/contradicting source + locator → evidence media → people/locations`.

Every displayed historical assertion—including organization badges, map colors, person roles, and date cards—must be traceable. Scene-wide citations are not sufficient for contested specifics. Shared claims can be reused across scenes without duplicated inconsistent copy.

Evidence is not a reward. Label notifications “Source available” or “Historical source,” not “Artifact collected.” The journal records access for convenience without percentages, streaks, or badges.

### 12.2 Evidence detail layout

1. Title and document/media type.
2. Original image/media or clearly marked derivative, with accessible description.
3. Creator, date, location, institution, actual accession if known.
4. Brief context and the exact claim it informs.
5. Perspective/limitations, especially perpetrator-generated images and reports.
6. Translation/transcription provenance, distinction between paraphrase and quotation.
7. Rights credit and original source link.
8. Related people, places, and alternative evidence when relevant.

A source titled “Stroop Report” is not neutral documentation of its own claims. Identify the perpetrator context; attribute reported counts and dehumanizing language rather than adopting them. Avoid quoting such wording outside a necessary, explained source view.

### 12.3 Archive navigation

Primary categories: People, Organizations, Places, Documents & Testimony, Timeline, About the Reconstruction. Filters: ŻOB, ŻZW, civilian, courier/organizer, date, evidence type, and certainty. Allow mixed affiliations through dated claims; avoid forcing every person into one lifelong category.

Search handles Polish diacritics and name aliases; normalize for matching while preserving canonical display. Results should rank exact names and aliases before generic body text. All results have useful empty states. Organization pages include what is known, source gaps, people, and linked chapters with equivalent navigational prominence.

Deep links: `/archive`, `/archive/people/:id`, `/archive/sources/:id`, `/chapters/:id`, `/read/:id`. Reloading a link must work on the chosen host. Browser Back restores archive filters and previous chapter context. Copying a link never includes private local progress.

### 12.4 Editorial and rights workflow

`Research candidate → catalog record → transcription/translation → claim extraction → historical review → rights review → publishable derivative → content validation → release`.

Historical approval and media rights clearance are separate gates. A text claim may be approved while its photograph remains link-only. Unknown rights mean no hosted media derivative in production. Website availability does not establish permission to redistribute.

A coding agent may create placeholder record slots with `needs-review`, but must not set `approved`, invent reviewer names, fabricate archive IDs, or assume public domain. Development displays a visible “Editorial placeholder”; production build excludes unapproved records or fails if a mandatory beat would become empty.

Generated archival photographs, invented witnesses, fabricated letters, synthetic “original” maps, and undocumented biographical particulars are prohibited. Generated illustrations, if ever added, are labeled and visually separated from evidence.

### 12.5 Starter references and research gaps

The links in Section 3 are a verified starting bibliography, not the full release archive. Each institutional collection item still needs its own catalog URL, locator, rights, and record review. In particular, acquire/verify:

- Wall and daily-life media suited to the actual represented viewpoints.
- Deportation documentation and a source-grounded Treblinka context record.
- Distinct organizational records for ŻOB and ŻZW; reviewed biographies and surviving images.
- Muranowski evidence and scholarship that directly address contested details.
- Civilian and courier testimony, including women and varied forms of resistance.
- Miła 18 accounts with careful treatment of uncertainty.
- May 10 evacuation testimony and diagram/map evidence for any exact route claims.
- Aftermath records for both organizations and civilian survivors.
- Historical boundaries/streets for the actual dates represented, not only today's map.

The prior conversation is continuity material for the product brief; it is not itself a historical source. The earlier sandbox file link does not prove the old asset is available or its facts approved.

## 13. Camera, lighting, post-processing, and audio

### 13.1 Camera direction

- Default horizontal feel: natural perspective; vertical FOV approximately 45–55° desktop. Adjust framing by aspect ratio, not by distorting the scene to preserve a shot.
- No head bob, sprint shake, obligatory handheld sway, aggressive roll, lens breathing, or mouse acceleration by default.
- Frame shared landmarks to link earlier street states. Reserve one strong focal point per beat.
- Cinematic movement uses authored position/look targets and eased progress. Slow enough to read space; stop if a viewer opens evidence.
- Guided rails should stay within validated camera-safe bounds. Avoid passing through walls, colliding with NPCs, or entering a character's head.
- Limited look offsets preserve agency without revealing unfinished geometry; restore smoothly after release when appropriate.
- Inspectable props rotate only when spatial understanding benefits. Archive images use ordinary pan/zoom controls, with the original composition preserved.
- Every moving composition needs an alternate still viewpoint and semantic description. Do not rely on camera motion as the only indication of an important object.

### 13.2 Lighting and color management

Use one consistent color pipeline and reference exposure charts. Choose renderer output color space and tone mapping explicitly; color textures and data textures are tagged appropriately. Test exports under browser lighting, not only Blender's viewport. Proposed default: physically based materials, filmic/ACES-style tone mapping with restrained exposure, and modest environment illumination.

Most scenes: one main directional source plus baked or simple fill. Practical lanterns are primarily emissive geometry with a few nearby point lights, not dozens of shadow-casting lights. Bake architectural ambient/shadow detail where it survives the GLB pipeline. Baked illumination is separate from portable material metadata; test actual implementation before promising lightmaps.

Shadows: one principal shadow map in medium/high tiers; static baked treatment in low tier. Fit shadow frustum to the important region; avoid full-city shadow coverage. Proposed 1024² medium / 2048² high shadow texture; low uses baked or none. All tiers retain readable navigation and figure separation.

Use fog for depth and deliberate scene bounds, not to conceal missing core architecture. Nights and bunkers must be atmospherically dark yet navigable. A comfort brightness option changes readability without erasing historical meaning.

### 13.3 Post-processing

Default baseline: tone mapping, suitable antialiasing, subtle color grade if measured necessary. Optional medium/high: restrained ambient occlusion and selective low-cost bloom on fire/lanterns. Depth of field only in authored still/inspection shots; never blur text, evidence, or navigation. No motion blur by default, chromatic aberration, excessive film grain, persistent vignette, or “cinematic” effects that reduce legibility.

Implement the output transform once; do not double tone-map via renderer and compositor. Compare screenshots across pipeline settings. DOM UI sits outside the post-process chain. Disabled effects must preserve narrative cues and avoid rendering an almost invisible flame or exit.

### 13.4 Smoke, fire, and destruction

- Fire uses authored emissive shapes/sheets with bounded particle detail, not a fluid simulation.
- Smoke uses few large carefully sorted forms or low-density particles. Test transparency sorting and overdraw; avoid huge full-screen alpha stacks.
- Most destruction is pre-authored intact/damaged/ruined variants with matched anchor identities.
- No physics-driven collapsing buildings landing near the visitor.
- Flicker is restrained and removable; no repeated high-frequency full-screen flashes. Reduced intensity suppresses flash/shake/transient extremes.
- Effects have predictable maxima and spawn budgets. Disposed scenes leave no particles, timers, lights, or audio sources behind.

### 13.5 Audio direction and implementation

Audio supports attention and human scale. It must not turn historical violence into action-game feedback.

| Bus | Content | Behavior |
|---|---|---|
| Narration | Reviewed educational script | High intelligibility, transcript parity |
| Testimony | Rights-cleared historical recordings | Identified speaker/recording date; no synthetic impersonation |
| Ambience | Streets, interiors, wind, water | Subtle looping layers with crossfades |
| World events | Gate, footsteps, distant conflict | Directional where useful; captions for meaningful cues |
| Music | Sparse original/licensed score | No triumphal combat build or manipulative constant swell |
| UI | Very restrained navigation sounds | Optional; no reward chime for evidence |

Use Web Audio with a single reusable AudioContext activated on user gesture. Provide master, narration, ambience/effects, and music settings; retain settings locally. Duck ambience beneath narration. User can mute all sound without losing meaning or progression.

Proposed mix starting point: narration assets around −18 LUFS integrated and a conservative true-peak ceiling, then balance the complete browser mix by listening on laptop, headphones, and phone. These are production proposals, not medically safe exposure claims. No surprise extreme transients or compulsory headphone usage.

Stream/decode chapter narration and ambience selectively; do not decode the entire project into memory. Use a supported compressed audio format with fallback selected by capability. Keep caption timestamps as data independent of sound-file completion. On page hide, modal pause, seek, and scene change, scheduled cues stop or resume consistently. Test Bluetooth delays and muted autoplay paths.

Soundtrack is a separate rights-cleared deliverable. AI may prepare cue sheets and placeholder tones in development; it must not fabricate survivor testimony or ship unreviewed synthetic historical dialogue.

## 14. Blender architecture and export pipeline

### 14.1 Authoring contract

Use a documented stable Blender version and pin the exporter. The official glTF exporter is developed with the Khronos glTF-Blender-IO project; consult its version-specific exporter documentation for supported materials, animation, and export options. Do not assume arbitrary Blender procedural shaders or drivers reproduce in the browser. [Khronos glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO/blob/main/README.md)

The Blender scene is an authoring source, not the runtime application. Model modular architecture, character rigs, navigation proxies, camera anchors, and authored damage states. Browser narrative data controls activation. Complex Blender-only effects need baking or a deliberate runtime equivalent.

### 14.2 Scene/collection conventions

```text
SCENE_<logicalSceneId>
  GEO_STATIC
  GEO_VARIANTS
    VAR_enclosure
    VAR_inhabited
    VAR_uprising
    VAR_fire
    VAR_ruins
  PROPS
  CHARACTERS
  ANCHORS
    CAM_<cameraId>
    LOOK_<lookTargetId>
    HOTSPOT_<hotspotId>
    PATH_<pathId>
    AUDIO_<emitterId>
  NAV_PROXY
  COLLISION_PROXY
  LIGHT_REFERENCE
```

Object names and stable custom properties identify assets; do not rely on Blender's automatic `.001` suffixes as runtime IDs. Use glTF extras for supported metadata or export a companion manifest when needed. All optimizers must preserve required extras and names.

Example metadata:

```json
{
  "logicalId": "hotspot_secondary_exit",
  "kind": "hotspot",
  "sceneId": "bunker_interpretive",
  "variantIds": ["prepared", "occupied"],
  "evidenceId": "ev_bunker_preparation",
  "representation": "reconstruction"
}
```

Geometry conventions: real-world scale, sensible origins, applied scale, no unintended negative scale, deliberate normals, no stray hidden export objects. Establish an export preset and validate that cameras/anchors retain their intended coordinates. Named camera anchors are authoritative, but runtime CameraDirector may use calibrated field-of-view/comfort overrides.

### 14.3 Modeling and texture rules

- Build reusable facade bays, corners, doorways, roofs, stairwells, and courtyards rather than one monolithic city mesh.
- Hero landmarks receive bespoke silhouette/reference work; repetitive architecture can be instanced or merged by material.
- Author at least three LOD levels for major repeated objects; preserve recognizability and navigational landmarks.
- Collision/navigation meshes are simple, invisible, and independently inspectable in diagnostics.
- Limit material slots and atlas small props where it helps draw calls. Avoid one unique 4K texture for every object.
- Pack PBR data channels consistently; use color-space tagging appropriate to each map. Test mipmaps at distance and silhouette readability.
- Palette/vertex colors are efficient, but require intentional variation and no indiscriminate noise.
- UVs and lightmaps, if used, have a documented non-overlapping layout and actual runtime support verified in the vertical slice.

### 14.4 Rigging and animation rules

Use a shared economical humanoid rig; target roughly 20–35 deform bones for baseline characters, adjusted for required actions. Export explicit clips with stable names (`walk`, `idle_wait`, `carry_bundle`, `sit`, `handover`, `descend`). Root motion conventions must be documented: recommended locomotion is runtime-authored path motion plus in-place walk animation, avoiding double movement.

Bake constraints/drivers to supported transform or skeletal animation for export. Avoid material animation assumptions; runtime effect cues can drive emissive intensity. Verify a GLB roundtrip and actual Three.js playback for every clip type, including paused/resumed timing. Do not instanced-render unique skeletal characters without a proven skinning strategy; use simple rigid low-LOD figures or a measured batching technique for distant crowds.

### 14.5 Export-to-runtime steps

1. Save source `.blend` with reference provenance and version record.
2. Validate scale, transforms, UVs/normals, triangle/material budgets, anchor IDs, and scene bounds.
3. Export raw GLB using the pinned preset; export companion metadata when necessary.
4. Validate glTF structure, then load in a small browser fixture. Inspect all variants/animations/anchors.
5. Optimize geometry with the chosen compression pipeline; preserve semantic names/extras needed by runtime.
6. Encode eligible textures to KTX2 and generate quality variants. Keep archival images outside the 3D texture optimizer.
7. Generate manifest entry with bytes, hashes, dependencies, quality tiers, source/rights notes, and expected anchors.
8. Capture browser renders under approved light/camera settings and compare with target boards.
9. Run automated budget/anchor checks; record approval or issues.
10. Ship only runtime exports. Store raw assets and Blender sources separately from the website payload.

Pipeline failure must be visible. A mesh that exports successfully but loses its hotspot IDs is not production-ready.

## 15. Asset inventory and budgets

Counts are planning estimates. The inventory must become a tracked manifest with owner, status, dependencies, source references, rights, tier, and acceptance capture. Reuse does not justify falsifying a specific historical location.

| Family / logical IDs | Planned scope | Principal chapters | Notes |
|---|---|---|---|
| `street_shared` | One hero street, 4–5 variants | 00–02, 11, 14, 19 | Matched landmarks; multi-date art review |
| `architecture_kit` | 20–30 modules | Most above-ground scenes | Facades, doors, roofs, stairs, courtyards |
| `wall_gate` | Wall bays, gate, outside silhouette | 01 | Approximate reconstruction if exact site unknown |
| `daily_life_props` | 15–25 props | 02, 08, 10 | Household/community detail |
| `umschlagplatz` | One compact platform module | 03 | Layout/source review required |
| `train_kit` | Freight car, rail, platform pieces | 03 | No visitor deportation simulation |
| `personal_objects` | 4–6 illustrative/documented props | 03 | Each clearly classified |
| `meeting_room` | One interpretive interior | 04–05 | Not a falsely documented shared meeting |
| `courier_route` | Small street/interior variant | 06 | Uses shared kit, labeled route |
| `weapons_props` | Small reviewed prop family | 06, 10–13 | No equippable weapon runtime |
| `apartment_observer` | Shutter/window/passages | 07, 11 | Scripted distant event staging |
| `bunker_interpretive` | Prepared/occupied variants, cutaway | 08, 15 | Stable secondary-exit anchor |
| `network_map` | SVG/base geography and dated layers | 09, 11, 17 | Claim-linked nodes and edges |
| `muranowski_hero` | Square plus 3 viewpoints | 12 | Full hero allocation, disputed details optional |
| `districts_kit` | 2–3 small passages/courtyards | 13 | Local attribution, readable navigation |
| `mila18_context` | Exterior + interpretive interior | 16 | Separate from generic bunker |
| `sewer_kit` | Straight, curve, junction, ladder modules | 18 | Reconstructed route; safe navigation |
| `ruins_kit` | 15–25 reusable debris/damage pieces | 00, 14, 17, 19 | Purposeful distribution, not clutter |
| `humans` | 6–8 base silhouettes + variants | Most chapters | Children/elderly reviewed; faceless |
| `animations` | 8–12 baseline clips + scene-specific cues | Most chapters | No repeated death ambience |
| `effects` | Smoke, fire, dust, light shafts | Event/destruction scenes | Bounded quality variants |
| `posters` | At least one per chapter | All | Reading/loading fallback |
| `archive_media` | Initial 20–40 record slots | Evidence/archive | Actual clearance determines hosted count |
| `person_records` | Initial 12–20 reviewed slots | 05, 12, 16, 20 | Both organizations and civilians |
| `narration` | 21 chapter scripts/recordings + transcript | All | Review and language/voice production required |
| `ambience` | 8–12 loop families | All | Exterior, room, bunker, sewer, aftermath |
| `event_audio` | 20–30 restrained cues | Selected scenes | Captions and rights register |
| `ui_fonts/icons` | 2 families + small icon vocabulary | DOM UI | Licensed, language coverage verified |

Every chapter must have at least one reviewed source relationship, but numerical evidence quotas are not a quality substitute. Archive size is not a collectible goal.

### 15.1 Proposed GPU scene ceilings

These are initial budgets, subject to actual hardware profiling. Count the whole visible scene, including shadows and post-processing overhead—not only one model.

| Budget | Low | Medium | High |
|---|---:|---:|---:|
| Visible triangles | 150k | 300k | 600k |
| Typical draw calls | ≤80 | ≤140 | ≤200 |
| Detailed animated figures | ≤6 | ≤12 | ≤20 |
| Shadow-casting lights | 0 | 1 | 1 |
| Usual texture max dimension | 1024 | 2048 | 2048; 4096 only justified hero |
| Pixel ratio cap | 1.0 | 1.25 | 1.5 |
| Approx. managed GPU resource budget | 128MiB | 256MiB | 384MiB |
| Expensive screen-space effects | None | One restrained pass | Measured combination only |

GPU memory figures are application estimates from assets/render targets, not precise cross-browser driver accounting. Target mobile devices may require even smaller bundles. Archive thumbnails should not remain uploaded as scene textures after leaving a chapter.

## 16. Performance targets and adaptive quality

Targets are acceptance criteria to measure on an actual build, not current verified results. Record browser version, device, power mode, viewport, quality tier, network conditions, and content version in the performance report.

### 16.1 Provisional test profiles

| Profile | Representative hardware class | Intended behavior |
|---|---|---|
| Desktop high | Recent dedicated GPU, 1920×1080 CSS viewport | Target 60fps high tier |
| Laptop medium | Iris Xe-class integrated GPU, 8–16GB RAM | Target 45–60fps medium; stable 30 minimum |
| Mobile low | iPhone 12-class or midrange Android with WebGL2 | Target stable 30fps with guided waypoints |
| Constrained | Older GPU, disabled acceleration, renderer unavailable | Full reading/archive mode with no canvas dependency |

Choose and document real owned/available test devices before promising support. Emulation cannot establish GPU performance. Test Chrome/Edge, Firefox, Safari macOS, iOS Safari, and Android Chrome versions available at release. Include browser zoom, reduced motion, storage denied, slow network, and background/resume.

### 16.2 Loading and responsiveness

- Title/reading shell initial compressed JavaScript target ≤250KiB, excluding lazily loaded Three.js/runtime and media. Initial title poster target ≤250KiB.
- Load 3D runtime only when the visitor chooses the experience, or through bounded idle prefetch that respects data-saving preferences.
- Initial entry bundle target ≤8MiB compressed transfer on medium tier. Each incremental scene bundle target ≤6MiB; exceptional hero bundle maximum 10MiB requires profiling and an explicit reason.
- Reading/DOM entry LCP target ≤2.5s under a defined 10Mbps, 100ms RTT cold-cache lab profile. Distinguish this from time until interactive 3D.
- First interactive 3D target ≤10s on the same network and medium profile; show a useful poster/context throughout.
- Prefetched chapter transition target ≤2s; cold transition target ≤8s for a 6MiB bundle under that profile. Expose accurate progress, never fake percentage movement.
- Interaction feedback target <100ms; evidence/menus remain responsive even if world frame rate drops.
- Input responsiveness target INP ≤200ms for DOM routes where field measurement is applicable; lab results alone do not establish field performance.
- No main-thread task >100ms during normal exploration. Asset decode/scene setup must be chunked, prefetched, or moved off-thread where feasible.

### 16.3 Frame and stability criteria

For a representative 90-second path per hero scene, report median and p95 frame time after warmup, plus slow-frame counts. High target p95 ≤22ms; medium ≤30ms; low ≤36ms. Brief initial shader compilation is reported separately and should occur behind loading, not as a surprise at the first fire cue.

Complete a 20-minute mobile soak and full-route desktop traversal. Verify no crashes, WebGL context loss loops, unbounded emitter accumulation, or thermal-quality oscillation. After three repeated chapter roundtrips and cache settling, managed resource counts must return to expected retained baselines; growth requires explanation. Browser heap trends and renderer resource counts are both needed—one alone cannot prove no leak.

### 16.4 Adaptive quality algorithm

1. Start at conservative tier based on capabilities and user override, then measure rather than trusting device labels alone.
2. Sample frame times over a rolling window after warmup, excluding deliberate pauses and load transitions.
3. On sustained misses, reduce render resolution first within defined bounds, then costly post effects, then shadow/crowd detail.
4. Require a stable recovery window before increasing quality; use hysteresis and infrequent changes to avoid visible oscillation.
5. Never reduce source text, captions, attribution labels, essential navigation, or historical cues.
6. Honor explicit user tier selection; offer a performance suggestion instead of silently overriding it unless renderer stability is at risk.
7. Quality variants may change visual detail, not which events occur or which groups are represented.

Precompile representative materials/effects when supported by the pinned runtime. Reuse geometries/materials, instance repeated static architecture, cull hidden variants, keep shadow bounds tight, and reserve transparency for intentional effects. Texture bytes on disk are not texture memory; estimate decoded GPU cost including mip levels and render targets.

## 17. Production pipeline and review checkpoints

### 17.1 Production lanes

| Lane | Input | Output | Review checkpoint |
|---|---|---|---|
| Historical research | Institutional sources, scholarship, collections | Claims, people, locations, uncertainty register | Historian/editor approval |
| Narrative | Approved claims and chapter cards | Copy, cue sheets, transcripts, reading sequence | Accuracy, clarity, dignity, pacing |
| Art | Reference boards and scene plans | Blender modules, variants, animation | Historical plausibility and visual target |
| Engineering | Data contracts and assets | Runtime, archive, persistence, fallback | Functional tests and profiling |
| Audio | Approved scripts and sound plan | Recordings, mixes, captions | Intelligibility, rights, tonal restraint |
| QA | Build and review records | Test reports, captures, fixes | Release criteria satisfied |

A historical reviewer is not assumed to exist. Track any missing review as a production dependency. The AI agent can build and demonstrate the software while retaining `needs-review` content; it must not declare historical release approval on behalf of an expert.

### 17.2 Reproducible asset handoff

Each asset ticket records: logical ID, purpose, associated chapters/claims, reference IDs, author, source file, exporter/tool versions, rights/credit, triangle/material/texture metrics, exported bytes, named anchors, animation clips, quality variants, thumbnail, reviewer status, and integration test result.

Keep original historical media unchanged and separately retained according to access permissions. Generate explicitly identified web derivatives with documented cropping/resizing. Never crop out context that changes the evidentiary meaning. Keep master audio, transcripts, subtitle files, and localized derivatives linked by stable content IDs.

### 17.3 Required review artifacts

- Storyboard/contact sheet for every chapter's key views.
- Art target board and browser-rendered vertical-slice captures.
- Historical claim matrix, attribution audit, uncertainty register, and rights register.
- Scene loading/resource budget report, frame captures, and mobile soak results.
- Complete script, transcripts, subtitle/caption timing sheets, and localization QA.
- Accessibility test results and reading-mode comparison.
- Build/deployment instructions and content-authoring guide.
- Explicit list of placeholders and deferred enhancements. A release build has no hidden mandatory placeholder.

### 17.4 Scope discipline

MVP means the complete narrative with leaner production assets, not deleting ŻZW or civilians. The vertical slice is an earlier engineering/art milestone and is not advertised as the entire experience.

Optional later additions: richer environmental detail, additional reviewed biographies, extra language recordings, advanced particles, and opt-in curator commentary. Out of scope: multiplayer, generative character chat, alternate history, procedural missions, weapon systems, combat AI, visitor moral scoring, VR, account systems, and tactical strategy simulation.

## 18. QA and definition of done

### 18.1 Content and historical QA

- Every chapter/date/person/organization/map assertion resolves to existing reviewed claims and locators.
- Every direct quotation is verified and its translation/reproduction treatment reviewed.
- Reconstruction labels exist where geometry, movement, dialogue, or staging are illustrative.
- ŻOB and ŻZW have distinct identities and sustained presence; Muranowski is mandatory and polished.
- January attribution is evidence-based; Brushmakers and other districts are not falsely exclusive territories.
- Miła 18 loss does not become the ending of all resistance.
- No map node is assigned exact position, active date, or organization without supporting evidence or a clear approximation label.
- May 16, inclusive counting, and Passover chronology are described accurately.
- No invented archive identifiers, photographs, biographies, or unsupported named dialogue appears as fact.
- Perpetrator-produced material is identified and contextualized.
- Rights clearance exists for every hosted historical/media asset. Link-only sources are not bundled.
- Named people are not reduced to only their deaths; roles and documented lives receive attention.

### 18.2 Functional and state QA

Automated tests should target meaningful invariants, not mirror every implementation line:

1. Validate all JSON schemas and cross-references; reject duplicate IDs, missing localization keys, missing anchors, unsafe action kinds, and orphaned mandatory claims.
2. Traverse the beat graph: every entry reaches an exit, optional branches return, skips have valid destinations, and each chapter can start independently.
3. Test reducer determinism, idempotent transitions, stale-event rejection, pause reason sets, and skip end-state equivalence.
4. Test save migration, corrupt/denied storage, content-version mismatch, and chapter baseline restore.
5. Browser tests: Begin → evidence → close → map → close → pause/resume → skip → chapter end → next chapter; archive deep links and browser Back.
6. Verify muted audio does not block transitions and transcript mode includes equivalent information.
7. Simulate a failed model/audio/media load, cancelled load, context loss, and rapid chapter switching. Ensure clear recovery and no ghost event from disposed scenes.
8. Test direct entry into Chapters 12, 16, and 18 without earlier chapters; all essential context and navigation still work.

### 18.3 Accessibility and comfort QA

Manually complete the route using keyboard only and using reading mode with a screen reader. Test at least NVDA with a supported Windows browser and VoiceOver with Safari when available. Automated accessibility scanning supplements this; it does not prove canvas equivalence or good narration order.

Check focus restoration, overlay stacking, pointer-lock release, headings, labels, contrast, 200% zoom, narrow layout, touch reachability, Hebrew RTL, Polish glyphs, captions, muted audio, reduced motion, and reduced intensity. Confirm the visitor can pause or leave every scripted event.

No educational outcome depends on fast reaction or motor precision. Text summary bypass must preserve the same factual content and source links.

### 18.4 Visual/audio QA

- Browser screenshots match approved compositions at desktop/tablet/mobile aspect ratios.
- Scene lighting is readable; no black navigational holes, z-fighting, broken normals, transparent sorting defects, floating feet, or camera wall penetration.
- Shared landmarks line up across date variants.
- Clothing, architecture, props, and maps have reference provenance; no contemporary anachronisms appear unnoticed.
- Fire/smoke remain within performance budget and reduced-intensity settings work.
- Captions and narration align; no cut-off dialogue or repeated ambient loop seams distract.
- Archive images are ungraded and captions preserve source context.
- Model/audio placeholders are visibly marked in development and absent from release.

### 18.5 Release definition of done

A production release is done only when:

1. All 21 chapters and their complete reading equivalents are reachable and coherent.
2. The default route contains every mandatory learning beat; optional source reading is never needed to escape a scene.
3. Both organizations and civilian perspectives meet the narrative requirements.
4. All required historical review and media rights gates are complete, or unapproved material has been explicitly removed without hollowing out a mandatory chapter.
5. No shooter mechanics or implied history-changing agency exists.
6. Desktop/mobile supported profiles meet the documented performance/stability thresholds; fallback is tested.
7. Keyboard, screen-reader reading mode, captions, comfort controls, zoom, and responsive layouts pass manual review.
8. Save/resume, direct links, failed assets, context recovery, and disposal are tested.
9. Visual and audio reviews meet the agreed production target; low-poly is intentional rather than visibly unfinished.
10. README, content-authoring guide, source/rights registry, asset manifest, QA report, and known-limitations record ship with the project.
11. Production deployment configuration has been verified in a staging preview; public publishing follows the owner's authorization.

Technical completion and historical/publication readiness are recorded separately. Do not mark the entire release complete merely because the site compiles or a single scene looks polished.

## 19. Step-by-step build plan

Proceed in this order. Each stage ends with concrete reviewable output and a gate. Do not expand expensive art or add effects before the scene lifecycle and data contract work.

### Step 1 — Establish repository and content baseline

Create `28-days/`, install/pin the selected toolchain, set strict TypeScript, formatting, build scripts, and content validation. Copy this specification into project docs without editing synced reference files. Create the 21 chapter IDs and an editorial-placeholder register. Record decisions and unresolved historical/media dependencies.

**Output/gate:** Clean reproducible build; known chapter manifest; no invented approved historical records.

### Step 2 — Build the complete reading spine first

Implement title/menu, chapter navigation, reading routes, chapter questions/flow summaries, settings, and archive scaffolding. Build actual source/claim schemas and draft records from the bibliography. Add obvious development-only labels for unreviewed copy.

**Output/gate:** Every chapter can be read in order; names, chronology, deep links, and source relationships work without WebGL.

### Step 3 — Implement runtime and narrative foundations

Build canvas lifecycle, SceneManager, AssetManager, camera director, input routing, pause reason set, deterministic reducer, timelines, checkpoints, and local save. Load one tiny GLB fixture with an anchor, animation, and hotspot. Add diagnostic resource counts and frame metrics.

**Output/gate:** Load → interact → pause → switch → dispose → resume works; stale loads/events cannot corrupt state.

### Step 4 — Approve one art target and Blender pipeline

Make a small street/gate set, one faceless character, a prop, and two date variants. Export through the proposed production pipeline and inspect in the real browser. Prove coordinate conversion, metadata retention, texture handling, clip playback, and readable lighting.

**Output/gate:** Browser captures establish the intended art quality; the asset contract is reproducible.

### Step 5 — Deliver the primary vertical slice: The Wall

Implement Chapter 01 end to end: intro, guided/explore modes, gate viewpoint, script, evidence drawer, accessible hotspot list, captions, skip, chapter exit, and save/resume. Include one real rights-permitted source record or a clearly marked link-only placeholder while clearance remains pending.

**Output/gate:** A polished 3-minute experience on desktop and mobile, with reading parity and measured budgets. This is the production-quality reference.

### Step 6 — Prove the difficult chapters before full expansion

Implement compact graybox tests for Muranowski's three perspectives/evidence comparison, the preparation/bunker callback, and a scripted January or April event. Include disputed-claim handling, skip summaries, pause/seek behavior, and attribution markers.

**Output/gate:** The architecture supports ŻZW depth, civilian infrastructure, and non-shooter events without special-case hacks.

### Step 7 — Graybox all 21 scenes and integrate flow

Populate the full chapter route with temporary environment modules and authored camera anchors. Implement all chapter questions, prompts, source slots, reading text, map temporal layers, and transitions. Run complete navigation/state tests before expensive art passes.

**Output/gate:** Full historical narrative can be traversed; no missing exit, dead-end evidence gate, incorrect history-changing interaction, or chapter-entry dependency.

### Step 8 — Historical and narrative review

Resolve organization attribution, dated positions, quotations, biographies, disputed Muranowski details, Miła wording, and sewer reconstruction labels. Review script rhythm and dignity. Remove or revise unsupported details rather than filling gaps with plausible invention.

**Output/gate:** Claim matrix and script version approved by the designated reviewer; outstanding media rights separately tracked. If reviewer unavailable, prototype continues but release remains unapproved.

### Step 9 — Produce and integrate final environments/characters

Build shared architecture/date variants first, then Muranowski and uprising districts, civilian bunker, Miła context, and sewers. Use the asset manifest and budget gates. Integrate near-character motion and distant crowd strategy, then authored damage variants.

**Output/gate:** Every chapter has a reviewed visual contact sheet and no hidden unfinished region along reachable routes.

### Step 10 — Produce narration, captions, and audio

Record approved narration, rights-cleared testimony where chosen, ambience, and sparse music. Implement ducking, pause/resume, chapter crossfades, reduced intensity, and captions. Review on real devices and confirm muted/audio-denied operation.

**Output/gate:** Script, recording, transcript, captions, and source credits stay synchronized by stable IDs.

### Step 11 — Complete archive and localization support

Integrate rights-cleared derivatives and approved person/source records. Finish search, aliases, filters, source comparison, organization pages, and linked chapters. Test Polish names and Hebrew RTL architecture; actual translated release copy is reviewed separately.

**Output/gate:** Archive works standalone and from every source moment; both organization paths and civilian records have equivalent discoverability.

### Step 12 — Optimize from measured evidence

Profile the full route and hero scenes on supported device profiles. Adjust atlases/LOD/instancing, resolution, shadows, transparency, prefetch, audio memory, and shader preparation. Avoid visual downgrades that erase essential people or cues.

**Output/gate:** Published performance report with actual values, devices, methodology, failures, and remedies. No claims based only on theoretical budgets.

### Step 13 — QA, accessibility, and editorial acceptance

Run the Section 18 test matrix, full-route user tests, historical review, rights check, visual/audio review, and stability soak. Fix failures, then retest affected behavior. Request review of a concrete preview, not an unbuilt plan.

**Output/gate:** Signed/recorded acceptance or an explicit outstanding-issues list; no mandatory hidden placeholders.

### Step 14 — Package and stage

Produce versioned static build, hashed assets, correct deep-link handling, compression/cache headers, content security policy compatible with owned assets/decoders, source-credit pages, and documented rollback. Keep critical archive/media controls accessible without third-party cookies.

**Output/gate:** Staging build, source repository, production assets, rights/source documentation, QA report, and deployment instructions ready for owner-authorized publishing.

## 20. Coding-agent completion report format

At each milestone report:

1. What a visitor can now experience, with a local preview/artifact reference.
2. Which chapters and systems are complete versus placeholders.
3. Tests actually run and measured results; never equate a successful build with QA approval.
4. Historical/rights items still awaiting review.
5. Any departure from this specification and why.
6. The next concrete milestone, including its acceptance gate.

The final handoff must distinguish a complete software implementation, production art/audio completion, historical approval, rights clearance, and public deployment. If any remains unfinished, name it plainly.

## 21. Final implementation checklist

- [ ] Observer role; no weapon controls, survival scoring, or alternative outcomes.
- [ ] All 21 chapters in the agreed order, with source moments and coherent transitions.
- [ ] Mandatory Muranowski hero chapter and sustained ŻZW archive continuity.
- [ ] Event-specific ŻOB/ŻZW attribution; no exclusive district assumptions.
- [ ] Civilians, couriers, mutual support, and documentation visible in the story.
- [ ] Faceless low-poly figures, researched architecture, and matched street variants.
- [ ] Guided exploration, stable camera ownership, and usable movement bypass.
- [ ] Semantic UI, complete reading mode, keyboard access, captions, comfort settings.
- [ ] Typed data/claim/source models, deterministic beats, validated state transitions.
- [ ] Chapter streaming, resource disposal, versioned saves, and error recovery.
- [ ] Blender-to-GLB pipeline with verified metadata and animation roundtrip.
- [ ] Asset manifest, quality variants, performance measurements, and mobile soak.
- [ ] Historical claims reviewed, reconstructions marked, rights documented.
- [ ] Archive deep links, person/source records, uncertainty comparisons, correct credits.
- [ ] QA artifacts, known limitations, reproducible build, staging and deployment guide.

**The intended result:** a coherent, carefully sourced encounter with the organization, people, and meaning of resistance—a cinematic educational experience whose technical and artistic polish serve the history.
