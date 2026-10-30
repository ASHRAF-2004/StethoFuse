# Pause checkpoint — forest website rollout, 30 October 2026

Latest owner instruction: deploy the approved enchanted forest to
https://stethofuse.ashraf-alsaloul.com/ across the whole site. No further deer
animation work now. Weekly allowance is low: prioritize completing the release,
then scoped cleanup, not more studies or visual variants.

## Implemented

- Approved forest composition now supplies the real `/` route through
  `src/forest-prototype/ForestLanding.tsx`, inside the existing router.
- Shared forest Day/Night tokens, fonts, surfaces, scenery and theme preference
  apply to public/auth/legal pages and the existing authenticated workspace.
  Legacy persisted `frost`/`midnight` enum IDs remain for compatibility; visible
  workspace choices are Forest Day / Forest Night. Authentication/access behavior
  and data/model/backend code are preserved.
- Current generated deer idle retained; running/playing and owl flight deferred.
- Removed obsolete winter/reference/woodland skins, old landing implementation,
  animation demo entry points, rejected mesh/flight blockout and the external
  hosting packaging script. Historical evidence/source studies remain for future
  animation work; do not delete production/rollback/model/data artifacts.
- Both external copies z-RTdatCrcDn and cKv1gc1c9uBF were deleted through the
  service API; both returned ok:true. Never publish another third-party preview
  for this project. Historical external URLs are obsolete.

## Verification / release

Production and TypeScript build pass. Focused isolated browser checks cover
Day/Night home, login, register, privacy and terms, a synthetic demo workspace,
and mobile login, without page errors or horizontal overflow. Screenshots were
inspected and the lost cursor positioning hook was repaired. Evidence:
`frontend/evidence/forest-site-rollout/`. These are not proof of authenticated
live-account operation or owner visual approval.

Use only `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/Invoke-OwnerRelease.ps1`.
Every exact NEW image still needs coordinator-owned recovery qualification before
restricted preflight/deploy. Do not bypass the guard or write policy. No new owner
permission is needed for the selected website deployment. Record the actual
build/version/preflight result below before stopping; never call staging live.
Current production was last confirmed as 20261028T101829Z-7d4501b7cd84.

No backup, Firebase configuration, protected data/model/T9, Portfolio, Axora policy
or host/VM/network change is authorized. No heavy generation workers are required.

Final release candidate and exact blocker are recorded in `../PAUSE_NOTES.md`.
Selected version is20261030T015416Z-5134043f83bb; NOT deployed. Recovery qualification
is required for web ef3b38fd. Both external copies and the publishing workflow are
removed. Four ignored output copies remain because automatic approval review
blocked recursive deletion; no other cleanup should risk the release/data evidence.
