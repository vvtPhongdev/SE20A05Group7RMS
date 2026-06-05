import React, { useMemo, useState } from 'react';

type RequestStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Revision Needed' | 'Planning' | 'Screening' | 'Interviewing' | 'Closed' | 'Rejected';
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
}

const requests: RecruitmentRequest[] = [
  {
    id: 'RMS-9428',
    position: 'Platform Engineering Lead',
    department: 'IT',
    requester: 'Le Minh Khoa',
    owner: 'Hoang Minh Tri',
    status: 'Pending Review',
    urgency: 'Critical',
    submittedDate: '2026-05-29',
    targetDate: '2026-07-15',
    headcount: 1,
    budget: '$126k',
    location: 'Ho Chi Minh City',
    skills: ['Distributed systems', 'Team leadership', 'Cloud architecture'],
    notes: 'Replacement for a critical platform lead role tied to Q3 infrastructure delivery.',
    lastActivity: 'Submitted to admin queue 2 hours ago',
  },
  {
    id: 'RMS-9421',
    position: 'Senior Developer',
    department: 'IT',
    requester: 'Nguyen Duc Huy',
    owner: 'Pham Quynh Nhu',
    status: 'Approved',
    urgency: 'High',
    submittedDate: '2026-05-28',
    targetDate: '2026-07-01',
    headcount: 3,
    budget: '$84k',
    location: 'Da Nang',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    notes: 'Expansion headcount for product delivery team.',
    lastActivity: 'Approved by admin yesterday',
  },
  {
    id: 'RMS-9419',
    position: 'Marketing Lead',
    department: 'Marketing',
    requester: 'Mai Thanh Linh',
    owner: 'Tran Bao An',
    status: 'Planning',
    urgency: 'Medium',
    submittedDate: '2026-05-28',
    targetDate: '2026-07-10',
    headcount: 1,
    budget: '$62k',
    location: 'Hybrid',
    skills: ['Campaign strategy', 'Brand analytics', 'B2B hiring'],
    notes: 'Role approved, HR is preparing sourcing plan.',
    lastActivity: 'Plan draft created this morning',
  },
  {
    id: 'RMS-9418',
    position: 'UX Designer',
    department: 'Design',
    requester: 'Tran Bao An',
    owner: 'Mai Thanh Linh',
    status: 'Revision Needed',
    urgency: 'Medium',
    submittedDate: '2026-05-27',
    targetDate: '2026-06-28',
    headcount: 2,
    budget: '$48k',
    location: 'Ho Chi Minh City',
    skills: ['Design systems', 'Research synthesis', 'Figma'],
    notes: 'Admin requested clearer seniority split between the two openings.',
    lastActivity: 'Revision requested 1 day ago',
  },
  {
    id: 'RMS-9415',
    position: 'HR Coordinator',
    department: 'HR',
    requester: 'Pham Quynh Nhu',
    owner: 'Do Nhat Ha',
    status: 'Screening',
    urgency: 'Low',
    submittedDate: '2026-05-23',
    targetDate: '2026-06-20',
    headcount: 1,
    budget: '$37k',
    location: 'Hanoi',
    skills: ['Scheduling', 'HR operations', 'Candidate communication'],
    notes: 'Candidate pool imported and screening is underway.',
    lastActivity: '12 CVs screened today',
  },
  {
    id: 'RMS-9410',
    position: 'Cloud Architect',
    department: 'IT',
    requester: 'Nguyen Duc Huy',
    owner: 'Hoang Minh Tri',
    status: 'Rejected',
    urgency: 'High',
    submittedDate: '2026-05-21',
    targetDate: '2026-08-01',
    headcount: 1,
    budget: '$112k',
    location: 'Remote',
    skills: ['AWS', 'Security architecture', 'Terraform'],
    notes: 'Rejected pending budget reallocation in Q3 plan.',
    lastActivity: 'Rejected by admin 5 days ago',
  },
  {
    id: 'RMS-9407',
    position: 'Finance Analyst',
    department: 'Finance',
    requester: 'Do Nhat Ha',
    owner: 'Le Minh Khoa',
    status: 'Interviewing',
    urgency: 'Low',
    submittedDate: '2026-05-18',
    targetDate: '2026-06-30',
    headcount: 2,
    budget: '$45k',
    location: 'Ho Chi Minh City',
    skills: ['Financial modeling', 'Excel', 'Budget reporting'],
    notes: 'Panel interviews scheduled with finance leadership.',
    lastActivity: 'Interview panel confirmed',
  },
  {
    id: 'RMS-9398',
    position: 'Customer Success Manager',
    department: 'Customer Success',
    requester: 'Vu Khanh Linh',
    owner: 'Pham Quynh Nhu',
    status: 'Closed',
    urgency: 'Medium',
    submittedDate: '2026-05-05',
    targetDate: '2026-06-15',
    headcount: 1,
    budget: '$58k',
    location: 'Hybrid',
    skills: ['Enterprise accounts', 'Renewals', 'Stakeholder management'],
    notes: 'Offer accepted and request closed.',
    lastActivity: 'Candidate accepted offer',
  },
];

