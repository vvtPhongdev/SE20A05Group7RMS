import type { Page, Route } from '@playwright/test';
import { TEST_USERS, userByEmail, type TestUser } from './test-data';

const now = '2026-07-20T08:00:00.000Z';

const recruitmentRequest = {
  id: 'request-e2e',
  position: 'Senior Frontend Engineer',
  department: {
    id: '00000000-0000-4000-8000-000000000201',
    name: 'Engineering',
    code: 'ENG',
  },
  requester: { id: TEST_USERS.DEPARTMENT_HEAD.id, displayName: 'E2E Department Head' },
  reviewedBy: { id: TEST_USERS.HR_LEADER.id, displayName: 'E2E HR Leader' },
  owner: { id: TEST_USERS.HR_LEADER.id, displayName: 'E2E HR Leader' },
  status: 'APPROVED',
  urgency: 'HIGH',
  headcount: 2,
  filledHeadcount: 0,
  justification: 'Expand the product engineering team.',
  jobDescription: 'Build accessible recruitment workflows with React and TypeScript.',
  skillRequirements: {
    skills: ['React', 'TypeScript', 'Playwright'],
    salaryMin: '30000000',
    salaryMax: '45000000',
  },
  createdAt: now,
  updatedAt: now,
  logs: [],
};

const overallPlan = {
  id: 'plan-e2e',
  requestId: recruitmentRequest.id,
  status: 'DRAFT',
  startDate: '2026-07-21T00:00:00.000Z',
  endDate: '2026-08-21T00:00:00.000Z',
  revisionNotes: null,
  createdBy: { id: TEST_USERS.HR_LEADER.id, displayName: TEST_USERS.HR_LEADER.displayName },
  approvedBy: null,
  tasks: [],
};

const jobPosting = {
  id: 'job-e2e',
  requestId: recruitmentRequest.id,
  title: recruitmentRequest.position,
  description: recruitmentRequest.jobDescription,
  requirements: recruitmentRequest.skillRequirements,
  visibility: 'PUBLIC',
  status: 'PUBLISHED',
  startDate: '2026-07-01T00:00:00.000Z',
  expireDate: '2027-12-31T23:59:59.000Z',
  request: recruitmentRequest,
};

const candidateProfile = {
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
  interviews: [],
  cvDocuments: [],
  updatedAt: now,
};

const offer = {
  id: 'offer-e2e',
  positionTitle: recruitmentRequest.position,
  departmentName: recruitmentRequest.department.name,
  compensation: '40,000,000 VND / month',
  startDate: '2026-08-15T00:00:00.000Z',
  content: 'We are pleased to offer you the Senior Frontend Engineer position.',
  status: 'SENT',
  response: null,
  responseNote: null,
  sentAt: now,
  respondedAt: null,
};

const adminDashboard = {
  generatedAt: now,
  kpis: {
    activeRequests: 1,
    pendingApproval: 0,
    interviewsThisWeek: 0,
    positionsFilled: 0,
    targetHeadcount: 2,
  },
  approvalQueue: [],
  pipeline: [],
  departmentActivity: [],
  recentActivity: [],
};

const hrDashboard = {
  kpis: {
    approvedRequests: 1,
    activePlans: 1,
    activeDepartments: 1,
    interviewsThisWeek: 0,
    interviewStagesThisWeek: 0,
    nextInterviewStageAt: null,
    candidatesInPipeline: 0,
    candidatesInFinalReview: 0,
  },
  plans: [],
  upcomingInterviews: [],
  upcomingInterviewMilestones: [],
  pipeline: [],
  metrics: { hiringVelocityDays: null, passRate: null },
  attentionItems: [],
};

const annualReport = {
  year: 2026,
  summary: {
    totalRequests: 1,
    totalPositionsOpened: 2,
    completedHires: 0,
    monthlyRequests: Array(12).fill(0),
    monthlyFilled: Array(12).fill(0),
    averageTimeToHireDays: 0,
    offerAcceptanceRate: 0,
    costPerHire: 0,
  },
  yoyComparison: { previousYear: 2025, requests: { growthPercentage: 0 } },
  departmentBreakdown: [],
  managerPerformance: [],
  timeToHireByStage: [],
};

