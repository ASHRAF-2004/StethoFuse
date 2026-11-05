# Completion and verification — 5 November 2026

The current website is **20261105T063435Z-e77db0cef73f**, deployed from
`6609c93ef74bf65dfbaeebf5e41dc4099031385b`. The preceding palette/owl release
`20261105T055556Z-489b6d6a0433` was deployed and verified during the same task.

## Delivered

- Calm charcoal surfaces and muted sage accents across loading, home, account and private workspace screens. Day geometry, English/Arabic, keyboard behavior and the approved pointer-following owl are preserved.
- Progressive native owl preparation: a 1,958,672-byte initial field, followed by a separate 1,665,892-byte detail field. All 142 original images and geometry resources remain byte-identical. The initial nine views move genuinely; the full field reaches 18 views in the background. Failed background preparation retains motion and can recover after SPA navigation.
- Operation-bound account-action pages for password reset, verification, email recovery and email-change confirmation. Sensitive action codes are removed from the address bar. There is one password-recovery flow.
- Current service notices, a professional README with actual day/night previews, architecture, contributor/security/attribution guides, issue templates, ownership and meaningful CI. No automatic deployment or external preview-hosting workflow was added.

## Verification

| Check | Actual result and scope |
| --- | --- |
| GitHub CI | All three jobs passed for the deployed source: frontend/public browser checks, isolated API authorization and support-mail contract. [Run](https://github.com/ASHRAF-2004/StethoFuse/actions/runs/41981049571) |
| Python API | 197 tests and 26 subtests passed on Ubuntu/Python 3.14; one existing Starlette deprecation warning. A separate Windows run encountered SQLite handle-cleanup failures and is not counted as passing. |
| Public/account UI | 94 checks, 32 accessibility states, no violations, page errors or missing assets |
| Support/recovery/sample/RTL follow-up | Four support states, two recovery states, three real sample tracks and two mirror states passed; provider responses intercepted in this suite |
| Email-action SDK checks | Six compiled UI/official SDK states passed, including strict rejection of an operation/type mismatch; provider intercepted |
| Final live startup | Eleven cases, 44 layouts, five isolated failure states, software fallback and actual pointer-pixel changes passed on the exact current release |
| Native consistency | 48 actual GPU/software initial/full frame comparisons have equal RGBA hashes; all native image/geometry bytes reconstruct exactly |
| Final live cold 3G | **50.7 seconds** to a verified moving owl, compared with the earlier 86.8-second full-field wait. Measured at 50,000 bytes/s, 400 ms latency and 4× CPU throttle. |
| Final live cached 3G | **1.9 seconds**, with real native first-frame readiness and pointer response |
| Role layout fixtures | 176 desktop/mobile states and 124 accessibility states passed for staff, analyst and admin in both languages/appearances; fictional captured API fixtures |
| Real-provider browser journey | 23 views and 14 accessibility states passed using disposable real Firebase staff/analyst/admin accounts on the preceding palette release. The follow-up changes account actions only; API/worker/workspace behavior remains fixed. |
| Actual live processing | A generated 15-second, 4 kHz PCM recording passed through the production frozen worker. Original bytes stayed unchanged; distinct heart/lung outputs returned. No T9 recording was used. |
| Actual sharing and roles | Non-owner, unassigned analyst and administrator private-media denial; explicit analyst assignment, real review, owner review visibility and immediate denial after revocation passed. Forged admin registration and admin self-role changes were denied. |
| Fresh account recovery | A new HTML email arrived in the task inbox. The same project-bound code was manually tested in the current themed application handler; reset, new-password sign-in and used-link rejection passed. The provider-delivered link still uses Firebase's default host: see the limitation below. |
| Browser capture | Actual AudioWorklet capture and PCM preview passed with synthetic devices in Chromium 153 and installed Brave 156. Previews were discarded. A denied-permission context returned native NotSupportedError and the readable upload-alternative fallback. This is not a physical-device test. |
| Support service | Ten unit checks passed. One marked real form submission returned 202; Cloudflare telemetry confirmed the matching reference/message ID and successful native send binding. The configured destination inbox is not connected for observation. |
| Cache freshness | Exact current packaged HTML SHA matched the public page; scoped homepage purge produced MISS then HIT. Both SHA-bound owl packets cached correctly; private API/account/action/version, authorized and mutation requests bypassed public caching. |

The initial/full image comparisons cover the same reachable initial poses; nine views do not represent the complete 18-view range. Touch, reduced-motion and data-saving conditions use the approved still pose. A still image is never reported as an animated first frame. The loader remains animated during a cold wait and offers an explicit still-pose choice.

## Data preservation and recovery

All four task-created accounts were deleted through the normal recently authenticated API; independent provider lookup confirmed all four were gone. Their synthetic media/results/grants were removed. Minimal security/deletion records may remain by design.

The preservation check compared **all 149 pre-existing rows and 17 private files**, including file hashes and permissions. They are unchanged. Immutable model/configuration and other-application/network guards match. The database's final logical SHA differs from the task-start hash because authorized QA security/deletion records were added; no stale database was restored over current writes.

The app-scoped backup `stethofuse-20261105T065933Z` captured 37 files: consistent SQLite, private files, frozen models, configuration and the selected Compose contract. Only the app's three containers were briefly stopped; the same containers resumed healthy before encryption/restore verification. The exclusive deployment lock and preservation/backup-idle guards were used.

- Restic full repository/data authentication passed.
- Independent Linux restore matched every file and POSIX uid/gid/mode, SQLite logical state, integrity, foreign keys and confirmed deletions.
- The encrypted Windows archive matched SHA-256 `8aad0149c52101add17eb5d54f06057707e3a56656ab1acadef3afdca1abc934` (5,488,640 bytes).
- Owner-profile DPAPI key recovery, full Windows repository read and a separate Windows restore passed. Every restored file and SQLite integrity/FK check matched. Temporary plaintext restore directories were removed.
- Ten synthetic safety checks rejected traversal, absolute paths, symlinks, hardlinks, special files, corruption, extra files and invalid SQLite.

This is **application data/configuration recovery**, with Linux and Windows copies on the existing owner installation. Required current/previous image recovery artifacts remain separate and preserved. It is not a physical off-device copy, Windows cold-boot proof or combined/shared-host restore. Shared backup verification remains false; no combined backup, unrelated application or VM restart was performed.

## Remaining limits

**Provider-controlled account-email branding.** The current Firebase project rejects both email-body and callback-URL edits with HTTP 400 `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. Read-back confirmed all provider settings remain unchanged. Sender branding is StethoFuse and real recovery works, but the delivered HTML body and action URL remain Firebase defaults. The authorized console browser/native bridge was unavailable. A working supported template-settings path, or a separately authorized server-side action-link/mail integration, is needed to activate full branding. No owner refresh credential was copied to production, and no billing/provider change was made. [Firebase's supported handler contract](https://firebase.google.com/docs/auth/custom-email-handler) and [custom email-link generation](https://firebase.google.com/docs/auth/admin/email-action-links) describe these separate capabilities.

**Physical checks and inbox placement.** A real stethoscope/mobile hardware session has not been certified. Support provider acceptance is proven; receipt/inbox placement at the configured secondary inbox is not independently observed. These are distinct from working browser capture, authentication and support submission. No clinical/regulatory certification is claimed.

## Git checkpoint

Source and documentation are pushed as **ASHRAF-2004** on `feature/forest-world-prototype`, in [PR #12](https://github.com/ASHRAF-2004/StethoFuse/pull/12). Main and existing history are preserved; no automatic merge was performed. The deployed frontend source is the exact commit above. Later documentation-only checkpoints do not imply a different runtime release.

**Repository follow-up, 5 November:** the owner subsequently directed merging without
another permission gate. PR #12 merged into main at 07:53:36 UTC, merge commit
`5c4cb33f78c589bfb69b530ef470c61d5b8cbcfa`. The default repository page now contains
the verified source, README, previews and architecture. The preceding paragraph
records the earlier completion checkpoint, not a current merge restriction.
Custom-mail follow-up status and proof scopes are in [ACCOUNT_EMAIL_DELIVERY.md](ACCOUNT_EMAIL_DELIVERY.md).

Actual GitHub rendering was inspected: the current logo is centered and intact, all eight stack badges and the day/night product preview load. [README](../README.md), [architecture](../ARCHITECTURE.md), [contributor setup](../CONTRIBUTING.md), [security](../SECURITY.md) and [pause notes](../PAUSE_NOTES.md) provide the current entry points.
