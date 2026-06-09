import React from 'react';
import { useNavigate } from 'react-router-dom';

type PlanPhase = 'CV Screening' | 'Interview' | 'Final Review' | 'Offer Prep';
type Tone = 'teal' | 'revision' | 'approved' | 'pending' | 'slate';

const stats = [
  { label: 'Approved Requests', value: '5', helper: '+2 this week', tone: 'approved' as Tone },
  { label: 'Active Plans', value: '8', helper: 'Across 4 departments', tone: 'teal' as Tone },
  { label: 'Interviews This Week', value: '12', helper: '3 final rounds', tone: 'revision' as Tone },
  { label: 'Candidates in Pipeline', value: '34', helper: '8 in final review', tone: 'pending' as Tone },
];

const activePlans = [
  {
    id: 'REQ-2026-001',
    position: 'Senior Developer',
    department: 'Engineering',
    phase: 'Interview' as PlanPhase,
    progress: 65,
    deadline: '24 Mar 2026',
  },
  {
    id: 'REQ-2026-003',
    position: 'Marketing Lead',
    department: 'Marketing',
    phase: 'CV Screening' as PlanPhase,
    progress: 30,
    deadline: '15 Apr 2026',
  },
  {
    id: 'REQ-2026-005',
    position: 'Accountant',
    department: 'Finance',
    phase: 'Final Review' as PlanPhase,
    progress: 90,
    deadline: '08 Mar 2026',
  },
  {
    id: 'REQ-2026-007',
    position: 'Junior Developer',
    department: 'Engineering',
    phase: 'CV Screening' as PlanPhase,
    progress: 15,
    deadline: '30 Apr 2026',
  },
];

const interviews = [
  { time: '10:30 AM', type: 'Technical', candidate: 'Tran Minh Tam', role: 'Senior Developer', location: 'Room 402', tone: 'revision' as Tone },
  { time: '01:45 PM', type: 'HR Fit', candidate: 'Nguyen Thuy Linh', role: 'Marketing Lead', location: 'Virtual Link', tone: 'teal' as Tone },
  { time: '03:30 PM', type: 'Final', candidate: 'Pham Quoc Hung', role: 'Accountant', location: 'Office 101', tone: 'approved' as Tone },
];

const pipelineBars = [
  { label: 'Applied', value: 48, height: '30%' },
  { label: 'Screened', value: 27, height: '60%' },
  { label: 'Interview', value: 18, height: '90%' },
  { label: 'Final', value: 9, height: '45%' },
  { label: 'Offer', value: 6, height: '75%' },
];

const phaseStyles: Record<PlanPhase, string> = {
  'CV Screening': 'bg-teal-command/10 text-teal-command',
  Interview: 'bg-amber-50 text-revision',
  'Final Review': 'bg-green-50 text-approved',
  'Offer Prep': 'bg-cyan-50 text-pending',
};

