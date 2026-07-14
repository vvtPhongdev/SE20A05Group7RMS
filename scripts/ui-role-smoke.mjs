import { stat } from 'node:fs/promises';
import puppeteer from 'puppeteer';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=')];
  }),
);

const baseUrl = options.url ?? 'http://127.0.0.1:3000';
const accounts = [
  [
    'hr',
    options['hr-email'],
    options['hr-password'],
    '/hr',
    'Recruitment Dashboard',
    'Loading dashboard...',
  ],
  [
    'dept-head',
    options['dept-email'],
    options['dept-password'],
    '/dept-head',
    'Department Dashboard',
    'Loading dashboard...',
  ],
  [
    'candidate',
    options['candidate-email'],
    options['candidate-password'],
    '/candidate',
    'Candidate Application Tracking Dashboard',
    'Loading applications...',
  ],
  [
    'admin',
    options['admin-email'],
    options['admin-password'],
    '/admin',
    'Admin Dashboard - Overview Home',
    'Loading dashboard...',
  ],
];

for (const [role, email, password] of accounts) {
  if (!email || !password) throw new Error(`Missing credentials for ${role}`);
}

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const failures = [];

try {
  for (const viewport of viewports) {
    for (const [role, email, password, expectedPath, heading, loadingLabel] of accounts) {
      const page = await browser.newPage();
      const runtimeErrors = [];
      page.on('pageerror', (error) => runtimeErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') runtimeErrors.push(message.text());
      });

      await page.setViewport(viewport);
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' });
      await page.type('#email', email);
      await page.type('#password', password);
      await Promise.all([
        page.waitForFunction(
          (path) => window.location.pathname.startsWith(path),
          { timeout: 20_000 },
          expectedPath,
        ),
        page.click('button[type="submit"]'),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await page.waitForFunction(
        (text) => document.body.innerText.includes(text),
        { timeout: 20_000 },
        heading,
      );
      await page.waitForFunction(
        (text) => !document.body.innerText.includes(text),
        { timeout: 20_000 },
        loadingLabel,
      );

      const layout = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const overflowingButtons = [...document.querySelectorAll('button')]
          .filter((button) => {
            const style = window.getComputedStyle(button);
            return style.display !== 'none' && button.scrollWidth > button.clientWidth + 2;
          })
          .map((button) => button.textContent?.trim().slice(0, 80) || '<icon button>');
        return {
          title: document.title,
          textLength: document.body.innerText.trim().length,
          horizontalOverflow: document.documentElement.scrollWidth - viewportWidth,
          overflowingButtons,
          overflowingElements: [...document.body.querySelectorAll('*')]
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              return style.position !== 'fixed' && rect.right > viewportWidth + 2;
            })
            .slice(0, 8)
            .map((element) => ({
              tag: element.tagName.toLowerCase(),
              className: element.className?.toString().slice(0, 140) || '',
              right: Math.round(element.getBoundingClientRect().right),
            })),
        };
      });

      const screenshotPath = `/tmp/rms-${role}-${viewport.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const screenshot = await stat(screenshotPath);
      const errors = [];
      if (layout.textLength < 40) errors.push('rendered too little text');
      if (layout.horizontalOverflow > 2) {
        errors.push(
          `has ${layout.horizontalOverflow}px page overflow (${JSON.stringify(layout.overflowingElements)})`,
        );
      }
      if (layout.overflowingButtons.length) {
        errors.push(`has overflowing buttons: ${layout.overflowingButtons.join(', ')}`);
      }
      if (runtimeErrors.length) {
        errors.push(`runtime errors: ${runtimeErrors.join(' | ')}`);
      }
      if (screenshot.size < 10_000) errors.push(`${screenshotPath} appears blank`);
      if (errors.length) {
        failures.push(`${role}/${viewport.name} ${errors.join('; ')}`);
        console.error(`[FAIL] ${failures.at(-1)}`);
      } else {
        console.log(
          `[PASS] ${role}/${viewport.name} ${page.url()} (${layout.textLength} chars, ${screenshot.size} bytes)`,
        );
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) throw new Error(`${failures.length} UI smoke checks failed`);
