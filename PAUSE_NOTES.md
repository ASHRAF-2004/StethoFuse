# Current loading/cache checkpoint — 2 November 2026

LIVE: https://stethofuse.ashraf-alsaloul.com/
Version: `20261101T174500Z-8ec817622075`
Deployed source: `d5fc500e7403ed43f70d82ab53a932d0c527797c`
Web: `sha256:e01b38bf1bc0753f25af50ef8329a802f59b5fafca5b792e5fc741d8289f7fa0`
Archive: `8ec81762207597ef6be96ae58da1ecc68b84222571822348ce3ed751a77bb297`

The oversized frozen SVG came from loader rules left in an inactive stylesheet.
The actual React loader and pre-JS shell now have explicit 24px dimensions and
active rotation; live 3G video and sampled transforms prove motion. Reduced
motion deliberately stays still. Stalled startup offers Reload. Read
`docs/LOADING_CACHE_STRATEGY_20261102.md` and `docs/system_architecture.md`.

React/Vite/React Router/FastAPI remain. Public HTML is generated in both languages
and appearances, with inline CSS/bootstrap, responsive encodings of the same
approved owl and reusable real-sample waveforms. Root controls stay inert during
preparation, then React enables them; this fixes the early-click race found in
review. The original owl artwork, meshes and pointer-follow behavior are intact.

The exact anonymous homepage has a five-minute Cloudflare edge cache. Browser
HTML is `no-store`; public static assets retain four-hour caching. Account/API/
auth/action/version/query requests bypass shared caching. Per-auth-scope TanStack
Query uses bounded memory only; logout/account changes clear and cancel old
scopes. Permission-bearing metadata revalidates; auth/admin/private audio always
reach the server. No private persistent cache/service worker was added. The two
existing Portfolio cache rules are exactly preserved. Future releases must purge
only this homepage and verify its packaged HTML, per OwnerRelease/DEPLOYMENT.md.

Final live 3G emulation: 400 kbit/s each direction, 400ms latency, 4x CPU. First
content: **10.124s before -> 4.288s now**; repeat: **1.232s**. Cold largest content
still takes **10.056s**; CLS is **0.000038**. The old 112ms repeat reused browser
HTML; current HTML intentionally fetches the edge. These are Chromium lab results,
not a physical Brave/device test. Screenshots/video/JSON are in
`OwnerRelease/performance-20261102/final-20261101T174500Z-8ec817622075` and
`OwnerRelease/performance-20261102/live-startup-20261101T174500Z-8ec817622075`.

Final live: 94 public checks/32 accessibility states, focused Support/recovery/
audio/RTL checks, four mobile startup variants and both real React loader modes
PASS. Local captured-real-API fixtures: 176 layouts/124 accessibility states
PASS. Eight session-cache checks PASS. Fixture identity/network are mocked;
privileged production login and email were not retested. All task test/preview
processes are stopped. Protected build/qualify/preflight/deploy/evidence/status
PASS: healthy API/web, ready worker, aligned pointer/profile/workdirs/restore path,
preserved data/private/model/credential/foreign guards and recovery archives.

Owner proof:
`C:/Users/thalt/StethoFuseDeployment/OwnerRelease/receipts/20261101T175217Z-loading-cache-owner-verification.json`
SHA256: `cb74e4045890064c573e7808241aee9be57f64a4aaa7c686638c82ba65f8b89c`
Own status SHA256: `1b0234cb0754bcdea7ec0f2546787f55ea47e194fe2a2b2f2968934283fba913`
Only StethoFuse web releases and its hostname's cache policy changed. API/worker
images below remain fixed. No backup/restore, model/T9, provider, other-app,
shared-host, DNS or routing action. HOST_PLAN/other statuses were not edited;
shared backup verification stays false. No activation is pending.

Branch `feature/forest-world-prototype`; implementation commits `3fff96d`,
`ad4a7da`, `d5fc500`. Later checkpoint edits are docs only; no merge to main.
Intermediate releases are historical and must not be replayed. Existing approved
UI, PRs and single homepage backup are preserved. The prior account-email body
branding limitation below remains unchanged.

# Previous live checkpoint — 1 November 2026

LIVE: https://stethofuse.ashraf-alsaloul.com/
Version: `20261101T134232Z-5f7577045661`
Deployed source: `57a6a45d1d3908ec1eaed59649174de40e0cb54e`
Web image: `sha256:ffb0dd563f97b6b2b5e7ae8cf35a00a4eae72e49b42d502b26b17076f574a591`
Site archive SHA256: `5f7577045661268de2395311d7dda957944217d562e2a754302b6dbcbb48e9e0`

The requested follow-up is deployed on the existing bilingual listening studio.
Read `docs/SUPPORT_AND_LISTENING_FOLLOWUP_20261101.md` and
`docs/system_architecture.md`. Do not revive rejected forest themes, deer/flight
studies, old candidates or external preview workflows. No auth-provider migration
has been authorized. There is no pending frontend activation.

## Current behavior

- The original approved owl poster/canvas is mirrored in Arabic, with reversed
  pointer yaw and the matching perch anchor. Art, 18 source views, meshes, eyes,
  reduced-motion fallback and connected-neck renderer are preserved.
- Shared public/account/workspace footers credit © 2026 Designed and developed
  by: Ashraf Ali Hussain Al-Saloul. Arabic uses أشرف علي حسين الصلول.
