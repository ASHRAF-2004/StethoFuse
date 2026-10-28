# Forest-world artwork provenance

Generated with the built-in image-generation tool, not a paid CLI/API fallback.
Original PNGs are unchanged copies in `source/`; web assets are derivatives made
by `tools/prepare_forest_world.py`. The original generated files remain in the
owner's `.codex/generated_images` directory. `manifest.json` records their hashes,
native dimensions, genuine alpha and runtime bytes.

The source references were inspected before generation. Filename mapping follows
the visible lighting: `Forest-night.png` is the supplied daylight reference;
`Forest-morning.png` is the supplied moonlit reference. `codex work.png` is failure
evidence only. No source screenshot, text, button or card is cut into runtime art.

## Final production prompt set

Each item was a separate generation call. References supplied art direction or
geometry, not UI pixels. These are the asset production briefs and invariants.

| Asset | Prompt / reference role | Geometric invariant |
| --- | --- | --- |
| valley-day | Tall 2:3 enchanted alpine river valley, morning sky and clouds, mountains, evergreen layers, small distant castle, connected waterfalls and river, moss/flowers; calm upper-left copy space. Omit foreground tree, animals, text, soil footer and all UI. Day screenshot is style reference only. | Master landscape camera and landforms |
| valley-night | Edit the generated day valley, same dimensions/camera/landmarks. Replace sky and illumination with moon, stars, silver water/mist, dark evergreen forms and warm distant windows. Do not move terrain or add a foreground tree/characters/UI. | Registered edit of day, not an unrelated generation |
| tree-crown | One transparent square ancient oak; trunk at x86%, overhead canopy, deeply furrowed brown bark, moss, little daisies/ferns. Real thick branch extends left near y67%, leaving a clear separate-owl perch near x46%. Trunk exits lower edge; no roots/sky/animals/UI. | Measured output perch supersedes requested nominal generation position |
| tree-trunk | Transparent 1:3 bark/moss extension matching generated crown. One thick irregular trunk, equal top/bottom continuation, no canopy/branch/base/soil, no detached pieces; clean alpha. | Same species and lighting as crown |
| earth-roots | Wide 3:1 shallow side-view soil cross-section: grass/flowers above, thin dark humus, compact brown earth with stones/fine roots beneath. Matching oak trunk at right x88% becomes thick tapering embedded roots. No cave, void, tunnel, water or UI. Alpha above surface. | Root crown shares tree master x-axis |
| deer-clearing | One anatomically normal four-legged spotted deer, two ears/one head, three-quarter pose. Warm luminous natural antlers, realistic fur, all hooves on moss/rock island with native contact shadows and overlapping grass/daisies. Genuine transparent exterior, no forest backdrop/UI. | Hooves and island remain fixed in idle |
| clearing-bank | Wide 3:1 transparent moss/fern/stone/daisy bank, sloping subtly upward to the right-hand tree, irregular foliage edges tapering to transparency. Match deer-island and oak plant/rock scale, no animal/trunk/sky/water/UI. | Blends island into foreground terrain beside trunk |

## Quality observations

- Every source was visually inspected, including the full native-resolution
  generated output and browser composites on light/dark terrain. Alpha channels
  are present on the five foreground assets. No chroma-key background removal or
  artificial upscaling was used.
- Deer has four identifiable legs, two normal ears and one pair of branching
  antlers. Its hooves contact the retained island; the bank overlaps that island.
- Crown branch is physically attached to the source trunk. A registered bark
  extension and root-crown overlap supply variable-height continuation. The
  extension is reusable texture, not a new tree per section. Local material joins
  remain subject to owner visual review, especially at very wide crops.
- Night relighting preserves the day plate's castle, waterfall and foreground
  rock anchors. Bounded 64px edge-correlation checks found zero-pixel shifts at
  four sampled landmarks (scores .399–.510). This is not a claim of pixel-identical
  generated foliage or a complete dense registration proof.
- Shared tree/deer/root files have exactly the same geometry between themes.
  Foreground illumination changes with scene tokens; night has its separately
  authored sky/water/atmospheric plate. Day is not a brightness filter over night.
- Native art sizes and page composition are in the manifest. Distant landscape
  details are softer at 2560px; no fabricated high-resolution derivative conceals
  that limit. Foreground detail remains independently sized.

New runtime art totals **4,418,972 bytes** before the two 640px landscape variants.
The approved owl's existing library is separate and unchanged. Source PNGs total
20,826,072 bytes. Source assets are review candidates, not owner-accepted artwork.

Sources and tool prompts are intentionally independent of website code. The actual
UI is semantic React/HTML; no text or controls are baked into any of these images.

## Corrective layout revision

The original source artwork is preserved. `public/assets/forest-world/owl-mark.svg`
is a vector extraction of the original logo's seven mark contours, with sixteen
source units of padding. It is generated by `tools/extract_forest_mark.py`; the
full original logo remains unchanged. The revision adds no generated bird.

`Tree` and `Earth` in the isolated prototype supply reusable SVG registration,
branch occlusion, native soil texture windows and the aspect-preserving root crown.
The root image keeps its native 2172:724 proportions. Scene coordinates and
visual evidence are recorded in `docs/ENCHANTED_FOREST_REVISION_REVIEW.md`.
