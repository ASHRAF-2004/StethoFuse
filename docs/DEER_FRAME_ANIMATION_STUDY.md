# Deer frame animation: rejection, research and acceptance plan

29 October 2026. The owner rejected the animated foreleg in screenshot
`Screenshot 2026-10-29 040339.png`. The approved deer illustration and forest
composition remain approved. The old deformation rig is disabled in the local
scene, which now shows the unchanged approved still. Production is untouched.

## Why the previous result failed

The two-segment mesh treated a photographed limb as a bendable strip. It did not
author new surfaces, preserve the cannon's rigid silhouette, represent the
separate distal joints or resolve changing overlap. In the owner's capture the
lower limb becomes a long angular hook, with an implausible transition into the
hoof. Zero support-hoof drift and a small calculated bone-length error did not
validate any of those visible properties. The earlier numerical checks are
historical registration tests, not animation acceptance.

This rebuild uses generated raster poses/frames. No anatomical mesh warp,
scanline squeezing or optical-flow body morph is accepted as final motion.

## Sources inspected

- Peter Green, *The Fore Limb*, British Deer Society, Winter 2021/22,
  [printed pages 38–41](https://bds.org.uk/wp-content/uploads/2025/05/Deer_Winter-2021-22.pdf).
  Extended and flexed carpal diagrams were rendered and inspected. The carpus,
  rigid cannon and fetlock must be understood separately; the forelimb is not
  a human-like upper/lower leg hinged at one invented point.
- [University of Maryland: mammalian locomotion](https://science.umd.edu/classroom/bsci338m/Lectures/Locomotion.html)
  and [Murray State: deer biomechanics](https://campus.murraystate.edu/academic/faculty/tderting/CVA_atlases/mammalian_stances/DeerBiomechanics.html):
  deer have an unguligrade stance; hoof contact and a credible support pattern matter.
- [Wondeerful Farm's adult-deer movement](https://wondeerful.farm/story/do-deer-play),
  specifically its natural-pace embedded clip: 211 frames at 10 fps, 21.1 seconds.
  A frame contact sheet was inspected. It is a timing/weight-shift reference,
  not a product asset or a source of fine detail unavailable at its resolution.
  Reference material remains in ignored evidence, outside runtime assets.

The studies support modest unloading, joint folding, placement and load acceptance.
They do not establish exact timings for this fantasy character. Choreography below
is an authored choice. Alarm walking/stamping research is not presented as proof
that an identical movement is relaxed play.

## Choreography and frame plan

Keep the fixed camera, same illustration identity and original clearing. A small
curious reaction is preferable to an exaggerated paw flourish on this narrow bank.

| Phase | Drawing requirement | Contact check |
| --- | --- | --- |
| Rest | Exact approved reference pose | Four original hoof anchors |
| Attention | Ear/head response; prepare a small weight shift | Hoof positions stay planted |
| Unload | Transfer support before lifting one forefoot | Three credible supporting contacts |
| Flex | Redraw the carpal/cannon/fetlock relationship and natural skin overlap | Hoof lifts cleanly, no bent cannon or dislocated joint |
| Crest | Modest tucked forefoot under the chest | Three planted hooves; no whole-body slide |
| Lower | Controlled unfolding, hoof correctly oriented | Approach the actual moss plane |
| Contact | Hoof settles, local shadow and foliage overlap agree | No penetration, skating or hovering |
| Settle | Return to the approved still | No pose/identity jump |

Working target: about two seconds at 24 fps or better, with genuine distinct
drawn/generated intermediate positions. Eight key poses alone do not satisfy
that target; repeating or crossfading them is not called completed animation.

## Identity and registration contract

Use only the approved original deer as the character reference. Preserve its face,
eye colour, muzzle, ears, antler branching, warm light, neck/chest proportions,
spotted coat, four limbs and cloven hooves. The owner's rejected screenshot is
failure evidence, never a pose-conditioning reference.

Keep a common canvas, camera, scale, ground and stationary-hoof locations. Only
whole-frame rigid registration may correct export placement. No local warp is
allowed to disguise an incorrect limb. Retain original generated outputs, prompts,
dimensions and hashes. Inspect every source at native size, especially limbs and
antler tips, before creating a web derivative.

## Acceptance gate

1. Inspect newly generated anatomical key poses against the approved character.
2. Reject identity drift, extra/missing limbs, broken cannon/fetlock silhouettes,
   inconsistent antlers, hoof/ground errors and unstable grass/terrain.
3. Inspect the full intermediate sequence as individual frames, a contact sheet,
   slow playback and real-time playback. Check contact, release and still handoff.
4. Verify real cadence/frame count, memory, reduced motion and offscreen cleanup.
5. Keep candidates in a separate study view until visual checks pass. The forest
   retains the approved still during the study. No deployment is part of this task.

## Production log

Image-generation mode: built-in tool, using the imagegen skill. No paid image API
fallback is authorized or used. Generation prompts and results follow as produced.

### Generated drawings, inspected before integration

Five raster sources were produced with the approved original as the identity
reference: two 1024×1536 key-pose images and three 1448×1086 atlases. Each atlas
contains eight native 362×543 source cells. There are **24 raw source drawings**,
not a claim of 24 accepted animation frames. Exact crops, full prompts, source
dimensions and SHA-256 values are retained in
`frontend/assets/forest-world/animation/deer-frame-study`.

- The lift key has a more plausible flexed limb silhouette than the rejected rig.
  It is still a regenerated drawing, not a verified identity-matched final frame.
- Atlas A jumps from near-rest to a raised pose too quickly.
- Atlas B provides lowering studies, but the character and clearing drift.
- Atlas C reverses the lowering at its boundary, then introduces an enlarged
  reaching hoof. Its contact/rest does not match the approved idle stance.
- The lower key explores a shorter reach but has opaque background/glow
  contamination. It fails the transparent asset gate and is not runtime artwork.

The frame viewer allows 24/6/1 fps inspection and manual stepping, with original
support anchors. There is no optical flow, anatomy warp or interpolation in that
viewer. A raw 24-frame MP4 is exactly one second at 24 fps; that is a diagnostic
playback, **not completed motion**. Full-size sources, alpha compositing, individual
faults and a browser capture were inspected directly.

Whole-frame similarity fitting was used only to measure drift, never to alter
anatomy. Estimated upper-body scale varies from 0.9761 to 1.0569. After that fit,
upper-body RGB mean absolute error remains approximately 19.0–25.7/255. These
numbers flag registration/texture instability; they cannot prove anatomical quality.
Accepted frames: **zero** from this first raw batch.

### One explicitly authorized continuity-generation test

The owner selected **“Use the one free run”**. Higgsfield's cost preflight returned
zero credits for one `hf_mult_motion_control` output at 720p. Exactly one job was
submitted: `797daa7b-3f49-4f00-bac0-24062ec99758`. No paid fallback is authorized.

The character reference is the unchanged approved deer, composited over a plain
forest-green matte. The driving guide uses the new generated poses with deliberate
holds and the original still. It is **a control guide**, not a finished 24 fps
animation. No copyrighted reference video or veterinary diagram was uploaded.
The generator is asked to create continuous anatomical in-betweens while retaining
face, antlers, coat, ground and three fixed support contacts. Those requests remain
acceptance criteria, not assumed capabilities. The guide itself contains imperfect
generated artwork, so the output must be inspected rather than trusted.

Input files, hashes, media identifiers, prompt, zero-cost choice and job identity
are recorded in ignored local evidence under
`frontend/evidence/deer-frame-study/continuity-test`. The completed output verdict
is **REJECTED**.

### Completed video: adjacent-frame failure, not an accepted animation

The output is 834×1112, 4.041667 seconds, 97 decoded frames at 24/1 fps,
4,710,095 bytes. SHA-256:
`3f5e3ba36c5316ac930ff827e86689bbbd3685c55ce3579efd86843d9f088021`.
All PNG frame hashes differ, but that does not mean there are 97 distinct,
continuous anatomical poses. Texture/glow changes also change a frame hash.

The owner identified the hard transition at **35→36** before my adjacent-frame
inspection caught it. A coarse full-character contact sheet and selected native
poses were insufficient. This is a quality-review failure, not owner taste.

At 35→36 the raised limb changes position and overlap abruptly. At **62→63**
the bent pose jumps to a near-planted leg. Native leg crops were subsequently
inspected across the whole sequence, including those boundaries. Other smaller
step changes occur around 16→17, 27→28 and within the middle held-pose region.
The input guide contained discrete poses and deliberate holds; this test did not
turn them into the requested continuous anatomical movement. Another sparse
held-pose guide is not a qualified basis for the next attempt.

The camera/clearing also changes scale. A lower-scene similarity fit estimates
0.9979–1.0840 relative scale and up to 51.85 native pixels of displacement at
sampled ground locations. A diagnostic derivative applies **one whole-frame**
translation/rotation/uniform-scale transform per frame. No local anatomy warp is
performed. Both hard pose jumps remain after that stabilization.

Across all 96 adjacent pairs, stabilized leg-region RGB MAE peaks at 33.57/255
for 62→63 and 28.33/255 for 35→36. Approximately 64.4% and 54.7% of those region
pixels respectively change by more than 24 in at least one channel. These are
appearance-discontinuity diagnostics, not a biological quality score. Frame rate,
unique hashes and stabilization cannot repair the missing valid in-betweens.

The unmodified generated video, source guide and explicit rejection metadata are
preserved beside the source atlases. The local viewer offers exact frame selection,
quarter-speed playback and a separate stabilization comparison. It is a failure
inspection page, **not a request to approve defective motion**. The take has no
alpha channel, no verified still handoff and no permission to activate in the forest.
Exactly one authorized free generation was used. No paid generation, repeat free
submission or activation occurred.

### Revised gate before any further character animation is proposed

Review every adjacent pair at native limb detail, including all pose/atlas/clip
boundaries; inspect normal and slow playback; check the same limb's depth and
occlusion, constant anatomy, support contact and start/end handoff. A continuous
anatomical motion reference must exist before another motion-transfer attempt.
Reject a take at the first hard pose jump. Numeric alerts prioritize inspection;
they never override a visible defect. The requested final deer animation remains
**incomplete and unapproved**; the approved still remains active.

A separate replacement **joint/timing blockout** now evaluates fixed-length links
and continuous joint angles instead of jumping between held character images.
It includes carpal/cannon/pastern relationships and draws the lifted far limb
behind the near support. This is a technical diagram, not the approved deer.
It has 97 samples at 24 fps, 66 distinct joint configurations (rest/crest holds
are deliberate), no photographic deformation, and no jump at the old boundary.
It is not an anatomical certification or completed character animation. No new
generation has used it. Source and diagnostic reproduction instructions are in
`frontend/tools/deer_study/README.md`; outputs remain in ignored local evidence.

### Local runtime verification

The forest component now contains only the original approved image. Browser
inspection confirms visible opacity 1, no deer canvas and no deer play control.
The research viewer plays/pauses, seeks to flagged frames and disables playback
when reduced motion is enabled. No page errors occurred. TypeScript and the
isolated forest build pass. Desktop and 390px checks have no page errors or
horizontal overflow. The generated-video viewer seeks to frames 35, 36, 62 and
63 correctly and exposes the failed stabilization derivative separately. These
checks establish behavior, not visual approval. The original deer source PNG and
runtime WebP are byte-identical to commit `5868c85`; the owl and protected app
paths have no changes. No production operation, push or merge occurred.

### Checkpoint and evidence

- Branch: `feature/forest-world-prototype`. Git/GitHub identity verified as
  `ASHRAF-2004`; existing branches and PRs preserved.
- Changed runtime code: only the prototype's `ForestDeer.tsx`, returning to the
  original still. The rejected rig and its numerical checker are clearly marked
  historical. No authenticated application behavior changed.
- Added: source drawings/prompts/manifest, rejected generated take and provenance,
  a local frame viewer, reproducible research diagnostics and this study record.
- Browser evidence: `frontend/evidence/deer-frame-study`, including the still,
  mobile Day/Night, research viewer, exact generated-frame seeks, native limb
  sheets, all 96 adjacent differences and the failed stabilization experiment.
- Local viewer: `http://127.0.0.1:4192/deer-frame-study.html`. It is explicitly
  marked rejected research. Forest: `/forest-prototype.html?theme=day` or `night`.
- TypeScript, isolated forest build, focused browser checks and `git diff --check`
  pass. They do not establish visual acceptance. Protected images remain unchanged.

**ENCHANTED FOREST PROTOTYPE PARTIALLY COMPLETE — ASSETS OR ANIMATION REQUIRE REVIEW.**
The forest composition is preserved. Deer motion and final owl flight remain
unapproved. This checkpoint must not trigger deployment or another generation.
