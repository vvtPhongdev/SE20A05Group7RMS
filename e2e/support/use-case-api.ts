import type { Page, Route } from '@playwright/test';
import { mockApi } from './mock-api';
import { TEST_USERS, type TestUser } from './test-data';

const now = '2026-07-20T08:00:00.000Z';
const futureInterview = '2027-02-10T02:00:00.000Z';
const organizationId = TEST_USERS.ADMIN.organizationId;
const department = {
  id: '00000000-0000-4000-8000-000000000201',
  organizationId,
  name: 'Engineering',
  code: 'ENG',
  skills: ['React', 'TypeScript', 'Playwright'],
  bachelorRequirements: ['Computer Science', 'Software Engineering'],
  headUserId: TEST_USERS.DEPARTMENT_HEAD.id,
};

export interface RecordedApiCall {
  method: string;
  path: string;
  body: unknown;
}

export interface UseCaseApiOptions {
  planStatus?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requestStatus?: string;
  interviewStatus?: string;
  offerStatus?: 'SENT' | 'ACCEPTED' | 'DECLINED';
  fail?: { method: string; path: string | RegExp; status?: number; message: string };
}

export interface UseCaseApiController {
  calls: RecordedApiCall[];
}

const fulfillJson = async (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const matchesPath = (actual: string, expected: string | RegExp) =>
  typeof expected === 'string' ? actual === expected : expected.test(actual);

const safeBody = (route: Route) => {
  try {
    return route.request().postDataJSON() as unknown;
  } catch {
    return route.request().postData() ? { multipart: true } : null;
  }
};

export async function mockUseCaseApi(
  page: Page,
  activeUser: TestUser,
  options: UseCaseApiOptions = {},
): Promise<UseCaseApiController> {
  await mockApi(page, activeUser);

  const calls: RecordedApiCall[] = [];
  let planStatus = options.planStatus ?? 'DRAFT';
  let requestStatus = options.requestStatus ?? 'APPROVED';
  let interviewStatus = options.interviewStatus ?? 'SCHEDULED';
  let offerStatus = options.offerStatus ?? 'SENT';
  let notificationRead = false;
  let postingStatus = 'DRAFT';

  const teamMember = {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'interviewer.e2e@rms.test',
    displayName: 'E2E Interviewer',
    role: 'HR_LEADER',
    isActive: true,
    updatedAt: now,
    organizationId,
    departmentId: department.id,
    department,
    phone: '0901000000',
  };

  const secondInterviewer = {
    id: '66666666-6666-4666-8666-666666666666',
    email: 'panel.e2e@rms.test',
    displayName: 'E2E Panel Member',
    role: 'DEPARTMENT_HEAD',
    isActive: true,
    updatedAt: now,
    organizationId,
    departmentId: department.id,
    department,
    phone: '0902000000',
  };

  const task = {
    id: 'task-e2e',
    overallPlanId: 'plan-e2e',
    taskType: 'INTERVIEW_COORDINATION',
    status: 'IN_PROGRESS',
    startDate: '2026-07-21T00:00:00.000Z',
    endDate: '2026-08-10T00:00:00.000Z',
    assignedTo: {
      id: TEST_USERS.HR_LEADER.id,
      displayName: TEST_USERS.HR_LEADER.displayName,
      role: 'HR_LEADER',
      email: TEST_USERS.HR_LEADER.email,
    },
    reminders: [],
  };

  const plan = () => ({
    id: 'plan-e2e',
    hiringRequestId: 'request-e2e',
    requestId: 'request-e2e',
    status: planStatus,
    startDate: '2026-07-21T00:00:00.000Z',
    endDate: '2026-08-21T00:00:00.000Z',
    revisionNotes: planStatus === 'REJECTED' ? 'Add a sourcing task before resubmitting.' : null,
    createdBy: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
    approvedBy:
      planStatus === 'APPROVED'
        ? { id: TEST_USERS.ADMIN.id, displayName: TEST_USERS.ADMIN.displayName }
        : null,
    updatedAt: now,
    tasks: [task],
    _count: { tasks: 1 },
  });

  const requestBase = (id: string, status: string, overrides: Record<string, unknown> = {}) => ({
    id,
    position: 'Senior Frontend Engineer',
    department,
    requester: {
      id: TEST_USERS.DEPARTMENT_HEAD.id,
      displayName: TEST_USERS.DEPARTMENT_HEAD.displayName,
    },
    reviewedBy: null,
    owner: null,
    status,
    urgency: 'HIGH',
    headcount: 2,
    filledHeadcount: 0,
    jobDescription: 'Build accessible recruitment workflows with React and TypeScript.',
    justification: 'Expand the product engineering team.',
    skillRequirements: {
      skills: ['React', 'TypeScript', 'Playwright'],
      salaryMin: '30000000',
      salaryMax: '45000000',
      employmentType: 'Full-time',
    },
    forwardedToAdmin: false,
    history: [
      {
        action: 'SUBMITTED_FOR_REVIEW',
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_HR_REVIEW',
        createdAt: now,
        actor: TEST_USERS.DEPARTMENT_HEAD.displayName,
      },
    ],
    createdAt: now,
    updatedAt: now,
    overallPlan: null,
    ...overrides,
  });

  const workflowRequest = () =>
    requestBase('request-e2e', requestStatus, {
      reviewedBy: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
      owner: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
      overallPlan: plan(),
    });

  const pendingHrRequest = () => requestBase('request-pending-hr', 'PENDING_HR_REVIEW');
  const pendingAdminRequest = () =>
    requestBase('request-pending-admin', 'PENDING_BOSS_APPROVAL', {
      forwardedToAdmin: true,
      reviewedBy: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
      owner: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
    });
  const requestWithoutPlan = () =>
    requestBase('request-no-plan', 'APPROVED', {
      position: 'Product Designer',
      reviewedBy: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
      owner: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
    });
  const planApprovalRequest = () =>
    requestBase('request-plan-approval', 'APPROVED', {
      position: 'Backend Engineer',
      reviewedBy: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
      owner: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
      overallPlan: { ...plan(), id: 'plan-pending', status: 'PENDING_APPROVAL' },
    });

  const interview = () => ({
    id: 'interview-e2e',
    requestId: 'request-e2e',
    candidateId: TEST_USERS.CANDIDATE.id,
    scheduledAt: futureInterview,
    duration: 60,
    location: 'https://meet.google.com/e2e-test-room',
    interviewers: [TEST_USERS.HR_LEADER.id, TEST_USERS.DEPARTMENT_HEAD.id],
    panel: [
      {
        id: TEST_USERS.HR_LEADER.id,
        displayName: TEST_USERS.HR_LEADER.displayName,
        role: 'HR_LEADER',
      },
      {
        id: TEST_USERS.DEPARTMENT_HEAD.id,
        displayName: TEST_USERS.DEPARTMENT_HEAD.displayName,
        role: 'DEPARTMENT_HEAD',
      },
    ],
    status: interviewStatus,
    request: { position: 'Senior Frontend Engineer', department },
  });

  const candidateProfile = (overrides: Record<string, unknown> = {}) => ({
    id: TEST_USERS.CANDIDATE.id,
    fullName: TEST_USERS.CANDIDATE.displayName,
    email: TEST_USERS.CANDIDATE.email,
    phone: '0900000000',
    summary: 'Frontend engineer focused on accessible web applications.',
    structuredData: {
      currentRole: 'Frontend Engineer',
      location: 'Ho Chi Minh City',
      linkedinUrl: 'https://www.linkedin.com/in/e2e-candidate',
      visibility: 'PUBLIC',
      openToNewOpportunities: true,
      experience: [],
      education: [],
      skills: ['React', 'TypeScript', 'Playwright'],
    },
    applications: [],
    interviews: [interview()],
    cvDocuments: [{ id: 'cv-e2e', fileName: 'candidate-e2e.pdf', parsedAt: now }],
    updatedAt: now,
    ...overrides,
  });

  const application = {
    id: 'application-e2e',
    requestId: 'request-e2e',
    candidateId: TEST_USERS.CANDIDATE.id,
    status: 'INTERVIEW',
    createdAt: now,
    collectedBy: null,
    candidate: {
      id: TEST_USERS.CANDIDATE.id,
      fullName: TEST_USERS.CANDIDATE.displayName,
      email: TEST_USERS.CANDIDATE.email,
      structuredData: { currentRole: 'Frontend Engineer', skills: ['React', 'TypeScript'] },
      cvDocuments: [{ screeningStatus: 'SHORTLISTED' }],
    },
  };

  const jobPosting = () => ({
    id: 'job-e2e',
    requestId: 'request-e2e',
    title: 'Senior Frontend Engineer',
    description: 'Build accessible recruitment workflows.',
    requirements: { skills: ['React', 'TypeScript', 'Playwright'] },
    visibility: 'PUBLIC',
    status: postingStatus,
    startDate: '2026-07-21T00:00:00.000Z',
    expireDate: '2027-12-31T23:59:59.000Z',
    mediaAssets: [],
    notices: [],
    request: workflowRequest(),
  });

  const offer = () => ({
    id: 'offer-e2e',
    positionTitle: 'Senior Frontend Engineer',
    departmentName: department.name,
    compensation: '40,000,000 VND / month',
    startDate: '2026-08-15T00:00:00.000Z',
    content: 'We are pleased to offer you the Senior Frontend Engineer position.',
    status: offerStatus,
    response: offerStatus === 'ACCEPTED' ? 'ACCEPT' : offerStatus === 'DECLINED' ? 'DECLINE' : null,
    responseNote: null,
    sentAt: now,
    respondedAt: offerStatus === 'SENT' ? null : now,
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, '') || '/';
    const method = request.method();
    const body = safeBody(route);
    calls.push({ method, path, body });

    if (options.fail && method === options.fail.method && matchesPath(path, options.fail.path)) {
      await fulfillJson(route, { message: options.fail.message }, options.fail.status ?? 500);
      return;
    }

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204 });
      return;
    }

    if (path === '/organizations' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: organizationId,
          name: 'RMS E2E Organization',
          code: 'RMS-E2E',
          settings: {
            industry: 'Information Technology',
            orgSize: '51-200 employees',
            approvalWorkflow: {},
            pipelineStages: [],
          },
        },
      ]);
      return;
    }

    if (path === `/organizations/${organizationId}`) {
      await fulfillJson(route, {
        id: organizationId,
        name: 'RMS E2E Organization',
        code: 'RMS-E2E',
        address: 'Ho Chi Minh City',
        phone: '0900000000',
        email: 'contact@rms.test',
        settings: {
          industry: 'Information Technology',
          orgSize: '51-200 employees',
          approvalWorkflow: {},
          pipelineStages: [],
          deptHead: {},
        },
      });
      return;
    }

    if (path === '/departments' && method === 'GET') {
      await fulfillJson(route, [department]);
      return;
    }

    if (path === '/departments' && method === 'POST') {
      await fulfillJson(
        route,
        { ...department, ...(body as object), id: 'department-created' },
        201,
      );
      return;
    }

    if (/^\/departments\/[^/]+$/.test(path) && ['PATCH', 'DELETE'].includes(method)) {
      await fulfillJson(
        route,
        method === 'DELETE' ? { success: true } : { ...department, ...(body as object) },
      );
      return;
    }

    if (path === '/users/email-exists' && method === 'GET') {
      const email = url.searchParams.get('email') ?? '';
      await fulfillJson(route, { exists: email.includes('existing'), isActive: true });
      return;
    }

    if (path === '/users' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          { ...TEST_USERS.ADMIN, isActive: true, updatedAt: now, department: null },
          { ...TEST_USERS.HR_LEADER, isActive: true, updatedAt: now, department },
          { ...TEST_USERS.DEPARTMENT_HEAD, isActive: true, updatedAt: now, department },
          { ...TEST_USERS.CANDIDATE, isActive: true, updatedAt: now, department: null },
          teamMember,
          secondInterviewer,
        ],
      });
      return;
    }

    if (path === '/users/interviewers' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          { ...TEST_USERS.HR_LEADER, isActive: true },
          { ...TEST_USERS.DEPARTMENT_HEAD, isActive: true },
          teamMember,
          secondInterviewer,
        ],
      });
      return;
    }

    if (path === '/users' && method === 'POST') {
      const payload = (body ?? {}) as Record<string, unknown>;
      await fulfillJson(
        route,
        {
          id: 'user-created',
          email: payload.email,
          displayName: payload.displayName,
          role: payload.role,
          isActive: true,
          updatedAt: now,
          department,
        },
        201,
      );
      return;
    }

    if (/^\/users\/[^/]+\/(role|status)$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, { ...teamMember, ...(body as object) });
      return;
    }

    if (/^\/users\/[^/]+$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, { ...teamMember, ...(body as object) });
      return;
    }

    if (path === '/dept-head/settings/team-members' && method === 'POST') {
      const payload = (body ?? {}) as Record<string, unknown>;
      await fulfillJson(
        route,
        {
          ...teamMember,
          id: 'team-member-created',
          displayName: payload.displayName,
          email: payload.email,
          phone: payload.phone,
        },
        201,
      );
      return;
    }

    if (path === '/me/profile') {
      if (activeUser.role === 'CANDIDATE') {
        await fulfillJson(route, {
          ...candidateProfile(),
          ...(method === 'PATCH' ? (body as object) : {}),
          updatedAt: now,
        });
      } else {
        await fulfillJson(route, {
          ...activeUser,
          phone: '0900000000',
          departmentId: department.id,
          department,
          departmentsHeaded:
            activeUser.role === 'DEPARTMENT_HEAD'
              ? [department]
              : activeUser.department
                ? [department]
                : [],
          ...(method === 'PATCH' ? (body as object) : {}),
        });
      }
      return;
    }

    if (path === '/candidate-profiles/me') {
      await fulfillJson(
        route,
        candidateProfile(
          method === 'PATCH'
            ? {
                ...(body as object),
                updatedAt: now,
              }
            : {},
        ),
      );
      return;
    }

    if (path === '/candidate-profiles/me/avatar' && ['POST', 'DELETE'].includes(method)) {
      await fulfillJson(route, { avatarUrl: null, updatedAt: now });
      return;
    }

    if (path === '/reports/realtime-tracking' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'request-e2e',
          requestId: 'request-e2e',
          position: 'Senior Frontend Engineer',
          department: department.name,
          status: requestStatus,
          targetHeadcount: 2,
          filledHeadcount: 0,
          createdBy: TEST_USERS.DEPARTMENT_HEAD.displayName,
          handler: TEST_USERS.HR_LEADER.displayName,
          createdAt: now,
          urgency: 'HIGH',
          latestLog: { action: 'SUBMITTED_FOR_REVIEW', createdAt: now },
          updatedAt: now,
        },
      ]);
      return;
    }

    if (path === '/reports/hr-request-queue-summary' && method === 'GET') {
      await fulfillJson(route, {
        averageReviewTimeDays: 1.5,
        oldestPendingDays: 2,
        reviewedThisWeek: 3,
        forwardedThisWeek: 2,
        distribution: [{ department: department.name, count: 1, percentage: 100 }],
      });
      return;
    }

    if (path === '/recruitment-requests' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          pendingHrRequest(),
          pendingAdminRequest(),
          requestWithoutPlan(),
          workflowRequest(),
          planApprovalRequest(),
        ],
        meta: { total: 5, page: 1, limit: 100, totalPages: 1 },
      });
      return;
    }

    if (path === '/recruitment-requests' && method === 'POST') {
      const payload = (body ?? {}) as Record<string, unknown>;
      await fulfillJson(
        route,
        requestBase('request-created', payload.submit ? 'PENDING_HR_REVIEW' : 'DRAFT', payload),
        201,
      );
      return;
    }

    if (/^\/recruitment-requests\/[^/]+$/.test(path) && method === 'GET') {
      const id = path.split('/').at(-1) ?? 'request-e2e';
      const found =
        [
          pendingHrRequest(),
          pendingAdminRequest(),
          requestWithoutPlan(),
          workflowRequest(),
          planApprovalRequest(),
        ].find((item) => item.id === id) ?? workflowRequest();
      await fulfillJson(route, found);
      return;
    }

    if (/^\/recruitment-requests\/[^/]+\/assign$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, {
        ...pendingHrRequest(),
        owner: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
        reviewedBy: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
      });
      return;
    }

    if (/^\/recruitment-requests\/[^/]+\/forward-to-admin$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, {
        ...pendingHrRequest(),
        status: 'PENDING_BOSS_APPROVAL',
        forwardedToAdmin: true,
      });
      return;
    }

    if (/^\/recruitment-requests\/[^/]+\/return-for-revision$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, { ...pendingHrRequest(), status: 'REVISION_NEEDED' });
      return;
    }

    if (/^\/recruitment-requests\/[^/]+\/submit$/.test(path) && method === 'PATCH') {
      requestStatus = 'PENDING_HR_REVIEW';
      await fulfillJson(route, { ...workflowRequest(), status: requestStatus });
      return;
    }

    if (
      /^\/recruitment-requests\/[^/]+\/(decision|request-changes)$/.test(path) &&
      method === 'PATCH'
    ) {
      requestStatus = path.endsWith('/decision') ? 'APPROVED' : 'REVISION_NEEDED';
      await fulfillJson(route, { ...workflowRequest(), status: requestStatus });
      return;
    }

    if (/^\/recruitment-requests\/[^/]+$/.test(path) && ['PATCH', 'DELETE'].includes(method)) {
      await fulfillJson(
        route,
        method === 'DELETE' ? { success: true } : { ...workflowRequest(), ...(body as object) },
      );
      return;
    }

    if (/^\/overall-plan\/by-request\//.test(path) && method === 'GET') {
      const requestId = path.split('/').at(-1);
      if (requestId === 'request-no-plan') {
        await fulfillJson(route, { message: 'Overall plan not found' }, 404);
      } else {
        await fulfillJson(route, plan());
      }
      return;
    }

    if (path === '/overall-plan' && method === 'GET') {
      await fulfillJson(route, plan());
      return;
    }

    if (path === '/overall-plan' && method === 'POST') {
      await fulfillJson(
        route,
        { ...plan(), ...(body as object), id: 'plan-created', status: 'DRAFT' },
        201,
      );
      return;
    }

    if (/^\/overall-plan\/[^/]+\/(submit|resubmit|approve|reject|start-campaign)$/.test(path)) {
      if (path.endsWith('/approve')) planStatus = 'APPROVED';
      if (path.endsWith('/reject')) planStatus = 'REJECTED';
      if (path.endsWith('/submit') || path.endsWith('/resubmit')) planStatus = 'PENDING_APPROVAL';
      if (path.endsWith('/start-campaign')) requestStatus = 'ACTIVE';
      await fulfillJson(route, { ...plan(), status: planStatus });
      return;
    }

    if (path === '/task-plan' && method === 'GET') {
      await fulfillJson(route, [task]);
      return;
    }

    if (/^\/task-plan\/[^/]+\/(assign-recruiter|status)$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, {
        ...task,
        status: path.endsWith('/status')
          ? ((body as { status?: string })?.status ?? 'COMPLETED')
          : task.status,
      });
      return;
    }

    if (/^\/task-plan\/[^/]+$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, { ...task, ...(body as object) });
      return;
    }

    if (path === '/job-postings' && method === 'GET') {
      await fulfillJson(route, [jobPosting()]);
      return;
    }

    if (path === '/job-postings' && method === 'POST') {
      await fulfillJson(route, { ...jobPosting(), ...(body as object) }, 201);
      return;
    }

    if (/^\/job-postings\/[^/]+$/.test(path) && method === 'PATCH') {
      await fulfillJson(route, { ...jobPosting(), ...(body as object) });
      return;
    }

    if (/^\/job-postings\/[^/]+\/publish$/.test(path) && method === 'POST') {
      postingStatus = 'PUBLISHED';
      await fulfillJson(route, jobPosting());
      return;
    }

    if (/^\/job-postings\/[^/]+\/close$/.test(path) && method === 'POST') {
      postingStatus = 'CLOSED';
      await fulfillJson(route, jobPosting());
      return;
    }

    if (path === '/applications' && method === 'GET') {
      await fulfillJson(route, [application]);
      return;
    }

    if (path === '/talent/search' && method === 'POST') {
      await fulfillJson(route, {
        data: [
          {
            candidateProfileId: TEST_USERS.CANDIDATE.id,
            overallScore: 0.93,
            vectorScore: 0.91,
            graphScore: 0.95,
            coverageScore: 0.94,
            displayName: TEST_USERS.CANDIDATE.displayName,
            headline: 'Frontend Engineer',
            readinessLabel: 'STRONG_MATCH',
            matchExplanation: {
              assessment: 'Strong match for the campaign.',
              scoreBand: 'STRONG_MATCH',
              scoreDrivers: ['React and TypeScript experience'],
              matchedSkills: [{ skill: 'React', confidence: 0.98, source: 'CV' }],
              gaps: [],
              note: 'Human review is still required.',
            },
            skills: ['React', 'TypeScript', 'Playwright'],
            latestCv: { id: 'cv-e2e', parsedAt: now, screeningStatus: 'PENDING' },
            hasInterviewInvite: false,
          },
        ],
        meta: {
          searchRunId: 'search-run-e2e',
          expandedQuery: { expandedSkills: ['React', 'TypeScript', 'Playwright'] },
          pagination: { page: 1, pageSize: 20, total: 1 },
        },
      });
      return;
    }

    if (path === '/talent/feedback' && method === 'POST') {
      await fulfillJson(route, { success: true }, 201);
      return;
    }

    if (path === '/talent/screening-decision' && method === 'POST') {
      await fulfillJson(route, { success: true });
      return;
    }

    if (path === `/candidate/cvs/candidate/${TEST_USERS.CANDIDATE.id}/latest/file`) {
      await route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4 E2E' });
      return;
    }

    if (path === '/candidate/cvs' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'cv-e2e',
          fileName: 'candidate-e2e.pdf',
          parsedAt: now,
          rawText: 'React TypeScript Playwright accessibility',
          processingStatus: 'COMPLETED',
          processingMethod: 'TEXT',
          structuredData: null,
          createdAt: now,
        },
      ]);
      return;
    }

    if (path === '/candidate/cvs' && method === 'POST') {
      await fulfillJson(
        route,
        {
          id: 'cv-uploaded',
          fileName: 'cv-demo.pdf',
          parsedAt: now,
          rawText: 'E2E CV content',
          processingStatus: 'COMPLETED',
          processingMethod: 'TEXT',
          structuredData: null,
          createdAt: now,
        },
        201,
      );
      return;
    }

    if (/^\/candidate\/cvs\/[^/]+$/.test(path) && method === 'DELETE') {
      await fulfillJson(route, { success: true });
      return;
    }

    if (/^\/interviews\/requests\/[^/]+\/schedules$/.test(path) && method === 'GET') {
      await fulfillJson(route, [interview()]);
      return;
    }

    if (path === '/interviews/schedules' && method === 'POST') {
      await fulfillJson(route, { ...interview(), ...(body as object) }, 201);
      return;
    }

    if (
      /^\/interviews\/schedules\/[^/]+\/(confirm|candidate-reschedule|candidate-cancel|reschedule|cancel)$/.test(
        path,
      )
    ) {
      if (path.endsWith('/confirm')) interviewStatus = 'CONFIRMED';
      if (path.endsWith('/candidate-reschedule') || path.endsWith('/reschedule'))
        interviewStatus = 'RESCHEDULED';
      if (path.endsWith('/candidate-cancel') || path.endsWith('/cancel'))
        interviewStatus = 'CANCELLED';
      await fulfillJson(route, { schedule: interview(), ...interview() });
      return;
    }

    if (path === '/google-calendar/meet' && method === 'POST') {
      await fulfillJson(route, {
        meetLink: 'https://meet.google.com/e2e-generated-room',
        eventId: 'calendar-event-e2e',
        attendees: [TEST_USERS.CANDIDATE.email, TEST_USERS.HR_LEADER.email],
        reminderMinutesBefore: 30,
      });
      return;
    }

    if (path.startsWith('/google-calendar/auth-url') && method === 'GET') {
      await fulfillJson(route, { authorizationUrl: 'https://accounts.google.test/e2e-oauth' });
      return;
    }

    if (path === '/dept-head/interview-feedback' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'interview-result-e2e',
          candidate: TEST_USERS.CANDIDATE.displayName,
          role: 'Senior Frontend Engineer',
          department: department.name,
          time: futureInterview,
          status: 'Pending Recording',
          attendanceStatus: 'ACCEPTED',
        },
      ]);
      return;
    }

    if (path === '/dept-head/interview-feedback/interview-result-e2e' && method === 'GET') {
      await fulfillJson(route, {
        id: 'interview-result-e2e',
        candidate: TEST_USERS.CANDIDATE.displayName,
        role: 'Senior Frontend Engineer',
        department: department.name,
        time: futureInterview,
        status: 'Pending Recording',
        feedbacks: [],
        myFeedback: null,
        canSubmitMyFeedback: true,
        isDepartmentHeadAbsent: false,
      });
      return;
    }

    if (
      path === '/dept-head/interview-feedback/interview-result-e2e/my-feedback' &&
      method === 'POST'
    ) {
      const feedback = body as {
        decision?: string;
        technical?: number;
        communication?: number;
        culture?: number;
        notes?: string;
      };
      await fulfillJson(route, {
        success: true,
        feedback: {
          id: activeUser.id,
          member: activeUser.displayName,
          role: activeUser.role,
          initials: 'ED',
          decision: feedback.decision ?? 'PASS',
          technical: feedback.technical ?? 0,
          communication: feedback.communication ?? 0,
          culture: feedback.culture ?? 0,
          notes: feedback.notes ?? '',
          isRecorded: true,
          attendanceStatus: 'ACCEPTED',
        },
      });
      return;
    }

    if (path === '/hr/interview-results' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'interview-result-e2e',
          candidate: TEST_USERS.CANDIDATE.displayName,
          role: 'Senior Frontend Engineer',
          department: department.name,
          time: futureInterview,
          status: 'Interview Complete',
          location: 'https://meet.google.com/e2e-test-room',
        },
      ]);
      return;
    }

    if (path === '/hr/interview-results/interview-result-e2e' && method === 'GET') {
      await fulfillJson(route, {
        id: 'interview-result-e2e',
        candidate: TEST_USERS.CANDIDATE.displayName,
        role: 'Senior Frontend Engineer',
        department: department.name,
        time: futureInterview,
        status: 'Interview Complete',
        location: 'https://meet.google.com/e2e-test-room',
        feedbacks: [
          {
            id: 'feedback-existing',
            member: TEST_USERS.DEPARTMENT_HEAD.displayName,
            role: 'DEPARTMENT_HEAD',
            initials: 'ED',
            decision: 'PASS',
            technical: 4,
            communication: 4,
            culture: 4,
            notes: 'Strong candidate.',
            isRecorded: true,
            attendanceStatus: 'ACCEPTED',
          },
        ],
        myFeedback: null,
        canSubmitMyFeedback: true,
        canSubmitFinalRecommendation: true,
        hasBeenSentToAdmin: false,
        adminDecision: null,
        salaryRange: { min: '30000000', max: '45000000' },
        finalRecommendation: '',
        summaryNotes: '',
      });
      return;
    }

    if (
      /^\/hr\/interview-results\/[^/]+\/(my-feedback|evaluation-draft|final-recommendation)$/.test(
        path,
      ) &&
      method === 'POST'
    ) {
      await fulfillJson(route, {
        success: true,
        feedback: {
          id: 'feedback-e2e',
          member: TEST_USERS.HR_LEADER.displayName,
          role: 'HR_LEADER',
          initials: 'EH',
          decision: 'PASS',
          technical: 4,
          communication: 4,
          culture: 4,
          notes: 'Recommended for hire.',
          isRecorded: true,
        },
      });
      return;
    }

    if (path === '/admin/interview-results' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'admin-result-e2e',
          candidate: TEST_USERS.CANDIDATE.displayName,
          candidateId: TEST_USERS.CANDIDATE.id,
          role: 'Senior Frontend Engineer',
          department: department.name,
          interviewDate: futureInterview,
          requestId: 'request-e2e',
          decisionStatus: 'Awaiting Decision',
          feedbacks: [
            {
              name: 'Panel One',
              role: 'HR',
              status: 'PASS',
              ratings: { tech: 4, comm: 4, fit: 4 },
              comment: 'Strong.',
            },
            {
              name: 'Panel Two',
              role: 'Department Head',
              status: 'PASS',
              ratings: { tech: 5, comm: 4, fit: 5 },
              comment: 'Hire.',
            },
          ],
          passCount: 2,
          failCount: 0,
          pendingCount: 0,
          scores: { tech: 4.5, comm: 4, fit: 4.5 },
          finalRecommendation: 'Recommend Hire',
          summaryNotes: 'Candidate meets the role requirements.',
          location: 'https://meet.google.com/e2e-test-room',
        },
      ]);
      return;
    }

    if (
      /^\/admin\/interview-results\/[^/]+\/(decision|request-info)$/.test(path) &&
      method === 'POST'
    ) {
      await fulfillJson(route, { success: true, offer: offer() });
      return;
    }

    if (path === '/notifications' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'notification-e2e',
          type: 'INTERVIEW_INVITE',
          title: 'Interview invitation',
          body: 'Please confirm your interview attendance.',
          isRead: notificationRead,
          relatedEntityId: 'interview-e2e',
          relatedEntityType: 'INTERVIEW',
          createdAt: now,
        },
        {
          id: 'notification-system',
          type: 'SYSTEM',
          title: 'Profile reminder',
          body: 'Keep your candidate profile up to date.',
          isRead: false,
          relatedEntityId: null,
          relatedEntityType: null,
          createdAt: now,
        },
      ]);
      return;
    }

    if (/^\/notifications\/[^/]+\/(read|unread)$/.test(path) && method === 'PATCH') {
      notificationRead = path.endsWith('/read');
      await fulfillJson(route, { success: true, isRead: notificationRead });
      return;
    }

    if (/^\/notifications\/[^/]+$/.test(path) && method === 'DELETE') {
      await fulfillJson(route, { success: true });
      return;
    }

    if (path === '/offers/me' && method === 'GET') {
      await fulfillJson(route, [offer()]);
      return;
    }

    if (path === '/offers/offer-e2e' && method === 'GET') {
      await fulfillJson(route, offer());
      return;
    }

    if (path === '/offers/offer-e2e/respond' && method === 'POST') {
      const response = (body as { response?: 'ACCEPT' | 'DECLINE' })?.response ?? 'ACCEPT';
      offerStatus = response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
      await fulfillJson(route, { ...offer(), response, respondedAt: now });
      return;
    }

    await route.fallback();
  });

  return { calls };
}
