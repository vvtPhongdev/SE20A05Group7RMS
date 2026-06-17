import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ApiError, apiRequest } from '../../../lib/api';
import {
  DeptHeadActionButton,
  DeptHeadDashboardPage,
  DeptHeadInlineAlert,
  DeptHeadLoadingState,
  DeptHeadPageHeader,
  DeptHeadSearchInput,
} from '../components';

type RequestStatus = 'Draft' | 'Pending' | 'Approved' | 'Revision Required' | 'Completed' | 'Rejected';
type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
type FilterKey = 'All' | 'Pending' | 'Approved' | 'Revision' | 'Completed';
type SortKey = 'submitted' | 'priority' | 'status' | 'quantity';

interface DeptRequest {
  id: string;
  position: string;
  quantity: number;
  filledHeadcount: number;
  priority: Priority;
  submitted: string;
  submittedAt: string;
  status: RequestStatus;
  rejectionReason?: string | null;
}

interface RealtimeTrackingItem {
  id: string;
  position: string;
  targetHeadcount: number;
  filledHeadcount: number;
  status: string;
  createdBy: string;
  handler: string;
  createdAt: string;
  updatedAt: string;
  urgency?: string;
  rejectionReason?: string | null;
}

interface RecruitmentRequestDetails {
  id: string;
  position: string;
  headcount: number;
  status: string;
  urgency: string;
  jobDescription?: string | null;
  justification?: string | null;
  skillRequirements?: {
    jobLevel?: string;
    employmentType?: string;
    salaryMin?: string | number;
    salaryMax?: string | number;
    startDate?: string;
    skills?: string[];
  } | null;
}

const filterOptions: FilterKey[] = ['All', 'Pending', 'Approved', 'Revision', 'Completed'];

const priorityWeight: Record<Priority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const statusStyles: Record<RequestStatus, string> = {
  Approved: 'border-green-200 bg-green-50 text-approved',
  Pending: 'border-cyan-200 bg-cyan-50 text-pending',
  'Revision Required': 'border-amber-200 bg-amber-50 text-revision',
  Draft: 'border-stone-200 bg-stone-100 text-draft',
  Completed: 'border-green-200 bg-green-50 text-approved',
  Rejected: 'border-red-200 bg-red-50 text-rejected',
};

const priorityFromUrgency = (urgency?: string): Priority => {
  switch ((urgency ?? '').toUpperCase()) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'LOW':
      return 'Low';
    default:
      return 'Medium';
  }
};

const statusFromApi = (status: string, filledHeadcount: number, targetHeadcount: number): RequestStatus => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PENDING_HR_REVIEW':
    case 'PENDING_BOSS_APPROVAL':
    case 'PENDING_REVIEW':
      return 'Pending';
    case 'REVISION_NEEDED':
      return 'Revision Required';
    case 'REJECTED':
    case 'CANCELLED':
      return 'Rejected';
    case 'COMPLETED':
    case 'CLOSED':
      return 'Completed';
    case 'OFFER_ACCEPTED':
      return filledHeadcount >= targetHeadcount ? 'Completed' : 'Approved';
    case 'APPROVED':
    case 'PLANNING':
    case 'PLAN_PENDING_APPROVAL':
    case 'PLAN_APPROVED':
    case 'ACTIVE':
    case 'INTERVIEWING':
    case 'DECISION_PENDING':
    case 'HIRED':
    case 'NOT_HIRED':
      return 'Approved';
    default:
      return 'Pending';
  }
};

const mapRequest = (item: RealtimeTrackingItem): DeptRequest => ({
  id: item.id,
  position: item.position,
  quantity: item.targetHeadcount,
  filledHeadcount: item.filledHeadcount,
  priority: priorityFromUrgency(item.urgency),
  submitted: new Date(item.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }),
  submittedAt: item.createdAt,
  status: statusFromApi(item.status, item.filledHeadcount, item.targetHeadcount),
  rejectionReason: item.rejectionReason,
});

