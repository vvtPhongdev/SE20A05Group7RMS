import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, ApiError } from '../../../lib/api';

type RequestUrgency = 'Critical' | 'High' | 'Normal' | 'Low';
type QueueStatus = 'PENDING' | 'FORWARDED' | 'RETURNED' | 'APPROVED';

type RequestHistoryEntry = {
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: string;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
};

type RecruitmentRequest = {
  id: string;
  position: string;
  department: string;
  requestedBy: string;
  submittedDate: string;
  headcount: number;
  type: 'Full-time' | 'Internship';
  budget: string;
  budgetLabel: string;
  urgency: RequestUrgency;
  status: QueueStatus;
  justification: string;
  jobDescription: string;
  skillsRequired: string[];
  bachelorRequirements: string[];
  ownerId?: string | null;
  ownerName?: string | null;
  history: RequestHistoryEntry[];
};

interface RecruitmentRequestApiItem {
  id: string;
  position: string;
  department: { id: string; name: string; code: string } | null;
  requester: { id: string; displayName: string } | null;
  owner: { id: string; displayName: string } | null;
  reviewedBy?: { id: string; displayName: string } | null;
  status: string;
  urgency: string;
  headcount: number;
  filledHeadcount: number;
  jobDescription: string;
  skillRequirements: Record<string, unknown> | null;
  justification: string;
  hrSuggestedChanges?: {
    positionTitle?: string;
    headcount?: number;
    jobDescription?: string;
    justification?: string;
    urgency?: string;
    skillRequirements?: Record<string, unknown> | null;
  } | null;
  forwardedToAdmin?: boolean;
  history?: RequestHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

interface DepartmentRequirementsApiItem {
  id: string;
  bachelorRequirements?: unknown;
}

interface RecruitmentRequestListResponse {
  data: RecruitmentRequestApiItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface QueueSummaryResponse {
  averageReviewTimeDays: number;
  oldestPendingDays: number;
  reviewedThisWeek: number;
  forwardedThisWeek: number;
  distribution: Array<{ department: string; count: number; percentage: number }>;
}

const EMPTY_QUEUE_SUMMARY: QueueSummaryResponse = {
  averageReviewTimeDays: 0,
  oldestPendingDays: 0,
  reviewedThisWeek: 0,
  forwardedThisWeek: 0,
  distribution: [],
};

const URGENCY_MAP: Record<string, RequestUrgency> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Normal',
  LOW: 'Low',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

const historyActionLabels: Record<string, string> = {
  CREATED: 'Request created',
  SUBMITTED_FOR_REVIEW: 'Submitted for HR review',
  RESUBMITTED_FOR_REVIEW: 'Resubmitted for HR review',
  ASSIGNED_TO_HR: 'Assigned to HR',
  HR_PROPOSED_CHANGES: 'HR proposed changes',
  HR_RETURNED_FOR_REVISION: 'Returned to Department Head',
  HR_FORWARDED_TO_ADMIN: 'Forwarded to Admin',
  UPDATED: 'Request details updated',
  DEPT_HEAD_APPROVED_REVISION: 'Department Head approved HR revision',
  DEPT_HEAD_REJECTED_REVISION: 'Department Head rejected HR revision',
  ADMIN_REQUEST_DECISION: 'Admin decision',
  HR_REQUEST_DECISION: 'HR decision',
  ADMIN_REQUESTED_CHANGES: 'Admin requested changes',
};

const historyComment = (metadata?: Record<string, unknown> | null) => {
  if (!metadata) return null;
  const value = metadata.comments ?? metadata.feedback ?? metadata.revisionResponse;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const historyActionLabel = (entry: RequestHistoryEntry) => {
  if (entry.action === 'UPDATED' && entry.metadata?.acceptedHrSuggestion === true) {
    return 'Department Head approved HR revision';
  }
  if (entry.action === 'UPDATED' && entry.metadata?.acceptedHrSuggestion === false) {
    return 'Department Head rejected HR revision';
  }
  return historyActionLabels[entry.action] ?? entry.action.replace(/_/g, ' ');
};

const mapRequest = (
  item: RecruitmentRequestApiItem,
  bachelorRequirements: string[] = [],
): RecruitmentRequest => {
  const suggested = item.hrSuggestedChanges ?? null;
  const skills = ((suggested?.skillRequirements ?? item.skillRequirements ?? {}) || {}) as Record<
    string,
    unknown
  >;
  const employmentType = skills.employmentType === 'Internship' ? 'Internship' : 'Full-time';
  const salaryMin = skills.salaryMin as string | number | undefined;
  const salaryMax = skills.salaryMax as string | number | undefined;
  const ownerId = item.owner?.id ?? item.reviewedBy?.id ?? null;
  const ownerName = item.owner?.displayName ?? item.reviewedBy?.displayName ?? null;

  let budget = 'N/A';
  let budgetLabel = 'Monthly Budget';
  if (salaryMin || salaryMax) {
    budget = salaryMax ? `${salaryMin ?? ''}-${salaryMax}`.replace(/^-/, '') : `${salaryMin}`;
    budgetLabel = employmentType === 'Internship' ? 'Monthly Stipend' : 'Monthly Budget';
  }

  let status: QueueStatus = 'FORWARDED';
  if (item.status === 'PENDING_HR_REVIEW') {
    status = 'PENDING';
  } else if (item.status === 'PENDING_BOSS_APPROVAL') {
    status = 'FORWARDED';
  } else if (item.status === 'PENDING_REVIEW') {
    status = item.forwardedToAdmin ? 'FORWARDED' : 'PENDING';
  } else if (item.status === 'REVISION_NEEDED') {
    status = 'RETURNED';
  } else if (item.status === 'APPROVED') {
    status = 'APPROVED';
  }

  return {
    id: item.id,
    position: suggested?.positionTitle ?? item.position,
    department: item.department?.name ?? 'Unknown',
    requestedBy: item.requester?.displayName ?? 'Unknown',
    submittedDate: formatDate(item.createdAt),
    headcount: suggested?.headcount ?? item.headcount,
    type: employmentType,
    budget,
    budgetLabel,
    urgency: URGENCY_MAP[suggested?.urgency ?? item.urgency] ?? 'Normal',
    status,
    justification: suggested?.justification ?? item.justification,
    jobDescription: suggested?.jobDescription ?? item.jobDescription,
    skillsRequired: Array.isArray(skills.skills) ? (skills.skills as string[]) : [],
    bachelorRequirements,
    ownerId,
    ownerName,
    history: item.history ?? [],
  };
};

const statusTabs: Array<{ key: QueueStatus; label: string }> = [
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'FORWARDED', label: 'Forwarded to Admin' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'APPROVED', label: 'Approved' },
];

const QUEUE_REQUEST_STATUSES = new Set([
  'PENDING_HR_REVIEW',
  'PENDING_REVIEW',
  'PENDING_BOSS_APPROVAL',
  'REVISION_NEEDED',
  'APPROVED',
]);

const urgencyConfig: Record<RequestUrgency, { label: string; badge: string; rail: string }> = {
  Critical: {
    label: 'Critical Priority',
    badge: 'border-rejected/20 bg-rejected/10 text-rejected',
    rail: 'bg-rejected',
  },
  High: {
    label: 'High Priority',
    badge: 'border-revision/20 bg-revision/10 text-revision',
    rail: 'bg-revision',
  },
  Normal: {
    label: 'Normal Priority',
    badge: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
    rail: 'bg-teal-command',
  },
  Low: {
    label: 'Low Priority',
    badge: 'border-slate-ink/20 bg-slate-ink/10 text-slate-ink',
    rail: 'bg-slate-ink',
  },
};

const iconPaths: Record<string, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  bell: <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  wallet: <path d="M4 7h16v11H4zM16 11h4M7 7V5h10v2" />,
  dashboard: <path d="M4 13h6V4H4zm10 7h6V4h-6zM4 20h6v-3H4z" />,
  alert: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  monitor: <path d="M4 5h16v11H4zM9 21h6m-3-5v5" />,
  palette: (
    <path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 .5-3.94 1 1 0 0 1-.24-1.9H16a5 5 0 0 0 0-10h-4Zm-4 8h.01M9 7h.01M13 7h.01" />
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  inbox: <path d="M4 4h16l-2 10h-4a2 2 0 0 1-4 0H6L4 4Zm0 10v6h16v-6" />,
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

export const HRRequestQueue: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<QueueStatus>('PENDING');
  const [query, setQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RecruitmentRequest | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [queueSummary, setQueueSummary] = useState<QueueSummaryResponse>(EMPTY_QUEUE_SUMMARY);

  // Claim, Edit and Reject State variables
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    positionTitle: '',
    headcount: 1,
    justification: '',
    jobDescription: '',
    urgency: 'MEDIUM',
    skills: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const [claimSubmittingId, setClaimSubmittingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [response, summary, departments] = await Promise.all([
        apiRequest<RecruitmentRequestListResponse>('/recruitment-requests?limit=100', token),
        apiRequest<QueueSummaryResponse>('/reports/hr-request-queue-summary', token),
        apiRequest<DepartmentRequirementsApiItem[]>('/departments', token),
      ]);
      const bachelorRequirementsByDepartment = new Map(
        departments.map((department) => [
          department.id,
          Array.isArray(department.bachelorRequirements)
            ? department.bachelorRequirements.map(String)
            : [],
        ]),
      );
      // The queue is limited to request-review work. Once a request has moved into
      // planning, its plan lifecycle is owned by the Campaigns workspace.
      setRequests(
        response.data
          .filter((item) => QUEUE_REQUEST_STATUSES.has(item.status))
          .map((item) =>
            mapRequest(
              item,
              bachelorRequirementsByDepartment.get(item.department?.id ?? '') ?? [],
            ),
          ),
      );
      setQueueSummary(summary);
    } catch (loadError) {
      setApiError(loadError instanceof Error ? loadError.message : 'Unable to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [token]);

  const counts = useMemo(
    () =>
      statusTabs.reduce(
        (acc, tab) => {
          acc[tab.key] = requests.filter((request) => request.status === tab.key).length;
          return acc;
        },
        {} as Record<QueueStatus, number>,
      ),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = request.status === activeTab;
      const matchesQuery =
        !normalizedQuery ||
        [
          request.id,
          request.position,
          request.department,
          request.requestedBy,
          request.urgency,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [activeTab, query, requests]);

  const openReview = (request: RecruitmentRequest) => {
    setSelectedRequest(request);
  };

  const forwardToAdmin = async (id: string) => {
    setApiError('');
    try {
      await apiRequest(`/recruitment-requests/${id}/forward-to-admin`, token, {
        method: 'PATCH',
      });
      setRequests((current) =>
        current.map((item) => (item.id === id ? { ...item, status: 'FORWARDED' } : item)),
      );
      setSelectedRequest(null);
      setActiveTab('FORWARDED');
      void loadRequests();
    } catch (forwardError) {
      setApiError(
        forwardError instanceof ApiError
          ? forwardError.message
          : 'Unable to forward request to Admin',
      );
    }
  };

  const claimRequest = async (id: string, sourceRequest?: RecruitmentRequest) => {
    if (!user?.id) {
      setApiError('Unable to claim request because your HR account is not loaded.');
      return;
    }

    setClaimSubmittingId(id);
    setApiError('');
    try {
      const updated = await apiRequest<RecruitmentRequestApiItem>(
        `/recruitment-requests/${id}/assign`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ hrManagerId: user.id }),
        },
      );
      const assignee = updated.owner ?? updated.reviewedBy ?? user;
      const markClaimed = (request: RecruitmentRequest): RecruitmentRequest => ({
        ...request,
        ownerId: assignee.id,
        ownerName: assignee.displayName,
      });

      setRequests((current) => current.map((item) => (item.id === id ? markClaimed(item) : item)));

      const requestToRefresh =
        selectedRequest?.id === id
          ? selectedRequest
          : sourceRequest?.id === id
            ? sourceRequest
            : null;
      if (requestToRefresh) {
        setSelectedRequest(markClaimed(requestToRefresh));
      }
      void loadRequests();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Unable to claim request');
    } finally {
      setClaimSubmittingId(null);
    }
  };

  const startEditing = () => {
    if (!selectedRequest) return;
    const urgencyEnumMap: Record<RequestUrgency, string> = {
      Critical: 'CRITICAL',
      High: 'HIGH',
      Normal: 'MEDIUM',
      Low: 'LOW',
    };
    setEditForm({
      positionTitle: selectedRequest.position,
      headcount: selectedRequest.headcount,
      justification: selectedRequest.justification,
      jobDescription: selectedRequest.jobDescription,
      urgency: urgencyEnumMap[selectedRequest.urgency] ?? 'MEDIUM',
      skills: selectedRequest.skillsRequired.join(', '),
    });
    setEditError('');
    setIsEditing(true);
  };

  const buildEditPayload = () => {
    const skills = editForm.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    return {
      positionTitle: editForm.positionTitle,
      headcount: editForm.headcount,
      justification: editForm.justification,
      jobDescription: editForm.jobDescription,
      urgency: editForm.urgency,
      skillRequirements: { skills },
    };
  };

  const sendRevisionRequest = async () => {
    if (!selectedRequest) return;
    const feedback =
      revisionFeedback.trim() ||
      'HR has suggested changes to this recruitment request. Please review and respond.';

    setEditSubmitting(true);
    setEditError('');
    try {
      const payload = buildEditPayload();
      await apiRequest(`/recruitment-requests/${selectedRequest.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await apiRequest(`/recruitment-requests/${selectedRequest.id}/return-for-revision`, token, {
        method: 'PATCH',
        body: JSON.stringify({ feedback }),
      });

      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id ? { ...item, status: 'RETURNED' } : item,
        ),
      );
      setSelectedRequest(null);
      setIsEditing(false);
      setRevisionFeedback('');
      setActiveTab('RETURNED');
      void loadRequests();
    } catch (error) {
      setEditError(
        error instanceof ApiError ? error.message : 'Unable to send the revision request.',
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <main className="min-w-0 space-y-6">
        <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
              HR Manager Portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
              Request Review Queue
            </h1>
            <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">
              Review incoming recruitment requests, return incomplete requisitions, or forward
              validated requests to Admin.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search requests</span>
              <Icon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                name="search"
              />
              <input
                className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requests..."
                type="search"
                value={query}
              />
            </label>
            <button
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-warm bg-clean-surface text-on-surface-variant transition hover:border-teal-command hover:text-teal-command"
              type="button"
            >
              <span className="sr-only">Notifications</span>
              <Icon className="h-4 w-4" name="bell" />
              {counts.PENDING > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
              ) : null}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
              onClick={() => navigate('/hr/campaigns')}
              type="button"
            >
              <Icon className="h-4 w-4" name="add" />
              View Campaigns
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
            Loading requests...
          </div>
        )}

        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="overflow-x-auto">
            <nav className="flex min-w-max gap-8 border-b border-border-warm">
              {statusTabs.map((tab) => (
                <button
                  className={`border-b-2 px-1 pb-3 text-sm font-semibold transition active:scale-[0.98] ${
                    activeTab === tab.key
                      ? 'border-teal-command text-teal-command'
                      : 'border-transparent text-secondary hover:text-teal-command'
                  }`}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label} ({counts[tab.key]})
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'PENDING' && counts.PENDING > 0 ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-revision/20 bg-revision/10 px-3 py-1 text-revision">
              <span className="h-2 w-2 animate-pulse rounded-full bg-revision" />
              <span className="text-xs font-bold">{counts.PENDING} pending review</span>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          {filteredRequests.map((request) => {
            const urgency = urgencyConfig[request.urgency];

            return (
              <article
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm transition duration-200 hover:-translate-y-[2px] hover:border-teal-command/40"
                key={request.id}
                onClick={() => openReview(request)}
              >
                <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${urgency.rail}`} />
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${urgency.badge}`}
                      >
                        {urgency.label}
                      </span>
                      <span className="text-xs text-secondary">ID: #{request.id.slice(0, 8)}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-deep-charcoal transition group-hover:text-teal-command">
                      {request.position}
                    </h2>
                    <p className="mt-1 text-sm text-secondary">
                      {request.department} / Requested by:{' '}
                      <span className="font-semibold text-on-surface">{request.requestedBy}</span>
                      {request.ownerId ? (
                        <>
                          {' '}
                          • Assigned to:{' '}
                          <span className="font-semibold text-teal-command">
                            {request.ownerId === user?.id ? 'You' : request.ownerName}
                          </span>
                        </>
                      ) : (
                        <>
                          {' '}
                          • <span className="text-amber-600 font-medium">Unassigned</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="mb-2 font-mono text-sm text-secondary">
                      Submitted: {request.submittedDate}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <span className="rounded border border-border-warm bg-workflow-ivory px-3 py-1 text-xs font-semibold">
                        Headcount: {request.headcount}
                      </span>
                      <span className="rounded border border-border-warm bg-workflow-ivory px-3 py-1 text-xs font-semibold">
                        {request.type}
                      </span>
                      <span className="rounded border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        Bachelor: {request.bachelorRequirements.join(', ') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-4 flex flex-col gap-4 border-t border-border-warm/60 pt-4 lg:flex-row lg:items-center lg:justify-between"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-outline" name="wallet" />
                    <span className="text-sm font-bold text-on-surface">{request.budget}</span>
                    <span className="text-xs text-secondary">{request.budgetLabel}</span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {!request.ownerId && request.status !== 'APPROVED' ? (
                      <>
                        <button
                          className="h-10 rounded-lg border border-teal-command px-4 text-sm font-semibold text-teal-command transition hover:bg-teal-command hover:text-white active:scale-[0.98] disabled:opacity-50"
                          onClick={() => void claimRequest(request.id, request)}
                          disabled={claimSubmittingId === request.id}
                          type="button"
                        >
                          {claimSubmittingId === request.id ? 'Claiming...' : 'Claim Request'}
                        </button>
                        <button
                          className="h-10 rounded-lg bg-teal-command px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98]"
                          onClick={() => openReview(request)}
                          type="button"
                        >
                          Review
                        </button>
                      </>
                    ) : request.ownerId === user?.id && request.status !== 'APPROVED' ? (
                      <>
                        <button
                          className="h-10 rounded-lg bg-teal-command px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98]"
                          onClick={() => openReview(request)}
                          type="button"
                        >
                          Review
                        </button>
                      </>
                    ) : (
                      <button
                        className="h-10 rounded-lg bg-teal-command px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98]"
                        onClick={() => openReview(request)}
                        type="button"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border-warm bg-clean-surface px-6 py-12 text-center">
              <div className="rounded-xl bg-surface-container p-3 text-teal-command">
                <Icon className="h-6 w-6" name="inbox" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-deep-charcoal">No requests found</h2>
              <p className="mt-1 max-w-[42ch] text-sm text-on-surface-variant">
                Try clearing search or switch to another review queue tab.
              </p>
            </div>
          ) : null}
        </section>

        <footer className="flex flex-col items-center gap-4 py-4">
          <p className="text-sm text-secondary">
            Showing <span className="font-bold text-on-surface">{filteredRequests.length}</span> of{' '}
            <span className="font-bold text-on-surface">{counts[activeTab]}</span> requests
          </p>
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border-warm bg-clean-surface px-6 text-sm font-semibold text-on-surface shadow-sm transition hover:bg-surface-container active:scale-[0.98]"
            type="button"
          >
            Load More Requests
          </button>
        </footer>
      </main>

      <aside className="space-y-6">
        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Icon className="h-5 w-5 text-teal-command" name="dashboard" />
            <h2 className="text-lg font-semibold text-deep-charcoal">Queue Summary</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-secondary">Average Review Time</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-bold text-on-surface">
                  {queueSummary.averageReviewTimeDays.toFixed(1)}
                </span>
                <span className="text-sm text-secondary">days</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-workflow-ivory">
                <div
                  aria-label={`${queueSummary.averageReviewTimeDays.toFixed(1)} day average review time`}
                  className="h-full bg-teal-command"
                  style={{
                    width: `${Math.min(100, (queueSummary.averageReviewTimeDays / 5) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-revision/10 bg-revision/5 p-4">
              <p className="text-xs font-semibold text-secondary">Oldest Pending Request</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xl font-bold text-revision">
                  {queueSummary.oldestPendingDays} days
                </span>
                <Icon className="h-5 w-5 text-revision" name="alert" />
              </div>
              <p className="mt-1 text-[11px] font-medium text-revision/80">
                {queueSummary.oldestPendingDays > 0
                  ? 'Action recommended for SLAs'
                  : 'No request is waiting for HR review'}
              </p>
            </div>

            <div className="space-y-3 border-t border-border-warm/60 pt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface">
                This Week Performance
              </h3>
              {[
                ['Reviewed', queueSummary.reviewedThisWeek, 'bg-approved'],
                ['Forwarded', queueSummary.forwardedThisWeek, 'bg-pending'],
              ].map(([label, value, dot]) => (
                <div className="flex items-center justify-between text-sm" key={label as string}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="text-secondary">{label}</span>
                  </div>
                  <span className="font-bold text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-deep-charcoal">Request Distribution</h2>
          <div className="space-y-4">
            {queueSummary.distribution.length === 0 ? (
              <p className="text-sm text-secondary">No requests in the review queue.</p>
            ) : (
              queueSummary.distribution.map((item, index) => (
                <div className="flex items-center gap-3" key={item.department}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-workflow-ivory text-teal-command">
                    <Icon className="h-5 w-5" name={index % 2 === 0 ? 'monitor' : 'palette'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between">
                      <span className="text-xs font-semibold text-deep-charcoal">
                        {item.department}
                      </span>
                      <span className="text-xs font-semibold text-secondary">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full bg-teal-command"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="relative h-32 overflow-hidden rounded-lg bg-teal-command p-5 text-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(0,104,95,0.1),rgba(28,25,23,0.38))]" />
          <div className="relative flex h-full flex-col justify-end">
            <p className="text-sm font-bold">Need assistance?</p>
            <p className="mt-1 text-xs text-teal-50">
              Schedule a sync with the recruitment admin team.
            </p>
          </div>
        </section>
      </aside>

      {selectedRequest ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-deep-charcoal/40 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
              setIsEditing(false);
            }
          }}
        >
          <section className="flex h-full w-full max-w-[520px] flex-col bg-clean-surface shadow-2xl">
            <header className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory/60 px-6 py-4">
              <div>
                <p className="font-mono text-xs font-semibold text-teal-command">
                  #{selectedRequest.id.slice(0, 8)}
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-deep-charcoal">
                  Recruitment Requisition
                </h2>
              </div>
              <button
                className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-variant hover:text-deep-charcoal"
                onClick={() => {
                  setSelectedRequest(null);
                  setIsEditing(false);
                }}
                type="button"
              >
                <span className="sr-only">Close review drawer</span>
                <Icon className="h-4 w-4" name="close" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {!selectedRequest.ownerId ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">This request is unclaimed.</p>
                      <p className="text-xs text-amber-700 mt-1">
                        You must claim this request before you can edit or review it.
                      </p>
                    </div>
                    <button
                      className="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                      onClick={() => void claimRequest(selectedRequest.id, selectedRequest)}
                      disabled={claimSubmittingId === selectedRequest.id}
                      type="button"
                    >
                      {claimSubmittingId === selectedRequest.id ? 'Claiming...' : 'Claim Now'}
                    </button>
                  </div>
                </div>
              ) : selectedRequest.ownerId !== user?.id ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p>
                    This request is assigned to{' '}
                    <span className="font-semibold text-slate-900">
                      {selectedRequest.ownerName || 'another HR manager'}
                    </span>
                    .
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex justify-between items-center">
                  <p>You have claimed this request.</p>
                  {isEditing ? (
                    <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                      Editing Mode
                    </span>
                  ) : null}
                </div>
              )}

              {isEditing ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendRevisionRequest();
                  }}
                >
                  {editError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-rejected">
                      {editError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal mb-2">
                      Position Title
                    </label>
                    <input
                      type="text"
                      value={editForm.positionTitle}
                      onChange={(e) => setEditForm({ ...editForm, positionTitle: e.target.value })}
                      className="w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition focus:border-teal-command"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal mb-2">
                        Headcount
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.headcount}
                        onChange={(e) =>
                          setEditForm({ ...editForm, headcount: parseInt(e.target.value, 10) || 1 })
                        }
                        className="w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition focus:border-teal-command"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal mb-2">
                        Urgency
                      </label>
                      <select
                        value={editForm.urgency}
                        onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                        className="w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition focus:border-teal-command"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal mb-2">
                      Job Description
                    </label>
                    <textarea
                      value={editForm.jobDescription}
                      onChange={(e) => setEditForm({ ...editForm, jobDescription: e.target.value })}
                      className="w-full h-32 rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition focus:border-teal-command"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal mb-2">
                      Justification
                    </label>
                    <textarea
                      value={editForm.justification}
                      onChange={(e) => setEditForm({ ...editForm, justification: e.target.value })}
                      className="w-full h-24 rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition focus:border-teal-command"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal mb-2">
                      Key Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editForm.skills}
                      onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                      placeholder="e.g. React, TypeScript, Node.js"
                      className="w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition focus:border-teal-command"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal mb-2">
                      Revision Feedback{' '}
                      <span className="normal-case text-secondary">(optional)</span>
                    </label>
                    <textarea
                      className="h-24 w-full resize-none rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-teal-command"
                      onChange={(event) => setRevisionFeedback(event.target.value)}
                      placeholder="Explain the requested changes for the Department Head..."
                      value={revisionFeedback}
                    />
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-command">
                      Request Details
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-4 rounded-lg border border-border-warm bg-workflow-ivory p-4 sm:grid-cols-2">
                      {[
                        ['Position Title', selectedRequest.position],
                        ['Department', selectedRequest.department],
                        ['Number of Positions', String(selectedRequest.headcount)],
                        ['Priority', selectedRequest.urgency],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-warm bg-workflow-ivory p-4">
                    {[
                      ['Requested By', selectedRequest.requestedBy],
                      ['Request Status', selectedRequest.status],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[11px] font-semibold text-secondary">{label}</p>
                        <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                      Additional Notes
                    </h4>
                    <p className="rounded-lg border border-border-warm/60 bg-workflow-ivory/50 p-4 text-sm leading-6 text-slate-ink">
                      {selectedRequest.justification || 'No additional notes provided.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                      Job Description
                    </h4>
                    <p className="rounded-lg border border-border-warm/60 bg-workflow-ivory/50 p-4 text-sm leading-6 text-slate-ink whitespace-pre-wrap">
                      {selectedRequest.jobDescription || 'No job description provided.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.skillsRequired.length > 0 ? (
                        selectedRequest.skillsRequired.map((skill) => (
                          <span
                            className="rounded-full border border-teal-command/20 bg-teal-command/5 px-3 py-1 text-xs font-semibold text-teal-command"
                            key={skill}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-secondary italic">None specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                      Bachelor Requirements
                    </h4>
                    {selectedRequest.bachelorRequirements.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.bachelorRequirements.map((requirement) => (
                          <span
                            className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"
                            key={requirement}
                          >
                            {requirement}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-secondary italic">None specified</span>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                      Change History
                    </h4>
                    {selectedRequest.history.length > 0 ? (
                      <div className="space-y-3 border-l-2 border-border-warm pl-4">
                        {selectedRequest.history.map((entry, index) => {
                          const comment = historyComment(entry.metadata);
                          const actionLabel = historyActionLabel(entry);
                          const badgeLabel = entry.toStatus?.replace(/_/g, ' ') ?? actionLabel;
                          const outcomeTone =
                            entry.toStatus === 'APPROVED' ||
                            entry.action === 'DEPT_HEAD_APPROVED_REVISION'
                              ? 'border-approved/20 bg-approved/5 text-approved'
                              : entry.toStatus === 'REJECTED' ||
                                  entry.action === 'DEPT_HEAD_REJECTED_REVISION'
                                ? 'border-rejected/20 bg-rejected/5 text-rejected'
                                : 'border-border-warm bg-clean-surface text-on-surface-variant';

                          return (
                            <div className="relative rounded-lg border border-border-warm bg-workflow-ivory/50 p-3" key={`${entry.action}-${entry.createdAt}-${index}`}>
                              <span className="absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full border-2 border-clean-surface bg-teal-command" />
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-deep-charcoal">
                                  {actionLabel}
                                </p>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${outcomeTone}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                              {entry.fromStatus || entry.toStatus ? (
                                <p className="mt-1 text-xs text-secondary">
                                  {(entry.fromStatus ?? 'Initial').replace(/_/g, ' ')} →{' '}
                                  {(entry.toStatus ?? 'Updated').replace(/_/g, ' ')}
                                </p>
                              ) : null}
                              {comment ? (
                                <p className="mt-2 rounded bg-clean-surface px-2 py-1.5 text-xs leading-5 text-slate-ink">
                                  {comment}
                                </p>
                              ) : null}
                              <p className="mt-2 text-[11px] text-secondary">
                                {entry.actor || 'System'} · {new Date(entry.createdAt).toLocaleString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-border-warm bg-workflow-ivory/50 p-3 text-sm text-secondary">
                        No change history is available for this request.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <footer className="space-y-3 border-t border-border-warm bg-workflow-ivory/60 p-6">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="h-10 rounded-lg border border-border-warm bg-clean-surface text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                    onClick={() => setIsEditing(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-3 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:opacity-50"
                    disabled={editSubmitting}
                    onClick={() => void sendRevisionRequest()}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="send" />
                    {editSubmitting ? 'Sending...' : 'Send to Dept Head'}
                  </button>
                </div>
              ) : (
                <>
                  {selectedRequest.status === 'APPROVED' ? (
                    <div className="rounded-lg border border-approved/20 bg-approved/5 p-3 text-center text-sm font-medium text-approved">
                      This request was approved by Admin and is ready for campaign planning.
                    </div>
                  ) : selectedRequest.ownerId === user?.id ? (
                    <>
                      {selectedRequest.status === 'FORWARDED' ? (
                        <div className="rounded-lg border border-border-warm bg-clean-surface p-3 text-center text-sm font-medium text-secondary">
                          This request has been forwarded to Admin for approval.
                        </div>
                      ) : selectedRequest.status === 'RETURNED' ? (
                        <div className="rounded-lg border border-border-warm bg-clean-surface p-3 text-center text-sm font-medium text-secondary">
                          This request is waiting for Department Head revision.
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-3">
                            <button
                              className="h-10 rounded-lg border border-teal-command px-4 text-sm font-semibold text-teal-command transition hover:bg-teal-command hover:text-white active:scale-[0.98]"
                              onClick={startEditing}
                              type="button"
                            >
                              Edit Details
                            </button>
                          </div>
                          <button
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-deep-charcoal text-sm font-semibold text-white transition hover:bg-slate-ink active:scale-[0.98]"
                            onClick={() => forwardToAdmin(selectedRequest.id)}
                            type="button"
                          >
                            <Icon className="h-4 w-4" name="send" />
                            Forward to Admin
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                      onClick={() => setSelectedRequest(null)}
                      type="button"
                    >
                      Close
                    </button>
                  )}
                </>
              )}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
};
