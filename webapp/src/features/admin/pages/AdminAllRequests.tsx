import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isHrRole } from '@wr/contracts';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  AdminActionButton,
  AdminDashboardPage,
  AdminInlineAlert,
  AdminLoadingState,
  AdminPageHeader,
  AdminSearchInput,
} from '../components';

type RequestStatus =
  | 'Draft'
  | 'Pending Review'
  | 'Approved'
  | 'Revision Needed'
  | 'Planning'
  | 'Screening'
  | 'Interviewing'
  | 'Closed'
  | 'Rejected'
  | 'Pending'
  | 'Active'
  | 'Completed';

type Urgency = 'Critical' | 'High' | 'Medium' | 'Low';

interface RecruitmentRequest {
  id: string;
  position: string;
  department: string;
  requester: string;
  owner: string;
  status: RequestStatus;
  urgency: Urgency;
  submittedDate: string;
  targetDate: string;
  headcount: number;
  budget: string;
  location: string;
  skills: string[];
  notes: string;
  lastActivity: string;
  assignColor: string;
  initials: string;
}

type SortField =
  | 'id'
  | 'position'
  | 'department'
  | 'submittedDate'
  | 'headcount'
  | 'status'
  | 'urgency';
type SortDirection = 'asc' | 'desc' | 'none';

