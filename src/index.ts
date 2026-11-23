import { launch } from 'puppeteer';
import { login } from './services/auth';
import { goToReservations, processReservations } from './services/reservation';
import { solveCaptchaFlow } from './services/captcha';
import {
  allDatesCovered,
  getUpcomingBookableDates,
  loadState,
  saveState,
  updateState,
} from './services/state';
import {
  isCI,
  baseUrl,
  email,
  password,
  reservationsPreferences,
} from './config';

function validateConfig() {
  const missing: string[] = [];
  if (!email) missing.push('EMAIL');
  if (!password) missing.push('PASSWORD');

  if (missing.length > 0) {
    console.error(
      `❌ Missing required secrets: ${missing.join(', ')}\n` +
        `Go to your repository Settings → Secrets and variables → Actions and add them.`
    );
    process.exit(1);
  }

  const hasAnyDay = Object.values(reservationsPreferences).some(v => v);
  if (!hasAnyDay) {
    console.warn(
      `⚠️ No days configured — set at least one of MONDAY…SUNDAY in your repository variables ` +
        `(Settings → Secrets and variables → Actions → Variables tab).`
    );
  }
}

async function main() {
  validateConfig();

  const state = loadState();
  const upcomingDates = getUpcomingBookableDates();
  if (allDatesCovered(state, upcomingDates)) {
    console.log(
      `✅ All upcoming sessions already handled (${upcomingDates.join(', ')}) — skipping run, no CAPTCHA needed.`
    );
    return;
  }

  const browser = await launch({
    headless: isCI,
    slowMo: isCI ? 0 : 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    console.log('Creating new page...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    // WODBuster now localizes from the browser language (English on GitHub's
    // runners), and the booking buttons are matched by their Spanish text.
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });

    const loginUrl = `${baseUrl}/account/login.aspx`;

    if (isCI) {
      console.log('Starting captcha flow...');
      await solveCaptchaFlow(page, loginUrl);
    } else {
      console.log('Skipping captcha flow (local dev)...');
      await page.goto(loginUrl);
    }

    console.log('Logging in...');
    await login(page, email, password);

    console.log('Navigating to reservations page...');
    await goToReservations(page);

    console.log('Processing reservations...');
    const dayResults = await processReservations(page, reservationsPreferences);
    saveState(updateState(state, dayResults.map(({ result }) => ({ date: result.date, result }))));
  } catch (error) {
    console.error(
      'Error in the script:',
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('Script finished');
  }
}

main();
