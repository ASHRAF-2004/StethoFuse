# Owl-ready entrance — 2 November 2026

## Diagnosis and selected direction

The earlier startup release waited for React hydration and the static poster,
not for the approved pointer-follow renderer. A visitor could enter while its
18 native views and correspondence data were still downloading. An animated
spinner alone could not make that owl ready.

The Awwwards [loading-page collection](https://www.awwwards.com/awwwards/collections/loading-page/)
contained 542 entries when inspected. This study opened the 32 featured items
on its first page sequentially, inspected their public reference video frames,
and followed their live website links. It did not review all 542. One live link
returned 404, one closed its connection, and one historical agency link now
redirects to an unrelated publication. Screenshots and exact link observations
are retained in `OwnerRelease/owl-loader-20261102/references`.

The quiet type-led entrances at [NeoLeaf](https://neoleaf.bytetown.agency/),
[Studio Olimpo](https://www.studioolimpo.it/) and [Onto](https://studio-onto.com/)
fit this research product better than game HUDs, simulated terminals or elaborate
photo reveals. The implementation uses StethoFuse's existing split-signal mark,
large wordmark, restrained animated sound trace, measured progress and a short
exit. No reference artwork or video is copied into the product. The Superdesign
canvas contains a dedicated `site-entrance` study, imported from authored HTML
without paid generation; the product itself uses real progress, not that study's
fixed design-snapshot percentage.

## Native art preservation and transport

The approved v5 connected-neck field is already WebP with lossless alpha.
Re-encoding one native 191,716-byte neutral view losslessly produced 524,844
bytes; that route was rejected. Native resolution, feather patterns, eyes,
meshes, float arrays, blending and pointer mathematics remain unchanged.

`tools/prepare-owl-runtime.mjs` packages the 142 native resources in one indexed
gzip container: original WebP bitstreams, manifest, and exact uncompressed
correspondence/mesh arrays. The runtime verifies the package SHA-256 before
decoding; the build verifies every entry against its native source. It does not
manufacture new poses, resize/re-encode textures or turn the owl into a video.

| Field | Value |
| --- | --- |
| Original request payloads | 3,650,100 bytes across 142 requests |
| Packaged payload | 3,621,432 bytes in one request |
| Decoded package | 3,927,269 bytes |
| SHA-256 | `7de097a3a62fb9b4ff26b52186a2bcdf888599510896ba5011e412d3f9c0ce13` |
| Public URL | `/assets/owl/runtime/approved-7de097a3a62fb9b4.bin` |

The main benefit is eliminating request/dependency overhead and retaining one
cacheable native field, not a large percentage reduction in image bytes. A full
cold download still takes substantial time on a 400 kbit/s connection. Never
describe this as a tiny asset or an instantaneous first visit.

## Readiness and failure contract

The critical entrance CSS/bootstrap is in the HTML. Twelve compositor-animated
bars move before application JavaScript arrives. Percentage is actual package
bytes received; after download, the status explicitly changes to decoding.
There is no fake timed counter or forced minimum duration.

For a fine pointer, the page stays inert until the application is hydrated and
the real renderer has drawn nonblank canvas pixels. Two paint opportunities and
a 240 ms exit then reveal the page. The existing page-wide pointer renderer
already owns those pixels, so there is no poster-to-different-character swap.
WebGL and the existing software canvas fallback share this contract.

After 12 seconds, a visitor may explicitly choose **Continue with still owl**
once application controls are ready. This aborts motion loading and uses the
approved static owl. Failed/corrupt downloads offer Retry plus that explicit
choice. There is no silent frozen-owl fallback on a normal desktop visit.
Application-module or component-initialization failure keeps the page inert and
offers Retry. React Router and the outer application boundary share the existing
branded error UI and notify the entrance, so an error cannot be hidden behind it.
The download
has a bounded 120-second timeout. Neither a timeout nor an error pretends motion
was initialized successfully.

Touch, Save-Data and reduced-motion visits use the approved responsive poster
without fetching the native field. Reduced motion disables the trace/exit
animation. English/Arabic, mirroring and both existing appearances are retained.
Private/account routes never wait for public owl assets. Ordinary SPA navigation
does not replay the entrance.

## Cache boundary

The fingerprinted public native pack is the only new long-lived cache rule.
`services/stethofuse-cache/rules.json` appends its host/path/GET-or-HEAD/anonymous
scope to the existing ruleset and caches only successful responses at the edge.
Its browser/edge lifetime is one year. Changed content must have a changed URL.
The anonymous homepage keeps its existing five-minute edge cache and browser
`no-store`; deployment purges only that HTML URL. Private/auth/API/version paths
retain the existing bypass and per-session in-memory query boundary. No service
worker, persistent private cache or authentication change is introduced.

## Verification checkpoint

The dedicated compiled-browser test checks native entry equality, all 18 views,
nonblank first-frame pixels, real pointer pixel changes, one runtime request,
English/Arabic, both appearances, touch/reduced motion, 44 loading layouts,
accessibility and HTTP/integrity/module failures. It also forces software canvas
rendering. The 3G run uses actual native bytes, 400 kbit/s each direction,
400 ms latency and 4x CPU throttling, recording cold and cached reloads.

Release identity, final measured results, live screenshots and immutable runtime
proof are recorded in the deployment checkpoint after successful deployment.
Source/browser tests alone do not claim production activation or owner visual
approval. API/worker/model/schema/current data and other applications stay fixed.

Local compiled verification passed ten entrance states, 44 loading layouts,
four deliberately induced failure states, eight loading accessibility states,
and actual software fallback. The native 3G run entered at 82.902 seconds cold
and 1.977 seconds cached; first nonblank owl frames were 82.622 and 1.704 seconds.
The repeat native package transferred zero network bytes. Public regression:
94 checks/32 accessibility states, focused Support/recovery/audio/RTL, and eight
session-cache cases passed. Captured-API/mock-identity role regression passed
176 layouts/124 accessibility states. These are isolated Chromium lab checks,
not a physical Brave/device or fresh privileged-production-login certification.