const PRIORITY_RANK: Record<Urgency, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const AdminAllRequests: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [requestsList, setRequestsList] = useState<RecruitmentRequest[]>([]);
  const [hrManagers, setHrManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'All'>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected row checkboxes state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('submittedDate');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const mapStatus = (status: string): RequestStatus => {
    const statuses: Record<string, RequestStatus> = {
      DRAFT: 'Draft',
      PENDING_HR_REVIEW: 'Pending Review',
      PENDING_BOSS_APPROVAL: 'Pending',
      PENDING_REVIEW: 'Pending',
      APPROVED: 'Approved',
      REVISION_NEEDED: 'Revision Needed',
      PLANNING: 'Planning',
      PLAN_PENDING_APPROVAL: 'Planning',
      PLAN_APPROVED: 'Active',
      ACTIVE: 'Active',
      SOURCING: 'Active',
      SCREENING: 'Screening',
      INTERVIEWING: 'Interviewing',
      INTERVIEW_COMPLETED: 'Interviewing',
      DECISION_PENDING: 'Interviewing',
      OFFER_EXTENDED: 'Active',
      OFFER_DECLINED: 'Active',
      OFFER_ACCEPTED: 'Completed',
      HIRED: 'Completed',
      NOT_HIRED: 'Active',
      COMPLETED: 'Completed',
      CLOSED: 'Completed',
      CANCELLED: 'Rejected',
      REJECTED: 'Rejected',
    };
    return statuses[status] ?? 'Draft';
  };

  const mapUrgency = (urgency: string): Urgency => {
    const normalized = urgency.toLowerCase();
    if (normalized === 'critical') return 'Critical';
    if (normalized === 'high') return 'High';
    if (normalized === 'low') return 'Low';
    return 'Medium';
  };

  const loadRequests = async () => {
    const response = await apiRequest<{
      data: Array<{
        id: string;
        position: string;
        department: { name: string; code: string };
        requester: { displayName: string };
        owner?: { displayName: string } | null;
        status: string;
        urgency: string;
        headcount: number;
        skillRequirements?: Record<string, unknown> | string[];
        justification: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/recruitment-requests?limit=100', token);

    setRequestsList(
      response.data.map((request) => {
        const owner = request.owner?.displayName ?? 'Not Assigned';
        const skills = Array.isArray(request.skillRequirements)
          ? request.skillRequirements.map(String)
          : Object.keys(request.skillRequirements ?? {});

        return {
          id: request.id,
          position: request.position,
          department: request.department.name,
          requester: request.requester.displayName,
          owner,
          status: mapStatus(request.status),
          urgency: mapUrgency(request.urgency),
          submittedDate: request.createdAt,
          targetDate: '',
          headcount: request.headcount,
          budget: '-',
          location: '-',
          skills,
          notes: request.justification,
          lastActivity: `Updated ${new Date(request.updatedAt).toLocaleString()}`,
          assignColor: request.owner ? 'bg-primary-fixed-dim' : 'bg-surface-container-highest',
          initials:
            owner === 'Not Assigned'
              ? 'NA'
              : owner
                  .split(' ')
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase(),
        };
      }),
    );
  };

  const openRequestDetail = async (id: string) => {
    setDetailLoading(true);
    setApiError('');
    try {
      setDetailRequest(await apiRequest(`/recruitment-requests/${id}`, token));
    } catch (detailError) {
      setApiError(detailError instanceof Error ? detailError.message : 'Unable to load request detail');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setApiError('');
      try {
        const managers = await apiRequest<{
          data: Array<{ id: string; displayName: string; role?: string }>;
        }>('/users?limit=100', token);
        setHrManagers(
          managers.data
            .filter((manager) => isHrRole(manager.role))
            .map((manager) => ({ id: manager.id, name: manager.displayName })),
        );
        await loadRequests();
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load requests');
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [token]);

  // Reset page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [statusFilter, deptFilter, priorityFilter, query]);

  const counts = useMemo(() => {
    return {
      All: requestsList.length,
      Pending: requestsList.filter((r) => r.status === 'Pending').length,
      Approved: requestsList.filter((r) => r.status === 'Approved').length,
      Active: requestsList.filter((r) =>
        ['Active', 'Planning', 'Screening', 'Interviewing'].includes(r.status),
      ).length,
      Completed: requestsList.filter((r) => r.status === 'Completed').length,
      Rejected: requestsList.filter((r) => r.status === 'Rejected').length,
    };
  }, [requestsList]);

  const departments = useMemo(() => {
    return ['All', ...Array.from(new Set(requestsList.map((r) => r.department)))];
  }, [requestsList]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = requestsList.filter((request) => {
      const matchesStatus =
        statusFilter === 'All' ||
        request.status === statusFilter ||
        (statusFilter === 'Active' &&
          ['Planning', 'Screening', 'Interviewing'].includes(request.status));
      const matchesDept = deptFilter === 'All' || request.department === deptFilter;
      const matchesPriority = priorityFilter === 'All' || request.urgency === priorityFilter;
      const matchesQuery =
        !normalizedQuery ||
        request.id.toLowerCase().includes(normalizedQuery) ||
        request.position.toLowerCase().includes(normalizedQuery) ||
        request.requester.toLowerCase().includes(normalizedQuery) ||
        request.owner.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesDept && matchesPriority && matchesQuery;
    });

    // Apply sorting
    if (sortDir === 'none' || !sortField) return result;

    return [...result].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'submittedDate') {
        aVal = new Date(a.submittedDate).getTime();
        bVal = new Date(b.submittedDate).getTime();
      } else if (sortField === 'urgency') {
        aVal = PRIORITY_RANK[a.urgency];
        bVal = PRIORITY_RANK[b.urgency];
      }

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [requestsList, statusFilter, deptFilter, priorityFilter, query, sortField, sortDir]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // Handle master checkbox change
  const handleMasterCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageIds = paginatedRequests.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    } else {
      const currentPageIds = paginatedRequests.map((r) => r.id);
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const isAllCurrentPageSelected = useMemo(() => {
    if (paginatedRequests.length === 0) return false;
    return paginatedRequests.every((r) => selectedIds.includes(r.id));
  }, [paginatedRequests, selectedIds]);

  const handleRowCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'urgency' ? 'desc' : 'asc');
    }
  };

  const downloadCsv = (requests: RecruitmentRequest[], fileName: string) => {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      [
        'ID',
        'Position',
        'Department',
        'Requester',
        'Assigned HR',
        'Status',
        'Priority',
        'Headcount',
      ],
      ...requests.map((request) => [
        request.id,
        request.position,
        request.department,
        request.requester,
        request.owner,
        request.status,
        request.urgency,
        request.headcount,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(escape).join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSelected = () => {
    downloadCsv(
      requestsList.filter((request) => selectedIds.includes(request.id)),
      'recruitment-requests-selected.csv',
    );
    clearSelection();
  };

  const handleAssignToHR = async () => {
    const available = hrManagers.map((manager) => manager.name).join(', ');
    const name = prompt(`Enter an HR manager name (${available}):`);
    const manager = hrManagers.find(
      (item) => item.name.toLowerCase() === name?.trim().toLowerCase(),
    );
    if (!manager) {
      if (name) setApiError('Please enter the exact name of an active HR manager.');
      return;
    }

    setApiError('');
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiRequest(`/recruitment-requests/${id}/assign`, token, {
            method: 'PATCH',
            body: JSON.stringify({ hrManagerId: manager.id }),
          }),
        ),
      );
      await loadRequests();
      clearSelection();
    } catch (assignError) {
      setApiError(assignError instanceof Error ? assignError.message : 'Unable to assign requests');
    }
  };

  const formatDisplayDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const getPriorityStyles = (p: Urgency) => {
    switch (p) {
      case 'Critical':
        return 'bg-red-100 text-deep-charcoal border-red-200';
      case 'High':
        return 'bg-red-50 text-rejected border-red-100';
      case 'Medium':
        return 'bg-amber-50 text-revision border-amber-100';
      case 'Low':
        return 'bg-slate-100 text-slate-ink border-slate-200';
      default:
        return 'bg-slate-100 text-slate-ink border-slate-200';
    }
  };

  const getStatusStyles = (s: RequestStatus) => {
    switch (s) {
      case 'Pending':
      case 'Pending Review':
        return 'bg-cyan-50 text-pending border-cyan-100';
      case 'Approved':
        return 'bg-green-50 text-approved border-green-100';
      case 'Active':
      case 'Planning':
      case 'Screening':
      case 'Interviewing':
        return 'bg-teal-50 text-teal-command border-teal-100';
      case 'Completed':
      case 'Closed':
        return 'bg-slate-100 text-slate-ink border-slate-200';
      case 'Rejected':
        return 'bg-red-50 text-rejected border-red-100';
      default:
        return 'bg-slate-100 text-slate-ink border-slate-200';
    }
  };

  const getStatusDotColor = (s: RequestStatus) => {
    switch (s) {
      case 'Pending':
      case 'Pending Review':
        return 'bg-pending';
      case 'Approved':
        return 'bg-approved';
      case 'Active':
      case 'Planning':
      case 'Screening':
      case 'Interviewing':
        return 'bg-teal-command';
      case 'Completed':
      case 'Closed':
        return 'bg-slate-ink';
      case 'Rejected':
        return 'bg-rejected';
      default:
        return 'bg-slate-ink';
    }
  };

  return (
    <AdminDashboardPage className="bg-workflow-ivory p-4 text-on-surface antialiased md:p-6">
      <AdminPageHeader
        eyebrow="Director Portal"
        title="Admin - All Requests View"
        actions={
          <>
            <AdminSearchInput
              className="w-full sm:w-64"
              label="Search requests"
              onChange={setQuery}
              placeholder="Search requests..."
              value={query}
            />
            <AdminActionButton
              onClick={() => downloadCsv(filteredRequests, 'recruitment-requests.csv')}
              variant="secondary"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </AdminActionButton>
          </>
        }
      />

      {apiError ? <AdminInlineAlert>{apiError}</AdminInlineAlert> : null}
      {loading ? <AdminLoadingState label="Loading requests..." /> : null}

      {/* Filter Bar Section */}
      <div className="space-y-4 mb-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-border-warm overflow-x-auto no-scrollbar py-1">
          {(['All', 'Pending', 'Approved', 'Active', 'Completed', 'Rejected'] as const).map(
            (tab) => (
              <button
                key={tab}
                className={`px-4 py-2.5 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
                  statusFilter === tab
                    ? 'border-teal-command text-teal-command font-bold'
                    : 'border-transparent text-on-surface-variant hover:text-teal-command'
                }`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab === 'All' ? 'All' : tab}
                <span className="ml-1 opacity-60">({counts[tab]})</span>
              </button>
            ),
          )}
        </div>

        {/* Contextual Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-slate-ink uppercase tracking-wider ml-1">
              Department
            </label>
            <select
              className="bg-clean-surface border border-border-warm rounded-lg px-3 py-2 text-body-sm focus:ring-2 focus:ring-teal-command min-w-[180px] outline-none text-sm font-medium"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
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
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-slate-ink uppercase tracking-wider ml-1">
              Priority
            </label>
            <select
              className="bg-clean-surface border border-border-warm rounded-lg px-3 py-2 text-body-sm focus:ring-2 focus:ring-teal-command min-w-[140px] outline-none text-sm font-medium"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-slate-ink uppercase tracking-wider ml-1">
              Date Range
            </label>
            <div className="relative">
              <input
                className="bg-clean-surface border border-border-warm rounded-lg pl-10 pr-4 py-2 text-body-sm focus:ring-2 focus:ring-teal-command w-64 text-sm font-medium"
                readOnly
                type="text"
                value="All available dates"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">
                calendar_today
              </span>
            </div>
          </div>

          <button
            className="mt-5 flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors font-semibold text-sm"
            onClick={() => {
              setStatusFilter('All');
              setDeptFilter('All');
              setPriorityFilter('All');
              setQuery('');
            }}
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span> Reset Filters
          </button>

          <button
            className="mt-5 ml-auto bg-teal-command text-white px-6 py-2 rounded-lg font-bold hover:brightness-95 transition-all flex items-center gap-2 shadow-sm active:scale-95 text-sm"
            onClick={() => navigate('/dept-head/create-request')}
          >
            <span className="material-symbols-outlined">add</span> New Request
          </button>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-clean-surface rounded-lg border border-border-warm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-workflow-ivory border-b border-border-warm text-on-surface-variant">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-border-warm text-teal-command focus:ring-teal-command cursor-pointer w-4 h-4"
                    checked={isAllCurrentPageSelected}
                    onChange={handleMasterCheckboxChange}
                  />
                </th>
                <th
                  className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider cursor-pointer hover:text-teal-command transition-colors text-xs font-semibold"
                  onClick={() => handleHeaderClick('id')}
                >
                  ID{' '}
                  <span className="material-symbols-outlined text-[14px]">
                    {sortField === 'id'
                      ? sortDir === 'asc'
                        ? 'arrow_upward'
                        : sortDir === 'desc'
                          ? 'arrow_downward'
                          : 'unfold_more'
                      : 'unfold_more'}
                  </span>
                </th>
                <th
                  className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider cursor-pointer hover:text-teal-command transition-colors text-xs font-semibold"
                  onClick={() => handleHeaderClick('position')}
                >
                  Position{' '}
                  <span className="material-symbols-outlined text-[14px]">
                    {sortField === 'position'
                      ? sortDir === 'asc'
                        ? 'arrow_upward'
                        : sortDir === 'desc'
                          ? 'arrow_downward'
                          : 'unfold_more'
                      : 'unfold_more'}
                  </span>
                </th>
                <th
                  className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider cursor-pointer hover:text-teal-command transition-colors text-xs font-semibold"
                  onClick={() => handleHeaderClick('department')}
                >
                  Department{' '}
                  <span className="material-symbols-outlined text-[14px]">
                    {sortField === 'department'
                      ? sortDir === 'asc'
                        ? 'arrow_upward'
                        : sortDir === 'desc'
                          ? 'arrow_downward'
                          : 'unfold_more'
                      : 'unfold_more'}
                  </span>
                </th>
                <th
                  className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider text-center cursor-pointer hover:text-teal-command transition-colors text-xs font-semibold"
                  onClick={() => handleHeaderClick('headcount')}
                >
                  Qty{' '}
                  <span className="material-symbols-outlined text-[14px]">
                    {sortField === 'headcount'
                      ? sortDir === 'asc'
                        ? 'arrow_upward'
                        : sortDir === 'desc'
                          ? 'arrow_downward'
                          : 'unfold_more'
                      : 'unfold_more'}
                  </span>
                </th>
                <th
                  className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider cursor-pointer hover:text-teal-command transition-colors text-xs font-semibold"
                  onClick={() => handleHeaderClick('urgency')}
                >
                  Priority{' '}
                  <span className="material-symbols-outlined text-[14px]">
                    {sortField === 'urgency'
                      ? sortDir === 'asc'
                        ? 'arrow_upward'
                        : sortDir === 'desc'
                          ? 'arrow_downward'
                          : 'unfold_more'
                      : 'unfold_more'}
                  </span>
                </th>
                <th
                  className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider cursor-pointer hover:text-teal-command transition-colors text-xs font-semibold"
                  onClick={() => handleHeaderClick('status')}
                >
                  Status{' '}
                  <span className="material-symbols-outlined text-[14px]">
                    {sortField === 'status'
                      ? sortDir === 'asc'
                        ? 'arrow_upward'
                        : sortDir === 'desc'
                          ? 'arrow_downward'
                          : 'unfold_more'
                      : 'unfold_more'}
                  </span>
                </th>
                <th
                  className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider cursor-pointer hover:text-teal-command transition-colors text-xs font-semibold"
                  onClick={() => handleHeaderClick('submittedDate')}
                >
                  Created{' '}
                  <span className="material-symbols-outlined text-[14px]">
                    {sortField === 'submittedDate'
                      ? sortDir === 'asc'
                        ? 'arrow_upward'
                        : sortDir === 'desc'
                          ? 'arrow_downward'
                          : 'unfold_more'
                      : 'unfold_more'}
                  </span>
                </th>
                <th className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider text-xs font-semibold">
                  Assigned
                </th>
                <th className="px-4 py-4 font-label-sm text-slate-ink uppercase tracking-wider text-right text-xs font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm/50 text-sm">
              {paginatedRequests.map((request, index) => {
                const isSelected = selectedIds.includes(request.id);
                return (
                  <tr
                    key={request.id}
                    className={`${index % 2 === 1 ? 'bg-workflow-ivory/20' : ''} ${
                      isSelected ? 'bg-teal-command/10' : ''
                    } hover:bg-teal-command/[0.02] transition-colors group cursor-pointer`}
                    onClick={() => handleRowCheckboxChange(request.id, !isSelected)}
                  >
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="row-checkbox rounded border-border-warm text-teal-command focus:ring-teal-command cursor-pointer w-4 h-4"
                        checked={isSelected}
                        onChange={(e) => handleRowCheckboxChange(request.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-4 font-data-mono text-teal-command font-semibold">
                      RMS-{request.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 font-medium text-on-surface">{request.position}</td>
                    <td className="px-4 py-4 text-on-surface-variant">{request.department}</td>
                    <td className="px-4 py-4 text-center font-semibold">
                      {String(request.headcount).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold border ${getPriorityStyles(
                          request.urgency,
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            request.urgency === 'High' || request.urgency === 'Critical'
                              ? 'bg-rejected'
                              : request.urgency === 'Medium'
                                ? 'bg-revision'
                                : 'bg-slate-ink'
                          }`}
                        />
                        {request.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold border ${getStatusStyles(
                          request.status,
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(request.status)}`}
                        />
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-on-surface-variant text-[14px]">
                      {formatDisplayDate(request.submittedDate)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full ${request.assignColor} flex items-center justify-center text-[10px] font-bold text-on-surface-variant`}
                        >
                          {request.initials}
                        </div>
                        <span className="text-body-sm text-on-surface">{request.owner}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="p-1 text-outline-variant hover:text-teal-command transition-colors"
                        onClick={() => void openRequestDetail(request.id)}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-slate-ink">
                      search_off
                    </span>
                    No requests found matching the current search parameters and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-workflow-ivory flex items-center justify-between border-t border-border-warm text-sm">
          <span className="text-body-sm text-on-surface-variant">
            Showing{' '}
            <span className="font-bold text-on-surface">
              {filteredRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
              {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
            </span>{' '}
            of <span className="font-bold text-on-surface">{filteredRequests.length}</span> requests
          </span>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              // Show pages if totalPages is small, or show first, current, last with ellipsis
              const showPage =
                totalPages <= 5 ||
                idx === 0 ||
                idx === totalPages - 1 ||
                Math.abs(idx + 1 - currentPage) <= 1;

              if (!showPage) {
                if (idx === 1 || idx === totalPages - 2) {
                  return (
                    <span key={idx} className="text-outline-variant px-1 select-none">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={idx}
                  className={`w-8 h-8 rounded-lg font-bold text-sm transition ${
                    currentPage === idx + 1
                      ? 'bg-teal-command text-white'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              );
            })}
            <button
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-deep-charcoal text-on-primary-container px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-6 transition-all duration-300 transform ${
          selectedIds.length > 0
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        id="bulk-actions-bar"
      >
        <span className="font-label-md text-white font-medium text-sm">
          <span className="font-bold mr-1" id="selected-count">
            {selectedIds.length}
          </span>{' '}
          items selected
        </span>
        <div className="h-4 w-[1px] bg-outline-variant"></div>
        <button
          className="flex items-center gap-2 text-[#ccc5c2] hover:text-white transition-colors text-sm font-semibold"
          onClick={handleExportSelected}
        >
          <span className="material-symbols-outlined text-[20px]">ios_share</span>
          <span className="font-label-md">Export Selected</span>
        </button>
        <button
          className="flex items-center gap-2 text-[#ccc5c2] hover:text-white transition-colors text-sm font-semibold"
          onClick={handleAssignToHR}
        >
          <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
          <span className="font-label-md">Assign to HR</span>
        </button>
        <button
          className="ml-4 text-outline-variant hover:text-white flex items-center"
          onClick={clearSelection}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {(detailRequest || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <section className="w-full max-w-3xl rounded-lg border border-border-warm bg-clean-surface shadow-xl">
            <div className="flex items-start justify-between border-b border-border-warm px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-deep-charcoal">Request Detail</h2>
                <p className="text-sm text-slate-ink">
                  {detailLoading ? 'Loading request detail...' : detailRequest?.position}
                </p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-ink hover:bg-surface-container-low"
                onClick={() => setDetailRequest(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {detailLoading ? (
                <p className="text-sm text-slate-ink">Loading...</p>
              ) : (
                <>
                  <DetailItem label="Department" value={detailRequest?.department?.name ?? '-'} />
                  <DetailItem label="Requester" value={detailRequest?.requester?.displayName ?? '-'} />
                  <DetailItem label="Status" value={detailRequest?.status ?? '-'} />
                  <DetailItem label="Urgency" value={detailRequest?.urgency ?? '-'} />
                  <DetailItem label="Headcount" value={String(detailRequest?.headcount ?? '-')} />
                  <DetailItem label="Owner" value={detailRequest?.owner?.displayName ?? detailRequest?.reviewedBy?.displayName ?? 'Not assigned'} />
                  <div className="md:col-span-2">
                    <DetailItem label="Justification" value={detailRequest?.justification ?? '-'} />
                  </div>
                  <div className="md:col-span-2">
                    <DetailItem label="Job Description" value={detailRequest?.jobDescription ?? '-'} />
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </AdminDashboardPage>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-3">
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">{label}</p>
    <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
  </div>
);