const json = async (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

export async function mockApi(page: Page, initialUser: TestUser = TEST_USERS.CANDIDATE) {
  let activeUser = initialUser;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, '') || '/';
    const method = request.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204 });
      return;
    }

    if (path === '/auth/login' && method === 'POST') {
      const payload = request.postDataJSON() as { email?: string; password?: string };
      const user = payload.email ? userByEmail(payload.email) : undefined;
      if (!user || payload.password !== 'Password123!') {
        await json(route, { message: 'Invalid email or password' }, 401);
        return;
      }
      activeUser = user;
      await json(route, {
        accessToken: `e2e-token-${user.role}`,
        refreshToken: `e2e-refresh-${user.role}`,
        user,
      });
      return;
    }

    if (path === '/me') {
      await json(route, activeUser);
      return;
    }

    if (path === '/me/profile') {
      await json(route, {
        ...activeUser,
        department: activeUser.department ?? {
          id: recruitmentRequest.department.id,
          name: recruitmentRequest.department.name,
          code: recruitmentRequest.department.code,
        },
      });
      return;
    }

    if (path === '/auth/verify-register' && method === 'POST') {
      await json(route, {
        accessToken: 'e2e-token-CANDIDATE',
        refreshToken: 'e2e-refresh-CANDIDATE',
        user: TEST_USERS.CANDIDATE,
      });
      return;
    }

    if (path.startsWith('/auth/')) {
      await json(route, { success: true });
      return;
    }

    if (path === '/public/job-postings') {
      await json(route, [jobPosting]);
      return;
    }

    if (path === '/reports/admin-dashboard') {
      await json(route, adminDashboard);
      return;
    }

    if (path === '/reports/hr-dashboard') {
      await json(route, hrDashboard);
      return;
    }

    if (path === '/reports/hr-request-queue-summary') {
      await json(route, {
        averageReviewTimeDays: 0,
        oldestPendingDays: 0,
        reviewedThisWeek: 0,
        forwardedThisWeek: 0,
        distribution: [],
      });
      return;
    }

    if (path === '/reports/annual') {
      await json(route, annualReport);
      return;
    }

    if (path === '/reports/departments') {
      await json(route, { cards: [], campaigns: [], pending: [], activity: [] });
      return;
    }

    if (path === '/reports/pipeline') {
      await json(route, { totalActiveCampaigns: 0, totalCampaigns: 0, breakdown: {} });
      return;
    }

    if (path === '/reports/time-to-hire') {
      await json(route, {
        averageTimeToHireDays: 0,
        averageTimeInStageDays: {},
        totalCompletedHires: 0,
      });
      return;
    }

    if (path === '/reports/realtime-tracking') {
      await json(route, []);
      return;
    }

    if (path === `/recruitment-requests/${recruitmentRequest.id}`) {
      await json(route, recruitmentRequest);
      return;
    }

    if (path === '/recruitment-requests') {
      await json(route, { data: [] });
      return;
    }

    if (path === `/overall-plan/by-request/${recruitmentRequest.id}`) {
      await json(route, overallPlan);
      return;
    }

    if (path === '/overall-plan' || path === '/task-plan') {
      await json(route, path === '/task-plan' ? [] : overallPlan);
      return;
    }

    if (path === '/departments') {
      await json(route, []);
      return;
    }

    if (path === `/organizations/${activeUser.organizationId}`) {
      await json(route, {
        id: activeUser.organizationId,
        name: 'RMS E2E Organization',
        code: 'RMS-E2E',
        address: 'Ho Chi Minh City',
        phone: '0900000000',
        email: 'contact@rms.test',
      });
      return;
    }

    if (path === '/organizations') {
      await json(route, []);
      return;
    }

    if (path === '/users/interviewers') {
      await json(route, { data: [] });
      return;
    }

    if (path === '/users') {
      await json(route, { data: [] });
      return;
    }

    if (path === '/candidate-profiles/me/avatar' || path.endsWith('/latest/file')) {
      await json(route, { message: 'No file fixture configured' }, 404);
      return;
    }

    if (path === '/candidate-profiles/me') {
      await json(route, candidateProfile);
      return;
    }

    if (path === '/candidate-profiles') {
      await json(route, {
        data: [],
        meta: { total: 0, parsedCount: 0, newThisWeekCount: 0, activeCampaignsCount: 0 },
      });
      return;
    }

    if (path === '/candidate/cvs') {
      await json(route, []);
      return;
    }

    if (path === '/job-postings') {
      await json(route, [jobPosting]);
      return;
    }

    if (path === '/applications') {
      await json(route, []);
      return;
    }

    if (path.startsWith('/interviews/requests/') && path.endsWith('/schedules')) {
      await json(route, []);
      return;
    }

    if (path === '/notifications') {
      await json(route, []);
      return;
    }

    if (path === '/offers/me') {
      await json(route, [offer]);
      return;
    }

    if (path === `/offers/${offer.id}`) {
      await json(route, offer);
      return;
    }

    if (path === `/offers/${offer.id}/respond`) {
      const payload = request.postDataJSON() as { response?: 'ACCEPT' | 'DECLINE'; note?: string };
      await json(route, {
        ...offer,
        status: payload.response === 'DECLINE' ? 'DECLINED' : 'ACCEPTED',
        response: payload.response,
        responseNote: payload.note ?? null,
        respondedAt: now,
      });
      return;
    }

    if (path === '/talent/search') {
      await json(route, {
        data: [],
        meta: {
          searchRunId: null,
          expandedQuery: { expandedSkills: [] },
          pagination: { page: 1, pageSize: 20, total: 0 },
          query: { source: 'e2e' },
        },
      });
      return;
    }

    if (
      path === '/admin/interview-results' ||
      path === '/hr/interview-results' ||
      path === '/dept-head/interview-feedback'
    ) {
      await json(route, []);
      return;
    }

    await json(route, method === 'GET' ? [] : { success: true });
  });
}
