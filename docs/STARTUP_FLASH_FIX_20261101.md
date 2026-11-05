# Startup flash correction - deployed 1 November 2026

Live: https://stethofuse.ashraf-alsaloul.com/
Version: `20261101T000159Z-9f1e35e3ae8c`
Source: `c766e3774d2edb43af64fd79575c35a5f6fbeb40`
Web: `sha256:75e2c9e16ce3006992a5db1d266c55d7087324428fe867a44946cce0fdeede4b`
Archive: `9f1e35e3ae8cc99b3b1aabc3bca88f675d2c4660788764d7e840fa2fea4ddbf9`

The screenshot showed the root Suspense workspace Skeleton during the lazy
homepage download. Delaying that exact route chunk reproduced the three bars.
Importing the homepage in the initial bundle removes the route waterfall;
`fallback={null}` removes the unrelated workspace placeholder at root startup.
Inner workspace loading indicators remain. Two forest heading rules were scoped
to `.forest-world` so eager CSS does not enlarge sign-in headings.

TypeScript/Vite build passed. Isolated live desktop Night/Day, mobile Night and
sign-in cold loads with 1000ms JavaScript delays recorded no Skeleton insertions,
no deferred homepage chunk, no overflow and no page errors. Separate live checks
passed twelve public/auth/legal/theme/mobile combinations, exact version/source/
archive, health200/auth401 and no failed assets. Actual screenshots inspected.

The initial deployment safely rolled back: Windows loopback candidate checks
passed, but sandboxed public HTTPS checks repeatedly returned WinError10061.
The unchanged client immediately passed all five baseline checks with network
access. Same-session inspected recovery verified the original checkpoint/archive,
data and foreign baseline, then issued one distinct bounded retry slot. The same
candidate was successfully deployed with network access; all checks remained
mandatory. Original failure, checkpoint and archive were retained. No helper or
client code, provider, other application or backup was changed.

Owner proof: `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/receipts/20261101T000806Z-startup-owner-verification.json`
SHA256: `dfe70ae133846b4cb57feb1ce2c190c31de47aca1c960aa1a8e987676eebc2fd`
Runtime/profile/workdirs/stable restore aligned; API/web healthy, worker ready;
data preservation and foreign guards passed. Only web image/pin changed.
Firebase public web-app configuration is still missing: `ready_for_users=false`.
Anonymous401 does not prove real sign-in. No combined backup/restore was run.

Browser evidence (ignored local artifacts):
- `frontend/evidence/startup-flash/baseline/`
- `frontend/evidence/startup-flash/fixed-live-20261101T000159Z-9f1e35e3ae8c/`
- `frontend/evidence/forest-site-rollout/production-20261101T000159Z-9f1e35e3ae8c/`

No main merge or push performed. Documentation-only commits after the source
commit do not require rebuilding the identical website.
