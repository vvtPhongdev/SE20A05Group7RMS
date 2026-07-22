import { expect, test } from '@playwright/test';
import { authenticateAs } from '../support/browser-helpers';
import { mockUseCaseApi } from '../support/use-case-api';
import { TEST_USERS } from '../support/test-data';

test.describe('Use Cases - Admin', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Business workflow scenarios run on the desktop project.');
    await mockUseCaseApi(page, TEST_USERS.ADMIN);
    await authenticateAs(page, TEST_USERS.ADMIN);
  });

  test('UC-10/UC-11 creates a user only after email availability is verified', async ({ page }) => {
    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Add User' }).click();

    await page.getByLabel('Full name').fill('New E2E Recruiter');
    await page.getByLabel('Email').fill('new-recruiter@rms.test');
    await page.getByLabel('Initial password').fill('Password123!');
    await page.getByLabel('Role').selectOption({ label: 'HR' });
    await page.getByLabel('Department').last().selectOption({ label: 'Engineering' });
    await page.getByRole('button', { name: 'Verify email' }).click();
    await expect(page.getByText('Email is available.')).toBeVisible();

    const createRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/users',
    );
    await page.getByRole('button', { name: 'Create user' }).click();
    const request = await createRequest;

    expect(request.postDataJSON()).toMatchObject({
      email: 'new-recruiter@rms.test',
      displayName: 'New E2E Recruiter',
      role: 'HR_LEADER',
    });
    await expect(page.getByRole('heading', { name: 'Create user' })).toBeHidden();
  });

  test('UC-11 blocks an email that is already in use', async ({ page }) => {
    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Add User' }).click();
    await page.getByLabel('Email').fill('existing-user@rms.test');
    await page.getByRole('button', { name: 'Verify email' }).click();

    await expect(page.getByText('This email already belongs to an active account.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create user' })).toBeDisabled();
  });

  test('UC-12/UC-13 saves organization profile and workflow settings', async ({ page }) => {
    await page.goto('/admin/settings');
    const organizationName = page
      .getByText('Organization Name', { exact: true })
      .locator('..')
      .getByRole('textbox');
    await organizationName.fill('RMS Automated Organization');

    const saveRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname ===
          `/api/v1/organizations/${TEST_USERS.ADMIN.organizationId}`,
    );
    await page.getByRole('button', { name: 'Save Profile Changes' }).click();
    const request = await saveRequest;

    expect(request.postDataJSON()).toMatchObject({
      name: 'RMS Automated Organization',
      settings: { industry: 'Information Technology' },
    });
    await expect(page.getByText('Organization profile changes saved successfully.')).toBeVisible();
  });

  test('UC-14 creates a department with skill requirements', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.getByRole('button', { name: 'Add Department' }).click();
    const form = page.locator('form').filter({ hasText: 'Add Department' });
    await form
      .getByText('Department Name')
      .locator('..')
      .getByRole('textbox')
      .fill('Quality Engineering');
    await form
      .getByPlaceholder('Add skills, separated by commas or semicolons')
      .first()
      .fill('Playwright, Accessibility');
    await form
      .getByPlaceholder('Add skills, separated by commas or semicolons')
      .first()
      .press('Enter');
    await form
      .getByPlaceholder('Add skills, separated by commas or semicolons')
      .last()
      .fill('Computer Science');
    await form
      .getByPlaceholder('Add skills, separated by commas or semicolons')
      .last()
      .press('Enter');

    const createRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/departments',
    );
    await form.getByRole('button', { name: 'Add Department', exact: true }).click();
    const request = await createRequest;

    expect(request.postDataJSON()).toMatchObject({
      name: 'Quality Engineering',
      code: 'QUALITY_ENGINEERING',
      skills: ['Playwright', 'Accessibility'],
    });
    await expect(page.getByText('Department "Quality Engineering" added.')).toBeVisible();
  });

  test('UC-23 approves a forwarded recruitment request', async ({ page }) => {
    await page.goto('/admin/approval-queue');
    await page.getByRole('button', { name: 'Review Request', exact: true }).click();
    await page.getByRole('button', { name: 'Approve Request' }).click();

    const decisionRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname ===
          '/api/v1/recruitment-requests/request-pending-admin/decision',
    );
    await page.getByRole('button', { name: 'Confirm Approval' }).click();
    const request = await decisionRequest;

    expect(request.postDataJSON()).toMatchObject({ decision: 'APPROVED' });
    await expect(page.getByText('Senior Frontend Engineer').first()).toBeHidden();
  });

  test('UC-27 requires a reason and rejects a submitted campaign plan', async ({ page }) => {
    await page.goto('/admin/approval-queue');
    await page.getByRole('button', { name: 'Campaign Plan Approval' }).click();
    await page.getByRole('button', { name: 'Review Plan', exact: true }).click();
    await page.getByRole('button', { name: 'Reject Plan' }).click();
    await expect(page.getByRole('button', { name: 'Confirm Rejection' })).toBeDisabled();
    await page.getByPlaceholder('Add review notes...').fill('Add a sourcing task and owner.');

    const rejectRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/overall-plan/plan-pending/reject',
    );
    await page.getByRole('button', { name: 'Confirm Rejection' }).click();
    const request = await rejectRequest;

    expect(request.postDataJSON()).toEqual({ revisionNotes: 'Add a sourcing task and owner.' });
  });

  test('UC-53/UC-54 requests more information before a final decision', async ({ page }) => {
    await page.goto('/admin/interview-results');
    await page.getByRole('button', { name: 'Request More Info' }).click();
    await page.getByRole('button', { name: 'Send Information Request' }).click();
    await expect(
      page.getByText('Select at least one information topic or describe the required information.'),
    ).toBeVisible();
    await page
      .getByPlaceholder(/Please provide the panel's evidence/)
      .fill('Clarify the latest salary discussion.');

    const infoRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname ===
          '/api/v1/admin/interview-results/request-e2e/request-info',
    );
    await page.getByRole('button', { name: 'Send Information Request' }).click();
    const request = await infoRequest;

    expect(request.postDataJSON()).toMatchObject({
      candidateId: TEST_USERS.CANDIDATE.id,
      notes: expect.stringContaining('Clarify the latest salary discussion.'),
    });
    await expect(page.getByText(/Information request has been saved/)).toBeVisible();
  });

  test('UC-54/UC-55 makes a hire decision and queues the offer', async ({ page }) => {
    await page.goto('/admin/interview-results');
    await page.getByRole('button', { name: 'Approve Hire → Send Offer' }).click();
    await page.getByLabel('Compensation').fill('45,000,000 VND gross per month');
    await page.getByLabel('Proposed start date').fill('2026-09-01');
    await page.getByLabel('Offer notes').fill('Welcome to the Engineering team.');

    const hireRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/admin/interview-results/request-e2e/decision',
    );
    await page.getByRole('button', { name: 'Approve and Send Offer' }).click();
    const request = await hireRequest;

    expect(request.postDataJSON()).toMatchObject({
      decision: 'HIRE',
      candidateId: TEST_USERS.CANDIDATE.id,
      compensation: '45,000,000 VND gross per month',
      notes: 'Welcome to the Engineering team.',
    });
    await expect(page.getByText(/Offer email has been queued/)).toBeVisible();
  });

  test('UC-59 filters and exports the annual recruitment report as PDF', async ({ page }) => {
    await page.route('**/api/v1/reports/annual/export?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4 E2E annual report',
      });
    });
    await page.goto('/admin/reports');
    await expect(
      page.getByRole('heading', { name: /Annual Recruitment Report 2026/ }),
    ).toBeVisible();

    await page.getByLabel('Year').selectOption('2025');
    await expect(
      page.getByRole('heading', { name: /Annual Recruitment Report 2025/ }),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('annual-report-2025.pdf');
  });
});
