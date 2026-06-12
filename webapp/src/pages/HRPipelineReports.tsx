import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

type CampaignStage = 'Interviewing' | 'CV Screening' | 'Hired' | 'Planning';
type RiskLevel = 'Critical' | 'Warning' | 'Stable';

type CampaignProgress = {
  role: string;
  department: string;
  requestId: string;
  hired: number;
  target: number;
  stage: CampaignStage;
  overdue: number;
  projected: string;
};

interface RecruitmentRequestApiItem {
  id: string;
  position: string;
  department: { id: string; name: string; code: string } | null;
  status: string;
  headcount: number;
  filledHeadcount: number;
  updatedAt: string;
}

interface RecruitmentRequestListResponse {
  data: RecruitmentRequestApiItem[];
}

interface PipelineOverviewResponse {
  totalActiveCampaigns: number;
  totalCampaigns: number;
  breakdown: Record<string, number>;
}

const STAGE_MAP: Record<string, CampaignStage> = {
  PLANNING: 'Planning',
  PLAN_APPROVED: 'Planning',
  APPROVED: 'Planning',
  SCREENING: 'CV Screening',
  INTERVIEWING: 'Interviewing',
  INTERVIEW_COMPLETED: 'Interviewing',
  OFFER_EXTENDED: 'Hired',
  OFFER_ACCEPTED: 'Hired',
  CLOSED: 'Hired',
};

const EXCLUDED_CAMPAIGN_STATUSES = new Set([
  'DRAFT',
  'PENDING_REVIEW',
  'REJECTED',
  'REVISION_NEEDED',
  'CANCELLED',
]);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  );

const bottlenecks: Array<{ title: string; detail: string; level: RiskLevel; impact: string }> = [
  {
    title: 'Interview Panel Availability',
    detail: 'IT Department - 4 days avg delay',
    level: 'Critical',
    impact: 'Impact: 12 candidates',
  },
  {
    title: 'Background Check Vendor',
    detail: 'Vendor: HireScreen Ltd - Delay',
    level: 'Warning',
    impact: 'Impact: 8 candidates',
  },
  {
    title: 'Hiring Manager Feedback',
    detail: 'Sales Dept - 48h SLA breach',
    level: 'Stable',
    impact: 'Impact: 3 candidates',
  },
];

const workload = [
  { day: 'Mon', height: '60%' },
  { day: 'Tue', height: '85%' },
  { day: 'Wed', height: '95%', active: true },
  { day: 'Thu', height: '40%' },
  { day: 'Fri', height: '70%' },
  { day: 'Sat', height: '55%' },
  { day: 'Sun', height: '30%' },
];

const atRisk = [
  { title: 'Sales Lead - APAC', detail: 'No candidates in 14 days' },
  { title: 'QA Automation', detail: 'Offer rejected by 2 finalists' },
];

const actions = [
  { title: 'Schedule Round 2 for Senior Dev candidate', tone: 'text-teal-command' },
  { title: 'Approve Plan for Marketing Lead', tone: 'text-teal-command' },
  { title: 'Escalate Background Check REQ-042', tone: 'text-rejected' },
];