const statusStyles: Record<RequestStatus, string> = {
  Draft: 'bg-draft/10 text-draft border-draft/20',
  'Pending Review': 'bg-pending/10 text-pending border-pending/20',
  Approved: 'bg-approved/10 text-approved border-approved/20',
  'Revision Needed': 'bg-revision/10 text-revision border-revision/20',
  Planning: 'bg-primary-container/10 text-primary border-primary/20',
  Screening: 'bg-teal-command/10 text-teal-command border-teal-command/20',
  Interviewing: 'bg-pending/10 text-pending border-pending/20',
  Closed: 'bg-approved/10 text-approved border-approved/20',
  Rejected: 'bg-rejected/10 text-rejected border-rejected/20',
};

const urgencyStyles: Record<Urgency, string> = {
  Critical: 'bg-rejected text-white',
  High: 'bg-rejected/10 text-rejected',
  Medium: 'bg-pending/10 text-pending',
  Low: 'bg-draft/10 text-draft',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    calendar: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6" />,
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

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
};

export const AdminAllRequests: React.FC = () => {
  const [status, setStatus] = useState<RequestStatus | 'All'>('All');
  const [department, setDepartment] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(requests[0]?.id ?? null);

  const departments = useMemo(() => ['All', ...Array.from(new Set(requests.map((request) => request.department)))], []);
  const statuses = useMemo(() => ['All', ...Array.from(new Set(requests.map((request) => request.status)))] as Array<RequestStatus | 'All'>, []);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return requests.filter((request) => {
      const submitted = new Date(`${request.submittedDate}T12:00:00`);
      const matchesStatus = status === 'All' || request.status === status;
      const matchesDepartment = department === 'All' || request.department === department;
      const matchesFrom = !from || submitted >= from;
      const matchesTo = !to || submitted <= to;
      const matchesQuery =
        !normalizedQuery ||
        request.id.toLowerCase().includes(normalizedQuery) ||
        request.position.toLowerCase().includes(normalizedQuery) ||
        request.requester.toLowerCase().includes(normalizedQuery) ||
        request.owner.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesDepartment && matchesFrom && matchesTo && matchesQuery;
    });
  }, [dateFrom, dateTo, department, query, status]);

  const clearFilters = () => {
    setStatus('All');
    setDepartment('All');
    setDateFrom('');
    setDateTo('');
    setQuery('');
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-teal-command">Admin oversight</p>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">All Requests</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-ink">
            Browse every recruitment request across departments, filter by lifecycle state, and inspect request details inline.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:w-[460px]">
          {[
            ['Total', requests.length],
            ['Active', requests.filter((request) => !['Closed', 'Rejected'].includes(request.status)).length],
            ['Closed', requests.filter((request) => request.status === 'Closed').length],
          ].map(([label, value]) => (
            <div className="rounded-xl border border-border-warm bg-clean-surface px-4 py-3" key={label}>
              <p className="text-xs font-medium text-on-surface-variant">{label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-deep-charcoal">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-xl border border-border-warm bg-clean-surface p-4 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_180px_160px_160px_auto]">
          <label className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              <Icon className="h-4 w-4" name="search" />
            </span>
            <input
              className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              placeholder="Search request, role, requester"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              <Icon className="h-4 w-4" name="filter" />
            </span>
            <select
              className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-8 text-sm font-medium text-deep-charcoal outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              value={status}
              onChange={(event) => setStatus(event.target.value as RequestStatus | 'All')}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === 'All' ? 'All statuses' : item}
                </option>
              ))}
            </select>
          </label>

          <label className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              <Icon className="h-4 w-4" name="filter" />
            </span>
            <select
              className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-8 text-sm font-medium text-deep-charcoal outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item === 'All' ? 'All departments' : item}
                </option>
              ))}
            </select>
          </label>

          <label className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              <Icon className="h-4 w-4" name="calendar" />
            </span>
            <input
              className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              <Icon className="h-4 w-4" name="calendar" />
            </span>
            <input
              className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          <button
            className="h-10 rounded-lg border border-border-warm bg-white px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
            onClick={clearFilters}
            type="button"
          >
            Clear
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead>
              <tr className="border-y border-border-warm bg-workflow-ivory text-xs font-semibold uppercase tracking-[0.04em] text-on-surface-variant">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-center">Headcount</th>
                <th className="px-4 py-3 text-right">Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm text-sm">
              {filteredRequests.map((request) => {
                const isExpanded = expandedId === request.id;

                return (
                  <React.Fragment key={request.id}>
                    <tr className="transition hover:bg-workflow-ivory/70">
                      <td className="px-4 py-4">
                        <button
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${request.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-warm bg-white text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                          onClick={() => setExpandedId(isExpanded ? null : request.id)}
                          type="button"
                        >
                          <Icon className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`} name="chevron" />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono font-semibold text-teal-command">#{request.id}</p>
                        <p className="mt-1 text-xs text-slate-ink">{request.lastActivity}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-deep-charcoal">{request.position}</td>
                      <td className="px-4 py-4 text-slate-ink">{request.department}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${urgencyStyles[request.urgency]}`}>
                          {request.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-ink">{formatDate(request.submittedDate)}</td>
                      <td className="px-4 py-4 text-center font-mono text-deep-charcoal">{request.headcount}</td>
                      <td className="px-4 py-4 text-right font-mono text-deep-charcoal">{request.budget}</td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td className="bg-workflow-ivory/70 px-4 py-5" colSpan={9}>
                          <div className="grid grid-cols-1 gap-5 rounded-xl border border-border-warm bg-clean-surface p-5 lg:grid-cols-[1.2fr_0.8fr]">
                            <div>
                              <div className="mb-3 flex items-center gap-2 text-teal-command">
                                <Icon className="h-5 w-5" name="file" />
                                <h2 className="text-base font-semibold text-deep-charcoal">Request detail</h2>
                              </div>
                              <p className="text-sm leading-6 text-slate-ink">{request.notes}</p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {request.skills.map((skill) => (
                                  <span className="rounded-full border border-border-warm bg-workflow-ivory px-3 py-1 text-xs font-semibold text-slate-ink" key={skill}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.04em] text-on-surface-variant">Requester</p>
                                <p className="mt-1 font-semibold text-deep-charcoal">{request.requester}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.04em] text-on-surface-variant">HR Owner</p>
                                <p className="mt-1 font-semibold text-deep-charcoal">{request.owner}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.04em] text-on-surface-variant">Target Date</p>
                                <p className="mt-1 font-semibold text-deep-charcoal">{formatDate(request.targetDate)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.04em] text-on-surface-variant">Location</p>
                                <p className="mt-1 font-semibold text-deep-charcoal">{request.location}</p>
                              </div>
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

          {filteredRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center border-t border-border-warm py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-teal-command">
                <Icon name="filter" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-deep-charcoal">No requests match these filters</h2>
              <p className="mt-2 max-w-md text-sm text-slate-ink">Adjust the status, department, date range, or search term to widen the request list.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
