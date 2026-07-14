import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=')];
  }),
);

const apiBase = options.api ?? 'http://127.0.0.1:3001/api/v1';
const requiredOptions = [
  'hr-email',
  'hr-password',
  'dept-email',
  'dept-password',
  'candidate-email',
  'candidate-password',
  'admin-email',
  'admin-password',
];

for (const option of requiredOptions) {
  if (!options[option]) throw new Error(`Missing --${option}=...`);
}

const log = (step, detail = '') => console.log(`[PASS] ${step}${detail ? `: ${detail}` : ''}`);

const call = async (path, { token, method = 'GET', body, form } = {}) => {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(
      `${method} ${path} returned ${response.status}: ${data?.message ?? text ?? 'Unknown error'}`,
    );
  }
  return data;
};

const login = async (email, password, expectedRole) => {
  const data = await call('/auth/login', { method: 'POST', body: { email, password } });
  if (!data?.accessToken || data.user?.role !== expectedRole) {
    throw new Error(`${email} expected ${expectedRole}, received ${data?.user?.role ?? 'no role'}`);
  }
  data.user = { ...data.user, ...(await call('/me', { token: data.accessToken })) };
  log(`Login ${expectedRole}`, email);
  return { token: data.accessToken, user: data.user };
};

const daysFromNow = (days) => new Date(Date.now() + days * 86_400_000).toISOString();
const sleep = (milliseconds) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));

