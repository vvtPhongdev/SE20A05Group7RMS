import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../lib/api';
import { mapPlanStatus, type OverallPlanSummary, type PlanStatus } from '../lib/planStatus';

type Campaign = {
  id: string;
  position: string;
  department: string;
  headcount: number;
  status: PlanStatus;
  window: string;
  progress: number;
  owner: string;
  budget: string;
  taskCount: number;
  adminNote: string;
  planId: string | null;
  approverName: string;
  updatedAt: string | null;
};

interface RecruitmentRequestApiItem {
  id: string;
  position: string;
  department: { id: string; name: string; code: string } | null;
  reviewedBy: { id: string; displayName: string } | null;
  status: string;
  headcount: number;
  skillRequirements: Record<string, unknown> | null;
  overallPlan: OverallPlanSummary | null;
}

interface RecruitmentRequestListResponse {
  data: RecruitmentRequestApiItem[];
}

const EXCLUDED_CAMPAIGN_STATUSES = new Set([
  'DRAFT',
  'PENDING_REVIEW',
  'REJECTED',
  'REVISION_NEEDED',
  'CANCELLED',
]);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

// Best-effort placeholder, computed from plan status only (no N+1 task fetch here).
// See Campaign Detail page for the accurate task-completion-based progress.
const PROGRESS_BY_STATUS: Record<PlanStatus, number> = {
  DRAFT: 0,
  PENDING_APPROVAL: 10,
  APPROVED: 50,
  REVISION_REQUIRED: 30,
};

const mapCampaign = (item: RecruitmentRequestApiItem): Campaign => {
  const plan = item.overallPlan;
  const status = mapPlanStatus(plan);
  const skills = (item.skillRequirements ?? {}) as Record<string, unknown>;
  const salaryMin = skills.salaryMin as string | number | undefined;
  const salaryMax = skills.salaryMax as string | number | undefined;
  let budget = 'N/A';
  if (salaryMin || salaryMax) {
    budget = salaryMax ? `${salaryMin ?? ''}-${salaryMax}`.replace(/^-/, '') : `${salaryMin}`;
  }

  return {
    id: item.id,
    position: item.position,
    department: item.department?.name ?? 'Unassigned',
    headcount: item.headcount,
    status,
    window: plan ? `${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}` : 'TBD',
    progress: PROGRESS_BY_STATUS[status],
    owner: plan?.createdBy?.displayName ?? item.reviewedBy?.displayName ?? 'Unassigned',
    budget,
    taskCount: plan?._count.tasks ?? 0,
    adminNote: plan?.revisionNotes ?? '',
    planId: plan?.id ?? null,
    approverName: plan?.approvedBy?.displayName ?? 'Pending review',
    updatedAt: plan?.updatedAt ?? null,
  };
};

const statusConfig: Record<
  PlanStatus,
  { label: string; dot: string; badge: string; progress: string }
> = {
  PENDING_APPROVAL: {
    label: 'PENDING_APPROVAL',
    dot: 'bg-pending',
    badge: 'border-pending/20 bg-pending/10 text-pending',
    progress: 'bg-pending',
  },
  APPROVED: {
    label: 'APPROVED',
    dot: 'bg-approved',
    badge: 'border-approved/20 bg-approved/10 text-approved',
    progress: 'bg-approved',
  },
  DRAFT: {
    label: 'DRAFT',
    dot: 'bg-draft',
    badge: 'border-draft/20 bg-draft/10 text-draft',
    progress: 'bg-draft',
  },
  REVISION_REQUIRED: {
    label: 'REVISION_REQUIRED',
    dot: 'bg-revision',
    badge: 'border-revision/20 bg-revision/10 text-revision',
    progress: 'bg-revision',
  },
};

const metricToneClasses: Record<string, { label: string; dot: string }> = {
  draft: { label: 'text-draft', dot: 'bg-draft' },
  pending: { label: 'text-pending', dot: 'bg-pending' },
  approved: { label: 'text-approved', dot: 'bg-approved' },
  revision: { label: 'text-revision', dot: 'bg-revision' },
};