const iconPaths: Record<string, React.ReactNode> = {
  export: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />,
  warning: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  more: (
    <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  ),
  graph: <path d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7" />,
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

const stageClass: Record<CampaignStage, string> = {
  Interviewing: 'bg-pending/10 text-pending',
  'CV Screening': 'bg-revision/10 text-revision',
  Hired: 'bg-approved/10 text-approved',
  Planning: 'bg-slate-ink/10 text-slate-ink',
};

const riskClass: Record<RiskLevel, string> = {
  Critical: 'border-error/10 bg-error-container/20 text-on-error-container',
  Warning: 'border-border-warm bg-surface-container-low text-deep-charcoal',
  Stable: 'border-border-warm bg-surface-container-low text-deep-charcoal opacity-80',
};

export const HRPipelineReports: React.FC = () => {
  const { token } = useAuth();
  const [department, setDepartment] = useState('All Departments');
  const [range, setRange] = useState('Last 30 Days');
  const [requests, setRequests] = useState<RecruitmentRequestApiItem[]>([]);
  const [pipeline, setPipeline] = useState<PipelineOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setApiError('');
      try {
        const [requestsResponse, pipelineResponse] = await Promise.all([
          apiRequest<RecruitmentRequestListResponse>('/recruitment-requests?limit=100', token),
          apiRequest<PipelineOverviewResponse>('/reports/pipeline', token),
        ]);
        setRequests(requestsResponse.data);
        setPipeline(pipelineResponse);
      } catch (loadError) {
        setApiError(
          loadError instanceof Error ? loadError.message : 'Unable to load pipeline reports',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const departmentOptions = useMemo(() => {
    const names = new Set<string>();
    requests.forEach((request) => {
      if (request.department) names.add(request.department.name);
    });
    return ['All Departments', ...Array.from(names)];
  }, [requests]);

  const campaigns: CampaignProgress[] = useMemo(
    () =>
      requests
        .filter((request) => !EXCLUDED_CAMPAIGN_STATUSES.has(request.status))
        .map((request) => ({
          role: request.position,
          department: request.department?.name ?? 'Unassigned',
          requestId: request.id,
          hired: request.filledHeadcount,
          target: request.headcount,
          stage: STAGE_MAP[request.status] ?? 'Planning',
          overdue: 0,
          projected: formatDate(request.updatedAt),
        })),
    [requests],
  );

  const visibleCampaigns = useMemo(() => {
    if (department === 'All Departments') return campaigns;
    return campaigns.filter((campaign) => campaign.department === department);
  }, [campaigns, department]);

  const funnel = useMemo(() => {
    const breakdown = pipeline?.breakdown ?? {};
    const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    const plan = (breakdown.APPROVED ?? 0) + (breakdown.PLANNING ?? 0) + (breakdown.PLAN_APPROVED ?? 0);
    const screen = breakdown.SCREENING ?? 0;
    const interview = breakdown.INTERVIEWING ?? 0;
    const decision = breakdown.OFFER_EXTENDED ?? 0;
    const hired = (breakdown.OFFER_ACCEPTED ?? 0) + (breakdown.CLOSED ?? 0);

    const rate = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
    const width = (value: number) => `${Math.max(rate(value), total > 0 && value > 0 ? 8 : 0)}%`;

    return [
      {
        label: 'REQS',
        value: `${total} Requests`,
        rate: '100%',
        width: '100%',
        tone: 'bg-teal-command/90 text-white',
      },
      {
        label: 'PLAN',
        value: `${plan} Plan Approved`,
        rate: `${rate(plan)}%`,
        width: width(plan),
        tone: 'bg-teal-command/75 text-white',
      },
      {
        label: 'SCREEN',
        value: `${screen} CV Screening`,
        rate: `${rate(screen)}%`,
        width: width(screen),
        tone: 'bg-teal-command/60 text-white',
      },
      {
        label: 'INTERVIEW',
        value: `${interview} Interviewing`,
        rate: `${rate(interview)}%`,
        width: width(interview),
        tone: 'bg-teal-command/45 text-on-primary-fixed-variant',
      },
      {
        label: 'DECISION',
        value: `${decision} Decision`,
        rate: `${rate(decision)}%`,
        width: width(decision),
        tone: 'bg-teal-command/30 text-on-primary-fixed-variant',
      },
      {
        label: 'HIRED',
        value: `${hired} Hired`,
        rate: `${rate(hired)}%`,
        width: width(hired),
        tone: 'border border-teal-command/20 bg-teal-command/15 text-teal-command',
      },
    ];
  }, [pipeline]);

  const kpis = useMemo(() => {
    const breakdown = pipeline?.breakdown ?? {};
    const screen = breakdown.SCREENING ?? 0;
    const interview = breakdown.INTERVIEWING ?? 0;
    const offerAccepted = breakdown.OFFER_ACCEPTED ?? 0;
    const offerDeclined = breakdown.OFFER_DECLINED ?? 0;

    const cvToInterviewRate = screen > 0 ? `${Math.round((interview / screen) * 100)}%` : '18.2%';
    const offerAcceptance =
      offerAccepted + offerDeclined > 0
        ? `${Math.round((offerAccepted / (offerAccepted + offerDeclined)) * 100)}%`
        : '88%';

    return [
      {
        label: 'Avg. Time to Hire',
        value: '24.5 Days',
        helper: '2.1% above target',
        tone: 'text-rejected',
        progress: 65,
        fill: 'bg-teal-command',
      },
      {
        label: 'CV to Interview Rate',
        value: cvToInterviewRate,
        helper: 'Healthy threshold',
        tone: 'text-approved',
        progress: 42,
        fill: 'bg-pending',
      },
      {
        label: 'Offer Acceptance',
        value: offerAcceptance,
        helper: `${offerAccepted}/${offerAccepted + offerDeclined || 1} offers accepted`,
        tone: 'text-slate-ink',
        progress: 88,
        fill: 'bg-approved',
      },
      {
        label: 'SLA Breach Risk',
        value: 'Low',
        helper: '3 campaigns pending',
        tone: 'text-approved',
        progress: 15,
        fill: 'bg-slate-ink',
      },
    ];
  }, [pipeline]);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0 space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
              HR Manager Portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
              Pipeline Reports
            </h1>
            <p className="mt-1 max-w-[72ch] text-sm leading-6 text-slate-ink">
              Track recruitment throughput, campaign bottlenecks, and time-to-hire signals.
            </p>
          </div>
          <button
            className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
            type="button"
          >
            <Icon className="h-4 w-4" name="export" />
            Export Report
          </button>
        </header>

        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-rejected">
            {apiError}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-on-surface-variant">
            Loading pipeline reports...
          </div>
        )}

        <section className="rounded-lg border border-border-warm bg-clean-surface p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Date Range
              </span>
              <select
                className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setRange(event.target.value)}
                value={range}
              >
                <option>Last 30 Days</option>
                <option>Last Quarter</option>
                <option>Year to Date</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Department
              </span>
              <select
                className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setDepartment(event.target.value)}
                value={department}
              >
                {departmentOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Campaign
              </span>
              <select className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20">
                <option>All active campaigns</option>
                <option>Senior Dev Hire #42</option>
                <option>Content Lead #12</option>
              </select>
            </label>
          </div>
        </section>

        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Pipeline report metrics"
        >
          {kpis.map((kpi) => (
            <section
              className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm"
              key={kpi.label}
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                {kpi.label}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-deep-charcoal">{kpi.value}</span>
              </div>
              <p className={`mt-1 text-xs font-semibold ${kpi.tone}`}>{kpi.helper}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container">
                <div
                  className={`h-full rounded-full ${kpi.fill}`}
                  style={{ width: `${kpi.progress}%` }}
                />
              </div>
            </section>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm lg:col-span-2">
            <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-deep-charcoal">Recruitment Funnel</h2>
              <span className="text-sm text-slate-ink">Volume across all active roles</span>
            </div>
            <div className="space-y-4">
              {funnel.map((item) => (
                <div
                  className="grid grid-cols-[72px_minmax(0,1fr)_52px] items-center gap-3"
                  key={item.label}
                >
                  <div className="text-right text-xs font-bold text-slate-ink">{item.label}</div>
                  <div className="min-w-0">
                    <div
                      className={`flex h-10 min-w-[104px] items-center rounded-lg px-4 text-sm font-bold ${item.tone}`}
                      style={{ width: item.width }}
                    >
                      <span className="truncate">{item.value}</span>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-slate-ink">{item.rate}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <Icon className="h-5 w-5 text-rejected" name="warning" />
              <h2 className="text-xl font-semibold text-deep-charcoal">Top Bottlenecks</h2>
            </div>
            <div className="space-y-4">
              {bottlenecks.map((item) => (
                <article
                  className={`rounded-lg border p-4 ${riskClass[item.level]}`}
                  key={item.title}
                >
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-ink">{item.detail}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                        item.level === 'Critical'
                          ? 'bg-error'
                          : item.level === 'Warning'
                            ? 'bg-revision'
                            : 'bg-slate-ink'
                      }`}
                    >
                      {item.level}
                    </span>
                    <span className="font-mono text-[10px] text-slate-ink">{item.impact}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border-warm px-6 py-4">
            <h2 className="text-xl font-semibold text-deep-charcoal">Active Campaign Progress</h2>
            <button
              className="text-sm font-semibold text-teal-command transition hover:underline"
              type="button"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="bg-workflow-ivory text-xs uppercase tracking-[0.12em] text-slate-ink">
                  <th className="px-6 py-4 font-bold">Campaign / Dept</th>
                  <th className="px-4 py-4 font-bold">Headcount</th>
                  <th className="px-4 py-4 font-bold">Current Stage</th>
                  <th className="px-4 py-4 font-bold">Tasks</th>
                  <th className="px-4 py-4 font-bold">Proj. Completion</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {visibleCampaigns.map((campaign) => {
                  const progress = campaign.target > 0 ? Math.round((campaign.hired / campaign.target) * 100) : 0;
                  return (
                    <tr
                      className="transition hover:bg-teal-command/[0.04]"
                      key={campaign.requestId}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-deep-charcoal">{campaign.role}</div>
                        <div className="text-xs text-slate-ink">
                          {campaign.department} / {campaign.requestId.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm">
                          {campaign.hired} / {campaign.target}
                        </span>
                        <div className="mt-1 h-1 w-24 rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-teal-command"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold uppercase ${stageClass[campaign.stage]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {campaign.stage}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-4 font-mono text-sm font-bold ${campaign.overdue > 0 ? 'text-rejected' : 'text-slate-ink'}`}
                      >
                        {campaign.overdue} Overdue
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">{campaign.projected}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="rounded-lg p-1 text-outline transition hover:bg-surface-container hover:text-teal-command"
                          type="button"
                          aria-label={`Open actions for ${campaign.role}`}
                        >
                          <Icon className="h-5 w-5" name="more" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {visibleCampaigns.length === 0 && !loading && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-on-surface-variant" colSpan={6}>
                      No active campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <aside className="space-y-6">
        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-deep-charcoal">Weekly HR Workload</h2>
          <div className="mb-4 flex h-32 items-end justify-between gap-2">
            {workload.map((day) => (
              <div className="flex flex-1 flex-col items-center gap-2" key={day.day}>
                <div
                  className={`w-full rounded-t-lg transition hover:bg-teal-command/30 ${day.active ? 'bg-teal-command' : 'bg-surface-container'}`}
                  style={{ height: day.height }}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-ink">
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-deep-charcoal">Campaigns at Risk</h2>
          <ul className="space-y-4">
            {atRisk.map((risk) => (
              <li className="flex gap-3" key={risk.title}>
                <div className="h-10 w-1 rounded-full bg-revision" />
                <div>
                  <p className="text-sm font-bold leading-tight text-deep-charcoal">{risk.title}</p>
                  <p className="text-xs text-slate-ink">{risk.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-deep-charcoal">Recommended Next Actions</h2>
          <ul className="space-y-3">
            {actions.map((action) => (
              <li
                className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-surface-container"
                key={action.title}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 ${action.tone}`}
                  name={action.tone === 'text-rejected' ? 'warning' : 'check'}
                />
                <span className="text-sm leading-5 text-on-surface-variant">{action.title}</span>
              </li>
            ))}
          </ul>
          <button
            className="mt-6 w-full rounded-lg border border-teal-command/20 py-2 text-sm font-bold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]"
            type="button"
          >
            Process All Actions
          </button>
        </section>

        <section className="rounded-lg border border-border-warm bg-teal-command/5 p-6 text-center">
          <Icon className="mx-auto h-8 w-8 text-teal-command" name="graph" />
          <h2 className="mt-3 text-sm font-bold text-teal-command">Predicted Outcome</h2>
          <p className="mt-1 text-sm leading-6 text-slate-ink">
            Based on current velocity, 85% of targets will be met this quarter.
          </p>
        </section>
      </aside>
    </div>
  );
};
