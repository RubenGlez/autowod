# AutoWOD

[![Daily Reservation](https://github.com/RubenGlez/autowod/actions/workflows/daily-reservation.yml/badge.svg)](https://github.com/RubenGlez/autowod/actions/workflows/daily-reservation.yml)
[![CI](https://github.com/RubenGlez/autowod/actions/workflows/ci.yml/badge.svg)](https://github.com/RubenGlez/autowod/actions/workflows/ci.yml)

Automatically books your workout sessions on [WODBuster](https://wodbuster.com/) — the booking platform used by many CrossFit gyms. Once set up, it runs every day in the cloud so you never have to worry about grabbing a spot.

> **Is your gym on WODBuster?** Check your gym's booking page URL. If it contains `wodbuster.com`, you're good to go.

---

## What you need before starting

- A GitHub account (free) — [sign up here](https://github.com/join) if you don't have one
- Your WODBuster login email and password
- A 2Captcha API key (costs less than $1/month) — [see step 4 below](#4-get-a-2captcha-api-key)

---

## Setup (one time only)

### 1. Fork this repository

Click the **Fork** button at the top right of this page. This creates your own private copy of the tool under your GitHub account.

### 2. Add your secrets

Secrets are for sensitive information like your password. GitHub keeps them encrypted and never shows them in logs.

1. In your forked repository, click **Settings**
2. In the left sidebar, click **Secrets and variables → Actions**
3. Make sure you're on the **Secrets** tab
4. Click **New repository secret** and add each of the following:

| Name | Value |
|------|-------|
| `EMAIL` | Your WODBuster login email |
| `PASSWORD` | Your WODBuster password |
| `TWO_CAPTCHA_API_KEY` | Your 2Captcha API key (see step 4) |

### 3. Set your weekly schedule

Your schedule uses **repository variables** — unlike secrets, you can see and edit them at any time without deleting and recreating them. These are NOT environment variables on your computer; they live on GitHub, in your repository settings.

1. Still in **Settings → Secrets and variables → Actions**
2. Click the **Variables** tab (not the Secrets tab)
3. Click **New repository variable** and add a variable for each day you want to book

| Name | Value example | Meaning |
|------|--------------|---------|
| `MONDAY` | `18:00` | Book the 6 PM class every Monday |
| `TUESDAY` | `18:00` | Book the 6 PM class every Tuesday |
| `WEDNESDAY` | `09:00` | Book the 9 AM class every Wednesday |
| `THURSDAY` | `18:00` | |
| `FRIDAY` | `18:00` | |
| `SATURDAY` | `10:00` | |
| `SUNDAY` | `10:00` | |

- Use 24-hour format (`18:00` not `6:00 PM`)
- Only add variables for days you actually want to book — skip the rest

**Two classes at the same time?** If your gym offers multiple classes at the same start time (e.g. CrossFit and Endurance both at 18:00), add the class name after a `|`:

```
MONDAY=18:00|CrossFit
TUESDAY=18:00|Endurance
```

**Optional — how many days ahead to book:**

| Name | Value | Meaning |
|------|-------|---------|
| `AVAILABLE_DAYS` | `7` | Book up to 7 days in advance (default if not set) |
| `BOOKING_FREQUENCY` | `daily` | Use `daily` to try every day, or `weekly` to book only once per week |
| `BOOKING_WEEKDAY` | `sunday` | Used with `BOOKING_FREQUENCY=weekly`; choose `monday` through `sunday` |

### 4. Get a 2Captcha API key

The tool needs this to handle the login security check automatically.

1. Go to [2captcha.com](https://2captcha.com) and create a free account
2. Add a small amount of credit (minimum ~$3, lasts months at ~$0.001 per run)
3. Copy your API key from the dashboard and add it as the `TWO_CAPTCHA_API_KEY` secret

### 5. Enable GitHub Actions

1. Click the **Actions** tab in your forked repository
2. If prompted, click **I understand my workflows, go ahead and enable them**

That's it! By default, the tool will now run automatically every evening around 22:30 Spain time.

---

## Checking if it worked

1. Click the **Actions** tab in your repository
2. Click the latest **AutoWOD** run
3. You'll see a summary card showing exactly what happened for each day — no need to read through logs

A green checkmark means the run completed. Check the summary card to see which sessions were booked.

---

## Changing your schedule

Go to **Settings → Secrets and variables → Actions → Variables tab**, click the repository variable you want to change (e.g. `MONDAY`), update the value, and save. The next run will pick it up automatically.

---

## My gym opens all reservations on one day

Some gyms release the full week's schedule at once (e.g. every Sunday). In that case, set these repository variables:

| Name | Value example |
|------|---------------|
| `BOOKING_FREQUENCY` | `weekly` |
| `BOOKING_WEEKDAY` | `sunday` |
| `AVAILABLE_DAYS` | `7` |

The workflow still wakes up every day because GitHub Actions schedules cannot be changed by repository variables, but AutoWOD will skip immediately on the other days before installing dependencies or solving any CAPTCHA.

You can also trigger the tool manually whenever you need:

1. Go to **Actions → Daily Reservation**
2. Click **Run workflow** (top right)
3. In the *Days to book ahead* field, enter the number of days you want to cover (e.g. `7`)
4. Click **Run workflow**

Manual runs always run immediately, even when `BOOKING_FREQUENCY=weekly`.

---

## Troubleshooting

**The run shows a red ✗**
- Open the run and check the summary card or the step logs for the error message
- Most common cause: a secret is missing or has a typo — double-check `EMAIL` and `PASSWORD`

**All days show "Skipped" in the summary**
- You haven't added any repository variables yet — go to **Settings → Secrets and variables → Actions → Variables tab** and add at least one (e.g. name: `MONDAY`, value: `18:00`)

**"Could not find Chrome" error**
- Make sure your fork is up to date with the latest version of this repository
- Do not remove or modify the *Install Chrome for Puppeteer* step in the workflow file

**Wrong class booked when multiple classes share a time**
- Add the class name to your variable: `MONDAY=18:00|CrossFit`
- The name match is not case-sensitive

**Captcha errors**
- Check that your `TWO_CAPTCHA_API_KEY` secret is correct
- Make sure your 2Captcha account has credit remaining

---

## Privacy & cost

- Your email, password, and API key are stored as encrypted GitHub secrets — only your workflow can read them
- GitHub Actions is free for public repositories
- 2Captcha costs roughly $0.001 per solve. The bot skips the CAPTCHA entirely on runs where all sessions are already booked, so most daily runs are free

---

## Support the project

If AutoWOD saves you the hassle of booking your classes every day, consider buying me a coffee! It helps me keep the project maintained and free for everyone. ☕

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/rubenglez)

---

## Disclaimer

This tool is designed for WODBuster-powered gyms. Please make sure you have permission from your gym to automate bookings, and use it responsibly in line with their booking policies.

## License

ISC — see the [LICENSE](LICENSE) file for details.