const priorityStyles: Record<Priority, string> = {
  Critical: 'text-rejected',
  High: 'text-revision',
  Medium: 'text-on-surface-variant',
  Low: 'text-slate-ink',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    add: <path d="M12 5v14M5 12h14" />,
    assignment: (
      <>
        <path d="M8 4h8l2 2v14H6V6l2-2Z" />
        <path d="M9 10h6M9 14h6M9 18h3" />
      </>
    ),
    check: <path d="m5 13 4 4L19 7" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    history: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" />,
    hourglass: <path d="M6 3h12M6 21h12M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />,
    notification: <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    search: <path d="M11 19a8 8 0 1 1 5.66-2.34L21 21" />,
    sort: <path d="M8 7h10M8 12h7M8 17h4M4 7h.01M4 12h.01M4 17h.01" />,
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

export const DeptHeadRequests: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [requests, setRequests] = useState<DeptRequest[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [sortKey, setSortKey] = useState<SortKey>('submitted');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<RecruitmentRequestDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setApiError('');
      try {
        const data = await apiRequest<RealtimeTrackingItem[]>('/reports/realtime-tracking', token);
        const mapped = data.map(mapRequest);
        setRequests(mapped);
        setSelectedRequestId((current) => current || mapped[0]?.id || '');
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load requests');
      } finally {
        setLoading(false);
      }
    };
    void loadRequests();
  }, [token]);

  useEffect(() => {
    if (!selectedRequestId) {
      setSelectedRequestDetails(null);
      return;
    }
    let cancelled = false;
    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        const data = await apiRequest<RecruitmentRequestDetails>(`/recruitment-requests/${selectedRequestId}`, token);
        if (cancelled) return;
        setSelectedRequestDetails(data);
      } catch (err) {
        console.error('Error loading request details:', err);
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    };
    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [selectedRequestId, token]);

  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests
      .filter((request) => {
        const matchesFilter =
          activeFilter === 'All' ||
          request.status === activeFilter ||
          (activeFilter === 'Revision' && request.status === 'Revision Required');
        const matchesQuery =
          !normalizedQuery ||
          request.id.toLowerCase().includes(normalizedQuery) ||
          request.position.toLowerCase().includes(normalizedQuery) ||
          request.priority.toLowerCase().includes(normalizedQuery) ||
          request.status.toLowerCase().includes(normalizedQuery);

        return matchesFilter && matchesQuery;
      })
      .sort((left, right) => {
        if (sortKey === 'priority') {
          return priorityWeight[right.priority] - priorityWeight[left.priority];
        }
        if (sortKey === 'status') {
          return left.status.localeCompare(right.status);
        }
        if (sortKey === 'quantity') {
          return right.quantity - left.quantity;
        }
        return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      });
  }, [activeFilter, query, requests, sortKey]);

  const submitDraft = async (id: string) => {
    setApiError('');
    try {
      await apiRequest(`/recruitment-requests/${id}/submit`, token, { method: 'PATCH' });
      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, status: 'Pending' as RequestStatus } : request,
        ),
      );
    } catch (submitError) {
      setApiError(
        submitError instanceof ApiError ? submitError.message : 'Unable to submit request',
      );
    }
  };

  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) ?? visibleRequests[0];

  const totalRequests = requests.length;
  const pendingCount = requests.filter((request) => request.status === 'Pending').length;
  const approvedActiveCount = requests.filter((request) => request.status === 'Approved').length;
  const targetHeadcountSum = requests.reduce((sum, request) => sum + request.quantity, 0);
  const filledCount = requests.reduce((sum, request) => sum + request.filledHeadcount, 0);
  const completionPercent =
    targetHeadcountSum > 0 ? Math.round((filledCount / targetHeadcountSum) * 100) : 0;
  const circumference = 2 * Math.PI * 24;
  const strokeOffset = circumference - (completionPercent / 100) * circumference;

  return (
    <DeptHeadDashboardPage>
      <DeptHeadPageHeader
        title="Request Status Dashboard"
        actions={
          <>
          <DeptHeadSearchInput
            className="w-full md:w-56"
            label="Search requests"
            onChange={setQuery}
            placeholder="Search requests..."
            value={query}
          />
          <DeptHeadActionButton onClick={() => navigate('/dept-head/create-request')}>
            <Icon className="h-4 w-4" name="add" />
            New Request
          </DeptHeadActionButton>
          <div className="hidden h-8 w-px bg-border-warm md:block" />
          <div className="flex gap-2 text-on-surface-variant">
            <button
              aria-label="Notifications"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-surface-container-high hover:text-teal-command active:scale-[0.98]"
              type="button"
            >
              <Icon className="h-5 w-5" name="notification" />
            </button>
            <button
              aria-label="History"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-surface-container-high hover:text-teal-command active:scale-[0.98]"
              type="button"
            >
              <Icon className="h-5 w-5" name="history" />
            </button>
          </div>
          </>
        }
      />

      {apiError && <DeptHeadInlineAlert>{apiError}</DeptHeadInlineAlert>}

      {loading && <DeptHeadLoadingState label="Loading requests..." />}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Request metrics">
        <MetricCard icon="assignment" label="Total Requests" value={totalRequests} />
        <MetricCard icon="hourglass" label="Pending Approval" value={pendingCount} />
        <MetricCard icon="check" label="Approved & Active" value={approvedActiveCount} />
        <div className="flex items-center justify-between rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Positions Filled
            </p>
            <p className="mt-2 font-mono text-[32px] font-semibold leading-none text-deep-charcoal">
              {filledCount}
            </p>
            <p className="mt-2 text-xs font-bold text-approved">{completionPercent}% Completion</p>
          </div>
          <div className="relative grid h-20 w-20 place-items-center">
            <svg className="h-20 w-20" viewBox="0 0 72 72">
              <circle
                className="stroke-surface-container-high"
                cx="36"
                cy="36"
                fill="none"
                r="24"
                strokeWidth="7"
              />
              <circle
                className="origin-center -rotate-90 stroke-teal-command transition-all duration-300"
                cx="36"
                cy="36"
                fill="none"
                r="24"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                strokeWidth="7"
              />
            </svg>
            <span className="absolute font-mono text-xs font-bold text-deep-charcoal">
              {completionPercent}%
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((filter) => (
              <button
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
                  activeFilter === filter
                    ? 'border-teal-command bg-teal-command text-white shadow-sm'
                    : 'border-border-warm bg-clean-surface text-on-surface-variant hover:border-teal-command hover:text-teal-command'
                }`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-3 text-xs font-semibold text-on-surface-variant transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
              onClick={() => setActiveFilter('All')}
              type="button"
            >
              <Icon className="h-4 w-4" name="filter" />
              Filter
            </button>
            <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-3 text-xs font-semibold text-on-surface-variant transition focus-within:border-teal-command focus-within:text-teal-command">
              <Icon className="h-4 w-4" name="sort" />
              <span>Sort</span>
              <select
                className="max-w-[130px] border-none bg-transparent p-0 text-xs font-semibold text-deep-charcoal outline-none focus:ring-0"
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                value={sortKey}
              >
                <option value="submitted">Latest</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="quantity">Quantity</option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-border-warm bg-parchment-lift text-sm text-on-surface-variant">
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Position</th>
                  <th className="px-6 py-4 font-semibold">Qty</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {visibleRequests.map((request, index) => (
                  <tr
                    className={`transition hover:bg-teal-command/5 cursor-pointer ${
                      index % 2 === 1 ? 'bg-workflow-ivory/60' : 'bg-clean-surface'
                    }`}
                    key={request.id}
                    onClick={() => {
                      setSelectedRequestId(request.id);
                      setIsViewModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 font-mono text-sm text-teal-command">{request.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-deep-charcoal">
                      {request.position}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-deep-charcoal">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase ${priorityStyles[request.priority]}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{request.submitted}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-3">
                        {request.status === 'Draft' && (
                          <>
                            <button
                              className="text-xs font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                              onClick={() => navigate(`/dept-head/create-request?requestId=${request.id}`)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded bg-teal-command px-3 py-1 text-[11px] font-bold uppercase text-white shadow-sm transition hover:bg-primary active:scale-[0.98]"
                              onClick={() => submitDraft(request.id)}
                              type="button"
                            >
                              Submit
                            </button>
                          </>
                        )}
                        {request.status === 'Revision Required' && (
                          <button
                            className="text-xs font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                            onClick={() => navigate(`/dept-head/create-request?requestId=${request.id}`)}
                            type="button"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="text-xs font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                          onClick={() => {
                            setSelectedRequestId(request.id);
                            setIsViewModalOpen(true);
                          }}
                          type="button"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visibleRequests.length === 0 && (
            <div className="border-t border-border-warm px-6 py-12 text-center">
              <p className="text-base font-semibold text-deep-charcoal">No requests found</p>
              <p className="mt-1 text-sm text-slate-ink">
                Try another status filter or search term.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border-warm bg-parchment-lift/50 px-6 py-4 text-sm text-on-surface-variant md:flex-row md:items-center md:justify-between">
            <p>
              Showing 1 to {visibleRequests.length} of {totalRequests} results
            </p>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-border-warm bg-clean-surface text-on-surface-variant disabled:opacity-50"
                disabled
                type="button"
              >
                <Icon className="h-4 w-4" name="chevronLeft" />
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  className={`h-8 min-w-8 rounded px-3 text-xs font-semibold transition active:scale-[0.98] ${
                    page === 1
                      ? 'bg-teal-command text-white'
                      : 'border border-border-warm bg-clean-surface text-on-surface-variant hover:border-teal-command hover:text-teal-command'
                  }`}
                  key={page}
                  type="button"
                >
                  {page}
                </button>
              ))}
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-border-warm bg-clean-surface text-on-surface-variant transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                type="button"
              >
                <Icon className="h-4 w-4" name="chevronRight" />
              </button>
            </div>
          </div>
        </div>

        {selectedRequest && (
          <div className="mt-5 rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <div className="flex flex-col gap-3 border-b border-border-warm pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-mono text-xs font-semibold text-teal-command">
                  {selectedRequest.id}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-deep-charcoal">
                  {selectedRequest.position}
                </h2>
                <p className="mt-1 text-sm text-slate-ink">
                  Request detail preview for department tracking and approval follow-up.
                </p>
              </div>
              <span
                className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[selectedRequest.status]}`}
              >
                {selectedRequest.status}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {[
                ['Quantity', selectedRequest.quantity],
                ['Priority', selectedRequest.priority],
                ['Submitted', selectedRequest.submitted],
                ['Next action', selectedRequest.status === 'Draft' ? 'Submit request' : 'Monitor status'],
              ].map(([label, value]) => (
                <div className="rounded-lg border border-border-warm bg-workflow-ivory/70 p-4" key={label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-deep-charcoal">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {selectedRequest.status === 'Revision Required' && selectedRequest.rejectionReason && (
                <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900 mb-1">
                    Feedback / Revision Instructions
                  </p>
                  <p className="leading-relaxed font-semibold">{selectedRequest.rejectionReason}</p>
                </div>
              )}
              <div className="rounded-lg border border-border-warm p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Status summary
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-ink">
                  {selectedRequest.status === 'Revision Required'
                    ? 'HR returned this request for edits. Update the justification before resubmitting.'
                    : selectedRequest.status === 'Completed'
                      ? 'Hiring has been completed and the request can be used for reporting.'
                      : selectedRequest.status === 'Approved'
                        ? 'The request is approved and ready for HR planning or active recruitment.'
                        : selectedRequest.status === 'Pending'
                          ? 'The request is waiting for review from the approval workflow.'
                          : 'The request is still a draft and has not entered approval yet.'}
                </p>
              </div>
              <div className="rounded-lg border border-border-warm p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Available actions
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedRequest.status === 'Draft' ||
                    selectedRequest.status === 'Revision Required') && (
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-border-warm px-3 text-xs font-semibold text-teal-command transition hover:border-teal-command active:scale-[0.98]"
                      onClick={() => navigate('/dept-head/create-request')}
                      type="button"
                    >
                      Edit Request
                    </button>
                  )}
                  {selectedRequest.status === 'Draft' && (
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-teal-command px-3 text-xs font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                      onClick={() => submitDraft(selectedRequest.id)}
                      type="button"
                    >
                      Submit Draft
                    </button>
                  )}
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border-warm px-3 text-xs font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                    onClick={() => setSelectedRequestId('')}
                    type="button"
                  >
                    Close Detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {isViewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-deep-charcoal/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-warm bg-clean-surface shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border-warm px-6 py-5 bg-workflow-ivory/50">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-command">
                  Recruitment Request Details
                </p>
                <h3 className="mt-1 text-xl font-semibold text-deep-charcoal">
                  {selectedRequest.position}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant font-mono">
                  ID: #{selectedRequest.id}
                </p>
              </div>
              <button
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
                onClick={() => setIsViewModalOpen(false)}
                type="button"
              >
                <Icon className="h-5 w-5" name="close" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* Revision feedback banner if status is Revision Required */}
              {selectedRequest.status === 'Revision Required' && selectedRequest.rejectionReason && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900 mb-1">
                    Feedback / Revision Instructions
                  </p>
                  <p className="leading-relaxed font-semibold">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Status and urgency section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-workflow-ivory rounded-lg border border-border-warm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant mb-1">
                    Request Status
                  </p>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[selectedRequest.status]}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="p-4 bg-workflow-ivory rounded-lg border border-border-warm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant mb-1">
                    Urgency / Priority
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase ${priorityStyles[selectedRequest.priority]}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>

              {/* Headcount, Salary & Start Date */}
              {loadingDetails ? (
                <div className="py-12 text-center text-sm text-on-surface-variant">
                  Loading detailed request specifications...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-border-warm p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Target Quantity
                      </p>
                      <p className="mt-2 text-sm font-semibold text-deep-charcoal">
                        {selectedRequestDetails?.headcount || selectedRequest.quantity} Persons
                      </p>
                    </div>
                    <div className="rounded-lg border border-border-warm p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Job Level
                      </p>
                      <p className="mt-2 text-sm font-semibold text-deep-charcoal">
                        {selectedRequestDetails?.skillRequirements?.jobLevel || 'Not specified'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border-warm p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Employment Type
                      </p>
                      <p className="mt-2 text-sm font-semibold text-deep-charcoal">
                        {selectedRequestDetails?.skillRequirements?.employmentType || 'Not specified'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border-warm p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Salary Range
                      </p>
                      <p className="mt-2 text-sm font-semibold text-teal-command">
                        {selectedRequestDetails?.skillRequirements?.salaryMin && selectedRequestDetails?.skillRequirements?.salaryMax
                          ? `${Number(selectedRequestDetails.skillRequirements.salaryMin).toLocaleString()} - ${Number(selectedRequestDetails.skillRequirements.salaryMax).toLocaleString()} VND`
                          : 'Not specified'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border-warm p-4 col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Expected Start Date
                      </p>
                      <p className="mt-2 text-sm font-semibold text-deep-charcoal">
                        {selectedRequestDetails?.skillRequirements?.startDate
                          ? new Date(selectedRequestDetails.skillRequirements.startDate).toLocaleDateString()
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {selectedRequestDetails?.skillRequirements?.skills && selectedRequestDetails.skillRequirements.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant mb-2">
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequestDetails.skillRequirements.skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Job Description */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      Job Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-ink whitespace-pre-wrap border border-border-warm rounded-lg p-3 bg-workflow-ivory/40">
                      {selectedRequestDetails?.jobDescription || 'No description available.'}
                    </p>
                  </div>

                  {/* Business Justification */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      Business Justification
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-ink whitespace-pre-wrap border border-border-warm rounded-lg p-3 bg-workflow-ivory/40">
                      {selectedRequestDetails?.justification || 'No justification available.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-border-warm bg-workflow-ivory px-6 py-4 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-border-warm px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
                onClick={() => setIsViewModalOpen(false)}
                type="button"
              >
                Close
              </button>
              {(selectedRequest.status === 'Draft' || selectedRequest.status === 'Revision Required') && (
                <button
                  className="rounded-lg bg-teal-command hover:bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    navigate(`/dept-head/create-request?requestId=${selectedRequest.id}`);
                  }}
                  type="button"
                >
                  Edit Request
                </button>
              )}
              {selectedRequest.status === 'Draft' && (
                <button
                  className="rounded-lg bg-teal-command hover:bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                  onClick={() => {
                    void submitDraft(selectedRequest.id);
                    setIsViewModalOpen(false);
                  }}
                  type="button"
                >
                  Submit Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DeptHeadDashboardPage>
  );
};

const MetricCard = ({
  icon,
  label,
  note,
  noteClassName = 'text-on-surface-variant',
  value,
}: {
  icon: string;
  label: string;
  note?: string;
  noteClassName?: string;
  value: number;
}) => (
  <div className="rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
    <div className="mb-4 flex items-start justify-between">
      <div className="rounded-lg bg-surface-container p-2 text-teal-command">
        <Icon className="h-5 w-5" name={icon} />
      </div>
      {note && <span className={`text-[11px] font-bold ${noteClassName}`}>{note}</span>}
    </div>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
      {label}
    </p>
    <p className="mt-2 font-mono text-[32px] font-semibold leading-none text-deep-charcoal">
      {value}
    </p>
  </div>
);
