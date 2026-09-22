# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-09-22

### Fixed
- Bookings are now sent at the configured local time instead of whenever GitHub's scheduler got around to it. Scheduled runs had been starting 113-177 minutes after their `cron` time, which pushed a 22:30 booking past midnight. The workflow now fires hours early, installs and warms everything while it waits, then sleeps until the exact booking moment (Europe/Madrid, DST included).

### Added
- `BOOKING_TIME` repository variable (default `22:30`) to choose when the booking is sent.

### Changed
- The two `cron` entries no longer exist to cover summer and winter time — the booking moment is resolved in `Europe/Madrid` at run time, so daylight saving needs no schedule changes. They now sit at 15:30 and 17:30 UTC as redundancy against GitHub dropping a scheduled run, each with enough margin to absorb the queue delay on its own.
- Manual runs no longer wait for `BOOKING_TIME`, and no longer queue behind a scheduled run that is waiting for its window.
- The run summary flags a run that started too late to hit the booking window, with a 15-minute grace so the backup run doesn't trip it nightly.

### Security
- Overrode `js-yaml` to `^4.3.2`, clearing two high-severity advisories reachable through `puppeteer > cosmiconfig`. The override lives in `pnpm-workspace.yaml`, which is where pnpm 11 reads it from.

## [2.0.1] - 2026-07-28

### Changed
- Removed the 2Captcha account and API key from setup requirements while WODBuster no longer presents a login CAPTCHA. The fallback remains available if the check returns.
- Added instructions for updating a fork to the latest AutoWOD version.

### Security
- Updated vulnerable transitive dependencies to patched releases.

## [2.0.0] - 2026-07-04

First tagged release.

### Added
- Weekly booking schedule mode (`BOOKING_FREQUENCY=weekly` with `BOOKING_WEEKDAY`) for gyms that open the whole week at once.
- Class-name disambiguation for gyms that run multiple classes at the same start time (`MONDAY=18:00|CrossFit`).
- Booking-state early-exit: runs skip login and the CAPTCHA entirely when every upcoming bookable day is already in a terminal state.

### Fixed
- Stop the booking loop at the gym's reservation horizon instead of re-processing — and re-booking — the last reachable day (#34).
- Tolerate the login page no longer serving a Cloudflare Turnstile; proceed straight to login when no widget renders (#33).
- Scope Vitest to `src` so compiled `dist` tests are ignored (#32).

### Security
- Address high and critical dependency CVEs (#31).

[2.0.1]: https://github.com/RubenGlez/autowod/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/RubenGlez/autowod/releases/tag/v2.0.0
