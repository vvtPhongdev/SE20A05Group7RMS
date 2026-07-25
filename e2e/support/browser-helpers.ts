import { expect, type Page } from '@playwright/test';
import type { TestUser } from './test-data';

export async function authenticateAs(page: Page, user: TestUser) {
  await page.addInitScript(
    ({ activeUser, token }) => {
      window.sessionStorage.setItem('token', token);
      window.sessionStorage.setItem('user', JSON.stringify(activeUser));
    },
    { activeUser: user, token: `e2e-token-${user.role}` },
  );
}

export function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

export async function expectHealthyPage(page: Page, pageErrors: string[]) {
  const main = page.locator('main').last();
  await expect(main).toBeVisible();
  await expect
    .poll(async () => (await main.innerText()).trim().length, {
      message: 'The page should render meaningful UI content',
    })
    .toBeGreaterThan(30);

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(
    horizontalOverflow,
    'The document should not overflow beyond the operating-system scrollbar allowance',
  ).toBeLessThanOrEqual(16);
  expect(pageErrors, 'The page should not raise uncaught browser errors').toEqual([]);
}
