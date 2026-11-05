# Product interface and readiness release — 1 November 2026

Owner-requested release; deployment identity and receipts are appended after the
guarded deployment. This replaces the missing-config and outdated interface
checkpoint, not the frozen ML model or protected application data.

## Delivered source

- Shared smooth owl-head mark, SVG/32px PNG favicon and Apple icon. The opaque
  pale favicon tile remains legible on dark or light browser chrome.
- Source Sans 3 product typography, Lora editorial/brand typography, self-hosted
  font subsets and their licenses; coherent Day/Night material and focus states.
  Scoped font rules prevent lazy legacy stylesheets overriding public typography;
  tests assert the actual rendered font. Saved/system appearance is applied by
  a tiny same-origin script before React, preventing a bright dark-mode startup.
- Centered sign-in, sign-up, recovery and verification surfaces, useful account
  copy, header theme control, linked field errors and keyboard password controls.
  Verification sign-out returns to sign-in; anonymous verification visits also
  return to sign-in. The ineffective long-term remember-me checkbox has been removed; actual
  Firebase session behavior is unchanged.
- Existing approved public forest/characters preserved, with an interactive,
  explicitly illustrative original/heart/lung waveform explainer. It uses no
  patient audio, model output or clinical interpretation.
- Staff, analyst and admin workspace styling, role-aware sidebar label, readable
  tables, useful help, footer links, mobile navigation and OS-aware search hint.
- Existing real microphone recorder integrated into the current workspace. It
  requests permission only on Start, releases tracks before review, supports WAV
  preview/save and gives a file-upload alternative. The AudioWorklet is emitted
  as a same-origin JS asset, not an inline data URL.
- Signup names initialize only an empty personal application profile. Existing
  names and server-issued roles are preserved; optional name-save failures do
  not replace valid sessions, and security/session failures still propagate.
- Existing approved Firebase public settings recovered from the protected runtime
  configuration and provided to the web build. No provider/project/role was
  replaced. The build now fails closed on missing/foreign public configuration.
- Compatible dependency security updates: Vite 8.3.5, patched gRPC/re2 transitive
  versions. Final npm audit has no reported vulnerabilities.

## Verification completed before deployment

- TypeScript/Vite production build and actual fail-closed configuration test.
- 30 public/auth/legal theme/viewport checks; centered forms and no overflow,
  failed artwork/font assets or page exceptions.
- 88 staff/analyst/admin route/theme/mobile checks using test identities and real
  isolated API response snapshots; no unknown API paths or page errors.
- 28 WCAG-tagged automated audits, zero violations after fixing Night legal-page
  surfaces and admin reference-text contrast. Manual screenshots/keyboard checks
  supplement the audit; this is not a WCAG certification.
- 16 homepage viewport/theme checks from 360 to 2560 CSS pixels, with branch/claw
  registration within two pixels. 12 zoom-equivalent reflow checks (67–200%).
  These emulate layout viewport changes, not the native Brave zoom control.
- Native AudioWorklet capture using generated microphone input, real WAV review,
  track cleanup and separately simulated denied-permission UI behavior. Physical
  microphone/stethoscope quality is not claimed by the generated-input test.
- Real Firebase email/password signup/sign-in with a disposable unverified QA
  account, verification-page gating and immediate deletion. No verification email
  was sent. Existing public origin authorization and Google auth-URI availability
  pass; actual Google consent and inbox delivery are not claimed.
- Real API in a temporary Linux database: staff/admin/analyst accounts, synthetic
  PCM upload, anonymous/other-user denial and exact-resource analyst grant.
- Real frozen worker in temporary storage: synthetic upload/queue/separation,
  distinct finite 4-kHz heart/lung WAVs, unchanged original/model and production
  database/private/foreign guard preservation. One inference thread; no T9.
- Initial profile tests: empty name initialization, existing-name preservation,
  optional-save failure without losing a valid identity, no role mutation.

## Evidence and retained backup

Local browser outputs: `frontend/evidence/product-polish/`.
Safe operational/model proofs: `OwnerRelease/readiness-review/`.
One homepage source backup: `OwnerRelease/backups/homepage-before-product-polish.zip`.
Original deployment rollback archives are operational recovery artifacts and are
preserved independently. No external preview, Portfolio deployment, production
role grant, combined backup/restore, model training or shared-host restart is part
of this release.

## References used

Reviewed Anime.js documentation, PromptMotion, MotionSites and the supplied
six-page anatomy-guide PDF. The useful ideas are restrained purposeful motion,
clear interaction feedback and a truthful technical explainer. The five supplied
Figma Community skill URLs could not be read because the service blocks automated
access here; those exact skills were not executed. Interface, contrast, motion,
keyboard and layout reviews were performed directly in the browser instead.

Actual visual acceptance remains the owner's judgment on the deployed website.
This is a research/education workspace, not a diagnostic product. Existing legal
notices retain their draft/owner-review qualification; no compliance claim is made.

## Final deployment and live verification

Deployed version: `20261101T043654Z-a5613657b3cc`. Source: `2c0d4dc5e4a341f4843dd403969adcd99e17e99a`.
Web image: `sha256:d62e6bf5b7edbbe88254ad14419eaa1b574bab4b72ea73589342adcec2924710`.
Archive SHA256: `a5613657b3ccdd3e83f05e34366ad12785d6d29b3f44933b1159989c97f6b62c`.
Owner proof: `C:/Users/thalt/StethoFuseDeployment/OwnerRelease/receipts/20261101T044722Z-product-owner-verification.json`.
Proof SHA256: `d07c2a84e06adeb90912064243e830f18f4c3856987950c1cfff852bdbe6134d`.

Actual published font assertions, centered forms, responsive anchors, keyboard
validation, favicon, pre-React appearance and delayed startup checks PASS. Real
provider signup/signin/sign-out, verification gate, production403 for an
unverified identity and immediate QA-account deletion PASS. Live identity,
health200/auth401 and preserved deployment guards PASS. No exceptional retry
clearance was used. Earlier same-session design/sign-out releases are superseded
by this current version; their normal immutable receipts remain retained.

The current owner status reports readiness for research/education use, with the
explicit testing boundaries above. It does not certify clinical use, legal
compliance, inbox delivery or a real privileged production-account session.
No combined backup/restore was invoked or certified.
