import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

type PlanPhase = 'CV Screening' | 'Interview' | 'Final Review' | 'Offer Prep';
type Tone = 'teal' | 'revision' | 'approved' | 'pending' | 'slate';

type RecruitmentPlan = {
  id: string;
  position: string;
  department: string;
  phase: PlanPhase;
  progress: number;
  deadline: string;
  owner: string;
};

interface RealtimeTrackingItem {
  id: string;
  position: string;
  department: string;
  targetHeadcount: number;
  filledHeadcount: number;
  status: string;
  createdBy: string;
  handler: string;
  createdAt: string;
  updatedAt: string;
}

interface InterviewSchedule {
  id: string;
  requestId: string;
  candidateId: string;
  scheduledAt: string;
  duration: number;
  location: string;
  interviewers: string[];
  status: string;
}

interface UpcomingInterview extends InterviewSchedule {
  position: string;
}

const ACTIVE_PLAN_STATUSES = [
  'PLANNING',
  'PLAN_APPROVED',
  'SCREENING',
  'INTERVIEWING',
  'INTERVIEW_COMPLETED',
  'OFFER_EXTENDED',
  'OFFER_ACCEPTED',
];

const APPROVED_REQUEST_STATUSES = [...ACTIVE_PLAN_STATUSES, 'APPROVED', 'CLOSED'];

const STATUS_TO_PHASE: Record<string, PlanPhase> = {
  APPROVED: 'CV Screening',
  PLANNING: 'CV Screening',
  PLAN_APPROVED: 'CV Screening',
  SCREENING: 'CV Screening',
  INTERVIEWING: 'Interview',
  INTERVIEW_COMPLETED: 'Final Review',
  OFFER_EXTENDED: 'Offer Prep',
  OFFER_ACCEPTED: 'Offer Prep',
};

const PHASE_PROGRESS: Record<PlanPhase, number> = {
  'CV Screening': 30,
  Interview: 60,
  'Final Review': 85,
  'Offer Prep': 95,
};

const stats = [
  { label: 'Approved Requests', value: '5', helper: '+2 this week', tone: 'approved' as Tone },
  { label: 'Active Plans', value: '8', helper: 'Across 4 departments', tone: 'teal' as Tone },
  {
    label: 'Interviews This Week',
    value: '12',
    helper: '3 final rounds',
    tone: 'revision' as Tone,
  },
  {
    label: 'Candidates in Pipeline',
    value: '34',
    helper: '8 in final review',
    tone: 'pending' as Tone,
  },
];

const phaseStyles: Record<PlanPhase, string> = {
  'CV Screening': 'bg-teal-command/10 text-teal-command',
  Interview: 'bg-amber-50 text-revision',
  'Final Review': 'bg-green-50 text-approved',
  'Offer Prep': 'bg-cyan-50 text-pending',
};

const progressStyles: Record<PlanPhase, string> = {
  'CV Screening': 'bg-teal-command',
  Interview: 'bg-revision',
  'Final Review': 'bg-approved',
  'Offer Prep': 'bg-pending',
};

const toneClasses: Record<Tone, string> = {
  teal: 'bg-teal-command text-teal-command border-teal-command',
  revision: 'bg-revision text-revision border-revision',
  approved: 'bg-approved text-approved border-approved',
  pending: 'bg-pending text-pending border-pending',
  slate: 'bg-slate-ink text-slate-ink border-slate-ink',
};

const iconPaths: Record<string, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  warning: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  calendar: (
    <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  ),
  chart: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => (
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
    {iconPaths[name]}
  </svg>
);

const DashboardCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)] ${className}`}
  >
    {children}
  </section>
);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const getWeekRange = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  return { startOfWeek, endOfWeek };
};

export const HRDashBoard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<PlanPhase | 'All'>('All');
  const [requests, setRequests] = useState<RealtimeTrackingItem[]>([]);
  const [schedules, setSchedules] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setApiError('');
      try {
        const data = await apiRequest<RealtimeTrackingItem[]>('/reports/realtime-tracking', token);
        setRequests(data);

        const activeRequests = data.filter((item) => ACTIVE_PLAN_STATUSES.includes(item.status));
        const scheduleLists = await Promise.all(
          activeRequests.map((item) =>
            apiRequest<InterviewSchedule[]>(`/interviews/requests/${item.id}/schedules`, token)
              .then((list) => list.map((schedule) => ({ ...schedule, position: item.position })))
              .catch(() => [] as UpcomingInterview[]),
          ),
        );
        setSchedules(scheduleLists.flat());
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, [token]);

  const approvedRequestsCount = useMemo(
    () => requests.filter((item) => APPROVED_REQUEST_STATUSES.includes(item.status)).length,
    [requests],
  );

  const activePlanItems = useMemo(
    () => requests.filter((item) => ACTIVE_PLAN_STATUSES.includes(item.status)),
    [requests],
  );

  const candidatesInPipeline = useMemo(() => {
    const ids = new Set(schedules.map((schedule) => schedule.candidateId));
    return ids.size;
  }, [schedules]);

  const interviewsThisWeek = useMemo(() => {
    const { startOfWeek, endOfWeek } = getWeekRange();
    return schedules.filter((schedule) => {
      const date = new Date(schedule.scheduledAt);
      return date >= startOfWeek && date < endOfWeek;
    }).length;
  }, [schedules]);

  const dashboardStats = useMemo(
    () => [
      { ...stats[0], value: String(approvedRequestsCount) },
      { ...stats[1], value: String(activePlanItems.length) },
      { ...stats[2], value: String(interviewsThisWeek) },
      { ...stats[3], value: String(candidatesInPipeline) },
    ],
    [approvedRequestsCount, activePlanItems.length, interviewsThisWeek, candidatesInPipeline],
  );

  const activePlans: RecruitmentPlan[] = useMemo(
    () =>
      activePlanItems.map((item) => {
        const planPhase = STATUS_TO_PHASE[item.status] ?? 'CV Screening';
        return {
          id: item.id,
          position: item.position,
          department: item.department,
          phase: planPhase,
          progress: PHASE_PROGRESS[planPhase],
          deadline: item.updatedAt,
          owner: item.handler,
        };
      }),
    [activePlanItems],
  );

  const visiblePlans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return activePlans.filter((plan) => {
      const matchesPhase = phase === 'All' || plan.phase === phase;
      const matchesQuery =
        !normalizedQuery ||
        [plan.id, plan.position, plan.department, plan.phase, plan.owner].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );

      return matchesPhase && matchesQuery;
    });
  }, [activePlans, phase, query]);

  const interviews = useMemo(() => {
    const now = new Date();
    const tones: Tone[] = ['revision', 'teal', 'approved'];
    return schedules
      .filter((schedule) => schedule.status !== 'CANCELLED' && new Date(schedule.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3)
      .map((schedule, index) => ({
        time: new Date(schedule.scheduledAt).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'Interview',
        candidate: `Candidate ${schedule.candidateId.slice(0, 8)}`,
        role: schedule.position,
        location: schedule.location,
        tone: tones[index % tones.length],
      }));
  }, [schedules]);

  const pipelineBars = useMemo(() => {
    const counts = {
      Applied: requests.filter((item) => ['PENDING_REVIEW', 'APPROVED'].includes(item.status)).length,
      Screened: requests.filter((item) => ['PLANNING', 'PLAN_APPROVED', 'SCREENING'].includes(item.status))
        .length,
      Interview: requests.filter((item) => item.status === 'INTERVIEWING').length,
      Final: requests.filter((item) => item.status === 'INTERVIEW_COMPLETED').length,
      Offer: requests.filter((item) => ['OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(item.status)).length,
    };
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      height: `${Math.max(8, Math.round((value / max) * 100))}%`,
      fill: `${Math.max(8, Math.round((value / max) * 90))}%`,
    }));
  }, [requests]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
            HR Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
            Recruitment Dashboard
          </h1>
          <p className="mt-1 max-w-[68ch] text-sm leading-6 text-slate-ink">
            Monitor approved requests, active recruitment plans, interview load, and candidate flow
            from one work surface.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto] xl:min-w-[540px]">
          <label className="relative block">
            <span className="sr-only">Search positions</span>
            <Icon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              name="search"
            />
            <input
              className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search positions..."
              type="search"
              value={query}
            />
          </label>
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

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-rejected">
          {apiError}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-on-surface-variant">
          Loading dashboard...
        </div>
      )}

      <section
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
        aria-label="HR dashboard metrics"
      >
        {dashboardStats.map((stat) => (
          <DashboardCard
            className="transition duration-200 hover:-translate-y-[2px]"
            key={stat.label}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-on-surface-variant">{stat.label}</p>
              <span
                className={`mt-1 h-3 w-3 rounded-full ${toneClasses[stat.tone].split(' ')[0]}`}
              />
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-mono text-[32px] font-semibold leading-none text-deep-charcoal">
                {stat.value}
              </span>
              <span className={`text-xs font-semibold ${toneClasses[stat.tone].split(' ')[1]}`}>
                {stat.helper}
              </span>
            </div>
          </DashboardCard>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="space-y-6">
          <DashboardCard className="overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-border-warm bg-workflow-ivory/60 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">
                  Active Recruitment Plans
                </h2>
                <p className="mt-1 text-sm text-slate-ink">
                  Approved requests currently moving through HR execution.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-on-surface-variant">
                  <Icon className="h-4 w-4" name="filter" />
                  <span className="sr-only">Filter by phase</span>
                  <select
                    className="border-none bg-transparent p-0 text-sm font-semibold text-on-surface-variant outline-none focus:ring-0"
                    onChange={(event) => setPhase(event.target.value as PlanPhase | 'All')}
                    value={phase}
                  >
                    <option value="All">All phases</option>
                    <option value="CV Screening">CV Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Final Review">Final Review</option>
                    <option value="Offer Prep">Offer Prep</option>
                  </select>
                </label>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                  onClick={() => navigate('/hr/requests')}
                  type="button"
                >
                  Approved Requests
                  <Icon className="h-4 w-4" name="arrow" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
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
                  {visiblePlans.map((plan, index) => (
                    <tr
                      className={`transition hover:bg-workflow-ivory/70 ${index % 2 ? 'bg-workflow-ivory/30' : 'bg-clean-surface'}`}
                      key={plan.id}
                    >
                      <td className="px-5 py-4 font-mono text-teal-command">
                        {plan.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-deep-charcoal">{plan.position}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">Owner: {plan.owner}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-ink">{plan.department}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${phaseStyles[plan.phase]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {plan.phase}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-36">
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                            <div
                              className={`h-full rounded-full ${progressStyles[plan.phase]}`}
                              style={{ width: `${plan.progress}%` }}
                            />
                          </div>
                          <span className="mt-1 block text-[11px] text-slate-ink">
                            {plan.progress}% complete
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-ink">{formatDate(plan.deadline)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          className="font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                          onClick={() => navigate('/hr/requests')}
                          type="button"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visiblePlans.length === 0 ? (
              <div className="border-t border-border-warm px-6 py-12 text-center">
                <p className="text-sm font-semibold text-deep-charcoal">
                  No recruitment plans match this view.
                </p>
                <p className="mt-1 text-sm text-slate-ink">
                  Adjust the search term or phase filter.
                </p>
              </div>
            ) : null}
          </DashboardCard>

          <section className="rounded-xl bg-deep-charcoal p-4 text-on-tertiary-container shadow-[0_20px_50px_-30px_rgba(28,25,23,0.85)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-5 w-5 text-revision" name="warning" />2 actions require
                  immediate attention
                </span>
                <span className="hidden h-4 w-px bg-tertiary lg:block" />
                <span className="text-sm text-surface-container">
                  Offer letter for Accountant is pending approval.
                </span>
                <span className="text-sm text-surface-container">
                  Interview feedback missing for Junior Developer.
                </span>
              </div>
              <button
                className="w-fit rounded-md bg-clean-surface px-4 py-2 text-sm font-semibold text-deep-charcoal transition hover:bg-surface-variant active:scale-[0.98]"
                onClick={() => navigate('/hr/tasks')}
                type="button"
              >
                View All Tasks
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
              <button
                className="text-xs font-semibold text-teal-command transition hover:underline"
                onClick={() => navigate('/hr/interviews')}
                type="button"
              >
                View Calendar
              </button>
            </div>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div
                  className={`rounded-r-lg border-l-4 bg-workflow-ivory p-3 transition hover:bg-surface-container-low ${toneClasses[interview.tone].split(' ')[2]}`}
                  key={`${interview.time}-${interview.candidate}`}
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <span
                      className={`font-mono text-xs ${toneClasses[interview.tone].split(' ')[1]}`}
                    >
                      {interview.time}
                    </span>
                    <span className="text-xs font-semibold text-slate-ink">{interview.type}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-deep-charcoal">
                    {interview.candidate}
                  </h3>
                  <p className="mt-1 text-sm text-slate-ink">
                    {interview.role} - {interview.location}
                  </p>
                </div>
              ))}
              {interviews.length === 0 && !loading && (
                <p className="text-sm text-slate-ink">No upcoming interviews scheduled.</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="mb-5 flex items-center gap-2">
              <Icon className="h-5 w-5 text-teal-command" name="chart" />
              <h2 className="text-lg font-semibold text-deep-charcoal">Pipeline Health</h2>
            </div>
            <div className="flex h-48 items-end justify-center gap-4 rounded-lg bg-workflow-ivory p-4">
              {pipelineBars.map((bar) => (
                <div
                  className="flex h-full flex-1 max-w-10 flex-col items-center justify-end gap-2"
                  key={bar.label}
                >
                  <div
                    className="relative w-full rounded-t-sm bg-teal-command/20"
                    style={{ height: bar.height }}
                    title={`${bar.label}: ${bar.value}`}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-sm bg-teal-command transition-all duration-300 hover:h-full"
                      style={{ height: bar.fill }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-ink">{bar.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Hiring Velocity
                </p>
                <p className="mt-1 font-mono text-xl font-semibold text-deep-charcoal">18 days</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Pass Rate
                </p>
                <p className="mt-1 font-mono text-xl font-semibold text-deep-charcoal">24%</p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </section>
    </div>
  );
};
