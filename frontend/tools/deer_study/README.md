# Deer study diagnostics

Research only. These scripts do not activate animation or touch production.
Run from `frontend`. Video utilities require the existing FFmpeg/FFprobe on PATH;
the local ignored research venv contains Pillow, NumPy and OpenCV.

```powershell
python tools/deer_study/inspect-generated-video.py
& evidence/deer-frame-study/.venv/Scripts/python.exe tools/deer_study/measure-video-registration.py
& evidence/deer-frame-study/.venv/Scripts/python.exe tools/deer_study/stabilize-video.py
& evidence/deer-frame-study/.venv/Scripts/python.exe tools/deer_study/check-adjacent-video.py
python tools/deer_study/render-continuous-guide.py
```

The first four scripts read/write ignored
`evidence/deer-frame-study/continuity-test`. Copy the preserved
`assets/forest-world/animation/deer-frame-study/rejected-continuity-take.mp4`
there as `generated-candidate.mp4` before reproducing the diagnostics.

Stabilization applies one global similarity transform per frame. It does not
repair anatomy or create in-between poses. Adjacent differences flag appearance
changes for inspection; they are not a quality score or an acceptance test.

The final script draws a separate continuous joint/timing diagram. Fixed-length
links, smooth joint angles and far/near occlusion replace the rejected held-image
guide. It is a technical blockout, **not character artwork, not an anatomically
certified gait and not an accepted runtime sequence**. It does not alter any
photograph. Its outputs stay in ignored `evidence/deer-frame-study/continuous-control`.
No further generation has used that diagram.

## Local continuous video research

`generate_candidate.py`, `bounded_transformer.py` and `decode_saved_motion.py`
are a separate local Wan image-to-video research path. See
`../../../docs/DEER_LOCAL_GENERATION_STUDY.md` for pinned model/runtime provenance,
the failed loader/decoder attempts and actual visual verdicts.

The installed runtime and model cache live outside the application repository in
`C:/Users/thalt/StethoFuseDeployment/tools/DeerMotionLab`. From the implementation
root, use that environment's Python and pass its directory through `--lab` when
running the checked-in scripts. Every new generation needs a fresh `--run` ID;
existing output directories are never overwritten. These commands generate local
research files, not a release or an application asset replacement.

The bounded reader avoids mapping an entire FP32 checkpoint while allocating the
whole GPU model. BF16 is the default and was used for the actual diffusion.
The optional FP8 reader branch was not used for the generated motion. Saved
diffusion latents allow decoder scheduling/precision experiments without another
generation. `audit_continuous_candidate.py RUN_DIRECTORY` builds native contact
sheets and adjacent-image diagnostics; its output never accepts motion.


`generate_masked_leg.py` is the later native-crop VACE experiment. It reads the
existing isolated lab through `--lab`, generates only the masked foreleg and
retains original pixels outside that mask. It requires the preserved original,
registered peak and ROI inputs in ignored `vace-leg` evidence. Example from the
implementation root (use a new run ID and no concurrent GPU worker):

```powershell
& C:/Users/thalt/StethoFuseDeployment/tools/DeerMotionLab/.venv/Scripts/python.exe frontend/tools/deer_study/generate_masked_leg.py --lab C:/Users/thalt/StethoFuseDeployment/tools/DeerMotionLab --run vace-leg-native-new
```

The script refuses crop upscaling. Known rest/peak holds are disclosed in the
receipt and are not distinct-pose counts. Nothing is installed into the scene.
Pass `--mask RUN_DIRECTORY/leg-mask.png` to the audit for undiluted moving-region
diagnostics. Runs with abrupt transitions, orphan hooves, malformed joints or
visible composite seams must be rejected even if the model and video metadata
checks pass. The owner still decides visual acceptance.


`generate_candidate.py` also accepts `--source`, `--prompt-file` and
`--negative-file` for an explicit cropped study. Its current default is full BF16
VAE encoding/decoding with native convolution; use `--vae-precision fp32
--vae-tiled` to study the older, slower schedule. VAE precision is recorded in the
receipt. Transformer weights stay BF16. This changes image precision/scheduling,
not frame rate or a saved motion timeline. Do not compare new decode precision
as though it were a newly generated take.

`register_crop_key.py --reference CROP --mask MOVING_ROI --key GENERATED_KEY
--out NEW_DIRECTORY` measures a single whole-crop similarity transform from
static context. It refuses excessive scale/rotation and existing output paths.
The early-key reproduction returned730/746 inliers and the same subpixel matrix.
It does not certify joint anatomy or authorize runtime activation.


The experimental `generate_large_leg.py --lab LAB --run NEW_ID` uses the pinned
larger VACE checkpoint and a fixed native320x480 lowering study. Its helper,
`bounded_scaled_offload.py`, reads one tensor at a time, stores transformer-block
weights in per-linear scaled FP8, computes in BF16 and stages pinned CPU blocks
asynchronously. Conditioning layers remain BF16 because their code reads weight
dtype before calling the layer. A tiny complete WanVACE model exactly matched an
all-GPU quantized reference after this correction; all thirteen downloaded shards
also matched their official hashes. These checks validate placement/integrity,
not anatomy. The independent linear quantization probe has2.55%relative RMS error
versusBF16. Full native images and every transition still require inspection.

The raw inspection page is `http://127.0.0.1:4192/deer-local-studies.html`.
It disables playback for incomplete jobs, scrubs native PNGs with a bounded cache
and plays actual encoded video only on explicit request. It is a local laboratory
page, separate from the approved forest prototype and production build entry.
