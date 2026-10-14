# User readiness release — 15 October 2026

This release connects the remaining supported account flows and the owl arrival,
and makes the public home use the approved Frost/Midnight dashboard materials.
The owner selected permanent removal of owned recordings/results after explicit
confirmation, and in-app updates for this release. The owner repository is now
<https://github.com/ASHRAF-2004/StethoFuse>; its repository ID and history are unchanged.

## Delivered behavior

- Home shares the dashboard palette, local fonts, controls and theme preference.
  Its existing winter composition and authentic logo remain. Public copy describes
  the working Firebase, private upload and deployed separation capabilities.
- A genuine winged approach, feet-first landing and short settle hands off to the
  approved continuous head/gaze renderer. Arrival runs once per document, pauses
  offscreen, releases its canvas/bitmaps, and falls back on load failure. Touch,
  reduced-motion and data-saving clients retain the approved perched owl.
- Profile photos are cropped in the browser and persisted as bounded, canonical
  static PNG pixels in private SQLite preferences. Header/sidebar/profile share
  the current account's photo; another account or administrator cannot read it.
- Privacy settings download actual **metadata JSON** for the current account and
  its owned recordings, jobs, results, sharing and reviews. Audio remains a separate
  protected recording download; this is not a full media archive.
- Delete account requires the exact current account reference, typed `DELETE`,
  and a signed provider authentication time within five minutes. Processing jobs
  and the last active administrator block deletion. A durable journal disables
  access and revokes grants before removing owned files and metadata. Startup
  retries interrupted removal. Minimal disabled UID/public-reference tombstones
  prevent recreation or administrative reactivation. Saved contributions to another
  owner's recordings remain with that workspace.
- Provider deletion uses the same verified user's ID token at the documented
  [Firebase current-user deletion endpoint](https://firebase.google.com/docs/reference/rest/auth#section-delete-account).
  No privileged provider credential is added. If the provider cannot confirm removal,
  the receipt explicitly reports pending provider cleanup; live account access stays
  closed and local removal is not reversed. No ID token enters the journal or logs.
- Notifications derive up to 30 recent current processing states, saved review
  revisions and incoming sharing states. Only displayed, still-authorized IDs are
  acknowledged as read. Preferences filter processing or review/sharing updates.
  The feed refreshes while the workspace is open; no email or browser push is sent.

## Verification

- Native isolated Linux/FastAPI/SQLite: **195 tests and 26 subtests passed**.
  Includes ownership, canonical-image validation, exact deletion confirmation,
  interruption recovery, UID tombstones, provider failure/binding, FK/integrity,
  grant revocation, per-account notifications and same-second read-state races.
- Real Brave against temporary SQLite/private storage and a fictional provider:
  **8 account browser flows passed**, including photo persistence, export, updates,
  preference persistence, access closure and actual temporary account deletion.
  No production account, recording or model is used by those fixtures.
- Owl: **5 lifecycle groups passed**, including genuine poses, landing/gaze handoff,
  offscreen resume, motion preference changes, touch/reduced-motion and failed assets.
- Home: actual button/FAQ colors and contrast, theme persistence and no horizontal
  overflow at 320, 390 and 1440 pixels pass in both themes. Shared approved token
  and typography parity was also checked against the isolated dashboard proof.
- Actual TypeScript API transport: **8 checks passed**. Production and independent
  UX builds pass. Existing pinned package locks, model artifacts and worker are unchanged.

Screenshots and machine receipts are under ignored
`frontend/output/playwright/user-readiness/`. The Superdesign home-hero draft is
version 3; `.superdesign/resume.json` records safe context hashes and the authentic
public logo. It is a design artifact; local browser verification covers the app.
Pingfusi reviewer login is unavailable, so no independent human verdict is claimed.
Graphify is not connected in this restored environment; source inspection was used.

## Arrival asset provenance

The built-in `image_gen` tool generated transparent snowy-owl poses with the
approved production owl as reference. The brief required the same identity,
front-facing gaze, complete wing tips, stable lighting and separate approach,
midstroke, downstroke, feet/landing and folded-wing poses. The first six-pose sheet
was rejected for clipping. Refined atlas frames **0, 2, 3, 4** and a separately
generated complete horizontal midstroke are used; atlas frames **1 and 5 are excluded**.
Browser canvas produced the WebP derivatives, without editing the approved masters.

`frontend/public/assets/owl/arrival-v1/manifest.json` records measured eye landmarks,
source hashes, derivative hashes and the excluded frames. The two runtime images
total 375,376 bytes. Generated PNG masters remain in ignored
`frontend/output/imagegen/owl-arrival-v1/` and the local Codex generation directory
`01a13bc2-cc0b-7113-8abc-5813e0123aab` (refined atlas
`exec-5bd6ad1a-6204-410c-8425-2fb74a91dd23.png`, midstroke
`exec-4cbd2e00-2146-42a1-b75f-dcb6eef1a2e0.png`). Original approved assets are preserved.

## Recovery and release procedure

Windows work stays in `C:\Users\thalt\StethoFuseDeployment`, next to AxoraDeployment.
Use the coordinator's pinned shared-guest SSH details. Keep project
`stethofuse-production`, its isolated network/storage and guest loopback **8088**.
The coordinator owns Windows services, QEMU, host forwarding and shared-host restarts.
The stale source VM stays offline; preserve its protected recovery disk.

Before cutover, publish exact new API/web image IDs, unchanged worker/model hashes,
release path and test evidence in `stethofuse-status.json`. Coordinate a StethoFuse-only
update to the shared backup profile. Its pinned-image guards intentionally reject
unqualified images; do not weaken another application's profile or guards. Take a
consistent verified pre-release backup, stop this project's writers gracefully,
switch the reviewed immutable release/images, then verify health/auth, worker/model,
SQLite/FK, private hashes, HTTPS and enabled startup units. Refresh and fully restore
the single current encrypted shared snapshot through the coordinator.

After any cutover writes, rollback must first quiesce StethoFuse and capture the
latest SQLite/private/config state, including new avatars, read receipts, recordings
and **account deletion journals/tombstones**. Never resume the stale source database.
Keep current data with a compatible previous image, or transfer the verified current
state back before source recovery. An older backup can contain subsequently deleted
data: collect all newer deletion receipts/tombstones, replay their owned-data removal
in an isolated restore, verify denial/FK/integrity and private hashes, and only then
activate. Without those receipts, do not expose the older restore to users. Provider
cleanup failures require the owner/operator to remove only the exact journalled UID
through the existing provider console, then record confirmation; never retain a
user token for unattended retries.

## Remaining boundaries

This is a research application, not clinical or medical-device qualification.
Live microphone/device qualification, handle-based password login, provider
linking/unlinking, other-device session management and full media ZIP export remain
separate work. Current email/password and Google sign-in remain the supported paths.
No clinical claim, ML training, model change, new provider or synthetic processing
result is introduced by this release.
