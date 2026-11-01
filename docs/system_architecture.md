# Current StethoFuse architecture

Updated 1 November 2026. This document describes the deployed React/API/worker
system. The original template-based prototype remains historical source; it is
not the current production interface.

## Browser and web service

React 19, TypeScript and React Router provide the public listening studio, account pages
and protected workspaces. Vite produces static assets served by the dedicated
web image on the existing public origin. Route refreshes use the SPA fallback.
The home route is eager so no unrelated workspace placeholder flashes at startup.
Other page bundles remain lazy. Chillax supplies Latin typography and IBM Plex
Sans Arabic supplies Arabic. Fonts are self-hosted with their license/source
records. A simple solid split-signal mark is shared by navigation and account
pages; the favicon has an opaque mint tile for dark/light browser chrome.

The former forest and deer scenes are inactive historical source. The approved
snowy pointer-following owl is preserved with the same textures, meshes and
connected-neck renderer, anchored to the listening desk. No flight sequence is
active. A real synthetic Web Audio sample demonstrates track selection without
claiming model output. Public, account and role pages share white/charcoal/mint
tokens, logical layouts and persistent English/Arabic language controls. Document
language/direction and saved appearance are set before React paint. User-authored
names, notes and resource titles remain raw. Time axes and identifiers stay LTR.
The optional resource gate waits only for hero/fonts and is bounded to 2.5 seconds;
content and account forms do not wait for the pointer texture set. Reduced motion
skips decorative motion. React and identity vendors are separately cached bundles.

## Identity, roles and private access

Firebase SDK handles email/password and Google identity. The existing approved
public web configuration is required both at build time and at runtime. The
shared pure validator pins the existing project and approved auth domains;
a normal production build fails before bundling if configuration is missing or
incorrect. Deployment keeps the existing public settings in the local ignored
frontend `.env.production.local`; its durable public-only copy is under
`OwnerRelease/public-web-config.json`. Neither contains Admin credentials.

Firebase proves identity; FastAPI independently verifies tokens and current
provider/account state. SQLite supplies application roles and explicit resource
grants. Email verification is required for protected workspace access. Healthcare
Staff, Audio Analyst and Administrator share sign-in, but have distinct server-
authorized capabilities. Administrator is not an unrestricted audio-reader role.
There is no production role selector or demonstration authentication fallback.

The Firebase SDK uses browser-session persistence. This is not an HttpOnly or
XSS-proof session. Tokens are not added to media URLs. Same-origin protected
media requests use the API client and render authorized blobs. Authenticated
account changes clear the prior account's visible state. Existing profile names
and all server-issued roles remain authoritative; only an empty initial personal
display name can be initialized from the user's chosen provider profile name.

## API and persistence

`app/m1/api.py` exposes the current FastAPI routes. SQLite stores accounts,
recordings, jobs, grants, reviews, preferences and safe operational audit state.
Private WAVs and outputs are filesystem resources, served only after per-resource
authorization. Database and private-media paths are explicit, separate from
public source/static files. Private directory permissions fail closed.

The React adapter uses `src/data/live.tsx`, `api.ts` and `liveTypes.ts`. The
`src/frost/` directory is the established live component implementation; its
historical directory name does not select an obsolete production theme.

## Recording and separation

1. Upload a mono/stereo PCM WAV, up to 25 MiB and two minutes, or explicitly start
   browser microphone capture. AudioWorklet captures PCM; the microphone stops
   before preview. Nothing is saved until the user chooses Save.
2. The API validates and stores the original privately with an immutable resource
   identity and metadata. The original is not replaced by processing output.
3. Separate creates a durable queued job. The single production worker owns its
   worker lock, reads only its queue, canonicalizes audio and runs the frozen
   CPU separator. The API does not spawn inference inside a request.
4. Heart and lung outputs become independently protected WAV resources, linked
   to their source, job, model version and processing provenance.
5. Users compare tracks, inspect waveforms and share explicitly. Review requires
   an assigned analyst and an explicitly scoped original/result. Role alone
   does not grant another account's audio. Revocation is enforced by the API.

The frozen v2 checkpoint, specification and original worker image are unchanged.
T9 remains consumed held-out evidence and is never used for design or QA audio.
New acceptance generates synthetic PCM in temporary storage. Valid pipeline
output is not evidence of clinical accuracy or a diagnostic claim.

## Deployment and recovery

The existing OwnerRelease wrapper packages the committed frontend and applies
build -> qualify -> preflight -> deploy -> evidence under the real shared lock.
API/worker image pins, Compose/network/data/model guards, prior recovery images
and automatic rollback remain enforced. Normal authorized web releases and any
necessary inspected recovery happen in the current owner conversation. No Axora
terminal or HOST_PLAN approval is required. Other applications and combined
backup/restore remain outside a website release.

## Verification boundaries

Real disposable Firebase registration/sign-in and the verification gate are
checked separately from isolated role/API tests. Staff/analyst/admin screenshots
use fictional test identities and responses from an actual temporary API database;
they do not certify a production privileged-account login. A separate isolated
worker test runs real frozen-model inference on generated PCM, verifies finite
4-kHz heart/lung outputs, protects the original and checks production preservation.
Google configuration/authorized origin can be checked without completing consent.
Inbox delivery, clinical suitability and real-device audio quality are not
established by HTTP health, automated accessibility tests or synthetic inference.
