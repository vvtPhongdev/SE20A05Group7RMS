import { expect, test, type Page } from '@playwright/test';
import { mockUseCaseApi } from '../support/use-case-api';
import { TEST_USERS } from '../support/test-data';

const completeRegistrationForm = async (page: Page, email = 'new-candidate@rms.test') => {
  await page.goto('/signup');
  await page.getByLabel('Full name').fill('E2E New Candidate');
  await page.getByLabel('Organization').fill('RMS Test Organization');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Password123!');
  await page.getByText(/I agree to RMS workspace access terms/).click();
};

test.describe('Use Cases - authentication', () => {
  test('UC-01/UC-11 rejects a registration whose email already exists', async ({ page }) => {
    await mockUseCaseApi(page, TEST_USERS.CANDIDATE, {
      fail: {
        method: 'POST',
        path: '/auth/register',
        status: 409,
        message: 'Email is already registered',
      },
    });
    await completeRegistrationForm(page, 'existing-candidate@rms.test');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Email is already registered')).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('UC-02 reports an invalid registration OTP', async ({ page }) => {
    await mockUseCaseApi(page, TEST_USERS.CANDIDATE, {
      fail: {
        method: 'POST',
        path: '/auth/verify-register',
        status: 400,
        message: 'Invalid or expired verification code',
      },
    });
    await completeRegistrationForm(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByLabel('Digit 1').fill('1');
    await page.getByLabel('Digit 2').fill('2');
    await page.getByLabel('Digit 3').fill('3');
    await page.getByLabel('Digit 4').fill('4');
    await page.getByLabel('Digit 5').fill('5');
    await page.getByLabel('Digit 6').fill('6');

    await page.getByRole('button', { name: 'Verify email' }).click();

    await expect(page.getByText('Invalid or expired verification code')).toBeVisible();
  });

  test('UC-02 verifies a valid OTP and activates the account', async ({ page }) => {
    await mockUseCaseApi(page, TEST_USERS.CANDIDATE);
    await completeRegistrationForm(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByLabel('Digit 1').fill('1');
    await page.getByLabel('Digit 2').fill('2');
    await page.getByLabel('Digit 3').fill('3');
    await page.getByLabel('Digit 4').fill('4');
    await page.getByLabel('Digit 5').fill('5');
    await page.getByLabel('Digit 6').fill('6');

    await page.getByRole('button', { name: 'Verify email' }).click();

    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible();
  });

  test('UC-04 exposes Google login and registration entry points', async ({ page }) => {
    await mockUseCaseApi(page, TEST_USERS.CANDIDATE);

    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
});
