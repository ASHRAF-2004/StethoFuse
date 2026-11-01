# Loading and caching — 2 November 2026 (work in progress)

The owner reported an oversized frozen circular loader and requested real 3G
testing, homepage preload/cache and account-specific caching. No Next.js migration
is requested. The 1 November release remains live while this change is tested.

## Measured baseline and immediate defect

An isolated Chromium context used 400 kbit/s download/upload, 400 ms latency and
4x CPU slowdown. Public cold-load FCP/LCP was 10,124 ms, versus 112 ms on a repeat
load. Cold first paint was 6,052 ms; measured CLS was 0.0133. This is lab network
emulation, not a physical mobile-device result. Video, screenshots, request/header
data and JSON are retained in OwnerRelease/performance-20261102/baseline.

The screenshot is the common `Skeleton` circular loader, not the homepage's
separate thin progress bar. Its rotation/size rules existed only in the inactive
`product-design.css`. The current app did not import that stylesheet. The shared
loader now owns explicit 24px SVG dimensions and rotation in startup/common CSS;
reduced motion deliberately disables animation. Slow/failed startup must retain
bounded geometry and an honest status, never a fabricated percentage.

Existing static assets already received four-hour browser/Cloudflare caching.
The homepage HTML was DYNAMIC with no explicit Cache-Control. Anonymous private
API denial correctly returned `private, no-store`. A full framework migration
would not repair the missing spinner styles.

## Selected architecture

- Keep React/Vite/React Router and the existing FastAPI/worker/backend boundaries.
- Build-time prerender the public homepage in both languages and appearances,
  then hydrate the same React tree. No account/token/data is rendered into public
  HTML. A small appearance bootstrap selects the correct public snapshot before
  hydration. Private/auth routes start with a client shell and the bounded loader.
- Preload the critical responsive owl poster before React's dependency chain.
  Smaller 580/900px WebP encodings preserve the approved owl; the original 1163px
  artwork remains available for higher display resolution. No new character art.
- Use TanStack Query core 5.105.1 inside each live API-client scope. It deduplicates
  concurrent metadata requests. Only own appearance preferences have a 30s fresh
  window; permission-bearing recording/result metadata always revalidates. Role,
  session, admin, notifications and protected media bypass this cache. HTTP stays
  `no-store`; no private CacheStorage/localStorage/IndexedDB persistence is added.
- Cache entries are memory-only, capped at 64 completed entries and GC after 60s.
  Auth change/logout/expiry clears clients, cancels old-scope requests and rejects
  late responses. Successful mutations invalidate metadata. One caller's abort
  cannot abort a shared request needed by another caller. Errors never return
  cached private data as successful authorization.
- Inline the compiled initial stylesheet and reuse sample waveform SVG symbols
  instead of repeating their paths in all snapshots. The HTML payload fell from
  98,316 to about 27KB gzip during tuning. Latin font display is optional so a
  slow first visit uses the readable system fallback without a late font shift;
  cached fonts retain the studio face. Decode the owl before revealing it.
- Stage two narrow Cloudflare rules for exact public homepage HTML (five minutes,
  browser revalidation) and explicit private/API/auth/version bypass. Keep the
  existing four-hour public static-asset cache. Preserve the
  two pre-existing Portfolio rules byte-for-byte. These rules are NOT applied yet.
  Purge only the StethoFuse homepage after a release; never purge the whole zone.

TanStack Start is a full-stack SSR/router framework. TanStack Query is independently
usable for server-state caching. The existing stack can satisfy this request with
static generation and scoped Query core, preserving the application's auth/model
contracts and avoiding a router/backend migration.

References consulted: [TanStack defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults),
[QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient),
[TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview),
[React server rendering](https://react.dev/reference/react-dom/server/renderToString),
[resource hints](https://web.dev/learn/performance/resource-hints),
[HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching),
[Cloudflare cache settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).

## Gates still pending

Eight focused cache checks passed (dedup/revalidation, preference invalidation,
account isolation, old-scope cancellation, independent caller abort, revocation,
identity/media bypass and offline failure). Private UI regression used captured
real-API fixtures with fictional identities, with mocked identity/network in the
browser: 176 layouts and 124 accessibility states passed, with no overflow,
unknown routes or violations. This does not claim a fresh privileged production
login. Public regression passed 94 checks/32 accessibility states plus focused
Support/recovery/audio/RTL checks. The final 3G tuning, Cloudflare scoped policy,
guarded release and fresh live proof remain required. Both Cloudflare rules
passed the provider's dry-run validation without any policy mutation.
