# Forest deployment and self-service release checkpoint

The forest website is live at **https://stethofuse.ashraf-alsaloul.com/**.
The final contrast correction deployed at **1 November2026,07:07MYT** through
the ordinary owner path, without a coordinator image qualification or retry clearance.

| Item | Current value |
|---|---|
| Version | `20261031T230523Z-3516baada0c9` |
| Source | `f32fb614db16e95bee1637d31072459c6eb7b90a` |
| Web | `sha256:907aec9f97daca471d644878b61c2002465df75a6d21ee30be7d24ef1a3a5cdb` |
| Site archive | `3516baada0c9a43b9def18ff50cb69ec4639a395e1821e6c31dd7713e613aa40` |
| API, unchanged | `sha256:33b257a5dbacebe7776326732ce88f596058694bbdf24410b095644171150f56` |
| Worker, unchanged | `sha256:df4b5cfec7ef525c599c52773ed2c6cf5c26753b13f0e6c4d5962ab0af4dfde4` |
| Current recovery policy | `d63ee301200df1cff146bf42052cee35bdb6a73f38622eb25378a46908f538e5` |

## What is deployed

- Approved connected forest landing composition on the actual `/` route.
- Shared forest Day/Night styling for public, authentication, legal and workspace
  components; Fraunces and DM Sans; readable footer links and Night hero text.
- Approved owl identity and cursor-follow renderer. Current generated deer idle;
  further playing/running and final owl flight remain deferred/unapproved.
- Retired winter/reference/woodland theme layers and animation demos removed.
  External preview copies, publishing workflow and four local preview folders removed.

Authentication, API/worker pins, roles/grants, protected files, model, database,
Portfolio and host/VM/network settings were not redesigned or reconfigured.

## Durable owner release path

Read `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/README.md`.
Ordinary authorized website releases now use:

```powershell
.\Invoke-OwnerRelease.ps1 -Action build
.\Invoke-OwnerRelease.ps1 -Action qualify -Version '<returned-version>'
.\Invoke-OwnerRelease.ps1 -Action preflight -Version '<returned-version>'
.\Invoke-OwnerRelease.ps1 -Action deploy -Version '<returned-version>'
.\Invoke-OwnerRelease.ps1 -Action evidence -Version '<returned-version>'
```

No Axora message, manual coordinator recovery qualification or one-use permission
handoff is required for normal web releases. This was demonstrated by the current
release, including candidate recovery qualification and web-pin transition.
The interface accepts an exact root-built version, not arbitrary scripts/policy.
Shared lock, frozen API/worker/Compose, data/model/foreign-app/network checks,
candidate and rollback image verification, exact endpoint proof and guarded
runtime/pin rollback remain enforced. No general shell or backup authority exists.

## Interrupted parent deployment and repair

The October30 parent deployment `20261030T015416Z-5134043f83bb` rolled back with
`WINDOWS_OR_PUBLIC_ENDPOINT_FAILED`; previous runtime and web pin were restored.
The precise failed endpoint was not recorded and cannot honestly be reconstructed.
Current baseline checks all passed when work resumed.

The repaired Windows client independently records each endpoint, requires all5
checks in the same fresh sweep, retries within90s, and has a100s outer process
timeout within the guest150s deadline. Failed proofs are retained by the guest.
37 helper tests and9 client tests passed. An inspected, expiring one-use retry
used a separate protected slot while preserving the original checkpoint/archive.
The parent retry succeeded at07:00MYT. That exception is consumed and must not be
replayed. The final contrast correction then completed the normal path without it.

Authoritative setup/repair proofs in SharedRuntimeMigration-20261015:

- `stethofuse-web-self-service-20261030.json`, SHA256
  `91366f9ff1cc3e863a90a26866e63b85c0c3da0c95c992aaa8cb0de64ba1b775`.
- `stethofuse-postrollback-retry-20261101.json`, SHA256
  `6041c6ceadb3317ac958c38ef105f4ba25aadd032222968fb845893a526eed2c`.

## Runtime, preservation and visual evidence

API/web healthy; worker ready. Runtime images, current release pointer, Compose
workdirs, recovery profile and stable dedicated restore pointer align.
SQLite logical SHA256 remains
`27a8e618b7f3bc24e7e64f7f8ca1dc8700d9a590697688a06f170dae7176eb96`.
Guarded data preservation PASS; foreign-app/network guards unchanged.
Verified current previous-web archive SHA256:
`c2dd79e99fa6ed1cbe97d6312a42cb52ed7ffb0ecb1fbb30f3c06a0e593b1e82`.
Keep all recovery artifacts; no combined backup/restore was invoked or certified.
`ready_for_coordinator_backup=true`, `shared_backup_verified=false`.

Public and Windows health/auth/version checks pass, with exact source/archive
identity. Isolated live browser checks cover Day/Night home, login, register,
privacy and terms, plus390px home/login: no page errors, failed assets or horizontal
overflow. Screenshots were inspected directly. Normal-motion check confirms the
approved connected-neck owl renderer,19 deer redraws in750ms and greeting playback.
Night hero computed color is `rgb(210,225,215)`. Full browser zoom and physical
device/Safari acceptance are not claimed by this checkpoint.

Evidence: `frontend/evidence/forest-site-rollout/production-20261031T230523Z-3516baada0c9/`.
Owner receipts under `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/receipts/`:

- `20261031T230534Z-build.json`
- `20261031T230627Z-qualify.json`
- `20261031T230640Z-preflight.json`
- `20261031T230722Z-deploy.json`
- `20261031T230747Z-evidence.json`
- `20261031T230747Z-status.json`

Deploy and root evidence objects match exactly. Own consolidated verification:
`20261031T231001Z-forest-owner-verification.json`, SHA256
`4beaf759e7607ae11ac13ed319a3f46744432cc8c42ff5b5d0d29e629ffee3d0`.
Own status was refreshed without writing HOST_PLAN/axora-status. Previous status
snapshot and immutable receipts are preserved. Axora was sent the actual setup/
repair ACKs and latest release proof; independent review is not a deployment gate.

## Pre-existing sign-in configuration limitation

Live visual inspection exposed 'Authentication setup required'. The old legal
archive and both forest archives contain no frontend Firebase API key or web-app
ID; the issue predates this rollout. Existing backend health reports its provider
configured, but that does not supply the public client config needed by the SDK.

There is no local approved web config, authenticated Firebase CLI or connected
browser surface available. A read-only check of the project's public Hosting
initialization endpoint returned404. No Firebase project/app/provider/role/grant
was created or changed. No credentials were entered and no private account was
accessed. The owner has been asked for the existing public apiKey/authDomain/
projectId/appId or a connected console. Do not guess or substitute demo login.

Owner status therefore accurately reports **ready_for_users=false**. Public pages
and shared styling are deployed; successful real-account sign-in and authenticated
workspace operation are not claimed. This configuration issue must be resolved
before asserting full user readiness.

Source and pause notes are on `feature/forest-world-prototype`, owner identity
ASHRAF-2004. No main merge, force push or Git push was performed. Documentation
commits may be newer than the immutable deployed source. No heavy worker remains.
