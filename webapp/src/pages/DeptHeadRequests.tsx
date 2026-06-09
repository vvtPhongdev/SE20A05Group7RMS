import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecruitmentRequestStatus } from '@wr/contracts';

type RequestStatus =
  | RecruitmentRequestStatus.DRAFT
  | RecruitmentRequestStatus.PENDING_REVIEW
  | RecruitmentRequestStatus.APPROVED
  | RecruitmentRequestStatus.REJECTED
  | RecruitmentRequestStatus.REVISION_NEEDED
  | RecruitmentRequestStatus.PLANNING
  | RecruitmentRequestStatus.PLAN_APPROVED
  | RecruitmentRequestStatus.SCREENING
  | RecruitmentRequestStatus.INTERVIEWING
  | RecruitmentRequestStatus.INTERVIEW_COMPLETED
  | RecruitmentRequestStatus.OFFER_EXTENDED
  | RecruitmentRequestStatus.OFFER_ACCEPTED
  | RecruitmentRequestStatus.CLOSED;

type SortKey = 'updated' | 'due' | 'headcount' | 'status';
type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';

interface DeptRequest {
  id: string;
  position: string;
  team: string;
  status: RequestStatus;
  urgency: Urgency;
  headcount: number;
  filled: number;
  submitted: string;
  updated: string;
  due: string;
  owner: string;
  reason: string;
  plan: string;
}

const statusOrder: RequestStatus[] = [
  RecruitmentRequestStatus.DRAFT,
  RecruitmentRequestStatus.PENDING_REVIEW,
  RecruitmentRequestStatus.APPROVED,
  RecruitmentRequestStatus.REJECTED,
  RecruitmentRequestStatus.REVISION_NEEDED,
  RecruitmentRequestStatus.PLANNING,
  RecruitmentRequestStatus.PLAN_APPROVED,
  RecruitmentRequestStatus.SCREENING,
  RecruitmentRequestStatus.INTERVIEWING,
  RecruitmentRequestStatus.INTERVIEW_COMPLETED,
  RecruitmentRequestStatus.OFFER_EXTENDED,
  RecruitmentRequestStatus.OFFER_ACCEPTED,
  RecruitmentRequestStatus.CLOSED,
];

