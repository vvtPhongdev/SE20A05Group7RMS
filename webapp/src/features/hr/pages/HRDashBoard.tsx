import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  HRActionButton,
  HRCard,
  HRDashboardPage,
  HRInlineAlert,
  HRLoadingState,
  HRPageHeader,
  HRSearchInput,
} from '../components';

type PlanPhase = 'CV Screening' | 'Interview' | 'Final Review' | 'Offer Prep';
type Tone = 'teal' | 'revision' | 'approved' | 'pending' | 'slate';

type RecruitmentPlan = {
  id: string;
  position: string;
  department: string;
  phase: PlanPhase;
  progress: number;
  deadline: string | null;
  owner: string;
};

interface HRDashboardResponse {
  kpis: {
    approvedRequests: number;
    activePlans: number;
    activeDepartments: number;
    interviewsThisWeek: number;
    interviewStagesThisWeek: number;
    nextInterviewStageAt: string | null;
    candidatesInPipeline: number;
    candidatesInFinalReview: number;
  };
  plans: Array<{
    id: string;
    position: string;
    department: string;
    status: string;
    phase: PlanPhase;
    progress: number;
    deadline: string | null;
    owner: string;
  }>;
  upcomingInterviews: Array<{
    id: string;
    scheduledAt: string;
    candidate: string;
    position: string;
    location: string;
  }>;
  upcomingInterviewMilestones: Array<{
    id: string;
    scheduledAt: string;
    position: string;
    owner: string;
    status: string;
  }>;
  pipeline: Array<{ label: string; value: number }>;
  metrics: { hiringVelocityDays: number | null; passRate: number | null };
  attentionItems: Array<{ id: string; message: string }>;
}

const STATUS_TO_PHASE: Record<string, PlanPhase> = {
  APPROVED: 'CV Screening',
  PLANNING: 'CV Screening',
  PLAN_APPROVED: 'CV Screening',
  ACTIVE: 'CV Screening',
  SCREENING: 'CV Screening',
  INTERVIEWING: 'Interview',
  INTERVIEW_COMPLETED: 'Final Review',
  DECISION_PENDING: 'Final Review',
  NOT_HIRED: 'Final Review',
  OFFER_EXTENDED: 'Offer Prep',
  OFFER_ACCEPTED: 'Offer Prep',
  OFFER_DECLINED: 'Offer Prep',
  HIRED: 'Offer Prep',
};

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

