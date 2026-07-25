import { expect, test } from '@playwright/test';
import { collectPageErrors, expectHealthyPage } from './support/browser-helpers';
import { mockApi } from './support/mock-api';
import { PUBLIC_ROUTES, TEST_USERS } from './support/test-data';

test.describe('public UI', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} renders without browser errors`, async ({ page }) => {
      const pageErrors = collectPageErrors(page);
      await mockApi(page);

      await page.goto(route.path);
      await expect(page.locator('body')).toContainText(route.expectedText);
      await expectHealthyPage(page, pageErrors);
    });
  }

  test('UC-03 login redirects every supported role to its home page', async ({ page }) => {
    await mockApi(page);

    for (const [role, user] of Object.entries(TEST_USERS)) {
      await test.step(role, async () => {
        await page.goto('/login');
        await page.getByLabel('Email address').fill(user.email);
        await page.getByLabel('Password', { exact: true }).fill('Password123!');
        await page.getByRole('button', { name: 'Sign in' }).click();

        const home =
          role === 'ADMIN'
            ? '/admin'
            : role === 'DEPARTMENT_HEAD'
              ? '/dept-head'
              : role === 'HR_LEADER'
                ? '/hr'
                : '/candidate';
        await expect(page).toHaveURL(new RegExp(`${home.replace('/', '\\/')}$`));
        await page.evaluate(() => {
          window.localStorage.clear();
          window.sessionStorage.clear();
        });
      });
    }
  });

  test('UC-03 login reports invalid credentials', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await page.getByLabel('Email address').fill('unknown@rms.test');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('UC-01 sign-up validates the form and reaches email verification', async ({ page }) => {
    await mockApi(page);
    await page.goto('/signup');

    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Full name is required.')).toBeVisible();

    await page.getByLabel('Full name').fill('E2E New Candidate');
    await page.getByLabel('Organization').fill('RMS Test Organization');
    await page.getByLabel('Work email').fill('new-candidate@rms.test');
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByText(/I agree to RMS workspace access terms/).click();
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByLabel('Digit 1')).toBeVisible();
    await expect(page.getByLabel('Digit 6')).toBeVisible();
  });

  test('UC-07 forgot-password submits a reset request', async ({ page }) => {
    await mockApi(page);
    await page.goto('/forgot-password');
    await page.getByLabel('Email address').fill('candidate.e2e@rms.test');
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(page.locator('body')).toContainText(
      /reset email sent|password reset instructions/i,
    );
  });

  test('UC-07 reset-password validates matching passwords and completes', async ({ page }) => {
    await mockApi(page);
    await page.goto('/reset-password?email=e2e%40rms.test&token=reset-e2e');
    await page.getByLabel('New password').fill('Password123!');
    await page.getByLabel('Confirm password').fill('Different123!');
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();

    await page.getByLabel('Confirm password').fill('Password123!');
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.locator('body')).toContainText(/password.*reset|success/i);
  });
});
