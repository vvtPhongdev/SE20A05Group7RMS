import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  AdminDashboardPage,
  AdminInlineAlert,
  AdminPageHeader,
  AdminSearchInput,
} from '../components';

type ApprovalStatus = 'Pending';
type Priority = 'High' | 'Medium' | 'Low';
type ReviewAction = 'APPROVED' | 'REJECTED';
type ApprovalQueueType = 'REQUEST' | 'PLAN';

interface ApprovalRequest {
  id: string;
  position: string;
  department: string;
  requestedBy: string;
  headcount: number;
  priority: Priority;
  status: ApprovalStatus;
  submitted: string;
  salaryRange: string;
  description: string;
  documents: string[];
  approvalType: 'REQUEST' | 'PLAN';
  planId?: string;
  urgency: string;
  jobDescription: string;
  justification: string;
  skillRequirements: Record<string, unknown>;
  rejectionReason?: string | null;
  requestStatus: string;
  skills: string[];
  bachelorRequirements: string[];
  planTasks?: Array<{
    id: string;
    taskType: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    assignedTo?: { id: string; displayName: string; email?: string; role?: string } | null;
  }>;
  planWindow?: string;
  planStatus?: string;
  planCreatedBy?: string;
  planUpdatedAt?: string;
  planRevisionNotes?: string | null;
}
const approvalQueueTabs: Array<{ key: ApprovalQueueType; label: string }> = [
  { key: 'REQUEST', label: 'Request Approval' },
  { key: 'PLAN', label: 'Campaign Plan Approval' },
];
const PENDING_PLAN_APPROVAL_STATUSES = new Set(['PENDING_APPROVAL']);
const PENDING_REQUEST_APPROVAL_STATUSES = new Set(['PENDING_BOSS_APPROVAL', 'PENDING_REVIEW']);

interface RecruitmentRequestApi {
  id: string;
  position: string;
  department: { id: string; name: string };
  requester: { displayName: string };
  status: string;
  urgency: string;
  headcount: number;
  jobDescription: string;
  skillRequirements?: Record<string, unknown> | null;
  justification: string;
  rejectionReason?: string | null;
  forwardedToAdmin?: boolean;
  createdAt: string;
  overallPlan?: {
    id: string;
    status: string;
    startDate?: string;
    endDate?: string;
    tasks?: Array<{
      id: string;
      taskType: string;
      status: string;
      startDate: string | null;
      endDate: string | null;
      assignedTo?: { id: string; displayName: string; email?: string; role?: string } | null;
    }>;
    createdBy?: { id: string; displayName: string } | null;
    updatedAt?: string;
    revisionNotes?: string | null;
  } | null;
}

interface DepartmentRequirementsApi {
  id: string;
  bachelorRequirements?: unknown;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  JOB_POSTING: 'Publish job posting',
  CV_COLLECTION: 'Collect candidate CVs',
  CV_SCREENING: 'Screen incoming CVs',
  INTERVIEW_COORDINATION: 'Coordinate interviews',
  HIRING: 'Complete hiring',
};

