# Account email delivery

**Implemented and contract-tested; not enabled in production.** Existing Firebase
emails remain active. The 5 November live capability test rejected an ordinary
recipient with `E_RECIPIENT_NOT_ALLOWED`; sending to preverified owner destinations
alone is insufficient for user verification and recovery. The temporary probe
Worker/route were removed and the original route set was verified unchanged.

This service separates **identity** from **mail delivery**. Firebase retains users,
password verification, Google sign-in, UID and one-use action validation. A separate
Cloudflare Worker generates project-bound links and sends themed HTML/plain text
through a native mail binding. No application database, model, API/worker image,
role or grant changes are needed. See [the delivery decision](../../docs/ACCOUNT_EMAIL_DELIVERY.md).

## HTTP contract

Only `https://stethofuse.ashraf-alsaloul.com/api/account-mail/*` is in scope:

| Endpoint | Behavior |
| --- | --- |
| GET `/health` | `200` means configuration is present; it does not certify delivery |
| POST `/reset` | `{email, locale}`; generic `202` for an eligible, absent, recipient-limited or failed recipient |
| POST `/verify` | `{locale}` plus the current Firebase ID token in `Authorization: Bearer`; recipient comes from a provider-validated lookup |

POST requires the exact site Origin, valid JSON up to 1,536 bytes, and `en` or `ar`.
No caller-supplied action, recipient for verification, sender, redirect or template
is accepted. All responses are `no-store`. IP/global throttling returns `429`;
missing configuration fails before account inspection. After configuration/rate
validation, reset acknowledges the **request**, not successful email delivery.
This avoids exposing whether an address exists through recipient-specific failures.
Operational failures are logged with a reference and fixed code; they must be
monitored. A minimum delay reduces simple timing differences, not all timing attacks.

The frontend checks the public capability only when a person requests mail.
`404/410` uses the existing Firebase sender. An installed but failing service is
not silently retried through another sender. No user/token/action-code data is
cached by this capability check. Arabic links select RTL in a fresh browser.

## Runtime bindings

| Binding | Required contract |
| --- | --- |
| `ACCOUNT_MAIL` | Native `send_email`, restricted sender `stethofuse@ashraf-alsaloul.com`; ordinary-recipient sending must be enabled |
| `GOOGLE_MAIL_CREDENTIAL` | Cloudflare secret; dedicated `stethofuse-account-mail` service account in the exact existing project |
| `FIREBASE_API_KEY` | Approved existing public web-app key; it assigns no IAM permissions |
| `MAIL_IP_RATE` | Unique namespace, 3 requests / 60 seconds / IP |
| `MAIL_RECIPIENT_RATE` | Unique namespace, 1 request / 60 seconds / SHA-256-normalized address |
| `MAIL_GLOBAL_RATE` | Unique namespace, 20 requests / 60 seconds / service key |

Cloudflare rate-limit bindings are distributed abuse controls, not exact global
or monthly billing quotas. Compatibility date: `2026-11-05`. Restrict the route to
this app; disable workers.dev/preview access. Keep the existing Support Worker,
its verified destination, domain email routing and other application resources.
No production mail Worker, service account or runtime key has been provisioned yet.

The Google custom role must contain **only `firebaseauth.users.sendEmail`**.
No user-management, role, configuration, database or model permission is required.
Never upload the owner's CLI refresh token or an existing administrator credential.
Create the dedicated credential only when activation is authorized; pass it directly
to encrypted Worker secrets, retain no plaintext in Git/logs, and document rotation
and revocation. Short-lived Google access tokens are signed with Web Crypto,
coalesced and cached in Worker memory for at most 59 minutes. All Google URLs and
the project/service identity are fixed in source.

Provider links are checked for the exact project host, key, operation and a single
valid code. Only that code is placed in `/auth/action`; untrusted redirects and
provider URLs are discarded. The frontend uses the official SDK to consume codes.
Nothing returns an action link through the public mail endpoint. Logs contain no
email, ID token, credential, access token or code.

## Verification and activation

```sh
node --test services/stethofuse-account-mail/worker.test.mjs
cd frontend
node --test tests/account-mail.test.mjs
npm run build
node tests/run-studio.mjs tests/account-mail-browser.mjs tests/email-actions.mjs
```

Before activation, confirm the account can deliver to ordinary recipients; provision
the dedicated restricted identity/bindings; verify HTML delivery, SPF/DKIM/DMARC and
one-use verification/reset using disposable owner-controlled accounts; test the live
app handler and clean up only those test identities. Retain rollback evidence. A
passing contract test or a provider message ID does not prove inbox placement.

Cloudflare currently requires [Workers Paid](https://developers.cloudflare.com/email-service/platform/pricing/)
for arbitrary recipients. The owner was asked specifically about the new recurring
charge; it must not be inferred from permission to merge Git changes. Until resolved,
the existing working sender remains active and this service remains unactivated.
