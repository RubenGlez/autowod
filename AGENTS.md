All `waitForNetworkIdle` calls use `{ timeout: 5000 }.catch(() => {})` — WODBuster keeps long-polling connections open that prevent the network from going fully idle.

WODBuster removed the Cloudflare Turnstile from the login page (June 2026). The captcha flow waits ~15s for a widget to render; if none appears it proceeds straight to login. It only solves, and retries up to 3 times, when a widget is actually present.

<!-- doctier:begin -->
## Project context

Managed by doctier — do not edit between the markers.

Read these for project context:

- `.harness/engineering/architecture.md`
- `.harness/engineering/implementation-plan.md`
- `.harness/product/product.md`
- `.harness/product/roadmap.md`
<!-- doctier:end -->

## Release

There is no deploy step. The bot runs from GitHub Actions on a cron schedule (`daily-reservation.yml`); merging to `main` is what reaches production. "Shipping" means cutting a release: keep `package.json` `version` in sync, add a `CHANGELOG.md` entry, then create an annotated `vX.Y.Z` tag and push it. No tag-triggered pipeline exists, so a tag is a marker, not a trigger.