const DashboardCard = HRCard;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const HRDashBoard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<PlanPhase | 'All'>('All');
  const [dashboard, setDashboard] = useState<HRDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setApiError('');
      try {
        setDashboard(await apiRequest<HRDashboardResponse>('/reports/hr-dashboard', token));
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, [token]);

  const dashboardStats = useMemo(
    () => [
      {
        label: 'Approved Requests',
        value: dashboard ? String(dashboard.kpis.approvedRequests) : '—',
        helper: 'Ready or in execution',
        tone: 'approved' as Tone,
      },
      {
        label: 'Active Plans',
        value: dashboard ? String(dashboard.kpis.activePlans) : '—',
        helper: dashboard ? `Across ${dashboard.kpis.activeDepartments} departments` : 'Loading',
        tone: 'teal' as Tone,
      },
      {
        label: 'Interviews This Week',
        value: dashboard ? String(dashboard.kpis.interviewsThisWeek) : '—',
        helper: dashboard
          ? dashboard.kpis.interviewsThisWeek > 0
            ? `${dashboard.kpis.interviewsThisWeek} scheduled`
            : dashboard.kpis.interviewStagesThisWeek > 0
              ? `${dashboard.kpis.interviewStagesThisWeek} interview stage planned`
              : dashboard.kpis.nextInterviewStageAt
                ? `Next stage ${formatDate(dashboard.kpis.nextInterviewStageAt)}`
                : 'No interviews scheduled'
          : 'Loading',
        tone: 'revision' as Tone,
      },
      {
        label: 'Candidates in Pipeline',
        value: dashboard ? String(dashboard.kpis.candidatesInPipeline) : '—',
        helper: dashboard ? `${dashboard.kpis.candidatesInFinalReview} in final review` : 'Loading',
        tone: 'pending' as Tone,
      },
    ],
    [dashboard],
  );

  const activePlans: RecruitmentPlan[] = useMemo(
    () =>
      (dashboard?.plans ?? []).map((item) => {
        const planPhase = item.phase ?? STATUS_TO_PHASE[item.status] ?? 'CV Screening';
        return {
          id: item.id,
          position: item.position,
          department: item.department,
          phase: planPhase,
          progress: item.progress,
          deadline: item.deadline,
          owner: item.owner,
        };
      }),
    [dashboard],
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
    const tones: Tone[] = ['revision', 'teal', 'approved'];
    return (dashboard?.upcomingInterviews ?? []).map((schedule, index) => ({
      id: schedule.id,
      date: formatDate(schedule.scheduledAt),
      time: new Date(schedule.scheduledAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: 'Interview',
      candidate: schedule.candidate,
      role: schedule.position,
      location: schedule.location,
      tone: tones[index % tones.length],
    }));
  }, [dashboard]);

  const interviewMilestones = useMemo(
    () =>
      (dashboard?.upcomingInterviewMilestones ?? []).map((milestone) => ({
        ...milestone,
        date: formatDate(milestone.scheduledAt),
      })),
    [dashboard],
  );

  const pipelineBars = useMemo(() => {
    const pipeline = dashboard?.pipeline ?? [];
    const max = Math.max(1, ...pipeline.map((item) => item.value));
    return pipeline.map(({ label, value }) => ({
      label,
      value,
      height: value === 0 ? '0%' : `${Math.max(8, Math.round((value / max) * 100))}%`,
      fill: value === 0 ? '0%' : `${Math.max(8, Math.round((value / max) * 90))}%`,
    }));
  }, [dashboard]);

  return (
    <HRDashboardPage>
      <HRPageHeader
        title="Recruitment Dashboard"
        description="Monitor approved requests, active recruitment plans, interview load, and candidate flow from one work surface."
        actions={
          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto] xl:min-w-[540px]">
            <HRSearchInput
              label="Search positions"
              onChange={setQuery}
              placeholder="Search positions..."
              value={query}
            />
            <HRActionButton onClick={() => navigate('/hr/campaigns')}>
              <Icon className="h-4 w-4" name="plus" />
              Create Plan
            </HRActionButton>
          </div>
        }
      />

      {apiError && <HRInlineAlert>{apiError}</HRInlineAlert>}

      {loading && <HRLoadingState label="Loading dashboard..." />}

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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)]">
        <div className="min-w-0 space-y-6">
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
                      <td className="px-5 py-4 text-slate-ink">
                        {plan.deadline ? formatDate(plan.deadline) : 'Not scheduled'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          className="font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                          onClick={() => navigate(`/hr/campaigns/${plan.id}`)}
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
                  <Icon className="h-5 w-5 text-revision" name="warning" />
                  {dashboard?.attentionItems.length ?? 0} actions require immediate attention
                </span>
                {(dashboard?.attentionItems ?? []).map((item) => (
                  <React.Fragment key={item.id}>
                    <span className="hidden h-4 w-px bg-tertiary lg:block" />
                    <span className="text-sm text-surface-container">{item.message}</span>
                  </React.Fragment>
                ))}
                {dashboard && dashboard.attentionItems.length === 0 ? (
                  <span className="text-sm text-surface-container">
                    No urgent recruitment actions.
                  </span>
                ) : null}
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

        <div className="min-w-0 space-y-6">
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
                  key={interview.id}
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <span
                      className={`font-mono text-xs ${toneClasses[interview.tone].split(' ')[1]}`}
                    >
                      {interview.date} - {interview.time}
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
            {interviewMilestones.length > 0 ? (
              <div className="mt-5 border-t border-border-warm pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Planned Interview Stages
                </p>
                <div className="space-y-3">
                  {interviewMilestones.map((milestone) => (
                    <div
                      className="rounded-lg border border-teal-command/20 bg-teal-command/5 p-3"
                      key={milestone.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-deep-charcoal">
                          {milestone.position}
                        </p>
                        <span className="shrink-0 font-mono text-xs font-semibold text-teal-command">
                          {milestone.date}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-ink">
                        Coordination owner: {milestone.owner}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
                <p className="mt-1 font-mono text-xl font-semibold text-deep-charcoal">
                  {dashboard?.metrics.hiringVelocityDays == null
                    ? 'N/A'
                    : `${dashboard.metrics.hiringVelocityDays} days`}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Pass Rate
                </p>
                <p className="mt-1 font-mono text-xl font-semibold text-deep-charcoal">
                  {dashboard?.metrics.passRate == null ? 'N/A' : `${dashboard.metrics.passRate}%`}
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </section>
    </HRDashboardPage>
  );
};