- `/support` sends directly through Cloudflare to the existing verified owner
  destination. It does not open a visitor mail app. HTML/plain text match the
  studio palette; the visitor is Reply-To only. Fixed addresses, origin/body
  validation, rate limits, escaping and provider-acceptance checks are enforced.
  Error states preserve input. Success/restart use shared accessible controls;
  the footer stays full width at the viewport bottom, including Arabic mobile.
- Homepage playback is an actual aligned eight-second HLS-CMDS v3 M0111 excerpt
  and frozen-model heart/lung outputs. It is a clinical-manikin development-set
  demonstration with public CC BY 4.0 attribution/provenance. It is not synthetic
  placeholder audio, T9 material, a source target or an independent clinical test.
  All tracks share one playback gain and load on demand.
- Google sign-in uses Google's unmodified original gradient PNG on a white tile.
- Password recovery is one Firebase flow. Generic unknown-account acknowledgement,
  localized provider requests, trailing-slash routing and transient-error retries
  are tested. Expired/used links still fail closed.

## Firebase access and remaining limitation

The owner completed official Google CLI login. Reusable admin access works from
any folder with the absolute `OwnerRelease/Invoke-FirebaseAdmin.ps1 -Action status`.
The official CLI is installed once (15.34.2). Its private cache/snapshots have
owner/System/Administrators-only Windows ACLs and are outside source. No new
service-account key was created; no credential or action code is in source or
published evidence. The README documents normal reauthentication after revocation.

Real verification and reset HTML reached a unique alias in the connected owner
Gmail inbox with SPF/DKIM passing. Both actions were consumed, sign-in after reset
passed, reuse of the reset link failed, and the disposable Firebase identity was
deleted. Only those two new test messages were read. Existing user accounts and
the application database were not changed by this account-mail test.

Supported account-mail sender names are StethoFuse. Full proposed account-email
body branding is NOT active: Firebase returned HTTP 400
`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` for both full HTML and a minimal greeting edit;
verification-body edits were ignored on read-back. Original HTML bodies, callback
URI, providers and unrelated settings are preserved. Prepared templates remain in
`services/stethofuse-support/templates`. Do not repeat failed writes or claim
these bodies match the UI. Functional recovery passes despite this styling
restriction. The Cloudflare Support email is independently branded and provider
accepted; its fixed destination inbox is not the connected Gmail account, so its
inbox receipt is not claimed.

## Verification and evidence

- Current live public matrix: 94 checks and 32 accessibility states, eight widths
  360–2560, English/Arabic and both appearances; zero detected violations, page
  errors or failed assets. Four Support confirmation accessibility states also
  pass, along with desktop footer-width/bottom and restart behavior checks.
- Focused live checks: four Support states (HTTP intercepted), two provider-
  recovery languages (HTTP intercepted), three real audio hashes/decodes and two
  actual pointer/mirror states. A separate actual deployed Support submission
  returned 202 and displayed its reference without a mail window.
- Ten Worker validation/email tests passed. Earlier isolated role and real-zoom
  studies remain historical baseline evidence; they were not all rerun during
  this follow-up. No production privileged-role login or clinical validation is
  certified by these UI checks.
- Build, qualification, preflight, deploy, evidence and fresh status passed.
  API/web are healthy, worker ready; pointer/workdirs/profile/stable restore path
  align. Data, private/model/credential and unrelated app/network guards passed.
  Candidate and previous image archives are verified and preserved. Ordinary
  self-service deployment required no coordinator or exceptional retry.

Owner proof: `C:\Users\thalt\StethoFuseDeployment\OwnerRelease\receipts\20261101T152640Z-followup-owner-verification.json`
SHA256: `fdb0c41e6e4561e4e1d2ebdc5435f665dab1b40a4dcd0610ac6fd210d068ff81`

It contains exact immutable release receipts, endpoint diagnostics and an
immutable snapshot of current browser/mail evidence. StethoFuse's own status is
current. HOST_PLAN and other application statuses were not edited. API/worker
images remain:

- API: `sha256:33b257a5dbacebe7776326732ce88f596058694bbdf24410b095644171150f56`
- Worker: `sha256:df4b5cfec7ef525c599c52773ed2c6cf5c26753b13f0e6c4d5962ab0af4dfde4`

No combined backup, restore, T9 use, model change, other-app action or shared
VM/Windows/network change was performed. Shared backup verification remains false.

## Source and recovery

Branch: `feature/forest-world-prototype` (historical name preserved).
Follow-up implementation commits: `591cd53`, `65b016b`, `57a6a45`.
Later checkpoint changes are documentation only; the deployed source above stays
authoritative. No merge to main. Existing source/PR history and the one homepage
backup `OwnerRelease/backups/homepage-before-product-polish.zip` are preserved.

For later authorized releases, use `OwnerRelease/DEPLOYMENT.md` and the existing
build -> qualify -> preflight -> deploy -> evidence -> status workflow. Preserve
locks, exact images, current data, health and rollback. The owner retired Axora
conversation/handoff gates; routine deployment needs neither another terminal nor
new secret keys. For genuine maintenance failures use OPERATIONS.md in the same
conversation. Full account-email body styling is the remaining provider
limitation; replacing authentication would be a separate migration decision.
