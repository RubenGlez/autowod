import { Page } from 'puppeteer';
import { baseUrl } from '../config';

const EMAIL_INPUT = '#body_body_CtlLogin_IoEmail';
const PASSWORD_INPUT = '#body_body_CtlLogin_IoPassword';
const LOGIN_BUTTON = '#body_body_CtlLogin_CtlAceptar';
// The device question ("remember this browser?") WODBuster sometimes shows
// after the password step. Its answers are styled labels inside this panel.
const DEVICE_PANEL = '#body_body_CtlUp';
const DEVICE_CHOICE = `${DEVICE_PANEL} label.button`;
const LOGIN_ATTEMPTS = 3;

// Waits until the page has moved on from a step. Older WODBuster reloaded the
// whole page after each click; newer versions swap the step in place (or
// redirect from script). So wait for whichever comes first: a page load, the
// address changing, `goneSelector` disappearing, or `appearSelector` showing
// up — or `ms` running out.
async function waitUntilMovedOn(
  page: Page,
  goneSelector: string,
  appearSelector: string | null,
  ms: number
): Promise<void> {
  const startHref = page.url();
  await Promise.race([
    page.waitForNavigation({ timeout: ms }).catch(() => {}),
    // No helper functions inside: tsx would wrap them in a __name() call
    // that doesn't exist in the browser.
    page
      .waitForFunction(
        (start: string, gone: string, appear: string | null) =>
          location.href !== start ||
          !(document.querySelector(gone) as HTMLElement | null)?.offsetParent ||
          (appear !== null &&
            !!(document.querySelector(appear) as HTMLElement | null)
              ?.offsetParent),
        { timeout: ms, polling: 500 },
        startHref,
        goneSelector,
        appearSelector
      )
      .catch(() => {}),
  ]);
  // If a page load did start, let it get far enough to be usable.
  await page
    .waitForFunction(() => document.readyState !== 'loading', {
      timeout: 15000,
    })
    .catch(() => {});
}

export function isLoginPage(url: string): boolean {
  return new URL(url).pathname.toLowerCase().startsWith('/account/login');
}

// Still on the login page or form: the login didn't go through. The form
// check alone isn't enough — WODBuster hides it mid-submit, and we once
// reported "logged in" while still at wodbuster.com/account/login.aspx.
async function stillOnLogin(page: Page): Promise<boolean> {
  if (isLoginPage(page.url())) return true;
  const form = await page.$(EMAIL_INPUT).catch(() => null);
  return !!form && (await form.isVisible().catch(() => false));
}

// What the login page is showing, for the run log. Visible text and control
// names only — never the page's HTML: this repo, and so its run logs, are public.
async function describeLoginPage(page: Page, email: string): Promise<string> {
  const info = await page
    .evaluate((panel: string) => {
      const root = document.querySelector('form') ?? document.body;
      const text = root.innerText.replace(/\s+/g, ' ').trim();
      const controls = Array.from(
        root.querySelectorAll('a, button, label, input[type=submit]')
      )
        .filter(el => !!(el as HTMLElement).offsetParent)
        .slice(0, 15)
        .map(el => {
          const label = (
            (el as HTMLElement).innerText ||
            (el as HTMLInputElement).value ||
            ''
          ).trim();
          const id = el.id ? `#${el.id}` : '';
          const cls = el.className
            ? `.${String(el.className).trim().split(/\s+/).join('.')}`
            : '';
          return `${el.tagName.toLowerCase()}${id}${cls} "${label.slice(0, 40)}"`;
        });
      return {
        title: document.title,
        panel: !!document.querySelector(panel),
        text: text.slice(0, 400),
        controls,
      };
    }, DEVICE_PANEL)
    .catch(() => null);
  if (!info) return 'page could not be inspected';
  const mask = (v: string) => (email ? v.split(email).join('<email>') : v);
  return [
    `title: "${info.title}"`,
    `device panel: ${info.panel ? 'present' : 'absent'}`,
    `text: ${mask(info.text)}`,
    `controls: ${info.controls.map(mask).join(' | ') || 'none'}`,
  ].join('\n   ');
}

// Answers the device question, if WODBuster asks it. Since WODBuster moved
// the login to async postbacks, clicking "don't remember" sometimes leaves
// the page sitting on the question (every failed run since Nov 2026 waited out
// exactly this step). So try each answer in turn, then fall back to opening
// the user area directly: after the password step the session is usually
// already authenticated, and WODBuster sends it on to the gym from there.
async function answerDeviceQuestion(page: Page): Promise<void> {
  const choices = [];
  for (const choice of await page.$$(DEVICE_CHOICE).catch(() => [])) {
    if (await choice.isVisible().catch(() => false)) choices.push(choice);
  }
  if (choices.length === 0) return;

  // "Remember this device" (first) moves on; "don't remember" (second) has
  // been seen to leave the page on the question, so it's only the fallback.
  // Remembering is harmless: every run starts from a fresh browser profile.
  const ordered = choices.length > 1 ? [choices[0], choices[1]] : choices;
  for (const choice of ordered) {
    const label = await choice
      .evaluate(el => el.textContent?.trim() ?? '')
      .catch(() => '');
    console.log(`🖥️ WODBuster asked about this device — answering "${label}"`);
    await choice.click().catch(() => {});
    await waitUntilMovedOn(page, DEVICE_CHOICE, null, 15000);
    if (!(await stillOnLogin(page))) return;
  }

  console.log(
    '🖥️ The device question did not move on — opening the user area directly'
  );
  await page.goto(`${baseUrl}/user/`).catch(() => {});
  await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
}

async function attemptLogin(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  await page.waitForSelector(EMAIL_INPUT, { visible: true, timeout: 30000 });
  await page.type(EMAIL_INPUT, email);
  await page.type(PASSWORD_INPUT, password);
  await page.click(LOGIN_BUTTON);
  await waitUntilMovedOn(page, EMAIL_INPUT, DEVICE_CHOICE, 45000);
  await answerDeviceQuestion(page);
  return !(await stillOnLogin(page));
}

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  for (let attempt = 1; attempt <= LOGIN_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await new Promise(r => setTimeout(r, 5000));
      await page.goto(`${baseUrl}/account/login.aspx`);
    }

    if (await attemptLogin(page, email, password)) {
      const where = new URL(page.url());
      console.log(`🔐 Logged in — now at ${where.host}${where.pathname}`);
      return;
    }

    const where = new URL(page.url());
    console.log(
      `⚠️ Login attempt ${attempt}/${LOGIN_ATTEMPTS} didn't go through (at ${where.host}${where.pathname}):\n   ${await describeLoginPage(page, email)}`
    );
  }

  throw new Error(
    `Login didn't go through after ${LOGIN_ATTEMPTS} attempts: WODBuster still shows the login page`
  );
}
