# Support and listening follow-up — 1 November 2026

This change preserves the listening-studio design and the approved owl. It does
not revive the forest/deer/flight studies or change authentication providers.

## Visible changes

- Arabic mirrors the approved owl poster/canvas. Pointer yaw also reverses, so
  the mirrored head still follows the actual pointer. The perch anchor mirrors
  with the artwork; the original textures, meshes and eyes remain unchanged.
- Shared footer credit reads © 2026 Designed and developed by: Ashraf Ali
  Hussain Al-Saloul. Arabic uses the owner's approved name أشرف علي حسين الصلول.
- Support is a real page with inline validation, preserved error-state input,
  explicit provider acceptance and a reference. It sends through Cloudflare to
  the existing verified owner destination, with the visitor as Reply-To.
- Google sign-in uses Google's original downloaded gradient mark, unmodified,
  on a white tile in either appearance. Source attribution is in
  `frontend/public/brand/GOOGLE_SOURCE.md`.
- The homepage's synthetic example is replaced by a fixed eight-second excerpt
  of HLS-CMDS v3 M0111. The heart/lung files are actual outputs from the frozen
  production model, not source targets or fabricated waveforms. All three files
  share the same excerpt and playback gain. Provenance and CC BY 4.0 attribution
  are included next to the assets. This eligible development-set clinical-manikin
  recording is a demonstration, not independent validation or T9 material.
- Password recovery remains one Firebase flow. Unknown-address acknowledgement
  is generic, provider language follows English/Arabic, trailing-slash auth URLs
  stay in the real provider flow, and transient reset failures leave the form
  available for a retry. Expired/invalid links still fail closed.

## Verification

Production-file isolated browser checks: 94 public checks, 32 accessibility
states, zero detected accessibility violations/page errors/failed assets.
Focused follow-up: four Support locale/appearance states, two recovery-language
states, three real packaged audio decodes/hashes and two pointer/mirror states.
Support and Firebase requests are intercepted in this focused suite; it sends
no email and changes no user account. It verifies unknown-account generic
acknowledgement and recovery after a transient provider error.

Ten Worker tests cover fixed addresses, HTML escaping, origin/body validation,
injection, limits, provider failure and template placeholders. The live
Cloudflare Support health endpoint returned 200; one explicitly authorized HTML
test returned provider acceptance 202. Its destination inbox is not the connected
Gmail account, so Support inbox receipt remains unobserved.

The actual frozen-model forward pass used one public dataset recording, bounded
CPU threads and the shared deployment lock, with preservation checks before and
after. No queue, recording database, private files, model, credential or unrelated
application was changed. Operational receipts are retained outside source in
`OwnerRelease/mail-work`; public provenance contains no workstation paths.

## Account-mail status and credentials

Branded Firebase account-email HTML is prepared in
`services/stethofuse-support/templates`. The owner completed official CLI Google
login, now retained outside source with owner/System/Administrators-only Windows
ACLs. `OwnerRelease/Invoke-FirebaseAdmin.ps1 -Action status` works from any folder.
The browser-control host remains unavailable, but authenticated administration
works through the official CLI library. No private key or token is in source.

Firebase rejected both the full reset HTML and a minimal greeting change with
HTTP 400 `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. Verification-body customization
was ignored on read-back. Only supported sender names were branded StethoFuse;
all three original HTML bodies and unrelated configuration remain intact. Full
account-email body branding is provider-blocked; prepared HTML is not active.

A unique alias in the connected owner's Gmail inbox received both task-only
verification and reset HTML emails with SPF/DKIM passing. The actual verification
link and reset were consumed, sign-in with the new password passed, and reuse of
the reset link was rejected. The disposable Firebase identity was deleted; no
application API/database was touched and no existing account was reset. Only
these two test messages were read. Action codes and passwords are absent from
the published proof. This establishes functional mail/recovery, with the body
branding limitation above recorded separately.

The Firebase browser configuration identifies the public app; it is not an
administrator secret. Replacing Firebase would require a separate account/session
migration and is not part of this follow-up. Reusable local admin authentication
can remove repeated manual setup without changing existing user accounts.

Deployment and immutable live evidence are recorded in PAUSE_NOTES after release.

Live success-state review also caught a browser-default restart button and a
short-page footer gap. The existing shared ghost Button now styles the restart
action. A scoped flex layout keeps the Support footer at the viewport bottom;
the navigation's minimum inline size is constrained so Arabic mobile reflow
matches the original layout. The focused suite checks all four success states
again at desktop width and verifies that a new message clears subject/body while
preserving the visitor's name.