const formatSalary = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString('vi-VN')} VND` : null;
};

const salaryRangeFromRequirements = (requirements?: Record<string, unknown> | null) => {
  const minimum = formatSalary(requirements?.salaryMin);
  const maximum = formatSalary(requirements?.salaryMax);
  if (minimum && maximum) return `${minimum} - ${maximum}`;
  if (minimum) return `From ${minimum}`;
  if (maximum) return `Up to ${maximum}`;
  return 'Not provided';
};

export const AdminApprovalQueue: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [activeQueue, setActiveQueue] = useState<ApprovalQueueType>('REQUEST');
  const [department, setDepartment] = useState('All');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected request for detail drawer
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadRequests = async () => {
      setLoading(true);
      setApiError('');
      try {
        const [response, departments] = await Promise.all([
          apiRequest<{ data: RecruitmentRequestApi[] }>('/recruitment-requests?limit=100', token),
          apiRequest<DepartmentRequirementsApi[]>('/departments', token).catch(() => []),
        ]);
        if (cancelled) return;
        const bachelorRequirementsByDepartment = new Map(
          departments.map((department) => [
            department.id,
            Array.isArray(department.bachelorRequirements)
              ? department.bachelorRequirements.map(String)
              : [],
          ]),
        );
        setRequests(
          response.data
            .filter((request) => {
              const isPlanApproval = PENDING_PLAN_APPROVAL_STATUSES.has(
                request.overallPlan?.status ?? '',
              );
              const isForwardedRequest =
                request.status === 'PENDING_BOSS_APPROVAL' ||
                (PENDING_REQUEST_APPROVAL_STATUSES.has(request.status) &&
                  request.status === 'PENDING_REVIEW' &&
                  request.forwardedToAdmin === true);

              return isPlanApproval || isForwardedRequest;
            })
            .map((request) => {
              const requirements = request.skillRequirements ?? {};
              const planStatus = request.overallPlan?.status;
              const isPlanApproval = PENDING_PLAN_APPROVAL_STATUSES.has(planStatus ?? '');
              return {
                id: request.id,
                position: request.position,
                department: request.department.name,
                requestedBy: request.requester.displayName,
                headcount: request.headcount,
                priority:
                  request.urgency === 'HIGH' || request.urgency === 'CRITICAL'
                    ? 'High'
                    : request.urgency === 'MEDIUM'
                      ? 'Medium'
                      : 'Low',
                status: 'Pending',
                submitted: new Date(request.createdAt).toLocaleDateString(),
                salaryRange: salaryRangeFromRequirements(request.skillRequirements),
                description: request.jobDescription || request.justification,
                documents: [],
                approvalType: isPlanApproval ? 'PLAN' : 'REQUEST',
                planId: request.overallPlan?.id,
                urgency: request.urgency,
                jobDescription: request.jobDescription,
                justification: request.justification,
                skillRequirements: requirements,
                rejectionReason: request.rejectionReason,
                requestStatus: request.status,
                skills: Array.isArray(requirements.skills) ? requirements.skills.map(String) : [],
                bachelorRequirements:
                  bachelorRequirementsByDepartment.get(request.department.id) ?? [],
                planTasks: request.overallPlan?.tasks ?? [],
                planWindow:
                  request.overallPlan?.startDate && request.overallPlan?.endDate
                    ? `${new Date(request.overallPlan.startDate).toLocaleDateString()} - ${new Date(
                        request.overallPlan.endDate,
                      ).toLocaleDateString()}`
                    : undefined,
                planStatus,
                planCreatedBy: request.overallPlan?.createdBy?.displayName,
                planUpdatedAt: request.overallPlan?.updatedAt,
                planRevisionNotes: request.overallPlan?.revisionNotes,
              };
            }),
        );
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : 'Unable to load requests');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadRequests();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Reset page when the selected approval queue, query, or department changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeQueue, query, department]);

  const departments = useMemo(() => {
    return ['All', ...Array.from(new Set(requests.map((r) => r.department)))];
  }, [requests]);

  const typeCounts = useMemo(
    () => ({
      REQUEST: requests.filter((request) => request.approvalType === 'REQUEST').length,
      PLAN: requests.filter((request) => request.approvalType === 'PLAN').length,
    }),
    [requests],
  );

  const notificationItems = useMemo(
    () => requests.filter((request) => request.status === 'Pending').slice(0, 6),
    [requests],
  );

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationOpen]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesApprovalType = request.approvalType === activeQueue;
      const matchesDepartment = department === 'All' || request.department === department;
      const matchesQuery =
        !normalizedQuery ||
        request.id.toLowerCase().includes(normalizedQuery) ||
        request.position.toLowerCase().includes(normalizedQuery) ||
        request.department.toLowerCase().includes(normalizedQuery) ||
        request.requestedBy.toLowerCase().includes(normalizedQuery);

      return matchesApprovalType && matchesDepartment && matchesQuery;
    });
  }, [activeQueue, department, query, requests]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const handleOpenDrawer = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setIsDrawerOpen(true);
  };

  const handleOpenNotificationItem = (request: ApprovalRequest) => {
    setIsNotificationOpen(false);
    handleOpenDrawer(request);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const openReviewModal = (action: ReviewAction) => {
    if (!selectedRequest) return;
    setReviewAction(action);
    setReviewNotes('');
  };

  const closeReviewModal = () => {
    if (submittingId) return;
    setReviewAction(null);
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!selectedRequest || !reviewAction) return;
    if (reviewAction !== 'APPROVED' && !reviewNotes.trim()) {
      setApiError('Please enter feedback before submitting this review.');
      return;
    }

    const id = selectedRequest.id;
    setSubmittingId(id);
    setApiError('');
    try {
      if (selectedRequest.approvalType === 'PLAN' && selectedRequest.planId) {
        await apiRequest(
          `/overall-plan/${selectedRequest.planId}/${
            reviewAction === 'APPROVED' ? 'approve' : 'reject'
          }`,
          token,
          {
            method: 'PATCH',
            body: JSON.stringify(
              reviewAction === 'REJECTED' ? { revisionNotes: reviewNotes.trim() } : {},
            ),
          },
        );
      } else {
        await apiRequest(`/recruitment-requests/${id}/decision`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            decision: reviewAction,
            comments: reviewNotes.trim() || undefined,
          }),
        });
      }

      // A completed review leaves this pending-only queue. Processed requests and
      // plans remain available in their respective management screens.
      setRequests((prev) => prev.filter((request) => request.id !== id));
      setSelectedRequest(null);
      setReviewAction(null);
      setIsDrawerOpen(false);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save the decision');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <AdminDashboardPage className="bg-workflow-ivory p-4 text-on-surface antialiased md:p-6">
      <AdminPageHeader
        eyebrow="Director Portal"
        title="Admin Approval Queue"
        actions={
          <>
            <AdminSearchInput
              className="w-full sm:w-64"
              label="Search requests"
              onChange={setQuery}
              placeholder="Search requests..."
              value={query}
            />
            <div className="relative" ref={notificationRef}>
              <button
                aria-expanded={isNotificationOpen}
                aria-haspopup="dialog"
                aria-label="Open admin notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-teal-command/30"
                onClick={() => setIsNotificationOpen((current) => !current)}
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
                {notificationItems.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-rejected"></span>
                )}
              </button>

              {isNotificationOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-xl"
                  role="dialog"
                  aria-label="Admin notifications"
                >
                  <div className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-deep-charcoal">Notifications</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {notificationItems.length > 0
                          ? `${notificationItems.length} approval updates need attention`
                          : 'No approvals need attention'}
                      </p>
                    </div>
                    <span className="rounded-full bg-teal-command/10 px-2.5 py-1 text-xs font-bold text-teal-command">
                      {notificationItems.length}
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto py-2">
                    {notificationItems.length > 0 ? (
                      notificationItems.map((request) => (
                        <button
                          className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                          key={request.id}
                          onClick={() => handleOpenNotificationItem(request)}
                          type="button"
                        >
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-pending"></span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-deep-charcoal">
                                {request.position}
                              </span>
                              <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-bold uppercase text-slate-ink">
                                {request.approvalType === 'PLAN' ? 'Plan' : 'Request'}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-on-surface-variant">
                              {request.department} / {request.requestedBy}
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-teal-command">
                              Waiting for admin review
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                          notifications_off
                        </span>
                        <p className="mt-2 text-sm font-semibold text-deep-charcoal">
                          All caught up
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          New request or plan approvals will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        }
      />
      {apiError && <AdminInlineAlert>{apiError}</AdminInlineAlert>}

      {/* Table Container */}
      <div className="bg-clean-surface rounded-lg border border-border-warm overflow-hidden shadow-sm flex flex-col">
        {/* Table Action Bar */}
        <div className="px-6 py-4 border-b border-border-warm flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center bg-workflow-ivory/50">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              Select approval queue
            </p>
            <div className="flex flex-wrap gap-1">
              {approvalQueueTabs.map((item) => (
                <button
                  key={item.key}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition active:scale-[0.98] ${
                    activeQueue === item.key
                      ? item.key === 'PLAN'
                        ? 'bg-deep-charcoal text-white shadow-sm'
                        : 'bg-teal-command text-white shadow-sm'
                      : 'text-slate-ink hover:bg-surface-container-high'
                  }`}
                  type="button"
                  onClick={() => setActiveQueue(item.key)}
                >
                  {item.key === 'PLAN' ? (
                    <span className="material-symbols-outlined text-[18px]">assignment</span>
                  ) : item.key === 'REQUEST' ? (
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">view_list</span>
                  )}
                  {item.label}
                  <span
                    className={`text-xs py-0.5 px-1.5 rounded-full ${
                      activeQueue === item.key
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-container-highest text-slate-ink'
                    }`}
                  >
                    {typeCounts[item.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 self-end sm:self-auto">
            {/* Department Dropdown */}
            <select
              className="bg-white border border-border-warm rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-teal-command"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments
                .filter((d) => d !== 'All')
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>

            <button className="px-4 py-2 bg-white border border-border-warm rounded-lg text-on-surface-variant font-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">download</span> Export
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border-b border-border-warm">
                {/* <th className="px-6 py-4 font-semibold uppercase tracking-wider">
                  {activeQueue === 'PLAN' ? 'Campaign Request ID' : 'Request ID'}
                </th> */}
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-body-sm text-body-sm">
              {paginatedRequests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:shadow-[inset_4px_0_0_0_#0D9488] hover:bg-surface-container-low/40 transition-all cursor-pointer group"
                  onClick={() => handleOpenDrawer(request)}
                >
                  {/* <td className="px-6 py-4 font-data-mono text-data-mono text-teal-command font-semibold">
                    #{request.id}
                  </td> */}
                  <td className="px-6 py-4">{request.department}</td>
                  <td className="px-6 py-4 font-medium text-deep-charcoal">{request.position}</td>
                  <td className="px-6 py-4 font-semibold">
                    {String(request.headcount).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 w-fit ${
                        request.priority === 'High'
                          ? 'bg-error-container text-rejected'
                          : 'bg-tertiary-container/10 text-tertiary'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          request.priority === 'High' ? 'bg-rejected' : 'bg-tertiary'
                        }`}
                      ></span>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{request.submitted}</td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="px-4 py-1.5 border border-teal-command text-teal-command rounded-lg font-label-md hover:bg-teal-command hover:text-white transition-all font-semibold"
                      onClick={() => handleOpenDrawer(request)}
                      type="button"
                    >
                      Review {activeQueue === 'PLAN' ? 'Plan' : 'Request'}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-slate-ink">
                      search_off
                    </span>
                    {loading
                      ? 'Loading recruitment requests...'
                      : `No ${activeQueue === 'PLAN' ? 'campaign plans' : 'requests'} are waiting for approval.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-surface-container-low border-t border-border-warm flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Showing {filteredRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{' '}
            {filteredRequests.length} requests
          </p>
          <div className="flex gap-1 justify-center">
            <button
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`w-10 h-10 rounded-lg font-label-md font-semibold transition ${
                  currentPage === idx + 1
                    ? 'bg-teal-command text-white shadow-sm'
                    : 'hover:bg-surface-container-high text-on-surface-variant'
                }`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* NavigationDrawer (Right Detail View) */}
      <div
        className={`fixed right-0 top-0 h-screen w-[90vw] sm:w-1/2 lg:w-1/3 bg-clean-surface border-l border-border-warm shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        id="detailDrawer"
      >
        <div className="p-6 border-b border-border-warm flex justify-between items-center bg-workflow-ivory/50">
          <h3 className="font-headline-md text-headline-md font-semibold text-deep-charcoal">
            {selectedRequest?.approvalType === 'PLAN'
              ? 'Plan Approval Details'
              : 'Request Approval Details'}
          </h3>
          <button
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center"
            onClick={handleCloseDrawer}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {selectedRequest && (
          <>
            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div
                className={`rounded-lg border p-4 ${
                  selectedRequest.approvalType === 'PLAN'
                    ? 'border-deep-charcoal/15 bg-deep-charcoal/5 text-deep-charcoal'
                    : 'border-teal-command/20 bg-teal-command/5 text-teal-command'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[22px]">
                    {selectedRequest.approvalType === 'PLAN' ? 'assignment' : 'fact_check'}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em]">
                      {selectedRequest.approvalType === 'PLAN'
                        ? 'Plan Approval'
                        : 'Request Approval'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                      {selectedRequest.approvalType === 'PLAN'
                        ? 'Review HR overall recruitment plan before execution begins.'
                        : 'Review the department hiring request after HR has validated and forwarded it.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Department Block */}
              <div className="flex items-center gap-4 p-4 bg-workflow-ivory rounded-lg border border-border-warm shadow-sm">
                <div className="p-3 bg-teal-command/10 text-teal-command rounded-lg">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                    Requesting Department
                  </p>
                  <p className="font-headline-md text-headline-md font-semibold text-deep-charcoal">
                    {selectedRequest.department}
                  </p>
                </div>
              </div>

              {/* Position Title */}
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Position Title
                </label>
                <p className="font-body-md text-body-md font-semibold text-deep-charcoal">
                  {selectedRequest.position}
                </p>
              </div>

              {/* Quantity and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                    Quantity
                  </label>
                  <p className="font-body-md text-body-md text-deep-charcoal font-semibold">
                    {String(selectedRequest.headcount).padStart(2, '0')} Persons
                  </p>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                    Priority
                  </label>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg font-label-sm text-label-sm inline-flex items-center gap-1.5 ${
                      selectedRequest.priority === 'High'
                        ? 'bg-error-container text-rejected'
                        : 'bg-tertiary-container/10 text-tertiary'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedRequest.priority === 'High' ? 'bg-rejected' : 'bg-tertiary'
                      }`}
                    ></span>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-warm bg-workflow-ivory/50 p-4">
                {[
                  ['Requested By', selectedRequest.requestedBy],
                  ['Submitted On', selectedRequest.submitted],
                  ['Request Status', selectedRequest.requestStatus.replace(/_/g, ' ')],
                  ['Approval Queue', selectedRequest.approvalType === 'PLAN' ? 'Campaign Plan' : 'Request'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
                  </div>
                ))}
              </div>

              {/* Salary Range */}
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Expected Salary Range
                </label>
                <p className="font-data-mono text-data-mono font-semibold text-teal-command">
                  {selectedRequest.salaryRange}
                </p>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Required Skills
                </label>
                {selectedRequest.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.skills.map((skill) => (
                      <span
                        className="rounded-full border border-teal-command/20 bg-teal-command/5 px-3 py-1 text-xs font-semibold text-teal-command"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-on-surface-variant">No skills specified.</p>
                )}
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Bachelor Requirements
                </label>
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
                  <p className="text-sm italic text-on-surface-variant">No bachelor requirements specified.</p>
                )}
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Job Description
                </label>
                <p className="whitespace-pre-wrap font-body-sm text-body-sm leading-relaxed text-slate-ink">
                  {selectedRequest.jobDescription || 'No job description provided.'}
                </p>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Additional Notes
                </label>
                <p className="whitespace-pre-wrap font-body-sm text-body-sm leading-relaxed text-slate-ink">
                  {selectedRequest.justification || 'No additional notes provided.'}
                </p>
              </div>

              {selectedRequest.rejectionReason ? (
                <div className="rounded-lg border border-revision/20 bg-revision/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-revision">
                    Existing Revision Feedback
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-ink">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              ) : null}

              {selectedRequest.approvalType === 'PLAN' ? (
                <div className="rounded-lg border border-border-warm bg-workflow-ivory p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-label-sm text-label-sm font-semibold uppercase text-on-surface-variant">
                        Campaign Task Plan
                      </p>
                      <p className="mt-1 text-xs text-slate-ink">
                        {selectedRequest.planWindow ?? 'Plan window not available'}
                      </p>
                    </div>
                    <span className="rounded-full border border-border-warm bg-clean-surface px-2.5 py-1 text-xs font-bold text-deep-charcoal">
                      {selectedRequest.planTasks?.length ?? 0} tasks
                    </span>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-3 rounded border border-border-warm bg-clean-surface p-3">
                    {[
                      ['Plan Status', selectedRequest.planStatus?.replace(/_/g, ' ') ?? 'Pending approval'],
                      ['Prepared By', selectedRequest.planCreatedBy ?? 'Not available'],
                      ['Plan Window', selectedRequest.planWindow ?? 'Not available'],
                      [
                        'Last Updated',
                        selectedRequest.planUpdatedAt
                          ? new Date(selectedRequest.planUpdatedAt).toLocaleString()
                          : 'Not available',
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[11px] font-semibold uppercase text-on-surface-variant">
                          {label}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-deep-charcoal">{value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedRequest.planRevisionNotes ? (
                    <div className="mb-4 rounded border border-revision/20 bg-revision/5 p-3">
                      <p className="text-[11px] font-semibold uppercase text-revision">Previous revision notes</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-ink">
                        {selectedRequest.planRevisionNotes}
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    {(selectedRequest.planTasks ?? []).map((task) => (
                      <div
                        className="rounded border border-border-warm bg-clean-surface p-3 text-sm"
                        key={task.id}
                      >
                        <div className="min-w-0">
                          <p className="break-words font-semibold leading-5 text-deep-charcoal">
                            {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            {task.assignedTo?.displayName ?? 'HR member will be assigned after approval'}
                          </p>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border-warm pt-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase text-on-surface-variant">
                              Start
                            </p>
                            <p className="font-mono text-xs text-slate-ink">
                              {task.startDate
                                ? new Date(task.startDate).toLocaleDateString()
                                : 'Not scheduled'}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase text-on-surface-variant">
                              Due Date
                            </p>
                            <p className="font-mono text-xs font-semibold text-teal-command">
                              {task.endDate
                                ? new Date(task.endDate).toLocaleDateString()
                                : 'Not scheduled'}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase text-on-surface-variant">
                              Task Status
                            </p>
                            <p className="mt-1 inline-flex rounded-full border border-border-warm bg-workflow-ivory px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">
                              {task.status.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedRequest.planTasks?.length === 0 ? (
                      <p className="rounded border border-border-warm bg-clean-surface p-3 text-sm text-on-surface-variant">
                        No tasks were submitted with this plan.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Attachments */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div className="p-4 bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                  <p className="font-label-md text-label-md mb-3 flex items-center gap-2 font-semibold text-deep-charcoal">
                    <span className="material-symbols-outlined text-[18px]">attachment</span>{' '}
                    Attached Documents
                  </p>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-body-sm py-2 px-3 bg-white rounded border border-border-warm shadow-sm"
                      >
                        <span className="truncate text-slate-ink font-medium">{doc}</span>
                        <span className="material-symbols-outlined text-teal-command cursor-pointer hover:text-primary transition-colors">
                          download
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Review */}
            <div className="p-6 border-t border-border-warm bg-workflow-ivory flex flex-col gap-3">
              {selectedRequest.status === 'Pending' ? (
                <>
                  <button
                    className="w-full bg-teal-command hover:bg-primary text-white py-3 rounded-lg font-label-md font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                    type="button"
                    disabled={submittingId === selectedRequest.id}
                    onClick={() => openReviewModal('APPROVED')}
                  >
                    <span className="material-symbols-outlined">check</span>
                    Approve {selectedRequest.approvalType === 'PLAN' ? 'Plan' : 'Request'}
                  </button>
                  <button
                    className="w-full border border-rejected hover:bg-error-container text-rejected py-3 rounded-lg font-label-md font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    type="button"
                    disabled={submittingId === selectedRequest.id}
                    onClick={() => openReviewModal('REJECTED')}
                  >
                    <span className="material-symbols-outlined">close</span>
                    Reject {selectedRequest.approvalType === 'PLAN' ? 'Plan' : 'Request'}
                  </button>
                </>
              ) : (
                <div className="text-center py-2 text-on-surface-variant font-medium text-sm">
                  This request has been{' '}
                  <span className="font-bold uppercase">{selectedRequest.status}</span> and cannot
                  be modified.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Backdrop for Drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-deep-charcoal/40 backdrop-blur-sm z-40 transition-opacity duration-300 opacity-100"
          id="drawerOverlay"
          onClick={handleCloseDrawer}
        ></div>
      )}

      {selectedRequest && reviewAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-deep-charcoal/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-warm bg-clean-surface shadow-2xl">
            <div className="flex items-start justify-between border-b border-border-warm px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-command">
                  {selectedRequest.approvalType === 'PLAN' ? 'Plan Review' : 'Request Review'}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-deep-charcoal">
                  {reviewAction === 'APPROVED' ? 'Approve' : 'Reject'}
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">{selectedRequest.position}</p>
              </div>
              <button
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
                onClick={closeReviewModal}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  selectedRequest.approvalType === 'PLAN'
                    ? 'border-deep-charcoal/15 bg-deep-charcoal/5 text-deep-charcoal'
                    : 'border-teal-command/20 bg-teal-command/5 text-teal-command'
                }`}
              >
                <span className="font-bold">
                  {selectedRequest.approvalType === 'PLAN'
                    ? 'This decision applies to the HR overall plan.'
                    : 'This decision applies to the recruitment request.'}
                </span>
              </div>

              <label>
                <span className="mb-1.5 block text-sm font-semibold text-deep-charcoal">
                  {reviewAction === 'APPROVED'
                    ? 'Approval Notes (optional)'
                    : 'Rejection Reason'}
                </span>
                <textarea
                  className="min-h-28 w-full resize-y rounded-lg border border-border-warm bg-workflow-ivory px-3 py-2.5 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  placeholder="Add review notes..."
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border-warm bg-workflow-ivory px-6 py-4 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-border-warm px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
                onClick={closeReviewModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                  reviewAction === 'APPROVED'
                    ? 'bg-teal-command hover:bg-primary'
                    : 'bg-rejected hover:bg-rejected/90'
                }`}
                disabled={
                  submittingId === selectedRequest.id ||
                  (reviewAction !== 'APPROVED' && !reviewNotes.trim())
                }
                onClick={() => void submitReview()}
                type="button"
              >
                {submittingId === selectedRequest.id
                  ? 'Submitting...'
                  : reviewAction === 'APPROVED'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardPage>
  );
};
