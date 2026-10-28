# Approved forest: four owner follow-ups — 29 October 2026

**SUPERSEDED DEER-MOTION VERDICT, 29 October:** the owner rejected the visible
foreleg. The mesh is disabled and the unchanged approved still is active. The
deer-motion claims, recordings and measurements below are historical evidence,
not acceptance. Read [the generated-frame rebuild](DEER_FRAME_ANIMATION_STUDY.md).
The approved composition and unrelated footer/type/cursor refinements are retained.

The owner approved the forest composition and deer artwork based on local commit
`9433865d3d5c490b559b28fdb9f855464cd07485`, with four exceptions: footer-link
visibility, typography, deer playfulness and cursor-effect visibility. This is a
bounded refinement of that approved composition. The four new treatments await
the owner's visual review; production remains unchanged.

## Review the actual changes

- [Day](http://127.0.0.1:4192/forest-prototype.html?theme=day)
- [Night](http://127.0.0.1:4192/forest-prototype.html?theme=night)
- [Focused deer playback](http://127.0.0.1:4192/evidence/forest-followup/final/deer-play-preview.mp4)
- [Actual Day/Night interaction recording](http://127.0.0.1:4192/evidence/forest-followup/final/forest-interactions.mp4)
- [Evidence hub](http://127.0.0.1:4192/forest-review.html)

Both servers bind loopback only. The isolated build was checked at port 4193.
The four changes are confined to the prototype, not the authenticated application.

## Footer

Privacy, Terms and Help now sit on a compact deep-green reading surface in front
of the soil, with 15px desktop / 14px mobile text and targets at least 44px wide
and 46px tall. Mobile places the links below the brand instead of squeezing them
beside it. At narrow browser zoom widths they wrap into a two-column arrangement.
Their existing destinations are preserved. All three links passed actual browser
hit tests on desktop and mobile.

The light text against `#102c24f5` has a conservative contrast ratio of **13.06:1**,
even with white artwork behind the translucent surface. This is a focused footer
check, not a certification of every pixel in the illustrated page.

## Type

[Fraunces](https://fonts.google.com/specimen/Fraunces) supplies the headings and
proper italic hero line; [DM Sans](https://fonts.google.com/specimen/DM+Sans)
supplies body text and controls. Heading sizes and line height were adjusted for
the new letterforms while retaining the two-line hero and shared scene anchors.
Main body text remains 16px. The three Latin WOFF2 files total 185,756 bytes and
are self-hosted, with original SIL Open Font Licenses and source URLs in
`frontend/public/assets/forest-world/fonts`. No remote font request is needed at runtime.

## Deer play

The approved source image is unchanged. A small mesh rig reuses its texture:

- A butterfly enters the deer's field of view.
- The head inclines and the ears flick.
- One foreleg bends through a two-bone constraint and makes two playful paws.
- Three supporting hooves stay fixed; the raised leg settles back to its original anchor.

The sequence lasts 7.4 seconds and begins after the deer first enters view. It can
be replayed with the native **Say hello** button, including touch and keyboard.
Quiet idle movement separates automatic sequences, scheduled 23 seconds apart.
It does not slide the whole animal or bounce its terrain.

`deerRig.ts` holds the geometry and motion; `ForestDeer.tsx` manages playback,
visibility and interaction. Its 64×96 mesh has 6,305 vertices and one GPU draw call.
The two 512×768 RGBA textures use about 3 MiB of GPU texture memory. The original
island is a stationary plate; small areas revealed by lifting a hoof use the
existing matching moss-bank texture. No new animal identity or generated pose
sequence replaces the approved deer.

At 30 samples/second, the motion study evaluates 223 distinct poses. Registration
checks found zero drift at the three supporting hooves, 88 native pixels of
maximum paw lift, approximately 0.102px maximum upper-bone length deviation and
zero final paw offset. Actual browser measurement was **30.08 fps at Night** and
**29.99 fps by Day** during recording. A fixed 512×80-pixel lower-ground strip retained the same hash
across separate playing poses. Playback stops outside the viewport and when the
document is hidden. Reduced motion retains the approved still image; the play
button is disabled. Browsers without the required renderer retain the still fallback.

The browser recording itself is 25 fps. It is separate from the 30 fps procedural
evaluation and is not evidence of approved owl flight. Owl flight remains the
previous independent, unapproved gate; the approved perched owl is unchanged.

## Cursor

The same single, bounded canvas now uses distinct treatments:

- Night: brighter gold/mint fireflies, occasional four-point glints, longer fades,
  multiple samples along pointer movement, capped at 144 particles. The capture
  contained approximately 80–90 live particles.
- Day: small flapping forest-green bird silhouettes with a light outline, capped
  at 36. The capture contained approximately 20–23 birds. Both edges remain visible
  over pale sky and dark bark.

The canvas never receives pointer events. Effects clear when focus/visibility is
lost. Touch and reduced-motion contexts allocate a 1×1 canvas and run no cursor
particle loop. No particle package or independent engine per particle was added.

## Verification

- Normal application build, isolated prototype build and TypeScript pass.
- All 16 exact viewport cases and 96 real Chromium browser-zoom cases pass.
  Widths: 360, 390, 768, 1024, 1280, 1440, 1920, 2560px. Zoom: 67, 80, 100,
  125, 150, 200%. The earlier native-window 500px minimum caveat still applies;
  the exact 360/390 viewport cases are separate.
- Root aspect, shared tree/perch anchors, tree/text composition, owl/text and
  deer/card clearances, footer fonts/targets and theme geometry pass.
- Footer hit tests, touch deer replay, offscreen pause and reduced motion pass.
  The mobile run loaded zero owl neck textures. No page errors or unexpected
  external requests occurred in the responsive run.
- Built Taste inspection at 1440/768/390 in both themes reports zero FAIL with
  the same explicit owner-art-direction allowances documented in the preceding
  review. It retains 5 Night / 6 Day generic style warnings. These are not a
  visual approval or full illustrated-background contrast certification.
- Full-page width sheets, all twelve Taste fold/page images, active-deer pose
  sheets, cursor close-ups, mobile playing view and footer details were inspected.

Fresh evidence is in `frontend/evidence/forest-followup/final`; approved baseline
evidence remains in `forest-revision`. The registration check is reproducible with
`node tools/validate_deer_motion.mjs`; the width/zoom check uses
`node tools/review_forest_followup.mjs`, both from `frontend`.

## Visual self-review

```text
Seen in one second: the same snowy owl and continuous forest, with clearer type.
Idea: preserve the tree as the frame and add life through its existing characters.
Live thing: the deer follows a butterfly and responds to Say hello; pointer effects change with the light.
Layout words: paired hero / workflow sequence / clearing / FAQ list / earth cutaway.
Self-assessment: approved composition preserved; the four refinements are review candidates.
Remaining gates: owner taste for typography, motion and stronger cursor treatment;
the separate final owl-flight gate; physical-device review beyond browser emulation.
```

The original owl, logo, seven scene source assets, authenticated application,
Firebase, data, frozen model, T9 evidence, production worker, Axora and other apps
are untouched. No push, merge, production release, backup or coordinator operation
was performed. The previous approval is preserved rather than treated as rejection
of the entire forest.
