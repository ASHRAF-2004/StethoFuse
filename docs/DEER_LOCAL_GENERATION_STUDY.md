# Continuous deer generation — local research continuation

29 October 2026. Resumes the rejected mesh and held-pose video documented in
[the original study](DEER_FRAME_ANIMATION_STUDY.md). The forest still uses the
approved original deer. Nothing here authorizes activation, merge or deployment.

## Local generation environment

The PC has an AMD Radeon RX 9060 XT with 17,095,983,104 bytes of reported VRAM,
32 GB system memory and existing display driver `32.0.23034.4`. AMD's
[Windows support matrix](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/compatibility/compatibilityrad/windows/windows_compatibility.html)
and [installation instructions](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/install/installrad/windows/install-pytorch.html)
were checked before installing an isolated runtime in
`C:/Users/thalt/StethoFuseDeployment/tools/DeerMotionLab/.venv`.

PyTorch `2.9.1+rocm7.2.1` recognizes the discrete GPU. FP16/BF16 matrix and 3D
convolution checks pass. The process-scoped ROCm experimental-attention flag
enables Flash Attention; results were compared with the math implementation.
No display-driver, page-file, Windows service or VM settings changed. Existing
application Python/npm environments and the frozen production model are untouched.

The [Wan2.2 TI2V 5B model](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B-Diffusers)
is pinned to revision `b8fff7315c768468a5333511427288870b2e9635`. Its Apache-2.0
model card, official Diffusers implementation and memory documentation were read.
Approximately 34.2 GB of weights are cached only in the separate research tools
directory, outside the application repository. Runtime versions, hardware checks,
model inventory and revision receipts are in ignored
`frontend/evidence/deer-frame-study/local-i2v/runtime-proof`.

## Correcting the failed input method

This run conditions a single generative video directly on the approved deer.
It does not supply the rejected atlas sequence or held-pose control guide.
There is no mesh deformation, optical-flow body morph, frame interpolation or
repetition to manufacture a frame-count claim. The requested take has 49 native
frame positions at 24 fps. All output frames still require visual inspection.

The first local attempts exposed Windows memory-commit pressure. The text encoder
now runs with sequential layer offload. The video transformer is read one tensor
at a time from the official checkpoints; the largest source tensor is about
226.5 MB. All 825 expected parameters are checked and loaded. The complete
transformer fits in BF16 (9,999,575,424 parameter bytes); FP8 was not used for
the generated motion.

Image encoding, video generation and image decoding occupy the GPU in separate
stages. Final diffusion latents are saved before decoding, and the generator is
released before loading the decoder. This avoids reallocating all models together
and makes decoder repair possible without generating another take.

## Current evidence and quality gate

`continuous-i2v-01` failed during text loading. `02` was stopped during the
standard video-model load to repair the memory footprint. `03` exposed a root
parameter-name bug in the new reader, corrected before loading the full model.
`04` completed diffusion but its sequential decoder schedule was too slow.
`05` completed all 32 diffusion steps, saved its motion latents and released the
denoiser. Its FP32 decode was stopped after several minutes; a BF16 decoder probe
uses the saved motion data. Precision, timing and any subsequent quality verdict
must be reported separately rather than called accepted character animation.

No native output has yet been accepted. Inspect every adjacent pair at native
leg detail, the whole character, three supporting contacts, terrain, antler
topology, identity and settling. File rate and unique hashes do not prove good
motion. The existing approved still remains active until a new result passes
inspection and the owner approves it.

No further Higgsfield generation or paid service call was made. This local path
does not spend cloud generation credits. It is separate from the protected
StethoFuse API/worker, frozen model, recordings, Firebase and production resources.

## Decoder repair and first native result

