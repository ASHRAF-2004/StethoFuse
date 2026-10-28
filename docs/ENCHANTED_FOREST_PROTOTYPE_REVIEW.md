> **REJECTED / SUPERSEDED.** The owner rejected this first prototype. Its former
> readiness wording and marker checks do not establish visual acceptance. Read
> [the corrective revision](ENCHANTED_FOREST_REVISION_REVIEW.md) for the current state.

# Enchanted forest prototype review

**ENCHANTED FOREST PROTOTYPE PARTIALLY COMPLETE — ASSETS OR ANIMATION REQUIRE REVIEW**

The layered environment is implemented for owner composition review. The approved
perched owl remains. Final photographic flight and its actual idle handoff are
unapproved and are not mounted in the forest. No owner visual acceptance is claimed.

## Open the actual scrollable prototypes

- Review hub / independent artwork / recordings: <http://127.0.0.1:4192/forest-review.html>
- Night: <http://127.0.0.1:4192/forest-prototype.html?theme=night>
- Day: <http://127.0.0.1:4192/forest-prototype.html?theme=day>
- Separate motion study: <http://127.0.0.1:4192/forest-prototype.html?study=owl>

Run from `frontend` if the local server is no longer running:
`node node_modules/vite/bin/vite.js --config forest-prototype.vite.config.ts`.
This binds only `127.0.0.1:4192`, has no API proxy, and does not mount the application
auth provider. Existing `/login`, `/register`, privacy and help URLs are retained;
no real authentication or private account flow was executed for this prototype.

## Diagnosis and changed approach

[The pre-implementation postmortem](ENCHANTED_FOREST_DESIGN_POSTMORTEM.md) compares
the supplied images directly, identifies all seven failures, and records the world
map, asset plan, anchoring model and visual gates. The rejected page had a hero-only
tree, separate opaque section backgrounds, a floating deer and schematic roots.

The new prototype puts the distant valley under the entire content flow. Transparent
semantic sections no longer replace the environment. A dedicated crown/branch,
registered bark extension and root crown span the page. Deer terrain overlaps a
foreground bank; the footer shows grass, thin organic soil, brown earth, stones
and thick/fine embedded roots. All text, cards, links, menu, FAQ and theme controls
remain real HTML. Reference screenshots are not runtime backgrounds or UI atlases.

Filename discrepancy is preserved in provenance: the supplied `Forest-night.png`
shows daylight and `Forest-morning.png` shows moonlight. Theme names follow visible
lighting, not those inverted filenames.

## Reusable art inventory

| Asset | Native source | Use |
| --- | --- | --- |
| valley-day | 1024×1536 RGB | Continuous distant morning river/mountain/forest plate |
| valley-night | 1024×1536 RGB | Same-camera edited moonlit plate |
| tree-crown | 1254×1254 RGBA | Connected canopy, trunk and actual perch branch |
| tree-trunk | 724×2172 RGBA | Variable-height matching bark/moss extension |
| earth-roots | 2172×724 RGBA | Grass/topsoil/earth/root-crown footer |
| deer-clearing | 1024×1536 RGBA | Deer, native contact shadows, moss and occluding grass |
| clearing-bank | 2164×727 RGBA | Ground joins the deer island to the right-hand tree |

Unchanged source PNGs: `frontend/assets/forest-world/source/`. Production briefs,
provenance, alpha/quality observations and source hashes:
`frontend/assets/forest-world/README.md` and `manifest.json`.
Runtime assets: `frontend/public/assets/forest-world/`, WebP quality89 plus two
640px valley derivatives. Seven primary runtime assets total 4,418,972 bytes.
Source PNGs total 20,826,072 bytes. No artificial upscaling or reference UI cutouts.

Both themes use the exact same tree, branch, deer and root geometry. Night valley
is an edit of the day plate. Four bounded landscape edge-correlation checks found
zero-pixel shifts at sampled castle/waterfall/rock landmarks; fine generated foliage
is not claimed pixel-identical. Full layout anchor metrics also remain unchanged
when switching themes. Foreground lighting is adjusted separately from the sky and
atmosphere; day is not a brightness filter over the night background.

Quality remains an owner review: wide-view distant art is softer than native-size
foreground detail, the variable-height bark uses repeated/overlapped texture, and
the deer/terrain lighting and joints must be judged in the actual browser.

## Owl and deer motion

[Owl research, storyboard and limits](ENCHANTED_FOREST_OWL_STUDY.md) documents the
actual consulted primary sources and inspected CC BY supplementary video. No
reference footage is in product assets. The old whole-bird atlas arrival is excluded.

- Existing approved connected-neck renderer, head/body art and green-eye material
  are unchanged. The prototype adapter keeps page-wide gaze. Browser evidence
  records yaw moving from −18.816° to +15.041°, with real nonempty surface pixels.
- A WebGL/CSS-filter integration issue initially hid the owl at rest. Immediate
  output copying to a persistent display canvas fixes it while retaining the
  unchanged approved renderer. The static poster remains until the first good draw.
- Separate blockout: **96 distinct evaluated anatomical channel poses, 24 fps,
  4 seconds**, elapsed-time RAF selection. Shoulder/elbow/wrist, feather fan,
  braking, tail, leg reach, pinned contact, fold and settle are evaluated.
- All 96 actual rendered study frames and the 96-pose atlas are retained. Encoded
  study video is exactly 24/1 fps, 96 frames, 4.000 seconds. Actual browser playback
  is also screen-recorded. Contact plane is fixed at y435 from frame72 onward.
