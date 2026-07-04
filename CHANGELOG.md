# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[2.0.0]: https://github.com/RubenGlez/autowod/releases/tag/v2.0.0
