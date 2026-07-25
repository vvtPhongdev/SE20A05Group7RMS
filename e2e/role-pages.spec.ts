import { expect, test } from '@playwright/test';
import { authenticateAs, collectPageErrors, expectHealthyPage } from './support/browser-helpers';
import { mockApi } from './support/mock-api';
import { ROLE_ROUTES, SIDEBAR_LABELS, TEST_USERS, type TestRole } from './support/test-data';

for (const role of Object.keys(ROLE_ROUTES) as TestRole[]) {
  test.describe(`${role} UI`, () => {
    for (const uiRoute of ROLE_ROUTES[role]) {
      test(`${uiRoute.name === 'dashboard' ? 'UC-58 ' : ''}${uiRoute.name} renders at ${uiRoute.path}`, async ({
        page,
      }) => {
        const pageErrors = collectPageErrors(page);
        const user = TEST_USERS[role];
        await mockApi(page, user);
        await authenticateAs(page, user);

        await page.goto(uiRoute.path);
        await expect(page).toHaveURL(new RegExp(`${uiRoute.path.replaceAll('/', '\\/')}$`));
        await expectHealthyPage(page, pageErrors);
      });
    }

    test('desktop sidebar exposes every expected destination', async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), 'Mobile navigation is covered by route rendering tests.');
      const user = TEST_USERS[role];
      await mockApi(page, user);
      await authenticateAs(page, user);
      await page.goto(ROLE_ROUTES[role][0].path);

      for (const label of SIDEBAR_LABELS[role]) {
        await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
      }
    });
  });
}