- **Final flight artwork is not delivered or approved.** The blockout is visibly
  not the approved photographic owl. Real feather consistency, true branch-claw
  occlusion and a jump-free transition into the actual idle field are unvalidated.
  Arrival-on-refresh / SPA-once playback and final sequence streaming are therefore
  not implemented in the scene. A counter or successful video encoding cannot
  clear this visual gate.
- Deer uses subtle 24 fps torso/head/ear-region deformation with fixed lower legs
  and terrain, plus restrained antler-light variation. There is no whole-animal
  bounce or slide. Independent blink artwork is not yet validated.
- Reduced motion keeps a static approved perch and deer; touch/reduced motion
  disables cursor dust and avoids loading the owl's head library.

## Responsive scene engineering

The giant tree is the master coordinate system. Crown and owl are one scaled
group. Source-normalized perch `(0.54, 0.562)` and approved claw point
`(0.445, 0.925)` define contact. Bark and footer root crown share one scene x-axis.
All connected tree parts have no independent scroll parallax. The page height
comes from content, not a flattened poster or fixed screenshot dimensions.

Desktop content reserves the trunk and deer clearing. Tablet moves the entire
tree axis toward the right edge; mobile supplies a separate perch row and later
deer clearing. The same source geometry and soil/root x-axis follow those crops.
Day/night layout sizes and positions match exactly in the tested theme switch.

`tools/review_forest_world.mjs` produced:

- 16 exact viewport cases: Day/Night at 360, 390, 768, 1024, 1280, 1440, 1920, 2560px.
- 96 real Chromium browser-zoom cases: 67%, 80%, 100%, 125%, 150%, 200%, both themes,
  at the eight requested native window targets. `chrome://settings/appearance`
  changes actual Page zoom; devicePixelRatio changes and pinch scale remains1.
  Chromium enforces a 500px minimum native window for the smallest targets, so
  actual observed CSS widths, not requested window labels, are recorded. Exact
  360/390px mobile layouts are independently covered by the viewport cases.
- No horizontal overflow, branch/claw separation, trunk/root-axis separation,
  content/character rectangle overlaps above the test threshold, or opaque section
  backgrounds. No page errors or external/auth/API requests. FAQ and mobile menu
  work; reduced-motion checks pass. These numeric checks do not certify appearance.
- Actual 67% full-page capture had Chromium CSS-sized capture padding. Raw PNG is
  retained; the evidence image crops only empty right/bottom capture padding to
  the actual raster bounds. No artwork is resized, painted or synthesized.

## Performance and accessibility findings

Local development measurement, warm local server and fresh isolated browser cache:
LCP592ms, CLS0.000095. This is not a production network/Core Web Vitals certification.
Initial image/font resource bodies were about4.16MB. The 18-view approved head
library is not requested before pointer use, or on the tested touch/reduced-motion
path. Its decoded head textures alone are75,362,400 bytes; meshes/body/flow buffers
add more. Mobile keeps the static source fallback. No enormous flight atlas loads.

Cursor dust is one bounded canvas, time-based integration, max44 particles at night
and20 by day. Test pointer movement observed18, with no pointer interception. Deer
draws only near the viewport and caps authored updates at24fps; hidden/unmounted
animations cancel. Static fallback remains until its first actual painted frame.

Semantic landmarks/headings, selectable text, real links, menu button state, native
details/summary, keyboard skip link and focus outlines remain. Decorative artwork
is aria-hidden and pointer-transparent. Coarse-pointer controls and footer links
have44px hit targets. Reduced-transparency and forced-colour fallbacks are supplied.
No full assistive-technology or physical-device certification is claimed.

## Visual evidence

All below are under `frontend/evidence/forest-world/final/` and linked in the hub:

- `night-1440.png`, `day-1440.png`, `night-1920.png`, `day-1920.png`.
- `night-390.png`, `day-390.png`, plus all other requested viewport captures.
- `night-actual-browser-zoom-67.png` and retained `…-raw.png`.
- `soil-roots-footer.png`, `owl-branch-contact.png`, `deer-terrain-contact.png`.
- `pose-atlas.png`, `pose-registration.json`, `authored-study-frames/`.
- `owl-motion-study-24fps.mp4`, `owl-study-screen-recording.mp4`.
- `responsive-results.json`, `interactive-results.json`,
  `performance-accessibility.json`, `day-night-registration.json`.

Full pages, source assets and contact close-ups were directly inspected. The
continuous environment is the composition submitted for review; it is not claimed
to be owner-accepted or an exact reproduction of the reference artwork.

## Project checkpoint and safety

Local branch `feature/forest-world-prototype`, based on
`e848bb17f9fb1141990bf8079dad635684f0620f`. Owner Git/GitHub identity was verified as
ASHRAF-2004. Existing branches/PRs preserved, no main merge, no push or deployment.
Local commit hash and final worktree status are returned with the handoff.

Changes are new isolated prototype entry/config/review hub, scoped scene and motion
study files, seven artwork sources/derivatives/manifests, two preparation/review
tools, design/review documentation and a PAUSE_NOTES pointer. Existing public/auth
pages, styles, Frost Studio, original owl assets/renderers, roles/grants, protected
media, backend/model/T9 code and deployment scripts remain unchanged.

Prototype TypeScript/build and focused browser checks pass as recorded. A Windows
Vite watcher crash on a locked temporary Chromium cookie file was fixed by excluding
evidence/output from this isolated config's watcher. No package/skill reinstallation.

**Production, Firebase, database, frozen T8 v2 model, T9 evidence, ML worker, Axora,
shared host, backup policy and existing production rollback artifacts were untouched.**
No coordinator message or owner-release command was needed for this local task.

Stop here for owner composition and independent animation review. No current design
replacement is authorized until the owner explicitly approves both visual gates.
