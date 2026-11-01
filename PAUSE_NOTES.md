# Current StethoFuse checkpoint — 1 November 2026

LIVE: https://stethofuse.ashraf-alsaloul.com/
Version: `20261101T094243Z-42e08b861fc8`
Source: `54200a3acd518f5e8a332068f3a9744f8fafb46f`
Web: `sha256:5300f38bc5d88e527ffc0827b58536bd155ed6760ce6c48c2a4f5754039d641b`
Site archive SHA256: `42e08b861fc879a91007f67226d05c664282c1be91bc829959053eef463741e4`

The owner's latest request replaced the rejected forest design with a clean,
product-focused listening studio. The only required visual carry-over is the
approved snowy pointer-following owl. The new public/account/role interface is
deployed. Read `docs/DESIGN_RESET_20261101.md` and `docs/system_architecture.md`.
Do not resume the old forest composition, deer/flight studies or old design drafts.

## Current interface

- White/charcoal/mint materials, a solid split-signal mark and opaque mint-tile
  SVG/PNG favicon. Chillax Latin and IBM Plex Sans Arabic are self-hosted.
- Persistent English/Arabic, real RTL document direction, logical layout and
  LTR audio axes/IDs. User names, notes and recording titles stay unchanged.
- Real eight-second locally synthesized listening sample with track selection,
  playback and seeking. It is explicitly synthetic, not model output or T9 audio.
- Centered sign-in/signup/recovery forms, readable help/legal pages, useful
  validation, keyboard controls, responsive menu and returning-user workspace link.
- Staff/analyst/admin share a quiet working-sheet layout. Existing recording,
  separation, review, grants and role behavior are retained. The last correction
  fixes workspace perch occlusion, avatar/ID contrast and accessible list/unread
  semantics. No production role assignments were made for UI testing.
- The approved owl's 18-view connected-neck art, meshes and eye material are
  unchanged. Its claws stay in front of the desk/perch. No flight/deer sequence
  is active. Pointer rendering stops offscreen/hidden and respects reduced motion.
- The root skeleton flash is absent. The optional hero/font gate starts after
  200ms, ends within 2.5s and is skipped for reduced motion. Forms/content do not
  wait for the optional pointer textures. Cached vendor bundles are separated.

## Verification and boundaries

- Final build and public suite: 86 checks, 28 accessibility states, zero detected
  violations/page errors/failed assets; eight widths 360–2560 and both languages/
  appearances. Actual screenshots were inspected, including mobile/account pages.
- Private UI: 176 route/layout checks and 124 accessibility states, zero detected
  violations/errors/unknown API calls. These use fictional identities and captured
  responses from a temporary API database; they are not privileged live logins.
- Real Chromium page zoom 67/80/100/125/150/200%: 48 cases, no overflow, aligned
  owl contact and centered forms. Native CDP captures avoid Playwright's zoom
  screenshot clipping artifact. This is browser zoom, not CSS `zoom`.
- Four slow-start cases, exact version/source/archive and two published-script
  hashes passed. Live owl movement was sampled at 16 positions; the art study also
  inspected all 18 poses, enlarged light/dark alpha edges and 80 pointer positions.
- Actual disposable Firebase signup/sign-in, verification gate, sign-out return,
  production unverified-token403 and identity deletion all passed. No mail was
  sent. Inbox delivery, interactive Google consent and a real verified privileged
  production login are outside those checks.
- Existing model/API/capture acceptance is recorded separately in
  `docs/PRODUCT_READINESS_20261101.md`; the real frozen-model synthetic-audio test
  belongs to that earlier checkpoint. This UI release did not rerun or alter ML.
- Independent Pingfusi review request expired with 0 responses. No external or
  owner visual approval is inferred. No new review, design question or deployment
  authorization is pending. The owner's selected redesign is already live.

## Exact operational evidence

Owner proof: `C:\Users\thalt\StethoFuseDeployment\OwnerRelease\receipts\20261101T095920Z-studio-owner-verification.json`
SHA256: `27e1e7f334988ea5613d4a6e2b8733944c53c7bb7e3ec5906fbaea34c0095a00`

It contains immutable receipts and a browser-evidence snapshot. Deploy/evidence
objects match; live pointer/workdirs/profile/stable restore path align. API/web
are healthy and the worker is ready. Current data/foreign/credentials/model
preservation guards passed. API and worker images remain:

- API: `sha256:33b257a5dbacebe7776326732ce88f596058694bbdf24410b095644171150f56`
- Worker: `sha256:df4b5cfec7ef525c599c52773ed2c6cf5c26753b13f0e6c4d5962ab0af4dfde4`

Only the guarded StethoFuse website release/web recovery pin changed. The
current/prior image archives remain verified and preserved. No combined backup,
restore, host/VM/network/other-app action was performed. Shared backup verification
remains false. StethoFuse's own status was refreshed; HOST_PLAN and other app
statuses were not changed.

## Source, backup and future work

Branch: `feature/forest-world-prototype` (historical name retained).
Implementation commits: `5d496ba` and `54200a3`. Later checkpoint edits are docs
only and do not change the deployed source identity above. No merge to main.

One homepage source backup is retained and its ZIP integrity passed:
`OwnerRelease/backups/homepage-before-product-polish.zip`.
Inactive old artwork/studies remain historical source; they are not requested by
the active homepage. No external preview site/workflow was created or deployed.

For later authorized releases, read `OwnerRelease/DEPLOYMENT.md` and use
build -> qualify -> preflight -> deploy -> evidence -> status in the same
conversation. The owner retired Axora/handoff/agent-review gates. Preserve actual
locks, exact images, current data, health checks and rollback. No code changes
remain pending from this request; any later taste feedback starts a new change.
