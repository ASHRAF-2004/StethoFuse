# Generated deer idle candidate — 30 October 2026

The owner rejected the previous deer animation, including its broken-looking leg
and the hard transition at positions 35–36. That study is historical, not the
selected runtime. The supplied two animation boards are **direction only**: no
subjects were cropped from them, uploaded to a generator or shipped in the page.
The approved original deer image was the actual generation reference.

This checkpoint is a **limited idle candidate**, not completed play/running and
not owner-approved motion. It changes only the dedicated forest prototype. The
current application landing page, authentication, owl identity/renderer and the
approved scene layout remain intact. The owner requested an online test; a static
public review copy is appropriate before replacing the main page.

## Free-generation study

- Connected Higgsfield balance and video free runs were zero. No paid fallback,
  subscription, account creation or additional Higgsfield generation was used.
- The public official [Lightricks LTX-2.5 demo](https://huggingface.co/spaces/Lightricks/LTX-2.5)
  produced a 640×960, 97-position, 24 fps clip. It walked forward and changed body
  orientation, so it is rejected as an idle loop. Original video SHA-256:
  `a968bc62726579c593ea4f39f8f37f3f1ae0469150c2e23263fbc8d8f2526de7`.
- A more constrained second LTX request was denied by the free ZeroGPU allowance
  before generation (178 seconds requested, 58 remaining). No replay or paid
  endpoint was attempted.
- The official [ZeroGPU Wan2.2 accelerated demo](https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster),
  revision `1ff7432a88d7827eb787ef10c15cbc5c85c841a2`, fit the remaining allowance.
  It produced 65 positions at **native 16 fps**, 560×832, from one submitted request.
  Source SHA-256:
  `b4cbff977546f528aee16592e946e840806277a1b0c84274888bbfe9123fb254`.
  The full source is preserved under `frontend/assets/forest-world/animation/deer-cloud/`.

The Wan take keeps the animal planted early, but later antlers change appearance.
The complete take is therefore not qualified. Only source positions 1–25 are used
for a narrow attention/idle test. That limitation is deliberate and disclosed;
there is no claim that either free service solved full-body locomotion.

## Candidate construction and inspection

RIFE 4.25 evaluates 49 forward poses from the 25 selected source positions, using
cosine-eased source time. The return reverses those poses. There are **97 timeline
positions at 24 fps**, approximately 4.04 seconds, **not 97 unique authored poses**.
The movement is generated head, ear, neck and upper-chest motion. No photographic
limb mesh, bone squeezing or whole-animal sliding is used.

The approved lower body and moss base remain fixed. A premultiplied blend between
60% and 68% of height joins the moving upper body to that original. The original
is registered directly to the final 560×840 display coordinates: its lower opaque
RGB pixels and all lower alpha pixels match exactly before lossy video encoding.
Generated 560×832 motion is centered with four pixels of upper/lower padding.

Matte candidates 01–04 were rejected for antler halos, translucent eyes/muzzle,
or green ground spill. Candidate 05 corrected the matte; candidate 06 also removes
the small ground-registration change caused by padding the original lower body.
All are preserved in ignored local evidence rather than overwritten.

All 49 forward head/body poses were inspected on light and dark backgrounds.
Actual browser captures include 35→36, the 49→48 reversal and the final→first
boundary. Those are continuous neighboring poses, not the old hard pose cut.
The equal loop endpoints and zero-velocity reversal are necessary checks, not
proof of visual approval. Fine antler edges, reversed attention motion and overall
naturalness still require the owner's real-device review.

## Runtime and performance

- One H.264 MP4 packs RGB on the left and alpha on the right of each decoded
  1120×840 frame. A single WebGL quad unpacks both from the same frame into a
  transparent 560×840 canvas. It does not deform anatomy.
- Asset: 1,648,175 bytes; SHA-256
  `a576f31dd3f14cbcb15ace3429786ccfb291ee5d7a79da84f72f6a957a63df18`.
- No audio; muted inline playback; lazy loading near the clearing. One texture
  uses approximately 3.8 MB, plus browser-owned decoder buffers. No huge sprite
  cache or background diffusion process is required.
- `requestVideoFrameCallback` follows decoded video time; the fallback uses RAF
  and changes only when video time changes. The authored presentation is 24 fps,
  independent of monitor refresh rate.
- The deer rests for 12 seconds between cycles. Its accessible greeting button
  starts/resumes a cycle. Offscreen/hidden playback stops. Unmount releases
  listeners, frame callbacks, timers, video and GPU resources.
- Reduced motion makes zero MP4 requests on initial load and preserves the
  original still. Network/decoder/WebGL failures also retain the approved still.
- `?deer=still` provides an explicit original-art comparison. The unapproved owl
  flight study remains development-only; normal owl art/behavior is unchanged.

## Validation and evidence

TypeScript/Vite production build passed. The production build now includes the
separate `forest-prototype.html` entry, while `index.html` still loads the existing
application. A standalone forest build can be hosted for review without the app.
Off-host preview navigation directs login, registration and legal links to the
real StethoFuse website.

Focused isolated Chromium checks passed: decoded dimensions, WebGL playback,
greeting action, reduced motion before/after loading, offscreen pause, network
fallback, no page errors, and canvas registration/no horizontal overflow at
360/390/768/1024/1280/1440/1920/2560 pixels. Browser zoom was not comprehensively
retested in this checkpoint; these viewport results must not be presented as that
matrix. No physical phone/Safari result is claimed.

Local evidence in `frontend/evidence/deer-cloud-study/`:

- `idle-candidate-06/inspection/`: all-pose/head atlases and registration metrics.
- `browser-final/`: Day/Night deer and full-page captures, mobile and check receipt.
- `browser-motion/`: real browser recording, consecutive-pose and loop captures.
- `ltx25-01`, `ltx25-02`, `wan22-01`: requests, receipts and source outputs.

No external reviewer or owner approval is claimed. The public review URL and exact
restricted staging version, if produced, are recorded in the release checkpoint.

## Release boundary

The main landing page must not be replaced before visual approval. A public static
review is separate from StethoFuse production. Any future website-image activation
uses `OwnerRelease/Invoke-OwnerRelease.ps1`, the shared lock and preservation guards.
Each exact new image still requires coordinator-owned recovery qualification;
staging cannot be called deployment. No policy write, backup, API/worker/model/data,
Firebase, Portfolio, host/VM/network or Axora change belongs to this task.
