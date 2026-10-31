# Current checkpoint - 1 November 2026

The forest website is **DEPLOYED** at https://stethofuse.ashraf-alsaloul.com/.
Current version: `20261031T230523Z-3516baada0c9`.
Source: `f32fb614db16e95bee1637d31072459c6eb7b90a`.
Web image: `sha256:907aec9f97daca471d644878b61c2002465df75a6d21ee30be7d24ef1a3a5cdb`.
Site archive SHA256: `3516baada0c9a43b9def18ff50cb69ec4639a395e1821e6c31dd7713e613aa40`.

Read [deployment report](docs/FOREST_DEPLOYMENT_20261101.md) and
[frontend notes](frontend/PAUSE_NOTES.md) before continuing.

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
