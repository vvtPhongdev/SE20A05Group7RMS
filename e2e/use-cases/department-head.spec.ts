import { expect, test } from '@playwright/test';
import { authenticateAs } from '../support/browser-helpers';
import { mockUseCaseApi } from '../support/use-case-api';
import { TEST_USERS } from '../support/test-data';

test.describe('Use Cases - Department Head', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Business workflow scenarios run on the desktop project.');
    await mockUseCaseApi(page, TEST_USERS.DEPARTMENT_HEAD);
    await authenticateAs(page, TEST_USERS.DEPARTMENT_HEAD);
  });

  test('UC-15 validates and adds a department team member', async ({ page }) => {
    await page.goto('/dept-head/settings');
    await page.getByRole('button', { name: 'Add Member' }).first().click();
    const form = page.locator('form').filter({ hasText: 'New members are added as HR' });

    await form.getByRole('button', { name: 'Add Member' }).click();
    await expect(form.getByText('Name and email are required.')).toBeVisible();
    await form.getByPlaceholder('Enter member name').fill('E2E Team Member');
    await form.getByPlaceholder('member@company.com').fill('team-member@rms.test');
    await form.getByPlaceholder('Enter phone number').fill('0903000000');
    await form.getByPlaceholder('At least 8 characters').fill('Password123!');

    const createRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/dept-head/settings/team-members',
    );
    await form.getByRole('button', { name: 'Add Member' }).click();
    const request = await createRequest;

    expect(request.postDataJSON()).toEqual({
      displayName: 'E2E Team Member',
      email: 'team-member@rms.test',
      phone: '0903000000',
      password: 'Password123!',
    });
    await expect(page.getByText('Team member added successfully.')).toBeVisible();
  });

  test('UC-16 validates required data and saves a recruitment request draft', async ({ page }) => {
    await page.goto('/dept-head/create-request');
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByText('Position title is required before saving a draft.')).toBeVisible();

    await page.getByPlaceholder('e.g. Senior Frontend Engineer').fill('QA Automation Engineer');
    const createRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/recruitment-requests',
    );
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    const request = await createRequest;

    expect(request.postDataJSON()).toMatchObject({
      positionTitle: 'QA Automation Engineer',
      submit: false,
    });
    await expect(page.getByText('Draft saved for this recruitment request.')).toBeVisible();
  });

  test('UC-18 submits a complete recruitment request for HR review', async ({ page }) => {
    await page.goto('/dept-head/create-request');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByText('Position title is required.')).toBeVisible();
    await expect(page.getByText('Job description is required.')).toBeVisible();
    await expect(page.getByText('Add at least one required skill.')).toBeVisible();

    await page.getByPlaceholder('e.g. Senior Frontend Engineer').fill('QA Automation Engineer');
    await page
      .getByPlaceholder('Outline primary responsibilities and daily tasks...')
      .fill('Build and maintain reliable end-to-end automation.');
    await page.getByPlaceholder('Type or pick required skills').fill('Playwright');
    await page.getByRole('option', { name: 'Playwright', exact: true }).click();

    const submitRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/recruitment-requests',
    );
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    const request = await submitRequest;

    expect(request.postDataJSON()).toMatchObject({
      positionTitle: 'QA Automation Engineer',
      submit: true,
      skillRequirements: { skills: ['Playwright'] },
    });
    await expect(page).toHaveURL(/\/dept-head\/requests$/);
  });

  test('UC-17 edits an existing request while preserving its workflow context', async ({
    page,
  }) => {
    await page.goto('/dept-head/create-request?requestId=request-e2e');
    await expect(page.getByRole('heading', { name: 'Edit Recruitment Request' })).toBeVisible();
    await page
      .getByPlaceholder('e.g. Senior Frontend Engineer')
      .fill('Senior UI Platform Engineer');

    const updateRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/recruitment-requests/request-e2e',
    );
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    const request = await updateRequest;

    expect(request.postDataJSON()).toMatchObject({ positionTitle: 'Senior UI Platform Engineer' });
    await expect(page.getByText('Draft saved for this recruitment request.')).toBeVisible();
  });

  test('UC-24 opens request tracking details in the correct request scope', async ({ page }) => {
    await page.goto('/dept-head/requests');
    await expect(page.getByText('Senior Frontend Engineer').first()).toBeVisible();
    await page.getByRole('button', { name: 'View', exact: true }).first().click();

    await expect(page.getByText('Expand the product engineering team.')).toBeVisible();
    await expect(page.getByText(/Engineering/).first()).toBeVisible();
  });

  test('UC-51 submits Department Head panel feedback with scores and comments', async ({
    page,
  }) => {
    await page.goto('/dept-head/feedback');
    await expect(page.getByRole('heading', { name: 'Interview Evaluations' })).toBeVisible();
    await expect(page.getByText(TEST_USERS.CANDIDATE.displayName).first()).toBeVisible();

    await page.getByRole('button', { name: 'Fail', exact: true }).click();
    await page
      .getByPlaceholder('Add strengths, risks, and recommendation context for HR...')
      .fill('Needs stronger system design evidence before proceeding.');

    const feedbackRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname ===
          '/api/v1/dept-head/interview-feedback/interview-result-e2e/my-feedback',
    );
    await page.getByRole('button', { name: 'Save Evaluation' }).click();
    const request = await feedbackRequest;

    expect(request.postDataJSON()).toMatchObject({
      decision: 'FAIL',
      notes: 'Needs stronger system design evidence before proceeding.',
    });
    await expect(page.getByText('Your interview evaluation has been saved.')).toBeVisible();
  });
});