const run = async () => {
  const health = await call('/health');
  if (health.status !== 'ok') throw new Error('Gateway health check failed');
  log('Gateway and services healthy');

  const [hr, deptHead, candidate, admin] = await Promise.all([
    login(options['hr-email'], options['hr-password'], 'HR_LEADER'),
    login(options['dept-email'], options['dept-password'], 'DEPARTMENT_HEAD'),
    login(options['candidate-email'], options['candidate-password'], 'CANDIDATE'),
    login(options['admin-email'], options['admin-password'], 'ADMIN'),
  ]);

  const forbidden = await fetch(`${apiBase}/reports/admin-dashboard`, {
    headers: { authorization: `Bearer ${candidate.token}` },
  });
  if (forbidden.status !== 403) {
    throw new Error(`Candidate admin-dashboard access expected 403, received ${forbidden.status}`);
  }
  log('Role guard rejects Candidate from Admin dashboard');

  const departmentId =
    deptHead.user.departmentId ??
    deptHead.user.department?.id ??
    deptHead.user.departmentsHeaded?.[0]?.id;
  if (!departmentId) throw new Error('Department Head account has no managed department');

  const marker = `E2E-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
  const request = await call('/recruitment-requests', {
    token: deptHead.token,
    method: 'POST',
    body: {
      departmentId,
      positionTitle: `${marker} Platform Engineer`,
      headcount: 1,
      jobDescription: 'Build and operate a TypeScript recruitment workflow platform.',
      justification: `Automated end-to-end verification ${marker}`,
      urgency: 'MEDIUM',
      skillRequirements: { skills: ['TypeScript', 'Node.js', 'PostgreSQL'] },
    },
  });
  await call(`/recruitment-requests/${request.id}/submit`, {
    token: deptHead.token,
    method: 'PATCH',
  });
  log('Department Head created and submitted request', request.id);

  await call(`/recruitment-requests/${request.id}/assign`, {
    token: hr.token,
    method: 'PATCH',
    body: { hrManagerId: hr.user.id },
  });
  await call(`/recruitment-requests/${request.id}/forward-to-admin`, {
    token: hr.token,
    method: 'PATCH',
  });
  await call(`/recruitment-requests/${request.id}/decision`, {
    token: admin.token,
    method: 'PATCH',
    body: { decision: 'APPROVED', comments: `Approved by ${marker}` },
  });
  log('HR review and Admin request approval');

  const plan = await call('/overall-plan', {
    token: hr.token,
    method: 'POST',
    body: { hiringRequestId: request.id, startDate: daysFromNow(0), endDate: daysFromNow(30) },
  });
  const planWithTasks = await call(`/overall-plan/by-request/${request.id}`, { token: hr.token });
  if (!Array.isArray(planWithTasks.tasks) || planWithTasks.tasks.length === 0) {
    throw new Error('Overall plan did not scaffold campaign tasks');
  }
  for (const [index, task] of planWithTasks.tasks.entries()) {
    await call(`/task-plan/${task.id}`, {
      token: hr.token,
      method: 'PATCH',
      body: {
        taskType: task.taskType,
        startDate: daysFromNow(index),
        endDate: daysFromNow(index + 10),
      },
    });
  }
  await call(`/overall-plan/${plan.id}/submit`, { token: hr.token, method: 'PATCH' });
  await call(`/overall-plan/${plan.id}/approve`, { token: admin.token, method: 'PATCH' });
  await call(`/overall-plan/${plan.id}/start-campaign`, { token: hr.token, method: 'PATCH' });
  log('Plan, task assignment, approval and campaign start', plan.id);

  const posting = await call('/job-postings', {
    token: hr.token,
    method: 'POST',
    body: {
      requestId: request.id,
      title: `${marker} Platform Engineer`,
      description: 'Automated flow verification posting.',
      requirements: { skills: ['TypeScript', 'Node.js'] },
      visibility: 'PUBLIC',
      startDate: daysFromNow(0),
      expireDate: daysFromNow(20),
    },
  });
  await call(`/job-postings/${posting.id}/publish`, { token: hr.token, method: 'POST' });
  log('Job posting created and published', posting.id);

  const cvBytes = await readFile(resolve(options.cv ?? 'cv-demo.pdf'));
  const form = new FormData();
  form.append('file', new Blob([cvBytes], { type: 'application/pdf' }), 'cv-demo.pdf');
  const cv = await call('/candidate/cvs', { token: candidate.token, method: 'POST', form });
  log('Candidate uploaded CV', cv.id);

  const application = await call('/applications', {
    token: candidate.token,
    method: 'POST',
    body: { requestId: request.id },
  });
  log('Candidate applied to published request', application.id);

  const scheduledAt = new Date(Date.now() + 4_000).toISOString();
  const schedule = await call('/interviews/schedules', {
    token: hr.token,
    method: 'POST',
    body: {
      requestId: request.id,
      candidateId: application.candidateId,
      scheduledAt,
      duration: 15,
      location: 'https://meet.demo.test/e2e-flow',
      interviewers: [deptHead.user.id],
    },
  });
  await call(`/interviews/schedules/${schedule.id}/interviewer-attendance`, {
    token: deptHead.token,
    method: 'PATCH',
    body: { response: 'ACCEPTED' },
  });
  await call(`/interviews/schedules/${schedule.id}/confirm`, {
    token: candidate.token,
    method: 'POST',
  });
  log('Interview scheduled and attendance confirmed', schedule.id);

  await sleep(Math.max(0, new Date(scheduledAt).getTime() - Date.now() + 300));
  const feedback = {
    decision: 'PASS',
    technical: 8,
    communication: 8,
    culture: 9,
    notes: `Automated panel feedback ${marker}`,
  };
  await call(`/interviews/${schedule.id}/my-feedback`, {
    token: hr.token,
    method: 'POST',
    body: feedback,
  });
  await call(`/interviews/${schedule.id}/my-feedback`, {
    token: deptHead.token,
    method: 'POST',
    body: feedback,
  });
  await call(`/hr/interview-results/${schedule.id}/final-recommendation`, {
    token: hr.token,
    method: 'POST',
    body: { finalRecommendation: 'Recommend Hire', summaryNotes: marker },
  });
  log('Panel feedback and HR final recommendation recorded');

  await call(`/admin/interview-results/${request.id}/decision`, {
    token: admin.token,
    method: 'POST',
    body: {
      decision: 'HIRE',
      notes: `Automated final decision ${marker}`,
      candidateId: application.candidateId,
      compensation: '45,000,000 VND gross per month',
      startDate: daysFromNow(14),
    },
  });
  const offers = await call('/offers/me', { token: candidate.token });
  const offerList = Array.isArray(offers) ? offers : (offers?.data ?? []);
  const offer = offerList.find((item) => item.requestId === request.id);
  if (!offer) throw new Error('Candidate offer was not created');
  await call(`/offers/${offer.id}/respond`, {
    token: candidate.token,
    method: 'POST',
    body: { response: 'ACCEPT', note: marker },
  });
  log('Admin hire decision and Candidate offer acceptance', offer.id);

  console.log(
    JSON.stringify({ marker, requestId: request.id, planId: plan.id, scheduleId: schedule.id }),
  );
};

run().catch((error) => {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
