# Enchanted forest: diagnosis before implementation

28 October 2026. The deployed forest landing page is rejected. This work is a local,
separate prototype. No deployment, main merge, Firebase, backend, model, T9, Axora,
production database or shared-host operation is authorized by this task.

## References inspected

All three originals in `C:/Users/thalt/Pictures` were opened at original resolution.
The filenames and the visible lighting disagree: **Forest-night.png contains the
daylight composition; Forest-morning.png contains the moonlit composition**. The
prototype follows the visible lighting, while retaining those original filenames
in the provenance record. Neither reference is a runtime background or UI atlas.

`codex work.png` is evidence of the failed design, not a source of reusable scenery.

## Concrete failures, causes, corrections

| Failure visible in the rejected capture | Underlying cause | Required correction |
| --- | --- | --- |
| A hard horizontal boundary ends the dark hero; large pale rectangles then replace the world. The river, horizon and vegetation have no continuation. | `.winter-hero` owns its own forest background; `.public-section` and `.public-band` own unrelated fills. | Put environmental artwork under the entire semantic content flow. Sections contribute layout and readable scrims, never independent landscape backgrounds. |
| Only a right-edge fragment of trunk exists in the hero. No trunk reaches workflow, deer or footer. | The tree is baked into `forest-hero-v1.webp`; its lifetime is the hero's box. | A dedicated tree composition spans the whole forest container. Branch, trunk and root crown use one horizontal coordinate and registered overlap regions. Connected parts receive no independent parallax. |
| Footer contains pale schematic curved lines on a dark block; there is no surface/topsoil transition. | `roots-v1.svg` is an abstract decoration, unrelated to soil or the hero tree. | Generate recognizable shallow soil/stone/fine-root artwork, grass surface and a matching root crown connected to the trunk. Footer remains real selectable HTML in front of soil. |
| The deer’s hooves float above a pale empty plane. Its glow is green and detached from any local terrain. | A standalone cutout has a whole-body bounce and generic drop shadows; there is no foreground occluder or contact plane. | Anchor the hooves to a terrain island. Place grass in front of the feet; retain a contact shadow on the island; illuminate moss immediately beneath warm antlers. Never translate the whole deer for idle motion. |
| Owl dominates nearly half the hero and overwhelms the tree; the remaining world is sparse. | Owl scale is chosen independently of branch/tree and content composition. | Size owl from a measured perch anchor on the tree; protect left text space, with scenery visible between content groups. |
| Workflow and purpose text sit on opaque slabs. FAQ is almost empty. | The artwork was treated as hero decoration rather than the page’s spatial hierarchy. | Restrained translucent materials; quieter atmospheric areas behind headings; a lower clearing and forest-floor FAQ. |
| Arrival switches between a small set of inconsistent whole-bird images. A crossfade cannot supply anatomical in-betweens. | `owlArrival.ts` cycles registered-looking atlas poses using opacity blends. `assets/owl-arrival-v2/GENERATION.md` documents only eight generated tiles, a reordered cycle, and old landing poses. | Preserve approved idle assets/renderers unchanged. Build an independent timed joint/flight study, then require identity-consistent final wing/landing artwork before enabling flight in the scene. Counts or a video file alone cannot clear this gate. |
| Owl, deer, backgrounds and footer use independent widths/crops. Zoom changes their relative placement. | Separate viewport rules and unrelated object-fit crops do not share anchors. | Define one tree coordinate system with measured branch/foot/root coordinates. Responsive content reserves character space. Test all specified widths and browser zoom levels, including 67%. |

## What the approved compositions teach

The **visible day reference** provides luminous depth: sky, mountain silhouettes,
waterfalls, river, canopy and foreground use decreasing atmospheric perspective.
Its clear left sky supplies negative space for the headline. Glass is a material
within the world, not a reason to hide it. The **visible night reference** keeps
the same hierarchy under moonlight: silver distance, dark teal evergreen forms,
mint type and sparse warm light. The deer’s warm antlers are secondary to the owl.
Both references resolve into grass, surface roots and actual brown earth.

The references themselves are compositions, not measurements of a functional web
layout. Their exact illustrated owl is not substituted for the approved existing
idle owl. Real copy, flexible HTML and accessible interactions take precedence over
duplicating the references' occasional cramped text.

## World composition and shared coordinates

```
Scene root (content determines height)
  distant valley artwork, day/night registered edit pair
  tree master axis at right edge
    upper canopy/branch asset, fixed aspect ratio
    approved owl, claws registered to branch anchor
    textured trunk extension, overlap hidden by same-species moss
    root crown -> shallow soil cross-section
  semantic hero -> workflow -> purpose clearing -> FAQ
  deer terrain island at purpose clearing, grass in front of hooves
  soil footer, real links above artwork
```

