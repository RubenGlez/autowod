import { Page, ConsoleMessage } from 'puppeteer';
import { Solver } from '@2captcha/captcha-solver';
import { readFileSync } from 'fs';
import { join } from 'path';

const solver = new Solver(process.env.TWO_CAPTCHA_API_KEY ?? '');

// How long to wait for a Turnstile widget to render before assuming the page
// has none. WODBuster dropped the login-page captcha in June 2026, so the
// common case is no widget at all — we wait briefly, then proceed to login.
const CAPTCHA_DETECT_MS = 15000;

// Resolves true if a captcha was detected and solved, false if none appeared
// within the detection window. Only rejects if solving a present captcha fails.
async function waitForCaptchaAndSolve(page: Page): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const timeout = setTimeout(() => {
      page.off('console', handleConsole);
      resolve(false);
    }, CAPTCHA_DETECT_MS);

    const handleConsole = async (msg: ConsoleMessage) => {
      const txt = msg.text();
      if (txt.includes('intercepted-params:')) {
        // A widget rendered — stop the detection timer; solving has its own
        // bound via the 2Captcha solver.
        clearTimeout(timeout);
        page.off('console', handleConsole);
        try {
          const params = JSON.parse(txt.replace('intercepted-params:', ''));
          console.log('Captcha params intercepted:', params);

          console.log('Solving the captcha...');
          const res = await solver.cloudflareTurnstile(params);
          console.log(`Solved the captcha ${res.id}`);

          await page.evaluate((token: string) => {
            // @ts-expect-error - cfCallback is injected by our script
            window.cfCallback(token);
          }, res.data);

          // WODBuster keeps long-polling connections open, so waitForNetworkIdle
          // would hang indefinitely. A short timeout is enough for the callback
          // to be processed before we proceed to the login form.
          await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});

          resolve(true);
        } catch (e) {
          reject(e);
        }
      }
    };

    page.on('console', handleConsole);
  });
}

export async function solveCaptchaFlow(
  page: Page,
  url: string,
  maxAttempts = 3
): Promise<void> {
  const preloadFile = readFileSync(
    join(process.cwd(), 'src/scripts/captcha-interceptor.js'),
    'utf8'
  );
  await page.evaluateOnNewDocument(preloadFile);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(url);
      const solved = await waitForCaptchaAndSolve(page);
      console.log(
        solved
          ? 'Captcha solved.'
          : 'No captcha detected — proceeding to login.'
      );
      return;
    } catch (e) {
      if (attempt === maxAttempts) throw e;
      console.log(
        `⚠️ Captcha attempt ${attempt}/${maxAttempts} failed: ${e instanceof Error ? e.message : e}. Retrying in 5 seconds...`
      );
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}
