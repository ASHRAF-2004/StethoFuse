# User-readiness release — live, 15 October 2026

The user-readiness release is now served at
**<https://stethofuse.ashraf-alsaloul.com>**. Public home Frost/Midnight parity,
genuine owl flight/landing/gaze, private photos, metadata export, confirmed permanent
owned-data deletion and in-app updates are in this release. Repository history is
preserved at <https://github.com/ASHRAF-2004/StethoFuse>.

The immutable deployed source is **ffea2a2da753aed6fd784cf43a5b2da005bab1ab**,
reviewed/merged through [PR #10](https://github.com/ASHRAF-2004/StethoFuse/pull/10).
Later documentation commits do not change these deployed binaries.
The adjacent [machine-readable live receipt](USER_READINESS_LIVE_EVIDENCE_20261015.json)
records the cutover, final public checks, current recovery proof and guarded cleanup.

| Service | Exact deployed image |
|---|---|
| API | sha256:33b257a5dbacebe7776326732ce88f596058694bbdf24410b095644171150f56 |
| Web | sha256:f082f7419e5c90065eb0d148734727ca4760122474b653e47c533b5c89838325 |
| Original ML worker | sha256:df4b5cfec7ef525c599c52773ed2c6cf5c26753b13f0e6c4d5962ab0af4dfde4 |

## Coordinated cutover and preservation

Axora authorized the exact cutover in read-only `HOST_PLAN.json` after a fresh
all-three encrypted/native backup and independent Windows 14-artifact restoration:
**383b6bbb1e1bdd7603a1ff9cc8c44487297e4347ceacfb8c1b4deef4c09f4648**.
The staged candidate and coordinator helper passed nine guard/lock qualification tests.

Cutover ran from **22:32:03 to 22:32:19 UTC on 14 October** (06:32 on 15 October
in Malaysia), under the shared exclusive deployment lock. Only StethoFuse's tunnel
and writers stopped. Its worker drained before shutdown; no old/new production
workers overlapped. A consistent final SQLite/private/models/config/tunnel copy
was verified before image-profile activation and the atomic release-pointer switch.
All **12 Axora/Portfolio container IDs** and the coordinator's private Axora guard
remained unchanged.

The coordinator's fixed helper changed only
`shared_applications.stethofuse-production.image_ids`. Every other backup policy,
namespace, credential, database, path and application guard remained intact.
Stack/tunnel startup used existing systemd units and existing loopback **8088**,
project `stethofuse-production`, network **172.26.0.0/16** and `/srv/stethofuse` storage.
No Windows service, QEMU, host forwarding or shared-host restart was changed here.

The entire SQLite logical content and schema 3 matched before public routing
reopened: 3 users, 7 recordings, 19 resources, 5 grants, 46 audit events, 4 jobs,
4 results, 2 reviews and 1 preference row. Native integrity and FK checks passed.
All 15 private files, frozen models, configuration, tunnel credential, ownership
and permissions matched the final copy. This is a preservation checkpoint, not a
fixed future account/recording limit; operational health checks allow legitimate
new writes and confirmed deletion.

Frozen checkpoint SHA256:
`1f7e549ba53240bc085221e4eed1f935bb7c330e9a66cfab4c183c8f096c2658`.
Specification SHA256:
`2573ae06b11aafc595a4cdb179e3ab0c9f7fbe37859863dcd36a5d8c70210b1b`.
The unchanged worker reported ready (observed model load 0.468 seconds; not an SLA
or inference benchmark). Package locks, model, inference and consumed T9 are unchanged.

## Actual live verification

Six real Brave groups against public HTTPS passed with the normal production
Firebase SDK and **no fixture injection or token extraction**:

- Genuine approach/landing, released arrival canvas and continuous gaze handoff.
- Both published flight image hashes match the qualified image manifest.
- Actual Frost/Midnight controls, persistence and 320/390/1440 layouts.
- Sign-in/registration render without setup errors or fictional-persona controls;
  Google sign-in is available and anonymous workspace navigation returns to sign-in.
- Configured storage/provider/separation health and authentication denial for
  private profile, export, notifications, administrative and media endpoints.
- Touch/reduced-motion fallback retains the approved static owl without flight downloads.

The live run had no page errors. It does **not** claim a new credentialed
real-account sign-in, production account deletion, email delivery or clinical test.
The destructive and private account flows were exercised against real isolated
SQLite/files with an explicitly fictional provider: 195 backend tests plus 26
subtests, eight account browser flows, five owl groups, eight API-client checks,
both-theme layouts and production/UX builds passed before deployment.

The new exact containers are healthy/ready; stack, own tunnel and backup timer are
enabled and active. Windows managed-loopback and public HTTPS checks pass. Existing
shared-host warm-restart proof is retained; a Windows cold boot was not performed.
The persistent `current` pointer now selects the new release for the enabled unit.

## Post-release recovery

The coordinator completed and fully verified the current shared encrypted snapshot
**5b0f88d86e83f2139464d7956ae154851b92df7ab8ba89c0816e50bfb830dbea**.
Native and encrypted restoration passed for all three applications. StethoFuse's
exact three images, 4,143 files and 23 captured SQLite databases passed validation;
the isolated restore started no application or tunnel. The independent Windows
restore verified all 14 artifact hashes and independent key retrieval, completing
at **22:48:39 UTC**. One maximum-compression current snapshot is retained
(2,561,231,777 stored bytes). The Windows copy is outside the VM on the same PC;
the original off-host StethoFuse backup configuration and enabled timer are retained.

The coordinator released the production freeze. The public browser's six groups
and startup/database/model/Windows-loopback/HTTPS checks passed again after the
bounded backup pause. No application change or extra restart was required.

Under the shared lock, guarded cleanup removed only the redundant final-copy
payload: **29 files, 5,232,728 bytes**. The protected verification manifest and
cleanup receipt remain. Current application data/configuration/models/secrets,
working repositories, the rollback release and original recovery disk are preserved.

Retain the protected original source disk. Rollback after any new writes must use
the newest SQLite/private/config state and account-deletion journals/tombstones.
Never resume the stale source database or expose an older restore before replaying
all newer confirmed deletions. Use compatible application images with current data;
coordinate any old-image profile reversal with Axora. See the
[full lifecycle and rollback procedure](USER_READINESS_20261015.md).

Metadata export is not a full media ZIP. Handle login, provider linking/unlinking,
other-device session management and microphone/clinical qualification remain separate.
This release's notifications are in-app only, as selected by the owner.
