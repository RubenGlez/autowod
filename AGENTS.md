All `waitForNetworkIdle` calls use `{ timeout: 5000 }.catch(() => {})` — WODBuster keeps long-polling connections open that prevent the network from going fully idle.

WODBuster removed the Cloudflare Turnstile from the login page (June 2026). The captcha flow waits ~15s for a widget to render; if none appears it proceeds straight to login. It only solves, and retries up to 3 times, when a widget is actually present.
