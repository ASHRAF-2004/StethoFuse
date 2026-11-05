# Product-first redesign — 1 November 2026

The owner rejected the forest implementation and its later cosmetic polish. The
only required visual carry-over is the snowy owl and approved pointer-following
surface. The previous functional proof was not visual acceptance.

## Diagnosis

The old page gave most of its pixels to a landscape, not the recording workflow.
The stretched vertical composition hid content behind scroll reveals, used tiny
copy at desktop scale, and made the character animation more prominent than the
tool. A traced multi-detail owl/stethoscope mark lost its idea at favicon size.
Passing layout and service checks did not address these problems.

The three supplied Arabic sites were opened in isolated browsers and captured.
Their useful lessons are subject-specific, confident typography; a single hero
object; limited colours; and a clear action. Their long scroll holds, animation
delays and assets are not being copied. Their custom Arabic font is not being
redistributed. Use a licensed Arabic family and real RTL flow instead.

## Subject inventory and argument

StethoFuse has one original chest recording, two separated audio components,
time-aligned comparison, explicit sharing, research boundaries, an existing snowy
owl with green eyes, private media and staff/analyst/administrator roles. It does
not have diagnostic accuracy claims, customer testimonials or pricing to invent.

- Hero: explain separation; prove it with an interactive synthetic sound desk.
- Workflow: capture, separate, compare; show the real interaction vocabulary.
- Privacy: originals remain linked and sharing is explicit; show role boundaries.
- Questions: state supported file/account/research constraints plainly.
- Footer: make legal/help/language links easy to find.

## Chosen direction

Taste draw seed 1522392700: One motif; greys/mint, tabbed folder composition.
App draw seed 1096764757: framed sheet. The split source becomes the repeating
identity: two broad sound arcs in the mark, two output lanes in the desk, paired
controls in comparison. This is a real listening tool, not a fantasy setting.

White/grey/charcoal are the base; mint identifies heart and a restrained blue
identifies lung. Dark mode uses the same geometry. Chillax is the Latin family;
IBM Plex Sans Arabic is the Arabic family. No forest/deer/flight clips ship on
the new page. No invented data are presented as a model output: the public
listening sample is explicitly synthetic.

## Review gates

Inspect the approved owl's complete source-pose set, alpha edges on light/dark
backgrounds and rendered yaw/pitch transitions. Keep texture/mesh hashes fixed.
No replacement flight animation. Review new logo at 16/24/32/64px in one colour,
reverse and real app contexts. Review 360/390/768/1024/1440/1920px, English/Arabic,
light/dark, keyboard, loading/error/empty/content states and reduced motion.
Capture and inspect actual screens repeatedly. Keep real auth/data/ML policies
and the guarded deployment path. One current-homepage source backup only;
operational current/prior image archives are retained separately.

## Implementation and visual corrections

The new entry is `frontend/src/studio/StudioLanding.tsx`. The landscape/deer/flight
imports were removed from the active homepage. `ListeningOwl.tsx` uses the exact
existing connected-neck surface and textures, with a fixed aspect-ratio contact
anchor and no flight. Its 18 source poses were inspected on light/dark backdrops;
80 distinct pointer positions and enlarged alpha edges were captured. The art
files, `owlSurface.ts`, `owlCanvasSurface.ts` and `OwlEyeMaterial.tsx` are unchanged.

The listening desk synthesizes an eight-second illustration locally using Web
Audio. It has real playback, source selection and scrubbing; it never uploads
anything or pretends to be a model result. Playback cancels prior sources and
cleans up on unmount. The existing protected waveform/review/recording workflows
retain their API and privacy contracts.

Three vector logo concepts were constructed and tested. The selected split-signal
mark has two filled paths, 18 anchors and no raster, mask, filter or tracing. Its
small-size and reversed tests are saved with the source files. The independent
horizontal SVG contains outlined letterforms. Assets are under `public/brand`.
The favicon has a mint tile so it remains visible in dark/light browser chrome.

Chillax and IBM Plex Sans Arabic are self-hosted. English/Arabic is persistent,
sets real document language/direction before paint, preserves form values on
switching and keeps signal time axes/IDs left-to-right. User-authored names,
recording titles and notes are not translated. The locale layer does not remount
the identity provider, alter role enum values, or change API payloads.

The shared workspace uses a neutral frame and flat working sheet. Actual screen
review caught and corrected an inherited night sidebar, a stretched empty-state
icon, fixed-nav footer clearance, input icons outside their fields, a floating
footer box and a visible unfocused skip link. The obsolete public stylesheet was
replaced. This is why build/a11y checks alone were insufficient for visual review.

The resource gate waits only for the hero poster/fonts, appears after 200ms and
is bounded to 2.5s; reduced motion skips it. Optional pointer assets load apart
from the form/content. Cached React/identity chunks replace the previous single
655-KB chunk; the application chunk is about 248KB uncompressed. No third-party
preview deployment or hosting workflow was used.

## Reproducible checks and evidence

- `npm test`: builds, opens a disposable loopback production-preview server and
  runs the bilingual public/interaction/accessibility suite. Screenshot output is
  ignored under `frontend/evidence/design-reset/automated`.
