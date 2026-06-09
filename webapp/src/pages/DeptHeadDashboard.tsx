import React from 'react';
import { useNavigate } from 'react-router-dom';

type Tone = 'teal' | 'cyan' | 'amber' | 'green' | 'red' | 'stone';

const kpis = [
  { label: 'Active Requests', value: '8', helper: '23 open headcount', icon: 'requests', tone: 'teal' as Tone },
  { label: 'Pending Plans', value: '3', helper: 'Waiting for HR plan approval', icon: 'clock', tone: 'cyan' as Tone },
  { label: 'Interview Panels', value: '6', helper: 'Scheduled this week', icon: 'calendar', tone: 'amber' as Tone },
  { label: 'Filled Positions', value: '11', helper: '45.8% of annual target', icon: 'progress', tone: 'green' as Tone },
];

const activeRequests = [
  {
    id: 'REQ-2026-001',
    role: 'Senior Developer',
    headcount: 2,
    stage: 'Sourcing',
    progress: 64,
    priority: 'High',
    owner: 'Engineering Platform',
    due: 'Jun 14, 2026',
  },
  {
    id: 'REQ-2026-005',
    role: 'DevOps Engineer',
    headcount: 2,
    stage: 'Plan Review',
    progress: 38,
    priority: 'Critical',
    owner: 'Infrastructure',
    due: 'Jun 10, 2026',
  },
  {
    id: 'REQ-2026-008',
    role: 'Data Analyst',
    headcount: 3,
    stage: 'Interviewing',
    progress: 72,
    priority: 'High',
    owner: 'Business Intelligence',
    due: 'Jun 21, 2026',
  },
  {
    id: 'REQ-2026-011',
    role: 'QA Specialist',
    headcount: 1,
    stage: 'Draft',
    progress: 18,
    priority: 'Medium',
    owner: 'Quality Enablement',
    due: 'Jun 26, 2026',
  },
];

const pendingPlans = [
  {
    title: 'Backend expansion plan',
    requestId: 'REQ-2026-001',
    status: 'HR Manager drafting',
    age: '2 days',
    next: 'Review sourcing channels',
  },
  {
    title: 'Infrastructure rotation coverage',
    requestId: 'REQ-2026-005',
    status: 'Budget clarification',
    age: '4 days',
    next: 'Confirm night-shift allowance',
  },
  {
    title: 'Analytics hiring plan',
    requestId: 'REQ-2026-008',
    status: 'Awaiting interview panel',
    age: '1 day',
    next: 'Assign technical reviewers',
  },
];

const departmentMetrics = [
  { label: 'Approved headcount', value: 24, target: 32, width: '75%', tone: 'bg-teal-command' },
  { label: 'Budget committed', value: 412, suffix: 'k', target: 620, width: '66%', tone: 'bg-pending' },
  { label: 'Average time-to-approve', value: 3.8, suffix: 'd', target: 5, width: '76%', tone: 'bg-approved' },
  { label: 'Panel response SLA', value: 91, suffix: '%', target: 95, width: '91%', tone: 'bg-revision' },
];

const attentionItems = [
  { label: 'Critical request idle for 4 days', detail: 'REQ-2026-005 needs budget clarification before HR can publish the plan.', tone: 'border-rejected' },
  { label: 'Panel assignment missing', detail: 'Analytics hiring plan requires two department reviewers by Friday.', tone: 'border-revision' },
  { label: 'Draft nearly ready', detail: 'QA Specialist request has all role details and only needs final justification.', tone: 'border-teal-command' },
];

const toneClasses: Record<Tone, string> = {
  teal: 'bg-teal-command/10 text-teal-command',
  cyan: 'bg-cyan-50 text-pending',
  amber: 'bg-amber-50 text-revision',
  green: 'bg-green-50 text-approved',
  red: 'bg-red-50 text-rejected',
  stone: 'bg-stone-100 text-draft',
};

