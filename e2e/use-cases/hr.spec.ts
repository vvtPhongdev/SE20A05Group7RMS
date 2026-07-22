import { expect, test, type Page } from '@playwright/test';
import { authenticateAs } from '../support/browser-helpers';
import { mockUseCaseApi, type UseCaseApiOptions } from '../support/use-case-api';
import { TEST_USERS } from '../support/test-data';

const setupHr = async (page: Page, options: UseCaseApiOptions = {}) => {
  await mockUseCaseApi(page, TEST_USERS.HR_LEADER, options);
  await authenticateAs(page, TEST_USERS.HR_LEADER);
};

test.describe('Use Cases - HR', () => {
  test.beforeEach(async ({ isMobile }) => {
    test.skip(Boolean(isMobile), 'Business workflow scenarios run on the desktop project.');
  });

  test('UC-19/UC-22 claims a request and forwards it to Admin', async ({ page }) => {
    await setupHr(page);
    await page.goto('/hr/requests');
    await page.getByRole('button', { name: 'Review', exact: true }).first().click();

    const claimRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname ===
          '/api/v1/recruitment-requests/request-pending-hr/assign',
    );
    await page.getByRole('button', { name: 'Claim Now' }).click();
    expect((await claimRequest).postDataJSON()).toEqual({
      hrManagerId: TEST_USERS.HR_LEADER.id,
    });

    const forwardRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname ===
          '/api/v1/recruitment-requests/request-pending-hr/forward-to-admin',
    );
    await page.getByRole('button', { name: 'Forward to Admin' }).click();
    await forwardRequest;
    await expect(page.getByText('Forwarded to Admin').first()).toBeVisible();
  });

  test('UC-17/UC-20 edits details and returns a request for revision', async ({ page }) => {
    await setupHr(page);
    await page.goto('/hr/requests');
    await page.getByRole('button', { name: 'Review', exact: true }).first().click();
    await page.getByRole('button', { name: 'Claim Now' }).click();
    await page.getByRole('button', { name: 'Edit Details' }).click();
    await page
      .getByPlaceholder('e.g. React, TypeScript, Node.js')
      .fill('React, TypeScript, Playwright, Accessibility');
    await page
      .getByPlaceholder('Explain the requested changes for the Department Head...')
      .fill('Clarify the accessibility acceptance criteria.');

    const updateRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/recruitment-requests/request-pending-hr',
    );
    const returnRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname ===
          '/api/v1/recruitment-requests/request-pending-hr/return-for-revision',
    );
    await page.getByRole('button', { name: 'Send to Dept Head' }).click();

    expect((await updateRequest).postDataJSON()).toMatchObject({
      skillRequirements: {
        skills: ['React', 'TypeScript', 'Playwright', 'Accessibility'],
      },
    });
    expect((await returnRequest).postDataJSON()).toEqual({
      feedback: 'Clarify the accessibility acceptance criteria.',
    });
  });

  test('UC-25 creates a draft overall recruitment plan', async ({ page }) => {
    await setupHr(page);
    await page.goto('/hr/campaigns');
    await page.getByRole('button', { name: 'Add Plan' }).click();
    const dialog = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Create Draft Plan' }),
    });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Recruitment Request').selectOption('request-no-plan');
    await dialog.getByLabel('Start Date').fill('2026-08-01');
    await dialog.getByLabel('End Date').fill('2026-09-01');

    const createRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/overall-plan',
    );
    await dialog.getByRole('button', { name: 'Create Draft Plan' }).click();
    expect((await createRequest).postDataJSON()).toMatchObject({
      hiringRequestId: 'request-no-plan',
    });
    await expect(page).toHaveURL(/\/hr\/campaigns\/request-no-plan$/);
  });

  test('UC-26 submits a complete draft plan for Admin approval', async ({ page }) => {
    await setupHr(page, { planStatus: 'DRAFT' });
    await page.goto('/hr/campaigns/request-e2e');

    const submitRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/overall-plan/plan-e2e/submit',
    );
    await page.getByRole('button', { name: 'Submit Plan to Admin' }).click();
    await submitRequest;
    await expect(page.getByText('Awaiting Admin Approval')).toBeVisible();
  });

  test('UC-28 starts an approved campaign with assigned and scheduled tasks', async ({ page }) => {
    await setupHr(page, { planStatus: 'APPROVED' });
    await page.goto('/hr/campaigns/request-e2e');

    const startRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/overall-plan/plan-e2e/start-campaign',
    );
    await page.getByRole('button', { name: 'Start Campaign' }).click();
    await startRequest;
    await expect(page.getByText('Campaign Active')).toBeVisible();
  });

  test('UC-29/UC-30 updates a task duration and assigns an HR member', async ({ page }) => {
    await setupHr(page, { planStatus: 'DRAFT' });
    await page.goto('/hr/campaigns/request-e2e');

    const assignRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/task-plan/task-e2e/assign-recruiter',
    );
    await page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Assign HR member' }) })
      .selectOption(TEST_USERS.HR_LEADER.id);
    expect((await assignRequest).postDataJSON()).toEqual({ assignedToId: TEST_USERS.HR_LEADER.id });

    await page.getByRole('button', { name: 'Set task dates' }).click();
    const durationInput = page
      .getByText('Set duration (days)')
      .locator('..')
      .getByRole('spinbutton');
    await durationInput.fill('5');
    const updateRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/task-plan/task-e2e',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await updateRequest).postDataJSON()).toEqual({ durationDays: 5 });
  });

  test('UC-31 marks an assigned task complete in an active campaign', async ({ page }) => {
    await setupHr(page, { planStatus: 'APPROVED', requestStatus: 'ACTIVE' });
    await page.goto('/hr/campaigns/request-e2e');

    const statusRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/task-plan/task-e2e/status',
    );
    await page.getByRole('button', { name: 'Mark done' }).click();
    expect((await statusRequest).postDataJSON()).toEqual({ status: 'COMPLETED' });
  });

  test('UC-33 saves and publishes a job posting', async ({ page }) => {
    await setupHr(page, { planStatus: 'APPROVED' });
    await page.goto('/hr/job-postings/request-e2e');
    await page.getByLabel('Posting Title').fill('Senior Accessibility Engineer');
    await page.getByLabel('Job Description').fill('Build inclusive products with React.');

    const saveRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/job-postings/job-e2e',
    );
    await page.getByRole('button', { name: 'Save Changes' }).click();
    expect((await saveRequest).postDataJSON()).toMatchObject({
      title: 'Senior Accessibility Engineer',
      description: 'Build inclusive products with React.',
      visibility: 'PUBLIC',
    });

    const publishRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/job-postings/job-e2e/publish',
    );
    await page.getByRole('button', { name: 'Publish' }).click();
    await publishRequest;
    await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
  });

  test('UC-40/UC-42/UC-43/UC-44 searches expanded talent evidence, views CV, and shortlists', async ({
    page,
  }) => {
    await setupHr(page);
    await page.goto('/hr/search?requestId=request-e2e');
    await page
      .getByPlaceholder(/backend developer with Go/)
      .fill('React TypeScript accessibility engineer');

    const searchRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/talent/search',
    );
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    expect((await searchRequest).postDataJSON()).toMatchObject({
      query: 'React TypeScript accessibility engineer',
      filters: { requestId: 'request-e2e', campaignMembersOnly: true },
    });
    await expect(page.getByText(TEST_USERS.CANDIDATE.displayName)).toBeVisible();
    await expect(page.getByText('React 98%')).toBeVisible();
    await expect(page.getByText('Query Terms Matched')).toBeVisible();
    await expect(page.getByText('Playwright', { exact: true }).last()).toBeVisible();

    const cvRequest = page.waitForRequest(
      (request) =>
        request.method() === 'GET' &&
        new URL(request.url()).pathname ===
          `/api/v1/candidate/cvs/candidate/${TEST_USERS.CANDIDATE.id}/latest/file`,
    );
    await page.getByRole('button', { name: 'View CV' }).click();
    await cvRequest;

    const shortlistRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/talent/screening-decision',
    );
    await page.getByRole('button', { name: 'Shortlist', exact: true }).click();
    expect((await shortlistRequest).postDataJSON()).toMatchObject({
      candidateIds: [TEST_USERS.CANDIDATE.id],
      status: 'SHORTLISTED',
    });
  });

  test('UC-09/UC-46/UC-49 creates Google Meet and sends an interview invitation', async ({
    page,
  }) => {
    await setupHr(page, { interviewStatus: 'CANCELLED' });
    await page.goto('/hr/interviews?requestId=request-e2e');

    const scheduleForm = page
      .locator('form')
      .filter({ hasText: 'Select at least 2 panel members' });
    await expect(
      scheduleForm.getByText(new RegExp(TEST_USERS.CANDIDATE.displayName)).first(),
    ).toBeVisible();
    const interviewerCombobox = scheduleForm
      .locator('label')
      .filter({ hasText: 'Interviewers' })
      .getByRole('combobox');
    await interviewerCombobox.click();
    await page
      .getByRole('option', { name: new RegExp(TEST_USERS.DEPARTMENT_HEAD.displayName) })
      .click();
    await page.getByLabel('Date', { exact: true }).fill('2027-02-10');
    await page.getByLabel('Time', { exact: true }).fill('09:00');

    const meetRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/google-calendar/meet',
    );
    await page.getByRole('button', { name: 'Create Google Meet' }).click();
    expect((await meetRequest).postDataJSON()).toMatchObject({
      reminderMinutesBefore: 30,
    });
    await expect(page.getByPlaceholder('https://meet.google.com/abc-defg-hij')).toHaveValue(
      'https://meet.google.com/e2e-generated-room',
    );

    const invitationRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/interviews/schedules',
    );
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    expect((await invitationRequest).postDataJSON()).toMatchObject({
      requestId: 'request-e2e',
      candidateId: TEST_USERS.CANDIDATE.id,
      interviewers: expect.arrayContaining([
        TEST_USERS.HR_LEADER.id,
        TEST_USERS.DEPARTMENT_HEAD.id,
      ]),
    });
  });

  test('UC-50/UC-51/UC-52 saves panel feedback and sends the final recommendation', async ({
    page,
  }) => {
    await setupHr(page);
    await page.goto('/hr/results');
    await expect(
      page.getByText(`Record Results - ${TEST_USERS.CANDIDATE.displayName}`),
    ).toBeVisible();
    await page
      .getByPlaceholder('Panel member observations...')
      .last()
      .fill('Strong technical and communication performance.');

    const feedbackRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname ===
          '/api/v1/hr/interview-results/interview-result-e2e/my-feedback',
    );
    await page.getByRole('button', { name: 'Save Evaluation' }).click();
    expect((await feedbackRequest).postDataJSON()).toMatchObject({
      decision: 'PASS',
      notes: 'Strong technical and communication performance.',
    });
    await expect(page.getByText('Your evaluation was saved successfully.')).toBeVisible();

    await page.getByRole('button', { name: 'Recommend Hire' }).click();
    await page
      .getByPlaceholder('Provide a high-level justification for the recommendation...')
      .fill('Panel evidence supports hiring this candidate.');
    const finalRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname ===
          '/api/v1/hr/interview-results/interview-result-e2e/final-recommendation',
    );
    await page.getByRole('button', { name: 'Send Recommendation to Admin' }).click();
    expect((await finalRequest).postDataJSON()).toMatchObject({
      finalRecommendation: 'Recommend Hire',
    });
    await expect(page.getByText(/Final recommendation sent to Admin/)).toBeVisible();
  });
});
