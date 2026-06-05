import React, { useMemo, useState } from 'react';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revision';
type Priority = 'High' | 'Medium' | 'Low';
type FilterKey = 'All' | ApprovalStatus;

interface ApprovalRequest {
  id: string;
  position: string;
  department: string;
  requestedBy: string;
  headcount: number;
  priority: Priority;
  submitted: string;
  status: ApprovalStatus;
  budget: string;
}

const initialRequests: ApprovalRequest[] = [
  {
    id: 'RMS-9421',
    position: 'Senior Developer',
    department: 'IT',
    requestedBy: 'Le Minh Khoa',
    headcount: 3,
    priority: 'High',
    submitted: 'May 28, 2026',
    status: 'Pending',
    budget: '$84k',
  },
  {
    id: 'RMS-9419',
    position: 'Marketing Lead',
    department: 'Marketing',
    requestedBy: 'Mai Thanh Linh',
    headcount: 1,
    priority: 'Medium',
    submitted: 'May 28, 2026',
    status: 'Pending',
    budget: '$62k',
  },
  {
    id: 'RMS-9418',
    position: 'UX Designer',
    department: 'Design',
    requestedBy: 'Tran Bao An',
    headcount: 2,
    priority: 'Medium',
    submitted: 'May 27, 2026',
    status: 'Revision',
    budget: '$48k',
  },
  {
    id: 'RMS-9415',
    position: 'HR Coordinator',
    department: 'HR',
    requestedBy: 'Pham Quynh Nhu',
    headcount: 1,
    priority: 'Low',
    submitted: 'May 27, 2026',
    status: 'Approved',
    budget: '$37k',
  },
  {
    id: 'RMS-9410',
    position: 'Cloud Architect',
    department: 'IT',
    requestedBy: 'Nguyen Duc Huy',
    headcount: 1,
    priority: 'High',
    submitted: 'May 26, 2026',
    status: 'Rejected',
    budget: '$112k',
  },
  {
    id: 'RMS-9407',
    position: 'Finance Analyst',
    department: 'Finance',
    requestedBy: 'Do Nhat Ha',
    headcount: 2,
    priority: 'Low',
    submitted: 'May 25, 2026',
    status: 'Pending',
    budget: '$45k',
  },
];

const filters: FilterKey[] = ['All', 'Pending', 'Approved', 'Rejected', 'Revision'];

const statusStyles: Record<ApprovalStatus, string> = {
  Pending: 'bg-pending/10 text-pending border-pending/20',
  Approved: 'bg-approved/10 text-approved border-approved/20',
  Rejected: 'bg-rejected/10 text-rejected border-rejected/20',
  Revision: 'bg-revision/10 text-revision border-revision/20',
};

const priorityStyles: Record<Priority, string> = {
  High: 'bg-rejected/10 text-rejected',
  Medium: 'bg-pending/10 text-pending',
  Low: 'bg-draft/10 text-draft',
};

const actionStyles: Record<'Approve' | 'Reject' | 'Revise', string> = {
  Approve: 'border-approved/30 bg-approved/10 text-approved hover:bg-approved hover:text-white',
  Reject: 'border-rejected/30 bg-rejected/10 text-rejected hover:bg-rejected hover:text-white',
  Revise: 'border-revision/30 bg-revision/10 text-revision hover:bg-revision hover:text-white',
};

const statusFromAction = {
  Approve: 'Approved',
  Reject: 'Rejected',
  Revise: 'Revision',
} as const;

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    reject: <path d="M18 6 6 18M6 6l12 12" />,
    revise: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
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

export const AdminApprovalQueue: React.FC = () => {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<FilterKey>('Pending');
  const [department, setDepartment] = useState('All');
  const [query, setQuery] = useState('');

  const departments = useMemo(() => ['All', ...Array.from(new Set(requests.map((request) => request.department)))], [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesFilter = filter === 'All' || request.status === filter;
      const matchesDepartment = department === 'All' || request.department === department;
      const matchesQuery =
        !normalizedQuery ||
        request.id.toLowerCase().includes(normalizedQuery) ||
        request.position.toLowerCase().includes(normalizedQuery) ||
        request.requestedBy.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesDepartment && matchesQuery;
    });
  }, [department, filter, query, requests]);

  const counts = useMemo(() => {
    return filters.reduce((acc, item) => {
      acc[item] = item === 'All' ? requests.length : requests.filter((request) => request.status === item).length;
      return acc;
    }, {} as Record<FilterKey, number>);
  }, [requests]);

  const updateStatus = (id: string, action: keyof typeof statusFromAction) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status: statusFromAction[action],
            }
          : request,
      ),
    );
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-teal-command">Admin approvals</p>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">Approval Queue</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-ink">
            Review pending recruitment requests forwarded by HR, then approve, reject, or return for revision.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:w-[420px]">
          {[
            ['Pending', counts.Pending],
            ['Approved', counts.Approved],
            ['Revision', counts.Revision],
          ].map(([label, value]) => (
            <div className="rounded-xl border border-border-warm bg-clean-surface px-4 py-3" key={label}>
              <p className="text-xs font-medium text-on-surface-variant">{label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-deep-charcoal">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-xl border border-border-warm bg-clean-surface p-4 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                  filter === item
                    ? 'border-teal-command bg-teal-command text-white'
                    : 'border-border-warm bg-workflow-ivory text-slate-ink hover:border-teal-command hover:text-teal-command'
                }`}
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {item}
                <span className={filter === item ? 'ml-2 text-white/80' : 'ml-2 text-slate-ink/70'}>{counts[item]}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-[240px]">
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
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-8 text-sm font-medium text-deep-charcoal outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
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
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead>
              <tr className="border-y border-border-warm bg-workflow-ivory text-xs font-semibold uppercase tracking-[0.04em] text-on-surface-variant">
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3 text-center">Headcount</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm text-sm">
              {filteredRequests.map((request) => (
                <tr className="transition hover:bg-workflow-ivory/70" key={request.id}>
                  <td className="px-4 py-4">
                    <p className="font-mono font-semibold text-teal-command">#{request.id}</p>
                    <p className="mt-1 text-xs text-slate-ink">{request.submitted}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-deep-charcoal">{request.position}</td>
                  <td className="px-4 py-4 text-slate-ink">{request.department}</td>
                  <td className="px-4 py-4 text-slate-ink">{request.requestedBy}</td>
                  <td className="px-4 py-4 text-center font-mono text-deep-charcoal">{request.headcount}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[request.priority]}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-deep-charcoal">{request.budget}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {(['Approve', 'Reject', 'Revise'] as const).map((action) => (
                        <button
                          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition active:scale-[0.98] ${actionStyles[action]}`}
                          key={action}
                          onClick={() => updateStatus(request.id, action)}
                          type="button"
                        >
                          <Icon className="h-3.5 w-3.5" name={action === 'Approve' ? 'check' : action === 'Reject' ? 'reject' : 'revise'} />
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center border-t border-border-warm py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-teal-command">
                <Icon name="filter" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-deep-charcoal">No approvals match these filters</h2>
              <p className="mt-2 max-w-md text-sm text-slate-ink">Clear the search or choose a different status to review more requests.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
