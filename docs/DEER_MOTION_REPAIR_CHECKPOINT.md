# Deer motion repair checkpoint — 29 October 2026

The current result is an inspected **foreleg motion study**, not the completed
playful/running deer. The approved forest and original deer remain the normal
prototype. Production and protected application/data/model resources were not
changed. Final owl flight remains separately unapproved and disabled.

## What changed

The rejected Higgsfield take's hard cuts at 35–36 and 62–63 are not reused. A new
local Wan VACE study generates the farther foreleg at its native320×480 crop,
registered at(224,832) in the1024×1536 original. The head, body, antlers and other
supports retain original pixels outside the feathered moving region. No
photographic bone bending, squeezing or mesh deformation is used.

The larger-model study completed49 positions at24 fps in1641.9 seconds. Native
inspection found an attached limb and coherent cloven hoof, but rapid descent
around15–17 and an appearance pop at48–49. RIFE4.25 supplies48 actual synthesized
midpoints. The resulting97-position lowering study plays at24 fps over4.04 seconds.
Source holds and nearly static reconstructed positions are not counted as
distinct anatomical poses. Lifting is explicitly a reverse-playback study; the
viewer evaluates193 timeline positions over8 seconds for lift plus lower.

The stationary end uses a smooth appearance handoff at positions81–97. Its final
RGBA patch and the browser's final full canvas exactly match the approved original.
The moving descent is not repaired with image crossfades.

## Matte quality checks and corrections

The first matte retained green remnants behind the raised leg. The second removed
them but also cut holes into reflective hoof highlights. Both are rejected and
preserved. Neither was activated in the normal forest.

A small MobileSAM segmentation pass identifies hoof coverage, preserving opaque
highlights inside its silhouette while the key removes the backdrop. Its masks
modify transparency only; tracked prompts do not warp the source image. The97-mask
pass took9.86 seconds and peaked at376,691,200 GPU bytes. All97 final transparent
patches were inspected at native size against a light background. Dark-background,
whole-character, Day/Night forest and mobile screenshots were also inspected.

There are still fine fur and terrain texture variations inside the generated
region. Full-body playful/running choreography, coordinated head/body motion and
shipping asset optimization are unfinished. This is not a final animation approval.

## Reproducible sources and provenance

| Item | Location / identity |
| --- | --- |
| Local full-character / forest viewer | `frontend/deer-motion-review.html` |
| Native inspection viewer | `frontend/deer-local-studies.html` |
| Neural in-between preparation | `frontend/tools/deer_study/interpolate_native_motion.py` |
| Hoof coverage preparation | `frontend/tools/deer_study/segment_hoof_coverage.py` |
| Transparent patch / rest handoff preparation | `frontend/tools/deer_study/prepare_motion_review.py` |
| Generated source | ignored `frontend/evidence/deer-frame-study/vace-leg/vace14-leg-02-pinned` |
| In-betweens | ignored `vace-leg/rife14-full-01` |
| Coverage masks | ignored `vace-leg/hoof-seg-all-02` |
| Current transparent study | ignored `vace-leg/deer14-matte-03` |
| Actual final browser evidence | ignored `frontend/evidence/deer-frame-study/motion-review-final` |

The isolated runtime/cache remains outside Git under
`C:/Users/thalt/StethoFuseDeployment/tools/DeerMotionLab`. Reproduction uses the
preserved local source crops, keys and lab described in
`DEER_LOCAL_GENERATION_STUDY.md`; this is not a claim that a clean Git checkout
contains the large model caches or ignored research outputs.

- Wan VACE14B revision: `db79b90c60bbb45ceec9e41b9d5a4df934538ac4`.
- RIFE source revision: `bbfd2ea90910789a860ea3e2b32a240cd577b75e`;
  checkpointSHA `6615790efd627772917205db291f51cd392528a157ecbb2ecaeec3bff8eb6de2`.
  Official [Practical-RIFE](https://github.com/hzwer/Practical-RIFE), MIT.
- MobileSAM revision: `f706ad9c4eb7f219c00d9050e46328518ffb65d2`;
  checkpointSHA `6dbb90523a35330fedd7f1d3dfc66f995213d81b29a5ca8108dbcdd4e37d6c2f`.
  Official [MobileSAM](https://github.com/ChaoningZhang/MobileSAM), Apache2.0.
  Installed only in the lab, with`timm0.9.16`; existing Torch/ROCm was not replaced.
- Final lowering-crop MP4SHA:
  `fd1d4daa159ef8857d04378959ba662cd77d9eb347dfb1674169ec3ee9dd5d6a`.
- Approved runtime deerSHA remains
  `76d545e864c02b419e4430b0b2ef8a312c8dff888e5c0bf0ee8e475caad11567`.

Every generation, intermediate source and rejected derivative remains preserved.
No additional Higgsfield or paid generation was invoked.

## Actual browser verification

The current viewer is separate from the normal application entry. It attaches a
canvas only inside its own same-origin local iframe and preserves the existing
deer figure's position, dimensions and ground anchor. Day and Night share the
same measured placement. A mount/lazy-image race was fixed; switching back from
character inspection also returns the forest viewport to the deer.

Fresh Chromium evidence reports:

- All97 saved positions appeared in the full lift/lower traversal; no cache misses.
- Twelve decoded patches maximum, four concurrent image requests maximum.
- Exact final canvas equality with the original, including alpha.
- Reduced-motion change stops playback and returns the original still.
- No horizontal overflow at360,390 or768px; no page errors.
- Actual browser recording saved as WebM and MP4. Recording is25 fps; study
  selection is elapsed-time-driven24 fps. Those rates are different measurements.

Native patch cache is about7.4 MB of decoded pixels at its twelve-image cap,
plus the original image, canvases and browser overhead. The97 lossless WebP patches
total21,218,934 bytes. This is a laboratory asset budget and is **not qualified
for shipping**. There is no autoplay, and hidden pages pause.

Focused browser/source checks and Python lint/compilation validate the tools;
they do not establish owner visual approval. The application source/public paths
have no diff against the preserved starting commit. An application rebuild was
not needed for these separate diagnostic entry pages.

## Review and continuation

- Local study: `http://127.0.0.1:4192/deer-motion-review.html`.
- Native frames: `http://127.0.0.1:4192/deer-local-studies.html`.
- Normal forest: `http://127.0.0.1:4192/forest-review.html`.
- Recording: `/evidence/deer-frame-study/motion-review-final/actual-browser-playback.mp4`.
- Browser proof: `motion-review-final/browser-proof.json`; source/mask/patch
  receipts and native alpha sheets remain beside their study outputs.

The owner closed earlier Python processes after memory use stayed high during an
interruption. Saved diffusion/frames were complete and survived. This continuation
did not rerun the large model. All segmentation and preparation workers exited;
do not restart a model from stale notes. Before any further heavy run, verify no
other lab worker exists, run only one, supervise memory/time, and release it as
soon as its terminal receipt and files are verified. No service, driver, pagefile
or other host setting was changed.

No push, merge, deployment, production reconciliation, backup, coordinator status
write, Portfolio action or protected data/model access occurred.

**ENCHANTED FOREST PROTOTYPE PARTIALLY COMPLETE — ASSETS OR ANIMATION REQUIRE REVIEW.**