const iconPaths: Record<string, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
  person: <path d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
  checklist: <path d="m4 7 1.5 1.5L8 6m4 1h8M4 13l1.5 1.5L8 12m4 1h8M4 19l1.5 1.5L8 18m4 1h8" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
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

const StatusBadge = ({ status }: { status: PlanStatus }) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const HRCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PlanStatus | 'All'>('All');
  const [selectedId, setSelectedId] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRequestId, setCreateRequestId] = useState('');
  const [createStart, setCreateStart] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadCampaigns = async () => {
    setLoading(true);
    setApiError('');
    try {
      const response = await apiRequest<RecruitmentRequestListResponse>(
        '/recruitment-requests?limit=100',
        token,
      );
      const mapped = response.data
        .filter((item) => !EXCLUDED_CAMPAIGN_STATUSES.has(item.status))
        .map(mapCampaign);
      setCampaigns(mapped);
      setSelectedId((current) => current || mapped[0]?.id || '');
    } catch (loadError) {
      setApiError(loadError instanceof Error ? loadError.message : 'Unable to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, [token]);

  const metricCards = useMemo(
    () =>
      [
        { label: 'Plans Draft', status: 'DRAFT' as PlanStatus, tone: 'draft' },
        { label: 'Pending Approval', status: 'PENDING_APPROVAL' as PlanStatus, tone: 'pending' },
        { label: 'Approved Active', status: 'APPROVED' as PlanStatus, tone: 'approved' },
        { label: 'Revision Required', status: 'REVISION_REQUIRED' as PlanStatus, tone: 'revision' },
      ].map((card) => ({
        ...card,
        value: campaigns.filter((campaign) => campaign.status === card.status).length,
      })),
    [campaigns],
  );

  const visibleCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesStatus = status === 'All' || campaign.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [campaign.id, campaign.position, campaign.department, campaign.owner, campaign.status].some(
          (value) => value.toLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesQuery;
    });
  }, [campaigns, query, status]);

  const selected =
    campaigns.find((campaign) => campaign.id === selectedId) ?? visibleCampaigns[0] ?? null;

  const draftCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status === 'DRAFT'),
    [campaigns],
  );

  const createOverallPlan = async () => {
    if (!createRequestId || !createStart || !createEnd) return;

    setCreateSubmitting(true);
    setCreateError('');
    try {
      await apiRequest('/overall-plan', token, {
        method: 'POST',
        body: JSON.stringify({
          hiringRequestId: createRequestId,
          startDate: new Date(createStart).toISOString(),
          endDate: new Date(createEnd).toISOString(),
        }),
      });
      setShowCreateModal(false);
      setCreateRequestId('');
      setCreateStart('');
      setCreateEnd('');
      setSelectedId(createRequestId);
      await loadCampaigns();
    } catch (createErr) {
      setCreateError(
        createErr instanceof ApiError ? createErr.message : 'Unable to create overall plan',
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const resubmitPlan = async () => {
    if (!selected?.planId) return;

    setActionSubmitting(true);
    setActionError('');
    try {
      await apiRequest(`/overall-plan/${selected.planId}/resubmit`, token, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      await loadCampaigns();
    } catch (resubmitErr) {
      setActionError(
        resubmitErr instanceof ApiError ? resubmitErr.message : 'Unable to resubmit plan',
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <main className="min-w-0 space-y-6">
        <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
              HR Manager
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
              Recruitment Campaigns
            </h1>
            <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">
              Build and maintain overall plans for Admin-approved recruitment requests.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={draftCampaigns.length === 0}
            onClick={() => {
              setCreateRequestId(draftCampaigns[0]?.id ?? '');
              setCreateError('');
              setShowCreateModal(true);
            }}
            title={
              draftCampaigns.length === 0
                ? 'No approved requests are awaiting an overall plan'
                : undefined
            }
            type="button"
          >
            <Icon className="h-4 w-4" name="add" />
            Create Overall Plan
          </button>
        </header>

        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-rejected">
            {apiError}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-on-surface-variant">
            Loading campaigns...
          </div>
        )}

        <section
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Campaign metrics"
        >
          {metricCards.map((card) => {
            const tone = metricToneClasses[card.tone];

            return (
              <section
                className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]"
                key={card.label}
              >
                <p
                  className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${tone.label}`}
                >
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                  {card.label}
                </p>
                <p className="mt-4 font-mono text-[32px] font-semibold leading-none text-deep-charcoal">
                  {card.value}
                </p>
              </section>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <div className="flex flex-col gap-4 border-b border-border-warm bg-workflow-ivory/60 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-deep-charcoal">Active Campaigns</h2>
              <p className="mt-1 text-sm text-slate-ink">
                Showing {visibleCampaigns.length} of {campaigns.length} entries.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
              <label className="relative block">
                <span className="sr-only">Search campaigns</span>
                <Icon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                  name="search"
                />
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search campaigns..."
                  type="search"
                  value={query}
                />
              </label>
              <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-on-surface-variant">
                <Icon className="h-4 w-4" name="filter" />
                <span className="sr-only">Filter campaign status</span>
                <select
                  className="w-full border-none bg-transparent p-0 text-sm font-semibold text-on-surface-variant outline-none focus:ring-0"
                  onChange={(event) => setStatus(event.target.value as PlanStatus | 'All')}
                  value={status}
                >
                  <option value="All">All status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REVISION_REQUIRED">Revision</option>
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="bg-workflow-ivory text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                <tr>
                  {[
                    'Request ID',
                    'Position',
                    'Department',
                    'HC',
                    'Plan Status',
                    'Campaign Window',
                    'Progress',
                  ].map((column) => (
                    <th className="px-5 py-4 font-semibold" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {visibleCampaigns.map((campaign) => {
                  const selectedRow = selected?.id === campaign.id;

                  return (
                    <tr
                      className={`cursor-pointer transition ${selectedRow ? 'bg-teal-command/5 hover:bg-teal-command/10' : 'hover:bg-workflow-ivory/70'}`}
                      key={campaign.id}
                      onClick={() => {
                        setSelectedId(campaign.id);
                        setActionError('');
                      }}
                    >
                      <td
                        className={`px-5 py-4 font-mono text-sm ${selectedRow ? 'text-teal-command' : 'text-slate-ink'}`}
                      >
                        #{campaign.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-deep-charcoal">
                        {campaign.position}
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {campaign.department}
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-on-surface-variant">
                        {campaign.headcount}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {campaign.window}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-variant">
                            <div
                              className={`h-full rounded-full ${statusConfig[campaign.status].progress}`}
                              style={{ width: `${campaign.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-on-surface-variant">
                            {campaign.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && visibleCampaigns.length === 0 ? (
            <div className="border-t border-border-warm px-6 py-12 text-center">
              <p className="text-sm font-semibold text-deep-charcoal">
                No campaigns match this view.
              </p>
              <p className="mt-1 text-sm text-slate-ink">
                Adjust the search term or status filter.
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <aside className="min-w-0 rounded-lg border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)] xl:sticky xl:top-6 xl:self-start">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-border-warm bg-workflow-ivory/50 p-5">
              <div>
                <p className="font-mono text-sm font-semibold text-teal-command">
                  #{selected.id.slice(0, 8)}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-deep-charcoal">Campaign Details</h2>
              </div>
              <button
                className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-variant hover:text-deep-charcoal active:scale-[0.98]"
                onClick={() => setSelectedId('')}
                type="button"
              >
                <span className="sr-only">Close campaign detail</span>
                <Icon className="h-4 w-4" name="close" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <h3 className="text-xl font-semibold text-deep-charcoal">{selected.position}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                  <span>{selected.department} Dept.</span>
                  <span className="text-border-warm">/</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon className="h-4 w-4" name="person" />
                    Headcount: {selected.headcount}
                  </span>
                </div>
                <div className="mt-3">
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              {selected.status === 'PENDING_APPROVAL' ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <Icon className="mt-0.5 h-4 w-4 text-revision" name="lock" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Plan locked</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Execution stays locked until Admin approves the plan. Tasks cannot be
                      activated.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Campaign Window', selected.window],
                  ['Owner', selected.owner],
                  ['Budget Allocation', selected.budget],
                  ['Task Count', `${selected.taskCount} tasks configured`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-warm pt-5">
                <h4 className="text-sm font-semibold text-deep-charcoal">Admin Notes (Latest)</h4>
                <div className="mt-3 rounded-lg border border-border-warm bg-workflow-ivory p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-deep-charcoal">
                      {selected.approverName}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {selected.updatedAt ? formatDate(selected.updatedAt) : '-'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {selected.adminNote || 'No notes yet.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border-warm bg-workflow-ivory/50 p-5">
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-rejected">
                  {actionError}
                </div>
              )}
              {selected.status === 'REVISION_REQUIRED' ? (
                <button
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={actionSubmitting}
                  onClick={() => void resubmitPlan()}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="send" />
                  {actionSubmitting ? 'Resubmitting...' : 'Resubmit for Approval'}
                </button>
              ) : selected.status === 'PENDING_APPROVAL' ? (
                <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-2 text-center text-xs font-semibold text-on-surface-variant">
                  Awaiting Admin Approval
                </div>
              ) : selected.status === 'DRAFT' ? (
                <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-2 text-center text-xs text-on-surface-variant">
                  Use "Create Overall Plan" to start this campaign's plan.
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="h-10 rounded-lg border border-border-warm text-sm font-semibold text-on-surface-variant transition disabled:cursor-not-allowed disabled:opacity-60"
                  disabled
                  title="Editing an existing plan is not yet supported"
                  type="button"
                >
                  Edit Plan
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                  onClick={() => navigate(`/hr/campaigns/${selected.id}`)}
                  type="button"
                >
                  Open Detail
                  <Icon className="h-4 w-4" name="arrow" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-deep-charcoal">Select a campaign</p>
            <p className="mt-1 text-sm text-slate-ink">Choose a row to inspect plan details.</p>
          </div>
        )}
      </aside>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40 p-4 backdrop-blur-sm">
          <section className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border-warm bg-clean-surface shadow-2xl">
            <header className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory/60 px-6 py-4">
              <h2 className="font-semibold text-deep-charcoal">Create Overall Plan</h2>
              <button
                className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-variant hover:text-deep-charcoal"
                onClick={() => setShowCreateModal(false)}
                type="button"
              >
                <span className="sr-only">Close create plan modal</span>
                <Icon className="h-4 w-4" name="close" />
              </button>
            </header>
            <div className="space-y-4 p-6">
              {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-rejected">
                  {createError}
                </div>
              )}
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                  Recruitment Request
                </span>
                <select
                  className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setCreateRequestId(event.target.value)}
                  value={createRequestId}
                >
                  {draftCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      #{campaign.id.slice(0, 8)} - {campaign.position}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                    Start Date
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    onChange={(event) => setCreateStart(event.target.value)}
                    type="date"
                    value={createStart}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                    End Date
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    onChange={(event) => setCreateEnd(event.target.value)}
                    type="date"
                    value={createEnd}
                  />
                </label>
              </div>
            </div>
            <footer className="flex justify-end gap-3 border-t border-border-warm bg-workflow-ivory/60 px-6 py-4">
              <button
                className="h-10 rounded-lg border border-border-warm px-4 text-sm font-semibold text-secondary transition hover:bg-surface-variant/40 active:scale-[0.98]"
                onClick={() => setShowCreateModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-teal-command px-5 text-sm font-bold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!createRequestId || !createStart || !createEnd || createSubmitting}
                onClick={() => void createOverallPlan()}
                type="button"
              >
                {createSubmitting ? 'Creating...' : 'Create Plan'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
};