- Public checks include eight widths 360–2560, both appearances/languages, owl
  anchor agreement, actual fonts, input-icon containment, centred forms, full
  footer width, language/form preservation, playback, FAQ, workflow keyboard and
  mobile navigation/password controls.
- 176 isolated role route/layout checks passed without page errors or unknown
  API calls. They use captured temporary-API fixtures and fictional SDK identities,
  not privileged production accounts. No production role grants were created.
- The fail-closed public Firebase configuration tests passed, including an actual
  production build rejected for an unapproved project before bundling.
- The Taste browser inspection has no objective layout/contrast failures after
  correction. Two explicit subject-based exceptions avoid a quota of unrelated
  photos/video and automatic ornamental motion: this tool shows its own working
  interface and the owner-preserved pointer owl. Font-size variety inside the real
  UI fragments is intentional. Pointer playback was separately recorded.

Reference captures: `frontend/evidence/design-reset/references`.
Owl pose/alpha/video evidence: `frontend/evidence/design-reset/owl`.
Logo construction/scale tests: `frontend/evidence/design-reset/brand`.
Role screens: `frontend/evidence/design-reset/roles`.

The owner's direct implementation/deployment instruction controls this work; no
design-approval pause, extra terminal or Axora handoff is required. The same exact
image/lock/preservation/rollback checks still apply. A passing inspection is not
an assertion of mathematical perfection or a medical/compliance certification.

## Final deployed checkpoint

Deployed `20261101T094243Z-42e08b861fc8` from `54200a3acd518f5e8a332068f3a9744f8fafb46f` to
https://stethofuse.ashraf-alsaloul.com/. Web image `sha256:5300f38bc5d88e527ffc0827b58536bd155ed6760ce6c48c2a4f5754039d641b`;
site archive `42e08b861fc879a91007f67226d05c664282c1be91bc829959053eef463741e4`. The first rebuilt release was followed
by a small corrective release for workspace rendering and accessibility.

| Check | Result |
| --- | --- |
| Public layout/interaction checks | 86 passed |
| Public accessibility states | 28, zero detected violations |
| Fictional private-role route/layout checks | 176 passed |
| Private-role accessibility states | 124, zero detected violations |
| Real browser zoom cases | 48 passed, 67–200% |
| Slow-start states | Four passed; no old skeleton/stuck gate |
| Real provider signup/sign-in/gate/cleanup | Passed |
| Exact live version/source/archive/scripts | Passed |
| API/web health, worker readiness, data/foreign preservation | Passed |

The private audit additionally found invalid definition-list children, an
unlabeled unread dot and insufficient identifier contrast. Their semantic/colour
corrections passed the repeated audit. Enlarged/native screenshot review caught
the owl perch drawn over its claws and a weak light-mode fallback avatar; both
were corrected. Native CDP screenshots were used for actual page zoom because
Playwright's full-page capture clips at changed browser zoom. The page itself
has no measured overflow and remains centered in the native captures.

Actual browser zoom uses the documented
[Chromium tabs.setZoom API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-setZoom)
through a disposable isolated extension/profile; the user's browser is untouched.
Every profile is removed after its browser closes.

Current evidence is under `frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8`:

- [English Day hero](../frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8/hero-en-day.png)
- [English Night full page](../frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8/home-en-night-1440.png)
- [Arabic Night hero](../frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8/hero-ar-night.png)
- [Arabic mobile Day](../frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8/home-ar-day-390.png)
- [Mobile Night login](../frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8/login-en-night-390.png)
- [Actual 67% browser zoom](../frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8/actual-browser-zoom-67-day.png)
- [Actual 200% Arabic login](../frontend/evidence/design-reset/live-20261101T094243Z-42e08b861fc8/actual-browser-zoom-200-ar-login.png)

The actual live identity, startup, script and pointer checks are in
`finish-checks.json`; real zoom measurements are in `browser-zoom.json`; actual
provider boundary/cleanup proof is in `real-auth.json`. Role screens and final
audit are in `frontend/evidence/design-reset/roles-a11y-fixed`. The exact approved
owl files match the prior deployed source byte-for-byte. No flight-quality claim
is made; no replacement deer animation is active.

Owner proof: `C:\Users\thalt\StethoFuseDeployment\OwnerRelease\receipts\20261101T095920Z-studio-owner-verification.json`; SHA256 `27e1e7f334988ea5613d4a6e2b8733944c53c7bb7e3ec5906fbaea34c0095a00`. It binds six guarded release
receipts, Windows endpoint diagnostics and immutable browser-evidence JSON.
The own status file records the same current release. Current/prior recovery
archives and the one source backup remain preserved; ZIP integrity passed.

The [Pingfusi review skill](C:/Users/thalt/.codex/skills/beautify-with-pingfusi/SKILL.md)
was used for an independent review request on the actual production domain.
The request expired with zero responses; fresh verification reports `expired`,
not approval. No external human verdict or owner visual approval is claimed.
No additional site was published. Google consent, mailbox delivery, physical
microphone quality and real privileged production login were not certified by
the isolated/temporary checks. Existing identity, API, model/data and role rules
are preserved; the project remains a research/education product.
