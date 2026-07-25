export type TestRole = 'ADMIN' | 'DEPARTMENT_HEAD' | 'HR_LEADER' | 'CANDIDATE';

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  role: TestRole;
  organizationId: string;
  departmentId?: string;
  department?: { id: string; name: string; code: string };
}

export interface UiRoute {
  name: string;
  path: string;
}

const organizationId = '00000000-0000-4000-8000-000000000100';
const engineeringDepartment = {
  id: '00000000-0000-4000-8000-000000000201',
  name: 'Engineering',
  code: 'ENG',
};

export const TEST_USERS: Record<TestRole, TestUser> = {
  ADMIN: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin.e2e@rms.test',
    displayName: 'E2E System Admin',
    role: 'ADMIN',
    organizationId,
  },
  DEPARTMENT_HEAD: {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'dept-head.e2e@rms.test',
    displayName: 'E2E Department Head',
    role: 'DEPARTMENT_HEAD',
    organizationId,
    departmentId: engineeringDepartment.id,
    department: engineeringDepartment,
  },
  HR_LEADER: {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'hr.e2e@rms.test',
    displayName: 'E2E HR Leader',
    role: 'HR_LEADER',
    organizationId,
  },
  CANDIDATE: {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'candidate.e2e@rms.test',
    displayName: 'E2E Candidate',
    role: 'CANDIDATE',
    organizationId,
  },
};

export const ROLE_HOME: Record<TestRole, string> = {
  ADMIN: '/admin',
  DEPARTMENT_HEAD: '/dept-head',
  HR_LEADER: '/hr',
  CANDIDATE: '/candidate',
};

export const ROLE_ROUTES: Record<TestRole, UiRoute[]> = {
  ADMIN: [
    { name: 'dashboard', path: '/admin' },
    { name: 'approval queue', path: '/admin/approval-queue' },
    { name: 'all requests', path: '/admin/requests' },
    { name: 'interview results', path: '/admin/interview-results' },
    { name: 'users', path: '/admin/users' },
    { name: 'settings', path: '/admin/settings' },
    { name: 'annual reports', path: '/admin/reports' },
    { name: 'department statistics', path: '/admin/dept-stats' },
  ],
  DEPARTMENT_HEAD: [
    { name: 'dashboard', path: '/dept-head' },
    { name: 'create request', path: '/dept-head/create-request' },
    { name: 'my requests', path: '/dept-head/requests' },
    { name: 'interviews', path: '/dept-head/interviews' },
    { name: 'interview evaluations', path: '/dept-head/feedback' },
    { name: 'department settings', path: '/dept-head/settings' },
  ],
  HR_LEADER: [
    { name: 'dashboard', path: '/hr' },
    { name: 'request queue', path: '/hr/requests' },
    { name: 'campaigns', path: '/hr/campaigns' },
    { name: 'campaign detail', path: '/hr/campaigns/request-e2e' },
    { name: 'job posting workspace', path: '/hr/job-postings/request-e2e' },
    { name: 'task planner', path: '/hr/tasks' },
    { name: 'talent pool', path: '/hr/candidates' },
    { name: 'candidate search', path: '/hr/search' },
    { name: 'interview schedule', path: '/hr/interviews' },
    { name: 'interview detail', path: '/hr/interview-detail' },
    { name: 'interview results', path: '/hr/results' },
    { name: 'pipeline reports', path: '/hr/reports' },
    { name: 'system notifications', path: '/hr/notifications' },
  ],
  CANDIDATE: [
    { name: 'dashboard', path: '/candidate' },
    { name: 'profile', path: '/candidate/profile' },
    { name: 'upload CV', path: '/candidate/upload-cv' },
    { name: 'notifications', path: '/candidate/notifications' },
    { name: 'interviews', path: '/candidate/interviews' },
    { name: 'offers', path: '/candidate/offers' },
    { name: 'offer detail', path: '/candidate/offer/offer-e2e' },
  ],
};

export const PUBLIC_ROUTES: Array<UiRoute & { expectedText: RegExp }> = [
  { name: 'landing page', path: '/', expectedText: /recruitment|hiring/i },
  { name: 'login', path: '/login', expectedText: /sign in/i },
  { name: 'sign up', path: '/signup', expectedText: /create account/i },
  { name: 'email verification', path: '/verify-email', expectedText: /verification|verify/i },
  { name: 'forgot password', path: '/forgot-password', expectedText: /password/i },
  {
    name: 'reset password',
    path: '/reset-password?email=e2e%40rms.test&token=reset-e2e',
    expectedText: /reset password/i,
  },
];

export const SIDEBAR_LABELS: Record<TestRole, string[]> = {
  ADMIN: [
    'Dashboard',
    'Approval Queue',
    'All Requests',
    'Interview Results',
    'Users',
    'Settings',
    'Department Statistics',
    'Reports',
  ],
  DEPARTMENT_HEAD: [
    'Dashboard',
    'Create Request',
    'My Requests',
    'Interviews',
    'Interview Evaluations',
    'Dept Settings',
  ],
  HR_LEADER: [
    'Dashboard',
    'Request Queue',
    'Campaigns',
    'Task Planner',
    'Talent Pool',
    'Candidate Search',
    'Interview Schedule',
    'Interview Detail',
    'Interview Results',
    'Pipeline Reports',
    'System Notifications',
  ],
  CANDIDATE: [
    'Dashboard',
    'My Profile',
    'Upload CV',
    'Inbox Alerts',
    'Interview Details',
    'My Offers',
  ],
};

export const userByEmail = (email: string) =>
  Object.values(TEST_USERS).find((user) => user.email === email.toLowerCase());
