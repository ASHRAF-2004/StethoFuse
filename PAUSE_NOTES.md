# Current checkpoint - 1 November 2026

The forest website is **DEPLOYED** at https://stethofuse.ashraf-alsaloul.com/.
Current version: `20261101T000159Z-9f1e35e3ae8c`.
Source: `c766e3774d2edb43af64fd79575c35a5f6fbeb40`.
Web image: `sha256:75e2c9e16ce3006992a5db1d266c55d7087324428fe867a44946cce0fdeede4b`.
Site archive SHA256: `9f1e35e3ae8cc99b3b1aabc3bca88f675d2c4660788764d7e840fa2fea4ddbf9`.

Read [deployment report](docs/FOREST_DEPLOYMENT_20261101.md) and
[frontend notes](frontend/PAUSE_NOTES.md) before continuing.

## Startup flash fixed and deployed - 1 November 2026

The three pale bars were the root React Suspense workspace Skeleton, visible
while the lazy homepage downloaded. The homepage is now in the initial bundle;
the root fallback is empty. Real workspace loading indicators remain intact.
Forest h2 rules are scoped to prevent changing direct sign-in typography.

Cold isolated live loads with 1-second JavaScript delays passed on desktop Night,
desktop Day, 390px mobile and sign-in: no placeholder inserted, no late homepage
chunk, no overflow or page errors. Day/Night public/auth/legal screenshots and
exact source/archive/version passed. Existing missing Firebase config remains.
See docs/STARTUP_FLASH_FIX_20261101.md for evidence and the inspected retry.

## Durable independence - normal website releases

Use only `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/Invoke-OwnerRelease.ps1`:

`status`, then `build -> qualify -> preflight -> deploy -> evidence` for the exact
new version returned by build. Ordinary owner-authorized website releases need
**no Axora message, coordinator image qualification or one-use permission handoff**.
The latest live contrast-fix release completed this entire path independently.
No retry clearance was needed or used for this normal release.

The restricted helper enforces shared deploy.lock, fixed API/worker images,
Compose/data/model/foreign-app/network guards, candidate and rollback archives,
Windows/public endpoint checks, exact web recovery-pin transition and guarded
rollback/pin restoration. No general shell, policy, host, other-app or backup
authority is granted. Failed/unresolved recovery must be inspected, not bypassed.

## Completed and preserved

- Forest composition is the real home route; shared Day/Night styling covers
  public/auth/legal and existing workspace components. Night hero copy is readable.
- Both external-hosted previews and their publishing workflow are removed.
  All four leftover local preview folders were deleted and absence verified.
- Existing approved owl/cursor-follow renderer preserved; live deer idle plays.
  Further deer play/running and owl-flight work remain deferred/unapproved.
- API/web healthy, worker ready; data and foreign-app guards PASS; runtime,
  pointer, Compose workdirs, recovery profile and stable restore path aligned.
- No combined backup/restore, Portfolio or Firebase-provider change was performed.
  Keep current and previous release/image rollback artifacts intact.

## Remaining pre-existing sign-in issue

The previous legal release and this forest release both lack the frontend Firebase
web-app configuration. Login currently displays 'Authentication setup required'.
No provider setting was changed; no credentials or protected account data were used.
The owner has been asked for the approved public web config or a connected console.
There is no available signed-in browser/CLI session here. Do not guess app IDs,
create a new Firebase project, change roles/grants, or substitute a demo login.
Owner status accurately reports `ready_for_users=false` until this is resolved.

## Latest proof and historical failure

Own verification: `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/receipts/20261031T231001Z-forest-owner-verification.json`.
SHA256: `4beaf759e7607ae11ac13ed319a3f46744432cc8c42ff5b5d0d29e629ffee3d0`.
Current owner status was refreshed at SharedRuntimeMigration-20261015/stethofuse-status.json.
Public Day/Night/mobile checks, exact version/source/archive, HTTP200/401 and
normal owl/deer playback PASS. Live authenticated-account operation is not claimed.

The Oct30 attempt of parent `20261030T015416Z-5134043f83bb` rolled back safely.
Its failed endpoint detail was not recorded. The repaired client now saves
per-check diagnostics, requires all5 checks in one fresh sweep and has bounded
90s retries/100s outer timeout within the guest150s wait.37 helper and9 client tests
passed. The inspected one-use retry succeeded for the parent at07:00MYT Nov1;
the final contrast-fix release succeeded normally at07:07MYT. Original failed
checkpoint/archive remain preserved. Do not replay that consumed clearance.

Axora was ACKed with the actual proof and deployment result; routine independent
review is informational and is not a release-permission dependency.
