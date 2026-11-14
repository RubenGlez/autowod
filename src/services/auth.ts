import { Page } from 'puppeteer';

const EMAIL_INPUT = '#body_body_CtlLogin_IoEmail';
const PASSWORD_INPUT = '#body_body_CtlLogin_IoPassword';
const LOGIN_BUTTON = '#body_body_CtlLogin_CtlAceptar';
// "Don't remember this browser": second button of the device question.
const DEVICE_CHOICE = '#body_body_CtlUp label.button:nth-of-type(2)';

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

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.type(EMAIL_INPUT, email);
  await page.type(PASSWORD_INPUT, password);
  await page.click(LOGIN_BUTTON);
  await waitUntilMovedOn(page, EMAIL_INPUT, DEVICE_CHOICE, 45000);

  // Answer "don't remember this browser" if WODBuster asks.
  const deviceChoice = await page.$(DEVICE_CHOICE).catch(() => null);
  if (deviceChoice && (await deviceChoice.isVisible().catch(() => false))) {
    await deviceChoice.click();
    await waitUntilMovedOn(page, DEVICE_CHOICE, null, 30000);
  }

  // Still looking at the login form: the login didn't go through.
  const form = await page.$(EMAIL_INPUT).catch(() => null);
  const where = new URL(page.url());
  if (form && (await form.isVisible().catch(() => false))) {
    throw new Error(
      `Login didn't go through: WODBuster still shows the login form at ${where.host}${where.pathname}`
    );
  }
  console.log(`🔐 Logged in — now at ${where.host}${where.pathname}`);
}