const priorityClasses: Record<string, string> = {
  Critical: 'bg-red-50 text-rejected border-red-200',
  High: 'bg-amber-50 text-revision border-amber-200',
  Medium: 'bg-stone-100 text-draft border-stone-200',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    requests: <path d="M9 4h6l1 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1-2Zm0 7h6m-6 4h4" />,
    clock: <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    calendar: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    progress: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    alert: <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

const DashboardCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)] ${className}`}>
    {children}
  </section>
);

export const DeptHeadDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">Department Head Workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">Department Overview</h1>
          <p className="mt-1 max-w-[66ch] text-sm leading-6 text-slate-ink">
            Monitor active staffing requests, pending recruitment plans, and department hiring health for Information Technology.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
            onClick={() => navigate('/dept-head/requests')}
            type="button"
          >
            View Requests
            <Icon className="h-4 w-4" name="arrow" />
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
            onClick={() => navigate('/dept-head/create-request')}
            type="button"
          >
            <Icon className="h-4 w-4" name="plus" />
            New Request
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Department dashboard metrics">
        {kpis.map((kpi) => (
          <DashboardCard className="transition duration-200 hover:-translate-y-[2px]" key={kpi.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{kpi.label}</p>
                <p className="mt-3 font-mono text-[32px] font-semibold leading-none text-deep-charcoal">{kpi.value}</p>
              </div>
              <span className={`rounded-lg p-2 ${toneClasses[kpi.tone]}`}>
                <Icon name={kpi.icon} />
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-ink">{kpi.helper}</p>
          </DashboardCard>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <DashboardCard>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-deep-charcoal">Active Requests</h2>
              <p className="mt-1 text-sm text-slate-ink">Live requests owned by your department.</p>
            </div>
            <button className="w-fit text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]" onClick={() => navigate('/dept-head/requests')} type="button">
              Open request list
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-border-warm text-sm text-on-surface-variant">
                  <th className="py-3 pr-4 font-medium">Request</th>
                  <th className="px-4 py-3 font-medium">Headcount</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="py-3 pl-4 text-right font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-sm">
                {activeRequests.map((request) => (
                  <tr
                    className="transition hover:bg-workflow-ivory/70 cursor-pointer"
                    key={request.id}
                    onClick={() => navigate(`/dept-head/requests/${request.id}`)}
                  >
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-deep-charcoal hover:underline hover:text-teal-command">{request.role}</p>
                      <p className="mt-1 font-mono text-xs text-teal-command">{request.id} · {request.owner}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-deep-charcoal">{request.headcount}</td>
                    <td className="px-4 py-4 text-slate-ink">{request.stage}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-container">
                          <div className="h-full rounded-full bg-teal-command" style={{ width: `${request.progress}%` }} />
                        </div>
                        <span className="font-mono text-xs text-slate-ink">{request.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${priorityClasses[request.priority]}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right text-slate-ink">{request.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-deep-charcoal">Pending Plans</h2>
              <p className="mt-1 text-sm text-slate-ink">Recruitment plans needing department input.</p>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 font-mono text-xs font-semibold text-pending">3 open</span>
          </div>

          <div className="space-y-4">
            {pendingPlans.map((plan) => (
              <div
                className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-4 cursor-pointer hover:border-teal-command hover:shadow-sm transition"
                key={plan.requestId}
                onClick={() => navigate(`/dept-head/requests/${plan.requestId}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-deep-charcoal hover:underline hover:text-teal-command">{plan.title}</h3>
                    <p className="mt-1 font-mono text-xs text-teal-command">{plan.requestId}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-clean-surface px-2.5 py-1 text-xs font-semibold text-slate-ink">{plan.age}</span>
                </div>
                <p className="mt-3 text-sm text-slate-ink">{plan.status}</p>
                <p className="mt-2 text-xs font-semibold text-on-surface-variant">Next: {plan.next}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardCard>
          <h2 className="text-xl font-semibold text-deep-charcoal">Department Metrics</h2>
          <p className="mt-1 text-sm text-slate-ink">Progress against annual staffing and response goals.</p>

          <div className="mt-6 space-y-5">
            {departmentMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="mb-2 flex items-end justify-between gap-4">
                  <span className="text-sm font-medium text-on-surface-variant">{metric.label}</span>
                  <span className="font-mono text-sm font-semibold text-deep-charcoal">
                    {metric.value}{metric.suffix ?? ''} / {metric.target}{metric.suffix ?? ''}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                  <div className={`h-full rounded-full ${metric.tone}`} style={{ width: metric.width }} />
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-lg bg-amber-50 p-2 text-revision">
              <Icon name="alert" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-deep-charcoal">Needs Attention</h2>
              <p className="mt-1 text-sm text-slate-ink">Items that can slow department hiring progress.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {attentionItems.map((item) => (
              <div className={`border-l-2 ${item.tone} pl-4`} key={item.label}>
                <h3 className="text-sm font-semibold text-deep-charcoal">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-ink">{item.detail}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>
    </div>
  );
};
