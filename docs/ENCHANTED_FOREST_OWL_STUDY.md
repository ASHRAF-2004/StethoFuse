# Owl flight gate: research, storyboard and limits

Status: **KINEMATIC STUDY ONLY. FINAL FLIGHT UNAPPROVED AND DISABLED IN THE SCENE.**

The approved `owlSurface.ts` / `owlCanvasSurface.ts`, neck field, body and eye
material remain unchanged. A prototype adapter uses that same surface for page-wide
gaze. Its immediate output is copied into a persistent display canvas so the CSS
iris filter cannot expose an empty discarded WebGL drawing buffer while at rest.
This is a display integration correction, not new owl artwork or a new neck rig.

## Sources actually consulted

- [Cornell Lab, Snowy Owl identification](https://www.allaboutbirds.org/guide/snowy_owl/id):
  broad wings, dense leg feathering, rounded head and barred white plumage. The real
  species has yellow eyes; the approved StethoFuse character deliberately retains
  its established green-eye brand material.
- [Cheney et al., 2020, Bird wings act as a suspension system that rejects gusts](https://pmc.ncbi.nlm.nih.gov/articles/PMC7661293/):
  shoulder response and comparatively stabilized head/torso. This is barn-owl
  gliding research; it does not establish snowy-owl flapping or landing timings.
- [Authors' high-speed supplementary Movie S1](https://rs.figshare.com/articles/media/13072385),
  CC BY 4.0, author list in the article above. Official metadata API was used after
  the normal Figshare page returned HTTP403. The actual 8.083-second, 1920×1080,
  24 fps movie was downloaded to ignored research evidence, sampled and visually
  inspected. Its 4-frame contact sheet shows shoulder elevation/wing deformation
  with a comparatively stable face. No research footage is in public assets or
  product code.
- [Cheney et al., Raptor wing morphing with flight speed](https://rvc-repository.worktribe.com/output/1548613/raptor-wing-morphing-with-flight-speed):
  coordinated wing and tail shape; authored compensation is informed by this,
  not a validated reconstruction of those measured birds.

No owner-supplied full flight/landing reference video was attached. The prior
generated atlases exist, but their inconsistent whole-body crossfades remain rejected.

## Storyboard

| Frames, 24 fps | Choreography | Evaluated channels | Quality status |
| --- | --- | --- | --- |
| 0–45 | Low approach, broad downstroke/upstroke cycles | Shoulder rotation, delayed elbow/wrist, broad primary fan; small torso oscillation with stabilized head | Anatomy blockout only |
| 46–61 | Decelerate and raise body | Eased trajectory, wings enter braking attitude, tail fan grows | Authored hypothesis, not measured timing |
| 62–71 | Extend legs and reach perch | Leg extension, feet advance toward fixed y435 plane | Contact constraint demonstrated |
| 72–83 | Claws contact, wings begin folding | Both feet pinned; elbow/wrist fold; body compresses slightly | Numerical pin verified; final art absent |
| 84–95 | Damped settle | Fixed feet, declining body displacement, compacting wing contour | Actual idle-art handoff NOT validated |

## Implementation and evidence

`src/forest-prototype/motion-study.tsx` contains one deterministic pose evaluator
and Canvas2D anatomical blockout renderer. There are **96 distinct evaluated
channel poses at 24 fps**, covering 4 seconds. RAF selects `floor(elapsed * 24)`;
display refresh does not change choreography speed. Pausing/scrubbing is explicit.
This is a small rig evaluation, not 96 independently generated photographic frames.

The 96-pose atlas, per-pose JSON, all 96 rendered frame PNGs, a 24 fps encoded
study video and an actual browser-playback screen recording are in ignored
`frontend/evidence/forest-world/final/`. The last 24 poses keep `toeY=435`.
Atlas poses share the same body-relative registration; data retains world x/y.

Playback: `http://127.0.0.1:4192/forest-prototype.html?study=owl`.

## Unresolved gates, explicitly separate from the forest

The blockout's drawn owl is not the approved photographic character. It does not
prove feather identity, final anatomical realism, generated frame consistency,
real claw occlusion around the scene branch, or a jump-free transition into the
existing idle field. No fallback crossfade conceals these gaps. The fold silhouette
and timing need visual review before commissioning/rigging final photographic art.

The scene always starts with the approved perch, including hard refresh and reduced
motion. Final arrival-on-document-load, SPA replay prevention, registered final-art
handoff and photographic frame preloading are therefore **not implemented** in this
prototype. The old rejected arrival hook is never imported or called by the scene.

The deer has a restrained 24 fps strip deformation of torso/head/ear regions,
fixed lower legs/terrain and a small warm antler-light variation. It does not have
a validated independent eyelid animation; that remains a character-art review item.

Owner approval of the environment cannot be treated as approval of flight.