const requests: DeptRequest[] = [
  {
    id: 'REQ-2026-001',
    position: 'Senior Backend Engineer',
    team: 'Platform',
    status: RecruitmentRequestStatus.DRAFT,
    urgency: 'Medium',
    headcount: 2,
    filled: 0,
    submitted: 'Jun 01, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 28, 2026',
    owner: 'Linh Tran',
    reason: 'Backfill for API ownership and service migration support.',
    plan: 'Drafting competency matrix before submission.',
  },
  {
    id: 'REQ-2026-002',
    position: 'DevOps Engineer',
    team: 'Infrastructure',
    status: RecruitmentRequestStatus.PENDING_REVIEW,
    urgency: 'Critical',
    headcount: 2,
    filled: 0,
    submitted: 'Jun 02, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 18, 2026',
    owner: 'Khoa Pham',
    reason: 'Coverage gap in release automation and on-call rotation.',
    plan: 'Admin review pending budget clarification.',
  },
  {
    id: 'REQ-2026-003',
    position: 'Product Designer',
    team: 'Experience',
    status: RecruitmentRequestStatus.APPROVED,
    urgency: 'Medium',
    headcount: 1,
    filled: 0,
    submitted: 'May 28, 2026',
    updated: 'Jun 07, 2026',
    due: 'Jul 05, 2026',
    owner: 'Minh Dao',
    reason: 'Support applicant portal redesign and usability testing.',
    plan: 'Ready for HR planning kickoff.',
  },
  {
    id: 'REQ-2026-004',
    position: 'Junior QA Analyst',
    team: 'Quality',
    status: RecruitmentRequestStatus.REJECTED,
    urgency: 'Low',
    headcount: 1,
    filled: 0,
    submitted: 'May 22, 2026',
    updated: 'Jun 03, 2026',
    due: 'Jul 12, 2026',
    owner: 'An Hoang',
    reason: 'Manual regression workload during release hardening.',
    plan: 'Rejected because temporary contractor coverage was approved instead.',
  },
  {
    id: 'REQ-2026-005',
    position: 'Data Analyst',
    team: 'Business Intelligence',
    status: RecruitmentRequestStatus.REVISION_NEEDED,
    urgency: 'High',
    headcount: 3,
    filled: 0,
    submitted: 'May 24, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 30, 2026',
    owner: 'Bao Nguyen',
    reason: 'Analytics backlog for reporting and forecast quality.',
    plan: 'Needs stronger business impact and phased headcount rationale.',
  },
  {
    id: 'REQ-2026-006',
    position: 'Cloud Security Specialist',
    team: 'Infrastructure',
    status: RecruitmentRequestStatus.PLANNING,
    urgency: 'High',
    headcount: 1,
    filled: 0,
    submitted: 'May 20, 2026',
    updated: 'Jun 06, 2026',
    due: 'Jul 01, 2026',
    owner: 'Tuan Le',
    reason: 'Security review coverage for cloud migration phases.',
    plan: 'HR is drafting sourcing channels and screening criteria.',
  },
  {
    id: 'REQ-2026-007',
    position: 'Frontend Engineer',
    team: 'Experience',
    status: RecruitmentRequestStatus.PLAN_APPROVED,
    urgency: 'Medium',
    headcount: 2,
    filled: 0,
    submitted: 'May 18, 2026',
    updated: 'Jun 05, 2026',
    due: 'Jul 10, 2026',
    owner: 'Mai Phan',
    reason: 'Product surface expansion and accessibility remediation.',
    plan: 'Plan approved. Job posting can be opened.',
  },
  {
    id: 'REQ-2026-008',
    position: 'Integration Engineer',
    team: 'Platform',
    status: RecruitmentRequestStatus.SCREENING,
    urgency: 'High',
    headcount: 2,
    filled: 0,
    submitted: 'May 15, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 26, 2026',
    owner: 'Hanh Vo',
    reason: 'Reduce partner integration delivery bottlenecks.',
    plan: 'CV screening underway with HR shortlist due this week.',
  },
  {
    id: 'REQ-2026-009',
    position: 'Systems Analyst',
    team: 'Business Intelligence',
    status: RecruitmentRequestStatus.INTERVIEWING,
    urgency: 'Medium',
    headcount: 1,
    filled: 0,
    submitted: 'May 10, 2026',
    updated: 'Jun 07, 2026',
    due: 'Jun 24, 2026',
    owner: 'Nhi Bui',
    reason: 'Requirements analysis for internal operations suite.',
    plan: 'Panel interviews scheduled with two finalists.',
  },
  {
    id: 'REQ-2026-010',
    position: 'QA Automation Engineer',
    team: 'Quality',
    status: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
    urgency: 'Medium',
    headcount: 1,
    filled: 0,
    submitted: 'May 04, 2026',
    updated: 'Jun 06, 2026',
    due: 'Jun 20, 2026',
    owner: 'Quyen Lam',
    reason: 'Automation coverage for regression suites and release checks.',
    plan: 'Interview feedback complete. Hiring decision pending.',
  },
  {
    id: 'REQ-2026-011',
    position: 'Technical Lead',
    team: 'Platform',
    status: RecruitmentRequestStatus.OFFER_EXTENDED,
    urgency: 'Critical',
    headcount: 1,
    filled: 0,
    submitted: 'Apr 26, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 16, 2026',
    owner: 'Duc Truong',
    reason: 'Leadership coverage for cross-service architecture decisions.',
    plan: 'Offer sent. Awaiting candidate response.',
  },
  {
    id: 'REQ-2026-012',
    position: 'Product Manager',
    team: 'Product Strategy',
    status: RecruitmentRequestStatus.OFFER_ACCEPTED,
    urgency: 'High',
    headcount: 1,
    filled: 1,
    submitted: 'Apr 18, 2026',
    updated: 'Jun 04, 2026',
    due: 'Jun 15, 2026',
    owner: 'Thao Nguyen',
    reason: 'Own roadmap alignment for recruitment workflow modules.',
    plan: 'Offer accepted. Onboarding documents in progress.',
  },
  {
    id: 'REQ-2026-013',
    position: 'Database Administrator',
    team: 'Infrastructure',
    status: RecruitmentRequestStatus.CLOSED,
    urgency: 'Medium',
    headcount: 1,
    filled: 1,
    submitted: 'Apr 01, 2026',
    updated: 'May 29, 2026',
    due: 'Jun 01, 2026',
    owner: 'Long Pham',
    reason: 'Operational database support and backup ownership.',
    plan: 'Closed after successful hire and onboarding handoff.',
  },
];

