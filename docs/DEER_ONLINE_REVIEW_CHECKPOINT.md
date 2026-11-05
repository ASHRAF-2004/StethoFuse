> Historical record � superseded by the owner on 30 October 2026. External hosting is removed. Use only stethofuse.ashraf-alsaloul.com and the restricted OwnerRelease path; do not follow the old publishing workflow.

# Deer online review — 30 October 2026

Status: **ENCHANTED FOREST PROTOTYPE PARTIALLY COMPLETE — ASSETS OR ANIMATION REQUIRE REVIEW**.

The owner rejected previous deer motion. This checkpoint publishes a distinct,
generated attention/idle candidate for real-device testing, not a final playing or
running animation. Supplied animation boards remain reference-only. Read
`DEER_FREE_VIDEO_PREVIEW.md` for generation decisions, source receipts, limitations,
matte inspection, frame counts and runtime implementation.

## Published test page

- [Day](https://pinghumans.vercel.app/d/cKv1gc1c9uBF/index.html?theme=day)
- [Night](https://pinghumans.vercel.app/d/cKv1gc1c9uBF/index.html?theme=night)
- Publisher alias: <https://pingfusi.com/d/cKv1gc1c9uBF>

This is **separate static review hosting**, not the production landing page.
The link expires **1 November 2026, 09:20 Asia/Kuala_Lumpur**
(`2026-11-01T01:19:59.608Z`). No external reviewer/owner acceptance is claimed.
Click/tap the deer to greet it; the short attention sequence also plays near the
clearing, resting 12 seconds between cycles. Reduced motion retains the original
still. `&deer=still` explicitly compares the approved unchanged artwork.

The first package exceeded the host's 300-file cap. Its replacement uploaded, but
the browser exposed root-relative JS asset requests failing under the hosted path.
That copy is superseded. The final export uses only manifest-referenced owl files
and a deployment-relative asset base. Original artwork/media bytes are unchanged.
`frontend/tools/deer_study/package_review.mjs` makes this export reproducible.
No auth application or Firebase code is included in the standalone review bundle;
login/register/privacy/terms/help links navigate to the real StethoFuse website.

The final public check verified:

- Exact packed-video SHA-256
  `a576f31dd3f14cbcb15ace3429786ccfb291ee5d7a79da84f72f6a957a63df18`.
- Successful HTTP206 video delivery and 21 decoded redraws in 900 ms.
- Day/Night switching and native video playback, including the greeting action
  at a 390-pixel mobile viewport.
- No page errors or failed asset responses. Footer legal/help URLs reach the
  existing production routes.
- Actual public Day/Night full-page/deer screenshots and a mobile screenshot.

Local and public captures were inspected directly. All49 forward poses, 35→36,
reverse and loop boundaries were also inspected. No hard pose cut from the previous
animation is reused. This is not proof of perfect motion or real-device acceptance.
Head/ears/neck/chest are animated; original feet/terrain remain fixed. Native model
rate is16 fps; RIFE evaluates49 forward poses and the disclosed reverse return
gives97 timeline positions at24 fps. Full-body running and final owl flight remain
unfinished. No visual approval should be inferred from the build or checks.

## Production candidate — not deployed

Restricted build succeeded from source commit
`4bc90d1b14319b01c151fa5cd6745d0f338b1931`.

| Evidence | Exact value |
|---|---|
| Version | `20261030T011623Z-0125dc6c563e` |
| Web image | `sha256:c2c1a216df20da78c33bfc51d8e2425fac465b7166e52ff694df9037fbd93b0c` |
| Archive SHA256 | `0125dc6c563e760e3d60760f90d27a5a4557459029232f0a611132ab2c80e413` |
| Archive bytes | `45,541,098` |
| Cold start | `PASS_ISOLATED_WEB_COLD_START` |
| Real restricted preflight | `DENIED_NO_DEPLOYMENT: CANDIDATE_IMAGES_NOT_RECOVERY_QUALIFIED` |

The required coordinator signal is an exact-version recovery qualification proof
for this web digest, preserving the fixed API/worker pins and protected guards.
Then a fresh restricted preflight must pass before owner activation. Do not retry
deployment before that proof, change recovery policy, or replay old handoffs.
This candidate adds the separate forest review entry; it does not replace the
main landing page. A main-design replacement still needs owner visual approval.

Receipts in `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/receipts/`:

- `20261030T011636Z-build.json`, SHA256
  `e3a3175d535bc7bce081e7c226662f3b3e735295abd8342d33e632219a5e5272`.
- `20261030T011705Z-preflight.json`, SHA256
  `3755c71b7948de3a1b16f12579ffe7a7bc92f09d9d660c5ab9b6d04e00cbec2a`.
- `20261030T011716Z-status.json`, SHA256
  `147fe30edfa4a6c7c33b61439482aa9f8968a994d44075fda6dc0912169a6ae7`.

Fresh status at01:17:15 UTC reports `ACCESS_READY_BASELINE_ALIGNED`, unchanged
container IDs/StartedAt, current pointer/workdirs/profile and stable restore path.
Current live release remains `20261028T101829Z-7d4501b7cd84`:

- Web: `sha256:8143c5132a7b621fc3038630ce7d2e7ad0f2039d6e64392605e2d86ce82d1b2a`, healthy.
- API: `sha256:33b257a5dbacebe7776326732ce88f596058694bbdf24410b095644171150f56`, healthy.
- Worker: `sha256:df4b5cfec7ef525c599c52773ed2c6cf5c26753b13f0e6c4d5962ab0af4dfde4`, running,
  without a Docker healthcheck. No new worker-ready/data-integrity test is claimed
  by this status-only observation.

Only the owner's status file was refreshed, preserving its prior deployment review.
Exact qualification request:
`C:/Users/thalt/SharedRuntimeMigration-20261015/stethofuse-web-qualification-request-20261030T011623Z-0125dc6c563e.json`,
SHA256 `8b2f034c5d2412f7499503b5018da2807c7d9ede861098875dd75d9077aa280a`.
New owner-status snapshot SHA256:
`181be290eac1cfecfdc0432765eed5ffe1c8e9729883b58bcd103ecaed65435f`.
HOST_PLAN/axora-status/recovery policy were not written. No production activation,
writer stop, backup, data/model/T9/Firebase, Portfolio or host/VM/network change ran.

## Project checkpoint

Source commit `4bc90d1` adds the generated-video renderer, scoped deer interaction,
single-frame RGB/alpha unpacking, optimized assets and provenance, free-request/
matting/packaging scripts, separate production HTML entry and documentation.
The existing app component structure, exact owl art and approved scene layout stay
intact. A following packaging/documentation commit records public hosting fixes.
No push, merge or main-branch change was performed.

TypeScript/Vite production and standalone builds passed, Python compilation/Ruff
passed, and `git diff --check` passed. Focused local browser checks passed at
360/390/768/1024/1280/1440/1920/2560px, covering canvas registration, no horizontal
overflow, reduced motion, paused offscreen rendering and failed-download fallback.
The complete browser zoom matrix and physical Safari/mobile testing are not
established. The owner should judge motion on the published review page.

Evidence remains at `frontend/evidence/deer-cloud-study/`: `browser-final/`,
`browser-motion/deer-idle-browser-preview.mp4`, `live-browser/`,
`idle-candidate-06/inspection/`, and `online-preview-fixed.json`. Old failed/rejected
sources and receipts are preserved. The native motion-study workers exited; no
large generation process is needed for playback. Local preview, if still running:
`http://127.0.0.1:4192/forest-prototype.html?theme=night`.
