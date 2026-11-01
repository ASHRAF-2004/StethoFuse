# StethoFuse cache contract

`rules.json` contains three narrowly scoped Cloudflare cache rules for the existing
StethoFuse hostname. Read the actual zone rules first and preserve every foreign
rule. Never replace a zone ruleset wholesale from this file.

The public homepage is static, anonymous HTML, generated in English/Arabic and
both appearances. It may be cached at the edge for five minutes. Browser HTML is
`no-store`, fetching fresh HTML from the edge each navigation. Query-bearing or authenticated requests are not eligible for
that rule, and non-200 responses must not be cached. Cookies/identity do not
personalize the generated HTML. All personalization happens after hydration.

Private/auth/action/version/API paths and mutations explicitly bypass edge cache.
The existing API's `private, no-store` remains authoritative. No private response
or protected media is added to browser CacheStorage or a service worker. Existing
public static-asset browser/edge caching remains four hours; measured warm loads
already benefit from it. Changed bootstrap URLs use content-versioned query keys;
Vite bundles and responsive posters use fingerprinted filenames.

The only longer-lived override is `/assets/owl/runtime/approved-*.bin`: the
content-fingerprinted, public native owl package. Successful anonymous GET/HEAD
responses with no query may stay in browser/edge cache for one year. The client
verifies its SHA-256 before decoding. A different field gets a different URL;
never replace bytes at an existing fingerprint. Errors are not edge-cached.
No account, protected media or API response matches this rule.

All three StethoFuse expressions also account for Cloudflare's internal `PURGE`
method. The earlier GET/HEAD-only rule and subsequent non-GET bypass prevented
single-URL invalidation even when the API reported success. Only these method
sets changed: client mutations still bypass cache, and private/auth/API/version
paths always bypass, including during purge matching. The two Portfolio rules
are byte-for-byte preserved. See Cloudflare's
[single-file purge limitations](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/#cache-rules-that-match-on-request-properties).
Verify real eviction (warmed HIT -> purge -> MISS -> HIT) and exact packaged HTML;
a successful purge API response alone is insufficient.

After every successful website release, purge only:

`https://stethofuse.ashraf-alsaloul.com/`

Then request the homepage twice, confirm exact new packaged HTML and an edge HIT
(the first probe may be MISS or already HIT), and verify `/deployment-version.json` and anonymous API
denial remain uncached. Never purge the whole shared zone. Perform this step in
the current authorized conversation through the existing Cloudflare connection;
it needs no coordinator and no new owner-supplied API key. A failed deployment
or rollback also requires refreshing this single homepage URL to the actual
recovered release. Preserve the existing owner release/rollback guards.
