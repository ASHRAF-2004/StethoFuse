> **29 October owner decision:** composition and deer artwork approved, with four
> requested refinements. Read [the current follow-up](ENCHANTED_FOREST_APPROVED_FOLLOWUP.md).
> The independent final owl-flight gate remains open.

# Corrective forest prototype — 28 October 2026

**ENCHANTED FOREST PROTOTYPE PARTIALLY COMPLETE — ASSETS OR ANIMATION REQUIRE REVIEW**

The first local prototype is rejected and superseded. This revision corrects its
composition; it does not certify final visual acceptance. Production is untouched.
The exact existing photographic owl and approved gaze renderer remain in use.
Final flight is unapproved, disabled and a separate outstanding quality gate.

## Open the actual implementation

- [Night](http://127.0.0.1:4192/forest-prototype.html?theme=night)
- [Day](http://127.0.0.1:4192/forest-prototype.html?theme=day)
- [Evidence and artwork hub](http://127.0.0.1:4192/forest-review.html)
- [Actual interaction recording](http://127.0.0.1:4192/evidence/forest-revision/final/forest-interactions.mp4)

These are loopback-only local pages. The built version was independently opened
at port 4193. Neither server proxies the API or changes the production entry point.
The recording demonstrates gaze, scrolling, deer terrain, FAQ and lighting controls;
it is **not an owl flight video**.

## Visual diagnosis and correction

| Rejected defect | Revision | Evidence in `frontend/evidence/forest-revision/final` |
| --- | --- | --- |
| Claws float above the branch. Synthetic markers masked the problem. | Register the toe bases at 90.2% of owl height against the branch at 54% / 57% of its source square. The same branch pixels form a foreground moss occluder. Inspect the actual painted contact, including the active renderer. | `owl-branch-contact.png`, `night-interactive-hero.png` |
| Empty strip to the right of the tree. | Crown bleeds beyond the screen. Trunk and root crown share the same axis; the right edge samples an opaque part of the trunk rather than alpha outside it. | Full-page images at all eight widths; `night-actual-browser-zoom-67.png` |
| Soil/root footer stretches and looks like a separate strip. | Root crown retains native 2172:724 proportions. SVG texture windows extend real soil and the ground surface independently. The soil window starts below the grass, preventing the erroneous second grass band. Top/left masks blend the root join. | `soil-roots-footer.png`, full Day/Night pages |
| Mobile is a squeezed desktop with fixed empty gaps. | A content-measured perch row serves widths through 900 CSS pixels. Narrow desktop paragraphs stop left of the branch. The tree remains at the edge and the deer has a reserved clearing below the privacy card. | `day-360.png`, `night-390.png`, `day-768.png`, zoom matrix |
| Branch crosses tablet supporting copy. | The visual pass rejected that intermediate result. The final tablet arrangement separates the perch and copy; a painted-alpha check supplements geometry tests. | `tablet-hero-day.png`, responsive results |
| Logo is cut off. | Extract all seven original mark contours into a padded standalone SVG. Render its whole intrinsic box; remove the CSS crop of the full wordmark. Original logo is preserved. | `standalone-logo.png`, `owl-mark.svg` |
| Forest feels static. | Existing page-wide owl gaze, small planted deer motion, antler light, bounded fireflies/dust, rolling action labels, modest card response, reveal feedback, working FAQ, menu and lighting controls. | `forest-interactions.mp4`, `interaction-results.json` |

The visible daytime reference teaches atmospheric depth and calm text space;
the visible nighttime reference teaches moonlit evergreen masses and restrained
warm light. Both retain the continuous tree and conclude in actual soil.
The reference filenames are reversed relative to their visible lighting; the
existing postmortem records that explicitly. No reference screenshot is a runtime
background and no UI text or buttons are cut out of one.

## Artwork and shared coordinates

Seven existing independent raster sources remain unchanged: Day valley, registered
Night edit, crown/branch, trunk extension, deer/terrain island, clearing bank and
soil/root crown. Original PNGs, prompts and hashes remain in
`frontend/assets/forest-world`. Optimized WebP artwork totals approximately 4.42 MB.
The additional vector mark is derived locally, reproducible with
`frontend/tools/extract_forest_mark.py`; it does not change the owl identity.

`Tree` and `Earth` in the prototype are reusable SVG/HTML composition components.
Desktop tree axis is `width − 0.10 × crown size`; smaller tablet/mobile axis is
`width + 0.045 × crown size`, deliberately cropping the trunk at the edge. Crown,
owl, moss occlusion, trunk and roots all use that axis. No connected element gets
independent parallax. One distant landscape and one reading atmosphere span the
entire content flow; semantic sections have transparent backgrounds.

The owl's width is 35.5% of the crown, with no aspect distortion. Soil grain is a
native image window rather than a stretched photograph. Root width derives from
the tree size; its natural height is retained and excess depth is cropped by the
scene. The deer artwork includes real grass, stones, hoof contact and shadow; its
terrain and lower legs stay fixed while a small upper-body deformation runs.

## Animation status

No new final owl flight frames are accepted in this revision. The earlier drawn
96-pose / 24 fps blockout remains archived as a technical study, removed from the
main review hub. It is not the real owl and has not replaced it. There is no claim
of a validated final landing sequence or flight-to-idle transition.

Final flight still needs the exact owl identity, consistent articulated wings,
registered landing/folding poses, at least 24 genuinely distinct evaluated poses
per second and a visually seamless handoff. Until that is produced and explicitly
approved, arrival stays disabled. Existing perched gaze is active on a fine pointer.
Reduced motion and touch retain the approved poster without the flight or dust.

The interaction recording is ordinary browser capture at 25 fps, not authored
flight evidence. Deer motion is restrained torso/head deformation with fixed
hooves; an independently authored blink layer is not yet validated.

## Verification and limits

- TypeScript, the isolated Vite production build and the normal application build pass.
- 16 exact viewport cases: Day/Night at 360, 390, 768, 1024, 1280, 1440, 1920,
  2560 px. All requested viewport cases have full-page captures.
- 96 real Chromium browser-zoom cases: each requested window width, both themes,
  at 67%, 80%, 100%, 125%, 150%, 200%. Zoom was changed in Chromium Settings,
  with native window dimensions and DPR proof, not CSS zoom or pinch emulation.
- No horizontal overflow, separated anchors, nonuniform root scaling, substantive
  tree/hero collisions, owl/text or deer/card collisions in the final matrix.
  Painted alpha beneath character centers is sampled separately; the maximum is
  one isolated leaf sample, below the two-sample tolerance. Contact still requires
  the close-up visual check, which was performed.
- Both themes retain identical scene geometry. FAQ, mobile menu, focus on opening,
  Escape/focus return and lighting switch work. Gaze responds through the original
  renderer. Reduced-motion content stays visible. Touch loads zero neck textures.
- No page errors or unexpected external requests in the focused responsive run.
- Native Chromium windows have a 500px minimum in this environment; requested
  360/390 native-window cases therefore use that minimum. The separate exact
  360/390 viewport cases cover those CSS widths. No physical mobile device review
  or production-network performance certification is claimed.
- The 67% screenshot crops only verified empty Chromium capture padding. Raw
  capture and normalization metadata are retained. No painted pixels are repainted.
- Approved renderer/material/poster and original logo hashes match baseline
  `e848bb17f9fb1141990bf8079dad635684f0620f`. The protected frontend tree diff is empty.
  No authentication, Firebase, database, roles/media, model, T9, worker or Axora change.

The scene uses seven web-optimized art pieces, image dimensions to reserve space,
lazy lower artwork, bounded particle canvases and animation cleanup. The approved
desktop head renderer still carries its existing roughly 75 MB decoded texture
cost and initializes only on a fine-pointer interaction. An enormous new flight
atlas is not preloaded. This remains a prototype, not a performance certification.

## Design tools and self-review

[Taste v2](https://github.com/Leonxlnx/taste-skill) was read and its direction,
browser inspector and screenshot critique loop were used from a local reference
cache. No skill/package reinstall or UI-framework migration was needed.
The `place-carries-it` direction (seed 1958353830) supported environmental continuity;
its generic sticky/menu-column blueprint was superseded by the owner's explicit
forest composition. [daisyUI's guide](https://daisyui.com/codex/ui-design-skill/)
informed semantic controls and narrow-screen behavior. The owner's portfolio and
[itsflxkzy](https://www.itsflxkzy.com/) were inspected for purposeful motion and
responsive feedback. Their assets, copy and branding were not copied.

The final built Taste inspection reports 0 FAIL with **explicit documented
allowances**, not an unqualified style approval. The reference explicitly requires
glass, icon workflow cards, accent italics and small contextual labels; these
override the skill's contrary generic bans. Neutral reading masks, warm character
light, surface borders and text shadows likewise serve this supplied art direction.
Its covered-text and empty-screen heuristics misread a transparent full-screen
particle canvas after forcibly enabling pointer events; actual hit tests, source
alpha checks and screenshots were reviewed separately. Raw lint and unfiltered
intermediate findings remain in the evidence folder, rather than being presented
as clean default results.

Remaining inspector warnings: intentional serif italic emphasis and glass;
specialized small control sizes; no final flight video; asymmetric *artwork* inside
equal HTML content gutters; the Day contrast heuristic reads the dark fallback
ground rather than the pale image/scrim behind actual text. Main body is 16px;
Day plain copy uses deeper ink and a stronger continuous mobile reading mist.
All twelve inspector fold/page images were inspected as labeled image sheets,
alongside the full-page captures and contact details. Automated scores do not
establish the owner's visual acceptance.

```text
FINAL REVISION SELF-CRITIQUE
Seen in one second: a snowy owl on its tree above a connected river valley.
Idea: the listening owl's tree becomes the frame of the entire scroll journey.
Live thing: the existing owl follows the visitor; light and environment can be changed.
Layout words: hero=paired / workflow=sequence / purpose=clearing / FAQ=list / footer=cutaway.
Scores: design 7.3 · usability 7.6 · creativity 7.4 · content 8.0 → overall 7.5.
Caps applied: no final animation approval; this is a self-review, not a panel verdict.
Top three remaining issues:
1. Final identity-matched flight is absent. Preserve the approved perch until its own gate passes.
2. Deer blinking is not validated. Do not describe the current subtle deformation as a full character rig.
3. Final taste/real-device acceptance is outstanding. Keep this local and preserve the live design.
```

## Project checkpoint

Branch `feature/forest-world-prototype`; earlier branches and PRs are preserved.
Changed files are the isolated prototype component/style and review hub, derived
mark/extractor, focused capture helper, provenance/readiness documents and pause
notes. No new frontend dependency was added. Prior rejected captures and study
artifacts remain as history, clearly superseded. Local evidence is ignored by Git.

No push, main merge, owner release command, deployment, coordinator status write,
combined backup, protected-data operation or other-application change was performed.
Stop here for the owner's separate composition and final-animation approval gates.
