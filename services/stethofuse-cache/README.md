# StethoFuse cache contract

`rules.json` contains two narrowly scoped Cloudflare cache rules for the existing
StethoFuse hostname. Read the actual zone rules first and preserve every foreign
rule. Never replace a zone ruleset wholesale from this two-rule file.

The public homepage is static, anonymous HTML, generated in English/Arabic and
both appearances. It may be cached at the edge for five minutes. Browsers must
revalidate HTML. Query-bearing or authenticated requests are not eligible for
that rule, and non-200 responses must not be cached. Cookies/identity do not
personalize the generated HTML. All personalization happens after hydration.

Private/auth/action/version/API paths and mutations explicitly bypass edge cache.
The existing API's `private, no-store` remains authoritative. No private response
or protected media is added to browser CacheStorage or a service worker. Existing
public static-asset browser/edge caching remains four hours; measured warm loads
already benefit from it. Changed bootstrap URLs use content-versioned query keys;
Vite bundles and responsive posters use fingerprinted filenames.

After every successful website release, purge only:

`https://stethofuse.ashraf-alsaloul.com/`

Then request the homepage twice, confirm the new packaged script identity and
edge MISS/HIT behavior, and verify `/deployment-version.json` and anonymous API
denial remain uncached. Never purge the whole shared zone. Perform this step in
the current authorized conversation through the existing Cloudflare connection;
it needs no coordinator and no new owner-supplied API key. A failed deployment
or rollback also requires refreshing this single homepage URL to the actual
recovered release. Preserve the existing owner release/rollback guards.