const statusStyles: Record<RequestStatus, string> = {
  [RecruitmentRequestStatus.DRAFT]: 'border-stone-200 bg-stone-100 text-draft',
  [RecruitmentRequestStatus.PENDING_REVIEW]: 'border-cyan-200 bg-cyan-50 text-pending',
  [RecruitmentRequestStatus.APPROVED]: 'border-green-200 bg-green-50 text-approved',
  [RecruitmentRequestStatus.REJECTED]: 'border-red-200 bg-red-50 text-rejected',
  [RecruitmentRequestStatus.REVISION_NEEDED]: 'border-amber-200 bg-amber-50 text-revision',
  [RecruitmentRequestStatus.PLANNING]: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
  [RecruitmentRequestStatus.PLAN_APPROVED]: 'border-green-200 bg-green-50 text-approved',
  [RecruitmentRequestStatus.SCREENING]: 'border-cyan-200 bg-cyan-50 text-pending',
  [RecruitmentRequestStatus.INTERVIEWING]: 'border-amber-200 bg-amber-50 text-revision',
  [RecruitmentRequestStatus.INTERVIEW_COMPLETED]: 'border-stone-300 bg-stone-100 text-slate-ink',
  [RecruitmentRequestStatus.OFFER_EXTENDED]: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
  [RecruitmentRequestStatus.OFFER_ACCEPTED]: 'border-green-200 bg-green-50 text-approved',
  [RecruitmentRequestStatus.CLOSED]: 'border-stone-300 bg-stone-100 text-slate-ink',
};

const urgencyStyles: Record<Urgency, string> = {
  Critical: 'text-rejected',
  High: 'text-revision',
  Medium: 'text-slate-ink',
  Low: 'text-on-surface-variant',
};