Profiling traced the long decode to convolution-kernel selection. AMD's documented
[`MIOPEN_FIND_MODE=FAST`](https://rocm.docs.amd.com/projects/MIOpen/en/develop/reference/env_variables.html)
is now scoped to the research processes. This does not change the latent motion,
resample time or add frames. The saved take decoded in 23.7 seconds using BF16.
Chunk observation correctly accounts for Wan2.2's packed channels before saving
native RGB frames. There are 49 actual source images at 384×576 and an MP4 at
24/1 fps, 2.041667 seconds. Video SHA-256:
`bea4bb7277d6f2b887c2adae1d19c02303a2862cd1d4ed0a8f0bbc1d4e152fc9`.

All 49 full images and native foreleg crops were inspected. There are no old
held-pose cuts, but the required hoof lift/pawing action is absent. The head/ears
move and blink while the feet remain planted. This take is **rejected for action
adherence**, not presented as the repaired deer animation. Terrain, antlers and
the idle handoff are not qualified. Absence of a numeric discontinuity alert does
not change that verdict.

`continuous-i2v-06` increases the duration to 97 native positions over about four
seconds, uses 512×768, 40 diffusion steps, a concise action-first prompt and seed
3819. It conditions directly on the original approved runtime WebP, uniformly
resized and alpha-composited over a plain green matte. It is still rendering;
no quality verdict or activation is implied.

All nine downloaded safetensors files were also streamed through SHA-256 checks
against the pinned Hugging Face LFS hashes. All match. No model weights, runtime
virtual environment or cache files are staged in Git.

The 97-frame take was subsequently rejected: native frames 45 and 65 fold the
antlers into an impossible loop, and frame 85 continues the head/antler distortion.
The requested pawing action is missing. It was not offered for owner approval.

## Narrowing generation to the foreleg

The next method uses the official `WanVACEPipeline` for masked temporal inpainting.
Only the farther foreleg region is free to change. Rest endpoints use the approved
original; a registered raised-leg key supplies the peak. Unknown intermediate
frames are masked, not copies of held poses. The protected head, antlers, body and
other three supporting legs are retained directly from the approved original in
the final composition. This is generated cel/in-between work, not deformation of
the original photograph.

VACE revision: `ec4d2cb062b548996b179d493fdd05340de702a1`. Its three text-encoder
hashes match the existing model, so those weights are reused. Transformer, VAE and
configuration files are separately cached under `tools/DeerMotionLab/models/vace-native`.
A Windows symlink error was corrected by using normal local-directory downloads;
no permission, Developer Mode or host-policy change was made.

The raised key is registered with a single whole-frame similarity transform:
265 inliers from 271 matches, scale about 0.9991 and less than one native pixel
translation. No local anatomy warp is applied. The intermediate key is a conditioning
study, not a final approved frame. All generated leg joints, transitions, root
seams, hoof contacts and the exact rest handoff still require native visual checks.

## Masked-generation memory repair

The first VACE attempt spilled working memory into shared system memory. It was
stopped only as an identified research worker. A second attempt failed with an
explicit 8.54 GiB allocation during constraint encoding, before generating output.
The repair uses the VAE's supported 256-pixel spatial tiles, a process-local
allocator cap, efficient attention and cache release. The third attempt completed
all 32 diffusion steps with about 5.5 GB reserved at each step. This changes memory
scheduling; it does not alter playback timing or manufacture additional frames.

All three newly downloaded VACE safetensors files match their SHA-256 values from
the pinned official model revision. The proof and exact active worker sources are
preserved under ignored `vace-leg/vace-leg-03/provenance`. Shared text-encoder
weights retain their separately verified hashes. No display driver, pagefile,
service, shared-host policy or application dependency was changed.

## Native visual rejection and next controlled crop

Run `vace-leg-03` decoded 49 source images at 384x576/24 fps; MP4 SHA-256
`7add5005bad4ddc34baf683d36753642869f3ecf6fbe26fbbf09f38a0faf1849`.
The protected pixels are unchanged, but the take is rejected: the first lift is
abrupt, a disconnected planted-leg/hoof remnant remains beneath the raised limb,
and the leg lacks sufficient native detail. Native leg sheets1-48 and raw/full
frame25 were inspected. The final frame is exactly the original rest image.

The audit now measures the moving mask separately. Its median RGB change is6.09;
pairs1-2 and48-49 rise to24.33 and16.44. Broad leg-region metrics flagged neither.
This is a useful negative control: unchanged body pixels must not dilute the
motion measurement. Neither metric can establish anatomical quality.

Run `vace-leg-04-native-crop` conditions a native384x576 crop at original coordinates
(192,768)-(576,1344), without upscaling. The original complete character remains a
separate identity reference. Five known rest frames at either end and three known
raised-key frames constrain the movement, with conditioning scale1.35. These are
intentional timing holds, not a claim of49 distinct authored poses. Unknown
intermediate images are generated by the video model. Output remains research;
no leg, root seam, contact, matte or idle transition is accepted in advance.


The native crop also failed early visual inspection (frames1-24): an additional
planted foreleg persists beneath the new lifted one, frame6 cuts the hoof and
21-22 changes geometry abruptly. Run04 is rejected, not a refined runtime asset.
Its MP4 SHA-256 is0646b5ec8cbb574290254c62a7287295e9ee9a79614f4eb1f141f8cf7d77c3ce.

Run05 isolates the reference hypothesis: identical native crop, seed, prompt,
known-key timing, steps and conditioning scale, but no separate reference image.
The original body is already visible outside the leg mask in all conditioning
frames. A full-body reference at a different crop scale may be reinforcing the
old leg; that explanation remains a hypothesis until the comparison is inspected.
The worker and model-integrity proof are preserved alongside the run.


## More controlled keys and the remaining motion defect

A new full-body key failed the small-lift target and is retained as rejected
study artwork. A second, cropped builtin-imagegen key shows a plausible modest
toe-off. Source SHA-256:feb812b4c71e7b575b878cff93fd397cb55d223cae1997df43cef99c39d3075c.
It registers on static context with 730/746 inliers, scale 0.999933, rotation -0.003deg
and translation(0.145,0.285) native pixels. The checked-in registration tool
reproduced the same matrix; there is no local anatomical deformation.

VACE06 uses the additional toe-off/lowering key, longer pose constraints and an
explicit close-up prompt with exactly two visible forelegs. Toe-off/count improve,
but native frames14-18 split/stretch the lower limb. It remains rejected.
Official Wan and Diffusers both use nearest-exact temporal mask downsampling;
this was checked against their primary source, not patched speculatively.
Four-frame VAE control spans alone do not establish good motion or a correct mask
mapping. Generated in-betweens remain the acceptance evidence.

The next bounded comparison,continuous-i2v-07-native-crop,uses the already verified
Wan2.2 5B model, a native384x576 close-up of the original,73 source positions at
24 fps,32 steps and seed9371. It has no held-key sequence and no generated antlers
or face. Raw crop motion and any later protected-pixel composite are separate
quality gates. No website animation is activated in advance.


## Continuous crop takes and capacity escalation

Run07 preserved73 source images but moved the wrong leg into a walk. Its saved
motion decoded in17.3 seconds using full BF16/native convolution after stopping
only the slow identified FP32 decoder. All 73 native images were inspected; it
is rejected for wrong-limb action, camera/torso drift and missing rest handoff.
Video SHA:b436451171c1873b21606e73dfee17759b1e5c39ac53260c35ab6723b8c78b6f.

Run08 begins with the already raised limb. It lowers the correct limb and keeps
two legs, but the hoof becomes blue-black/boot-like and contact differs from the
approved original. All 49 native images were inspected. Static-context similarity
probes are unreliable (some frames have fewer than10 inliers); those registered
images are rejected. The raw take is only an unapproved motor reference, not a
runtime candidate. Video SHA:d3edd3b0bfd21edb8e52610e81ebb1f6589f1439e2a6282a16916fa3aaa3b73d.

Run09 guides VACE with that continuous motion while fixing the original body and
final rest. It still damages attachment and retains the oversized hoof at native
frames1-24. Rejected. No numeric alert did not establish anatomy quality.
Video SHA:e63285e078217e772c8d0f8a20663d75b7df036158bbb8bb4aa081ecd4b9feb4.

The official larger Wan2.1-VACE-14B checkpoint is now downloading into the isolated
lab, revisiondb79b90c60bbb45ceec9e41b9d5a4df934538ac4, Apache2.0. Only its transformer
and configuration are fetched; text-encoder and VAE hashes match existing files.
It needs a different memory schedule. An actual-GPU preflight verifies scaled
FP8 storage, BF16 computation and CPU restoration against the quantized reference.
The probe's relative RMS difference versus BF16 is2.55%; it is a scheduling/numerics
check, never a visual-quality pass. No larger-model output is accepted in advance.


## Larger-model placement verification and current render

All 13 larger transformer shards passed SHA-256 verification. A tiny complete
WanVACE model exposed a conditioning-dtype issue before the large load; keeping
conditioning layers in BF16 corrected it. The CPU-offloaded model then matched
the all-GPU scaled model exactly. The original checkpoint files remain unchanged.

The first full load succeeded with10.55 GB on GPU and7.03 GB on CPU, but pageable
transfers took approximately113-127 seconds per diffusion step. Only that identified
research worker was stopped. Pinned asynchronous staging,16 resident base blocks
and24 staged blocks reduced steps to about45-48 seconds, with9.14 GB GPU parameters
and8.44 GB pinned CPU storage. The equivalence test still matches exactly.
The same weights,seed and registered poses are retained. Run
`vace14-leg-02-pinned` is rendering49 native320x480 positions; no visual acceptance
is implied. The known poses are raised start,toe-off and original rest end.

The local inspection page's focused browser checks passed on actual rendered
controls: delayed35-frame loading cannot overwrite36, actual MP4 frames decode,
reduced-motion changes pause playback,and360/390px have no horizontal overflow.
This validates the inspection tool,not the generated animal. Original deer SHA
remains76d545e864c02b419e4430b0b2ef8a312c8dff888e5c0bf0ee8e475caad11567.
