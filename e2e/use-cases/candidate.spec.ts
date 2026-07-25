import { expect, test, type Page } from '@playwright/test';
import { authenticateAs } from '../support/browser-helpers';
import { mockUseCaseApi, type UseCaseApiOptions } from '../support/use-case-api';
import { TEST_USERS } from '../support/test-data';

const setupCandidate = async (page: Page, options: UseCaseApiOptions = {}) => {
  await mockUseCaseApi(page, TEST_USERS.CANDIDATE, options);
  await authenticateAs(page, TEST_USERS.CANDIDATE);
};

const profileField = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator('..').getByRole('textbox');

test.describe('Use Cases - Candidate', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Business workflow scenarios run on the desktop project.');
    await setupCandidate(page);
  });

  test('UC-08/UC-38 updates the candidate profile and recruiter visibility', async ({ page }) => {
    await page.goto('/candidate/profile');
    await profileField(page, 'Full Name').fill('E2E Candidate Updated');
    await profileField(page, 'Current Role').fill('Senior Frontend Engineer');
    await profileField(page, 'Professional Summary').fill(
      'I build accessible React applications and reliable Playwright suites.',
    );
    await profileField(page, 'Phone Number').fill('0909123456');
    await profileField(page, 'Location').fill('Da Nang');

    const saveRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/candidate-profiles/me',
    );
    await page.locator('#save-changes-btn').click();
    expect((await saveRequest).postDataJSON()).toMatchObject({
      fullName: 'E2E Candidate Updated',
      phone: '0909123456',
      summary: 'I build accessible React applications and reliable Playwright suites.',
      structuredData: {
        currentRole: 'Senior Frontend Engineer',
        location: 'Da Nang',
        visibility: 'REGISTERED_ONLY',
      },
    });
    await expect(page.getByText('Changes Saved')).toBeVisible();

    await page.locator('input[type="file"][accept*="image/png"]').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    });
    const avatarEditor = page.getByRole('dialog', { name: 'Profile Photo Frame' });
    await expect(avatarEditor).toBeVisible();

    const avatarRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/candidate-profiles/me/avatar',
    );
    await avatarEditor.getByRole('button', { name: 'Save photo' }).click();
    const upload = await avatarRequest;
    expect(upload.headers()['content-type']).toContain('multipart/form-data');
    await expect(avatarEditor).toBeHidden();
  });

  test('UC-34/UC-35 browses a public job and submits an application', async ({ page }) => {
    await page.goto('/candidate');
    await expect(page.getByText('Jobs you can apply to')).toBeVisible();
    await expect(page.getByText('Senior Frontend Engineer').first()).toBeVisible();

    const applyRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/applications',
    );
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    expect((await applyRequest).postDataJSON()).toEqual({ requestId: 'request-e2e' });
    await expect(page.getByText('Application submitted successfully.')).toBeVisible();
  });

  test('UC-39 rejects an unsupported CV file before upload', async ({ page }) => {
    await page.goto('/candidate/upload-cv');
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'candidate-notes.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not a supported CV'),
      });

    await expect(
      page.getByText('Invalid file format. Please upload a PDF, DOCX, or DOC file.'),
    ).toBeVisible();
  });

  test('UC-39/UC-45 uploads a supported CV document and displays parsing success', async ({
    page,
  }) => {
    await page.goto('/candidate/upload-cv');
    const uploadRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/candidate/cvs',
    );
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'candidate-e2e.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 E2E CV'),
      });
    await uploadRequest;

    await expect(page.getByRole('heading', { name: 'CV Upload Success' })).toBeVisible();
    await expect(page.getByText('cv-demo.pdf').first()).toBeVisible();
  });

  test('UC-47 confirms interview attendance', async ({ page }) => {
    await page.goto('/candidate/interviews?id=interview-e2e');
    const confirmRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/interviews/schedules/interview-e2e/confirm',
    );
    await page.getByRole('button', { name: 'Confirm Attendance' }).click();
    await confirmRequest;
    await expect(page.getByRole('button', { name: 'Attendance Confirmed' })).toBeDisabled();
  });

  test('UC-47 requests an interview reschedule with a reason', async ({ page }) => {
    await page.goto('/candidate/interviews?id=interview-e2e');
    await page.getByRole('button', { name: 'Request Reschedule' }).click();
    await page.getByLabel('Preferred time').fill('2027-02-12T10:30');
    await page
      .getByPlaceholder('Reason for changing time')
      .fill('University examination schedule.');

    const rescheduleRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname ===
          '/api/v1/interviews/schedules/interview-e2e/candidate-reschedule',
    );
    await page.getByRole('button', { name: 'Send Request' }).click();
    expect((await rescheduleRequest).postDataJSON()).toMatchObject({
      reason: 'University examination schedule.',
    });
  });

  test('UC-47 cancels an interview with a required reason', async ({ page }) => {
    await page.goto('/candidate/interviews?id=interview-e2e');
    await page.getByPlaceholder('Reason for cancellation').fill('Accepted another opportunity.');

    const cancelRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname ===
          '/api/v1/interviews/schedules/interview-e2e/candidate-cancel',
    );
    await page.getByRole('button', { name: 'Cancel Interview' }).click();
    expect((await cancelRequest).postDataJSON()).toEqual({
      reason: 'Accepted another opportunity.',
    });
  });

  test('UC-56 accepts a pending offer', async ({ page }) => {
    await page.goto('/candidate/offer/offer-e2e');
    const acceptRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/offers/offer-e2e/respond',
    );
    await page.getByRole('button', { name: 'Accept offer' }).click();
    expect((await acceptRequest).postDataJSON()).toEqual({ response: 'ACCEPT' });
    await expect(page.getByText('Response: ACCEPTED')).toBeVisible();
  });

  test('UC-56 requires a reason before declining an offer', async ({ page }) => {
    await page.goto('/candidate/offer/offer-e2e');
    await page.getByRole('button', { name: 'Decline offer' }).click();
    await expect(page.getByText('Please provide a reason for declining this offer.')).toBeVisible();
    await page
      .getByPlaceholder('Reason for declining (required only if you decline this offer)')
      .fill('The proposed start date is not feasible.');

    const declineRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/offers/offer-e2e/respond',
    );
    await page.getByRole('button', { name: 'Decline offer' }).click();
    expect((await declineRequest).postDataJSON()).toEqual({
      response: 'DECLINE',
      note: 'The proposed start date is not feasible.',
    });
    await expect(page.getByText('Response: DECLINED')).toBeVisible();
  });

  test('UC-57 marks a notification read/unread and archives it', async ({ page }) => {
    await page.goto('/candidate/notifications');
    await expect(page.getByRole('heading', { name: 'Interview invitation' }).last()).toBeVisible();

    const readRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/notifications/notification-e2e/read',
    );
    await page.getByTitle('Mark as read').click();
    await readRequest;

    const unreadRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname === '/api/v1/notifications/notification-e2e/unread',
    );
    await page.getByTitle('Mark as unread').click();
    await unreadRequest;

    const archiveRequest = page.waitForRequest(
      (request) =>
        request.method() === 'DELETE' &&
        new URL(request.url()).pathname === '/api/v1/notifications/notification-e2e',
    );
    await page.getByTitle('Archive Alert').click();
    await archiveRequest;
    await expect(page.getByText('Interview invitation', { exact: true })).toHaveCount(0);
  });
});
