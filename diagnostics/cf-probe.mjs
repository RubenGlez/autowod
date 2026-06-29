// Throwaway diagnostic: probes what Cloudflare serves on the WodBuster login
// page from this (datacenter) runner. Read-only — no login, no booking.
import { launch } from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';

const url = 'https://wodbuster.com/account/login.aspx';
const interceptor = readFileSync('src/scripts/captcha-interceptor.js', 'utf8');

const browser = await launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
);

const consoleLines = [];
let interceptedRenderParams = false;
page.on('console', msg => {
  const t = msg.text();
  consoleLines.push(t.slice(0, 300));
  if (t.includes('intercepted-params:')) interceptedRenderParams = true;
});

const cfRequests = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('challenges.cloudflare.com') || u.includes('/cdn-cgi/challenge')) {
    cfRequests.push(u.slice(0, 160));
  }
});

await page.evaluateOnNewDocument(interceptor);

const resp = await page
  .goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  .catch(e => {
    console.log('goto error:', e.message);
    return null;
  });

async function snapshot(label) {
  return page.evaluate(
    ({ label }) => ({
      label,
      title: document.title,
      url: location.href,
      hasTurnstile: typeof window.turnstile !== 'undefined',
      hasCfChlOpt: typeof window._cf_chl_opt !== 'undefined',
      cType: window._cf_chl_opt && window._cf_chl_opt.cType,
      hasLoginForm: !!document.querySelector('input[type=password]'),
      hasTurnstileWidget: !!document.querySelector(
        '.cf-turnstile, [data-sitekey], #cf-turnstile'
      ),
      bodyMarkers: [
        'Just a moment',
        'cf-turnstile',
        'challenge-platform',
        'Enable JavaScript',
        'turnstile',
      ].filter(m => document.documentElement.outerHTML.includes(m)),
      iframes: [...document.querySelectorAll('iframe')]
        .map(f => f.src)
        .slice(0, 8),
    }),
    { label }
  );
}

const snaps = [];
snaps.push(await snapshot('t=0s (domcontentloaded)'));
await new Promise(r => setTimeout(r, 8000));
snaps.push(await snapshot('t=8s'));
await new Promise(r => setTimeout(r, 12000));
snaps.push(await snapshot('t=20s'));

const out = {
  httpStatus: resp ? resp.status() : null,
  responseHeaders: resp
    ? {
        'cf-mitigated': resp.headers()['cf-mitigated'] ?? null,
        'cf-ray': resp.headers()['cf-ray'] ?? null,
        server: resp.headers()['server'] ?? null,
      }
    : null,
  interceptedRenderParams,
  cfRequests,
  snapshots: snaps,
  consoleLines,
};

console.log('=== CF PROBE RESULT ===');
console.log(JSON.stringify(out, null, 2));

await page.screenshot({ path: 'cf-probe.png', fullPage: true }).catch(() => {});
const html = await page.content().catch(() => '');
writeFileSync('cf-probe.html', html);

await browser.close();