const formatStatus = (status: RequestStatus) =>
  status
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
    search: <path d="M11 19a8 8 0 1 1 5.66-2.34L21 21m-4.34-4.34L21 21" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    empty: <path d="M4 7h16v12H4zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 6h4" />,
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
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<RequestStatus | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [expandedId, setExpandedId] = useState(requests[0]?.id ?? '');

  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests
      .filter((request) => {
        const matchesStatus = status === 'All' || request.status === status;
        const matchesQuery =
          !normalizedQuery ||
          [request.id, request.position, request.team, request.owner, request.reason, request.plan].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );

        return matchesStatus && matchesQuery;
      })
      .sort((left, right) => {
        if (sortKey === 'status') return statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status);
        if (sortKey === 'headcount') return right.headcount - left.headcount;

        const leftDate = new Date(sortKey === 'due' ? left.due : left.updated).getTime();
        const rightDate = new Date(sortKey === 'due' ? right.due : right.updated).getTime();
        return rightDate - leftDate;
      });
  }, [query, sortKey, status]);

  const activeCount = requests.filter((request) => ![RecruitmentRequestStatus.REJECTED, RecruitmentRequestStatus.CLOSED].includes(request.status)).length;
  const openHeadcount = requests.reduce((total, request) => total + request.headcount - request.filled, 0);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">Department Head Workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">My Requests</h1>
          <p className="mt-1 max-w-[68ch] text-sm leading-6 text-slate-ink">
            Track department requests through the 13-state workflow, filter by lifecycle status, and inspect request details inline.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
            onClick={() => navigate('/dept-head')}
            type="button"
          >
            <Icon className="h-4 w-4" name="arrowLeft" />
            Dashboard
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
            onClick={() => navigate('/dept-head/create-request')}
            type="button"
          >
            <Icon className="h-4 w-4" name="plus" />
            New Request
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3" aria-label="Request list summary">
        {[
          ['Total requests', requests.length],
          ['Active workflow', activeCount],
          ['Open headcount', openHeadcount],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]" key={label}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
            <p className="mt-3 font-mono text-[30px] font-semibold leading-none text-deep-charcoal">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
        <div className="border-b border-border-warm p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <label className="relative">
              <span className="sr-only">Search requests</span>
              <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" name="search" />
              <input
                className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-9 pr-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by role, owner, team, request ID..."
                type="search"
                value={query}
              />
            </label>

            <select
              className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
              onChange={(event) => setStatus(event.target.value as RequestStatus | 'All')}
              value={status}
            >
              <option value="All">All 13 states</option>
              {statusOrder.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              value={sortKey}
            >
              <option value="updated">Sort: Recently updated</option>
              <option value="due">Sort: Due date</option>
              <option value="headcount">Sort: Headcount</option>
              <option value="status">Sort: Workflow state</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-border-warm bg-parchment-lift text-sm text-on-surface-variant">
                <th className="px-5 py-4 font-semibold">Request</th>
                <th className="px-5 py-4 font-semibold">Team</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Urgency</th>
                <th className="px-5 py-4 font-semibold">Headcount</th>
                <th className="px-5 py-4 font-semibold">Updated</th>
                <th className="px-5 py-4 text-right font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm">
              {visibleRequests.map((request) => {
                const expanded = expandedId === request.id;

                return (
                  <React.Fragment key={request.id}>
                    <tr
                      className={`cursor-pointer transition hover:bg-workflow-ivory/70 ${expanded ? 'bg-workflow-ivory/60' : ''}`}
                      onClick={() => setExpandedId(expanded ? '' : request.id)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-deep-charcoal">{request.position}</p>
                        <p className="mt-1 font-mono text-xs text-teal-command">{request.id}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-ink">{request.team}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[request.status]}`}>
                          {formatStatus(request.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase ${urgencyStyles[request.urgency]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {request.urgency}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-deep-charcoal">
                        {request.filled}/{request.headcount}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-ink">{request.updated}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          aria-expanded={expanded}
                          className="inline-flex items-center justify-end gap-2 text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                          type="button"
                        >
                          {expanded ? 'Hide' : 'View'}
                          <Icon className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} name="chevron" />
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td className="bg-workflow-ivory/40 px-5 py-5" colSpan={7}>
                          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Justification</p>
                              <p className="mt-2 text-sm leading-6 text-deep-charcoal">{request.reason}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Current plan</p>
                              <p className="mt-2 text-sm leading-6 text-deep-charcoal">{request.plan}</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
                              {[
                                ['Submitted', request.submitted],
                                ['Due', request.due],
                                ['Owner', request.owner],
                              ].map(([label, value]) => (
                                <div className="rounded-lg border border-border-warm bg-clean-surface p-3" key={label}>
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
                                  <p className="mt-2 text-sm font-semibold text-deep-charcoal">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 border-t border-border-warm px-6 py-12 text-center">
            <div className="rounded-xl bg-surface-container p-3 text-teal-command">
              <Icon className="h-6 w-6" name="empty" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-deep-charcoal">No matching requests</h2>
              <p className="mt-1 text-sm text-slate-ink">Adjust the search or choose a different lifecycle state.</p>
            </div>
          </div>
        )}

        <div className="border-t border-border-warm bg-parchment-lift/60 px-5 py-4 text-sm text-slate-ink">
          Showing {visibleRequests.length} of {requests.length} department requests
        </div>
      </section>
    </div>
  );
};
