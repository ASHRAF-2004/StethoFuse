# StethoFuse support email

The public Support page posts to the same-origin `/api/support` endpoint. A
dedicated Cloudflare Worker sends branded HTML and plain text to the existing
verified owner inbox. Visitors stay on the page; their email address is used
only as Reply-To. The destination and sender come from runtime configuration,
never from the submitted request.

## Deployment contract

- Worker name: `stethofuse-support`.
- Route: `https://stethofuse.ashraf-alsaloul.com/api/support*` only. The worker
  accepts POST `/api/support` and GET `/api/support/health`; other paths fail.
- ES modules: `worker.mjs` and `email-theme.mjs`.
- Compatibility date: `2026-11-01`.
- `SUPPORT_MAIL`: Cloudflare `send_email` binding restricted to the existing
  verified owner destination.
- `SUPPORT_FROM` and `SUPPORT_TO`: fixed runtime addresses. Do not commit private
  inbox configuration or a management token.
- `SUPPORT_RATE`: Cloudflare rate-limit binding, two requests per minute/IP.
- `SUPPORT_GLOBAL_RATE`: eight requests per minute for the shared key. Cloudflare
  rate limits are distributed abuse controls, not exact global quotas.

Cloudflare's existing account connection manages this Worker. Its runtime mail
binding needs no separate SMTP password or email API key. Other API routes,
Email Routing rules, DNS and application services are outside this deployment.

Requests require the exact site Origin, bounded JSON, field validation and an
empty honeypot. HTML is escaped. The service awaits provider acceptance and a
message ID before returning 202; provider errors return 503. Logs contain only
the reference, provider code and accepted message ID, not visitor message text.
The form preserves input on failure and never claims acceptance for an error.

Run the focused checks with:

```powershell
node --test services/stethofuse-support/worker.test.mjs
```

## Account email templates

`node services/stethofuse-support/prepare-templates.mjs` generates the proposed
Firebase account-email HTML. Password recovery is one flow: request the link,
follow its one-use action, choose a new password. These files are prepared
templates; their presence does not establish that Firebase has been configured
to use them. Preserve existing accounts/providers while applying settings with
authorized Firebase admin access. Never replace authentication with a demo
provider or place administrator credentials in the frontend.

The 1 November Support provider test returned 202 for one owner-authorized
message. Provider acceptance is recorded separately from inbox observation;
that Support destination is not the connected Gmail account. Account verification
and reset HTML delivery were separately observed using a disposable owner-inbox
alias, with successful one-use recovery and identity cleanup. Firebase currently
rejects even a minimal password-template greeting edit with
`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`; verification body edits were ignored on
read-back. Supported sender names are StethoFuse. Full proposed account-mail
body styling is not active; this does not affect the branded Cloudflare Support
email or the tested Firebase recovery flow.
