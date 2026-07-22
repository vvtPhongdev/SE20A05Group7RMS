import { expect, test } from '@playwright/test';
import { authenticateAs } from './support/browser-helpers';
import { mockApi } from './support/mock-api';
import { ROLE_HOME, TEST_USERS, type TestRole } from './support/test-data';

test.describe('authentication and role authorization', () => {
  test.describe.configure({ mode: 'serial' });

  test('UC-60 anonymous visitors are redirected to login', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('UC-60 a user cannot open another role portal', async ({ page }) => {
    await mockApi(page, TEST_USERS.CANDIDATE);
    await authenticateAs(page, TEST_USERS.CANDIDATE);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByText('Access Denied')).toBeVisible();
  });

  for (const role of Object.keys(TEST_USERS) as TestRole[]) {
    test(`/dashboard redirects ${role} to the correct home`, async ({ page }) => {
      await mockApi(page, TEST_USERS[role]);
      await authenticateAs(page, TEST_USERS[role]);
      await page.goto('/dashboard');
      await expect(page).toHaveURL(new RegExp(`${ROLE_HOME[role].replace('/', '\\/')}$`));
    });
  }

  test('UC-06 sign out clears the browser session', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'The desktop sidebar owns the sign-out action.');
    await mockApi(page, TEST_USERS.ADMIN);
    await page.goto('/login');
    await page.evaluate((user) => {
      sessionStorage.setItem('token', 'e2e-token-ADMIN');
      sessionStorage.setItem('user', JSON.stringify(user));
    }, TEST_USERS.ADMIN);
    await page.goto('/admin');

    await page.getByRole('button', { name: /Sign Out/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('token'))).toBeNull();
  });
});
