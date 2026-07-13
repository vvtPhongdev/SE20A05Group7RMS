import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  HRActionButton,
  HRCard,
  HRInlineAlert,
  HRLoadingState,
  HRPageHeader,
  HRSelectControl,
} from '../components';

type CampaignStage = 'Interviewing' | 'CV Screening' | 'Hired' | 'Planning';

type CampaignProgress = {
  role: string;
  department: string;
  requestId: string;
  status: string;
  owner: string;
  hired: number;
  target: number;
  stage: CampaignStage;
  completion: number;
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

interface TimeToHireReportResponse {
  averageTimeToHireDays: number;
  averageTimeInStageDays: Record<string, number>;
  totalCompletedHires: number;
}

interface RealtimeTrackingItem {
  requestId: string;
  id?: string;
  position: string;
  departmentName?: string;
  department?: string;
  status: string;
  currentOwner?: string;
  pendingAction?: string;
  handler?: string;
  createdBy?: string;
  headcount: number;
  hiredCount?: number;
  filledHeadcount?: number;
  taskProgress?: {
    total: number;
    completed: number;
    overdue: number;
  };
  taskBreakdown?: Array<{
    id: string;
    taskType: string;
    status: string;
    startDate: string;
    endDate: string;
    isOverdue: boolean;
    assignedTo: { id: string; displayName: string; role?: string; email?: string } | null;
  }>;
  interviewProgress?: {
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  offerProgress?: {
    sent: number;
    accepted: number;
    declined: number;
  };
  lastUpdatedAt?: string;
  updatedAt?: string;
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

const ALL_CAMPAIGNS = 'All active campaigns';

const CAMPAIGN_PIPELINE_STAGES = [
  {
    key: 'planning',
    label: 'Planning',
    taskTypes: ['JOB_POSTING'],
    activeStatuses: ['APPROVED', 'PLANNING', 'PLAN_PENDING_APPROVAL', 'PLAN_APPROVED'],
  },
  {
    key: 'sourcing',
    label: 'Sourcing',
    taskTypes: ['CV_COLLECTION'],
    activeStatuses: ['ACTIVE'],
  },
  {
    key: 'screening',
    label: 'CV Screening',
    taskTypes: ['CV_SCREENING'],
    activeStatuses: ['SCREENING'],
  },
  {
    key: 'interview',
    label: 'Interview',
    taskTypes: ['INTERVIEW_COORDINATION'],
    activeStatuses: ['INTERVIEWING', 'INTERVIEW_COMPLETED'],
  },
  {
    key: 'offer',
    label: 'Offer',
    taskTypes: [],
    activeStatuses: ['OFFER_EXTENDED', 'OFFER_ACCEPTED', 'CLOSED'],
  },
  {
    key: 'hiring',
    label: 'Hiring',
    taskTypes: ['HIRING'],
    activeStatuses: ['HIRED', 'COMPLETED'],
  },
] as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  );

const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const csvRow = (values: Array<string | number>) => values.map(csvEscape).join(',');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'all';

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

export const HRPipelineReports: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [department, setDepartment] = useState('All Departments');
  const [campaignFilter, setCampaignFilter] = useState(ALL_CAMPAIGNS);
  const [range, setRange] = useState('Last 30 Days');
  const [requests, setRequests] = useState<RecruitmentRequestApiItem[]>([]);
  const [pipeline, setPipeline] = useState<PipelineOverviewResponse | null>(null);
  const [timeToHire, setTimeToHire] = useState<TimeToHireReportResponse | null>(null);
  const [tracking, setTracking] = useState<RealtimeTrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setApiError('');
      try {
        const assignedRequestQuery = user?.id
          ? `/recruitment-requests?limit=100&reviewedById=${encodeURIComponent(user.id)}`
          : '/recruitment-requests?limit=100&reviewedById=__unassigned__';
        const [requestsResponse, pipelineResponse, timeToHireResponse, trackingResponse] =
          await Promise.all([
          apiRequest<RecruitmentRequestListResponse>(assignedRequestQuery, token),
          apiRequest<PipelineOverviewResponse>('/reports/pipeline', token),
          apiRequest<TimeToHireReportResponse>('/reports/time-to-hire', token),
          apiRequest<RealtimeTrackingItem[]>('/reports/realtime-tracking', token),
        ]);
        setRequests(requestsResponse.data);
        setPipeline(pipelineResponse);
        setTimeToHire(timeToHireResponse);
        setTracking(trackingResponse);
      } catch (loadError) {
        setApiError(
          loadError instanceof Error ? loadError.message : 'Unable to load pipeline reports',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, user?.id]);

  const departmentOptions = useMemo(() => {
    const names = new Set<string>();
    requests.forEach((request) => {
      if (request.department) names.add(request.department.name);
    });
    return ['All Departments', ...Array.from(names)];
  }, [requests]);

  const campaigns: CampaignProgress[] = useMemo(
    () => {
      const trackingByRequest = new Map(
        tracking.map((item) => [item.requestId || item.id || '', item]),
      );
      return requests
        .filter((request) => !EXCLUDED_CAMPAIGN_STATUSES.has(request.status))
        .map((request) => {
          const tracked = trackingByRequest.get(request.id);
          const completion =
            tracked?.taskProgress && tracked.taskProgress.total > 0
              ? Math.round((tracked.taskProgress.completed / tracked.taskProgress.total) * 100)
              : request.headcount > 0
                ? Math.round((request.filledHeadcount / request.headcount) * 100)
                : 0;
          return {
            role: request.position,
            department: request.department?.name ?? 'Unassigned',
            requestId: request.id,
            status: request.status,
            owner:
              tracked?.handler ??
              tracked?.createdBy ??
              tracked?.currentOwner ??
              'Unassigned',
            hired: tracked?.hiredCount ?? tracked?.filledHeadcount ?? request.filledHeadcount,
            target: request.headcount,
            stage: STAGE_MAP[request.status] ?? 'Planning',
            completion,
            overdue: tracked?.taskProgress?.overdue ?? 0,
            projected: formatDate(tracked?.lastUpdatedAt ?? tracked?.updatedAt ?? request.updatedAt),
          };
        });
    },
    [requests, tracking],
  );

  const departmentCampaigns = useMemo(() => {
    if (department === 'All Departments') return campaigns;
    return campaigns.filter((campaign) => campaign.department === department);
  }, [campaigns, department]);

  const campaignOptionLabel = (campaign: CampaignProgress) =>
    `${campaign.role} (${campaign.requestId.slice(0, 8)})`;

  const campaignOptions = useMemo(
    () => [ALL_CAMPAIGNS, ...departmentCampaigns.map(campaignOptionLabel)],
    [departmentCampaigns],
  );

  const visibleCampaigns = useMemo(() => {
    if (campaignFilter === ALL_CAMPAIGNS) return departmentCampaigns;
    return departmentCampaigns.filter(
      (campaign) => campaignOptionLabel(campaign) === campaignFilter,
    );
  }, [campaignFilter, departmentCampaigns]);

  const filteredTracking = useMemo(() => {
    const ids = new Set(visibleCampaigns.map((campaign) => campaign.requestId));
    return tracking.filter((item) => ids.has(item.requestId || item.id || ''));
  }, [tracking, visibleCampaigns]);

  const campaignPipelines = useMemo(() => {
    const trackingByRequest = new Map(
      filteredTracking.map((item) => [item.requestId || item.id || '', item]),
    );

    return visibleCampaigns.map((campaign) => {
      const tracked = trackingByRequest.get(campaign.requestId);
      const tasks = tracked?.taskBreakdown ?? [];
      const activeIndex = Math.max(
        0,
        CAMPAIGN_PIPELINE_STAGES.findIndex((stage) =>
          (stage.activeStatuses as readonly string[]).includes(campaign.status),
        ),
      );

      const stages = CAMPAIGN_PIPELINE_STAGES.map((stage, index) => {
        const stageTasks = tasks.filter((task) =>
          (stage.taskTypes as readonly string[]).includes(task.taskType),
        );
        const assignees = [
          ...new Set(
            stageTasks
              .map((task) => task.assignedTo?.displayName)
              .filter((name): name is string => !!name),
          ),
        ];
        const complete =
          stageTasks.length > 0
            ? stageTasks.every((task) => task.status === 'COMPLETED')
            : index < activeIndex;
        const active =
          (stage.activeStatuses as readonly string[]).includes(campaign.status) ||
          stageTasks.some((task) => task.status === 'IN_PROGRESS') ||
          (!complete && index === activeIndex);
        const overdue = stageTasks.some((task) => task.isOverdue);

        return {
          key: stage.key,
          label: stage.label,
          complete,
          active,
          overdue,
          taskCount: stageTasks.length,
          completedCount: stageTasks.filter((task) => task.status === 'COMPLETED').length,
          assignees,
          owner:
            assignees.join(', ') ||
            (active ? tracked?.handler ?? tracked?.currentOwner ?? campaign.owner : 'Unassigned'),
        };
      });

      return {
        ...campaign,
        taskTotal: tracked?.taskProgress?.total ?? 0,
        taskCompleted: tracked?.taskProgress?.completed ?? 0,
        stages,
      };
    });
  }, [filteredTracking, visibleCampaigns]);

  const funnel = useMemo(() => {
    const breakdown = visibleCampaigns.reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] ?? 0) + 1;
      return acc;
    }, {});
    const total = visibleCampaigns.length;
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
  }, [visibleCampaigns]);

  const riskCampaigns = useMemo(
    () =>
      visibleCampaigns
        .filter((campaign) => campaign.overdue > 0)
        .sort((a, b) => b.overdue - a.overdue)
        .slice(0, 4),
    [visibleCampaigns],
  );

  const bottlenecks = useMemo(() => {
    if (riskCampaigns.length > 0) {
      return riskCampaigns.map((campaign) => ({
        label: campaign.role,
        helper: `${campaign.overdue} overdue task${campaign.overdue === 1 ? '' : 's'}`,
      }));
    }

    const stageTimes = Object.entries(timeToHire?.averageTimeInStageDays ?? {})
      .filter(([, days]) => days > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    if (stageTimes.length > 0) {
      return stageTimes.map(([stage, days]) => ({
        label: stage.replace(/_/g, ' '),
        helper: `${days} avg. days in stage`,
      }));
    }

    return [];
  }, [riskCampaigns, timeToHire]);

  const workload = useMemo(() => {
    const totals = filteredTracking.reduce(
      (acc, item) => {
        acc.total += item.taskProgress?.total ?? 0;
        acc.completed += item.taskProgress?.completed ?? 0;
        acc.overdue += item.taskProgress?.overdue ?? 0;
        return acc;
      },
      { total: 0, completed: 0, overdue: 0 },
    );
    return {
      ...totals,
      completionRate: totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0,
    };
  }, [filteredTracking]);

  const recommendations = useMemo(() => {
    const actions = filteredTracking
      .filter((item) => item.pendingAction && item.pendingAction !== 'NONE')
      .slice(0, 4)
      .map((item) => ({
        requestId: item.requestId || item.id || '',
        action: item.pendingAction!,
        title: item.pendingAction!.replace(/_/g, ' '),
        helper: `${item.position} - ${item.departmentName ?? item.department ?? 'Unassigned'}`,
      }));

    if (actions.length > 0) return actions;

    return riskCampaigns.map((campaign) => ({
      requestId: campaign.requestId,
      action: 'CLEAR_OVERDUE_TASKS',
      title: 'Clear overdue campaign tasks',
      helper: `${campaign.role} has ${campaign.overdue} overdue task${campaign.overdue === 1 ? '' : 's'}`,
    }));
  }, [filteredTracking, riskCampaigns]);

  const openRecommendedAction = (requestId: string, action: string) => {
    if (!requestId) return;
    navigate(`/hr/campaigns/${requestId}?action=${encodeURIComponent(action)}`);
  };

  const predictedOutcome = useMemo(() => {
    const target = visibleCampaigns.reduce((sum, campaign) => sum + campaign.target, 0);
    const hired = visibleCampaigns.reduce((sum, campaign) => sum + campaign.hired, 0);
    if (target === 0) return 'No active headcount target available.';
    return `${hired}/${target} headcount filled across visible campaigns.`;
  }, [visibleCampaigns]);

  const pipelineScopeSummary = `${visibleCampaigns.length} visible campaign${
    visibleCampaigns.length === 1 ? '' : 's'
  } of ${pipeline?.totalActiveCampaigns ?? campaigns.length} active campaign${
    (pipeline?.totalActiveCampaigns ?? campaigns.length) === 1 ? '' : 's'
  }`;

  const kpis = useMemo(() => {
    const breakdown = visibleCampaigns.reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] ?? 0) + 1;
      return acc;
    }, {});
    const screen = breakdown.SCREENING ?? 0;
    const interview = breakdown.INTERVIEWING ?? 0;
    const offerAccepted = breakdown.OFFER_ACCEPTED ?? 0;
    const offerDeclined = breakdown.OFFER_DECLINED ?? 0;

    const cvToInterview = screen > 0 ? Math.round((interview / screen) * 100) : 0;
    const cvToInterviewRate = `${cvToInterview}%`;
    const offerAcceptanceValue =
      offerAccepted + offerDeclined > 0
        ? Math.round((offerAccepted / (offerAccepted + offerDeclined)) * 100)
        : 0;
    const offerAcceptance =
      offerAccepted + offerDeclined > 0
        ? `${offerAcceptanceValue}%`
        : '0%';
    const avgTimeToHire = timeToHire?.averageTimeToHireDays ?? 0;
    const slaRisk = riskCampaigns.length > 0 ? (riskCampaigns.length >= 3 ? 'High' : 'Medium') : 'Low';

    return [
      {
        label: 'Avg. Time to Hire',
        value: `${avgTimeToHire} Days`,
        helper: `${timeToHire?.totalCompletedHires ?? 0} completed hires`,
        tone: avgTimeToHire > 30 ? 'text-rejected' : 'text-approved',
        progress: Math.min(100, Math.round((avgTimeToHire / 45) * 100)),
        fill: 'bg-teal-command',
      },
      {
        label: 'CV to Interview Rate',
        value: cvToInterviewRate,
        helper: `${interview}/${screen || 0} screening requests moved`,
        tone: cvToInterview >= 30 ? 'text-approved' : 'text-pending',
        progress: cvToInterview,
        fill: 'bg-pending',
      },
      {
        label: 'Offer Acceptance',
        value: offerAcceptance,
        helper: `${offerAccepted}/${offerAccepted + offerDeclined || 1} offers accepted`,
        tone: 'text-slate-ink',
        progress: offerAcceptanceValue,
        fill: 'bg-approved',
      },
      {
        label: 'SLA Breach Risk',
        value: slaRisk,
        helper: `${riskCampaigns.length} campaign${riskCampaigns.length === 1 ? '' : 's'} at risk`,
        tone: slaRisk === 'High' ? 'text-rejected' : slaRisk === 'Medium' ? 'text-revision' : 'text-approved',
        progress: Math.min(100, riskCampaigns.length * 25),
        fill: 'bg-slate-ink',
      },
    ];
  }, [riskCampaigns, timeToHire, visibleCampaigns]);

  const exportReport = () => {
    const generatedAt = new Date();
    const scope = `${department} / ${campaignFilter}`;
    const lines = [
      csvRow(['HR Pipeline Report']),
      csvRow(['Generated At', generatedAt.toISOString()]),
      csvRow(['Date Range', range]),
      csvRow(['Scope', scope]),
      csvRow(['Summary', pipelineScopeSummary]),
      [],
      csvRow(['KPI', 'Value', 'Helper']),
      ...kpis.map((kpi) => csvRow([kpi.label, kpi.value, kpi.helper])),
      [],
      csvRow(['Funnel Stage', 'Value', 'Rate']),
      ...funnel.map((item) => csvRow([item.label, item.value, item.rate])),
      [],
      csvRow(['Campaign', 'Department', 'Request ID', 'Owner', 'Status', 'Stage', 'Completion', 'Hired', 'Target', 'Overdue Tasks', 'Projected Completion']),
      ...visibleCampaigns.map((campaign) =>
        csvRow([
          campaign.role,
          campaign.department,
          campaign.requestId,
          campaign.owner,
          campaign.status,
          campaign.stage,
          `${campaign.completion}%`,
          campaign.hired,
          campaign.target,
          campaign.overdue,
          campaign.projected,
        ]),
      ),
      [],
      csvRow(['Workload Total Tasks', workload.total]),
      csvRow(['Workload Completed Tasks', workload.completed]),
      csvRow(['Workload Overdue Tasks', workload.overdue]),
      csvRow(['Workload Completion Rate', `${workload.completionRate}%`]),
      [],
      csvRow(['Campaigns at Risk']),
      ...riskCampaigns.map((campaign) =>
        csvRow([campaign.role, campaign.department, `${campaign.overdue} overdue tasks`]),
      ),
      [],
      csvRow(['Recommended Next Actions']),
      ...recommendations.map((item) => csvRow([item.title, item.helper])),
      [],
      csvRow(['Predicted Outcome', predictedOutcome]),
    ].map((line) => (Array.isArray(line) ? csvRow(line) : line));

    const csv = lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr-pipeline-report-${slugify(department)}-${slugify(campaignFilter)}-${generatedAt
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0 space-y-6">
        <HRPageHeader
          eyebrow="HR Manager Portal"
          title="Pipeline Reports"
          description="Track recruitment throughput, campaign bottlenecks, and time-to-hire signals."
          actions={
            <HRActionButton onClick={exportReport} type="button">
              <Icon className="h-4 w-4" name="export" />
              Export Report
            </HRActionButton>
          }
        />

        {apiError && <HRInlineAlert>{apiError}</HRInlineAlert>}

        {loading && <HRLoadingState label="Loading pipeline reports..." />}

        <HRCard className="p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <HRSelectControl
              label="Date Range"
              onChange={setRange}
              options={['Last 30 Days', 'Last Quarter', 'Year to Date']}
              value={range}
            />
            <HRSelectControl
              label="Department"
              onChange={(value) => {
                setDepartment(value);
                setCampaignFilter(ALL_CAMPAIGNS);
              }}
              options={departmentOptions}
              value={department}
            />
            <HRSelectControl
              className="md:col-span-2"
              label="Campaign"
              onChange={setCampaignFilter}
              options={campaignOptions}
              value={campaignFilter}
            />
          </div>
        </HRCard>

        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Pipeline report metrics"
        >
          {kpis.map((kpi) => (
            <HRCard className="p-5 shadow-sm" key={kpi.label}>
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
            </HRCard>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm lg:col-span-2">
            <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-deep-charcoal">Recruitment Funnel</h2>
              <span className="text-sm text-slate-ink">{pipelineScopeSummary}</span>
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
            {bottlenecks.length > 0 ? (
              <div className="space-y-3">
                {bottlenecks.map((item) => (
                  <div
                    className="rounded-lg border border-border-warm bg-workflow-ivory px-4 py-3"
                    key={`${item.label}-${item.helper}`}
                  >
                    <p className="text-sm font-bold capitalize text-deep-charcoal">{item.label}</p>
                    <p className="mt-1 text-xs font-semibold text-rejected">{item.helper}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border-warm bg-workflow-ivory px-4 py-8 text-center">
                <p className="text-sm font-semibold text-deep-charcoal">
                  No bottleneck data available.
                </p>
                <p className="mt-1 text-sm text-slate-ink">
                  Pipeline stages and overdue tasks are currently clear.
                </p>
              </div>
            )}
          </section>
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-deep-charcoal">
                Campaign Completion Pipeline
              </h2>
              <p className="mt-1 text-sm text-slate-ink">
                Track completion, current stage, pending stages, and assigned owners by campaign.
              </p>
            </div>
            <span className="text-sm font-semibold text-teal-command">
              {campaignPipelines.length} campaign{campaignPipelines.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-4">
            {campaignPipelines.map((campaign) => (
              <article
                className="rounded-lg border border-border-warm bg-workflow-ivory/40 p-4"
                key={campaign.requestId}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-deep-charcoal">{campaign.role}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-ink">
                      {campaign.department} / #{campaign.requestId.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-sm lg:text-right">
                    <p className="font-semibold text-slate-ink">Owner</p>
                    <p className="font-bold text-teal-command">{campaign.owner}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full bg-teal-command"
                      style={{ width: `${campaign.completion}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-deep-charcoal">
                    {campaign.completion}%
                  </span>
                  <span className="text-xs font-semibold text-slate-ink">
                    {campaign.taskCompleted}/{campaign.taskTotal} tasks completed
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-5">
                  {campaign.stages.map((stage) => (
                    <div
                      className={`rounded-lg border px-3 py-3 ${
                        stage.complete
                          ? 'border-approved/30 bg-approved/10'
                          : stage.active
                            ? 'border-teal-command/30 bg-teal-command/10'
                            : stage.overdue
                              ? 'border-rejected/30 bg-rejected/10'
                              : 'border-border-warm bg-clean-surface'
                      }`}
                      key={stage.key}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                          {stage.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            stage.complete
                              ? 'bg-approved/15 text-approved'
                              : stage.active
                                ? 'bg-teal-command/15 text-teal-command'
                                : stage.overdue
                                  ? 'bg-rejected/15 text-rejected'
                                  : 'bg-surface-container text-slate-ink'
                          }`}
                        >
                          {stage.complete
                            ? 'Done'
                            : stage.active
                              ? 'In Progress'
                              : stage.overdue
                                ? 'Overdue'
                                : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-ink">
                        {stage.completedCount}/{stage.taskCount || 1} task
                        {(stage.taskCount || 1) === 1 ? '' : 's'}
                      </p>
                      <p className="mt-2 truncate text-xs font-semibold text-deep-charcoal">
                        {stage.owner}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}

            {campaignPipelines.length === 0 && !loading && (
              <div className="rounded-lg border border-border-warm bg-workflow-ivory px-4 py-8 text-center">
                <p className="text-sm font-semibold text-deep-charcoal">
                  No campaign pipeline data found.
                </p>
                <p className="mt-1 text-sm text-slate-ink">
                  Change Department or Campaign filters to view another pipeline.
                </p>
              </div>
            )}
          </div>
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
                  <th className="px-4 py-4 font-bold">Owner</th>
                  <th className="px-4 py-4 font-bold">Tasks</th>
                  <th className="px-4 py-4 font-bold">Proj. Completion</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {visibleCampaigns.map((campaign) => {
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
                            style={{ width: `${campaign.completion}%` }}
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
                      <td className="px-4 py-4 text-sm font-semibold text-slate-ink">
                        {campaign.owner}
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
                    <td className="px-6 py-4 text-sm text-on-surface-variant" colSpan={7}>
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
          <div className="rounded-lg border border-border-warm bg-workflow-ivory p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-ink">Task completion</span>
              <span className="font-mono text-xl font-bold text-deep-charcoal">
                {workload.completionRate}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-teal-command"
                style={{ width: `${workload.completionRate}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-mono text-lg font-bold text-deep-charcoal">{workload.total}</p>
                <p className="text-[11px] font-semibold uppercase text-slate-ink">Total</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-approved">{workload.completed}</p>
                <p className="text-[11px] font-semibold uppercase text-slate-ink">Done</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-rejected">{workload.overdue}</p>
                <p className="text-[11px] font-semibold uppercase text-slate-ink">Overdue</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-deep-charcoal">Campaigns at Risk</h2>
          {riskCampaigns.length > 0 ? (
            <div className="space-y-3">
              {riskCampaigns.map((campaign) => (
                <div
                  className="rounded-lg border border-rejected/20 bg-rejected/5 px-4 py-3"
                  key={campaign.requestId}
                >
                  <p className="truncate text-sm font-bold text-deep-charcoal">{campaign.role}</p>
                  <p className="mt-1 text-xs font-semibold text-rejected">
                    {campaign.overdue} overdue task{campaign.overdue === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border-warm bg-workflow-ivory px-4 py-8 text-center">
              <p className="text-sm font-semibold text-deep-charcoal">No risk data available.</p>
              <p className="mt-1 text-sm text-slate-ink">No visible campaign has overdue tasks.</p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-deep-charcoal">Recommended Next Actions</h2>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((item) => (
                <button
                  className="block w-full rounded-lg border border-border-warm bg-workflow-ivory px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-teal-command/40 hover:bg-teal-command/5 hover:shadow-sm active:scale-[0.99]"
                  key={`${item.requestId}-${item.action}`}
                  onClick={() => openRecommendedAction(item.requestId, item.action)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold capitalize text-deep-charcoal">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-ink">{item.helper}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-teal-command">Open</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border-warm bg-workflow-ivory px-4 py-8 text-center">
              <p className="text-sm font-semibold text-deep-charcoal">
                No recommendations available.
              </p>
              <p className="mt-1 text-sm text-slate-ink">No pending actions were returned.</p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border-warm bg-teal-command/5 p-6 text-center">
          <Icon className="mx-auto h-8 w-8 text-teal-command" name="graph" />
          <h2 className="mt-3 text-sm font-bold text-teal-command">Predicted Outcome</h2>
          <p className="mt-1 text-sm leading-6 text-slate-ink">{predictedOutcome}</p>
        </section>
      </aside>
    </div>
  );
};