const toneClasses: Record<Tone, string> = {
  teal: 'bg-teal-command text-teal-command border-teal-command',
  revision: 'bg-revision text-revision border-revision',
  approved: 'bg-approved text-approved border-approved',
  pending: 'bg-pending text-pending border-pending',
  slate: 'bg-slate-ink text-slate-ink border-slate-ink',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    review: <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    warning: <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
    calendar: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    chart: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
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

export const HRDashBoard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">HR Management</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">Recruitment Dashboard</h1>
          <p className="mt-1 max-w-[68ch] text-sm leading-6 text-slate-ink">
            Monitor active recruitment plans, candidate flow, interview load, and HR actions from one work surface.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
            onClick={() => navigate('/hr/requests')}
            type="button"
          >
            Approved Requests
            <Icon className="h-4 w-4" name="arrow" />
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
            onClick={() => navigate('/hr/campaigns')}
            type="button"
          >
            <Icon className="h-4 w-4" name="plus" />
            Create Plan
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="HR dashboard metrics">
        {stats.map((stat) => (
          <DashboardCard className="transition duration-200 hover:-translate-y-[2px]" key={stat.label}>
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-on-surface-variant">{stat.label}</p>
              <span className={`mt-1 h-3 w-3 rounded-full ${toneClasses[stat.tone].split(' ')[0]}`} />
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-mono text-[32px] font-semibold leading-none text-deep-charcoal">{stat.value}</span>
              <span className={`text-xs font-semibold ${toneClasses[stat.tone].split(' ')[1]}`}>{stat.helper}</span>
            </div>
          </DashboardCard>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="space-y-6">
          <DashboardCard className="overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-border-warm bg-workflow-ivory/60 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">Active Recruitment Plans</h2>
                <p className="mt-1 text-sm text-slate-ink">Approved requests currently moving through HR execution.</p>
              </div>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                onClick={() => navigate('/hr/campaigns')}
                type="button"
              >
                <Icon className="h-4 w-4" name="plus" />
                New Plan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-workflow-ivory text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Plan ID</th>
                    <th className="px-5 py-4 font-semibold">Position</th>
                    <th className="px-5 py-4 font-semibold">Department</th>
                    <th className="px-5 py-4 font-semibold">Phase</th>
                    <th className="px-5 py-4 font-semibold">Progress</th>
                    <th className="px-5 py-4 font-semibold">Deadline</th>
                    <th className="px-5 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm text-sm">
                  {activePlans.map((plan) => (
                    <tr className="transition hover:bg-workflow-ivory/70" key={plan.id}>
                      <td className="px-5 py-4 font-mono text-teal-command">{plan.id}</td>
                      <td className="px-5 py-4 font-semibold text-deep-charcoal">{plan.position}</td>
                      <td className="px-5 py-4 text-slate-ink">{plan.department}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${phaseStyles[plan.phase]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {plan.phase}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-32">
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                            <div className="h-full rounded-full bg-teal-command" style={{ width: `${plan.progress}%` }} />
                          </div>
                          <span className="mt-1 block text-[11px] text-slate-ink">{plan.progress}% complete</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-ink">{plan.deadline}</td>
                      <td className="px-5 py-4 text-right">
                        <button className="font-semibold text-teal-command transition hover:underline active:scale-[0.98]" type="button">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>

          <section className="rounded-xl bg-deep-charcoal p-4 text-on-tertiary-container shadow-[0_20px_50px_-30px_rgba(28,25,23,0.85)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-5 w-5 text-revision" name="warning" />
                  2 actions require attention
                </span>
                <span className="hidden h-4 w-px bg-tertiary lg:block" />
                <span className="text-sm text-surface-container">Offer letter for Accountant is pending approval.</span>
                <span className="text-sm text-surface-container">Interview feedback missing for Junior Developer.</span>
              </div>
              <button className="w-fit rounded-md bg-clean-surface px-4 py-2 text-sm font-semibold text-deep-charcoal transition hover:bg-surface-variant active:scale-[0.98]" type="button">
                View Tasks
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <DashboardCard>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-teal-command" name="calendar" />
                <h2 className="text-xl font-semibold text-deep-charcoal">Upcoming Interviews</h2>
              </div>
              <button className="text-xs font-semibold text-teal-command transition hover:underline" onClick={() => navigate('/hr/interviews')} type="button">
                View calendar
              </button>
            </div>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div className={`rounded-r-lg border-l-4 bg-workflow-ivory p-3 transition hover:bg-surface-container-low ${toneClasses[interview.tone].split(' ')[2]}`} key={`${interview.time}-${interview.candidate}`}>
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <span className={`font-mono text-xs ${toneClasses[interview.tone].split(' ')[1]}`}>{interview.time}</span>
                    <span className="text-xs font-semibold text-slate-ink">{interview.type}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-deep-charcoal">{interview.candidate}</h3>
                  <p className="mt-1 text-sm text-slate-ink">
                    {interview.role} - {interview.location}
                  </p>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="mb-5 flex items-center gap-2">
              <Icon className="h-5 w-5 text-teal-command" name="chart" />
              <h2 className="text-lg font-semibold text-deep-charcoal">Pipeline Health</h2>
            </div>
            <div className="flex h-48 items-end justify-center gap-4 rounded-lg bg-workflow-ivory p-4">
              {pipelineBars.map((bar) => (
                <div className="flex h-full flex-1 max-w-10 flex-col items-center justify-end gap-2" key={bar.label}>
                  <div className="relative w-full rounded-t-sm bg-teal-command/20" style={{ height: bar.height }}>
                    <div className="absolute inset-x-0 bottom-0 rounded-t-sm bg-teal-command transition-all duration-300 hover:h-full" style={{ height: '72%' }} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-ink">{bar.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Hiring Velocity</p>
                <p className="mt-1 font-mono text-xl font-semibold text-deep-charcoal">18 days</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Pass Rate</p>
                <p className="mt-1 font-mono text-xl font-semibold text-deep-charcoal">24%</p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </section>
    </div>
  );
};