Use CSS grid to establish content rows and local scene anchors. The upper tree
group owns both branch and owl coordinates, so scaling it cannot separate them.
The trunk belongs to the scene spanning all rows, with the root crown at its
lower anchor. No connected piece is scroll-transformed independently. Mobile
reserves a second hero row for the perch, keeps the trunk at the right edge and
places the deer in its own part of the purpose clearing.

## Asset plan and identity contract

Few reusable raster assets, no text/buttons baked into artwork:

1. Distant river valley in daylight, without foreground tree or characters.
2. The exact valley edited to night, retaining mountain/river/terrain geometry.
3. Transparent upper tree/canopy/branch, enough quiet space around its perch.
4. Matching vertical bark/moss extension for variable page heights.
5. Shallow earth cross-section with ground surface and a right-hand root crown.
6. Transparent deer on a small natural terrain island, with foreground grass.
7. Approved existing owl surface and fallback; no replacement identity.

Retain generation prompts, source PNGs, native sizes, alpha statistics and optimized
WebP derivatives in a manifest. Day/night scenery is an edit pair. Shared tree,
deer and soil use the same geometric assets in both themes; lighting layers can
change their appearance. Night must not be a brightness filter over day scenery.

## Bounded implementation

Preserve `PublicPages.tsx`, `woodland.css`, existing routes and all approved owl
source/renderer files. Create a separate `forest-prototype.html` entry and scoped
prototype components/styles. Reuse native React/CSS, local brand fonts, Phosphor
icons and the approved `createOwlSurface` function through a prototype adapter.
No frontend framework or UI-kit migration.

Taste read: visual overhaul of the public landing only; variance 7, motion 5,
density 4. The existing serif/sans brand and the explicit reference compositions
override generic skill defaults against serif headings and equal workflow cards.
Native glass approximation, with solid-fill/reduced-transparency fallbacks.

## Separate acceptance gates

Composition: actual layered, scrollable Day/Night page; contact close-ups, all
requested widths and zooms, semantic links/FAQ/theme switch, reduced motion.

Flight: researched choreography, 24 fps or higher distinct evaluated anatomical
poses, registered contact and exact idle handoff, actual playback/recording. A
kinematic study is explicitly a study, not final photographic character animation.
If identity/feather/landing art is inadequate, flight stays unapproved and disabled
in the scene. The good perched owl remains available for composition review.

Neither a build nor automated checks grant visual acceptance. Owner must explicitly
approve both gates before any landing replacement or production release.

## Owner rejection of the first local prototype

The first local prototype is rejected, including its review claim. Its marker
checks proved only the coordinates assigned to the markers, not painted contact.
The exposed strip beside the tree, stretched footer texture and clipped brand
were visible defects that should have prevented handoff.

Revision decisions, before implementation:

- The trunk's right crop is the master coordinate. Crown, perch, trunk and root
  crown share it at every breakpoint. No connected part receives parallax.
- The approved owl is unchanged. Its toe bases, rather than its lowest claw tips,
  meet the sloping branch. A registered copy of the actual moss provides foreground
  occlusion; inspect the resulting pixels, not just a synthetic anchor.
- Footer soil uses an SVG texture window and one aspect-preserving root crown.
  Width and height are never assigned independently to the natural artwork.
- Extract the seven existing owl-mark contours into a padded standalone SVG.
  Do not crop the full wordmark using CSS overflow.
- Mobile reserves a perch row immediately after the hero copy. Content determines
  the row position; remove the successive fixed 500/760px offsets and 960/1160px
  hero overrides. Desktop keeps scenery and content inside the same composition.
- Preserve the existing photographic owl and its gaze renderer. The schematic
  flight blockout remains an archived, unapproved study, never a character asset.

Taste v2 and daisyUI guidance are reference material, not permission to replace
the owner's art direction or migrate UI frameworks. The subject inventory is:
snowy-owl listening identity; cardiopulmonary recordings; original/heart/lung
comparison; private history; explicit sharing; non-diagnostic research boundary;
forest Day/Night pair; one old tree; warm antler light; surface-to-soil ending.
On this page, the listening owl's tree becomes the continuous frame of the journey.
Hero proves purpose; workflow explains the recording lifecycle; purpose explains
access limits; FAQ answers actual account/data questions; the earth ends the scene.

From the owner's portfolio: quick object feedback, rolling action labels,
pointer-reactive artwork, short reveals and useful controls. From itsflxkzy:
code-authored motion serving a real object and clear action hierarchy. Neither
site's imagery, commercial copy or personal content is copied. Interaction stays
subordinate to reading and retains keyboard/touch/reduced-motion alternatives.

The revision's visual pass also caught the hero branch crossing supporting copy
at tablet widths. Owl-only bounding-box checks missed it. Smaller tablets now use
the reserved perch row (up to 900 CSS pixels); the remaining compact desktop
range gives the paragraph a clear measure left of the painted branch. A new
test samples the actual crown alpha beneath hero character positions. It is a
composition guard, independent of the synthetic branch/claw anchor check.
